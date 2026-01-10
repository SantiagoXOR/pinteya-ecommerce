/**
 * ProductGridSkeleton
 * 
 * Grid de ProductCardSkeletons para secciones como BestSeller y NewArrivals.
 * Soporta 2, 3 o 4 columnas con responsive design.
 */

import { cn } from '@/lib/utils'
import { ProductCardSkeleton } from './ProductCardSkeleton'

interface ProductGridSkeletonProps {
  /** Número de skeletons a mostrar */
  count?: number
  /** Clases CSS adicionales */
  className?: string
  /** Número de columnas en desktop */
  columns?: 2 | 3 | 4
  /** Mostrar badges de colores/medidas */
  showBadges?: boolean
}

export function ProductGridSkeleton({ 
  count = 8, 
  className, 
  columns = 4,
  showBadges = true,
}: ProductGridSkeletonProps) {
  const colClasses = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-2 lg:grid-cols-4',
  }
  
  return (
    <div className={cn('grid gap-4 md:gap-6', colClasses[columns], className)}>
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} showBadges={showBadges} />
      ))}
    </div>
  )
}
