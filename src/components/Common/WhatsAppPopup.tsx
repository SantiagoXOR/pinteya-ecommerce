/* 
 * ============================================
 * POPUP DE SORTEO FLASH DAYS - DESHABILITADO
 * ============================================
 * Este popup ha sido comentado temporalmente.
 * Campaña: "Pintura Flash Days - Color & Ahorro"
 * Fecha: Noviembre 2025
 * ============================================
 */

'use client'

import React from 'react'

// ===================================
// COMPONENTE DESHABILITADO
// ===================================

const WhatsAppPopup = () => {
  // Popup deshabilitado - retornar null directamente
  return null
}

export default WhatsAppPopup

/* 
// ===================================
// CÓDIGO ORIGINAL COMENTADO
// ===================================

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { X, Phone, MessageCircle, CheckCircle, Gift, Sparkles } from '@/lib/optimized-imports'
import { trackEvent } from '@/lib/google-analytics'

// ===================================
// CONFIGURACIÓN PINTURA FLASH DAYS
// ===================================
const PINTURA_FLASH_DAYS_CONFIG = {
  prizeAmount: 75000, // Valor del medio rango ($50k - $100k)
  prizeCount: 3,
  startDate: '15 de diciembre',
  endDate: '31 de diciembre',
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
  const [scrollProgress, setScrollProgress] = useState(0)

  // Detección de viewport (mobile vs desktop)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768) // md breakpoint
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Tracking de scroll
  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      const scrollTop = window.scrollY
      const scrollPercentage = (scrollTop / (documentHeight - windowHeight)) * 100
      setScrollProgress(scrollPercentage)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Timer mejorado con scroll tracking y persistencia de 3 días
  useEffect(() => {
    // Verificar si ya se mostró en los últimos 3 días
    const lastShown = localStorage.getItem('pinturaFlashDaysLastShown')
    if (lastShown) {
      const daysSinceShown = (Date.now() - parseInt(lastShown)) / (1000 * 60 * 60 * 24)
      if (daysSinceShown < 3) {
        setHasShown(true)
        return
      }
    }

    // Verificar si ExitIntent se mostró recientemente (últimas 24 horas)
    const exitIntentShown = sessionStorage.getItem('exitIntentShown')
    if (exitIntentShown) {
      const exitShownTime = parseInt(exitIntentShown) || 0
      const hoursSinceExit = (Date.now() - exitShownTime) / (1000 * 60 * 60)
      if (hoursSinceExit < 24) {
        setHasShown(true)
        return
      }
    }

    // Timer adaptativo según dispositivo
    const delay = isMobile ? 45000 : 30000 // 45s mobile, 30s desktop
    const requiredScroll = isMobile ? 30 : 50 // 30% mobile, 50% desktop

    const timer = setTimeout(() => {
      if (!hasShown && scrollProgress >= requiredScroll) {
        setIsOpen(true)
        setHasShown(true)
        localStorage.setItem('pinturaFlashDaysLastShown', Date.now().toString())
        trackEvent('flash_days_popup_shown', 'engagement', 'timed_popup')
      }
    }, delay)

    return () => clearTimeout(timer)
  }, [hasShown, isMobile, scrollProgress])

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
  
  // Componente de Banner con imagen personalizada de Pinteya - OVERLAY
  const PinteyaBanner = ({ isMobileVersion = false }: { isMobileVersion?: boolean }) => (
    <div className={`absolute ${isMobileVersion ? 'bottom-0 right-0 w-48 h-48 translate-y-1/4' : 'bottom-0 right-0 w-64 h-64 translate-y-1/4'} z-20 pointer-events-none`}>
      <div className='relative w-full h-full'>
        <Image
          src='/images/promo/popuppinteya.png'
          alt='Pintura Flash Days - Pinteya'
          fill
          className='object-contain drop-shadow-2xl'
          priority
          sizes='(max-width: 768px) 192px, 256px'
        />
      </div>
    </div>
  )

  // Badge de Pintura Flash Days - Paleta Pinteya
  const FlashDaysBadge = () => (
    <div className='inline-flex items-center gap-2 bg-gradient-to-r from-[#f27a1d] to-[#eb6313] px-4 py-2 rounded-full shadow-lg'>
      <div className='w-2 h-2 bg-white rounded-full animate-pulse'></div>
      <span className='text-white font-bold text-xs md:text-sm uppercase tracking-wider'>
        PINTURA FLASH DAYS
      </span>
    </div>
  )

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fadeIn'>
      {/* DISEÑO MOBILE *\/}
      {isMobile ? (
        <div className='bg-white rounded-3xl shadow-2xl max-w-[420px] w-full relative animate-slideUp overflow-hidden max-h-[75vh] overflow-y-auto'>
          {/* Close button *\/}
          <button
            onClick={handleClose}
            data-testid='flash-days-close-button'
            className='absolute top-4 right-4 text-white hover:text-white/80 transition-colors z-20 bg-black/30 rounded-full p-2 hover:bg-black/40'
            aria-label='Cerrar'
          >
            <X className='w-5 h-5' />
          </button>

          {/* Header con gradiente Pinteya *\/}
          <div className='relative bg-gradient-to-br from-[#eb6313] via-[#f27a1d] to-[#bd4811] px-4 pt-6 pb-4 overflow-visible'>
            {/* Patrón de fondo *\/}
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
              {/* Badge Pintura Flash Days *\/}
              <div className='mb-3'>
                <FlashDaysBadge />
              </div>

              {/* Título *\/}
              <h2 className='text-white font-black text-xl sm:text-2xl mb-2 leading-tight'>
                ¡Sorteo Flash Days!
                <br />
                <span className='text-[#FFD700]'>{PINTURA_FLASH_DAYS_CONFIG.prizeCount} GIFT CARDS</span> de ${PINTURA_FLASH_DAYS_CONFIG.prizeAmount.toLocaleString('es-AR')}
              </h2>

              {/* Subtítulo *\/}
              <p className='text-white/90 text-sm'>
                Dejanos tu WhatsApp y participá
              </p>
            </div>

            {/* Banner Pinteya - OVERLAY *\/}
            <PinteyaBanner isMobileVersion={true} />
          </div>

          {/* Features *\/}
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

          {/* Formulario *\/}
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
                  className='w-full bg-gray-50 border-2 border-gray-200 focus:border-[#eb6313] outline-none rounded-xl placeholder:text-gray-400 py-3 pl-12 pr-4 text-gray-900 font-medium transition-all'
                />
              </div>

              <button
                type='submit'
                disabled={isSubmitting}
                className='group w-full inline-flex items-center justify-center gap-2 py-3 px-6 text-white bg-gradient-to-r from-[#00ca53] to-[#009e44] hover:from-[#009e44] hover:to-[#007638] font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed'
              >
                <MessageCircle className='w-5 h-5' />
                <span>{isSubmitting ? 'Registrando...' : 'Participar por WhatsApp'}</span>
              </button>

              <p className='text-gray-500 text-xs text-center leading-relaxed'>
                Al enviar tu número participás del sorteo y aceptás recibir comunicaciones por WhatsApp.
              </p>
            </div>
          </form>

          {/* Pantalla de Confirmación - Mobile *\/}
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

              <div className='flex items-center gap-2 text-[#00ca53]'>
                <MessageCircle className='w-5 h-5' />
                <span className='font-medium'>Revisá tu WhatsApp</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* DISEÑO DESKTOP *\/}
        <div className='bg-white rounded-3xl shadow-2xl max-w-[900px] w-full relative animate-slideUp overflow-hidden'>
          {/* Close button *\/}
          <button
            onClick={handleClose}
            data-testid='flash-days-close-button'
            className='absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors z-20 bg-white/80 backdrop-blur-sm rounded-full p-2 hover:bg-white shadow-lg'
            aria-label='Cerrar'
          >
            <X className='w-6 h-6' />
          </button>

          <div className='flex flex-row'>
            {/* Columna Izquierda - Visual *\/}
            <div className='w-1/2 bg-gradient-to-br from-[#eb6313] via-[#f27a1d] to-[#bd4811] p-10 flex flex-col justify-center items-center relative overflow-visible'>
              {/* Patrón de fondo *\/}
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
                {/* Badge Pintura Flash Days *\/}
                <div className='mb-6 flex justify-center'>
                  <FlashDaysBadge />
                </div>

                {/* Texto de cantidad de premios *\/}
                <div className='mt-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4'>
                  <p className='text-white text-lg font-bold'>
                    🎨 {PINTURA_FLASH_DAYS_CONFIG.prizeCount} Gift Cards en Juego
                  </p>
                  <p className='text-white/80 text-sm mt-1'>
                    ${PINTURA_FLASH_DAYS_CONFIG.prizeAmount.toLocaleString('es-AR')} cada una
                  </p>
                </div>
              </div>

              {/* Banner Pinteya - OVERLAY *\/}
              <PinteyaBanner isMobileVersion={false} />
            </div>

            {/* Columna Derecha - Formulario *\/}
            <div className='w-1/2 p-10 flex flex-col justify-center'>
              {/* Título *\/}
              <h2 className='text-gray-900 font-black text-3xl mb-3 leading-tight'>
                ¡Sorteo Flash Days!
                <br />
                Participá por 1 de las{' '}
                <span className='bg-gradient-to-r from-[#eb6313] to-[#f27a1d] bg-clip-text text-transparent'>
                  {PINTURA_FLASH_DAYS_CONFIG.prizeCount} Gift Cards!
                </span>
              </h2>

              {/* Subtítulo *\/}
              <p className='text-gray-600 text-base mb-6'>
                Dejanos tu WhatsApp y participá del sorteo
              </p>

              {/* Features *\/}
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

              {/* Formulario *\/}
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
                    className='w-full bg-gray-50 border-2 border-gray-200 focus:border-[#eb6313] outline-none rounded-xl placeholder:text-gray-400 py-4 pl-12 pr-4 text-gray-900 font-medium transition-all'
                  />
                </div>

                <button
                  type='submit'
                  disabled={isSubmitting}
                  className='group w-full inline-flex items-center justify-center gap-2 py-4 px-6 text-white bg-gradient-to-r from-[#00ca53] to-[#009e44] hover:from-[#009e44] hover:to-[#007638] font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  <MessageCircle className='w-5 h-5' />
                  <span>{isSubmitting ? 'Registrando...' : 'Participar por WhatsApp'}</span>
                </button>

                <p className='text-gray-500 text-xs text-center leading-relaxed'>
                  Al participar del Pintura Flash Days aceptás nuestros{' '}
                  <a href={PINTURA_FLASH_DAYS_CONFIG.termsUrl} className='text-[#eb6313] hover:underline'>
                    términos y condiciones
                  </a>
                  .
                </p>
              </form>
            </div>
          </div>

          {/* Pantalla de Confirmación - Desktop *\/}
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

              <div className='flex items-center gap-2 text-[#00ca53] text-lg'>
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

*/