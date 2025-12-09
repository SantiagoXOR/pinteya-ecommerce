'use client'

import React from 'react'
import { cn } from '@/lib/core/utils'
import { Loader2, Package, ShoppingCart, CreditCard } from '@/lib/optimized-imports'

// ===================================
// ENHANCED LOADING STATES - PINTEYA E-COMMERCE
// ===================================

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'primary' | 'secondary' | 'accent'
  className?: string
}

interface LoadingSkeletonProps {
  variant?: 'text' | 'card' | 'product' | 'avatar' | 'button'
  lines?: number
  className?: string
}

interface LoadingStateProps {
  type?: 'products' | 'cart' | 'checkout' | 'general'
  message?: string
  showIcon?: boolean
  className?: string
}

// ===================================
// LOADING SPINNER MEJORADO
// ===================================

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'default',
  className,
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  }

  const variantClasses = {
    default: 'text-gray-500',
    primary: 'text-blaze-orange-600',
    secondary: 'text-fun-green-600',
    accent: 'text-bright-sun-400',
  }

  return (
    <Loader2
      className={cn('animate-spin', sizeClasses[size], variantClasses[variant], className)}
    />
  )
}

// ===================================
// SKELETON LOADING MEJORADO
// ===================================

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant = 'text',
  lines = 1,
  className,
}) => {
  const baseClasses =
    'animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] rounded'

  const variants = {
    text: 'h-4 w-full',
    card: 'h-48 w-full',
    product: 'h-64 w-full',
    avatar: 'h-10 w-10 rounded-full',
    button: 'h-10 w-24',
  }

  if (variant === 'text' && lines > 1) {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              baseClasses,
              variants.text,
              i === lines - 1 && 'w-3/4' // Última línea más corta
            )}
            style={{
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      className={cn(baseClasses, variants[variant], className)}
      style={{
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite, shimmer 2s linear infinite',
      }}
    />
  )
}

// ===================================
// LOADING STATE CONTEXTUAL
// ===================================

export const LoadingState: React.FC<LoadingStateProps> = ({
  type = 'general',
  message,
  showIcon = true,
  className,
}) => {
  const icons = {
    products: Package,
    cart: ShoppingCart,
    checkout: CreditCard,
    general: Loader2,
  }

  const messages = {
    products: 'Cargando productos...',
    cart: 'Actualizando carrito...',
    checkout: 'Procesando pago...',
    general: 'Cargando...',
  }

  const Icon = icons[type]
  const displayMessage = message || messages[type]

  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
      {showIcon && (
        <div className='mb-4'>
          <Icon className='w-12 h-12 text-blaze-orange-600 animate-spin' />
        </div>
      )}
      <p className='text-gray-600 font-medium'>{displayMessage}</p>
      <div className='mt-4 flex space-x-1'>
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className='w-2 h-2 bg-blaze-orange-600 rounded-full animate-bounce'
            style={{
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>
    </div>
  )
}

// ===================================
// PRODUCT CARD SKELETON
// ===================================

export const ProductCardSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('bg-white rounded-lg shadow-sm border p-4 space-y-4', className)}>
      {/* Imagen */}
      <LoadingSkeleton variant='card' className='aspect-square' />

      {/* Título */}
      <LoadingSkeleton variant='text' lines={2} />

      {/* Precio */}
      <div className='flex items-center justify-between'>
        <LoadingSkeleton variant='text' className='w-20 h-6' />
        <LoadingSkeleton variant='button' className='w-16 h-6' />
      </div>

      {/* Botón */}
      <LoadingSkeleton variant='button' className='w-full h-10' />
    </div>
  )
}

// ===================================
// GRID SKELETON
// ===================================

export const ProductGridSkeleton: React.FC<{
  count?: number
  className?: string
}> = ({ count = 12, className }) => {
  return (
    <div
      className={cn(
        'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6',
        className
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            animationDelay: `${i * 0.1}s`,
          }}
        >
          <ProductCardSkeleton className='animate-pulse' />
        </div>
      ))}
    </div>
  )
}

// ===================================
// CSS PERSONALIZADO PARA ANIMACIONES
// ===================================

export const LoadingStyles = () => (
  <style jsx global>{`
    @keyframes shimmer {
      0% {
        background-position: -200% 0;
      }
      100% {
        background-position: 200% 0;
      }
    }

    .animate-shimmer {
      animation: shimmer 2s linear infinite;
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .animate-fadeInUp {
      animation: fadeInUp 0.6s ease-out;
    }
  `}</style>
)
