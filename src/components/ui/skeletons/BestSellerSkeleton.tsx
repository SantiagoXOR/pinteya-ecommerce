/**
 * BestSellerSkeleton
 * 
 * Skeleton para la sección BestSeller de la home.
 * Usa ProductGridSkeleton con 4 productos en grid (NO carousel).
 */

import { ProductGridSkeleton } from './ProductGridSkeleton'

export function BestSellerSkeleton() {
  return (
    <section className='overflow-x-hidden py-1 sm:py-1.5 bg-transparent'>
      <div className='max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-8'>
        <ProductGridSkeleton count={4} columns={4} />
      </div>
    </section>
  )
}
