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
    maxRequests: 100,
    message: 'Demasiadas solicitudes de cupones',
  },
}

// ===================================
// ESQUEMAS DE VALIDACIÓN
// ===================================
const CouponFiltersSchema = z.object({
  status: z.enum(['active', 'inactive', 'expired', 'used_up']).optional(),
  type: z.enum(['percentage', 'fixed_amount', 'free_shipping']).optional(),
  category_id: z.string().uuid().optional(),
  product_id: z.string().uuid().optional(),
  search: z.string().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sort_by: z
    .enum(['created_at', 'code', 'discount_value', 'usage_count', 'expires_at'])
    .default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
})

const CreateCouponSchema = z.object({
  code: z
    .string()
    .min(3)
    .max(50)
    .regex(
      /^[A-Z0-9_-]+$/,
      'El código debe contener solo letras mayúsculas, números, guiones y guiones bajos'
    ),
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  type: z.enum(['percentage', 'fixed_amount', 'free_shipping']),
  discount_value: z.number().min(0),
  minimum_order_amount: z.number().min(0).optional(),
  maximum_discount_amount: z.number().min(0).optional(),
  usage_limit: z.number().int().min(1).optional(),
  usage_limit_per_user: z.number().int().min(1).optional(),
  starts_at: z.string(),
  expires_at: z.string().optional(),
  is_active: z.boolean().default(true),
  applicable_to: z.enum(['all', 'categories', 'products']).default('all'),
  category_ids: z.array(z.string().uuid()).optional(),
  product_ids: z.array(z.string().uuid()).optional(),
  exclude_sale_items: z.boolean().default(false),
  first_time_customers_only: z.boolean().default(false),
})

const UpdateCouponSchema = CreateCouponSchema.partial().omit({ code: true })

const BulkCouponActionSchema = z.object({
  coupon_ids: z.array(z.string().uuid()).min(1),
  action: z.enum(['activate', 'deactivate', 'delete', 'extend_expiry']),
  extend_days: z.number().int().min(1).optional(),
})

const ValidateCouponSchema = z.object({
  code: z.string(),
  user_id: z.string().uuid().optional(),
  cart_total: z.number().min(0),
  product_ids: z.array(z.string().uuid()).optional(),
  category_ids: z.array(z.string().uuid()).optional(),
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

interface CouponData {
  id: string
  code: string
  name: string
  description?: string
  type: 'percentage' | 'fixed_amount' | 'free_shipping'
  discount_value: number
  minimum_order_amount?: number
  maximum_discount_amount?: number
  usage_limit?: number
  usage_limit_per_user?: number
  usage_count: number
  starts_at: string
  expires_at?: string
  is_active: boolean
  applicable_to: 'all' | 'categories' | 'products'
  category_ids?: string[]
  product_ids?: string[]
  exclude_sale_items: boolean
  first_time_customers_only: boolean
  created_at: string
  updated_at: string
  created_by: string
  status: 'active' | 'inactive' | 'expired' | 'used_up'
  categories?: Array<{
    id: string
    name: string
  }>
  products?: Array<{
    id: string
    name: string
    sku: string
  }>
  creator?: {
    full_name: string
    email: string
  }
}

interface CouponStats {
  total_coupons: number
  active_coupons: number
  expired_coupons: number
  used_up_coupons: number
  total_usage: number
  total_discount_given: number
  average_discount: number
  top_coupons: Array<{
    id: string
    code: string
    name: string
    usage_count: number
    total_discount: number
  }>
  usage_by_type: Record<string, number>
  recent_usage: {
    last_24h: number
    last_7d: number
    last_30d: number
  }
}

interface CouponValidationResult {
  valid: boolean
  coupon?: CouponData
  discount_amount?: number
  error?: string
  warnings?: string[]
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

async function getCoupons(
  filters: z.infer<typeof CouponFiltersSchema>,
  tenantId: string // ⚡ MULTITENANT: Agregar tenantId
) {
  // ⚡ MULTITENANT: Filtrar por tenant_id
  let query = supabase
    .from('coupons')
    .select(`
      *,
      categories:coupon_categories!coupon_categories_coupon_id_fkey(
        category:categories!coupon_categories_category_id_fkey(
          id,
          name
        )
      ),
      products:coupon_products!coupon_products_coupon_id_fkey(
        product:products!coupon_products_product_id_fkey(
          id,
          name,
          sku
        )
      ),
      creator:profiles!coupons_created_by_fkey(
        full_name,
        email
      )
    `)
    .eq('tenant_id', tenantId) // ⚡ MULTITENANT

  // Aplicar filtros
  if (filters.status) {
    const now = new Date().toISOString()
    switch (filters.status) {
      case 'active':
        query = query
          .eq('is_active', true)
          .lte('starts_at', now)
          .or(`expires_at.is.null,expires_at.gt.${now}`)
        break
      case 'inactive':
        query = query.eq('is_active', false)
        break
      case 'expired':
        query = query.eq('is_active', true).not('expires_at', 'is', null).lt('expires_at', now)
        break
      case 'used_up':
        query = query
          .eq('is_active', true)
          .not('usage_limit', 'is', null)
          .gte('usage_count', supabase.rpc('get_usage_limit'))
        break
    }
  }

  if (filters.type) {
    query = query.eq('type', filters.type)
  }

  if (filters.search) {
    query = query.or(
      `code.ilike.%${filters.search}%,name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
    )
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
    throw new Error(`Error al obtener cupones: ${error.message}`)
  }

  // Procesar datos para incluir estado calculado
  const processedData = (data || []).map(coupon => {
    const now = new Date()
    const startsAt = new Date(coupon.starts_at)
    const expiresAt = coupon.expires_at ? new Date(coupon.expires_at) : null

    let status: 'active' | 'inactive' | 'expired' | 'used_up'

    if (!coupon.is_active) {
      status = 'inactive'
    } else if (now < startsAt) {
      status = 'inactive'
    } else if (expiresAt && now > expiresAt) {
      status = 'expired'
    } else if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
      status = 'used_up'
    } else {
      status = 'active'
    }

    return {
      ...coupon,
      status,
      categories: coupon.categories?.map((cc: { category: unknown }) => cc.category) || [],
      products: coupon.products?.map((cp: { product: unknown }) => cp.product) || [],
    }
  })

  return {
    coupons: processedData,
    total: count || 0,
    totalPages: Math.ceil((count || 0) / filters.limit),
  }
}

async function createCoupon(
  couponData: z.infer<typeof CreateCouponSchema>,
  userId: string,
  tenantId: string // ⚡ MULTITENANT: Agregar tenantId
) {
  // ⚡ MULTITENANT: Verificar que el código no exista en el mismo tenant
  const { data: existingCoupon } = await supabase
    .from('coupons')
    .select('id')
    .eq('code', couponData.code)
    .eq('tenant_id', tenantId) // ⚡ MULTITENANT
    .single()

  if (existingCoupon) {
    throw new Error('Ya existe un cupón con este código en este tenant')
  }

  // Validar fechas
  const startsAt = new Date(couponData.starts_at)
  const expiresAt = couponData.expires_at ? new Date(couponData.expires_at) : null

  if (expiresAt && startsAt >= expiresAt) {
    throw new Error('La fecha de inicio debe ser anterior a la fecha de expiración')
  }

  // Validar descuento
  if (couponData.type === 'percentage' && couponData.discount_value > 100) {
    throw new Error('El descuento porcentual no puede ser mayor al 100%')
  }

  // ⚡ MULTITENANT: Crear cupón con tenant_id
  const { data: newCoupon, error: couponError } = await supabase
    .from('coupons')
    .insert({
      code: couponData.code,
      name: couponData.name,
      description: couponData.description,
      type: couponData.type,
      discount_value: couponData.discount_value,
      minimum_order_amount: couponData.minimum_order_amount,
      maximum_discount_amount: couponData.maximum_discount_amount,
      usage_limit: couponData.usage_limit,
      usage_limit_per_user: couponData.usage_limit_per_user,
      usage_count: 0,
      starts_at: couponData.starts_at,
      expires_at: couponData.expires_at,
      is_active: couponData.is_active,
      applicable_to: couponData.applicable_to,
      exclude_sale_items: couponData.exclude_sale_items,
      first_time_customers_only: couponData.first_time_customers_only,
      tenant_id: tenantId, // ⚡ MULTITENANT
      created_by: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (couponError) {
    throw new Error(`Error al crear cupón: ${couponError.message}`)
  }

  // Asociar categorías si aplica
  if (couponData.applicable_to === 'categories' && couponData.category_ids?.length) {
    const categoryInserts = couponData.category_ids.map(categoryId => ({
      coupon_id: newCoupon.id,
      category_id: categoryId,
    }))

    const { error: categoryError } = await supabase
      .from('coupon_categories')
      .insert(categoryInserts)

    if (categoryError) {
      throw new Error(`Error al asociar categorías: ${categoryError.message}`)
    }
  }

  // Asociar productos si aplica
  if (couponData.applicable_to === 'products' && couponData.product_ids?.length) {
    const productInserts = couponData.product_ids.map(productId => ({
      coupon_id: newCoupon.id,
      product_id: productId,
    }))

    const { error: productError } = await supabase.from('coupon_products').insert(productInserts)

    if (productError) {
      throw new Error(`Error al asociar productos: ${productError.message}`)
    }
  }

  return newCoupon
}

async function validateCoupon(
  validation: z.infer<typeof ValidateCouponSchema>,
  tenantId: string // ⚡ MULTITENANT: Agregar tenantId
): Promise<CouponValidationResult> {
  // ⚡ MULTITENANT: Obtener cupón del tenant
  const { data: coupon, error } = await supabase
    .from('coupons')
    .select(
      `
      *,
      categories:coupon_categories!coupon_categories_coupon_id_fkey(
        category_id
      ),
      products:coupon_products!coupon_products_coupon_id_fkey(
        product_id
      )
    `
    )
    .eq('code', validation.code.toUpperCase())
    .eq('tenant_id', tenantId) // ⚡ MULTITENANT
    .single()

  if (error || !coupon) {
    return {
      valid: false,
      error: 'Cupón no encontrado',
    }
  }

  const warnings: string[] = []
  const now = new Date()
  const startsAt = new Date(coupon.starts_at)
  const expiresAt = coupon.expires_at ? new Date(coupon.expires_at) : null

  // Validar estado activo
  if (!coupon.is_active) {
    return {
      valid: false,
      error: 'Este cupón está desactivado',
    }
  }

  // Validar fechas
  if (now < startsAt) {
    return {
      valid: false,
      error: 'Este cupón aún no está disponible',
    }
  }

  if (expiresAt && now > expiresAt) {
    return {
      valid: false,
      error: 'Este cupón ha expirado',
    }
  }

  // Validar límite de uso
  if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
    return {
      valid: false,
      error: 'Este cupón ha alcanzado su límite de uso',
    }
  }

  // Validar límite por usuario
  if (validation.user_id && coupon.usage_limit_per_user) {
    const { count: userUsage } = await supabase
      .from('coupon_usage')
      .select('*', { count: 'exact', head: true })
      .eq('coupon_id', coupon.id)
      .eq('user_id', validation.user_id)

    if (userUsage && userUsage >= coupon.usage_limit_per_user) {
      return {
        valid: false,
        error: 'Has alcanzado el límite de uso de este cupón',
      }
    }
  }

  // Validar monto mínimo
  if (coupon.minimum_order_amount && validation.cart_total < coupon.minimum_order_amount) {
    return {
      valid: false,
      error: `El monto mínimo para este cupón es $${coupon.minimum_order_amount}`,
    }
  }

  // Validar aplicabilidad a productos/categorías
  if (coupon.applicable_to === 'categories' && validation.category_ids?.length) {
    const couponCategoryIds = coupon.categories.map((cc: { category_id: string }) => cc.category_id)
    const hasValidCategory = validation.category_ids.some(catId =>
      couponCategoryIds.includes(catId)
    )

    if (!hasValidCategory) {
      return {
        valid: false,
        error: 'Este cupón no es válido para los productos en tu carrito',
      }
    }
  }

  if (coupon.applicable_to === 'products' && validation.product_ids?.length) {
    const couponProductIds = coupon.products.map((cp: { product_id: string }) => cp.product_id)
    const hasValidProduct = validation.product_ids.some(prodId => couponProductIds.includes(prodId))

    if (!hasValidProduct) {
      return {
        valid: false,
        error: 'Este cupón no es válido para los productos en tu carrito',
      }
    }
  }

  // Validar cliente por primera vez
  if (coupon.first_time_customers_only && validation.user_id) {
    const { count: orderCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', validation.user_id)
      .eq('status', 'completed')

    if (orderCount && orderCount > 0) {
      return {
        valid: false,
        error: 'Este cupón es solo para clientes nuevos',
      }
    }
  }

  // Calcular descuento
  let discountAmount = 0

  switch (coupon.type) {
    case 'percentage':
      discountAmount = (validation.cart_total * coupon.discount_value) / 100
      if (coupon.maximum_discount_amount) {
        discountAmount = Math.min(discountAmount, coupon.maximum_discount_amount)
      }
      break
    case 'fixed_amount':
      discountAmount = Math.min(coupon.discount_value, validation.cart_total)
      break
    case 'free_shipping':
      discountAmount = 0 // El descuento se aplica al envío, no al total
      break
  }

  // Advertencias
  if (expiresAt) {
    const daysUntilExpiry = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (daysUntilExpiry <= 3) {
      warnings.push(`Este cupón expira en ${daysUntilExpiry} día(s)`)
    }
  }

  return {
    valid: true,
    coupon,
    discount_amount: discountAmount,
    warnings: warnings.length > 0 ? warnings : undefined,
  }
}

async function getCouponStats(tenantId: string): Promise<CouponStats> {
  // ⚡ MULTITENANT: Obtener todos los cupones del tenant
  const { data: coupons, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('tenant_id', tenantId) // ⚡ MULTITENANT

  if (error) {
    throw new Error(`Error al obtener estadísticas de cupones: ${error.message}`)
  }

  const now = new Date()
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  // ⚡ MULTITENANT: Obtener uso de cupones del tenant
  // Nota: coupon_usage puede tener tenant_id o filtrarse por coupon_id que pertenece al tenant
  const couponIds = coupons?.map(c => c.id) || []
  const { data: usage } = await supabase
    .from('coupon_usage')
    .select('*')
    .in('coupon_id', couponIds) // ⚡ MULTITENANT: Filtrar por cupones del tenant

  const totalCoupons = coupons?.length || 0
  let activeCoupons = 0
  let expiredCoupons = 0
  let usedUpCoupons = 0

  // Clasificar cupones por estado
  ;(coupons || []).forEach(coupon => {
    const startsAt = new Date(coupon.starts_at)
    const expiresAt = coupon.expires_at ? new Date(coupon.expires_at) : null

    if (!coupon.is_active) {
      return
    }

    if (now < startsAt) {
      return
    }

    if (expiresAt && now > expiresAt) {
      expiredCoupons++
    } else if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
      usedUpCoupons++
    } else {
      activeCoupons++
    }
  })

  // Estadísticas de uso
  const totalUsage = (usage || []).length
  const totalDiscountGiven = (usage || []).reduce((sum, u) => sum + (u.discount_amount || 0), 0)
  const averageDiscount = totalUsage > 0 ? totalDiscountGiven / totalUsage : 0

  // Uso reciente
  const recentUsage = {
    last_24h: (usage || []).filter(u => new Date(u.created_at) >= last24h).length,
    last_7d: (usage || []).filter(u => new Date(u.created_at) >= last7d).length,
    last_30d: (usage || []).filter(u => new Date(u.created_at) >= last30d).length,
  }

  // Top cupones
  const couponUsageMap = (usage || []).reduce(
    (acc, u) => {
      if (!acc[u.coupon_id]) {
        acc[u.coupon_id] = { count: 0, totalDiscount: 0 }
      }
      acc[u.coupon_id].count++
      acc[u.coupon_id].totalDiscount += u.discount_amount || 0
      return acc
    },
    {} as Record<string, { count: number; totalDiscount: number }>
  )

  const topCoupons = Object.entries(couponUsageMap)
    .map(([couponId, stats]) => {
      const coupon = coupons?.find(c => c.id === couponId)
      return {
        id: couponId,
        code: coupon?.code || '',
        name: coupon?.name || '',
        usage_count: stats.count,
        total_discount: stats.totalDiscount,
      }
    })
    .sort((a, b) => b.usage_count - a.usage_count)
    .slice(0, 10)

  // Uso por tipo
  const usageByType = (coupons || []).reduce(
    (acc, coupon) => {
      acc[coupon.type] = (acc[coupon.type] || 0) + coupon.usage_count
      return acc
    },
    {} as Record<string, number>
  )

  return {
    total_coupons: totalCoupons,
    active_coupons: activeCoupons,
    expired_coupons: expiredCoupons,
    used_up_coupons: usedUpCoupons,
    total_usage: totalUsage,
    total_discount_given: totalDiscountGiven,
    average_discount: averageDiscount,
    top_coupons: topCoupons,
    usage_by_type: usageByType,
    recent_usage: recentUsage,
  }
}

// ===================================
// GET - Obtener cupones
// ⚡ MULTITENANT: Filtra por tenant_id
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
      'admin-coupons'
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
      const stats = await getCouponStats(tenantId)

      // Registrar métricas
      metricsCollector.recordApiCall({
        endpoint: '/api/admin/coupons',
        method: 'GET',
        statusCode: 200,
        responseTime: Date.now() - startTime,
        userId: authResult.userId,
      })

      const response: ApiResponse<CouponStats> = {
        data: stats,
        success: true,
        message: 'Estadísticas de cupones obtenidas exitosamente',
      }

      const nextResponse = NextResponse.json(response)
      addRateLimitHeaders(nextResponse, rateLimitResult)
      return nextResponse
    }

    if (action === 'validate') {
      // Validar cupón
      const validation = ValidateCouponSchema.parse({
        code: searchParams.get('code'),
        user_id: searchParams.get('user_id'),
        cart_total: parseFloat(searchParams.get('cart_total') || '0'),
        product_ids: searchParams.get('product_ids')?.split(','),
        category_ids: searchParams.get('category_ids')?.split(','),
      })

      // ⚡ MULTITENANT: Validar cupón del tenant
      const validationResult = await validateCoupon(validation, tenantId)

      // Registrar métricas
      metricsCollector.recordApiCall({
        endpoint: '/api/admin/coupons',
        method: 'GET',
        statusCode: 200,
        responseTime: Date.now() - startTime,
        userId: authResult.userId,
      })

      const response: ApiResponse<CouponValidationResult> = {
        data: validationResult,
        success: true,
        message: validationResult.valid ? 'Cupón válido' : 'Cupón inválido',
      }

      const nextResponse = NextResponse.json(response)
      addRateLimitHeaders(nextResponse, rateLimitResult)
      return nextResponse
    }

    // Obtener cupones normales
    const filters = CouponFiltersSchema.parse({
      status: searchParams.get('status'),
      type: searchParams.get('type'),
      category_id: searchParams.get('category_id'),
      product_id: searchParams.get('product_id'),
      search: searchParams.get('search'),
      date_from: searchParams.get('date_from'),
      date_to: searchParams.get('date_to'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      sort_by: searchParams.get('sort_by'),
      sort_order: searchParams.get('sort_order'),
    })

    // ⚡ MULTITENANT: Obtener cupones del tenant
    const { coupons, total, totalPages } = await getCoupons(filters, tenantId)

    // Registrar métricas
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/coupons',
      method: 'GET',
      statusCode: 200,
      responseTime: Date.now() - startTime,
      userId: authResult.userId,
    })

    const response: ApiResponse<CouponData[]> = {
      data: coupons,
      success: true,
      message: 'Cupones obtenidos exitosamente',
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
    logger.log(LogLevel.ERROR, LogCategory.API, 'Error en GET /api/admin/coupons', { error })

    // Registrar métricas de error
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/coupons',
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
})

// ===================================
// POST - Crear cupón o acción masiva
// ⚡ MULTITENANT: Filtra y asigna tenant_id
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
        message: 'Demasiadas operaciones de cupones',
      },
      'admin-coupons-modify'
    )

    if (!rateLimitResult.success) {
      const response = NextResponse.json({ error: rateLimitResult.message }, { status: 429 })
      addRateLimitHeaders(response, rateLimitResult)
      return response
    }

    // Validar datos de entrada
    const body = await request.json()
    const { action } = body

    if (action === 'bulk') {
      // ⚡ MULTITENANT: Acción masiva filtrando por tenant
      const bulkAction = BulkCouponActionSchema.parse(body)
      const results = []

      for (const couponId of bulkAction.coupon_ids) {
        try {
          const updateData: any = { updated_at: new Date().toISOString() }

          switch (bulkAction.action) {
            case 'activate':
              updateData.is_active = true
              break
            case 'deactivate':
              updateData.is_active = false
              break
            case 'extend_expiry':
              if (bulkAction.extend_days) {
                // ⚡ MULTITENANT: Verificar que el cupón pertenece al tenant
                const { data: coupon } = await supabase
                  .from('coupons')
                  .select('expires_at')
                  .eq('id', couponId)
                  .eq('tenant_id', tenantId) // ⚡ MULTITENANT
                  .single()

                if (coupon?.expires_at) {
                  const newExpiryDate = new Date(coupon.expires_at)
                  newExpiryDate.setDate(newExpiryDate.getDate() + bulkAction.extend_days)
                  updateData.expires_at = newExpiryDate.toISOString()
                }
              }
              break
            case 'delete':
              // ⚡ MULTITENANT: Eliminar solo cupones del tenant
              const { error: deleteError } = await supabase
                .from('coupons')
                .delete()
                .eq('id', couponId)
                .eq('tenant_id', tenantId) // ⚡ MULTITENANT

              if (deleteError) {
                throw deleteError
              }
              results.push({ coupon_id: couponId, success: true, action: 'deleted' })
              continue
          }

          if (bulkAction.action !== 'delete') {
            // ⚡ MULTITENANT: Actualizar solo cupones del tenant
            const { error: updateError } = await supabase
              .from('coupons')
              .update(updateData)
              .eq('id', couponId)
              .eq('tenant_id', tenantId) // ⚡ MULTITENANT

            if (updateError) {
              throw updateError
            }
          }

          results.push({ coupon_id: couponId, success: true, action: bulkAction.action })
        } catch (error) {
          results.push({
            coupon_id: couponId,
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido',
          })
        }
      }

      // Registrar métricas
      metricsCollector.recordApiCall({
        endpoint: '/api/admin/coupons',
        method: 'POST',
        statusCode: 200,
        responseTime: Date.now() - startTime,
        userId: userId,
      })

      const response: ApiResponse<typeof results> = {
        data: results,
        success: true,
        message: `Acción masiva completada. ${results.filter(r => r.success).length}/${results.length} exitosos`,
      }

      const nextResponse = NextResponse.json(response)
      addRateLimitHeaders(nextResponse, rateLimitResult)
      return nextResponse
    }

    // ⚡ MULTITENANT: Crear cupón normal con tenantId
    const couponData = CreateCouponSchema.parse(body)
    const newCoupon = await createCoupon(couponData, userId, tenantId)

    // Registrar métricas
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/coupons',
      method: 'POST',
      statusCode: 201,
      responseTime: Date.now() - startTime,
      userId: userId,
    })

    const response: ApiResponse<typeof newCoupon> = {
      data: newCoupon,
      success: true,
      message: 'Cupón creado exitosamente',
    }

    const nextResponse = NextResponse.json(response, { status: 201 })
    addRateLimitHeaders(nextResponse, rateLimitResult)
    return nextResponse
  } catch (error) {
    logger.log(LogLevel.ERROR, LogCategory.API, 'Error en POST /api/admin/coupons', { error })

    // Registrar métricas de error
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/coupons',
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
