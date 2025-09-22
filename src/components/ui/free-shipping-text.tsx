import React from 'react'
import { Truck } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FreeShippingTextProps {
  className?: string
  threshold?: number
  variant?: 'default' | 'compact' | 'badge'
  showIcon?: boolean
}

const FreeShippingText = React.forwardRef<HTMLDivElement, FreeShippingTextProps>(
  ({ 
    className, 
    threshold = 15000,
    variant = 'default',
    showIcon = true,
    ...props 
  }, ref) => {
    const baseClasses = {
      default: "flex items-center gap-2 text-green-600 font-medium",
      compact: "flex items-center gap-1 text-sm text-green-600",
      badge: "inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium"
    }

    const iconSize = {
      default: "w-4 h-4",
      compact: "w-3 h-3", 
      badge: "w-3 h-3"
    }

    return (
      <div
        ref={ref}
        className={cn(baseClasses[variant], className)}
        {...props}
      >
        {showIcon && <Truck className={iconSize[variant]} />}
        <span>
          {variant === 'badge' ? '🚚 Envío gratis' : 'Envío gratis en compras mayores a '}
          {variant !== 'badge' && (
            <span className="font-semibold">
              ${threshold.toLocaleString()}
            </span>
          )}
        </span>
      </div>
    )
  }
)

FreeShippingText.displayName = "FreeShippingText"

export { FreeShippingText }
export type { FreeShippingTextProps }