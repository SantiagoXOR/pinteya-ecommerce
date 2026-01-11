'use client'

import React, { useEffect } from 'react'
import dynamic from 'next/dynamic'
import { trackScrollDepth } from '@/lib/google-analytics'
import { CategoryFilterProvider } from '@/contexts/CategoryFilterContext'
import { usePerformance } from '@/contexts/PerformanceContext'
import { useBreakpoint } from '@/contexts/BreakpointContext'
import { useLCPDetection } from '@/hooks/useLCPDetection'
import type { PromoBannersProps } from './PromoBanners'
import {
  BestSellerSkeleton,
  CategoryPillsSkeleton,
  PromoBannerSkeleton,
  TrendingSearchesSkeleton,
  TestimonialsSkeleton,
  DynamicCarouselSkeleton,
  NewArrivalsSkeleton,
} from '@/components/ui/skeletons'
// ⚡ REFACTOR: Sistema unificado de lazy loading
import { LazySection, LazyDeferred, LazyPromoBanner } from '@/components/lazy'
import { getLazyDelay } from '@/config/lazy-loading.config'
// ⚡ FASE 1B: BestSeller diferido con ssr: false para reducir main thread work
const BestSeller = dynamic(() => import('./BestSeller/index'), {
  ssr: false, // ⚡ OPTIMIZACIÓN: No SSR para reducir main thread work
  loading: () => <BestSellerSkeleton />,
})

// ⚡ PERFORMANCE: HeroOptimized renderiza imagen estática inicial y carga carousel después del FCP
import HeroOptimized from './HeroOptimized'

const CategoryTogglePillsWithSearch = dynamic(() => import('./CategoryTogglePillsWithSearch'), {
  loading: () => <CategoryPillsSkeleton />,
})

const PromoBanners = dynamic<PromoBannersProps>(() => import('./PromoBanners/index'), {
  loading: () => <PromoBannerSkeleton />,
})

const DynamicProductCarousel = dynamic(() => import('./DynamicProductCarousel/index'), {
  loading: () => <DynamicCarouselSkeleton />,
})

const TrendingSearches = dynamic(() => import('./TrendingSearches/index'), {
  loading: () => <TrendingSearchesSkeleton />,
})

// ⚡ OPTIMIZACIÓN: Usar CombosOptimized (igual que HeroOptimized) para mejor LCP
import CombosOptimized from './CombosOptimized'

const Testimonials = dynamic(() => import('./Testimonials/index'), {
  ssr: false, // ⚡ OPTIMIZACIÓN: No SSR para componentes below-fold
  loading: () => <TestimonialsSkeleton />,
})
// ⚡ OPTIMIZACIÓN: Componentes below-fold con lazy loading más agresivo
// Usar ssr: false para componentes que no necesitan SSR
const NewArrivals = dynamic(() => import('./NewArrivals/index'), {
  ssr: false, // ⚡ OPTIMIZACIÓN: No SSR para componentes below-fold
  loading: () => <NewArrivalsSkeleton />,
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

const Home = () => {
  // ⚡ OPTIMIZACIÓN: Usar contextos compartidos para evitar múltiples llamadas a hooks
  const { isLowPerformance, isMediumPerformance } = usePerformance()
  const { isMobile, isDesktop } = useBreakpoint()
  
  // ⚡ FASE 1B: Detectar LCP para diferir componentes no críticos después del LCP
  const { shouldLoad: shouldLoadAfterLCP } = useLCPDetection({
    delayAfterLCP: 1000, // Cargar 1s después del LCP
    maxWaitTime: 3000, // Fallback después de 3s
    useIdleCallback: true,
  })
  
  // ⚡ OPTIMIZACIÓN: Memoizar delays para evitar recálculos y re-renders
  // Estos valores solo cambian cuando cambian las dependencias (shouldLoadAfterLCP, isLowPerformance, etc.)
  const categoryToggleDelay = React.useMemo(() => {
    if (shouldLoadAfterLCP) return 0
    const shouldDelay = isLowPerformance || isMediumPerformance || isMobile
    return shouldDelay ? 2000 : 0
  }, [shouldLoadAfterLCP, isLowPerformance, isMediumPerformance, isMobile])

  const bestSellerDelay = React.useMemo(() => {
    if (shouldLoadAfterLCP) return 0
    const shouldDelay = isLowPerformance || isMediumPerformance || isMobile
    return shouldDelay ? 3000 : 0
  }, [shouldLoadAfterLCP, isLowPerformance, isMediumPerformance, isMobile])

  // ⚡ OPTIMIZACIÓN: Scroll depth tracking con IntersectionObserver (más eficiente que scroll events)
  useEffect(() => {
    // Guardar SSR/hidratación: evitar acceder a window/document en servidor
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return
    }

    const trackingThresholds = [25, 50, 75, 100]
    const trackedDepths = new Set<number>()

    // Crear markers invisibles en el documento para cada threshold
    const markers: HTMLDivElement[] = []
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const threshold = parseInt(entry.target.getAttribute('data-threshold') || '0', 10)
            if (!trackedDepths.has(threshold)) {
              trackedDepths.add(threshold)
              trackScrollDepth(threshold, window.location.pathname)
            }
          }
        })
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.01,
      }
    )

    // Calcular posiciones de los markers
    const windowHeight = window.innerHeight
    const documentHeight = document.documentElement.scrollHeight
    const scrollableHeight = Math.max(documentHeight - windowHeight, 1)

    trackingThresholds.forEach((threshold) => {
      const marker = document.createElement('div')
      marker.setAttribute('data-threshold', threshold.toString())
      marker.style.position = 'absolute'
      marker.style.top = `${(threshold / 100) * scrollableHeight}px`
      marker.style.height = '1px'
      marker.style.width = '1px'
      marker.style.pointerEvents = 'none'
      marker.style.visibility = 'hidden'
      document.body.appendChild(marker)
      markers.push(marker)
      observer.observe(marker)
    })

    // Cleanup
    return () => {
      observer.disconnect()
      markers.forEach((marker) => {
        if (marker.parentNode) {
          marker.parentNode.removeChild(marker)
        }
      })
    }
  }, [])

  return (
    <CategoryFilterProvider>
      <main className='min-h-screen'>
        {/* BenefitsBar eliminado - ahora está integrado en el Header como ScrollingBanner */}

      {/* NUEVO ORDEN OPTIMIZADO CON GLASSMORPHISM */}

      {/* 0. Hero Optimized - Imagen estática inicial, carousel después del FCP */}
      {/* ⚡ FASE 23: Contenedor hero-lcp-container con imagen estática y carousel */}
      {/* La imagen estática se renderiza en HTML inicial para descubrimiento temprano y LCP óptimo */}
      {/* Mobile: full width */}
      {/* ⚡ FIX: Usar estado isDesktop con breakpoint más tolerante (1000px) en lugar de lg:hidden (1024px) */}
      {!isDesktop && (
        <div className='pt-1 sm:pt-2 w-full' key="hero-container-wrapper-mobile" style={{ width: '100%', maxWidth: '100%' }}>
        <div 
          className="hero-lcp-container relative w-full overflow-hidden"
          style={{ 
            aspectRatio: '2.77',
            width: '100%',
            maxWidth: '100%',
            margin: '0 auto',
          }}
          key="hero-lcp-container-mobile"
        >
          {/* ⚡ CRITICAL: Imagen estática para LCP - tag <img> nativo para máximo descubrimiento temprano */}
          {/* Se renderiza inmediatamente en HTML sin JavaScript, antes de React hydration */}
          {/* ⚡ FIX: Full width con object-fit cover para mejor visualización */}
          <img
            id="hero-lcp-image-mobile"
            key="hero-lcp-image-static-mobile"
            src="/images/hero/hero2/hero1.webp"
            alt="Pintá rápido, fácil y cotiza al instante - Productos de pinturería de calidad - Pinteya"
            fetchPriority="high"
            loading="eager"
            decoding="async"
            className="object-cover"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
          <HeroOptimized 
            key="hero-optimized-component-mobile" 
            staticImageId="hero-lcp-image-mobile"
            carouselId="hero-optimized-mobile"
            desktop={false}
          />
        </div>
      </div>
      )}
      {/* Desktop: con márgenes */}
      {/* ⚡ FIX: Usar estado isDesktop con breakpoint más tolerante (1000px) en lugar de lg:block (1024px) */}
      {isDesktop && (
        <div className='pt-1 sm:pt-2 -mt-[105px]' key="hero-container-wrapper-desktop">
            <div className='max-w-[1170px] mx-auto lg:px-8 xl:px-8 pt-[105px]'>
              <div 
                className="hero-lcp-container relative overflow-hidden rounded-3xl"
                style={{ 
                  aspectRatio: '2.77',
                  width: '100%',
                  maxWidth: '100%',
                  margin: '0 auto',
                  position: 'relative',
                }}
                key="hero-lcp-container-desktop"
              >
                {/* ⚡ CRITICAL: Imagen estática para LCP - tag <img> nativo para máximo descubrimiento temprano */}
                {/* Se renderiza inmediatamente en HTML sin JavaScript, antes de React hydration */}
                {/* ⚡ FIX: Full width con object-fit cover para mejor visualización */}
                <img
                  id="hero-lcp-image"
                  key="hero-lcp-image-static"
                  src="/images/hero/hero2/hero1.webp"
                  alt="Pintá rápido, fácil y cotiza al instante - Productos de pinturería de calidad - Pinteya"
                  fetchPriority="high"
                  loading="eager"
                  decoding="async"
                  className="object-cover rounded-3xl"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
                <HeroOptimized 
                  key="hero-optimized-component" 
                  staticImageId="hero-lcp-image"
                  carouselId="hero-optimized-desktop"
                  desktop={true}
                />
              </div>
            </div>
          </div>
      )}

      {/* 1. Navegación rápida por categorías - Delay adaptativo para dispositivos de bajo rendimiento */}
      <React.Suspense fallback={<CategoryPillsSkeleton />}>
        <LazyDeferred 
          configKey="categoryToggle"
          delayKey="categoryToggle"
          delayOverride={categoryToggleDelay}
          skeleton={<CategoryPillsSkeleton />}
          className="mt-1 sm:mt-1.5"
        >
          <CategoryTogglePillsWithSearch />
        </LazyDeferred>
      </React.Suspense>

      {/* 2. Ofertas Especiales (BestSeller) - Delay adaptativo para dispositivos de bajo rendimiento */}
      {/* ⚡ OPTIMIZACIÓN: Siempre usar LazyDeferred para evitar montaje/desmontaje cuando delay cambia */}
      <LazyDeferred 
        configKey="bestSeller"
        delayKey="bestSeller"
        delayOverride={bestSellerDelay}
        skeleton={<BestSellerSkeleton />}
        className="mt-4 sm:mt-6 product-section"
      >
        <BestSeller />
      </LazyDeferred>

      {/* 3. Banner PINTURA FLASH DAYS - Con botón "Ver Todos los Productos" */}
      {/* ⚡ FASE 1B: Diferir después del LCP para reducir main thread work */}
      {shouldLoadAfterLCP && (
        <div 
          className='mt-3 sm:mt-4' 
          style={{ 
            minHeight: '48px', // ⚡ CLS FIX: Altura mínima exacta (h-12 = 48px)
            height: 'auto' // Permite que el contenido defina la altura
          }}
        >
          <PromoBanners bannerId={1} />
        </div>
      )}

      {/* 4. Productos Destacados (Combos) - Optimizado igual que HeroOptimized */}
      {/* ⚡ FASE 3: min-height para prevenir CLS - Reducido para eliminar espacio innecesario */}
      <div className='mt-4 sm:mt-6 product-section'>
        <CombosOptimized />
      </div>

      {/* 5. Carrusel Dinámico - Solo Envío Gratis */}
      {/* ⚡ FIX: Eliminar el div wrapper innecesario que causa espacio. El DynamicProductCarousel ya tiene su propio section con padding */}
      <DynamicProductCarousel freeShippingOnly={true} />

      {/* 6. Banner ASESORAMIENTO GRATIS - Lazy loaded - Subido más arriba y más separado de Nuevos Productos */}
      <div className='mt-0 sm:mt-1 mb-3 sm:mb-4 below-fold-content'>
        <LazyPromoBanner bannerId={2} />
      </div>

      {/* 7. Nuevos productos - Lazy loaded */}
      <LazySection 
        configKey="newArrivals"
        skeleton={<NewArrivalsSkeleton />}
        className="mt-0 product-section"
      >
        <NewArrivals />
      </LazySection>

      {/* 8. Banner CALCULADORA DE PINTURA - Lazy loaded - Mismo espaciado que Asesoramiento Gratis */}
      <div className='mt-0 sm:mt-1 mb-3 sm:mb-4 below-fold-content'>
        <LazyPromoBanner bannerId={3} />
      </div>

      {/* 9. Búsquedas Populares - Lazy loaded */}
      <LazySection 
        configKey="trendingSearches"
        skeleton={<TrendingSearchesSkeleton />}
        className="mt-6 sm:mt-8 below-fold-content"
      >
        <TrendingSearches />
      </LazySection>

      {/* 10. Trust signals y testimonios - Lazy loaded */}
      <LazySection 
        configKey="testimonials"
        skeleton={<TestimonialsSkeleton />}
        className="mt-6 sm:mt-8 testimonials-section"
      >
        <Testimonials />
      </LazySection>

      {/* Elementos flotantes de engagement - DESACTIVADOS: Reemplazados por bottom navigation */}
      {/* <DelayedFloatingCart /> */}
      {/* <DelayedFloatingWhatsApp /> */}
      {/* <ExitIntentModal /> */} {/* Desactivado - Solo WhatsAppPopup activo para evitar sobrecarga de popups */}
      
      {/* WhatsApp Popup para captura de leads - Rediseñado con paleta Pinteya */}
      <WhatsAppPopup />
      </main>
    </CategoryFilterProvider>
  )
}

export default Home
