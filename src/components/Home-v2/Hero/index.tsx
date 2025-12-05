'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
// ⚡ PERFORMANCE: HeroCarousel carga inmediatamente con SSR habilitado
// La primera imagen se renderiza en el servidor para LCP óptimo
import HeroCarousel from '@/components/Common/HeroCarousel'
import { Truck, ShieldCheck, CreditCard, ArrowRight } from 'lucide-react'
import { trackEvent } from '@/lib/google-analytics'

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
  return (
    <section className='relative overflow-hidden -mt-4'>
      {/* Carrusel móvil - PEGADO COMPLETAMENTE al header */}
      <div className='lg:hidden relative z-50 -mt-[92px]'>
        <div className='w-full pt-[92px]'>
          <div className='relative w-full h-[320px] sm:h-[360px] overflow-hidden'>
            {/* ⚡ CRITICAL: HeroCarousel carga inmediatamente, primera imagen con priority para LCP */}
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

      {/* Layout desktop - PEGADO COMPLETAMENTE al header */}
      <div className='hidden lg:block relative w-full -mt-[105px]'>
        <div className='w-full pt-[105px]'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-hidden relative z-10'>
            <div className='relative rounded-3xl overflow-hidden'>
              <div className='relative w-full h-[360px]'>
                {/* ⚡ CRITICAL: HeroCarousel carga inmediatamente, primera imagen con priority para LCP */}
                <HeroCarousel
                  images={heroImagesDesktop}
                  autoplayDelay={4000}
                  showNavigation={true}
                  showPagination={false}
                  className='w-full h-full rounded-lg desktop-carousel'
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero

