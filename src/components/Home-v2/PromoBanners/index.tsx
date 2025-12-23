'use client'

import React, { useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Percent } from '@/lib/optimized-imports'

export interface PromoBannersProps {
  bannerId?: number // Si se proporciona, muestra solo ese banner
}

const PromoBanners = ({ bannerId }: PromoBannersProps = {}) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [imagesLoaded, setImagesLoaded] = useState<Set<number>>(new Set())

  const banners = [
    {
      id: 1,
      title: 'EN TODOS NUESTROS PRODUCTOS',
      subtitle: '',
      badge: '30% OFF',
      badgeColor: 'bg-yellow-400 text-gray-900',
      ctaText: 'Ver Todos los Productos',
      ctaUrl: '/products',
      bgImage: '/images/promo/CYBERMONDAY.png',
      bgGradient: 'from-red-600/85 via-red-500/85 to-orange-600/85',
    },
    {
      id: 2,
      title: 'ASESORAMIENTO GRATIS',
      subtitle: 'Te ayudamos con tu proyecto',
      badge: '100% GRATIS',
      badgeColor: 'bg-blue-500',
      ctaText: 'Contactar ahora',
      ctaUrl: 'https://wa.me/5493513411796?text=Hola!%20Necesito%20asesoramiento%20para%20mi%20proyecto',
      bgImage: '/images/promo/assetpaint.png',
      bgGradient: 'from-blue-900/80 to-blue-700/80',
    },
    {
      id: 3,
      title: 'CALCULÁ TU PINTURA',
      subtitle: 'Herramienta para estimar materiales',
      badge: 'GRATIS',
      badgeColor: 'bg-purple-500',
      ctaText: 'Calcular ahora',
      ctaUrl: '/calculator',
      bgImage: '/images/promo/assetpaint.png',
      bgGradient: 'from-purple-900/80 to-purple-700/80',
    },
  ]

  const handleBannerClick = (e: React.MouseEvent<HTMLAnchorElement>, url: string) => {
    if (url.startsWith('#')) {
      e.preventDefault()
      
      const element = document.querySelector(url)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }

  // Filtrar banners si se proporciona bannerId
  const bannersToShow = bannerId 
    ? banners.filter(b => b.id === bannerId)
    : banners

  return (
    <section className='px-4 sm:px-4 lg:px-8 pb-0 pt-0'>
      <div className='max-w-7xl mx-auto relative'>
        {/* Contenedor con scroll horizontal */}
        <div
          ref={scrollRef}
          className='flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth'
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
        {bannersToShow.map((banner) => {
          const isCompactBanner = banner.id === 1 || banner.id === 2 || banner.id === 3 // Flash Days, Asesoramiento y Calculadora
          
          return (
            <Link
              key={banner.id}
              href={banner.ctaUrl}
              onClick={(e) => handleBannerClick(e, banner.ctaUrl)}
              className='group block relative overflow-hidden rounded-3xl shadow-md hover:shadow-xl transition-all duration-300 flex-shrink-0 w-full md:w-full'
            >
              {/* DISEÑO COMPACTO PARA BANNERS 1 Y 2 */}
              {isCompactBanner ? (
                <div 
                  className='relative h-12 md:h-14'
                  style={{ minHeight: '48px' }} // ⚡ CLS FIX: Altura mínima fija (h-12 = 48px)
                >
                  {/* ⚡ CLS FIX: Skeleton placeholder mientras carga la imagen */}
                  <div 
                    className={`absolute inset-0 skeleton-loading z-0 transition-opacity duration-300 ${imagesLoaded.has(banner.id) ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                    aria-hidden="true"
                  />
                  
                  {/* Background Image optimizada */}
                  {/* Solo bannerId 1 tiene priority (above-fold), los demás usan lazy loading */}
                  <Image
                    src={banner.bgImage}
                    alt={banner.title}
                    fill
                    className='object-cover object-center z-10'
                    sizes='(max-width: 768px) 100vw, 1200px'
                    priority={banner.id === 1}
                    loading={banner.id === 1 ? undefined : 'lazy'}
                    quality={65} // ⚡ OPTIMIZACIÓN: Reducido de 75 a 65 para ahorrar 20.9 KiB (Lighthouse)
                    style={{ objectFit: 'cover' }} // ⚡ CLS FIX: objectFit explícito
                    onLoad={() => {
                      setImagesLoaded(prev => new Set(prev).add(banner.id))
                    }}
                  />
                  
                  {/* Gradient Overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${banner.bgGradient} z-20`}></div>
                  
                  {/* Content - Súper compacto */}
                  <div className='relative h-full flex items-center justify-between px-2 md:px-3 z-30' style={{ opacity: banner.id === 2 ? 0.85 : 1 }}>
                    {/* Left Content */}
                    <div className='flex items-center gap-1.5 md:gap-2'>
                      {/* Badge destacado - Solo para banner Flash Days */}
                      {banner.id === 1 ? (
                        <div className={`inline-flex items-center justify-center ${banner.badgeColor} px-2.5 py-1 md:px-3 md:py-1.5 rounded-full font-black text-xs md:text-base shadow-xl ring-2 ring-yellow-300 ring-opacity-70 transform hover:scale-105 transition-transform duration-200`}>
                          <span className='whitespace-nowrap' style={{ color: 'rgba(235, 99, 19, 1)' }}>{banner.badge}</span>
                        </div>
                      ) : (
                        <div className={`inline-flex items-center ${banner.badgeColor} text-white px-1.5 py-0.5 rounded-full font-bold text-[10px] md:text-xs shadow-sm`}>
                          <span>{banner.badge}</span>
                        </div>
                      )}
                      
                      {/* Text Content - Solo título */}
                      <h2 className='text-sm md:text-lg font-medium text-white leading-none' style={{ letterSpacing: (banner.id === 1 || banner.id === 2) ? '3px' : 'normal' }}>
                        {banner.title}
                      </h2>
                    </div>

                    {/* CTA Button - Flecha mini en círculo */}
                    <div className={`flex items-center justify-center ${banner.id === 1 ? 'bg-yellow-400 hover:bg-yellow-300' : 'bg-white hover:bg-gray-100'} text-gray-900 w-7 h-7 md:w-9 md:h-9 rounded-full transition-all shadow-sm hover:shadow-md hover:scale-110`}>
                      <ArrowRight className='w-3.5 h-3.5 md:w-4 md:h-4 group-hover:translate-x-1 transition-transform' strokeWidth={2.5} style={{ color: banner.id === 1 ? 'rgba(235, 99, 19, 1)' : 'rgba(17, 24, 39, 1)' }} />
                    </div>
                  </div>
                </div>
              ) : (
                // DISEÑO NORMAL PARA OTROS BANNERS
                <div 
                  className='relative h-16 md:h-20'
                  style={{ minHeight: '64px' }} // ⚡ CLS FIX: Altura mínima fija (h-16 = 64px)
                >
                  {/* ⚡ CLS FIX: Skeleton placeholder mientras carga la imagen */}
                  <div 
                    className={`absolute inset-0 skeleton-loading z-0 transition-opacity duration-300 ${imagesLoaded.has(banner.id) ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                    aria-hidden="true"
                  />
                  
                  <Image
                    src={banner.bgImage}
                    alt={banner.title}
                    fill
                    className='object-cover z-10'
                    sizes='(max-width: 768px) 100vw, 1200px'
                    loading='lazy'
                    quality={65} // ⚡ OPTIMIZACIÓN: Reducido de 75 a 65 para ahorrar tamaño
                    style={{ objectFit: 'cover' }} // ⚡ CLS FIX: objectFit explícito
                    onLoad={() => {
                      setImagesLoaded(prev => new Set(prev).add(banner.id))
                    }}
                  />
                  
                  {/* Gradient Overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${banner.bgGradient} z-20`}></div>
                  
                  {/* Content - Simplificado para 1-2 líneas */}
                  <div className='relative h-full flex items-center justify-between px-4 md:px-8 z-30'>
                    {/* Left Content */}
                    <div className='flex items-center gap-3 md:gap-4'>
                      {/* Badge más pequeño */}
                      <div className={`inline-flex items-center gap-1.5 ${banner.badgeColor} text-white px-2.5 py-1 rounded-full font-bold text-xs shadow-md`}>
                        <Percent className='w-3 h-3' />
                        {banner.badge}
                      </div>
                      
                      {/* Title y Subtitle en una línea */}
                      <div className='flex items-baseline gap-2'>
                        <h2 className='text-lg md:text-2xl font-bold text-white leading-none'>
                          {banner.title}
                        </h2>
                        <span className='hidden md:inline text-white/90 text-sm leading-none'>
                          · {banner.subtitle}
                        </span>
                      </div>
                    </div>

                    {/* CTA más compacto */}
                    <div className='flex items-center gap-2 bg-white/95 text-gray-900 px-3 md:px-4 py-1.5 md:py-2 rounded-lg font-bold hover:bg-white transition-colors text-xs md:text-sm'>
                      <span className='hidden sm:inline'>{banner.ctaText}</span>
                      <ArrowRight className='w-4 h-4 group-hover:translate-x-1 transition-transform' />
                    </div>
                  </div>
                </div>
              )}
            </Link>
          )
        })}
        </div>
      </div>
    </section>
  )
}

export default PromoBanners

