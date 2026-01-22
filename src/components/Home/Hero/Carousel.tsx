/**
 * Componente HeroCarousel refactorizado y optimizado
 * Usa componentes modulares y hooks para mejor performance
 * Soporta multitenancy - usa rutas de assets del tenant
 */

'use client'

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { useDevicePerformance } from '@/hooks/useDevicePerformance'
import { useSwipeGestures } from '@/hooks/useSwipeGestures'
import { useTenantSafe } from '@/contexts/TenantContext'
import { getTenantHeroSlides } from '@/utils/imageOptimization'
import Slide from './Slide'
import NavigationButtons from './NavigationButtons'
import Indicators from './Indicators'
import type { HeroCarouselProps, HeroSlide } from './types'

// ⚡ OPTIMIZACIÓN CRÍTICA: SVG → WebP para reducir tamaño de transferencia
// Fallback slides para cuando no hay tenant context
const FALLBACK_SLIDES: HeroSlide[] = [
  {
    id: 'hero-1',
    image: '/images/hero/hero2/hero1.webp',
    alt: 'Pintá rápido, fácil y cotiza al instante - Productos de pinturería de calidad',
  },
  {
    id: 'hero-2',
    image: '/images/hero/hero2/hero2.webp',
    alt: 'Envío express en 24HS',
  },
  {
    id: 'hero-3',
    image: '/images/hero/hero2/hero3.webp',
    alt: 'Pagá con Mercado Pago',
  },
]

const HeroCarousel: React.FC<HeroCarouselProps> = memo(
  ({ slides: propSlides, autoPlayInterval = 5000, startIndex = 1 }) => {
    // Obtener tenant para rutas de assets dinámicas
    const tenant = useTenantSafe()
    
    // Generar slides basados en el tenant o usar los proporcionados/fallback
    const DEFAULT_SLIDES = useMemo(() => {
      if (propSlides && propSlides.length > 0) {
        return propSlides
      }
      
      if (tenant) {
        // Usar rutas del tenant con alt text dinámico
        const tenantSlides = getTenantHeroSlides(tenant.slug, 3)
        return tenantSlides.map((slide, index) => ({
          ...slide,
          alt: `${tenant.name} - Hero ${index + 1}`,
        }))
      }
      
      return FALLBACK_SLIDES
    }, [tenant, propSlides])
    
    const slides = DEFAULT_SLIDES
    // ⚡ OPTIMIZACIÓN: Detectar nivel de rendimiento para deshabilitar auto-play
    const performanceLevel = useDevicePerformance()
    const isLowPerformance = performanceLevel === 'low'

    // ⚡ FIX: Empezar en índice 1 (primera slide real del carousel, que es hero1.webp)
    // Índice 0 es el clone de la última, índice 1 es hero1.webp (primera real)
    const [currentIndex, setCurrentIndex] = useState(startIndex)
    const [isTransitioning, setIsTransitioning] = useState(false)
    const [isAutoPlaying, setIsAutoPlaying] = useState(false)

    // ⚡ FIX: Actualizar isAutoPlaying cuando se detecte el nivel de rendimiento
    useEffect(() => {
      setIsAutoPlaying(!isLowPerformance)
    }, [isLowPerformance])

    // ⚡ FIX: Array extendido con todas las slides para loop infinito
    const extendedSlides = useMemo(() => {
      if (slides.length === 0) return []
      return [
        slides[slides.length - 1], // Clone de la última
        ...slides, // Slides originales (hero1, hero2, hero3)
        slides[0], // Clone de la primera
      ]
    }, [slides])

    // Callbacks de navegación memoizados
    const goToSlide = useCallback(
      (index: number) => {
        setIsTransitioning(true)
        setCurrentIndex(index + 1) // +1 porque índice 0 es clone
        setIsAutoPlaying(false)
        if (!isLowPerformance) {
          setTimeout(() => setIsAutoPlaying(true), 10000)
        }
      },
      [isLowPerformance]
    )

    const goToPrevious = useCallback(() => {
      setIsTransitioning(true)
      setCurrentIndex((prev) => prev - 1)
      setIsAutoPlaying(false)
      if (!isLowPerformance) {
        setTimeout(() => setIsAutoPlaying(true), 10000)
      }
    }, [isLowPerformance])

    const goToNext = useCallback(() => {
      setIsTransitioning(true)
      setCurrentIndex((prev) => prev + 1)
      setIsAutoPlaying(false)
      if (!isLowPerformance) {
        setTimeout(() => setIsAutoPlaying(true), 10000)
      }
    }, [isLowPerformance])

    // Auto-play cada X segundos
    useEffect(() => {
      if (!isAutoPlaying || slides.length <= 1) return

      const interval = setInterval(() => {
        goToNext()
      }, autoPlayInterval)

      return () => clearInterval(interval)
    }, [isAutoPlaying, autoPlayInterval, goToNext, slides.length])

    // ⚡ FIX: Configurar gestos táctiles para mobile (igual que CombosSection)
    const swipeRef = useSwipeGestures({
      onSwipeLeft: goToNext, // Deslizar izquierda = siguiente slide
      onSwipeRight: goToPrevious, // Deslizar derecha = slide anterior
      threshold: 50, // Distancia mínima de 50px para detectar swipe
      preventDefaultTouchmove: false, // No interferir con scroll vertical
    })

    // ⚡ FIX: Manejar el loop infinito con mejor manejo de estados
    useEffect(() => {
      if (!isTransitioning || extendedSlides.length === 0) return

      // Si estamos en el clone final, saltar sin transición al inicio real (índice 1)
      if (currentIndex === extendedSlides.length - 1) {
        const timeout = setTimeout(() => {
          setIsTransitioning(false)
          // ⚡ FIX: Usar requestAnimationFrame para asegurar que el cambio ocurra después del render
          requestAnimationFrame(() => {
            setCurrentIndex(1)
          })
        }, 700)
        return () => clearTimeout(timeout)
      }

      // Si estamos en el clone inicial, saltar sin transición al final real
      if (currentIndex === 0 && extendedSlides.length > 0) {
        const isClone =
          currentIndex === 0 &&
          extendedSlides[0]?.id === slides[slides.length - 1]?.id
        if (isClone) {
          const timeout = setTimeout(() => {
            setIsTransitioning(false)
            // ⚡ FIX: Usar requestAnimationFrame para asegurar que el cambio ocurra después del render
            requestAnimationFrame(() => {
              setCurrentIndex(slides.length)
            })
          }, 700)
          return () => clearTimeout(timeout)
        }
      }
    }, [currentIndex, isTransitioning, extendedSlides, slides])

    // Calcular el índice real para los indicadores
    const realIndex = useMemo(() => {
      if (currentIndex === 0) return slides.length - 1
      if (currentIndex === extendedSlides.length - 1) return 0
      return currentIndex - 1
    }, [currentIndex, extendedSlides.length, slides.length])

    if (slides.length === 0) {
      return null
    }

    return (
      <div
        className="relative w-full h-full overflow-hidden"
        style={{ aspectRatio: '2.77' }}
      >
        {/* Slides */}
        <div
          ref={swipeRef as React.RefObject<HTMLDivElement>}
          className={`flex h-full ${
            isTransitioning ? 'transition-transform duration-1000 ease-in-out' : ''
          }`}
          style={{
            transform: `translateX(-${currentIndex * 100}%)`,
            willChange: isTransitioning ? 'transform' : 'auto',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            opacity: 1, // ⚡ FIX: Asegurar que siempre sea visible
            visibility: 'visible', // ⚡ FIX: Asegurar que siempre sea visible
          }}
        >
          {extendedSlides.map((slide, index) => (
            <Slide
              key={`${slide.id}-${index}`}
              slide={slide}
              index={index}
              isTransitioning={isTransitioning}
            />
          ))}
        </div>

        {/* Botones de navegación - Solo en desktop */}
        <NavigationButtons
          direction="prev"
          onClick={goToPrevious}
          ariaLabel="Slide anterior"
        />
        <NavigationButtons
          direction="next"
          onClick={goToNext}
          ariaLabel="Siguiente slide"
        />

        {/* Indicadores (dots) */}
        <Indicators
          total={slides.length}
          currentIndex={realIndex}
          onIndicatorClick={goToSlide}
        />
      </div>
    )
  }
)

HeroCarousel.displayName = 'HeroCarousel'

export default HeroCarousel
