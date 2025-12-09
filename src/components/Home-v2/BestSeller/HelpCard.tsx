'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { MessageCircle, HelpCircle } from '@/lib/optimized-imports'
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
        // Mismo formato base que CommercialProductCard
        'relative rounded-xl bg-white shadow-md flex flex-col w-full cursor-pointer',
        // Mobile: altura igual a CommercialProductCard
        'h-[300px] sm:h-[360px]',
        // Tablet y desktop: altura igual a CommercialProductCard
        'md:h-[450px] lg:h-[500px]',
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
    >
      {/* Sección superior - Imagen/Icono (similar a CommercialProductCard) */}
      <div className='relative w-full h-[140px] sm:h-[160px] md:h-[200px] bg-gradient-to-br from-orange-50 via-yellow-50 to-orange-50 rounded-t-xl md:rounded-t-2xl flex items-center justify-center overflow-hidden'>
        {/* Icono principal */}
        <div className='w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center shadow-lg'>
          <HelpCircle className='w-8 h-8 md:w-10 md:h-10 text-white' />
        </div>
        
        {/* Badge de disponibilidad en esquina superior */}
        <div className='absolute top-2 right-2 md:top-3 md:right-3 flex items-center gap-1.5 bg-green-500 text-white px-2 py-1 md:px-3 md:py-1.5 rounded-full text-[10px] md:text-xs font-medium shadow-md'>
          <div className='w-1.5 h-1.5 bg-white rounded-full animate-pulse'></div>
          <span>24/7</span>
        </div>
      </div>

      {/* Sección inferior - Contenido (similar a CommercialProductCard) */}
      <div className='flex flex-col flex-1 p-3 sm:p-4 md:p-5 justify-between'>
        {/* Texto principal */}
        <div className='space-y-1.5 md:space-y-2 text-left'>
          <h3 className='text-sm sm:text-base md:text-lg font-bold text-gray-900 leading-tight'>
            ¿No encontraste lo que buscabas?
          </h3>
          <p className='text-xs md:text-sm text-gray-600 leading-relaxed'>
            Nuestros asesores están disponibles para ayudarte
          </p>
        </div>

        {/* Botón de WhatsApp - Estilo similar al CTA de CommercialProductCard */}
        <div className='mt-auto pt-4 md:pt-5'>
          <Button
            onClick={handleWhatsAppClick}
            className='w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300 group h-10 md:h-11 px-4 md:px-6'
            size='default'
          >
            <MessageCircle className='w-5 h-5 md:w-6 md:h-6 mr-2 transition-transform duration-200 group-hover:scale-110' />
            <span className='text-sm md:text-base font-semibold'>Necesito Ayuda</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default HelpCard

