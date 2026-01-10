/**
 * DynamicCarouselSkeleton
 * 
 * Skeleton para DynamicProductCarousel con header (icono + título).
 * Usa animación consistente con SkeletonBase.
 */

import { SkeletonBase } from './skeleton-base'
import { ProductCarouselSkeleton } from './ProductCarouselSkeleton'

interface DynamicCarouselSkeletonProps {
  /** Mostrar header con icono y título */
  showHeader?: boolean
  /** Número de productos en el carousel */
  productCount?: number
}

export function DynamicCarouselSkeleton({ 
  showHeader = true,
  productCount = 5,
}: DynamicCarouselSkeletonProps) {
  return (
    <section className='py-4 bg-white category-transition overflow-hidden'>
      <div className='max-w-7xl mx-auto px-4'>
        {showHeader && (
          <div className='flex items-center gap-3 mb-3'>
            {/* Icono de categoría */}
            <SkeletonBase className='w-[68px] h-[68px] md:w-[84px] md:h-[84px] rounded-full' />
            
            {/* Título y subtítulo */}
            <div className='flex flex-col gap-1'>
              <SkeletonBase className='h-6 md:h-7 w-48 rounded' />
              <SkeletonBase className='h-3 md:h-4 w-32 rounded' />
            </div>
          </div>
        )}
        
        <ProductCarouselSkeleton count={productCount} />
      </div>
    </section>
  )
}
