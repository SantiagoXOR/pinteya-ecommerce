'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X, AlertCircle, Gift, Percent } from 'lucide-react'
import { cn } from '@/lib/utils'
import { trackCustomEvent } from '@/lib/meta-pixel'
import { trackEvent } from '@/lib/google-analytics'

interface ExitIntentModalProps {
  onStay: () => void
  onLeave: () => void
  showDiscount?: boolean
  discountCode?: string
}

export const ExitIntentModal: React.FC<ExitIntentModalProps> = ({
  onStay,
  onLeave,
  showDiscount = true,
  discountCode = 'BIENVENIDO15',
}) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      // Detectar cuando el mouse sale por la parte superior de la ventana
      if (e.clientY <= 0) {
        setIsVisible(true)
        trackCustomEvent('ExitIntentDetected', {
          page: window.location.pathname,
        })
        trackEvent('exit_intent_detected', 'conversion', window.location.pathname)
      }
    }

    document.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  if (!isVisible) return null

  const handleStay = () => {
    setIsVisible(false)
    onStay()
    trackCustomEvent('ExitIntentStayed', {
      discount_applied: showDiscount,
    })
    trackEvent('exit_intent_stayed', 'conversion', 'modal')
  }

  const handleLeave = () => {
    setIsVisible(false)
    onLeave()
    trackCustomEvent('ExitIntentLeft', {})
    trackEvent('exit_intent_left', 'conversion', 'modal')
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
      <Card className='max-w-md w-full shadow-2xl border-0 animate-in fade-in zoom-in-95'>
        <CardContent className='p-6'>
          <div className='flex justify-end mb-4'>
            <Button
              variant='ghost'
              size='icon'
              onClick={handleLeave}
              className='h-8 w-8'
            >
              <X className='w-4 h-4' />
            </Button>
          </div>

          <div className='text-center mb-6'>
            <div className='w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4'>
              <AlertCircle className='w-8 h-8 text-orange-600' />
            </div>
            <h2 className='text-2xl font-bold text-gray-900 mb-2'>
              ¡Esperá! No te vayas todavía
            </h2>
            <p className='text-gray-600 mb-4'>
              Tenemos una oferta especial para vos
            </p>
          </div>

          {showDiscount && (
            <div className='bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-4 mb-6'>
              <div className='flex items-center gap-3'>
                <Percent className='w-8 h-8 text-orange-600' />
                <div className='flex-1'>
                  <p className='font-semibold text-gray-900 mb-1'>
                    Usá el código: <span className='text-orange-600'>{discountCode}</span>
                  </p>
                  <p className='text-sm text-gray-600'>
                    Obtendrás un 15% de descuento en tu primera compra
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className='flex flex-col gap-3'>
            <Button
              onClick={handleStay}
              size='lg'
              className='w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold'
            >
              Continuar comprando
            </Button>
            <Button
              onClick={handleLeave}
              variant='outline'
              size='lg'
              className='w-full'
            >
              Salir de todas formas
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface AbandonedCartRecoveryProps {
  onRecover: () => void
  onDismiss: () => void
  cartItemsCount?: number
  cartTotal?: number
}

export const AbandonedCartRecovery: React.FC<AbandonedCartRecoveryProps> = ({
  onRecover,
  onDismiss,
  cartItemsCount = 0,
  cartTotal = 0,
}) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Mostrar después de 30 segundos si el usuario no ha completado el checkout
    const timer = setTimeout(() => {
      setIsVisible(true)
      trackCustomEvent('AbandonedCartReminderShown', {
        items_count: cartItemsCount,
        cart_total: cartTotal,
      })
      trackEvent('abandoned_cart_reminder_shown', 'conversion', 'reminder', cartItemsCount)
    }, 30000)

    return () => clearTimeout(timer)
  }, [cartItemsCount, cartTotal])

  if (!isVisible || cartItemsCount === 0) return null

  const handleRecover = () => {
    setIsVisible(false)
    onRecover()
    trackCustomEvent('AbandonedCartRecovered', {
      items_count: cartItemsCount,
    })
    trackEvent('abandoned_cart_recovered', 'conversion', 'reminder')
  }

  const handleDismiss = () => {
    setIsVisible(false)
    onDismiss()
    trackCustomEvent('AbandonedCartReminderDismissed', {})
    trackEvent('abandoned_cart_reminder_dismissed', 'conversion', 'reminder')
  }

  return (
    <div className='fixed bottom-4 right-4 z-40 max-w-sm animate-in slide-in-from-bottom-5'>
      <Card className='shadow-2xl border-0'>
        <CardContent className='p-4'>
          <div className='flex items-start gap-3'>
            <div className='w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0'>
              <Gift className='w-5 h-5 text-green-600' />
            </div>
            <div className='flex-1 min-w-0'>
              <h3 className='font-semibold text-gray-900 mb-1'>
                ¿Olvidaste algo?
              </h3>
              <p className='text-sm text-gray-600 mb-3'>
                Tenés {cartItemsCount} {cartItemsCount === 1 ? 'producto' : 'productos'} en tu carrito por ${cartTotal.toLocaleString('es-AR')}
              </p>
              <div className='flex gap-2'>
                <Button
                  onClick={handleRecover}
                  size='sm'
                  className='flex-1 bg-green-600 hover:bg-green-700 text-white'
                >
                  Continuar compra
                </Button>
                <Button
                  onClick={handleDismiss}
                  variant='ghost'
                  size='icon'
                  className='h-8 w-8'
                >
                  <X className='w-4 h-4' />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface TrustBadgesProps {
  variant?: 'inline' | 'grid' | 'compact'
}

export const TrustBadges: React.FC<TrustBadgesProps> = ({ variant = 'grid' }) => {
  const badges = [
    {
      icon: '🔒',
      title: 'Compra 100% segura',
      description: 'Protegida por MercadoPago',
    },
    {
      icon: '🚚',
      title: 'Envío gratis',
      description: 'En compras +$50.000',
    },
    {
      icon: '↩️',
      title: 'Devolución fácil',
      description: 'Hasta 30 días',
    },
    {
      icon: '⭐',
      title: 'Calificación 4.8/5',
      description: 'Más de 1000 reseñas',
    },
  ]

  if (variant === 'compact') {
    return (
      <div className='flex flex-wrap gap-2'>
        {badges.slice(0, 2).map((badge, index) => (
          <div
            key={index}
            className='flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg text-sm'
          >
            <span>{badge.icon}</span>
            <span className='font-medium text-gray-700'>{badge.title}</span>
          </div>
        ))}
      </div>
    )
  }

  if (variant === 'inline') {
    return (
      <div className='flex flex-wrap items-center gap-4 text-sm text-gray-600'>
        {badges.map((badge, index) => (
          <div key={index} className='flex items-center gap-2'>
            <span>{badge.icon}</span>
            <div>
              <span className='font-medium text-gray-900'>{badge.title}</span>
              <span className='text-gray-500 ml-1'>• {badge.description}</span>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
      {badges.map((badge, index) => (
        <div
          key={index}
          className='text-center p-4 bg-gray-50 rounded-lg'
        >
          <div className='text-3xl mb-2'>{badge.icon}</div>
          <h4 className='font-semibold text-gray-900 text-sm mb-1'>
            {badge.title}
          </h4>
          <p className='text-xs text-gray-600'>{badge.description}</p>
        </div>
      ))}
    </div>
  )
}

interface SocialProofBannerProps {
  recentPurchases?: number
  viewers?: number
}

export const SocialProofBanner: React.FC<SocialProofBannerProps> = ({
  recentPurchases = Math.floor(Math.random() * 50) + 20,
  viewers = Math.floor(Math.random() * 10) + 5,
}) => {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  return (
    <div className='bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2 text-sm text-blue-900'>
          <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse' />
          <span>
            <strong>{recentPurchases}</strong> personas compraron esto en las últimas 24 horas
          </span>
        </div>
        <Button
          variant='ghost'
          size='icon'
          onClick={() => setIsVisible(false)}
          className='h-6 w-6 text-blue-600 hover:text-blue-800'
        >
          <X className='w-4 h-4' />
        </Button>
      </div>
    </div>
  )
}

