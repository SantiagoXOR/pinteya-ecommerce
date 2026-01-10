/**
 * PromoBannerSkeleton
 * 
 * Skeleton para banners promocionales.
 * Altura corregida a 48px (h-12) para coincidir con los banners reales.
 */

import { SkeletonBase } from './skeleton-base'

interface PromoBannerSkeletonProps {
  /** Clases CSS adicionales */
  className?: string
}

export function PromoBannerSkeleton({ className }: PromoBannerSkeletonProps) {
  return (
    <SkeletonBase 
      className={`w-full h-12 rounded-lg mx-4 ${className || ''}`} 
    />
  )
}
