'use client'

import React, { useState, useEffect } from 'react'
import { MessageCircle, X } from '@/lib/optimized-imports'
import { trackEvent } from '@/lib/google-analytics'
import { useTenantSafe } from '@/contexts/TenantContext'

interface FloatingWhatsAppProps {
  showImmediately?: boolean
}

const FloatingWhatsApp: React.FC<FloatingWhatsAppProps> = ({ showImmediately = false }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  // Obtener número de WhatsApp del tenant
  const tenant = useTenantSafe()
  const whatsappNumber = tenant?.whatsappNumber || '5493513411796'
  const defaultMessage = tenant?.whatsappMessageTemplate || 'Hola! Necesito ayuda con productos de pinturería'

  useEffect(() => {
    // Si showImmediately es true, mostrar inmediatamente
    // Si no, mostrar después de 5 segundos (comportamiento por defecto)
    const delay = showImmediately ? 0 : 5000

    const timer = setTimeout(() => {
      setIsVisible(true)
    }, delay)

    return () => clearTimeout(timer)
  }, [showImmediately])

  const handleClick = () => {
    trackEvent('whatsapp_click', 'engagement', 'floating_button')
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(defaultMessage)}`
    window.open(url, '_blank')
  }

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className='fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2'>
      {/* Tooltip expandible */}
      {isExpanded && (
        <div className='animate-fadeIn bg-white rounded-lg shadow-2xl p-4 max-w-xs mr-2'>
          <div className='flex items-start justify-between mb-2'>
            <div className='flex items-center gap-2'>
              <div className='w-10 h-10 bg-green-500 rounded-full flex items-center justify-center'>
                <MessageCircle className='w-6 h-6 text-white' />
              </div>
              <div>
                <p className='font-bold text-gray-900'>¿Necesitás ayuda?</p>
                <p className='text-xs text-green-600 flex items-center gap-1'>
                  <span className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></span>
                  En línea
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className='text-gray-400 hover:text-gray-600 transition-colors'
            >
              <X className='w-4 h-4' />
            </button>
          </div>
          <p className='text-sm text-gray-600 mb-3'>
            ¡Hola! 👋 ¿Tenés dudas sobre qué pintura elegir? Escribinos por WhatsApp.
          </p>
          <button
            onClick={handleClick}
            className='w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2'
          >
            <MessageCircle className='w-4 h-4' />
            Chatear ahora
          </button>
        </div>
      )}

      {/* Botón principal */}
      <button
        onClick={handleClick}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
        className='group relative bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-2xl hover:shadow-green-500/50 transition-all hover:scale-110 animate-bounce'
        aria-label='Contactar por WhatsApp'
      >
        {/* Pulse ring */}
        <span className='absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75'></span>

        <MessageCircle className='w-7 h-7 relative z-10' />

        {/* Badge de notificación */}
        <span className='absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white'>
          1
        </span>
      </button>
    </div>
  )
}

export default FloatingWhatsApp

