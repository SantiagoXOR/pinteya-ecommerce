'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { PriceDisplay } from '@/components/ui/price-display'
import { ShippingInfo } from '@/components/ui/shipping-info'
import { EnhancedProductCard } from '@/components/ui/product-card-enhanced'
import { useDesignSystemConfig, shouldShowFreeShipping as dsShouldShowFreeShipping } from '@/lib/design-system-config'
import {
  ShoppingCart,
  CreditCard,
  Truck,
  Gift,
  Percent,
  ChevronDown,
  ChevronUp,
} from '@/lib/optimized-imports'
import { cn } from '@/lib/utils'

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
  variant?: 'default' | 'compact' | 'detailed' | 'mobile'
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
  /** Inicialmente colapsado (solo para variante mobile) */
  initiallyCollapsed?: boolean
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
  (
    {
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
      initiallyCollapsed = false,
      className,
      ...props
    },
    ref
  ) => {
    const config = useDesignSystemConfig()
    const calculatedFinalTotal = finalTotal ?? totalPrice + (shippingCost || 0) - (discount || 0)
    const isCompact = variant === 'compact'
    const isDetailed = variant === 'detailed'
    const isMobile = variant === 'mobile'

    // Estado para colapso en variante mobile
    const [isCollapsed, setIsCollapsed] = React.useState(isMobile ? initiallyCollapsed : false)

    // Calcular si califica para envío gratis
    const qualifiesForFreeShipping = totalPrice >= 50000
    const actualShippingCost = qualifiesForFreeShipping ? 0 : shippingCost || 0

    return (
      <Card
        ref={ref}
        className={cn(
          'w-full',
          isMobile && 'border-0 shadow-lg bg-white/90 backdrop-blur-sm rounded-xl',
          className
        )}
        {...props}
      >
        <CardHeader
          className={cn('pb-4', isCompact && 'pb-2', isMobile && 'pb-0 px-0 cursor-pointer')}
          onClick={isMobile ? () => setIsCollapsed(!isCollapsed) : undefined}
        >
          <CardTitle
            className={cn(
              'flex items-center gap-2',
              isMobile &&
                'justify-between text-sm px-4 py-3 hover:bg-gray-50/50 transition-colors rounded-xl'
            )}
          >
            <div className={cn('flex items-center gap-2', isMobile && 'gap-2')}>
              {isMobile ? (
                <div className='w-8 h-8 rounded-full bg-green-100 flex items-center justify-center'>
                  <ShoppingCart className='w-4 h-4 text-green-600' />
                </div>
              ) : (
                <ShoppingCart className='w-5 h-5 text-primary' />
              )}
              <div>
                <span className={cn('font-semibold', isMobile && 'text-gray-900 block text-sm')}>
                  {isMobile ? 'Resumen del Pedido' : 'Resumen del Pedido'}
                </span>
                {isMobile && (
                  <span className='text-xs text-gray-600'>
                    {cartItems.length} {cartItems.length === 1 ? 'producto' : 'productos'}
                  </span>
                )}
              </div>
              {!isMobile && (
                <Badge variant='outline' size='sm'>
                  {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
                </Badge>
              )}
            </div>
            {isMobile && (
              <div className='flex items-center gap-3'>
                <div className='text-right'>
                  <PriceDisplay
                    amount={calculatedFinalTotal * 100}
                    variant='compact'
                    size='lg'
                    className='text-green-600 font-bold text-xl'
                  />
                  <div className='text-xs text-gray-500 uppercase tracking-wide'>Total</div>
                </div>
                <div className='w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center'>
                  {isCollapsed ? (
                    <ChevronDown className='w-4 h-4' />
                  ) : (
                    <ChevronUp className='w-4 h-4' />
                  )}
                </div>
              </div>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent
          className={cn('space-y-4', isMobile && 'px-5 pb-5', isMobile && isCollapsed && 'hidden')}
        >
          {isMobile && !isCollapsed && <div className='border-t pt-4' />}

          {/* Items del carrito */}
          {cartItems.length > 0 ? (
            <div
              className={cn(
                'space-y-3',
                isCompact ? 'max-h-40' : isMobile ? 'min-h-[320px] max-h-[calc(100vh-420px)] space-y-2' : 'max-h-80',
                'overflow-y-auto',
                isMobile && 'scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100'
              )}
            >
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
                      stockUnit='en carrito'
                      productId={item.id}
                      badge={dsShouldShowFreeShipping(item.discountedPrice, config) ? 'Envío gratis' : undefined}
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
                    <div
                      className={cn(
                        'flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0',
                        isMobile && 'py-1 min-h-[60px]'
                      )}
                    >
                      <div className='flex-1 pr-4'>
                        <p
                          className={cn(
                            'font-medium text-gray-900 line-clamp-2',
                            isMobile && 'text-sm line-clamp-1'
                          )}
                        >
                          {item.title}
                        </p>
                        <p className={cn('text-sm text-gray-500', isMobile && 'text-xs')}>
                          Cantidad: {item.quantity}
                        </p>
                      </div>
                      <div className='text-right'>
                        <PriceDisplay
                          amount={item.discountedPrice * item.quantity * 100}
                          originalAmount={
                            item.discountedPrice < item.price
                              ? item.price * item.quantity * 100
                              : undefined
                          }
                          variant='compact'
                          size={isMobile ? 'xs' : 'sm'}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className='text-center py-8 text-gray-500'>
              <ShoppingCart className='w-12 h-12 mx-auto mb-2 text-gray-300' />
              <p>No hay productos en el carrito</p>
            </div>
          )}

          {cartItems.length > 0 && (
            <>
              <Separator />

              {/* Totales */}
              <div className={cn('space-y-3', isMobile && 'space-y-2')}>
                {/* Subtotal - Solo mostrar en desktop o si no es mobile */}
                {!isMobile && (
                  <div className='flex items-center justify-between'>
                    <span className='text-gray-600'>Subtotal</span>
                    <PriceDisplay amount={totalPrice * 100} variant='compact' size='sm' />
                  </div>
                )}

                {/* Envío - Versión compacta para mobile */}
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <Truck className={cn('w-4 h-4 text-gray-500', isMobile && 'w-3 h-3')} />
                    <span className={cn('text-gray-600', isMobile && 'text-sm')}>Envío</span>
                    {qualifiesForFreeShipping && (
                      <Badge variant='success' size={isMobile ? 'xs' : 'sm'}>
                        Gratis
                      </Badge>
                    )}
                  </div>
                  <div className='text-right'>
                    {qualifiesForFreeShipping ? (
                      <span className={cn('text-tenant-success font-medium', isMobile && 'text-sm')}>
                        Gratis
                      </span>
                    ) : (
                      <PriceDisplay
                        amount={actualShippingCost * 100}
                        variant='compact'
                        size={isMobile ? 'xs' : 'sm'}
                      />
                    )}
                  </div>
                </div>

                {/* Descuento */}
                {(discount > 0 || appliedCoupon) && (
                  <div className='flex items-center justify-between text-green-600'>
                    <div className='flex items-center gap-2'>
                      <Percent className={cn('w-4 h-4', isMobile && 'w-3 h-3')} />
                      <span className={cn(isMobile && 'text-sm')}>Descuento</span>
                      {appliedCoupon && (
                        <Badge variant='success' size={isMobile ? 'xs' : 'sm'}>
                          {appliedCoupon.code}
                        </Badge>
                      )}
                    </div>
                    <PriceDisplay
                      amount={-(discount * 100)}
                      variant='compact'
                      size={isMobile ? 'xs' : 'sm'}
                      className='text-green-600'
                    />
                  </div>
                )}

                <Separator />

                {/* Total final */}
                <div
                  className={cn(
                    'flex items-center justify-between font-semibold text-lg',
                    isMobile && 'bg-green-50 p-3 rounded-lg border border-green-200 text-base'
                  )}
                >
                  <div className={cn(isMobile && 'flex flex-col')}>
                    <span className={cn('text-gray-900', isMobile && 'text-lg font-bold')}>
                      Total
                    </span>
                    {isMobile && (
                      <span className='text-xs text-gray-600 uppercase tracking-wide'>
                        Precio final
                      </span>
                    )}
                  </div>
                  <PriceDisplay
                    amount={calculatedFinalTotal * 100}
                    variant='default'
                    size={isMobile ? 'xl' : 'lg'}
                    className={cn('text-tenant-price', isMobile && 'text-2xl font-bold')}
                  />
                </div>
              </div>

              {/* Información de envío detallada - Oculta en mobile */}
              {showShippingDetails && isDetailed && !isMobile && (
                <>
                  <Separator />
                  <ShippingInfo
                    variant='inline'
                    options={[
                      {
                        id: 'free',
                        name: 'Envío gratis',
                        price: 0,
                        estimatedDays: { min: 5, max: 7 },
                        isFree: true,
                        description: 'En compras mayores a $50.000',
                      },
                      {
                        id: 'standard',
                        name: 'Envío estándar',
                        price: 2500,
                        estimatedDays: { min: 3, max: 5 },
                        description: 'Entrega a domicilio',
                      },
                      {
                        id: 'express',
                        name: 'Envío express',
                        price: 10000,
                        estimatedDays: { min: 1, max: 2 },
                        isExpress: true,
                        description: 'Entrega prioritaria',
                      },
                    ]}
                    selectedOption={shippingMethod}
                    showCalculator={false}
                    showGuarantees={true}
                  />
                </>
              )}

              {/* Beneficios - Ocultos en mobile y modo compacto */}
              {!isCompact && !isMobile && (
                <>
                  <Separator />
                  <div className='bg-green-50 p-3 rounded-lg'>
                    <div className='flex items-center gap-2 text-green-700 text-sm'>
                      <Gift className='w-4 h-4' />
                      <span className='font-medium'>Compra protegida</span>
                    </div>
                    <p className='text-xs text-green-600 mt-1'>
                      Tu dinero está protegido con MercadoPago
                    </p>
                  </div>
                </>
              )}

              {/* Botón de checkout - Optimizado para mobile */}
              {onCheckout && (
                <>
                  <Separator />
                  <Button
                    onClick={onCheckout}
                    className={cn('w-full', isMobile && 'h-12 text-base font-semibold')}
                    size='lg'
                    disabled={cartItems.length === 0}
                  >
                    <CreditCard className={cn('w-4 h-4 mr-2', isMobile && 'w-5 h-5')} />
                    {isMobile ? 'Comprar ahora' : 'Proceder al Pago'}
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

CartSummary.displayName = 'CartSummary'
