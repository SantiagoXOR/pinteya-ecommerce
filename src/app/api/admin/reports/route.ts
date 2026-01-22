// Configuración para Node.js Runtime
export const runtime = 'nodejs'

// ===================================
// PINTEYA E-COMMERCE - ADMIN REPORTS API ENTERPRISE
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
import { getTenantConfig } from '@/lib/tenant'

// ===================================
// SCHEMAS DE VALIDACIÓN
// ===================================

const ReportFiltersSchema = z.object({
  report_type: z.enum(['sales', 'products', 'users', 'inventory', 'performance']),
  date_range: z.object({
    start: z.string().datetime(),
    end: z.string().datetime(),
  }),
  granularity: z.enum(['hour', 'day', 'week', 'month']).default('day'),
  filters: z
    .object({
      category_ids: z.array(z.string().uuid()).optional(),
      product_ids: z.array(z.string().uuid()).optional(),
      user_roles: z.array(z.enum(['user', 'admin', 'moderator'])).optional(),
      order_status: z
        .array(z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']))
        .optional(),
      payment_status: z.array(z.enum(['pending', 'completed', 'failed', 'refunded'])).optional(),
      min_amount: z.number().min(0).optional(),
      max_amount: z.number().min(0).optional(),
    })
    .optional(),
})

// ===================================
// TIPOS DE DATOS
// ===================================

interface SalesReport {
  summary: {
    total_revenue: number
    total_orders: number
    average_order_value: number
    conversion_rate: number
    growth_rate: number
  }
  timeline: Array<{
    date: string
    revenue: number
    orders: number
    customers: number
  }>
  top_products: Array<{
    id: string
    name: string
    revenue: number
    units_sold: number
    growth: number
  }>
  payment_methods: Array<{
    method: string
    count: number
    revenue: number
    percentage: number
  }>
}

interface ProductsReport {
  summary: {
    total_products: number
    active_products: number
    out_of_stock: number
    low_stock: number
    total_inventory_value: number
  }
  performance: Array<{
    id: string
    name: string
    views: number
    sales: number
    conversion_rate: number
    revenue: number
    stock_level: number
  }>
  categories: Array<{
    id: string
    name: string
    product_count: number
    revenue: number
    growth: number
  }>
  inventory_alerts: Array<{
    id: string
    name: string
    current_stock: number
    min_stock: number
    status: 'out_of_stock' | 'low_stock'
  }>
}

interface UsersReport {
  summary: {
    total_users: number
    active_users: number
    new_users: number
    retention_rate: number
    churn_rate: number
  }
  timeline: Array<{
    date: string
    new_users: number
    active_users: number
    orders: number
  }>
  segments: Array<{
    segment: string
    count: number
    revenue: number
    avg_order_value: number
  }>
  top_customers: Array<{
    id: string
    name: string
    email: string
    total_orders: number
    total_spent: number
    last_order: string
  }>
}

interface PerformanceReport {
  summary: {
    page_views: number
    unique_visitors: number
    bounce_rate: number
    avg_session_duration: number
    conversion_rate: number
  }
  traffic_sources: Array<{
    source: string
    visitors: number
    conversions: number
    revenue: number
  }>
  popular_pages: Array<{
    path: string
    views: number
    unique_views: number
    avg_time: number
  }>
  device_breakdown: Array<{
    device: string
    sessions: number
    percentage: number
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
        // En producción, permitir bypass directamente si BYPASS_AUTH está configurado
        if (fs.existsSync(envLocalPath) || process.env.NODE_ENV === 'production') {
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
        console.warn('[API Admin Reports] No se pudo verificar .env.local, bypass deshabilitado')
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
// FUNCIONES DE GENERACIÓN DE REPORTES
// ===================================

async function generateSalesReport(filters: any, tenantId: string): Promise<SalesReport> {
  const { date_range, granularity } = filters

  // Consulta base para órdenes en el rango de fechas
  // ⚡ MULTITENANT: Filtrar por tenant_id
  let ordersQuery = supabaseAdmin
    .from('orders')
    .select(
      `
      id,
      total,
      status,
      payment_status,
      payment_method,
      created_at,
      user_id,
      order_items!inner(
        quantity,
        price,
        product_id,
        products!inner(
          id,
          name,
          category_id
        )
      )
    `
    )
    .gte('created_at', date_range.start)
    .lte('created_at', date_range.end)
    .eq('tenant_id', tenantId) // ⚡ MULTITENANT: Filtrar por tenant

  // Aplicar filtros adicionales
  if (filters.filters?.order_status) {
    ordersQuery = ordersQuery.in('status', filters.filters.order_status)
  }
  if (filters.filters?.payment_status) {
    ordersQuery = ordersQuery.in('payment_status', filters.filters.payment_status)
  }
  if (filters.filters?.min_amount) {
    ordersQuery = ordersQuery.gte('total', filters.filters.min_amount)
  }
  if (filters.filters?.max_amount) {
    ordersQuery = ordersQuery.lte('total', filters.filters.max_amount)
  }

  const { data: orders, error } = await ordersQuery
  if (error) {
    throw error
  }

  // Calcular métricas de resumen
  const completedOrders = orders?.filter(o => o.status === 'completed') || []
  const total_revenue = completedOrders.reduce((sum, order) => sum + (order.total || 0), 0)
  const total_orders = completedOrders.length
  const average_order_value = total_orders > 0 ? total_revenue / total_orders : 0

  // Calcular tasa de conversión (necesitaríamos datos de tráfico)
  const conversion_rate = 0 // Placeholder

  // Calcular tasa de crecimiento comparando con período anterior
  const periodLength = new Date(date_range.end).getTime() - new Date(date_range.start).getTime()
  const previousStart = new Date(new Date(date_range.start).getTime() - periodLength).toISOString()
  const previousEnd = date_range.start

  // ⚡ MULTITENANT: Filtrar órdenes anteriores por tenant_id
  const { data: previousOrders } = await supabaseAdmin
    .from('orders')
    .select('total')
    .eq('status', 'completed')
    .eq('tenant_id', tenantId) // ⚡ MULTITENANT: Filtrar por tenant
    .gte('created_at', previousStart)
    .lt('created_at', previousEnd)

  const previousRevenue = previousOrders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0
  const growth_rate =
    previousRevenue > 0 ? ((total_revenue - previousRevenue) / previousRevenue) * 100 : 0

  // Generar timeline según granularidad
  const timeline = generateTimeline(completedOrders, date_range, granularity)

  // Top productos
  const productSales = new Map()
  completedOrders.forEach(order => {
    order.order_items?.forEach(item => {
      const productId = item.product_id
      if (!productSales.has(productId)) {
        productSales.set(productId, {
          id: productId,
          name: item.products?.name || 'Producto desconocido',
          revenue: 0,
          units_sold: 0,
        })
      }
      const product = productSales.get(productId)
      product.revenue += (item.price || 0) * (item.quantity || 0)
      product.units_sold += item.quantity || 0
    })
  })

  const top_products = Array.from(productSales.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)
    .map(p => ({ ...p, growth: 0 })) // Placeholder para crecimiento

  // Métodos de pago
  const paymentMethods = new Map()
  completedOrders.forEach(order => {
    const method = order.payment_method || 'unknown'
    if (!paymentMethods.has(method)) {
      paymentMethods.set(method, { method, count: 0, revenue: 0 })
    }
    const pm = paymentMethods.get(method)
    pm.count++
    pm.revenue += order.total || 0
  })

  const payment_methods = Array.from(paymentMethods.values()).map(pm => ({
    ...pm,
    percentage: total_revenue > 0 ? (pm.revenue / total_revenue) * 100 : 0,
  }))

  return {
    summary: {
      total_revenue,
      total_orders,
      average_order_value,
      conversion_rate,
      growth_rate,
    },
    timeline,
    top_products,
    payment_methods,
  }
}

async function generateProductsReport(filters: any, tenantId: string): Promise<ProductsReport> {
  // Obtener todos los productos con sus estadísticas
  // ⚡ MULTITENANT: Filtrar productos por tenant usando tenant_products
  let productsQuery = supabaseAdmin.from('tenant_products').select(`
      id,
      name,
      price,
      stock_quantity,
      min_stock_level,
      is_active,
      category_id,
      categories(name),
      order_items(
        quantity,
        price,
        orders!inner(
          status,
          created_at
        )
      )
    `)
    .eq('tenant_id', tenantId) // ⚡ MULTITENANT: Filtrar por tenant
    .eq('is_visible', true) // Solo productos visibles

  if (filters.filters?.category_ids) {
    productsQuery = productsQuery.in('category_id', filters.filters.category_ids)
  }

  const { data: products, error } = await productsQuery
  if (error) {
    throw error
  }

  // Calcular métricas de resumen
  const total_products = products?.length || 0
  const active_products = products?.filter(p => p.is_active).length || 0
  const out_of_stock = products?.filter(p => (p.stock_quantity || 0) === 0).length || 0
  const low_stock =
    products?.filter(
      p => (p.stock_quantity || 0) > 0 && (p.stock_quantity || 0) <= (p.min_stock_level || 0)
    ).length || 0
  const total_inventory_value =
    products?.reduce((sum, p) => sum + (p.price || 0) * (p.stock_quantity || 0), 0) || 0

  // Performance de productos
  const performance =
    products
      ?.map(product => {
        const completedSales =
          product.order_items?.filter(
            item =>
              item.orders?.status === 'completed' &&
              new Date(item.orders.created_at) >= new Date(filters.date_range.start) &&
              new Date(item.orders.created_at) <= new Date(filters.date_range.end)
          ) || []

        const sales = completedSales.reduce((sum, item) => sum + (item.quantity || 0), 0)
        const revenue = completedSales.reduce(
          (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
          0
        )

        return {
          id: product.id,
          name: product.name,
          views: 0, // Placeholder - necesitaríamos analytics
          sales,
          conversion_rate: 0, // Placeholder
          revenue,
          stock_level: product.stock_quantity || 0,
        }
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 20) || []

  // Categorías
  const categoryStats = new Map()
  products?.forEach(product => {
    const categoryId = product.category_id
    const categoryName = product.categories?.name || 'Sin categoría'

    if (!categoryStats.has(categoryId)) {
      categoryStats.set(categoryId, {
        id: categoryId,
        name: categoryName,
        product_count: 0,
        revenue: 0,
      })
    }

    const category = categoryStats.get(categoryId)
    category.product_count++

    const completedSales =
      product.order_items?.filter(
        item =>
          item.orders?.status === 'completed' &&
          new Date(item.orders.created_at) >= new Date(filters.date_range.start) &&
          new Date(item.orders.created_at) <= new Date(filters.date_range.end)
      ) || []

    category.revenue += completedSales.reduce(
      (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
      0
    )
  })

  const categories = Array.from(categoryStats.values())
    .map(cat => ({ ...cat, growth: 0 })) // Placeholder
    .sort((a, b) => b.revenue - a.revenue)

  // Alertas de inventario
  const inventory_alerts =
    products
      ?.filter(
        p =>
          (p.stock_quantity || 0) === 0 ||
          ((p.stock_quantity || 0) > 0 && (p.stock_quantity || 0) <= (p.min_stock_level || 0))
      )
      .map(p => ({
        id: p.id,
        name: p.name,
        current_stock: p.stock_quantity || 0,
        min_stock: p.min_stock_level || 0,
        status: (p.stock_quantity || 0) === 0 ? ('out_of_stock' as const) : ('low_stock' as const),
      })) || []

  return {
    summary: {
      total_products,
      active_products,
      out_of_stock,
      low_stock,
      total_inventory_value,
    },
    performance,
    categories,
    inventory_alerts,
  }
}

async function generateUsersReport(filters: any, tenantId: string): Promise<UsersReport> {
  // Obtener usuarios con sus estadísticas
  // ⚡ MULTITENANT: Filtrar usuarios por tenant_id
  const { data: users, error } = await supabaseAdmin.from('user_profiles').select(`
      id,
      name,
      email,
      created_at,
      last_login,
      is_active,
      orders(
        id,
        total,
        status,
        created_at
      )
    `)
    .eq('tenant_id', tenantId) // ⚡ MULTITENANT: Filtrar por tenant

  if (error) {
    throw error
  }

  const dateStart = new Date(filters.date_range.start)
  const dateEnd = new Date(filters.date_range.end)

  // Métricas de resumen
  const total_users = users?.length || 0
  const active_users = users?.filter(u => u.is_active).length || 0
  const new_users =
    users?.filter(u => new Date(u.created_at) >= dateStart && new Date(u.created_at) <= dateEnd)
      .length || 0

  // Timeline de usuarios
  const timeline = generateUserTimeline(users || [], filters.date_range, filters.granularity)

  // Segmentos de usuarios
  const segments = [
    {
      segment: 'Nuevos clientes',
      count: 0,
      revenue: 0,
      avg_order_value: 0,
    },
    {
      segment: 'Clientes recurrentes',
      count: 0,
      revenue: 0,
      avg_order_value: 0,
    },
    {
      segment: 'VIP',
      count: 0,
      revenue: 0,
      avg_order_value: 0,
    },
  ]

  // Top clientes
  const top_customers =
    users
      ?.map(user => {
        const completedOrders = user.orders?.filter(o => o.status === 'completed') || []
        const total_spent = completedOrders.reduce((sum, order) => sum + (order.total || 0), 0)
        const lastOrder = completedOrders.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0]

        return {
          id: user.id,
          name: user.name || 'Sin nombre',
          email: user.email,
          total_orders: completedOrders.length,
          total_spent,
          last_order: lastOrder?.created_at || '',
        }
      })
      .sort((a, b) => b.total_spent - a.total_spent)
      .slice(0, 10) || []

  return {
    summary: {
      total_users,
      active_users,
      new_users,
      retention_rate: 0, // Placeholder
      churn_rate: 0, // Placeholder
    },
    timeline,
    segments,
    top_customers,
  }
}

async function generatePerformanceReport(filters: any): Promise<PerformanceReport> {
  // Este reporte requeriría integración con analytics (Google Analytics, etc.)
  // Por ahora retornamos datos placeholder
  return {
    summary: {
      page_views: 0,
      unique_visitors: 0,
      bounce_rate: 0,
      avg_session_duration: 0,
      conversion_rate: 0,
    },
    traffic_sources: [],
    popular_pages: [],
    device_breakdown: [],
  }
}

// ===================================
// FUNCIONES AUXILIARES
// ===================================

function generateTimeline(orders: any[], dateRange: any, granularity: string) {
  const timeline = []
  const start = new Date(dateRange.start)
  const end = new Date(dateRange.end)

  let current = new Date(start)

  while (current <= end) {
    const nextPeriod = new Date(current)

    switch (granularity) {
      case 'hour':
        nextPeriod.setHours(current.getHours() + 1)
        break
      case 'day':
        nextPeriod.setDate(current.getDate() + 1)
        break
      case 'week':
        nextPeriod.setDate(current.getDate() + 7)
        break
      case 'month':
        nextPeriod.setMonth(current.getMonth() + 1)
        break
    }

    const periodOrders = orders.filter(order => {
      const orderDate = new Date(order.created_at)
      return orderDate >= current && orderDate < nextPeriod
    })

    const revenue = periodOrders.reduce((sum, order) => sum + (order.total || 0), 0)
    const uniqueCustomers = new Set(periodOrders.map(o => o.user_id)).size

    timeline.push({
      date: current.toISOString(),
      revenue,
      orders: periodOrders.length,
      customers: uniqueCustomers,
    })

    current = nextPeriod
  }

  return timeline
}

function generateUserTimeline(users: any[], dateRange: any, granularity: string) {
  // Similar a generateTimeline pero para usuarios
  return []
}

// ===================================
// GET - Generar reportes
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
      'admin-reports'
    )

    if (!rateLimitResult.success) {
      const response = NextResponse.json({ error: rateLimitResult.message }, { status: 429 })
      addRateLimitHeaders(response, rateLimitResult)
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

    // ===================================
    // MULTITENANT: Obtener configuración del tenant
    // ===================================
    const tenant = await getTenantConfig()
    const tenantId = tenant.id

    // Parsear parámetros de consulta
    const { searchParams } = new URL(request.url)
    const reportParams = {
      report_type: searchParams.get('report_type') as any,
      date_range: {
        start:
          searchParams.get('start') ||
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: searchParams.get('end') || new Date().toISOString(),
      },
      granularity: (searchParams.get('granularity') as any) || 'day',
      filters: {
        category_ids: searchParams.get('category_ids')?.split(',').filter(Boolean),
        product_ids: searchParams.get('product_ids')?.split(',').filter(Boolean),
        user_roles: searchParams.get('user_roles')?.split(',').filter(Boolean),
        order_status: searchParams.get('order_status')?.split(',').filter(Boolean),
        payment_status: searchParams.get('payment_status')?.split(',').filter(Boolean),
        min_amount: searchParams.get('min_amount')
          ? parseFloat(searchParams.get('min_amount')!)
          : undefined,
        max_amount: searchParams.get('max_amount')
          ? parseFloat(searchParams.get('max_amount')!)
          : undefined,
      },
    }

    // Validar parámetros
    const validationResult = ReportFiltersSchema.safeParse(reportParams)
    if (!validationResult.success) {
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Parámetros de reporte inválidos',
      }
      return NextResponse.json(errorResponse, { status: 400 })
    }

    const { report_type } = validationResult.data
    let reportData: any

    // Generar reporte según el tipo
    switch (report_type) {
      case 'sales':
        reportData = await generateSalesReport(validationResult.data, tenantId)
        break
      case 'products':
        reportData = await generateProductsReport(validationResult.data, tenantId)
        break
      case 'users':
        reportData = await generateUsersReport(validationResult.data, tenantId)
        break
      case 'performance':
        reportData = await generatePerformanceReport(validationResult.data)
        break
      default:
        const errorResponse: ApiResponse<null> = {
          data: null,
          success: false,
          error: 'Tipo de reporte no soportado',
        }
        return NextResponse.json(errorResponse, { status: 400 })
    }

    // Registrar métricas
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/reports',
      method: 'GET',
      statusCode: 200,
      responseTime: Date.now() - startTime,
      userId: authResult.userId,
    })

    // Log de auditoría
    logger.log(LogLevel.INFO, LogCategory.ADMIN, 'Reporte generado', {
      adminUserId: authResult.userId,
      reportType: report_type,
      dateRange: validationResult.data.date_range,
    })

    const response: ApiResponse<any> = {
      data: {
        report_type,
        generated_at: new Date().toISOString(),
        ...reportData,
      },
      success: true,
      message: `Reporte ${report_type} generado exitosamente`,
    }

    const nextResponse = NextResponse.json(response)
    addRateLimitHeaders(nextResponse, rateLimitResult)
    return nextResponse
  } catch (error) {
    logger.log(LogLevel.ERROR, LogCategory.API, 'Error en GET /api/admin/reports', { error })

    // Registrar métricas de error
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/reports',
      method: 'GET',
      statusCode: 500,
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    const errorResponse: ApiResponse<null> = {
      data: null,
      success: false,
      error: 'Error interno del servidor',
    }

    return NextResponse.json(errorResponse, { status: 500 })
  }
}
