export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/integrations/supabase/server';
import { auth } from '@/auth';
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
  finish?: string | null;
  aikon_id?: string | null;
  product_variants?: Array<{
    id: string;
    color_name: string;
    measure: string;
    price_sale: number;
    price_list: number;
  }>;
}

// Schema de validación para la orden de pago contra entrega
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
      street_number: z.string()
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
    const productIds = validatedData.items.map(item => item.id);
    console.log('🔍 Buscando productos con IDs:', productIds);
    console.log('🔍 Items que se están buscando:', validatedData.items.map((item: any) => ({
      id: item.id,
      name: item.name,
      price: item.price
    })));
    
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        id, name, price, discounted_price, stock, color, medida, brand, description, finish, aikon_id,
        product_variants (
          id, color_name, measure, price_sale, price_list
        )
      `)
      .in('id', productIds) as { data: ProductFromDB[] | null; error: any };

    console.log('📦 Productos encontrados en BD:', products);
    console.log('❌ Error en consulta:', productsError);

    if (productsError || !products) {
      logger.error(LogCategory.API, 'Error fetching products', productsError || undefined);
      throw new Error('Error al obtener información de productos');
    }

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
      if (product.stock < item.quantity) {
        throw new Error(`Stock insuficiente para ${product.name}`);
      }
    }

    // Calcular total e inicializar items para order_items usando la columna efectiva 'price'
    let itemsSubtotal = 0;
    const orderItems = validatedData.items.map(item => {
      const product = products.find(p => p.id.toString() === item.id.toString())!;
      const finalPrice = calculateFinalPrice(product);
      const itemTotal = finalPrice * item.quantity;
      itemsSubtotal += itemTotal;

      // 🔧 Preparar product_snapshot con información de variante
      const productSnapshot: any = {
        name: product.name,
        price: finalPrice,
        medida: product.medida,
        brand: product.brand,
      };

      // Incluir color y terminación si están disponibles
      if (item.variant_color) {
        productSnapshot.color = item.variant_color;
      } else if (product.color) {
        productSnapshot.color = product.color;
      }

      if (item.variant_finish) {
        productSnapshot.finish = item.variant_finish;
      } else if (product.finish) {
        productSnapshot.finish = product.finish;
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

    // Preparar datos para insertar en orders
    const orderNumber = `ORD-${Math.floor(Date.now() / 1000)}-${crypto.randomBytes(4).toString('hex')}`;
    const orderData = {
      user_id: userId,
      order_number: orderNumber,
      total: totalAmount,
      status: 'pending',
      payment_status: 'cash_on_delivery',
      payment_method: 'cash',
      payer_info: {
        name: validatedData.payer.name,
        surname: validatedData.payer.surname,
        email: validatedData.payer.email,
        phone: `${validatedData.payer.phone.area_code}${validatedData.payer.phone.number}`,
        identification: validatedData.payer.identification
      },
      shipping_address: {
        zip_code: validatedData.shipments.receiver_address.zip_code,
        state_name: validatedData.shipments.receiver_address.state_name,
        city_name: validatedData.shipments.receiver_address.city_name,
        street_name: validatedData.shipments.receiver_address.street_name,
        street_number: validatedData.shipments.receiver_address.street_number
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
      `${bullet} Email: ${EMOJIS.email} ${validatedData.payer.email}`,
      '',
      `*Productos:*`,
    ];

    for (const item of validatedData.items) {
      const product = products.find(p => p.id.toString() === item.id.toString());
      if (product) {
        const lineTotal = calculateFinalPrice(product) * item.quantity;
        
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
        
        // 🔧 Agregar terminación si está disponible (de la variante o del producto)
        const finishToUse = item.variant_finish || product.finish;
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
    lines.push(`${bullet} Ciudad: ${order.shipping_address?.city_name}, ${order.shipping_address?.state_name}`);
    lines.push(`${bullet} CP: ${order.shipping_address?.zip_code}`);
    lines.push('');
    lines.push(`💳 *Método de pago:* Pago al recibir`);
    lines.push('', `${EMOJIS.check} ¡Listo! 💚 En breve te contactamos para confirmar disponibilidad y horario.`);

    // Usar \n para mejor compatibilidad con WhatsApp
    const message = sanitizeForWhatsApp(lines.join('\n'));
    // Codificar el mensaje para WhatsApp preservando saltos de línea
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