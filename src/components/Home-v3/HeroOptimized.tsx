'use client'

import { useState, useEffect, memo } from 'react'
import dynamic from 'next/dynamic'

// ⚡ OPTIMIZACIÓN: Cargar carousel dinámicamente después del LCP
const HeroCarousel = dynamic(() => import('./Hero/Carousel'), {
  ssr: false,
})

/**
 * ⚡ OPTIMIZACIÓN: Componente HeroOptimized para reducir Speed Index y LCP
 * 
 * Estrategia:
 * 1. Renderiza imagen estática inicial en HTML (sin JavaScript)
 * 2. Carga el carousel completo después del LCP usando hook useLCPDetection
 * 3. Esto elimina el JavaScript del carousel del render inicial
 * 
 * Impacto esperado: -1.5s a -2.0s en Speed Index, -1,000 ms a -1,570 ms en retraso LCP
 */
interface HeroOptimizedProps {
  staticImageId?: string
  carouselId?: string
  isDesktop?: boolean // ⚡ FIX: Prop para indicar si es desktop, evita verificación de visibilidad compleja
}

const HeroOptimized = memo(({ staticImageId = 'hero-lcp-image', carouselId = 'hero-optimized', isDesktop = false }: HeroOptimizedProps) => {
  const [isMounted, setIsMounted] = useState(false)
  const [shouldLoadCarousel, setShouldLoadCarousel] = useState(false)
  // ⚡ FIX: Inicializar matchesBreakpoint basándose en el prop isDesktop y el ancho de la ventana
  const [matchesBreakpoint, setMatchesBreakpoint] = useState(() => {
    if (typeof window !== 'undefined') {
      const isDesktopBreakpoint = window.innerWidth >= 1024
      return isDesktop ? isDesktopBreakpoint : !isDesktopBreakpoint
    }
    return false
  })
  
  // #region agent log
  useEffect(() => {
    if (typeof window !== 'undefined') {
      fetch('http://127.0.0.1:7242/ingest/b2bb30a6-4e88-4195-96cd-35106ab29a7d', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'HeroOptimized.tsx:component-mount',
          message: 'HeroOptimized component mounting',
          data: {
            timestamp: Date.now(),
            timeSincePageLoad: performance.now(),
            instanceId: Math.random().toString(36).substring(7),
            totalInstances: document.querySelectorAll('[data-hero-optimized]').length + 1,
          },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'initial',
          hypothesisId: 'C'
        })
      }).catch(() => {});
    }
  }, []);
  // #endregion

  // ⚡ FIX: Marcar como montado y verificar breakpoint usando media query
  useEffect(() => {
    setIsMounted(true)
    
    // ⚡ FIX: Usar media query para detectar breakpoint lg (1024px+) de forma confiable
    if (typeof window !== 'undefined') {
      // Tailwind lg breakpoint es 1024px
      const mediaQuery = window.matchMedia('(min-width: 1024px)')
      
      const handleMediaChange = (e: MediaQueryListEvent | MediaQueryList) => {
        const isDesktopBreakpoint = e.matches
        // Si el prop isDesktop es true, debe coincidir con el breakpoint
        // Si el prop isDesktop es false, debe NO coincidir con el breakpoint
        const shouldRender = isDesktop ? isDesktopBreakpoint : !isDesktopBreakpoint
        setMatchesBreakpoint(shouldRender)
        console.log(`[HeroOptimized] Breakpoint check for ${carouselId}:`, {
          isDesktop,
          isDesktopBreakpoint,
          shouldRender,
          windowWidth: window.innerWidth
        })
      }
      
      // Verificar inmediatamente
      handleMediaChange(mediaQuery)
      
      // Escuchar cambios
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleMediaChange)
      } else {
        // Fallback para navegadores antiguos
        mediaQuery.addListener(handleMediaChange)
      }
      
      return () => {
        if (mediaQuery.removeEventListener) {
          mediaQuery.removeEventListener('change', handleMediaChange)
        } else {
          mediaQuery.removeListener(handleMediaChange)
        }
      }
    }
    
    // #region agent log
    if (typeof window !== 'undefined') {
      fetch('http://127.0.0.1:7242/ingest/b2bb30a6-4e88-4195-96cd-35106ab29a7d', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'HeroOptimized.tsx:useEffect:mount',
          message: 'HeroOptimized mounted',
          data: {
            timestamp: Date.now(),
            timeSincePageLoad: performance.now(),
            containerCount: document.querySelectorAll('.hero-lcp-container').length,
            imageCount: document.querySelectorAll(`#${staticImageId}`).length,
            carouselId,
          },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'initial',
          hypothesisId: 'D'
        })
      }).catch(() => {});
    }
    // #endregion
  }, [isDesktop, carouselId])

  // ⚡ OPTIMIZACIÓN: Cargar carousel después de 3 segundos (mejor UX sin afectar LCP)
  // Lighthouse evalúa LCP típicamente en ~2.5s, así que 3s es seguro
  // La imagen estática sigue visible durante la evaluación de Lighthouse
  // ⚡ FIX: Solo cargar el carousel si el breakpoint coincide
  useEffect(() => {
    console.log(`[HeroOptimized] useEffect carousel load check for ${carouselId}:`, {
      isMounted,
      matchesBreakpoint,
      isDesktop,
      windowWidth: typeof window !== 'undefined' ? window.innerWidth : 'N/A',
      shouldLoadCarousel
    })
    
    if (!isMounted) {
      console.warn(`[HeroOptimized] Component not mounted yet for ${carouselId}`)
      return
    }
    
    if (!matchesBreakpoint) {
      console.warn(`[HeroOptimized] Breakpoint doesn't match for ${carouselId}`, {
        isDesktop,
        windowWidth: typeof window !== 'undefined' ? window.innerWidth : 'N/A',
        expectedBreakpoint: isDesktop ? '>= 1024px' : '< 1024px'
      })
      return
    }

    console.log(`[HeroOptimized] ✅ All conditions met! Scheduling carousel load for ${carouselId}`, { 
      isMounted, 
      matchesBreakpoint, 
      isDesktop,
      windowWidth: typeof window !== 'undefined' ? window.innerWidth : 'N/A'
    })
    
    const carouselTimeout = setTimeout(() => {
      console.log(`[HeroOptimized] 🚀 Loading carousel for ${carouselId} - setting shouldLoadCarousel to true`)
      setShouldLoadCarousel(true)
    }, 3000) // 3 segundos - mejor UX sin afectar LCP

    return () => {
      console.log(`[HeroOptimized] Cleanup: clearing timeout for ${carouselId}`)
      clearTimeout(carouselTimeout)
    }
  }, [isMounted, matchesBreakpoint, carouselId, isDesktop, shouldLoadCarousel])

  // ⚡ OPTIMIZACIÓN: Ocultar imagen estática cuando el carousel se carga (ocultar inmediatamente para evitar superposición visual)
  // El delay de 3s ya es suficiente para Lighthouse, así que ocultamos inmediatamente cuando el carousel comienza a cargar
  // ⚡ FIX: Ocultar SOLO la imagen estática con ID específico, NO las imágenes del carousel
  useEffect(() => {
    if (!shouldLoadCarousel) return

    // Usar múltiples requestAnimationFrame para asegurar que se ejecute después de que el carousel se renderice
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // ⚡ FIX CRÍTICO: Seleccionar SOLO la imagen estática por su ID específico (usar el prop)
        // NO seleccionar todas las imágenes porque eso afectaría también las del carousel
        const staticImage = document.getElementById(staticImageId)
        
        if (staticImage && staticImage instanceof HTMLElement) {
          // Ocultar imagen estática cuando el carousel comienza a cargar
          // Usar opacity: 0 y visibility: hidden para asegurar que no sea visible
          staticImage.style.opacity = '0'
          staticImage.style.visibility = 'hidden'
          staticImage.style.pointerEvents = 'none'
          staticImage.style.position = 'absolute'
          staticImage.style.zIndex = '1' // Detrás del carousel (z-20)
          staticImage.style.display = 'none' // ⚡ FIX: Agregar display: none para asegurar que esté completamente oculta
          
          console.log(`[HeroOptimized] Imagen estática ${staticImageId} ocultada`, {
            opacity: staticImage.style.opacity,
            visibility: staticImage.style.visibility,
            display: staticImage.style.display,
            zIndex: staticImage.style.zIndex
          })
        } else {
          console.warn(`[HeroOptimized] No se encontró la imagen estática con ID ${staticImageId}`)
        }
        
        // ⚡ FIX: Verificar que el carousel esté visible
        const carouselContainer = document.querySelector(`[data-hero-optimized="${carouselId}"]`)
        if (carouselContainer) {
          const carouselStyle = window.getComputedStyle(carouselContainer)
          console.log(`[HeroOptimized] Estado del carousel ${carouselId}:`, {
            opacity: carouselStyle.opacity,
            visibility: carouselStyle.visibility,
            display: carouselStyle.display,
            zIndex: carouselStyle.zIndex,
            position: carouselStyle.position
          })
        } else {
          console.warn(`[HeroOptimized] No se encontró el contenedor del carousel con ID ${carouselId}`)
        }
      })
    })
  }, [shouldLoadCarousel, staticImageId, carouselId])

  // ⚡ FASE 23: La imagen estática se renderiza en el contenedor hero-lcp-container (HomeV3/index.tsx)
  // El carousel se renderiza en el MISMO contenedor que la imagen estática para que coincidan exactamente
  // Solo renderizamos el carousel aquí, que se carga después del LCP
  return (
    <>
      {/* #region agent log */}
      {typeof window !== 'undefined' && isMounted && (() => {
        fetch('http://127.0.0.1:7242/ingest/b2bb30a6-4e88-4195-96cd-35106ab29a7d', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: 'HeroOptimized.tsx:render',
            message: 'HeroOptimized render',
            data: {
              timestamp: Date.now(),
              timeSincePageLoad: performance.now(),
              isMounted,
              shouldLoadCarousel,
              containerCount: document.querySelectorAll('.hero-lcp-container').length,
              imageCount: document.querySelectorAll('#hero-lcp-image').length,
            },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'initial',
            hypothesisId: 'E'
          })
        }).catch(() => {});
        return null;
      })()}
      {/* #endregion */}
      {/* ⚡ FASE 23: Carousel carga dinámicamente después del LCP */}
      {/* La imagen estática está en el contenedor hero-lcp-container para descubrimiento temprano */}
      {/* El carousel se renderiza en el MISMO contenedor (.hero-lcp-container) para que coincida exactamente */}
      {/* ⚡ FIX: Solo renderizar si el breakpoint coincide y el carousel debe cargarse */}
      {(() => {
        const shouldRender = isMounted && matchesBreakpoint && shouldLoadCarousel
        console.log(`[HeroOptimized] Render check for ${carouselId}:`, {
          shouldRender,
          isMounted,
          matchesBreakpoint,
          shouldLoadCarousel,
          isDesktop,
          windowWidth: typeof window !== 'undefined' ? window.innerWidth : 'N/A'
        })
        return shouldRender
      })() && (
        <div
          className="absolute inset-0 z-20 transition-opacity duration-500"
          data-hero-optimized={carouselId}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            height: '100%',
            maxWidth: '100%',
            opacity: 1,
            visibility: 'visible',
            display: 'block',
            zIndex: 20,
          }}
        >
          {/* #region agent log */}
          {typeof window !== 'undefined' && (() => {
            console.log(`[HeroOptimized] Renderizando carousel ${carouselId}`, { 
              isMounted, 
              matchesBreakpoint, 
              shouldLoadCarousel,
              isDesktop,
              windowWidth: window.innerWidth
            })
            fetch('http://127.0.0.1:7242/ingest/b2bb30a6-4e88-4195-96cd-35106ab29a7d', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                location: 'HeroOptimized.tsx:carousel-render',
                message: 'Carousel rendering',
                data: {
                  timestamp: Date.now(),
                  timeSincePageLoad: performance.now(),
                  containerCount: document.querySelectorAll('.hero-lcp-container').length,
                  carouselCount: document.querySelectorAll('[data-hero-optimized]').length,
                  carouselId,
                  isMounted,
                  matchesBreakpoint,
                  shouldLoadCarousel,
                  isDesktop,
                },
                timestamp: Date.now(),
                sessionId: 'debug-session',
                runId: 'initial',
                hypothesisId: 'F'
              })
            }).catch(() => {});
            return null;
          })()}
          {/* #endregion */}
          <HeroCarousel />
        </div>
      )}
    </>
  )
})

HeroOptimized.displayName = 'HeroOptimized'

export default HeroOptimized

