'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import dynamic from 'next/dynamic'

const HeroCarousel = dynamic(() => import('../Home-v2/HeroCarousel/index'), {
  ssr: false,
})

/**
 * ⚡ OPTIMIZACIÓN: Componente HeroOptimized para reducir Speed Index y LCP
 * 
 * Estrategia:
 * 1. Renderiza imagen estática inicial en HTML (sin JavaScript)
 * 2. Carga el carousel completo después del FCP
 * 3. Esto elimina el JavaScript del carousel del render inicial
 * 
 * Impacto esperado: -1.5s a -2.0s en Speed Index, -1,000 ms a -1,570 ms en retraso LCP
 */
export default function HeroOptimized() {
  const [showCarousel, setShowCarousel] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const renderCountRef = useRef(0)
  const hasLoggedRef = useRef(false)

  // ⚡ DEBUG: Log de renders
  useEffect(() => {
    renderCountRef.current += 1
    if (process.env.NODE_ENV === 'development' && !hasLoggedRef.current) {
      console.log('🔄 HeroOptimized render #' + renderCountRef.current, {
        showCarousel,
        isMounted,
        timestamp: Date.now(),
      })
      if (renderCountRef.current >= 3) {
        hasLoggedRef.current = true
      }
    }
  })

  // ⚡ FIX: Marcar como montado después del primer render
  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    // ⚡ FASE 15: Cargar carousel después de que LCP se haya registrado
    // Usar requestIdleCallback para no bloquear el hilo principal
    if (!isMounted) return

    const loadCarousel = () => {
      setShowCarousel(true)
    }
    
    // ⚡ FASE 15: Esperar a que LCP se haya registrado antes de cargar carousel
    // Esto asegura que la imagen estática sea el LCP
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1] as PerformanceEntry & { renderTime?: number; loadTime?: number }
          
          // Si LCP ya se registró, cargar carousel
          if (lastEntry && (lastEntry.renderTime || lastEntry.loadTime || lastEntry.startTime)) {
            if ('requestIdleCallback' in window) {
              requestIdleCallback(loadCarousel, { timeout: 1000 })
            } else {
              setTimeout(loadCarousel, 1000)
            }
            lcpObserver.disconnect()
          }
        })
        
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
        
        // Fallback: cargar después de 2 segundos si LCP no se registra
        setTimeout(() => {
          lcpObserver.disconnect()
          if ('requestIdleCallback' in window) {
            requestIdleCallback(loadCarousel, { timeout: 1000 })
          } else {
            setTimeout(loadCarousel, 1000)
          }
        }, 2000)
      } catch (e) {
        // Fallback si PerformanceObserver no está disponible
        if ('requestIdleCallback' in window) {
          requestIdleCallback(loadCarousel, { timeout: 1000 })
        } else {
          setTimeout(loadCarousel, 1000)
        }
      }
    } else {
      // Fallback si PerformanceObserver no está disponible
      if ('requestIdleCallback' in window) {
        requestIdleCallback(loadCarousel, { timeout: 1000 })
      } else {
        setTimeout(loadCarousel, 1000)
      }
    }
  }, [isMounted])

  // ⚡ FASE 2: La imagen estática ahora se renderiza en Server Component (page.tsx)
  // Ocultamos la imagen estática cuando el carousel está listo
  useEffect(() => {
    if (showCarousel) {
      // Ocultar la imagen estática de page.tsx cuando el carousel está listo
      const staticImage = document.querySelector('.hero-lcp-container img, [src="/images/hero/hero2/hero1.webp"]')
      if (staticImage && staticImage instanceof HTMLElement) {
        staticImage.style.opacity = '0'
        staticImage.style.pointerEvents = 'none'
        staticImage.style.position = 'absolute'
      }
    }
  }, [showCarousel])

  // ⚡ FASE 2: La imagen estática ahora se renderiza en Server Component (page.tsx)
  // Solo renderizamos el carousel aquí, que se carga después del LCP
  return (
    <div className="relative w-full">
      <div className="max-w-[1200px] mx-auto px-2 sm:px-4 lg:px-6 pt-1 sm:pt-2 pb-1 sm:pb-1.5">
        <div className="relative w-full overflow-hidden" style={{ aspectRatio: '2.77' }}>
          {/* ⚡ FASE 2: Carousel carga dinámicamente después del LCP */}
          {/* La imagen estática está en page.tsx (Server Component) para descubrimiento temprano */}
          {isMounted && (
            <div 
              className={`relative z-20 transition-opacity duration-500 ${
                showCarousel ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              <HeroCarousel />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

