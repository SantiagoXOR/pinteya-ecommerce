/**
 * Componente especializado para lazy loading de PromoBanner
 * 
 * Maneja rootMargin dinámico según bannerId (300px para bannerId === 2, 200px para otros)
 */

'use client'

import React, { memo, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useUnifiedLazyLoading } from '@/hooks/useUnifiedLazyLoading'
import { getPromoBannerRootMargin, PROMO_BANNER_CONFIG } from '@/config/lazy-loading.config'
import type { PromoBannersProps } from '@/components/Home/PromoBanners'
import { PromoBannerSkeleton } from '@/components/ui/skeletons'

// Lazy load de PromoBanners
const PromoBanners = dynamic<PromoBannersProps>(() => import('@/components/Home/PromoBanners/index'), {
  loading: () => <PromoBannerSkeleton />,
})

export interface LazyPromoBannerProps {
  /** ID del banner */
  bannerId: number
  /** Clases CSS adicionales */
  className?: string
  /** Estilos inline adicionales */
  style?: React.CSSProperties
}

/**
 * Componente especializado para lazy loading de PromoBanner
 * 
 * @example
 * <LazyPromoBanner bannerId={2} />
 */
export const LazyPromoBanner = memo<LazyPromoBannerProps>(({
  bannerId,
  className,
  style,
}) => {
  // Obtener rootMargin dinámico según bannerId
  const rootMargin = getPromoBannerRootMargin(bannerId)
  
  // Usar hook unificado de lazy loading
  const { ref, isVisible } = useUnifiedLazyLoading<HTMLDivElement>({
    strategy: 'viewport',
    rootMargin,
    threshold: 0.01,
  })
  
  // Memoizar contenido para evitar re-renders innecesarios
  const content = useMemo(() => {
    return isVisible ? <PromoBanners bannerId={bannerId} /> : <PromoBannerSkeleton />
  }, [isVisible, bannerId])
  
  // Calcular minHeight para prevenir CLS
  const minHeightStyle = useMemo(() => {
    const config = bannerId === 2 ? PROMO_BANNER_CONFIG.priority : PROMO_BANNER_CONFIG.default
    return {
      ...style,
      minHeight: isVisible ? 'auto' : config.minHeight,
    }
  }, [isVisible, bannerId, style])
  
  return (
    <div 
      ref={ref} 
      className={className}
      style={minHeightStyle}
    >
      {content}
    </div>
  )
})

LazyPromoBanner.displayName = 'LazyPromoBanner'
