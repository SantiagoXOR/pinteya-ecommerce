'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { X, Phone, MessageCircle, CheckCircle } from 'lucide-react'
import { trackEvent } from '@/lib/google-analytics'

const WhatsAppPopup = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [phone, setPhone] = useState('')
  const [hasShown, setHasShown] = useState(false)

  // Timer de 18 segundos y verificación de localStorage
  useEffect(() => {
    const hasSeenPopup = localStorage.getItem('whatsappPopupShown')
    if (hasSeenPopup) {
      setHasShown(true)
      return
    }

    const timer = setTimeout(() => {
      if (!hasShown) {
        setIsOpen(true)
        setHasShown(true)
        localStorage.setItem('whatsappPopupShown', 'true')
        trackEvent('whatsapp_popup_shown', 'engagement', 'timed_popup')
      }
    }, 5000) // 5 segundos

    return () => clearTimeout(timer)
  }, [hasShown])

  const handleClose = () => {
    setIsOpen(false)
    trackEvent('whatsapp_popup_closed', 'engagement', 'closed_without_submit')
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Sanitizar input: solo números
    const value = e.target.value.replace(/\D/g, '')
    // Limitar a 10 dígitos
    if (value.length <= 10) {
      setPhone(value)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Sanitizar y validar teléfono
    const cleanPhone = phone.replace(/\D/g, '')

    if (cleanPhone.length !== 10) {
      alert('Por favor ingresá un número válido de 10 dígitos (sin 0 ni 15)')
      return
    }

    // Mensaje predefinido
    const message = encodeURIComponent('Hola, me interesa recibir ofertas exclusivas de Pinteya')
    const whatsappNumber = '5493513411796' // Número de Pinteya
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`

    trackEvent('whatsapp_popup_phone_submitted', 'conversion', cleanPhone)
    trackEvent('whatsapp_popup_whatsapp_opened', 'conversion', 'redirect')

    // Abrir WhatsApp
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer')

    // Cerrar popup
    setIsOpen(false)
  }

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fadeIn'>
      <div className='bg-white rounded-3xl shadow-2xl max-w-[600px] w-full relative animate-slideUp overflow-hidden'>
        {/* Close button */}
        <button
          onClick={handleClose}
          className='absolute top-4 right-4 text-white hover:text-white/80 transition-colors z-20 bg-black/20 rounded-full p-2 hover:bg-black/30'
          aria-label='Cerrar'
        >
          <X className='w-6 h-6' />
        </button>

        {/* Background Image */}
        <Image
          src='/images/shapes/newsletter-bg.jpg'
          alt='background'
          className='absolute -z-1 w-full h-full left-0 top-0 rounded-3xl object-cover'
          width={600}
          height={500}
        />

        {/* Overlay gradiente Pinteya */}
        <div className='absolute -z-1 w-full h-full left-0 top-0 bg-gradient-to-r from-[#eb6313] via-[#bd4811] to-[#eb6313] opacity-95 rounded-3xl'></div>

        {/* Patrón de puntos */}
        <div className='absolute -z-1 w-full h-full left-0 top-0 opacity-10'>
          <div
            className='absolute inset-0'
            style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '30px 30px',
            }}
          ></div>
        </div>

        {/* Content */}
        <div className='relative z-10 px-6 sm:px-8 xl:px-12 py-10 lg:py-12'>
          {/* Badge */}
          <div className='inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-4'>
            <MessageCircle className='w-5 h-5 text-yellow-300' />
            <span className='text-white font-bold text-sm'>OFERTAS EXCLUSIVAS</span>
          </div>

          {/* Título */}
          <h2 className='text-white font-bold text-2xl sm:text-3xl xl:text-4xl mb-3 leading-tight'>
            Recibí ofertas exclusivas por{' '}
            <span className='text-yellow-300'>WhatsApp</span>
          </h2>

          {/* Subtítulo */}
          <p className='text-white text-lg mb-6 drop-shadow-lg'>
            Dejanos tu número y te enviamos las mejores promos
          </p>

          {/* Features */}
          <div className='flex flex-col gap-3 mb-8'>
            {[
              'Respuesta inmediata por WhatsApp',
              'Ofertas y descuentos exclusivos',
              'Asesoramiento personalizado',
            ].map((feature, idx) => (
              <div key={idx} className='flex items-center gap-2 text-white'>
                <CheckCircle className='w-5 h-5 text-yellow-300 flex-shrink-0' />
                <span className='text-sm font-medium drop-shadow-lg'>{feature}</span>
              </div>
            ))}
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className='bg-white/10 backdrop-blur-md border-2 border-white/30 rounded-2xl p-6 sm:p-8'>
            <div className='flex flex-col gap-4'>
              <div className='relative'>
                <Phone className='absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
                <input
                  type='tel'
                  name='phone'
                  id='phone'
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder='Ej: 3513411796'
                  required
                  className='w-full bg-white border-2 border-gray-200 focus:border-[#eb6313] outline-none rounded-xl placeholder:text-gray-400 py-4 pl-12 pr-4 text-gray-900 font-medium transition-all'
                />
              </div>

              <button
                type='submit'
                className='group w-full inline-flex items-center justify-center gap-2 py-4 px-7 text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105'
              >
                <MessageCircle className='w-5 h-5' />
                <span>Enviar por WhatsApp</span>
              </button>

              <p className='text-white/70 text-xs text-center'>
                Al enviar tu número aceptás recibir mensajes con ofertas por WhatsApp.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default WhatsAppPopup

