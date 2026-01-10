/**
 * TrendingSearchesSkeleton
 * 
 * Skeleton para la sección de búsquedas populares.
 * Usa scroll horizontal (overflow-x-auto) en lugar de flex-wrap.
 */

import { SkeletonBase } from './skeleton-base'

interface TrendingSearchesSkeletonProps {
  /** Número de chips a mostrar */
  count?: number
}

export function TrendingSearchesSkeleton({ count = 8 }: TrendingSearchesSkeletonProps) {
  return (
    <section className='py-8 border-b border-white/10'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='flex items-center gap-2 mb-5'>
          <SkeletonBase className='h-5 w-5 rounded' />
          <SkeletonBase className='h-6 w-40 rounded' />
        </div>
        
        {/* Chips con scroll horizontal */}
        <div className='flex gap-2 overflow-x-auto scrollbar-hide'>
          {Array.from({ length: count }).map((_, i) => (
            <SkeletonBase 
              key={i} 
              className='h-8 w-24 rounded-full flex-shrink-0' 
            />
          ))}
        </div>
      </div>
    </section>
  )
}
