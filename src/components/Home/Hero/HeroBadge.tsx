/**
 * HeroBadge Component
 * Componente reutilizable para badges promocionales en el hero
 * Soporta diferentes tipos, variantes y tamaños
 */

import React from 'react'
import { HeroBadgeProps, BadgeType, BadgeVariant } from '@/types/hero'
import { Truck, CreditCard, Package, Clock } from '@/lib/optimized-imports'

/**
 * Obtener el icono apropiado según el tipo de badge
 */
const getBadgeIcon = (type: BadgeType): React.ReactNode => {
  const iconClass = 'w-4 h-4 sm:w-5 sm:h-5'
  
  switch (type) {
    case 'shipping':
      return <Truck className={iconClass} />
    case 'installments':
      return <CreditCard className={iconClass} />
    case 'payment':
      return <Package className={iconClass} />
    case 'delivery':
      return <Clock className={iconClass} />
    case 'discount':
    default:
      return null
  }
}

/**
 * Obtener las clases de estilo según la variante
 */
const getBadgeVariantClasses = (variant: BadgeVariant = 'orange'): string => {
  const variants = {
    yellow: 'bg-yellow-400 text-gray-900 hover:bg-yellow-500',
    orange: 'bg-blaze-orange-500 text-white hover:bg-blaze-orange-600',
    green: 'bg-green-500 text-white hover:bg-green-600',
    blue: 'bg-blue-500 text-white hover:bg-blue-600',
  }
  
  return variants[variant] || variants.orange
}

/**
 * Obtener las clases de tamaño
 */
const getBadgeSizeClasses = (size: 'sm' | 'md' | 'lg' = 'md'): string => {
  const sizes = {
    sm: 'px-3 py-1.5 text-xs sm:text-sm',
    md: 'px-4 py-2 text-sm sm:text-base',
    lg: 'px-5 py-2.5 text-base sm:text-lg',
  }
  
  return sizes[size] || sizes.md
}

export const HeroBadge: React.FC<HeroBadgeProps> = ({
  badge,
  className = '',
  size = 'md',
}) => {
  const { type, text, subtitle, variant, icon } = badge
  
  // Determinar variante por defecto según el tipo
  const defaultVariant: BadgeVariant = 
    type === 'discount' ? 'yellow' :
    type === 'shipping' ? 'green' :
    type === 'installments' ? 'blue' :
    'orange'
  
  const badgeVariant = variant || defaultVariant
  const badgeIcon = icon || getBadgeIcon(type)
  
  return (
    <div
      className={`
        inline-flex items-center gap-2
        rounded-full
        font-semibold
        shadow-lg
        transition-all duration-300
        transform hover:scale-105
        ${getBadgeVariantClasses(badgeVariant)}
        ${getBadgeSizeClasses(size)}
        ${className}
      `}
      role="status"
      aria-label={`${text}${subtitle ? `: ${subtitle}` : ''}`}
    >
      {/* Icono */}
      {badgeIcon && (
        <span className="flex-shrink-0" aria-hidden="true">
          {badgeIcon}
        </span>
      )}
      
      {/* Contenido */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
        <span className="font-bold leading-tight">
          {text}
        </span>
        {subtitle && (
          <span className="text-xs sm:text-sm opacity-90 leading-tight">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  )
}

/**
 * Badge para descuentos - Variante especializada
 */
export const DiscountBadge: React.FC<{ text: string; className?: string }> = ({
  text,
  className,
}) => {
  return (
    <HeroBadge
      badge={{
        type: 'discount',
        text,
        variant: 'yellow',
      }}
      size="lg"
      className={className}
    />
  )
}

/**
 * Badge para envío gratis - Variante especializada
 */
export const ShippingBadge: React.FC<{ 
  text?: string
  subtitle?: string
  className?: string 
}> = ({
  text = 'Envío Gratis',
  subtitle,
  className,
}) => {
  return (
    <HeroBadge
      badge={{
        type: 'shipping',
        text,
        subtitle,
        variant: 'green',
      }}
      size="md"
      className={className}
    />
  )
}

/**
 * Badge para cuotas - Variante especializada
 */
export const InstallmentsBadge: React.FC<{ 
  text: string
  className?: string 
}> = ({
  text,
  className,
}) => {
  return (
    <HeroBadge
      badge={{
        type: 'installments',
        text,
        variant: 'blue',
      }}
      size="md"
      className={className}
    />
  )
}

export default HeroBadge

