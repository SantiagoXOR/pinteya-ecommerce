// ===================================
// API: /api/search/trending - Búsquedas populares/trending
// ===================================

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { ApiResponse } from '@/types/api';

export interface TrendingSearch {
  id: string;
  query: string;
  count: number;
  category?: string;
  href: string;
  type: 'trending';
}

export interface TrendingSearchesResponse {
  trending: TrendingSearch[];
  lastUpdated: string;
}

// Búsquedas trending por defecto (fallback)
const defaultTrendingSearches: TrendingSearch[] = [
  {
    id: "trending-1",
    query: "Pintura látex",
    count: 156,
    category: "pinturas",
    href: "/search?q=pintura+latex",
    type: "trending"
  },
  {
    id: "trending-2", 
    query: "Sherwin Williams",
    count: 142,
    category: "marcas",
    href: "/search?q=sherwin+williams",
    type: "trending"
  },
  {
    id: "trending-3",
    query: "Rodillos premium",
    count: 98,
    category: "herramientas",
    href: "/search?q=rodillos+premium",
    type: "trending"
  },
  {
    id: "trending-4",
    query: "Pinceles",
    count: 87,
    category: "herramientas", 
    href: "/search?q=pinceles",
    type: "trending"
  },
  {
    id: "trending-5",
    query: "Impermeabilizante",
    count: 76,
    category: "pinturas",
    href: "/search?q=impermeabilizante",
    type: "trending"
  },
  {
    id: "trending-6",
    query: "Petrilac",
    count: 65,
    category: "marcas",
    href: "/search?q=petrilac",
    type: "trending"
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '6');
    const days = parseInt(searchParams.get('days') || '7');
    const category = searchParams.get('category');

    console.log('🔥 API /api/search/trending: Obteniendo búsquedas trending', {
      limit,
      days,
      category
    });

    const supabase = getSupabaseClient();

    let trendingSearches: TrendingSearch[] = [];

    // Intentar obtener búsquedas trending reales del sistema de analytics
    if (supabase) {
      try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Query para obtener búsquedas más populares de analytics_events
        let query = supabase
          .from('analytics_events')
          .select('label, metadata')
          .eq('category', 'search')
          .eq('action', 'search_query')
          .gte('created_at', startDate.toISOString())
          .not('label', 'is', null);

        if (category) {
          query = query.eq('metadata->>category', category);
        }

        const { data: analyticsData, error } = await query;

        if (!error && analyticsData && analyticsData.length > 0) {
          // Procesar datos de analytics para obtener trending
          const searchCounts = new Map<string, number>();
          const searchCategories = new Map<string, string>();

          analyticsData.forEach((event) => {
            if (event.label) {
              const query = event.label.toLowerCase().trim();
              if (query.length > 2) { // Solo queries de más de 2 caracteres
                searchCounts.set(query, (searchCounts.get(query) || 0) + 1);
                
                // Extraer categoría del metadata si existe
                if (event.metadata && event.metadata.category) {
                  searchCategories.set(query, event.metadata.category);
                }
              }
            }
          });

          // Convertir a array y ordenar por popularidad
          const sortedSearches = Array.from(searchCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit);

          trendingSearches = sortedSearches.map(([query, count], index) => ({
            id: `trending-real-${index + 1}`,
            query: query.charAt(0).toUpperCase() + query.slice(1),
            count,
            category: searchCategories.get(query),
            href: `/search?q=${encodeURIComponent(query)}`,
            type: 'trending' as const
          }));

          console.log('✅ Búsquedas trending obtenidas de analytics:', trendingSearches.length);
        }
      } catch (analyticsError) {
        console.warn('⚠️ Error obteniendo trending de analytics, usando fallback:', analyticsError);
      }
    }

    // Si no hay datos reales o hay pocos, usar datos por defecto
    if (trendingSearches.length < 3) {
      console.log('📋 Usando búsquedas trending por defecto');
      
      let filteredDefaults = defaultTrendingSearches;
      
      // Filtrar por categoría si se especifica
      if (category) {
        filteredDefaults = defaultTrendingSearches.filter(
          search => search.category === category
        );
      }
      
      // Combinar datos reales con defaults si es necesario
      const needed = limit - trendingSearches.length;
      const additionalSearches = filteredDefaults.slice(0, needed);
      
      trendingSearches = [...trendingSearches, ...additionalSearches];
    }

    // Limitar al número solicitado
    trendingSearches = trendingSearches.slice(0, limit);

    const response: ApiResponse<TrendingSearchesResponse> = {
      data: {
        trending: trendingSearches,
        lastUpdated: new Date().toISOString()
      },
      success: true
    };

    console.log('🔥 Trending searches response:', {
      count: trendingSearches.length,
      hasRealData: trendingSearches.some(s => s.id.includes('real')),
      categories: [...new Set(trendingSearches.map(s => s.category).filter(Boolean))]
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error en /api/search/trending:', error);

    // En caso de error, devolver búsquedas por defecto
    const fallbackResponse: ApiResponse<TrendingSearchesResponse> = {
      data: {
        trending: defaultTrendingSearches.slice(0, parseInt(request.nextUrl.searchParams.get('limit') || '6')),
        lastUpdated: new Date().toISOString()
      },
      success: true
    };

    return NextResponse.json(fallbackResponse);
  }
}

// Método POST para registrar una búsqueda (para analytics)
export async function POST(request: NextRequest) {
  try {
    const { query, category, userId, sessionId } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query de búsqueda requerida' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    if (supabase) {
      // Registrar la búsqueda en analytics
      const { error } = await supabase
        .from('analytics_events')
        .insert({
          event_name: 'search_query',
          category: 'search',
          action: 'search_query',
          label: query.toLowerCase().trim(),
          user_id: userId,
          session_id: sessionId || 'anonymous',
          page: '/search',
          metadata: {
            category: category,
            timestamp: new Date().toISOString()
          }
        });

      if (error) {
        console.error('Error registrando búsqueda en analytics:', error);
      } else {
        console.log('✅ Búsqueda registrada en analytics:', query);
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ Error registrando búsqueda:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
