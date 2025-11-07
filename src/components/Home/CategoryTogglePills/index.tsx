'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useCategoriesWithDynamicCounts } from '@/hooks/useCategoriesWithDynamicCounts'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Image from 'next/image'
import { useCategoryFilter } from '@/contexts/CategoryFilterContext'

interface CategoryTogglePillsProps {
  onCategoryChange: (selectedCategories: string[]) => void
  selectedCategories: string[]
  searchTerm?: string
  otherFilters?: any
  variant?: 'default' | 'bare'
  useDynamicCarousel?: boolean // Nueva prop para indicar si debe usar el contexto de carrusel dinámico
}

const CategoryTogglePills: React.FC<CategoryTogglePillsProps> = ({
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
    console.warn('[CategoryPills] No se pudo acceder al contexto:', error)
  }
  
  const selectedCategory = contextSelectedCategory
  const toggleCategory = contextToggleCategory

  const { categories, loading, error, stats } = useCategoriesWithDynamicCounts({
    baseFilters: {
      ...(searchTerm && { search: searchTerm }),
      ...otherFilters,
    },
    selectedCategories,
    enableDynamicCounts: false, // Deshabilitar conteos dinámicos para evitar errores de API
  })
  
  // Debug: Log de categorías para verificar image_url
  useEffect(() => {
    if (categories.length > 0) {
      console.log('[CategoryPills] Categorías cargadas:', categories.map(c => ({
        name: c.name,
        slug: c.slug,
        hasImage: !!c.image_url,
        image_url: c.image_url
      })))
    }
  }, [categories])
  
  // Debug: Log de categoría seleccionada
  useEffect(() => {
    if (useDynamicCarousel) {
      console.log('[CategoryPills] Estado del contexto:', {
        useDynamicCarousel,
        selectedCategory,
        hasToggleFunction: !!toggleCategory
      })
    }
  }, [selectedCategory, useDynamicCarousel, toggleCategory])

  // Referencia para el contenedor del carrusel
  const carouselRef = useRef<HTMLDivElement>(null)

  // Estados para el drag scroll
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  
  // Estado para controlar la animación inicial
  const [hasPlayedScrollHint, setHasPlayedScrollHint] = useState(false)

  // Manejador para scroll horizontal con rueda del mouse
  useEffect(() => {
    const carousel = carouselRef.current
    if (!carousel) {
      return
    }

    const handleWheel = (e: WheelEvent) => {
      // Solo aplicar scroll horizontal si hay contenido que se desborda
      if (carousel.scrollWidth > carousel.clientWidth) {
        e.preventDefault()
        carousel.scrollLeft += e.deltaY
      }
    }

    carousel.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      carousel.removeEventListener('wheel', handleWheel)
    }
  }, [categories])

  // Animación de "peek" al montar el componente
  useEffect(() => {
    if (!carouselRef.current || hasPlayedScrollHint || variant === 'bare') return
    
    const carousel = carouselRef.current
    
    // Función para verificar y ejecutar la animación
    const executeAnimation = () => {
      // Solo animar si hay contenido que se desborda o si hay suficientes categorías
      const hasOverflow = carousel.scrollWidth > carousel.clientWidth
      const hasEnoughCategories = categories.length > 4 // Si hay más de 4 categorías, probablemente necesite scroll
      
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
    }
    
    // Esperar a que las categorías se carguen completamente
    const timer = setTimeout(executeAnimation, 800)
    
    return () => clearTimeout(timer)
  }, [hasPlayedScrollHint, variant])

  // Manejadores para drag scroll
  const handleMouseDown = (e: React.MouseEvent) => {
    const carousel = carouselRef.current
    if (!carousel) {
      return
    }

    setIsDragging(true)
    setStartX(e.pageX - carousel.offsetLeft)
    setScrollLeft(carousel.scrollLeft)
    carousel.style.cursor = 'grabbing'
  }

  const handleMouseLeave = () => {
    setIsDragging(false)
    const carousel = carouselRef.current
    if (carousel) {
      carousel.style.cursor = 'grab'
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    const carousel = carouselRef.current
    if (carousel) {
      carousel.style.cursor = 'grab'
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
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
    carousel.scrollLeft = scrollLeft - walk
  }

  const handleCategoryToggle = (categorySlug: string) => {
    // Prevenir click si se está arrastrando
    if (isDragging) {
      return
    }

    // Si usamos el carrusel dinámico, actualizar el contexto
    if (useDynamicCarousel && toggleCategory) {
      console.log('[CategoryPills] Toggle category:', categorySlug, '- Actual:', selectedCategory)
      toggleCategory(categorySlug)
      
      // Scroll suave al carrusel dinámico
      setTimeout(() => {
        const carousel = document.getElementById('dynamic-carousel')
        if (carousel) {
          carousel.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100)
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
  }


  if (loading) {
    if (variant === 'bare') return null
    return (
      <section className='bg-transparent'>
        <div className='w-full px-3 sm:px-4'>
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

  // Variante bare: solo las pills sin sección ni degradados ni márgenes
  if (variant === 'bare') {
    return (
      <div
        ref={carouselRef}
        className='flex items-start gap-3 sm:gap-4 md:gap-2 overflow-x-auto flex-nowrap py-1 px-3 sm:px-4 cursor-grab select-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
      >
        {categories.map(category => {
          // Determinar si está seleccionada según el modo (contexto o props)
          const isSelected = useDynamicCarousel 
            ? selectedCategory === category.slug 
            : selectedCategories.includes(category.slug)
          
          // Debug individual por categoría
          if (useDynamicCarousel && category.slug === selectedCategory) {
            console.log(`[CategoryPills] Pill "${category.name}" debería estar seleccionada:`, {
              categorySlug: category.slug,
              selectedCategory,
              isSelected,
              shouldHighlight: isSelected && useDynamicCarousel
            })
          }
          
          return (
            <div 
              key={category.id}
              className='flex flex-col items-center gap-1.5 flex-shrink-0 md:flex-row md:gap-0'
              onClick={() => handleCategoryToggle(category.slug)}
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
                    ${
                      isSelected && useDynamicCarousel
                        ? 'bg-bright-sun-400 hover:bg-bright-sun-500 text-gray-900 border-bright-sun-600 shadow-lg'
                        : isSelected
                        ? 'bg-[#eb6313] hover:bg-[#bd4811] text-[#fff4c6] border-[#eb6313] shadow-md'
                        : 'bg-white hover:bg-gray-50 hover:shadow-lg text-gray-700 border-gray-200 shadow-sm'
                    }
                  `}
                >
                {category.image_url && (
                  <div className={`
                    flex items-center justify-center 
                    w-7 h-7 sm:w-8 sm:h-8 md:w-8 md:h-8
                    transition-transform duration-300 ease-out
                    ${isSelected ? 'scale-125 -translate-y-1 md:scale-100 md:translate-y-0' : 'scale-100'}
                  `}>
                    <Image
                      src={category.image_url}
                      alt=''
                      width={32}
                      height={32}
                      className='w-full h-full object-contain'
                    />
                  </div>
                )}
                <span className={`hidden md:inline-block text-sm font-medium ml-1.5 ${isSelected ? '!text-white' : '!text-gray-900'}`}>
                  {category.name}
                </span>
              </Button>
              </div>
              <span className='text-[9px] font-medium text-center leading-[1.1] text-gray-700 max-w-[85px] line-clamp-1 md:hidden truncate'>{category.name}</span>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <section className='bg-transparent sticky top-[92px] lg:top-[105px] z-40'>
      <div
        className='w-full px-3 sm:px-4'
        data-testid='category-pills-container'
      >
        {/* Pills de categorías - Full width sin degradados */}
        <div
          ref={carouselRef}
          className='flex items-start gap-3 sm:gap-4 md:gap-2 overflow-x-auto py-1 cursor-grab select-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
        >
            {categories.map(category => {
              // Determinar si está seleccionada según el modo (contexto o props)
              const isSelected = useDynamicCarousel 
                ? selectedCategory === category.slug 
                : selectedCategories.includes(category.slug)

              return (
                <div 
                  key={category.id}
                  className='flex flex-col items-center gap-1.5 flex-shrink-0 md:flex-row md:gap-0'
                  onClick={() => handleCategoryToggle(category.slug)}
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
                      ${
                        isSelected && useDynamicCarousel
                          ? 'bg-bright-sun-400 hover:bg-bright-sun-500 text-gray-900 border-bright-sun-600 shadow-lg'
                          : isSelected
                          ? 'bg-[#eb6313] hover:bg-[#bd4811] text-[#fff4c6] border-[#eb6313] shadow-md'
                          : 'bg-white hover:bg-gray-50 hover:shadow-lg text-gray-700 border-gray-200 shadow-sm'
                      }
                    `}
                  >
                {category.image_url && (
                  <div className={`
                    flex items-center justify-center 
                    w-7 h-7 sm:w-8 sm:h-8 md:w-8 md:h-8
                    transition-transform duration-300 ease-out
                    ${isSelected ? 'scale-125 -translate-y-1 md:scale-100 md:translate-y-0' : 'scale-100'}
                  `}>
                    <Image
                      src={category.image_url}
                      alt=''
                      width={32}
                      height={32}
                      className='w-full h-full object-contain'
                    />
                  </div>
                )}
                <span className={`hidden md:inline-block text-sm font-medium ml-1.5 ${isSelected ? '!text-white' : '!text-gray-900'}`}>
                  {category.name}
                </span>
              </Button>
              </div>
              <span className='text-[9px] font-medium text-center leading-[1.1] text-gray-700 max-w-[85px] line-clamp-1 md:hidden truncate'>{category.name}</span>
            </div>
              )
            })}
        </div>
      </div>
    </section>
  )
}

export default CategoryTogglePills
