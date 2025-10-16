'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { MessageCircle } from 'lucide-react'

interface FloatingWhatsAppButtonProps {
  className?: string
  phoneNumber?: string
}

const FloatingWhatsAppButton: React.FC<FloatingWhatsAppButtonProps> = ({ 
  className,
  phoneNumber = '+54 9 3513 41-1796'
}) => {
  // Convertir número de teléfono a formato WhatsApp (sin espacios, guiones ni +)
  const whatsappNumber = phoneNumber.replace(/[\s\-+]/g, '')
  const whatsappUrl = `https://wa.me/${whatsappNumber}`

  const handleWhatsAppClick = () => {
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className='fixed bottom-8 left-8 z-maximum sm:bottom-8 sm:right-40 sm:left-auto'>
      {/* Liquid Glass Background Effect - Verde WhatsApp */}
      <div className='absolute inset-0 rounded-full bg-gradient-to-r from-green-500/80 via-green-400/60 to-green-600/80 backdrop-blur-xl border border-white/20 shadow-2xl'></div>
      <div className='absolute inset-0 rounded-full bg-gradient-to-br from-white/30 via-transparent to-transparent'></div>
      <div className='absolute inset-0 rounded-full bg-gradient-to-tl from-green-700/20 via-transparent to-white/10'></div>

      {/* Main Button */}
      <button
        onClick={handleWhatsAppClick}
        data-testid='floating-whatsapp-icon'
        aria-label='Contactar por WhatsApp'
        className={cn(
          // Posicionamiento relativo dentro del contenedor
          'relative',
          // Estilos del botón con efecto glass - tamaño más pequeño y consistente
          'bg-green-500/90 hover:bg-green-600/90 text-white font-bold',
          'w-12 h-12 sm:w-14 sm:h-14',
          'rounded-full shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out',
          'hover:scale-110 active:scale-95 border border-white/30',
          'flex items-center justify-center group floating-button focus-ring',
          'hover:rotate-6 hover:shadow-2xl',
          // Efecto glass mejorado
          'backdrop-blur-md bg-gradient-to-r from-green-500/80 to-green-600/80',
          className
        )}
      >
        {/* Icono de WhatsApp - tamaño proporcional */}
        <MessageCircle 
          className='w-6 h-6 sm:w-7 sm:h-7 transition-transform duration-200 group-hover:scale-110 drop-shadow-lg' 
          strokeWidth={2.5}
        />
        
        {/* Indicador de pulso animado - más pequeño */}
        <span className='absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5'>
          <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75'></span>
          <span className='relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500'></span>
        </span>
      </button>
    </div>
  )
}

export default FloatingWhatsAppButton

