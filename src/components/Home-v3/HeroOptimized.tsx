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
    // ⚡ OPTIMIZACIÓN: Cargar carousel después de que el componente esté montado
    // Usar requestIdleCallback para no bloquear el hilo principal
    if (!isMounted) return

    const loadCarousel = () => {
      setShowCarousel(true)
    }
    
    if ('requestIdleCallback' in window) {
      requestIdleCallback(loadCarousel, { timeout: 800 })
    } else {
      setTimeout(loadCarousel, 800)
    }
  }, [isMounted])

  // ⚡ OPTIMIZACIÓN: Renderizar ambos componentes y usar transición suave
  // La imagen estática se desvanece cuando el carousel está listo
  // Esto evita el doble render completo del componente
  return (
      <div className="relative w-full">
        <div className="max-w-[1200px] mx-auto px-2 sm:px-4 lg:px-6 pt-1 sm:pt-2 pb-1 sm:pb-1.5">
        <div className="relative w-full overflow-hidden" style={{ aspectRatio: '2.77' }}>
          {/* ⚡ CRITICAL: Imagen estática en HTML inicial para descubrimiento temprano y LCP */}
          {/* Se desvanece suavemente cuando el carousel está listo */}
          <div 
            className={`absolute inset-0 z-10 transition-opacity duration-500 ${
              showCarousel ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
          >
            <Image
              src="/images/hero/hero2/hero1.webp"
              alt="Pintá rápido, fácil y cotiza al instante - Pinteya"
              width={1200}
              height={433}
              priority
              fetchPriority="high"
              className="object-contain"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
              quality={80}
              loading="eager"
              aria-hidden={showCarousel ? 'true' : 'false'}
              style={{ width: '100%', height: 'auto', aspectRatio: '1200/433' }}
            />
          </div>
          
          {/* ⚡ PERFORMANCE: Carousel carga dinámicamente después del LCP */}
          {/* Pre-cargar pero mantener oculto hasta que esté listo para evitar re-render */}
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

