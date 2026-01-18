'use client'

import React from 'react'
import { Shield, Truck, CheckCircle, Star, Users, Clock } from '@/lib/optimized-imports'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface TrustSignalsProps {
  compact?: boolean
}

export const TrustSignals: React.FC<TrustSignalsProps> = ({ compact = false }) => {
  if (compact) {
    return (
      <div className='flex flex-wrap gap-2'>
        <Badge variant='secondary' className='bg-green-100 text-green-700 border-green-200'>
          <Shield className='w-3 h-3 mr-1' />
          Compra segura
        </Badge>
        <Badge variant='secondary' className='bg-blue-100 text-blue-700 border-blue-200'>
          <Truck className='w-3 h-3 mr-1' />
          Envío gratis
        </Badge>
      </div>
    )
  }

  return (
    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
      <div className='flex items-center gap-3 p-3 bg-green-50 rounded-lg'>
        <Shield className='w-6 h-6 text-green-600' />
        <div>
          <h4 className='font-semibold text-gray-900'>Compra 100% segura</h4>
          <p className='text-sm text-gray-600'>Protegida por MercadoPago</p>
        </div>
      </div>
      <div className='flex items-center gap-3 p-3 bg-blue-50 rounded-lg'>
        <Truck className='w-6 h-6 text-blue-600' />
        <div>
          <h4 className='font-semibold text-gray-900'>Envío gratis</h4>
          <p className='text-sm text-gray-600'>En compras +$50.000</p>
        </div>
      </div>
      <div className='flex items-center gap-3 p-3 bg-orange-50 rounded-lg'>
        <Clock className='w-6 h-6 text-orange-600' />
        <div>
          <h4 className='font-semibold text-gray-900'>Entrega rápida</h4>
          <p className='text-sm text-gray-600'>24-48 horas hábiles</p>
        </div>
      </div>
    </div>
  )
}

interface SocialProofProps {
  viewers?: number
  recentPurchases?: number
}

export const SocialProof: React.FC<SocialProofProps> = ({
  viewers = Math.floor(Math.random() * 10) + 5,
  recentPurchases = Math.floor(Math.random() * 50) + 20,
}) => {
  return (
    <div className='flex flex-wrap gap-4 text-sm text-gray-600'>
      {viewers > 0 && (
        <div className='flex items-center gap-2'>
          <Users className='w-4 h-4 text-blue-600' />
          <span>{viewers} personas viendo este producto</span>
        </div>
      )}
      {recentPurchases > 0 && (
        <div className='flex items-center gap-2'>
          <CheckCircle className='w-4 h-4 text-green-600' />
          <span>{recentPurchases} compras recientes</span>
        </div>
      )}
    </div>
  )
}

interface UrgencyTimerProps {
  expiresAt?: Date
  message?: string
}

export const UrgencyTimer: React.FC<UrgencyTimerProps> = ({
  expiresAt,
  message = 'Oferta termina en',
}) => {
  const [timeLeft, setTimeLeft] = React.useState<string>('')

  React.useEffect(() => {
    if (!expiresAt) return

    const updateTimer = () => {
      const now = new Date()
      const diff = expiresAt.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeLeft('00:00:00')
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeLeft(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [expiresAt])

  if (!expiresAt || !timeLeft) return null

  return (
    <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
      <div className='flex items-center gap-2'>
        <Clock className='w-5 h-5 text-red-600' />
        <div>
          <p className='text-sm font-medium text-red-900'>{message}</p>
          <p className='text-2xl font-bold text-red-600 font-mono'>{timeLeft}</p>
        </div>
      </div>
    </div>
  )
}

interface StockIndicatorProps {
  stock: number
  lowStockThreshold?: number
}

export const StockIndicator: React.FC<StockIndicatorProps> = ({
  stock,
  lowStockThreshold = 5,
}) => {
  if (stock === 0) {
    return (
      <Badge variant='destructive' className='w-fit'>
        Sin stock
      </Badge>
    )
  }

  if (stock <= lowStockThreshold) {
    return (
      <Badge variant='secondary' className='w-fit bg-orange-100 text-orange-700 border-orange-200'>
        ¡Solo quedan {stock} disponibles!
      </Badge>
    )
  }

  return null
}

interface ProgressIndicatorProps {
  currentStep: number
  totalSteps: number
  labels?: string[]
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentStep,
  totalSteps,
  labels,
}) => {
  return (
    <div className='w-full'>
      <div className='flex items-center justify-between mb-2'>
        {labels && labels.length === totalSteps ? (
          <>
            {/* Ocultar labels en móviles <375px para evitar compresión de texto */}
            {labels.map((label, index) => (
              <span
                key={index}
                className={cn(
                  'text-xs font-medium hidden xsm:inline',
                  index + 1 <= currentStep ? 'text-green-600' : 'text-gray-400'
                )}
              >
                {label}
              </span>
            ))}
            {/* Mostrar solo números en móviles pequeños */}
            <span className='text-xs font-medium text-gray-700 xsm:hidden'>
              Paso {currentStep} de {totalSteps}
            </span>
          </>
        ) : (
          <span className='text-sm font-medium text-gray-700'>
            Paso {currentStep} de {totalSteps}
          </span>
        )}
      </div>
      <div className='w-full bg-gray-200 rounded-full h-2'>
        <div
          className='bg-green-600 h-2 rounded-full transition-all duration-300'
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>
    </div>
  )
}

