'use client'

import React, { useEffect } from 'react'
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

      {/* 5. Carrusel Dinámico - Solo Envío Gratis - Sin lazy loading */}
      <DynamicProductCarousel freeShippingOnly={true} />

      {/* 4. Productos Destacados (Combos) - Sin lazy loading */}
      <div className='mt-4 sm:mt-6 product-section'>
        <CombosOptimized />
      </div>

      {/* 7. Nuevos productos - Sin lazy loading */}
      <div className="mt-4 sm:mt-6 product-section">
        <NewArrivals />
      </div>

      {/* 9. Búsquedas Populares - Sin lazy loading */}
      <div className="mt-6 sm:mt-8 below-fold-content">
        <TrendingSearches />
      </div>

      {/* 10. Trust signals y testimonios - Sin lazy loading */}
      <div className="mt-6 sm:mt-8 testimonials-section">
        <Testimonials />
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
