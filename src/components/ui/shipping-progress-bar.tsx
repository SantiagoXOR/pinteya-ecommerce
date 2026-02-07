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

/**
 * Parsea números soportando formato argentino (48.189,40) y estándar (48189.40).
 * En Argentina: punto = miles, coma = decimal.
 */
const toNumber = (v: unknown, fallback = 0): number => {
  if (v == null) return fallback
  if (typeof v === 'number') return Number.isFinite(v) && v >= 0 ? v : fallback
  if (typeof v === 'string') {
    const cleaned = String(v).replace(/\s/g, '')
    if (cleaned.includes(',')) {
      const normalized = cleaned.replace(/\./g, '').replace(',', '.')
      const n = parseFloat(normalized)
      return Number.isFinite(n) && n >= 0 ? n : fallback
    }
    const n = parseFloat(cleaned)
    return Number.isFinite(n) && n >= 0 ? n : fallback
  }
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 ? n : fallback
}

const ShippingProgressBar: React.FC<ShippingProgressBarProps> = ({
  currentAmount,
  targetAmount,
  className,
  showIcon = true,
  variant = 'default',
}) => {
  const config = useDesignSystemConfig()
  const resolvedTarget = Math.max(toNumber(targetAmount ?? config.ecommerce.shippingInfo.freeShippingThreshold, 50000), 1)
  const safeCurrentAmount = toNumber(currentAmount, 0)
  const progress = resolvedTarget > 0 ? Math.min((safeCurrentAmount / resolvedTarget) * 100, 100) : 0
  const remainingAmount = Math.max(resolvedTarget - safeCurrentAmount, 0)
  const hasReachedTarget = safeCurrentAmount >= resolvedTarget

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
          {/* Texto principal - colores por tenant (primary) */}
          <div className={cn(isCompact ? 'mb-1.5' : 'mb-3')}>
            {hasReachedTarget ? (
              <p className={cn('font-bold', isCompact ? 'text-sm' : 'text-base')} style={{ color: 'var(--tenant-primary, #ea5a17)' }}>
                ¡Felicitaciones! Tienes envío gratis
              </p>
            ) : (
              <p className={cn('font-semibold', isCompact ? 'text-sm' : 'text-base')} style={{ color: 'var(--tenant-primary, #ea5a17)' }}>
                Te faltan ${remainingAmount.toLocaleString()} para envío gratis
              </p>
            )}
          </div>

          {/* Barra de progreso - colores por tenant (primary) */}
          <div
            className={cn('w-full rounded-full overflow-hidden', isCompact ? 'h-2' : 'h-3')}
            style={{ backgroundColor: '#e5e7eb' }}
          >
            <div
              className='h-full rounded-full transition-all duration-500 ease-out'
              style={{
                width: `${Math.max(progress, 0)}%`,
                minWidth: progress > 0 ? 4 : 0,
                backgroundColor: 'var(--tenant-primary, #ea5a17)',
              }}
            ></div>
          </div>

          {/* Labels de progreso - colores por tenant (primary) */}
          <div
            className={cn('flex justify-between font-semibold', isCompact ? 'mt-1 text-2xs' : 'mt-2 text-xs')}
            style={{ color: 'var(--tenant-primary, #ea5a17)' }}
          >
            <span>$0</span>
            <span>${resolvedTarget.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Información detallada (solo en variant detailed) - colores por tenant */}
      {isDetailed && (
        <div className='mt-3 pt-3 border-t border-gray-200'>
          <div className='flex justify-between items-center text-xs'>
            <span style={{ color: 'var(--tenant-primary, #ea5a17)' }}>Progreso actual:</span>
            <span className='font-semibold' style={{ color: 'var(--tenant-primary, #ea5a17)' }}>
              ${safeCurrentAmount.toLocaleString()} ({progress.toFixed(1)}%)
            </span>
          </div>

          {!hasReachedTarget && (
            <div className='mt-2 p-2 rounded-lg' style={{ backgroundColor: 'var(--tenant-primary, #ea5a17)1a' }}>
              <p className='text-xs' style={{ color: 'var(--tenant-primary, #ea5a17)' }}>
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
