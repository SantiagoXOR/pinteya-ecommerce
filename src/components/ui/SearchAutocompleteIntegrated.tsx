// ===================================
// COMPONENTE: SearchAutocompleteIntegrated - Componente de búsqueda autónomo y optimizado
// ===================================

import React, { useCallback, useState, useEffect, useRef, useMemo } from 'react'
import { Search, X, Clock, TrendingUp, Package, Tag } from 'lucide-react'
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
// COMPONENTE PRINCIPAL
// ===================================

export const SearchAutocompleteIntegrated = React.memo(
  React.forwardRef<HTMLInputElement, SearchAutocompleteIntegratedProps>(
    (
      {
        placeholder = 'Látex interior blanco 20lts, rodillos, pinceles...',
        className,
        disabled = false,
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
      } = useSearchOptimized({
        debounceMs,
        maxSuggestions: searchLimit,
        saveRecentSearches,
        onSearch: onSearchExecuted,
        onSuggestionSelect: onSuggestionSelected,
      })

      const { trendingSearches } = useTrendingSearches({
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
            const trendingSuggestions = trendingSearches
              .slice(0, Math.min(2, remainingSlots))
              .map(trending => ({
                id: `trending-${trending.query}`,
                type: 'trending' as const,
                title: trending.query,
                subtitle: `${trending.count} búsquedas`,
                href: `/search?search=${encodeURIComponent(trending.query)}`,
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
                href: `/search?search=${encodeURIComponent(recent)}`,
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
            setIsOpen(false)
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
          // Delay para permitir clicks en sugerencias
          setTimeout(() => {
            if (!dropdownRef.current?.contains(document.activeElement)) {
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
        setIsOpen(false)
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

      // ===================================
      // FUNCIONES DE RENDERIZADO
      // ===================================

      const getSuggestionIcon = (type: SearchSuggestion['type']) => {
        switch (type) {
          case 'product':
            return <Package className='w-4 h-4 text-gray-500' />
          case 'category':
            return <Tag className='w-4 h-4 text-gray-500' />
          case 'recent':
            return <Clock className='w-4 h-4 text-gray-400' />
          case 'trending':
            return <TrendingUp className='w-4 h-4 text-orange-500' />
          default:
            return <Search className='w-4 h-4 text-gray-500' />
        }
      }

  const renderSuggestion = (suggestion: SearchSuggestion, index: number) => (
        <div
          key={suggestion.id}
          ref={el => (suggestionRefs.current[index] = el)}
          className={cn(
            'flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors',
            'hover:bg-gray-50 focus:bg-gray-50',
            selectedIndex === index && 'bg-gray-50'
          )}
          onClick={() => handleSuggestionSelect(suggestion)}
          onMouseEnter={() => setSelectedIndex(index)}
        >
          {/* Thumbnail o icono */}
          {suggestion.image ? (
            <img
              src={suggestion.image}
              alt={suggestion.title}
              className='w-10 h-10 rounded-md object-cover border border-gray-200 flex-shrink-0'
            />
          ) : (
            getSuggestionIcon(suggestion.type)
          )}

          {/* Texto */}
          <div className='flex-1 min-w-0'>
            <div className='font-medium text-gray-900 truncate'>{suggestion.title}</div>
            {suggestion.subtitle && (
              <div className='text-sm text-gray-500 truncate'>{suggestion.subtitle}</div>
            )}
          </div>

          {/* Badges inteligentes */}
          {(suggestion.badges && suggestion.badges.length > 0) ? (
            <div className='flex items-center gap-2 flex-shrink-0'>
              {suggestion.badges.slice(0, 3).map((label, i) => (
                <span
                  key={`${suggestion.id}-badge-${i}`}
                  className={cn(
                    'px-2 py-1 text-xs rounded-full whitespace-nowrap',
                    label.toLowerCase().includes('oferta')
                      ? 'bg-red-100 text-red-800'
                      : label.toLowerCase().includes('nuevo')
                      ? 'bg-blue-100 text-blue-800'
                      : label.toLowerCase().includes('stock')
                      ? label.toLowerCase().includes('sin')
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-700'
                  )}
                >
                  {label}
                </span>
              ))}
              {suggestion.badge && (
                <span
                  className={cn(
                    'px-2 py-1 text-xs rounded-full whitespace-nowrap',
                    suggestion.badge?.toLowerCase().includes('stock')
                      ? suggestion.badge?.toLowerCase().includes('sin')
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                      : 'bg-blue-100 text-blue-800'
                  )}
                >
                  {suggestion.badge}
                </span>
              )}
            </div>
          ) : (
            suggestion.badge && (
              <span
                className={cn(
                  'px-2 py-1 text-xs rounded-full whitespace-nowrap',
                  suggestion.type === 'product'
                    ? suggestion.badge?.toLowerCase().includes('stock')
                      ? suggestion.badge?.toLowerCase().includes('sin')
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                      : 'bg-blue-100 text-blue-800'
                    : suggestion.type === 'trending'
                    ? 'bg-orange-100 text-orange-800'
                    : suggestion.type === 'recent'
                    ? 'bg-gray-100 text-gray-700'
                    : 'bg-gray-100 text-gray-700'
                )}
              >
                {suggestion.badge}
              </span>
            )
          )}
        </div>
      )

      // ===================================
      // RENDER PRINCIPAL
      // ===================================

      return (
        <div className={cn('relative w-full', className)}>
          <form onSubmit={handleSubmit} className='relative'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
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
                  'w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg',
                  'focus:ring-2 focus:ring-orange-500 focus:border-orange-500',
                  'placeholder-gray-500 text-gray-900',
                  'disabled:bg-gray-50 disabled:text-gray-500',
                  'transition-colors duration-200'
                )}
                role='searchbox'
                aria-expanded={isOpen}
                aria-haspopup='listbox'
                aria-autocomplete='list'
              />
              {showClearButton && inputValue && (
                <button
                  type='button'
                  onClick={handleClear}
                  className='absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors'
                  aria-label='Clear search'
                >
                  <X className='w-4 h-4 text-gray-400' />
                </button>
              )}
            </div>
          </form>

          {/* Dropdown de sugerencias */}
          {isOpen && (
            <div
              ref={dropdownRef}
              className={cn(
                'absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200',
                'rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto'
              )}
              role='listbox'
            >
              {isLoading && (
                <div className='flex items-center justify-center py-8'>
                  <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500' />
                  <span className='ml-2 text-gray-600'>Buscando...</span>
                </div>
              )}

              {error && (
                <div className='px-4 py-3 text-red-600 text-sm'>
                  Error en la búsqueda. Intenta nuevamente.
                </div>
              )}

              {!isLoading && !error && allSuggestions.length === 0 && inputValue.trim() && (
                <div className='px-4 py-8 text-center text-gray-500'>
                  No se encontraron resultados para "{inputValue}"
                </div>
              )}

              {!isLoading && !error && allSuggestions.length > 0 && (
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
