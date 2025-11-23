'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface HeroSlide {
  id: string
  image: string
  alt: string
}

const heroSlides: HeroSlide[] = [
  {
    id: 'hero-1',
    image: '/images/hero/hero2/hero1.svg',
    alt: 'Pintá rápido, fácil y cotiza al instante - Pinteya'
  },
  {
    id: 'hero-2',
    image: '/images/hero/hero2/hero2.svg',
    alt: 'Envío express en 24HS - Pinteya'
  },
  {
    id: 'hero-3',
    image: '/images/hero/hero2/hero3.svg',
    alt: 'Pagá con Mercado Pago - Pinteya'
  }
]

const HeroCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(1) // Empezar en la primera slide real
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

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
          <div 
            className={`flex h-full ${isTransitioning ? 'transition-transform duration-700 ease-in-out' : ''}`}
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {extendedSlides.map((slide, index) => (
              <div
                key={`${slide.id}-${index}`}
                className="min-w-full h-full flex-shrink-0 relative"
              >
                <Image
                  src={slide.image}
                  alt={slide.alt}
                  fill
                  priority={index === 1} // ⚡ CRITICAL: La primera slide real está en índice 1 - Prioridad para LCP
                  quality={85} // ⚡ PERFORMANCE: Calidad optimizada
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
                />
              </div>
            ))}
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
          <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2 sm:gap-3">
            {heroSlides.map((_, index) => {
              // Calcular el índice real de la slide actual (quitando los clones)
              let realIndex = currentIndex - 1
              if (currentIndex === 0) realIndex = heroSlides.length - 1
              if (currentIndex === extendedSlides.length - 1) realIndex = 0
              
              return (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`
                    transition-all duration-300 rounded-full
                    ${realIndex === index 
                      ? 'bg-white w-6 sm:w-8 h-2 sm:h-2.5 shadow-md' 
                      : 'bg-white/60 hover:bg-white/80 w-2 sm:w-2.5 h-2 sm:h-2.5'
                    }
                  `}
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

