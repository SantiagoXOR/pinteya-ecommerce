'use client'

import dynamic from 'next/dynamic'
import React, { useEffect } from 'react'
import { trackScrollDepth } from '@/lib/google-analytics'
import { CategoryFilterProvider } from '@/contexts/CategoryFilterContext'
import { useProgressiveLoading } from '@/hooks/useProgressiveLoading'
import type { PromoBannersProps } from './PromoBanners'

// BenefitsBar eliminado - ahora está integrado en el Header como ScrollingBanner
const HeroCarousel = dynamic(() => import('./HeroCarousel/index'))
const CategoryTogglePillsWithSearch = dynamic(() => import('./CategoryTogglePillsWithSearch'))
const PromoBanners = dynamic<PromoBannersProps>(() => import('./PromoBanners/index'))
const DynamicProductCarousel = dynamic(
  () => import('./DynamicProductCarousel/index').catch((err) => {
    console.error('Error loading DynamicProductCarousel:', err)
    // Retornar un componente de fallback
    return { default: () => null }
  }),
  {
    ssr: false,
    loading: () => (
      <section className='py-4 bg-white'>
        <div className='max-w-7xl mx-auto px-4'>
          <div className='animate-pulse'>
            <div className='flex items-center gap-3 mb-3'>
              <div className='w-[68px] h-[68px] md:w-[84px] md:h-[84px] bg-gray-200 rounded-full'></div>
              <div>
                <div className='h-6 md:h-7 bg-gray-200 rounded w-48 mb-1'></div>
                <div className='h-3 md:h-4 bg-gray-200 rounded w-32'></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    ),
  }
)
const TrendingSearches = dynamic(() => import('./TrendingSearches/index'))
const CombosSection = dynamic(() => import('./CombosSection/index'))
const BestSeller = dynamic(() => import('./BestSeller/index'))
const Testimonials = dynamic(() => import('./Testimonials/index'))
// Componentes below-fold con lazy loading
const NewArrivals = dynamic(() => import('./NewArrivals/index'), {
  loading: () => (
    <section className='overflow-hidden pt-8 sm:pt-12 pb-6 sm:pb-10 bg-transparent'>
      <div className='max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0'>
        <div className='grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6'>
          {[...Array(8)].map((_, index) => (
            <div key={index} className='animate-pulse'>
              <div className='bg-gray-200 h-32 md:h-48 rounded-lg'></div>
            </div>
          ))}
        </div>
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
  const { ref, isVisible } = useProgressiveLoading<HTMLDivElement>({
    rootMargin: '200px',
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
  const { ref, isVisible } = useProgressiveLoading<HTMLDivElement>({
    rootMargin: '300px',
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
      <div className='mt-4 sm:mt-6 product-section'>
        <BestSeller />
      </div>

      {/* 3. Banner PINTURA FLASH DAYS - Con botón "Ver Todos los Productos" */}
      <div className='mt-3 sm:mt-4'>
        <PromoBanners bannerId={1} />
      </div>

      {/* 4. Productos Destacados (Combos) */}
      <div className='mt-4 sm:mt-6 product-section'>
        <CombosSection />
      </div>

      {/* 5. Carrusel Dinámico - Solo Envío Gratis */}
      <div className='mt-4 sm:mt-6 product-section'>
        <DynamicProductCarousel freeShippingOnly={true} />
      </div>

      {/* 6. Banner ASESORAMIENTO GRATIS - Lazy loaded */}
      <div className='mt-4 sm:mt-6 below-fold-content'>
        <LazyPromoBanner bannerId={2} />
      </div>

      {/* 7. Nuevos productos - Lazy loaded */}
      <div className='mt-3 sm:mt-4 product-section'>
        <LazyNewArrivals />
      </div>

      {/* 8. Banner CALCULADORA DE PINTURA - Lazy loaded */}
      <div className='mt-4 sm:mt-6 below-fold-content'>
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

