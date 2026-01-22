// Configuración para Node.js Runtime
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/integrations/supabase/server'
import { requireAdminAuth } from '@/lib/auth/admin-auth'
import { checkRateLimit } from '@/lib/enterprise/rate-limiter'
import { logger, LogLevel, LogCategory } from '@/lib/enterprise/logger'
import { metricsCollector } from '@/lib/enterprise/metrics'
// ⚡ MULTITENANT: Importar guard de tenant admin
import { withTenantAdmin, type TenantAdminGuardResult } from '@/lib/auth/guards/tenant-admin-guard'

// ===================================
// CONFIGURACIÓN
// ===================================
const RATE_LIMIT_CONFIGS = {
  admin: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 50, // Más restrictivo para operaciones masivas
  },
}

// ===================================
// ESQUEMAS DE VALIDACIÓN
// ===================================
const BulkCategoryActionSchema = z.object({
  action: z.enum([
    'activate',
    'deactivate',
    'feature',
    'unfeature',
    'delete',
    'update_parent',
    'reorder',
  ]),
  category_ids: z
    .array(z.string().uuid('ID de categoría inválido'))
    .min(1, 'Debe seleccionar al menos una categoría')
    .max(100, 'Máximo 100 categorías por operación'),
  data: z
    .object({
      parent_id: z.string().uuid('ID de categoría padre inválido').optional().nullable(),
      sort_order: z.number().int().min(0).optional(),
      is_active: z.boolean().optional(),
      is_featured: z.boolean().optional(),
    })
    .optional(),
})

const BulkCategoryExportSchema = z.object({
  format: z.enum(['csv', 'json', 'xlsx']).default('csv'),
  filters: z
    .object({
      is_active: z.boolean().optional(),
      is_featured: z.boolean().optional(),
      parent_id: z.string().uuid().optional().nullable(),
      search: z.string().optional(),
    })
    .optional(),
  fields: z.array(z.string()).optional(),
})

const BulkCategoryImportSchema = z.object({
  format: z.enum(['csv', 'json']),
  data: z
    .array(
      z.object({
        name: z.string().min(1, 'El nombre es requerido'),
        slug: z.string().optional(),
        description: z.string().optional(),
        parent_slug: z.string().optional(), // Para referenciar por slug
        is_active: z.boolean().default(true),
        is_featured: z.boolean().default(false),
        sort_order: z.number().int().min(0).default(0),
        meta_title: z.string().optional(),
        meta_description: z.string().optional(),
        meta_keywords: z.string().optional(),
      })
    )
    .min(1, 'Debe proporcionar al menos una categoría')
    .max(1000, 'Máximo 1000 categorías por importación'),
  options: z
    .object({
      update_existing: z.boolean().default(false),
      skip_duplicates: z.boolean().default(true),
    })
    .optional(),
})

// ===================================
// TIPOS
// ===================================
interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
  error?: string
  meta?: {
    total?: number
    processed?: number
    errors?: any[]
  }
}

interface Category {
  id: string
  name: string
  slug: string
  description?: string
  image_url?: string
  parent_id?: string
  is_active: boolean
  is_featured: boolean
  sort_order: number
  product_count: number
  meta_title?: string
  meta_description?: string
  meta_keywords?: string
  created_at: string
  updated_at: string
}

interface BulkOperationResult {
  success_count: number
  error_count: number
  errors: Array<{
    category_id?: string
    category_name?: string
    error: string
  }>
  processed_categories: Category[]
}

// ===================================
// FUNCIONES AUXILIARES
// ===================================
async function getCategoriesByIds(
  categoryIds: string[],
  tenantId: string // ⚡ MULTITENANT: Agregar tenantId
): Promise<Category[]> {
  const supabase = await createClient()

  // ⚡ MULTITENANT: Filtrar por tenant_id
  const { data: categories, error } = await supabase
    .from('categories')
    .select('*')
    .in('id', categoryIds)
    .eq('tenant_id', tenantId) // ⚡ MULTITENANT

  if (error) {
    throw new Error(`Error obteniendo categorías: ${error.message}`)
  }

  return categories || []
}

async function executeBulkAction(
  action: string,
  categoryIds: string[],
  tenantId: string, // ⚡ MULTITENANT: Agregar tenantId
  data?: any,
  userId?: string
): Promise<BulkOperationResult> {
  const supabase = getSupabaseClient(true)

  if (!supabase) {
    throw new Error('Cliente administrativo de Supabase no disponible')
  }

  const result: BulkOperationResult = {
    success_count: 0,
    error_count: 0,
    errors: [],
    processed_categories: [],
  }

  // ⚡ MULTITENANT: Obtener categorías existentes filtrando por tenant
  const categories = await getCategoriesByIds(categoryIds, tenantId)
  const foundIds = categories.map(c => c.id)
  const notFoundIds = categoryIds.filter(id => !foundIds.includes(id))

  // Agregar errores para categorías no encontradas
  notFoundIds.forEach(id => {
    result.errors.push({
      category_id: id,
      error: 'Categoría no encontrada',
    })
    result.error_count++
  })

  if (foundIds.length === 0) {
    return result
  }

  try {
    let updateData: any = {}
    let shouldUpdate = true

    switch (action) {
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
      case 'update_parent':
        updateData = { parent_id: data?.parent_id || null }

        // ⚡ MULTITENANT: Verificar jerarquías circulares dentro del tenant
        if (data?.parent_id) {
          // Verificar que el parent pertenece al tenant
          const { data: parentCategory } = await supabase
            .from('categories')
            .select('id, tenant_id')
            .eq('id', data.parent_id)
            .eq('tenant_id', tenantId)
            .single()
          
          if (!parentCategory) {
            result.errors.push({
              category_id: foundIds[0],
              error: 'La categoría padre no existe o no pertenece a este tenant',
            })
            result.error_count++
          } else {
            for (const categoryId of foundIds) {
              const isCircular = await checkCircularHierarchy(categoryId, data.parent_id, tenantId)
              if (isCircular) {
                result.errors.push({
                  category_id: categoryId,
                  category_name: categories.find(c => c.id === categoryId)?.name,
                  error: 'Crearía una jerarquía circular',
                })
                result.error_count++
              }
            }
          }
        }
        break
      case 'reorder':
        // Para reordenar, necesitamos manejar cada categoría individualmente
        shouldUpdate = false
        for (let i = 0; i < foundIds.length; i++) {
          const categoryId = foundIds[i]
          const sortOrder = (data?.sort_order || 0) + i

          // ⚡ MULTITENANT: Actualizar solo categorías del tenant
          const { error } = await supabase
            .from('categories')
            .update({
              sort_order: sortOrder,
              updated_at: new Date().toISOString(),
            })
            .eq('id', categoryId)
            .eq('tenant_id', tenantId) // ⚡ MULTITENANT

          if (error) {
            result.errors.push({
              category_id: categoryId,
              category_name: categories.find(c => c.id === categoryId)?.name,
              error: error.message,
            })
            result.error_count++
          } else {
            result.success_count++
          }
        }
        break
      case 'delete':
        // Verificar que las categorías no tengan productos o subcategorías
        const categoriesWithProducts = categories.filter(c => c.product_count > 0)
        if (categoriesWithProducts.length > 0) {
          categoriesWithProducts.forEach(category => {
            result.errors.push({
              category_id: category.id,
              category_name: category.name,
              error: `Tiene ${category.product_count} productos asociados`,
            })
            result.error_count++
          })
        }

        // ⚡ MULTITENANT: Verificar subcategorías del tenant
        const { data: subcategories } = await supabase
          .from('categories')
          .select('id, name, parent_id')
          .in('parent_id', foundIds)
          .eq('tenant_id', tenantId) // ⚡ MULTITENANT

        if (subcategories && subcategories.length > 0) {
          const parentIds = [...new Set(subcategories.map(s => s.parent_id))]
          parentIds.forEach(parentId => {
            const parentCategory = categories.find(c => c.id === parentId)
            const childCount = subcategories.filter(s => s.parent_id === parentId).length
            result.errors.push({
              category_id: parentId!,
              category_name: parentCategory?.name,
              error: `Tiene ${childCount} subcategorías`,
            })
            result.error_count++
          })
        }

        // Eliminar solo las categorías que no tienen restricciones
        const categoriesToDelete = foundIds.filter(
          id => !result.errors.some(e => e.category_id === id)
        )

        if (categoriesToDelete.length > 0) {
          const { data: deletedCategories, error: deleteError } = await supabase
            .from('categories')
            .delete()
            .in('id', categoriesToDelete)
            .select()

          if (deleteError) {
            categoriesToDelete.forEach(id => {
              result.errors.push({
                category_id: id,
                category_name: categories.find(c => c.id === id)?.name,
                error: deleteError.message,
              })
              result.error_count++
            })
          } else {
            result.success_count = deletedCategories?.length || 0
            result.processed_categories = deletedCategories || []
          }
        }
        shouldUpdate = false
        break
      default:
        throw new Error(`Acción '${action}' no implementada`)
    }

    if (shouldUpdate && Object.keys(updateData).length > 0) {
      // Filtrar IDs que no tuvieron errores
      const idsToUpdate = foundIds.filter(id => !result.errors.some(e => e.category_id === id))

      if (idsToUpdate.length > 0) {
        // ⚡ MULTITENANT: Actualizar solo categorías del tenant
        const { data: updatedCategories, error: updateError } = await supabase
          .from('categories')
          .update({
            ...updateData,
            updated_at: new Date().toISOString(),
          })
          .in('id', idsToUpdate)
          .eq('tenant_id', tenantId) // ⚡ MULTITENANT
          .select()

        if (updateError) {
          idsToUpdate.forEach(id => {
            result.errors.push({
              category_id: id,
              category_name: categories.find(c => c.id === id)?.name,
              error: updateError.message,
            })
            result.error_count++
          })
        } else {
          result.success_count = updatedCategories?.length || 0
          result.processed_categories = updatedCategories || []
        }
      }
    }

    // Registrar auditoría para operaciones exitosas
    if (userId && result.success_count > 0) {
      await logBulkAuditAction(
        action,
        result.processed_categories.map(c => c.id),
        userId,
        {
          action,
          data,
          result: {
            success_count: result.success_count,
            error_count: result.error_count,
          },
        }
      )
    }
  } catch (error: any) {
    // Si hay un error general, marcarlo para todas las categorías
    foundIds.forEach(id => {
      if (!result.errors.some(e => e.category_id === id)) {
        result.errors.push({
          category_id: id,
          category_name: categories.find(c => c.id === id)?.name,
          error: error.message || 'Error desconocido',
        })
        result.error_count++
      }
    })
  }

  return result
}

async function exportCategories(filters: any, format: string, fields?: string[]): Promise<any> {
  const supabase = getSupabaseClient(true)

  if (!supabase) {
    throw new Error('Cliente administrativo de Supabase no disponible')
  }

  let query = supabase.from('categories').select(`
      id,
      name,
      slug,
      description,
      image_url,
      parent_id,
      is_active,
      is_featured,
      sort_order,
      product_count,
      meta_title,
      meta_description,
      meta_keywords,
      created_at,
      updated_at,
      parent:parent_id(name, slug)
    `)

  // Aplicar filtros
  if (filters?.is_active !== undefined) {
    query = query.eq('is_active', filters.is_active)
  }
  if (filters?.is_featured !== undefined) {
    query = query.eq('is_featured', filters.is_featured)
  }
  if (filters?.parent_id !== undefined) {
    if (filters.parent_id === null) {
      query = query.is('parent_id', null)
    } else {
      query = query.eq('parent_id', filters.parent_id)
    }
  }
  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
  }

  const { data: categories, error } = await query.order('sort_order', { ascending: true })

  if (error) {
    throw new Error(`Error exportando categorías: ${error.message}`)
  }

  // Procesar datos según el formato
  const processedData =
    categories?.map(category => {
      const processed: any = {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description || '',
        image_url: category.image_url || '',
        parent_name: category.parent?.name || '',
        is_active: category.is_active,
        is_featured: category.is_featured,
        sort_order: category.sort_order,
        product_count: category.product_count,
        meta_title: category.meta_title || '',
        meta_description: category.meta_description || '',
        meta_keywords: category.meta_keywords || '',
        created_at: category.created_at,
        updated_at: category.updated_at,
      }

      // Filtrar campos si se especificaron
      if (fields && fields.length > 0) {
        const filtered: any = {}
        fields.forEach(field => {
          if (processed.hasOwnProperty(field)) {
            filtered[field] = processed[field]
          }
        })
        return filtered
      }

      return processed
    }) || []

  return {
    data: processedData,
    total: processedData.length,
    format,
    exported_at: new Date().toISOString(),
  }
}

async function importCategories(
  importData: any,
  options: any,
  tenantId: string, // ⚡ MULTITENANT: Agregar tenantId
  userId: string
): Promise<BulkOperationResult> {
  const supabase = getSupabaseClient(true)

  if (!supabase) {
    throw new Error('Cliente administrativo de Supabase no disponible')
  }

  const result: BulkOperationResult = {
    success_count: 0,
    error_count: 0,
    errors: [],
    processed_categories: [],
  }

  // ⚡ MULTITENANT: Obtener categorías existentes del tenant para verificar duplicados
  const { data: existingCategories } = await supabase
    .from('categories')
    .select('id, name, slug')
    .eq('tenant_id', tenantId) // ⚡ MULTITENANT

  const existingSlugs = new Set(existingCategories?.map(c => c.slug) || [])
  const existingNames = new Set(existingCategories?.map(c => c.name.toLowerCase()) || [])

  // Procesar cada categoría
  for (let i = 0; i < importData.length; i++) {
    const categoryData = importData[i]

    try {
      // Generar slug si no existe
      if (!categoryData.slug) {
        categoryData.slug = categoryData.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
      }

      // Verificar duplicados
      const isDuplicateSlug = existingSlugs.has(categoryData.slug)
      const isDuplicateName = existingNames.has(categoryData.name.toLowerCase())

      if ((isDuplicateSlug || isDuplicateName) && options?.skip_duplicates) {
        result.errors.push({
          category_name: categoryData.name,
          error: 'Categoría duplicada (omitida)',
        })
        result.error_count++
        continue
      }

      // ⚡ MULTITENANT: Resolver parent_id si se proporciona parent_slug (debe pertenecer al tenant)
      let parentId = null
      if (categoryData.parent_slug) {
        const parentCategory = existingCategories?.find(c => c.slug === categoryData.parent_slug)
        if (parentCategory) {
          parentId = parentCategory.id
        } else {
          result.errors.push({
            category_name: categoryData.name,
            error: `Categoría padre no encontrada en este tenant: ${categoryData.parent_slug}`,
          })
          result.error_count++
          continue
        }
      }

      const insertData = {
        name: categoryData.name,
        slug: categoryData.slug,
        description: categoryData.description || null,
        parent_id: parentId,
        is_active: categoryData.is_active ?? true,
        is_featured: categoryData.is_featured ?? false,
        sort_order: categoryData.sort_order ?? 0,
        meta_title: categoryData.meta_title || null,
        meta_description: categoryData.meta_description || null,
        meta_keywords: categoryData.meta_keywords || null,
        tenant_id: tenantId, // ⚡ MULTITENANT: Asignar tenant_id
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      if (isDuplicateSlug && options?.update_existing) {
        // ⚡ MULTITENANT: Actualizar categoría existente del tenant
        const existingCategory = existingCategories?.find(c => c.slug === categoryData.slug)
        if (existingCategory) {
          const { data: updatedCategory, error } = await supabase
            .from('categories')
            .update(insertData)
            .eq('id', existingCategory.id)
            .eq('tenant_id', tenantId) // ⚡ MULTITENANT
            .select()
            .single()

          if (error) {
            result.errors.push({
              category_name: categoryData.name,
              error: `Error actualizando: ${error.message}`,
            })
            result.error_count++
          } else {
            result.processed_categories.push(updatedCategory)
            result.success_count++
          }
        }
      } else {
        // ⚡ MULTITENANT: Crear nueva categoría con tenant_id
        const { data: newCategory, error } = await supabase
          .from('categories')
          .insert(insertData)
          .select()
          .single()

        if (error) {
          result.errors.push({
            category_name: categoryData.name,
            error: `Error creando: ${error.message}`,
          })
          result.error_count++
        } else {
          result.processed_categories.push(newCategory)
          result.success_count++
          existingSlugs.add(newCategory.slug)
          existingNames.add(newCategory.name.toLowerCase())
        }
      }
    } catch (error: any) {
      result.errors.push({
        category_name: categoryData.name || `Fila ${i + 1}`,
        error: error.message || 'Error desconocido',
      })
      result.error_count++
    }
  }

  // Registrar auditoría
  if (result.success_count > 0) {
    await logBulkAuditAction(
      'import',
      result.processed_categories.map(c => c.id),
      userId,
      {
        action: 'import',
        options,
        result: {
          success_count: result.success_count,
          error_count: result.error_count,
        },
      }
    )
  }

  return result
}

async function checkCircularHierarchy(
  categoryId: string,
  parentId: string,
  tenantId: string // ⚡ MULTITENANT: Agregar tenantId
): Promise<boolean> {
  const supabase = getSupabaseClient(true)

  if (!supabase) {
    return false
  }

  if (categoryId === parentId) {
    return true
  }

  let currentParentId = parentId
  const visited = new Set<string>()

  while (currentParentId && !visited.has(currentParentId)) {
    visited.add(currentParentId)

    if (currentParentId === categoryId) {
      return true
    }

    // ⚡ MULTITENANT: Verificar jerarquía solo dentro del mismo tenant
    const { data: parent } = await supabase
      .from('categories')
      .select('parent_id')
      .eq('id', currentParentId)
      .eq('tenant_id', tenantId) // ⚡ MULTITENANT
      .single()

    currentParentId = parent?.parent_id
  }

  return false
}

async function logBulkAuditAction(
  action: string,
  categoryIds: string[],
  userId: string,
  details?: any
): Promise<void> {
  try {
    const supabase = getSupabaseClient(true)
    if (!supabase) {
      return
    }

    const auditEntries = categoryIds.map(categoryId => ({
      table_name: 'categories',
      record_id: categoryId,
      action: `bulk_${action}`,
      user_id: userId,
      old_values: null,
      new_values: details || null,
      ip_address: null,
      user_agent: null,
      created_at: new Date().toISOString(),
    }))

    await supabase.from('audit_logs').insert(auditEntries)
  } catch (error) {
    logger.log(LogLevel.ERROR, LogCategory.AUDIT, 'Error registrando auditoría masiva', {
      error,
      action,
      categoryIds,
    })
  }
}

// ===================================
// GET /api/admin/categories/bulk - Exportar categorías (Admin)
// ===================================
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Rate limiting
    const rateLimitResult = await checkRateLimit(
      request,
      RATE_LIMIT_CONFIGS.admin,
      'admin-categories-bulk-export'
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

    const url = new URL(request.url)
    const format = url.searchParams.get('format') || 'csv'
    const fields = url.searchParams.get('fields')?.split(',')

    // Parsear filtros
    const filters: any = {}
    if (url.searchParams.get('is_active') !== null) {
      filters.is_active = url.searchParams.get('is_active') === 'true'
    }
    if (url.searchParams.get('is_featured') !== null) {
      filters.is_featured = url.searchParams.get('is_featured') === 'true'
    }
    if (url.searchParams.get('parent_id')) {
      filters.parent_id = url.searchParams.get('parent_id')
    }
    if (url.searchParams.get('search')) {
      filters.search = url.searchParams.get('search')
    }

    // Validar parámetros
    const exportParams = BulkCategoryExportSchema.parse({
      format,
      filters,
      fields,
    })

    // Exportar categorías
    const exportResult = await exportCategories(
      exportParams.filters,
      exportParams.format,
      exportParams.fields
    )

    // Registrar métricas
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/categories/bulk',
      method: 'GET',
      statusCode: 200,
      responseTime: Date.now() - startTime,
      userId: authResult.user?.id,
    })

    const response: ApiResponse<typeof exportResult> = {
      data: exportResult,
      success: true,
      message: `${exportResult.total} categorías exportadas en formato ${format}`,
      meta: {
        total: exportResult.total,
      },
    }

    const nextResponse = NextResponse.json(response)
    // Rate limit headers are handled internally
    return nextResponse
  } catch (error: any) {
    logger.log(LogLevel.ERROR, LogCategory.API, 'Error en GET /api/admin/categories/bulk', {
      error,
    })

    // Registrar métricas de error
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/categories/bulk',
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
// POST /api/admin/categories/bulk - Operaciones masivas e importación (Admin)
// ⚡ MULTITENANT: Filtra y asigna tenant_id
// ===================================
export const POST = withTenantAdmin(async (
  guardResult: TenantAdminGuardResult,
  request: NextRequest
) => {
  const startTime = Date.now()
  const { tenantId, userId } = guardResult

  try {
    // Rate limiting más restrictivo para operaciones masivas
    const rateLimitResult = await checkRateLimit(
      request,
      {
        windowMs: RATE_LIMIT_CONFIGS.admin.windowMs,
        maxRequests: Math.floor(RATE_LIMIT_CONFIGS.admin.maxRequests / 4),
        message: 'Demasiadas operaciones masivas',
      },
      'admin-categories-bulk-operations'
    )

    if (!rateLimitResult.success) {
      const response = NextResponse.json({ error: rateLimitResult.message }, { status: 429 })
      // Rate limit headers are handled internally
      return response
    }

    const body = await request.json()
    const { operation } = body

    let result: BulkOperationResult
    let message: string

    if (operation === 'import') {
      // ⚡ MULTITENANT: Importación de categorías con tenantId
      const importParams = BulkCategoryImportSchema.parse(body)
      result = await importCategories(importParams.data, importParams.options, tenantId, userId)
      message = `Importación completada: ${result.success_count} categorías procesadas, ${result.error_count} errores`
    } else {
      // ⚡ MULTITENANT: Operaciones masivas estándar con tenantId
      const bulkParams = BulkCategoryActionSchema.parse(body)
      result = await executeBulkAction(
        bulkParams.action,
        bulkParams.category_ids,
        tenantId, // ⚡ MULTITENANT
        bulkParams.data,
        userId
      )
      message = `Operación '${bulkParams.action}' completada: ${result.success_count} categorías procesadas, ${result.error_count} errores`
    }

    // Registrar métricas
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/categories/bulk',
      method: 'POST',
      statusCode: 200,
      responseTime: Date.now() - startTime,
      userId: userId,
    })

    const response: ApiResponse<BulkOperationResult> = {
      data: result,
      success: true,
      message,
      meta: {
        total: result.success_count + result.error_count,
        processed: result.success_count,
        errors: result.errors,
      },
    }

    const nextResponse = NextResponse.json(response)
    // Rate limit headers are handled internally
    return nextResponse
  } catch (error: any) {
    logger.log(LogLevel.ERROR, LogCategory.API, 'Error en POST /api/admin/categories/bulk', {
      error,
    })

    // Registrar métricas de error
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/categories/bulk',
      method: 'POST',
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
})
