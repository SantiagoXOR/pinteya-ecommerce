/**
 * CategoryPillsSkeleton
 * 
 * Skeleton para las pills de categorías con scroll horizontal.
 * Coincide con la estructura de CategoryTogglePills:
 * - Mobile: círculos con texto debajo
 * - Desktop: pills con icono + texto
 */

import { SkeletonBase } from './skeleton-base'
import { cn } from '@/lib/utils'

interface CategoryPillsSkeletonProps {
  /** Número de pills a mostrar */
  count?: number
  /** Clases CSS adicionales */
  className?: string
}

export function CategoryPillsSkeleton({ 
  count = 8,
  className,
}: CategoryPillsSkeletonProps) {
  return (
    <section className={cn('bg-transparent py-0 w-full overflow-hidden', className)}>
      <div className='relative w-full'>
        {/* Contenedor de pills con scroll horizontal */}
        <div
          className='flex items-start md:items-center gap-3 sm:gap-4 md:gap-2 overflow-x-auto py-1 px-4 md:px-6 flex-nowrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden w-full md:justify-center'
          style={{
            willChange: 'scroll-position',
            transform: 'translateZ(0)',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {Array.from({ length: count }).map((_, i) => (
            <div 
              key={i} 
              className='flex flex-col items-center gap-1.5 flex-shrink-0 md:flex-row md:gap-0'
            >
              {/* Mobile: Círculo simple */}
              <SkeletonBase 
                className={cn(
                  'rounded-full flex-shrink-0',
                  'w-14 h-14 sm:w-16 sm:h-16',
                  'md:hidden'
                )}
              />
              
              {/* Desktop: Pill con icono + texto */}
              <div className='hidden md:flex items-center gap-1.5 rounded-full px-3.5 h-11 min-w-[100px] bg-gray-200 animate-pulse'>
                {/* Icono circular */}
                <div className='w-10 h-10 rounded-full bg-gray-300 flex-shrink-0' />
                {/* Texto */}
                <div className='h-4 w-16 rounded bg-gray-300 flex-shrink-0' />
              </div>
              
              {/* Texto debajo (solo mobile) */}
              <SkeletonBase 
                className='h-3 w-12 rounded md:hidden' 
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
