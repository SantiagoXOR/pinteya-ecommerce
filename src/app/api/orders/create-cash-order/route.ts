export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/integrations/supabase/server';
import { auth } from '@/lib/auth/config';
import { z } from 'zod';
import { logger, LogCategory } from '@/lib/enterprise/logger';
import { createRateLimiter } from '@/lib/rate-limiting/rate-limiter';
import { metricsCollector } from '@/lib/enterprise/metrics';
import crypto from 'crypto';
import { normalizeWhatsAppPhoneNumber } from '@/lib/integrations/whatsapp/whatsapp-link-service';
import { sanitizeForWhatsApp, EMOJIS } from '@/lib/integrations/whatsapp/whatsapp-utils';

// Tipo para productos desde la base de datos
interface ProductFromDB {
  id: string;
  name: string;
  price: number;
  discounted_price?: number | null;
  stock: number;
  color?: string | null;
  medida?: string | null;
  brand?: string | null;
  description?: string | null;
  aikon_id?: string | null;
  product_variants?: Array<{
    id: string;
    color_name: string;
    measure: string;
    price_sale: number;
    price_list: number;
    finish?: string | null;
    stock: number;
  }>;
}

// Schema de validación para la orden de pago contra entrega (CASH ON DELIVERY)
const CreateCashOrderSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    quantity: z.number().min(1),
    unit_price: z.number().min(0),
    // 🔧 AGREGAR: Campos opcionales para información de variante
    variant_id: z.string().optional(),
    variant_color: z.string().optional(),
    variant_finish: z.string().optional(),
  })),
  payer: z.object({
    name: z.string().min(1),
    surname: z.string().min(1),
    email: z.string().email(),
    phone: z.object({
      area_code: z.string(),
      number: z.string()
    }),
    identification: z.object({
      type: z.string(),
      number: z.string()
    }).optional()
  }),
  shipments: z.object({
    // ✅ Nuevo: costo de envío enviado desde el frontend
    cost: z.number().optional(),
    receiver_address: z.object({
      zip_code: z.string(),
      state_name: z.string(),
      city_name: z.string(),
      street_name: z.string(),
      street_number: z.string(),
      // ✅ AGREGAR: Campos opcionales para piso/depto y observaciones
      apartment: z.string().optional(),
      observations: z.string().optional(),
    })
  }),
  external_reference: z.string().optional()
});

// Función helper para calcular precio final del producto
function calculateFinalPrice(product: ProductFromDB): number {
  // Si hay precio con descuento, usarlo directamente
  if (product.discounted_price && product.discounted_price > 0) {
    return product.discounted_price;
  }
  return product.price;
}

// Función para generar mensaje de WhatsApp
function generateWhatsAppMessage(orderData: any): string {
  const { order, items } = orderData;

  const lines: string[] = [
    `¡Hola! He realizado un pedido con pago contra entrega`,
    '',
    `${EMOJIS.receipt} *Orden #${order.id}*`,
    `${EMOJIS.bullet} Cliente: ${order.payer_name} ${order.payer_surname}`,
    `${EMOJIS.bullet} Email: ${EMOJIS.email} ${order.payer_email}`,
    `${EMOJIS.bullet} Teléfono: ${EMOJIS.phone} ${order.payer_phone}`,
    '',
    `🛍️ *Productos:*`,
  ];

  items.forEach((item: any, index: number) => {
    lines.push(`${index + 1}. ${item.product_name} x${item.quantity} - $${item.unit_price.toFixed(2)}`);
  });

  lines.push('', `${EMOJIS.money} *Total: $${order.total_amount.toFixed(2)}*`, '');
  lines.push(`🏠 *Dirección de entrega:*`);
  lines.push(`${order.shipping_street_name} ${order.shipping_street_number}`);
  lines.push(`${order.shipping_city_name}, ${order.shipping_state_name}`);
  lines.push(`CP: ${order.shipping_zip_code}`);
  lines.push('');
  lines.push(`💳 *Método de pago:* Pago contra entrega`);
  lines.push(`${EMOJIS.calendar} *Fecha del pedido:* ${new Date(order.created_at).toLocaleDateString('es-AR')}`);
  lines.push('');
  lines.push(`${EMOJIS.check} Gracias por tu compra. Nuestro equipo te contactará en las próximas horas.`);

  const message = sanitizeForWhatsApp(lines.join('\n'));
  return encodeURIComponent(message);
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Rate limiting
    const rateLimiter = createRateLimiter({ maxRequests: 10, windowMs: 60 * 1000 });
    const rateLimitResult = await rateLimiter(request);
    if (!rateLimitResult.allowed) {
      logger.warn(LogCategory.API, 'Rate limit exceeded for create-cash-order', {
        limit: rateLimitResult.limit,
        remaining: rateLimitResult.remaining
      });
      return NextResponse.json(
        { success: false, data: null, error: 'Demasiadas solicitudes. Intenta nuevamente en unos minutos.' },
        { status: 429 }
      );
    }

    // Validar datos de entrada
    const body = await request.json();
    const validatedData = CreateCashOrderSchema.parse(body);

    // 🔍 DEBUG CRÍTICO: Verificar items recibidos en la API
    console.log('🛒 create-cash-order: Items recibidos en la API:', validatedData.items.map((item: any) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity
    })));

    logger.info(LogCategory.ORDER, 'Creating cash order', {
      itemsCount: validatedData.items.length,
      payerEmail: validatedData.payer.email
    });

    // Obtener usuario autenticado o crear usuario temporal
    const session = await auth();
    const supabase = createAdminClient();
    
    let userId: string;
    
    if (session?.user?.id) {
      userId = session.user.id;
      logger.info(LogCategory.AUTH, 'Using authenticated user', { userId });
    } else {
      // Crear usuario temporal para checkout sin autenticación
      const tempUserEmail = validatedData.payer.email;
      const tempUserName = `${validatedData.payer.name} ${validatedData.payer.surname}`;
      
      const { data: existingUser } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', tempUserEmail)
        .eq('is_active', true)
        .single();

      if (existingUser) {
        userId = existingUser.id;
        logger.info(LogCategory.USER, 'Using existing temp user', { userId, email: tempUserEmail });
      } else {
        const tempUserId = crypto.randomUUID();
        const { data: newUser, error: userError } = await supabase
          .from('user_profiles')
          .insert({
            id: tempUserId,
            email: tempUserEmail,
            first_name: validatedData.payer.name,
            last_name: validatedData.payer.surname,
            is_active: true,
            metadata: {
              temporary: true,
              source: 'cash_order',
              created_via: 'api/orders/create-cash-order'
            }
          })
          .select('id')
          .single();

        if (userError || !newUser) {
          logger.error(LogCategory.USER, 'Error creating temporary user', userError || undefined);
          throw new Error('Error al crear usuario temporal');
        }

        userId = newUser.id;
        logger.info(LogCategory.USER, 'Created new temp user', { userId, email: tempUserEmail });
      }
    }

    // Obtener detalles de productos y validar stock
    // 🔧 FIX: Convertir IDs a números para match con la BD
    const productIds = validatedData.items.map(item => {
      const numId = parseInt(item.id, 10);
      if (isNaN(numId)) {
        throw new Error(`ID de producto inválido: ${item.id}`);
      }
      return numId;
    });
    console.log('🔍 Buscando productos con IDs (numéricos):', productIds);
    console.log('🔍 Items que se están buscando:', validatedData.items.map((item: any) => ({
      id: item.id,
      idNumerico: parseInt(item.id, 10),
      name: item.name,
      price: item.price
    })));
    
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        id, name, price, discounted_price, stock, color, medida, brand, description, aikon_id, images,
        product_variants (
          id, color_name, measure, price_sale, price_list, finish, stock, image_url
        )
      `)
      .in('id', productIds) as { data: ProductFromDB[] | null; error: any };

    console.log('📦 Productos encontrados en BD:', products);
    console.log('❌ Error en consulta:', productsError);

    if (productsError || !products) {
      logger.error(LogCategory.API, 'Error fetching products', productsError || undefined);
      throw new Error('Error al obtener información de productos');
    }

    // Obtener imágenes de productos desde product_images
    const { data: productImages } = await supabase
      .from('product_images')
      .select('product_id, url, is_primary')
      .in('product_id', productIds)
      .order('is_primary', { ascending: false })
      .order('display_order', { ascending: true })

    // Agrupar imágenes por product_id
    const imagesByProductId = (productImages || []).reduce((acc: any, img: any) => {
      if (!acc[img.product_id]) {
        acc[img.product_id] = []
      }
      acc[img.product_id].push(img)
      return acc
    }, {})

    // Validar que todos los productos existen y tienen stock suficiente
    for (const item of validatedData.items) {
      console.log(`🔎 Buscando producto ${item.id} (tipo: ${typeof item.id})`);
      const product = products.find(p => {
        console.log(`   Comparando con producto ${p.id} (tipo: ${typeof p.id})`);
        return p.id.toString() === item.id.toString();
      });
      if (!product) {
        console.log(`❌ Producto ${item.id} no encontrado en:`, products.map(p => ({ id: p.id, type: typeof p.id })));
        throw new Error(`Producto ${item.id} no encontrado`);
      }

      // Si el item tiene variant_id, validar stock de la variante
      if (item.variant_id) {
        const variantId = item.variant_id.toString();
        const variant = product.product_variants?.find(v => v.id.toString() === variantId);
        
        if (!variant) {
          console.log(`❌ Variante ${item.variant_id} no encontrada para producto ${product.name}`);
          throw new Error(`Variante ${item.variant_id} no encontrada para ${product.name}`);
        }

        if (variant.stock < item.quantity) {
          console.log(`❌ Stock insuficiente para variante ${item.variant_id} de ${product.name}. Disponible: ${variant.stock}, solicitado: ${item.quantity}`);
          throw new Error(`Stock insuficiente para ${product.name}. Disponible: ${variant.stock}, solicitado: ${item.quantity}`);
        }
      } else {
        // Si no tiene variant_id, validar stock del producto padre
        if (product.stock < item.quantity) {
          console.log(`❌ Stock insuficiente para producto ${product.name}. Disponible: ${product.stock}, solicitado: ${item.quantity}`);
          throw new Error(`Stock insuficiente para ${product.name}. Disponible: ${product.stock}, solicitado: ${item.quantity}`);
        }
      }
    }

    // Calcular total e inicializar items para order_items usando la columna efectiva 'price'
    let itemsSubtotal = 0;
    const orderItems = validatedData.items.map(item => {
      const product = products.find(p => p.id.toString() === item.id.toString())!;
      
      // Si el item tiene variant_id, usar precio de la variante
      let finalPrice: number;
      if (item.variant_id && product.product_variants) {
        const variant = product.product_variants.find((v: any) => v.id.toString() === item.variant_id?.toString());
        if (variant) {
          // Priorizar price_sale si existe, sino usar price_list
          finalPrice = variant.price_sale && variant.price_sale > 0 ? variant.price_sale : variant.price_list;
        } else {
          // Fallback al precio del producto si no se encuentra la variante
          finalPrice = calculateFinalPrice(product);
        }
      } else {
        // Si no tiene variant_id, usar precio del producto padre
        finalPrice = calculateFinalPrice(product);
      }
      
      const itemTotal = finalPrice * item.quantity;
      itemsSubtotal += itemTotal;

      // 🔧 Preparar product_snapshot con información de variante
      // Obtener imagen del producto (desde product_images o product.images JSONB)
      const productImagesList = imagesByProductId[product.id] || []
      let productImage: string | null = null
      
      // Prioridad 1: Imagen desde product_images
      if (productImagesList.length > 0) {
        productImage = productImagesList[0].url || null
      }
      
      // Prioridad 2: Imagen desde campo images JSONB del producto (si existe)
      if (!productImage && (product as any).images) {
        const imagesData = (product as any).images
        if (typeof imagesData === 'string') {
          try {
            const parsed = JSON.parse(imagesData)
            productImage = Array.isArray(parsed) ? parsed[0] : (parsed?.url || parsed?.main || null)
          } catch {
            productImage = imagesData
          }
        } else if (Array.isArray(imagesData)) {
          productImage = imagesData[0] || null
        } else if (typeof imagesData === 'object') {
          productImage = imagesData.url || imagesData.main || imagesData.previews?.[0] || null
        }
      }

      const productSnapshot: any = {
        name: product.name,
        price: finalPrice,
        medida: product.medida,
        brand: product.brand,
        image: productImage, // Imagen base desde product_images o product.images
      };

      // Incluir color, terminación e imagen de la variante si están disponibles
      if (item.variant_id && product.product_variants) {
        const variant = product.product_variants.find((v: any) => v.id.toString() === item.variant_id?.toString());
        if (variant) {
          // Usar color de la variante
          if (variant.color_name) {
            productSnapshot.color = variant.color_name;
          }
          // Usar medida de la variante
          if (variant.measure) {
            productSnapshot.medida = variant.measure;
          }
          // Usar finish de la variante
          if (variant.finish) {
            productSnapshot.finish = variant.finish;
          }
          // Priorizar imagen de la variante si existe
          if (variant.image_url) {
            productSnapshot.image = variant.image_url;
          }
        }
      } else {
        // Si no hay variant_id, usar color del producto
        if (item.variant_color) {
          productSnapshot.color = item.variant_color;
        } else if (product.color) {
          productSnapshot.color = product.color;
        }

        if (item.variant_finish) {
          productSnapshot.finish = item.variant_finish;
        } else if (product.product_variants && product.product_variants.length > 0) {
          // Usar finish de la primera variante disponible
          const firstVariant = product.product_variants[0];
          if (firstVariant?.finish) {
            productSnapshot.finish = firstVariant.finish;
          }
        }
      }

      return {
        product_id: parseInt(item.id),
        product_name: product.name,
        product_sku: product.aikon_id || null, // Usar aikon_id como SKU
        quantity: item.quantity,
        price: finalPrice, // Usar 'price' en lugar de 'unit_price' para compatibilidad
        unit_price: finalPrice,
        total_price: itemTotal,
        product_snapshot: productSnapshot
      };
    });

    // ✅ Sumar costo de envío (si viene) al total
    const shippingCost = typeof validatedData.shipments.cost === 'number' ? validatedData.shipments.cost : 0;
    const totalAmount = itemsSubtotal + shippingCost;

    // Validar que el total sea mayor a 0 (requisito de la restricción orders_total_check)
    if (totalAmount <= 0) {
      logger.error(LogCategory.API, 'Total inválido en create-cash-order', {
        itemsSubtotal,
        shippingCost,
        totalAmount,
        items: validatedData.items.map(i => ({ id: i.id, quantity: i.quantity, unit_price: i.unit_price }))
      });
      throw new Error(`Total inválido: ${totalAmount}. El total debe ser mayor a 0.`);
    }

    // Preparar datos para insertar en orders
    const orderNumber = `ORD-${Math.floor(Date.now() / 1000)}-${crypto.randomBytes(4).toString('hex')}`;
    const orderData = {
      user_id: userId,
      order_number: orderNumber,
      total: totalAmount, // Columna total (NOT NULL) - único campo de total en la tabla
      status: 'pending',
      payment_status: 'cash_on_delivery',
      // ✅ AGREGADO: payment_method ahora existe en la tabla (migración aplicada)
      payment_method: 'cash',
      payer_info: {
        name: validatedData.payer.name,
        surname: validatedData.payer.surname,
        email: validatedData.payer.email,
        phone: `${validatedData.payer.phone.area_code}${validatedData.payer.phone.number}`,
        identification: validatedData.payer.identification,
        // ✅ También guardar en payer_info para compatibilidad y consultas JSONB
        payment_method: 'cash',
        order_number: orderNumber
      },
      shipping_address: {
        zip_code: validatedData.shipments.receiver_address.zip_code,
        state_name: validatedData.shipments.receiver_address.state_name,
        city_name: validatedData.shipments.receiver_address.city_name,
        street_name: validatedData.shipments.receiver_address.street_name,
        street_number: validatedData.shipments.receiver_address.street_number,
        // ✅ AGREGAR: Guardar piso/depto y observaciones si existen
        ...(validatedData.shipments.receiver_address.apartment && {
          apartment: validatedData.shipments.receiver_address.apartment
        }),
        ...(validatedData.shipments.receiver_address.observations && {
          observations: validatedData.shipments.receiver_address.observations
        }),
      },
      external_reference: validatedData.external_reference || `cash_order_${Date.now()}`
    };

    console.log('[DEBUG] Datos para insertar en orders:', JSON.stringify(orderData, null, 2));
    console.log('[DEBUG] Tipo de user_id:', typeof userId, 'Valor:', userId);
    console.log('[DEBUG] Tipo de total:', typeof totalAmount, 'Valor:', totalAmount);

    // Crear orden en la base de datos
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    console.log('[DEBUG] Resultado de inserción de orden:', { 
      success: !!order, 
      orderId: order?.id, 
      errorCode: orderError?.code,
      errorMessage: orderError?.message,
      errorDetails: orderError?.details,
      errorHint: orderError?.hint
    });

    if (orderError || !order) {
      logger.error(LogCategory.ORDER, 'Error creating order', orderError || undefined);
      throw new Error(orderError?.message || orderError?.details || orderError?.hint || 'Error al crear la orden');
    }

    // Crear items de la orden
    const orderItemsWithOrderId = orderItems.map(item => ({
      ...item,
      order_id: order.id
    }));

    console.log('🔍 DEBUG: Insertando order_items:', JSON.stringify(orderItemsWithOrderId, null, 2));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsWithOrderId);

    if (itemsError) {
      console.error('❌ Error creating order items:', itemsError);
      logger.error(LogCategory.ORDER, 'Error creating order items', itemsError);
      throw new Error(`Error al crear los items de la orden: ${itemsError.message}`);
    }

    // Generar mensaje de WhatsApp con el formato solicitado
    const formatARS = (v: number) => Number(v).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const bullet = EMOJIS.bullet;
    const lines: string[] = [
      `✨ *¡Gracias por tu compra en Pinteya!* 🛍`,
      `🤝 Te compartimos el detalle para coordinar la entrega:`,
      '',
      `*Detalle de Orden:*`,
      `${bullet} Orden: ${order.order_number || order.id}`,
      `${bullet} Subtotal: $${formatARS(itemsSubtotal)}`,
      `${bullet} Envío: $${formatARS(shippingCost)}`,
      `${bullet} Total: $${formatARS(Number(order.total || totalAmount))}`,
      '',
      `*Datos Personales:*`,
      `${bullet} Nombre: ${validatedData.payer.name} ${validatedData.payer.surname}`,
      `${bullet} Teléfono: ${EMOJIS.phone} ${validatedData.payer.phone.area_code}${validatedData.payer.phone.number}`,
      // ✅ ELIMINAR: Línea del email (no se muestra en el mensaje)
      '',
      `*Productos:*`,
    ];

    for (const item of validatedData.items) {
      const product = products.find(p => p.id.toString() === item.id.toString());
      if (product) {
        // 🔧 CORREGIDO: Calcular precio usando la misma lógica que en orderItems
        // Si el item tiene variant_id, usar precio de la variante
        let itemPrice: number;
        if (item.variant_id && product.product_variants) {
          const variant = product.product_variants.find((v: any) => v.id.toString() === item.variant_id?.toString());
          if (variant) {
            // Priorizar price_sale si existe y es mayor a 0, sino usar price_list
            itemPrice = variant.price_sale && variant.price_sale > 0 ? variant.price_sale : (variant.price_list || 0);
          } else {
            // Fallback al precio del producto si no se encuentra la variante
            itemPrice = calculateFinalPrice(product);
          }
        } else {
          // Si no tiene variant_id, usar precio del producto padre
          itemPrice = calculateFinalPrice(product);
        }
        
        // Validar que itemPrice sea válido
        if (!itemPrice || itemPrice <= 0) {
          console.error(`⚠️ Precio inválido para producto ${product.name}:`, {
            itemPrice,
            variant_id: item.variant_id,
            product_id: product.id,
            variant: item.variant_id ? product.product_variants?.find((v: any) => v.id.toString() === item.variant_id?.toString()) : null
          });
          // Usar precio del producto como último recurso
          itemPrice = product.discounted_price && product.discounted_price > 0 
            ? product.discounted_price 
            : (product.price || 0);
        }
        
        const lineTotal = itemPrice * item.quantity;
        
        // Log de debug para verificar valores
        console.log(`💰 Precio calculado para ${product.name}:`, {
          itemPrice,
          quantity: item.quantity,
          lineTotal,
          variant_id: item.variant_id,
          hasVariants: !!product.product_variants?.length
        });
        
        // Construir línea detallada del producto
        let productLine = `${bullet} ${product.name}`;
        
        // Agregar detalles del producto si están disponibles
        const details = [];
        
        // 🔧 PRIORIDAD: Usar color de la variante si está disponible, sino usar color del producto
        const colorToUse = item.variant_color || product.color;
        // Solo agregar si NO contiene comas (múltiples colores)
        if (colorToUse && !colorToUse.includes(',')) {
          details.push(`Color: ${colorToUse}`);
        }
        
        // 🔧 Agregar terminación si está disponible (de la variante o de product_variants)
        let finishToUse: string | undefined = item.variant_finish;
        if (!finishToUse && item.variant_id && product.product_variants) {
          const variant = product.product_variants.find((v: any) => v.id.toString() === item.variant_id?.toString());
          finishToUse = variant?.finish || undefined;
        }
        if (!finishToUse && product.product_variants && product.product_variants.length > 0) {
          finishToUse = product.product_variants[0]?.finish || undefined;
        }
        if (finishToUse) details.push(`Terminación: ${finishToUse}`);
        
        if (product.medida) details.push(`Medida: ${product.medida}`);
        if (product.brand) details.push(`Marca: ${product.brand}`);
        
        if (details.length > 0) {
          productLine += ` (${details.join(', ')})`;
        }
        
        productLine += ` x${item.quantity} - $${formatARS(lineTotal)}`;
        lines.push(productLine);
      }
    }

    // Datos de envío
    lines.push('', `*Datos de Envío:*`);
    lines.push(`${bullet} Dirección: 📍 ${order.shipping_address?.street_name} ${order.shipping_address?.street_number}`);
    
    // ✅ AGREGAR: Piso/Depto si existe
    if (order.shipping_address?.apartment) {
      lines.push(`${bullet} Piso/Depto: ${order.shipping_address.apartment}`);
    }
    
    lines.push(`${bullet} Ciudad: ${order.shipping_address?.city_name}, ${order.shipping_address?.state_name}`);
    lines.push(`${bullet} CP: ${order.shipping_address?.zip_code}`);
    
    // ✅ AGREGAR: Observaciones si existen
    if (order.shipping_address?.observations) {
      lines.push(`${bullet} Observaciones: ${order.shipping_address.observations}`);
    }
    
    lines.push('');
    lines.push(`💳 *Método de pago:* Pago al recibir`);
    lines.push('', `${EMOJIS.check} ¡Listo! 💚 En breve te contactamos para confirmar disponibilidad y horario.`);

    // Usar \n para mejor compatibilidad con WhatsApp
    const message = sanitizeForWhatsApp(lines.join('\n'));
    
    // ✅ FIX: Usar encodeURIComponent para codificar correctamente TODO el mensaje
    // encodeURIComponent convierte \n a %0A automáticamente Y codifica todos los
    // caracteres especiales (espacios, $, *, :, etc.) que son necesarios para URLs válidas.
    // El error anterior era solo reemplazar \n por %0A sin codificar el resto del mensaje.
    const whatsappMessage = encodeURIComponent(message);
    // Número de WhatsApp de Pinteya en formato internacional (solo dígitos)
    const rawPhone = process.env.WHATSAPP_BUSINESS_NUMBER || '5493513411796';
    const whatsappNumber = normalizeWhatsAppPhoneNumber(rawPhone);
    // Usamos api.whatsapp.com para preservar saltos de línea y formato
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${whatsappMessage}`;

    // Guardar enlace, mensaje y fecha en la orden (no bloquear por error)
    try {
      const updateData: any = {
        whatsapp_notification_link: whatsappUrl,
        whatsapp_generated_at: new Date().toISOString(),
      };
      
      // Intentar guardar whatsapp_message si la columna existe
      try {
        updateData.whatsapp_message = message;
      } catch (e) {
        // Si falla, no incluir whatsapp_message
        console.log('[CASH_ORDER] whatsapp_message column not available, skipping...');
      }

      const { error: whatsappUpdateError } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', order.id);
        
      if (whatsappUpdateError) {
        console.error('[CASH_ORDER] Error saving WhatsApp data:', whatsappUpdateError);
        // Si falla por columna whatsapp_message, intentar sin ella
        if (whatsappUpdateError.message.includes('whatsapp_message')) {
          const { error: retryError } = await supabase
            .from('orders')
            .update({
              whatsapp_notification_link: whatsappUrl,
              whatsapp_generated_at: new Date().toISOString(),
            })
            .eq('id', order.id);
          if (retryError) {
            console.error('[CASH_ORDER] Error saving WhatsApp data (retry):', retryError);
          }
        }
      }
    } catch (e) {
      console.error('[CASH_ORDER] Exception saving WhatsApp data:', e);
    }

    // Métricas de performance
    const duration = Date.now() - startTime;
    metricsCollector.recordApiCall({
      endpoint: 'create-cash-order',
      method: 'POST',
      statusCode: 200,
      responseTime: duration
    });

    logger.info(LogCategory.ORDER, 'Cash order created successfully', {
      orderId: order.id,
      totalAmount,
      itemsCount: orderItems.length,
      duration
    });

    return NextResponse.json({
      success: true,
      data: {
        order: {
          id: order.id,
          order_number: order.order_number,
          total: order.total || totalAmount,
          status: order.status,
          payment_status: order.payment_status,
          created_at: order.created_at,
          whatsapp_url: whatsappUrl
        },
        items: orderItemsWithOrderId,
        whatsapp_url: whatsappUrl,
        whatsapp_message: message
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    metricsCollector.recordApiCall({
      endpoint: 'create-cash-order',
      method: 'POST',
      statusCode: 500,
      responseTime: duration,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    logger.error(LogCategory.API, 'Error in create-cash-order API', error instanceof Error ? error : undefined);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, data: null, error: 'Datos de entrada inválidos' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, data: null, error: error instanceof Error ? error.message : 'Error interno del servidor' },
      { status: 500 }
    );
  }
}