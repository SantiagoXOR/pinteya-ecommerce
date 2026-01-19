// Configuración para Node.js Runtime
export const runtime = 'nodejs'

// ===================================
// API: /api/search/trending - Búsquedas populares/trending
// ===================================

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/integrations/supabase'
import { ApiResponse } from '@/types/api'
import { metricsCache } from '@/lib/analytics/metrics-cache'

// ===================================
// MEJORAS DE SEGURIDAD - ALTA PRIORIDAD
// ===================================
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limiting/rate-limiter'
import { API_TIMEOUTS, withDatabaseTimeout, getEndpointTimeouts } from '@/lib/config/api-timeouts'
import { createSecurityLogger } from '@/lib/logging/security-logger'

export interface TrendingSearch {
  id: string
  query: string
  count: number
  category?: string
  href: string
  type: 'trending'
}

export interface TrendingSearchesResponse {
  trending: TrendingSearch[]
  lastUpdated: string
}

// Búsquedas trending por defecto para fallback
const defaultTrendingSearches: TrendingSearch[] = [
  {
    id: 'default-1',
    query: 'Pintura látex',
    count: 45,
    category: 'pinturas',
    href: '/search?q=pintura+latex',
    type: 'trending',
  },
  {
    id: 'default-2',
    query: 'Sherwin Williams',
    count: 38,
    category: 'marcas',
    href: '/search?q=sherwin+williams',
    type: 'trending',
  },
  {
    id: 'default-3',
    query: 'Rodillos premium',
    count: 32,
    category: 'herramientas',
    href: '/search?q=rodillos+premium',
    type: 'trending',
  },
  {
    id: 'default-4',
    query: 'Pinceles',
    count: 28,
    category: 'herramientas',
    href: '/search?q=pinceles',
    type: 'trending',
  },
  {
    id: 'default-5',
    query: 'Esmalte sintético',
    count: 25,
    category: 'pinturas',
    href: '/search?q=esmalte+sintetico',
    type: 'trending',
  },
  {
    id: 'default-6',
    query: 'Barniz',
    count: 22,
    category: 'pinturas',
    href: '/search?q=barniz',
    type: 'trending',
  },
]

// Búsquedas trending generadas dinámicamente basadas en productos reales
async function generateDynamicTrendingSearches(
  supabase: any,
  limit: number = 6
): Promise<TrendingSearch[]> {
  try {
    // Obtener productos más populares y marcas para generar búsquedas trending realistas
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('name, brand, category_id, categories(name)')
      .eq('is_active', true)
      .limit(20)

    if (productsError || !products) {
      console.warn('Error obteniendo productos para trending:', productsError)
      return getFallbackTrendingSearches(limit)
    }

    // Generar búsquedas trending basadas en productos reales
    const trendingSearches: TrendingSearch[] = []
    const usedQueries = new Set<string>()

    // Agregar búsquedas por marca
    const brands = [...new Set(products.map(p => p.brand).filter(Boolean))]
    brands.slice(0, 2).forEach((brand, index) => {
      if (brand && !usedQueries.has(brand.toLowerCase())) {
        trendingSearches.push({
          id: `trending-brand-${index + 1}`,
          query: brand,
          count: Math.floor(Math.random() * 50) + 20, // Rango realista 20-70
          category: 'marcas',
          href: `/search?q=${encodeURIComponent(brand)}`,
          type: 'trending',
        })
        usedQueries.add(brand.toLowerCase())
      }
    })

    // Agregar búsquedas por categoría
    const categories = [...new Set(products.map(p => p.categories?.name).filter(Boolean))]
    categories.slice(0, 2).forEach((category, index) => {
      if (category && !usedQueries.has(category.toLowerCase())) {
        trendingSearches.push({
          id: `trending-category-${index + 1}`,
          query: category,
          count: Math.floor(Math.random() * 40) + 15, // Rango realista 15-55
          category: 'pinturas',
          href: `/search?q=${encodeURIComponent(category)}`,
          type: 'trending',
        })
        usedQueries.add(category.toLowerCase())
      }
    })

    // Agregar búsquedas por productos específicos
    const popularProducts = products.slice(0, 2)
    popularProducts.forEach((product, index) => {
      const productName = product.name
      if (productName && !usedQueries.has(productName.toLowerCase())) {
        trendingSearches.push({
          id: `trending-product-${index + 1}`,
          query: productName,
          count: Math.floor(Math.random() * 30) + 10, // Rango realista 10-40
          category: 'productos',
          href: `/search?q=${encodeURIComponent(productName)}`,
          type: 'trending',
        })
        usedQueries.add(productName.toLowerCase())
      }
    })

    // Ordenar por count descendente y limitar
    return trendingSearches.sort((a, b) => b.count - a.count).slice(0, limit)
  } catch (error) {
    console.error('Error generando trending searches dinámicas:', error)
    return getFallbackTrendingSearches(limit)
  }
}

// Fallback con datos mínimos (solo si falla todo lo demás)
function getFallbackTrendingSearches(limit: number = 6): TrendingSearch[] {
  const fallbackSearches = [
    { query: 'Pintura', category: 'pinturas' },
    { query: 'Esmalte', category: 'pinturas' },
    { query: 'Látex', category: 'pinturas' },
    { query: 'Barniz', category: 'pinturas' },
    { query: 'Imprimación', category: 'pinturas' },
    { query: 'Rodillos', category: 'herramientas' },
  ]

  return fallbackSearches.slice(0, limit).map((search, index) => ({
    id: `fallback-${index + 1}`,
    query: search.query,
    count: Math.floor(Math.random() * 20) + 5, // Rango mínimo 5-25
    category: search.category,
    href: `/search?q=${encodeURIComponent(search.query.toLowerCase())}`,
    type: 'trending' as const,
  }))
}

export async function GET(request: NextRequest) {
  // Crear logger de seguridad con contexto
  const securityLogger = createSecurityLogger(request)

  // Aplicar rate limiting para APIs de búsqueda
  const rateLimitResult = await withRateLimit(request, RATE_LIMIT_CONFIGS.search, async () => {
    // Log de acceso a la API
    securityLogger.log({
      type: 'data_access',
      severity: 'low',
      message: 'Trending search API accessed',
      context: securityLogger.context,
      metadata: {
        endpoint: '/api/search/trending',
        method: 'GET',
        userAgent: request.headers.get('user-agent'),
      },
    })

    try {
      const { searchParams } = new URL(request.url)
      const limit = parseInt(searchParams.get('limit') || '6')
      const days = parseInt(searchParams.get('days') || '7')
      const category = searchParams.get('category')

      console.log('🔥 API /api/search/trending: Obteniendo búsquedas trending', {
        limit,
        days,
        category,
      })

      const supabase = getSupabaseClient()

      let trendingSearches: TrendingSearch[] = []

      // Intentar obtener búsquedas trending reales del sistema de analytics
      if (supabase) {
        try {
          const startDate = new Date()
          startDate.setDate(startDate.getDate() - days)

          // Query para obtener búsquedas más populares de analytics_events
          let query = supabase
            .from('analytics_events')
            .select('label, metadata')
            .eq('category', 'search')
            .eq('action', 'search_query')
            .gte('created_at', startDate.toISOString())
            .not('label', 'is', null)

          if (category) {
            query = query.eq('metadata->>category', category)
          }

          const { data: analyticsData, error } = await withDatabaseTimeout(
            async signal => await query,
            API_TIMEOUTS.database
          )

          if (!error && analyticsData && analyticsData.length > 0) {
            // Procesar datos de analytics para obtener trending
            const searchCounts = new Map<string, number>()
            const searchCategories = new Map<string, string>()

            analyticsData.forEach(event => {
              if (event.label) {
                const query = event.label.toLowerCase().trim()
                if (query.length > 2) {
                  // Solo queries de más de 2 caracteres
                  searchCounts.set(query, (searchCounts.get(query) || 0) + 1)

                  // Extraer categoría del metadata si existe
                  if (event.metadata && event.metadata.category) {
                    searchCategories.set(query, event.metadata.category)
                  }
                }
              }
            })

            // Convertir a array y ordenar por popularidad
            const sortedSearches = Array.from(searchCounts.entries())
              .sort((a, b) => b[1] - a[1])
              .slice(0, limit)

            trendingSearches = sortedSearches.map(([query, count], index) => ({
              id: `trending-real-${index + 1}`,
              query: query.charAt(0).toUpperCase() + query.slice(1),
              count,
              category: searchCategories.get(query),
              href: `/search?q=${encodeURIComponent(query)}`,
              type: 'trending' as const,
            }))
          }
        } catch (analyticsError) {
          console.warn(
            '⚠️ Error obteniendo trending de analytics, usando fallback:',
            analyticsError
          )
        }
      }

      // Si no hay datos reales o hay pocos, generar dinámicamente
      if (trendingSearches.length < 3) {
        console.log('🔄 Generando búsquedas trending dinámicas desde productos')

        try {
          const dynamicSearches = await generateDynamicTrendingSearches(supabase, limit)

          // Filtrar por categoría si se especifica
          let filteredSearches = dynamicSearches
          if (category) {
            filteredSearches = dynamicSearches.filter(search => search.category === category)
          }

          // Combinar datos reales con dinámicos si es necesario
          const needed = limit - trendingSearches.length
          const additionalSearches = filteredSearches.slice(0, needed)

          trendingSearches = [...trendingSearches, ...additionalSearches]
        } catch (error) {
          console.error('Error generando trending dinámicas, usando fallback:', error)
          const fallbackSearches = getFallbackTrendingSearches(limit - trendingSearches.length)
          trendingSearches = [...trendingSearches, ...fallbackSearches]
        }
      }

      // Limitar al número solicitado
      trendingSearches = trendingSearches.slice(0, limit)

      const response: ApiResponse<TrendingSearchesResponse> = {
        data: {
          trending: trendingSearches,
          lastUpdated: new Date().toISOString(),
        },
        success: true,
      }

      console.log('🔥 Trending searches response:', {
        count: trendingSearches.length,
        hasRealData: trendingSearches.some(s => s.id.includes('real')),
        categories: [...new Set(trendingSearches.map(s => s.category).filter(Boolean))],
      })

      // Log de operación exitosa
      securityLogger.log({
        type: 'data_access',
        severity: 'low',
        message: 'Trending searches retrieved successfully',
        context: securityLogger.context,
        metadata: {
          searchesCount: trendingSearches.length,
          limit: limit,
          days: days,
          category: category,
        },
      })

      return NextResponse.json(response)
    } catch (error) {
      console.error('❌ Error en /api/search/trending:', error)

      // Log de error de seguridad
      securityLogger.logApiError(
        securityLogger.context,
        error instanceof Error ? error : new Error('Unknown error'),
        {
          endpoint: '/api/search/trending',
        }
      )

      // En caso de error, devolver búsquedas por defecto
      const fallbackResponse: ApiResponse<TrendingSearchesResponse> = {
        data: {
          trending: defaultTrendingSearches.slice(
            0,
            parseInt(request.nextUrl.searchParams.get('limit') || '6')
          ),
          lastUpdated: new Date().toISOString(),
        },
        success: true,
      }

      return NextResponse.json(fallbackResponse)
    }
  })

  // Manejar rate limit excedido
  if (rateLimitResult instanceof NextResponse) {
    securityLogger.logRateLimitExceeded(securityLogger.context, {
      endpoint: '/api/search/trending',
      method: 'GET',
    })
    return rateLimitResult
  }

  return rateLimitResult
}

// Método POST para registrar una búsqueda (para analytics)
export async function POST(request: NextRequest) {
  try {
    // Validar que el request tenga contenido
    const contentType = request.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type debe ser application/json' }, { status: 400 })
    }

    // Obtener el texto del body primero para validar
    const bodyText = await request.text()
    if (!bodyText || bodyText.trim() === '' || bodyText === '""' || bodyText === "''") {
      return NextResponse.json(
        { error: 'Body de la request no puede estar vacío' },
        { status: 400 }
      )
    }

    // Parsear JSON de forma segura
    let requestData
    try {
      requestData = JSON.parse(bodyText)
    } catch (parseError) {
      console.error('Error parsing JSON in POST /api/search/trending:', parseError)
      return NextResponse.json({ error: 'JSON inválido en el body de la request' }, { status: 400 })
    }

    const { query, category, userId, sessionId } = requestData

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query de búsqueda requerida' }, { status: 400 })
    }

    const supabase = getSupabaseClient()

    if (supabase) {
      // Registrar la búsqueda en analytics usando función optimizada
      const { error } = await supabase.rpc('insert_analytics_event_optimized', {
        p_event_name: 'search',
        p_category: 'search',
        p_action: 'search',
        p_label: query.toLowerCase().trim().substring(0, 50),
        p_user_id: userId,
        p_session_id: sessionId || 'anonymous',
        p_page: '/search',
        p_user_agent: null,
      })

      if (error) {
        console.error('Error registrando búsqueda en analytics:', error)
      } else {
        // Invalidar caché de métricas para que los nuevos eventos de búsqueda se reflejen
        await metricsCache.invalidatePattern('analytics:*').catch(() => {})
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Error registrando búsqueda:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
