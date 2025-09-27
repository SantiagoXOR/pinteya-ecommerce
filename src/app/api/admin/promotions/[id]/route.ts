import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@/auth'
import { checkRateLimit, addRateLimitHeaders } from '@/lib/enterprise/rate-limiter'
import { logger, LogLevel, LogCategory } from '@/lib/enterprise/logger'
import { metricsCollector } from '@/lib/enterprise/metrics'

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
    maxRequests: 50,
    message: 'Demasiadas solicitudes de promoción',
  },
}

// ===================================
// ESQUEMAS DE VALIDACIÓN
// ===================================
const UpdatePromotionSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').optional(),
  description: z.string().optional(),
  type: z
    .enum(['percentage_discount', 'fixed_discount', 'buy_x_get_y', 'free_shipping', 'bundle_deal'])
    .optional(),
  priority: z.number().int().min(1).max(100).optional(),

  // Configuración de descuento
  discount_percentage: z.number().min(0).max(100).optional(),
  discount_amount: z.number().min(0).optional(),

  // Configuración Buy X Get Y
  buy_quantity: z.number().int().min(1).optional(),
  get_quantity: z.number().int().min(1).optional(),
  get_discount_percentage: z.number().min(0).max(100).optional(),

  // Configuración de bundle
  bundle_products: z
    .array(
      z.object({
        product_id: z.string().uuid(),
        quantity: z.number().int().min(1),
      })
    )
    .optional(),
  bundle_price: z.number().min(0).optional(),

  // Condiciones
  minimum_order_amount: z.number().min(0).optional(),
  maximum_discount_amount: z.number().min(0).optional(),
  minimum_quantity: z.number().int().min(1).optional(),

  // Aplicabilidad
  applicable_to: z.enum(['all', 'categories', 'products', 'brands']).optional(),
  category_ids: z.array(z.string().uuid()).optional(),
  product_ids: z.array(z.string().uuid()).optional(),
  brand_ids: z.array(z.string().uuid()).optional(),

  // Exclusiones
  exclude_sale_items: z.boolean().optional(),
  exclude_categories: z.array(z.string().uuid()).optional(),
  exclude_products: z.array(z.string().uuid()).optional(),

  // Límites de uso
  usage_limit: z.number().int().min(1).optional(),
  usage_limit_per_user: z.number().int().min(1).optional(),

  // Fechas
  starts_at: z.string().optional(),
  ends_at: z.string().optional(),

  // Configuración
  is_active: z.boolean().optional(),
  is_paused: z.boolean().optional(),
  is_stackable: z.boolean().optional(),
  requires_coupon_code: z.boolean().optional(),
  coupon_code: z.string().optional(),

  // Targeting
  customer_groups: z.array(z.string()).optional(),
  first_time_customers_only: z.boolean().optional(),

  // Display
  banner_text: z.string().optional(),
  banner_color: z.string().optional(),
  show_on_product_page: z.boolean().optional(),
  show_on_category_page: z.boolean().optional(),
  show_on_homepage: z.boolean().optional(),
})

const PromotionActionSchema = z.object({
  action: z.enum(['activate', 'deactivate', 'pause', 'resume', 'duplicate', 'extend']),
  extend_days: z.number().int().min(1).optional(),
})

// ===================================
// TIPOS
// ===================================
interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
  error?: string
}

interface PromotionData {
  id: string
  name: string
  description?: string
  type: 'percentage_discount' | 'fixed_discount' | 'buy_x_get_y' | 'free_shipping' | 'bundle_deal'
  priority: number

  // Configuración de descuento
  discount_percentage?: number
  discount_amount?: number

  // Configuración Buy X Get Y
  buy_quantity?: number
  get_quantity?: number
  get_discount_percentage?: number

  // Configuración de bundle
  bundle_products?: Array<{
    product_id: string
    quantity: number
    product?: {
      name: string
      sku: string
      price: number
    }
  }>
  bundle_price?: number

  // Condiciones
  minimum_order_amount?: number
  maximum_discount_amount?: number
  minimum_quantity?: number

  // Aplicabilidad
  applicable_to: 'all' | 'categories' | 'products' | 'brands'
  category_ids?: string[]
  product_ids?: string[]
  brand_ids?: string[]

  // Exclusiones
  exclude_sale_items: boolean
  exclude_categories?: string[]
  exclude_products?: string[]

  // Límites de uso
  usage_limit?: number
  usage_limit_per_user?: number
  usage_count: number

  // Fechas
  starts_at: string
  ends_at?: string

  // Configuración
  is_active: boolean
  is_paused?: boolean
  is_stackable: boolean
  requires_coupon_code: boolean
  coupon_code?: string

  // Targeting
  customer_groups?: string[]
  first_time_customers_only: boolean

  // Display
  banner_text?: string
  banner_color?: string
  show_on_product_page: boolean
  show_on_category_page: boolean
  show_on_homepage: boolean

  // Metadata
  created_at: string
  updated_at: string
  created_by: string

  // Estado calculado
  status: 'active' | 'inactive' | 'scheduled' | 'expired' | 'paused'

  // Relaciones
  categories?: Array<{
    id: string
    name: string
  }>
  products?: Array<{
    id: string
    name: string
    sku: string
  }>
  brands?: Array<{
    id: string
    name: string
  }>
  creator?: {
    full_name: string
    email: string
  }

  // Estadísticas de uso
  usage_stats?: {
    total_usage: number
    unique_users: number
    total_discount_given: number
    average_order_value: number
    conversion_rate: number
    recent_usage: Array<{
      date: string
      usage_count: number
      discount_given: number
    }>
  }
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

async function getPromotionById(promotionId: string, includeStats = false) {
  // Obtener promoción con relaciones
  const { data: promotion, error } = await supabase
    .from('promotions')
    .select(
      `
      *,
      categories:promotion_categories!promotion_categories_promotion_id_fkey(
        category:categories!promotion_categories_category_id_fkey(
          id,
          name
        )
      ),
      products:promotion_products!promotion_products_promotion_id_fkey(
        product:products!promotion_products_product_id_fkey(
          id,
          name,
          sku
        )
      ),
      brands:promotion_brands!promotion_brands_promotion_id_fkey(
        brand:brands!promotion_brands_brand_id_fkey(
          id,
          name
        )
      ),
      bundle_products:promotion_bundle_products!promotion_bundle_products_promotion_id_fkey(
        product_id,
        quantity,
        product:products!promotion_bundle_products_product_id_fkey(
          name,
          sku,
          price
        )
      ),
      creator:profiles!promotions_created_by_fkey(
        full_name,
        email
      )
    `
    )
    .eq('id', promotionId)
    .single()

  if (error) {
    throw new Error(`Error al obtener promoción: ${error.message}`)
  }

  if (!promotion) {
    throw new Error('Promoción no encontrada')
  }

  // Calcular estado
  const now = new Date()
  const startsAt = new Date(promotion.starts_at)
  const endsAt = promotion.ends_at ? new Date(promotion.ends_at) : null

  let status: 'active' | 'inactive' | 'scheduled' | 'expired' | 'paused'

  if (promotion.is_paused) {
    status = 'paused'
  } else if (!promotion.is_active) {
    status = 'inactive'
  } else if (now < startsAt) {
    status = 'scheduled'
  } else if (endsAt && now > endsAt) {
    status = 'expired'
  } else {
    status = 'active'
  }

  // Procesar datos
  const processedPromotion = {
    ...promotion,
    status,
    categories: promotion.categories?.map((pc: any) => pc.category) || [],
    products: promotion.products?.map((pp: any) => pp.product) || [],
    brands: promotion.brands?.map((pb: any) => pb.brand) || [],
    bundle_products:
      promotion.bundle_products?.map((bp: any) => ({
        product_id: bp.product_id,
        quantity: bp.quantity,
        product: bp.product,
      })) || [],
  }

  // Incluir estadísticas si se solicita
  if (includeStats) {
    const usageStats = await getPromotionUsageStats(promotionId)
    processedPromotion.usage_stats = usageStats
  }

  return processedPromotion
}

async function getPromotionUsageStats(promotionId: string) {
  // Obtener uso de la promoción
  const { data: usage, error } = await supabase
    .from('promotion_usage')
    .select('*')
    .eq('promotion_id', promotionId)

  if (error) {
    throw new Error(`Error al obtener estadísticas de uso: ${error.message}`)
  }

  const totalUsage = usage?.length || 0
  const uniqueUsers = new Set(usage?.map(u => u.user_id) || []).size
  const totalDiscountGiven = (usage || []).reduce((sum, u) => sum + (u.discount_amount || 0), 0)

  // Calcular valor promedio de orden
  const orderIds = [...new Set(usage?.map(u => u.order_id) || [])]
  let averageOrderValue = 0

  if (orderIds.length > 0) {
    const { data: orders } = await supabase.from('orders').select('total_amount').in('id', orderIds)

    const totalOrderValue = (orders || []).reduce((sum, o) => sum + o.total_amount, 0)
    averageOrderValue = totalOrderValue / orderIds.length
  }

  // Calcular tasa de conversión (simplificada)
  const conversionRate = uniqueUsers > 0 ? (orderIds.length / uniqueUsers) * 100 : 0

  // Uso reciente (últimos 30 días)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const recentUsage = (usage || [])
    .filter(u => new Date(u.created_at) >= thirtyDaysAgo)
    .reduce(
      (acc, u) => {
        const date = new Date(u.created_at).toISOString().split('T')[0]
        if (!acc[date]) {
          acc[date] = { usage_count: 0, discount_given: 0 }
        }
        acc[date].usage_count++
        acc[date].discount_given += u.discount_amount || 0
        return acc
      },
      {} as Record<string, { usage_count: number; discount_given: number }>
    )

  const recentUsageArray = Object.entries(recentUsage)
    .map(([date, stats]) => ({ date, ...stats }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return {
    total_usage: totalUsage,
    unique_users: uniqueUsers,
    total_discount_given: totalDiscountGiven,
    average_order_value: averageOrderValue,
    conversion_rate: conversionRate,
    recent_usage: recentUsageArray,
  }
}

async function updatePromotion(
  promotionId: string,
  updateData: z.infer<typeof UpdatePromotionSchema>,
  userId: string
) {
  // Validar fechas si se proporcionan
  if (updateData.starts_at && updateData.ends_at) {
    const startsAt = new Date(updateData.starts_at)
    const endsAt = new Date(updateData.ends_at)

    if (startsAt >= endsAt) {
      throw new Error('La fecha de inicio debe ser anterior a la fecha de finalización')
    }
  }

  // Validar código de cupón si se cambia
  if (updateData.coupon_code) {
    const { data: existingPromotion } = await supabase
      .from('promotions')
      .select('id')
      .eq('coupon_code', updateData.coupon_code)
      .neq('id', promotionId)
      .single()

    if (existingPromotion) {
      throw new Error('Ya existe otra promoción con este código de cupón')
    }
  }

  // Separar datos de relaciones
  const { category_ids, product_ids, brand_ids, bundle_products, ...promotionUpdateData } =
    updateData

  // Actualizar promoción principal
  const { data: updatedPromotion, error: updateError } = await supabase
    .from('promotions')
    .update({
      ...promotionUpdateData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', promotionId)
    .select()
    .single()

  if (updateError) {
    throw new Error(`Error al actualizar promoción: ${updateError.message}`)
  }

  // Actualizar relaciones si se proporcionan
  if (updateData.applicable_to === 'categories' && category_ids !== undefined) {
    // Eliminar relaciones existentes
    await supabase.from('promotion_categories').delete().eq('promotion_id', promotionId)

    // Crear nuevas relaciones
    if (category_ids.length > 0) {
      const categoryInserts = category_ids.map(categoryId => ({
        promotion_id: promotionId,
        category_id: categoryId,
      }))

      const { error: categoryError } = await supabase
        .from('promotion_categories')
        .insert(categoryInserts)

      if (categoryError) {
        throw new Error(`Error al actualizar categorías: ${categoryError.message}`)
      }
    }
  }

  if (updateData.applicable_to === 'products' && product_ids !== undefined) {
    // Eliminar relaciones existentes
    await supabase.from('promotion_products').delete().eq('promotion_id', promotionId)

    // Crear nuevas relaciones
    if (product_ids.length > 0) {
      const productInserts = product_ids.map(productId => ({
        promotion_id: promotionId,
        product_id: productId,
      }))

      const { error: productError } = await supabase
        .from('promotion_products')
        .insert(productInserts)

      if (productError) {
        throw new Error(`Error al actualizar productos: ${productError.message}`)
      }
    }
  }

  if (updateData.applicable_to === 'brands' && brand_ids !== undefined) {
    // Eliminar relaciones existentes
    await supabase.from('promotion_brands').delete().eq('promotion_id', promotionId)

    // Crear nuevas relaciones
    if (brand_ids.length > 0) {
      const brandInserts = brand_ids.map(brandId => ({
        promotion_id: promotionId,
        brand_id: brandId,
      }))

      const { error: brandError } = await supabase.from('promotion_brands').insert(brandInserts)

      if (brandError) {
        throw new Error(`Error al actualizar marcas: ${brandError.message}`)
      }
    }
  }

  // Actualizar productos del bundle si aplica
  if (updateData.type === 'bundle_deal' && bundle_products !== undefined) {
    // Eliminar productos del bundle existentes
    await supabase.from('promotion_bundle_products').delete().eq('promotion_id', promotionId)

    // Crear nuevos productos del bundle
    if (bundle_products.length > 0) {
      const bundleInserts = bundle_products.map(item => ({
        promotion_id: promotionId,
        product_id: item.product_id,
        quantity: item.quantity,
      }))

      const { error: bundleError } = await supabase
        .from('promotion_bundle_products')
        .insert(bundleInserts)

      if (bundleError) {
        throw new Error(`Error al actualizar bundle de productos: ${bundleError.message}`)
      }
    }
  }

  return updatedPromotion
}

async function deletePromotion(promotionId: string) {
  // Verificar si la promoción tiene uso activo
  const { data: activeUsage } = await supabase
    .from('promotion_usage')
    .select('id')
    .eq('promotion_id', promotionId)
    .limit(1)

  if (activeUsage && activeUsage.length > 0) {
    // En lugar de eliminar, desactivar la promoción
    const { error: deactivateError } = await supabase
      .from('promotions')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', promotionId)

    if (deactivateError) {
      throw new Error(`Error al desactivar promoción: ${deactivateError.message}`)
    }

    return { deleted: false, deactivated: true }
  }

  // Eliminar relaciones primero
  await Promise.all([
    supabase.from('promotion_categories').delete().eq('promotion_id', promotionId),
    supabase.from('promotion_products').delete().eq('promotion_id', promotionId),
    supabase.from('promotion_brands').delete().eq('promotion_id', promotionId),
    supabase.from('promotion_bundle_products').delete().eq('promotion_id', promotionId),
  ])

  // Eliminar promoción
  const { error: deleteError } = await supabase.from('promotions').delete().eq('id', promotionId)

  if (deleteError) {
    throw new Error(`Error al eliminar promoción: ${deleteError.message}`)
  }

  return { deleted: true, deactivated: false }
}

async function duplicatePromotion(promotionId: string, userId: string) {
  // Obtener promoción original
  const originalPromotion = await getPromotionById(promotionId)

  // Preparar datos para duplicación
  const duplicateData = {
    ...originalPromotion,
    name: `${originalPromotion.name} (Copia)`,
    coupon_code: originalPromotion.coupon_code
      ? `${originalPromotion.coupon_code}_COPY`
      : undefined,
    is_active: false, // Crear como inactiva
    usage_count: 0,
    created_by: userId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  // Remover campos que no deben duplicarse
  delete duplicateData.id
  delete duplicateData.status
  delete duplicateData.categories
  delete duplicateData.products
  delete duplicateData.brands
  delete duplicateData.bundle_products
  delete duplicateData.creator
  delete duplicateData.usage_stats

  // Crear nueva promoción
  const { data: newPromotion, error: createError } = await supabase
    .from('promotions')
    .insert(duplicateData)
    .select()
    .single()

  if (createError) {
    throw new Error(`Error al duplicar promoción: ${createError.message}`)
  }

  // Duplicar relaciones
  if (originalPromotion.categories?.length) {
    const categoryInserts = originalPromotion.categories.map(category => ({
      promotion_id: newPromotion.id,
      category_id: category.id,
    }))

    await supabase.from('promotion_categories').insert(categoryInserts)
  }

  if (originalPromotion.products?.length) {
    const productInserts = originalPromotion.products.map(product => ({
      promotion_id: newPromotion.id,
      product_id: product.id,
    }))

    await supabase.from('promotion_products').insert(productInserts)
  }

  if (originalPromotion.brands?.length) {
    const brandInserts = originalPromotion.brands.map(brand => ({
      promotion_id: newPromotion.id,
      brand_id: brand.id,
    }))

    await supabase.from('promotion_brands').insert(brandInserts)
  }

  if (originalPromotion.bundle_products?.length) {
    const bundleInserts = originalPromotion.bundle_products.map(item => ({
      promotion_id: newPromotion.id,
      product_id: item.product_id,
      quantity: item.quantity,
    }))

    await supabase.from('promotion_bundle_products').insert(bundleInserts)
  }

  return newPromotion
}

async function logAuditAction(action: string, promotionId: string, userId: string, details?: any) {
  try {
    await supabase.from('audit_logs').insert({
      table_name: 'promotions',
      record_id: promotionId,
      action,
      user_id: userId,
      changes: details,
      created_at: new Date().toISOString(),
    })
  } catch (error) {
    logger.log(LogLevel.WARN, LogCategory.AUDIT, 'Error al registrar auditoría', { error })
  }
}

// ===================================
// GET - Obtener promoción por ID
// ===================================
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const startTime = Date.now()

  try {
    // Rate limiting
    const rateLimitResult = await checkRateLimit(
      request,
      {
        windowMs: RATE_LIMIT_CONFIGS.admin.windowMs,
        maxRequests: RATE_LIMIT_CONFIGS.admin.maxRequests,
        message: RATE_LIMIT_CONFIGS.admin.message,
      },
      'admin-promotion-detail'
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

    // Validar ID de promoción
    if (!params.id || typeof params.id !== 'string') {
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'ID de promoción inválido',
      }
      return NextResponse.json(errorResponse, { status: 400 })
    }

    // Verificar si se solicitan estadísticas
    const { searchParams } = new URL(request.url)
    const includeStats = searchParams.get('include_stats') === 'true'

    // Obtener promoción
    const promotion = await getPromotionById(params.id, includeStats)

    // Registrar métricas
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/promotions/[id]',
      method: 'GET',
      statusCode: 200,
      responseTime: Date.now() - startTime,
      userId: authResult.userId,
    })

    const response: ApiResponse<PromotionData> = {
      data: promotion,
      success: true,
      message: 'Promoción obtenida exitosamente',
    }

    const nextResponse = NextResponse.json(response)
    addRateLimitHeaders(nextResponse, rateLimitResult)
    return nextResponse
  } catch (error) {
    logger.log(LogLevel.ERROR, LogCategory.API, 'Error en GET /api/admin/promotions/[id]', {
      error,
      promotionId: params.id,
    })

    // Registrar métricas de error
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/promotions/[id]',
      method: 'GET',
      statusCode: error instanceof Error && error.message.includes('no encontrada') ? 404 : 500,
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    const statusCode = error instanceof Error && error.message.includes('no encontrada') ? 404 : 500
    const errorResponse: ApiResponse<null> = {
      data: null,
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor',
    }

    return NextResponse.json(errorResponse, { status: statusCode })
  }
}

// ===================================
// PUT - Actualizar promoción
// ===================================
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const startTime = Date.now()

  try {
    // Rate limiting
    const rateLimitResult = await checkRateLimit(
      request,
      {
        windowMs: RATE_LIMIT_CONFIGS.admin.windowMs,
        maxRequests: Math.floor(RATE_LIMIT_CONFIGS.admin.maxRequests / 2),
        message: 'Demasiadas actualizaciones de promoción',
      },
      'admin-promotion-update'
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

    // Validar ID de promoción
    if (!params.id || typeof params.id !== 'string') {
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'ID de promoción inválido',
      }
      return NextResponse.json(errorResponse, { status: 400 })
    }

    // Validar datos de entrada
    const body = await request.json()
    const { action } = body

    if (action) {
      // Manejar acciones especiales
      const actionData = PromotionActionSchema.parse(body)
      let result

      switch (actionData.action) {
        case 'activate':
          result = await updatePromotion(
            params.id,
            { is_active: true, is_paused: false },
            authResult.userId!
          )
          await logAuditAction('activate', params.id, authResult.userId!, { action: 'activate' })
          break
        case 'deactivate':
          result = await updatePromotion(params.id, { is_active: false }, authResult.userId!)
          await logAuditAction('deactivate', params.id, authResult.userId!, {
            action: 'deactivate',
          })
          break
        case 'pause':
          result = await updatePromotion(params.id, { is_paused: true }, authResult.userId!)
          await logAuditAction('pause', params.id, authResult.userId!, { action: 'pause' })
          break
        case 'resume':
          result = await updatePromotion(params.id, { is_paused: false }, authResult.userId!)
          await logAuditAction('resume', params.id, authResult.userId!, { action: 'resume' })
          break
        case 'duplicate':
          result = await duplicatePromotion(params.id, authResult.userId!)
          await logAuditAction('duplicate', params.id, authResult.userId!, {
            new_promotion_id: result.id,
          })
          break
        case 'extend':
          if (!actionData.extend_days) {
            throw new Error('Días de extensión requeridos')
          }

          const { data: currentPromotion } = await supabase
            .from('promotions')
            .select('ends_at')
            .eq('id', params.id)
            .single()

          if (!currentPromotion?.ends_at) {
            throw new Error('La promoción no tiene fecha de finalización')
          }

          const newEndDate = new Date(currentPromotion.ends_at)
          newEndDate.setDate(newEndDate.getDate() + actionData.extend_days)

          result = await updatePromotion(
            params.id,
            { ends_at: newEndDate.toISOString() },
            authResult.userId!
          )
          await logAuditAction('extend', params.id, authResult.userId!, {
            extend_days: actionData.extend_days,
            new_end_date: newEndDate.toISOString(),
          })
          break
        default:
          throw new Error('Acción no válida')
      }

      // Registrar métricas
      metricsCollector.recordApiCall({
        endpoint: '/api/admin/promotions/[id]',
        method: 'PUT',
        statusCode: 200,
        responseTime: Date.now() - startTime,
        userId: authResult.userId,
      })

      const response: ApiResponse<typeof result> = {
        data: result,
        success: true,
        message: `Acción '${actionData.action}' ejecutada exitosamente`,
      }

      const nextResponse = NextResponse.json(response)
      addRateLimitHeaders(nextResponse, rateLimitResult)
      return nextResponse
    }

    // Actualización normal
    const updateData = UpdatePromotionSchema.parse(body)
    const updatedPromotion = await updatePromotion(params.id, updateData, authResult.userId!)

    // Registrar auditoría
    await logAuditAction('update', params.id, authResult.userId!, updateData)

    // Registrar métricas
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/promotions/[id]',
      method: 'PUT',
      statusCode: 200,
      responseTime: Date.now() - startTime,
      userId: authResult.userId,
    })

    const response: ApiResponse<typeof updatedPromotion> = {
      data: updatedPromotion,
      success: true,
      message: 'Promoción actualizada exitosamente',
    }

    const nextResponse = NextResponse.json(response)
    addRateLimitHeaders(nextResponse, rateLimitResult)
    return nextResponse
  } catch (error) {
    logger.log(LogLevel.ERROR, LogCategory.API, 'Error en PUT /api/admin/promotions/[id]', {
      error,
      promotionId: params.id,
    })

    // Registrar métricas de error
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/promotions/[id]',
      method: 'PUT',
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

// ===================================
// DELETE - Eliminar promoción
// ===================================
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const startTime = Date.now()

  try {
    // Rate limiting
    const rateLimitResult = await checkRateLimit(
      request,
      {
        windowMs: RATE_LIMIT_CONFIGS.admin.windowMs,
        maxRequests: Math.floor(RATE_LIMIT_CONFIGS.admin.maxRequests / 4),
        message: 'Demasiadas eliminaciones de promoción',
      },
      'admin-promotion-delete'
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

    // Validar ID de promoción
    if (!params.id || typeof params.id !== 'string') {
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'ID de promoción inválido',
      }
      return NextResponse.json(errorResponse, { status: 400 })
    }

    // Verificar que la promoción existe
    const { data: existingPromotion } = await supabase
      .from('promotions')
      .select('id, name')
      .eq('id', params.id)
      .single()

    if (!existingPromotion) {
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Promoción no encontrada',
      }
      return NextResponse.json(errorResponse, { status: 404 })
    }

    // Eliminar promoción
    const deleteResult = await deletePromotion(params.id)

    // Registrar auditoría
    await logAuditAction(
      deleteResult.deleted ? 'delete' : 'deactivate',
      params.id,
      authResult.userId!,
      {
        promotion_name: existingPromotion.name,
        deleted: deleteResult.deleted,
        deactivated: deleteResult.deactivated,
      }
    )

    // Registrar métricas
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/promotions/[id]',
      method: 'DELETE',
      statusCode: 200,
      responseTime: Date.now() - startTime,
      userId: authResult.userId,
    })

    const message = deleteResult.deleted
      ? 'Promoción eliminada exitosamente'
      : 'Promoción desactivada (tenía uso activo)'

    const response: ApiResponse<typeof deleteResult> = {
      data: deleteResult,
      success: true,
      message,
    }

    const nextResponse = NextResponse.json(response)
    addRateLimitHeaders(nextResponse, rateLimitResult)
    return nextResponse
  } catch (error) {
    logger.log(LogLevel.ERROR, LogCategory.API, 'Error en DELETE /api/admin/promotions/[id]', {
      error,
      promotionId: params.id,
    })

    // Registrar métricas de error
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/promotions/[id]',
      method: 'DELETE',
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
