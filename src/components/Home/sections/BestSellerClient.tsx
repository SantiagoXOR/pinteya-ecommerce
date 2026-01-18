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
import PromoCard from '../BestSeller/PromoCard'
import CalculatorCard from '../BestSeller/CalculatorCard'
import { 
  limitByPerformance, 
  shouldShowHelpCards 
} from '@/lib/products/transformers'
import { PRODUCT_LIMITS } from '@/lib/products/constants'
import type { Product } from '@/types/product'
import { ProductGridSkeleton } from '@/components/ui/skeletons'

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
    initialData: !selectedCategory ? initialProducts : undefined,
  })

  // ✅ FIX: Priorizar initialProducts cuando no hay categoría (datos del servidor)
  // Si hay categoría seleccionada, usar productos de React Query
  // Si no hay categoría, usar initialProducts del servidor como fallback
  const currentProducts = selectedCategory 
    ? products 
    : (initialProducts.length > 0 ? initialProducts : products)

  // Preparar productos según rendimiento del dispositivo
  // ✅ FIX: Cuando no hay categoría, mostrar 17 productos + 3 cards = 20 items
  const bestSellerProducts = useMemo(() => {
    const adaptedProducts = Array.isArray(currentProducts) ? currentProducts : []
    
    // Si no hay categoría seleccionada, limitar a 17 productos para dejar espacio a los 3 cards
    if (!selectedCategory) {
      return adaptedProducts.slice(0, 17)
    }
    
    // Si hay categoría, aplicar límite según rendimiento
    const limit = isLowPerformance 
      ? PRODUCT_LIMITS.LOW_PERFORMANCE 
      : PRODUCT_LIMITS.STANDARD
    
    return limitByPerformance(adaptedProducts, isLowPerformance, limit)
  }, [currentProducts, isLowPerformance, selectedCategory])

  // ✅ FIX: Mostrar cards siempre cuando no hay categoría, o cuando hay espacios vacíos con categoría
  const shouldShowHelpCard = !selectedCategory || shouldShowHelpCards(bestSellerProducts.length)
  
  // ✅ FIX: Mostrar skeletons solo durante carga inicial si no hay initialProducts
  const showSkeletons = isLoading && initialProducts.length === 0 && bestSellerProducts.length === 0

  return (
    <section className='overflow-hidden py-1 sm:py-1.5 bg-transparent'>
      <div className='max-w-[1170px] w-full mx-auto px-8 sm:px-8'>
        <div className='grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6'>
          {showSkeletons ? (
            <ProductGridSkeleton count={8} />
          ) : bestSellerProducts.length > 0 ? (
            <>
              {bestSellerProducts.map((item, index) => (
                <ProductItem key={`${item.id}-${index}`} product={item} />
              ))}
              {shouldShowHelpCard && (
                <>
                  <PromoCard />
                  <CalculatorCard />
                  <HelpCard categoryName={selectedCategory} />
                </>
              )}
            </>
          ) : error ? (
            // ✅ FIX: Mostrar error si hay error y no hay productos
            <div className='col-span-full'>
              <Card variant='outlined' className='border-red-200 bg-red-50'>
                <CardContent className='p-8 text-center'>
                  <div className='flex flex-col items-center gap-3'>
                    <div className='w-12 h-12 rounded-full bg-red-100 flex items-center justify-center'>
                      <span className='text-red-600 text-xl'>⚠️</span>
                    </div>
                    <div>
                      <h3 className='font-semibold text-red-900 mb-1'>
                        Error al cargar productos
                      </h3>
                      <p className='text-red-700 text-sm mb-4'>
                        {error}
                      </p>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => window.location.reload()}
                        className='border-red-300 text-red-700 hover:bg-red-100'
                      >
                        Reintentar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
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
