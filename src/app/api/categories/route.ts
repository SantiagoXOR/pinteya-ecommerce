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

        // Construir query base - simplificado para la estructura actual
        const baseQuery = supabase
          .from('categories')
          .select(
            `
        *,
        products_count:products(count)
      `
          )
          .order('display_order', { ascending: true })
          .order('name', { ascending: true })

        // Aplicar filtros
        let query = baseQuery
        if (filters.search) {
          query = query.ilike('name', `%${filters.search}%`)
        }

        // Ejecutar query con timeout de base de datos
        const { data: categories, error } = await withDatabaseTimeout(async signal => {
          return await query.abortSignal(signal)
        }, API_TIMEOUTS.database)

        if (error) {
          console.error('Error en GET /api/categories:', error)

          // Log de error de seguridad
          securityLogger.logApiError(
            securityLogger.context,
            new Error(`Database error: ${error.message}`),
            {
              endpoint: '/api/categories',
              operation: 'select_categories',
            }
          )

          const errorResponse: ApiResponse<null> = {
            data: null,
            success: false,
            error: error.message || 'Error obteniendo categorías',
          }
          return NextResponse.json(errorResponse, { status: 500 })
        }

        // Procesar datos para incluir conteo de productos
        const processedCategories =
          categories?.map(category => ({
            ...category,
            products_count: category.products_count?.[0]?.count || 0,
          })) || []

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

    const supabase = getSupabaseClient(true) // Usar cliente admin

    // Verificar que el cliente administrativo esté disponible
    if (!supabase) {
      console.error('Cliente administrativo de Supabase no disponible en POST /api/categories')
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Servicio administrativo no disponible',
      }
      return NextResponse.json(errorResponse, { status: 503 })
    }

    // Crear slug si no se proporciona
    if (!categoryData.slug) {
      categoryData.slug = categoryData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
    }

    // Insertar categoría
    const { data: category, error } = await supabase
      .from('categories')
      .insert(categoryData)
      .select()
      .single()

    if (error) {
      handleSupabaseError(error, 'POST /api/categories')
    }

    const response: ApiResponse<Category> = {
      data: category,
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
