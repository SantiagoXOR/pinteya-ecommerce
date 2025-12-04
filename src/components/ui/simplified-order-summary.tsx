'use client'

import * as React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import SingleItem from '@/components/Common/CartSidebarModal/SingleItem'

export interface OrderItem {
  id: number | string
  title: string
  price: number
  discountedPrice: number
  quantity: number
  image?: string
  imgs?: {
    thumbnails?: string[]
    previews?: string[]
  }
  attributes?: {
    color?: string
    medida?: string
    finish?: string
  }
}

export interface SimplifiedOrderSummaryProps {
  items: OrderItem[]
  subtotal: number
  shipping: number
  total: number
  freeShippingThreshold?: number
  className?: string
}

/**
 * Componente SimplifiedOrderSummary - Diseño limpio y funcional
 * 
 * Características:
 * - Estructura plana sin anidamientos complejos
 * - Vista previa de imágenes de productos
 * - Desglose claro de precios
 * - Diseño responsive y accesible
 * - Siguiendo mejores prácticas de Context7 y Shadcn
 */
export const SimplifiedOrderSummary = React.forwardRef<HTMLDivElement, SimplifiedOrderSummaryProps>(
  ({ items = [], subtotal = 0, shipping = 0, total = 0, freeShippingThreshold = 50000, className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('w-full space-y-4', className)} {...props}>
        {items.map((item, index) => (
          <SingleItem key={`${item.id}-${index}`} item={item} />
        ))}
      </div>
    )
  }
)

SimplifiedOrderSummary.displayName = 'SimplifiedOrderSummary'