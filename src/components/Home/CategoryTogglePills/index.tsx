'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useCategoriesWithDynamicCounts } from '@/hooks/useCategoriesWithDynamicCounts'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Image from 'next/image'

interface CategoryTogglePillsProps {
  onCategoryChange: (selectedCategories: string[]) => void
  selectedCategories: string[]
  searchTerm?: string
  otherFilters?: any
  variant?: 'default' | 'bare'
}

const CategoryTogglePills: React.FC<CategoryTogglePillsProps> = ({
  onCategoryChange,
  selectedCategories,
  searchTerm,
  otherFilters = {},
  variant = 'default',
}) => {
  const { categories, loading, error, stats } = useCategoriesWithDynamicCounts({
    baseFilters: {
      ...(searchTerm && { search: searchTerm }),
      ...otherFilters,
    },
    selectedCategories,
    enableDynamicCounts: false, // Deshabilitar conteos dinámicos para evitar errores de API
  })

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

    const isSelected = selectedCategories.includes(categorySlug)
    
    if (isSelected) {
      // Si ya está seleccionada, deseleccionar (vaciar array)
      onCategoryChange([])
    } else {
      // Seleccionar nueva categoría (reemplazar array con solo esta)
      onCategoryChange([categorySlug])
    }
  }


  if (loading) {
    if (variant === 'bare') return null
    return (
      <section className='bg-white border-b border-gray-200 py-2'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
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

  // Variante bare: solo las pills sin sección ni degradados
  if (variant === 'bare') {
    return (
      <div
        ref={carouselRef}
        className='flex items-start gap-3 sm:gap-4 md:gap-2 overflow-x-auto flex-nowrap py-1 cursor-grab select-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
      >
        {categories.map(category => {
          const isSelected = selectedCategories.includes(category.slug)
          return (
            <div 
              key={category.id}
              className='flex flex-col items-center gap-1.5 flex-shrink-0 md:flex-row md:gap-0'
              onClick={() => handleCategoryToggle(category.slug)}
            >
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
                    isSelected
                      ? 'bg-[#eb6313] hover:bg-[#bd4811] text-[#fff4c6] border-[#eb6313]'
                      : 'bg-[#007639] hover:bg-[#009e44] hover:border-[#eb6313] text-[#fff4c6] border-[#007639]'
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
                <span className='hidden md:inline-block text-sm font-medium ml-1.5 text-[#fff4c6]'>{category.name}</span>
              </Button>
              <span className='text-[10px] font-medium text-center leading-[1.1] text-gray-700 max-w-[64px] line-clamp-2 md:hidden'>{category.name}</span>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <section className='bg-white border-b border-gray-200 py-1 sticky top-[110px] lg:top-[120px] z-40'>
      <div
        className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'
        data-testid='category-pills-container'
      >
        {/* Contenedor con degradados en los bordes */}
        <div className='relative'>
          {/* Degradado izquierdo */}
          <div className='absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none'></div>

          {/* Degradado derecho */}
          <div className='absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none'></div>

          {/* Pills de categorías */}
          <div
            ref={carouselRef}
            className='flex items-start gap-3 sm:gap-4 md:gap-2 overflow-x-auto py-1 cursor-grab select-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
          >
            {categories.map(category => {
              const isSelected = selectedCategories.includes(category.slug)

              return (
                <div 
                  key={category.id}
                  className='flex flex-col items-center gap-1.5 flex-shrink-0 md:flex-row md:gap-0'
                  onClick={() => handleCategoryToggle(category.slug)}
                >
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
                        isSelected
                          ? 'bg-[#eb6313] hover:bg-[#bd4811] text-[#fff4c6] border-[#eb6313]'
                          : 'bg-[#007639] hover:bg-[#009e44] hover:border-[#eb6313] text-[#fff4c6] border-[#007639]'
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
                    <span className='hidden md:inline-block text-sm font-medium ml-1.5 text-[#fff4c6]'>{category.name}</span>
                  </Button>
                  <span className='text-[10px] font-medium text-center leading-[1.1] text-gray-700 max-w-[64px] line-clamp-2 md:hidden'>{category.name}</span>
                </div>
              )
            })}
          </div>

        </div>
      </div>
    </section>
  )
}

export default CategoryTogglePills
