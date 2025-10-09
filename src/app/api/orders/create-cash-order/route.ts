export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/integrations/supabase/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/enterprise/logger';
import { createRateLimiter } from '@/lib/rate-limiting/rate-limiter';
import { metricsCollector } from '@/lib/enterprise/metrics';

// Schema de validación para la orden de pago contra entrega
const CreateCashOrderSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    quantity: z.number().min(1),
    unit_price: z.number().min(0)
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
function calculateFinalPrice(product: any): number {
  // Si hay precio con descuento, usarlo directamente
  if (product.discounted_price && product.discounted_price > 0) {
    return product.discounted_price;
  }
  return product.price;
}

// Función para generar mensaje de WhatsApp
function generateWhatsAppMessage(orderData: any): string {
  const { order, items } = orderData;
  
  let message = `¡Hola! He realizado un pedido con pago contra entrega:\n\n`;
  message += `📋 *Orden #${order.id}*\n`;
  message += `👤 *Cliente:* ${order.payer_name} ${order.payer_surname}\n`;
  message += `📧 *Email:* ${order.payer_email}\n`;
  message += `📱 *Teléfono:* ${order.payer_phone}\n\n`;
  
  message += `🛍️ *Productos:*\n`;
  items.forEach((item: any, index: number) => {
    message += `${index + 1}. ${item.product_name} x${item.quantity} - $${item.unit_price.toFixed(2)}\n`;
  });
  
  message += `\n💰 *Total: $${order.total_amount.toFixed(2)}*\n\n`;
  
  message += `🏠 *Dirección de entrega:*\n`;
  message += `${order.shipping_street_name} ${order.shipping_street_number}\n`;
  message += `${order.shipping_city_name}, ${order.shipping_state_name}\n`;
  message += `CP: ${order.shipping_zip_code}\n\n`;
  
  message += `💳 *Método de pago:* Pago contra entrega\n`;
  message += `📅 *Fecha del pedido:* ${new Date(order.created_at).toLocaleDateString('es-AR')}\n\n`;
  message += `¡Gracias por tu compra! 🙏`;
  
  return encodeURIComponent(message);
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Rate limiting
    const rateLimiter = createRateLimiter({ maxRequests: 10, windowMs: 60 * 1000 });
    const rateLimitResult = await rateLimiter(request);
    if (!rateLimitResult.allowed) {
      logger.warn('Rate limit exceeded for create-cash-order', {
        limit: rateLimitResult.limit,
        remaining: rateLimitResult.remaining
      });
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Intenta nuevamente en unos minutos.' },
        { status: 429 }
      );
    }

    // Validar datos de entrada
    const body = await request.json();
    const validatedData = CreateCashOrderSchema.parse(body);

    logger.info('Creating cash order', {
      itemsCount: validatedData.items.length,
      payerEmail: validatedData.payer.email
    });

    // Obtener usuario autenticado o crear usuario temporal
    const session = await auth();
    const supabase = await createClient();
    
    let userId: string;
    
    if (session?.user?.id) {
      userId = session.user.id;
      logger.info('Using authenticated user', { userId });
    } else {
      // Crear usuario temporal para checkout sin autenticación
      const tempUserEmail = validatedData.payer.email;
      const tempUserName = `${validatedData.payer.name} ${validatedData.payer.surname}`;
      
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', tempUserEmail)
        .single();

      if (existingUser) {
        userId = existingUser.id;
        logger.info('Using existing temp user', { userId, email: tempUserEmail });
      } else {
        const { data: newUser, error: userError } = await supabase
          .from('users')
          .insert({
            email: tempUserEmail,
            name: tempUserName,
            is_temporary: true
          })
          .select('id')
          .single();

        if (userError || !newUser) {
          logger.error('Error creating temporary user', { error: userError });
          throw new Error('Error al crear usuario temporal');
        }

        userId = newUser.id;
        logger.info('Created new temp user', { userId, email: tempUserEmail });
      }
    }

    // Obtener detalles de productos y validar stock
    const productIds = validatedData.items.map(item => item.id);
    console.log('🔍 Buscando productos con IDs:', productIds);
    
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, price, discounted_price, stock')
      .in('id', productIds);

    console.log('📦 Productos encontrados:', products);
    console.log('❌ Error en consulta:', productsError);

    if (productsError || !products) {
      logger.error('Error fetching products', { error: productsError });
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

    // Calcular total
    let totalAmount = 0;
    const orderItems = validatedData.items.map(item => {
      const product = products.find(p => p.id.toString() === item.id.toString())!;
      const finalPrice = calculateFinalPrice(product);
      const itemTotal = finalPrice * item.quantity;
      totalAmount += itemTotal;
      
      return {
        product_id: parseInt(item.id), // Convertir string a número para la base de datos
        product_name: product.name,
        quantity: item.quantity,
        price: finalPrice // Usar 'price' en lugar de 'unit_price' según el esquema de la tabla
      };
    });

    // Preparar datos para insertar en orders
    const orderData = {
      user_id: userId, // Ya es UUID válido desde la creación del usuario temporal
      total: totalAmount.toString(), // Convertir a string para compatibilidad con numeric de PostgreSQL
      status: 'pending',
      payment_status: 'cash_on_delivery',
      payer_info: {
        name: validatedData.payer.name,
        surname: validatedData.payer.surname,
        email: validatedData.payer.email,
        phone: `${validatedData.payer.phone.area_code}${validatedData.payer.phone.number}`,
        identification_type: validatedData.payer.identification?.type,
        identification_number: validatedData.payer.identification?.number
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
      logger.error('Error creating order', { 
        error: orderError, 
        orderData: {
          user_id: userId,
          total: totalAmount,
          status: 'pending',
          payment_status: 'cash_on_delivery'
        }
      });
      throw new Error('Error al crear la orden');
    }

    // Crear items de la orden
    const orderItemsWithOrderId = orderItems.map(item => ({
      ...item,
      order_id: order.id
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsWithOrderId);

    if (itemsError) {
      logger.error('Error creating order items', { error: itemsError });
      throw new Error('Error al crear los items de la orden');
    }

    // Generar mensaje de WhatsApp
    let message = `🛒 *Nueva Orden - Pago Contra Entrega*\n\n`;
    message += `📋 *Orden:* ${order.order_number || order.id}\n`;
    message += `💰 *Total:* $${order.total}\n\n`;
    
    message += `👤 *Cliente:* ${order.payer_info?.name} ${order.payer_info?.surname}\n`;
    message += `📧 *Email:* ${order.payer_info?.email}\n`;
    message += `📱 *Teléfono:* ${order.payer_info?.phone}\n\n`;
    
    message += `🛍️ *Productos:*\n`;
    for (const item of validatedData.items) {
      const product = products.find(p => p.id.toString() === item.id.toString());
      if (product) {
        message += `• ${product.name} x${item.quantity} - $${(product.discounted_price || product.price) * item.quantity}\n`;
      }
    }
    
    message += `\n📍 *Dirección de Entrega:*\n`;
    message += `${order.shipping_address?.street_name} ${order.shipping_address?.street_number}\n`;
    message += `${order.shipping_address?.city_name}, ${order.shipping_address?.state_name}\n`;
    message += `CP: ${order.shipping_address?.zip_code}\n\n`;
    
    const whatsappMessage = encodeURIComponent(message);
    const whatsappNumber = process.env.WHATSAPP_BUSINESS_NUMBER || '5491234567890';
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

    // Métricas de performance
    const duration = Date.now() - startTime;
    metricsCollector.recordApiCall('create-cash-order', duration, 'success');

    logger.info('Cash order created successfully', {
      orderId: order.id,
      totalAmount,
      itemsCount: orderItems.length,
      duration
    });

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        total_amount: totalAmount,
        status: order.status,
        payment_status: order.payment_status,
        created_at: order.created_at,
        whatsapp_url: whatsappUrl
      },
      items: orderItemsWithOrderId,
      whatsapp_url: whatsappUrl
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    metricsCollector.recordApiCall('create-cash-order', duration, 'error');
    
    logger.error('Error in create-cash-order API', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      duration
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos de entrada inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno del servidor' },
      { status: 500 }
    );
  }
}