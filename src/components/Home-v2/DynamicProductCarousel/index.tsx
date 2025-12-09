'use client'

import React, { useRef } from 'react'
import Image from 'next/image'
import ProductItem from '@/components/Common/ProductItem'
import { useCategoryFilter } from '@/contexts/CategoryFilterContext'
import { useProductsByCategory } from '@/hooks/useProductsByCategory'
import { ChevronLeft, ChevronRight } from '@/lib/optimized-imports'
import { useCategoriesWithDynamicCounts } from '@/hooks/useCategoriesWithDynamicCounts'
import { ProductSkeletonCarousel } from '@/components/ui/product-skeleton'

interface DynamicProductCarouselProps {
  maxProducts?: number
  freeShippingOnly?: boolean
}

const DynamicProductCarousel: React.FC<DynamicProductCarouselProps> = ({
  maxProducts = 12,
  freeShippingOnly = false,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const { selectedCategory, categoryConfig: contextCategoryConfig } = useCategoryFilter()
  
  // Obtener categorías reales de la BD para obtener los iconos
  const { categories } = useCategoriesWithDynamicCounts({
    enableDynamicCounts: false,
  })
  
  // Configuración para modo Envío Gratis
  const freeShippingConfig = {
    title: 'Envío Gratis',
    subtitle: 'Productos seleccionados con envío sin costo',
    iconUrl: '/images/icons/icon-envio.svg',
    textColor: 'text-green-700',
  }
  
  // Usar configuración de envío gratis si el modo está activo, sino usar la del contexto
  const categoryConfig = freeShippingOnly ? freeShippingConfig : contextCategoryConfig
  
  // Encontrar la categoría actual para obtener su icono real (solo si no es envío gratis)
  const currentCategory = !freeShippingOnly && selectedCategory 
    ? categories.find(cat => cat.slug === selectedCategory)
    : null
  
  // Icono: usar el de la categoría real si existe, sino el del config
  const categoryIcon = currentCategory?.image_url || categoryConfig.iconUrl
  
  // Fetch productos - Si freeShippingOnly es true, pasar null como categorySlug
  const { products: rawProducts, isLoading, error } = useProductsByCategory({
    categorySlug: freeShippingOnly ? null : selectedCategory,
    limit: maxProducts,
  })

  // Los productos ya vienen adaptados del hook, no necesitamos adaptarlos nuevamente
  const products = Array.isArray(rawProducts) ? rawProducts : []
  
  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <section className='py-4 bg-white category-transition overflow-hidden'>
        <div className='max-w-7xl mx-auto px-4 overflow-hidden'>
          <div className='animate-pulse mb-3'>
            <div className='flex items-center gap-3'>
              <div className='w-[68px] h-[68px] md:w-[84px] md:h-[84px] bg-gray-200 rounded-full'></div>
              <div>
                <div className='h-6 md:h-7 bg-gray-200 rounded w-48 mb-1'></div>
                <div className='h-3 md:h-4 bg-gray-200 rounded w-32'></div>
              </div>
            </div>
          </div>
          <ProductSkeletonCarousel count={5} />
        </div>
      </section>
    )
  }

  // Error state
  if (error) {
    return null
  }

  // No products - no mostrar nada
  if (products.length === 0) {
    return null
  }

  return (
    <section
      id={freeShippingOnly ? 'envio-gratis-carousel' : 'dynamic-carousel'}
      className={`py-4 bg-gradient-to-br ${categoryConfig.bgGradient} scroll-mt-20 category-transition`}
    >
      <div className='max-w-7xl mx-auto px-4 sm:px-4 lg:px-8'>
        {/* Header Dinámico - 2 líneas máximo */}
        <div className='flex items-center justify-between mb-3'>
          <div className='flex items-center gap-3'>
            {/* Icono - Más grande para envío gratis */}
            <div className={`relative flex-shrink-0 flex items-center justify-center ${
              freeShippingOnly 
                ? 'w-[100px] h-[40px] md:w-[120px] md:h-[48px]' 
                : 'w-[68px] h-[68px] md:w-[84px] md:h-[84px]'
            }`}>
              <Image
                src={categoryIcon}
                alt={categoryConfig.title}
                width={84}
                height={84}
                className='w-full h-full object-contain'
                loading={freeShippingOnly ? 'lazy' : 'eager'}
                priority={!freeShippingOnly}
              />
            </div>
            
            <div className='flex flex-col justify-center' style={{maxHeight: '3.5rem'}}>
              <h2 className={`text-xl md:text-2xl font-bold ${categoryConfig.textColor || 'text-gray-900 dark:text-bright-sun-300'} leading-tight line-clamp-1`}>
                {categoryConfig.title}
              </h2>
              <p className='text-xs md:text-sm text-gray-600 dark:text-bright-sun-200 leading-tight line-clamp-1'>
                {categoryConfig.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Carrusel Horizontal de productos - ancho igual que grid */}
        <div className='relative'>
          {/* Controles de navegación - A los costados del carrusel, mitad y mitad */}
          <button
            onClick={() => scroll('left')}
            className='hidden md:flex absolute -left-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center hover:border-gray-400 transition-colors shadow-lg'
            aria-label='Anterior'
          >
            <ChevronLeft className='w-5 h-5' />
          </button>
          <button
            onClick={() => scroll('right')}
            className='hidden md:flex absolute -right-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center hover:border-gray-400 transition-colors shadow-lg'
            aria-label='Siguiente'
          >
            <ChevronRight className='w-5 h-5' />
          </button>

          <div
            ref={scrollRef}
            className='flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4'
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {products.map((product, idx) => (
              <div key={idx} className='min-w-[calc(50%-0.5rem)] md:min-w-[calc(25%-1.125rem)] flex-shrink-0'>
                <ProductItem product={product} />
              </div>
            ))}
          </div>

          {/* Fade edges */}
          <div className='absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none'></div>
          <div className='absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none'></div>
        </div>
      </div>
    </section>
  )
}

export default DynamicProductCarousel

