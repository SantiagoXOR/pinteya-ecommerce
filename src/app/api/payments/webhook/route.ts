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
import { executeWebhookProcessing } from '@/lib/mercadopago/circuit-breaker';
import { logPaymentEvent, logSecurityViolation, AuditResult } from '@/lib/security/audit-trail';
import {
  recordPerformanceMetric,
  recordBusinessMetric,
  recordSecurityMetric
} from '@/lib/monitoring/enterprise-metrics';
import { sendOrderConfirmationEmail } from '../../../../../lib/email';

// ✅ ELIMINADO: Rate limiting básico reemplazado por sistema avanzado con Redis

// ✅ NUEVO: Handler GET para verificación de webhook por MercadoPago
export async function GET(request: NextRequest) {
  // MercadoPago hace peticiones GET para verificar que el webhook existe
  return NextResponse.json({
    status: 'webhook_active',
    message: 'MercadoPago webhook endpoint is active',
    timestamp: new Date().toISOString(),
    endpoint: '/api/payments/webhook'
  }, { status: 200 });
}

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

    // ✅ MEJORADO: Validar origen del webhook con debugging mejorado
    const originValidation = validateWebhookOrigin(request);
    if (!originValidation) {
      // ✅ DEBUGGING: Log detallado de headers para diagnóstico
      const debugHeaders = {
        origin: request.headers.get('origin'),
        userAgent: request.headers.get('user-agent'),
        referer: request.headers.get('referer'),
        host: request.headers.get('host'),
        'x-forwarded-for': request.headers.get('x-forwarded-for'),
        'content-type': request.headers.get('content-type'),
      };

      logger.security(LogLevel.ERROR, 'Invalid webhook origin detected', {
        threat: 'invalid_origin',
        blocked: true,
        reason: 'Webhook origin validation failed',
        debugHeaders,
      }, { clientIP, userAgent: request.headers.get('user-agent') || 'unknown' });

      // ✅ DESARROLLO: Información adicional para debugging
      if (process.env.NODE_ENV === 'development') {
        console.log('[WEBHOOK_DEBUG] Headers completos para debugging:', debugHeaders);
        console.log('[WEBHOOK_DEBUG] Para habilitar modo debug, configura: MERCADOPAGO_WEBHOOK_DEBUG=true');
      }

      return NextResponse.json({
        error: 'Invalid origin',
        debug: process.env.NODE_ENV === 'development' ? debugHeaders : undefined
      }, { status: 403 });
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

      // ✅ ENTERPRISE: Audit trail para violación de seguridad
      await logSecurityViolation(
        'webhook_signature_validation_failed',
        'Invalid HMAC signature in MercadoPago webhook',
        {
          ip: clientIP,
          userAgent: request.headers.get('user-agent') || 'unknown'
        },
        {
          webhookType: webhookData.type,
          dataId: webhookData.data.id,
          signatureError: signatureValidation.error,
          xSignature: xSignature?.substring(0, 20) + '...', // Truncar por seguridad
          xRequestId
        }
      );

      // ✅ ENTERPRISE: Métrica de seguridad
      await recordSecurityMetric(
        'signature_validation_failed',
        'critical',
        {
          endpoint: '/api/payments/webhook',
          ip: clientIP,
          webhookType: webhookData.type
        }
      );

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

    // ✅ ENTERPRISE: Procesar webhook con circuit breaker
    const webhookResult = await executeWebhookProcessing(async () => {
      // Obtener información del pago desde MercadoPago
      const paymentResult = await getPaymentInfo(webhookData.data.id);

      if (!paymentResult.success || !('data' in paymentResult)) {
        throw new Error('error' in paymentResult ? paymentResult.error : 'Payment not found');
      }

      return paymentResult.data;
    });

    if (!webhookResult.success) {
      if (webhookResult.wasRejected) {
        logger.warn(LogLevel.WARN, 'Webhook processing rejected by circuit breaker', {
          dataId: webhookData.data.id,
          state: webhookResult.state
        }, { clientIP });

        return NextResponse.json({
          error: 'Webhook processing temporarily unavailable',
          retry_after: 30
        }, { status: 503 });
      } else {
        logger.error(LogLevel.ERROR, 'Webhook processing failed', {
          dataId: webhookData.data.id,
          error: webhookResult.error?.message,
          executionTime: webhookResult.executionTime
        }, { clientIP });

        return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
      }
    }

    const payment = webhookResult.data;
    
    // Inicializar Supabase con cliente administrativo
    const supabase = getSupabaseClient(true);

    // Verificar que el cliente esté disponible
    if (!supabase) {
      console.error('Cliente de Supabase no disponible en POST /api/payments/webhook');
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
    }

    // Buscar la orden por external_reference
    const orderReference = payment.external_reference;
    if (!orderReference) {
      console.error('No external_reference found in payment');
      return NextResponse.json({ error: 'No order reference' }, { status: 400 });
    }

    // Buscar orden por external_reference (no por id)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('external_reference', orderReference)
      .single();

    if (orderError || !order) {
      console.error('Order not found by external_reference:', orderReference, orderError);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Mapear estados de MercadoPago a estados internos
    let newOrderStatus: string;
    let newPaymentStatus: string;
    let shouldUpdateStock = false;
    let shouldSendEmail = false;

    switch (payment.status) {
      case 'approved':
        newOrderStatus = 'confirmed'; // Orden confirmada cuando pago aprobado
        newPaymentStatus = 'paid';
        shouldUpdateStock = true;
        shouldSendEmail = true;
        break;
      case 'pending':
      case 'in_process':
        newOrderStatus = 'pending';
        newPaymentStatus = 'pending';
        break;
      case 'rejected':
      case 'cancelled':
        newOrderStatus = 'cancelled';
        newPaymentStatus = 'failed';
        break;
      case 'refunded':
      case 'charged_back':
        newOrderStatus = 'refunded';
        newPaymentStatus = 'refunded';
        // TODO: Restaurar stock si es necesario
        break;
      default:
        newOrderStatus = 'pending';
        newPaymentStatus = 'pending';
    }

    // Actualizar estado de la orden
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: newOrderStatus,
        payment_status: newPaymentStatus,
        payment_id: payment.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id);

    if (updateError) {
      console.error('Error updating order:', updateError);
      return NextResponse.json({ error: 'Error updating order' }, { status: 500 });
    }

    // Enviar email de confirmación si el pago fue aprobado
    if (shouldSendEmail && order.payer_info) {
      try {
        // Obtener items de la orden para el email
        const { data: orderItems, error: itemsError } = await supabase
          .from('order_items')
          .select(`
            quantity,
            price,
            products (
              name
            )
          `)
          .eq('order_id', order.id);

        if (!itemsError && orderItems) {
          const emailItems = orderItems.map(item => ({
            name: item.products?.name || 'Producto',
            quantity: item.quantity,
            price: `$${parseFloat(item.price).toLocaleString('es-AR')}`
          }));

          await sendOrderConfirmationEmail({
            userName: order.payer_info.name || 'Cliente',
            userEmail: order.payer_info.email,
            orderNumber: orderReference,
            orderTotal: `$${parseFloat(order.total).toLocaleString('es-AR')}`,
            orderItems: emailItems
          });

          logger.info(LogLevel.INFO, 'Order confirmation email sent', {
            orderId: order.id,
            email: order.payer_info.email,
            orderReference
          });
        }
      } catch (emailError) {
        // No fallar el webhook por errores de email
        console.error('Error sending confirmation email:', emailError);
        logger.warn(LogLevel.WARN, 'Failed to send confirmation email', {
          orderId: order.id,
          error: emailError instanceof Error ? emailError.message : 'Unknown error'
        });
      }
    }

    // Si el pago fue aprobado, actualizar stock de productos
    if (shouldUpdateStock) {
      try {
        // Obtener items de la orden
        const { data: orderItems, error: itemsError } = await supabase
          .from('order_items')
          .select('product_id, quantity')
          .eq('order_id', order.id);

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
      orderId: order.id.toString(),
      paymentId: payment.id?.toString(),
      amount: payment.transaction_amount,
      currency: payment.currency_id,
      status: payment.status,
      newOrderStatus,
      newPaymentStatus,
      method: 'mercadopago',
    }, { clientIP });

    // ✅ ENTERPRISE: Audit trail para procesamiento de pago
    await logPaymentEvent(
      'payment_webhook_processed',
      payment.status === 'approved' ? AuditResult.SUCCESS :
      payment.status === 'rejected' ? AuditResult.FAILURE : AuditResult.SUCCESS,
      {
        orderId: order.id.toString(),
        paymentId: payment.id?.toString(),
        amount: payment.transaction_amount,
        currency: payment.currency_id,
        orderStatus: newOrderStatus,
        paymentStatus: newPaymentStatus,
        method: 'mercadopago'
      },
      undefined, // No hay userId en webhook
      {
        ip: clientIP,
        userAgent: request.headers.get('user-agent') || 'webhook'
      }
    );

    logger.performance(LogLevel.INFO, 'Webhook processing completed', {
      operation: 'webhook-processing',
      duration: processingTime,
      endpoint: '/api/payments/webhook',
      statusCode: 200,
    }, { clientIP });

    // ✅ ENTERPRISE: Métricas de performance
    await recordPerformanceMetric(
      'webhook_processing',
      processingTime,
      true,
      {
        endpoint: '/api/payments/webhook',
        paymentStatus: payment.status,
        orderStatus: newStatus
      }
    );

    // ✅ ENTERPRISE: Métricas de negocio
    await recordBusinessMetric(
      'payment_processed',
      payment.transaction_amount || 0,
      {
        currency: payment.currency_id || 'ARS',
        method: 'mercadopago',
        status: payment.status
      }
    );

    if (payment.status === 'approved') {
      await recordBusinessMetric('payment_approved', 1, {
        amount: payment.transaction_amount?.toString() || '0',
        currency: payment.currency_id || 'ARS'
      });
    }

    // ✅ NUEVO: Responder exitosamente con headers de rate limiting
    const response = NextResponse.json({
      status: 'processed',
      order_id: order.id,
      payment_status: newPaymentStatus,
      order_status: newOrderStatus,
      email_sent: shouldSendEmail,
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
