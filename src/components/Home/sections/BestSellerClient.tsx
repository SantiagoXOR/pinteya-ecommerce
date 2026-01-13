'use client'

import React, { useMemo } from 'react'
import ProductItem from '@/components/Common/ProductItem'
import Link from 'next/link'
import { useBestSellerProducts } from '@/hooks/useBestSellerProducts'
import { useCategoryFilter } from '@/contexts/CategoryFilterContext'
import { usePerformance } from '@/contexts/PerformanceContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Trophy } from '@/lib/optimized-imports'
import HelpCard from '../BestSeller/HelpCard'
import DiscountCard from '../BestSeller/DiscountCard'
import CalculatorCard from '../BestSeller/CalculatorCard'
// import { PaintVisualizerCard } from '@/components/PaintVisualizer' // Ocultado temporalmente
import { 
  limitByPerformance, 
  shouldShowHelpCards 
} from '@/lib/products/transformers'
import { PRODUCT_LIMITS } from '@/lib/products/constants'
import type { Product } from '@/types/product'

interface BestSellerClientProps {
  initialProducts: Product[]
}

/**
 * BestSellerClient - Client Component mínimo
 * Usa datos iniciales del servidor pero permite interactividad (filtros, categorías)
 */
export const BestSellerClient: React.FC<BestSellerClientProps> = React.memo(({ initialProducts }) => {
  const { isLowPerformance } = usePerformance()
  const { selectedCategory } = useCategoryFilter()

  // Fetch productos según categoría seleccionada (puede cambiar dinámicamente)
  const { products, isLoading, error } = useBestSellerProducts({
    categorySlug: selectedCategory,
  })

  // Usar productos del servidor si no hay categoría seleccionada, sino usar los de React Query
  const currentProducts = selectedCategory ? products : (products.length > 0 ? products : initialProducts)

  // Preparar productos según rendimiento del dispositivo
  const bestSellerProducts = useMemo(() => {
    const adaptedProducts = Array.isArray(currentProducts) ? currentProducts : []
    const limit = isLowPerformance 
      ? PRODUCT_LIMITS.LOW_PERFORMANCE 
      : PRODUCT_LIMITS.STANDARD
    
    return limitByPerformance(adaptedProducts, isLowPerformance, limit)
  }, [currentProducts, isLowPerformance])

  // Calcular si hay espacios vacíos
  const shouldShowHelpCard = shouldShowHelpCards(bestSellerProducts.length)
  
  return (
    <section className='overflow-hidden py-1 sm:py-1.5 bg-transparent'>
      <div className='max-w-[1170px] w-full mx-auto px-4 sm:px-8'>
        <div className='grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6'>
          {bestSellerProducts.length > 0 ? (
            <>
              {bestSellerProducts.map((item, index) => (
                <ProductItem key={`${item.id}-${index}`} product={item} />
              ))}
              {shouldShowHelpCard && (
                <>
                  <HelpCard categoryName={selectedCategory} />
                  <DiscountCard />
                  <CalculatorCard />
                </>
              )}
            </>
          ) : (
            !isLoading && bestSellerProducts.length === 0 && !error && (
              <div className='col-span-full'>
                <Card variant='outlined' className='border-gray-200'>
                  <CardContent className='p-12 text-center'>
                    <div className='flex flex-col items-center gap-4'>
                      <div className='w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center'>
                        <Trophy className='w-8 h-8 text-yellow-500' />
                      </div>
                      <div>
                        <h3 className='font-semibold text-white mb-2'>
                          No hay productos disponibles
                        </h3>
                        <p className='text-white/80 text-sm mb-4'>
                          No se encontraron productos en este momento.
                        </p>
                        <Button variant='outline' asChild>
                          <Link href='/products'>Ver Catálogo Completo</Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )
          )}
        </div>
      </div>
    </section>
  )
})

BestSellerClient.displayName = 'BestSellerClient'
