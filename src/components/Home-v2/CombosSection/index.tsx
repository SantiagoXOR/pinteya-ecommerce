 'use client'

 import React, { useState, useEffect, useCallback, useMemo } from 'react'
 import Image from 'next/image'
 import { ChevronLeft, ChevronRight } from '@/lib/optimized-imports'
 import { useSwipeGestures } from '@/hooks/useSwipeGestures'
 import { useRouter } from 'next/navigation'

 interface Slide {
   id: string
   image: string
   alt: string
   productSlug: string
 }

// ⚡ OPTIMIZACIÓN CRÍTICA: SVG → WebP para reducir tamaño de transferencia
// Carrusel igual al de Hero pero con WebP optimizado
const slides: Slide[] = [
  { id: 'combo-hero-4', image: '/images/hero/hero2/hero4.webp', alt: 'Combo destacado - slide 1', productSlug: 'plavicon-fibrado-plavicon' },
  { id: 'combo-hero-5', image: '/images/hero/hero2/hero5.webp', alt: 'Combo destacado - slide 2', productSlug: 'sintetico-converlux' },
  { id: 'combo-hero-6', image: '/images/hero/hero2/hero6.webp', alt: 'Combo destacado - slide 3', productSlug: 'recuplast-frentes' },
]

 const CombosSection: React.FC = () => {
   const [currentIndex, setCurrentIndex] = useState(1)
   const [isTransitioning, setIsTransitioning] = useState(false)
   const [isAutoPlaying, setIsAutoPlaying] = useState(true)
   const [imagesLoaded, setImagesLoaded] = useState(false) // ⚡ FIX: Estado para verificar carga de imágenes
   const [loadedImagesCount, setLoadedImagesCount] = useState(0)
   const router = useRouter()
   
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

   // Handler para abrir el modal del producto al hacer click en el slide
   const handleSlideClick = useCallback((productSlug: string, e: React.MouseEvent) => {
     // Prevenir que el click interfiera con los gestos de swipe
     e.stopPropagation()
     
     // Navegar a la página del producto que automáticamente abre el modal
     router.push(`/products/${productSlug}`)
   }, [router])

  return (
    <div className="relative w-full CombosSection" style={{ width: '100%', maxWidth: '100%' }}>
      {/* Contenedor del carrusel con aspect ratio preservado - Igual que HeroCarousel */}
      {/* ⚡ FIX: Full width con estilos correctos (igual que hero) */}
      <div className="w-full px-2 sm:px-4 lg:px-6 py-2 sm:py-3" style={{ width: '100%', maxWidth: '100%' }}>
        <div 
          className="relative w-full overflow-hidden"
          style={{ 
            aspectRatio: '2.77',
            width: '100%',
            maxWidth: '100%',
            margin: '0 auto',
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
                    }}
                  >
                    <Image
                      src={slide.image}
                      alt={slide.alt}
                      fill
                      priority={index === 1}
                      fetchPriority={index === 1 ? 'high' : 'auto'}
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
                      quality={80}
                      onLoad={() => {
                        setLoadedImagesCount(prev => prev + 1)
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
          {/* ⚡ OPTIMIZACIÓN: Animaciones compositables (transform + opacity) en lugar de width/background-color/box-shadow */}
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
                  className="relative rounded-full bg-white/60 h-2 sm:h-2.5 w-2 sm:w-2.5 transition-opacity duration-500"
                  style={{
                    opacity: isActive ? 1 : 0.6,
                    // ⚡ FASE 8: Reemplazar width animado por transform: scaleX() (propiedad compositable)
                    transform: isActive ? 'scaleX(4) translateZ(0)' : 'scaleX(1) translateZ(0)',
                    willChange: 'transform, opacity',
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
    </div>
  )
 }

 export default CombosSection

