'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
// ⚡ PERFORMANCE: Lazy load de HeroCarousel solo para funcionalidad de carrusel
// La primera imagen se carga inmediatamente para mejorar LCP
import HeroCarousel from '@/components/Common/HeroCarousel.lazy'
import { Truck, ShieldCheck, CreditCard, ArrowRight } from 'lucide-react'
import { trackEvent } from '@/lib/google-analytics'

// ⚡ SOLO CAMBIADAS LAS IMÁGENES: WebP → SVG
// Configuración de imágenes para el carrusel móvil con SVG
const heroImagesMobile = [
  {
    src: '/images/hero/hero2/hero1.svg',
    alt: 'Pintá rápido, fácil y cotiza al instante - Productos de pinturería de calidad',
    priority: true,
    unoptimized: true, // SVG no necesita optimización
  },
  {
    src: '/images/hero/hero2/hero2.svg',
    alt: 'Amplia gama de productos para pinturería, ferretería y corralón',
    priority: false,
    unoptimized: true,
  },
  {
    src: '/images/hero/hero2/hero3.svg',
    alt: 'Envío gratis y asesoramiento experto en productos de pintura',
    priority: false,
    unoptimized: true,
  },
]

const heroImagesDesktop = [
  {
    src: '/images/hero/hero2/hero1.svg',
    alt: 'Pintá rápido, fácil y cotiza al instante - Productos de pinturería de calidad',
    priority: true,
    unoptimized: true,
  },
  {
    src: '/images/hero/hero2/hero2.svg',
    alt: 'Amplia gama de productos para pinturería, ferretería y corralón',
    priority: false,
    unoptimized: true,
  },
  {
    src: '/images/hero/hero2/hero3.svg',
    alt: 'Envío gratis y asesoramiento experto en productos de pintura',
    priority: false,
    unoptimized: true,
  },
]

const Hero = () => {
  const [carouselLoaded, setCarouselLoaded] = useState(false)
  const firstImageMobile = heroImagesMobile[0]
  const firstImageDesktop = heroImagesDesktop[0]

  // Detectar cuando el carrusel lazy se ha cargado
  useEffect(() => {
    // Timeout para asegurar que el carrusel se carga después de un breve delay
    const timer = setTimeout(() => {
      setCarouselLoaded(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <section className='relative overflow-hidden -mt-4'>
      {/* Carrusel móvil - PEGADO COMPLETAMENTE al header */}
      <div className='lg:hidden relative z-50 -mt-[92px]'>
        <div className='w-full pt-[92px]'>
          <div className='relative w-full h-[320px] sm:h-[360px] overflow-hidden'>
            {/* ⚡ CRITICAL: Primera imagen hero carga inmediatamente para LCP */}
            {/* Esta imagen se muestra hasta que el carrusel lazy se carga */}
            <div className={`absolute inset-0 z-10 transition-opacity duration-500 ${carouselLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
              <Image
                src={firstImageMobile.src}
                alt={firstImageMobile.alt}
                fill
                priority={true}
                unoptimized={true}
                fetchPriority='high'
                className='object-contain'
                sizes='100vw'
              />
            </div>
            {/* Carrusel lazy-loaded se muestra cuando está listo */}
            <div className={`relative z-20 transition-opacity duration-500 ${carouselLoaded ? 'opacity-100' : 'opacity-0'}`}>
              <HeroCarousel
                images={heroImagesMobile}
                autoplayDelay={5000}
                showNavigation={false}
                showPagination={false}
                className='w-full h-full mobile-carousel'
                onSlideChange={() => setCarouselLoaded(true)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Layout desktop - PEGADO COMPLETAMENTE al header */}
      <div className='hidden lg:block relative w-full -mt-[105px]'>
        <div className='w-full pt-[105px]'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-hidden relative z-10'>
            <div className='relative rounded-3xl overflow-hidden'>
              <div className='relative w-full h-[360px]'>
                {/* ⚡ CRITICAL: Primera imagen hero carga inmediatamente para LCP */}
                {/* Esta imagen se muestra hasta que el carrusel lazy se carga */}
                <div className={`absolute inset-0 z-10 transition-opacity duration-500 ${carouselLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                  <Image
                    src={firstImageDesktop.src}
                    alt={firstImageDesktop.alt}
                    fill
                    priority={true}
                    unoptimized={true}
                    fetchPriority='high'
                    className='object-contain rounded-3xl'
                    sizes='(max-width: 1280px) 100vw, 1280px'
                  />
                </div>
                {/* Carrusel lazy-loaded se muestra cuando está listo */}
                <div className={`relative z-20 transition-opacity duration-500 ${carouselLoaded ? 'opacity-100' : 'opacity-0'}`}>
                  <HeroCarousel
                    images={heroImagesDesktop}
                    autoplayDelay={4000}
                    showNavigation={true}
                    showPagination={false}
                    className='w-full h-full rounded-lg desktop-carousel'
                    onSlideChange={() => setCarouselLoaded(true)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero

