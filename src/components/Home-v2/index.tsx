'use client'

import dynamic from 'next/dynamic'
import { useEffect } from 'react'
import { trackScrollDepth } from '@/lib/google-analytics'
import { CategoryFilterProvider } from '@/contexts/CategoryFilterContext'

// Lazy loading de componentes para mejor performance
const Hero = dynamic(() => import('./Hero'), {
  loading: () => <HeroSkeleton />,
})
// BenefitsBar eliminado - ahora está integrado en el Header como ScrollingBanner
const CategoryTogglePillsWithSearch = dynamic(() => import('./CategoryTogglePillsWithSearch'))
const PromoBanners = dynamic(() => import('./PromoBanners/index'))
const DynamicProductCarousel = dynamic(() => import('./DynamicProductCarousel/index'))
const TrendingSearches = dynamic(() => import('./TrendingSearches/index'))
const CombosSection = dynamic(() => import('./CombosSection/index'))
const BestSeller = dynamic(() => import('./BestSeller/index'))
const NewArrivals = dynamic(() => import('./NewArrivals/index'))
const TrustSection = dynamic(() => import('./TrustSection/index'))
const Testimonials = dynamic(() => import('./Testimonials/index'))
const Newsletter = dynamic(() => import('./Newsletter/index'))
const FloatingCart = dynamic(() => import('@/components/Common/FloatingCart'))
const FloatingWhatsApp = dynamic(() => import('@/components/Common/FloatingWhatsApp'))
const ExitIntentModal = dynamic(() => import('@/components/Common/ExitIntentModal'))
const WhatsAppPopup = dynamic(() => import('@/components/Common/WhatsAppPopup'))

// Skeleton para Hero mientras carga
const HeroSkeleton = () => (
  <div className='bg-gradient-to-br from-blaze-orange-500 via-blaze-orange-400 to-blaze-orange-600 min-h-[500px] animate-pulse'>
    <div className='max-w-7xl mx-auto px-4 py-12'>
      <div className='space-y-4'>
        <div className='h-12 bg-white/20 rounded-lg w-3/4'></div>
        <div className='h-8 bg-white/20 rounded-lg w-1/2'></div>
        <div className='flex gap-4 mt-6'>
          <div className='h-14 bg-white/20 rounded-lg w-48'></div>
          <div className='h-14 bg-white/20 rounded-lg w-48'></div>
        </div>
      </div>
    </div>
  </div>
)

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
      <main>
        {/* BenefitsBar eliminado - ahora está integrado en el Header como ScrollingBanner */}

      {/* NUEVO ORDEN OPTIMIZADO - Hero primero, luego banner */}

      {/* 1. Hero - Captar atención inmediata */}
      <Hero />

      {/* 2. Banner PINTURA FLASH DAYS - Ultra compacto y con espacio */}
      <PromoBanners bannerId={1} />

      {/* 3. Navegación rápida por categorías */}
      <CategoryTogglePillsWithSearch />

      {/* 4. NUEVO: Carrusel Dinámico de Productos por Categoría - Reemplaza FreeShippingSection */}
      <div className='-mt-3'>
        <DynamicProductCarousel />
      </div>

      {/* 5. Productos Destacados (antes era "Combos") */}
      <div className='-mt-8'>
        <CombosSection />
      </div>

      {/* 6. Ofertas Especiales (BestSeller) */}
      <div className='-mt-6'>
        <BestSeller />
      </div>

      {/* 7. Banner ENVÍO GRATIS - Entre Productos Destacados y Nuevos */}
      <div className='-mt-4'>
        <PromoBanners bannerId={2} />
      </div>

      {/* 8. Nuevos productos - Descubrimiento */}
      <div className='-mt-4'>
        <NewArrivals />
      </div>

      {/* 9. Banner LÍDERES EN CÓRDOBA - Después de Nuevos Productos */}
      <div className='-mt-4'>
        <PromoBanners bannerId={3} />
      </div>

      {/* 10. Búsquedas Populares - DESPUÉS de nuevos productos */}
      <div className='-mt-6'>
        <TrendingSearches />
      </div>

      {/* 11. Trust signals y testimonios */}
      <div className='-mt-4'>
        <TrustSection />
      </div>
      <div className='-mt-6'>
        <Testimonials />
      </div>

      {/* 12. Newsletter */}
      <div className='-mt-6'>
        <Newsletter />
      </div>

      {/* Elementos flotantes de engagement */}
      <FloatingCart />
      <FloatingWhatsApp />
      <ExitIntentModal />
      
      {/* WhatsApp Popup para captura de leads (aparece a los 18 segundos) */}
      <WhatsAppPopup />
      </main>
    </CategoryFilterProvider>
  )
}

export default HomeV2

