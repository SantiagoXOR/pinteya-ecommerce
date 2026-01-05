'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import dynamic from 'next/dynamic'

const CombosSection = dynamic(() => import('../Home-v2/CombosSection/index'), {
  ssr: false,
})

/**
 * ⚡ OPTIMIZACIÓN: Componente CombosOptimized para reducir Speed Index y LCP
 * 
 * Estrategia (igual que HeroOptimized):
 * 1. Renderiza imagen estática inicial en HTML (sin JavaScript)
 * 2. Carga el carousel completo después del FCP
 * 3. Esto elimina el JavaScript del carousel del render inicial
 * 
 * Impacto esperado: -1.0s a -1.5s en Speed Index, mejor LCP
 */
export default function CombosOptimized() {
  const [showCarousel, setShowCarousel] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const renderCountRef = useRef(0)
  const hasLoggedRef = useRef(false)

  // ⚡ DEBUG: Log de renders
  useEffect(() => {
    renderCountRef.current += 1
    if (process.env.NODE_ENV === 'development' && !hasLoggedRef.current) {
      console.log('🔄 CombosOptimized render #' + renderCountRef.current, {
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
  // ⚡ FIX: Full width sin padding ni max-width (igual que hero)
  return (
    <div className="relative w-full pt-1 sm:pt-2" style={{ width: '100%', maxWidth: '100%' }}>
      <div 
        className="relative w-full overflow-hidden" 
        style={{ 
          aspectRatio: '2.77',
          width: '100%',
          maxWidth: '100%',
        }}
      >
          {/* ⚡ CRITICAL: Imagen estática en HTML inicial para descubrimiento temprano y LCP */}
          {/* Se desvanece suavemente cuando el carousel está listo */}
          {/* ⚡ FIX: Full width con object-cover para mejor visualización */}
          <div 
            className={`absolute inset-0 z-10 transition-opacity duration-500 ${
              showCarousel ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
          >
            <Image
              src="/images/hero/hero2/hero4.webp"
              alt="Combo destacado - Plavicon Fibrado"
              fill
              priority
              fetchPriority="high"
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
              quality={80}
              loading="eager"
              aria-hidden={showCarousel ? 'true' : 'false'}
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
              <CombosSection />
            </div>
          )}
        </div>
    </div>
  )
}








