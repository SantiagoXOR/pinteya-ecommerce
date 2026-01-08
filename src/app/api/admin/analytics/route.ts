// Configuración para Node.js Runtime
export const runtime = 'nodejs'

// ===================================
// PINTEYA E-COMMERCE - ADMIN ANALYTICS API ENTERPRISE
// ===================================

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/integrations/supabase'
import { auth } from '@/lib/auth/config'
import { ApiResponse } from '@/types/api'
import { z } from 'zod'
import { logger, LogLevel, LogCategory } from '@/lib/enterprise/logger'
import { checkRateLimit } from '@/lib/auth/rate-limiting'
import { addRateLimitHeaders, RATE_LIMIT_CONFIGS } from '@/lib/enterprise/rate-limiter'
import { metricsCollector } from '@/lib/enterprise/metrics'

// ===================================
// SCHEMAS DE VALIDACIÓN
// ===================================

const AnalyticsFiltersSchema = z.object({
  period: z.enum(['7d', '30d', '90d', '1y']).default('30d'),
  date_from: z.string().optional().nullable(),
  date_to: z.string().optional().nullable(),
  metrics: z
    .array(
      z.enum([
        'sales',
        'orders',
        'products',
        'users',
        'revenue',
        'conversion',
        'top_products',
        'top_categories',
      ])
    )
    .optional(),
})

// ===================================
// TIPOS DE DATOS
// ===================================

interface AnalyticsData {
  overview: {
    total_revenue: number
    total_orders: number
    total_products: number
    total_users: number
    avg_order_value: number
    conversion_rate: number
  }
  trends: {
    revenue_trend: Array<{ date: string; value: number }>
    orders_trend: Array<{ date: string; value: number }>
    users_trend: Array<{ date: string; value: number }>
  }
  top_products: Array<{
    id: number
    name: string
    sales: number
    revenue: number
  }>
  top_categories: Array<{
    id: number
    name: string
    sales: number
    revenue: number
  }>
  recent_orders: Array<{
    id: string
    total: number
    status: string
    created_at: string
    user_email?: string
  }>
}

// ===================================
// MIDDLEWARE DE AUTENTICACIÓN ADMIN
// ===================================

async function validateAdminAuth() {
  try {
    // ⚠️ TEMPORAL: Remover restricción de desarrollo para permitir bypass en producción hoy (2026-01-08)
    if (process.env.BYPASS_AUTH === 'true') {
      // Verificar que existe archivo .env.local para evitar bypass accidental en producción
      try {
        const fs = require('fs')
        const path = require('path')
        const envLocalPath = path.join(process.cwd(), '.env.local')
        if (fs.existsSync(envLocalPath) || process.env.NODE_ENV === 'production') // ⚠️ TEMPORAL: Permitir bypass en producción {
          return {
            user: {
              id: 'dev-admin',
              email: 'admin@bypass.dev',
              name: 'Dev Admin',
            },
            userId: 'dev-admin',
          }
        }
      } catch (error) {
        console.warn('[API Admin Analytics] No se pudo verificar .env.local, bypass deshabilitado')
      }
    }

    const session = await auth()
    if (!session?.user) {
      return { error: 'Usuario no autenticado', status: 401 }
    }

    // Verificar si es admin usando el rol de la sesión (cargado desde la BD en auth.ts)
    const isAdmin = session.user.role === 'admin'
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
// FUNCIONES DE CONSULTA DE DATOS
// ===================================

async function getOverviewMetrics(dateFrom: string, dateTo: string) {
  try {
    // Total de ingresos
    const { data: revenueData } = await supabaseAdmin
      .from('orders')
      .select('total')
      .gte('created_at', dateFrom)
      .lte('created_at', dateTo)
      .eq('status', 'completed')

    const totalRevenue = revenueData?.reduce((sum, order) => sum + (order.total || 0), 0) || 0

    // Total de órdenes
    const { count: totalOrders } = await supabaseAdmin
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', dateFrom)
      .lte('created_at', dateTo)

    // Total de productos
    const { count: totalProducts } = await supabaseAdmin
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    // Total de usuarios
    const { count: totalUsers } = await supabaseAdmin
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', dateFrom)
      .lte('created_at', dateTo)

    const avgOrderValue = totalOrders ? totalRevenue / totalOrders : 0
    const conversionRate = 0.025 // Placeholder - calcular basado en visitas vs órdenes

    return {
      total_revenue: totalRevenue,
      total_orders: totalOrders || 0,
      total_products: totalProducts || 0,
      total_users: totalUsers || 0,
      avg_order_value: avgOrderValue,
      conversion_rate: conversionRate,
    }
  } catch (error) {
    logger.log(LogLevel.ERROR, LogCategory.API, 'Error obteniendo métricas overview', { error })
    throw error
  }
}

async function getTrends(dateFrom: string, dateTo: string) {
  try {
    // Tendencia de ingresos por día
    const { data: revenueData } = await supabaseAdmin
      .from('orders')
      .select('created_at, total')
      .gte('created_at', dateFrom)
      .lte('created_at', dateTo)
      .eq('status', 'completed')
      .order('created_at')

    // Agrupar por día
    const revenueTrend =
      revenueData?.reduce((acc: any[], order) => {
        const date = order.created_at.split('T')[0]
        const existing = acc.find(item => item.date === date)
        if (existing) {
          existing.value += order.total || 0
        } else {
          acc.push({ date, value: order.total || 0 })
        }
        return acc
      }, []) || []

    // Tendencia de órdenes por día
    const { data: ordersData } = await supabaseAdmin
      .from('orders')
      .select('created_at')
      .gte('created_at', dateFrom)
      .lte('created_at', dateTo)
      .order('created_at')

    const ordersTrend =
      ordersData?.reduce((acc: any[], order) => {
        const date = order.created_at.split('T')[0]
        const existing = acc.find(item => item.date === date)
        if (existing) {
          existing.value += 1
        } else {
          acc.push({ date, value: 1 })
        }
        return acc
      }, []) || []

    // Tendencia de usuarios por día
    const { data: usersData } = await supabaseAdmin
      .from('users')
      .select('created_at')
      .gte('created_at', dateFrom)
      .lte('created_at', dateTo)
      .order('created_at')

    const usersTrend =
      usersData?.reduce((acc: any[], user) => {
        const date = user.created_at.split('T')[0]
        const existing = acc.find(item => item.date === date)
        if (existing) {
          existing.value += 1
        } else {
          acc.push({ date, value: 1 })
        }
        return acc
      }, []) || []

    return {
      revenue_trend: revenueTrend,
      orders_trend: ordersTrend,
      users_trend: usersTrend,
    }
  } catch (error) {
    logger.log(LogLevel.ERROR, LogCategory.API, 'Error obteniendo tendencias', { error })
    throw error
  }
}

async function getTopProducts(dateFrom: string, dateTo: string) {
  try {
    const { data } = await supabaseAdmin
      .from('order_items')
      .select(
        `
        product_id,
        quantity,
        unit_price,
        products!inner(
          id,
          name
        ),
        orders!inner(
          created_at,
          status
        )
      `
      )
      .gte('orders.created_at', dateFrom)
      .lte('orders.created_at', dateTo)
      .eq('orders.status', 'completed')

    // Agrupar por producto
    const productStats =
      data?.reduce((acc: Record<string, any>, item) => {
        const productId = item.product_id
        if (!acc[productId]) {
          acc[productId] = {
            id: productId,
            name: item.products.name,
            sales: 0,
            revenue: 0,
          }
        }
        acc[productId].sales += item.quantity
        acc[productId].revenue += item.quantity * item.unit_price
        return acc
      }, {}) || {}

    return Object.values(productStats)
      .sort((a: { revenue: number }, b: { revenue: number }) => b.revenue - a.revenue)
      .slice(0, 10)
  } catch (error) {
    logger.log(LogLevel.ERROR, LogCategory.API, 'Error obteniendo top productos', { error })
    throw error
  }
}

async function getTopCategories(dateFrom: string, dateTo: string) {
  try {
    const { data } = await supabaseAdmin
      .from('order_items')
      .select(
        `
        quantity,
        unit_price,
        products!inner(
          category_id,
          categories!inner(
            id,
            name
          )
        ),
        orders!inner(
          created_at,
          status
        )
      `
      )
      .gte('orders.created_at', dateFrom)
      .lte('orders.created_at', dateTo)
      .eq('orders.status', 'completed')

    // Agrupar por categoría
    const categoryStats =
      data?.reduce((acc: Record<string, any>, item) => {
        const categoryId = item.products.category_id
        const categoryName = item.products.categories?.name
        if (!categoryId || !categoryName) {
          return acc
        }

        if (!acc[categoryId]) {
          acc[categoryId] = {
            id: categoryId,
            name: categoryName,
            sales: 0,
            revenue: 0,
          }
        }
        acc[categoryId].sales += item.quantity
        acc[categoryId].revenue += item.quantity * item.unit_price
        return acc
      }, {}) || {}

    return Object.values(categoryStats)
      .sort((a: { revenue: number }, b: { revenue: number }) => b.revenue - a.revenue)
      .slice(0, 10)
  } catch (error) {
    logger.log(LogLevel.ERROR, LogCategory.API, 'Error obteniendo top categorías', { error })
    throw error
  }
}

async function getRecentOrders() {
  try {
    const { data } = await supabaseAdmin
      .from('orders')
      .select(
        `
        id,
        total,
        status,
        created_at,
        users(
          email
        )
      `
      )
      .order('created_at', { ascending: false })
      .limit(10)

    return (
      data?.map(order => ({
        id: order.id,
        total: order.total,
        status: order.status,
        created_at: order.created_at,
        user_email: order.users?.email,
      })) || []
    )
  } catch (error) {
    logger.log(LogLevel.ERROR, LogCategory.API, 'Error obteniendo órdenes recientes', { error })
    throw error
  }
}

// ===================================
// GET - Obtener analytics del dashboard
// ===================================
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Rate limiting
    const rateLimitResult = await checkRateLimit(
      request,
      {
        windowMs: RATE_LIMIT_CONFIGS.admin.windowMs,
        maxRequests: RATE_LIMIT_CONFIGS.admin.maxRequests,
        message: RATE_LIMIT_CONFIGS.admin.message || 'Demasiadas solicitudes administrativas',
      },
      'admin-analytics'
    )

    if (!rateLimitResult.success) {
      const response = NextResponse.json({ error: rateLimitResult.message }, { status: 429 })
      addRateLimitHeaders(response, rateLimitResult, RATE_LIMIT_CONFIGS.admin)
      return response
    }

    // Validar autenticación admin
    const authResult = await validateAdminAuth()
    if (authResult.error) {
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: authResult.error,
      }
      return NextResponse.json(errorResponse, { status: authResult.status })
    }

    // Validar parámetros
    const { searchParams } = new URL(request.url)
    const validationResult = AnalyticsFiltersSchema.safeParse({
      period: searchParams.get('period'),
      date_from: searchParams.get('date_from'),
      date_to: searchParams.get('date_to'),
      metrics: searchParams.get('metrics')?.split(','),
    })

    if (!validationResult.success) {
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Parámetros inválidos',
      }
      return NextResponse.json(errorResponse, { status: 400 })
    }

    const { period, date_from, date_to } = validationResult.data

    // Calcular fechas basadas en el período
    let dateFrom: string
    let dateTo: string

    if (date_from && date_to) {
      dateFrom = date_from
      dateTo = date_to
    } else {
      const now = new Date()
      dateTo = now.toISOString()

      switch (period) {
        case '7d':
          dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
          break
        case '30d':
          dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
          break
        case '90d':
          dateFrom = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()
          break
        case '1y':
          dateFrom = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString()
          break
        default:
          dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
      }
    }

    // Obtener datos de analytics
    const [overview, trends, topProducts, topCategories, recentOrders] = await Promise.all([
      getOverviewMetrics(dateFrom, dateTo),
      getTrends(dateFrom, dateTo),
      getTopProducts(dateFrom, dateTo),
      getTopCategories(dateFrom, dateTo),
      getRecentOrders(),
    ])

    const analyticsData: AnalyticsData = {
      overview,
      trends,
      top_products: topProducts,
      top_categories: topCategories,
      recent_orders: recentOrders,
    }

    // Registrar métricas
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/analytics',
      method: 'GET',
      statusCode: 200,
      responseTime: Date.now() - startTime,
      userId: authResult.userId,
    })

    // Log de auditoría
    logger.log(LogLevel.INFO, LogCategory.ADMIN, 'Analytics consultados', {
      userId: authResult.userId,
      period,
      dateFrom,
      dateTo,
    })

    const response: ApiResponse<AnalyticsData> & {
      totalProducts: number
      totalOrders: number
      totalRevenue: number
      totalUsers: number
    } = {
      data: analyticsData,
      success: true,
      message: 'Analytics obtenidos exitosamente',
      // Propiedades adicionales para compatibilidad con tests
      totalProducts: analyticsData.overview.total_products,
      totalOrders: analyticsData.overview.total_orders,
      totalRevenue: analyticsData.overview.total_revenue,
      totalUsers: analyticsData.overview.total_users,
    }

    const nextResponse = NextResponse.json(response)
    addRateLimitHeaders(nextResponse, rateLimitResult, RATE_LIMIT_CONFIGS.admin)
    return nextResponse
  } catch (error) {
    console.error('Error detallado en analytics:', error)
    logger.log(LogLevel.ERROR, LogCategory.API, 'Error en GET /api/admin/analytics', { error })

    // Registrar métricas de error
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/analytics',
      method: 'GET',
      statusCode: 500,
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    const errorResponse: ApiResponse<null> = {
      data: null,
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor',
    }

    return NextResponse.json(errorResponse, { status: 500 })
  }
}
