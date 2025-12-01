'use client'

import React, { useState, useEffect } from 'react'
import { MessageCircle, X, Sparkles } from 'lucide-react'
import { trackEvent } from '@/lib/google-analytics'

const BuyPageWhatsAppPopup = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [hasShown, setHasShown] = useState(false)

  const whatsappNumber = '5493513411796' // Número oficial de Pinteya
  const defaultMessage = 'Hola! Necesito ayuda para elegir productos de pinturería'

  useEffect(() => {
    // Verificar si ya se mostró en esta sesión
    const shownInSession = sessionStorage.getItem('buyPageWhatsAppPopupShown')
    if (shownInSession) {
      return
    }

    // Mostrar después de 500ms (reducido para reducir bounce rate)
    const timer = setTimeout(() => {
      setIsVisible(true)
      setHasShown(true)
      sessionStorage.setItem('buyPageWhatsAppPopupShown', 'true')
      trackEvent('buy_page_whatsapp_popup_shown', 'engagement', 'timed_popup')
    }, 500) // 500ms para capturar usuarios antes de que se vayan

    return () => clearTimeout(timer)
  }, [])

  const handleWhatsAppClick = () => {
    trackEvent('whatsapp_click', 'engagement', 'buy_page_popup')
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(defaultMessage)}`
    window.open(url, '_blank', 'noopener,noreferrer')
    handleClose()
  }

  const handleClose = () => {
    setIsVisible(false)
    trackEvent('buy_page_whatsapp_popup_closed', 'engagement', 'closed')
  }

  if (!isVisible) return null

  return (
    <div className='fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] flex items-center justify-center p-4 animate-fadeIn'>
      <div className='bg-white rounded-2xl shadow-2xl max-w-md w-full relative animate-slideUp overflow-hidden'>
        {/* Botón de cerrar */}
        <button
          onClick={handleClose}
          className='absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10'
          aria-label='Cerrar'
        >
          <X className='w-5 h-5' />
        </button>

        {/* Contenido */}
        <div className='p-6 pt-8'>
          {/* Icono y título */}
          <div className='flex items-center gap-3 mb-4'>
            <div className='w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg'>
              <MessageCircle className='w-6 h-6 text-white' />
            </div>
            <div>
              <h3 className='text-xl font-bold text-gray-900'>
                Te asesoramos por WhatsApp
              </h3>
              <p className='text-sm text-green-600 flex items-center gap-1 mt-0.5'>
                <span className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></span>
                En línea ahora
              </p>
            </div>
          </div>

          {/* Mensaje empático */}
          <p className='text-gray-700 text-base mb-6 leading-relaxed'>
            ¿Tenés dudas sobre qué producto elegir? 👋
            <br />
            Nuestros asesores están disponibles para ayudarte a encontrar exactamente lo que necesitás.
          </p>

          {/* Botón de acción */}
          <button
            onClick={handleWhatsAppClick}
            className='w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 group'
          >
            <MessageCircle className='w-5 h-5 group-hover:scale-110 transition-transform' />
            <span>Chatear por WhatsApp</span>
            <Sparkles className='w-4 h-4 group-hover:rotate-12 transition-transform' />
          </button>

          {/* Texto secundario */}
          <p className='text-xs text-gray-500 text-center mt-4'>
            Respuesta rápida y personalizada
          </p>
        </div>
      </div>
    </div>
  )
}

export default BuyPageWhatsAppPopup


