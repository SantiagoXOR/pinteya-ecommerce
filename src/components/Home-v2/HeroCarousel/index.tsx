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
const heroSlides: HeroSlide[] = [
  {
    id: 'hero-1',
    image: '/images/hero/hero2/hero1.webp',
    alt: 'Pintá rápido, fácil y cotiza al instante - Pinteya'
  },
  {
    id: 'hero-2',
    image: '/images/hero/hero2/hero2.webp',
    alt: 'Envío express en 24HS - Pinteya'
  },
  {
    id: 'hero-3',
    image: '/images/hero/hero2/hero3.webp',
    alt: 'Pagá con Mercado Pago - Pinteya'
  }
]

const HeroCarousel = () => {
  // ⚡ OPTIMIZACIÓN: Detectar nivel de rendimiento para deshabilitar auto-play en dispositivos de bajo rendimiento
  const performanceLevel = useDevicePerformance()
  const isLowPerformance = performanceLevel === 'low'
  
  const [currentIndex, setCurrentIndex] = useState(1) // Empezar en la primera slide real
  const [isTransitioning, setIsTransitioning] = useState(false)
  // ⚡ OPTIMIZACIÓN: Deshabilitar auto-play por defecto en dispositivos de bajo rendimiento
  // Inicializar como false para ser seguro, luego actualizar cuando se detecte el nivel de rendimiento
  const [isAutoPlaying, setIsAutoPlaying] = useState(false)
  
  // ⚡ FIX: Actualizar isAutoPlaying cuando se detecte el nivel de rendimiento (asíncrono)
  useEffect(() => {
    // Solo habilitar auto-play si NO es dispositivo de bajo rendimiento
    setIsAutoPlaying(!isLowPerformance)
  }, [isLowPerformance])

  // Crear array extendido: [última, ...originales, primera]
  const extendedSlides = useMemo(() => [
    heroSlides[heroSlides.length - 1], // Clone de la última
    ...heroSlides,                       // Slides originales
    heroSlides[0]                        // Clone de la primera
  ], [])

  // Callbacks de navegación
  const goToSlide = useCallback((index: number) => {
    setIsTransitioning(true)
    setCurrentIndex(index + 1) // +1 porque el primer slide real está en índice 1
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

  // Manejar el loop infinito
  useEffect(() => {
    if (!isTransitioning) return

    // Si estamos en el clone final, saltar sin transición al inicio real
    if (currentIndex === extendedSlides.length - 1) {
      setTimeout(() => {
        setIsTransitioning(false)
        setCurrentIndex(1)
      }, 700) // Después de la transición
    }
    
    // Si estamos en el clone inicial, saltar sin transición al final real
    if (currentIndex === 0) {
      setTimeout(() => {
        setIsTransitioning(false)
        setCurrentIndex(heroSlides.length)
      }, 700)
    }
  }, [currentIndex, isTransitioning, extendedSlides.length])

  return (
    <div className="relative w-full">
      {/* Contenedor del carrusel con aspect ratio preservado */}
      <div className="max-w-[1200px] mx-auto px-2 sm:px-4 lg:px-6 py-2 sm:py-3">
        <div 
          className="relative w-full overflow-hidden"
          style={{ aspectRatio: '2.77' }}
        >
          {/* Slides */}
          {/* ⚡ OPTIMIZACIÓN: GPU acceleration para transiciones a 60fps */}
          <div 
            className={`flex h-full ${isTransitioning ? 'transition-transform duration-700 ease-in-out' : ''}`}
            style={{ 
              transform: `translateX(-${currentIndex * 100}%)`,
              willChange: isTransitioning ? 'transform' : 'auto',
              backfaceVisibility: 'hidden', // Prevenir flickering
              WebkitBackfaceVisibility: 'hidden',
            }}
          >
            {extendedSlides.map((slide, index) => {
              // ⚡ OPTIMIZACIÓN: Solo la primera imagen real (índice 1) tiene priority
              // Imágenes 2 y 3 (índices 2 y 0) se cargan lazy
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
                    priority={isFirstRealSlide} // Solo primera slide real
                    loading={isFirstRealSlide ? undefined : 'lazy'} // Lazy para slides 2 y 3
                    fetchPriority={isFirstRealSlide ? 'high' : 'auto'} // ⚡ CRITICAL: fetchPriority explícito para LCP
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
                    quality={80} // ⚡ OPTIMIZACIÓN: Balance tamaño/calidad para WebP
                  />
                </div>
              )
            })}
          </div>

          {/* Botones de navegación - Solo en desktop */}
          <button
            onClick={goToPrevious}
            className="hidden md:flex absolute left-2 lg:left-4 top-1/2 -translate-y-1/2 z-10 
                     bg-white/90 hover:bg-white text-blaze-orange-600 
                     p-2 lg:p-3 rounded-full shadow-lg hover:shadow-xl
                     transition-all duration-300 hover:scale-110 active:scale-95
                     items-center justify-center group"
            aria-label="Slide anterior"
          >
            <ChevronLeft className="w-5 h-5 lg:w-6 lg:h-6 group-hover:translate-x-[-2px] transition-transform" />
          </button>

          <button
            onClick={goToNext}
            className="hidden md:flex absolute right-2 lg:right-4 top-1/2 -translate-y-1/2 z-10 
                     bg-white/90 hover:bg-white text-blaze-orange-600 
                     p-2 lg:p-3 rounded-full shadow-lg hover:shadow-xl
                     transition-all duration-300 hover:scale-110 active:scale-95
                     items-center justify-center group"
            aria-label="Siguiente slide"
          >
            <ChevronRight className="w-5 h-5 lg:w-6 lg:h-6 group-hover:translate-x-[2px] transition-transform" />
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
                  className={`relative rounded-full bg-white/60 transition-all duration-300 ${
                    isActive 
                      ? 'w-8 sm:w-10 h-2 sm:h-2.5' 
                      : 'w-2 sm:w-2.5 h-2 sm:h-2.5'
                  }`}
                  style={{
                    opacity: isActive ? 1 : 0.6,
                    // ⚡ OPTIMIZACIÓN: Solo usar transform y opacity (propiedades compositables)
                    willChange: isActive ? 'transform, opacity' : 'opacity',
                    transform: 'translateZ(0)', // GPU acceleration
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

