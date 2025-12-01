'use client'

import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import ProductItem from '@/components/Common/ProductItem'
import { useInfiniteProductsQuery } from '@/hooks/useInfiniteProductsQuery'
import dynamic from 'next/dynamic'
import HelpCard from '@/components/Home-v2/BestSeller/HelpCard'
import { ProductSkeletonGrid } from '@/components/ui/product-skeleton'

// Lazy load de los carruseles para mejor performance
const HeroCarousel = dynamic(() => import('@/components/Home-v2/HeroCarousel'), {
  ssr: false,
})

const CombosSection = dynamic(() => import('@/components/Home-v2/CombosSection'), {
  ssr: false,
})

// ⚡ PERFORMANCE: Límites reducidos para mobile
const getProductsPerSection = (): number => {
  if (typeof window === 'undefined') return 12
  return window.innerWidth < 768 ? 8 : 12
}

const INITIAL_PRODUCTS_COUNT = 8 // Mostrar 8 productos inicialmente

interface ProductGridInfiniteProps {
  currentProductId?: number | string
  currentProductCategoryId?: number
  categorySlug?: string | null
}

export const ProductGridInfinite: React.FC<ProductGridInfiniteProps> = ({
  currentProductId,
  currentProductCategoryId,
  categorySlug = null,
}) => {
  const {
    products,
    isLoading,
  } = useInfiniteProductsQuery({
    currentProductId,
    currentProductCategoryId,
    categorySlug,
  })

  const containerRef = React.useRef<HTMLDivElement>(null)
  const loadMoreRef = React.useRef<HTMLDivElement>(null)
  const [visibleProductsCount, setVisibleProductsCount] = useState(INITIAL_PRODUCTS_COUNT)
  const [visibleCarousels, setVisibleCarousels] = useState<Set<number>>(new Set())
  const productsPerSection = getProductsPerSection()

  // ⚡ PERFORMANCE: Intersection Observer para cargar más productos
  useEffect(() => {
    if (!loadMoreRef.current || isLoading) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry.isIntersecting && visibleProductsCount < products.length) {
          // Cargar más productos (8 a la vez)
          setVisibleProductsCount((prev) => Math.min(prev + productsPerSection, products.length))
        }
      },
      {
        rootMargin: '200px', // Cargar cuando está a 200px del viewport
        threshold: 0.1,
      }
    )

    observer.observe(loadMoreRef.current)

    return () => {
      observer.disconnect()
    }
  }, [visibleProductsCount, products.length, isLoading, productsPerSection])

  // Resetear contador cuando cambian los productos
  useEffect(() => {
    setVisibleProductsCount(INITIAL_PRODUCTS_COUNT)
    setVisibleCarousels(new Set())
  }, [currentProductId])

  // Dividir productos en secciones e intercalar carruseles - SIEMPRE ejecutar antes de early returns
  const productSections = useMemo(() => {
    if (products.length === 0) {
      return []
    }

    // ⚡ PERFORMANCE: Solo procesar productos visibles
    const visibleProducts = products.slice(0, visibleProductsCount)

    const sections: Array<{ type: 'products' | 'carousel'; items: typeof products; carouselType?: 'hero' | 'combos'; sectionIndex?: number }> = []
    
    // Dividir productos en secciones según productsPerSection
    for (let i = 0; i < visibleProducts.length; i += productsPerSection) {
      const sectionProducts = visibleProducts.slice(i, i + productsPerSection)
      const sectionIndex = Math.floor(i / productsPerSection)
      sections.push({ type: 'products', items: sectionProducts, sectionIndex })
      
      // Intercalar carrusel después de cada sección (excepto la última)
      const isLastSection = i + productsPerSection >= visibleProducts.length
      if (!isLastSection) {
        // Alternar entre Hero y Combos
        sections.push({ 
          type: 'carousel', 
          items: [],
          carouselType: sectionIndex % 2 === 0 ? 'hero' : 'combos',
          sectionIndex
        })
      }
    }
    
    return sections
  }, [products, visibleProductsCount, productsPerSection])

  // ✅ SKELETON UNIFICADO: Mostrar skeleton mientras carga para mejor UX
  if (isLoading) {
    return <ProductSkeletonGrid count={12} />
  }

  if (products.length === 0) {
    return null
  }

  return (
    <div ref={containerRef} className='w-full'>
      {productSections.map((section, sectionIndex) => {
        if (section.type === 'products') {
          return (
            <div key={`products-${sectionIndex}`} className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
              {section.items.map((product, itemIndex) => {
                // ⚡ PERFORMANCE: Calcular índice global para determinar si es uno de los primeros 4
                const globalIndex = sectionIndex * productsPerSection + itemIndex
                const isFirstFour = globalIndex < 4
                
                return (
                  <ProductItem 
                    key={`${product.id}-${product.slug}`} 
                    product={product}
                    imagePriority={isFirstFour} // Pasar prop para priority
                  />
                )
              })}
            </div>
          )
        }
        
        // Carrusel intercalado - Lazy load solo cuando está en viewport
        const carouselSectionIndex = section.sectionIndex ?? sectionIndex
        const shouldLoadCarousel = visibleCarousels.has(carouselSectionIndex) || sectionIndex < 2 // Cargar primeros 2 carruseles inmediatamente
        
        return (
          <div 
            key={`carousel-${sectionIndex}`} 
            className='mb-6'
            ref={(el) => {
              if (el && !shouldLoadCarousel) {
                // Intersection Observer para cargar carrusel cuando está cerca
                const observer = new IntersectionObserver(
                  (entries) => {
                    if (entries[0].isIntersecting) {
                      setVisibleCarousels((prev) => new Set([...prev, carouselSectionIndex]))
                      observer.disconnect()
                    }
                  },
                  { rootMargin: '300px' }
                )
                observer.observe(el)
              }
            }}
          >
            {shouldLoadCarousel ? (
              section.carouselType === 'hero' ? <HeroCarousel /> : <CombosSection />
            ) : (
              <div className='w-full h-48 bg-gray-100 animate-pulse rounded-lg' />
            )}
          </div>
        )
      })}

      {/* Última sección: todos los productos restantes + HelpCard */}
      {(() => {
        // Calcular cuántos productos ya se mostraron en las secciones con carruseles
        const totalShown = productSections
          .filter(s => s.type === 'products')
          .reduce((sum, s) => sum + s.items.length, 0)
        
        // Obtener productos restantes (los que no caben en las secciones de 12)
        const remainingProducts = products.slice(totalShown)
        
        // Si hay productos restantes, mostrarlos junto con el HelpCard
        if (remainingProducts.length > 0) {
          // Calcular cuántos slots quedan en la última fila (grid de 4 columnas)
          const slotsInLastRow = remainingProducts.length % 4
          const emptySlots = slotsInLastRow > 0 ? 4 - slotsInLastRow : 0
          
          return (
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
              {remainingProducts.map((product, index) => {
                // ⚡ PERFORMANCE: Calcular índice global (ya pasamos las primeras secciones)
                const totalShownBefore = productSections
                  .filter(s => s.type === 'products')
                  .reduce((sum, s) => sum + s.items.length, 0)
                const globalIndex = totalShownBefore + index
                const isFirstFour = globalIndex < 4
                
                return (
                  <ProductItem 
                    key={`${product.id}-${product.slug}-remaining`} 
                    product={product}
                    imagePriority={isFirstFour}
                  />
                )
              })}
              {/* HelpCard al final, ocupando el último slot disponible */}
              <HelpCard />
            </div>
          )
        } else {
          // Si no hay productos restantes, mostrar solo el HelpCard en una nueva fila
          return (
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
              <HelpCard />
            </div>
          )
        }
      })()}

      {/* ⚡ PERFORMANCE: Trigger para cargar más productos */}
      {visibleProductsCount < products.length && (
        <div ref={loadMoreRef} className='w-full h-20 flex items-center justify-center'>
          <div className='text-sm text-gray-500'>Cargando más productos...</div>
        </div>
      )}
    </div>
  )
}



