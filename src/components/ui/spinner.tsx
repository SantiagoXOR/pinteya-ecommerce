'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

const spinnerVariants = cva(
  'animate-spin rounded-full border-2 border-solid border-current border-r-transparent',
  {
    variants: {
      size: {
        sm: 'h-4 w-4',
        md: 'h-6 w-6',
        lg: 'h-8 w-8',
        xl: 'h-12 w-12',
      },
      variant: {
        default: 'text-primary',
        secondary: 'text-gray-500',
        white: 'text-white',
        muted: 'text-gray-400',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  }
)

export interface SpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {
  /**
   * Texto de accesibilidad para lectores de pantalla
   */
  srText?: string
}

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size, variant, srText = 'Cargando...', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(spinnerVariants({ size, variant }), className)}
        role='status'
        aria-label={srText}
        {...props}
      >
        <span className='sr-only'>{srText}</span>
      </div>
    )
  }
)
Spinner.displayName = 'Spinner'

/**
 * Componente de spinner con overlay para pantalla completa
 */
export interface SpinnerOverlayProps extends SpinnerProps {
  /**
   * Si se muestra el overlay
   */
  show?: boolean
  /**
   * Texto a mostrar debajo del spinner
   */
  text?: string
}

const SpinnerOverlay = React.forwardRef<HTMLDivElement, SpinnerOverlayProps>(
  ({ show = true, text, className, ...spinnerProps }, ref) => {
    if (!show) {
      return null
    }

    return (
      <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'>
        <div className='flex flex-col items-center space-y-4 rounded-lg bg-white p-6 shadow-lg'>
          <Spinner ref={ref} className={className} {...spinnerProps} />
          {text && <p className='text-sm text-gray-600'>{text}</p>}
        </div>
      </div>
    )
  }
)
SpinnerOverlay.displayName = 'SpinnerOverlay'

export { Spinner, SpinnerOverlay, spinnerVariants }
