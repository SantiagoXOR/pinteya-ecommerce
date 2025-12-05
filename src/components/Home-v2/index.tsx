'use client'

import dynamic from 'next/dynamic'
import React, { useEffect } from 'react'
import { trackScrollDepth } from '@/lib/google-analytics'
import { CategoryFilterProvider } from '@/contexts/CategoryFilterContext'
import { useProgressiveLoading } from '@/hooks/useProgressiveLoading'
import type { PromoBannersProps } from './PromoBanners'
import { ProductSkeletonGrid, ProductSkeletonCarousel } from '@/components/ui/product-skeleton'

// BenefitsBar eliminado - ahora está integrado en el Header como ScrollingBanner
// ⚡ PERFORMANCE: Loading states para componentes críticos
const HeroCarousel = dynamic(() => import('./HeroCarousel/index'), {
  loading: () => (
    <div className='w-full h-[320px] md:h-[500px] bg-gradient-to-r from-orange-500 to-orange-600 animate-pulse' />
  ),
})

const CategoryTogglePillsWithSearch = dynamic(() => import('./CategoryTogglePillsWithSearch'), {
  loading: () => (
    <div className='flex gap-2 px-4 overflow-x-auto'>
      {[...Array(5)].map((_, i) => (
        <div key={i} className='h-8 w-24 bg-gray-200 rounded-full animate-pulse flex-shrink-0' />
      ))}
    </div>
  ),
})

const PromoBanners = dynamic<PromoBannersProps>(() => import('./PromoBanners/index'), {
  loading: () => (
    <div className='w-full h-32 md:h-48 bg-gray-200 animate-pulse rounded-lg mx-4' />
  ),
})

const DynamicProductCarousel = dynamic(() => import('./DynamicProductCarousel/index'), {
  loading: () => (
    <div className='px-4'>
      <div className='h-8 w-48 bg-gray-200 rounded animate-pulse mb-4' />
      <ProductSkeletonCarousel count={4} />
    </div>
  ),
})

const TrendingSearches = dynamic(() => import('./TrendingSearches/index'), {
  loading: () => (
    <div className='px-4'>
      <div className='h-8 w-40 bg-gray-200 rounded animate-pulse mb-4' />
      <div className='flex flex-wrap gap-2'>
        {[...Array(6)].map((_, i) => (
          <div key={i} className='h-8 w-24 bg-gray-200 rounded-full animate-pulse' />
        ))}
      </div>
    </div>
  ),
})

const CombosSection = dynamic(() => import('./CombosSection/index'), {
  loading: () => (
    <div className='px-4'>
      <ProductSkeletonGrid count={4} />
    </div>
  ),
})

const BestSeller = dynamic(() => import('./BestSeller/index'), {
  loading: () => (
    <div className='px-4'>
      <ProductSkeletonGrid count={4} />
    </div>
  ),
})

const Testimonials = dynamic(() => import('./Testimonials/index'), {
  loading: () => (
    <div className='px-4'>
      <div className='h-8 w-40 bg-gray-200 rounded animate-pulse mb-4' />
      <div className='flex gap-4 overflow-x-auto'>
        {[...Array(3)].map((_, i) => (
          <div key={i} className='w-80 h-48 bg-gray-200 rounded-lg animate-pulse flex-shrink-0' />
        ))}
      </div>
    </div>
  ),
})
// Componentes below-fold con lazy loading
const NewArrivals = dynamic(() => import('./NewArrivals/index'), {
  loading: () => (
    <section className='overflow-hidden pt-8 sm:pt-12 pb-6 sm:pb-10 bg-transparent'>
      <div className='max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0'>
        <ProductSkeletonGrid count={8} />
      </div>
    </section>
  ),
})
// Componentes flotantes con carga diferida
// FloatingCart: cargar después de 2 segundos
const FloatingCart = dynamic(() => import('@/components/Common/FloatingCart'), {
  ssr: false,
})

// FloatingWhatsApp: cargar después de 5 segundos
const FloatingWhatsApp = dynamic(() => import('@/components/Common/FloatingWhatsApp'), {
  ssr: false,
})

// WhatsAppPopup: mantener delay actual pero usar dynamic import con ssr: false
const WhatsAppPopup = dynamic(() => import('@/components/Common/WhatsAppPopup'), {
  ssr: false,
})

// Wrapper para componentes flotantes con carga diferida - Memoizados
const DelayedFloatingCart = React.memo(() => {
  const [shouldLoad, setShouldLoad] = React.useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldLoad(true)
    }, 2000) // 2 segundos

    return () => clearTimeout(timer)
  }, [])

  // Memoizar para evitar re-renders innecesarios
  return React.useMemo(() => {
    return shouldLoad ? <FloatingCart /> : null
  }, [shouldLoad])
})
DelayedFloatingCart.displayName = 'DelayedFloatingCart'

const DelayedFloatingWhatsApp = React.memo(() => {
  const [shouldLoad, setShouldLoad] = React.useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldLoad(true)
    }, 5000) // 5 segundos

    return () => clearTimeout(timer)
  }, [])

  // Memoizar para evitar re-renders innecesarios
  return React.useMemo(() => {
    return shouldLoad ? <FloatingWhatsApp /> : null
  }, [shouldLoad])
})
DelayedFloatingWhatsApp.displayName = 'DelayedFloatingWhatsApp'


// Wrapper para componentes below-fold con lazy loading - Memoizados para evitar re-renders
const LazyPromoBanner = React.memo(({ bannerId }: { bannerId: number }) => {
  // Banner más importante (bannerId 2) tiene más rootMargin para cargar antes
  const rootMargin = bannerId === 2 ? '300px' : '200px'
  const { ref, isVisible } = useProgressiveLoading<HTMLDivElement>({
    rootMargin,
    threshold: 0.01,
  })

  // Usar useMemo para evitar re-crear el componente en cada render
  const content = React.useMemo(() => {
    return isVisible ? <PromoBanners bannerId={bannerId} /> : null
  }, [isVisible, bannerId])

  return (
    <div ref={ref} style={{ minHeight: isVisible ? 'auto' : '1px' }}>
      {content}
    </div>
  )
})
LazyPromoBanner.displayName = 'LazyPromoBanner'

const LazyNewArrivals = React.memo(() => {
  // NewArrivals es importante, cargar con más anticipación
  const { ref, isVisible } = useProgressiveLoading<HTMLDivElement>({
    rootMargin: '400px',
    threshold: 0.01,
  })

  const content = React.useMemo(() => {
    return isVisible ? <NewArrivals /> : null
  }, [isVisible])

  return (
    <div ref={ref} style={{ minHeight: isVisible ? 'auto' : '1px' }}>
      {content}
    </div>
  )
})
LazyNewArrivals.displayName = 'LazyNewArrivals'

const LazyTrendingSearches = React.memo(() => {
  const { ref, isVisible } = useProgressiveLoading<HTMLDivElement>({
    rootMargin: '200px',
    threshold: 0.01,
  })

  const content = React.useMemo(() => {
    return isVisible ? <TrendingSearches /> : null
  }, [isVisible])

  return (
    <div ref={ref} style={{ minHeight: isVisible ? 'auto' : '1px' }}>
      {content}
    </div>
  )
})
LazyTrendingSearches.displayName = 'LazyTrendingSearches'

const LazyTestimonials = React.memo(() => {
  const { ref, isVisible } = useProgressiveLoading<HTMLDivElement>({
    rootMargin: '200px',
    threshold: 0.01,
  })

  const content = React.useMemo(() => {
    return isVisible ? <Testimonials /> : null
  }, [isVisible])

  return (
    <div ref={ref} style={{ minHeight: isVisible ? 'auto' : '1px' }}>
      {content}
    </div>
  )
})
LazyTestimonials.displayName = 'LazyTestimonials'

const LazyBestSeller = React.memo(() => {
  // BestSeller es importante pero puede cargar después del hero y categorías
  const { ref, isVisible } = useProgressiveLoading<HTMLDivElement>({
    rootMargin: '100px', // Cargar poco después de que entre al viewport
    threshold: 0.01,
  })

  const content = React.useMemo(() => {
    return isVisible ? <BestSeller /> : null
  }, [isVisible])

  return (
    <div ref={ref} className='mt-4 sm:mt-6 product-section' style={{ minHeight: isVisible ? 'auto' : '1px' }}>
      {content}
    </div>
  )
})
LazyBestSeller.displayName = 'LazyBestSeller'

const HomeV2 = () => {
  // Scroll depth tracking - Optimizado con requestAnimationFrame para evitar re-renders
  useEffect(() => {
    let maxDepth = 0
    const trackingThresholds = [25, 50, 75, 100]
    const trackedDepths = new Set<number>()
    let ticking = false

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const windowHeight = window.innerHeight
          const documentHeight = document.documentElement.scrollHeight
          const scrollTop = window.scrollY

          const scrollPercentage = Math.round(
            ((scrollTop + windowHeight) / documentHeight) * 100
          )

          if (scrollPercentage > maxDepth) {
            maxDepth = scrollPercentage
          }

          // Trackear cada threshold una sola vez
          trackingThresholds.forEach(threshold => {
            if (scrollPercentage >= threshold && !trackedDepths.has(threshold)) {
              trackedDepths.add(threshold)
              trackScrollDepth(threshold, window.location.pathname)
            }
          })

          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <CategoryFilterProvider>
      <main className='min-h-screen'>
        {/* BenefitsBar eliminado - ahora está integrado en el Header como ScrollingBanner */}

      {/* NUEVO ORDEN OPTIMIZADO */}

      {/* 0. Hero Carousel - Primer elemento después del header */}
      <div className='pt-3 sm:pt-4 md:pt-6'>
        <HeroCarousel />
      </div>

      {/* 1. Navegación rápida por categorías - Espaciado mínimo */}
      <div className='mt-2 sm:mt-3'>
        <CategoryTogglePillsWithSearch />
      </div>

      {/* 2. Ofertas Especiales (BestSeller) - Ahora con filtro de categorías */}
      <LazyBestSeller />

      {/* 3. Banner PINTURA FLASH DAYS - Con botón "Ver Todos los Productos" */}
      <div className='mt-3 sm:mt-4' style={{ aspectRatio: '16/2', minHeight: '120px' }}> {/* ⚡ CLS FIX: aspect-ratio + minHeight para evitar layout shift */}
        <PromoBanners bannerId={1} />
      </div>

      {/* 4. Productos Destacados (Combos) */}
      <div className='mt-4 sm:mt-6 product-section' style={{ aspectRatio: '16/9', minHeight: '400px' }}> {/* ⚡ CLS FIX: aspect-ratio + minHeight para evitar layout shift */}
        <CombosSection />
      </div>

      {/* 5. Carrusel Dinámico - Solo Envío Gratis */}
      <div className='mt-4 sm:mt-6 product-section' style={{ aspectRatio: '16/9', minHeight: '350px' }}> {/* ⚡ CLS FIX: aspect-ratio + minHeight para evitar layout shift */}
        <DynamicProductCarousel freeShippingOnly={true} />
      </div>

      {/* 6. Banner ASESORAMIENTO GRATIS - Lazy loaded */}
      <div className='mt-4 sm:mt-6 below-fold-content' style={{ aspectRatio: '16/2', minHeight: '120px' }}> {/* ⚡ CLS FIX: aspect-ratio para evitar layout shift */}
        <LazyPromoBanner bannerId={2} />
      </div>

      {/* 7. Nuevos productos - Lazy loaded */}
      <div className='mt-3 sm:mt-4 product-section' style={{ aspectRatio: '16/10', minHeight: '500px' }}> {/* ⚡ CLS FIX: aspect-ratio + minHeight para evitar layout shift */}
        <LazyNewArrivals />
      </div>

      {/* 8. Banner CALCULADORA DE PINTURA - Lazy loaded */}
      <div className='mt-4 sm:mt-6 below-fold-content' style={{ aspectRatio: '16/2', minHeight: '120px' }}> {/* ⚡ CLS FIX: aspect-ratio para evitar layout shift */}
        <LazyPromoBanner bannerId={3} />
      </div>

      {/* 9. Búsquedas Populares - Lazy loaded */}
      <div className='mt-6 sm:mt-8 below-fold-content'>
        <LazyTrendingSearches />
      </div>

      {/* 10. Trust signals y testimonios - Lazy loaded */}
      <div className='mt-6 sm:mt-8 testimonials-section'>
        <LazyTestimonials />
      </div>

      {/* Elementos flotantes de engagement - Carga diferida */}
      <DelayedFloatingCart />
      <DelayedFloatingWhatsApp />
      {/* <ExitIntentModal /> */} {/* Desactivado - Solo WhatsAppPopup activo para evitar sobrecarga de popups */}
      
      {/* WhatsApp Popup para captura de leads - Rediseñado con paleta Pinteya */}
      <WhatsAppPopup />
      </main>
    </CategoryFilterProvider>
  )
}

export default HomeV2

