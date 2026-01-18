'use client'

import React, { useRef } from 'react'
import Image from 'next/image'
import ProductItem from '@/components/Common/ProductItem'
import { useCategoryFilter } from '@/contexts/CategoryFilterContext'
import { useProductsByCategory } from '@/hooks/useProductsByCategory'
import { useFilteredProducts } from '@/hooks/useFilteredProducts'
import { adaptApiProductsToComponents } from '@/lib/adapters/product-adapter'
import { ChevronLeft, ChevronRight } from '@/lib/optimized-imports'
import { useCategoriesWithDynamicCounts } from '@/hooks/useCategoriesWithDynamicCounts'
import { DynamicCarouselSkeleton } from '@/components/ui/skeletons'
import { updateProductWithMostExpensiveVariant } from '@/lib/products/utils/variant-utils'
import { FREE_SHIPPING_THRESHOLD } from '@/lib/products/constants'
import { getCategoryImage } from '@/lib/categories/adapters'

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
  const categoryIcon = currentCategory ? getCategoryImage(currentCategory) : categoryConfig.iconUrl
  
  // ⚡ OPTIMIZACIÓN: Si freeShippingOnly es true, usar useFilteredProducts para compartir cache con FreeShippingSection
  // Esto evita peticiones duplicadas a /api/products con los mismos filtros
  // ✅ FIX: Aumentar límite a 100 para obtener más productos y luego filtrar por variantes
  const freeShippingQuery = useFilteredProducts({
    limit: 100, // ✅ FIX: Aumentar para obtener más productos y filtrar los que tienen variantes con envío gratis
    sortBy: 'price',
    sortOrder: 'desc',
  })
  
  // Fetch productos - Si freeShippingOnly es true, usar useFilteredProducts; sino usar useProductsByCategory
  const categoryQuery = useProductsByCategory({
    categorySlug: selectedCategory,
    limit: maxProducts,
  })
  
  // Seleccionar el hook apropiado según el modo
  const isLoading = freeShippingOnly ? freeShippingQuery.isLoading : categoryQuery.isLoading
  const error = freeShippingOnly ? freeShippingQuery.error : categoryQuery.error

  // Adaptar productos según el hook usado
  let products: any[] = []
  if (freeShippingOnly) {
    // Usar productos de useFilteredProducts y adaptarlos
    // ⚡ FIX: freeShippingQuery.data puede ser PaginatedResponse (data.data) o array directamente
    // Manejar ambos casos: si es array, usarlo directamente; si es objeto, usar data.data
    let rawProducts: any[] = []
    if (Array.isArray(freeShippingQuery.data)) {
      rawProducts = freeShippingQuery.data
    } else if (freeShippingQuery.data?.data) {
      rawProducts = Array.isArray(freeShippingQuery.data.data) ? freeShippingQuery.data.data : []
    }
    
    const adaptedProducts = adaptApiProductsToComponents(rawProducts)
    
    // ✅ FIX: Filtrar productos que tengan AL MENOS UNA variante con precio >= $50.000
    // Primero verificar si el producto califica (tiene variantes con envío gratis)
    const productsWithFreeShippingVariants = adaptedProducts.filter(p => {
      // Si el producto tiene variantes, verificar si alguna califica para envío gratis
      if (p.variants && Array.isArray(p.variants) && p.variants.length > 0) {
        // Verificar si alguna variante tiene precio >= $50.000
        const hasFreeShippingVariant = p.variants.some((v: any) => {
          const variantPrice = Number(v.price_sale) || Number(v.price_list) || 0
          return variantPrice >= FREE_SHIPPING_THRESHOLD
        })
        return hasFreeShippingVariant
      }
      
      // Si no tiene variantes, verificar el precio del producto base
      const price = Number(p.price) || 0
      const discountedPrice = Number(p.discountedPrice) || price
      const finalPrice = discountedPrice > 0 ? discountedPrice : price
      return finalPrice >= FREE_SHIPPING_THRESHOLD
    })
    
    // ✅ DEBUG: Log para verificar cuántos productos califican
    if (process.env.NODE_ENV === 'development') {
      console.log('[FreeShippingCarousel] Productos calificados:', {
        totalAdapted: adaptedProducts.length,
        withFreeShipping: productsWithFreeShippingVariants.length,
        threshold: FREE_SHIPPING_THRESHOLD
      })
    }
    
    // ⚡ PASO 2: Actualizar cada producto calificado con su variante más costosa
    // Esto asegura que se muestre el precio más alto (que califica para envío gratis)
    const productsWithMostExpensiveVariants = productsWithFreeShippingVariants.map(updateProductWithMostExpensiveVariant)
    
    // ⚡ PASO 3: Ordenar por precio descendente y limitar
    products = productsWithMostExpensiveVariants
      .sort((a, b) => {
        const priceA = Number(b.discountedPrice) || Number(b.price) || 0
        const priceB = Number(a.discountedPrice) || Number(a.price) || 0
        return priceA - priceB
      })
      .slice(0, maxProducts) // Limitar según maxProducts
  } else {
    // Los productos ya vienen adaptados del hook useProductsByCategory
    products = Array.isArray(categoryQuery.products) ? categoryQuery.products : []
  }
  
  // ⚡ OPTIMIZACIÓN: Scroll con requestAnimationFrame para 60fps
  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth',
          })
        }
      })
    }
  }

  // Loading state
  if (isLoading) {
    return <DynamicCarouselSkeleton />
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
      className={`${freeShippingOnly ? 'pt-4 pb-4' : 'py-4'} bg-gradient-to-br ${categoryConfig.bgGradient} scroll-mt-20 category-transition`}
    >
      <div className='max-w-7xl mx-auto px-8 sm:px-4 lg:px-8'>
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
              <h2 className={`text-xl md:text-2xl font-medium ${categoryConfig.textColor || 'text-white'} leading-tight line-clamp-1`} style={freeShippingOnly ? { color: 'rgba(242, 122, 29, 1)' } : {}}>
                {categoryConfig.title}
              </h2>
              <p className={`text-xs md:text-sm leading-tight line-clamp-1 ${freeShippingOnly ? 'text-white' : 'text-white/70'}`}>
                {categoryConfig.subtitle}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Carrusel Horizontal de productos - full width en mobile */}
      <div className='relative -mx-4 sm:mx-0 sm:px-4 lg:px-8'>
          {/* Contenedor para los botones que se extiende hasta los bordes */}
          <div className='absolute inset-0 pointer-events-none z-20'>
            {/* Flecha izquierda - Centrada verticalmente, al lado izquierdo */}
            <button
              onClick={() => scroll('left')}
              className='hidden md:flex absolute left-0 z-20 w-6 h-10 md:w-8 md:h-12 bg-white hover:bg-gray-50 shadow-lg transition-all duration-200 flex items-center justify-center rounded-r-full border border-l-0 border-gray-200 pointer-events-auto top-1/2 -translate-y-1/2'
              aria-label='Anterior'
            >
              <ChevronLeft className='w-3 h-3 md:w-4 md:h-4 text-gray-600' />
            </button>

            {/* Flecha derecha - Centrada verticalmente, al lado derecho */}
            <button
              onClick={() => scroll('right')}
              className='hidden md:flex absolute right-0 z-20 w-6 h-10 md:w-8 md:h-12 bg-white hover:bg-gray-50 shadow-lg transition-all duration-200 flex items-center justify-center rounded-l-full border border-r-0 border-gray-200 pointer-events-auto top-1/2 -translate-y-1/2'
              aria-label='Siguiente'
            >
              <ChevronRight className='w-3 h-3 md:w-4 md:h-4 text-gray-600' />
            </button>
          </div>

          {/* ⚡ OPTIMIZACIÓN: GPU acceleration para scroll fluido a 60fps */}
          <div
            ref={scrollRef}
            className='flex items-stretch gap-2 pl-4 sm:pl-0 sm:gap-4 md:gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4 pr-4 sm:pr-0'
            style={{ 
              scrollbarWidth: 'none', 
              msOverflowStyle: 'none',
              willChange: 'scroll-position',
              transform: 'translateZ(0)', // GPU acceleration
              WebkitOverflowScrolling: 'touch', // Smooth scrolling en iOS
            }}
          >
            {products.map((product, idx) => (
              <div key={idx} className='w-[calc(50vw-1.5rem)] sm:w-[calc(50%-0.5rem)] md:w-[calc(50%-0.75rem)] lg:w-[calc(25%-0.75rem)] flex-shrink-0'>
                <ProductItem product={product} />
              </div>
            ))}
          </div>

          {/* Fade edges - Eliminados para envío gratis */}
        </div>
    </section>
  )
}

export default DynamicProductCarousel
