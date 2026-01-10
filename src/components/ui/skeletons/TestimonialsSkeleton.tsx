/**
 * TestimonialsSkeleton
 * 
 * Skeleton para la sección de testimonios.
 * Altura reducida para coincidir con CompactSlider (~120px).
 */

import { SkeletonBase } from './skeleton-base'

export function TestimonialsSkeleton() {
  return (
    <section className='py-4'>
      <div className='max-w-4xl w-full mx-auto px-4'>
        {/* Título */}
        <SkeletonBase className='h-4 w-32 mx-auto mb-6 rounded' />
        
        {/* Testimonio card */}
        <div className='bg-gray-50 rounded-xl p-6'>
          {/* Avatar y nombre */}
          <div className='flex items-center gap-3 mb-4'>
            <SkeletonBase className='w-10 h-10 rounded-full' />
            <div className='space-y-2'>
              <SkeletonBase className='h-4 w-24 rounded' />
              <SkeletonBase className='h-3 w-16 rounded' />
            </div>
          </div>
          
          {/* Texto del testimonio */}
          <div className='space-y-2'>
            <SkeletonBase className='h-4 w-full rounded' />
            <SkeletonBase className='h-4 w-3/4 rounded' />
          </div>
        </div>
      </div>
    </section>
  )
}
