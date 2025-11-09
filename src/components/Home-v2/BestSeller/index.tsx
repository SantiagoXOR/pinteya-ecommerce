'use client'

import React from 'react'
import ProductItem from '@/components/Common/ProductItem'
import Link from 'next/link'
import { useProductsByCategory } from '@/hooks/useProductsByCategory'
import { useCategoryFilter } from '@/contexts/CategoryFilterContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Trophy } from 'lucide-react'
import HelpCard from './HelpCard'

const BestSeller: React.FC = () => {
  const { selectedCategory } = useCategoryFilter()

  // Fetch productos según categoría seleccionada
  const { products, isLoading, error } = useProductsByCategory({
    categorySlug: selectedCategory,
    limit: 100, // Aumentado para mostrar más productos por categoría
  })

  // Los productos ya vienen adaptados del hook, no necesitamos adaptarlos nuevamente
  const adaptedProducts = Array.isArray(products) ? products : []

  // Ordenar por precio y separar en stock/sin stock
  const sortedByPrice = [...adaptedProducts].sort((a, b) => b.price - a.price)
  const inStock = sortedByPrice.filter(p => (p.stock ?? 0) > 0)
  const outOfStock = sortedByPrice.filter(p => (p.stock ?? 0) <= 0)
  // Mostrar todos los productos de la categoría seleccionada
  const bestSellerProducts = [...inStock, ...outOfStock]

  // Calcular si hay espacios vacíos en la última fila
  // Desktop: 4 cols, Tablet: 2 cols, Mobile: 2 cols
  const shouldShowHelpCard = bestSellerProducts.length > 0 && 
    (bestSellerProducts.length % 4 !== 0 || bestSellerProducts.length % 2 !== 0)

  if (isLoading) {
    return (
      <section className='overflow-hidden py-4 sm:py-6 bg-transparent'>
        <div className='max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0'>
          <div className='grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6'>
            {[...Array(12)].map((_, index) => (
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
    <section className='overflow-hidden py-2 sm:py-3 bg-transparent'>
      <div className='max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0'>
        {/* Grid de productos mejorado - 4 columnas en desktop */}
        <div className='grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6'>
          {bestSellerProducts.length > 0 ? (
            <>
              {bestSellerProducts.map((item, key) => (
                <ProductItem key={key} product={item} />
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
      </div>
    </section>
  )
}

export default BestSeller
