'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useCheckout } from '@/hooks/useCheckout'
// Eliminado useMobileCheckoutNavigation para evitar cambios en el orden de hooks
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import {
  Loader2,
  CreditCard,
  ShoppingCart,
  Truck,
  Shield,
  CheckCircle,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
} from '@/lib/optimized-imports'
import ExpressForm from './ExpressForm'
import PaymentMethodSelector from './PaymentMethodSelector'
import MercadoPagoWallet, { MercadoPagoWalletFallback } from './MercadoPagoWallet'
import { SimplifiedOrderSummary } from '@/components/ui/simplified-order-summary'
import { formatCurrency } from '@/lib/utils/consolidated-utils'

interface CheckoutExpressProps {
  onBackToCart?: () => void
}

const CheckoutExpress: React.FC<CheckoutExpressProps> = ({ onBackToCart }) => {
  const router = useRouter()

  // ✅ CORREGIDO: Todos los hooks deben ejecutarse SIEMPRE en el mismo orden
  // Ejecutar useCheckout sin try/catch para evitar returns tempranos
  const {
    formData,
    isLoading,
    errors,
    step,
    preferenceId,
    initPoint,
    cartItems,
    totalPrice,
    shippingCost,
    discount,
    finalTotal,
    appliedCoupon,
    updateFormData,
    updateBillingData,
    validateExpressForm,
    processExpressCheckout,
    processCashOnDelivery,
    cashOrderData,
    handleWalletReady,
    handleWalletError,
    handleWalletSubmit,
  } = useCheckout()

  console.log('🔍 CheckoutExpress hook values:', {
    finalTotal,
    totalPrice,
    cartItems: cartItems?.length,
    typeof_finalTotal: typeof finalTotal,
    shippingCost,
    discount,
  })

  // Validación defensiva temporal
  if (finalTotal === undefined || finalTotal === null) {
    console.error('❌ finalTotal is undefined/null, using fallback value 0')
  }

  const [isFormValid, setIsFormValid] = useState(false)
  const [showCartSummary, setShowCartSummary] = useState(false)

  // Navegación móvil simplificada para mantener orden estable de hooks
  const containerRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [isInteracting, setIsInteracting] = useState(false)
  const goBack = () => router.back()
  const triggerHapticFeedback = () => {
    try {
      if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
        navigator.vibrate?.(10)
      }
    } catch {}
  }

  useEffect(() => {
    const updateIsMobile = () => {
      try {
        const userAgent = navigator.userAgent.toLowerCase()
        const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(
          userAgent
        )
        const isSmallScreen = window.innerWidth < 768
        setIsMobile(isMobileDevice || isSmallScreen)
      } catch {}
    }
    updateIsMobile()
    window.addEventListener('resize', updateIsMobile)
    return () => window.removeEventListener('resize', updateIsMobile)
  }, [])

  // Validación usando la función del hook
  useEffect(() => {
    const isValid = validateExpressForm()
    console.log('🔍 Validación del formulario:', {
      isValid,
      firstName: formData.billing.firstName,
      lastName: formData.billing.lastName,
      dni: formData.billing.dni,
      email: formData.billing.email,
      phone: formData.billing.phone,
      streetAddress: formData.billing.streetAddress,
      cartItemsLength: cartItems.length,
      paymentMethod: formData.paymentMethod,
    })
    setIsFormValid(isValid)
  }, [
    formData.billing.firstName,
    formData.billing.lastName,
    formData.billing.dni,
    formData.billing.email,
    formData.billing.phone,
    formData.billing.streetAddress,
    cartItems.length,
    formData.paymentMethod,
  ])

  // Redireccionar si el carrito está vacío SOLO si no estamos en proceso de pago
  useEffect(() => {
    console.log('🔍 CheckoutExpress - Cart check:', {
      cartItemsLength: cartItems.length,
      step,
      shouldRedirect: cartItems.length === 0 && step === 'form',
    })

    if (cartItems.length === 0 && step === 'form') {
      // Solo redirigir si estamos en el formulario inicial
      // No redirigir si estamos procesando, en pago o redirigiendo
      console.log('🔄 CheckoutExpress - Redirigiendo a carrito porque está vacío y estamos en form')
      // Usar setTimeout para evitar interferir con el ciclo de renderizado de React
      setTimeout(() => {
        router.push('/cart')
      }, 0)
    }
  }, [cartItems.length, router, step])

  // Logging adicional para rastrear cambios en el carrito
  useEffect(() => {
    console.log('🛒 CheckoutExpress - Cart items changed:', {
      count: cartItems.length,
      step,
      items: cartItems.map(item => ({ id: item.id, title: item.title, quantity: item.quantity })),
    })
  }, [cartItems, step])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Validar en el momento del submit para evitar desfase de estado
    const currentValid = validateExpressForm()
    if (!currentValid || isLoading) return

    try {
      if (formData.paymentMethod === 'cash') {
        // Procesar pago contra entrega
        await processCashOnDelivery()
      } else {
        // Procesar pago con MercadoPago (flujo existente)
        await processExpressCheckout()
      }
    } catch (error) {
      console.error('Error en handleSubmit:', error)
      // Los errores ya son manejados por los hooks individuales
    }
  }

  const handleFieldChange = (field: string, value: string) => {
    updateBillingData({ [field]: value })
  }

  const getProgressValue = (): number => {
    switch (step) {
      case 'form':
        return 33
      case 'processing':
        return 66
      case 'redirect':
        return 100
      default:
        return 0
    }
  }

  // ✅ ELIMINADO: Return temprano que causaba el error de hooks
  // Todo el contenido se movió a renderStepContent() para evitar inconsistencias

  // useEffect para manejar redirección automática a MercadoPago
  useEffect(() => {
    if (step === 'redirect' && initPoint) {
      console.log('🔄 CheckoutExpress - Preparando redirección a MercadoPago:', initPoint)

      // Redirigir automáticamente después de 3 segundos
      const redirectTimer = setTimeout(() => {
        console.log('🔄 CheckoutExpress - Redirigiendo a MercadoPago')
        window.location.href = initPoint
      }, 3000)

      // Cleanup del timer si el componente se desmonta
      return () => clearTimeout(redirectTimer)
    }
  }, [step, initPoint])

  // Redirección segura para flujo de contra entrega (cash_success)
  useEffect(() => {
    if (step === 'cash_success' && cashOrderData) {
      try {
        const safeTotal = String(cashOrderData.order?.total ?? finalTotal ?? 0)
        const params = new URLSearchParams({
          // Mostrar número de orden amigable si existe
          orderId: String(
            cashOrderData.order?.order_number ?? cashOrderData.orderId ?? ''
          ),
          total: safeTotal,
          // El servicio de cash order devuelve whatsapp_url (snake_case)
          whatsappUrl: String(
            cashOrderData.whatsapp_url ?? cashOrderData.order?.whatsapp_url ?? ''
          ),
          // Usar datos del formulario para mayor confiabilidad
          customerName: String(
            `${formData?.billing?.firstName ?? ''} ${formData?.billing?.lastName ?? ''}`.trim()
          ),
          phone: String(formData?.billing?.phone ?? ''),
        })
        router.push(`/checkout/cash-success?${params.toString()}`)
      } catch (error) {
        console.error('⚠️ Error construyendo URL de cash_success:', error, cashOrderData)
      }
    }
  }, [step, cashOrderData, finalTotal, router])

  // ✅ FUNCIÓN PARA RENDERIZAR CONTENIDO BASADO EN STEP
  // Esto evita returns tempranos y asegura que todos los hooks se ejecuten
  const renderStepContent = () => {
    // Renderizar estado de procesamiento
    if (step === 'processing') {
      return (
        <section className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4'>
          <Card className='w-full max-w-md shadow-2xl'>
            <CardContent className='p-8 text-center'>
              <div className='space-y-6'>
                <div className='w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center'>
                  <Loader2 className='w-8 h-8 text-blue-600 animate-spin' />
                </div>
                <div>
                  <h2 className='text-2xl font-bold text-gray-900 mb-2'>Procesando tu pedido</h2>
                  <p className='text-gray-600'>
                    Estamos preparando tu pago. Por favor, espera un momento.
                  </p>
                </div>
                <div className='flex items-center justify-center gap-2 text-sm text-gray-500'>
                  <Loader2 className='w-4 h-4 animate-spin' />
                  <span>Configurando método de pago...</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      )
    }

    // Renderizar estado de redirección a MercadoPago
    if (step === 'redirect') {
      return (
        <section className='min-h-screen bg-gradient-to-br from-blue-50 to-yellow-50 flex items-center justify-center p-4'>
          <Card className='w-full max-w-md shadow-2xl'>
            <CardContent className='p-8 text-center'>
              <div className='space-y-6'>
                <div className='w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center'>
                  <CreditCard className='w-8 h-8 text-blue-600' />
                </div>
                <div>
                  <h2 className='text-2xl font-bold text-gray-900 mb-2'>¡Pedido Procesado!</h2>
                  <p className='text-gray-600 mb-4'>
                    Tu pedido ha sido procesado exitosamente. Te estamos redirigiendo a MercadoPago
                    para completar el pago de forma segura.
                  </p>
                  <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                    <div className='flex items-center gap-2 text-blue-700 text-sm font-medium mb-2'>
                      <Shield className='w-4 h-4' />
                      <span>Pago 100% Seguro</span>
                    </div>
                    <p className='text-blue-600 text-sm'>
                      MercadoPago protege tus datos con encriptación SSL y cumple con los más altos
                      estándares de seguridad.
                    </p>
                  </div>
                </div>
                <div className='flex items-center justify-center gap-2 text-sm text-gray-500'>
                  <Loader2 className='w-4 h-4 animate-spin' />
                  <span>Redirigiendo en 3 segundos...</span>
                </div>
                {/* Botón manual por si la redirección automática falla */}
                {initPoint && (
                  <Button
                    onClick={() => (window.location.href = initPoint)}
                    className='w-full bg-blue-600 hover:bg-blue-700 text-white'
                  >
                    Continuar a MercadoPago
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </section>
      )
    }

    // Pantalla de éxito para pago contra entrega
    if (step === 'cash_success') {
      // Render de transición mientras se realiza la redirección por efecto
      return (
        <section className='min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4'>
          <Card className='w-full max-w-md shadow-2xl'>
            <CardContent className='p-8 text-center'>
              <div className='space-y-6'>
                <div className='w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center'>
                  <CheckCircle className='w-8 h-8 text-green-600' />
                </div>
                <div>
                  <h2 className='text-2xl font-bold text-gray-900 mb-2'>¡Pedido confirmado!</h2>
                  <p className='text-gray-600'>
                    Tu pedido ha sido registrado exitosamente. Te contactaremos por WhatsApp para coordinar la entrega.
                  </p>
                </div>
                <div className='flex items-center justify-center gap-2 text-sm text-gray-500'>
                  <Loader2 className='w-4 h-4 animate-spin' />
                  <span>Redirigiendo a confirmación...</span>
                </div>
                <Button
                  onClick={() => router.push('/')}
                  className='w-full bg-green-600 hover:bg-green-700 text-white'
                >
                  Continuar comprando
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      )
    }

    // ✅ STEP 'PAYMENT' ELIMINADO COMPLETAMENTE
    // Ahora el hook va directamente de 'processing' a 'redirect'
    // Esto evita completamente el problema de hooks con MercadoPagoWallet

    // Renderizar formulario principal (Mobile-First Checkout) - caso por defecto
    return (
      <section className='min-h-screen bg-gradient-to-br from-green-50 to-blue-50'>
        <div
          ref={containerRef}
          className={cn(
            'max-w-md mx-auto px-4 py-4 transition-all duration-200',
            isInteracting && isMobile && 'scale-[0.99] opacity-95'
          )}
        >

          {/* Errores generales */}
          {errors.general && (
            <Card className='border-red-200 bg-red-50 shadow-sm mb-4'>
              <CardContent className='p-4'>
                <div className='flex items-center gap-3'>
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
            <Card className='border-yellow-200 bg-yellow-50 shadow-sm mb-4'>
              <CardContent className='p-4'>
                <div className='flex items-center gap-3'>
                  <ShoppingCart className='w-5 h-5 text-yellow-600 flex-shrink-0' />
                  <p className='text-yellow-800 font-medium'>{errors.cart}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Selector de Método de Pago */}
          <div className='mb-6'>
            <div className='flex items-center justify-between mb-4 px-4'>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => {
                  if (onBackToCart) {
                    onBackToCart()
                  } else {
                    router.push('/cart')
                  }
                }}
                className={cn(
                  'flex items-center gap-2 p-3 rounded-full bg-white/80 backdrop-blur-sm shadow-sm transition-all',
                  isMobile && 'active:scale-95 hover:bg-white/90'
                )}
              >
                <ArrowLeft className='w-5 h-5' />
              </Button>
              <div className="flex-1 text-center">
                <h3 className="text-xl font-bold text-gray-900">Método de Pago</h3>
                <p className="text-base text-gray-600">Elegí cómo querés pagar</p>
              </div>
              <div className='w-11' /> {/* Spacer */}
            </div>
            <PaymentMethodSelector
              selectedMethod={formData.paymentMethod}
              onMethodChange={method =>
                updateFormData({ paymentMethod: method as 'mercadopago' | 'cash' })
              }
            />
          </div>

          {/* Formulario simplificado */}
          <Card className='mb-6' data-testid='checkout-form'>
            <CardContent className='p-4'>
              <ExpressForm
                formData={{
                  firstName: formData.billing.firstName,
                  lastName: formData.billing.lastName,
                  dni: formData.billing.dni || '',
                  email: formData.billing.email,
                  phone: formData.billing.phone,
                  streetAddress: formData.billing.streetAddress,
                  observations: formData.billing.observations,
                }}
                errors={errors}
                onFieldChange={handleFieldChange}
                onSubmit={handleSubmit}
                isProcessing={isLoading}
                paymentMethod={formData.paymentMethod}
                onPaymentMethodChange={method =>
                  updateFormData({ paymentMethod: method as 'mercadopago' | 'cash' })
                }
                isFormValid={isFormValid}
              />
            </CardContent>
          </Card>

          {/* Resumen del carrito colapsible - Movido antes del botón de pagar */}
          <Card className='mb-6 bg-white/90 backdrop-blur-sm shadow-lg border-0'>
            <CardContent className='p-0'>
              <button
                type='button'
                data-testid='cart-summary-toggle'
                onClick={() => {
                  triggerHapticFeedback('medium')
                  setShowCartSummary(!showCartSummary)
                }}
                className={cn(
                  'w-full p-6 flex items-center justify-between text-left transition-all rounded-lg',
                  isMobile && 'active:scale-[0.98] touch-manipulation hover:bg-gray-50/50'
                )}
              >
                <div className='flex items-center gap-4'>
                  <div className='w-12 h-12 rounded-full bg-green-100 flex items-center justify-center'>
                    <ShoppingCart className='w-6 h-6 text-green-600' />
                  </div>
                  <div>
                    <span className='font-semibold text-gray-900 block text-lg'>
                      Resumen del Pedido
                    </span>
                    <span className='text-sm text-gray-600' data-testid='cart-items-count'>
                      {cartItems.length} {cartItems.length === 1 ? 'producto' : 'productos'}
                    </span>
                  </div>
                </div>
                <div className='flex items-center gap-4'>
                  <div className='text-right'>
                    <span className='font-bold text-2xl text-green-600' data-testid='final-total'>
                      {formatCurrency(finalTotal || 0)}
                    </span>
                    <div className='text-xs text-gray-500 uppercase tracking-wide'>Total</div>
                  </div>
                  <div className='w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center'>
                    {showCartSummary ? (
                      <ChevronUp className='w-5 h-5 text-gray-600' />
                    ) : (
                      <ChevronDown className='w-5 h-5 text-gray-600' />
                    )}
                  </div>
                </div>
              </button>
              {showCartSummary && (
                <div className='px-6 pb-6' data-testid='cart-summary-details'>
                  <div className='border-t pt-6'>
                    <SimplifiedOrderSummary
                      items={cartItems.map(item => ({
                        id: item.id,
                        title: item.title,
                        price: item.price,
                        discountedPrice: item.discountedPrice,
                        quantity: item.quantity,
                        image: item.image,
                        imgs: item.imgs
                      }))}
                      subtotal={totalPrice}
                      shipping={shippingCost}
                      total={finalTotal}
                      freeShippingThreshold={50000}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Botón de finalizar compra - Optimizado para móviles y sin leyendas de seguridad */}
          <div className='sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent pt-6 pb-4 -mx-4 px-4'>
            <Button
              type='submit'
              form='express-checkout-form'
              size='lg'
              data-testid='submit-order'
              disabled={isLoading}
              className={cn(
                'w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-200',
                isMobile && 'active:scale-[0.98] touch-manipulation min-h-[64px] rounded-xl',
                isLoading && 'cursor-not-allowed opacity-75',
                !isFormValid && 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed'
              )}
            >
              {isLoading ? (
                <div className='flex items-center gap-3'>
                  <Loader2 className='w-6 h-6 animate-spin' />
                  <span className='text-lg'>Procesando pago...</span>
                </div>
              ) : (
                <div className='flex items-center gap-3'>
                  <CreditCard className='w-6 h-6' />
                  <div className='text-center'>
                    <div className='text-lg font-bold'>
                      Confirmar Pedido ({formatCurrency(finalTotal || 0)})
                    </div>
                  </div>
                </div>
              )}
            </Button>
          </div>
        </div>
      </section>
    )
  }

  // ✅ RENDERIZAR CONTENIDO BASADO EN STEP - EVITA RETURNS TEMPRANOS
  return renderStepContent()
}

export default CheckoutExpress
