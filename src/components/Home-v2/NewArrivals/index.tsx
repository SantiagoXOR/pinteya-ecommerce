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
    <section className='overflow-hidden pt-8 sm:pt-12 pb-6 sm:pb-10 bg-gradient-to-b from-orange-50/30 to-white'>
      <div className='max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0'>
        {/* Header mejorado */}
        <div className='mb-8 sm:mb-10 flex items-center justify-between'>
          <div>
            <div className='flex items-center gap-3 mb-2'>
              <div className='w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center shadow-lg animate-pulse'>
                <Sparkles className='w-5 h-5 text-white' />
              </div>
              <div>
                <div className='flex items-center gap-2'>
                  <Badge className='animate-bounce bg-blue-100 text-blue-700 text-xs px-2 py-0.5'>
                    Nuevos
                  </Badge>
                  <span className='text-sm font-medium text-gray-600'>
                    Esta Semana
                  </span>
                </div>
                <h2 className='text-2xl md:text-3xl font-bold text-gray-900 mt-1'>
                  {sectionTitle}
                </h2>
              </div>
            </div>
            <p className='text-gray-600 text-sm ml-13'>
              Descubrí las últimas novedades en pinturería
            </p>
          </div>

          <Button 
            variant='outline' 
            asChild 
            className='hidden md:flex border-[#eb6313] text-[#eb6313] hover:bg-orange-50'
          >
            <Link href='/products'>
              Ver Todos
              <ArrowRight className='ml-2 h-4 w-4' />
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className='grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6'>
            {[...Array(8)].map((_, index) => (
              <Card key={index} className='overflow-hidden'>
                <div className='animate-pulse'>
                  <div className='bg-gray-200 h-32 md:h-48 rounded-t-lg'></div>
                  <CardContent className='p-2 md:p-4'>
                    <div className='space-y-2 md:space-y-3'>
                      <div className='bg-gray-200 h-3 md:h-4 rounded w-3/4'></div>
                      <div className='bg-gray-200 h-3 md:h-4 rounded w-1/2'></div>
                      <div className='bg-gray-200 h-4 md:h-6 rounded w-1/3'></div>
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        ) : error ? (
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
                  <h3 className='font-semibold text-gray-900 mb-2'>
                    No hay productos nuevos
                  </h3>
                  <p className='text-gray-600 text-sm mb-4'>
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

        {/* CTA mobile */}
        <div className='mt-8 text-center md:hidden'>
          <Button 
            asChild 
            className='w-full max-w-sm bg-[#eb6313] hover:bg-[#bd4811] text-white'
          >
            <Link href='/products'>
              Ver Todos los Productos
              <ArrowRight className='ml-2 h-4 w-4' />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

export default NewArrival

