'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from '@/lib/optimized-imports'
import { useDevicePerformance } from '@/hooks/useDevicePerformance'

interface HeroSlide {
  id: string
  image: string
  alt: string
}

// ⚡ OPTIMIZACIÓN CRÍTICA: SVG → WebP para reducir tamaño de transferencia
// ⚡ FASE 21: hero1.webp NO se incluye aquí porque ya está renderizado como imagen estática
// El carousel empezará en hero2.webp para evitar duplicación de requests
const heroSlides: HeroSlide[] = [
  {
    id: 'hero-2',
    image: '/images/hero/hero2/hero2.webp',
    alt: 'Envío express en 24HS - Pinteya'
  },
  {
    id: 'hero-3',
    image: '/images/hero/hero2/hero3.webp',
    alt: 'Pagá con Mercado Pago - Pinteya'
  },
  {
    id: 'hero-4',
    image: '/images/hero/hero2/hero4.webp',
    alt: 'Pintá rápido, fácil y cotiza al instante - Pinteya'
  },
  {
    id: 'hero-5',
    image: '/images/hero/hero2/hero5.webp',
    alt: 'Pintá rápido, fácil y cotiza al instante - Pinteya'
  },
  {
    id: 'hero-6',
    image: '/images/hero/hero2/hero6.webp',
    alt: 'Pintá rápido, fácil y cotiza al instante - Pinteya'
  }
]

const HeroCarousel = () => {
  // ⚡ OPTIMIZACIÓN: Detectar nivel de rendimiento para deshabilitar auto-play en dispositivos de bajo rendimiento
  const performanceLevel = useDevicePerformance()
  const isLowPerformance = performanceLevel === 'low'
  
  // ⚡ FASE 21: Empezar en índice 1 (primera slide real del carousel, que es hero2.webp)
  // Índice 0 es el clone de la última, índice 1 es hero2.webp (primera real)
  // Esto evita cargar hero1.webp que ya está renderizado como imagen estática
  const [currentIndex, setCurrentIndex] = useState(1) // Empezar en la primera slide real (hero2.webp)
  const [isTransitioning, setIsTransitioning] = useState(false)
  // ⚡ OPTIMIZACIÓN: Deshabilitar auto-play por defecto en dispositivos de bajo rendimiento
  // Inicializar como false para ser seguro, luego actualizar cuando se detecte el nivel de rendimiento
  const [isAutoPlaying, setIsAutoPlaying] = useState(false)
  
  // ⚡ FIX: Actualizar isAutoPlaying cuando se detecte el nivel de rendimiento (asíncrono)
  useEffect(() => {
    // Solo habilitar auto-play si NO es dispositivo de bajo rendimiento
    setIsAutoPlaying(!isLowPerformance)
  }, [isLowPerformance])

  // ⚡ FASE 21: Array extendido sin hero1.webp
  // [última, ...originales, primera] - pero primera es hero2.webp, no hero1.webp
  const extendedSlides = useMemo(() => [
    heroSlides[heroSlides.length - 1], // Clone de la última
    ...heroSlides,                       // Slides originales (hero2, hero3, hero4, hero5, hero6)
    heroSlides[0]                        // Clone de la primera (hero2.webp)
  ], [])

  // Callbacks de navegación
  const goToSlide = useCallback((index: number) => {
    setIsTransitioning(true)
    setCurrentIndex(index + 1) // ⚡ FASE 21: +1 porque índice 0 es clone, índice 1 es primera real
    setIsAutoPlaying(false)
    // ⚡ FIX: Solo re-habilitar auto-play si NO es dispositivo de bajo rendimiento
    if (!isLowPerformance) {
      setTimeout(() => setIsAutoPlaying(true), 10000)
    }
  }, [isLowPerformance])

  const goToPrevious = useCallback(() => {
    setIsTransitioning(true)
    setCurrentIndex((prev) => prev - 1)
    setIsAutoPlaying(false)
    // ⚡ FIX: Solo re-habilitar auto-play si NO es dispositivo de bajo rendimiento
    if (!isLowPerformance) {
      setTimeout(() => setIsAutoPlaying(true), 10000)
    }
  }, [isLowPerformance])

  const goToNext = useCallback(() => {
    setIsTransitioning(true)
    setCurrentIndex((prev) => prev + 1)
    setIsAutoPlaying(false)
    // ⚡ FIX: Solo re-habilitar auto-play si NO es dispositivo de bajo rendimiento
    if (!isLowPerformance) {
      setTimeout(() => setIsAutoPlaying(true), 10000)
    }
  }, [isLowPerformance])

  // Auto-play cada 5 segundos
  useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(() => {
      goToNext()
    }, 5000)

    return () => clearInterval(interval)
  }, [isAutoPlaying, goToNext])

  // ⚡ FASE 21: Manejar el loop infinito - ajustado para empezar en índice 0
  useEffect(() => {
    if (!isTransitioning) return

    // Si estamos en el clone final, saltar sin transición al inicio real (índice 1)
    if (currentIndex === extendedSlides.length - 1) {
      setTimeout(() => {
        setIsTransitioning(false)
        setCurrentIndex(1) // ⚡ FASE 21: Empezar en índice 1 (hero2.webp, primera slide real)
      }, 700) // Después de la transición
    }
    
    // Si estamos en el clone inicial, saltar sin transición al final real
    if (currentIndex === 0 && extendedSlides.length > 0) {
      // Verificar que no es el índice inicial válido (0 es válido para hero2.webp)
      // Solo saltar si realmente estamos en el clone
      const isClone = currentIndex === 0 && extendedSlides[0]?.id === heroSlides[heroSlides.length - 1]?.id
      if (isClone) {
        setTimeout(() => {
          setIsTransitioning(false)
          setCurrentIndex(heroSlides.length - 1) // ⚡ FASE 21: Última slide real
        }, 700)
      }
    }
  }, [currentIndex, isTransitioning, extendedSlides.length])

  return (
    <div className="relative w-full hero-carousel">
      {/* Contenedor del carrusel con aspect ratio preservado */}
      <div className="max-w-[1200px] mx-auto px-2 sm:px-4 lg:px-6 pt-1 sm:pt-2 pb-1 sm:pb-1.5">
        <div 
          className="relative w-full overflow-hidden"
          style={{ aspectRatio: '2.77' }}
        >
          {/* Slides */}
          {/* ⚡ OPTIMIZACIÓN: GPU acceleration para transiciones a 60fps */}
          <div 
            className={`flex h-full ${isTransitioning ? 'transition-transform duration-1000 ease-in-out' : ''}`}
            style={{ 
              transform: `translateX(-${currentIndex * 100}%)`,
              willChange: isTransitioning ? 'transform' : 'auto',
              backfaceVisibility: 'hidden', // Prevenir flickering
              WebkitBackfaceVisibility: 'hidden',
            }}
          >
            {extendedSlides.map((slide, index) => {
              // ⚡ FASE 21: NO usar priority en ninguna imagen del carousel
              // La imagen estática en page.tsx ya tiene priority y preload
              // Usar priority aquí causaría duplicación de requests
              if (!slide) return null
              
              // ⚡ FASE 21: Índice 1 es la primera slide real (hero2.webp)
              // Índice 0 es clone de la última, índice 1 es hero2.webp (primera real sin hero1.webp)
              const isFirstRealSlide = index === 1
              const isClone = index === 0 || index === extendedSlides.length - 1
              
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
                    priority={false} // ⚡ FASE 21: NO usar priority - imagen estática ya tiene priority
                    loading="lazy" // ⚡ FASE 21: Lazy loading para todas las imágenes del carousel
                    fetchPriority="auto" // ⚡ FASE 21: Auto priority - no competir con imagen estática
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px" // ⚡ FASE 21: Ajustado para match con imagen estática
                    quality={75} // ⚡ FASE 14: Reducido de 80 a 75 para mejor balance tamaño/calidad
                    decoding="async" // ⚡ FASE 14: Decodificar de forma asíncrona
                  />
                </div>
              )
            })}
          </div>

          {/* Botones de navegación - Solo en desktop */}
          {/* ⚡ FASE 8: Optimizado - reemplazar background-color animado por opacity */}
          <button
            onClick={goToPrevious}
            className="hidden md:flex absolute left-2 lg:left-4 top-1/2 -translate-y-1/2 z-10 
                     bg-white/90 text-blaze-orange-600 
                     p-2 lg:p-3 rounded-full shadow-lg
                     transition-transform duration-500 hover:scale-110 active:scale-95
                     items-center justify-center group relative"
            style={{
              // ⚡ FASE 8: Usar opacity en lugar de background-color animado
              opacity: 0.9,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1'
              // Shadow más intenso en hover usando opacity en pseudo-elemento
              const shadow = e.currentTarget.querySelector('.hover-shadow') as HTMLElement
              if (shadow) shadow.style.opacity = '1'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0.9'
              const shadow = e.currentTarget.querySelector('.hover-shadow') as HTMLElement
              if (shadow) shadow.style.opacity = '0'
            }}
            aria-label="Slide anterior"
          >
            <span className="absolute inset-0 rounded-full shadow-xl opacity-0 hover-shadow transition-opacity duration-500 pointer-events-none" />
            <ChevronLeft className="w-5 h-5 lg:w-6 lg:h-6 group-hover:translate-x-[-2px] transition-transform duration-500 relative z-10" />
          </button>

          <button
            onClick={goToNext}
            className="hidden md:flex absolute right-2 lg:right-4 top-1/2 -translate-y-1/2 z-10 
                     bg-white/90 text-blaze-orange-600 
                     p-2 lg:p-3 rounded-full shadow-lg
                     transition-transform duration-500 hover:scale-110 active:scale-95
                     items-center justify-center group relative"
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
            aria-label="Siguiente slide"
          >
            <span className="absolute inset-0 rounded-full shadow-xl opacity-0 hover-shadow transition-opacity duration-500 pointer-events-none" />
            <ChevronRight className="w-5 h-5 lg:w-6 lg:h-6 group-hover:translate-x-[2px] transition-transform duration-500 relative z-10" />
          </button>

          {/* Indicadores (dots) - Estilo Mercado Libre */}
          {/* ⚡ OPTIMIZACIÓN: Animaciones compositables (transform + opacity) en lugar de width/background-color/box-shadow */}
          <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2 sm:gap-3">
            {heroSlides.map((_, index) => {
              // Calcular el índice real de la slide actual (quitando los clones)
              let realIndex = currentIndex - 1
              if (currentIndex === 0) realIndex = heroSlides.length - 1
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

export default HeroCarousel

