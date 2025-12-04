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
import { expandQueryIntents, stripDiacritics } from '@/lib/search/intents'

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
        // En desarrollo, usar datos mock como fallback para no romper la UI
        if (process.env.NODE_ENV !== 'production') {
          const { devMockProducts, filterAndPaginateProducts } = await import('@/lib/dev-mocks')

          const { items, total, totalPages, page, limit } = filterAndPaginateProducts(
            devMockProducts,
            filters
          )

          const response: PaginatedResponse<ProductWithCategory> = {
            data: items as any,
            success: true,
            pagination: { page, limit, total, totalPages },
          }

          securityLogger.log({
            type: 'data_access',
            severity: 'low',
            message: 'Products served from dev mocks',
            context: securityLogger.context,
            metadata: { count: items.length },
          })

          return NextResponse.json(response)
        }

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
      // Variables para meta de FTS en ámbito externo
      let ftsUsedOuter = false
      let orderedIdsOuter: number[] = []
      let overrideCountOuter: number | null = null

      // Obtener IDs de categorías antes del timeout si es necesario
      let categoryId: number | null = null
      let categoryIds: number[] = []

      if (filters.category) {
        const { data: categoryData } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', filters.category)
          .single()

        if (categoryData) {
          categoryId = categoryData.id
        }
      }

      if (filters.categories && filters.categories.length > 0) {
        const { data: categoriesData } = await supabase
          .from('categories')
          .select('id')
          .in('slug', filters.categories)

        if (categoriesData && categoriesData.length > 0) {
          categoryIds = categoriesData.map(cat => cat.id)
        }
      }

      const result = await withDatabaseTimeout(async signal => {
        let query = supabase.from('products').select(
          `
              id, name, slug, price, discounted_price, brand, stock, images, color, medida,
              category:categories(id, name, slug),
              categories:product_categories(category:categories(id, name, slug))
            `,
          { count: 'exact' }
        )

        // Aplicar filtros de categoría
        // ✅ CORREGIDO: Combinar categoryId y categoryIds en un solo filtro (OR, no AND)
        const allCategoryIds = []
        
        if (categoryId) {
          allCategoryIds.push(categoryId)
        }
        
        if (categoryIds.length > 0) {
          allCategoryIds.push(...categoryIds)
        }
        
        // Aplicar filtro combinado si hay categorías
        if (allCategoryIds.length > 0) {
          // Eliminar duplicados
          const uniqueCategoryIds = [...new Set(allCategoryIds)]
          
          // Buscar productos que tengan CUALQUIERA de estas categorías
          const { data: productIdsData } = await supabase
            .from('product_categories')
            .select('product_id')
            .in('category_id', uniqueCategoryIds)
          
          if (productIdsData && productIdsData.length > 0) {
            const productIds = [...new Set(productIdsData.map(pc => pc.product_id))]
            query = query.in('id', productIds)
          } else {
            // Si no hay productos con estas categorías, retornar vacío
            query = query.eq('id', -1)
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
          // ================================
          // BÚSQUEDA MEJORADA: FTS + INTENCIÓN + FALLBACK ILIKE/TRIGRAM
          // ================================
          const raw = String(filters.search).trim()

          // Expandir intención (sinónimos, singularización, diacríticos)
          const candidates = new Set<string>(expandQueryIntents(raw))

          // Intentar primero FTS vía RPC para resultados relevantes
          const page = filters.page || 1
          const limit = filters.limit || 10
          const from = (page - 1) * limit
          let ftsUsed = false
          let orderedIds: number[] = []
          let overrideCount: number | null = null

          try {
            // Intentar usar FTS solo si la función existe
            // NOTA: products_search RPC debe estar definida en la base de datos
            const { data: ftsProducts, error: ftsError } = await supabase.rpc('products_search', {
              q: raw,
              lim: limit,
              off: from,
            })

            if (!ftsError && ftsProducts && ftsProducts.length > 0) {
              orderedIds = ftsProducts.map((p: any) => p.id)
              overrideCount = orderedIds.length // RPC no devuelve count total; usamos tamaño de la página
              ftsUsed = true

              // Limitar resultados de la consulta principal a los IDs devueltos por FTS
              query = query.in('id', orderedIds)
            } else if (ftsError) {
              console.warn('[FTS] Error en products_search RPC:', ftsError.message)
              // Continuar con fallback ILIKE
            }
          } catch (e) {
            console.warn('[FTS] Exception en products_search RPC:', e)
            // Si falla RPC, continuar con fallback
          }

          if (!ftsUsed) {
            // Fallback: aplicar ILIKE sobre campos clave con todas las variantes
            const buildIlike = (term: string) => [
              `name.ilike.%${term}%`,
              `description.ilike.%${term}%`,
              `brand.ilike.%${term}%`,
              `slug.ilike.%${term}%`,
            ]
            const orConditions: string[] = []
            for (const term of candidates) {
              orConditions.push(...buildIlike(term))
            }
            query = query.or(orConditions.join(','))
          }

          // Guardar metadatos de búsqueda en variables externas
          ftsUsedOuter = ftsUsed
          orderedIdsOuter = orderedIds
          overrideCountOuter = overrideCount
        }

        // Filtro por productos con descuento real (discounted_price < price)
        if (filters.hasDiscount) {
          query = query.not('discounted_price', 'is', null).lt('discounted_price', 'price')
        }

        // Solo productos con stock (temporalmente comentado para testing)
        // query = query.gt('stock', 0);

        // Ordenamiento - Priorizar productos con variantes para búsquedas
        if (filters.search) {
          // Para búsquedas, usar ordenamiento personalizado que priorice productos con variantes
          query = query.order('created_at', { ascending: filters.sortOrder === 'asc' })
        } else {
          // Para listados normales, usar el ordenamiento estándar
          const orderColumn =
            filters.sortBy === 'created_at'
              ? 'created_at'
              : filters.sortBy === 'brand'
                ? 'brand'
                : filters.sortBy || 'created_at'
          query = query.order(orderColumn, { ascending: filters.sortOrder === 'asc' })
        }

        // Para búsquedas, obtener más productos para poder reordenar correctamente
        const page = filters.page || 1
        const limit = filters.limit || 10
        const from = (page - 1) * limit
        const to = from + limit - 1
        
        if (filters.search) {
          // Para búsquedas, obtener más productos (hasta 50) para poder reordenar
          query = query.range(0, 49)
        } else {
          // Para listados normales, usar paginación estándar
          query = query.range(from, to)
        }

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
          // Obtener variantes para todos los productos con timeout
          const productIds = products.map(p => p.id)
          
          const variantsResult = await withDatabaseTimeout(async signal => {
            return await supabase
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
          }, API_TIMEOUTS.supabase.simple)
          
          const { data: variants, error: variantsError } = variantsResult
          
          if (variantsError) {
            console.warn('Error obteniendo variantes:', variantsError)
          }

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
              // Mantener precio y stock exclusivamente desde tabla products (requerimiento)
              price: product.price,
              discounted_price: product.discounted_price,
              stock: product.stock,
            }
          })

          // Reordenar productos priorizando aquellos con variantes
          console.log('🔍 REORDENAMIENTO: Aplicando reordenamiento')
          console.log('🔍 REORDENAMIENTO: Antes del sort:', enrichedProducts.map(p => ({
            id: p.id,
            name: p.name,
            has_variants: p.has_variants,
            variant_count: p.variant_count
          })))
          
          // Reordenar productos: primero los que tienen variantes
          const sortedProducts = [...enrichedProducts].sort((a, b) => {
            // Si uno tiene variantes y el otro no, el que tiene variantes va primero
            if (a.has_variants && !b.has_variants) {
              console.log(`🔍 REORDENAMIENTO: ${a.id} (con variantes) va antes que ${b.id} (sin variantes)`)
              return -1
            }
            if (!a.has_variants && b.has_variants) {
              console.log(`🔍 REORDENAMIENTO: ${b.id} (con variantes) va antes que ${a.id} (sin variantes)`)
              return 1
            }
            
            // Si ambos tienen o no tienen variantes, ordenar por cantidad
            if (a.variant_count !== b.variant_count) {
              const result = b.variant_count - a.variant_count
              console.log(`🔍 REORDENAMIENTO: ${a.id} (${a.variant_count}) vs ${b.id} (${b.variant_count}) = ${result}`)
              return result
            }
            
            // Si tienen la misma cantidad, ordenar por fecha
            const dateResult = new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            console.log(`🔍 REORDENAMIENTO: Ordenando por fecha: ${a.id} vs ${b.id} = ${dateResult}`)
            return dateResult
          })
          
          console.log('🔍 REORDENAMIENTO: Después del sort:', sortedProducts.map(p => ({
            id: p.id,
            name: p.name,
            has_variants: p.has_variants,
            variant_count: p.variant_count
          })))
          
          // Aplicar paginación después del reordenamiento
          const page = filters.page || 1
          const limit = filters.limit || 10
          const from = (page - 1) * limit
          const to = from + limit
          enrichedProducts = sortedProducts.slice(from, to)
        } catch (variantError) {
          // Si hay error obteniendo variantes, continuar con productos originales
          console.warn('Error obteniendo variantes:', variantError)
        }
      }

      // Calcular información de paginación
      const page = filters.page || 1
      const limit = filters.limit || 10

      // Si FTS fue utilizado, preservar orden y ajustar conteo
      let totalForPagination = count || 0
      if (ftsUsedOuter) {
        console.log('🔍 FTS REORDENAMIENTO: Aplicando reordenamiento FTS que puede sobrescribir nuestro orden')
        // Reordenar productos según IDs devueltos por FTS
        const orderMap = new Map<number, number>((orderedIdsOuter || []).map((id: number, i: number) => [id, i]))
        enrichedProducts = (enrichedProducts || []).slice().sort((a: any, b: any) => {
          const ai = orderMap.get(a.id) ?? 0
          const bi = orderMap.get(b.id) ?? 0
          return ai - bi
        })
        console.log('🔍 FTS REORDENAMIENTO: Después del FTS:', enrichedProducts.map(p => ({
          id: p.id,
          name: p.name,
          has_variants: p.has_variants,
          variant_count: p.variant_count
        })))
        // Ajustar total (RPC no da total real; usar tamaño de página)
        totalForPagination = overrideCountOuter ?? enrichedProducts.length
      }

      const totalPages = Math.ceil((totalForPagination || 0) / limit)

      // Log de operación exitosa
      securityLogger.log({
        type: 'data_access',
        severity: 'low',
        message: 'Products retrieved successfully',
        context: securityLogger.context,
        metadata: {
          productsCount: products?.length || 0,
          totalCount: totalForPagination || 0,
          page,
          limit,
          filters: filters,
        },
      })

      // REORDENAMIENTO FINAL: Aplicar al final para asegurar que se mantenga
      if (enrichedProducts && enrichedProducts.length > 0) {
        console.log('🔍 REORDENAMIENTO FINAL: Aplicando reordenamiento final')
        console.log('🔍 REORDENAMIENTO FINAL: Antes:', enrichedProducts.map(p => ({
          id: p.id,
          name: p.name,
          has_variants: p.has_variants,
          variant_count: p.variant_count
        })))
        
        enrichedProducts.sort((a, b) => {
          if (a.has_variants && !b.has_variants) return -1
          if (!a.has_variants && b.has_variants) return 1
          return b.variant_count - a.variant_count
        })
        
        console.log('🔍 REORDENAMIENTO FINAL: Después:', enrichedProducts.map(p => ({
          id: p.id,
          name: p.name,
          has_variants: p.has_variants,
          variant_count: p.variant_count
        })))
      }

      const response: PaginatedResponse<ProductWithCategory> = {
        data: enrichedProducts || [],
        pagination: {
          page,
          limit,
          total: totalForPagination || 0,
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
              category:categories(id, name, slug),
              categories:product_categories(category:categories(id, name, slug))
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
