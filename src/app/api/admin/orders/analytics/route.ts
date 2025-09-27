// Configuración para Node.js Runtime
export const runtime = 'nodejs'

// ===================================
// PINTEYA E-COMMERCE - ADMIN ORDERS ANALYTICS API ENTERPRISE
// ===================================

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/integrations/supabase'
import { auth } from '@/lib/auth/config'
import { ApiResponse } from '@/types/api'
import { z } from 'zod'
import { logger, LogLevel, LogCategory } from '@/lib/enterprise/logger'
import { checkRateLimit, type RateLimitResult } from '@/lib/auth/rate-limiting'
import { addRateLimitHeaders, RATE_LIMIT_CONFIGS } from '@/lib/enterprise/rate-limiter'
import { metricsCollector } from '@/lib/enterprise/metrics'

// ===================================
// SCHEMAS DE VALIDACIÓN
// ===================================

const AnalyticsFiltersSchema = z.object({
  period: z.enum(['today', 'week', 'month', 'quarter', 'year', 'custom']).default('month'),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  group_by: z.enum(['day', 'week', 'month']).default('day'),
  include_details: z.boolean().default(false),
})

// ===================================
// MIDDLEWARE DE AUTENTICACIÓN ADMIN
// ===================================

async function validateAdminAuth() {
  try {
    const session = await auth()
    if (!session?.user) {
      return { error: 'Usuario no autenticado', status: 401 }
    }

    const user = session.user

    // Verificar si es admin
    const isAdmin = session.user.email === 'santiago@xor.com.ar'
    if (!isAdmin) {
      return { error: 'Acceso denegado - Se requieren permisos de administrador', status: 403 }
    }

    return { user: session.user, userId: session.user.id }
  } catch (error) {
    logger.log(LogLevel.ERROR, LogCategory.AUTH, 'Error en validación admin', { error })
    return { error: 'Error de autenticación', status: 500 }
  }
}

// ===================================
// UTILIDADES DE FECHAS
// ===================================

function getDateRange(period: string, customFrom?: string, customTo?: string) {
  const now = new Date()
  let startDate: Date
  let endDate = now

  switch (period) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      break
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      break
    case 'quarter':
      const quarterStart = Math.floor(now.getMonth() / 3) * 3
      startDate = new Date(now.getFullYear(), quarterStart, 1)
      break
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1)
      break
    case 'custom':
      startDate = customFrom
        ? new Date(customFrom)
        : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      endDate = customTo ? new Date(customTo) : now
      break
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
  }

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  }
}

// ===================================
// GET - Obtener analytics de órdenes
// ===================================
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Rate limiting
    const rateLimitResult = await checkRateLimit(
      request,
      {
        maxRequests: RATE_LIMIT_CONFIGS.admin.requests,
        windowMs: RATE_LIMIT_CONFIGS.admin.window,
      },
      'admin-orders-analytics'
    )

    if (!rateLimitResult.allowed) {
      const response = NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429 })
      addRateLimitHeaders(response, rateLimitResult, {
        maxRequests: RATE_LIMIT_CONFIGS.admin.requests,
        windowMs: RATE_LIMIT_CONFIGS.admin.window,
        standardHeaders: true,
        legacyHeaders: false,
      })
      return response
    }

    // Validar autenticación admin
    const authResult = await validateAdminAuth()
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    // Validar parámetros de consulta
    const { searchParams } = new URL(request.url)
    const filtersResult = AnalyticsFiltersSchema.safeParse({
      period: searchParams.get('period'),
      date_from: searchParams.get('date_from'),
      date_to: searchParams.get('date_to'),
      group_by: searchParams.get('group_by'),
      include_details: searchParams.get('include_details') === 'true',
    })

    if (!filtersResult.success) {
      return NextResponse.json(
        { error: 'Parámetros de analytics inválidos', details: filtersResult.error.errors },
        { status: 400 }
      )
    }

    const filters = filtersResult.data
    const { startDate, endDate } = getDateRange(filters.period, filters.date_from, filters.date_to)

    // Obtener métricas básicas de prueba
    const totalOrdersResult = await supabaseAdmin
      .from('orders')
      .select('id', { count: 'exact', head: true })

    const totalOrders = totalOrdersResult.count || 0

    // Datos simplificados para prueba
    const revenue = 0
    const averageOrderValue = 0
    const statusDistribution = {}
    const topProducts: any[] = []
    const revenueGrowth = 0

    // Métricas de performance
    const responseTime = Date.now() - startTime
    try {
      metricsCollector.recordApiCall('admin-orders-analytics', responseTime, 200)
    } catch (error) {
      // Ignorar errores de métricas en desarrollo
      console.warn('Metrics collection failed:', error)
    }

    const response: ApiResponse<{
      summary: {
        total_orders: number
        total_revenue: number
        average_order_value: number
        revenue_growth_percentage: number
        period: {
          start_date: string
          end_date: string
          period_type: string
        }
      }
      status_distribution: Record<string, number>
      top_products: typeof topProducts
      daily_trends: any
      filters: typeof filters
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
        daily_trends: [],
        filters,
      },
      success: true,
      error: null,
    }

    const nextResponse = NextResponse.json(response)
    addRateLimitHeaders(nextResponse, rateLimitResult, {
      maxRequests: RATE_LIMIT_CONFIGS.admin.requests,
      windowMs: RATE_LIMIT_CONFIGS.admin.window,
      standardHeaders: true,
      legacyHeaders: false,
    })

    logger.log(LogLevel.INFO, LogCategory.API, 'Analytics de órdenes obtenidas exitosamente', {
      period: filters.period,
      totalOrders,
      revenue,
      responseTime,
    })

    return nextResponse
  } catch (error) {
    const responseTime = Date.now() - startTime

    // Logging detallado del error
    const errorDetails = {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'UnknownError',
      cause: error instanceof Error ? error.cause : undefined,
    }

    console.error('❌ [Orders Analytics API] Error detallado:', errorDetails)

    try {
      await metricsCollector.recordRequest('admin-orders-analytics', 'GET', 500, responseTime)
    } catch (metricsError) {
      // Ignorar errores de métricas en desarrollo
      console.warn('Metrics collection failed:', metricsError)
    }

    try {
      logger.log(LogLevel.ERROR, LogCategory.API, 'Error en GET /api/admin/orders/analytics', {
        error: errorDetails,
        timestamp: new Date().toISOString(),
      })
    } catch (logError) {
      // Ignorar errores de logging en desarrollo
      console.error('Logging failed:', logError)
    }

    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: errorDetails.message,
        debug: process.env.NODE_ENV === 'development' ? errorDetails : undefined,
      },
      { status: 500 }
    )
  }
}

// ===================================
// POST - Generar reporte personalizado
// ===================================
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Validar autenticación admin
    const authResult = await validateAdminAuth()
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const body = await request.json()
    const { report_type, filters, format = 'json' } = body

    // Validar tipo de reporte
    const validReportTypes = [
      'sales_summary',
      'customer_analysis',
      'product_performance',
      'status_timeline',
    ]
    if (!validReportTypes.includes(report_type)) {
      return NextResponse.json(
        { error: `Tipo de reporte inválido. Tipos válidos: ${validReportTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Generar reporte según el tipo
    let reportData
    switch (report_type) {
      case 'sales_summary':
        reportData = await generateSalesSummaryReport(filters)
        break
      case 'customer_analysis':
        reportData = await generateCustomerAnalysisReport(filters)
        break
      case 'product_performance':
        reportData = await generateProductPerformanceReport(filters)
        break
      case 'status_timeline':
        reportData = await generateStatusTimelineReport(filters)
        break
      default:
        return NextResponse.json({ error: 'Tipo de reporte no implementado' }, { status: 501 })
    }

    // Métricas de performance
    const responseTime = Date.now() - startTime
    metricsCollector.recordApiCall('admin-orders-custom-report', responseTime, 200)

    const response: ApiResponse<{
      report_type: string
      generated_at: string
      data: any
      filters: any
    }> = {
      data: {
        report_type,
        generated_at: new Date().toISOString(),
        data: reportData,
        filters,
      },
      success: true,
      error: null,
    }

    logger.log(LogLevel.INFO, LogCategory.API, 'Reporte personalizado generado', {
      reportType: report_type,
      format,
      responseTime,
    })

    return NextResponse.json(response)
  } catch (error) {
    const responseTime = Date.now() - startTime
    metricsCollector.recordApiCall('admin-orders-custom-report', responseTime, 500)

    logger.log(LogLevel.ERROR, LogCategory.API, 'Error en POST /api/admin/orders/analytics', {
      error,
    })

    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// ===================================
// FUNCIONES DE GENERACIÓN DE REPORTES
// ===================================

async function generateSalesSummaryReport(filters: any) {
  // TODO: Implementar reporte de resumen de ventas
  return { message: 'Sales summary report - To be implemented' }
}

async function generateCustomerAnalysisReport(filters: any) {
  // TODO: Implementar análisis de clientes
  return { message: 'Customer analysis report - To be implemented' }
}

async function generateProductPerformanceReport(filters: any) {
  // TODO: Implementar reporte de performance de productos
  return { message: 'Product performance report - To be implemented' }
}

async function generateStatusTimelineReport(filters: any) {
  // TODO: Implementar timeline de estados
  return { message: 'Status timeline report - To be implemented' }
}
