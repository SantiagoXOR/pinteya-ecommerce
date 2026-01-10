/**
 * ProductCardSkeleton
 * 
 * Skeleton que coincide exactamente con CommercialProductCard.
 * Alturas corregidas para evitar CLS:
 * - Mobile: min-h-[280px]
 * - sm: min-h-[320px]
 * - md: h-[400px]
 * - lg: h-[440px]
 */

import { cn } from '@/lib/utils'
import { SkeletonBase } from './skeleton-base'

interface ProductCardSkeletonProps {
  className?: string
  showBadges?: boolean
  showShippingBadge?: boolean
  showCartButton?: boolean
}

export function ProductCardSkeleton({ 
  className, 
  showBadges = true,
  showShippingBadge = true,
  showCartButton = true,
}: ProductCardSkeletonProps) {
  return (
    <div
      className={cn(
        'relative flex flex-col w-full bg-white overflow-hidden',
        'rounded-xl md:rounded-[1.5rem]',
        'min-h-[280px] sm:min-h-[320px] md:h-[400px] lg:h-[440px]',
        'shadow-sm border border-gray-100',
        className
      )}
    >
      {/* Badge envio gratis placeholder */}
      {showShippingBadge && (
        <SkeletonBase 
          className='absolute left-2 md:left-3 top-2 md:top-2.5 z-30 h-6 sm:h-7 md:h-8 w-8 sm:w-9 md:w-10' 
        />
      )}

      {/* Imagen */}
      <div className='relative flex-[1.8] min-h-[150px] sm:min-h-[180px] md:min-h-[55%]'>
        <SkeletonBase className='absolute inset-0 rounded-t-xl md:rounded-t-[1.5rem]' />
        
        {/* Boton carrito circular */}
        {showCartButton && (
          <SkeletonBase 
            className='absolute bottom-2 right-2 md:bottom-3 md:right-3 z-20 w-9 h-9 md:w-11 md:h-11 rounded-full bg-gray-300' 
          />
        )}
      </div>

      {/* Contenido */}
      <div className='px-3 sm:px-4 md:px-5 pt-2 pb-2'>
        {/* Marca */}
        <SkeletonBase className='h-3 w-16 mb-1' />
        
        {/* Titulo - 2 lineas */}
        <div className='space-y-1 mb-2'>
          <SkeletonBase className='h-4 w-full' />
          <SkeletonBase className='h-4 w-3/4' />
        </div>
        
        {/* Precio */}
        <div className='flex items-center gap-2 mb-2'>
          <SkeletonBase className='h-6 md:h-7 w-20' />
          <SkeletonBase className='h-4 w-14' />
        </div>
        
        {/* Pills de colores/medidas */}
        {showBadges && (
          <div className='flex gap-1.5'>
            <SkeletonBase className='h-5 w-5 rounded-full' />
            <SkeletonBase className='h-5 w-5 rounded-full' />
            <SkeletonBase className='h-5 w-5 rounded-full' />
            <SkeletonBase className='h-5 w-12 rounded-full' />
          </div>
        )}
      </div>
    </div>
  )
}
