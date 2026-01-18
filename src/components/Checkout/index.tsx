'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Breadcrumb from '../Common/Breadcrumb'

import Shipping from './Shipping'

import PaymentMethod from './PaymentMethod'
import PaymentMethodSelector from './PaymentMethodSelector'
import Billing from './Billing'
import Coupon from './Coupon'
import UserInfo from './UserInfo'
import { useCheckout } from '@/hooks/useCheckout'
import { trackBeginCheckout } from '@/lib/google-analytics'
import { trackInitiateCheckout } from '@/lib/meta-pixel'
import { trackGoogleAdsBeginCheckout } from '@/lib/google-ads'
import { useUnifiedAnalytics } from '@/components/Analytics/UnifiedAnalyticsProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/ui/form'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Loader2,
  CreditCard,
  AlertTriangle,
  ShoppingCart,
  Truck,
  CheckCircle,
  User,
  MapPin,
  Shield,
  Phone,
  Mail,
  MessageCircle,
  Zap,
  Gift,
  Star,
  Users,
  Clock,
  Eye,
  TrendingUp,
} from '@/lib/optimized-imports'
import MercadoPagoWallet, { MercadoPagoWalletFallback } from './MercadoPagoWallet'
import { CartSummary } from '@/components/ui/cart-summary'
import {
  UrgencyTimer,
  StockIndicator,
  TrustSignals,
  SocialProof,
  PurchaseIncentives,
  ExitIntentModal,
} from './ConversionOptimizer'

const Checkout = () => {
  const router = useRouter()
  const [showExitIntent, setShowExitIntent] = useState(false)
  const [isExpressMode, setIsExpressMode] = useState(true) // ✅ TEMPORAL: Activado por defecto para testing
  const { trackEvent } = useUnifiedAnalytics() // Analytics propio con estrategias anti-bloqueadores

  const {
    formData,
    isLoading,
    errors,
    step,
    cartItems,
    totalPrice,
    shippingCost,
    discount,
    finalTotal,
    appliedCoupon,
    applyCoupon,
    updateBillingData,
    updateShippingData,
    updateFormData,
    processCheckout,
    processExpressCheckout,
    // ✅ Propiedades para Wallet Brick
    preferenceId,
    initPoint,
    handleWalletReady,
    handleWalletError,
    handleWalletSubmit,
  } = useCheckout()

  // ✅ UNIFICADO: Pasos del checkout
  const checkoutSteps = [
    {
      id: 'info',
      title: 'Información',
      description: 'Datos de contacto y envío',
      icon: User,
      isCompleted: step !== 'form',
      isActive: step === 'form',
    },
    {
      id: 'payment',
      title: 'Pago',
      description: 'Método de pago seguro',
      icon: CreditCard,
      isCompleted: step === 'success',
      isActive: step === 'payment',
    },
    {
      id: 'confirmation',
      title: 'Confirmación',
      description: 'Pedido completado',
      icon: CheckCircle,
      isCompleted: step === 'success',
      isActive: step === 'success',
    },
  ]

  // Calcular progreso
  const getProgressValue = () => {
    switch (step) {
      case 'form':
        return 33
      case 'processing':
        return 66
      case 'payment':
        return 66
      case 'redirect':
        return 90
      case 'success':
        return 100
      default:
        return 0
    }
  }

  // ✅ NUEVO: Exit intent detection para conversión
  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !showExitIntent && step === 'form') {
        setShowExitIntent(true)
      }
    }

    document.addEventListener('mouseleave', handleMouseLeave)
    return () => document.removeEventListener('mouseleave', handleMouseLeave)
  }, [showExitIntent, step])

  // Redirigir si el carrito está vacío
  useEffect(() => {
    if (cartItems.length === 0 && step === 'form') {
      router.push('/cart')
    }
  }, [cartItems.length, step, router])

  // 📊 ANALYTICS: Track initiate checkout (solo una vez al cargar)
  useEffect(() => {
    if (cartItems.length > 0 && step === 'form') {
      try {
        // Preparar items para tracking
        const items = cartItems.map((item: any) => ({
          item_id: String(item.id),
          item_name: item.name || item.title || 'Producto',
          item_category: item.brand || item.category || 'Producto',
          price: item.discounted_price || item.price || 0,
          quantity: item.quantity || 1,
        }))

        // Preparar items para Meta Pixel (formato diferente)
        const metaContents = cartItems.map((item: any) => ({
          id: String(item.id),
          quantity: item.quantity || 1,
          item_price: item.discounted_price || item.price || 0,
        }))

        // Google Analytics
        trackBeginCheckout(items, totalPrice, 'ARS')

        // Meta Pixel
        trackInitiateCheckout(metaContents, totalPrice, 'ARS', cartItems.length)

        // Google Ads
        trackGoogleAdsBeginCheckout(totalPrice, 'ARS', items)

        // 📊 Analytics propio - Trackear begin_checkout
        trackEvent('begin_checkout', 'shop', 'begin_checkout', undefined, totalPrice, {
          itemCount: cartItems.length,
          currency: 'ARS',
          items: items,
        })

        console.debug('[Analytics] Initiate checkout tracked:', {
          items: items.length,
          totalValue: totalPrice,
        })
      } catch (analyticsError) {
        console.warn('[Analytics] Error tracking initiate checkout:', analyticsError)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Solo ejecutar una vez al montar el componente

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // ✅ CORREGIDO: Usar la función correcta según el modo
    if (isExpressMode) {
      await processExpressCheckout()
    } else {
      await processCheckout()
    }
  }

  const handlePaymentMethodChange = (method: string) => {
    updateFormData({ paymentMethod: method as 'mercadopago' | 'cash' })
  }

  // ✅ NUEVO: Toggle entre modo normal y express
  const toggleExpressMode = () => {
    setIsExpressMode(!isExpressMode)
  }

  if (step === 'processing') {
    return (
      <>
        <Breadcrumb title={'Checkout'} pages={['checkout']} />
        <section className='overflow-hidden py-8 md:py-20 bg-gray-50'>
          <div className='max-w-4xl w-full mx-auto px-8 sm:px-8 xl:px-0'>
            {/* Progress indicator */}
            <div className='mb-8'>
              <div className='flex items-center justify-between mb-4'>
                <h1 className='text-2xl font-bold text-gray-900'>Checkout</h1>
                <Badge variant='secondary' className='bg-blaze-orange-100 text-blaze-orange-700'>
                  Paso 2 de 3
                </Badge>
              </div>
              <Progress value={getProgressValue()} className='h-2' />
            </div>

            <Card className='max-w-md mx-auto shadow-lg'>
              <CardContent className='p-8 md:p-12 text-center'>
                <div className='flex flex-col items-center gap-6'>
                  <div className='w-20 h-20 rounded-full bg-blaze-orange-100 flex items-center justify-center'>
                    <Loader2 className='w-10 h-10 text-blaze-orange-600 animate-spin' />
                  </div>
                  <div className='space-y-2'>
                    <h2 className='text-xl md:text-2xl font-semibold text-gray-900'>
                      Procesando tu pedido...
                    </h2>
                    <p className='text-gray-600 text-sm md:text-base'>
                      Por favor espera mientras preparamos tu pago seguro.
                    </p>
                  </div>
                  <div className='w-full bg-gray-200 rounded-full h-2'>
                    <div
                      className='bg-blaze-orange-600 h-2 rounded-full animate-pulse'
                      style={{ width: '66%' }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </>
    )
  }

  // ✅ MEJORADO: Paso de pago con Wallet Brick y Design System
  if (step === 'payment') {
    return (
      <>
        <Breadcrumb title={'Checkout - Pago'} pages={['checkout', 'pago']} />
        <section className='overflow-hidden py-8 md:py-20 bg-gray-50'>
          <div className='max-w-6xl w-full mx-auto px-8 sm:px-8 xl:px-0'>
            {/* Progress indicator */}
            <div className='mb-8'>
              <div className='flex items-center justify-between mb-4'>
                <h1 className='text-2xl md:text-3xl font-bold text-gray-900'>Finalizar Pago</h1>
                <Badge variant='secondary' className='bg-blaze-orange-100 text-blaze-orange-700'>
                  Paso 3 de 3
                </Badge>
              </div>
              <Progress value={getProgressValue()} className='h-2' />
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
              {/* Payment Section */}
              <div className='lg:col-span-2'>
                <Card className='shadow-lg'>
                  <CardHeader className='bg-blaze-orange-50 border-b'>
                    <CardTitle className='flex items-center gap-2 text-blaze-orange-700'>
                      <CreditCard className='w-5 h-5' />
                      Método de Pago Seguro
                    </CardTitle>
                    <p className='text-sm text-gray-600 mt-1'>
                      Completa tu compra de forma segura con MercadoPago
                    </p>
                  </CardHeader>
                  <CardContent className='p-6'>
                    {/* Wallet Brick */}
                    {preferenceId ? (
                      <MercadoPagoWallet
                        preferenceId={preferenceId}
                        onReady={handleWalletReady}
                        onError={handleWalletError}
                        onSubmit={handleWalletSubmit}
                        className='min-h-[400px]'
                      />
                    ) : (
                      // Fallback si no hay preferenceId
                      initPoint && <MercadoPagoWalletFallback initPoint={initPoint} />
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Order Summary */}
              <div className='lg:col-span-1'>
                <CartSummary
                  cartItems={cartItems}
                  totalPrice={totalPrice}
                  shippingCost={shippingCost}
                  discount={discount}
                  finalTotal={finalTotal}
                  shippingMethod={formData.shippingMethod}
                  appliedCoupon={appliedCoupon}
                  variant='detailed'
                  showProductCards={false}
                  productCardContext='checkout'
                  className='sticky top-4'
                />
              </div>
            </div>
          </div>
        </section>
      </>
    )
  }

  if (step === 'redirect') {
    return (
      <>
        <Breadcrumb title={'Checkout'} pages={['checkout']} />
        <section className='overflow-hidden py-8 md:py-20 bg-gray-50'>
          <div className='max-w-4xl w-full mx-auto px-8 sm:px-8 xl:px-0'>
            {/* Progress indicator */}
            <div className='mb-8'>
              <div className='flex items-center justify-between mb-4'>
                <h1 className='text-2xl font-bold text-gray-900'>Checkout</h1>
                <Badge variant='secondary' className='bg-yellow-100 text-yellow-700'>
                  Finalizando...
                </Badge>
              </div>
              <Progress value={getProgressValue()} className='h-2' />
            </div>

            <Card className='max-w-md mx-auto shadow-lg'>
              <CardContent className='p-8 md:p-12 text-center'>
                <div className='flex flex-col items-center gap-6'>
                  <div className='w-20 h-20 rounded-full bg-yellow-100 flex items-center justify-center'>
                    <CreditCard className='w-10 h-10 text-yellow-600 animate-pulse' />
                  </div>
                  <div className='space-y-2'>
                    <h2 className='text-xl md:text-2xl font-semibold text-gray-900'>
                      Procesando Pago...
                    </h2>
                    <p className='text-gray-600 text-sm md:text-base'>
                      Tu pago está siendo procesado. Serás redirigido automáticamente.
                    </p>
                  </div>
                  <div className='flex items-center gap-2 text-sm text-gray-500'>
                    <Loader2 className='w-4 h-4 animate-spin' />
                    <span>Conectando con MercadoPago...</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </>
    )
  }

  return (
    <>
      <section className='overflow-hidden py-4 md:py-8 bg-gray-50'>
        <div className='max-w-6xl w-full mx-auto px-4 sm:px-8 xl:px-0'>
          {/* ✅ UNIFICADO: Header con progreso y modo express */}
          <div className='mb-8'>
            <div className='flex items-center justify-between mb-4'>
              <div className='flex items-center gap-4'>
                <h1 className='text-2xl md:text-3xl font-bold text-gray-900'>Checkout</h1>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={toggleExpressMode}
                  className='hidden md:flex items-center gap-2'
                >
                  <Zap className='w-4 h-4' />
                  {isExpressMode ? 'Modo Completo' : 'Modo Express'}
                </Button>
              </div>
              <div className='flex items-center gap-3'>
                <Badge variant='secondary' className='bg-blaze-orange-100 text-blaze-orange-700'>
                  Paso {step === 'form' ? '1' : step === 'payment' ? '2' : '3'} de 3
                </Badge>
                <Button
                  variant='outline'
                  size='sm'
                  className='flex items-center gap-2'
                  onClick={() => window.open('https://wa.me/5493515551234', '_blank')}
                >
                  <MessageCircle className='w-4 h-4' />
                  <span className='hidden md:inline'>Ayuda</span>
                </Button>
              </div>
            </div>
            <Progress value={getProgressValue()} className='h-3' />
          </div>

          {/* ✅ OPTIMIZADO: Elementos de conversión simplificados */}
          <div className='mb-6 space-y-3'>
            {/* Timer de Urgencia */}
            <UrgencyTimer
              initialMinutes={15}
              message='Completa tu compra para mantener el precio y envío gratis desde $50.000'
              variant='warning'
              showProgress={true}
            />

            {/* Trust Signals */}
            <TrustSignals />
          </div>

          <form onSubmit={handleSubmit} role='form'>
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
              {/* Checkout form */}
              <div className='lg:col-span-2 space-y-6'>
                {/* Error general - Mejorado con Design System */}
                {errors.general && (
                  <Card className='border-red-200 bg-red-50 shadow-sm'>
                    <CardContent className='p-4'>
                      <div className='flex items-center gap-3'>
                        <AlertTriangle className='w-5 h-5 text-red-600 flex-shrink-0' />
                        <div>
                          <h4 className='font-medium text-red-800'>Error en el checkout</h4>
                          <p className='text-sm text-red-700 mt-1'>{errors.general}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Error de carrito vacío */}
                {errors.cart && (
                  <Card className='border-yellow-200 bg-yellow-50 shadow-sm'>
                    <CardContent className='p-4'>
                      <div className='flex items-center gap-3'>
                        <ShoppingCart className='w-5 h-5 text-yellow-600 flex-shrink-0' />
                        <p className='text-yellow-800 font-medium'>{errors.cart}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* ✅ SIMPLIFICADO: Formulario optimizado */}
                {isExpressMode ? (
                  /* Modo Express - Formulario ultra simplificado */
                  <Card className='shadow-lg'>
                    <CardHeader className='bg-gradient-to-r from-blaze-orange-50 to-yellow-50 border-b'>
                      <CardTitle className='flex items-center gap-2 text-blaze-orange-700'>
                        <Zap className='w-5 h-5' />
                        Checkout Express
                      </CardTitle>
                      <p className='text-sm text-gray-600 mt-1'>Solo 3 datos y listo</p>
                    </CardHeader>
                    <CardContent className='p-6 space-y-4'>
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        {/* Email */}
                        <div className='space-y-2'>
                          <label className='flex items-center gap-2 text-sm font-medium'>
                            <Mail className='w-4 h-4 text-blaze-orange-600' />
                            Email
                          </label>
                          <input
                            type='email'
                            placeholder='tu@email.com'
                            value={formData.billing.email}
                            onChange={e => updateBillingData({ email: e.target.value })}
                            className='w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent'
                          />
                        </div>

                        {/* Teléfono */}
                        <div className='space-y-2'>
                          <label className='flex items-center gap-2 text-sm font-medium'>
                            <Phone className='w-4 h-4 text-blaze-orange-600' />
                            Teléfono
                          </label>
                          <input
                            type='tel'
                            placeholder='11 1234-5678'
                            value={formData.billing.phone}
                            onChange={e => updateBillingData({ phone: e.target.value })}
                            className='w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent'
                          />
                        </div>
                      </div>

                      {/* Dirección */}
                      <div className='space-y-2'>
                        <label className='flex items-center gap-2 text-sm font-medium'>
                          <MapPin className='w-4 h-4 text-blaze-orange-600' />
                          Dirección completa
                        </label>
                        <input
                          type='text'
                          placeholder='Calle 123, Ciudad, Provincia'
                          value={formData.billing.streetAddress}
                          onChange={e => updateBillingData({ streetAddress: e.target.value })}
                          className='w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent'
                        />
                      </div>

                      {/* Payment Method Express */}
                      <div className='space-y-3'>
                        <PaymentMethodSelector
                          selectedMethod={formData.paymentMethod}
                          onMethodChange={handlePaymentMethodChange}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  /* Modo Completo - Formulario tradicional */
                  <>
                    {/* Billing details */}
                    <Card className='shadow-sm'>
                      <CardHeader className='bg-blaze-orange-50 border-b'>
                        <CardTitle className='flex items-center gap-2 text-blaze-orange-700'>
                          <User className='w-5 h-5' />
                          Información de Facturación
                        </CardTitle>
                      </CardHeader>
                      <CardContent className='p-6'>
                        <Billing
                          billingData={formData.billing}
                          errors={errors}
                          onBillingChange={updateBillingData}
                        />
                      </CardContent>
                    </Card>

                    {/* Shipping address */}
                    <Card className='shadow-sm'>
                      <CardHeader className='bg-blue-50 border-b'>
                        <CardTitle className='flex items-center gap-2 text-blue-700'>
                          <Truck className='w-5 h-5' />
                          Dirección de Envío
                        </CardTitle>
                      </CardHeader>
                      <CardContent className='p-6'>
                        <Shipping
                          shippingData={formData.shipping}
                          billingData={formData.billing}
                          errors={errors}
                          onShippingChange={updateShippingData}
                        />
                      </CardContent>
                    </Card>

                    {/* Payment method */}
                    <Card className='shadow-sm'>
                      <CardHeader className='bg-purple-50 border-b'>
                        <CardTitle className='flex items-center gap-2 text-purple-700'>
                          <CreditCard className='w-5 h-5' />
                          Método de Pago
                        </CardTitle>
                      </CardHeader>
                      <CardContent className='p-6'>
                        <PaymentMethodSelector
                          selectedMethod={formData.paymentMethod}
                          onMethodChange={handlePaymentMethodChange}
                        />
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>

              {/* ✅ SIMPLIFICADO: Sidebar optimizado */}
              <div className='lg:col-span-1 space-y-4'>
                {/* Stock Indicator - Solo elemento principal */}
                <StockIndicator
                  quantity={3}
                  lowStockThreshold={5}
                  viewers={0}
                  recentPurchases={0}
                  showSocialProof={false}
                />

                {/* Order summary - CartSummary del Design System */}
                <CartSummary
                  cartItems={cartItems}
                  totalPrice={totalPrice}
                  shippingCost={shippingCost}
                  discount={discount}
                  finalTotal={finalTotal}
                  shippingMethod='free'
                  appliedCoupon={appliedCoupon}
                  variant='detailed'
                  showProductCards={false}
                  productCardContext='checkout'
                  className='sticky top-4'
                />

                {/* Social Proof sutil */}
                <SocialProof showTestimonials={false} />

                {/* Coupon simplificado */}
                <Card className='shadow-sm'>
                  <CardContent className='p-4'>
                    <Coupon
                      onCouponApply={applyCoupon}
                      appliedCoupon={appliedCoupon}
                      isLoading={isLoading}
                    />
                  </CardContent>
                </Card>

                {/* Checkout button - Simplificado */}
                <Card className='shadow-lg border-2 border-yellow-200'>
                  <CardContent className='p-4'>
                    <Button
                      type='submit'
                      disabled={isLoading || cartItems.length === 0}
                      className={`w-full h-16 text-2xl font-bold transition-all duration-200 ${
                        isLoading || cartItems.length === 0
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-blaze-orange-600 hover:bg-blaze-orange-700 text-white shadow-lg hover:shadow-xl'
                      }`}
                    >
                      {isLoading ? (
                        <div className='flex items-center gap-2'>
                          <Loader2 className='w-6 h-6 animate-spin' />
                          Procesando...
                        </div>
                      ) : (
                        <div className='flex items-center gap-2'>
                          <CreditCard className='w-6 h-6' />
                          FINALIZAR COMPRA - ${finalTotal ? finalTotal.toLocaleString() : '0'}
                        </div>
                      )}
                    </Button>

                    {/* Trust indicators simplificados */}
                    <div className='mt-3 flex items-center justify-center gap-4 text-sm text-gray-600'>
                      <div className='flex items-center gap-1'>
                        <Shield className='w-4 h-4 text-green-600' />
                        <span>Pago Seguro</span>
                      </div>
                      <div className='flex items-center gap-1'>
                        <Truck className='w-4 h-4 text-blue-600' />
                        <span>Envío Gratis +$50.000</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </div>

        {/* ✅ NUEVO: Exit Intent Modal para conversión */}
        {showExitIntent && (
          <ExitIntentModal
            onClose={() => setShowExitIntent(false)}
            onAccept={() => {
              setShowExitIntent(false)
              // TODO: Aplicar descuento del 10%
              // applyCoupon('EXIT10');
            }}
            discount={10}
          />
        )}
      </section>
    </>
  )
}

export default Checkout
