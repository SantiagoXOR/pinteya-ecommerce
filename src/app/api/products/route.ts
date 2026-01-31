// Configuración para Node.js Runtime
export const runtime = 'nodejs'

// ===================================
// PINTURERÍA DIGITAL - API DE PRODUCTOS (MULTITENANT)
// ===================================
// API optimizada con rate limiting, timeouts centralizados, logging estructurado
// y soporte para sistema multitenant

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
import { expandQueryIntents, expandQueryIntentsByWords, mapSearchToCategory, stripDiacritics } from '@/lib/search/intents'
import { normalizeProductTitle } from '@/lib/core/utils'

// ===================================
// MULTITENANT: Importaciones para contexto de tenant
// ===================================
import { getTenantConfig } from '@/lib/tenant'

// ===================================
// FUNCIÓN DE REORDENAMIENTO INTELIGENTE
// ===================================

interface RelevanceScore {
  exactMatch: number      // Coincidencia exacta en nombre
  startsWith: number      // Nombre empieza con query
  contains: number        // Nombre contiene query
  descriptionMatch: number // Coincidencia en descripción
  brandMatch: number      // Coincidencia en marca
  ftsRank: number         // Rank de FTS (si aplica)
}

/**
 * Calcula el score de relevancia de un producto para una búsqueda
 */
function calculateRelevanceScore(
  product: any,
  query: string,
  ftsRank?: number
): number {
  const normalizedQuery = stripDiacritics(query.toLowerCase().trim())
  const productName = stripDiacritics((product.name || '').toLowerCase())
  const productDescription = stripDiacritics((product.description || '').toLowerCase())
  const productBrand = stripDiacritics((product.brand || '').toLowerCase())

  let score = 0

  // Coincidencia exacta en nombre (mayor prioridad)
  if (productName === normalizedQuery) {
    score += 100
  }

  // Nombre empieza con query
  if (productName.startsWith(normalizedQuery)) {
    score += 50
  }

  // Nombre contiene query
  if (productName.includes(normalizedQuery)) {
    score += 30
  }

  // Descripción contiene query
  if (productDescription.includes(normalizedQuery)) {
    score += 10
  }

  // Marca contiene query
  if (productBrand.includes(normalizedQuery)) {
    score += 15
  }

  // Rank de FTS (si está disponible, multiplicar por factor)
  if (ftsRank !== undefined && ftsRank > 0) {
    score += ftsRank * 20
  }

  // Bonus por tener variantes (productos más completos)
  if (product.has_variants || product.variant_count > 0) {
    score += 5
  }

  return score
}

/**
 * Reordena productos por relevancia de búsqueda
 */
function reorderSearchResults(
  products: any[],
  query: string,
  ftsProductsMap?: Map<number, number> // Map de product_id -> fts_rank
): any[] {
  if (!query || !query.trim()) {
    return products
  }

  // Calcular scores para cada producto
  const productsWithScores = products.map(product => {
    const ftsRank = ftsProductsMap?.get(product.id)
    const score = calculateRelevanceScore(product, query, ftsRank)
    return { product, score }
  })

  // Ordenar por score descendente
  productsWithScores.sort((a, b) => {
    // Primero por score
    if (b.score !== a.score) {
      return b.score - a.score
    }
    // En caso de empate, productos con variantes primero
    const aHasVariants = a.product.has_variants || a.product.variant_count > 0
    const bHasVariants = b.product.has_variants || b.product.variant_count > 0
    if (aHasVariants && !bHasVariants) return -1
    if (!aHasVariants && bHasVariants) return 1
    // Si ambos tienen o no tienen variantes, por fecha de creación
    return new Date(b.product.created_at || 0).getTime() - new Date(a.product.created_at || 0).getTime()
  })

  return productsWithScores.map(item => item.product)
}

// ===================================
// GET /api/products - Obtener productos con filtros (MULTITENANT)
// ===================================
export async function GET(request: NextRequest) {
  // Crear logger de seguridad con contexto
  const securityLogger = createSecurityLogger(request)

  // Aplicar rate limiting
  const rateLimitResult = await withRateLimit(request, RATE_LIMIT_CONFIGS.products, async () => {
    try {
      // ===================================
      // MULTITENANT: Obtener configuración del tenant actual
      // ===================================
      const tenant = await getTenantConfig()
      const tenantId = tenant.id
      
      // Log del tenant para debugging (solo en desarrollo)
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[Products API] Tenant: ${tenant.slug} (${tenantId})`)
      }
      
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
        // ⚡ OPTIMIZACIÓN: Agregar headers de compresión también en respuestas de error
        return NextResponse.json(errorResponse, { 
          status: 400,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Vary': 'Accept-Encoding',
          },
        })
      }

      const filters = validationResult.data!

      // Log de acceso a datos con contexto (incluyendo tenant)
      securityLogger.log({
        type: 'data_access',
        severity: 'low',
        message: 'Products API accessed',
        context: securityLogger.context,
        metadata: {
          tenantId: tenant.id,
          tenantSlug: tenant.slug,
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
      let ftsProductsMapOuter = new Map<number, number>() // Map de product_id -> fts_rank

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
        // ===================================
        // MULTITENANT: Usar tenant_products para obtener precio/stock/visibilidad por tenant
        // ===================================
        let query = supabase.from('products').select(
          `
              id, name, slug, brand, images, color, medida,
              category:categories(id, name, slug),
              categories:product_categories(category:categories(id, name, slug)),
              tenant_products!inner (
                price,
                discounted_price,
                stock,
                is_visible
              )
            `,
          { count: 'exact' }
        )
        .eq('tenant_products.tenant_id', tenantId)
        .eq('tenant_products.is_visible', true)

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

        // Filtros de precio: usar precio de tenant_products
        if (filters.priceMin) {
          query = query.gte('tenant_products.price', filters.priceMin)
        }

        if (filters.priceMax) {
          query = query.lte('tenant_products.price', filters.priceMax)
        }

        if (filters.search) {
          // ================================
          // BÚSQUEDA MEJORADA: FTS + ILIKE COMBINADOS + REORDENAMIENTO INTELIGENTE
          // ================================
          const raw = String(filters.search).trim()

          // Expandir intención: frase completa + por palabras (OR para "metales y maderas")
          const candidates = new Set<string>([
            ...expandQueryIntents(raw),
            ...expandQueryIntentsByWords(raw),
          ])

          // Obtener más resultados de la RPC mejorada (hasta 50) para poder reordenar
          // La función RPC ya combina FTS e ILIKE, así que obtenemos todos los resultados relevantes
          const page = filters.page || 1
          const limit = filters.limit || 10
          const from = (page - 1) * limit
          let ftsUsed = false
          let orderedIds: number[] = []
          let overrideCount: number | null = null
          let ftsProductsMap = new Map<number, number>() // Map de product_id -> fts_rank

          try {
            // Usar la función RPC mejorada que combina FTS e ILIKE
            // Obtener más resultados (50) para poder reordenar correctamente
            const { data: ftsProducts, error: ftsError } = await supabase.rpc('products_search', {
              q: raw,
              lim: 50, // Obtener más resultados para reordenar
              off: 0,  // Empezar desde el inicio
            })

            if (!ftsError && ftsProducts && ftsProducts.length > 0) {
              orderedIds = ftsProducts.map((p: any) => p.id)
              overrideCount = ftsProducts.length
              ftsUsed = true

              // Crear mapa de ranks FTS para usar en reordenamiento
              ftsProducts.forEach((p: any) => {
                if (p.id && p.rank !== undefined) {
                  ftsProductsMap.set(p.id, p.rank)
                }
              })

              // Limitar resultados de la consulta principal a los IDs devueltos por RPC
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
          ftsProductsMapOuter = ftsProductsMap
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
        const queryResult = await query
        return queryResult
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
        // ⚡ OPTIMIZACIÓN: Agregar headers de compresión también en respuestas de error
        return NextResponse.json(errorResponse, { 
          status: 500,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Vary': 'Accept-Encoding',
          },
        })
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

          // ✅ NUEVO: Obtener imágenes desde product_images (prioridad sobre campo images JSONB)
          const productImagesResult = await withDatabaseTimeout(async signal => {
            return await supabase
              .from('product_images')
              .select('product_id, url, is_primary')
              .in('product_id', productIds)
              .order('is_primary', { ascending: false })
              .order('display_order', { ascending: true })
          }, API_TIMEOUTS.supabase.simple)
          
          const { data: productImagesData } = productImagesResult
          const productImagesByProduct: Record<number, string | null> = {}
          
          // Agrupar imágenes por product_id y tomar la primera (primaria o primera disponible)
          productImagesData?.forEach((img: any) => {
            if (!productImagesByProduct[img.product_id]) {
              productImagesByProduct[img.product_id] = img.url
            }
          })

          // Enriquecer productos con variantes e imágenes
          enrichedProducts = products.map((product: any) => {
            const productVariants = variantsByProduct[product.id] || []
            const defaultVariant = productVariants.find(v => v.is_default) || productVariants[0]
            
            // ===================================
            // MULTITENANT: Obtener precio/stock desde tenant_products
            // ===================================
            const tenantProduct = Array.isArray(product.tenant_products) 
              ? product.tenant_products[0] 
              : product.tenant_products
            
            // Precio desde tenant_products (fallback a products si no existe)
            const tenantPrice = tenantProduct?.price ?? product.price
            const tenantDiscountedPrice = tenantProduct?.discounted_price ?? product.discounted_price
            
            // ✅ NUEVO: Calcular stock efectivo considerando variantes y tenant_products
            // Si tiene variantes, sumar stock de todas las variantes activas
            // Si no tiene variantes, usar stock de tenant_products (fallback a products)
            let effectiveStock = 0
            if (productVariants.length > 0) {
              // Si tiene variantes, sumar stock de todas las variantes activas
              effectiveStock = productVariants
                .filter(v => v.is_active !== false)
                .reduce((sum, v) => sum + (Number(v.stock) || 0), 0)
            } else {
              // Si no tiene variantes, usar stock de tenant_products (fallback a products)
              effectiveStock = tenantProduct?.stock !== null && tenantProduct?.stock !== undefined
                ? Number(tenantProduct.stock) || 0
                : (product.stock !== null && product.stock !== undefined 
                  ? Number(product.stock) || 0 
                  : 0)
            }
            
            return {
              ...product,
              // ✅ NUEVO: Normalizar título del producto a formato capitalizado
              name: normalizeProductTitle(product.name),
              // Mantener compatibilidad con campos legacy
              aikon_id: product.aikon_id || defaultVariant?.aikon_id,
              color: product.color || defaultVariant?.color_name,
              // ✅ CORREGIDO: Parsear medida si viene como string de array
              medida: (() => {
                const rawMedida = product.medida || defaultVariant?.measure
                if (!rawMedida) return null
                if (typeof rawMedida === 'string' && rawMedida.trim().startsWith('[') && rawMedida.trim().endsWith(']')) {
                  try {
                    const parsed = JSON.parse(rawMedida)
                    return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : rawMedida
                  } catch {
                    return rawMedida
                  }
                }
                return rawMedida
              })(),
              // Agregar información de variantes
              variants: productVariants,
              variant_count: productVariants.length,
              has_variants: productVariants.length > 0,
              default_variant: defaultVariant || null,
              // ✅ NUEVO: Agregar category_name aplanado para analytics
              category_name: (product as any).category?.name || (product as any).categories?.[0]?.category?.name || null,
              // ===================================
              // MULTITENANT: Usar precio desde tenant_products
              // ===================================
              price: tenantPrice,
              discounted_price: tenantDiscountedPrice,
              // ✅ CORREGIDO: Usar stock efectivo (considerando variantes y tenant_products)
              stock: effectiveStock,
              // ✅ NUEVO: Agregar image_url desde product_images si está disponible
              // ✅ MEJORADO: Fallback a images JSONB si no hay imagen en product_images
              image_url: (() => {
                // Prioridad 1: Imagen desde product_images
                if (productImagesByProduct[product.id]) {
                  return productImagesByProduct[product.id]
                }
                // Prioridad 2: Imagen de variante por defecto (solo si hay variantes)
                if (defaultVariant?.image_url) {
                  return defaultVariant.image_url
                }
                // Prioridad 3: Extraer desde images JSONB usando función helper
                const extractImageFromJsonb = (images: any): string | null => {
                  if (!images) return null
                  if (typeof images === 'string') {
                    const trimmed = images.trim()
                    if (!trimmed) return null
                    if (trimmed.startsWith('{') || trimmed.startsWith('[') || trimmed.startsWith('"')) {
                      try {
                        const parsed = JSON.parse(trimmed)
                        return extractImageFromJsonb(parsed)
                      } catch {
                        try {
                          const unescaped = JSON.parse(`"${trimmed}"`)
                          return extractImageFromJsonb(unescaped)
                        } catch {
                          return trimmed || null
                        }
                      }
                    }
                    return trimmed || null
                  }
                  if (Array.isArray(images)) {
                    return images[0]?.trim() || null
                  }
                  if (typeof images === 'object') {
                    return (images as any).url ||
                           images.previews?.[0] || 
                           images.thumbnails?.[0] ||
                           images.gallery?.[0] ||
                           images.main ||
                           null
                  }
                  return null
                }
                return extractImageFromJsonb(product.images)
              })(),
            }
          })

          // ✅ NUEVO: Filtrar productos sin stock efectivo (stock <= 0)
          // Esto evita que productos sin stock aparezcan en el frontend público
          enrichedProducts = enrichedProducts.filter(product => (product.stock || 0) > 0)

          // ✅ NUEVO: Guardar total de productos después del filtro (antes de paginación)
          const totalAfterStockFilter = enrichedProducts.length

          // Reordenar productos: usar reordenamiento inteligente si hay búsqueda, sino ordenar por variantes
          let sortedProducts = enrichedProducts
          
          if (filters.search) {
            // Usar reordenamiento inteligente basado en relevancia de búsqueda
            sortedProducts = reorderSearchResults(enrichedProducts, filters.search, ftsProductsMapOuter)

            // Fallback: si hay < 11 resultados y la búsqueda mapea a una categoría, incluir productos de esa categoría
            const MIN_SEARCH_RESULTS = 11
            if (sortedProducts.length < MIN_SEARCH_RESULTS) {
              const categorySlug = mapSearchToCategory(filters.search)
              if (categorySlug) {
                try {
                  const { data: catData } = await supabase
                    .from('categories')
                    .select('id')
                    .eq('slug', categorySlug)
                    .single()
                  if (catData?.id) {
                    const { data: pcData } = await supabase
                      .from('product_categories')
                      .select('product_id')
                      .eq('category_id', catData.id)
                    const existingIds = new Set(sortedProducts.map((p: any) => p.id))
                    const extraIds = (pcData || [])
                      .map((pc: any) => pc.product_id)
                      .filter((id: number) => !existingIds.has(id))
                      .slice(0, MIN_SEARCH_RESULTS - sortedProducts.length + 10)
                    if (extraIds.length > 0) {
                      const fallbackQuery = supabase.from('products').select(
                        `
                          id, name, slug, brand, images, color, medida,
                          category:categories(id, name, slug),
                          categories:product_categories(category:categories(id, name, slug)),
                          tenant_products!inner (price, discounted_price, stock, is_visible)
                        `
                      ).eq('tenant_products.tenant_id', tenantId).eq('tenant_products.is_visible', true).in('id', extraIds)
                      const { data: fallbackProducts } = await fallbackQuery
                      if (fallbackProducts && fallbackProducts.length > 0) {
                        const extraProductIds = fallbackProducts.map((p: any) => p.id)
                        const { data: extraVariantsData } = await supabase
                          .from('product_variants')
                          .select('*')
                          .in('product_id', extraProductIds)
                          .eq('is_active', true)
                        const { data: extraImagesData } = await supabase
                          .from('product_images')
                          .select('product_id, url, is_primary')
                          .in('product_id', extraProductIds)
                        const variantsByProductExtra: Record<number, any[]> = {}
                        (extraVariantsData || []).forEach((v: any) => {
                          if (!variantsByProductExtra[v.product_id]) variantsByProductExtra[v.product_id] = []
                          variantsByProductExtra[v.product_id].push(v)
                        })
                        const productImagesByProductExtra: Record<number, string | null> = {}
                        (extraImagesData || []).forEach((img: any) => {
                          if (!productImagesByProductExtra[img.product_id]) productImagesByProductExtra[img.product_id] = img.url
                        })
                        const enrichedExtra = fallbackProducts.map((product: any) => {
                          const productVariants = variantsByProductExtra[product.id] || []
                          const defaultVariant = productVariants.find((v: any) => v.is_default) || productVariants[0]
                          const tenantProduct = Array.isArray(product.tenant_products) ? product.tenant_products[0] : product.tenant_products
                          const tenantPrice = tenantProduct?.price ?? product.price
                          const tenantDiscountedPrice = tenantProduct?.discounted_price ?? product.discounted_price
                          let effectiveStock = 0
                          if (productVariants.length > 0) {
                            effectiveStock = productVariants.filter((v: any) => v.is_active !== false).reduce((sum: number, v: any) => sum + (Number(v.stock) || 0), 0)
                          } else {
                            effectiveStock = tenantProduct?.stock != null ? Number(tenantProduct.stock) || 0 : (product.stock != null ? Number(product.stock) || 0 : 0)
                          }
                          const rawMedida = product.medida || defaultVariant?.measure
                          return {
                            ...product,
                            name: normalizeProductTitle(product.name),
                            aikon_id: product.aikon_id || defaultVariant?.aikon_id,
                            color: product.color || defaultVariant?.color_name,
                            medida: !rawMedida ? null : (typeof rawMedida === 'string' && rawMedida.trim().startsWith('[') ? (() => { try { const p = JSON.parse(rawMedida); return Array.isArray(p) && p.length > 0 ? p[0] : rawMedida } catch { return rawMedida } })() : rawMedida),
                            variants: productVariants,
                            variant_count: productVariants.length,
                            has_variants: productVariants.length > 0,
                            default_variant: defaultVariant || null,
                            category_name: (product as any).category?.name || (product as any).categories?.[0]?.category?.name || null,
                            price: tenantPrice,
                            discounted_price: tenantDiscountedPrice,
                            stock: effectiveStock,
                            image_url: productImagesByProductExtra[product.id] || defaultVariant?.image_url || (Array.isArray(product.images) ? product.images[0] : null),
                          }
                        })
                        const withStock = enrichedExtra.filter((p: any) => (p.stock || 0) > 0)
                        const merged = [...sortedProducts]
                        const mergedIds = new Set(merged.map((p: any) => p.id))
                        for (const p of withStock) {
                          if (!mergedIds.has(p.id) && merged.length < 50) {
                            merged.push(p)
                            mergedIds.add(p.id)
                          }
                        }
                        sortedProducts = merged
                        enrichedProducts = merged
                        ;(enrichedProducts as any).__totalAfterStockFilter = merged.length
                      }
                    }
                  }
                } catch (fallbackErr) {
                  if (process.env.NODE_ENV === 'development') {
                    console.warn('[Search] Category fallback error:', fallbackErr)
                  }
                }
              }
            }
          } else {
            // Reordenar productos: primero los que tienen variantes (solo si no hay búsqueda)
            sortedProducts = [...enrichedProducts].sort((a, b) => {
              // Si uno tiene variantes y el otro no, el que tiene variantes va primero
              if (a.has_variants && !b.has_variants) {
                return -1
              }
              if (!a.has_variants && b.has_variants) {
                return 1
              }
              
              // Si ambos tienen o no tienen variantes, ordenar por cantidad
              if (a.variant_count !== b.variant_count) {
                return b.variant_count - a.variant_count
              }
              
              // Si tienen la misma cantidad, ordenar por fecha
              return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
            })
          }
          
          // Aplicar paginación después del reordenamiento
          const page = filters.page || 1
          const limit = filters.limit || 10
          const from = (page - 1) * limit
          const to = from + limit
          enrichedProducts = sortedProducts.slice(from, to)
          
          // ✅ NUEVO: Guardar total después del filtro para ajustar paginación
          // Esto se usará más abajo para ajustar el conteo total
          ;(enrichedProducts as any).__totalAfterStockFilter = totalAfterStockFilter
        } catch (variantError) {
          // Si hay error obteniendo variantes, continuar con productos originales
          console.warn('Error obteniendo variantes:', variantError)
        }
      }

      // Calcular información de paginación
      const page = filters.page || 1
      const limit = filters.limit || 10

      // ✅ CORREGIDO: Ajustar conteo total considerando el filtro de stock
      let totalForPagination = count || 0
      
      // Si se aplicó filtro de stock, usar el total después del filtro
      const totalAfterStockFilter = (enrichedProducts as any).__totalAfterStockFilter
      if (totalAfterStockFilter !== undefined) {
        // Usar el total después del filtro de stock
        totalForPagination = totalAfterStockFilter
        // Limpiar la propiedad temporal
        delete (enrichedProducts as any).__totalAfterStockFilter
      } else if (ftsUsedOuter) {
        // Si FTS fue utilizado, ajustar conteo (el ordenamiento ya se aplicó arriba)
        totalForPagination = overrideCountOuter ?? enrichedProducts.length
      } else {
        // Para listados normales sin búsqueda: ajustar conteo basado en productos filtrados
        // Si tenemos menos productos de los esperados después del filtro, ajustar el conteo
        const originalCount = products?.length || 0
        const filteredCount = enrichedProducts.length
        if (originalCount > 0 && filteredCount < originalCount) {
          // Estimar el total ajustado basado en la proporción de productos filtrados
          // Esto es una aproximación, pero es mejor que usar el conteo original
          const filterRatio = filteredCount / originalCount
          totalForPagination = Math.max(0, Math.floor((count || 0) * filterRatio))
        }
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

      // REORDENAMIENTO FINAL: Solo aplicar si NO hay búsqueda activa
      // (cuando hay búsqueda, el ordenamiento por relevancia ya se aplicó)
      if (enrichedProducts && enrichedProducts.length > 0 && !filters.search) {
        enrichedProducts.sort((a, b) => {
          if (a.has_variants && !b.has_variants) return -1
          if (!a.has_variants && b.has_variants) return 1
          return b.variant_count - a.variant_count
        })
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

      // ⚡ OPTIMIZACIÓN: Agregar headers de cache y compresión para mejorar performance
      // Next.js comprime automáticamente en producción, pero estos headers aseguran compatibilidad
      return NextResponse.json(response, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
          'Content-Type': 'application/json; charset=utf-8',
          // ⚡ OPTIMIZACIÓN: Headers para indicar que el contenido es comprimible
          // Next.js maneja la compresión automáticamente en producción (Gzip/Brotli)
          'Vary': 'Accept-Encoding',
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

      // ⚡ OPTIMIZACIÓN: Agregar headers de compresión también en respuestas de error
      return NextResponse.json(errorResponse, { 
        status: 500,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Vary': 'Accept-Encoding',
        },
      })
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

      // ⚡ OPTIMIZACIÓN: Agregar headers de compresión también en respuestas de error
      return NextResponse.json(errorResponse, { 
        status: 500,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Vary': 'Accept-Encoding',
        },
      })
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
