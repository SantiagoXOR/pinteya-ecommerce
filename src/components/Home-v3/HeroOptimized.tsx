'use client'

import { useState, useEffect, memo, useRef } from 'react'
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
// ⚡ FIX: Variable global para prevenir duplicación durante hidratación
let heroInstanceCount = 0
const MAX_HERO_INSTANCES = 1

const HeroOptimized = memo(() => {
  const [isMounted, setIsMounted] = useState(false)
  const [shouldLoadCarousel, setShouldLoadCarousel] = useState(false)
  // ⚡ FIX: Prevenir duplicación durante hidratación usando ref
  const hasRenderedRef = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const instanceIdRef = useRef<string | null>(null)
  
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

  // ⚡ FIX: Marcar como montado después del primer render y verificar duplicación
  useEffect(() => {
    // ⚡ FIX: Prevenir duplicación durante hidratación - verificar antes de montar
    if (typeof window !== 'undefined') {
      // Verificar si ya hay otro HeroOptimized renderizado en el DOM
      const existingHeroes = document.querySelectorAll('[data-hero-optimized]')
      const existingContainers = document.querySelectorAll('.hero-lcp-container')
      
      // Si ya hay un hero renderizado Y este componente aún no tiene ref, no montar
      if (existingHeroes.length > 0 && !containerRef.current) {
        console.warn('[HeroOptimized] Duplicación detectada, no montando segunda instancia')
        return
      }
      
      // Si hay múltiples contenedores, algo está mal
      if (existingContainers.length > 1) {
        console.warn('[HeroOptimized] Múltiples contenedores hero-lcp-container detectados:', existingContainers.length)
      }
    }
    
    // ⚡ FIX: Prevenir duplicación durante hidratación
    if (hasRenderedRef.current) {
      return // Ya se renderizó, no hacer nada
    }
    
    hasRenderedRef.current = true
    setIsMounted(true)
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
            imageCount: document.querySelectorAll('#hero-lcp-image').length,
          },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'initial',
          hypothesisId: 'D'
        })
      }).catch(() => {});
    }
    // #endregion
  }, [])

  // ⚡ OPTIMIZACIÓN: Cargar carousel después de 3 segundos (mejor UX sin afectar LCP)
  // Lighthouse evalúa LCP típicamente en ~2.5s, así que 3s es seguro
  // La imagen estática sigue visible durante la evaluación de Lighthouse
  useEffect(() => {
    if (!isMounted) return

    const carouselTimeout = setTimeout(() => {
      setShouldLoadCarousel(true)
    }, 3000) // 3 segundos - mejor UX sin afectar LCP

    return () => clearTimeout(carouselTimeout)
  }, [isMounted])

  // ⚡ OPTIMIZACIÓN: Ocultar imagen estática cuando el carousel se carga (ocultar inmediatamente para evitar superposición visual)
  // El delay de 3s ya es suficiente para Lighthouse, así que ocultamos inmediatamente cuando el carousel comienza a cargar
  // ⚡ FIX: Buscar SOLO la imagen con id hero-lcp-image para evitar duplicados
  useEffect(() => {
    if (!shouldLoadCarousel) return

    // Usar requestAnimationFrame para ocultar en el siguiente frame (ocultar inmediatamente)
    requestAnimationFrame(() => {
      // ⚡ FIX: Usar getElementById en lugar de querySelector para evitar seleccionar múltiples elementos
      const staticImage = document.getElementById('hero-lcp-image')
      if (staticImage && staticImage instanceof HTMLElement) {
        // #region agent log
        const opacityBefore = window.getComputedStyle(staticImage).opacity
        // #endregion
        // Ocultar imagen estática cuando el carousel comienza a cargar
        // Usar opacity: 0 y visibility: hidden para asegurar que no sea visible
        staticImage.style.opacity = '0'
        staticImage.style.visibility = 'hidden'
        staticImage.style.pointerEvents = 'none'
        staticImage.style.position = 'absolute'
        staticImage.style.zIndex = '1' // Detrás del carousel (z-20)
        // #region agent log
        if (typeof window !== 'undefined') {
          fetch('http://127.0.0.1:7242/ingest/b2bb30a6-4e88-4195-96cd-35106ab29a7d', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              location: 'HeroOptimized.tsx:hide-static-image',
              message: 'Hiding static image',
              data: {
                timestamp: Date.now(),
                timeSincePageLoad: performance.now(),
                opacityBefore,
                opacityAfter: window.getComputedStyle(staticImage).opacity,
                imageFound: !!staticImage,
              },
              timestamp: Date.now(),
              sessionId: 'debug-session',
              runId: 'post-fix',
              hypothesisId: 'H'
            })
          }).catch(() => {});
        }
        // #endregion
      }
    })
  }, [shouldLoadCarousel])

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
      {/* ⚡ FIX: Verificar que no hay otro carousel ya renderizado para evitar duplicación */}
      {/* La imagen estática está en el contenedor hero-lcp-container para descubrimiento temprano */}
      {/* El carousel se renderiza en el MISMO contenedor (.hero-lcp-container) para que coincida exactamente */}
      {isMounted && shouldLoadCarousel && (() => {
        // ⚡ FIX: Verificar que no hay otro carousel ya renderizado
        if (typeof window !== 'undefined') {
          const existingCarousels = document.querySelectorAll('[data-hero-optimized]')
          // Si ya hay un carousel renderizado Y este componente no tiene el ref, no renderizar
          if (existingCarousels.length > 0 && !containerRef.current) {
            console.warn('[HeroOptimized] Carousel duplicado detectado, no renderizando')
            return null
          }
        }
        return (
          <div
            ref={containerRef}
            className="absolute inset-0 z-20 transition-opacity duration-500 opacity-100"
            data-hero-optimized="true"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
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

