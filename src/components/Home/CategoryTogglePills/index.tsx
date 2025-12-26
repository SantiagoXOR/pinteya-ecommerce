'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from '@/lib/optimized-imports'
import { useCategoriesWithDynamicCounts } from '@/hooks/useCategoriesWithDynamicCounts'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Image from 'next/image'
import { useCategoryFilter } from '@/contexts/CategoryFilterContext'
import { usePrefetchOnHover, usePrefetchBestSellerOnHover } from '@/hooks/usePrefetchOnHover'

interface CategoryTogglePillsProps {
  onCategoryChange: (selectedCategories: string[]) => void
  selectedCategories: string[]
  searchTerm?: string
  otherFilters?: any
  variant?: 'default' | 'bare'
  useDynamicCarousel?: boolean // Nueva prop para indicar si debe usar el contexto de carrusel dinámico
}

// ⚡ OPTIMIZACIÓN: Componente memoizado para cada item del carrusel
interface CategoryPillItemProps {
  category: {
    id: string
    slug: string
    name: string
    image_url?: string | null
  }
  isSelected: boolean
  useDynamicCarousel: boolean
  onToggle: (slug: string) => void
  onMouseEnter: (slug: string) => void
  onMouseLeave: () => void
}

const CategoryPillItem = React.memo<CategoryPillItemProps>(({
  category,
  isSelected,
  useDynamicCarousel,
  onToggle,
  onMouseEnter,
  onMouseLeave,
}) => {
  const handleClick = useCallback(() => {
    onToggle(category.slug)
  }, [category.slug, onToggle])

  const handleMouseEnter = useCallback(() => {
    onMouseEnter(category.slug)
  }, [category.slug, onMouseEnter])

  return (
    <div 
      className='flex flex-col items-center gap-1.5 flex-shrink-0 md:flex-row md:gap-0'
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className={`
        relative rounded-full transition-all duration-300
        ${isSelected && useDynamicCarousel ? 'ring-2 ring-bright-sun-400 scale-105 shadow-md' : 'scale-100'}
      `}>
        <Button
          data-testid={`category-pill-${category.slug}`}
          variant={isSelected ? 'default' : 'outline'}
          size='sm'
          className={`
            group transition-all duration-200 border-2
            flex items-center justify-center p-0
            w-14 h-14 sm:w-16 sm:h-16 rounded-full
            md:flex-row md:w-auto md:h-11 md:px-3.5 md:gap-1.5 md:rounded-full
            ${isSelected ? 'glass-category-pill-active' : 'glass-category-pill'}
            ${
              isSelected && useDynamicCarousel
                ? 'hover:bg-bright-sun-500 text-gray-900 border-bright-sun-600'
                : isSelected
                ? 'hover:bg-[#bd4811] text-[#fff4c6] border-[#eb6313]'
                : 'hover:shadow-lg text-gray-900'
            }
          `}
        >
          {category.image_url && (
            <div className={`
              flex items-center justify-center 
              w-9 h-9 sm:w-10 sm:h-10 md:w-10 md:h-10
              transition-transform duration-300 ease-out
              ${isSelected ? 'scale-125 -translate-y-1 md:scale-100 md:translate-y-0' : 'scale-100'}
            `}>
              <Image
                src={category.image_url}
                alt=''
                width={40}
                height={40}
                className='w-full h-full object-contain'
                loading='lazy'
              />
            </div>
          )}
          <span className={`hidden md:inline-block text-sm font-medium ml-1.5 ${isSelected ? '!text-white' : '!text-gray-900'}`}>
            {category.name}
          </span>
        </Button>
      </div>
      <span className='text-[9px] font-medium text-center leading-[1.1] text-white max-w-[85px] line-clamp-1 md:hidden truncate'>{category.name}</span>
    </div>
  )
})

CategoryPillItem.displayName = 'CategoryPillItem'

// ⚡ OPTIMIZACIÓN: Memoizar el componente principal para evitar rerenders innecesarios
const CategoryTogglePills: React.FC<CategoryTogglePillsProps> = React.memo(({
  onCategoryChange,
  selectedCategories,
  searchTerm,
  otherFilters = {},
  variant = 'default',
  useDynamicCarousel = false,
}) => {
  // Conectar con el contexto solo si useDynamicCarousel es true
  let contextSelectedCategory: string | null = null
  let contextToggleCategory: ((category: string) => void) | undefined
  
  try {
    if (useDynamicCarousel) {
      const context = useCategoryFilter()
      contextSelectedCategory = context.selectedCategory
      contextToggleCategory = context.toggleCategory
    }
  } catch (error) {
    // Solo log en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.warn('[CategoryPills] No se pudo acceder al contexto:', error)
    }
  }
  
  const selectedCategory = contextSelectedCategory
  const toggleCategory = contextToggleCategory

  // ⚡ OPTIMIZACIÓN: Memoizar baseFilters para evitar rerenders
  const baseFilters = useMemo(() => ({
    ...(searchTerm && { search: searchTerm }),
    ...otherFilters,
  }), [searchTerm, otherFilters])

  const { categories, loading, error, stats } = useCategoriesWithDynamicCounts({
    baseFilters,
    selectedCategories,
    enableDynamicCounts: false, // Deshabilitar conteos dinámicos para evitar errores de API
  })

  // Prefetch de productos al hacer hover sobre categorías
  const { handleMouseEnter: prefetchCategory, handleMouseLeave: stopPrefetchCategory } = usePrefetchOnHover({
    delay: 300,
  })

  // Prefetch de best sellers al hacer hover
  const { handleMouseEnter: prefetchBestSeller } = usePrefetchBestSellerOnHover({
    delay: 300,
  })

  // Referencia para el contenedor del carrusel
  const carouselRef = useRef<HTMLDivElement>(null)

  // Estados para el drag scroll
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  
  // Estado para controlar la animación inicial
  const [hasPlayedScrollHint, setHasPlayedScrollHint] = useState(false)
  const categoriesLoadedRef = useRef(false)

  // ⚡ OPTIMIZACIÓN: Manejador para scroll horizontal con rueda del mouse - solo se ejecuta una vez
  useEffect(() => {
    const carousel = carouselRef.current
    if (!carousel) {
      return
    }

    const handleWheel = (e: WheelEvent) => {
      // Solo aplicar scroll horizontal si hay contenido que se desborda
      if (carousel.scrollWidth > carousel.clientWidth) {
        e.preventDefault()
        // ⚡ OPTIMIZACIÓN: Usar requestAnimationFrame para mejor performance
        requestAnimationFrame(() => {
          carousel.scrollLeft += e.deltaY
        })
      }
    }

    carousel.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      carousel.removeEventListener('wheel', handleWheel)
    }
  }, []) // ⚡ FIX: Sin dependencia de categories para evitar múltiples registros

  // ⚡ OPTIMIZACIÓN: Animación de "peek" al montar - solo una vez cuando las categorías se cargan
  useEffect(() => {
    if (!carouselRef.current || hasPlayedScrollHint || variant === 'bare' || !categories.length || categoriesLoadedRef.current) return
    
    categoriesLoadedRef.current = true
    const carousel = carouselRef.current
    
    // Usar requestIdleCallback si está disponible para mejor performance
    const scheduleAnimation = (callback: () => void) => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(callback, { timeout: 1000 })
      } else {
        setTimeout(callback, 800)
      }
    }
    
    scheduleAnimation(() => {
      // Solo animar si hay contenido que se desborda o si hay suficientes categorías
      const hasOverflow = carousel.scrollWidth > carousel.clientWidth
      const hasEnoughCategories = categories.length > 4
      
      if (hasOverflow || hasEnoughCategories) {
        // Pequeño scroll a la derecha
        carousel.scrollTo({ left: 100, behavior: 'smooth' })
        
        // Volver a la posición inicial después de 800ms
        setTimeout(() => {
          carousel.scrollTo({ left: 0, behavior: 'smooth' })
          setHasPlayedScrollHint(true)
        }, 800)
      } else {
        setHasPlayedScrollHint(true)
      }
    })
  }, [categories.length, hasPlayedScrollHint, variant]) // ⚡ FIX: Solo depende de length, no del array completo

  // ⚡ OPTIMIZACIÓN: Manejadores memoizados para drag scroll
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const carousel = carouselRef.current
    if (!carousel) {
      return
    }

    setIsDragging(true)
    // ⚡ OPTIMIZACIÓN: Agrupar lecturas de geometría antes de cambios de estilo
    const offsetLeft = carousel.offsetLeft
    const scrollLeft = carousel.scrollLeft
    setStartX(e.pageX - offsetLeft)
    setScrollLeft(scrollLeft)
    // Cambiar estilo después de leer geometría
    requestAnimationFrame(() => {
      carousel.style.cursor = 'grabbing'
    })
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false)
    const carousel = carouselRef.current
    if (carousel) {
      carousel.style.cursor = 'grab'
    }
  }, [])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    const carousel = carouselRef.current
    if (carousel) {
      carousel.style.cursor = 'grab'
    }
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) {
      return
    }
    e.preventDefault()

    const carousel = carouselRef.current
    if (!carousel) {
      return
    }

    const x = e.pageX - carousel.offsetLeft
    const walk = (x - startX) * 2 // Multiplicador para velocidad de scroll
    // ⚡ OPTIMIZACIÓN: Usar requestAnimationFrame para scroll suave
    requestAnimationFrame(() => {
      carousel.scrollLeft = scrollLeft - walk
    })
  }, [isDragging, startX, scrollLeft])

  // ⚡ OPTIMIZACIÓN: Handler memoizado para toggle de categoría
  const handleCategoryToggle = useCallback((categorySlug: string) => {
    // Prevenir click si se está arrastrando
    if (isDragging) {
      return
    }

    // Si usamos el carrusel dinámico, actualizar el contexto
    if (useDynamicCarousel && toggleCategory) {
      // Solo log en desarrollo
      if (process.env.NODE_ENV === 'development') {
        console.log('[CategoryPills] Toggle category:', categorySlug, '- Actual:', selectedCategory)
      }
      toggleCategory(categorySlug)
      
      // Scroll suave al carrusel dinámico - usar requestAnimationFrame
      requestAnimationFrame(() => {
        setTimeout(() => {
          const carousel = document.getElementById('dynamic-carousel')
          if (carousel) {
            carousel.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        }, 100)
      })
    } else {
      // Comportamiento original para filtros de productos
      const isSelected = selectedCategories.includes(categorySlug)
      
      if (isSelected) {
        // Si ya está seleccionada, deseleccionar (vaciar array)
        onCategoryChange([])
      } else {
        // Seleccionar nueva categoría (reemplazar array con solo esta)
        onCategoryChange([categorySlug])
      }
    }
  }, [isDragging, useDynamicCarousel, toggleCategory, selectedCategory, selectedCategories, onCategoryChange])

  // ⚡ OPTIMIZACIÓN: Handler memoizado para prefetch
  const handleMouseEnterCategory = useCallback((slug: string) => {
    prefetchCategory(slug, 12)
    prefetchBestSeller(slug)
  }, [prefetchCategory, prefetchBestSeller])

  // ⚡ OPTIMIZACIÓN: Función memoizada para scroll con botones de navegación
  const scroll = useCallback((direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = 300
      requestAnimationFrame(() => {
        if (carouselRef.current) {
          carouselRef.current.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth',
          })
        }
      })
    }
  }, [])


  if (loading) {
    if (variant === 'bare') return null
    return (
      <section className='bg-transparent'>
        <div className='max-w-7xl mx-auto px-3 sm:px-4 lg:px-8'>
          <div className='flex items-start gap-3 sm:gap-4 md:gap-3 overflow-x-auto pb-2'>
            {[...Array(8)].map((_, index) => (
              <div key={index} className='flex-shrink-0 animate-pulse flex flex-col items-center gap-1.5'>
                <div className='h-14 w-14 sm:h-16 sm:w-16 md:h-10 md:w-24 bg-gray-200 rounded-full'></div>
                <div className='h-3 w-12 bg-gray-200 rounded md:hidden'></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (error || categories.length === 0) {
    return null // No mostrar nada si hay error o no hay categorías
  }

  // ⚡ OPTIMIZACIÓN: Memoizar el cálculo de categorías seleccionadas
  const selectedCategoriesSet = useMemo(() => new Set(selectedCategories), [selectedCategories])

  // ⚡ OPTIMIZACIÓN: Memoizar las categorías renderizadas
  const renderedCategories = useMemo(() => {
    return categories.map(category => {
      const isSelected = useDynamicCarousel 
        ? selectedCategory === category.slug 
        : selectedCategoriesSet.has(category.slug)
      
      return {
        category,
        isSelected,
      }
    })
  }, [categories, selectedCategory, useDynamicCarousel, selectedCategoriesSet])

  // Variante bare: solo las pills sin sección ni degradados ni márgenes
  if (variant === 'bare') {
    return (
      <div
        ref={carouselRef}
        className='flex items-start gap-3 sm:gap-4 md:gap-2 overflow-x-auto flex-nowrap py-1 px-4 md:px-6 cursor-grab select-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden w-full'
        style={{
          willChange: 'scroll-position',
          transform: 'translateZ(0)', // GPU acceleration
          WebkitOverflowScrolling: 'touch', // Smooth scrolling en iOS
        }}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
      >
        {renderedCategories.map(({ category, isSelected }) => (
          <CategoryPillItem
            key={category.id}
            category={category}
            isSelected={isSelected}
            useDynamicCarousel={useDynamicCarousel}
            onToggle={handleCategoryToggle}
            onMouseEnter={handleMouseEnterCategory}
            onMouseLeave={stopPrefetchCategory}
          />
        ))}
      </div>
    )
  }

  return (
    <section className='bg-transparent sticky top-[92px] lg:top-[105px] z-40 py-0 w-full overflow-hidden'>
      <div className='relative w-full'>
        {/* Contenedor para los botones que se extiende hasta los bordes */}
        <div className='absolute inset-0 pointer-events-none z-20'>
          {/* Flecha izquierda - Más pequeño y en el borde izquierdo */}
          <button
            onClick={() => scroll('left')}
            className='absolute left-0 z-20 w-6 h-10 md:w-8 md:h-12 bg-white hover:bg-gray-50 shadow-lg transition-all duration-200 flex items-center justify-center rounded-r-full border border-l-0 border-gray-200 pointer-events-auto top-1/2 -translate-y-1/2'
            aria-label='Anterior'
          >
            <ChevronLeft className='w-3 h-3 md:w-4 md:h-4 text-gray-600' />
          </button>

          {/* Flecha derecha - Más pequeño y en el borde derecho */}
          <button
            onClick={() => scroll('right')}
            className='absolute right-0 z-20 w-6 h-10 md:w-8 md:h-12 bg-white hover:bg-gray-50 shadow-lg transition-all duration-200 flex items-center justify-center rounded-l-full border border-r-0 border-gray-200 pointer-events-auto top-1/2 -translate-y-1/2'
            aria-label='Siguiente'
          >
            <ChevronRight className='w-3 h-3 md:w-4 md:h-4 text-gray-600' />
          </button>
        </div>

        {/* Pills de categorías - Full width, centradas cuando son pocas en desktop */}
        {/* ⚡ OPTIMIZACIÓN: GPU acceleration para scroll fluido a 60fps */}
        <div
          ref={carouselRef}
          className='flex items-start gap-3 sm:gap-4 md:gap-2 overflow-x-auto py-1 px-4 md:px-6 cursor-grab select-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden w-full md:justify-center'
          style={{
            willChange: 'scroll-position',
            transform: 'translateZ(0)', // GPU acceleration
            WebkitOverflowScrolling: 'touch', // Smooth scrolling en iOS
          }}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          data-testid='category-pills-container'
        >
          {renderedCategories.map(({ category, isSelected }) => (
            <CategoryPillItem
              key={category.id}
              category={category}
              isSelected={isSelected}
              useDynamicCarousel={useDynamicCarousel}
              onToggle={handleCategoryToggle}
              onMouseEnter={handleMouseEnterCategory}
              onMouseLeave={stopPrefetchCategory}
            />
          ))}
        </div>
      </div>
    </section>
  )
})

CategoryTogglePills.displayName = 'CategoryTogglePills'

export default CategoryTogglePills
