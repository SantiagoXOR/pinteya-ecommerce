/**
 * CategoryPillsSkeleton
 * 
 * Skeleton para las pills de categorías con scroll horizontal.
 */

import { SkeletonBase } from './skeleton-base'

interface CategoryPillsSkeletonProps {
  /** Número de pills a mostrar */
  count?: number
  /** Clases CSS adicionales */
  className?: string
}

export function CategoryPillsSkeleton({ 
  count = 6,
  className,
}: CategoryPillsSkeletonProps) {
  return (
    <div className={`flex gap-2 px-4 overflow-x-auto scrollbar-hide ${className || ''}`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonBase 
          key={i} 
          className='h-8 w-24 rounded-full flex-shrink-0' 
        />
      ))}
    </div>
  )
}
