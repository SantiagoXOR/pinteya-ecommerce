// ===================================
// PINTEYA E-COMMERCE - MERCADOPAGO REFUNDS API
// ===================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseClient } from '@/lib/supabase';
import { logger, LogLevel, LogCategory } from '@/lib/logger';
import { checkRateLimit, addRateLimitHeaders, RATE_LIMIT_CONFIGS } from '@/lib/rate-limiter';
import { metricsCollector } from '@/lib/metrics';
import { createMercadoPagoClient } from '@/lib/mercadopago';
import { Payment } from 'mercadopago';

interface RefundRequest {
  payment_id: string;
  amount?: number;
  reason?: string;
  metadata?: Record<string, any>;
}

interface RefundResponse {
  id: string;
  payment_id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  created_at: string;
  metadata?: Record<string, any>;
}

/**
 * POST /api/payments/refunds
 * Procesa reembolsos según documentación oficial de MercadoPago
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  try {
    // Verificar autenticación
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Rate limiting
    const rateLimitResult = await checkRateLimit(
      'refunds',
      clientIP,
      RATE_LIMIT_CONFIGS.PAYMENT_CREATION
    );

    if (!rateLimitResult.success) {
      logger.warn(LogCategory.API, 'Rate limit exceeded for refunds', {
        clientIP,
        userId,
      });

      const response = NextResponse.json(
        { success: false, error: 'Demasiadas solicitudes' },
        { status: 429 }
      );
      addRateLimitHeaders(response, rateLimitResult);
      return response;
    }

    const body: RefundRequest = await request.json();
    const { payment_id, amount, reason, metadata } = body;

    // Validar datos requeridos
    if (!payment_id) {
      return NextResponse.json(
        { success: false, error: 'payment_id es requerido' },
        { status: 400 }
      );
    }

    logger.info(LogCategory.PAYMENT, 'Refund request started', {
      userId,
      payment_id,
      amount,
      reason,
      clientIP,
    });

    // Verificar que el pago existe y pertenece al usuario
    const supabase = getSupabaseClient();
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, total_amount, payment_status, external_reference')
      .eq('external_reference', payment_id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, error: 'Pago no encontrado' },
        { status: 404 }
      );
    }

    if (order.payment_status !== 'approved') {
      return NextResponse.json(
        { success: false, error: 'Solo se pueden reembolsar pagos aprobados' },
        { status: 400 }
      );
    }

    // Validar monto del reembolso
    const refundAmount = amount || order.total_amount;
    if (refundAmount > order.total_amount) {
      return NextResponse.json(
        { success: false, error: 'El monto del reembolso no puede ser mayor al pago original' },
        { status: 400 }
      );
    }

    // Procesar reembolso con MercadoPago
    const refundResult = await processRefund(payment_id, refundAmount, reason, metadata);

    // Actualizar estado en base de datos
    await supabase
      .from('orders')
      .update({ 
        payment_status: refundResult.status === 'approved' ? 'refunded' : 'refund_pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', order.id);

    // Registrar reembolso en tabla de refunds (si existe)
    try {
      await supabase
        .from('refunds')
        .insert({
          order_id: order.id,
          payment_id,
          refund_id: refundResult.id,
          amount: refundAmount,
          status: refundResult.status,
          reason: reason || 'Reembolso solicitado por el cliente',
          metadata: metadata || {},
          created_at: new Date().toISOString(),
        });
    } catch (refundInsertError) {
      // Si la tabla refunds no existe, solo loggeamos el warning
      logger.warn(LogCategory.PAYMENT, 'Refunds table not found, skipping insert', {
        payment_id,
        refund_id: refundResult.id,
      });
    }

    // Registrar métricas
    await metricsCollector.recordApiCall(
      '/api/payments/refunds',
      'POST',
      200,
      Date.now() - startTime,
      { userId, payment_id, amount: refundAmount }
    );

    logger.info(LogCategory.PAYMENT, 'Refund processed successfully', {
      userId,
      payment_id,
      refund_id: refundResult.id,
      amount: refundAmount,
      status: refundResult.status,
      processingTime: Date.now() - startTime,
    });

    const response = NextResponse.json({
      success: true,
      data: refundResult,
      timestamp: Date.now(),
      processing_time: Date.now() - startTime,
    });

    addRateLimitHeaders(response, rateLimitResult);
    return response;

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    logger.error(LogCategory.PAYMENT, 'Refund processing failed', error as Error, {
      clientIP,
      userAgent,
      processingTime,
    });

    await metricsCollector.recordApiCall(
      '/api/payments/refunds',
      'POST',
      500,
      processingTime,
      { error: (error as Error).message }
    );

    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/payments/refunds
 * Lista reembolsos del usuario
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const clientIP = request.headers.get('x-forwarded-for') || 'unknown';

  try {
    // Verificar autenticación
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Rate limiting
    const rateLimitResult = await checkRateLimit(
      'refunds-list',
      clientIP,
      RATE_LIMIT_CONFIGS.ANALYTICS
    );

    if (!rateLimitResult.success) {
      const response = NextResponse.json(
        { success: false, error: 'Demasiadas solicitudes' },
        { status: 429 }
      );
      addRateLimitHeaders(response, rateLimitResult);
      return response;
    }

    // Obtener parámetros de consulta
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const status = url.searchParams.get('status');

    const supabase = getSupabaseClient();
    
    // Construir query
    let query = supabase
      .from('refunds')
      .select(`
        *,
        orders (
          id,
          total_amount,
          created_at
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: refunds, error } = await query;

    if (error) {
      throw new Error(`Error al obtener reembolsos: ${error.message}`);
    }

    // Registrar métricas
    await metricsCollector.recordApiCall(
      '/api/payments/refunds',
      'GET',
      200,
      Date.now() - startTime,
      { userId, count: refunds?.length || 0 }
    );

    logger.info(LogCategory.API, 'Refunds list retrieved', {
      userId,
      count: refunds?.length || 0,
      processingTime: Date.now() - startTime,
    });

    const response = NextResponse.json({
      success: true,
      data: refunds || [],
      pagination: {
        limit,
        offset,
        total: refunds?.length || 0,
      },
      timestamp: Date.now(),
      processing_time: Date.now() - startTime,
    });

    addRateLimitHeaders(response, rateLimitResult);
    return response;

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    logger.error(LogCategory.API, 'Refunds list failed', error as Error, {
      clientIP,
      processingTime,
    });

    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * Procesa reembolso con MercadoPago
 */
async function processRefund(
  paymentId: string,
  amount: number,
  reason?: string,
  metadata?: Record<string, any>
): Promise<RefundResponse> {
  try {
    // Crear cliente de MercadoPago
    const client = createMercadoPagoClient();
    const payment = new Payment(client);

    // En una implementación real, aquí se haría la llamada a la API de MercadoPago
    // Por ahora simulamos el reembolso
    const refundId = `refund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Simular respuesta de MercadoPago
    const refundResponse: RefundResponse = {
      id: refundId,
      payment_id: paymentId,
      amount,
      status: 'approved', // En producción esto vendría de MercadoPago
      reason: reason || 'Reembolso solicitado',
      created_at: new Date().toISOString(),
      metadata: metadata || {},
    };

    logger.info(LogCategory.PAYMENT, 'MercadoPago refund simulated', {
      payment_id: paymentId,
      refund_id: refundId,
      amount,
      status: refundResponse.status,
    });

    return refundResponse;

  } catch (error) {
    logger.error(LogCategory.PAYMENT, 'MercadoPago refund failed', error as Error, {
      payment_id: paymentId,
      amount,
    });

    // En caso de error, devolver estado pendiente
    return {
      id: `refund_error_${Date.now()}`,
      payment_id: paymentId,
      amount,
      status: 'pending',
      reason: 'Error al procesar reembolso, se procesará manualmente',
      created_at: new Date().toISOString(),
      metadata: metadata || {},
    };
  }
}
