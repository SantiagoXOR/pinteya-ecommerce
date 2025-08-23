// ===================================
// PINTEYA E-COMMERCE - ADMIN ORDERS ANALYTICS API ENTERPRISE
// ===================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { auth } from '@/auth';
import { ApiResponse } from '@/types/api';
import { z } from 'zod';
import { logger, LogLevel, LogCategory } from '@/lib/logger';
import { checkRateLimit, addRateLimitHeaders, RATE_LIMIT_CONFIGS } from '@/lib/rate-limiter';
import { metricsCollector } from '@/lib/metrics';

// ===================================
// SCHEMAS DE VALIDACIÓN
// ===================================

const AnalyticsFiltersSchema = z.object({
  period: z.enum(['today', 'week', 'month', 'quarter', 'year', 'custom']).default('month'),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  group_by: z.enum(['day', 'week', 'month']).default('day'),
  include_details: z.boolean().default(false),
});

// ===================================
// MIDDLEWARE DE AUTENTICACIÓN ADMIN
// ===================================

async function validateAdminAuth() {
  try {
    const session = await auth();
    if (!session?.user) {
      return { error: 'Usuario no autenticado', status: 401 };
    }

    const user = session?.user;
    if (!session?.user) {
      return { error: 'Usuario no encontrado', status: 401 };
    }

    // Verificar si es admin
    const isAdmin = session.user.email === 'santiago@xor.com.ar';
    if (!isAdmin) {
      return { error: 'Acceso denegado - Se requieren permisos de administrador', status: 403 };
    }

    return { user: session.user, userId: session.user.id };
  } catch (error) {
    logger.log(LogLevel.ERROR, LogCategory.AUTH, 'Error en validación admin', { error });
    return { error: 'Error de autenticación', status: 500 };
  }
}

// ===================================
// UTILIDADES DE FECHAS
// ===================================

function getDateRange(period: string, customFrom?: string, customTo?: string) {
  const now = new Date();
  let startDate: Date;
  let endDate = now;

  switch (period) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'quarter':
      const quarterStart = Math.floor(now.getMonth() / 3) * 3;
      startDate = new Date(now.getFullYear(), quarterStart, 1);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    case 'custom':
      startDate = customFrom ? new Date(customFrom) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      endDate = customTo ? new Date(customTo) : now;
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  };
}

// ===================================
// GET - Obtener analytics de órdenes
// ===================================
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Rate limiting
    const rateLimitResult = await checkRateLimit(
      request,
      RATE_LIMIT_CONFIGS.admin.requests,
      RATE_LIMIT_CONFIGS.admin.window,
      'admin-orders-analytics'
    );

    if (!rateLimitResult.success) {
      const response = NextResponse.json(
        { error: 'Demasiadas solicitudes' },
        { status: 429 }
      );
      addRateLimitHeaders(response, rateLimitResult);
      return response;
    }

    // Validar autenticación admin
    const authResult = await validateAdminAuth();
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    // Validar parámetros de consulta
    const { searchParams } = new URL(request.url);
    const filtersResult = AnalyticsFiltersSchema.safeParse({
      period: searchParams.get('period'),
      date_from: searchParams.get('date_from'),
      date_to: searchParams.get('date_to'),
      group_by: searchParams.get('group_by'),
      include_details: searchParams.get('include_details') === 'true',
    });

    if (!filtersResult.success) {
      return NextResponse.json(
        { error: 'Parámetros de analytics inválidos', details: filtersResult.error.errors },
        { status: 400 }
      );
    }

    const filters = filtersResult.data;
    const { startDate, endDate } = getDateRange(filters.period, filters.date_from, filters.date_to);

    // Obtener métricas generales
    const [
      totalOrdersResult,
      revenueResult,
      statusDistributionResult,
      topProductsResult,
      dailyTrendsResult
    ] = await Promise.all([
      // Total de órdenes
      supabaseAdmin
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startDate)
        .lte('created_at', endDate),

      // Revenue total y promedio
      supabaseAdmin
        .from('orders')
        .select('total_amount')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .neq('status', 'cancelled'),

      // Distribución por estados
      supabaseAdmin
        .from('orders')
        .select('status')
        .gte('created_at', startDate)
        .lte('created_at', endDate),

      // Productos más vendidos
      supabaseAdmin
        .from('order_items')
        .select(`
          quantity,
          total_price,
          products (
            id,
            name,
            images
          ),
          orders!inner (
            created_at
          )
        `)
        .gte('orders.created_at', startDate)
        .lte('orders.created_at', endDate),

      // Tendencias diarias
      supabaseAdmin.rpc('get_daily_order_trends', {
        start_date: startDate,
        end_date: endDate
      }).catch(() => ({ data: null, error: { message: 'RPC function not available' } }))
    ]);

    // Procesar métricas generales
    const totalOrders = totalOrdersResult.count || 0;
    
    const revenue = revenueResult.data?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
    const averageOrderValue = totalOrders > 0 ? revenue / totalOrders : 0;

    // Procesar distribución por estados
    const statusDistribution = statusDistributionResult.data?.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // Procesar productos más vendidos
    const productSales = topProductsResult.data?.reduce((acc, item) => {
      const productId = item.products?.id;
      if (productId) {
        if (!acc[productId]) {
          acc[productId] = {
            product: item.products,
            total_quantity: 0,
            total_revenue: 0,
          };
        }
        acc[productId].total_quantity += item.quantity;
        acc[productId].total_revenue += item.total_price;
      }
      return acc;
    }, {} as Record<string, any>) || {};

    const topProducts = Object.values(productSales)
      .sort((a: any, b: any) => b.total_quantity - a.total_quantity)
      .slice(0, 10);

    // Calcular métricas de crecimiento (comparar con período anterior)
    const previousPeriodStart = new Date(new Date(startDate).getTime() - (new Date(endDate).getTime() - new Date(startDate).getTime()));
    const { data: previousPeriodOrders } = await supabaseAdmin
      .from('orders')
      .select('total_amount')
      .gte('created_at', previousPeriodStart.toISOString())
      .lt('created_at', startDate)
      .neq('status', 'cancelled');

    const previousRevenue = previousPeriodOrders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
    const revenueGrowth = previousRevenue > 0 ? ((revenue - previousRevenue) / previousRevenue) * 100 : 0;

    // Métricas de performance
    const responseTime = Date.now() - startTime;
    metricsCollector.recordApiCall('admin-orders-analytics', responseTime, 200);

    const response: ApiResponse<{
      summary: {
        total_orders: number;
        total_revenue: number;
        average_order_value: number;
        revenue_growth_percentage: number;
        period: {
          start_date: string;
          end_date: string;
          period_type: string;
        };
      };
      status_distribution: Record<string, number>;
      top_products: typeof topProducts;
      daily_trends: any;
      filters: typeof filters;
    }> = {
      data: {
        summary: {
          total_orders: totalOrders,
          total_revenue: revenue,
          average_order_value: averageOrderValue,
          revenue_growth_percentage: revenueGrowth,
          period: {
            start_date: startDate,
            end_date: endDate,
            period_type: filters.period,
          },
        },
        status_distribution: statusDistribution,
        top_products: topProducts,
        daily_trends: dailyTrendsResult.data || [],
        filters,
      },
      success: true,
      error: null,
    };

    const nextResponse = NextResponse.json(response);
    addRateLimitHeaders(nextResponse, rateLimitResult);

    logger.log(LogLevel.INFO, LogCategory.API, 'Analytics de órdenes obtenidas exitosamente', {
      period: filters.period,
      totalOrders,
      revenue,
      responseTime,
    });

    return nextResponse;

  } catch (error) {
    const responseTime = Date.now() - startTime;
    metricsCollector.recordApiCall('admin-orders-analytics', responseTime, 500);
    
    logger.log(LogLevel.ERROR, LogCategory.API, 'Error en GET /api/admin/orders/analytics', { error });
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// ===================================
// POST - Generar reporte personalizado
// ===================================
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Validar autenticación admin
    const authResult = await validateAdminAuth();
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const body = await request.json();
    const { report_type, filters, format = 'json' } = body;

    // Validar tipo de reporte
    const validReportTypes = ['sales_summary', 'customer_analysis', 'product_performance', 'status_timeline'];
    if (!validReportTypes.includes(report_type)) {
      return NextResponse.json(
        { error: `Tipo de reporte inválido. Tipos válidos: ${validReportTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Generar reporte según el tipo
    let reportData;
    switch (report_type) {
      case 'sales_summary':
        reportData = await generateSalesSummaryReport(filters);
        break;
      case 'customer_analysis':
        reportData = await generateCustomerAnalysisReport(filters);
        break;
      case 'product_performance':
        reportData = await generateProductPerformanceReport(filters);
        break;
      case 'status_timeline':
        reportData = await generateStatusTimelineReport(filters);
        break;
      default:
        return NextResponse.json(
          { error: 'Tipo de reporte no implementado' },
          { status: 501 }
        );
    }

    // Métricas de performance
    const responseTime = Date.now() - startTime;
    metricsCollector.recordApiCall('admin-orders-custom-report', responseTime, 200);

    const response: ApiResponse<{
      report_type: string;
      generated_at: string;
      data: any;
      filters: any;
    }> = {
      data: {
        report_type,
        generated_at: new Date().toISOString(),
        data: reportData,
        filters,
      },
      success: true,
      error: null,
    };

    logger.log(LogLevel.INFO, LogCategory.API, 'Reporte personalizado generado', {
      reportType: report_type,
      format,
      responseTime,
    });

    return NextResponse.json(response);

  } catch (error) {
    const responseTime = Date.now() - startTime;
    metricsCollector.recordApiCall('admin-orders-custom-report', responseTime, 500);
    
    logger.log(LogLevel.ERROR, LogCategory.API, 'Error en POST /api/admin/orders/analytics', { error });
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// ===================================
// FUNCIONES DE GENERACIÓN DE REPORTES
// ===================================

async function generateSalesSummaryReport(filters: any) {
  // TODO: Implementar reporte de resumen de ventas
  return { message: 'Sales summary report - To be implemented' };
}

async function generateCustomerAnalysisReport(filters: any) {
  // TODO: Implementar análisis de clientes
  return { message: 'Customer analysis report - To be implemented' };
}

async function generateProductPerformanceReport(filters: any) {
  // TODO: Implementar reporte de performance de productos
  return { message: 'Product performance report - To be implemented' };
}

async function generateStatusTimelineReport(filters: any) {
  // TODO: Implementar timeline de estados
  return { message: 'Status timeline report - To be implemented' };
}
