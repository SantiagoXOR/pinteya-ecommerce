'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { useDesignSystemConfig } from '@/lib/design-system-config'
import { ShippingIcon } from '@/components/ui/ShippingIcon'

interface ShippingProgressBarProps {
  currentAmount: number
  targetAmount?: number
  className?: string
  showIcon?: boolean
  variant?: 'default' | 'compact' | 'detailed'
}

const ShippingProgressBar: React.FC<ShippingProgressBarProps> = ({
  currentAmount,
  targetAmount,
  className,
  showIcon = true,
  variant = 'default',
}) => {
  const config = useDesignSystemConfig()
  const resolvedTarget = targetAmount ?? config.ecommerce.shippingInfo.freeShippingThreshold
  const progress = Math.min((currentAmount / resolvedTarget) * 100, 100)
  const remainingAmount = Math.max(resolvedTarget - currentAmount, 0)
  const hasReachedTarget = currentAmount >= resolvedTarget

  const isCompact = variant === 'compact'
  const isDetailed = variant === 'detailed'

  return (
    <div
      className={cn(
        className
      )}
    >
      {/* Layout de dos columnas: icono izquierda, contenido derecha */}
      <div className='flex items-center gap-3'>
        {/* Columna izquierda: Icono SVG */}
        {showIcon && (
          <div className='flex-shrink-0'>
            <ShippingIcon
              alt='Envío Gratis'
              className='w-auto h-auto'
              style={{ 
                width: isCompact ? 110 : 140, 
                height: isCompact ? 110 : 140,
                maxWidth: isCompact ? 110 : 140, 
                maxHeight: isCompact ? 110 : 140,
                display: 'block'
              }}
            />
          </div>
        )}

        {/* Columna derecha: Texto, barra y labels */}
        <div className='flex-1'>
          {/* Texto principal */}
          <div className={cn(isCompact ? 'mb-1.5' : 'mb-3')}>
            {hasReachedTarget ? (
              <p className={cn('text-tenant-success font-bold', isCompact ? 'text-sm' : 'text-base')}>
                ¡Felicitaciones! Tienes envío gratis
              </p>
            ) : (
              <p className={cn('text-gray-700 font-semibold', isCompact ? 'text-sm' : 'text-base')}>
                Te faltan ${remainingAmount.toLocaleString()} para envío gratis
              </p>
            )}
          </div>

          {/* Barra de progreso */}
          <div
            className={cn('w-full bg-gray-200 rounded-full overflow-hidden', isCompact ? 'h-2' : 'h-3')}
          >
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500 ease-out',
                hasReachedTarget
                  ? 'bg-tenant-success-bar'
                  : 'bg-gradient-to-r from-yellow-400 to-orange-500'
              )}
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          {/* Labels de progreso */}
          <div
            className={cn(
              'flex justify-between text-gray-600',
              isCompact ? 'mt-1 text-2xs' : 'mt-2 text-xs'
            )}
          >
            <span>$0</span>
            <span className='font-semibold'>${resolvedTarget.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Información detallada (solo en variant detailed) */}
      {isDetailed && (
        <div className='mt-3 pt-3 border-t border-yellow-200'>
          <div className='flex justify-between items-center text-xs'>
            <span className='text-gray-600'>Progreso actual:</span>
            <span className='font-semibold text-gray-900'>
              ${currentAmount.toLocaleString()} ({progress.toFixed(1)}%)
            </span>
          </div>

          {!hasReachedTarget && (
            <div className='mt-2 p-2 bg-yellow-100 rounded-lg'>
              <p className='text-xs text-yellow-800'>
                💡 Agrega ${remainingAmount.toLocaleString()} más para obtener envío gratis
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ShippingProgressBar
