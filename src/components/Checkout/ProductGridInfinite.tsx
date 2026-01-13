'use client'

import React, { useMemo } from 'react'
import ProductItem from '@/components/Common/ProductItem'
import { useInfiniteProductsQuery } from '@/hooks/useInfiniteProductsQuery'
import { Loader2 } from '@/lib/optimized-imports'
import dynamic from 'next/dynamic'
import HelpCard from '@/components/Home/BestSeller/HelpCard'
import DiscountCard from '@/components/Home/BestSeller/DiscountCard'
import CalculatorCard from '@/components/Home/BestSeller/CalculatorCard'
// import { PaintVisualizerCard } from '@/components/PaintVisualizer' // Ocultado temporalmente

// Lazy load de los carruseles para mejor performance
const HeroCarousel = dynamic(() => import('@/components/Home/HeroCarousel'), {
  ssr: false,
})

const CombosSection = dynamic(() => import('@/components/Home/CombosSection'), {
  ssr: false,
})

// Constante fuera del componente para evitar recreación
const PRODUCTS_PER_SECTION = 12

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

  // Dividir productos en secciones e intercalar carruseles - SIEMPRE ejecutar antes de early returns
  const productSections = useMemo(() => {
    if (products.length === 0) {
      return []
    }

    const sections: Array<{ type: 'products' | 'carousel'; items: typeof products; carouselType?: 'hero' | 'combos' }> = []
    
    // Dividir productos en secciones de 12
    for (let i = 0; i < products.length; i += PRODUCTS_PER_SECTION) {
      const sectionProducts = products.slice(i, i + PRODUCTS_PER_SECTION)
      sections.push({ type: 'products', items: sectionProducts })
      
      // Intercalar carrusel después de cada sección (excepto la última)
      const isLastSection = i + PRODUCTS_PER_SECTION >= products.length
      if (!isLastSection) {
        const sectionIndex = Math.floor(i / PRODUCTS_PER_SECTION)
        // Alternar entre Hero y Combos
        sections.push({ 
          type: 'carousel', 
          items: [],
          carouselType: sectionIndex % 2 === 0 ? 'hero' : 'combos'
        })
      }
    }
    
    return sections
  }, [products])

  // ✅ ELIMINAR: No mostrar spinner aquí, la página principal ya maneja el estado de loading
  // Esto evita mostrar un spinner gris redundante
  if (isLoading) {
    return null
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
              {section.items.map((product) => (
                <ProductItem key={`${product.id}-${product.slug}`} product={product} />
              ))}
            </div>
          )
        }
        
        // Carrusel intercalado
        return (
          <div key={`carousel-${sectionIndex}`} className='mb-6'>
            {section.carouselType === 'hero' ? <HeroCarousel /> : <CombosSection />}
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
              {remainingProducts.map((product) => (
                <ProductItem key={`${product.id}-${product.slug}-remaining`} product={product} />
              ))}
              {/* Cards promocionales al final */}
              <HelpCard />
              <DiscountCard />
              <CalculatorCard />
            </div>
          )
        } else {
          // Si no hay productos restantes, mostrar solo los cards en una nueva fila
          return (
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
              <HelpCard />
              <DiscountCard />
              <CalculatorCard />
            </div>
          )
        }
      })()}
    </div>
  )
}



