'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from '@/lib/optimized-imports'
import { useSwipeGestures } from '@/hooks/useSwipeGestures'
import { useTenantSafe, useTenantAssets } from '@/contexts/TenantContext'
import { useSlugFromHostname } from '@/hooks/useSlugFromHostname'
import { getTenantAssetPath } from '@/lib/tenant/tenant-assets'
import type { TenantPublicConfig } from '@/lib/tenant/types'

interface Slide {
  id: string
  image: string
  alt: string
}

// Fallback slides solo cuando no hay tenant ni hostname (ej: localhost sin tenant)
const FALLBACK_SLIDES: Slide[] = [
  { id: 'hero-1', image: '/images/hero/hero2/hero1.webp', alt: 'Pintá rápido, fácil y cotiza al instante' },
  { id: 'hero-2', image: '/images/hero/hero2/hero2.webp', alt: 'Envío express en 24HS' },
  { id: 'hero-3', image: '/images/hero/hero2/hero3.webp', alt: 'Pagá con Mercado Pago' },
]

const SimpleHeroCarousel: React.FC = () => {
  const tenant = useTenantSafe()
  const slugFromHost = useSlugFromHostname()
  const { heroImage } = useTenantAssets()
  const tenantName = tenant?.name || 'PinteYa'

  // Usar tenant del contexto o slug del hostname para no mostrar Pinteya en pintemas.com
  const effectiveTenant = useMemo((): TenantPublicConfig | null => {
    if (tenant?.slug) return tenant
    if (slugFromHost) return { slug: slugFromHost } as TenantPublicConfig
    return null
  }, [tenant, slugFromHost])

  // Slides con URLs del bucket (Supabase) o fallback local solo cuando no hay effectiveTenant
  const slides = useMemo<Slide[]>(() => {
    if (!effectiveTenant) return FALLBACK_SLIDES
    const getUrl = (i: number) =>
      getTenantAssetPath(effectiveTenant, `hero/hero${i}.webp`, `/tenants/${effectiveTenant.slug}/hero/hero${i}.webp`)
    return [
      { id: 'hero-1', image: getUrl(1), alt: `${tenantName} - Pintá rápido, fácil y cotiza al instante` },
      { id: 'hero-2', image: getUrl(2), alt: `${tenantName} - Envío express en 24HS` },
      { id: 'hero-3', image: getUrl(3), alt: `${tenantName} - Pagá con Mercado Pago` },
    ]
  }, [effectiveTenant, tenantName])
  const [currentIndex, setCurrentIndex] = useState(1)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [imagesLoaded, setImagesLoaded] = useState(false)
  const [loadedImagesCount, setLoadedImagesCount] = useState(0)
  
  // ⚡ FIX: Ocultar skeleton cuando al menos la primera imagen (prioritaria) se haya cargado
  useEffect(() => {
    if (loadedImagesCount >= 1) {
      setImagesLoaded(true)
    }
  }, [loadedImagesCount])
  
  // ⚡ FIX: Fallback - ocultar skeleton después de un tiempo razonable
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      setImagesLoaded(true)
    }, 2000) // 2 segundos máximo
    
    return () => clearTimeout(fallbackTimer)
  }, [])

  const extendedSlides = useMemo(
    () => [slides[slides.length - 1], ...slides, slides[0]],
    [slides]
  )

  const goToSlide = useCallback((index: number) => {
    setIsTransitioning(true)
    setCurrentIndex(index + 1)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 10000)
  }, [])

  const goToPrevious = useCallback(() => {
    setIsTransitioning(true)
    setCurrentIndex((prev) => prev - 1)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 10000)
  }, [])

  const goToNext = useCallback(() => {
    setIsTransitioning(true)
    setCurrentIndex((prev) => prev + 1)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 10000)
  }, [])

  useEffect(() => {
    if (!isAutoPlaying) return
    const interval = setInterval(() => {
      goToNext()
    }, 5000)
    return () => clearInterval(interval)
  }, [isAutoPlaying, goToNext])

  useEffect(() => {
    if (!isTransitioning) return
    if (currentIndex === extendedSlides.length - 1) {
      setTimeout(() => {
        setIsTransitioning(false)
        setCurrentIndex(1)
      }, 700)
    }
    if (currentIndex === 0) {
      setTimeout(() => {
        setIsTransitioning(false)
        setCurrentIndex(slides.length)
      }, 700)
    }
  }, [currentIndex, isTransitioning, extendedSlides.length])

  // Configurar gestos táctiles para mobile
  const swipeRef = useSwipeGestures({
    onSwipeLeft: goToNext,
    onSwipeRight: goToPrevious,
    threshold: 50,
    preventDefaultTouchmove: false,
  })

  return (
    <div className="relative w-full h-full" style={{ width: '100%', maxWidth: '100%', height: '100%' }}>
      <div 
        className="relative w-full h-full overflow-hidden"
        style={{ 
          aspectRatio: '2.77',
          width: '100%',
          maxWidth: '100%',
          height: '100%',
        }}
      >
        {/* ⚡ FIX: Skeleton placeholder mientras carga - se oculta completamente cuando las imágenes cargan */}
        {!imagesLoaded && (
          <div 
            className="absolute inset-0 skeleton-loading z-0"
            style={{ aspectRatio: '2.77' }}
            aria-hidden="true"
          />
        )}
        
        {/* Slides */}
        <div 
          ref={swipeRef as React.RefObject<HTMLDivElement>} 
          className={`flex h-full ${isTransitioning ? 'transition-transform duration-1000 ease-in-out' : ''}`}
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {extendedSlides.map((slide, index) => {
            if (!slide) return null
            
            return (
              <div
                key={`${slide.id}-${index}`}
                className="min-w-full h-full flex-shrink-0 relative"
                style={{
                  willChange: isTransitioning ? 'transform' : 'auto',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                }}
              >
                <Image
                  src={slide.image}
                  alt={slide.alt}
                  fill
                  priority={index === 1} // MULTITENANT: Solo primera imagen tiene priority
                  fetchPriority={index === 1 ? 'high' : 'auto'} // ⚡ FIX: Auto en lugar de low para evitar problemas de carga
                  className="object-cover rounded-3xl"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px" // MULTITENANT: Sizes optimizado
                  quality={80} // MULTITENANT: Balance tamaño/calidad
                  loading={index === 1 ? 'eager' : 'lazy'} // MULTITENANT: Lazy loading para imágenes no críticas
                  decoding={index === 1 ? 'sync' : 'async'} // ⚡ OPTIMIZACIÓN PAGESPEED: Sync para LCP, async para otras
                  onLoad={() => {
                    setLoadedImagesCount(prev => prev + 1)
                  }}
                />
              </div>
            )
          })}
        </div>

        {/* Botones de navegación - Solo en desktop */}
        <button
          onClick={goToPrevious}
          className='hidden md:flex absolute -left-5 top-1/2 -translate-y-1/2 z-10 
                   w-10 h-10 rounded-full bg-white/90 border-2 border-gray-200
                   text-blaze-orange-600 shadow-lg
                   transition-transform duration-500 hover:scale-110 active:scale-95
                   items-center justify-center group relative'
          style={{
            opacity: 0.9,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1'
            const shadow = e.currentTarget.querySelector('.hover-shadow') as HTMLElement
            if (shadow) shadow.style.opacity = '1'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0.9'
            const shadow = e.currentTarget.querySelector('.hover-shadow') as HTMLElement
            if (shadow) shadow.style.opacity = '0'
          }}
          aria-label='Slide anterior'
        >
          <span className="absolute inset-0 rounded-full shadow-xl opacity-0 hover-shadow transition-opacity duration-500 pointer-events-none" />
          <ChevronLeft className='w-5 h-5 group-hover:translate-x-[-2px] transition-transform duration-500 relative z-10' />
        </button>
        <button
          onClick={goToNext}
          className='hidden md:flex absolute -right-5 top-1/2 -translate-y-1/2 z-10 
                   w-10 h-10 rounded-full bg-white/90 border-2 border-gray-200
                   text-blaze-orange-600 shadow-lg
                   transition-transform duration-500 hover:scale-110 active:scale-95
                   items-center justify-center group relative'
          style={{
            opacity: 0.9,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1'
            const shadow = e.currentTarget.querySelector('.hover-shadow') as HTMLElement
            if (shadow) shadow.style.opacity = '1'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0.9'
            const shadow = e.currentTarget.querySelector('.hover-shadow') as HTMLElement
            if (shadow) shadow.style.opacity = '0'
          }}
          aria-label='Siguiente slide'
        >
          <span className="absolute inset-0 rounded-full shadow-xl opacity-0 hover-shadow transition-opacity duration-500 pointer-events-none" />
          <ChevronRight className='w-5 h-5 group-hover:translate-x-[2px] transition-transform duration-500 relative z-10' />
        </button>

        {/* Indicadores (dots) - Estilo Mercado Libre */}
        <div className='absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-2 sm:gap-3'>
          {slides.map((_, index) => {
            let realIndex = currentIndex - 1
            if (currentIndex === 0) realIndex = slides.length - 1
            if (currentIndex === extendedSlides.length - 1) realIndex = 0
            
            const isActive = realIndex === index
            
            return (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`relative rounded-full bg-white/60 transition-all duration-500 ${
                  isActive 
                    ? 'h-2 sm:h-2.5 w-8 sm:w-10' // Pill cuando está activo
                    : 'h-2 sm:h-2.5 w-2 sm:w-2.5' // Círculo cuando no está activo
                }`}
                style={{
                  opacity: isActive ? 1 : 0.6,
                  willChange: 'width, opacity',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.opacity = '0.8'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.opacity = '0.6'
                  }
                }}
                aria-label={`Ir al slide ${index + 1}`}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default SimpleHeroCarousel
