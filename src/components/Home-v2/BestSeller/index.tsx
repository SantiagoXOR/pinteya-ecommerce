'use client'

import React, { useMemo } from 'react'
import ProductItem from '@/components/Common/ProductItem'
import Link from 'next/link'
import { useBestSellerProducts } from '@/hooks/useBestSellerProducts'
import { useCategoryFilter } from '@/contexts/CategoryFilterContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Trophy } from '@/lib/optimized-imports'
import HelpCard from './HelpCard'
import { ProductSkeletonGrid } from '@/components/ui/product-skeleton'

const BestSeller: React.FC = () => {
  // ✅ LOG: Verificar que el componente se está montando
  console.log('🟢 [BestSeller] COMPONENTE MONTÁNDOSE', {
    timestamp: new Date().toISOString(),
    isClient: typeof window !== 'undefined'
  })

  const { selectedCategory } = useCategoryFilter()

  console.log('🟢 [BestSeller] selectedCategory:', selectedCategory)

  // Fetch productos según categoría seleccionada
  // Sin categoría: 10 productos específicos hardcodeados
  // Con categoría: Todos los productos de la categoría (limit 50)
  const { products, isLoading, error } = useBestSellerProducts({
    categorySlug: selectedCategory,
  })

  console.log('🟢 [BestSeller] Estado después de useBestSellerProducts', {
    productsLength: Array.isArray(products) ? products.length : 'NO ARRAY',
    isLoading,
    hasError: !!error,
    errorMessage: error || 'NO ERROR'
  })

  // Memoizar ordenamiento y filtrado de productos
  const bestSellerProducts = useMemo(() => {
    const adaptedProducts = Array.isArray(products) ? products : []
    
    // Ordenar por precio y separar en stock/sin stock
    const sortedByPrice = [...adaptedProducts].sort((a, b) => b.price - a.price)
    const inStock = sortedByPrice.filter(p => (p.stock ?? 0) > 0)
    const outOfStock = sortedByPrice.filter(p => (p.stock ?? 0) <= 0)
    
    // Mostrar todos los productos (con stock primero)
    return [...inStock, ...outOfStock]
  }, [products])

  // Calcular si hay espacios vacíos en la última fila
  // Desktop: 4 cols, Tablet: 2 cols, Mobile: 2 cols
  const shouldShowHelpCard = bestSellerProducts.length > 0 && 
    (bestSellerProducts.length % 4 !== 0 || bestSellerProducts.length % 2 !== 0)

  // ✅ FIX CRÍTICO: Mejor manejo del estado de loading con timeout y detección de datos
  const [showTimeout, setShowTimeout] = React.useState(false)
  const hasProducts = bestSellerProducts.length > 0
  
  React.useEffect(() => {
    // Si hay productos, resetear timeout
    if (hasProducts) {
      setShowTimeout(false)
      return
    }
    
    // Si está cargando y no hay productos, iniciar timeout
    if (isLoading && !hasProducts) {
      const timeout = setTimeout(() => {
        console.warn('⚠️ useBestSellerProducts: Timeout después de 6 segundos, ocultando skeletons')
        setShowTimeout(true)
      }, 6000) // 6 segundos - más agresivo
      
      return () => clearTimeout(timeout)
    } else {
      setShowTimeout(false)
    }
  }, [isLoading, hasProducts])

  // ✅ FIX CRÍTICO: Mostrar skeletons solo si:
  // 1. Está cargando
  // 2. No hay productos
  // 3. No hay timeout
  // 4. No hay error
  const shouldShowSkeletons = isLoading && !hasProducts && !showTimeout && !error

  if (shouldShowSkeletons) {
    return (
      <section className='overflow-hidden py-2 sm:py-3 bg-transparent'>
        <div className='max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0 overflow-hidden'>
          <ProductSkeletonGrid count={12} />
        </div>
      </section>
    )
  }

  // Si hay timeout o error, mostrar contenido vacío o mensaje
  if (error || showTimeout) {
    return null
  }

  return (
    <section className='overflow-hidden py-2 sm:py-3 bg-transparent'>
      <div className='max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0'>
        {/* Grid de productos mejorado - 4 columnas en desktop */}
          <div className='grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6'>
            {bestSellerProducts.length > 0 ? (
              <>
                {bestSellerProducts.map((item, index) => (
                  <ProductItem key={`${item.id}-${index}`} product={item} />
                ))}
                {shouldShowHelpCard && <HelpCard categoryName={selectedCategory} />}
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
      </div>
    </section>
  )
}

export default BestSeller
