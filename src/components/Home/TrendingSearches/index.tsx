'use client'

import React, { useMemo, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import { TrendingUp, Search } from '@/lib/optimized-imports'
import { trackEvent } from '@/lib/google-analytics'
import { useTrendingSearches } from '@/hooks/useTrendingSearches'
import { useTenantSafe } from '@/contexts/TenantContext'

// Búsquedas por defecto como fallback
const defaultTrendingSearches = [
  { term: 'Pintura', icon: '🎨' },
  { term: 'Látex', icon: '🖌️' },
  { term: 'Blanco', icon: '⚪' },
  { term: 'Rodillo', icon: '🔄' },
  { term: 'Pinceles', icon: '✏️' },
  { term: 'Barniz', icon: '✨' },
  { term: 'Esmalte', icon: '💎' },
  { term: 'Sellador', icon: '🛡️' },
]

// Mapeo de términos comunes a iconos
const termToIconMap: Record<string, string> = {
  'pintura': '🎨',
  'látex': '🖌️',
  'latex': '🖌️',
  'blanco': '⚪',
  'rodillo': '🔄',
  'pinceles': '✏️',
  'pincel': '✏️',
  'barniz': '✨',
  'esmalte': '💎',
  'sellador': '🛡️',
  'sintetico': '🎯',
  'sintético': '🎯',
  'impermeabilizante': '💧',
  'plavicon': '🏢',
  'plavipint': '🏢',
  'membrana': '🛡️',
  'recuplast': '🔧',
}

// Función para obtener icono basado en el término
const getIconForTerm = (term: string): string => {
  const normalizedTerm = term.toLowerCase().trim()
  return termToIconMap[normalizedTerm] || '🔍'
}

const TrendingSearchesBase = () => {
  // ⚡ MULTITENANT: Color del tenant para elementos naranjas
  const tenant = useTenantSafe()
  const accentColor = tenant?.accentColor || '#ffd549' // Amarillo por defecto
  
  // ⚡ OPTIMIZACIÓN: Deshabilitar refetch automático para evitar re-renders
  // ⚡ FIX: Manejo robusto de errores para evitar recargas
  const { trendingSearches: dynamicSearches, isLoading, error } = useTrendingSearches({
    limit: 8,
    enabled: true,
    refetchInterval: false, // ⚡ Deshabilitar refetch automático
  })

  // ⚡ FIX: Manejar errores silenciosamente sin causar recargas
  useEffect(() => {
    if (error && process.env.NODE_ENV === 'development') {
      console.warn('⚠️ TrendingSearches: Error en hook (manejado silenciosamente):', error)
      // No lanzar error ni causar recarga - el hook ya usa fallback
    }
  }, [error])

  // ⚡ OPTIMIZACIÓN: Estabilizar mappedSearches usando ref para evitar re-renders
  const prevDynamicSearchesRef = useRef<any[]>([])
  const mappedSearches = useMemo(() => {
    // Comparar contenido, no solo referencia
    const currentSearches = dynamicSearches || []
    const prevSearches = prevDynamicSearchesRef.current
    
    // Si el contenido es igual, retornar el mismo array
    if (
      currentSearches.length === prevSearches.length &&
      currentSearches.every((search, idx) => 
        prevSearches[idx]?.query === search.query
      )
    ) {
      return prevDynamicSearchesRef.current.map(search => ({
        term: search.query,
        icon: getIconForTerm(search.query),
      }))
    }
    
    // Si cambió el contenido, actualizar
    if (currentSearches.length > 0) {
      prevDynamicSearchesRef.current = currentSearches
      return currentSearches.map(search => ({
        term: search.query,
        icon: getIconForTerm(search.query),
      }))
    }
    
    return null
  }, [dynamicSearches])

  // ⚡ OPTIMIZACIÓN: Estabilizar trendingSearches
  // ⚡ FIX: Siempre usar fallback si hay error para evitar renderizar sin datos
  const trendingSearches = useMemo(() => {
    // Si hay error, usar datos por defecto
    if (error) {
      return defaultTrendingSearches
    }
    return mappedSearches || defaultTrendingSearches
  }, [mappedSearches, error])

  // ⚡ OPTIMIZACIÓN: Memoizar handleSearchClick
  const handleSearchClick = useCallback((term: string) => {
    trackEvent('trending_search_click', 'engagement', term)
  }, [])

  // ⚡ DEBUG: Log de re-renders solo en desarrollo
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const stack = new Error().stack
      console.log('🔄 TrendingSearches re-rendered', {
        timestamp: Date.now(),
        caller: stack?.split('\n')[2]?.trim() || 'unknown',
        isLoading,
        searchesCount: trendingSearches.length,
      })
    }
  })

  return (
    <section className='py-8 border-b border-white/10'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='flex items-center gap-3 mb-5'>
          <div className='flex items-center gap-2' style={{ color: accentColor }}>
            <TrendingUp className='w-5 h-5' style={{ color: accentColor }} />
            <h2 className='font-bold text-lg text-white'>
              Búsquedas Populares
            </h2>
          </div>
          <div className='h-px flex-1 bg-gradient-to-r from-gray-200 to-transparent'></div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className='flex gap-2 overflow-x-auto py-0.5'>
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className='h-8 w-24 bg-gray-200 rounded-full animate-pulse flex-shrink-0'
              />
            ))}
          </div>
        )}

        {/* Chips de búsquedas */}
        {!isLoading && (
          <div
            className='flex gap-2 overflow-x-auto scroll-smooth scrollbar-hide snap-x snap-mandatory py-0.5 -mx-2 sm:-mx-3 lg:-mx-4 px-2 sm:px-3 lg:px-4'
            role='list'
            aria-label='Búsquedas populares'
          >
            {trendingSearches.map((search, index) => (
            <Link
              key={index}
              href={`/search?search=${encodeURIComponent(search.term)}`}
              onClick={() => handleSearchClick(search.term)}
              className='group relative bg-white border border-gray-200 rounded-full px-3 py-1.5 transition-transform hover:scale-[1.01] flex items-center gap-1 min-w-fit snap-start'
              style={{
                // ⚡ FASE 8: Usar opacity y transform en lugar de background-color y border-color animados
                willChange: 'transform',
              }}
              onMouseEnter={(e) => {
                const bg = e.currentTarget.querySelector('.hover-bg') as HTMLElement
                const border = e.currentTarget.querySelector('.hover-border') as HTMLElement
                const text = e.currentTarget.querySelector('.hover-text') as HTMLElement
                if (bg) bg.style.opacity = '1'
                if (border) border.style.opacity = '1'
                if (text) text.style.opacity = '1'
              }}
              onMouseLeave={(e) => {
                const bg = e.currentTarget.querySelector('.hover-bg') as HTMLElement
                const border = e.currentTarget.querySelector('.hover-border') as HTMLElement
                const text = e.currentTarget.querySelector('.hover-text') as HTMLElement
                if (bg) bg.style.opacity = '0'
                if (border) border.style.opacity = '0'
                if (text) text.style.opacity = '0.7'
              }}
            >
              {/* ⚡ FASE 8: Overlays para hover effects usando opacity (compositable) - ⚡ MULTITENANT: usar accentColor */}
              <span 
                className="absolute inset-0 rounded-full opacity-0 hover-bg transition-opacity duration-300 pointer-events-none" 
                style={{ backgroundColor: `${accentColor}20` }}
              />
              <span 
                className="absolute inset-0 rounded-full border opacity-0 hover-border transition-opacity duration-300 pointer-events-none" 
                style={{ borderColor: `${accentColor}80` }}
              />
              <span className="absolute inset-0 rounded-full shadow-md opacity-0 hover-shadow transition-opacity duration-300 pointer-events-none" />
              
              {/* Icon */}
              <span className='text-base group-hover:scale-110 transition-transform flex-shrink-0 relative z-10'>
                {search.icon}
              </span>

              {/* Term */}
              <span className='text-xs sm:text-sm font-medium text-gray-900 break-words whitespace-nowrap relative z-10 hover-text' style={{ opacity: 0.7 }}>
                {search.term}
              </span>

              {/* Search icon on hover - ⚡ MULTITENANT: usar accentColor */}
              <Search className='w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity ml-1 flex-shrink-0' style={{ color: accentColor }} />

              {/* Shimmer effect */}
              <div className='absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity -translate-x-full group-hover:translate-x-full duration-1000'></div>
            </Link>
          ))}
          </div>
        )}

        {/* CTA secundario - ⚡ MULTITENANT: usar accentColor */}
        <div className='mt-6 text-center'>
          <Link
            href='/products'
            className='inline-flex items-center gap-2 text-sm text-white/80 font-medium group relative'
            style={{
              color: accentColor,
              opacity: 0.8,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0.8'
            }}
          >
            <Search className='w-4 h-4' style={{ color: accentColor }} />
            Ver todos los productos
            <span className='group-hover:translate-x-1 transition-transform'>→</span>
          </Link>
        </div>
      </div>
    </section>
  )
}

// ⚡ OPTIMIZACIÓN: Memoizar componente para evitar re-renders innecesarios
const TrendingSearches = React.memo(TrendingSearchesBase, (prevProps, nextProps) => {
  // No hay props, pero mantener la función para consistencia
  return true
})

TrendingSearches.displayName = 'TrendingSearches'

export default TrendingSearches
