// ===================================
// COMPONENTE: ProductSkeleton - Loading skeleton para productos
// ===================================

'use client'

import React from 'react'
import { cn } from '@/lib/core/utils'

// ===================================
// TIPOS
// ===================================

export interface ProductSkeletonProps {
  className?: string
  variant?: 'card' | 'list' | 'grid'
  showBadges?: boolean
  showPrice?: boolean
  showButton?: boolean
}

export interface ProductSkeletonGridProps {
  count?: number
  className?: string
  variant?: ProductSkeletonProps['variant']
}

// ===================================
// COMPONENTE SKELETON INDIVIDUAL
// ===================================

export const ProductSkeleton: React.FC<ProductSkeletonProps> = ({
  className,
  variant = 'card',
  showBadges = true,
  showPrice = true,
  showButton = true,
}) => {
  const baseClasses = 'skeleton-loading bg-white rounded-lg border border-gray-200 overflow-hidden'

  if (variant === 'list') {
    return (
      <div className={cn(baseClasses, 'flex gap-4 p-4', className)}>
        {/* Imagen */}
        <div className='w-24 h-24 bg-gray-200 rounded-md flex-shrink-0' />

        {/* Contenido */}
        <div className='flex-1 space-y-3'>
          {/* Título */}
          <div className='h-4 bg-gray-200 rounded w-3/4' />

          {/* Descripción */}
          <div className='space-y-2'>
            <div className='h-3 bg-gray-200 rounded w-full' />
            <div className='h-3 bg-gray-200 rounded w-2/3' />
          </div>

          {/* Precio */}
          {showPrice && (
            <div className='flex items-center gap-2'>
              <div className='h-5 bg-gray-200 rounded w-20' />
              <div className='h-4 bg-gray-200 rounded w-16' />
            </div>
          )}
        </div>

        {/* Botón */}
        {showButton && <div className='w-24 h-10 bg-gray-200 rounded-lg flex-shrink-0' />}
      </div>
    )
  }

  // Variante carousel (para carruseles horizontales)
  if (variant === 'grid') {
    return (
      <div
        className={cn(
          'relative rounded-xl bg-white shadow-md flex flex-col w-full',
          'h-[300px] sm:h-[360px] md:h-[450px] lg:h-[500px]',
          'skeleton-loading',
          className
        )}
      >
        {/* Imagen con degradado */}
        <div className='relative w-full flex justify-center items-center overflow-hidden rounded-t-xl mb-1 md:mb-2 flex-1 bg-gray-200'>
          {/* Degradado simulado */}
          <div className='absolute bottom-0 left-0 right-0 h-12 md:h-20 bg-gradient-to-t from-white via-white/80 to-transparent z-10' />
        </div>

        {/* Contenido */}
        <div className='relative z-20 text-left p-1.5 md:p-2 bg-white -mt-2 md:-mt-3 flex-shrink-0 rounded-b-xl md:rounded-b-2xl'>
          {/* Marca */}
          <div className='h-3 bg-gray-200 rounded w-16 mb-0.5' />

          {/* Título - 2 líneas */}
          <div className='space-y-1 mb-1'>
            <div className='h-4 bg-gray-200 rounded w-full' />
            <div className='h-4 bg-gray-200 rounded w-3/4' />
          </div>

          {/* Precio */}
          {showPrice && (
            <div className='flex items-center gap-1 md:gap-2'>
              <div className='h-5 sm:h-6 md:h-7 bg-gray-200 rounded w-20' />
              <div className='h-3 md:h-4 bg-gray-200 rounded w-12' />
            </div>
          )}

          {/* Badges de colores/capacidad */}
          {showBadges && (
            <div className='flex gap-1 mt-2 md:mt-2.5'>
              <div className='h-5 w-5 bg-gray-200 rounded-full' />
              <div className='h-5 w-5 bg-gray-200 rounded-full' />
              <div className='h-5 w-5 bg-gray-200 rounded-full' />
              <div className='h-4 bg-gray-200 rounded-full w-12' />
            </div>
          )}
        </div>
      </div>
    )
  }

  // Variante card estándar (para grids)
  return (
    <div
      className={cn(
        'relative rounded-xl bg-white shadow-md flex flex-col w-full',
        'h-[300px] sm:h-[360px] md:h-[450px] lg:h-[500px]',
        'skeleton-loading',
        className
      )}
    >
      {/* Imagen con degradado */}
      <div className='relative w-full flex justify-center items-center overflow-hidden rounded-t-xl mb-1 md:mb-2 flex-1 bg-gray-200'>
        {/* Degradado simulado */}
        <div className='absolute bottom-0 left-0 right-0 h-12 md:h-20 bg-gradient-to-t from-white via-white/80 to-transparent z-10' />
      </div>

      {/* Contenido */}
      <div className='relative z-20 text-left p-1.5 md:p-2 bg-white -mt-2 md:-mt-3 flex-shrink-0 rounded-b-xl md:rounded-b-2xl'>
        {/* Marca */}
        <div className='h-3 bg-gray-200 rounded w-16 mb-0.5' />

        {/* Título - 2 líneas */}
        <div className='space-y-1 mb-1'>
          <div className='h-4 bg-gray-200 rounded w-full' />
          <div className='h-4 bg-gray-200 rounded w-3/4' />
        </div>

        {/* Precio */}
        {showPrice && (
          <div className='flex items-center gap-1 md:gap-2'>
            <div className='h-5 sm:h-6 md:h-7 bg-gray-200 rounded w-20' />
            <div className='h-3 md:h-4 bg-gray-200 rounded w-12' />
          </div>
        )}

        {/* Badges de colores/capacidad */}
        {showBadges && (
          <div className='flex gap-1 mt-2 md:mt-2.5'>
            <div className='h-5 w-5 bg-gray-200 rounded-full' />
            <div className='h-5 w-5 bg-gray-200 rounded-full' />
            <div className='h-5 w-5 bg-gray-200 rounded-full' />
            <div className='h-4 bg-gray-200 rounded-full w-12' />
          </div>
        )}
      </div>
    </div>
  )
}

// ===================================
// GRID DE SKELETONS
// ===================================

export const ProductSkeletonGrid: React.FC<ProductSkeletonGridProps> = ({
  count = 8,
  className,
  variant = 'card',
}) => {
  return (
    <div
      className={cn(
        'grid gap-4 md:gap-6',
        variant === 'list'
          ? 'grid-cols-1'
          : 'grid-cols-2 md:grid-cols-2 lg:grid-cols-4',
        className
      )}
    >
      {Array.from({ length: count }, (_, index) => (
        <ProductSkeleton
          key={index}
          variant={variant === 'list' ? 'list' : 'card'}
          className={variant === 'list' ? 'max-w-none' : ''}
        />
      ))}
    </div>
  )
}

// ===================================
// SKELETON PARA CAROUSEL HORIZONTAL
// ===================================

export interface ProductSkeletonCarouselProps {
  count?: number
  className?: string
  itemClassName?: string
}

export const ProductSkeletonCarousel: React.FC<ProductSkeletonCarouselProps> = ({
  count = 5,
  className,
  itemClassName,
}) => {
  return (
    <div className={cn('flex gap-4 md:gap-6 overflow-hidden', className)}>
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className={cn(
            'min-w-[calc(50%-0.5rem)] md:min-w-[calc(25%-1.125rem)] flex-shrink-0',
            itemClassName
          )}
        >
          <ProductSkeleton variant='grid' />
        </div>
      ))}
    </div>
  )
}

// ===================================
// SKELETON PARA PÁGINA DE BÚSQUEDA
// ===================================

export const SearchPageSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('min-h-screen bg-gray-50 py-8', className)}>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header skeleton */}
        <div className='mb-8'>
          <div className='flex items-center gap-3 mb-4'>
            <div className='w-6 h-6 bg-gray-200 rounded skeleton-pulse' />
            <div className='h-8 bg-gray-200 rounded w-64 skeleton-pulse' />
          </div>

          <div className='flex items-center justify-between mb-6'>
            <div className='h-4 bg-gray-200 rounded w-48 skeleton-pulse' />
            <div className='h-4 bg-gray-200 rounded w-32 skeleton-pulse' />
          </div>
        </div>

        {/* Filtros skeleton */}
        <div className='flex gap-4 mb-6'>
          <div className='h-10 bg-gray-200 rounded-lg w-32 skeleton-pulse' />
          <div className='h-10 bg-gray-200 rounded-lg w-28 skeleton-pulse' />
          <div className='h-10 bg-gray-200 rounded-lg w-36 skeleton-pulse' />
        </div>

        {/* Grid de productos skeleton */}
        <ProductSkeletonGrid count={12} />

        {/* Paginación skeleton */}
        <div className='flex justify-center mt-8'>
          <div className='flex gap-2'>
            <div className='h-10 w-20 bg-gray-200 rounded skeleton-pulse' />
            <div className='h-10 w-10 bg-gray-200 rounded skeleton-pulse' />
            <div className='h-10 w-10 bg-gray-200 rounded skeleton-pulse' />
            <div className='h-10 w-10 bg-gray-200 rounded skeleton-pulse' />
            <div className='h-10 w-20 bg-gray-200 rounded skeleton-pulse' />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductSkeleton
