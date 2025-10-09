'use client'

import * as React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ShoppingCart, Truck } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'

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
    const qualifiesForFreeShipping = subtotal >= freeShippingThreshold
    const actualShipping = qualifiesForFreeShipping ? 0 : shipping

    return (
      <Card ref={ref} className={cn('w-full bg-white shadow-sm border border-gray-200', className)} {...props}>
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">Resumen del Pedido</h3>
              <p className="text-sm text-gray-600">
                {items.length} {items.length === 1 ? 'producto' : 'productos'}
              </p>
            </div>
          </div>

          {/* Products List */}
          <div className="space-y-4 mb-6">
            {items.map((item) => {
              const imageUrl = item.image || item.imgs?.thumbnails?.[0] || item.imgs?.previews?.[0]
              const itemTotal = item.discountedPrice * item.quantity
              const hasDiscount = item.discountedPrice < item.price

              return (
                <div key={item.id} className="flex items-start gap-4 p-3 rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors">
                  {/* Product Image */}
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-white border border-gray-200 flex-shrink-0">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={item.title}
                        fill
                        className="object-contain p-1"
                        sizes="64px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <ShoppingCart className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 text-sm leading-tight line-clamp-2 mb-1">
                      {item.title}
                    </h4>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-gray-500">Cantidad:</span>
                      <Badge variant="outline" className="text-xs px-2 py-0.5">
                        {item.quantity}
                      </Badge>
                    </div>
                    
                    {/* Price */}
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">
                        ${itemTotal.toLocaleString()}
                      </span>
                      {hasDiscount && (
                        <span className="text-xs text-gray-500 line-through">
                          ${(item.price * item.quantity).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <Separator className="my-6" />

          {/* Price Breakdown */}
          <div className="space-y-3">
            {/* Subtotal */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium text-gray-900">${subtotal.toLocaleString()}</span>
            </div>

            {/* Shipping */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Envío</span>
                {qualifiesForFreeShipping && (
                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-200">
                    Gratis
                  </Badge>
                )}
              </div>
              <span className={cn(
                "font-medium",
                qualifiesForFreeShipping ? "text-green-600" : "text-gray-900"
              )}>
                {qualifiesForFreeShipping ? 'Gratis' : `$${actualShipping.toLocaleString()}`}
              </span>
            </div>

            {/* Free Shipping Progress */}
            {!qualifiesForFreeShipping && freeShippingThreshold > 0 && (
              <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center justify-between text-xs text-orange-700 mb-1">
                  <span>Envío gratis desde ${freeShippingThreshold.toLocaleString()}</span>
                  <span>${(freeShippingThreshold - subtotal).toLocaleString()} restantes</span>
                </div>
                <div className="w-full bg-orange-200 rounded-full h-1.5">
                  <div 
                    className="bg-orange-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((subtotal / freeShippingThreshold) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}

            <Separator className="my-4" />

            {/* Total */}
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
              <div>
                <span className="text-sm font-medium text-green-700 uppercase tracking-wide">
                  Total
                </span>
                <div className="text-xs text-green-600 mt-0.5">Precio Final</div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-green-700">
                  ${(subtotal + actualShipping).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }
)

SimplifiedOrderSummary.displayName = 'SimplifiedOrderSummary'