// ===================================
// COMPONENTE: SearchAutocompleteIntegrated - Componente de búsqueda autónomo y optimizado
// ===================================

import React, { useCallback, useState, useEffect, useRef, useMemo } from 'react'
import { Search, X, Clock, TrendingUp, Package, Tag } from '@/lib/optimized-imports'
import { cn } from '@/lib/utils'
import { useSearchOptimized } from '@/hooks/useSearchOptimized'
import { useTrendingSearches } from '@/hooks/useTrendingSearches'
import { useRecentSearches } from '@/hooks/useRecentSearches'
import { SEARCH_CONSTANTS } from '@/constants/shop'

// ===================================
// TIPOS E INTERFACES
// ===================================

export interface SearchSuggestion {
  id: string
  type: 'product' | 'category' | 'recent' | 'trending'
  title: string
  subtitle?: string
  image?: string
  badge?: string
  badges?: string[]
  href: string
}

export interface SearchAutocompleteIntegratedProps {
  // Props básicas
  placeholder?: string
  className?: string
  disabled?: boolean
  autoFocus?: boolean
  // Tamaño opcional para compatibilidad con el header
  size?: 'sm' | 'md' | 'lg'

  // Contexto de categoría (para construir URLs y navegación)
  categoryId?: string

  // Enlazar el botón externo con el formulario interno
  formId?: string

  // Configuración del hook useSearch
  debounceMs?: number
  maxSuggestions?: number
  searchLimit?: number
  saveRecentSearches?: boolean

  // Configuración de funcionalidades
  showTrendingSearches?: boolean
  showRecentSearches?: boolean
  showClearButton?: boolean

  // Callbacks
  onSearch?: (query: string) => void
  onSearchExecuted?: (query: string, results: any[]) => void
  onSuggestionSelected?: (suggestion: SearchSuggestion) => void
  onFocus?: () => void
  onBlur?: () => void
}

// ===================================
// BLOQUEO DE TÉRMINOS TRENDING NO DESEADOS
// ===================================
const normalizeText = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()

const TRENDING_BLOCKLIST = new Set<string>([
  'generico',
  'el galgo',
  'cinta papel blanca',
  'profesionales',
])

// ===================================
// COMPONENTE PRINCIPAL
// ===================================

export const SearchAutocompleteIntegrated = React.memo(
  React.forwardRef<HTMLInputElement, SearchAutocompleteIntegratedProps>(
    (
      {
        placeholder = 'Látex interior blanco 20lts, rodillos, pinceles...',
        className,
        disabled = false,
        autoFocus = false,
        debounceMs = 300,
        maxSuggestions = 6,
        searchLimit = 12,
        saveRecentSearches = true,
        showTrendingSearches = true,
        showRecentSearches = true,
        showClearButton = true,
        onSearch,
        onSearchExecuted,
        onSuggestionSelected,
        onFocus,
        onBlur,
        categoryId,
        formId,
        size,
        ...props
      },
      ref
    ) => {
      // ===================================
      // ESTADO LOCAL
      // ===================================

      const [isOpen, setIsOpen] = useState(false)
      const [inputValue, setInputValue] = useState('')
      const [selectedIndex, setSelectedIndex] = useState(-1)

      // Referencias
      const inputRef = useRef<HTMLInputElement>(null)
      const dropdownRef = useRef<HTMLDivElement>(null)
      const containerRef = useRef<HTMLDivElement>(null)
      const suggestionRefs = useRef<(HTMLDivElement | null)[]>([])

      // Combinar refs
      const combinedRef = useCallback(
        (node: HTMLInputElement) => {
          inputRef.current = node
          if (typeof ref === 'function') {
            ref(node)
          } else if (ref) {
            ref.current = node
          }
        },
        [ref]
      )

      // ===================================
      // HOOKS DE BÚSQUEDA
      // ===================================

      const {
        query,
        results,
        suggestions: searchSuggestions,
        isLoading,
        error,
        searchWithDebounce,
        executeSearch,
        selectSuggestion,
        clearSearch,
        prefetchProductPage,
      } = useSearchOptimized({
        debounceMs,
        maxSuggestions,
        searchLimit,
        saveRecentSearches,
        onSearch: onSearchExecuted,
        onSuggestionSelect: onSuggestionSelected,
        categoryId,
      })

      const {
        trendingSearches,
        isLoading: isTrendingLoading,
        error: trendingError,
      } = useTrendingSearches({
        limit: 4,
        enabled: showTrendingSearches,
      })

      const { recentSearches } = useRecentSearches({
        maxSearches: SEARCH_CONSTANTS.MAX_RECENT_SEARCHES,
        enablePersistence: showRecentSearches,
      })

      // ===================================
      // GENERACIÓN DE SUGERENCIAS OPTIMIZADA
      // ===================================

      const allSuggestions = useMemo<SearchSuggestion[]>(() => {
        const suggestions: SearchSuggestion[] = []

        // Sugerencias de productos (de la búsqueda actual)
        if (searchSuggestions && searchSuggestions.length > 0) {
          suggestions.push(...searchSuggestions.slice(0, maxSuggestions))
        }

        // Si no hay query o hay pocos resultados, agregar trending y recientes
        if (!inputValue.trim() || suggestions.length < maxSuggestions) {
          const remainingSlots = maxSuggestions - suggestions.length

          // Búsquedas trending
          if (showTrendingSearches && trendingSearches && remainingSlots > 0) {
            const filteredTrending = trendingSearches.filter(
              t => !TRENDING_BLOCKLIST.has(normalizeText(t.query))
            )
            const trendingSuggestions = filteredTrending
              .slice(0, Math.min(2, remainingSlots))
              .map(trending => ({
                id: `trending-${trending.query}`,
                type: 'trending' as const,
                title: trending.query,
                subtitle: `${trending.count} búsquedas`,
                href:
                  `/search?search=${encodeURIComponent(trending.query)}` +
                  (categoryId && categoryId !== 'all'
                    ? `&category=${encodeURIComponent(categoryId)}`
                    : ''),
              }))
            suggestions.push(...trendingSuggestions)
          }

          // Búsquedas recientes
          if (showRecentSearches && recentSearches && suggestions.length < maxSuggestions) {
            const finalSlots = maxSuggestions - suggestions.length
            const recentSuggestions = recentSearches
              .filter(
                recent =>
                  !inputValue.trim() || recent.toLowerCase().includes(inputValue.toLowerCase())
              )
              .slice(0, Math.min(2, finalSlots))
              .map(recent => ({
                id: `recent-${recent}`,
                type: 'recent' as const,
                title: recent,
                subtitle: 'Búsqueda reciente',
                href:
                  `/search?search=${encodeURIComponent(recent)}` +
                  (categoryId && categoryId !== 'all'
                    ? `&category=${encodeURIComponent(categoryId)}`
                    : ''),
              }))
            suggestions.push(...recentSuggestions)
          }
        }

        return suggestions.slice(0, maxSuggestions)
      }, [
        searchSuggestions,
        inputValue,
        maxSuggestions,
        showTrendingSearches,
        trendingSearches,
        showRecentSearches,
        recentSearches,
        categoryId,
      ])

      // ===================================
      // MANEJADORES DE EVENTOS
      // ===================================

      const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
          const value = e.target.value
          setInputValue(value)
          setSelectedIndex(-1)

          if (value.trim()) {
            searchWithDebounce(value)
            setIsOpen(true)
          } else {
            // Mantener el dropdown abierto para mostrar recientes/trending
            setIsOpen(true)
          }

          onSearch?.(value)
        },
        [searchWithDebounce, onSearch]
      )

      const handleInputFocus = useCallback(() => {
        setIsOpen(true)
        onFocus?.()
      }, [onFocus])

      const handleInputBlur = useCallback(
        (e: React.FocusEvent) => {
          // Delay para permitir clicks en sugerencias u otros elementos internos
          setTimeout(() => {
            const activeEl = document.activeElement
            const isInsideDropdown = dropdownRef.current?.contains(activeEl) ?? false
            const isInsideContainer = containerRef.current?.contains(activeEl) ?? false
            if (!isInsideDropdown && !isInsideContainer) {
              setIsOpen(false)
              setSelectedIndex(-1)
            }
          }, 150)
          onBlur?.()
        },
        [onBlur]
      )

      const handleSuggestionSelect = useCallback(
        (suggestion: SearchSuggestion) => {
          console.log(
            '🎯 SearchAutocompleteIntegrated - handleSuggestionSelect ejecutado:',
            suggestion
          )
          setInputValue(suggestion.title)
          setIsOpen(false)
          setSelectedIndex(-1)

          // Delegar navegación al hook (usa callback si existe, sino fallback automático)
          selectSuggestion(suggestion)
        },
        [selectSuggestion]
      )

      const handleSubmit = useCallback(
        (e: React.FormEvent) => {
          e.preventDefault()
          if (inputValue.trim()) {
            if (selectedIndex >= 0 && allSuggestions[selectedIndex]) {
              handleSuggestionSelect(allSuggestions[selectedIndex])
            } else {
              executeSearch(inputValue.trim())
              setIsOpen(false)
            }
          }
        },
        [inputValue, selectedIndex, allSuggestions, handleSuggestionSelect, executeSearch]
      )

      const handleClear = useCallback(() => {
        setInputValue('')
        // Mantener abierto para mostrar recientes/trending tras limpiar
        setIsOpen(true)
        setSelectedIndex(-1)
        clearSearch()
        inputRef.current?.focus()
      }, [clearSearch])

      const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
          if (!isOpen) return

          switch (e.key) {
            case 'ArrowDown':
              e.preventDefault()
              setSelectedIndex(prev => (prev < allSuggestions.length - 1 ? prev + 1 : prev))
              break
            case 'ArrowUp':
              e.preventDefault()
              setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1))
              break
            case 'Escape':
              setIsOpen(false)
              setSelectedIndex(-1)
              inputRef.current?.blur()
              break
            case 'Enter':
              e.preventDefault()
              if (selectedIndex >= 0 && allSuggestions[selectedIndex]) {
                handleSuggestionSelect(allSuggestions[selectedIndex])
              } else {
                handleSubmit(e)
              }
              break
          }
        },
        [isOpen, allSuggestions, selectedIndex, handleSuggestionSelect, handleSubmit]
      )

      // ===================================
      // EFECTOS
      // ===================================

      // Scroll automático para navegación por teclado
      useEffect(() => {
        if (selectedIndex >= 0 && suggestionRefs.current[selectedIndex]) {
          suggestionRefs.current[selectedIndex]?.scrollIntoView({
            block: 'nearest',
            behavior: 'smooth',
          })
        }
      }, [selectedIndex])

      // Auto focus cuando se activa la prop
      useEffect(() => {
        if (autoFocus && inputRef.current) {
          // Pequeño delay para asegurar que el componente está renderizado
          const timer = setTimeout(() => {
            inputRef.current?.focus()
            setIsOpen(true) // Abrir dropdown automáticamente
          }, 50)
          return () => clearTimeout(timer)
        }
      }, [autoFocus])

      // ===================================
      // FUNCIONES DE RENDERIZADO
      // ===================================

      const getSuggestionIcon = (type: SearchSuggestion['type']) => {
        switch (type) {
          case 'product':
            return <Package className='w-4 h-4 text-gray-500 dark:text-fun-green-300' />
          case 'category':
            return <Tag className='w-4 h-4 text-gray-500 dark:text-fun-green-300' />
          case 'recent':
            return <Clock className='w-4 h-4 text-gray-400 dark:text-fun-green-400' />
          case 'trending':
            return <TrendingUp className='w-4 h-4 text-orange-500 dark:text-fun-green-400' />
          default:
            return <Search className='w-4 h-4 text-gray-500 dark:text-fun-green-300' />
        }
      }

      const renderSuggestion = (suggestion: SearchSuggestion, index: number) => (
        <div
          key={suggestion.id}
          ref={el => (suggestionRefs.current[index] = el)}
          className={cn(
            'flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors',
            'hover:bg-gray-50 dark:hover:bg-fun-green-800 focus:bg-gray-50 dark:focus:bg-fun-green-800',
            selectedIndex === index && 'bg-gray-50 dark:bg-fun-green-800'
          )}
          onClick={() => handleSuggestionSelect(suggestion)}
          onMouseEnter={() => {
            setSelectedIndex(index)
            if (suggestion.type === 'product') {
              // Prefetch de la página del producto para mejorar TTI
              prefetchProductPage(suggestion.id)
            }
          }}
          role='option'
          id={`option-${suggestion.id}`}
          aria-selected={selectedIndex === index}
        >
          {/* Thumbnail o icono */}
          {suggestion.image ? (
            <img
              src={suggestion.image}
              alt={suggestion.title}
              className='w-10 h-10 rounded-md object-cover border border-gray-200 dark:border-fun-green-700 flex-shrink-0'
            />
          ) : (
            getSuggestionIcon(suggestion.type)
          )}

          {/* Texto */}
          <div className='flex-1 min-w-0'>
            <div className='font-medium text-gray-900 dark:text-fun-green-50 truncate'>{suggestion.title}</div>
            {suggestion.subtitle && (
              <div className='text-sm text-gray-500 dark:text-fun-green-200 truncate'>{suggestion.subtitle}</div>
            )}
          </div>

        </div>
      )

      // ===================================
      // RENDER PRINCIPAL
      // ===================================

      return (
        <div ref={containerRef} className={cn('relative w-full', className)}>
          <form onSubmit={handleSubmit} id={formId || 'search-autocomplete-form'} className='relative'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-fun-green-400' />
              <input
                {...props}
                ref={combinedRef}
                type='text'
                value={inputValue}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled}
                className={cn(
                  'w-full pl-10 pr-10 py-1.5 border border-gray-300 dark:border-fun-green-700 rounded-full',
                  'focus:ring-2 focus:ring-orange-500 dark:focus:ring-fun-green-500 focus:border-orange-500 dark:focus:border-fun-green-500',
                  'placeholder-gray-500 dark:placeholder-fun-green-300 text-gray-900 dark:text-fun-green-50',
                  'bg-white dark:bg-fun-green-950',
                  'disabled:bg-gray-50 dark:disabled:bg-fun-green-950 disabled:text-gray-500 dark:disabled:text-fun-green-400',
                  'transition-colors duration-200'
                )}
                role='searchbox'
                aria-expanded={isOpen}
                aria-haspopup='listbox'
                aria-autocomplete='list'
                aria-controls='autocomplete-listbox'
                aria-activedescendant={
                  selectedIndex >= 0 && allSuggestions[selectedIndex]
                    ? `option-${allSuggestions[selectedIndex].id}`
                    : undefined
                }
              />
              {showClearButton && inputValue && (
                <button
                  type='button'
                  onClick={handleClear}
                  className='absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-fun-green-800 rounded-full transition-colors'
                  aria-label='Clear search'
                >
                  <X className='w-4 h-4 text-gray-400 dark:text-fun-green-400' />
                </button>
              )}
            </div>
          </form>

          {/* Dropdown de sugerencias */}
          {isOpen && (
            <div
              ref={dropdownRef}
              className={cn(
                'absolute top-full left-0 right-0 mt-1 bg-white dark:bg-fun-green-900 border border-gray-200 dark:border-fun-green-700',
                'rounded-lg shadow-lg dark:shadow-xl z-50 max-h-96 overflow-y-auto'
              )}
              role='listbox'
            id='autocomplete-listbox'
            >
              {/* Estado inicial sin texto: encabezado y esqueleto/ayuda */}
              {!inputValue.trim() && (
                <div className='py-2'>
                  <div className='px-4 py-2 text-sm text-gray-600 dark:text-fun-green-200'>
                    Sugerencias populares
                  </div>
                  {/* Lista curada de sugerencias siempre visible en estado vacío */}
                  <div className='py-1'>
                    {[
                      'Látex',
                      'Paredes',
                      'Metales y Maderas',
                      'Techos',
                      'Antihumedad',
                      'Complementos',
                      'Piscinas',
                      'Pisos',
                      'Reparaciones',
                    ].map((title, idx) =>
                      renderSuggestion(
                        {
                          id: `curated-${title}-${idx}`,
                          type: 'trending',
                          title,
                          href:
                            `/search?search=${encodeURIComponent(title)}` +
                            (categoryId && categoryId !== 'all'
                              ? `&category=${encodeURIComponent(categoryId)}`
                              : ''),
                        },
                        idx
                      )
                    )}
                  </div>
                  {isTrendingLoading && (
                    <div className='py-2' aria-live='polite'>
                      {[...Array(3)].map((_, i) => (
                        <div key={`trend-sk-${i}`} className='flex items-center gap-3 px-4 py-3'>
                          <div className='w-10 h-10 bg-gray-100 dark:bg-fun-green-800 rounded-md animate-pulse' />
                          <div className='flex-1 min-w-0'>
                            <div className='w-40 h-3 bg-gray-100 dark:bg-fun-green-800 rounded-md animate-pulse mb-2' />
                            <div className='w-24 h-3 bg-gray-100 dark:bg-fun-green-800 rounded-md animate-pulse' />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {false && !isTrendingLoading && (trendingSearches?.length || 0) > 0 && (
                    <div className='py-1'></div>
                  )}
                  {!isTrendingLoading && (trendingSearches?.length || 0) === 0 && (
                    <div className='py-1'>
                      {[
                        { query: 'Pintura látex', count: 32 },
                        { query: 'Sherwin Williams', count: 28 },
                        { query: 'Rodillos premium', count: 21 },
                        { query: 'Esmalte sintético', count: 19 },
                      ].map((fallback, idx) =>
                        renderSuggestion(
                          {
                            id: `trending-fallback-${idx}`,
                            type: 'trending',
                            title: fallback.query,
                            subtitle: `${fallback.count} búsquedas`,
                            href:
                              `/search?search=${encodeURIComponent(fallback.query)}` +
                              (categoryId && categoryId !== 'all'
                                ? `&category=${encodeURIComponent(categoryId)}`
                                : ''),
                          },
                          idx
                        )
                      )}
                    </div>
                  )}
                </div>
              )}

              {isLoading && inputValue.trim() && (
                <div className='py-2' aria-live='polite'>
                  {/* Skeletons de carga para mejor percepción de velocidad */}
                  {[...Array(3)].map((_, i) => (
                    <div key={`sk-${i}`} className='flex items-center gap-3 px-4 py-3'>
                      <div className='w-10 h-10 bg-gray-100 dark:bg-fun-green-800 rounded-md animate-pulse' />
                          <div className='flex-1 min-w-0'>
                        <div className='w-40 h-3 bg-gray-100 dark:bg-fun-green-800 rounded-md animate-pulse mb-2' />
                        <div className='w-24 h-3 bg-gray-100 dark:bg-fun-green-800 rounded-md animate-pulse' />
                      </div>
                    </div>
                  ))}
                  <div className='flex items-center justify-center py-2'>
                    <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500' />
                    <span className='ml-2 text-gray-600 dark:text-fun-green-200'>Buscando productos...</span>
                  </div>
                </div>
              )}

              {error && (
                <div className='px-4 py-3 text-red-600 text-sm' aria-live='polite'>
                  Error en la búsqueda. Intenta nuevamente.
                </div>
              )}

              {!isLoading && !error && allSuggestions.length === 0 && inputValue.trim() && (
                <div className='px-4 py-8 text-center text-gray-500 dark:text-fun-green-200' aria-live='polite'>
                  No se encontraron resultados para "{inputValue}"
                </div>
              )}

              {!isLoading && !error && allSuggestions.length > 0 && inputValue.trim() && (
                <div className='py-2'>
                  {allSuggestions.map((suggestion, index) => renderSuggestion(suggestion, index))}
                </div>
              )}
            </div>
          )}
        </div>
      )
    }
  )
)

SearchAutocompleteIntegrated.displayName = 'SearchAutocompleteIntegrated'

export default SearchAutocompleteIntegrated
