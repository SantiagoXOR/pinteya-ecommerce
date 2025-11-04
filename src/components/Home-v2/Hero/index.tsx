'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
// ⚡ PERFORMANCE: Lazy load de HeroCarousel (-1s FCP)
import HeroCarousel from '@/components/Common/HeroCarousel.lazy'
import { Truck, ShieldCheck, CreditCard, ArrowRight } from 'lucide-react'
import { trackEvent } from '@/lib/google-analytics'

// ⚡ PERFORMANCE OPTIMIZADA: WebP -93% tamaño (7.8MB → 643KB)
// ⚡ Priority Hints API para optimizar orden de carga
const heroImagesMobile = [
  {
    src: '/images/hero/hero2/hero1.webp',
    alt: 'Pintá rápido, fácil y cotiza al instante - Productos de pinturería de calidad',
    priority: true, // Primera imagen crítica
    unoptimized: false,
    fetchPriority: 'high' as const, // ⚡ Alta prioridad explícita
    quality: 85, // Mejor calidad para LCP
    sizes: '(max-width: 768px) 100vw, 50vw',
  },
  {
    src: '/images/hero/hero2/hero2.webp',
    alt: 'Amplia gama de productos para pinturería, ferretería y corralón',
    priority: false,
    unoptimized: false,
    fetchPriority: 'low' as const, // Baja prioridad
    quality: 75,
    sizes: '(max-width: 768px) 100vw, 50vw',
  },
  {
    src: '/images/hero/hero2/hero3.webp',
    alt: 'Envío gratis y asesoramiento experto en productos de pintura',
    priority: false,
    unoptimized: false,
    fetchPriority: 'low' as const,
    quality: 75,
    sizes: '(max-width: 768px) 100vw, 50vw',
  },
  {
    src: '/images/hero/hero2/hero4.webp',
    alt: 'Pagos seguros y devoluciones fáciles - Pinteya e-commerce',
    priority: false,
    unoptimized: false,
    fetchPriority: 'low' as const,
    quality: 75,
    sizes: '(max-width: 768px) 100vw, 50vw',
  },
  {
    src: '/images/hero/hero2/hero5.webp',
    alt: 'Descuentos exclusivos en pinturas y accesorios',
    priority: false,
    unoptimized: false,
    fetchPriority: 'low' as const,
    quality: 75,
    sizes: '(max-width: 768px) 100vw, 50vw',
  },
  {
    src: '/images/hero/hero2/hero6.webp',
    alt: 'Catálogo completo de productos para pinturería profesional',
    priority: false,
    unoptimized: false,
    fetchPriority: 'low' as const,
    quality: 75,
    sizes: '(max-width: 768px) 100vw, 50vw',
  },
]

const heroImagesDesktop = [
  {
    src: '/images/hero/hero2/hero1.webp',
    alt: 'Pintá rápido, fácil y cotiza al instante - Productos de pinturería de calidad',
    priority: true,
    unoptimized: false,
    fetchPriority: 'high' as const, // Alta prioridad para desktop
    quality: 85,
    sizes: '(max-width: 1024px) 80vw, 50vw',
  },
  {
    src: '/images/hero/hero2/hero2.webp',
    alt: 'Amplia gama de productos para pinturería, ferretería y corralón',
    priority: false,
    unoptimized: false,
    fetchPriority: 'low' as const,
    quality: 75,
    sizes: '(max-width: 1024px) 80vw, 50vw',
  },
  {
    src: '/images/hero/hero2/hero3.webp',
    alt: 'Envío gratis y asesoramiento experto en productos de pintura',
    priority: false,
    unoptimized: false,
    fetchPriority: 'low' as const,
    quality: 75,
    sizes: '(max-width: 1024px) 80vw, 50vw',
  },
  {
    src: '/images/hero/hero2/hero4.webp',
    alt: 'Pagos seguros y devoluciones fáciles - Pinteya e-commerce',
    priority: false,
    unoptimized: false,
    fetchPriority: 'low' as const,
    quality: 75,
    sizes: '(max-width: 1024px) 80vw, 50vw',
  },
  {
    src: '/images/hero/hero2/hero5.webp',
    alt: 'Descuentos exclusivos en pinturas y accesorios',
    priority: false,
    unoptimized: false,
    fetchPriority: 'low' as const,
    quality: 75,
    sizes: '(max-width: 1024px) 80vw, 50vw',
  },
  {
    src: '/images/hero/hero2/hero6.webp',
    alt: 'Catálogo completo de productos para pinturería profesional',
    priority: false,
    unoptimized: false,
    fetchPriority: 'low' as const,
    quality: 75,
    sizes: '(max-width: 1024px) 80vw, 50vw',
  },
]

const Hero = () => {
  const handleCTAClick = (ctaName: string) => {
    trackEvent('hero_cta_click', 'engagement', ctaName)
  }

  return (
    <section className='relative bg-white overflow-hidden'>
      {/* Carrusel móvil - solo visible en mobile */}
      <div className='lg:hidden bg-white relative z-50 -mt-8 px-4'>
        <div className='max-w-7xl mx-auto'>
          <div className='relative w-full h-[320px] sm:h-[360px] overflow-hidden rounded-2xl'>
            <HeroCarousel
              images={heroImagesMobile}
              autoplayDelay={5000}
              showNavigation={false}
              showPagination={false}
              className='w-full h-full mobile-carousel'
            />
          </div>
        </div>
      </div>

      {/* Layout desktop - COMPLETAMENTE SEPARADO del móvil */}
      <div className='hidden lg:block relative w-full -mt-1'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-hidden relative z-10'>
          {/* Banner principal */}
          <div className='relative rounded-3xl overflow-hidden bg-gradient-to-br from-blaze-orange-500 via-blaze-orange-400 to-blaze-orange-600'>
            {/* Contenido desktop */}
            <div className='relative z-10 p-6 lg:p-8 hidden lg:block'>
              <div className='grid lg:grid-cols-2 gap-6 lg:gap-12 items-center'>
                {/* Contenido del banner - texto a la izquierda */}
                <div className='space-y-6 lg:pr-8'>
                  {/* Badge de confianza */}
                  <div className='inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full'>
                    <div className='w-2 h-2 bg-green-400 rounded-full animate-pulse'></div>
                    <span className='text-white text-sm font-medium'>
                      Más de 10,000 clientes satisfechos
                    </span>
                  </div>

                  {/* Título principal mejorado */}
                  <h1 className='text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight drop-shadow-2xl'>
                    Encontrá la pintura
                    <br />
                    <span className='text-yellow-300'>perfecta</span> para tu
                    <br />
                    proyecto
                  </h1>

                  {/* Subtítulo */}
                  <p className='text-xl text-white/90 font-medium'>
                    Miles de productos con envío gratis y asesoramiento experto
                  </p>

                  {/* CTAs principales */}
                  <div className='flex flex-col sm:flex-row gap-4 mt-6'>
                    <Link
                      href='/products'
                      onClick={() => handleCTAClick('ver_productos')}
                      className='group bg-[#eb6313] hover:bg-[#bd4811] text-white font-bold px-8 py-4 rounded-lg transition-all transform hover:scale-105 shadow-xl hover:shadow-2xl flex items-center justify-center gap-2'
                    >
                      Ver Todos los Productos
                      <ArrowRight className='w-5 h-5 group-hover:translate-x-1 transition-transform' />
                    </Link>
                    <Link
                      href='/search?q=ofertas'
                      onClick={() => handleCTAClick('ver_ofertas')}
                      className='group bg-white/20 hover:bg-white/30 backdrop-blur text-white font-bold px-8 py-4 rounded-lg border-2 border-white transition-all flex items-center justify-center gap-2'
                    >
                      Ofertas Especiales
                      <span className='bg-red-500 text-white text-xs px-2 py-1 rounded-full'>
                        30% OFF
                      </span>
                    </Link>
                  </div>

                  {/* Beneficios clave */}
                  <div className='flex flex-wrap items-center gap-6 mt-6 text-white/90'>
                    <div className='flex items-center gap-2 group hover:text-white transition-colors'>
                      <div className='bg-white/20 p-2 rounded-full group-hover:bg-white/30 transition-colors'>
                        <Truck className='w-5 h-5' />
                      </div>
                      <span className='text-sm font-medium'>
                        Envío gratis +$50.000
                      </span>
                    </div>
                    <div className='flex items-center gap-2 group hover:text-white transition-colors'>
                      <div className='bg-white/20 p-2 rounded-full group-hover:bg-white/30 transition-colors'>
                        <ShieldCheck className='w-5 h-5' />
                      </div>
                      <span className='text-sm font-medium'>
                        Pago 100% seguro
                      </span>
                    </div>
                    <div className='flex items-center gap-2 group hover:text-white transition-colors'>
                      <div className='bg-white/20 p-2 rounded-full group-hover:bg-white/30 transition-colors'>
                        <CreditCard className='w-5 h-5' />
                      </div>
                      <span className='text-sm font-medium'>
                        12 cuotas sin interés
                      </span>
                    </div>
                  </div>

                  {/* Social proof adicional */}
                  <div className='flex items-center gap-3 pt-4'>
                    <div className='flex -space-x-2'>
                      {[1, 2, 3, 4].map(i => (
                        <div
                          key={i}
                          className='w-10 h-10 rounded-full bg-white/30 border-2 border-white flex items-center justify-center text-white font-bold'
                        >
                          {i === 1 && '👤'}
                          {i === 2 && '👤'}
                          {i === 3 && '👤'}
                          {i === 4 && '🎨'}
                        </div>
                      ))}
                    </div>
                    <div className='text-white/90 text-sm'>
                      <p className='font-medium'>Última compra hace 5 min</p>
                      <p className='text-white/70 text-xs'>en Córdoba Capital</p>
                    </div>
                  </div>
                </div>

                {/* Carrusel principal posicionado a la derecha del texto */}
                <div className='relative z-[20] lg:col-span-1 overflow-hidden'>
                  <div className='relative w-full max-w-md mx-auto lg:max-w-lg xl:max-w-xl h-[360px]'>
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

            {/* Elementos decorativos sutiles */}
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

