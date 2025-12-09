'use client'

import React, { useState, useEffect } from 'react'
import { X, Gift, Mail } from '@/lib/optimized-imports'
import { trackEvent } from '@/lib/google-analytics'

const ExitIntentModal = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [hasShown, setHasShown] = useState(false)

  useEffect(() => {
    // Solo mostrar en desktop
    if (window.innerWidth < 768) return

    // Verificar si ya se mostró en esta sesión
    const shown = sessionStorage.getItem('exitIntentShown')
    if (shown) {
      setHasShown(true)
      return
    }

    const handleMouseLeave = (e: MouseEvent) => {
      // Detectar movimiento hacia arriba (salir de la ventana)
      if (e.clientY <= 0 && !hasShown) {
        setIsOpen(true)
        setHasShown(true)
        // Guardar timestamp para coordinación con WhatsAppPopup
        sessionStorage.setItem('exitIntentShown', Date.now().toString())
        trackEvent('exit_intent_shown', 'engagement', 'modal')
      }
    }

    document.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [hasShown])

  const handleClose = () => {
    setIsOpen(false)
    trackEvent('exit_intent_closed', 'engagement', 'modal')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) return

    // Aquí iría la lógica para guardar el email
    console.log('Email capturado:', email)

    trackEvent('exit_intent_converted', 'conversion', email)

    // Mostrar mensaje de éxito
    alert('¡Genial! Revisá tu email para obtener el código de descuento.')
    setIsOpen(false)
  }

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fadeIn'>
      <div className='bg-white rounded-2xl shadow-2xl max-w-md w-full relative animate-slideUp overflow-hidden'>
        {/* Close button */}
        <button
          onClick={handleClose}
          className='absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10'
        >
          <X className='w-6 h-6' />
        </button>

        {/* Header con gradiente */}
        <div className='bg-gradient-to-r from-orange-500 to-red-500 p-8 text-white relative'>
          <div className='absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16'></div>
          <div className='relative z-10'>
            <Gift className='w-12 h-12 mb-3' />
            <h2 className='text-3xl font-bold mb-2'>¡Espera!</h2>
            <p className='text-white/90 text-lg'>
              No te vayas sin tu descuento especial
            </p>
          </div>
        </div>

        {/* Content */}
        <div className='p-8'>
          <div className='text-center mb-6'>
            <div className='inline-block bg-green-100 text-green-800 font-bold text-4xl px-6 py-3 rounded-lg mb-4'>
              10% OFF
            </div>
            <p className='text-gray-700 text-lg mb-2'>
              En tu primera compra
            </p>
            <p className='text-gray-500 text-sm'>
              Dejanos tu email y recibí un código exclusivo
            </p>
          </div>

          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='relative'>
              <Mail className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
              <input
                type='email'
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder='tu@email.com'
                required
                className='w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none transition-colors'
              />
            </div>

            <button
              type='submit'
              className='w-full bg-gradient-to-r from-[#eb6313] to-[#bd4811] hover:from-orange-600 hover:to-red-700 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 shadow-lg'
            >
              Obtener mi descuento
            </button>
          </form>

          <p className='text-gray-400 text-xs text-center mt-4'>
            * Válido para compras superiores a $30.000
          </p>

          {/* Enlaces rápidos */}
          <div className='mt-6 pt-6 border-t border-gray-200'>
            <p className='text-sm text-gray-600 mb-3 font-medium'>
              O explorá nuestras categorías más populares:
            </p>
            <div className='flex flex-wrap gap-2'>
              {['Látex', 'Antióxido', 'Impermeabilizante', 'Piscinas'].map(
                category => (
                  <a
                    key={category}
                    href={`/search?q=${category}`}
                    onClick={handleClose}
                    className='text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-full transition-colors'
                  >
                    {category}
                  </a>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExitIntentModal

