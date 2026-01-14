// Configuración para Node.js Runtime
export const runtime = 'nodejs'

// ===================================
// PINTEYA E-COMMERCE - API DE CATEGORÍAS
// ===================================

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient, handleSupabaseError } from '@/lib/integrations/supabase'
import { validateData, CategoryFiltersSchema, CategorySchema } from '@/lib/validations'
import { ApiResponse } from '@/types/api'
import { Category } from '@/types/database'
import { getCategories, createCategoryInDB } from '@/lib/categories/api/server'
import { toUICategories } from '@/lib/categories/adapters'
import type { CategoryApiResponse } from '@/lib/categories/types'

// ===================================
// MEJORAS DE SEGURIDAD - ALTA PRIORIDAD
// ===================================
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limiting/rate-limiter'
import { API_TIMEOUTS, withDatabaseTimeout, getEndpointTimeouts } from '@/lib/config/api-timeouts'
import { createSecurityLogger } from '@/lib/logging/security-logger'

// ===================================
// GET /api/categories - Obtener categorías
// ===================================
export async function GET(request: NextRequest) {
  // Crear logger de seguridad con contexto
  const securityLogger = createSecurityLogger(request)

  // Aplicar rate limiting para APIs de categorías
  const rateLimitResult = await withRateLimit(
    request,
    RATE_LIMIT_CONFIGS.products, // Usar config de productos para categorías
    async () => {
      // Log de acceso a la API
      securityLogger.log({
        type: 'data_access',
        severity: 'low',
        message: 'Categories API accessed',
        context: securityLogger.context,
        metadata: {
          endpoint: '/api/categories',
          method: 'GET',
          userAgent: request.headers.get('user-agent'),
        },
      })

      try {
        const { searchParams } = new URL(request.url)

        // Extraer parámetros de query
        const queryParams = {
          search: searchParams.get('search') || undefined,
        }

        // Validar parámetros (simplificado para la estructura actual)
        const filters = {
          search: queryParams.search,
        }

        const supabase = getSupabaseClient()

        // Verificar que el cliente de Supabase esté disponible
        if (!supabase) {
          if (process.env.NODE_ENV !== 'production') {
            const { devMockCategories } = await import('@/lib/dev-mocks')
            let items = devMockCategories
            if (filters.search) {
              const q = filters.search.toLowerCase()
              items = items.filter(c => c.name.toLowerCase().includes(q))
            }

            const response: ApiResponse<any[]> = {
              data: items.map(c => ({ ...c, products_count: 0 })),
              success: true,
              message: `${items.length} categorías encontradas (mock)`,
            }

            securityLogger.log({
              type: 'data_access',
              severity: 'low',
              message: 'Categories served from dev mocks',
              context: securityLogger.context,
              metadata: { count: items.length },
            })

            return NextResponse.json(response)
          }

          console.error('Cliente de Supabase no disponible en GET /api/categories')
          const errorResponse: ApiResponse<null> = {
            data: null,
            success: false,
            error: 'Servicio de base de datos no disponible',
          }
          return NextResponse.json(errorResponse, { status: 503 })
        }

        // Use new CategoryService to get categories
        const categoryFilters = {
          search: filters.search,
          sortBy: 'display_order' as const,
          sortOrder: 'asc' as const,
        }

        const uiCategories = await getCategories(categoryFilters, false)

        // Convert back to DB format for API response (maintain backward compatibility)
        const processedCategories = uiCategories.map(cat => ({
          id: parseInt(cat.id, 10),
          name: cat.name,
          slug: cat.slug,
          description: cat.description || null,
          icon: cat.icon,
          image_url: cat.icon, // Map icon back to image_url for compatibility
          parent_id: cat.parentId ? parseInt(cat.parentId, 10) : null,
          created_at: cat.createdAt || new Date().toISOString(),
          updated_at: cat.updatedAt || null,
          display_order: cat.displayOrder || null,
          products_count: cat.count || 0,
        }))

        // Log de operación exitosa
        securityLogger.log({
          type: 'data_access',
          severity: 'low',
          message: 'Categories retrieved successfully',
          context: securityLogger.context,
          metadata: {
            categoriesCount: processedCategories.length,
            hasSearch: !!filters.search,
            searchTerm: filters.search,
          },
        })

        const response: ApiResponse<Category[]> = {
          data: processedCategories,
          success: true,
          message: `${processedCategories.length} categorías encontradas`,
        }

        return NextResponse.json(response)
      } catch (error: any) {
        console.error('Error en GET /api/categories:', error)

        // Log de error de seguridad
        securityLogger.logApiError(
          securityLogger.context,
          error instanceof Error ? error : new Error('Unknown error'),
          {
            endpoint: '/api/categories',
          }
        )

        const errorResponse: ApiResponse<null> = {
          data: null,
          success: false,
          error: error.message || 'Error interno del servidor',
        }

        return NextResponse.json(errorResponse, { status: 500 })
      }
    }
  )

  // Manejar rate limit excedido
  if (rateLimitResult instanceof NextResponse) {
    securityLogger.logRateLimitExceeded(securityLogger.context, {
      endpoint: '/api/categories',
      method: 'GET',
    })
    return rateLimitResult
  }

  return rateLimitResult
}

// ===================================
// POST /api/categories - Crear categoría (Admin)
// ===================================
export async function POST(request: NextRequest) {
  try {
    // ENTERPRISE: Usar nueva autenticación enterprise para admin
    const { requireAdminAuth } = await import('@/lib/auth/enterprise-auth-utils')

    const authResult = await requireAdminAuth(request, ['categories_create'])

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

    const context = authResult.context!

    const body = await request.json()

    // Validar datos de la categoría
    const categoryData = validateData(CategorySchema, body)

    // Use new CategoryService to create category
    const newCategory = await createCategoryInDB({
      name: categoryData.name,
      slug: categoryData.slug,
      description: categoryData.description,
      image_url: categoryData.image_url || categoryData.icon,
      parent_id: categoryData.parent_id || null,
      display_order: categoryData.display_order || null,
    }, true)

    // Convert to DB format for API response (maintain backward compatibility)
    const dbCategory: Category = {
      id: parseInt(newCategory.id, 10),
      name: newCategory.name,
      slug: newCategory.slug,
      description: newCategory.description || null,
      icon: newCategory.icon,
      image_url: newCategory.icon, // Map icon to image_url for compatibility
      parent_id: newCategory.parentId ? parseInt(newCategory.parentId, 10) : null,
      created_at: newCategory.createdAt || new Date().toISOString(),
      updated_at: newCategory.updatedAt || null,
      display_order: newCategory.displayOrder || null,
      products_count: newCategory.count || 0,
    }

    const response: ApiResponse<Category> = {
      data: dbCategory,
      success: true,
      message: 'Categoría creada exitosamente',
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error: any) {
    console.error('Error en POST /api/categories:', error)

    const errorResponse: ApiResponse<null> = {
      data: null,
      success: false,
      error: error.message || 'Error interno del servidor',
    }

    return NextResponse.json(errorResponse, { status: 500 })
  }
}
