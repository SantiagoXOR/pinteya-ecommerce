'use client'

import React, { useState, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { useTenantSafe } from '@/contexts/TenantContext'

// ⚡ OPTIMIZACIÓN LCP: Lazy load del carousel después del LCP
// Esto reduce el JavaScript inicial y mejora el LCP significativamente
const SimpleHeroCarousel = dynamic(() => import('@/components/Home/Hero/SimpleHeroCarousel'), {
  ssr: false,
  loading: () => null,
})

interface HeroSectionProps {
  isDesktop?: boolean
}

/**
 * HeroSection - Optimizado para LCP
 * Estrategia:
 * 1. Renderiza imagen estática inicial (sin JavaScript) para LCP rápido
 * 2. Carga el carousel después del LCP (3s) para mejor UX
 * 3. Reduce JavaScript inicial y mejora métricas de Lighthouse
 */
export function HeroSection({ isDesktop = false }: HeroSectionProps) {
  const tenant = useTenantSafe()
  const [shouldLoadCarousel, setShouldLoadCarousel] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Debug: Verificar si el tenant está disponible
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[HeroSection] Tenant disponible:', {
        hasTenant: !!tenant,
        slug: tenant?.slug,
        name: tenant?.name
      })
    }
  }, [tenant])

  // ⚡ OPTIMIZACIÓN: Obtener URL de imagen hero del tenant
  const heroImageUrl = useMemo(() => {
    if (tenant?.slug) {
      return `/tenants/${tenant.slug}/hero/hero1.webp`
    }
    console.warn('[HeroSection] Tenant no disponible, usando fallback image')
    return '/images/hero/hero2/hero1.webp'
  }, [tenant?.slug])

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
  // ⚡ FIX: Solo cargar el carousel si el tenant está disponible
  useEffect(() => {
    if (!isMounted) return
    if (!tenant) {
      console.warn('[HeroSection] Tenant no disponible, manteniendo imagen estática visible')
      return
    }

    const carouselTimeout = setTimeout(() => {
      setShouldLoadCarousel(true)
    }, 3000) // 3 segundos - mejor UX sin afectar LCP

    return () => {
      clearTimeout(carouselTimeout)
    }
  }, [isMounted, tenant])


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

  // Contenido del hero (imagen estática + carousel)
  const heroContent = (
    <>
      {/* ⚡ OPTIMIZACIÓN LCP: Imagen estática inicial (sin JavaScript) */}
      {/* Se oculta cuando el carousel se carga para evitar superposición */}
      {/* ⚡ OPTIMIZACIÓN PAGESPEED: Contenedor con dimensiones explícitas para prevenir layout shifts */}
      <div 
        className={`absolute inset-0 z-10 transition-opacity duration-500 ${
          shouldLoadCarousel && tenant ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        style={{ width: '100%', height: '100%', position: 'relative' }}
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
          decoding="sync"
          aria-hidden={shouldLoadCarousel ? 'true' : 'false'}
        />
      </div>

      {/* ⚡ OPTIMIZACIÓN: Carousel carga después del LCP */}
      {/* ⚡ FIX: Solo cargar el carousel si el tenant está disponible */}
      {isMounted && shouldLoadCarousel && tenant && (
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
