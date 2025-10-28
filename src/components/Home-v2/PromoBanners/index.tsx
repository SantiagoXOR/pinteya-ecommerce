'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Truck, Percent } from 'lucide-react'

interface PromoBannersProps {
  bannerId?: number // Si se proporciona, muestra solo ese banner
}

const PromoBanners = ({ bannerId }: PromoBannersProps = {}) => {
  const banners = [
    {
      id: 1,
      title: 'CYBERMONDAY',
      subtitle: 'Las mejores marcas para tu proyecto',
      badge: 'HASTA 30% OFF',
      badgeColor: 'bg-pink-500',
      ctaText: 'Ver ofertas',
      ctaUrl: '#ofertas-especiales',
      bgImage: '/images/promo/comboverano.png',
      bgGradient: 'from-blue-900/80 to-purple-900/80',
    },
    {
      id: 2,
      title: 'ENVÍO GRATIS',
      subtitle: 'En compras mayores a $50.000',
      badge: 'SIN COSTO',
      badgeColor: 'bg-green-500',
      ctaText: 'Ver productos',
      ctaUrl: '#envio-gratis',
      bgImage: '/images/promo/comboeco.png',
      bgGradient: 'from-orange-900/80 to-red-900/80',
    },
    {
      id: 3,
      title: 'LÍDERES EN CÓRDOBA',
      subtitle: '+15 años en el mercado',
      badge: '15.000+ CLIENTES',
      badgeColor: 'bg-yellow-500 text-gray-900',
      ctaText: 'Conocenos',
      ctaUrl: '#trust-section',
      bgImage: '/images/promo/comboplavicon.png',
      bgGradient: 'from-gray-900/80 to-gray-700/80',
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
    <section className='pb-0 px-4 bg-white'>
      <div className='max-w-7xl mx-auto space-y-2'>
        {bannersToShow.map((banner) => (
          <Link
            key={banner.id}
            href={banner.ctaUrl}
            onClick={(e) => handleBannerClick(e, banner.ctaUrl)}
            className='group block relative overflow-hidden rounded-xl shadow-md hover:shadow-lg transition-all duration-300'
          >
            {/* Background Image - Altura reducida */}
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
          </Link>
        ))}
      </div>
    </section>
  )
}

export default PromoBanners

