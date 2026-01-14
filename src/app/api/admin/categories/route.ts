// Configuración para Node.js Runtime
export const runtime = 'nodejs'

// ===================================
// PINTEYA E-COMMERCE - ADMIN CATEGORIES API
// ===================================

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdminAuth } from '@/lib/auth/enterprise-auth-utils'
import { getSupabaseClient } from '@/lib/integrations/supabase'
import { checkRateLimit } from '@/lib/enterprise/rate-limiter'
import { logger, LogLevel, LogCategory } from '@/lib/enterprise/logger'
import { metricsCollector } from '@/lib/enterprise/metrics'
import { ApiResponse } from '@/types/api'
import { Category } from '@/types/database'
import { 
  getCategoriesServer, 
  createCategoryInDB,
  getCategoriesFromDB 
} from '@/lib/categories/api/server'
import { createCategoryService } from '@/lib/categories/service'
import type { CategoryApiResponse, CreateCategoryPayload } from '@/lib/categories/types'
import { composeMiddlewares } from '@/lib/api/middleware-composer'
import { withErrorHandler, ApiError, ValidationError } from '@/lib/api/error-handler'
import { withApiLogging } from '@/lib/api/api-logger'
import { withAdminAuth } from '@/lib/auth/api-auth-middleware'

// ===================================
// CONFIGURACIÓN
// ===================================
const RATE_LIMIT_CONFIGS = {
  admin: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 100,
    message: 'Demasiadas solicitudes de categorías',
  },
}

// ===================================
// ESQUEMAS DE VALIDACIÓN
// ===================================
const CategoryFiltersSchema = z.object({
  search: z.string().optional(),
  parent_id: z.string().uuid().optional(),
  is_active: z.boolean().optional(),
  level: z.coerce.number().int().min(0).max(5).optional(),
  has_products: z.boolean().optional(),
  sort_by: z
    .enum(['name', 'created_at', 'updated_at', 'product_count', 'order_index'])
    .default('name'),
  sort_order: z.enum(['asc', 'desc']).default('asc'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

const CreateCategorySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre es muy largo'),
  slug: z
    .string()
    .min(1, 'El slug es requerido')
    .max(100, 'El slug es muy largo')
    .regex(/^[a-z0-9-]+$/, 'El slug solo puede contener letras minúsculas, números y guiones'),
  description: z.string().max(500, 'La descripción es muy larga').optional(),
  parent_id: z.string().uuid().nullable().optional(), // Acepta null, undefined o string UUID

  // SEO
  meta_title: z.string().max(60, 'El meta título es muy largo').optional(),
  meta_description: z.string().max(160, 'La meta descripción es muy larga').optional(),
  meta_keywords: z.array(z.string()).max(10, 'Máximo 10 palabras clave').optional(),

  // Imagen
  image_url: z.string().url('URL de imagen inválida').optional(),
  image_alt: z.string().max(100, 'El texto alternativo es muy largo').optional(),

  // Configuración
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  show_in_menu: z.boolean().default(true),
  order_index: z.number().int().min(0).default(0),
})

const BulkCategoryActionSchema = z.object({
  action: z.enum(['activate', 'deactivate', 'feature', 'unfeature', 'delete', 'move', 'reorder']),
  category_ids: z
    .array(z.string().uuid())
    .min(1, 'Debe seleccionar al menos una categoría')
    .max(50, 'Máximo 50 categorías por operación'),

  // Para move
  new_parent_id: z.string().uuid().optional(),

  // Para reorder
  order_updates: z
    .array(
      z.object({
        category_id: z.string().uuid(),
        order_index: z.number().int().min(0),
      })
    )
    .optional(),
})

// ===================================
// FUNCIONES AUXILIARES
// ===================================
async function getCategoriesWithStats(filters: z.infer<typeof CategoryFiltersSchema>) {
  // Use new CategoryService to get categories
  const service = createCategoryService(true)
  
  // Convert filters to CategoryFilters format
  const categoryFilters = {
    search: filters.search,
    parent_id: filters.parent_id ? parseInt(filters.parent_id, 10) : null,
    sortBy: filters.sort_by === 'product_count' ? 'products_count' : filters.sort_by === 'order_index' ? 'display_order' : filters.sort_by,
    sortOrder: filters.sort_order,
    limit: filters.limit,
    offset: (filters.page - 1) * filters.limit,
  }

  // Get categories with counts
  const uiCategories = await service.getCategoriesWithCounts(categoryFilters)
  const total = await service.getCategoryCount(categoryFilters)

  // Convert to DB format for backward compatibility
  const processedCategories = uiCategories.map(cat => ({
    id: parseInt(cat.id, 10),
    name: cat.name,
    slug: cat.slug,
    description: cat.description || null,
    icon: cat.icon,
    image_url: cat.icon, // Map icon to image_url
    parent_id: cat.parentId ? parseInt(cat.parentId, 10) : null,
    created_at: cat.createdAt || new Date().toISOString(),
    updated_at: cat.updatedAt || null,
    display_order: cat.displayOrder || null,
    products_count: cat.count || 0,
    children: [], // Initialize as empty array
    meta_keywords: [], // Default value
  }))

  return {
    categories: processedCategories,
    total: total,
    page: filters.page,
    limit: filters.limit,
    pages: Math.ceil((count || 0) / filters.limit),
  }
}

async function createCategory(categoryData: z.infer<typeof CreateCategorySchema>, userId: string) {
  // Use new CategoryService to create category
  const payload: CreateCategoryPayload = {
    name: categoryData.name,
    slug: categoryData.slug,
    description: categoryData.description,
    image_url: categoryData.image_url || null,
    parent_id: categoryData.parent_id ? parseInt(categoryData.parent_id, 10) : null,
    display_order: categoryData.order_index || null,
  }

  const newCategory = await createCategoryInDB(payload, true)

  // Convert to DB format for backward compatibility
  return {
    id: parseInt(newCategory.id, 10),
    name: newCategory.name,
    slug: newCategory.slug,
    description: newCategory.description || null,
    icon: newCategory.icon,
    image_url: newCategory.icon,
    parent_id: newCategory.parentId ? parseInt(newCategory.parentId, 10) : null,
    created_at: newCategory.createdAt || new Date().toISOString(),
    updated_at: newCategory.updatedAt || null,
    display_order: newCategory.displayOrder || null,
    products_count: newCategory.count || 0,
  }
}

async function logAuditAction(action: string, categoryId: string, userId: string, details?: any) {
  try {
    const supabase = getSupabaseClient(true)
    if (supabase) {
      await supabase.from('audit_logs').insert({
        table_name: 'categories',
        record_id: categoryId,
        action,
        user_id: userId,
        changes: details,
        created_at: new Date().toISOString(),
      })
    }
  } catch (error) {
    logger.log(LogLevel.WARN, LogCategory.AUDIT, 'Error al registrar auditoría', { error })
  }
}

// ===================================
// GET /api/admin/categories - Obtener categorías (Admin)
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
        message: RATE_LIMIT_CONFIGS.admin.message,
      },
      'admin-categories'
    )

    if (!rateLimitResult.success) {
      const response = NextResponse.json({ error: rateLimitResult.message }, { status: 429 })
      // Rate limit headers are handled internally
      return response
    }

    // Verificar autenticación de admin
    const authResult = await requireAdminAuth(request, ['categories_read'])

    if (!authResult.success) {
      return NextResponse.json(
        {
          error: authResult.error,
          code: authResult.code,
          enterprise: true,
          timestamp: new Date().toISOString(),
        },
        { status: authResult.status || 401 }
      )
    }

    // Parsear parámetros de consulta
    const { searchParams } = new URL(request.url)
    const rawFilters = {
      search: searchParams.get('search') || undefined,
      parent_id: searchParams.get('parent_id') || undefined,
      is_active: searchParams.get('is_active')
        ? searchParams.get('is_active') === 'true'
        : undefined,
      level: searchParams.get('level') || undefined,
      has_products: searchParams.get('has_products')
        ? searchParams.get('has_products') === 'true'
        : undefined,
      sort_by: searchParams.get('sort_by') || 'name',
      sort_order: searchParams.get('sort_order') || 'asc',
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 20,
    }
    const filters = CategoryFiltersSchema.parse(rawFilters)

    // Obtener categorías
    const result = await getCategoriesWithStats(filters)

    // Registrar métricas
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/categories',
      method: 'GET',
      statusCode: 200,
      responseTime: Date.now() - startTime,
      userId: authResult.user?.id,
    })

    const response: ApiResponse<{
      categories: Category[]
      total: number
      pagination: {
        page: number
        limit: number
        totalPages: number
        hasNext: boolean
        hasPrev: boolean
      }
    }> = {
      data: {
        categories: result.categories,
        total: result.total,
        pagination: {
          page: result.page,
          limit: result.limit,
          totalPages: result.pages,
          hasNext: result.page < result.pages,
          hasPrev: result.page > 1,
        },
      },
      success: true,
      message: `${result.categories.length} categorías encontradas`,
    }

    const nextResponse = NextResponse.json(response)
    // Rate limit headers are handled internally
    return nextResponse
  } catch (error: any) {
    logger.log(LogLevel.ERROR, LogCategory.API, 'Error en GET /api/admin/categories', {
      error: error.message,
    })

    // Registrar métricas de error
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/categories',
      method: 'GET',
      statusCode: 500,
      responseTime: Date.now() - startTime,
      error: error.message || 'Unknown error',
    })

    const errorResponse: ApiResponse<null> = {
      data: null,
      success: false,
      error: error.message || 'Error interno del servidor',
    }

    return NextResponse.json(errorResponse, { status: 500 })
  }
}

// ===================================
// POST /api/admin/categories - Crear categoría o operaciones masivas (Admin)
// ===================================
const postHandler = async (request: NextRequest) => {
  const startTime = Date.now()

  // Rate limiting (después de autenticación)
  const rateLimitResult = await checkRateLimit(
    request,
    {
      windowMs: RATE_LIMIT_CONFIGS.admin.windowMs,
      maxRequests: Math.floor(RATE_LIMIT_CONFIGS.admin.maxRequests / 2),
      message: 'Demasiadas creaciones de categorías',
    },
    'admin-categories-create'
  )

  if (!rateLimitResult.success) {
    throw new ApiError(rateLimitResult.message, 429, 'RATE_LIMIT_EXCEEDED')
  }

  // Obtener usuario autenticado (el middleware withAdminAuth ya verificó la autenticación)
  let userId: string | undefined
  if (process.env.BYPASS_AUTH !== 'true') {
    try {
      const { auth } = await import('@/lib/auth/config')
      const session = await auth()
      userId = session?.user?.id
    } catch (authError: any) {
      console.warn('[POST /categories] No se pudo obtener usuario')
    }
  }

  const body = await request.json()
    const { operation } = body

    if (operation === 'bulk') {
      // Operación masiva
      const bulkData = BulkCategoryActionSchema.parse(body)
      const supabase = getSupabaseClient(true)

      if (!supabase) {
        throw new Error('Cliente administrativo de Supabase no disponible')
      }

      // Implementar operaciones masivas
      let updateData: any = {}

      switch (bulkData.action) {
        case 'activate':
          updateData = { is_active: true }
          break
        case 'deactivate':
          updateData = { is_active: false }
          break
        case 'feature':
          updateData = { is_featured: true }
          break
        case 'unfeature':
          updateData = { is_featured: false }
          break
        case 'delete':
          // Verificar que las categorías no tengan productos
          const { data: categoriesWithProducts } = await supabase
            .from('categories')
            .select('id, name, product_count')
            .in('id', bulkData.category_ids)
            .gt('product_count', 0)

          if (categoriesWithProducts && categoriesWithProducts.length > 0) {
            throw new Error(
              `No se pueden eliminar categorías con productos: ${categoriesWithProducts.map(c => c.name).join(', ')}`
            )
          }

          const { data: deletedCategories, error: deleteError } = await supabase
            .from('categories')
            .delete()
            .in('id', bulkData.category_ids)
            .select()

          if (deleteError) {
            throw new Error(`Error eliminando categorías: ${deleteError.message}`)
          }

          // Registrar auditoría para cada categoría eliminada
          for (const categoryId of bulkData.category_ids) {
            await logAuditAction('bulk_delete', categoryId, userId!, bulkData)
          }

          const deleteResponse: ApiResponse<typeof deletedCategories> = {
            data: deletedCategories,
            success: true,
            message: `${deletedCategories?.length || 0} categorías eliminadas`,
          }

          const deleteNextResponse = NextResponse.json(deleteResponse)
          // Rate limit headers are handled internally
          return deleteNextResponse

        default:
          throw new Error('Operación masiva no implementada')
      }

      if (Object.keys(updateData).length > 0) {
        const { data: updatedCategories, error: updateError } = await supabase
          .from('categories')
          .update({ ...updateData, updated_at: new Date().toISOString() })
          .in('id', bulkData.category_ids)
          .select()

        if (updateError) {
          throw new Error(`Error en operación masiva: ${updateError.message}`)
        }

        // Registrar auditoría para cada categoría
        for (const categoryId of bulkData.category_ids) {
          await logAuditAction(
            `bulk_${bulkData.action}`,
            categoryId,
            userId!,
            bulkData
          )
        }

        const bulkResponse: ApiResponse<typeof updatedCategories> = {
          data: updatedCategories,
          success: true,
          message: `Operación '${bulkData.action}' ejecutada en ${updatedCategories?.length || 0} categorías`,
        }

        const bulkNextResponse = NextResponse.json(bulkResponse)
        // Rate limit headers are handled internally
        return bulkNextResponse
      }
    }

    // Crear categoría individual
    const categoryData = CreateCategorySchema.parse(body)

    // Asegurar que parent_id sea siempre NULL (no crear categorías hijas)
    const categoryPayload = {
      ...categoryData,
      parent_id: null, // Forzar a null - no crear categorías hijas
    }

    // Validar que image_url esté presente
    if (!categoryPayload.image_url) {
      throw ValidationError('La imagen de la categoría es requerida')
    }

    // Use new CategoryService to create category
    const newCategory = await createCategory(categoryPayload, userId!)

    // Registrar auditoría
    await logAuditAction('create', newCategory.id, userId!, categoryData)

    // Registrar métricas
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/categories',
      method: 'POST',
      statusCode: 201,
      responseTime: Date.now() - startTime,
      userId: userId,
    })

    const response: ApiResponse<Category> = {
      data: newCategory,
      success: true,
      message: 'Categoría creada exitosamente',
    }

    return NextResponse.json(response, { status: 201 })
}

// Aplicar middlewares
export const POST = composeMiddlewares(
  withAdminAuth(['categories_create']), // Ejecutar PRIMERO para verificar autenticación
  withErrorHandler,
  withApiLogging
)(postHandler)
