'use client'

import React, { useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Truck, Percent, Gift, ChevronLeft, ChevronRight } from 'lucide-react'

interface PromoBannersProps {
  bannerId?: number // Si se proporciona, muestra solo ese banner
}

const PromoBanners = ({ bannerId }: PromoBannersProps = {}) => {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 400
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  const banners = [
    {
      id: 1,
      title: 'PINTURA FLASH DAYS',
      subtitle: 'En productos seleccionados',
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
    <section className='px-4'>
      <div className='max-w-7xl mx-auto relative'>
        {/* Botones de navegación minimalistas */}
        <div className='hidden md:flex gap-2 absolute right-0 -top-10 z-10'>
          <button
            onClick={() => scroll('left')}
            className='text-gray-400 hover:text-blaze-orange-600 transition-colors p-1'
            aria-label='Anterior'
          >
            <ChevronLeft className='w-5 h-5' />
          </button>
          <button
            onClick={() => scroll('right')}
            className='text-gray-400 hover:text-blaze-orange-600 transition-colors p-1'
            aria-label='Siguiente'
          >
            <ChevronRight className='w-5 h-5' />
          </button>
        </div>

        {/* Contenedor con scroll horizontal */}
        <div
          ref={scrollRef}
          className='flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth pb-2'
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
        {bannersToShow.map((banner) => {
          const isCompactBanner = banner.id === 1 || banner.id === 2 || banner.id === 3 // Flash Days, Asesoramiento y Calculadora
          
          return (
            <Link
              key={banner.id}
              href={banner.ctaUrl}
              onClick={(e) => handleBannerClick(e, banner.ctaUrl)}
              className='group block relative overflow-hidden rounded-3xl shadow-md hover:shadow-xl transition-all duration-300 flex-shrink-0 w-full md:w-[calc(50%-0.25rem)] lg:w-[calc(33.333%-0.375rem)]'
            >
              {/* DISEÑO COMPACTO PARA BANNERS 1 Y 2 */}
              {isCompactBanner ? (
                <div className='relative h-12 md:h-14'>
                  {/* Background Image optimizada */}
                  <Image
                    src={banner.bgImage}
                    alt={banner.title}
                    fill
                    className='object-cover object-center'
                    sizes='(max-width: 768px) 100vw, 1200px'
                    priority
                  />
                  
                  {/* Gradient Overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${banner.bgGradient}`}></div>
                  
                  {/* Content - Súper compacto */}
                  <div className='relative h-full flex items-center justify-between px-3 md:px-5'>
                    {/* Left Content */}
                    <div className='flex items-center gap-1.5 md:gap-2'>
                      {/* Badge mini */}
                      <div className={`inline-flex items-center ${banner.badgeColor} text-white px-1.5 py-0.5 rounded-full font-bold text-[10px] md:text-xs shadow-sm`}>
                        <span>{banner.badge}</span>
                      </div>
                      
                      {/* Text Content - Solo título */}
                      <h2 className='text-sm md:text-lg font-black text-white leading-none'>
                        {banner.title}
                      </h2>
                    </div>

                    {/* CTA Button - Flecha mini en círculo */}
                    <div className={`flex items-center justify-center ${banner.id === 1 ? 'bg-yellow-400 hover:bg-yellow-300' : 'bg-white hover:bg-gray-100'} text-gray-900 w-7 h-7 md:w-9 md:h-9 rounded-full transition-all shadow-sm hover:shadow-md hover:scale-110`}>
                      <ArrowRight className='w-3.5 h-3.5 md:w-4 md:h-4 group-hover:translate-x-1 transition-transform' strokeWidth={2.5} />
                    </div>
                  </div>
                </div>
              ) : (
                // DISEÑO NORMAL PARA OTROS BANNERS
                <div className='relative h-16 md:h-20'>
                  <Image
                    src={banner.bgImage}
                    alt={banner.title}
                    fill
                    className='object-cover'
                    sizes='(max-width: 768px) 100vw, 1200px'
                  />
                  
                  {/* Gradient Overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${banner.bgGradient}`}></div>
                  
                  {/* Content - Simplificado para 1-2 líneas */}
                  <div className='relative h-full flex items-center justify-between px-4 md:px-8'>
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

