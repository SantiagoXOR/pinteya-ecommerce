'use client'

import React, { useState, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { useTenantSafe, useTenantAssets } from '@/contexts/TenantContext'

// ⚡ OPTIMIZACIÓN LCP: Lazy load del carousel después del LCP
// Esto reduce el JavaScript inicial y mejora el LCP significativamente
const SimpleHeroCarousel = dynamic(() => import('@/components/Home/Hero/SimpleHeroCarousel'), {
  ssr: false,
  loading: () => null,
})

interface HeroSectionProps {
  isDesktop?: boolean
  /** Cuando viene del servidor (HeroImageServer), solo se renderiza el overlay del carousel. */
  serverHeroSlot?: React.ReactNode
}

/**
 * HeroSection - Optimizado para LCP
 * Estrategia:
 * 1. Renderiza imagen estática inicial (sin JavaScript) para LCP rápido
 * 2. Carga el carousel después del LCP (3s) para mejor UX
 * 3. Reduce JavaScript inicial y mejora métricas de Lighthouse
 */
export function HeroSection({ isDesktop = false, serverHeroSlot }: HeroSectionProps) {
  const tenant = useTenantSafe()
  const { heroImage } = useTenantAssets()
  const [shouldLoadCarousel, setShouldLoadCarousel] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const hasServerHero = Boolean(serverHeroSlot)

  // ⚡ OPTIMIZACIÓN: URL hero desde bucket (Supabase) o fallback local (solo si no hay imagen en servidor)
  const heroImageUrl = useMemo(() => (tenant?.slug ? heroImage(1) : '/images/hero/hero2/hero1.webp'), [tenant?.slug, heroImage])

  const heroAlt = useMemo(() => {
    const tenantName = tenant?.name || 'PinteYa'
    return `${tenantName} - Pintá rápido, fácil y cotiza al instante`
  }, [tenant?.name])

  // ⚡ OPTIMIZACIÓN: Marcar como montado
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // ⚡ OPTIMIZACIÓN: Cargar carousel después del LCP (3s)
  // Lighthouse evalúa LCP típicamente en ~2.5s, así que 3s es seguro
  useEffect(() => {
    if (!isMounted) return

    const carouselTimeout = setTimeout(() => {
      setShouldLoadCarousel(true)
    }, 3000) // 3 segundos - mejor UX sin afectar LCP

    return () => {
      clearTimeout(carouselTimeout)
    }
  }, [isMounted])

  // Contenedor común para imagen estática y carousel
  const containerClasses = isDesktop
    ? 'pt-1 sm:pt-2 -mt-[105px]'
    : 'pt-1 sm:pt-2 w-full'

  const innerContainerClasses = isDesktop
    ? 'max-w-[1170px] mx-auto lg:px-8 xl:px-8 pt-[105px]'
    : ''

  const imageContainerStyle = {
    aspectRatio: '2.77' as const,
    width: '100%',
    maxWidth: '100%',
    margin: '0 auto',
    position: 'relative' as const,
  }

  // Contenido del hero: imagen (servidor o cliente) + carousel overlay
  const heroContent = (
    <>
      {hasServerHero ? (
        serverHeroSlot
      ) : (
        /* ⚡ OPTIMIZACIÓN LCP: Imagen estática inicial (cliente) cuando no hay server hero */
        <div 
          className={`absolute inset-0 z-10 transition-opacity duration-500 ${
            shouldLoadCarousel ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          <Image
            src={heroImageUrl}
            alt={heroAlt}
            fill
            priority
            fetchPriority="high"
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
            quality={80}
            loading="eager"
            decoding="async"
            aria-hidden={shouldLoadCarousel ? 'true' : 'false'}
          />
        </div>
      )}

      {/* ⚡ OPTIMIZACIÓN: Carousel carga después del LCP */}
      {isMounted && shouldLoadCarousel && (
        <div 
          className={`relative z-20 transition-opacity duration-500 ${
            shouldLoadCarousel ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <SimpleHeroCarousel />
        </div>
      )}
    </>
  )

  return (
    <div className={containerClasses} style={{ width: '100%', maxWidth: '100%' }}>
      {isDesktop ? (
        <div className={innerContainerClasses}>
          <div 
            className="relative overflow-hidden rounded-3xl"
            style={imageContainerStyle}
          >
            {heroContent}
          </div>
        </div>
      ) : (
        <div 
          className="relative overflow-hidden"
          style={imageContainerStyle}
        >
          {heroContent}
        </div>
      )}
    </div>
  )
}
