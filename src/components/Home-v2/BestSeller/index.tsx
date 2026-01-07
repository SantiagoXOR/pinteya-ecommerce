'use client'

import React, { useMemo } from 'react'
import ProductItem from '@/components/Common/ProductItem'
import Link from 'next/link'
import { useBestSellerProducts } from '@/hooks/useBestSellerProducts'
import { useCategoryFilter } from '@/contexts/CategoryFilterContext'
import { useDevicePerformance } from '@/hooks/useDevicePerformance'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Trophy } from '@/lib/optimized-imports'
import HelpCard from './HelpCard'
import { PaintVisualizerCard } from '@/components/PaintVisualizer'
import { ProductSkeletonGrid } from '@/components/ui/product-skeleton'

// ⚡ OPTIMIZACIÓN: Componente memoizado para evitar re-renders innecesarios
const BestSeller: React.FC = React.memo(() => {
  // ⚡ OPTIMIZACIÓN: Detectar nivel de rendimiento para reducir productos iniciales
  const performanceLevel = useDevicePerformance()
  const isLowPerformance = performanceLevel === 'low'
  const initialProductCount = isLowPerformance ? 4 : 12 // Reducir a 4 en dispositivos de bajo rendimiento

  const { selectedCategory } = useCategoryFilter()

  // Fetch productos según categoría seleccionada
  // Sin categoría: 10 productos específicos hardcodeados
  // Con categoría: Todos los productos de la categoría (limit 50)
  const { products, isLoading, error } = useBestSellerProducts({
    categorySlug: selectedCategory,
  })

  // Memoizar ordenamiento y filtrado de productos
  const bestSellerProducts = useMemo(() => {
    const adaptedProducts = Array.isArray(products) ? products : []
    
    // Ordenar por precio y separar en stock/sin stock
    const sortedByPrice = [...adaptedProducts].sort((a, b) => b.price - a.price)
    const inStock = sortedByPrice.filter(p => (p.stock ?? 0) > 0)
    const outOfStock = sortedByPrice.filter(p => (p.stock ?? 0) <= 0)
    
    // ⚡ OPTIMIZACIÓN: Limitar productos iniciales en dispositivos de bajo rendimiento
    const allProducts = [...inStock, ...outOfStock]
    return isLowPerformance ? allProducts.slice(0, initialProductCount) : allProducts
  }, [products, isLowPerformance, initialProductCount])

  // Calcular si hay espacios vacíos en la última fila
  // Desktop: 4 cols, Tablet: 2 cols, Mobile: 2 cols
  const shouldShowHelpCard = bestSellerProducts.length > 0 && 
    (bestSellerProducts.length % 4 !== 0 || bestSellerProducts.length % 2 !== 0)

  // ✅ FIX: Siempre mostrar productos si están disponibles (incluso si está "loading")
  // Solo mostrar skeletons si NO hay productos Y está cargando
  const hasProducts = bestSellerProducts.length > 0
  const shouldShowSkeletons = isLoading && !hasProducts

  // ✅ FIX: Siempre renderizar la sección, nunca retornar null
  return (
    <section className='overflow-x-hidden py-1 sm:py-1.5 bg-transparent'>
      <div className='max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-8'>
        {shouldShowSkeletons ? (
          // Mostrar skeletons solo durante la carga inicial sin datos
          <ProductSkeletonGrid count={initialProductCount} />
        ) : (
          // Grid de productos mejorado - 4 columnas en desktop
          <div className='grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6'>
            {bestSellerProducts.length > 0 ? (
              <>
                {bestSellerProducts.map((item, index) => (
                  <ProductItem key={`${item.id}-${index}`} product={item} />
                ))}
                {shouldShowHelpCard && <HelpCard categoryName={selectedCategory} />}
                {shouldShowHelpCard && <PaintVisualizerCard />}
              </>
            ) : (
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
            )}
          </div>
        )}
      </div>
    </section>
  )
})

BestSeller.displayName = 'BestSeller'

export default BestSeller
