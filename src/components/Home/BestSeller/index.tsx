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
import HelpCard from './HelpCard'
import PromoCard from './PromoCard'
import CalculatorCard from './CalculatorCard'
import { 
  limitByPerformance, 
  shouldShowHelpCards 
} from '@/lib/products/transformers'
import { PRODUCT_LIMITS } from '@/lib/products/constants'

// ⚡ OPTIMIZACIÓN: Componente memoizado para evitar re-renders innecesarios
const BestSeller: React.FC = React.memo(() => {
  // ⚡ OPTIMIZACIÓN: Usar PerformanceContext para compartir el valor de performanceLevel
  const { isLowPerformance } = usePerformance()

  const { selectedCategory } = useCategoryFilter()

  // Fetch productos según categoría seleccionada
  // Sin categoría: 10 productos específicos hardcodeados
  // Con categoría: Todos los productos de la categoría (limit 20)
  const { products, isLoading, error } = useBestSellerProducts({
    categorySlug: selectedCategory,
  })

  // Preparar productos según rendimiento del dispositivo usando transformadores
  const bestSellerProducts = useMemo(() => {
    const adaptedProducts = Array.isArray(products) ? products : []
    const limit = isLowPerformance 
      ? PRODUCT_LIMITS.LOW_PERFORMANCE 
      : PRODUCT_LIMITS.STANDARD
    
    return limitByPerformance(adaptedProducts, isLowPerformance, limit)
  }, [products, isLowPerformance])

  // Calcular si hay espacios vacíos usando transformador
  const shouldShowHelpCard = shouldShowHelpCards(bestSellerProducts.length)
  
  return (
    <section className='overflow-hidden py-1 sm:py-1.5 bg-transparent'>
      <div className='max-w-[1170px] w-full mx-auto px-8 sm:px-8'>
        {/* Grid de productos mejorado - 4 columnas en desktop */}
        <div className='grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6'>
          {/* ✅ FIX CRÍTICO: Mostrar productos siempre que existan, incluso durante refetch */}
          {/* Con placeholderData, los datos anteriores se mantienen durante actualizaciones en segundo plano */}
          {bestSellerProducts.length > 0 ? (
            <>
              {bestSellerProducts.map((item, index) => (
                <ProductItem key={`${item.id}-${index}`} product={item} />
              ))}
              {/* Help cards solo se muestran si hay productos y se necesita rellenar fila */}
              {shouldShowHelpCard && (
                <>
                  <PromoCard />
                  <CalculatorCard />
                  <HelpCard categoryName={selectedCategory} />
                </>
              )}
            </>
          ) : (
            // ✅ FIX: Solo mostrar mensaje vacío si realmente no hay datos Y no está cargando inicialmente
            // Con placeholderData, siempre deberíamos tener datos si hubo una carga previa
            // Solo mostrar mensaje vacío si definitivamente no hay productos (no está cargando y no hay datos y no hay error)
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

BestSeller.displayName = 'BestSeller'

export default BestSeller
