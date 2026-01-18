'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ProgressIndicator } from './UXOptimizers'
import { useMetaCheckout, MetaCheckoutStep } from '@/hooks/useMetaCheckout'
import { SimplifiedOrderSummary } from '@/components/ui/simplified-order-summary'
import { CartSummaryFooter } from './CartSummaryFooter'
// Testimonios removidos del checkout para mantener túnel de compra limpio
// import Testimonials from '@/components/Home-v2/Testimonials'
import PaymentMethodSelector from '../PaymentMethodSelector'
import MercadoPagoWallet, { MercadoPagoWalletFallback } from '../MercadoPagoWallet'
import {
  ArrowLeft,
  ArrowRight,
  Phone,
  User,
  MapPin,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Loader2,
  ShoppingCart,
  MessageSquare,
} from '@/lib/optimized-imports'
import { cn } from '@/lib/utils'
import { trackCustomEvent } from '@/lib/meta-pixel'
import { trackEvent, trackBeginCheckout } from '@/lib/google-analytics'
import { trackInitiateCheckout } from '@/lib/meta-pixel'
import { useAnalytics } from '@/hooks/useAnalytics'
import { trackGoogleAdsBeginCheckout } from '@/lib/google-ads'
import Image from 'next/image'
import { validateDNI, formatCurrency } from '@/lib/utils/consolidated-utils'
import { AddressMapSelectorAdvanced } from '@/components/ui/AddressMapSelectorAdvanced'

const STEP_LABELS: Record<MetaCheckoutStep, string> = {
  summary: 'Resumen',
  contact: 'Contacto',
  shipping: 'Envío',
  payment: 'Pago',
  confirmation: 'Confirmación',
}

const STEP_ORDER: MetaCheckoutStep[] = ['summary', 'contact', 'shipping', 'payment', 'confirmation']

export const MetaCheckoutWizard: React.FC = () => {
  const router = useRouter()
  const { trackEcommerceEvent } = useAnalytics()
  // ✅ AGREGAR: Estado para controlar la pantalla de loading durante redirección
  const [isRedirecting, setIsRedirecting] = useState(false)
  
  const {
    state,
    cartItems = [],
    totalPrice = 0,
    isLoading,
    errors,
    nextStep,
    previousStep,
    goToStep,
    updateContact,
    updateShipping,
    updatePaymentMethod,
    processCheckout,
    canProceed,
    // ✅ CORREGIR: Obtener estado de useCheckout desde useMetaCheckout (misma instancia)
    checkoutStep, // step del checkout principal (form, cash_success, etc.)
    cashOrderData, // datos de la orden de cash on delivery
    finalTotal, // total final calculado
    initPoint, // URL de redirección a MercadoPago
  } = useMetaCheckout()

  // ✅ ELIMINAR: Ya no necesitamos llamar a useCheckout() directamente
  // Esto causaba que MetaCheckoutWizard usara una instancia diferente del estado
  // Ahora usamos la misma instancia a través de useMetaCheckout

  const currentStepIndex = STEP_ORDER.indexOf(state.currentStep)

  // Obtener el slug del producto desde sessionStorage para navegación de vuelta
  const getBuyPageSlug = (): string | null => {
    if (typeof window === 'undefined') return null
    return sessionStorage.getItem('last_buy_page_slug')
  }

  // Redirigir si el carrito está vacío
  useEffect(() => {
    if (!isLoading && Array.isArray(cartItems) && cartItems.length === 0 && state.currentStep === 'summary') {
      router.push('/cart')
    }
  }, [cartItems, isLoading, state.currentStep, router])

  // Función para manejar el botón de volver
  const handleBackNavigation = () => {
    if (currentStepIndex > 0) {
      previousStep()
    } else {
      // Intentar volver a /buy/[slug] si existe el slug guardado
      const buySlug = getBuyPageSlug()
      if (buySlug) {
        router.push(`/buy/${buySlug}`)
      } else {
        // Si no hay slug, intentar volver atrás en el historial
        router.back()
      }
    }
  }

  // 📊 ANALYTICS: Track begin_checkout cuando se carga el checkout (solo una vez)
  useEffect(() => {
    if (cartItems.length > 0 && state.currentStep === 'summary' && totalPrice > 0) {
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
        trackEcommerceEvent('begin_checkout', {
          value: totalPrice,
          currency: 'ARS',
          num_items: cartItems.length,
          items: items,
        })

        console.debug('[Analytics] Begin checkout tracked:', {
          itemsCount: cartItems.length,
          totalPrice,
        })
      } catch (error) {
        console.error('[Analytics] Error tracking begin_checkout:', error)
      }
    }
  }, [cartItems.length, state.currentStep, totalPrice]) // Solo cuando cambian estos valores

  // Trackear progreso del checkout
  useEffect(() => {
    trackCustomEvent('CheckoutStepViewed', {
      step: state.currentStep,
      step_number: currentStepIndex + 1,
      total_steps: STEP_ORDER.length,
    })

    trackEvent('checkout_step_viewed', 'checkout', state.currentStep, currentStepIndex + 1, {
      total_steps: STEP_ORDER.length,
    })
  }, [state.currentStep, currentStepIndex])

  // Scroll al top cuando cambia el paso (especialmente importante para el paso de pago)
  useEffect(() => {
    // Para el paso de pago, hacer scroll inmediato sin delay
    if (state.currentStep === 'payment') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      // Para otros pasos, pequeño delay para asegurar que el DOM se haya actualizado
      const scrollTimer = setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }, 100)
      return () => clearTimeout(scrollTimer)
    }
  }, [state.currentStep])

  // Manejar redirección a MercadoPago cuando el checkout principal esté listo
  useEffect(() => {
    if (checkoutStep === 'redirect' && initPoint) {
      console.log('🔄 MetaCheckoutWizard - Preparando redirección a MercadoPago:', initPoint)

      // Redirigir automáticamente después de un breve delay
      const redirectTimer = setTimeout(() => {
        console.log('🔄 MetaCheckoutWizard - Redirigiendo a MercadoPago')
        window.location.href = initPoint
      }, 2000)

      // Cleanup del timer si el componente se desmonta
      return () => clearTimeout(redirectTimer)
    }
  }, [checkoutStep, initPoint])

  // Manejar redirección para pago contra entrega (cash_success)
  useEffect(() => {
    console.log('🔍 MetaCheckoutWizard - useEffect cash_success ejecutado:', {
      checkoutStep,
      hasCashOrderData: !!cashOrderData,
      cashOrderDataType: typeof cashOrderData,
      cashOrderDataKeys: cashOrderData ? Object.keys(cashOrderData as any) : [],
      cashOrderData: cashOrderData ? JSON.stringify(cashOrderData).substring(0, 200) : 'null'
    })

    // ✅ CORREGIR: Verificar condiciones de forma más robusta
    if (checkoutStep === 'cash_success') {
      console.log('✅ MetaCheckoutWizard - checkoutStep es cash_success, verificando cashOrderData...')
      
      // ✅ Si no hay cashOrderData todavía, intentar obtenerlo de localStorage
      let effectiveCashOrderData = cashOrderData
      
      if (!effectiveCashOrderData && typeof window !== 'undefined') {
        try {
          const savedCashOrderData = localStorage.getItem('cashOrderData')
          if (savedCashOrderData) {
            effectiveCashOrderData = JSON.parse(savedCashOrderData)
            console.log('📦 MetaCheckoutWizard - cashOrderData recuperado de localStorage')
          }
        } catch (e) {
          console.error('⚠️ Error leyendo cashOrderData de localStorage:', e)
        }
      }

      if (effectiveCashOrderData) {
        console.log('✅ MetaCheckoutWizard - Condiciones cumplidas, preparando redirección')
        
        // ✅ AGREGAR: Marcar que estamos redirigiendo
        setIsRedirecting(true)
        
        // ✅ Usar setTimeout para asegurar que el estado se haya actualizado completamente
        const redirectTimer = setTimeout(() => {
          try {
            // Acceder a los datos de forma segura (cashOrderData puede tener estructura diferente)
            // La API retorna: { order: {...}, items: [...], whatsapp_url: "...", whatsapp_message: "..." }
            const orderData = (effectiveCashOrderData as any)?.order || effectiveCashOrderData
            const safeTotal = String(orderData?.total ?? finalTotal ?? 0)
            
            // ✅ CORREGIR: whatsapp_url está en el nivel superior de cashOrderData, no en order
            const whatsappUrl = String(
              (effectiveCashOrderData as any)?.whatsapp_url ?? 
              orderData?.whatsapp_url ?? 
              ''
            )
            
            const orderId = String(
              orderData?.order_number ?? 
              (effectiveCashOrderData as any)?.orderId ?? 
              orderData?.id ?? 
              ''
            )

            console.log('🔍 MetaCheckoutWizard - Datos extraídos:', {
              orderId,
              safeTotal,
              whatsappUrl: whatsappUrl.substring(0, 100) + '...',
              hasWhatsappUrl: !!whatsappUrl
            })

            if (!orderId || !whatsappUrl) {
              console.warn('⚠️ MetaCheckoutWizard - Faltan datos críticos para redirección:', {
                orderId,
                whatsappUrl: !!whatsappUrl
              })
              setIsRedirecting(false)
              return
            }

            const params = new URLSearchParams({
              orderId,
              total: safeTotal,
              whatsappUrl,
              // Usar datos del formulario para mayor confiabilidad
              customerName: String(
                `${state.formData.contact.firstName ?? ''} ${state.formData.contact.lastName ?? ''}`.trim()
              ),
              phone: String(state.formData.contact.phone ?? ''),
            })
            
            console.log('🔄 MetaCheckoutWizard - Redirigiendo a cash-success:', params.toString())
            router.push(`/checkout/cash-success?${params.toString()}`)
            
            // ✅ AGREGAR: Mantener loading por un tiempo adicional para que la página cargue
            // Esto evita que el usuario vea cuando se limpia el carrito
            setTimeout(() => {
              setIsRedirecting(false)
            }, 1500) // 1.5 segundos adicionales después de la redirección
          } catch (error) {
            console.error('⚠️ Error construyendo URL de cash_success:', error, effectiveCashOrderData)
            setIsRedirecting(false)
          }
        }, 150) // Pequeño delay para asegurar que el estado esté actualizado

        return () => clearTimeout(redirectTimer)
      } else {
        console.log('⏳ MetaCheckoutWizard - Esperando cashOrderData...')
      }
    } else {
      console.log('⏳ MetaCheckoutWizard - Esperando checkoutStep cash_success. Actual:', checkoutStep)
    }
  }, [checkoutStep, cashOrderData, finalTotal, router, state.formData.contact])

  const handleStepComplete = () => {
    trackCustomEvent('CheckoutStepCompleted', {
      step: state.currentStep,
      step_number: currentStepIndex + 1,
    })

    trackEvent('checkout_step_completed', 'checkout', state.currentStep, currentStepIndex + 1)

    if (state.currentStep === 'confirmation') {
      processCheckout()
    } else {
      nextStep()
    }
  }

  const renderStepContent = () => {
    switch (state.currentStep) {
      case 'summary':
        return <SummaryStep cartItems={cartItems} totalPrice={totalPrice} />

      case 'contact':
        return (
          <ContactStep
            formData={state.formData.contact}
            errors={errors}
            onUpdate={updateContact}
          />
        )

              case 'shipping':
                return (
                  <ShippingStep
                    formData={{
                      streetAddress: state.formData.shipping.streetAddress,
                      ...(state.formData.shipping.apartment && { apartment: state.formData.shipping.apartment }),
                      ...(state.formData.shipping.observations && { observations: state.formData.shipping.observations }),
                      ...(state.formData.shipping.isValidated !== undefined && { isValidated: state.formData.shipping.isValidated }),
                    }}
                    errors={errors}
                    onUpdate={updateShipping}
                  />
                )

      case 'payment':
        return (
          <PaymentStep
            paymentMethod={state.formData.paymentMethod}
            onPaymentMethodChange={updatePaymentMethod}
            isLoading={isLoading}
          />
        )

      case 'confirmation':
        return (
          <ConfirmationStep
            cartItems={cartItems}
            totalPrice={totalPrice}
            formData={state.formData}
          />
        )

      default:
        return null
    }
  }

  // ✅ MODIFICAR: Determinar si mostrar pantalla de loading full-screen
  // Se muestra cuando está procesando el pago, cuando está en cash_success pero aún no hay datos,
  // o cuando está redirigiendo a la página de success
  const showFullScreenLoading = isLoading || isRedirecting || (checkoutStep === 'cash_success' && !cashOrderData)

  return (
    <>
      {/* ✅ AGREGAR: Pantalla de loading full-screen */}
      {showFullScreenLoading && (
        <div className='fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center'>
          <div className='text-center space-y-4 px-4'>
            <Loader2 className='w-16 h-16 animate-spin text-green-600 mx-auto' />
            <div className='space-y-2'>
              <h2 className='text-2xl font-bold text-gray-900'>Procesando tu pedido...</h2>
              <p className='text-gray-600 max-w-md mx-auto'>
                Por favor espera, esto puede tomar unos segundos
              </p>
            </div>
          </div>
        </div>
      )}

      <div className='min-h-screen'>
        {/* Header con progreso - Fixed arriba */}
        <div className='fixed top-0 left-0 right-0 z-50 shadow-md'>
          <div className='max-w-4xl mx-auto px-3 pt-3 pb-0'>
            <div className='bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-sm border border-gray-200/50'>
              <div className='flex items-center justify-between mb-4'>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={handleBackNavigation}
                  className='flex items-center gap-2 text-gray-800 hover:text-gray-900 hover:bg-gray-100 font-medium'
                >
                  <ArrowLeft className='w-4 h-4' />
                  {currentStepIndex > 0 ? 'Atrás' : 'Carrito'}
                </Button>
                <Badge variant='secondary' className='bg-blue-600 text-white font-semibold shadow-sm'>
                  Paso {currentStepIndex + 1} de {STEP_ORDER.length}
                </Badge>
              </div>
              <ProgressIndicator
                currentStep={currentStepIndex + 1}
                totalSteps={STEP_ORDER.length}
                labels={STEP_ORDER.map((step) => STEP_LABELS[step])}
              />
            </div>
          </div>
        </div>

        {/* Contenido scrollable con padding para elementos fixed */}
        <div className='max-w-4xl mx-auto px-3 pt-20 pb-32 w-full'>

          {/* Contenido del paso */}
          {state.currentStep === 'summary' ? (
            <>
              <div className='mb-4'>
                {renderStepContent()}
              </div>
              {/* Footer con resumen - Solo en paso summary */}
              <div className='mb-4'>
                <CartSummaryFooter
                  subtotal={totalPrice}
                  shipping={totalPrice >= 50000 ? 0 : 10000}
                  total={totalPrice + (totalPrice >= 50000 ? 0 : 10000)}
                  freeShippingThreshold={50000}
                />
              </div>
            </>
          ) : (
            <>
              <Card className='mb-6 shadow-xl border-0'>
                <CardContent>
                  {renderStepContent()}
                </CardContent>
              </Card>

              {/* Espaciador para evitar que el contenido quede oculto detrás del botón fixed */}
              <div className='mb-4' />
            </>
          )}
        </div>

        {/* Botón fixed "Comprar ahora" - Para paso summary - Fijo abajo */}
        {state.currentStep === 'summary' && (
          <div className='fixed bottom-0 left-0 right-0 z-50 shadow-lg'>
            <div className='max-w-4xl mx-auto px-3 py-4'>
              <Button
                size='lg'
                onClick={handleStepComplete}
                disabled={!canProceed || isLoading}
                className={cn(
                  'w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold shadow-lg',
                  (!canProceed || isLoading) && 'opacity-50 cursor-not-allowed'
                )}
              >
                {isLoading ? (
                  <>
                    <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                    Procesando...
                  </>
                ) : (
                  <>
                    Comprar ahora
                    <ArrowRight className='w-4 h-4 ml-2' />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Botón fixed "Continuar" - Para pasos intermedios - Fijo abajo */}
        {state.currentStep !== 'confirmation' && state.currentStep !== 'summary' && (
          <div className='fixed bottom-0 left-0 right-0 z-50 shadow-lg'>
            <div className='max-w-4xl mx-auto px-3 py-4'>
              <Button
                size='lg'
                onClick={handleStepComplete}
                disabled={!canProceed || isLoading}
                className={cn(
                  'w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold shadow-lg',
                  (!canProceed || isLoading) && 'opacity-50 cursor-not-allowed'
                )}
              >
                {isLoading ? (
                  <>
                    <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                    Procesando...
                  </>
                ) : (
                  <>
                    Continuar
                    <ArrowRight className='w-4 h-4 ml-2' />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Botón fixed "Confirmar Pedido" - Solo en etapa de confirmación - Fijo abajo */}
        {state.currentStep === 'confirmation' && (
          <div className='fixed bottom-0 left-0 right-0 z-50 shadow-lg'>
            <div className='max-w-4xl mx-auto px-3 py-4'>
              <Button
                size='lg'
                onClick={handleStepComplete}
                disabled={isLoading}
                className={cn(
                  'w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 py-6',
                  isLoading && 'opacity-50 cursor-not-allowed'
                )}
              >
                {isLoading ? (
                  <div className='flex items-center gap-3'>
                    <Loader2 className='w-6 h-6 animate-spin' />
                    <span className='text-base font-medium'>Procesando pago...</span>
                  </div>
                ) : (
                  <div className='flex items-center justify-center gap-2'>
                    <CreditCard className='w-5 h-5' />
                    <span className='text-lg font-bold'>
                      Confirmar Pedido ({formatCurrency(totalPrice + (totalPrice >= 50000 ? 0 : 10000))})
                    </span>
                  </div>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

// Componente para el paso de resumen
const SummaryStep: React.FC<{ cartItems: any[]; totalPrice: number }> = ({ cartItems, totalPrice }) => {
  return (
    <SimplifiedOrderSummary
      items={cartItems.map((item) => ({
        id: item.id,
        title: item.title,
        price: item.price,
        discountedPrice: item.discountedPrice,
        quantity: item.quantity,
        image: item.image,
        imgs: item.imgs,
        attributes: item.attributes,
      }))}
      subtotal={totalPrice}
      shipping={totalPrice >= 50000 ? 0 : 10000}
      total={totalPrice + (totalPrice >= 50000 ? 0 : 10000)}
      freeShippingThreshold={50000}
    />
  )
}

// Funciones de validación para mostrar checkmark verde
const isValidName = (name: string): boolean => {
  if (!name || name.trim() === '') return false
  const trimmed = name.trim()
  return trimmed.length >= 2 && /[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(trimmed)
}

const isValidPhone = (phone: string): boolean => {
  if (!phone || phone.trim() === '') return false
  
  // Primero validar que solo contenga caracteres válidos para teléfonos
  // Permitir: dígitos, espacios, guiones, paréntesis, + (código de país)
  const validCharsRegex = /^[\d\s\-\(\)\+]+$/
  if (!validCharsRegex.test(phone)) {
    return false
  }
  
  // Luego contar solo dígitos, aceptar 8-13 dígitos
  const digitsOnly = phone.replace(/\D/g, '')
  return digitsOnly.length >= 8 && digitsOnly.length <= 13
}

const isValidDNI = (dni: string): boolean => {
  return validateDNI(dni)
}

// Componente para el paso de contacto (usando exactamente la misma estructura que ExpressForm)
const ContactStep: React.FC<{
  formData: { firstName: string; lastName: string; phone: string }
  errors: Record<string, string>
  onUpdate: (data: Partial<{ firstName: string; lastName: string; phone: string }>) => void
}> = ({ formData, errors, onUpdate }) => {
  return (
    <div className='space-y-6'>
      <div>
        <p className='text-sm text-gray-600 mb-6'>
          Ingresá tus datos para que sepamos a quién entregarle el pedido.
        </p>
      </div>

      <div className='space-y-4'>
        {/* Campos Nombre y Apellido en una fila */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {/* Campo Nombre */}
          <div className='space-y-2'>
            <Label
              htmlFor='firstName'
              className='text-sm font-medium text-gray-700 flex items-center gap-2'
            >
              <User className='w-4 h-4' />
              Nombre
            </Label>
            <div className='relative'>
              <Input
                id='firstName'
                type='text'
                value={formData.firstName}
                onChange={(e) => onUpdate({ firstName: e.target.value })}
                placeholder='Juan'
                className={cn(
                  'pl-10 text-base transition-all duration-200 h-12',
                  errors.firstName
                    ? 'border-red-500 focus:border-red-500'
                    : isValidName(formData.firstName) && !errors.firstName
                      ? 'border-green-500 focus:border-green-600'
                      : 'border-gray-300 focus:border-blue-500'
                )}
                required
              />
              <User className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
              {isValidName(formData.firstName) && !errors.firstName && (
                <CheckCircle className='absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-500' />
              )}
            </div>
            {errors.firstName && (
              <p className='text-sm text-red-600 flex items-center gap-1'>
                <AlertCircle className='w-4 h-4' />
                {errors.firstName}
              </p>
            )}
          </div>

          {/* Campo Apellido */}
          <div className='space-y-2'>
            <Label
              htmlFor='lastName'
              className='text-sm font-medium text-gray-700 flex items-center gap-2'
            >
              <User className='w-4 h-4' />
              Apellido
            </Label>
            <div className='relative'>
              <Input
                id='lastName'
                type='text'
                value={formData.lastName}
                onChange={(e) => onUpdate({ lastName: e.target.value })}
                placeholder='Pérez'
                className={cn(
                  'pl-10 text-base transition-all duration-200 h-12',
                  errors.lastName
                    ? 'border-red-500 focus:border-red-500'
                    : isValidName(formData.lastName) && !errors.lastName
                      ? 'border-green-500 focus:border-green-600'
                      : 'border-gray-300 focus:border-blue-500'
                )}
                required
              />
              <User className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
              {isValidName(formData.lastName) && !errors.lastName && (
                <CheckCircle className='absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-500' />
              )}
            </div>
            {errors.lastName && (
              <p className='text-sm text-red-600 flex items-center gap-1'>
                <AlertCircle className='w-4 h-4' />
                {errors.lastName}
              </p>
            )}
          </div>
        </div>

        {/* Campo Teléfono */}
        <div className='space-y-2'>
          <Label
            htmlFor='phone'
            className='text-sm font-medium text-gray-700 flex items-center gap-2'
          >
            <Phone className='w-4 h-4' />
            Teléfono
          </Label>
          <div className='relative'>
            <Input
              id='phone'
              type='tel'
              value={formData.phone}
              onChange={(e) => onUpdate({ phone: e.target.value })}
              placeholder='351 123 4567'
              className={cn(
                'pl-10 text-base transition-all duration-200 h-12',
                errors.phone
                  ? 'border-red-500 focus:border-red-500'
                  : isValidPhone(formData.phone) && !errors.phone
                    ? 'border-green-500 focus:border-green-600'
                    : 'border-gray-300 focus:border-blue-500'
              )}
              required
            />
            <Phone className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
            {isValidPhone(formData.phone) && !errors.phone && (
              <CheckCircle className='absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-500' />
            )}
          </div>
          {errors.phone && (
            <p className='text-sm text-red-600 flex items-center gap-1'>
              <AlertCircle className='w-4 h-4' />
              {errors.phone}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// Componente para el paso de envío (usando exactamente la misma estructura que ExpressForm)
const ShippingStep: React.FC<{
  formData: {
    streetAddress: string
    apartment?: string
    observations?: string
    isValidated?: boolean
  }
  errors: Record<string, string>
  onUpdate: (data: Partial<any>) => void
}> = ({ formData, errors, onUpdate }) => {
  return (
    <div className='space-y-6'>
      <div>
        <p className='text-sm text-gray-600 mb-6'>
          ¿A dónde te llevamos tus pinturas?
        </p>
      </div>

      <div className='space-y-4'>
        {/* Campo Dirección con mapa interactivo (igual que ExpressForm) */}
        <AddressMapSelectorAdvanced
          value={formData.streetAddress}
          onChange={(address, coordinates) => {
            // Si viene con coordenadas, es resultado de una validación automática
            // No resetear isValidated en ese caso (onValidationChange ya lo maneja)
            // Solo resetear cuando el usuario cambia manualmente (sin coordenadas)
            if (coordinates) {
              // Es resultado de validación, solo actualizar la dirección
              // La validación se actualizará en onValidationChange que se llama después
              onUpdate({ streetAddress: address })
              console.log('Coordenadas seleccionadas:', coordinates)
            } else {
              // Cambio manual del usuario, resetear validación
              onUpdate({ 
                streetAddress: address,
                isValidated: false
              })
            }
          }}
          onValidationChange={(isValid, error) => {
            // Actualizar el estado de validación cuando cambie
            onUpdate({ 
              streetAddress: formData.streetAddress,
              isValidated: isValid
            })
            // El error se maneja internamente en AddressMapSelectorAdvanced
          }}
          className='text-base transition-all duration-200'
          required
          label="Dirección de entrega"
          {...(errors.streetAddress && { error: errors.streetAddress })}
        />

        {/* Campo Departamento (opcional) */}
        <div className='space-y-2'>
          <Label
            htmlFor='apartment'
            className='text-sm font-medium text-gray-700'
          >
            Departamento / Piso / Unidad (opcional)
          </Label>
          <Input
            id='apartment'
            type='text'
            value={formData.apartment || ''}
            onChange={(e) => onUpdate({ apartment: e.target.value })}
            placeholder='1A'
            className='text-base transition-all duration-200 h-12 border-gray-300 focus:border-blue-500'
          />
        </div>

        {/* Campo Observaciones (opcional) - igual que ExpressForm */}
        <div className='space-y-2'>
          <Label
            htmlFor='observations'
            className='text-sm font-medium text-gray-700 flex items-center gap-2'
          >
            <MessageSquare className='w-4 h-4' />
            Observaciones (opcional)
          </Label>
          <div className='relative'>
            <textarea
              id='observations'
              name='observations'
              value={formData.observations || ''}
              onChange={(e) => onUpdate({ observations: e.target.value })}
              placeholder='Ej: Barrio Nueva Córdoba, casa con portón azul, disponible de 9 a 18hs'
              className={cn(
                'w-full pl-10 pt-3 pb-3 pr-3 text-base transition-all duration-200 resize-none',
                'min-h-[80px]',
                'border-gray-300 focus:border-blue-500 rounded-md'
              )}
              rows={3}
            />
            <MessageSquare className='absolute left-3 top-3 w-5 h-5 text-gray-400' />
          </div>
          <p className='text-xs text-gray-500'>
            Incluye detalles como barrio, características de la casa, horarios disponibles, etc.
          </p>
        </div>
      </div>
    </div>
  )
}

// Componente para el paso de pago
const PaymentStep: React.FC<{
  paymentMethod: 'mercadopago' | 'cash'
  onPaymentMethodChange: (method: 'mercadopago' | 'cash') => void
  isLoading: boolean
}> = ({ paymentMethod, onPaymentMethodChange, isLoading }) => {
  return (
    <div className='space-y-6'>
      <div>
        <p className='text-sm text-gray-600 mb-6'>
          Elegí cómo querés pagar tu pedido de forma segura.
        </p>
      </div>

      <PaymentMethodSelector
        selectedMethod={paymentMethod}
        onMethodChange={onPaymentMethodChange}
      />
    </div>
  )
}

// Componente para el paso de confirmación
const ConfirmationStep: React.FC<{
  cartItems: any[]
  totalPrice: number
  formData: any
}> = ({ cartItems, totalPrice, formData }) => {
  const shippingCost = totalPrice >= 50000 ? 0 : 10000
  const finalTotal = totalPrice + shippingCost

  return (
    <div className='space-y-6'>
      <div className='flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200'>
        <CheckCircle className='w-6 h-6 text-green-600 flex-shrink-0' />
        <div>
          <h3 className='font-semibold text-gray-900 mb-1'>
            ¡Ya casi es tuyo!
          </h3>
          <p className='text-sm text-gray-600'>
            Dale un último vistazo a los detalles antes de finalizar la compra.
          </p>
        </div>
      </div>

      <div>
        <h4 className='font-semibold text-gray-900 mb-4'>Productos</h4>
        <div className='space-y-3'>
          {cartItems.map((item) => {
            const itemImage =
              item.imgs?.previews?.[0] ||
              item.image ||
              '/images/products/placeholder.svg'

            return (
              <div key={item.id} className='flex items-center gap-4 p-3 bg-gray-50 rounded-lg'>
                <div className='relative w-16 h-16 bg-white rounded overflow-hidden flex-shrink-0'>
                  <Image
                    src={itemImage}
                    alt={item.title}
                    fill
                    className='object-contain p-1'
                    sizes='64px'
                  />
                </div>
                <div className='flex-1 min-w-0'>
                  <p className='font-medium text-gray-900 truncate'>{item.title}</p>
                  <p className='text-sm text-gray-600'>
                    Cantidad: {item.quantity} × {formatCurrency(item.discountedPrice || item.price)}
                  </p>
                </div>
                <div className='text-right'>
                  <p className='font-bold text-gray-900'>
                    {formatCurrency((item.discountedPrice || item.price) * item.quantity)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div>
        <h4 className='font-semibold text-gray-900 mb-4'>Datos de envío</h4>
        <div className='p-4 bg-gray-50 rounded-lg space-y-2 text-sm'>
          <p>
            <span className='font-medium'>Nombre:</span> {formData.contact.firstName}{' '}
            {formData.contact.lastName}
          </p>
          <p>
            <span className='font-medium'>Teléfono:</span> {formData.contact.phone}
          </p>
          <p>
            <span className='font-medium'>Dirección:</span> {formData.shipping.streetAddress}
            {formData.shipping.apartment && `, ${formData.shipping.apartment}`}
          </p>
          {formData.shipping.observations && (
            <p>
              <span className='font-medium'>Observaciones:</span> {formData.shipping.observations}
            </p>
          )}
        </div>
      </div>

      <div>
        <h4 className='font-semibold text-gray-900 mb-4'>Resumen de pago</h4>
        <div className='space-y-2 p-4 bg-gray-50 rounded-lg'>
          <div className='flex justify-between text-sm'>
            <span>Subtotal:</span>
            <span>${totalPrice.toLocaleString('es-AR')}</span>
          </div>
          <div className='flex justify-between text-sm'>
            <span>Envío:</span>
            <span>
              {shippingCost === 0 ? (
                <span className='text-green-600 font-semibold'>Gratis</span>
              ) : (
                `$${shippingCost.toLocaleString('es-AR')}`
              )}
            </span>
          </div>
          <div className='border-t pt-2 mt-2 flex justify-between font-bold text-lg'>
            <span>Total:</span>
            <span className='text-green-600'>${finalTotal.toLocaleString('es-AR')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

