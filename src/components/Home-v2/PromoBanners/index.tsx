'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Truck, Percent, Gift } from 'lucide-react'

interface PromoBannersProps {
  bannerId?: number // Si se proporciona, muestra solo ese banner
}

const PromoBanners = ({ bannerId }: PromoBannersProps = {}) => {
  const banners = [
    {
      id: 1,
      title: 'PINTURA FLASH DAYS',
      subtitle: 'En productos seleccionados',
      badge: '30% OFF',
      badgeColor: 'bg-yellow-400 text-gray-900',
      ctaText: '',
      ctaUrl: '#flash-days-popup',
      bgImage: '/images/promo/CYBERMONDAY.png',
      bgGradient: 'from-red-600/85 via-red-500/85 to-orange-600/85',
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
      
      // Si es el popup de Flash Days, activar el WhatsAppPopup
      if (url === '#flash-days-popup') {
        // Simular click en el botón que abre el popup
        // El WhatsAppPopup se muestra automáticamente, pero podemos forzarlo
        localStorage.removeItem('pinturaFlashDaysShown')
        window.location.reload()
        return
      }
      
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
    <section className='px-4 bg-white pt-4'>
      <div className='max-w-7xl mx-auto space-y-2'>
        {bannersToShow.map((banner) => {
          const isFlashDays = banner.id === 1
          
          return (
            <Link
              key={banner.id}
              href={banner.ctaUrl}
              onClick={(e) => handleBannerClick(e, banner.ctaUrl)}
              className='group block relative overflow-hidden rounded-3xl shadow-md hover:shadow-xl transition-all duration-300'
            >
              {/* DISEÑO ESPECIAL PARA FLASH DAYS (Banner ID 1) */}
              {isFlashDays ? (
                <div className='relative h-20 md:h-24'>
                  {/* Background Image optimizada */}
                  <Image
                    src={banner.bgImage}
                    alt={banner.title}
                    fill
                    className='object-cover object-center'
                    sizes='(max-width: 768px) 100vw, 1200px'
                    priority
                  />
                  
                  {/* Gradient Overlay rojo intenso */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${banner.bgGradient}`}></div>
                  
                  {/* Content - Estilo compacto */}
                  <div className='relative h-full flex items-center justify-between px-4 md:px-8'>
                    {/* Left Content */}
                    <div className='flex items-center gap-2 md:gap-3'>
                      {/* Badge 30% OFF - amarillo y más pequeño */}
                      <div className={`inline-flex items-center gap-1 ${banner.badgeColor} px-2 py-1 md:px-2.5 md:py-1 rounded-full font-bold text-xs md:text-sm shadow-lg`}>
                        <span>{banner.badge}</span>
                      </div>
                      
                      {/* Text Content - PINTURA FLASH DAYS */}
                      <div className='flex flex-col'>
                        {/* Título PINTURA FLASH DAYS */}
                        <h2 className='text-lg md:text-2xl lg:text-3xl font-black text-white leading-tight'>
                          {banner.title}
                        </h2>
                        
                        {/* Subtitle - solo desktop */}
                        <p className='hidden md:block text-white/90 text-xs md:text-sm font-medium mt-0.5'>
                          {banner.subtitle}
                        </p>
                      </div>
                    </div>

                    {/* CTA Button - Solo flecha AMARILLA */}
                    <div className='flex items-center justify-center bg-yellow-400 hover:bg-yellow-300 text-gray-900 w-10 h-10 md:w-12 md:h-12 rounded-full transition-all shadow-lg hover:shadow-xl hover:scale-110'>
                      <ArrowRight className='w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-1 transition-transform' strokeWidth={2.5} />
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
    </section>
  )
}

export default PromoBanners

