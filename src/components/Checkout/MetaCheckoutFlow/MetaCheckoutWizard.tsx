'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ProgressIndicator, TrustSignals } from './UXOptimizers'
import { useMetaCheckout, MetaCheckoutStep } from '@/hooks/useMetaCheckout'
import { SimplifiedOrderSummary } from '@/components/ui/simplified-order-summary'
import PaymentMethodSelector from '../PaymentMethodSelector'
import MercadoPagoWallet, { MercadoPagoWalletFallback } from '../MercadoPagoWallet'
import {
  ArrowLeft,
  ArrowRight,
  Mail,
  Phone,
  User,
  MapPin,
  CreditCard,
  CheckCircle,
  Loader2,
  ShoppingCart,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { trackCustomEvent } from '@/lib/meta-pixel'
import { trackEvent } from '@/lib/google-analytics'
import Image from 'next/image'

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
  } = useMetaCheckout()

  const currentStepIndex = STEP_ORDER.indexOf(state.currentStep)

  // Redirigir si el carrito está vacío
  useEffect(() => {
    if (!isLoading && Array.isArray(cartItems) && cartItems.length === 0 && state.currentStep === 'summary') {
      router.push('/cart')
    }
  }, [cartItems, isLoading, state.currentStep, router])

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
            formData={state.formData.shipping}
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

  return (
    <div className='min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-yellow-50'>
      <div className='max-w-4xl mx-auto px-4 py-8'>
        {/* Header con progreso */}
        <div className='mb-8'>
          <div className='flex items-center justify-between mb-4'>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => {
                if (currentStepIndex > 0) {
                  previousStep()
                } else {
                  router.push('/cart')
                }
              }}
              className='flex items-center gap-2'
            >
              <ArrowLeft className='w-4 h-4' />
              {currentStepIndex > 0 ? 'Atrás' : 'Carrito'}
            </Button>
            <Badge variant='secondary' className='bg-blue-100 text-blue-700'>
              Paso {currentStepIndex + 1} de {STEP_ORDER.length}
            </Badge>
          </div>
          <ProgressIndicator
            currentStep={currentStepIndex + 1}
            totalSteps={STEP_ORDER.length}
            labels={STEP_ORDER.map((step) => STEP_LABELS[step])}
          />
        </div>

        {/* Contenido del paso */}
        <Card className='mb-6 shadow-xl border-0'>
          <CardHeader>
            <CardTitle className='text-2xl font-bold text-gray-900'>
              {STEP_LABELS[state.currentStep]}
            </CardTitle>
          </CardHeader>
          <CardContent>{renderStepContent()}</CardContent>
        </Card>

        {/* Botones de navegación */}
        <div className='flex flex-col sm:flex-row gap-4 justify-between'>
          {currentStepIndex > 0 && (
            <Button
              variant='outline'
              size='lg'
              onClick={previousStep}
              className='flex-1 sm:flex-initial'
            >
              <ArrowLeft className='w-4 h-4 mr-2' />
              Anterior
            </Button>
          )}
          <Button
            size='lg'
            onClick={handleStepComplete}
            disabled={!canProceed || isLoading}
            className={cn(
              'flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold',
              (!canProceed || isLoading) && 'opacity-50 cursor-not-allowed'
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                Procesando...
              </>
            ) : state.currentStep === 'confirmation' ? (
              <>
                Confirmar y pagar
                <CreditCard className='w-4 h-4 ml-2' />
              </>
            ) : (
              <>
                Continuar
                <ArrowRight className='w-4 h-4 ml-2' />
              </>
            )}
          </Button>
        </div>

        {/* Señales de confianza */}
        <div className='mt-8'>
          <TrustSignals />
        </div>
      </div>
    </div>
  )
}

// Componente para el paso de resumen
const SummaryStep: React.FC<{ cartItems: any[]; totalPrice: number }> = ({ cartItems, totalPrice }) => {
  const shippingCost = totalPrice >= 50000 ? 0 : 10000
  const finalTotal = totalPrice + shippingCost

  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-semibold text-gray-900 mb-4'>
          Resumen de tu pedido ({cartItems.length} {cartItems.length === 1 ? 'producto' : 'productos'})
        </h3>
        <SimplifiedOrderSummary
          items={cartItems.map((item) => ({
            id: item.id,
            title: item.title,
            price: item.price,
            discountedPrice: item.discountedPrice,
            quantity: item.quantity,
            image: item.image,
            imgs: item.imgs,
          }))}
          subtotal={totalPrice}
          shipping={shippingCost}
          total={finalTotal}
          freeShippingThreshold={50000}
        />
      </div>
    </div>
  )
}

// Componente para el paso de contacto
const ContactStep: React.FC<{
  formData: { email: string; phone: string }
  errors: Record<string, string>
  onUpdate: (data: Partial<{ email: string; phone: string }>) => void
}> = ({ formData, errors, onUpdate }) => {
  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-semibold text-gray-900 mb-4'>
          Datos de contacto
        </h3>
        <p className='text-sm text-gray-600 mb-6'>
          Necesitamos tu email y teléfono para confirmar tu pedido y enviarte actualizaciones.
        </p>
      </div>

      <div className='space-y-4'>
        <div>
          <Label htmlFor='email' className='flex items-center gap-2 mb-2'>
            <Mail className='w-4 h-4' />
            Email
          </Label>
          <Input
            id='email'
            type='email'
            value={formData.email}
            onChange={(e) => onUpdate({ email: e.target.value })}
            placeholder='tu@email.com'
            error={errors.email}
            required
            className='w-full'
          />
        </div>

        <div>
          <Label htmlFor='phone' className='flex items-center gap-2 mb-2'>
            <Phone className='w-4 h-4' />
            Teléfono
          </Label>
          <Input
            id='phone'
            type='tel'
            value={formData.phone}
            onChange={(e) => onUpdate({ phone: e.target.value })}
            placeholder='11 1234-5678'
            error={errors.phone}
            required
            className='w-full'
          />
          <p className='text-xs text-gray-500 mt-1'>
            Incluí el código de área (ej: 11 para CABA)
          </p>
        </div>
      </div>
    </div>
  )
}

// Componente para el paso de envío
const ShippingStep: React.FC<{
  formData: {
    firstName: string
    lastName: string
    dni: string
    streetAddress: string
    city: string
    state: string
    zipCode: string
    apartment?: string
  }
  errors: Record<string, string>
  onUpdate: (data: Partial<any>) => void
}> = ({ formData, errors, onUpdate }) => {
  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-semibold text-gray-900 mb-4'>
          Dirección de envío
        </h3>
        <p className='text-sm text-gray-600 mb-6'>
          Ingresá la dirección donde querés recibir tu pedido.
        </p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div>
          <Label htmlFor='firstName' className='flex items-center gap-2 mb-2'>
            <User className='w-4 h-4' />
            Nombre
          </Label>
          <Input
            id='firstName'
            value={formData.firstName}
            onChange={(e) => onUpdate({ firstName: e.target.value })}
            placeholder='Juan'
            error={errors.firstName}
            required
          />
        </div>

        <div>
          <Label htmlFor='lastName' className='flex items-center gap-2 mb-2'>
            Apellido
          </Label>
          <Input
            id='lastName'
            value={formData.lastName}
            onChange={(e) => onUpdate({ lastName: e.target.value })}
            placeholder='Pérez'
            error={errors.lastName}
            required
          />
        </div>

        <div>
          <Label htmlFor='dni' className='flex items-center gap-2 mb-2'>
            DNI
          </Label>
          <Input
            id='dni'
            value={formData.dni}
            onChange={(e) => onUpdate({ dni: e.target.value })}
            placeholder='12345678'
            error={errors.dni}
            required
            maxLength={8}
          />
        </div>

        <div>
          <Label htmlFor='zipCode' className='flex items-center gap-2 mb-2'>
            Código Postal
          </Label>
          <Input
            id='zipCode'
            value={formData.zipCode}
            onChange={(e) => onUpdate({ zipCode: e.target.value })}
            placeholder='1234'
            error={errors.zipCode}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor='streetAddress' className='flex items-center gap-2 mb-2'>
          <MapPin className='w-4 h-4' />
          Dirección
        </Label>
        <Input
          id='streetAddress'
          value={formData.streetAddress}
          onChange={(e) => onUpdate({ streetAddress: e.target.value })}
          placeholder='Calle y número'
          error={errors.streetAddress}
          required
        />
      </div>

      <div>
        <Label htmlFor='apartment' className='mb-2'>
          Departamento / Piso / Unidad (opcional)
        </Label>
        <Input
          id='apartment'
          value={formData.apartment || ''}
          onChange={(e) => onUpdate({ apartment: e.target.value })}
          placeholder='1A'
        />
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div>
          <Label htmlFor='city' className='mb-2'>
            Ciudad
          </Label>
          <Input
            id='city'
            value={formData.city}
            onChange={(e) => onUpdate({ city: e.target.value })}
            placeholder='Buenos Aires'
            error={errors.city}
            required
          />
        </div>

        <div>
          <Label htmlFor='state' className='mb-2'>
            Provincia
          </Label>
          <Input
            id='state'
            value={formData.state}
            onChange={(e) => onUpdate({ state: e.target.value })}
            placeholder='Buenos Aires'
            error={errors.state}
            required
          />
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
        <h3 className='text-lg font-semibold text-gray-900 mb-4'>
          Método de pago
        </h3>
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
            Revisá tu pedido antes de confirmar
          </h3>
          <p className='text-sm text-gray-600'>
            Verificá que todos los datos sean correctos antes de proceder al pago.
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
                    Cantidad: {item.quantity} × ${(item.discountedPrice || item.price).toLocaleString('es-AR')}
                  </p>
                </div>
                <div className='text-right'>
                  <p className='font-bold text-gray-900'>
                    ${((item.discountedPrice || item.price) * item.quantity).toLocaleString('es-AR')}
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
            <span className='font-medium'>Nombre:</span> {formData.shipping.firstName}{' '}
            {formData.shipping.lastName}
          </p>
          <p>
            <span className='font-medium'>DNI:</span> {formData.shipping.dni}
          </p>
          <p>
            <span className='font-medium'>Dirección:</span> {formData.shipping.streetAddress}
            {formData.shipping.apartment && `, ${formData.shipping.apartment}`}
          </p>
          <p>
            <span className='font-medium'>Ciudad:</span> {formData.shipping.city},{' '}
            {formData.shipping.state}
          </p>
          <p>
            <span className='font-medium'>Código Postal:</span> {formData.shipping.zipCode}
          </p>
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

