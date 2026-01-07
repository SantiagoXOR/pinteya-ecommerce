'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import dynamic from 'next/dynamic'
// ⚡ PERFORMANCE: Cargar HeroCarousel dinámicamente después del LCP
// Esto elimina el retraso de 2,270ms en la carga de recursos
const HeroCarousel = dynamic(() => import('@/components/Common/HeroCarousel'), {
  ssr: false,
  loading: () => null, // No mostrar loading, la imagen estática ya está visible
})

// ⚡ CRITICAL: Primera imagen estática para LCP óptimo
// Esta imagen se renderiza inmediatamente en el HTML, sin esperar JavaScript
// Elimina el retraso de 1,250ms en la carga de recursos
const HeroImageStatic: React.FC<{
  src: string
  alt: string
  className?: string
  isMobile?: boolean
}> = ({ src, alt, className = '', isMobile = false }) => {
  return (
    <div className={`relative w-full ${isMobile ? 'h-[320px] sm:h-[360px]' : 'h-[360px]'} overflow-hidden ${className}`}>
      {/* ⚡ CRITICAL: Imagen estática renderizada inmediatamente - sin esperar React */}
      {/* Esta imagen se descubre temprano porque está en el HTML inicial */}
      <Image
        src={src}
        alt={alt}
        fill
        priority
        fetchPriority="high"
        quality={85}
        className="object-contain"
        sizes={isMobile ? "(max-width: 768px) 100vw, 100vw" : "(max-width: 1200px) 90vw, 1200px"}
        style={{ objectFit: 'contain' }}
        unoptimized={false}
      />
    </div>
  )
}

// ⚡ OPTIMIZACIÓN CRÍTICA: SVG → WebP para reducir tamaño de transferencia de ~30MB a ~2MB
// Configuración de imágenes para el carrusel móvil con WebP optimizado
const heroImagesMobile = [
  {
    src: '/images/hero/hero2/hero1.webp',
    alt: 'Pintá rápido, fácil y cotiza al instante - Productos de pinturería de calidad',
    priority: true,
    fetchPriority: 'high' as const, // ⚡ CRITICAL: fetchPriority explícito para LCP
    quality: 80, // Balance tamaño/calidad para WebP
  },
  {
    src: '/images/hero/hero2/hero2.webp',
    alt: 'Amplia gama de productos para pinturería, ferretería y corralón',
    priority: false,
    quality: 80,
  },
  {
    src: '/images/hero/hero2/hero3.webp',
    alt: 'Envío gratis y asesoramiento experto en productos de pintura',
    priority: false,
    quality: 80,
  },
]

const heroImagesDesktop = [
  {
    src: '/images/hero/hero2/hero1.webp',
    alt: 'Pintá rápido, fácil y cotiza al instante - Productos de pinturería de calidad',
    priority: true,
    fetchPriority: 'high' as const, // ⚡ CRITICAL: fetchPriority explícito para LCP
    quality: 80,
  },
  {
    src: '/images/hero/hero2/hero2.webp',
    alt: 'Amplia gama de productos para pinturería, ferretería y corralón',
    priority: false,
    quality: 80,
  },
  {
    src: '/images/hero/hero2/hero3.webp',
    alt: 'Envío gratis y asesoramiento experto en productos de pintura',
    priority: false,
    quality: 80,
  },
]

const Hero = () => {
  const [carouselLoaded, setCarouselLoaded] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // ⚡ OPTIMIZACIÓN: Cargar carousel después de que la página esté lista
  // Esto da prioridad al LCP de la imagen estática
  useEffect(() => {
    setIsMounted(true)
    // Cargar carousel después de un pequeño delay para no competir con LCP
    const timer = setTimeout(() => {
      setCarouselLoaded(true)
    }, 100) // 100ms después del mount para dar prioridad a LCP

    return () => clearTimeout(timer)
  }, [])

  return (
    <section className='relative overflow-hidden -mt-4'>
      {/* Carrusel móvil - PEGADO COMPLETAMENTE al header */}
      <div className='lg:hidden relative z-50 -mt-[92px]'>
        <div className='w-full pt-[92px]'>
          <div className='relative w-full h-[320px] sm:h-[360px] overflow-hidden'>
            {/* ⚡ CRITICAL: Imagen estática para LCP - se renderiza inmediatamente sin JavaScript */}
            {/* Elimina el retraso de 1,250ms en la carga de recursos */}
            {/* Estrategia dual: <img> estático para descubrimiento temprano + Image component para optimización */}
            <div className={`absolute inset-0 z-10 transition-opacity duration-500 ${carouselLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
              {/* ⚡ CRITICAL: <img> estático para descubrimiento temprano - se renderiza en HTML inicial */}
              <img
                src="/images/hero/hero2/hero1.webp"
                alt={heroImagesMobile[0].alt}
                className="absolute inset-0 w-full h-full object-contain mobile-carousel"
                style={{ objectFit: 'contain' }}
                fetchPriority="high"
                decoding="async"
                loading="eager"
                aria-hidden={carouselLoaded ? 'true' : 'false'}
              />
              {/* ⚡ OPTIMIZACIÓN: Image component para optimización Next.js (WebP/AVIF, responsive) */}
              <HeroImageStatic
                src={heroImagesMobile[0].src}
                alt={heroImagesMobile[0].alt}
                isMobile={true}
                className="mobile-carousel"
              />
            </div>
            
            {/* ⚡ PERFORMANCE: Carousel carga dinámicamente después del LCP */}
            {isMounted && (
              <div className={`relative z-20 transition-opacity duration-500 ${carouselLoaded ? 'opacity-100' : 'opacity-0'}`}>
                <HeroCarousel
                  images={heroImagesMobile}
                  autoplayDelay={5000}
                  showNavigation={false}
                  showPagination={false}
                  className='w-full h-full mobile-carousel'
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Layout desktop - PEGADO COMPLETAMENTE al header */}
      <div className='hidden lg:block relative w-full -mt-[105px]'>
        <div className='w-full pt-[105px]'>
          <div className='max-w-[1170px] mx-auto lg:px-8 xl:px-8 overflow-hidden relative z-10'>
            <div className='relative rounded-3xl overflow-hidden'>
              <div className='relative w-full h-[360px]'>
                {/* ⚡ CRITICAL: Imagen estática para LCP - se renderiza inmediatamente sin JavaScript */}
                {/* Elimina el retraso de 1,250ms en la carga de recursos */}
                {/* Estrategia dual: <img> estático para descubrimiento temprano + Image component para optimización */}
                <div className={`absolute inset-0 z-10 transition-opacity duration-500 ${carouselLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                  {/* ⚡ CRITICAL: <img> estático para descubrimiento temprano - se renderiza en HTML inicial */}
                  <img
                    src="/images/hero/hero2/hero1.webp"
                    alt={heroImagesDesktop[0].alt}
                    className="absolute inset-0 w-full h-full object-contain rounded-lg desktop-carousel"
                    style={{ objectFit: 'contain' }}
                    fetchPriority="high"
                    decoding="async"
                    loading="eager"
                    aria-hidden={carouselLoaded ? 'true' : 'false'}
                  />
                  {/* ⚡ OPTIMIZACIÓN: Image component para optimización Next.js (WebP/AVIF, responsive) */}
                  <HeroImageStatic
                    src={heroImagesDesktop[0].src}
                    alt={heroImagesDesktop[0].alt}
                    isMobile={false}
                    className="rounded-lg desktop-carousel"
                  />
                </div>
                
                {/* ⚡ PERFORMANCE: Carousel carga dinámicamente después del LCP */}
                {isMounted && (
                  <div className={`relative z-20 transition-opacity duration-500 ${carouselLoaded ? 'opacity-100' : 'opacity-0'}`}>
                    <HeroCarousel
                      images={heroImagesDesktop}
                      autoplayDelay={4000}
                      showNavigation={true}
                      showPagination={false}
                      className='w-full h-full rounded-lg desktop-carousel'
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero

