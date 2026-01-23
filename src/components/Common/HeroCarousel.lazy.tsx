/**
 * MULTITENANT: Lazy-loaded version de HeroCarousel
 * Fase 2: Optimización Performance Lighthouse
 * 
 * Carga Swiper solo cuando es visible usando Intersection Observer
 */

'use client'

import React from 'react'
import { createTenantLazyComponent, useLazyOnVisible } from '@/lib/performance/lazy-tenant-components'
import type { HeroCarouselProps } from './HeroCarousel'

// MULTITENANT: Lazy load del componente HeroCarousel completo
const LazyHeroCarousel = createTenantLazyComponent<HeroCarouselProps>(
  () => import('./HeroCarousel'),
  {
    fallbackMessage: 'Cargando carrusel...',
    ssr: false,
  }
)

/**
 * MULTITENANT: Wrapper que carga HeroCarousel solo cuando es visible
 */
export default function HeroCarouselLazy(props: HeroCarouselProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [shouldLoad, setShouldLoad] = React.useState(false)

  // MULTITENANT: Cargar cuando el componente es visible (200px antes)
  const { isVisible } = useLazyOnVisible<HTMLDivElement>(
    () => {
      setShouldLoad(true)
    },
    {
      rootMargin: '200px', // Preload 200px antes de que sea visible
      threshold: 0.1,
    }
  )

  // MULTITENANT: Si es la primera imagen (LCP candidate), cargar inmediatamente
  React.useEffect(() => {
    if (props.images?.[0]?.priority) {
      setShouldLoad(true)
    }
  }, [props.images])

  if (!shouldLoad) {
    // MULTITENANT: Placeholder con colores del tenant mientras carga
    return (
      <div
        ref={containerRef}
        style={{
          minHeight: '400px',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        aria-label="Cargando carrusel de imágenes"
      >
        {/* Placeholder será renderizado por TenantFallback */}
      </div>
    )
  }

  return <LazyHeroCarousel {...props} />
}
