/**
 * ProductCarouselSkeleton
 * 
 * Skeleton para carruseles horizontales de productos.
 * Usado en DynamicProductCarousel y secciones con scroll horizontal.
 */

import { cn } from '@/lib/utils'
import { ProductCardSkeleton } from './ProductCardSkeleton'

interface ProductCarouselSkeletonProps {
  /** Número de skeletons a mostrar */
  count?: number
  /** Clases CSS adicionales */
  className?: string
  /** Clases para cada item del carousel */
  itemClassName?: string
}

export function ProductCarouselSkeleton({ 
  count = 5, 
  className,
  itemClassName,
}: ProductCarouselSkeletonProps) {
  return (
    <div className={cn('flex gap-4 md:gap-6 overflow-hidden', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'w-[calc(50%-0.5rem)] md:w-[calc(50%-0.75rem)] lg:w-[calc(25%-0.75rem)] flex-shrink-0',
            itemClassName
          )}
        >
          <ProductCardSkeleton />
        </div>
      ))}
    </div>
  )
}
