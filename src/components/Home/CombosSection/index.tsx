 'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from '@/lib/optimized-imports'
import { useSwipeGestures } from '@/hooks/useSwipeGestures'
import { useRouter } from 'next/navigation'
import { useTenantSafe } from '@/contexts/TenantContext'
import { useAnalytics } from '@/hooks/useAnalytics'
import { getTenantAssetPaths } from '@/lib/tenant/tenant-assets'
import { useSlugFromHostname } from '@/hooks/useSlugFromHostname'
import type { TenantPublicConfig } from '@/lib/tenant/types'

interface Slide {
  id: string
  image: string
  alt: string
  productSlug: string
  localFallback?: string
}

const CombosSection: React.FC = () => {
  const tenant = useTenantSafe()
  const slugFromHost = useSlugFromHostname()
  const { trackEvent } = useAnalytics()
  const [currentIndex, setCurrentIndex] = useState(1)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [imagesLoaded, setImagesLoaded] = useState(false)
  const [loadedImagesCount, setLoadedImagesCount] = useState(0)
  const router = useRouter()

  // ⚡ MULTITENANT: Usar tenant del contexto o slug del hostname para no mostrar Pinteya en pintemas.com
  const effectiveTenant = useMemo((): TenantPublicConfig | null => {
    if (tenant?.slug) return tenant
    if (slugFromHost) return { slug: slugFromHost } as TenantPublicConfig
    return null
  }, [tenant, slugFromHost])

  const fallbackImages = [
    '/images/hero/hero2/hero4.webp',
    '/images/hero/hero2/hero5.webp',
    '/images/hero/hero2/hero6.webp',
  ]

  const slides = useMemo<Slide[]>(() => {
    const localFallbacks = effectiveTenant
      ? [
          `/tenants/${effectiveTenant.slug}/combos/combo1.webp`,
          `/tenants/${effectiveTenant.slug}/combos/combo2.webp`,
          `/tenants/${effectiveTenant.slug}/combos/combo3.webp`,
        ]
      : fallbackImages
    const comboImages = effectiveTenant
      ? getTenantAssetPaths(effectiveTenant, [
          'combos/combo1.webp',
          'combos/combo2.webp',
          'combos/combo3.webp',
        ])
      : fallbackImages

    return [
       {
         id: 'combo-hero-1',
         image: comboImages[0] ?? localFallbacks[0] ?? fallbackImages[0],
         alt: 'Combo destacado - slide 1',
         productSlug: 'plavicon-fibrado-plavicon',
         localFallback: localFallbacks[0] ?? fallbackImages[0],
       },
       {
         id: 'combo-hero-2',
         image: comboImages[1] ?? localFallbacks[1] ?? fallbackImages[1],
         alt: 'Combo destacado - slide 2',
         productSlug: 'sintetico-converlux',
         localFallback: localFallbacks[1] ?? fallbackImages[1],
       },
       {
         id: 'combo-hero-3',
         image: comboImages[2] ?? localFallbacks[2] ?? fallbackImages[2],
         alt: 'Combo destacado - slide 3',
         productSlug: 'recuplast-frentes',
         localFallback: localFallbacks[2] ?? fallbackImages[2],
       },
     ]
  }, [effectiveTenant])
   
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
     []
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
    onSwipeLeft: goToNext, // Deslizar izquierda = siguiente slide
    onSwipeRight: goToPrevious, // Deslizar derecha = slide anterior
    threshold: 50, // Distancia mínima de 50px para detectar swipe
    preventDefaultTouchmove: false, // No interferir con scroll vertical
  })

  // ⚡ FIX: Forzar eliminación de cualquier zoom/scale aplicado dinámicamente
  useEffect(() => {
    const forceNoZoom = () => {
      const combosSection = document.querySelector('.CombosSection')
      if (!combosSection) return

      // Aplicar estilos a todos los elementos dentro de CombosSection
      const allElements = combosSection.querySelectorAll('*')
      allElements.forEach((el) => {
        const htmlEl = el as HTMLElement
        if (htmlEl.style) {
          // Solo aplicar si no es el contenedor de slides (necesita translateX)
          if (!htmlEl.classList.contains('flex') || !htmlEl.classList.contains('h-full')) {
            htmlEl.style.setProperty('transform', 'none', 'important')
            htmlEl.style.setProperty('-webkit-transform', 'none', 'important')
            htmlEl.style.setProperty('scale', '1', 'important')
            htmlEl.style.setProperty('zoom', '1', 'important')
          }
        }
      })

      // Aplicar específicamente a las imágenes
      const images = combosSection.querySelectorAll('img')
      images.forEach((img) => {
        const htmlImg = img as HTMLElement
        htmlImg.style.setProperty('transform', 'none', 'important')
        htmlImg.style.setProperty('-webkit-transform', 'none', 'important')
        htmlImg.style.setProperty('scale', '1', 'important')
        htmlImg.style.setProperty('zoom', '1', 'important')
        htmlImg.style.setProperty('transition', 'none', 'important')
      })

      // Aplicar a los contenedores de slides (excepto el que tiene translateX)
      const slideContainers = combosSection.querySelectorAll('div[class*="min-w-full"]')
      slideContainers.forEach((container) => {
        const htmlContainer = container as HTMLElement
        htmlContainer.style.setProperty('transform', 'none', 'important')
        htmlContainer.style.setProperty('-webkit-transform', 'none', 'important')
        htmlContainer.style.setProperty('scale', '1', 'important')
        htmlContainer.style.setProperty('zoom', '1', 'important')
      })
    }

    // Ejecutar inmediatamente y después de un pequeño delay
    forceNoZoom()
    const timer = setTimeout(forceNoZoom, 100)
    const timer2 = setTimeout(forceNoZoom, 500)

    // Observar cambios en el DOM
    const observer = new MutationObserver(forceNoZoom)
    const combosSection = document.querySelector('.CombosSection')
    if (combosSection) {
      observer.observe(combosSection, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class'],
      })
    }

    return () => {
      clearTimeout(timer)
      clearTimeout(timer2)
      observer.disconnect()
    }
  }, [])

   // Handler para abrir el modal del producto al hacer click en el slide
   const handleSlideClick = useCallback((productSlug: string, e: React.MouseEvent) => {
     // Prevenir que el click interfiera con los gestos de swipe
     e.stopPropagation()
     // Registrar click en combo slide (engagement)
     trackEvent('click', 'engagement', 'combo_slide', productSlug)
     // Navegar a la página del producto que automáticamente abre el modal
     router.push(`/products/${productSlug}`)
   }, [router, trackEvent])

  return (
    <div 
      className="relative w-full h-full CombosSection" 
      style={{ 
        width: '100%', 
        maxWidth: '100%', 
        height: '100%',
        transform: 'none',
        scale: '1',
        zoom: '1',
      }}
    >
      {/* Contenedor del carrusel con aspect ratio preservado - Igual que HeroCarousel */}
      {/* ⚡ FIX: Full width sin padding (el padding está en CombosOptimized) */}
      <div 
        className="relative w-full h-full overflow-hidden"
        style={{ 
          aspectRatio: '2.77',
          width: '100%',
          maxWidth: '100%',
          height: '100%',
          transform: 'none',
          scale: '1',
          zoom: '1',
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
                
                // Usar directamente el productSlug del slide actual
                // Cada slide en extendedSlides ya tiene su productSlug correcto
                const productSlug = slide.productSlug
                
                return (
                  <div
                    key={`${slide.id}-${index}`}
                    className="min-w-full h-full flex-shrink-0 relative cursor-pointer"
                    onClick={(e) => productSlug && handleSlideClick(productSlug, e)}
                    style={{
                      willChange: isTransitioning ? 'transform' : 'auto',
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                      transform: 'none',
                      scale: '1',
                      zoom: '1',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'none'
                      e.currentTarget.style.scale = '1'
                      e.currentTarget.style.zoom = '1'
                    }}
                  >
                    <Image
                      src={slide.image}
                      alt={slide.alt}
                      fill
                      priority={index === 1}
                      fetchPriority={index === 1 ? 'high' : 'auto'}
                      className="object-cover"
                      style={{
                        transform: 'none !important',
                        transition: 'none !important',
                        scale: '1 !important',
                        zoom: '1 !important',
                      }}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
                      quality={80}
                      onLoad={() => {
                        setLoadedImagesCount(prev => prev + 1)
                      }}
                      onError={(e) => {
                        // Fallback a ruta local si Supabase falla
                        if (slide.localFallback) {
                          const target = e.target as HTMLImageElement
                          if (target.src !== slide.localFallback) {
                            target.src = slide.localFallback
                          }
                        }
                      }}
                      onMouseEnter={(e) => {
                        const target = e.currentTarget
                        target.style.transform = 'none'
                        target.style.scale = '1'
                        target.style.zoom = '1'
                      }}
                    />
                  </div>
                )
              })}
          </div>

          {/* Botones de navegación - Solo en desktop, mitad y mitad al borde del banner */}
          {/* ⚡ FASE 8: Optimizado - reemplazar background-color animado por opacity */}
          <button
            onClick={goToPrevious}
            className='hidden md:flex absolute -left-5 top-1/2 -translate-y-1/2 z-10 
                     w-10 h-10 rounded-full bg-white/90 border-2 border-gray-200
                     text-blaze-orange-600 shadow-lg
                     transition-transform duration-500 hover:scale-110 active:scale-95
                     items-center justify-center group relative'
            style={{
              // ⚡ FASE 8: Usar opacity en lugar de background-color animado
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
              // ⚡ FASE 8: Usar opacity en lugar de background-color animado
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
          {/* ⚡ FIX: Usar width en lugar de scaleX para crear pill en lugar de elipse */}
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

 export default CombosSection
