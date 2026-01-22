// Configuración para Node.js Runtime
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@/lib/auth/config'
import { checkRateLimit, addRateLimitHeaders } from '@/lib/enterprise/rate-limiter'
import { logger, LogLevel, LogCategory } from '@/lib/enterprise/logger'
import { metricsCollector } from '@/lib/enterprise/metrics'
// ⚡ MULTITENANT: Importar guard de tenant admin
import { withTenantAdmin, type TenantAdminGuardResult } from '@/lib/auth/guards/tenant-admin-guard'

// ===================================
// CONFIGURACIÓN
// ===================================
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const RATE_LIMIT_CONFIGS = {
  admin: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 200,
    message: 'Demasiadas solicitudes de inventario',
  },
}

// ===================================
// ESQUEMAS DE VALIDACIÓN
// ===================================
const InventoryFiltersSchema = z.object({
  product_id: z.string().uuid().optional(),
  variant_id: z.string().uuid().optional(),
  location: z.string().optional(),
  low_stock: z.boolean().optional(),
  out_of_stock: z.boolean().optional(),
  reserved_only: z.boolean().optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sort_by: z
    .enum(['product_name', 'current_stock', 'reserved_stock', 'available_stock', 'updated_at'])
    .default('updated_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
})

const StockAdjustmentSchema = z.object({
  product_id: z.string().uuid(),
  variant_id: z.string().uuid().optional(),
  location: z.string().default('main'),
  adjustment_type: z.enum(['increase', 'decrease', 'set']),
  quantity: z.number().int().min(0),
  reason: z.string().min(1, 'La razón es requerida'),
  notes: z.string().optional(),
})

const BulkStockAdjustmentSchema = z.object({
  adjustments: z.array(StockAdjustmentSchema).min(1).max(100),
  reason: z.string().min(1, 'La razón es requerida'),
  notes: z.string().optional(),
})

const ReservationSchema = z.object({
  product_id: z.string().uuid(),
  variant_id: z.string().uuid().optional(),
  location: z.string().default('main'),
  quantity: z.number().int().min(1),
  reason: z.string().min(1, 'La razón es requerida'),
  expires_at: z.string().optional(),
  notes: z.string().optional(),
})

const MovementFiltersSchema = z.object({
  product_id: z.string().uuid().optional(),
  variant_id: z.string().uuid().optional(),
  location: z.string().optional(),
  movement_type: z
    .enum(['adjustment', 'sale', 'return', 'transfer', 'reservation', 'release'])
    .optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sort_by: z.enum(['created_at', 'quantity', 'movement_type']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
})

// ===================================
// TIPOS
// ===================================
interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
  error?: string
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface InventoryItem {
  id: string
  product_id: string
  variant_id?: string
  location: string
  current_stock: number
  reserved_stock: number
  available_stock: number
  min_stock_level: number
  max_stock_level?: number
  reorder_point: number
  cost_per_unit?: number
  last_counted_at?: string
  updated_at: string
  product: {
    id: string
    name: string
    sku: string
    image_url?: string
  }
  variant?: {
    id: string
    name: string
    sku: string
  }
  is_low_stock: boolean
  is_out_of_stock: boolean
}

interface StockMovement {
  id: string
  product_id: string
  variant_id?: string
  location: string
  movement_type: 'adjustment' | 'sale' | 'return' | 'transfer' | 'reservation' | 'release'
  quantity: number
  previous_stock: number
  new_stock: number
  reason: string
  notes?: string
  reference_id?: string
  user_id: string
  created_at: string
  product: {
    name: string
    sku: string
  }
  variant?: {
    name: string
    sku: string
  }
  user: {
    full_name: string
    email: string
  }
}

interface StockReservation {
  id: string
  product_id: string
  variant_id?: string
  location: string
  quantity: number
  reason: string
  notes?: string
  expires_at?: string
  status: 'active' | 'expired' | 'released'
  user_id: string
  created_at: string
  updated_at: string
  product: {
    name: string
    sku: string
  }
  variant?: {
    name: string
    sku: string
  }
}

interface InventoryStats {
  total_products: number
  total_variants: number
  total_stock_value: number
  low_stock_items: number
  out_of_stock_items: number
  reserved_stock_value: number
  locations: string[]
  recent_movements: {
    last_24h: number
    last_7d: number
    last_30d: number
  }
  top_products_by_value: Array<{
    product_id: string
    product_name: string
    stock_value: number
    current_stock: number
  }>
  movement_summary: Record<string, number>
}

// ===================================
// FUNCIONES AUXILIARES
// ===================================
async function validateAdminAuth() {
  const session = await auth()

  if (!session?.user) {
    return { error: 'No autorizado', status: 401 }
  }

  // Verificar rol de administrador o manager
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (!['admin', 'manager'].includes(profile?.role)) {
    return { error: 'Acceso denegado', status: 403 }
  }

  return { userId: session.user.id, role: profile.role }
}

async function getInventoryItems(
  filters: z.infer<typeof InventoryFiltersSchema>,
  tenantId: string // ⚡ MULTITENANT: Agregar tenantId
) {
  // ⚡ MULTITENANT: Usar tenant_products para obtener inventario del tenant
  // Nota: La tabla inventory no existe, usar tenant_products.stock
  let query = supabase
    .from('tenant_products')
    .select(`
      product_id,
      stock,
      price,
      discounted_price,
      is_visible,
      product:products!tenant_products_product_id_fkey(
        id,
        name,
        sku,
        images
      )
    `)
    .eq('tenant_id', tenantId) // ⚡ MULTITENANT

  // ⚡ MULTITENANT: Aplicar filtros adaptados para tenant_products
  if (filters.product_id) {
    query = query.eq('product_id', filters.product_id)
  }

  // Nota: variant_id y location no aplican directamente a tenant_products
  // Se pueden filtrar después o usar product_variants si es necesario

  if (filters.low_stock) {
    // Usar un umbral por defecto (ej: 10 unidades)
    query = query.lt('stock', 10)
  }

  if (filters.out_of_stock) {
    query = query.eq('stock', 0)
  }

  // Nota: reserved_only no aplica directamente (no hay tabla de reservas)

  if (filters.search) {
    query = query.or(
      `product.name.ilike.%${filters.search}%,product.sku.ilike.%${filters.search}%`
    )
  }

  // Contar total
  const { count } = await query.select('*', { count: 'exact', head: true })

  // Aplicar paginación y ordenamiento
  const offset = (filters.page - 1) * filters.limit
  query = query
    .order(filters.sort_by, { ascending: filters.sort_order === 'asc' })
    .range(offset, offset + filters.limit - 1)

  const { data, error } = await query

  if (error) {
    throw new Error(`Error al obtener inventario: ${error.message}`)
  }

  // Procesar datos para incluir campos calculados
  const processedData = (data || []).map(item => ({
    ...item,
    available_stock: item.current_stock - item.reserved_stock,
    is_low_stock: item.current_stock <= item.reorder_point,
    is_out_of_stock: item.current_stock === 0,
  }))

  return {
    items: processedData,
    total: count || 0,
    totalPages: Math.ceil((count || 0) / filters.limit),
  }
}

async function adjustStock(adjustment: z.infer<typeof StockAdjustmentSchema>, userId: string) {
  const { data: currentInventory, error: inventoryError } = await supabase
    .from('inventory')
    .select('current_stock')
    .eq('product_id', adjustment.product_id)
    .eq('location', adjustment.location)
    .eq('variant_id', adjustment.variant_id || null)
    .single()

  if (inventoryError) {
    throw new Error(`Error al obtener inventario actual: ${inventoryError.message}`)
  }

  const currentStock = currentInventory.current_stock
  let newStock: number

  switch (adjustment.adjustment_type) {
    case 'increase':
      newStock = currentStock + adjustment.quantity
      break
    case 'decrease':
      newStock = Math.max(0, currentStock - adjustment.quantity)
      break
    case 'set':
      newStock = adjustment.quantity
      break
    default:
      throw new Error('Tipo de ajuste inválido')
  }

  // ⚡ MULTITENANT: Actualizar stock en tenant_products
  const { error: updateError } = await supabase
    .from('tenant_products')
    .update({
      stock: newStock,
      updated_at: new Date().toISOString(),
    })
    .eq('product_id', adjustment.product_id)
    .eq('tenant_id', tenantId) // ⚡ MULTITENANT

  if (updateError) {
    throw new Error(`Error al actualizar inventario: ${updateError.message}`)
  }

  // ⚡ MULTITENANT: Nota: La tabla stock_movements no existe
  // Se puede registrar en audit_logs si es necesario
  // Por ahora, solo actualizamos tenant_products

  return {
    previous_stock: currentStock,
    new_stock: newStock,
    adjustment_quantity: adjustment.quantity,
  }
}

async function createReservation(
  reservation: z.infer<typeof ReservationSchema>,
  userId: string,
  tenantId: string // ⚡ MULTITENANT: Agregar tenantId
) {
  // ⚡ MULTITENANT: Verificar stock disponible desde tenant_products
  const { data: tenantProduct, error: inventoryError } = await supabase
    .from('tenant_products')
    .select('stock')
    .eq('product_id', reservation.product_id)
    .eq('tenant_id', tenantId) // ⚡ MULTITENANT
    .single()

  if (inventoryError) {
    throw new Error(`Error al obtener inventario: ${inventoryError.message}`)
  }

  const availableStock = tenantProduct?.stock || 0
  if (availableStock < reservation.quantity) {
    throw new Error(
      `Stock insuficiente. Disponible: ${availableStock}, Solicitado: ${reservation.quantity}`
    )
  }

  // ⚡ MULTITENANT: Nota: La tabla stock_reservations no existe
  // Por ahora, solo verificamos el stock disponible
  // Se puede implementar un sistema de reservas usando una tabla separada si es necesario
  const newReservation = {
    id: `temp_${Date.now()}`,
    product_id: reservation.product_id,
    quantity: reservation.quantity,
    reason: reservation.reason,
    status: 'active',
    created_at: new Date().toISOString(),
  }

  // Crear movimiento de stock
  await supabase.from('stock_movements').insert({
    product_id: reservation.product_id,
    variant_id: reservation.variant_id,
    location: reservation.location,
    movement_type: 'reservation',
    quantity: -reservation.quantity,
    previous_stock: inventory.current_stock,
    new_stock: inventory.current_stock,
    reason: reservation.reason,
    notes: reservation.notes,
    reference_id: newReservation.id,
    user_id: userId,
    created_at: new Date().toISOString(),
  })

  return newReservation
}

async function getStockMovements(
  filters: z.infer<typeof MovementFiltersSchema>,
  tenantId: string // ⚡ MULTITENANT: Agregar tenantId
) {
  // ⚡ MULTITENANT: Nota: La tabla stock_movements no existe
  // Por ahora, retornar array vacío o usar audit_logs si es necesario
  // Se puede implementar un sistema de movimientos usando una tabla separada si es necesario
  return {
    movements: [],
    total: 0,
    totalPages: 0,
  }
  
  /* Código original comentado (tabla no existe):
  let query = supabase.from('stock_movements').select(`
      *,
      product:products!stock_movements_product_id_fkey(
        name,
        sku
      ),
      variant:product_variants!stock_movements_variant_id_fkey(
        name,
        sku
      ),
      user:profiles!stock_movements_user_id_fkey(
        full_name,
        email
      )
    `)
    .eq('tenant_id', tenantId) // ⚡ MULTITENANT

  // Aplicar filtros
  if (filters.product_id) {
    query = query.eq('product_id', filters.product_id)
  }

  if (filters.variant_id) {
    query = query.eq('variant_id', filters.variant_id)
  }

  if (filters.location) {
    query = query.eq('location', filters.location)
  }

  if (filters.movement_type) {
    query = query.eq('movement_type', filters.movement_type)
  }

  if (filters.date_from) {
    query = query.gte('created_at', filters.date_from)
  }

  if (filters.date_to) {
    query = query.lte('created_at', filters.date_to)
  }

  // Contar total
  const { count } = await query.select('*', { count: 'exact', head: true })

  // Aplicar paginación y ordenamiento
  const offset = (filters.page - 1) * filters.limit
  query = query
    .order(filters.sort_by, { ascending: filters.sort_order === 'asc' })
    .range(offset, offset + filters.limit - 1)

  const { data, error } = await query

  if (error) {
    throw new Error(`Error al obtener movimientos de stock: ${error.message}`)
  }

  return {
    movements: data || [],
    total: count || 0,
    totalPages: Math.ceil((count || 0) / filters.limit),
  }
  */
}

async function getInventoryStats(tenantId: string): Promise<InventoryStats> {
  // ⚡ MULTITENANT: Obtener estadísticas desde tenant_products
  const { data: tenantProductsData, error } = await supabase
    .from('tenant_products')
    .select(`
      product_id,
      stock,
      price,
      product:products!tenant_products_product_id_fkey(
        name,
        sku
      )
    `)
    .eq('tenant_id', tenantId) // ⚡ MULTITENANT

  if (error) {
    throw new Error(`Error al obtener estadísticas de inventario: ${error.message}`)
  }

  const inventory = (tenantProductsData || []).map(tp => ({
    product_id: tp.product_id,
    current_stock: tp.stock || 0,
    reserved_stock: 0,
    cost_per_unit: tp.price || 0,
    reorder_point: 10, // Valor por defecto
    product: tp.product || { name: '', sku: '' },
  }))
  
  const now = new Date()
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  // ⚡ MULTITENANT: Nota: La tabla stock_movements no existe
  // Por ahora, usar valores por defecto para movimientos
  const movements: any[] = []

  const recentMovements = {
    last_24h: (movements || []).filter(m => new Date(m.created_at) >= last24h).length,
    last_7d: (movements || []).filter(m => new Date(m.created_at) >= last7d).length,
    last_30d: (movements || []).filter(m => new Date(m.created_at) >= last30d).length,
  }

  // Resumen de movimientos
  const movementSummary = (movements || []).reduce(
    (acc, movement) => {
      acc[movement.movement_type] = (acc[movement.movement_type] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  // ⚡ MULTITENANT: Calcular estadísticas desde tenant_products
  const uniqueProducts = new Set(inventory.map(item => item.product_id))
  const uniqueVariants = 0 // No hay variantes en tenant_products directamente

  // Valor total del stock
  const totalStockValue = inventory.reduce((sum, item) => {
    return sum + item.current_stock * (item.cost_per_unit || 0)
  }, 0)

  // Stock reservado (no existe en tenant_products)
  const reservedStockValue = 0

  // Items con stock bajo y sin stock
  const lowStockItems = inventory.filter(item => item.current_stock <= item.reorder_point).length
  const outOfStockItems = inventory.filter(item => item.current_stock === 0).length

  // Ubicaciones (no aplica directamente a tenant_products)
  const locations = ['main'] // Valor por defecto

  // Top productos por valor
  const topProductsByValue = inventory
    .map(item => ({
      product_id: item.product_id,
      product_name: item.product.name,
      stock_value: item.current_stock * (item.cost_per_unit || 0),
      current_stock: item.current_stock,
    }))
    .sort((a, b) => b.stock_value - a.stock_value)
    .slice(0, 10)

  return {
    total_products: uniqueProducts.size,
    total_variants: uniqueVariants,
    total_stock_value: totalStockValue,
    low_stock_items: lowStockItems,
    out_of_stock_items: outOfStockItems,
    reserved_stock_value: reservedStockValue,
    locations,
    recent_movements: recentMovements,
    top_products_by_value: topProductsByValue,
    movement_summary: movementSummary,
  }
}

// ===================================
// GET - Obtener inventario
// ⚡ MULTITENANT: Filtra por tenant_id usando tenant_products
// ===================================
export const GET = withTenantAdmin(async (
  guardResult: TenantAdminGuardResult,
  request: NextRequest
) => {
  const startTime = Date.now()
  const { tenantId } = guardResult

  try {
    // Rate limiting
    const rateLimitResult = await checkRateLimit(
      request,
      {
        windowMs: RATE_LIMIT_CONFIGS.admin.windowMs,
        maxRequests: RATE_LIMIT_CONFIGS.admin.maxRequests,
        message: RATE_LIMIT_CONFIGS.admin.message,
      },
      'admin-inventory'
    )

    if (!rateLimitResult.success) {
      const response = NextResponse.json({ error: rateLimitResult.message }, { status: 429 })
      addRateLimitHeaders(response, rateLimitResult)
      return response
    }

    // Parsear parámetros de consulta
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    // Manejar diferentes acciones
    if (action === 'stats') {
      // ⚡ MULTITENANT: Obtener estadísticas filtrando por tenant_id
      const stats = await getInventoryStats(tenantId)

      // Registrar métricas
      metricsCollector.recordApiCall({
        endpoint: '/api/admin/inventory',
        method: 'GET',
        statusCode: 200,
        responseTime: Date.now() - startTime,
        userId: guardResult.userId,
      })

      const response: ApiResponse<InventoryStats> = {
        data: stats,
        success: true,
        message: 'Estadísticas de inventario obtenidas exitosamente',
      }

      const nextResponse = NextResponse.json(response)
      addRateLimitHeaders(nextResponse, rateLimitResult)
      return nextResponse
    }

    if (action === 'movements') {
      // Obtener movimientos de stock
      const filters = MovementFiltersSchema.parse({
        product_id: searchParams.get('product_id'),
        variant_id: searchParams.get('variant_id'),
        location: searchParams.get('location'),
        movement_type: searchParams.get('movement_type'),
        date_from: searchParams.get('date_from'),
        date_to: searchParams.get('date_to'),
        page: searchParams.get('page'),
        limit: searchParams.get('limit'),
        sort_by: searchParams.get('sort_by'),
        sort_order: searchParams.get('sort_order'),
      })

      const { movements, total, totalPages } = await getStockMovements(filters)

      // Registrar métricas
      metricsCollector.recordApiCall({
        endpoint: '/api/admin/inventory',
        method: 'GET',
        statusCode: 200,
        responseTime: Date.now() - startTime,
        userId: authResult.userId,
      })

      const response: ApiResponse<StockMovement[]> = {
        data: movements,
        success: true,
        message: 'Movimientos de stock obtenidos exitosamente',
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total,
          totalPages,
        },
      }

      const nextResponse = NextResponse.json(response)
      addRateLimitHeaders(nextResponse, rateLimitResult)
      return nextResponse
    }

    // Obtener inventario normal
    const filters = InventoryFiltersSchema.parse({
      product_id: searchParams.get('product_id'),
      variant_id: searchParams.get('variant_id'),
      location: searchParams.get('location'),
      low_stock: searchParams.get('low_stock') === 'true',
      out_of_stock: searchParams.get('out_of_stock') === 'true',
      reserved_only: searchParams.get('reserved_only') === 'true',
      search: searchParams.get('search'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      sort_by: searchParams.get('sort_by'),
      sort_order: searchParams.get('sort_order'),
    })

    // ⚡ MULTITENANT: Obtener inventario filtrando por tenant_id
    const { items, total, totalPages } = await getInventoryItems(filters, tenantId)

    // Registrar métricas
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/inventory',
      method: 'GET',
      statusCode: 200,
      responseTime: Date.now() - startTime,
      userId: guardResult.userId,
    })

    const response: ApiResponse<InventoryItem[]> = {
      data: items,
      success: true,
      message: 'Inventario obtenido exitosamente',
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages,
      },
    }

    const nextResponse = NextResponse.json(response)
    addRateLimitHeaders(nextResponse, rateLimitResult)
    return nextResponse
  } catch (error) {
    logger.log(LogLevel.ERROR, LogCategory.API, 'Error en GET /api/admin/inventory', { error })

    // Registrar métricas de error
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/inventory',
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
})

// ===================================
// POST - Ajustar stock o crear reserva
// ⚡ MULTITENANT: Filtra y actualiza tenant_products
// ===================================
export const POST = withTenantAdmin(async (
  guardResult: TenantAdminGuardResult,
  request: NextRequest
) => {
  const startTime = Date.now()
  const { tenantId, userId } = guardResult

  try {
    // Rate limiting
    const rateLimitResult = await checkRateLimit(
      request,
      {
        windowMs: RATE_LIMIT_CONFIGS.admin.windowMs,
        maxRequests: Math.floor(RATE_LIMIT_CONFIGS.admin.maxRequests / 2),
        message: 'Demasiadas operaciones de inventario',
      },
      'admin-inventory-modify'
    )

    if (!rateLimitResult.success) {
      const response = NextResponse.json({ error: rateLimitResult.message }, { status: 429 })
      addRateLimitHeaders(response, rateLimitResult)
      return response
    }

    // Validar datos de entrada
    const body = await request.json()
    const { action } = body

    if (action === 'adjust_stock') {
      // ⚡ MULTITENANT: Ajuste de stock individual usando tenant_products
      const adjustment = StockAdjustmentSchema.parse(body)
      const result = await adjustStock(adjustment, userId, tenantId)

      // Registrar métricas
      metricsCollector.recordApiCall({
        endpoint: '/api/admin/inventory',
        method: 'POST',
        statusCode: 200,
        responseTime: Date.now() - startTime,
        userId: userId,
      })

      const response: ApiResponse<typeof result> = {
        data: result,
        success: true,
        message: 'Stock ajustado exitosamente',
      }

      const nextResponse = NextResponse.json(response)
      addRateLimitHeaders(nextResponse, rateLimitResult)
      return nextResponse
    }

    if (action === 'bulk_adjust') {
      // Ajuste masivo de stock
      const bulkAdjustment = BulkStockAdjustmentSchema.parse(body)
      const results = []

      for (const adjustment of bulkAdjustment.adjustments) {
        try {
          // ⚡ MULTITENANT: Ajuste masivo usando tenant_products
          const result = await adjustStock(
            {
              ...adjustment,
              reason: bulkAdjustment.reason,
              notes: bulkAdjustment.notes,
            },
            userId,
            tenantId
          )
          results.push({ ...adjustment, result, success: true })
        } catch (error) {
          results.push({
            ...adjustment,
            error: error instanceof Error ? error.message : 'Error desconocido',
            success: false,
          })
        }
      }

      // Registrar métricas
      metricsCollector.recordApiCall({
        endpoint: '/api/admin/inventory',
        method: 'POST',
        statusCode: 200,
        responseTime: Date.now() - startTime,
        userId: authResult.userId,
      })

      const response: ApiResponse<typeof results> = {
        data: results,
        success: true,
        message: `Ajuste masivo completado. ${results.filter(r => r.success).length}/${results.length} exitosos`,
      }

      const nextResponse = NextResponse.json(response)
      addRateLimitHeaders(nextResponse, rateLimitResult)
      return nextResponse
    }

    if (action === 'create_reservation') {
      // ⚡ MULTITENANT: Crear reserva de stock usando tenant_products
      const reservation = ReservationSchema.parse(body)
      const result = await createReservation(reservation, userId, tenantId)

      // Registrar métricas
      metricsCollector.recordApiCall({
        endpoint: '/api/admin/inventory',
        method: 'POST',
        statusCode: 201,
        responseTime: Date.now() - startTime,
        userId: authResult.userId,
      })

      const response: ApiResponse<typeof result> = {
        data: result,
        success: true,
        message: 'Reserva de stock creada exitosamente',
      }

      const nextResponse = NextResponse.json(response, { status: 201 })
      addRateLimitHeaders(nextResponse, rateLimitResult)
      return nextResponse
    }

    // Acción no válida
    const errorResponse: ApiResponse<null> = {
      data: null,
      success: false,
      error:
        'Acción no válida. Acciones disponibles: adjust_stock, bulk_adjust, create_reservation',
    }
    return NextResponse.json(errorResponse, { status: 400 })
  } catch (error) {
    logger.log(LogLevel.ERROR, LogCategory.API, 'Error en POST /api/admin/inventory', { error })

    // Registrar métricas de error
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/inventory',
      method: 'POST',
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
})
