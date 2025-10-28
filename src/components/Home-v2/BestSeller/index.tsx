'use client'

import React from 'react'
import ProductItem from '@/components/Common/ProductItem'
import { adaptApiProductsToComponents } from '@/lib/adapters/product-adapter'
import Link from 'next/link'
import { useFilteredProducts } from '@/hooks/useFilteredProducts'
import { useProductFilters } from '@/hooks/useProductFilters'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowRight } from '@/lib/optimized-imports'
import { Flame, Trophy } from 'lucide-react'

const BestSeller: React.FC = () => {
  const { filters } = useProductFilters({ syncWithUrl: true })

  const { data, isLoading, error } = useFilteredProducts({
    ...(filters.categories.length > 0 && { categories: filters.categories }),
    limit: 50,
    sortBy: 'price',
    sortOrder: 'desc',
  })

  const adaptedProducts = data?.data ? adaptApiProductsToComponents(data.data) : []

  const sortedByPrice = [...adaptedProducts].sort((a, b) => b.price - a.price)
  const inStock = sortedByPrice.filter(p => (p.stock ?? 0) > 0)
  const outOfStock = sortedByPrice.filter(p => (p.stock ?? 0) <= 0)
  const bestSellerProducts = [...inStock, ...outOfStock].slice(0, 8)

  if (isLoading) {
    return (
      <section className='overflow-hidden py-4 sm:py-6 bg-gradient-to-b from-white to-orange-50/30'>
        <div className='max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0'>
          <div className='mb-10 flex items-center justify-between'>
            <div>
              <div className='flex items-center gap-2.5 font-medium text-gray-700 mb-1.5'>
                <div className='w-5 h-5 rounded-full bg-yellow-100 flex items-center justify-center'>
                  <Trophy className='w-3 h-3 text-yellow-600' />
                </div>
                <span>Ofertas Especiales</span>
              </div>
            </div>
          </div>

          <div className='grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6'>
            {[...Array(8)].map((_, index) => (
              <Card key={index} className='overflow-hidden'>
                <div className='animate-pulse'>
                  <div className='bg-gray-200 h-40 md:h-64 rounded-t-lg'></div>
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
        </div>
      </section>
    )
  }

  if (error) {
    return null
  }

  return (
    <section id='ofertas-especiales' className='overflow-hidden py-6 sm:py-10 bg-gradient-to-b from-white to-orange-50/30 scroll-mt-20'>
      <div className='max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0'>
        {/* Header mejorado */}
        <div className='mb-8 flex items-center justify-between'>
          <div>
            <div className='flex items-center gap-3 mb-2'>
              <div className='w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg'>
                <Flame className='w-5 h-5 text-white' />
              </div>
              <div>
                <div className='flex items-center gap-2'>
                  <h2 className='text-2xl md:text-3xl font-bold text-gray-900'>
                    Ofertas Especiales
                  </h2>
                  <Badge className='bg-red-500 text-white animate-pulse'>
                    🔥 HOT
                  </Badge>
                </div>
                <p className='text-gray-600 text-sm mt-1'>
                  Los más vendidos con descuentos exclusivos
                </p>
              </div>
            </div>
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

        {/* Grid de productos mejorado - 4 columnas en desktop */}
        <div className='grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6'>
          {bestSellerProducts.length > 0 ? (
            bestSellerProducts.map((item, key) => (
              <ProductItem key={key} product={item} />
            ))
          ) : (
            <div className='col-span-full'>
              <Card variant='outlined' className='border-gray-200'>
                <CardContent className='p-12 text-center'>
                  <div className='flex flex-col items-center gap-4'>
                    <div className='w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center'>
                      <Trophy className='w-8 h-8 text-yellow-500' />
                    </div>
                    <div>
                      <h3 className='font-semibold text-gray-900 mb-2'>
                        No hay productos disponibles
                      </h3>
                      <p className='text-gray-600 text-sm mb-4'>
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

        {/* CTA mobile */}
        <div className='mt-6 text-center md:hidden'>
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

export default BestSeller

