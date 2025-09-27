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
import { Sparkles, ArrowRight, Loader2 } from '@/lib/optimized-imports'

const NewArrival: React.FC = () => {
  // Hook para obtener filtros actuales
  const { filters } = useProductFilters({ syncWithUrl: true })

  // Hook para obtener productos más recientes filtrados
  const { data, isLoading, error } = useFilteredProducts({
    categories: filters.categories.length > 0 ? filters.categories : undefined,
    limit: 8,
    sortBy: 'created_at',
    sortOrder: 'desc',
  })

  // Obtener productos de la respuesta y adaptarlos al formato de componente
  const apiProducts = data?.data || []
  const products = adaptApiProductsToComponents(apiProducts)

  // Título dinámico según filtros
  const sectionTitle =
    filters.categories.length > 0
      ? `Novedades en ${filters.categories.length === 1 ? 'esta categoría' : 'estas categorías'}`
      : 'Nuevos Productos'

  return (
    <section className='overflow-hidden pt-6 sm:pt-10 pb-4 sm:pb-6'>
      <div className='max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0'>
        {/* Section Header - Migrado al Design System */}
        <div className='mb-8 sm:mb-10 flex items-center justify-between'>
          <div>
            <div className='flex items-center gap-2.5 font-medium text-gray-700 mb-1.5'>
              <div className='w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center'>
                <Sparkles className='w-3 h-3 text-primary' />
              </div>
              <span>Esta Semana</span>
              <Badge variant='info' size='sm'>
                Nuevos
              </Badge>
            </div>
            <h2 className='font-semibold text-xl xl:text-heading-5 text-gray-900'>
              {sectionTitle}
            </h2>
          </div>

          {/* Botón migrado al Design System */}
          <Button variant='outline' asChild>
            <Link href='/shop-with-sidebar'>
              Ver Todos
              <ArrowRight className='ml-2 h-4 w-4' />
            </Link>
          </Button>
        </div>

        {/* Loading State - Mobile-First 2 columnas */}
        {isLoading ? (
          <div className='grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-x-7.5 md:gap-y-9'>
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
          /* Error State - Mejorado con Design System */
          <Card variant='outlined' className='border-red-200 bg-red-50'>
            <CardContent className='p-8 text-center'>
              <div className='flex flex-col items-center gap-3'>
                <div className='w-12 h-12 rounded-full bg-red-100 flex items-center justify-center'>
                  <span className='text-red-600 text-xl'>⚠️</span>
                </div>
                <div>
                  <h3 className='font-semibold text-red-900 mb-1'>Error al cargar productos</h3>
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
          /* Products Grid - Mobile-First 2 columnas */
          <div className='grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-x-7.5 md:gap-y-9'>
            {products.map((item, key) => (
              <ProductItem item={item} key={key} />
            ))}
          </div>
        )}

        {/* Empty State - Nuevo con Design System */}
        {!isLoading && !error && products.length === 0 && (
          <Card variant='outlined' className='border-gray-200'>
            <CardContent className='p-12 text-center'>
              <div className='flex flex-col items-center gap-4'>
                <div className='w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center'>
                  <Sparkles className='w-8 h-8 text-gray-400' />
                </div>
                <div>
                  <h3 className='font-semibold text-gray-900 mb-2'>No hay productos nuevos</h3>
                  <p className='text-gray-600 text-sm mb-4'>
                    Pronto agregaremos nuevos productos de pinturería
                  </p>
                  <Button variant='outline' asChild>
                    <Link href='/shop-with-sidebar'>Ver Catálogo Completo</Link>
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
