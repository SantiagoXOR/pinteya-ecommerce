'use client'

import React, { useRef } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { SearchSuggestionItem } from './SearchSuggestionItem'
import type { SearchSuggestion } from '../SearchAutocompleteIntegrated'

// ===================================
// COMPONENTE: SearchDropdown
// ===================================
// Componente para renderizar el dropdown de sugerencias de forma modular y reutilizable

export interface TrendingSearch {
  query: string
  count?: number
  category?: string
}

export interface SearchDropdownProps {
  isOpen: boolean
  position: { top: number; left: number; width: number } | null
  suggestions: SearchSuggestion[]
  selectedIndex: number
  isLoading: boolean
  error: Error | null
  inputValue: string
  onSelect: (suggestion: SearchSuggestion) => void
  onMouseEnter: (index: number) => void
  categoryId?: string
  showTrendingSearches?: boolean
  trendingSearches?: TrendingSearch[]
  isTrendingLoading?: boolean
  suggestionRefs?: React.MutableRefObject<(HTMLDivElement | null)[]>
  onSuggestionHover?: (suggestion: SearchSuggestion) => void
  dropdownRef?: React.RefObject<HTMLDivElement>
}

// Sugerencias curadas para mostrar cuando no hay input
const CURATED_SUGGESTIONS = [
  'Látex',
  'Paredes',
  'Metales y Maderas',
  'Techos',
  'Antihumedad',
  'Complementos',
  'Piscinas',
  'Pisos',
  'Reparaciones',
]

// Fallback trending searches
const FALLBACK_TRENDING = [
  { query: 'Pintura látex', count: 32 },
  { query: 'Sherwin Williams', count: 28 },
  { query: 'Rodillos premium', count: 21 },
  { query: 'Esmalte sintético', count: 19 },
]

export const SearchDropdown = React.memo<SearchDropdownProps>(
  ({
    isOpen,
    position,
    suggestions,
    selectedIndex,
    isLoading,
    error,
    inputValue,
    onSelect,
    onMouseEnter,
    categoryId,
    showTrendingSearches = true,
    trendingSearches,
    isTrendingLoading = false,
    suggestionRefs,
    onSuggestionHover,
    dropdownRef: externalDropdownRef,
  }) => {
    const internalDropdownRef = useRef<HTMLDivElement>(null)
    const dropdownRef = externalDropdownRef || internalDropdownRef

    // No renderizar si no está abierto, no hay posición, o la posición es inválida
    if (!isOpen || !position || position.width <= 0 || position.top <= 0) {
      return null
    }

    // Crear sugerencias curadas cuando no hay input
    const curatedSuggestions: SearchSuggestion[] = CURATED_SUGGESTIONS.map((title, idx) => ({
      id: `curated-${title}-${idx}`,
      type: 'trending' as const,
      title,
      href:
        `/search?search=${encodeURIComponent(title)}` +
        (categoryId && categoryId !== 'all' ? `&category=${encodeURIComponent(categoryId)}` : ''),
    }))

    // Crear sugerencias fallback de trending
    const fallbackTrendingSuggestions: SearchSuggestion[] = FALLBACK_TRENDING.map(
      (fallback, idx) => ({
        id: `trending-fallback-${idx}`,
        type: 'trending' as const,
        title: fallback.query,
        subtitle: `${fallback.count} búsquedas`,
        href:
          `/search?search=${encodeURIComponent(fallback.query)}` +
          (categoryId && categoryId !== 'all'
            ? `&category=${encodeURIComponent(categoryId)}`
            : ''),
      })
    )

    const handleMouseEnter = (index: number, suggestion: SearchSuggestion) => {
      onMouseEnter(index)
      if (onSuggestionHover) {
        onSuggestionHover(suggestion)
      }
    }

    return createPortal(
      <div
        ref={dropdownRef}
        className={cn(
          'fixed bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700',
          'rounded-lg shadow-lg dark:shadow-xl z-dropdown max-h-96 overflow-y-auto'
        )}
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          width: `${position.width}px`,
        }}
        role='listbox'
        id='autocomplete-listbox'
      >
        {/* Estado inicial sin texto: sugerencias curadas */}
        {!inputValue.trim() && (
          <div className='py-2'>
            <div className='px-4 py-2 text-sm text-gray-600 dark:text-gray-400'>
              Sugerencias populares
            </div>
            {/* Lista curada de sugerencias siempre visible en estado vacío */}
            <div className='py-1'>
              {curatedSuggestions.map((suggestion, idx) => (
                <div
                  key={suggestion.id}
                  ref={el => {
                    if (suggestionRefs) {
                      suggestionRefs.current[idx] = el
                    }
                  }}
                >
                  <SearchSuggestionItem
                    suggestion={suggestion}
                    index={idx}
                    isSelected={selectedIndex === idx}
                    onSelect={onSelect}
                    onMouseEnter={index => handleMouseEnter(index, suggestion)}
                  />
                </div>
              ))}
            </div>

            {/* Loading state para trending */}
            {isTrendingLoading && (
              <div className='py-2' aria-live='polite'>
                {[...Array(3)].map((_, i) => (
                  <div key={`trend-sk-${i}`} className='flex items-center gap-3 px-4 py-3'>
                    <div className='w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse' />
                    <div className='flex-1 min-w-0'>
                      <div className='w-40 h-3 bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse mb-2' />
                      <div className='w-24 h-3 bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse' />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Fallback trending cuando no hay datos */}
            {!isTrendingLoading &&
              showTrendingSearches &&
              (!trendingSearches || trendingSearches.length === 0) && (
                <div className='py-1'>
                  {fallbackTrendingSuggestions.map((suggestion, idx) => {
                    const globalIdx = curatedSuggestions.length + idx
                    return (
                      <div
                        key={suggestion.id}
                        ref={el => {
                          if (suggestionRefs) {
                            suggestionRefs.current[globalIdx] = el
                          }
                        }}
                      >
                        <SearchSuggestionItem
                          suggestion={suggestion}
                          index={globalIdx}
                          isSelected={selectedIndex === globalIdx}
                          onSelect={onSelect}
                          onMouseEnter={index => handleMouseEnter(index, suggestion)}
                        />
                      </div>
                    )
                  })}
                </div>
              )}
          </div>
        )}

        {/* Loading state cuando hay input */}
        {isLoading && inputValue.trim() && (
          <div className='py-2' aria-live='polite'>
            {/* Skeletons de carga para mejor percepción de velocidad */}
            {[...Array(3)].map((_, i) => (
              <div key={`sk-${i}`} className='flex items-center gap-3 px-4 py-3'>
                <div className='w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse' />
                <div className='flex-1 min-w-0'>
                  <div className='w-40 h-3 bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse mb-2' />
                  <div className='w-24 h-3 bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse' />
                </div>
              </div>
            ))}
            <div className='flex items-center justify-center py-2'>
              <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500' />
              <span className='ml-2 text-gray-600 dark:text-gray-400'>Buscando productos...</span>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className='px-4 py-3 text-red-600 dark:text-red-400 text-sm' aria-live='polite'>
            Error en la búsqueda. Intenta nuevamente.
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && suggestions.length === 0 && inputValue.trim() && (
          <div
            className='px-4 py-8 text-center text-gray-500 dark:text-gray-400'
            aria-live='polite'
          >
            No se encontraron resultados para &quot;{inputValue}&quot;
          </div>
        )}

        {/* Suggestions list */}
        {!isLoading && !error && suggestions.length > 0 && inputValue.trim() && (
          <div className='py-2'>
            {suggestions.map((suggestion, index) => (
              <div
                key={suggestion.id}
                ref={el => {
                  if (suggestionRefs) {
                    suggestionRefs.current[index] = el
                  }
                }}
              >
                <SearchSuggestionItem
                  suggestion={suggestion}
                  index={index}
                  isSelected={selectedIndex === index}
                  onSelect={onSelect}
                  onMouseEnter={index => handleMouseEnter(index, suggestion)}
                />
              </div>
            ))}
          </div>
        )}
      </div>,
      document.body
    )
  }
)

SearchDropdown.displayName = 'SearchDropdown'
