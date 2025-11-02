'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { X, Phone, MessageCircle, CheckCircle, Gift, Sparkles } from 'lucide-react'
import { trackEvent } from '@/lib/google-analytics'

// ===================================
// CONFIGURACIÓN PINTURA FLASH DAYS
// ===================================
const PINTURA_FLASH_DAYS_CONFIG = {
  prizeAmount: 75000, // Valor del medio rango ($50k - $100k)
  prizeCount: 3,
  startDate: '3 de noviembre',
  endDate: '5 de noviembre',
  termsUrl: '/terminos-flash-days',
  whatsappNumber: '5493513411796',
}

const WhatsAppPopup = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [phone, setPhone] = useState('')
  const [hasShown, setHasShown] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [isDuplicate, setIsDuplicate] = useState(false)
  const [participantId, setParticipantId] = useState<string | null>(null)

  // Detección de viewport (mobile vs desktop)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768) // md breakpoint
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Timer de 5 segundos y verificación de localStorage
  useEffect(() => {
    const hasSeenPopup = localStorage.getItem('pinturaFlashDaysShown')
    if (hasSeenPopup) {
      setHasShown(true)
      return
    }

    const timer = setTimeout(() => {
      if (!hasShown) {
        setIsOpen(true)
        setHasShown(true)
        localStorage.setItem('pinturaFlashDaysShown', 'true')
        trackEvent('flash_days_popup_shown', 'engagement', 'timed_popup')
      }
    }, 5000) // 5 segundos

    return () => clearTimeout(timer)
  }, [hasShown])

  const handleClose = () => {
    setIsOpen(false)
    trackEvent('flash_days_popup_closed', 'engagement', 'closed_without_submit')
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Sanitizar input: solo números
    let value = e.target.value.replace(/\D/g, '')
    
    // Remover el 0 inicial si lo tiene (común en Argentina)
    if (value.startsWith('0')) {
      value = value.substring(1)
    }
    
    // Remover el 15 inicial si lo tiene
    if (value.startsWith('15')) {
      value = value.substring(2)
    }
    
    // Limitar a 10 dígitos
    if (value.length <= 10) {
      setPhone(value)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Sanitizar y validar teléfono
      const cleanPhone = phone.replace(/\D/g, '')

      // Validación mejorada para números argentinos
      if (cleanPhone.length < 8 || cleanPhone.length > 10) {
        alert('Por favor ingresá un número válido (sin 0 ni 15)')
        setIsSubmitting(false)
        return
      }

      // ===================================
      // 1. CAPTURAR METADATA AUTOMÁTICAMENTE
      // ===================================
      const metadata = {
        deviceType: isMobile ? 'mobile' : 'desktop',
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        browserLanguage: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        referrer: document.referrer || 'direct',
        utmSource: new URLSearchParams(window.location.search).get('utm_source'),
        utmMedium: new URLSearchParams(window.location.search).get('utm_medium'),
        utmCampaign: new URLSearchParams(window.location.search).get('utm_campaign'),
      }

      // ===================================
      // 2. GUARDAR EN BASE DE DATOS
      // ===================================
      const response = await fetch('/api/flash-days/participate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: cleanPhone,
          metadata,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        alert(result.message || 'Error al registrar participación')
        setIsSubmitting(false)
        return
      }

      // Guardar ID del participante
      setParticipantId(result.participantId || null)
      setIsDuplicate(result.alreadyParticipated || false)

      // ===================================
      // 3. TRACKEAR EN GOOGLE ANALYTICS
      // ===================================
      trackEvent('flash_days_phone_submitted', 'conversion', cleanPhone)
      trackEvent(
        result.alreadyParticipated ? 'flash_days_duplicate_attempt' : 'flash_days_new_participant',
        'engagement',
        cleanPhone
      )

      // ===================================
      // 4. MENSAJE WHATSAPP MEJORADO CON EMOJIS
      // ===================================
      const message = `🎨 *¡Hola desde Pinteya!*

🎁 Quiero participar del sorteo *Pintura Flash Days*

✨ *Color & Ahorro*
🎯 ${PINTURA_FLASH_DAYS_CONFIG.prizeCount} Gift Cards de $${PINTURA_FLASH_DAYS_CONFIG.prizeAmount.toLocaleString('es-AR')} cada una

📅 Válido: ${PINTURA_FLASH_DAYS_CONFIG.startDate} al ${PINTURA_FLASH_DAYS_CONFIG.endDate}

📱 Mi WhatsApp: ${cleanPhone}

🏆 ¡Quiero ser una de las ${PINTURA_FLASH_DAYS_CONFIG.prizeCount} ganadoras!

Saludos! 🎨✨`

      const whatsappUrl = `https://wa.me/${PINTURA_FLASH_DAYS_CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`

      trackEvent('flash_days_whatsapp_opened', 'conversion', 'redirect')

      // ===================================
      // 5. ABRIR WHATSAPP
      // ===================================
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer')

      // Marcar que se abrió WhatsApp
      if (participantId) {
        fetch('/api/flash-days/participate', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ participantId }),
        }).catch(err => console.error('Error marking whatsapp opened:', err))
      }

      // ===================================
      // 6. MOSTRAR CONFIRMACIÓN
      // ===================================
      setShowConfirmation(true)

      // Cerrar después de 4 segundos
      setTimeout(() => {
        setIsOpen(false)
        setShowConfirmation(false)
      }, 4000)
    } catch (error) {
      console.error('[FLASH_DAYS] Error:', error)
      alert('Hubo un error al procesar tu participación. Intentá de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ===================================
  // COMPONENTES AUXILIARES
  // ===================================
  
  // Componente de Gift Card con efecto apilado
  const GiftCardStack = () => (
    <div className='relative w-full flex items-center justify-center py-4 md:py-12'>
      {/* Gift Cards Apiladas */}
      <div className='relative w-48 h-28 md:w-80 md:h-48'>
        {/* Card 3 (más atrás) */}
        <div className='absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-xl transform rotate-[-8deg] opacity-60'></div>
        
        {/* Card 2 (medio) */}
        <div className='absolute top-2 left-2 w-full h-full bg-gradient-to-br from-orange-400 to-orange-500 rounded-2xl shadow-xl transform rotate-[-4deg] opacity-80'></div>
        
        {/* Card 1 (frontal) - Principal */}
        <div className='absolute top-4 left-4 w-full h-full bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-2xl shadow-2xl transform rotate-0 flex flex-col items-center justify-center p-6 border-2 border-white/30'>
          <Gift className='w-12 h-12 md:w-16 md:h-16 text-white mb-2' />
          <div className='text-white text-center'>
            <p className='text-sm md:text-base font-bold uppercase tracking-wider'>GIFT CARD</p>
            <p className='text-3xl md:text-4xl font-black mt-1'>
              ${PINTURA_FLASH_DAYS_CONFIG.prizeAmount.toLocaleString('es-AR')}
            </p>
          </div>
          <Sparkles className='absolute top-2 right-2 w-6 h-6 text-yellow-300 animate-pulse' />
          <Sparkles className='absolute bottom-2 left-2 w-4 h-4 text-yellow-300 animate-pulse' style={{animationDelay: '0.5s'}} />
        </div>
      </div>
    </div>
  )

  // Badge de Pintura Flash Days
  const FlashDaysBadge = () => (
    <div className='inline-flex items-center gap-2 bg-gradient-to-r from-orange-600 to-red-600 px-4 py-2 rounded-full shadow-lg'>
      <div className='w-2 h-2 bg-white rounded-full animate-pulse'></div>
      <span className='text-white font-bold text-xs md:text-sm uppercase tracking-wider'>
        PINTURA FLASH DAYS
      </span>
    </div>
  )

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fadeIn'>
      {/* DISEÑO MOBILE */}
      {isMobile ? (
        <div className='bg-white rounded-3xl shadow-2xl max-w-[420px] w-full relative animate-slideUp overflow-hidden max-h-[75vh] overflow-y-auto'>
          {/* Close button */}
          <button
            onClick={handleClose}
            data-testid='flash-days-close-button'
            className='absolute top-4 right-4 text-white hover:text-white/80 transition-colors z-20 bg-black/30 rounded-full p-2 hover:bg-black/40'
            aria-label='Cerrar'
          >
            <X className='w-5 h-5' />
          </button>

          {/* Header con gradiente Pintura Flash Days */}
          <div className='relative bg-gradient-to-br from-purple-600 via-blue-600 to-purple-700 px-4 pt-6 pb-4'>
            {/* Patrón de fondo */}
            <div className='absolute inset-0 opacity-10'>
              <div
                className='absolute inset-0'
                style={{
                  backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                }}
              ></div>
            </div>

            <div className='relative z-10'>
              {/* Badge Pintura Flash Days */}
              <div className='mb-3'>
                <FlashDaysBadge />
              </div>

              {/* Título */}
              <h2 className='text-white font-black text-xl sm:text-2xl mb-2 leading-tight'>
                ¡Participá por 1 de las{' '}
                <span className='text-yellow-300'>{PINTURA_FLASH_DAYS_CONFIG.prizeCount} GIFT CARDS</span>
                <br />
                de ${PINTURA_FLASH_DAYS_CONFIG.prizeAmount.toLocaleString('es-AR')}!
              </h2>

              {/* Subtítulo */}
              <p className='text-white/90 text-sm'>
                Color & Ahorro - Dejanos tu WhatsApp
              </p>
            </div>
          </div>

          {/* Gift Cards */}
          <GiftCardStack />

          {/* Features */}
          <div className='px-4 pb-3'>
            <div className='flex flex-col gap-2'>
              {[
                `${PINTURA_FLASH_DAYS_CONFIG.prizeCount} ganadoras de $${PINTURA_FLASH_DAYS_CONFIG.prizeAmount.toLocaleString('es-AR')} cada una`,
                'Sin obligación de compra',
                `Del ${PINTURA_FLASH_DAYS_CONFIG.startDate} al ${PINTURA_FLASH_DAYS_CONFIG.endDate}`,
              ].map((feature, idx) => (
                <div key={idx} className='flex items-start gap-2 text-gray-700'>
                  <CheckCircle className='w-5 h-5 text-green-500 flex-shrink-0 mt-0.5' />
                  <span className='text-sm font-medium'>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className='px-4 pb-6'>
            <div className='flex flex-col gap-2'>
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
                  className='w-full bg-gray-50 border-2 border-gray-200 focus:border-purple-500 outline-none rounded-xl placeholder:text-gray-400 py-3 pl-12 pr-4 text-gray-900 font-medium transition-all'
                />
              </div>

              <button
                type='submit'
                disabled={isSubmitting}
                className='group w-full inline-flex items-center justify-center gap-2 py-3 px-6 text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed'
              >
                <MessageCircle className='w-5 h-5' />
                <span>{isSubmitting ? 'Registrando...' : 'Participar por WhatsApp'}</span>
              </button>

              <p className='text-gray-500 text-xs text-center leading-relaxed'>
                Al enviar tu número participás del sorteo y aceptás recibir comunicaciones por WhatsApp.
              </p>
            </div>
          </form>

          {/* Pantalla de Confirmación - Mobile */}
          {showConfirmation && (
            <div className='absolute inset-0 bg-white z-30 flex flex-col items-center justify-center p-8 rounded-3xl animate-fadeIn'>
              <div className='w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mb-6'>
                <CheckCircle className='w-14 h-14 text-green-600' />
              </div>

              <h3 className='text-2xl font-black text-gray-900 mb-3 text-center'>
                {isDuplicate ? '¡Ya estás participando!' : '¡Participación Registrada!'}
              </h3>

              <p className='text-gray-600 text-center text-base mb-6 max-w-md'>
                {isDuplicate
                  ? 'Tu número ya está en el sorteo. Te contactaremos por WhatsApp cuando tengamos los ganadores.'
                  : 'Tu participación fue registrada exitosamente. Abrimos WhatsApp para confirmar tu interés.'}
              </p>

              <div className='flex items-center gap-2 text-purple-600'>
                <MessageCircle className='w-5 h-5' />
                <span className='font-medium'>Revisá tu WhatsApp</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* DISEÑO DESKTOP */
        <div className='bg-white rounded-3xl shadow-2xl max-w-[900px] w-full relative animate-slideUp overflow-hidden'>
          {/* Close button */}
          <button
            onClick={handleClose}
            data-testid='flash-days-close-button'
            className='absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors z-20 bg-white/80 backdrop-blur-sm rounded-full p-2 hover:bg-white shadow-lg'
            aria-label='Cerrar'
          >
            <X className='w-6 h-6' />
          </button>

          <div className='flex flex-row'>
            {/* Columna Izquierda - Visual */}
            <div className='w-1/2 bg-gradient-to-br from-purple-600 via-blue-600 to-purple-700 p-10 flex flex-col justify-center items-center relative overflow-hidden'>
              {/* Patrón de fondo */}
              <div className='absolute inset-0 opacity-10'>
                <div
                  className='absolute inset-0'
                  style={{
                    backgroundImage: 'radial-gradient(circle, white 2px, transparent 2px)',
                    backgroundSize: '30px 30px',
                  }}
                ></div>
              </div>

              <div className='relative z-10 text-center'>
                {/* Badge Pintura Flash Days */}
                <div className='mb-6 flex justify-center'>
                  <FlashDaysBadge />
                </div>

                {/* Gift Cards con efecto fan */}
                <GiftCardStack />

                {/* Texto de cantidad de premios */}
                <div className='mt-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4'>
                  <p className='text-white text-lg font-bold'>
                    🎨 {PINTURA_FLASH_DAYS_CONFIG.prizeCount} Gift Cards en Juego
                  </p>
                  <p className='text-white/80 text-sm mt-1'>
                    ${PINTURA_FLASH_DAYS_CONFIG.prizeAmount.toLocaleString('es-AR')} cada una
                  </p>
                </div>
              </div>
            </div>

            {/* Columna Derecha - Formulario */}
            <div className='w-1/2 p-10 flex flex-col justify-center'>
              {/* Título */}
              <h2 className='text-gray-900 font-black text-3xl mb-3 leading-tight'>
                ¡Color & Ahorro! Participá por 1 de las{' '}
                <span className='bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent'>
                  {PINTURA_FLASH_DAYS_CONFIG.prizeCount} Gift Cards!
                </span>
              </h2>

              {/* Subtítulo */}
              <p className='text-gray-600 text-base mb-6'>
                Dejanos tu WhatsApp y participá del Pintura Flash Days
              </p>

              {/* Features */}
              <div className='flex flex-col gap-3 mb-8'>
                {[
                  `${PINTURA_FLASH_DAYS_CONFIG.prizeCount} ganadoras de $${PINTURA_FLASH_DAYS_CONFIG.prizeAmount.toLocaleString('es-AR')} cada una`,
                  'Sin obligación de compra',
                  `Del ${PINTURA_FLASH_DAYS_CONFIG.startDate} al ${PINTURA_FLASH_DAYS_CONFIG.endDate}`,
                ].map((feature, idx) => (
                  <div key={idx} className='flex items-start gap-2 text-gray-700'>
                    <CheckCircle className='w-5 h-5 text-green-500 flex-shrink-0 mt-0.5' />
                    <span className='text-sm font-medium'>{feature}</span>
                  </div>
                ))}
              </div>

              {/* Formulario */}
              <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
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
                    className='w-full bg-gray-50 border-2 border-gray-200 focus:border-purple-500 outline-none rounded-xl placeholder:text-gray-400 py-4 pl-12 pr-4 text-gray-900 font-medium transition-all'
                  />
                </div>

                <button
                  type='submit'
                  disabled={isSubmitting}
                  className='group w-full inline-flex items-center justify-center gap-2 py-4 px-6 text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  <MessageCircle className='w-5 h-5' />
                  <span>{isSubmitting ? 'Registrando...' : 'Participar por WhatsApp'}</span>
                </button>

                <p className='text-gray-500 text-xs text-center leading-relaxed'>
                  Al participar del Pintura Flash Days aceptás nuestros{' '}
                  <a href={PINTURA_FLASH_DAYS_CONFIG.termsUrl} className='text-purple-600 hover:underline'>
                    términos y condiciones
                  </a>
                  .
                </p>
              </form>
            </div>
          </div>

          {/* Pantalla de Confirmación - Desktop */}
          {showConfirmation && (
            <div className='absolute inset-0 bg-white z-30 flex flex-col items-center justify-center p-12 rounded-3xl animate-fadeIn'>
              <div className='w-28 h-28 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mb-8'>
                <CheckCircle className='w-20 h-20 text-green-600' />
              </div>

              <h3 className='text-4xl font-black text-gray-900 mb-4 text-center'>
                {isDuplicate ? '¡Ya estás participando!' : '¡Participación Registrada!'}
              </h3>

              <p className='text-gray-600 text-center text-lg mb-8 max-w-lg'>
                {isDuplicate
                  ? 'Tu número ya está en el sorteo. Te contactaremos por WhatsApp cuando tengamos los ganadores. ¡Mucha suerte! 🍀'
                  : 'Tu participación fue registrada exitosamente. Abrimos WhatsApp para confirmar tu interés. ¡Mucha suerte! 🍀'}
              </p>

              <div className='flex items-center gap-2 text-purple-600 text-lg'>
                <MessageCircle className='w-6 h-6' />
                <span className='font-bold'>Revisá tu WhatsApp</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default WhatsAppPopup

