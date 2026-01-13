// ===================================
// COMPONENTE: SearchAutocompleteIntegrated - Componente de búsqueda autónomo y optimizado
// ===================================

import React, { useCallback, useState, useEffect, useRef, useMemo } from 'react'
import { Search, X } from '@/lib/optimized-imports'
import { cn } from '@/lib/utils'
import { useSearchOptimized } from '@/hooks/useSearchOptimized'
import { useTrendingSearches } from '@/hooks/useTrendingSearches'
import { useRecentSearches } from '@/hooks/useRecentSearches'
import { useAnimatedPlaceholder } from '@/hooks/useAnimatedPlaceholder'
import { SEARCH_CONSTANTS } from '@/constants/shop'
import { useDevicePerformance } from '@/hooks/useDevicePerformance'
import { useScrollActive } from '@/hooks/useScrollActive'
import { useDropdownPosition } from '@/hooks/useDropdownPosition'
import { SearchDropdown } from './search/SearchDropdown'

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
  onFocusChange?: (isFocused: boolean) => void // NUEVO: Notificar cambios de focus
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
        placeholder = 'Buscar productos...',
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
        onFocusChange,
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
      const [mounted, setMounted] = useState(false)

      // Hook para placeholder animado
      const { placeholder: animatedPlaceholder, resetAnimation } = useAnimatedPlaceholder({
        basePlaceholder: placeholder,
        enabled: !inputValue.trim(), // Solo animar cuando no hay texto
      })

      // ⚡ OPTIMIZACIÓN: Detectar scroll activo y rendimiento del dispositivo
      const performanceLevel = useDevicePerformance()
      const isLowPerformance = performanceLevel === 'low'
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
      const { isScrolling } = useScrollActive()

      // Referencias
      const inputRef = useRef<HTMLInputElement>(null)
      const dropdownRef = useRef<HTMLDivElement>(null)
      const containerRef = useRef<HTMLDivElement>(null)
      const suggestionRefs = useRef<(HTMLDivElement | null)[]>([])

      // Hook para posicionamiento del dropdown
      const { position, updatePosition } = useDropdownPosition({
        inputRef,
        isOpen,
        offset: 4,
      })

      // Montar el componente en el cliente
      useEffect(() => {
        setMounted(true)
      }, [])

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

      // ⚡ OPTIMIZACIÓN: Deshabilitar refetch automático para evitar re-renders
      const {
        trendingSearches,
        isLoading: isTrendingLoading,
        error: trendingError,
      } = useTrendingSearches({
        limit: 4,
        enabled: showTrendingSearches,
        refetchInterval: false, // ⚡ Deshabilitar refetch automático
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
            resetAnimation() // Detener animación cuando el usuario escribe
          } else {
            // Mantener el dropdown abierto para mostrar recientes/trending
            setIsOpen(true)
          }

          onSearch?.(value)
        },
        [searchWithDebounce, onSearch, resetAnimation]
      )

      const handleInputFocus = useCallback(() => {
        setIsOpen(true)
        updatePosition()
        resetAnimation() // Detener animación al enfocar
        onFocus?.()
        onFocusChange?.(true) // Notificar que está enfocado
      }, [onFocus, updatePosition, resetAnimation, onFocusChange])

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
              onFocusChange?.(false) // Notificar que perdió el focus
            }
          }, 150)
          onBlur?.()
        },
        [onBlur, onFocusChange]
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
            updatePosition()
            onFocusChange?.(true) // Notificar focus automático
          }, 50)
          return () => clearTimeout(timer)
        }
      }, [autoFocus, updatePosition, onFocusChange])

      // ===================================
      // HANDLER PARA HOVER DE SUGERENCIAS
      // ===================================

      const handleSuggestionHover = useCallback(
        (suggestion: SearchSuggestion) => {
          if (suggestion.type === 'product') {
            // Prefetch de la página del producto para mejorar TTI
            prefetchProductPage(suggestion.id)
          }
        },
        [prefetchProductPage]
      )

      // ===================================
      // RENDER PRINCIPAL
      // ===================================

      return (
        <div ref={containerRef} className={cn('relative w-full', className)}>
          <form onSubmit={handleSubmit} id={formId || 'search-autocomplete-form'} className='relative'>
            <div className='relative'>
              <input
                {...props}
                ref={combinedRef}
                type='text'
                value={inputValue}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                onKeyDown={handleKeyDown}
                placeholder={animatedPlaceholder}
                disabled={disabled}
                className={cn(
                  'w-full pl-4 pr-10 py-1.5 border border-white/35 rounded-full',
                  'focus:ring-2 focus:ring-orange-500/50 dark:focus:ring-blaze-orange-500/50 focus:border-orange-500/50 dark:focus:border-blaze-orange-500/50',
                  'placeholder-gray-600 placeholder:text-xs placeholder:font-normal dark:placeholder-gray-300 dark:placeholder:text-xs dark:placeholder:font-normal text-gray-600 dark:text-gray-300',
                  'text-sm font-normal',
                  'disabled:bg-gray-50/30 dark:disabled:bg-gray-900/30 disabled:text-gray-500 dark:disabled:text-gray-400',
                  'transition-all duration-200',
                  'focus:shadow-[0_4px_16px_rgba(0,0,0,0.15),0_2px_6px_rgba(0,0,0,0.1)]'
                )}
                style={{
                  background: inputValue || isOpen 
                    ? 'rgba(255, 255, 255, 0.95)'
                    : 'rgba(255, 255, 255, 0.95)',
                  // ⚡ OPTIMIZACIÓN: Eliminado backdrop-filter completamente
                  // El CSS global ya lo deshabilita
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                }}
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
              
              {/* Botón de búsqueda circular estilo product card */}
              <button
                type='submit'
                className='absolute right-2 top-1/2 transform -translate-y-1/2 z-10 w-6 h-6 md:w-7 md:h-7'
                aria-label='Buscar'
              >
                {/* Blur amarillo detrás del botón */}
                <div 
                  className='absolute inset-0 rounded-full pointer-events-none'
                  style={{
                    background: 'rgba(250, 204, 21, 0.9)',
                    // ⚡ OPTIMIZACIÓN: Eliminado backdrop-filter completamente
                    // El CSS global ya lo deshabilita
                  }}
                />
                
                {/* Botón circular */}
                <div className='relative w-full h-full rounded-full shadow-md flex items-center justify-center transition-all hover:scale-110 active:scale-95 transform-gpu will-change-transform bg-transparent'>
                  <Search className='w-2.5 h-2.5 md:w-3.5 md:h-3.5 text-[#EA5A17]' />
                </div>
              </button>

              {showClearButton && inputValue && (
                <button
                  type='button'
                  onClick={handleClear}
                  className='absolute right-10 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors z-20'
                  aria-label='Clear search'
                >
                  <X className='w-3 h-3 md:w-4 md:h-4 text-gray-400 dark:text-gray-500' />
                </button>
              )}
            </div>
          </form>

          {/* Dropdown de sugerencias - Renderizado con componente modular */}
          {/* Solo renderizar si hay posición válida y el input está visible */}
          {position && 
           position.width > 10 && // Mínimo 10px de ancho para considerar válido
           position.top > 0 && 
           inputRef.current && 
           inputRef.current.offsetParent !== null && (
            <SearchDropdown
              isOpen={isOpen && mounted}
              position={position}
            suggestions={allSuggestions}
            selectedIndex={selectedIndex}
            isLoading={isLoading}
            error={error}
            inputValue={inputValue}
            onSelect={handleSuggestionSelect}
            onMouseEnter={setSelectedIndex}
            categoryId={categoryId}
            showTrendingSearches={showTrendingSearches}
            trendingSearches={trendingSearches?.map(t => ({
              query: t.query,
              count: t.count,
              category: t.category,
            }))}
            isTrendingLoading={isTrendingLoading}
            suggestionRefs={suggestionRefs}
            onSuggestionHover={handleSuggestionHover}
            dropdownRef={dropdownRef}
            />
          )}
        </div>
      )
    }
  )
)

SearchAutocompleteIntegrated.displayName = 'SearchAutocompleteIntegrated'

export default SearchAutocompleteIntegrated
