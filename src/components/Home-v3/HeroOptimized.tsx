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
    // ⚡ FASE 20: Cargar carousel después de que LCP se haya registrado
    // Aumentar delay para asegurar que Lighthouse detecte el LCP correctamente
    if (!isMounted) return

    const loadCarousel = () => {
      setShowCarousel(true)
    }
    
    // ⚡ FASE 20: Cargar carousel después de FCP + delay corto
    // Reducir delays para no afectar SI, pero mantener imagen hero visible
    // Usar FCP como referencia en lugar de LCP para evitar delays largos
    if ('PerformanceObserver' in window) {
      try {
        // Detectar FCP primero (más rápido que LCP)
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          if (entries.length > 0) {
            // ⚡ FASE 20: Después de FCP, esperar 3s para asegurar que LCP se registre
            // Esto es más corto que 8s pero suficiente para que Lighthouse detecte LCP
            setTimeout(() => {
              if ('requestIdleCallback' in window) {
                requestIdleCallback(loadCarousel, { timeout: 1000 })
              } else {
                setTimeout(loadCarousel, 1000)
              }
            }, 3000) // ⚡ Reducido de 8s a 3s después de FCP
            fcpObserver.disconnect()
          }
        })
        
        fcpObserver.observe({ entryTypes: ['paint'], buffered: true })
        
        // Fallback: cargar después de 4 segundos si FCP no se detecta
        setTimeout(() => {
          fcpObserver.disconnect()
          if ('requestIdleCallback' in window) {
            requestIdleCallback(loadCarousel, { timeout: 1000 })
          } else {
            setTimeout(loadCarousel, 1000)
          }
        }, 4000) // ⚡ Reducido de 8s a 4s
      } catch (e) {
        // Fallback si PerformanceObserver no está disponible
        setTimeout(() => {
          if ('requestIdleCallback' in window) {
            requestIdleCallback(loadCarousel, { timeout: 1000 })
          } else {
            setTimeout(loadCarousel, 1000)
          }
        }, 4000) // ⚡ Reducido de 8s a 4s
      }
    } else {
      // Fallback si PerformanceObserver no está disponible
      setTimeout(() => {
        if ('requestIdleCallback' in window) {
          requestIdleCallback(loadCarousel, { timeout: 1000 })
        } else {
          setTimeout(loadCarousel, 1000)
        }
      }, 4000) // ⚡ Reducido de 8s a 4s
    }
    
    // Cleanup
    return () => {
      if (lcpObserver) {
        lcpObserver.disconnect()
      }
    }
  }, [isMounted])

  // ⚡ FASE 20: La imagen estática ahora se renderiza en Server Component (page.tsx)
  // Ocultamos la imagen estática cuando el carousel está listo, pero con delay reducido
  useEffect(() => {
    if (showCarousel) {
      // ⚡ FASE 20: Delay reducido a 1s antes de ocultar para no afectar SI
      setTimeout(() => {
        // Ocultar la imagen estática de page.tsx cuando el carousel está listo
        const staticImage = document.querySelector('.hero-lcp-container img, [src="/images/hero/hero2/hero1.webp"]')
        if (staticImage && staticImage instanceof HTMLElement) {
          staticImage.style.opacity = '0'
          staticImage.style.pointerEvents = 'none'
          staticImage.style.position = 'absolute'
        }
      }, 1000) // ⚡ FASE 20: Reducido de 2s a 1s
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

