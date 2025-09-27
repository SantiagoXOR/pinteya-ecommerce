'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import {
  CheckCircle,
  AlertCircle,
  Info,
  X,
  ShoppingCart,
  Heart,
  Star,
  Zap,
  Loader2,
} from 'lucide-react'

// Toast/Notification Component
const toastVariants = cva(
  'fixed z-50 flex items-center gap-3 p-4 rounded-lg shadow-lg border backdrop-blur-sm transition-all duration-300',
  {
    variants: {
      variant: {
        success: 'bg-green-50/90 text-green-800 border-green-200',
        error: 'bg-red-50/90 text-red-800 border-red-200',
        warning: 'bg-yellow-50/90 text-yellow-800 border-yellow-200',
        info: 'bg-blue-50/90 text-blue-800 border-blue-200',
        cart: 'bg-primary/10 text-primary border-primary/20',
      },
      position: {
        'top-right': 'top-4 right-4',
        'top-left': 'top-4 left-4',
        'bottom-right': 'bottom-4 right-4',
        'bottom-left': 'bottom-4 left-4',
        'top-center': 'top-4 left-1/2 -translate-x-1/2',
        'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
      },
      animation: {
        'slide-in': 'animate-slide-up',
        'fade-in': 'animate-fade-in',
        'bounce-in': 'animate-bounce-in',
        'scale-in': 'animate-scale-in',
      },
    },
    defaultVariants: {
      variant: 'success',
      position: 'top-right',
      animation: 'slide-in',
    },
  }
)

export interface ToastProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof toastVariants> {
  title?: string
  description?: string
  icon?: React.ReactNode
  closable?: boolean
  onClose?: () => void
  duration?: number
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  (
    {
      className,
      variant,
      position,
      animation,
      title,
      description,
      icon,
      closable = true,
      onClose,
      duration = 5000,
      ...props
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = React.useState(true)

    React.useEffect(() => {
      if (duration > 0) {
        const timer = setTimeout(() => {
          setIsVisible(false)
          setTimeout(() => onClose?.(), 300)
        }, duration)

        return () => clearTimeout(timer)
      }
      // Return undefined cuando duration <= 0
      return undefined
    }, [duration, onClose])

    const getDefaultIcon = () => {
      switch (variant) {
        case 'success':
          return <CheckCircle className='w-5 h-5' />
        case 'error':
          return <AlertCircle className='w-5 h-5' />
        case 'warning':
          return <AlertCircle className='w-5 h-5' />
        case 'info':
          return <Info className='w-5 h-5' />
        case 'cart':
          return <ShoppingCart className='w-5 h-5' />
        default:
          return <CheckCircle className='w-5 h-5' />
      }
    }

    if (!isVisible) {
      return null
    }

    return (
      <div
        ref={ref}
        className={cn(
          toastVariants({ variant, position, animation }),
          !isVisible && 'opacity-0 translate-y-2',
          className
        )}
        {...props}
      >
        {icon || getDefaultIcon()}
        <div className='flex-1'>
          {title && <div className='font-medium'>{title}</div>}
          {description && <div className='text-sm opacity-90'>{description}</div>}
        </div>
        {closable && (
          <button
            onClick={() => {
              setIsVisible(false)
              setTimeout(() => onClose?.(), 300)
            }}
            className='text-current opacity-70 hover:opacity-100 transition-opacity'
          >
            <X className='w-4 h-4' />
          </button>
        )}
      </div>
    )
  }
)
Toast.displayName = 'Toast'

// Loading Spinner Component
const spinnerVariants = cva(
  'animate-spin rounded-full border-2 border-current border-t-transparent',
  {
    variants: {
      size: {
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8',
        xl: 'w-12 h-12',
      },
      variant: {
        primary: 'text-primary',
        secondary: 'text-gray-500',
        white: 'text-white',
        current: 'text-current',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'primary',
    },
  }
)

export interface SpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {
  text?: string
}

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size, variant, text, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center gap-2', className)} {...props}>
      <div className={cn(spinnerVariants({ size, variant }))} />
      {text && <span className='text-sm text-gray-600'>{text}</span>}
    </div>
  )
)
Spinner.displayName = 'Spinner'

// Pulse Effect Component
const pulseVariants = cva('relative overflow-hidden', {
  variants: {
    variant: {
      primary: 'bg-primary/20',
      secondary: 'bg-gray-200',
      success: 'bg-green-200',
      error: 'bg-red-200',
    },
    intensity: {
      low: 'animate-pulse',
      medium: 'animate-pulse opacity-75',
      high: 'animate-pulse opacity-50',
    },
  },
  defaultVariants: {
    variant: 'primary',
    intensity: 'medium',
  },
})

export interface PulseEffectProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof pulseVariants> {
  children: React.ReactNode
}

const PulseEffect = React.forwardRef<HTMLDivElement, PulseEffectProps>(
  ({ className, variant, intensity, children, ...props }, ref) => (
    <div ref={ref} className={cn('relative', className)} {...props}>
      {children}
      <div
        className={cn('absolute inset-0 rounded-inherit', pulseVariants({ variant, intensity }))}
      />
    </div>
  )
)
PulseEffect.displayName = 'PulseEffect'

// Ripple Effect Component
export interface RippleEffectProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  color?: string
  duration?: number
}

const RippleEffect = React.forwardRef<HTMLDivElement, RippleEffectProps>(
  ({ className, children, color = 'rgba(255, 255, 255, 0.6)', duration = 600, ...props }, ref) => {
    const [ripples, setRipples] = React.useState<Array<{ x: number; y: number; id: number }>>([])

    const addRipple = (event: React.MouseEvent<HTMLDivElement>) => {
      const rect = event.currentTarget.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      const id = Date.now()

      setRipples(prev => [...prev, { x, y, id }])

      setTimeout(() => {
        setRipples(prev => prev.filter(ripple => ripple.id !== id))
      }, duration)
    }

    return (
      <div
        ref={ref}
        className={cn('relative overflow-hidden', className)}
        onMouseDown={addRipple}
        {...props}
      >
        {children}
        {ripples.map(ripple => (
          <span
            key={ripple.id}
            className='absolute rounded-full animate-ping'
            style={{
              left: ripple.x - 10,
              top: ripple.y - 10,
              width: 20,
              height: 20,
              backgroundColor: color,
              pointerEvents: 'none',
            }}
          />
        ))}
      </div>
    )
  }
)
RippleEffect.displayName = 'RippleEffect'

// Success Animation Component
export interface SuccessAnimationProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg'
  color?: string
}

const SuccessAnimation = React.forwardRef<HTMLDivElement, SuccessAnimationProps>(
  ({ className, size = 'md', color = 'text-green-500', ...props }, ref) => {
    const sizeClasses = {
      sm: 'w-8 h-8',
      md: 'w-12 h-12',
      lg: 'w-16 h-16',
    }

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center justify-center rounded-full bg-green-100 animate-bounce-in',
          sizeClasses[size],
          className
        )}
        {...props}
      >
        <CheckCircle
          className={cn('animate-scale-in', color, {
            'w-4 h-4': size === 'sm',
            'w-6 h-6': size === 'md',
            'w-8 h-8': size === 'lg',
          })}
        />
      </div>
    )
  }
)
SuccessAnimation.displayName = 'SuccessAnimation'

// Cart Added Animation
export interface CartAddedAnimationProps extends React.HTMLAttributes<HTMLDivElement> {
  productName?: string
  onComplete?: () => void
}

const CartAddedAnimation = React.forwardRef<HTMLDivElement, CartAddedAnimationProps>(
  ({ className, productName = 'Producto', onComplete, ...props }, ref) => {
    React.useEffect(() => {
      const timer = setTimeout(() => {
        onComplete?.()
      }, 2000)

      return () => clearTimeout(timer)
    }, [onComplete])

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center gap-3 p-4 bg-primary/10 border border-primary/20 rounded-lg animate-slide-up',
          className
        )}
        {...props}
      >
        <div className='w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center animate-bounce-in'>
          <ShoppingCart className='w-5 h-5 text-primary' />
        </div>
        <div>
          <div className='font-medium text-primary'>¡Agregado al carrito!</div>
          <div className='text-sm text-primary/80'>{productName}</div>
        </div>
        <div className='ml-auto'>
          <CheckCircle className='w-5 h-5 text-green-500 animate-scale-in' />
        </div>
      </div>
    )
  }
)
CartAddedAnimation.displayName = 'CartAddedAnimation'

// Favorite Animation
export interface FavoriteAnimationProps extends React.HTMLAttributes<HTMLButtonElement> {
  isFavorite?: boolean
  onToggle?: (isFavorite: boolean) => void
}

const FavoriteAnimation = React.forwardRef<HTMLButtonElement, FavoriteAnimationProps>(
  ({ className, isFavorite = false, onToggle, ...props }, ref) => {
    const [isAnimating, setIsAnimating] = React.useState(false)

    const handleClick = () => {
      setIsAnimating(true)
      onToggle?.(!isFavorite)

      setTimeout(() => {
        setIsAnimating(false)
      }, 300)
    }

    return (
      <button
        ref={ref}
        className={cn(
          'p-2 rounded-full transition-all duration-200 hover:bg-gray-100',
          isAnimating && 'animate-bounce',
          className
        )}
        onClick={handleClick}
        {...props}
      >
        <Heart
          className={cn(
            'w-5 h-5 transition-all duration-200',
            isFavorite ? 'text-red-500 fill-current scale-110' : 'text-gray-400 hover:text-red-500'
          )}
        />
      </button>
    )
  }
)
FavoriteAnimation.displayName = 'FavoriteAnimation'

// Rating Animation
export interface RatingAnimationProps extends React.HTMLAttributes<HTMLDivElement> {
  rating?: number
  maxRating?: number
  onRate?: (rating: number) => void
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const RatingAnimation = React.forwardRef<HTMLDivElement, RatingAnimationProps>(
  (
    { className, rating = 0, maxRating = 5, onRate, readonly = false, size = 'md', ...props },
    ref
  ) => {
    const [hoverRating, setHoverRating] = React.useState(0)
    const [isAnimating, setIsAnimating] = React.useState(false)

    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
    }

    const handleClick = (newRating: number) => {
      if (readonly) {
        return
      }

      setIsAnimating(true)
      onRate?.(newRating)

      setTimeout(() => {
        setIsAnimating(false)
      }, 300)
    }

    return (
      <div ref={ref} className={cn('flex items-center gap-1', className)} {...props}>
        {Array.from({ length: maxRating }, (_, index) => {
          const starRating = index + 1
          const isFilled = starRating <= (hoverRating || rating)

          return (
            <button
              key={index}
              className={cn(
                'transition-all duration-200',
                !readonly && 'hover:scale-110',
                isAnimating && starRating <= rating && 'animate-bounce',
                readonly && 'cursor-default'
              )}
              onClick={() => handleClick(starRating)}
              onMouseEnter={() => !readonly && setHoverRating(starRating)}
              onMouseLeave={() => !readonly && setHoverRating(0)}
              disabled={readonly}
            >
              <Star
                className={cn(
                  sizeClasses[size],
                  'transition-colors duration-200',
                  isFilled ? 'text-yellow-400 fill-current' : 'text-gray-300'
                )}
              />
            </button>
          )
        })}
      </div>
    )
  }
)
RatingAnimation.displayName = 'RatingAnimation'

export {
  Toast,
  Spinner,
  PulseEffect,
  RippleEffect,
  SuccessAnimation,
  CartAddedAnimation,
  FavoriteAnimation,
  RatingAnimation,
  toastVariants,
  spinnerVariants,
  pulseVariants,
}
