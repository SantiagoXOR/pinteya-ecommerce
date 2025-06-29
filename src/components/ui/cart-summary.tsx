"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { PriceDisplay } from "@/components/ui/price-display"
import { ShippingInfo } from "@/components/ui/shipping-info"
import { EnhancedProductCard } from "@/components/ui/product-card-enhanced"
import { ShoppingCart, CreditCard, Truck, Gift, Percent } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CartItem {
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
  category?: string
  weight?: number
}

export interface CartSummaryProps {
  /** Items del carrito */
  cartItems: CartItem[]
  /** Precio total sin envío ni descuentos */
  totalPrice: number
  /** Costo de envío */
  shippingCost?: number
  /** Descuento aplicado */
  discount?: number
  /** Total final */
  finalTotal?: number
  /** Método de envío seleccionado */
  shippingMethod?: 'free' | 'standard' | 'express'
  /** Cupón aplicado */
  appliedCoupon?: {
    code: string
    discount: number
    type: 'percentage' | 'fixed'
  } | null
  /** Variante del componente */
  variant?: 'default' | 'compact' | 'detailed'
  /** Mostrar productos como cards */
  showProductCards?: boolean
  /** Contexto para EnhancedProductCard */
  productCardContext?: 'default' | 'productDetail' | 'checkout' | 'demo'
  /** Callback para proceder al checkout */
  onCheckout?: () => void
  /** Callback para aplicar cupón */
  onApplyCoupon?: (code: string) => void
  /** Callback para remover cupón */
  onRemoveCoupon?: () => void
  /** Mostrar información de envío detallada */
  showShippingDetails?: boolean
  /** Clase CSS adicional */
  className?: string
}

/**
 * CartSummary avanzado con integración del Design System
 * 
 * Características:
 * - Integra PriceDisplay para precios consistentes
 * - Usa ShippingInfo para información de envío
 * - Opción de mostrar productos como EnhancedProductCard
 * - Soporte para cupones y descuentos
 * - Múltiples variantes (default, compact, detailed)
 */
export const CartSummary = React.forwardRef<HTMLDivElement, CartSummaryProps>(
  ({
    cartItems = [],
    totalPrice = 0,
    shippingCost = 0,
    discount = 0,
    finalTotal,
    shippingMethod = 'standard',
    appliedCoupon,
    variant = 'default',
    showProductCards = false,
    productCardContext = 'checkout',
    onCheckout,
    onApplyCoupon,
    onRemoveCoupon,
    showShippingDetails = false,
    className,
    ...props
  }, ref) => {
    const calculatedFinalTotal = finalTotal ?? (totalPrice + (shippingCost || 0) - (discount || 0))
    const isCompact = variant === 'compact'
    const isDetailed = variant === 'detailed'

    // Calcular si califica para envío gratis
    const qualifiesForFreeShipping = totalPrice >= 50000
    const actualShippingCost = qualifiesForFreeShipping ? 0 : (shippingCost || 0)

    return (
      <Card ref={ref} className={cn("w-full", className)} {...props}>
        <CardHeader className={cn("pb-4", isCompact && "pb-2")}>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            Resumen del Pedido
            <Badge variant="outline" size="sm">
              {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
            </Badge>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Items del carrito */}
          {cartItems.length > 0 ? (
            <div className={cn(
              "space-y-3",
              isCompact ? "max-h-40" : "max-h-80",
              "overflow-y-auto"
            )}>
              {cartItems.map((item, index) => (
                <div key={`${item.id}-${index}`}>
                  {showProductCards ? (
                    // Mostrar como EnhancedProductCard
                    <EnhancedProductCard
                      context={productCardContext}
                      image={item.image || item.imgs?.thumbnails?.[0] || item.imgs?.previews?.[0]}
                      title={item.title}
                      price={item.discountedPrice}
                      originalPrice={item.discountedPrice < item.price ? item.price : undefined}
                      stock={item.quantity}
                      stockUnit="en carrito"
                      productId={item.id}
                      badge={item.discountedPrice >= 15000 ? "Envío gratis" : undefined}
                      cta={`Total: $${(item.discountedPrice * item.quantity).toLocaleString()}`}
                      onAddToCart={() => {}}
                      showCartAnimation={false}
                      productData={{
                        category: item.category,
                        weight: item.weight,
                      }}
                    />
                  ) : (
                    // Mostrar como item simple
                    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                      <div className="flex-1 pr-4">
                        <p className="font-medium text-gray-900 line-clamp-2">{item.title}</p>
                        <p className="text-sm text-gray-500">Cantidad: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <PriceDisplay
                          amount={(item.discountedPrice * item.quantity) * 100}
                          originalAmount={item.discountedPrice < item.price ? (item.price * item.quantity) * 100 : undefined}
                          variant="compact"
                          size="sm"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <ShoppingCart className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No hay productos en el carrito</p>
            </div>
          )}

          {cartItems.length > 0 && (
            <>
              <Separator />

              {/* Totales */}
              <div className="space-y-3">
                {/* Subtotal */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <PriceDisplay
                    amount={totalPrice * 100}
                    variant="compact"
                    size="sm"
                  />
                </div>

                {/* Envío */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">Envío</span>
                    {qualifiesForFreeShipping && (
                      <Badge variant="success" size="sm">Gratis</Badge>
                    )}
                  </div>
                  <div className="text-right">
                    {qualifiesForFreeShipping ? (
                      <span className="text-green-600 font-medium">Gratis</span>
                    ) : (
                      <PriceDisplay
                        amount={actualShippingCost * 100}
                        variant="compact"
                        size="sm"
                      />
                    )}
                  </div>
                </div>

                {/* Descuento */}
                {(discount > 0 || appliedCoupon) && (
                  <div className="flex items-center justify-between text-green-600">
                    <div className="flex items-center gap-2">
                      <Percent className="w-4 h-4" />
                      <span>Descuento</span>
                      {appliedCoupon && (
                        <Badge variant="success" size="sm">
                          {appliedCoupon.code}
                        </Badge>
                      )}
                    </div>
                    <PriceDisplay
                      amount={-(discount * 100)}
                      variant="compact"
                      size="sm"
                      className="text-green-600"
                    />
                  </div>
                )}

                <Separator />

                {/* Total final */}
                <div className="flex items-center justify-between font-semibold text-lg">
                  <span>Total</span>
                  <PriceDisplay
                    amount={calculatedFinalTotal * 100}
                    variant="default"
                    size="lg"
                    className="text-primary"
                  />
                </div>
              </div>

              {/* Información de envío detallada */}
              {showShippingDetails && isDetailed && (
                <>
                  <Separator />
                  <ShippingInfo
                    variant="inline"
                    options={[
                      {
                        id: 'free',
                        name: 'Envío gratis',
                        price: 0,
                        estimatedDays: { min: 5, max: 7 },
                        isFree: true,
                        description: 'En compras mayores a $50.000'
                      },
                      {
                        id: 'standard',
                        name: 'Envío estándar',
                        price: 2500,
                        estimatedDays: { min: 3, max: 5 },
                        description: 'Entrega a domicilio'
                      },
                      {
                        id: 'express',
                        name: 'Envío express',
                        price: 4500,
                        estimatedDays: { min: 1, max: 2 },
                        isExpress: true,
                        description: 'Entrega prioritaria'
                      }
                    ]}
                    selectedOption={shippingMethod}
                    showCalculator={false}
                    showGuarantees={true}
                  />
                </>
              )}

              {/* Beneficios */}
              {!isCompact && (
                <>
                  <Separator />
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700 text-sm">
                      <Gift className="w-4 h-4" />
                      <span className="font-medium">Compra protegida</span>
                    </div>
                    <p className="text-xs text-green-600 mt-1">
                      Tu dinero está protegido con MercadoPago
                    </p>
                  </div>
                </>
              )}

              {/* Botón de checkout */}
              {onCheckout && (
                <>
                  <Separator />
                  <Button
                    onClick={onCheckout}
                    className="w-full"
                    size="lg"
                    disabled={cartItems.length === 0}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Proceder al Pago
                  </Button>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>
    )
  }
)

CartSummary.displayName = "CartSummary"
