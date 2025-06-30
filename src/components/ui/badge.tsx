import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-white shadow hover:bg-primary-hover",
        secondary:
          "border-transparent bg-gray-100 text-gray-900 hover:bg-gray-200",
        destructive:
          "border-transparent bg-error text-white shadow hover:bg-red-600",
        success:
          "border-transparent bg-success text-white shadow hover:bg-green-600",
        warning:
          "border-transparent bg-warning text-white shadow hover:bg-yellow-600",
        info:
          "border-transparent bg-info text-white shadow hover:bg-blue-600",
        outline:
          "border-gray-300 text-gray-700 hover:bg-gray-50",
        "outline-primary":
          "border-primary text-primary hover:bg-primary hover:text-white",
        "outline-destructive":
          "border-error text-error hover:bg-error hover:text-white",
        "outline-success":
          "border-success text-success hover:bg-success hover:text-white",
        "outline-warning":
          "border-warning text-warning hover:bg-warning hover:text-white",
        "outline-info":
          "border-info text-info hover:bg-info hover:text-white",
      },
      size: {
        sm: "px-2 py-0.5 text-2xs",
        md: "px-2.5 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
      animation: {
        none: "",
        pulse: "animate-pulse",
        bounce: "animate-bounce",
        ping: "animate-ping",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      animation: "none",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode
  closable?: boolean
  onClose?: () => void
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ 
    className, 
    variant, 
    size, 
    animation,
    icon,
    closable,
    onClose,
    children,
    ...props 
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant, size, animation }), className)}
        {...props}
      >
        {icon && <span className="mr-1">{icon}</span>}
        {children}
        {closable && onClose && (
          <button
            onClick={onClose}
            className="ml-1 hover:bg-black/10 rounded-full p-0.5 transition-colors"
            aria-label="Cerrar"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    )
  }
)
Badge.displayName = "Badge"

// Badges especializados para e-commerce
export interface DiscountBadgeProps extends Omit<BadgeProps, 'variant'> {
  percentage: number
}

const DiscountBadge = React.forwardRef<HTMLDivElement, DiscountBadgeProps>(
  ({ percentage, className, ...props }, ref) => (
    <Badge
      ref={ref}
      variant="destructive"
      size="sm"
      className={cn("font-bold", className)}
      {...props}
    >
      -{percentage}%
    </Badge>
  )
)
DiscountBadge.displayName = "DiscountBadge"

export interface ShippingBadgeProps extends Omit<BadgeProps, 'variant' | 'children'> {
  free?: boolean
  fast?: boolean
  text?: string
}

const ShippingBadge = React.forwardRef<HTMLDivElement, ShippingBadgeProps>(
  ({ free = false, fast = false, text, className, ...props }, ref) => {
    const content = text || (free ? "Envío gratis" : fast ? "Envío rápido" : "Envío")
    const variant = free ? "success" : fast ? "warning" : "info"

    // Para envío gratis, usar el SVG personalizado completo
    if (free) {
      return (
        <div
          ref={ref}
          className={cn("inline-flex items-center", className)}
          {...props}
        >
          <img
            src="/images/icons/icon-envio.svg"
            alt={content}
            className="h-5 w-auto"
          />
        </div>
      )
    }

    return (
      <Badge
        ref={ref}
        variant={variant}
        size="sm"
        className={cn("font-medium", className)}
        icon={
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
        {...props}
      >
        {content}
      </Badge>
    )
  }
)
ShippingBadge.displayName = "ShippingBadge"

export interface StockBadgeProps extends Omit<BadgeProps, 'variant' | 'children'> {
  stock: number
  lowStockThreshold?: number
}

const StockBadge = React.forwardRef<HTMLDivElement, StockBadgeProps>(
  ({ stock, lowStockThreshold = 5, className, ...props }, ref) => {
    const isOutOfStock = stock === 0
    const isLowStock = stock > 0 && stock <= lowStockThreshold
    
    const variant = isOutOfStock ? "destructive" : isLowStock ? "warning" : "success"
    const text = isOutOfStock ? "Sin stock" : isLowStock ? `Últimas ${stock}` : "En stock"
    
    return (
      <Badge
        ref={ref}
        variant={variant}
        size="sm"
        className={cn("font-medium", className)}
        {...props}
      >
        {text}
      </Badge>
    )
  }
)
StockBadge.displayName = "StockBadge"

export interface NewBadgeProps extends Omit<BadgeProps, 'variant' | 'children'> {
  text?: string
}

const NewBadge = React.forwardRef<HTMLDivElement, NewBadgeProps>(
  ({ text = "Nuevo", className, ...props }, ref) => (
    <Badge
      ref={ref}
      variant="info"
      size="sm"
      animation="pulse"
      className={cn("font-bold", className)}
      {...props}
    >
      {text}
    </Badge>
  )
)
NewBadge.displayName = "NewBadge"

export interface OfferBadgeProps extends Omit<BadgeProps, 'variant' | 'children'> {
  text?: string
}

const OfferBadge = React.forwardRef<HTMLDivElement, OfferBadgeProps>(
  ({ text = "OFERTA", className, ...props }, ref) => (
    <Badge
      ref={ref}
      variant="destructive"
      size="md"
      animation="bounce"
      className={cn("font-bold tracking-wide", className)}
      {...props}
    >
      {text}
    </Badge>
  )
)
OfferBadge.displayName = "OfferBadge"

export { 
  Badge, 
  DiscountBadge,
  ShippingBadge,
  StockBadge,
  NewBadge,
  OfferBadge,
  badgeVariants 
}
