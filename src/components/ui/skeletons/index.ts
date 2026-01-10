/**
 * Skeletons - Barrel Export
 * 
 * Exporta todos los componentes skeleton desde un punto central.
 * Esto permite imports limpios como:
 * 
 * import { ProductCardSkeleton, BestSellerSkeleton } from '@/components/ui/skeletons'
 */

// Base components
export { 
  SkeletonBase, 
  SkeletonText, 
  SkeletonCircle,
  SkeletonRect,
} from './skeleton-base'

// Product skeletons
export { ProductCardSkeleton } from './ProductCardSkeleton'
export { ProductGridSkeleton } from './ProductGridSkeleton'
export { ProductCarouselSkeleton } from './ProductCarouselSkeleton'

// Home section skeletons
export { BestSellerSkeleton } from './BestSellerSkeleton'
export { CategoryPillsSkeleton } from './CategoryPillsSkeleton'
export { PromoBannerSkeleton } from './PromoBannerSkeleton'
export { TrendingSearchesSkeleton } from './TrendingSearchesSkeleton'
export { TestimonialsSkeleton } from './TestimonialsSkeleton'
export { DynamicCarouselSkeleton } from './DynamicCarouselSkeleton'
export { NewArrivalsSkeleton } from './NewArrivalsSkeleton'
