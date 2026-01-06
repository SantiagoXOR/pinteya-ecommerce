'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils/consolidated-utils'

const priceDisplayVariants = cva('flex flex-col gap-0.5 w-full max-w-full', {
  variants: {
    variant: {
      default: 'text-left',
      center: 'text-center items-center',
      compact: 'flex-col gap-0.5',
    },
    size: {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
})

const priceVariants = cva('font-bold leading-tight', {
  variants: {
    size: {
      sm: 'text-lg',
      md: 'text-xl',
      lg: 'text-2xl',
      xl: 'text-3xl',
    },
  },
  defaultVariants: {
    size: 'md',
  },
})

const originalPriceVariants = cva('line-through text-muted-foreground font-medium', {
  variants: {
    size: {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
      xl: 'text-lg',
    },
  },
  defaultVariants: {
    size: 'md',
  },
})

export interface PriceDisplayProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof priceDisplayVariants> {
  /** Precio actual en centavos (ej: 1550 = $15.50) */
  amount: number
  /** Precio original antes del descuento en centavos */
  originalAmount?: number
  /** Código de moneda (default: ARS) */
  currency?: string
  /** Símbolo de moneda personalizado */
  currencySymbol?: string
  /** Mostrar información de cuotas */
  installments?: {
    quantity: number
    amount: number
    interestFree?: boolean
  }
  /** Mostrar descuento como porcentaje */
  showDiscountPercentage?: boolean
  /** Texto personalizado para cuotas */
  installmentsText?: string
  /** Mostrar envío gratis */
  showFreeShipping?: boolean
  /** Color del precio principal */
  priceColor?: string
}

/**
 * Formatea y renderiza un precio con decimales en superíndice
 * Usa formatCurrency centralizado para consistencia
 */
const renderPrice = (
  amount: number,
  currency: string = 'ARS',
  currencySymbol?: string
): React.ReactNode => {
  // amount viene en centavos, convertir a pesos
  const price = amount / 100

  // Usar función centralizada que garantiza formato correcto
  const formatted = formatCurrency(price, currency)

  // Separar parte entera y decimales (formato es-AR usa coma para decimales)
  const commaIndex = formatted.lastIndexOf(',')
  if (commaIndex === -1) {
    // Si no hay decimales (precio entero), mostrar sin superíndice
    return formatted
  }
  const integerWithSeparator = formatted.slice(0, commaIndex + 1) // incluye la coma
  const decimals = formatted.slice(commaIndex + 1)

  return (
    <span>
      {integerWithSeparator}
      <span className='align-super text-xs'>{decimals}</span>
    </span>
  )
}

/**
 * Calcula el porcentaje de descuento
 */
const calculateDiscountPercentage = (original: number, current: number): number => {
  return Math.round(((original - current) / original) * 100)
}

const PriceDisplay = React.forwardRef<HTMLDivElement, PriceDisplayProps>(
  (
    {
      className,
      variant,
      size,
      amount,
      originalAmount,
      currency = 'ARS',
      currencySymbol,
      installments,
      showDiscountPercentage = true,
      installmentsText = 'sin interés',
      showFreeShipping = false,
      priceColor,
      ...props
    },
    ref
  ) => {
    const hasDiscount = originalAmount && originalAmount > amount
    const discountPercentage = hasDiscount ? calculateDiscountPercentage(originalAmount, amount) : 0

    return (
      <div ref={ref} className={cn(priceDisplayVariants({ variant, size, className }))} {...props}>
        {/* Precio Original (si hay descuento) */}
        {hasDiscount && (
          <div className='flex items-center gap-2'>
            <span className={cn(originalPriceVariants({ size }))}>
              {renderPrice(originalAmount, currency, currencySymbol)}
            </span>
            {showDiscountPercentage && (
              <span className='bg-red-500 text-white text-xs font-bold px-2 py-1 rounded'>
                -{discountPercentage}%
              </span>
            )}
          </div>
        )}

        {/* Precio Principal */}
        <div
          className={cn(
            priceVariants({ size }),
            priceColor ? `text-[${priceColor}]` : 'text-[#712F00]'
          )}
        >
          {renderPrice(amount, currency, currencySymbol)}
        </div>

        {/* Información de Cuotas */}
        {installments && (
          <div className='text-xs text-muted-foreground max-w-full overflow-hidden'>
            {variant === 'compact' ? (
              <span className='text-fun-green-500 font-medium truncate block text-xs leading-tight'>
                {installments.quantity}x de{' '}
                {renderPrice(installments.amount, currency, currencySymbol)}
                {installments.interestFree && ` ${installmentsText}`}
              </span>
            ) : (
              <>
                <span className='text-fun-green-500 font-medium truncate block text-xs leading-tight'>
                  {installments.quantity}x de{' '}
                  {renderPrice(installments.amount, currency, currencySymbol)}
                </span>
                {installments.interestFree && (
                  <span className='ml-1 text-green-600 truncate block'>{installmentsText}</span>
                )}
              </>
            )}
          </div>
        )}

        {/* Envío Gratis */}
        {showFreeShipping && (
          <div className='flex items-center gap-1 text-sm max-w-full mt-1'>
            <img src='/images/icons/icon-envio.svg' alt='Envío gratis' className='h-6 w-auto' />
          </div>
        )}
      </div>
    )
  }
)

PriceDisplay.displayName = 'PriceDisplay'

export { PriceDisplay, priceDisplayVariants }
