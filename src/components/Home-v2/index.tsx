'use client'

import dynamic from 'next/dynamic'
import { useEffect } from 'react'
import { trackScrollDepth } from '@/lib/google-analytics'
import { CategoryFilterProvider } from '@/contexts/CategoryFilterContext'
import NewArrivals from './NewArrivals/index'

// BenefitsBar eliminado - ahora está integrado en el Header como ScrollingBanner
const HeroCarousel = dynamic(() => import('./HeroCarousel/index'))
const CategoryTogglePillsWithSearch = dynamic(() => import('./CategoryTogglePillsWithSearch'))
const PromoBanners = dynamic(() => import('./PromoBanners/index'))
const DynamicProductCarousel = dynamic(() => import('./DynamicProductCarousel/index'))
const TrendingSearches = dynamic(() => import('./TrendingSearches/index'))
const CombosSection = dynamic(() => import('./CombosSection/index'))
const BestSeller = dynamic(() => import('./BestSeller/index'))
const TrustSection = dynamic(() => import('./TrustSection/index'))
const Testimonials = dynamic(() => import('./Testimonials/index'))
const Newsletter = dynamic(() => import('./Newsletter/index'))
const FloatingCart = dynamic(() => import('@/components/Common/FloatingCart'))
const FloatingWhatsApp = dynamic(() => import('@/components/Common/FloatingWhatsApp'))
// const ExitIntentModal = dynamic(() => import('@/components/Common/ExitIntentModal')) // Desactivado - Solo WhatsAppPopup activo
const WhatsAppPopup = dynamic(() => import('@/components/Common/WhatsAppPopup'))


const HomeV2 = () => {
  // Scroll depth tracking
  useEffect(() => {
    let maxDepth = 0
    const trackingThresholds = [25, 50, 75, 100]
    const trackedDepths = new Set<number>()

    const handleScroll = () => {
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

      {/* 6. Banner ASESORAMIENTO GRATIS */}
      <div className='mt-4 sm:mt-6 below-fold-content'>
        <PromoBanners bannerId={2} />
      </div>

      {/* 7. Nuevos productos */}
      <div className='mt-3 sm:mt-4 product-section'>
        <NewArrivals />
      </div>

      {/* 8. Banner CALCULADORA DE PINTURA */}
      <div className='mt-4 sm:mt-6 below-fold-content'>
        <PromoBanners bannerId={3} />
      </div>

      {/* 9. Búsquedas Populares */}
      <div className='mt-6 sm:mt-8 below-fold-content'>
        <TrendingSearches />
      </div>

      {/* 10. Trust signals y testimonios */}
      <div className='mt-6 sm:mt-8 trust-section'>
        <TrustSection />
      </div>
      <div className='mt-6 sm:mt-8 testimonials-section'>
        <Testimonials />
      </div>

      {/* 11. Newsletter */}
      <div className='mt-6 sm:mt-8 newsletter-section'>
        <Newsletter />
      </div>

      {/* Elementos flotantes de engagement */}
      <FloatingCart />
      <FloatingWhatsApp />
      {/* <ExitIntentModal /> */} {/* Desactivado - Solo WhatsAppPopup activo para evitar sobrecarga de popups */}
      
      {/* WhatsApp Popup para captura de leads - Rediseñado con paleta Pinteya */}
      <WhatsAppPopup />
      </main>
    </CategoryFilterProvider>
  )
}

export default HomeV2

