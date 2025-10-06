// Configuración para Node.js Runtime
export const runtime = 'nodejs'

// ===================================
// PINTEYA E-COMMERCE - API DE PRODUCTOS
// ===================================
// API optimizada con rate limiting, timeouts centralizados y logging estructurado

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient, handleSupabaseError } from '@/lib/integrations/supabase'
import {
  validateData,
  safeValidateData,
  ProductFiltersSchema,
  ProductSchema,
} from '@/lib/validations'
import { ApiResponse, PaginatedResponse, ProductWithCategory } from '@/types/api'
import { executeWithRLS, withRLS, createRLSFilters } from '@/lib/auth/enterprise-rls-utils'

// ===================================
// NUEVAS IMPORTACIONES - MEJORAS DE ALTA PRIORIDAD
// ===================================
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limiting/rate-limiter'
import { API_TIMEOUTS, withDatabaseTimeout, getEndpointTimeouts } from '@/lib/config/api-timeouts'
import { createSecurityLogger } from '@/lib/logging/security-logger'

// ===================================
// GET /api/products - Obtener productos con filtros
// ===================================
export async function GET(request: NextRequest) {
  // Crear logger de seguridad con contexto
  const securityLogger = createSecurityLogger(request)

  // Aplicar rate limiting
  const rateLimitResult = await withRateLimit(request, RATE_LIMIT_CONFIGS.products, async () => {
    try {
      const { searchParams } = new URL(request.url)

      // Extraer parámetros de query
      const queryParams = {
        category: searchParams.get('category') || undefined,
        categories: searchParams.get('categories')?.split(',').filter(Boolean) || undefined,
        brand: searchParams.get('brand') || undefined,
        brands: searchParams.get('brands')?.split(',').filter(Boolean) || undefined,
        paintType: searchParams.get('paintType') || undefined,
        paintTypes: searchParams.get('paintTypes')?.split(',').filter(Boolean) || undefined,
        priceMin: searchParams.get('priceMin') ? Number(searchParams.get('priceMin')) : undefined,
        priceMax: searchParams.get('priceMax') ? Number(searchParams.get('priceMax')) : undefined,
        search: searchParams.get('search') || undefined,
        page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
        limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 12,
        sortBy:
          (searchParams.get('sortBy') as 'price' | 'name' | 'created_at' | 'brand') || 'created_at',
        sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
      }

      // Validar parámetros de manera segura
      const validationResult = safeValidateData(ProductFiltersSchema, queryParams)

      if (!validationResult.success) {
        // Log de error de validación con contexto de seguridad
        securityLogger.log({
          type: 'validation_error',
          severity: 'medium',
          message: 'Invalid parameters in products API',
          context: securityLogger.context,
          metadata: {
            validationError: validationResult.error,
            queryParams,
          },
        })

        const errorResponse: ApiResponse<null> = {
          data: null,
          success: false,
          error: `Parámetros inválidos: ${validationResult.error}`,
        }
        return NextResponse.json(errorResponse, { status: 400 })
      }

      const filters = validationResult.data!

      // Log de acceso a datos con contexto
      securityLogger.log({
        type: 'data_access',
        severity: 'low',
        message: 'Products API accessed',
        context: securityLogger.context,
        metadata: {
          filters: filters,
          hasSearch: !!filters.search,
          hasFilters: !!(filters.category || filters.brand || filters.paintType),
        },
      })

      const supabase = getSupabaseClient()

      // Verificar que el cliente de Supabase esté disponible
      if (!supabase) {
        securityLogger.logApiError(
          securityLogger.context,
          new Error('Supabase client not available'),
          { service: 'supabase' }
        )

        const errorResponse: ApiResponse<null> = {
          data: null,
          success: false,
          error: 'Servicio de base de datos no disponible',
        }
        return NextResponse.json(errorResponse, { status: 503 })
      }

      // Construir query base optimizada (solo campos necesarios)
      // Usar timeout centralizado para operaciones de base de datos
      const result = await withDatabaseTimeout(async signal => {
        let query = supabase.from('products').select(
          `
              id, name, slug, price, discounted_price, brand, stock, images, color, medida,
              category:categories(id, name, slug)
            `,
          { count: 'exact' }
        )

        // Aplicar filtros
        if (filters.category) {
          // Primero obtener el ID de la categoría por su slug
          const { data: categoryData } = await supabase
            .from('categories')
            .select('id')
            .eq('slug', filters.category)
            .single()

          if (categoryData) {
            query = query.eq('category_id', categoryData.id)
          }
        }

        // Filtro por múltiples categorías (nuevo)
        if (filters.categories && filters.categories.length > 0) {
          const { data: categoriesData } = await supabase
            .from('categories')
            .select('id')
            .in('slug', filters.categories)

          if (categoriesData && categoriesData.length > 0) {
            const categoryIds = categoriesData.map(cat => cat.id)
            query = query.in('category_id', categoryIds)
          }
        }

        if (filters.brand) {
          query = query.eq('brand', filters.brand)
        }

        // Filtro por múltiples marcas (nuevo)
        if (filters.brands && filters.brands.length > 0) {
          query = query.in('brand', filters.brands)
        }

        // Filtro por tipo de pintura (nuevo)
        if (filters.paintType) {
          query = query.eq('paint_type', filters.paintType)
        }

        // Filtro por múltiples tipos de pintura (nuevo)
        if (filters.paintTypes && filters.paintTypes.length > 0) {
          query = query.in('paint_type', filters.paintTypes)
        }

        if (filters.priceMin) {
          query = query.gte('price', filters.priceMin)
        }

        if (filters.priceMax) {
          query = query.lte('price', filters.priceMax)
        }

        if (filters.search) {
          query = query.or(
            `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,brand.ilike.%${filters.search}%`
          )
        }

        // Filtro por productos con descuento real (discounted_price < price)
        if (filters.hasDiscount) {
          query = query.not('discounted_price', 'is', null).lt('discounted_price', 'price')
        }

        // Solo productos con stock (temporalmente comentado para testing)
        // query = query.gt('stock', 0);

        // Ordenamiento
        const orderColumn =
          filters.sortBy === 'created_at'
            ? 'created_at'
            : filters.sortBy === 'brand'
              ? 'brand'
              : filters.sortBy || 'created_at'
        query = query.order(orderColumn, { ascending: filters.sortOrder === 'asc' })

        // Paginación
        const page = filters.page || 1
        const limit = filters.limit || 10
        const from = (page - 1) * limit
        const to = from + limit - 1
        query = query.range(from, to)

        // Ejecutar query con timeout
        return await query
      }, API_TIMEOUTS.database)

      const { data: products, error, count } = result

      if (error) {
        // Log de error de base de datos con contexto de seguridad
        securityLogger.logApiError(
          securityLogger.context,
          new Error(`Supabase error: ${error.message}`),
          {
            supabaseError: error,
            filters: filters,
            operation: 'products_query',
          }
        )

        const errorResponse: ApiResponse<null> = {
          data: null,
          success: false,
          error: error.message || 'Error obteniendo productos de la base de datos',
        }
        return NextResponse.json(errorResponse, { status: 500 })
      }

      // Enriquecer productos con información de variantes
      let enrichedProducts = products || []
      
      if (products && products.length > 0) {
        try {
          // Obtener variantes para todos los productos
          const productIds = products.map(p => p.id)
          
          const { data: variants } = await supabase
            .from('product_variants')
            .select(`
              id,
              product_id,
              aikon_id,
              variant_slug,
              color_name,
              color_hex,
              measure,
              finish,
              price_list,
              price_sale,
              stock,
              is_active,
              is_default,
              image_url
            `)
            .in('product_id', productIds)
            .eq('is_active', true)
            .order('is_default', { ascending: false })

          // Agrupar variantes por producto
          const variantsByProduct = (variants || []).reduce((acc, variant) => {
            if (!acc[variant.product_id]) {
              acc[variant.product_id] = []
            }
            acc[variant.product_id].push(variant)
            return acc
          }, {} as Record<number, any[]>)

          // Enriquecer productos con variantes
          enrichedProducts = products.map(product => {
            const productVariants = variantsByProduct[product.id] || []
            const defaultVariant = productVariants.find(v => v.is_default) || productVariants[0]
            
            return {
              ...product,
              // Mantener compatibilidad con campos legacy
              aikon_id: product.aikon_id || defaultVariant?.aikon_id,
              color: product.color || defaultVariant?.color_name,
              medida: product.medida || defaultVariant?.measure,
              // Agregar información de variantes
              variants: productVariants,
              variant_count: productVariants.length,
              has_variants: productVariants.length > 0,
              default_variant: defaultVariant || null,
              // Usar precios de la variante por defecto si están disponibles
              price: defaultVariant?.price_list || product.price,
              discounted_price: defaultVariant?.price_sale || product.discounted_price,
              stock: defaultVariant?.stock !== undefined ? defaultVariant.stock : product.stock,
            }
          })
        } catch (variantError) {
          // Si hay error obteniendo variantes, continuar con productos originales
          console.warn('Error obteniendo variantes:', variantError)
        }
      }

      // Calcular información de paginación
      const page = filters.page || 1
      const limit = filters.limit || 10
      const totalPages = Math.ceil((count || 0) / limit)

      // Log de operación exitosa
      securityLogger.log({
        type: 'data_access',
        severity: 'low',
        message: 'Products retrieved successfully',
        context: securityLogger.context,
        metadata: {
          productsCount: products?.length || 0,
          totalCount: count || 0,
          page,
          limit,
          filters: filters,
        },
      })

      const response: PaginatedResponse<ProductWithCategory> = {
        data: enrichedProducts || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages,
        },
        success: true,
        message: `${enrichedProducts?.length || 0} productos encontrados`,
      }

      // Agregar headers de cache para mejorar performance
      return NextResponse.json(response, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
          'Content-Type': 'application/json',
        },
      })
    } catch (error: any) {
      // Log de error general con contexto de seguridad
      securityLogger.logApiError(securityLogger.context, error, {
        operation: 'products_get',
        stage: 'database_operation',
      })

      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: error.message || 'Error interno del servidor',
      }

      return NextResponse.json(errorResponse, { status: 500 })
    }
  })

  // Si withRateLimit devuelve una respuesta (rate limit excedido), devolverla
  if (rateLimitResult instanceof NextResponse) {
    // Log de rate limit excedido
    securityLogger.logRateLimitExceeded(securityLogger.context, {
      endpoint: '/api/products',
      method: 'GET',
    })
    return rateLimitResult
  }

  return rateLimitResult
}

// ===================================
// POST /api/products - Crear producto (Admin)
// ===================================
export async function POST(request: NextRequest) {
  // Crear logger de seguridad con contexto
  const securityLogger = createSecurityLogger(request)

  // Aplicar rate limiting para operaciones de creación
  const rateLimitResult = await withRateLimit(request, RATE_LIMIT_CONFIGS.creation, async () => {
    try {
      // ENTERPRISE: Usar nueva autenticación enterprise para admin
      const { requireAdminAuth } = await import('@/lib/auth/enterprise-auth-utils')

      const authResult = await requireAdminAuth(request, ['products_create'])

      if (!authResult.success) {
        // Log de intento de acceso no autorizado
        securityLogger.logPermissionDenied(securityLogger.context, 'products', 'create')

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

      // Actualizar contexto del logger con información del usuario
      securityLogger.context.userId = context.userId

      const body = await request.json()

      // Log de acción administrativa
      securityLogger.logAdminAction(securityLogger.context, 'create_product', {
        productName: body.name,
        category: body.category_id,
      })

      // Validar datos del producto
      const productData = validateData(ProductSchema, body)

      const supabase = getSupabaseClient(true) // Usar cliente admin

      // Verificar que el cliente administrativo esté disponible
      if (!supabase) {
        securityLogger.logApiError(
          securityLogger.context,
          new Error('Admin Supabase client not available'),
          { service: 'supabase_admin' }
        )

        const errorResponse: ApiResponse<null> = {
          data: null,
          success: false,
          error: 'Servicio administrativo no disponible',
        }
        return NextResponse.json(errorResponse, { status: 503 })
      }

      // Crear slug si no se proporciona
      if (!productData.slug) {
        productData.slug = productData.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
      }

      // Insertar producto con timeout
      const result = await withDatabaseTimeout(async signal => {
        return await supabase
          .from('products')
          .insert(productData)
          .select(
            `
              *,
              category:categories(id, name, slug)
            `
          )
          .single()
      }, API_TIMEOUTS.admin)

      const { data: product, error } = result

      if (error) {
        securityLogger.logApiError(
          securityLogger.context,
          new Error(`Product creation failed: ${error.message}`),
          {
            supabaseError: error,
            productData: { ...productData, images: '[REDACTED]' }, // No loggear imágenes por seguridad
          }
        )
        handleSupabaseError(error, 'POST /api/products')
      }

      // Log de creación exitosa
      securityLogger.logAdminAction(securityLogger.context, 'product_created_successfully', {
        productId: product?.id,
        productName: product?.name,
        category: product?.category?.name,
      })

      const response: ApiResponse<ProductWithCategory> = {
        data: product,
        success: true,
        message: 'Producto creado exitosamente',
      }

      return NextResponse.json(response, { status: 201 })
    } catch (error: any) {
      // Log de error general en creación de producto
      securityLogger.logApiError(securityLogger.context, error, {
        operation: 'product_creation',
        stage: 'general_error',
      })

      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: error.message || 'Error interno del servidor',
      }

      return NextResponse.json(errorResponse, { status: 500 })
    }
  })

  // Si withRateLimit devuelve una respuesta (rate limit excedido), devolverla
  if (rateLimitResult instanceof NextResponse) {
    // Log de rate limit excedido para creación
    securityLogger.logRateLimitExceeded(securityLogger.context, {
      endpoint: '/api/products',
      method: 'POST',
      operation: 'product_creation',
    })
    return rateLimitResult
  }

  return rateLimitResult
}
