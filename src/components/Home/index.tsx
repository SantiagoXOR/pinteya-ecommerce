'use client'

import React, { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { trackScrollDepth } from '@/lib/google-analytics'
import { CategoryFilterProvider } from '@/contexts/CategoryFilterContext'
import { useBreakpoint } from '@/contexts/BreakpointContext'
import type { Category } from '@/lib/categories/types'
import type { Product } from '@/types/product'

// ⚡ OPTIMIZACIÓN: Imports estáticos de componentes críticos (sin lazy loading)
// CategorySection y BestSellerSection son Server Components críticos que deben mantener SSR
// para SEO y datos pre-fetched - NO hacerlos lazy
import { HeroSection } from './sections/HeroSection'
import { CategorySection } from './sections/CategorySection'
import { BestSellerSection } from './sections/BestSellerSection'

// ⚡ OPTIMIZACIÓN LCP: Lazy loading agresivo de componentes below-fold para reducir Script Evaluation
// Estos componentes se cargan después del LCP para no bloquear la carga inicial
const CombosOptimized = dynamic(() => import('./CombosOptimized'), {
  ssr: false,
  loading: () => null,
})

const DynamicProductCarousel = dynamic(() => import('./DynamicProductCarousel'), {
  ssr: false,
  loading: () => null,
})

const NewArrivals = dynamic(() => import('./NewArrivals'), {
  ssr: false,
  loading: () => null,
})

const TrendingSearches = dynamic(() => import('./TrendingSearches'), {
  ssr: false,
  loading: () => null,
})

const Testimonials = dynamic(() => import('./Testimonials'), {
  ssr: false,
  loading: () => null,
})

// Componentes flotantes con carga diferida (mantener lazy loading para no bloquear)
const FloatingCart = dynamic(() => import('@/components/Common/FloatingCart'), {
  ssr: false,
})

const FloatingWhatsApp = dynamic(() => import('@/components/Common/FloatingWhatsApp'), {
  ssr: false,
})

const WhatsAppPopup = dynamic(() => import('@/components/Common/WhatsAppPopup'), {
  ssr: false,
})

interface HomeProps {
  categories: Category[]
  bestSellerProducts: Product[]
}

const Home = ({ categories, bestSellerProducts }: HomeProps) => {
  // ⚡ OPTIMIZACIÓN: Usar contextos compartidos para evitar múltiples llamadas a hooks
  const { isDesktop } = useBreakpoint()
  const [visibleSections, setVisibleSections] = useState({
    carousel: false,
    combos: false,
    arrivals: false,
    trending: false,
    testimonials: false,
  })
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const observerRef = useRef<IntersectionObserver | null>(null)

  // ⚡ OPTIMIZACIÓN TTI: Scroll depth tracking diferido después del LCP
  // Diferir inicialización para no bloquear interactividad inicial
  useEffect(() => {
    // Guardar SSR/hidratación: evitar acceder a window/document en servidor
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return
    }

    // ⚡ OPTIMIZACIÓN TTI: Diferir tracking hasta después del LCP usando requestIdleCallback
    const initTracking = () => {
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
    }

    // ⚡ OPTIMIZACIÓN TTI: Diferir con requestIdleCallback o setTimeout fallback
    if ('requestIdleCallback' in window) {
      requestIdleCallback(initTracking, { timeout: 2000 })
    } else {
      setTimeout(initTracking, 1000) // Fallback: diferir 1 segundo
    }
  }, [])

  // ⚡ PERFORMANCE: Montar secciones below-fold solo al entrar en viewport
  useEffect(() => {
    if (typeof window === 'undefined') return

    if (!('IntersectionObserver' in window)) {
      setVisibleSections({
        carousel: true,
        combos: true,
        arrivals: true,
        trending: true,
        testimonials: true,
      })
      return
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const key = (entry.target as HTMLElement).dataset.section as keyof typeof visibleSections | undefined
          if (entry.isIntersecting && key) {
            setVisibleSections((prev) => (prev[key] ? prev : { ...prev, [key]: true }))
            observerRef.current?.unobserve(entry.target)
          }
        })
      },
      { rootMargin: '200px 0px', threshold: 0.01 }
    )

    Object.values(sectionRefs.current).forEach((el) => {
      if (el) observerRef.current?.observe(el)
    })

    return () => {
      observerRef.current?.disconnect()
      observerRef.current = null
    }
  }, [])

  const setSectionRef =
    (key: keyof typeof visibleSections) => (el: HTMLDivElement | null) => {
      sectionRefs.current[key] = el
      if (el && observerRef.current) {
        observerRef.current.observe(el)
      }
    }

  return (
    <CategoryFilterProvider>
      <main className='min-h-screen'>
        {/* BenefitsBar eliminado - ahora está integrado en el Header como ScrollingBanner */}

      {/* NUEVO ORDEN OPTIMIZADO CON GLASSMORPHISM */}

      {/* 0. Hero Section - Renderizado inmediato sin lazy loading */}
      <HeroSection isDesktop={isDesktop} />

      {/* 1. Navegación rápida por categorías - Sin lazy loading, datos pre-fetched */}
      <CategorySection categories={categories} />

      {/* 2. Ofertas Especiales (BestSeller) - Sin lazy loading, datos pre-fetched */}
      <BestSellerSection products={bestSellerProducts} />

      {/* 5. Carrusel Dinámico - Espacio mínimo en mobile. */}
      <div
        ref={setSectionRef('carousel')}
        data-section="carousel"
        className="mt-0.5 sm:mt-6 min-h-[160px] sm:min-h-[260px]"
      >
        {visibleSections.carousel ? <DynamicProductCarousel freeShippingOnly={true} /> : null}
      </div>

      {/* 4. Productos Destacados (Combos) - Espacio mínimo en mobile. */}
      <div
        ref={setSectionRef('combos')}
        data-section="combos"
        className='mt-0.5 sm:mt-6 product-section min-h-[160px] sm:min-h-[260px]'
      >
        {visibleSections.combos ? <CombosOptimized /> : null}
      </div>

      {/* 7. Nuevos productos - Espacio mínimo en mobile. */}
      <div
        ref={setSectionRef('arrivals')}
        data-section="arrivals"
        className="mt-0.5 sm:mt-6 product-section min-h-[160px] sm:min-h-[260px]"
      >
        {visibleSections.arrivals ? <NewArrivals /> : null}
      </div>

      {/* 9. Búsquedas Populares - Montar al entrar en viewport */}
      <div
        ref={setSectionRef('trending')}
        data-section="trending"
        className="mt-6 sm:mt-8 below-fold-content"
        style={{ minHeight: '200px' }}
      >
        {visibleSections.trending ? <TrendingSearches /> : null}
      </div>

      {/* 10. Trust signals y testimonios - Montar al entrar en viewport */}
      <div
        ref={setSectionRef('testimonials')}
        data-section="testimonials"
        className="mt-6 sm:mt-8 testimonials-section"
        style={{ minHeight: '200px' }}
      >
        {visibleSections.testimonials ? <Testimonials /> : null}
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

export default Home
