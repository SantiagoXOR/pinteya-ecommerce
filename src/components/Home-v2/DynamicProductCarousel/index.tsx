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
  
  // ⚡ OPTIMIZACIÓN: Si freeShippingOnly es true, usar useFilteredProducts para compartir cache con FreeShippingSection
  // Esto evita peticiones duplicadas a /api/products con los mismos filtros
  const freeShippingQuery = useFilteredProducts({
    limit: 30, // ⚡ OPTIMIZACIÓN: Mismo límite que FreeShippingSection para compartir cache
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
  
  // Helper function: Obtener precio efectivo de una variante (price_sale || price_list)
  const getVariantEffectivePrice = (variant: any): number => {
    if (!variant) return 0
    return Number(variant.price_sale) || Number(variant.price_list) || 0
  }

  // Helper function: Encontrar la variante más costosa de un producto
  const getMostExpensiveVariant = (product: any): any => {
    if (!product.variants || product.variants.length === 0) return null
    
    return product.variants.reduce((mostExpensive: any, current: any) => {
      const currentPrice = getVariantEffectivePrice(current)
      const mostExpensivePrice = getVariantEffectivePrice(mostExpensive)
      return currentPrice > mostExpensivePrice ? current : mostExpensive
    }, product.variants[0])
  }

  // Helper function: Actualizar producto con la variante más costosa
  const updateProductWithMostExpensiveVariant = (product: any): any => {
    const mostExpensiveVariant = getMostExpensiveVariant(product)
    
    if (mostExpensiveVariant) {
      const variantPrice = getVariantEffectivePrice(mostExpensiveVariant)
      const variantListPrice = Number(mostExpensiveVariant.price_list) || variantPrice
      
      // Actualizar default_variant para que ProductItem use la variante más cara por defecto
      const updatedVariants = product.variants ? [...product.variants] : []
      const mostExpensiveVariantIndex = updatedVariants.findIndex((v: any) => v.id === mostExpensiveVariant.id)
      
      return {
        ...product,
        price: variantListPrice,
        discountedPrice: variantPrice,
        medida: mostExpensiveVariant.measure || product.medida,
        color: mostExpensiveVariant.color_name || product.color, // Actualizar color con el de la variante más cara
        // Actualizar también originalPrice si existe
        originalPrice: variantListPrice,
        // Establecer la variante más cara como default_variant
        default_variant: mostExpensiveVariant,
        // Asegurarse de que la variante más cara esté al inicio del array para que sea la seleccionada por defecto
        variants: mostExpensiveVariantIndex > 0 
          ? [mostExpensiveVariant, ...updatedVariants.filter((v: any) => v.id !== mostExpensiveVariant.id)]
          : updatedVariants,
      }
    }
    
    return product
  }

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
    
    // ⚡ PASO 1: Actualizar cada producto con su variante más costosa
    const productsWithMostExpensiveVariants = adaptedProducts.map(updateProductWithMostExpensiveVariant)
    
    // ⚡ PASO 2: Filtrar productos con precio > 50000 - Envío gratis solo para compras mayores
    const freeShippingProducts = productsWithMostExpensiveVariants.filter(p => {
      const price = Number(p.price) || 0
      const discountedPrice = Number(p.discountedPrice) || price
      const finalPrice = discountedPrice > 0 ? discountedPrice : price
      return finalPrice > 50000
    })
    
    // ⚡ PASO 3: Si no hay productos con precio > 50000, mostrar los más caros
    if (freeShippingProducts.length === 0) {
      // Ordenar por precio descendente y tomar los primeros productos
      products = productsWithMostExpensiveVariants
        .sort((a, b) => {
          const priceA = Number(b.discountedPrice) || Number(b.price) || 0
          const priceB = Number(a.discountedPrice) || Number(a.price) || 0
          return priceA - priceB
        })
        .slice(0, 12) // Limitar a 12 productos más caros
    } else {
      products = freeShippingProducts
    }
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
      className={`${freeShippingOnly ? 'pt-4 pb-4' : 'py-4'} bg-gradient-to-br ${categoryConfig.bgGradient} scroll-mt-20 category-transition`}
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
              <h2 className={`text-xl md:text-2xl font-medium ${categoryConfig.textColor || 'text-white'} leading-tight line-clamp-1`} style={freeShippingOnly ? { color: 'rgba(242, 122, 29, 1)' } : {}}>
                {categoryConfig.title}
              </h2>
              <p className={`text-xs md:text-sm leading-tight line-clamp-1 ${freeShippingOnly ? 'text-white' : 'text-white/70'}`}>
                {categoryConfig.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Carrusel Horizontal de productos - ancho igual que grid */}
        <div className='relative'>
          {/* Controles de navegación - A los costados del carrusel, mitad y mitad */}
          {/* ⚡ FASE 8: Optimizado - reemplazar border-color animado por opacity */}
          <button
            onClick={() => scroll('left')}
            className='hidden md:flex absolute -left-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center shadow-lg relative'
            style={{
              // ⚡ FASE 8: Usar opacity para border effect
              opacity: 0.9,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1'
              const border = e.currentTarget.querySelector('.hover-border') as HTMLElement
              if (border) border.style.opacity = '1'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0.9'
              const border = e.currentTarget.querySelector('.hover-border') as HTMLElement
              if (border) border.style.opacity = '0'
            }}
            aria-label='Anterior'
          >
            <span className="absolute inset-0 rounded-full border-2 border-gray-400 opacity-0 hover-border transition-opacity duration-300 pointer-events-none" />
            <ChevronLeft className='w-5 h-5 relative z-10' />
          </button>
          <button
            onClick={() => scroll('right')}
            className='hidden md:flex absolute -right-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center shadow-lg relative'
            style={{
              // ⚡ FASE 8: Usar opacity para border effect
              opacity: 0.9,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1'
              const border = e.currentTarget.querySelector('.hover-border') as HTMLElement
              if (border) border.style.opacity = '1'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0.9'
              const border = e.currentTarget.querySelector('.hover-border') as HTMLElement
              if (border) border.style.opacity = '0'
            }}
            aria-label='Siguiente'
          >
            <span className="absolute inset-0 rounded-full border-2 border-gray-400 opacity-0 hover-border transition-opacity duration-300 pointer-events-none" />
            <ChevronRight className='w-5 h-5 relative z-10' />
          </button>

          {/* ⚡ OPTIMIZACIÓN: GPU acceleration para scroll fluido a 60fps */}
          <div
            ref={scrollRef}
            className='flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4'
            style={{ 
              scrollbarWidth: 'none', 
              msOverflowStyle: 'none',
              willChange: 'scroll-position',
              transform: 'translateZ(0)', // GPU acceleration
              WebkitOverflowScrolling: 'touch', // Smooth scrolling en iOS
            }}
          >
            {products.map((product, idx) => (
              <div key={idx} className='w-[calc(50%-0.5rem)] md:w-[calc(50%-0.75rem)] lg:w-[calc(25%-0.75rem)] flex-shrink-0 flex flex-col'>
                <ProductItem product={product} />
              </div>
            ))}
          </div>

          {/* Fade edges - Eliminados para envío gratis */}
        </div>
      </div>
    </section>
  )
}

export default DynamicProductCarousel

