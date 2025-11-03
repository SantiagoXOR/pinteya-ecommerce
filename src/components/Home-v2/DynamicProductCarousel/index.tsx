'use client'

import React, { useRef } from 'react'
import Image from 'next/image'
import ProductItem from '@/components/Common/ProductItem'
import { useCategoryFilter } from '@/contexts/CategoryFilterContext'
import { useProductsByCategory } from '@/hooks/useProductsByCategory'
import { adaptApiProductsToComponents } from '@/lib/adapters/product-adapter'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCategoriesWithDynamicCounts } from '@/hooks/useCategoriesWithDynamicCounts'

interface DynamicProductCarouselProps {
  maxProducts?: number
}

const DynamicProductCarousel: React.FC<DynamicProductCarouselProps> = ({
  maxProducts = 12,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const { selectedCategory, categoryConfig } = useCategoryFilter()
  
  // Obtener categorías reales de la BD para obtener los iconos
  const { categories } = useCategoriesWithDynamicCounts({
    enableDynamicCounts: false,
  })
  
  // Encontrar la categoría actual para obtener su icono real
  const currentCategory = selectedCategory 
    ? categories.find(cat => cat.slug === selectedCategory)
    : null
  
  // Icono: usar el de la categoría real si existe, sino el del config
  const categoryIcon = currentCategory?.image_url || categoryConfig.iconUrl
  
  console.log('[DynamicCarousel] Debug:', {
    selectedCategory,
    currentCategory: currentCategory?.name,
    categoryIcon,
    allCategories: categories.map(c => ({ slug: c.slug, hasIcon: !!c.image_url }))
  })
  
  // Fetch productos según categoría
  const { products: rawProducts, isLoading, error } = useProductsByCategory({
    categorySlug: selectedCategory,
    limit: maxProducts,
  })

  // Adaptar productos al formato de componentes
  // Asegurarse de que rawProducts sea un array
  const products = Array.isArray(rawProducts) 
    ? adaptApiProductsToComponents(rawProducts)
    : []
  
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
      <section className='py-3 bg-white category-transition'>
        <div className='max-w-7xl mx-auto px-4'>
          <div className='animate-pulse'>
            <div className='flex items-center gap-4 mb-4'>
              <div className='w-20 h-20 bg-gray-200 rounded-full'></div>
              <div>
                <div className='h-8 bg-gray-200 rounded w-64 mb-2'></div>
                <div className='h-4 bg-gray-200 rounded w-48'></div>
              </div>
            </div>
            <div className='flex gap-4 overflow-hidden'>
              {[...Array(5)].map((_, i) => (
                <div key={i} className='min-w-[250px] h-80 bg-gray-200 rounded-lg'></div>
              ))}
            </div>
          </div>
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
      id='dynamic-carousel'
      className={`py-8 bg-gradient-to-br ${categoryConfig.bgGradient} scroll-mt-20 category-transition`}
    >
      <div className='max-w-7xl mx-auto px-4'>
        {/* Header Dinámico */}
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center gap-3'>
            {/* Icono con imagen de la categoría real de la BD */}
            <div className='relative w-16 h-16 md:w-20 md:h-20 flex-shrink-0'>
              <Image
                src={categoryIcon}
                alt={categoryConfig.title}
                width={80}
                height={80}
                className='w-full h-full object-contain'
                unoptimized={categoryIcon.includes('.svg')}
              />
            </div>
            
            <div>
              <h2 className={`text-2xl md:text-3xl font-bold ${categoryConfig.textColor || 'text-gray-900'} leading-tight`}>
                {categoryConfig.title}
              </h2>
              <p className='text-sm text-gray-600'>
                {categoryConfig.subtitle}
              </p>
            </div>
          </div>

          {/* Controles de navegación */}
          <div className='hidden md:flex gap-2'>
            <button
              onClick={() => scroll('left')}
              className='w-10 h-10 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center hover:border-gray-400 transition-colors'
              aria-label='Anterior'
            >
              <ChevronLeft className='w-5 h-5' />
            </button>
            <button
              onClick={() => scroll('right')}
              className='w-10 h-10 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center hover:border-gray-400 transition-colors'
              aria-label='Siguiente'
            >
              <ChevronRight className='w-5 h-5' />
            </button>
          </div>
        </div>

        {/* Carrusel Horizontal de productos - ancho igual que grid */}
        <div className='relative'>
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

