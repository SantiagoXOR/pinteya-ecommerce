// Configuración para Node.js Runtime
export const runtime = 'nodejs';

// ===================================
// PINTEYA E-COMMERCE - MERCADOPAGO REPORTS API
// ===================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { getSupabaseClient } from '@/lib/integrations/supabase';
import { logger, LogLevel, LogCategory } from '@/lib/enterprise/logger';
import { checkRateLimit, addRateLimitHeaders, RATE_LIMIT_CONFIGS } from '@/lib/enterprise/rate-limiter';
import { metricsCollector } from '@/lib/enterprise/metrics';
import { MercadoPagoReport, ReportMetrics } from '@/types/api';

/**
 * GET /api/payments/reports
 * Obtiene reportes de MercadoPago según documentación oficial
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  try {
    // Verificar autenticación
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Rate limiting
    const rateLimitResult = await checkRateLimit(
      request,
      RATE_LIMIT_CONFIGS.QUERY_API
    );

    if (!rateLimitResult.success) {
      logger.warn(LogCategory.API, 'Rate limit exceeded for reports', {
        clientIP,
        userId,
      });

      const response = NextResponse.json(
        { success: false, error: 'Demasiadas solicitudes' },
        { status: 429 }
      );
      addRateLimitHeaders(response, rateLimitResult, RATE_LIMIT_CONFIGS.QUERY_API);
      return response;
    }

    // Obtener parámetros de consulta
    const url = new URL(request.url);
    const reportType = url.searchParams.get('type') || 'account_money';
    const dateFrom = url.searchParams.get('date_from');
    const dateTo = url.searchParams.get('date_to');
    const includeMetrics = url.searchParams.get('include_metrics') === 'true';

    // Validar parámetros
    if (!['released_money', 'account_money', 'sales_report'].includes(reportType)) {
      return NextResponse.json(
        { success: false, error: 'Tipo de reporte inválido' },
        { status: 400 }
      );
    }

    logger.info(LogCategory.API, 'Reports request started', {
      userId,
      reportType,
      dateFrom,
      dateTo,
      includeMetrics,
      clientIP,
    });

    // Generar reporte
    const reportData = await generateReport(reportType, dateFrom, dateTo, includeMetrics);

    // Registrar métricas
    await metricsCollector.recordRequest(
      '/api/payments/reports',
      'GET',
      200,
      Date.now() - startTime,
      { userId, reportType }
    );

    logger.info(LogCategory.API, 'Reports request completed', {
      userId,
      reportType,
      recordsCount: reportData.records?.length || 0,
      processingTime: Date.now() - startTime,
    });

    const response = NextResponse.json({
      success: true,
      data: reportData,
      timestamp: Date.now(),
      processing_time: Date.now() - startTime,
    });

    addRateLimitHeaders(response, rateLimitResult, RATE_LIMIT_CONFIGS.QUERY_API);
    return response;

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    logger.performance(LogLevel.ERROR, 'Reports request failed', {
      operation: 'reports-api',
      duration: processingTime,
      statusCode: 500,
    }, {
      clientIP,
      userAgent,
    });

    await metricsCollector.recordRequest(
      '/api/payments/reports',
      'GET',
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
 * POST /api/payments/reports
 * Crea un nuevo reporte según documentación oficial de MercadoPago
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const clientIP = request.headers.get('x-forwarded-for') || 'unknown';

  try {
    // Verificar autenticación
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Rate limiting
    const rateLimitResult = await checkRateLimit(
      request,
      RATE_LIMIT_CONFIGS.PAYMENT_API
    );

    if (!rateLimitResult.success) {
      const response = NextResponse.json(
        { success: false, error: 'Demasiadas solicitudes' },
        { status: 429 }
      );
      addRateLimitHeaders(response, rateLimitResult, RATE_LIMIT_CONFIGS.PAYMENT_API);
      return response;
    }

    const body = await request.json();
    const { type, date_from, date_to, columns } = body;

    // Validar datos requeridos
    if (!type || !date_from || !date_to) {
      return NextResponse.json(
        { success: false, error: 'Faltan parámetros requeridos' },
        { status: 400 }
      );
    }

    logger.info(LogCategory.API, 'Report creation started', {
      userId,
      type,
      date_from,
      date_to,
      clientIP,
    });

    // Crear reporte
    const report = await createMercadoPagoReport(type, date_from, date_to, columns);

    // Registrar métricas
    await metricsCollector.recordRequest(
      '/api/payments/reports',
      'POST',
      201,
      Date.now() - startTime,
      { userId, reportType: type }
    );

    logger.info(LogCategory.API, 'Report creation completed', {
      userId,
      reportId: report.id,
      type,
      processingTime: Date.now() - startTime,
    });

    const response = NextResponse.json({
      success: true,
      data: report,
      timestamp: Date.now(),
      processing_time: Date.now() - startTime,
    }, { status: 201 });

    addRateLimitHeaders(response, rateLimitResult, RATE_LIMIT_CONFIGS.PAYMENT_API);
    return response;

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    logger.performance(LogLevel.ERROR, 'Report creation failed', {
      operation: 'report-creation-api',
      duration: processingTime,
      statusCode: 500,
    }, {
      clientIP,
    });

    await metricsCollector.recordRequest(
      '/api/payments/reports',
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
 * Genera reporte basado en datos de Supabase (simulando API de MercadoPago)
 */
async function generateReport(
  type: string,
  dateFrom?: string | null,
  dateTo?: string | null,
  includeMetrics: boolean = false
) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Error de configuración de base de datos');
  }

  // Configurar fechas por defecto (últimos 30 días)
  const endDate = dateTo ? new Date(dateTo) : new Date();
  const startDate = dateFrom ? new Date(dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  let query = supabase
    .from('orders')
    .select(`
      id,
      total_amount,
      status,
      payment_status,
      created_at,
      updated_at,
      order_items (
        quantity,
        unit_price,
        products (
          name,
          category_id
        )
      )
    `)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  // Filtrar según tipo de reporte
  switch (type) {
    case 'released_money':
      query = query.eq('payment_status', 'approved');
      break;
    case 'account_money':
      // Incluir todos los estados
      break;
    case 'sales_report':
      query = query.in('status', ['completed', 'processing']);
      break;
  }

  const { data: orders, error } = await query;

  if (error) {
    throw new Error(`Error al obtener datos: ${error.message}`);
  }

  // Procesar datos según tipo de reporte
  const processedData = processReportData(orders || [], type);
  
  // Calcular métricas si se solicitan
  const metrics = includeMetrics ? calculateReportMetrics(orders || []) : undefined;

  return {
    type,
    date_from: startDate.toISOString(),
    date_to: endDate.toISOString(),
    records: processedData,
    metrics,
    total_records: processedData.length,
    generated_at: new Date().toISOString(),
  };
}

/**
 * Procesa los datos según el tipo de reporte
 */
function processReportData(orders: any[], type: string) {
  return orders.map(order => {
    const baseData = {
      order_id: order.id,
      amount: order.total_amount,
      status: order.payment_status || order.status,
      created_at: order.created_at,
      updated_at: order.updated_at,
    };

    switch (type) {
      case 'released_money':
        return {
          ...baseData,
          release_date: order.updated_at,
          net_amount: order.total_amount * 0.96, // Simular comisión MP
          fee_amount: order.total_amount * 0.04,
        };
      
      case 'account_money':
        return {
          ...baseData,
          transaction_type: 'payment',
          balance_impact: order.payment_status === 'approved' ? order.total_amount : 0,
        };
      
      case 'sales_report':
        return {
          ...baseData,
          items: order.order_items?.map((item: any) => ({
            name: item.products?.name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            category: item.products?.category_id,
          })) || [],
          items_count: order.order_items?.length || 0,
        };
      
      default:
        return baseData;
    }
  });
}

/**
 * Calcula métricas del reporte
 */
function calculateReportMetrics(orders: any[]): ReportMetrics {
  const totalTransactions = orders.length;
  const successfulPayments = orders.filter(o => o.payment_status === 'approved').length;
  const failedPayments = orders.filter(o => o.payment_status === 'rejected').length;
  const totalAmount = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  
  return {
    total_transactions: totalTransactions,
    total_amount: totalAmount,
    successful_payments: successfulPayments,
    failed_payments: failedPayments,
    refunds: 0, // TODO: Implementar cuando se agregue tabla de refunds
    chargebacks: 0, // TODO: Implementar cuando se agregue tabla de chargebacks
    average_ticket: totalTransactions > 0 ? totalAmount / totalTransactions : 0,
    conversion_rate: totalTransactions > 0 ? (successfulPayments / totalTransactions) * 100 : 0,
  };
}

/**
 * Crea un reporte en MercadoPago (simulado)
 */
async function createMercadoPagoReport(
  type: string,
  dateFrom: string,
  dateTo: string,
  columns?: string[]
): Promise<MercadoPagoReport> {
  // En una implementación real, aquí se haría la llamada a la API de MercadoPago
  // Por ahora simulamos la creación del reporte
  
  const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    id: reportId,
    type: type as any,
    date_from: dateFrom,
    date_to: dateTo,
    status: 'pending',
    created_at: new Date().toISOString(),
  };
}










