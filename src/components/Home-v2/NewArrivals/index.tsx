'use client'

import React from 'react'
import Link from 'next/link'
import ProductItem from '@/components/Common/ProductItem'
import { useFilteredProducts } from '@/hooks/useFilteredProducts'
import { useProductFilters } from '@/hooks/useProductFilters'
import { adaptApiProductsToComponents } from '@/lib/adapters/product-adapter'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Sparkles, ArrowRight } from '@/lib/optimized-imports'
import { ProductSkeletonGrid } from '@/components/ui/product-skeleton'

const NewArrival: React.FC = () => {
  const { filters } = useProductFilters({ syncWithUrl: true })

  const { data, isLoading, error } = useFilteredProducts({
    ...(filters.categories.length > 0 && { categories: filters.categories }),
    limit: 8,
    sortBy: 'created_at',
    sortOrder: 'desc',
  })

  const apiProducts = data?.data || []
  const products = adaptApiProductsToComponents(apiProducts)

  const sectionTitle =
    filters.categories.length > 0
      ? `Novedades en ${filters.categories.length === 1 ? 'esta categoría' : 'estas categorías'}`
      : 'Nuevos Productos'

  return (
    <section className='overflow-hidden pt-8 sm:pt-12 pb-6 sm:pb-10 bg-transparent'>
      <div className='max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0 overflow-hidden'>
        {/* Header simplificado - Paleta Pinteya */}
        <div className='mb-4 sm:mb-6 flex items-center gap-3'>
          <div className='w-10 h-10 rounded-full bg-gradient-to-br from-[#eb6313] to-[#f27a1d] flex items-center justify-center shadow-md'>
            <Sparkles className='w-5 h-5 text-white' />
          </div>
          <h2 className='text-xl md:text-2xl font-bold text-gray-900 dark:text-bright-sun-300'>
            {sectionTitle}
          </h2>
        </div>

        {isLoading ? (
          <ProductSkeletonGrid count={8} />
        ) : error ? (
          <Card variant='outlined' className='border-red-200 bg-red-50'>
            <CardContent className='p-8 text-center'>
              <div className='flex flex-col items-center gap-3'>
                <div className='w-12 h-12 rounded-full bg-red-100 flex items-center justify-center'>
                  <span className='text-red-600 text-xl'>⚠️</span>
                </div>
                <div>
                  <h3 className='font-semibold text-red-900 dark:text-red-300 mb-1'>
                    Error al cargar productos
                  </h3>
                  <p className='text-red-700 text-sm'>
                    {error instanceof Error
                      ? error.message
                      : typeof error === 'string'
                        ? error
                        : 'Error desconocido'}
                  </p>
                </div>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => window.location.reload()}
                  className='border-red-300 text-red-700 hover:bg-red-100'
                >
                  Reintentar
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className='grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6'>
            {products.map((item, key) => (
              <ProductItem key={key} item={item} />
            ))}
          </div>
        )}

        {!isLoading && !error && products.length === 0 && (
          <Card variant='outlined' className='border-gray-200'>
            <CardContent className='p-12 text-center'>
              <div className='flex flex-col items-center gap-4'>
                <div className='w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center'>
                  <Sparkles className='w-8 h-8 text-gray-400' />
                </div>
                <div>
                  <h3 className='font-semibold text-gray-900 dark:text-bright-sun-300 mb-2'>
                    No hay productos nuevos
                  </h3>
                  <p className='text-gray-600 dark:text-bright-sun-200 text-sm mb-4'>
                    Pronto agregaremos nuevos productos de pinturería
                  </p>
                  <Button variant='outline' asChild>
                    <Link href='/products'>Ver Catálogo Completo</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  )
}

export default NewArrival

