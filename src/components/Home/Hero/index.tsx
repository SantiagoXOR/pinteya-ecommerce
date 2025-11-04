'use client'

import React from 'react'
import Image from 'next/image'
// ⚡ PERFORMANCE: Lazy load de HeroCarousel (-1s FCP)
import HeroCarousel from '@/components/Common/HeroCarousel.lazy'

// ⚡ PERFORMANCE OPTIMIZADA: WebP -93% tamaño (7.8MB → 643KB)
// Configuración de imágenes para el carrusel móvil
const heroImagesMobile = [
  {
    src: '/images/hero/hero2/hero1.webp',
    alt: 'Pintá rápido, fácil y cotiza al instante - Productos de pinturería de calidad',
    priority: true, // Primera imagen con priority para FCP
    unoptimized: false, // Optimización de Next.js habilitada
  },
  {
    src: '/images/hero/hero2/hero2.webp',
    alt: 'Amplia gama de productos para pinturería, ferretería y corralón',
    priority: false,
    unoptimized: false,
  },
  {
    src: '/images/hero/hero2/hero3.webp',
    alt: 'Envío gratis y asesoramiento experto en productos de pintura',
    priority: false,
    unoptimized: false,
  },
  {
    src: '/images/hero/hero2/hero4.webp',
    alt: 'Pagos seguros y devoluciones fáciles - Pinteya e-commerce',
    priority: false,
    unoptimized: false,
  },
  {
    src: '/images/hero/hero2/hero5.webp',
    alt: 'Descuentos exclusivos en pinturas y accesorios',
    priority: false,
    unoptimized: false,
  },
  {
    src: '/images/hero/hero2/hero6.webp',
    alt: 'Catálogo completo de productos para pinturería profesional',
    priority: false,
    unoptimized: false,
  },
]

// Configuración de imágenes para el carrusel desktop (WebP optimizado)
const heroImagesDesktop = [
  {
    src: '/images/hero/hero2/hero1.webp',
    alt: 'Pintá rápido, fácil y cotiza al instante - Productos de pinturería de calidad',
    priority: true, // Primera imagen desktop con priority
    unoptimized: false,
  },
  {
    src: '/images/hero/hero2/hero2.webp',
    alt: 'Amplia gama de productos para pinturería, ferretería y corralón',
    priority: false,
    unoptimized: false,
  },
  {
    src: '/images/hero/hero2/hero3.webp',
    alt: 'Envío gratis y asesoramiento experto en productos de pintura',
    priority: false,
    unoptimized: false,
  },
  {
    src: '/images/hero/hero2/hero4.webp',
    alt: 'Pagos seguros y devoluciones fáciles - Pinteya e-commerce',
    priority: false,
    unoptimized: false,
  },
  {
    src: '/images/hero/hero2/hero5.webp',
    alt: 'Descuentos exclusivos en pinturas y accesorios',
    priority: false,
    unoptimized: false,
  },
  {
    src: '/images/hero/hero2/hero6.webp',
    alt: 'Catálogo completo de productos para pinturería profesional',
    priority: false,
    unoptimized: false,
  },
]

const Hero = () => {
  return (
    <section className='relative bg-white overflow-hidden'>
      {/* Carrusel móvil - solo visible en mobile */}
      <div className='lg:hidden bg-white relative z-50'>
        <div className='relative w-full h-[320px] sm:h-[360px] bg-white overflow-hidden'>
          <HeroCarousel
            images={heroImagesMobile}
            autoplayDelay={5000}
            showNavigation={false}
            showPagination={false}
            className='w-full h-full mobile-carousel'
          />
        </div>
      </div>

      {/* Layout desktop - COMPLETAMENTE SEPARADO del móvil */}
      <div className='hidden lg:block relative w-full'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1 pt-2 lg:py-4 lg:pt-8 overflow-hidden relative z-10'>
          {/* Banner principal */}
          <div className='relative rounded-3xl overflow-hidden bg-gradient-to-br from-blaze-orange-500 via-blaze-orange-400 to-blaze-orange-600 min-h-[400px] lg:min-h-[500px]'>
            {/* Contenido desktop - solo visible en desktop */}
            <div className='relative z-10 p-6 lg:p-12 hidden lg:block'>
              <div className='grid lg:grid-cols-2 gap-6 lg:gap-12 items-center min-h-[350px] lg:min-h-[400px]'>
                {/* Contenido del banner - texto a la izquierda */}
                <div className='space-y-4 lg:space-y-6 lg:pr-8'>
                  {/* Título principal más grande y mejor posicionado */}
                  <h1 className='text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight drop-shadow-2xl'>
                    <span className='text-yellow-300'>Pintá</span> rápido,
                    <br />
                    fácil y <span className='text-yellow-300'>cotiza</span>
                    <br />
                    al instante!
                  </h1>
                </div>

                {/* Carrusel principal posicionado a la derecha del texto */}
                <div className='relative z-[20] lg:col-span-1 overflow-hidden'>
                  <div className='relative w-full max-w-md mx-auto lg:max-w-lg xl:max-w-xl h-[420px] lg:h-[480px]'>
                    <HeroCarousel
                      images={heroImagesDesktop}
                      autoplayDelay={4000}
                      showNavigation={true}
                      showPagination={true}
                      className='w-full h-full rounded-lg shadow-2xl desktop-carousel'
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Elementos decorativos sutiles - solo visible en desktop */}
            <div className='absolute top-6 right-6 w-12 h-12 bg-white/5 rounded-full blur-lg z-[5]'></div>
            <div className='absolute bottom-6 left-6 w-8 h-8 bg-white/5 rounded-full blur-md z-[5]'></div>
            <div className='absolute top-1/3 right-1/3 w-6 h-6 bg-yellow-300/10 rounded-full blur-sm z-[5]'></div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
