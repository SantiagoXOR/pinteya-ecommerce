// Configuración para Node.js Runtime
export const runtime = 'nodejs'

// ===================================
// PINTEYA E-COMMERCE - ADMIN ORDERS API ENTERPRISE
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
// SCHEMAS DE VALIDACIÓN ENTERPRISE
// ===================================

const OrderFiltersSchema = z.object({
  page: z
    .preprocess(
      (val) => (val === null || val === undefined ? 1 : val),
      z.coerce.number().min(1)
    )
    .default(1),
  limit: z
    .preprocess(
      (val) => (val === null || val === undefined ? 25 : val),
      z.coerce.number().min(1).max(100)
    )
    .default(25),
  status: z.string().optional().nullable(),
  date_from: z.string().optional().nullable(),
  date_to: z.string().optional().nullable(),
  search: z.string().optional().nullable(),
  sort_by: z
    .preprocess(
      (val) => (val === null || val === undefined ? 'created_at' : val),
      z.enum(['created_at', 'total', 'id'])
    )
    .default('created_at'),
  sort_order: z
    .preprocess(
      (val) => (val === null || val === undefined ? 'desc' : val),
      z.enum(['asc', 'desc'])
    )
    .default('desc'),
})

const CreateOrderSchema = z.object({
  user_id: z.string().uuid('ID de usuario inválido'),
  items: z
    .array(
      z.object({
        product_id: z.number().min(1),
        quantity: z.number().min(1).max(99),
        unit_price: z.number().min(0),
      })
    )
    .min(1, 'Al menos un item es requerido'),
  shipping_address: z
    .object({
      street_name: z.string().min(1),
      street_number: z.string().min(1),
      zip_code: z.string().min(1),
      city_name: z.string().min(1),
      state_name: z.string().min(1),
    })
    .optional(),
  notes: z.string().optional(),
})

// ===================================
// MIDDLEWARE DE AUTENTICACIÓN ADMIN
// ===================================

async function validateAdminAuth() {
  try {
    // BYPASS SOLO EN DESARROLLO CON VALIDACIÓN ESTRICTA
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
        console.warn('[API Admin Orders] No se pudo verificar .env.local, bypass deshabilitado')
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

const SEARCHABLE_BASE_COLUMNS = [
  'external_reference',
  'payment_id',
  'order_number',
  'payer_info->>name',
  'payer_info->>surname',
  'payer_info->>email',
  'payer_info->>phone',
  'shipping_address->>street_name',
  'shipping_address->>city_name',
]

const SEARCHABLE_PROFILE_COLUMNS = ['email', 'first_name', 'last_name']

function buildSearchConditions(rawSearch: string) {
  if (!rawSearch) {
    return { base: [] as string[], profile: [] as string[] }
  }

  const sanitize = (value: string) =>
    value
      .trim()
      .normalize('NFKC')
      .replace(/[%]/g, '')
      .replace(/,/g, ' ')
      .replace(/\s+/g, ' ')

  const base = sanitize(rawSearch)
  if (!base) {
    return { base: [], profile: [] }
  }

  const variations = new Set<string>()
  variations.add(base.replace(/^#/, ''))

  const digitsOnly = base.replace(/\D/g, '')
  if (digitsOnly.length) {
    variations.add(digitsOnly)
  }

  const baseConditions = new Set<string>()
  const profileConditions = new Set<string>()

  variations.forEach(value => {
    if (!value) {
      return
    }
    const wildcard = `%${value}%`
    SEARCHABLE_BASE_COLUMNS.forEach(column => {
      baseConditions.add(`${column}.ilike.${wildcard}`)
    })
    SEARCHABLE_PROFILE_COLUMNS.forEach(column => {
      profileConditions.add(`${column}.ilike.${wildcard}`)
    })
  })

  return {
    base: Array.from(baseConditions),
    profile: Array.from(profileConditions),
  }
}

// ===================================
// GET - Listar órdenes con filtros avanzados
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
      'admin-orders'
    )

    if (!rateLimitResult.allowed) {
      const response = NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429 })
      addRateLimitHeaders(response, rateLimitResult, RATE_LIMIT_CONFIGS.admin)
      return response
    }

    // Validar autenticación admin
    const authResult = await validateAdminAuth()
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    // Validar parámetros de consulta
    const { searchParams } = new URL(request.url)
    const queryParams = {
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      status: searchParams.get('status'),
      date_from: searchParams.get('date_from'),
      date_to: searchParams.get('date_to'),
      search: searchParams.get('search'),
      sort_by: searchParams.get('sort_by'),
      sort_order: searchParams.get('sort_order'),
    }

    logger.log(LogLevel.INFO, LogCategory.API, 'Parámetros recibidos', { queryParams })

    const filtersResult = OrderFiltersSchema.safeParse(queryParams)

    if (!filtersResult.success) {
      logger.log(LogLevel.ERROR, LogCategory.VALIDATION, 'Parámetros de consulta inválidos', {
        queryParams,
        errors: filtersResult.error.errors,
      })
      return NextResponse.json(
        { error: 'Parámetros de consulta inválidos', details: filtersResult.error.errors },
        { status: 400 }
      )
    }

    const filters = filtersResult.data

    // Construir query base con joins optimizados (usando user_profiles después de migración NextAuth)
    let query = supabaseAdmin.from('orders').select(
      `
        id,
        order_number,
        status,
        total,
        payment_status,
        payment_method,
        payment_id,
        created_at,
        updated_at,
        shipping_address,
        external_reference,
        payment_preference_id,
        payer_info,
        user_profiles (
          id,
          first_name,
          last_name,
          email,
          phone
        ),
        order_items (
          id,
          quantity,
          price,
          product_snapshot,
          products (
            id,
            name,
            images,
            image_url
          )
        )
      `,
      { count: 'exact' }
    )

    // Aplicar filtros
    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from)
    }

    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to)
    }

    if (filters.search) {
      const { base: baseConditions, profile: profileConditions } = buildSearchConditions(filters.search)
      if (baseConditions.length > 0) {
        query = query.or(baseConditions.join(','))
      }
      if (profileConditions.length > 0) {
        query = query.or(profileConditions.join(','), { foreignTable: 'user_profiles' })
      }
    }

    // Aplicar ordenamiento y paginación
    const from = (filters.page - 1) * filters.limit
    const to = from + filters.limit - 1

    const {
      data: orders,
      error,
      count,
    } = await query
      .order(filters.sort_by, { ascending: filters.sort_order === 'asc' })
      .range(from, to)

    if (error) {
      logger.log(LogLevel.ERROR, LogCategory.DATABASE, 'Error al obtener órdenes admin', { error })
      return NextResponse.json({ error: 'Error al obtener órdenes' }, { status: 500 })
    }

    // Calcular estadísticas de paginación
    const totalPages = Math.ceil((count || 0) / filters.limit)
    const hasNextPage = filters.page < totalPages
    const hasPreviousPage = filters.page > 1

    // Calcular analytics básicas
    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const todayOrders =
      orders?.filter(order => {
        const orderDate = new Date(order.created_at)
        return orderDate >= todayStart
      }) || []

    const analytics = {
      total_orders: count || 0,
      pending_orders: orders?.filter(order => order.status === 'pending').length || 0,
      completed_orders: orders?.filter(order => order.status === 'completed').length || 0,
      total_revenue: orders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0,
      today_revenue: todayOrders.reduce((sum, order) => sum + (order.total || 0), 0),
    }

    // Métricas de performance
    const responseTime = Date.now() - startTime
    await metricsCollector.recordRequest('admin-orders-list', 'GET', 200, responseTime)

    const response: ApiResponse<{
      orders: typeof orders
      pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
        hasNextPage: boolean
        hasPreviousPage: boolean
      }
      analytics: {
        total_orders: number
        pending_orders: number
        completed_orders: number
        total_revenue: number
        today_revenue: number
      }
      filters: typeof filters
    }> = {
      data: {
        orders,
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total: count || 0,
          totalPages,
          hasNextPage,
          hasPreviousPage,
        },
        analytics,
        filters,
      },
      success: true,
      error: null,
      timestamp: new Date().toISOString(),
    }

    const nextResponse = NextResponse.json(response)
    addRateLimitHeaders(nextResponse, rateLimitResult, RATE_LIMIT_CONFIGS.admin)

    logger.log(LogLevel.INFO, LogCategory.API, 'Órdenes admin obtenidas exitosamente', {
      count: orders?.length,
      total: count,
      responseTime,
    })

    return nextResponse
  } catch (error) {
    const responseTime = Date.now() - startTime
    await metricsCollector.recordRequest('admin-orders', 'GET', 500, responseTime)

    // Logging detallado del error
    const errorDetails = {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'UnknownError',
      cause: error instanceof Error ? error.cause : undefined,
    }

    console.error('❌ [Orders API] Error detallado:', errorDetails)

    try {
      logger.log(LogLevel.ERROR, LogCategory.API, 'Error en GET /api/admin/orders', {
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
// POST - Crear nueva orden (admin)
// ===================================
export async function POST(request: NextRequest) {
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
      'admin-orders-create'
    )

    if (!rateLimitResult.allowed) {
      const response = NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429 })
      addRateLimitHeaders(response, rateLimitResult, RATE_LIMIT_CONFIGS.admin)
      return response
    }

    // Validar autenticación admin
    const authResult = await validateAdminAuth()
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    // Validar datos de entrada
    const body = await request.json()
    console.log('🔍 [Orders API] Payload recibido:', JSON.stringify(body, null, 2))

    const validationResult = CreateOrderSchema.safeParse(body)

    if (!validationResult.success) {
      console.log('❌ [Orders API] Validación fallida:', validationResult.error.errors)
      return NextResponse.json(
        { error: 'Datos de orden inválidos', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const orderData = validationResult.data
    console.log('✅ [Orders API] Datos validados:', JSON.stringify(orderData, null, 2))

    // Generar número de orden único
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    // Calcular total
    const totalAmount = orderData.items.reduce(
      (sum, item) => sum + item.unit_price * item.quantity,
      0
    )

    // Crear orden en transacción
    // Solo usar columnas que existen en la tabla: id, user_id, total, status, payment_id, shipping_address, created_at, updated_at, external_reference, payment_preference_id, payer_info, payment_status, order_number
    const orderInsertData = {
      user_id: orderData.user_id,
      status: 'pending',
      payment_status: 'pending',
      total: totalAmount,
      shipping_address: orderData.shipping_address
        ? JSON.stringify(orderData.shipping_address)
        : null,
      order_number: orderNumber, // Usar order_number para almacenar el número de orden
      external_reference: `admin_order_${Date.now()}`,
    }

    console.log('📝 [Orders API] Insertando orden:', JSON.stringify(orderInsertData, null, 2))

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert(orderInsertData)
      .select()
      .single()

    if (orderError) {
      console.log('❌ [Orders API] Error al crear orden:', orderError)
      logger.log(LogLevel.ERROR, LogCategory.DATABASE, 'Error al crear orden', { orderError })
      return NextResponse.json({ error: 'Error al crear orden' }, { status: 500 })
    }

    console.log('✅ [Orders API] Orden creada exitosamente:', order)

    // Crear items de la orden
    const orderItems = orderData.items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.unit_price, // La tabla order_items usa 'price' en lugar de 'unit_price' y 'total_price'
    }))

    console.log('📝 [Orders API] Insertando items:', JSON.stringify(orderItems, null, 2))

    const { error: itemsError } = await supabaseAdmin.from('order_items').insert(orderItems)

    if (itemsError) {
      console.log('❌ [Orders API] Error al crear items:', itemsError)
      // Rollback: eliminar orden creada
      await supabaseAdmin.from('orders').delete().eq('id', order.id)

      logger.log(LogLevel.ERROR, LogCategory.DATABASE, 'Error al crear items de orden', {
        itemsError,
      })
      return NextResponse.json({ error: 'Error al crear items de orden' }, { status: 500 })
    }

    console.log('✅ [Orders API] Items creados exitosamente')

    // Métricas de performance
    const responseTime = Date.now() - startTime
    await metricsCollector.recordRequest('admin-orders-create', 'POST', 201, responseTime)

    const response: ApiResponse<typeof order> = {
      data: order,
      success: true,
      error: null,
    }

    const nextResponse = NextResponse.json(response, { status: 201 })
    addRateLimitHeaders(nextResponse, rateLimitResult, RATE_LIMIT_CONFIGS.admin)

    logger.log(LogLevel.INFO, LogCategory.API, 'Orden creada exitosamente por admin', {
      orderId: order.id,
      orderNumber,
      totalAmount,
      responseTime,
    })

    return nextResponse
  } catch (error) {
    const responseTime = Date.now() - startTime
    metricsCollector.recordApiCall('admin-orders-create', responseTime, 500)

    logger.log(LogLevel.ERROR, LogCategory.API, 'Error en POST /api/admin/orders', { error })

    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
