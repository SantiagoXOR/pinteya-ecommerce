// ===================================
// PINTEYA E-COMMERCE - MERCADOPAGO WEBHOOK API
// ===================================

import { NextRequest, NextResponse } from 'next/server';
import { getPaymentInfo, validateWebhookSignature, validateWebhookOrigin } from '@/lib/mercadopago';
import { getSupabaseClient } from '@/lib/supabase';
import { MercadoPagoWebhookData } from '@/types/mercadopago';
import { logger, LogLevel, LogCategory } from '@/lib/logger';
import { checkRateLimit, addRateLimitHeaders, RATE_LIMIT_CONFIGS, endpointKeyGenerator } from '@/lib/rate-limiter';
import { metricsCollector } from '@/lib/metrics';

// ✅ ELIMINADO: Rate limiting básico reemplazado por sistema avanzado con Redis

export async function POST(request: NextRequest) {
  // ✅ MEJORADO: Logging estructurado con timestamp
  const requestStart = Date.now();
  const clientIP = request.headers.get('x-forwarded-for') || 'unknown';

  try {

    // ✅ MEJORADO: Logging estructurado
    logger.webhook(LogLevel.INFO, 'Webhook request received', {
      type: 'incoming',
    }, {
      clientIP,
      userAgent: request.headers.get('user-agent') || 'unknown',
    });

    // ✅ MEJORADO: Rate limiting avanzado con Redis
    const rateLimitConfig = {
      ...RATE_LIMIT_CONFIGS.WEBHOOK_API,
      keyGenerator: endpointKeyGenerator('webhook'),
    };

    const rateLimitResult = await checkRateLimit(request, rateLimitConfig);

    if (!rateLimitResult.success) {
      logger.warn(LogCategory.SECURITY, 'Rate limit exceeded for webhook', {
        clientIP,
        limit: rateLimitResult.limit,
        retryAfter: rateLimitResult.retryAfter,
      });

      return NextResponse.json({
        error: rateLimitConfig.message,
        retryAfter: rateLimitResult.retryAfter,
      }, {
        status: 429,
        headers: {
          'RateLimit-Limit': rateLimitResult.limit.toString(),
          'RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
          'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
        }
      });
    }

    // ✅ MEJORADO: Validar origen del webhook
    if (!validateWebhookOrigin(request)) {
      logger.security(LogLevel.ERROR, 'Invalid webhook origin detected', {
        threat: 'invalid_origin',
        blocked: true,
        reason: 'Webhook origin validation failed',
      }, { clientIP, userAgent: request.headers.get('user-agent') || 'unknown' });

      return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
    }

    // Obtener headers necesarios para validación
    const xSignature = request.headers.get('x-signature');
    const xRequestId = request.headers.get('x-request-id');
    const timestamp = request.headers.get('x-timestamp') || Math.floor(Date.now() / 1000).toString();

    if (!xSignature || !xRequestId) {
      logger.security(LogLevel.ERROR, 'Missing required webhook headers', {
        threat: 'missing_headers',
        blocked: true,
        reason: 'Required headers x-signature or x-request-id missing',
      }, { clientIP });

      return NextResponse.json({ error: 'Missing headers' }, { status: 400 });
    }

    // Obtener datos del webhook
    const webhookData: MercadoPagoWebhookData = await request.json();

    // ✅ MEJORADO: Logging estructurado de datos del webhook
    logger.webhook(LogLevel.INFO, 'Webhook data received', {
      type: webhookData.type,
      action: webhookData.action,
      dataId: webhookData.data.id,
    }, { clientIP });

    // Solo procesar notificaciones de pagos
    if (webhookData.type !== 'payment') {
      logger.webhook(LogLevel.INFO, 'Ignoring non-payment webhook', {
        type: webhookData.type,
        action: webhookData.action,
      }, { clientIP });

      return NextResponse.json({ status: 'ignored' }, { status: 200 });
    }

    // ✅ MEJORADO: Validación de firma robusta siempre activa
    const signatureValidation = validateWebhookSignature(
      xSignature,
      xRequestId,
      webhookData.data.id,
      timestamp
    );

    if (!signatureValidation.isValid) {
      logger.security(LogLevel.ERROR, 'Webhook signature validation failed', {
        threat: 'invalid_signature',
        blocked: true,
        reason: signatureValidation.error || 'Signature validation failed',
      }, { clientIP });

      return NextResponse.json({
        error: 'Invalid signature',
        details: signatureValidation.error
      }, { status: 401 });
    }

    logger.security(LogLevel.INFO, 'Webhook signature validated successfully', {
      threat: 'none',
      blocked: false,
      reason: 'Valid signature',
    }, { clientIP });

    // Obtener información del pago desde MercadoPago
    const paymentResult = await getPaymentInfo(webhookData.data.id);

    if (!paymentResult.success || !('data' in paymentResult)) {
      console.error('Error getting payment info:', 'error' in paymentResult ? paymentResult.error : 'Unknown error');
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    const payment = paymentResult.data;
    
    // Inicializar Supabase con cliente administrativo
    const supabase = getSupabaseClient(true);

    // Verificar que el cliente esté disponible
    if (!supabase) {
      console.error('Cliente de Supabase no disponible en POST /api/payments/webhook');
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
    }

    // Buscar la orden por external_reference
    const orderId = payment.external_reference;
    if (!orderId) {
      console.error('No external_reference found in payment');
      return NextResponse.json({ error: 'No order reference' }, { status: 400 });
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Order not found:', orderId, orderError);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Mapear estados de MercadoPago a estados internos
    let newStatus: string;
    let shouldUpdateStock = false;

    switch (payment.status) {
      case 'approved':
        newStatus = 'paid';
        shouldUpdateStock = true;
        break;
      case 'pending':
      case 'in_process':
        newStatus = 'pending';
        break;
      case 'rejected':
      case 'cancelled':
        newStatus = 'cancelled';
        break;
      case 'refunded':
      case 'charged_back':
        newStatus = 'refunded';
        // TODO: Restaurar stock si es necesario
        break;
      default:
        newStatus = 'pending';
    }

    // Actualizar estado de la orden
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: newStatus,
        payment_id: payment.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Error updating order:', updateError);
      return NextResponse.json({ error: 'Error updating order' }, { status: 500 });
    }

    // Si el pago fue aprobado, actualizar stock de productos
    if (shouldUpdateStock) {
      try {
        // Obtener items de la orden
        const { data: orderItems, error: itemsError } = await supabase
          .from('order_items')
          .select('product_id, quantity')
          .eq('order_id', orderId);

        if (itemsError) {
          console.error('Error getting order items:', itemsError);
        } else if (orderItems) {
          // Actualizar stock de cada producto
          for (const item of orderItems) {
            const { error: stockError } = await supabase.rpc('update_product_stock', {
              product_id: item.product_id,
              quantity_sold: item.quantity,
            });

            if (stockError) {
              console.error('Error updating stock for product:', item.product_id, stockError);
            }
          }
        }
      } catch (stockError) {
        console.error('Error in stock update process:', stockError);
        // No fallar el webhook por errores de stock
      }
    }

    // ✅ MEJORADO: Logging estructurado del evento procesado
    const processingTime = Date.now() - requestStart;

    logger.webhook(LogLevel.INFO, 'Webhook processed successfully', {
      type: 'payment',
      action: 'processed',
      dataId: payment.id?.toString(),
      isValid: true,
      processingTime,
    }, { clientIP });

    logger.payment(LogLevel.INFO, 'Payment webhook processed', {
      orderId: orderId.toString(),
      paymentId: payment.id?.toString(),
      amount: payment.transaction_amount,
      currency: payment.currency_id,
      status: payment.status,
      method: 'mercadopago',
    }, { clientIP });

    logger.performance(LogLevel.INFO, 'Webhook processing completed', {
      operation: 'webhook-processing',
      duration: processingTime,
      endpoint: '/api/payments/webhook',
      statusCode: 200,
    }, { clientIP });

    // ✅ NUEVO: Responder exitosamente con headers de rate limiting
    const response = NextResponse.json({
      status: 'processed',
      order_id: orderId,
      payment_status: payment.status,
      order_status: newStatus,
    }, { status: 200 });

    // ✅ NUEVO: Registrar métricas de éxito
    await metricsCollector.recordRequest(
      'webhook',
      'POST',
      200,
      Date.now() - requestStart,
      { clientIP, paymentId: payment.id?.toString() || 'unknown' }
    );

    return addRateLimitHeaders(response, rateLimitResult, rateLimitConfig);

  } catch (error: any) {
    // ✅ MEJORADO: Logging estructurado de errores
    const processingTime = Date.now() - requestStart;

    logger.error(LogCategory.WEBHOOK, 'Webhook processing failed', error, {
      clientIP,
      userAgent: request.headers.get('user-agent') || 'unknown',
    });

    logger.performance(LogLevel.ERROR, 'Webhook processing failed', {
      operation: 'webhook-processing',
      duration: processingTime,
      endpoint: '/api/payments/webhook',
      statusCode: 500,
    }, { clientIP });

    // ✅ NUEVO: Registrar métricas de error
    await metricsCollector.recordRequest(
      'webhook',
      'POST',
      500,
      processingTime,
      { clientIP, error: error.message }
    );

    // Retornar error 500 para que MercadoPago reintente
    return NextResponse.json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Processing failed',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

// Función para crear la función de actualización de stock en Supabase
// Esta función debe ejecutarse en la consola de Supabase:
/*
CREATE OR REPLACE FUNCTION update_product_stock(product_id INTEGER, quantity_sold INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE products 
  SET stock = stock - quantity_sold,
      updated_at = NOW()
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql;
*/
