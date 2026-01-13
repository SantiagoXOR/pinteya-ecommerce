'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { MessageCircle } from '@/lib/optimized-imports'
import { cn } from '@/lib/utils'

interface HelpCardProps {
  categoryName?: string | null
  className?: string
}

const HelpCard: React.FC<HelpCardProps> = ({ categoryName, className }) => {
  const [isHovered, setIsHovered] = useState(false)
  const whatsappNumber = '5493513411796'
  
  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    const categoryText = categoryName 
      ? `la categoría ${categoryName}` 
      : 'el catálogo'
    const message = `Hola, estoy buscando productos en ${categoryText} y necesito ayuda`
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
    
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div
      className={cn(
        'relative rounded-xl bg-orange-500 shadow-md flex flex-col w-full cursor-pointer overflow-hidden',
        'h-[300px] sm:h-[360px]',
        'md:h-[400px] lg:h-[440px]',
        'md:rounded-2xl',
        'transition-all duration-200 ease-out hover:scale-[1.02] hover:shadow-xl',
        'transform-gpu will-change-transform',
        className
      )}
      style={{
        transformOrigin: 'center',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        transform: isHovered ? 'scale(1.02)' : 'scale(1)',
        boxShadow: isHovered ? '0 10px 25px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.1)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleWhatsAppClick}
    >
      {/* Imagen de fondo - Hombre con camiseta Pinte YA! */}
      <div className='relative w-full h-full'>
        <Image
          src='/images/promo/help.png'
          alt='Te ayudamos por WhatsApp'
          fill
          className='object-cover'
          sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
          priority
          quality={90}
        />
        
        {/* Overlay para mejorar legibilidad */}
        <div className='absolute inset-0 bg-gradient-to-b from-orange-500/40 via-orange-500/20 to-orange-500/60' />
        
        {/* Contenido superpuesto */}
        <div className='absolute inset-0 flex flex-col justify-between p-3 sm:p-4 md:p-5'>
          {/* Recuadro verde con pregunta */}
          <div className='mt-2 sm:mt-3 md:mt-4'>
            <div className='bg-green-500 px-3 py-2 sm:px-4 sm:py-2.5 md:px-5 md:py-3 rounded-lg shadow-lg inline-block'>
              <p className='text-white text-xs sm:text-sm md:text-base font-bold'>
                ¿No encontraste lo que buscabas?
              </p>
            </div>
          </div>
          
          {/* Texto principal y icono WhatsApp */}
          <div className='flex flex-col items-center justify-center space-y-3 sm:space-y-4 md:space-y-5 mb-4 sm:mb-6 md:mb-8'>
            <h2 className='text-white text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold drop-shadow-lg text-center'>
              Te ayudamos por WhatsApp
            </h2>
            
            {/* Icono grande de WhatsApp en círculo blanco */}
            <div className='w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-white rounded-full flex items-center justify-center shadow-xl'>
              <MessageCircle className='w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-green-500' />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HelpCard
