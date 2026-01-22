'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from '@/lib/optimized-imports'
import { useDevicePerformance } from '@/hooks/useDevicePerformance'
import { useTenantSafe } from '@/contexts/TenantContext'

interface HeroSlide {
  id: string
  image: string
  alt: string
}

const HeroCarousel = () => {
  // Obtener datos del tenant
  const tenant = useTenantSafe()
  const tenantSlug = tenant?.slug || 'pinteya'
  const tenantName = tenant?.name || 'Pinteya'
  
  // ⚡ OPTIMIZACIÓN CRÍTICA: SVG → WebP para reducir tamaño de transferencia
  // ⚡ FASE 23: hero1.webp NO se incluye aquí porque ya está renderizado como imagen estática
  // ⚡ FASE 23: Solo usar hero2 y hero3 - eliminar hero4, hero5, hero6 para reducir carga
  // El carousel empezará en hero2.webp para evitar duplicación de requests
  const heroSlides: HeroSlide[] = useMemo(() => [
    {
      id: 'hero-2',
      image: `/tenants/${tenantSlug}/hero/hero2.webp`,
      alt: `Envío express en 24HS - ${tenantName}`
    },
    {
      id: 'hero-3',
      image: `/tenants/${tenantSlug}/hero/hero3.webp`,
      alt: `Pagá con Mercado Pago - ${tenantName}`
    }
  ], [tenantSlug, tenantName])
  // ⚡ OPTIMIZACIÓN: Detectar nivel de rendimiento para deshabilitar auto-play en dispositivos de bajo rendimiento
  const performanceLevel = useDevicePerformance()
  const isLowPerformance = performanceLevel === 'low'
  
  // ⚡ FASE 23: Empezar en índice 1 (primera slide real del carousel, que es hero2.webp)
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

  // ⚡ FASE 23: Array extendido sin hero1.webp
  // [última, ...originales, primera] - pero primera es hero2.webp, no hero1.webp
  // ⚡ FASE 23: Solo hero2 y hero3 (eliminados hero4, hero5, hero6)
  const extendedSlides = useMemo(() => [
    heroSlides[heroSlides.length - 1], // Clone de la última (hero3.webp)
    ...heroSlides,                       // Slides originales (hero2, hero3)
    heroSlides[0]                        // Clone de la primera (hero2.webp)
  ], [heroSlides])

  // Callbacks de navegación
  const goToSlide = useCallback((index: number) => {
    setIsTransitioning(true)
    setCurrentIndex(index + 1) // ⚡ FASE 23: +1 porque índice 0 es clone, índice 1 es primera real
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

  // ⚡ FASE 23: Manejar el loop infinito - ajustado para empezar en índice 1
  useEffect(() => {
    if (!isTransitioning) return

    // Si estamos en el clone final, saltar sin transición al inicio real (índice 1)
    if (currentIndex === extendedSlides.length - 1) {
      setTimeout(() => {
        setIsTransitioning(false)
        setCurrentIndex(1) // ⚡ FASE 23: Empezar en índice 1 (hero2.webp, primera slide real)
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
          setCurrentIndex(heroSlides.length) // ⚡ FASE 23: Última slide real (hero3.webp está en índice 2, pero con clones es heroSlides.length)
        }, 700)
      }
    }
  }, [currentIndex, isTransitioning, extendedSlides.length, heroSlides.length])

  // ⚡ FASE 23: El carousel se renderiza dentro del contenedor de HeroOptimized
  // No necesita su propio contenedor porque ya está dentro del contenedor de la imagen estática
  return (
    <div 
      className="relative w-full h-full overflow-hidden"
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
          // ⚡ FASE 23: NO usar priority en ninguna imagen del carousel
          // La imagen estática en page.tsx ya tiene priority y preload
          // Usar priority aquí causaría duplicación de requests
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
                priority={false} // ⚡ FASE 23: NO usar priority - imagen estática ya tiene priority
                loading="lazy" // ⚡ FASE 23: Lazy loading para todas las imágenes del carousel
                fetchPriority="auto" // ⚡ FASE 23: Auto priority - no competir con imagen estática
                className="object-contain"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
                quality={75}
                decoding="async"
              />
            </div>
          )
        })}
      </div>

      {/* Botones de navegación - Solo en desktop */}
      <button
        onClick={goToPrevious}
        className="hidden md:flex absolute left-2 lg:left-4 top-1/2 -translate-y-1/2 z-10 
                 bg-white/90 text-blaze-orange-600 
                 p-2 lg:p-3 rounded-full shadow-lg
                 transition-transform duration-500 hover:scale-110 active:scale-95
                 items-center justify-center group relative"
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
  )
}

export default HeroCarousel
