'use client'

import React, { useMemo } from 'react'
import Link from 'next/link'
import { TrendingUp, Search } from '@/lib/optimized-imports'
import { trackEvent } from '@/lib/google-analytics'
import { useTrendingSearches } from '@/hooks/useTrendingSearches'

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

const TrendingSearches = () => {
  // Obtener búsquedas trending dinámicas
  const { trendingSearches: dynamicSearches, isLoading, error } = useTrendingSearches({
    limit: 8,
    enabled: true,
  })

  // Mapear búsquedas dinámicas al formato esperado por el componente
  const mappedSearches = useMemo(() => {
    if (dynamicSearches && dynamicSearches.length > 0) {
      return dynamicSearches.map(search => ({
        term: search.query,
        icon: getIconForTerm(search.query),
      }))
    }
    return null
  }, [dynamicSearches])

  // Usar búsquedas dinámicas si están disponibles, sino usar fallback
  const trendingSearches = mappedSearches || defaultTrendingSearches

  const handleSearchClick = (term: string) => {
    trackEvent('trending_search_click', 'engagement', term)
  }

  return (
    <section className='bg-white/60 backdrop-blur-sm py-8 border-b border-gray-100'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='flex items-center gap-3 mb-5'>
          <div className='flex items-center gap-2 text-orange-600'>
            <TrendingUp className='w-5 h-5' />
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
              className='group relative bg-white hover:bg-orange-50 border border-gray-200 hover:border-orange-300 rounded-full px-3 py-1.5 transition-all hover:shadow-md hover:scale-[1.01] flex items-center gap-1 min-w-fit snap-start'
            >
              {/* Icon */}
              <span className='text-base group-hover:scale-110 transition-transform flex-shrink-0'>
                {search.icon}
              </span>

              {/* Term */}
              <span className='text-xs sm:text-sm font-medium text-white/90 group-hover:text-orange-600 dark:group-hover:text-bright-sun-400 transition-colors break-words whitespace-nowrap'>
                {search.term}
              </span>

              {/* Search icon on hover */}
              <Search className='w-4 h-4 text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity ml-1 flex-shrink-0' />

              {/* Shimmer effect */}
              <div className='absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity -translate-x-full group-hover:translate-x-full duration-1000'></div>
            </Link>
          ))}
          </div>
        )}

        {/* CTA secundario */}
        <div className='mt-6 text-center'>
          <Link
            href='/products'
            className='inline-flex items-center gap-2 text-sm text-white/80 hover:text-orange-600 dark:hover:text-bright-sun-400 font-medium transition-colors group'
          >
            <Search className='w-4 h-4' />
            Ver todos los productos
            <span className='group-hover:translate-x-1 transition-transform'>→</span>
          </Link>
        </div>
      </div>
    </section>
  )
}

export default TrendingSearches

