'use client'

import { useState, useEffect } from 'react'
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

  useEffect(() => {
    // ⚡ OPTIMIZACIÓN: Reducir delay de 1.5s a 800ms para mejorar LCP
    // El carousel se carga después de que la imagen estática se haya renderizado
    // Usar requestIdleCallback para no bloquear el hilo principal
    const loadCarousel = () => {
      setShowCarousel(true)
    }
    
    if ('requestIdleCallback' in window) {
      requestIdleCallback(loadCarousel, { timeout: 800 })
    } else {
      setTimeout(loadCarousel, 800)
    }
  }, [])

  if (!showCarousel) {
    // ⚡ CRITICAL: Imagen estática en HTML inicial para descubrimiento temprano
    // Usar solo Image component de Next.js con priority para evitar requests duplicados
    // Next.js Image con priority ya se renderiza en HTML inicial y ofrece optimizaciones (WebP/AVIF, responsive)
    return (
      <div className="relative w-full">
        <div className="max-w-[1200px] mx-auto px-2 sm:px-4 lg:px-6 py-2 sm:py-3">
          <div className="relative w-full overflow-hidden" style={{ aspectRatio: '2.77' }}>
            {/* ⚡ CRITICAL: Image component con priority para descubrimiento temprano y optimizaciones */}
            {/* Se renderiza en HTML inicial del servidor, no depende de JavaScript */}
            {/* Next.js optimiza automáticamente (WebP/AVIF, responsive, preload) */}
            <Image
              src="/images/hero/hero2/hero1.webp"
              alt="Pintá rápido, fácil y cotiza al instante - Pinteya"
              fill
              priority
              fetchPriority="high"
              className="object-contain"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
              quality={80}
              // ⚡ OPTIMIZACIÓN: Usar loading="eager" para asegurar carga inmediata
              loading="eager"
              // ⚡ OPTIMIZACIÓN: Preload de imagen ya está en layout.tsx
            />
          </div>
        </div>
      </div>
    )
  }

  return <HeroCarousel />
}

