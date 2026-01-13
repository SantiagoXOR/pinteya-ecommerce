// ===================================
// COMPONENTE: SearchAutocompleteIntegrated - Componente de búsqueda autónomo y optimizado
// ===================================

import React, { useCallback, useState, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Search, X, Clock, TrendingUp, Package, Tag } from '@/lib/optimized-imports'
import { cn } from '@/lib/utils'
import { useSearchOptimized } from '@/hooks/useSearchOptimized'
import { useTrendingSearches } from '@/hooks/useTrendingSearches'
import { useRecentSearches } from '@/hooks/useRecentSearches'
import { useAnimatedPlaceholder } from '@/hooks/useAnimatedPlaceholder'
import { SEARCH_CONSTANTS } from '@/constants/shop'
import { useDevicePerformance } from '@/hooks/useDevicePerformance'
import { useScrollActive } from '@/hooks/useScrollActive'

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
      const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number; maxHeight?: number } | null>(null)
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

      // Calcular posición del dropdown - Optimizado con requestAnimationFrame
      // ⚡ FIX: Usar getBoundingClientRect() directamente para position: fixed (relativo al viewport)
      // ⚡ FIX: Prevenir actualizaciones innecesarias que causan re-renders y ampliación
      const updateDropdownPosition = useCallback(() => {
        if (inputRef.current) {
          // ⚡ OPTIMIZACIÓN: Usar requestAnimationFrame para evitar forced reflow
          requestAnimationFrame(() => {
            if (inputRef.current) {
              const rect = inputRef.current.getBoundingClientRect()
              const viewportHeight = window.innerHeight
              const spaceBelow = viewportHeight - rect.bottom
              const maxDropdownHeight = Math.min(384, spaceBelow - 20) // max-h-96 = 384px, 20px de margen
              
              // Para position: fixed, usamos coordenadas del viewport directamente (sin scroll)
              setDropdownPosition(prev => {
                // Solo actualizar si realmente cambió (evitar re-renders innecesarios)
                if (prev && 
                    Math.abs(prev.top - (rect.bottom + 4)) < 1 &&
                    Math.abs(prev.left - rect.left) < 1 &&
                    Math.abs(prev.width - rect.width) < 1) {
                  return prev
                }
                return {
                  top: rect.bottom + 4, // 4px de espacio debajo del input
                  left: rect.left,
                  width: rect.width,
                  maxHeight: maxDropdownHeight, // Altura máxima basada en espacio disponible
                }
              })
            }
          })
        }
      }, [])

      const handleInputFocus = useCallback(() => {
        setIsOpen(true)
        updateDropdownPosition()
        resetAnimation() // Detener animación al enfocar
        onFocus?.()
      }, [onFocus, updateDropdownPosition, resetAnimation])

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
            updateDropdownPosition()
          }, 50)
          return () => clearTimeout(timer)
        }
      }, [autoFocus, updateDropdownPosition])

      // Actualizar posición del dropdown cuando se abre o cambia el tamaño de la ventana
      // ⚡ FIX: Optimizar actualización de posición para evitar ampliación y scroll extra
      useEffect(() => {
        if (isOpen && mounted) {
          // Actualizar posición inicial
          updateDropdownPosition()
          
          // Throttle más agresivo para scroll (100ms) para evitar re-renders excesivos
          let scrollTimeout: NodeJS.Timeout | null = null
          let resizeTimeout: NodeJS.Timeout | null = null
          
          const handleResize = () => {
            // Debounce resize para evitar múltiples actualizaciones
            if (resizeTimeout) clearTimeout(resizeTimeout)
            resizeTimeout = setTimeout(() => {
              updateDropdownPosition()
              resizeTimeout = null
            }, 150)
          }
          
          const handleScroll = () => {
            // Throttle más agresivo: actualizar máximo cada 100ms (no cada frame)
            // Esto previene la ampliación y el scroll extra
            if (scrollTimeout) return
            scrollTimeout = setTimeout(() => {
              updateDropdownPosition()
              scrollTimeout = null
            }, 100)
          }
          
          window.addEventListener('resize', handleResize, { passive: true })
          // ⚡ FIX: Usar capture: false para evitar interferir con el scroll de la página
          window.addEventListener('scroll', handleScroll, { passive: true, capture: false })
          
          return () => {
            window.removeEventListener('resize', handleResize)
            window.removeEventListener('scroll', handleScroll, { capture: false })
            if (scrollTimeout) clearTimeout(scrollTimeout)
            if (resizeTimeout) clearTimeout(resizeTimeout)
          }
        }
      }, [isOpen, mounted, updateDropdownPosition])

      // ===================================
      // FUNCIONES DE RENDERIZADO
      // ===================================

      const getSuggestionIcon = (type: SearchSuggestion['type']) => {
        switch (type) {
          case 'product':
            return <Package className='w-4 h-4 text-gray-500 dark:text-gray-400' />
          case 'category':
            return <Tag className='w-4 h-4 text-gray-500 dark:text-gray-400' />
          case 'recent':
            return <Clock className='w-4 h-4 text-gray-400 dark:text-gray-500' />
          case 'trending':
            return <TrendingUp className='w-4 h-4 text-orange-500 dark:text-blaze-orange-400' />
          default:
            return <Search className='w-4 h-4 text-gray-500 dark:text-gray-400' />
        }
      }

      const renderSuggestion = (suggestion: SearchSuggestion, index: number) => (
        <div
          key={suggestion.id}
          ref={el => (suggestionRefs.current[index] = el)}
          className={cn(
            'flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors',
            'hover:bg-gray-50 dark:hover:bg-gray-800 focus:bg-gray-50 dark:focus:bg-gray-800',
            selectedIndex === index && 'bg-gray-50 dark:bg-gray-800'
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
              className='w-10 h-10 rounded-md object-cover border border-gray-200 dark:border-gray-700 flex-shrink-0'
            />
          ) : (
            getSuggestionIcon(suggestion.type)
          )}

          {/* Texto */}
          <div className='flex-1 min-w-0'>
            <div className='font-medium text-gray-900 dark:text-gray-200 truncate'>{suggestion.title}</div>
            {suggestion.subtitle && (
              <div className='text-sm text-gray-500 dark:text-gray-400 truncate'>{suggestion.subtitle}</div>
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

          {/* Dropdown de sugerencias - Renderizado con Portal fuera del header */}
          {isOpen && mounted && dropdownPosition
            ? createPortal(
                <div
                  ref={dropdownRef}
                  className={cn(
                    'fixed bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700',
                    'rounded-lg shadow-lg dark:shadow-xl z-dropdown overflow-y-auto',
                    'overscroll-contain' // ⚡ FIX: Prevenir que el scroll del dropdown afecte la página
                  )}
                  style={{
                    top: `${dropdownPosition.top}px`,
                    left: `${dropdownPosition.left}px`,
                    width: `${dropdownPosition.width}px`,
                    maxHeight: dropdownPosition.maxHeight ? `${dropdownPosition.maxHeight}px` : '384px', // max-h-96 como fallback
                    // ⚡ FIX: Prevenir que el dropdown cause scroll en el body
                    position: 'fixed',
                    willChange: 'transform', // Optimización de renderizado
                  }}
                  role='listbox'
                  id='autocomplete-listbox'
                  onWheel={(e) => {
                    // ⚡ FIX: Prevenir que el scroll del dropdown se propague al body
                    const element = e.currentTarget
                    const { scrollTop, scrollHeight, clientHeight } = element
                    const isAtTop = scrollTop === 0
                    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1
                    
                    // Si está en los límites y el scroll va en esa dirección, prevenir propagación
                    if ((isAtTop && e.deltaY < 0) || (isAtBottom && e.deltaY > 0)) {
                      e.stopPropagation()
                    }
                  }}
                >
              {/* Estado inicial sin texto: encabezado y esqueleto/ayuda */}
              {!inputValue.trim() && (
                <div className='py-2'>
                  <div className='px-4 py-2 text-sm text-gray-600 dark:text-gray-400'>
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
                          <div className='w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse' />
                          <div className='flex-1 min-w-0'>
                            <div className='w-40 h-3 bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse mb-2' />
                            <div className='w-24 h-3 bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse' />
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
                      <div className='w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse' />
                          <div className='flex-1 min-w-0'>
                        <div className='w-40 h-3 bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse mb-2' />
                        <div className='w-24 h-3 bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse' />
                      </div>
                    </div>
                  ))}
                  <div className='flex items-center justify-center py-2'>
                    <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500' />
                    <span className='ml-2 text-white'>Buscando productos...</span>
                  </div>
                </div>
              )}

              {error && (
                <div className='px-4 py-3 text-red-600 text-sm' aria-live='polite'>
                  Error en la búsqueda. Intenta nuevamente.
                </div>
              )}

              {!isLoading && !error && allSuggestions.length === 0 && inputValue.trim() && (
                <div className='px-4 py-8 text-center text-gray-500 dark:text-gray-400' aria-live='polite'>
                  No se encontraron resultados para "{inputValue}"
                </div>
              )}

              {!isLoading && !error && allSuggestions.length > 0 && inputValue.trim() && (
                <div className='py-2'>
                  {allSuggestions.map((suggestion, index) => renderSuggestion(suggestion, index))}
                </div>
              )}
                </div>,
                document.body
              )
            : null}
        </div>
      )
    }
  )
)

SearchAutocompleteIntegrated.displayName = 'SearchAutocompleteIntegrated'

export default SearchAutocompleteIntegrated
