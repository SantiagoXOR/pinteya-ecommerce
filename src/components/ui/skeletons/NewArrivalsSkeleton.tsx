/**
 * NewArrivalsSkeleton
 * 
 * Skeleton para la sección de nuevos productos.
 * Incluye header con icono y título, más grid de productos.
 */

import { SkeletonBase } from './skeleton-base'
import { ProductGridSkeleton } from './ProductGridSkeleton'

interface NewArrivalsSkeletonProps {
  /** Número de productos a mostrar */
  count?: number
}

export function NewArrivalsSkeleton({ count = 8 }: NewArrivalsSkeletonProps) {
  return (
    <section className='overflow-hidden pt-0 pb-6 sm:pb-10 bg-transparent'>
      <div className='max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0 overflow-hidden'>
        {/* Header */}
        <div className='mb-4 sm:mb-6 flex items-center gap-3'>
          <SkeletonBase className='w-10 h-10 rounded-full' />
          <SkeletonBase className='h-6 md:h-7 w-48 rounded' />
        </div>

        <ProductGridSkeleton count={count} />
      </div>
    </section>
  )
}
