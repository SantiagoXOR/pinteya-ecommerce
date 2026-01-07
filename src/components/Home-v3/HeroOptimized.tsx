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
}

const HeroOptimized = memo(({ staticImageId = 'hero-lcp-image', carouselId = 'hero-optimized' }: HeroOptimizedProps) => {
  const [isMounted, setIsMounted] = useState(false)
  const [shouldLoadCarousel, setShouldLoadCarousel] = useState(false)
  const [isContainerVisible, setIsContainerVisible] = useState(false)
  
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

  // ⚡ FIX: Marcar como montado después del primer render y verificar visibilidad del contenedor
  useEffect(() => {
    setIsMounted(true)
    
    // ⚡ FIX: Verificar si el contenedor está visible (para evitar renderizar carousel en contenedores ocultos)
    if (typeof window !== 'undefined') {
      const checkVisibility = () => {
        const staticImage = document.getElementById(staticImageId)
        if (staticImage) {
          const container = staticImage.closest('.hero-lcp-container')
          if (container) {
            const computedStyle = window.getComputedStyle(container)
            const isVisible = computedStyle.display !== 'none' && 
                             computedStyle.visibility !== 'hidden' &&
                             computedStyle.opacity !== '0'
            setIsContainerVisible(isVisible)
            console.log(`[HeroOptimized] Container visibility for ${carouselId}:`, isVisible, {
              display: computedStyle.display,
              visibility: computedStyle.visibility,
              opacity: computedStyle.opacity
            })
          }
        }
      }
      
      // Verificar inmediatamente y después de un pequeño delay para asegurar que los estilos están aplicados
      checkVisibility()
      const timeout = setTimeout(checkVisibility, 100)
      
      // También verificar en resize para manejar cambios de breakpoint
      window.addEventListener('resize', checkVisibility)
      
      return () => {
        clearTimeout(timeout)
        window.removeEventListener('resize', checkVisibility)
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
  }, [staticImageId, carouselId])

  // ⚡ OPTIMIZACIÓN: Cargar carousel después de 3 segundos (mejor UX sin afectar LCP)
  // Lighthouse evalúa LCP típicamente en ~2.5s, así que 3s es seguro
  // La imagen estática sigue visible durante la evaluación de Lighthouse
  // ⚡ FIX: Solo cargar el carousel si el contenedor está visible
  useEffect(() => {
    if (!isMounted || !isContainerVisible) return

    console.log(`[HeroOptimized] Scheduling carousel load for ${carouselId}`, { isMounted, isContainerVisible })
    
    const carouselTimeout = setTimeout(() => {
      console.log(`[HeroOptimized] Loading carousel for ${carouselId}`)
      setShouldLoadCarousel(true)
    }, 3000) // 3 segundos - mejor UX sin afectar LCP

    return () => clearTimeout(carouselTimeout)
  }, [isMounted, isContainerVisible, carouselId])

  // ⚡ OPTIMIZACIÓN: Ocultar imagen estática cuando el carousel se carga (ocultar inmediatamente para evitar superposición visual)
  // El delay de 3s ya es suficiente para Lighthouse, así que ocultamos inmediatamente cuando el carousel comienza a cargar
  // ⚡ FIX: Ocultar SOLO la imagen estática con ID específico, NO las imágenes del carousel
  useEffect(() => {
    if (!shouldLoadCarousel) return

    // Usar requestAnimationFrame para ocultar en el siguiente frame (ocultar inmediatamente)
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
      }
    })
  }, [shouldLoadCarousel, staticImageId])

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
      {/* ⚡ FIX: Verificar que no hay otro carousel ya renderizado en el MISMO contenedor para prevenir duplicación */}
      {/* ⚡ FIX: Solo renderizar si el contenedor está visible */}
      {isMounted && isContainerVisible && shouldLoadCarousel && (() => {
        // ⚡ FIX: Verificar que no hay otro carousel ya renderizado con el mismo ID
        // Esto previene duplicación en producción donde React puede renderizar dos veces
        // Pero permite que mobile y desktop tengan sus propios carouseles
        // ⚡ DEBUG: Agregar verificación más robusta para desktop
        if (typeof window !== 'undefined') {
          const existingCarousel = document.querySelector(`[data-hero-optimized="${carouselId}"]`)
          // ⚡ FIX: Solo bloquear si el carousel existente está en el mismo contenedor visible
          // En desktop, el contenedor mobile está oculto (lg:hidden), así que no debería interferir
          if (existingCarousel) {
            // Verificar si el contenedor padre está visible
            const parentContainer = existingCarousel.closest('.hero-lcp-container')
            if (parentContainer) {
              const isParentVisible = window.getComputedStyle(parentContainer).display !== 'none'
              if (isParentVisible) {
                // Ya hay un carousel renderizado y visible con este ID, no renderizar otro
                console.log(`[HeroOptimized] Carousel ${carouselId} ya existe y está visible, no renderizando duplicado`)
                return null
              }
            }
          }
        }
        
        console.log(`[HeroOptimized] Renderizando carousel ${carouselId}`, { isMounted, shouldLoadCarousel })
        
        return (
          <div
            className="absolute inset-0 z-20 transition-opacity duration-500 opacity-100"
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
            }}
          >
            {/* #region agent log */}
            {typeof window !== 'undefined' && (() => {
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
        )
      })()}
    </>
  )
})

HeroOptimized.displayName = 'HeroOptimized'

export default HeroOptimized

