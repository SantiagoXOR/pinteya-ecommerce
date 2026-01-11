import { BestSellerClient } from './BestSellerClient'
import type { Product } from '@/types/product'

interface BestSellerSectionProps {
  products: Product[]
  className?: string
}

/**
 * BestSellerSection - Server Component wrapper
 * Pasa productos pre-fetched al componente Client Component para interactividad
 */
export function BestSellerSection({ products, className }: BestSellerSectionProps) {
  return (
    <section className={`mt-4 sm:mt-6 product-section ${className || ''}`}>
      <BestSellerClient initialProducts={products} />
    </section>
  )
}
