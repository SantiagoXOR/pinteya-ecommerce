'use client'

import React, { useEffect } from 'react'
import dynamic from 'next/dynamic'
import { trackScrollDepth } from '@/lib/google-analytics'
import { CategoryFilterProvider } from '@/contexts/CategoryFilterContext'
import { useProgressiveLoading } from '@/hooks/useProgressiveLoading'
import { useDevicePerformance } from '@/hooks/useDevicePerformance'
import { useLCPDetection } from '@/hooks/useLCPDetection'
import type { PromoBannersProps } from '../Home-v2/PromoBanners'
import { ProductSkeletonGrid, ProductSkeletonCarousel } from '@/components/ui/product-skeleton'
// ⚡ OPTIMIZACIÓN: Cargar CSS glassmorphism de forma diferida (no bloqueante)
// El CSS se importa pero se carga después del FCP usando DeferredGlassmorphismCSS
import { DeferredGlassmorphismCSS } from './DeferredGlassmorphismCSS'
// ⚡ FASE 1B: BestSeller diferido con ssr: false para reducir main thread work
const BestSeller = dynamic(() => import('../Home-v2/BestSeller/index'), {
  ssr: false, // ⚡ OPTIMIZACIÓN: No SSR para reducir main thread work
  loading: () => (
    <div className='px-4'>
      <div className='h-8 w-48 bg-gray-200 rounded skeleton-pulse mb-4' />
      <ProductSkeletonCarousel count={4} />
    </div>
  ),
})

// BenefitsBar eliminado - ahora está integrado en el Header como ScrollingBanner
// ⚡ PERFORMANCE: HeroOptimized renderiza imagen estática inicial y carga carousel después del FCP
import HeroOptimized from './HeroOptimized'

const CategoryTogglePillsWithSearch = dynamic(() => import('../Home-v2/CategoryTogglePillsWithSearch'), {
  loading: () => (
    <div className='flex gap-2 px-4 overflow-x-auto'>
      {[...Array(5)].map((_, i) => (
        <div key={i} className='h-8 w-24 bg-gray-200 rounded-full skeleton-pulse flex-shrink-0' />
      ))}
    </div>
  ),
})

const PromoBanners = dynamic<PromoBannersProps>(() => import('../Home-v2/PromoBanners/index'), {
  loading: () => (
    <div className='w-full h-32 md:h-48 bg-gray-200 skeleton-loading rounded-lg mx-4' />
  ),
})

const DynamicProductCarousel = dynamic(() => import('../Home-v2/DynamicProductCarousel/index'), {
  loading: () => (
    <div className='px-4'>
      <div className='h-8 w-48 bg-gray-200 rounded skeleton-pulse mb-4' />
      <ProductSkeletonCarousel count={4} />
    </div>
  ),
})

const TrendingSearches = dynamic(() => import('../Home-v2/TrendingSearches/index'), {
  loading: () => (
    <div className='px-4'>
      <div className='h-8 w-40 bg-gray-200 rounded skeleton-pulse mb-4' />
      <div className='flex flex-wrap gap-2'>
        {[...Array(6)].map((_, i) => (
          <div key={i} className='h-8 w-24 bg-gray-200 rounded-full skeleton-pulse' />
        ))}
      </div>
    </div>
  ),
})

// ⚡ OPTIMIZACIÓN: Usar CombosOptimized (igual que HeroOptimized) para mejor LCP
import CombosOptimized from './CombosOptimized'

const Testimonials = dynamic(() => import('../Home-v2/Testimonials/index'), {
  ssr: false, // ⚡ OPTIMIZACIÓN: No SSR para componentes below-fold
  loading: () => (
    <div className='px-4'>
      <div className='h-8 w-40 bg-gray-200 rounded skeleton-pulse mb-4' />
      <div className='flex gap-4 overflow-x-auto'>
        {[...Array(3)].map((_, i) => (
          <div key={i} className='w-80 h-48 bg-gray-200 rounded-lg skeleton-loading flex-shrink-0' />
        ))}
      </div>
    </div>
  ),
})
// ⚡ OPTIMIZACIÓN: Componentes below-fold con lazy loading más agresivo
// Usar ssr: false para componentes que no necesitan SSR
const NewArrivals = dynamic(() => import('../Home-v2/NewArrivals/index'), {
  ssr: false, // ⚡ OPTIMIZACIÓN: No SSR para componentes below-fold
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

  // ⚡ FIX CLS: minHeight realista basado en altura esperada del banner (48px para banners compactos)
  // Esto previene layout shift cuando el componente se vuelve visible
  const minHeight = isVisible ? 'auto' : '48px';
  return (
    <div ref={ref} style={{ minHeight: minHeight }}>
      {content}
    </div>
  )
})
LazyPromoBanner.displayName = 'LazyPromoBanner'

const LazyNewArrivals = React.memo(() => {
  // ⚡ OPTIMIZACIÓN: Reducir rootMargin de 400px a 300px para cargar más tarde
  // Esto reduce el JavaScript inicial y mejora TBT
  const { ref, isVisible } = useProgressiveLoading<HTMLDivElement>({
    rootMargin: '300px',
    threshold: 0.01,
  })

  const content = React.useMemo(() => {
    return isVisible ? <NewArrivals /> : null
  }, [isVisible])

  // ⚡ FIX CLS: minHeight realista basado en altura esperada (500px según Home-v2)
  const minHeight = isVisible ? 'auto' : '500px';
  return (
    <div ref={ref} style={{ minHeight: minHeight }}>
      {content}
    </div>
  )
})
LazyNewArrivals.displayName = 'LazyNewArrivals'

const LazyTrendingSearches = React.memo(() => {
  // ⚡ OPTIMIZACIÓN: Reducir rootMargin de 200px a 150px para cargar más tarde
  const { ref, isVisible } = useProgressiveLoading<HTMLDivElement>({
    rootMargin: '150px',
    threshold: 0.01,
  })

  const content = React.useMemo(() => {
    return isVisible ? <TrendingSearches /> : null
  }, [isVisible])

  // ⚡ FIX CLS: minHeight realista basado en altura esperada (~100px para trending searches)
  const minHeight = isVisible ? 'auto' : '100px';
  return (
    <div ref={ref} style={{ minHeight: minHeight }}>
      {content}
    </div>
  )
})
LazyTrendingSearches.displayName = 'LazyTrendingSearches'

const LazyTestimonials = React.memo(() => {
  // ⚡ OPTIMIZACIÓN: Reducir rootMargin de 200px a 150px para cargar más tarde
  const { ref, isVisible } = useProgressiveLoading<HTMLDivElement>({
    rootMargin: '150px',
    threshold: 0.01,
  })

  const content = React.useMemo(() => {
    return isVisible ? <Testimonials /> : null
  }, [isVisible])

  // ⚡ FIX CLS: minHeight realista basado en altura esperada (~200px para testimonials)
  const minHeight = isVisible ? 'auto' : '200px';
  return (
    <div ref={ref} style={{ minHeight: minHeight }}>
      {content}
    </div>
  )
})
LazyTestimonials.displayName = 'LazyTestimonials'

const LazyBestSeller = React.memo(({ delay = 0 }: { delay?: number }) => {
  // ⚡ FIX: Inicializar como true para SSR (asumiendo delay === 0 durante SSR)
  // Esto asegura que el servidor y cliente rendericen lo mismo inicialmente
  const [shouldRender, setShouldRender] = React.useState(true)
  const [isHydrated, setIsHydrated] = React.useState(false)
  const [hasRendered, setHasRendered] = React.useState(false)

  // ⚡ FIX: Marcar como hidratado después del primer render del cliente
  React.useEffect(() => {
    setIsHydrated(true)
  }, [])

  // ⚡ FIX: Marcar como renderizado cuando el contenido se muestra por primera vez
  React.useEffect(() => {
    if (shouldRender && !hasRendered) {
      setHasRendered(true)
    }
  }, [shouldRender, hasRendered])

  React.useEffect(() => {
    // Solo procesar cambios de delay después de la hidratación para evitar mismatch
    if (!isHydrated) return

    // ⚡ FIX: Si el contenido ya se renderizó, NO cambiarlo a false aunque el delay cambie
    // Esto previene que el contenido desaparezca después de la hidratación
    if (hasRendered && shouldRender) return

    if (delay > 0) {
      // Si delay es > 0 y el contenido aún no se ha renderizado, mostrar skeleton primero
      setShouldRender(false)
      const timer = setTimeout(() => {
        setShouldRender(true)
      }, delay)
      return () => clearTimeout(timer)
    } else {
      // Si delay es 0, renderizar inmediatamente
      setShouldRender(true)
    }
  }, [delay, isHydrated, hasRendered, shouldRender])

  if (!shouldRender) {
    return (
      <div className='mt-4 sm:mt-6 product-section'>
        <ProductSkeletonGrid count={4} />
      </div>
    )
  }

  // ✅ FIX CRÍTICO: BestSeller debe cargarse SIEMPRE, sin progressive loading
  // Renderizar inmediatamente sin esperar a ser visible
  // ⚡ FASE 3: min-height para prevenir CLS
  return (
    <div className='mt-4 sm:mt-6 product-section' style={{ minHeight: '400px' }}>
      <BestSeller />
    </div>
  )
})
LazyBestSeller.displayName = 'LazyBestSeller'

// ⚡ OPTIMIZACIÓN: Componente para CategoryToggle con delay adaptativo
const DelayedCategoryToggle = React.memo(({ delay }: { delay: number }) => {
  // ⚡ FIX: Inicializar como true para SSR (asumiendo delay === 0 durante SSR)
  // Esto asegura que el servidor y cliente rendericen lo mismo inicialmente
  const [shouldRender, setShouldRender] = React.useState(true)
  const [isHydrated, setIsHydrated] = React.useState(false)
  const [hasRendered, setHasRendered] = React.useState(false)

  // ⚡ FIX: Marcar como hidratado después del primer render del cliente
  React.useEffect(() => {
    setIsHydrated(true)
  }, [])

  // ⚡ FIX: Marcar como renderizado cuando el contenido se muestra por primera vez
  React.useEffect(() => {
    if (shouldRender && !hasRendered) {
      setHasRendered(true)
    }
  }, [shouldRender, hasRendered])

  React.useEffect(() => {
    // Solo procesar cambios de delay después de la hidratación para evitar mismatch
    if (!isHydrated) return

    // ⚡ FIX: Si el contenido ya se renderizó, NO cambiarlo a false aunque el delay cambie
    // Esto previene que el contenido desaparezca después de la hidratación
    if (hasRendered && shouldRender) return

    if (delay > 0) {
      // Si delay es > 0 y el contenido aún no se ha renderizado, mostrar skeleton primero
      setShouldRender(false)
      const timer = setTimeout(() => {
        setShouldRender(true)
      }, delay)
      return () => clearTimeout(timer)
    } else {
      // Si delay es 0, renderizar inmediatamente
      setShouldRender(true)
    }
  }, [delay, isHydrated, hasRendered, shouldRender])

  if (!shouldRender) {
    return (
      <div className='mt-1 sm:mt-1.5' style={{ minHeight: '40px' }}>
        <div className='flex gap-2 px-4 overflow-x-auto'>
          {[...Array(5)].map((_, i) => (
            <div key={i} className='h-8 w-24 bg-gray-200 rounded-full skeleton-pulse flex-shrink-0' />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className='mt-1 sm:mt-1.5' style={{ minHeight: '40px' }}>
      <CategoryTogglePillsWithSearch />
    </div>
  )
})
DelayedCategoryToggle.displayName = 'DelayedCategoryToggle'

const HomeV3 = () => {
  // ⚡ OPTIMIZACIÓN: Detectar nivel de rendimiento del dispositivo para aplicar optimizaciones adaptativas
  const performanceLevel = useDevicePerformance()
  const isLowPerformance = performanceLevel === 'low'
  const isMediumPerformance = performanceLevel === 'medium'
  
  // ⚡ FASE 1B: Detectar LCP para diferir componentes no críticos después del LCP
  const { shouldLoad: shouldLoadAfterLCP } = useLCPDetection({
    delayAfterLCP: 1000, // Cargar 1s después del LCP
    maxWaitTime: 3000, // Fallback después de 3s
    useIdleCallback: true,
  })
  
  // ⚡ OPTIMIZACIÓN CRÍTICA: Detectar si es móvil para deshabilitar efectos costosos
  const [isMobile, setIsMobile] = React.useState(false)
  
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  // ⚡ FASE 1B: Aplicar delays basados en LCP y rendimiento del dispositivo
  // Si LCP no se ha detectado, usar delays adaptativos basados en rendimiento
  const shouldDelay = isLowPerformance || isMediumPerformance || isMobile
  const categoryToggleDelay = shouldLoadAfterLCP ? 0 : (shouldDelay ? 2000 : 0)
  const bestSellerDelay = shouldLoadAfterLCP ? 0 : (shouldDelay ? 3000 : 0)
  
  // ⚡ FIX: Eliminar duplicados de imágenes estáticas y carousels SOLO en producción
  // Esto previene que se rendericen dos imágenes estáticas o dos carousels
  // ⚡ IMPORTANTE: Solo ejecutar en producción para no interferir con desarrollo
  useEffect(() => {
    // Solo ejecutar en producción
    if (process.env.NODE_ENV !== 'production') {
      return
    }

    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return
    }

    // Función para eliminar duplicados
    const removeDuplicates = () => {
      // Esperar a que React termine de hidratar completamente
      // Verificar que el DOM esté estable antes de eliminar
      if (document.readyState !== 'complete') {
        return
      }

      // Eliminar imágenes estáticas duplicadas (mantener solo la primera)
      const heroImages = document.querySelectorAll('#hero-lcp-image')
      if (heroImages.length > 1) {
        // Mantener la primera, eliminar las demás
        for (let i = 1; i < heroImages.length; i++) {
          const img = heroImages[i]
          if (img && img.parentNode && img.isConnected) {
            img.parentNode.removeChild(img)
          }
        }
      }

      // Eliminar contenedores hero-lcp-container duplicados (mantener solo el primero)
      const containers = document.querySelectorAll('.hero-lcp-container')
      if (containers.length > 1) {
        // Mantener el primero, eliminar los demás
        for (let i = 1; i < containers.length; i++) {
          const container = containers[i]
          if (container && container.parentNode && container.isConnected) {
            container.parentNode.removeChild(container)
          }
        }
      }

      // Eliminar carousels duplicados (mantener solo el primero)
      const carousels = document.querySelectorAll('[data-hero-optimized]')
      if (carousels.length > 1) {
        // Mantener el primero, eliminar los demás
        for (let i = 1; i < carousels.length; i++) {
          const carousel = carousels[i]
          if (carousel && carousel.parentNode && carousel.isConnected) {
            carousel.parentNode.removeChild(carousel)
          }
        }
      }
    }

    // Ejecutar después de que la página esté completamente cargada y React haya hidratado
    // Usar un delay más largo para asegurar que la hidratación esté completa
    const timeout = setTimeout(() => {
      if (document.readyState === 'complete') {
        removeDuplicates()
      }
    }, 500) // Delay más largo para producción
    
    // También ejecutar después del evento load
    window.addEventListener('load', () => {
      setTimeout(removeDuplicates, 200)
    }, { once: true })

    return () => {
      clearTimeout(timeout)
    }
  }, [])

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
      {/* ⚡ OPTIMIZACIÓN: Cargar CSS glassmorphism solo en desktop (no en móviles para evitar lag) */}
      {!isMobile && <DeferredGlassmorphismCSS />}
      <main className='min-h-screen'>
        {/* BenefitsBar eliminado - ahora está integrado en el Header como ScrollingBanner */}

      {/* NUEVO ORDEN OPTIMIZADO CON GLASSMORPHISM */}

      {/* 0. Hero Optimized - Imagen estática inicial, carousel después del FCP */}
      {/* ⚡ FASE 23: Contenedor hero-lcp-container con imagen estática y carousel */}
      {/* La imagen estática se renderiza en HTML inicial para descubrimiento temprano y LCP óptimo */}
      {/* Mobile: full width */}
      <div className='pt-1 sm:pt-2 w-full lg:hidden' key="hero-container-wrapper-mobile" style={{ width: '100%', maxWidth: '100%' }}>
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
            isDesktop={false}
          />
        </div>
      </div>
      {/* Desktop: con márgenes */}
      {(() => {
        if (typeof window !== 'undefined') {
          console.log('[HomeV3] 🖥️ Rendering desktop hero container', {
            windowWidth: window.innerWidth,
            isDesktop: window.innerWidth >= 1024,
            timestamp: Date.now()
          })
        }
        return (
          <div className='hidden lg:block pt-1 sm:pt-2 -mt-[105px]' key="hero-container-wrapper-desktop">
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
                  onLoad={() => {
                    console.log('[HomeV3] ✅ Desktop hero image loaded', {
                      imageId: 'hero-lcp-image',
                      timestamp: Date.now()
                    })
                  }}
                  onError={(e) => {
                    console.error('[HomeV3] ❌ Desktop hero image failed to load', {
                      imageId: 'hero-lcp-image',
                      error: e,
                      timestamp: Date.now()
                    })
                  }}
                />
                <HeroOptimized 
                  key="hero-optimized-component" 
                  staticImageId="hero-lcp-image"
                  carouselId="hero-optimized-desktop"
                  isDesktop={true}
                />
              </div>
            </div>
          </div>
        )
      })()}

      {/* 1. Navegación rápida por categorías - Delay adaptativo para dispositivos de bajo rendimiento */}
      <React.Suspense
        fallback={
          <div className='flex gap-2 px-4 overflow-x-auto'>
            {[...Array(5)].map((_, i) => (
              <div key={i} className='h-8 w-24 bg-gray-200 rounded-full skeleton-pulse flex-shrink-0' />
            ))}
          </div>
        }
      >
        <DelayedCategoryToggle delay={categoryToggleDelay} />
      </React.Suspense>

      {/* 2. Ofertas Especiales (BestSeller) - Delay adaptativo para dispositivos de bajo rendimiento */}
      <LazyBestSeller delay={bestSellerDelay} />

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
      <div 
        className='mt-0 sm:mt-1 mb-3 sm:mb-4 below-fold-content' 
        style={{ 
          minHeight: '48px', // ⚡ CLS FIX: Altura mínima exacta (h-12 = 48px) - Igual que Pintura Flash Days
          height: 'auto' // Permite que el contenido defina la altura
        }}
      >
        <LazyPromoBanner bannerId={2} />
      </div>

      {/* 7. Nuevos productos - Lazy loaded */}
      <div className='mt-0 product-section' style={{ minHeight: '500px' }}> {/* ⚡ CLS FIX: minHeight para reservar espacio sin forzar aspect-ratio en mobile */}
        <LazyNewArrivals />
      </div>

      {/* 8. Banner CALCULADORA DE PINTURA - Lazy loaded - Mismo espaciado que Asesoramiento Gratis */}
      <div 
        className='mt-0 sm:mt-1 mb-3 sm:mb-4 below-fold-content' 
        style={{ 
          minHeight: '48px', // ⚡ CLS FIX: Altura mínima exacta (h-12 = 48px)
          height: 'auto' // Permite que el contenido defina la altura
        }}
      >
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

export default HomeV3




