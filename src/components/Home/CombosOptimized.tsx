'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { useTenantSafe } from '@/contexts/TenantContext'
import { getTenantAssetPath } from '@/lib/tenant/tenant-assets'
import { useSlugFromHostname } from '@/hooks/useSlugFromHostname'
import type { TenantPublicConfig } from '@/lib/tenant/types'

const CombosSection = dynamic(() => import('./CombosSection/index'), {
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
  const tenant = useTenantSafe()
  const slugFromHost = useSlugFromHostname()
  const [showCarousel, setShowCarousel] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  
  // ⚡ MULTITENANT: Usar tenant del contexto o slug derivado del hostname para no mostrar Pinteya en pintemas.com
  const effectiveTenant = useMemo((): TenantPublicConfig | null => {
    if (tenant?.slug) return tenant
    if (slugFromHost) return { slug: slugFromHost } as TenantPublicConfig
    return null
  }, [tenant, slugFromHost])
  
  const staticImagePath = getTenantAssetPath(
    effectiveTenant,
    'combos/combo1.webp',
    '/images/hero/hero2/hero4.webp'
  )
  const staticImageLocal = effectiveTenant ? `/tenants/${effectiveTenant.slug}/combos/combo1.webp` : '/images/hero/hero2/hero4.webp'

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
  // ⚡ FIX: Contenedor con márgenes solo en desktop para consistencia con otros componentes
  return (
    <div className="relative w-full pt-0 sm:pt-2">
      {/* Mobile: sin contenedor, full width. Sin padding-top en mobile para reducir espacio. */}
      <div className="lg:hidden relative w-full overflow-hidden" style={{ aspectRatio: '2.77', width: '100%', maxWidth: '100%' }}>
        {/* ⚡ CRITICAL: Imagen estática en HTML inicial para descubrimiento temprano y LCP */}
        <div className={`absolute inset-0 z-10 transition-opacity duration-500 ${showCarousel ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <Image
            src={staticImagePath}
            alt="Combo destacado - Plavicon Fibrado"
            fill
            priority
            fetchPriority="high"
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
            quality={80}
            loading="eager"
            aria-hidden={showCarousel ? 'true' : 'false'}
            onError={(e) => {
              const target = e.target as HTMLImageElement
              if (target.src !== staticImageLocal) {
                target.src = staticImageLocal
              }
            }}
          />
        </div>
        {isMounted && (
          <div className={`relative z-20 transition-opacity duration-500 ${showCarousel ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <CombosSection />
          </div>
        )}
      </div>
      
      {/* Desktop: con contenedor y márgenes */}
      <div className="hidden lg:block">
        <div className="max-w-[1170px] mx-auto lg:px-8 xl:px-8">
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
                src={staticImagePath}
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
      </div>
    </div>
  )
}
