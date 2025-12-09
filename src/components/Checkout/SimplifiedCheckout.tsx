'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useCheckout } from '@/hooks/useCheckout'
import {
  ShoppingCart,
  CreditCard,
  MapPin,
  User,
  Phone,
  Mail,
  Package,
  Truck,
  CheckCircle,
  AlertCircle,
  Loader2,
} from '@/lib/optimized-imports'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { CommercialProductCard } from '@/components/ui/product-card-commercial'

const SimplifiedCheckout = () => {
  const router = useRouter()
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
    updateBillingData,
    updateFormData,
    processCheckout,
  } = useCheckout()

  const [currentStep, setCurrentStep] = useState<'form' | 'confirmation' | 'processing'>('form')
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Redirigir si el carrito está vacío
  useEffect(() => {
    if (cartItems.length === 0 && currentStep === 'form') {
      router.push('/cart')
    }
  }, [cartItems.length, currentStep, router])

  // Validación del formulario
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.billing.firstName.trim()) {
      newErrors.firstName = 'El nombre es requerido'
    }
    if (!formData.billing.lastName.trim()) {
      newErrors.lastName = 'El apellido es requerido'
    }
    if (!formData.billing.email.trim()) {
      newErrors.email = 'El email es requerido'
    } else if (!/\S+@\S+\.\S+/.test(formData.billing.email)) {
      newErrors.email = 'Email inválido'
    }
    if (!formData.billing.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido'
    }
    if (!formData.billing.streetAddress.trim()) {
      newErrors.streetAddress = 'La dirección es requerida'
    }
    if (!formData.billing.city.trim()) {
      newErrors.city = 'La ciudad es requerida'
    }
    if (!formData.billing.state.trim()) {
      newErrors.state = 'La provincia es requerida'
    }
    if (!formData.billing.zipCode.trim()) {
      newErrors.zipCode = 'El código postal es requerido'
    }

    setFormErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: string, value: string) => {
    updateBillingData({ [field]: value })
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleContinueToConfirmation = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      setCurrentStep('confirmation')
    }
  }

  const handleConfirmOrder = async () => {
    setCurrentStep('processing')
    await processCheckout()
  }

  const handleBackToForm = () => {
    setCurrentStep('form')
  }

  // Renderizar paso del formulario
  const renderFormStep = () => (
    <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
      {/* Formulario Principal */}
      <div className='lg:col-span-2'>
        <form onSubmit={handleContinueToConfirmation} className='space-y-6'>
          {/* Información Personal */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <User className='w-5 h-5 text-primary' />
                Información Personal
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>Nombre *</label>
                  <Input
                    value={formData.billing.firstName}
                    onChange={e => handleInputChange('firstName', e.target.value)}
                    placeholder='Tu nombre'
                    className={cn(formErrors.firstName && 'border-red-500')}
                  />
                  {formErrors.firstName && (
                    <p className='text-red-500 text-xs mt-1'>{formErrors.firstName}</p>
                  )}
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>Apellido *</label>
                  <Input
                    value={formData.billing.lastName}
                    onChange={e => handleInputChange('lastName', e.target.value)}
                    placeholder='Tu apellido'
                    className={cn(formErrors.lastName && 'border-red-500')}
                  />
                  {formErrors.lastName && (
                    <p className='text-red-500 text-xs mt-1'>{formErrors.lastName}</p>
                  )}
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>Email *</label>
                  <Input
                    type='email'
                    value={formData.billing.email}
                    onChange={e => handleInputChange('email', e.target.value)}
                    placeholder='tu@email.com'
                    className={cn(formErrors.email && 'border-red-500')}
                  />
                  {formErrors.email && (
                    <p className='text-red-500 text-xs mt-1'>{formErrors.email}</p>
                  )}
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>Teléfono *</label>
                  <Input
                    type='tel'
                    value={formData.billing.phone}
                    onChange={e => handleInputChange('phone', e.target.value)}
                    placeholder='11 1234-5678'
                    className={cn(formErrors.phone && 'border-red-500')}
                  />
                  {formErrors.phone && (
                    <p className='text-red-500 text-xs mt-1'>{formErrors.phone}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dirección de Entrega */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <MapPin className='w-5 h-5 text-primary' />
                Dirección de Entrega
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>Dirección *</label>
                <Input
                  value={formData.billing.streetAddress}
                  onChange={e => handleInputChange('streetAddress', e.target.value)}
                  placeholder='Calle y número'
                  className={cn(formErrors.streetAddress && 'border-red-500')}
                />
                {formErrors.streetAddress && (
                  <p className='text-red-500 text-xs mt-1'>{formErrors.streetAddress}</p>
                )}
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Departamento/Piso (opcional)
                </label>
                <Input
                  value={formData.billing.apartment}
                  onChange={e => handleInputChange('apartment', e.target.value)}
                  placeholder='Depto, piso, etc.'
                />
              </div>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>Ciudad *</label>
                  <Input
                    value={formData.billing.city}
                    onChange={e => handleInputChange('city', e.target.value)}
                    placeholder='Ciudad'
                    className={cn(formErrors.city && 'border-red-500')}
                  />
                  {formErrors.city && (
                    <p className='text-red-500 text-xs mt-1'>{formErrors.city}</p>
                  )}
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Provincia *
                  </label>
                  <Input
                    value={formData.billing.state}
                    onChange={e => handleInputChange('state', e.target.value)}
                    placeholder='Provincia'
                    className={cn(formErrors.state && 'border-red-500')}
                  />
                  {formErrors.state && (
                    <p className='text-red-500 text-xs mt-1'>{formErrors.state}</p>
                  )}
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Código Postal *
                  </label>
                  <Input
                    value={formData.billing.zipCode}
                    onChange={e => handleInputChange('zipCode', e.target.value)}
                    placeholder='CP'
                    className={cn(formErrors.zipCode && 'border-red-500')}
                  />
                  {formErrors.zipCode && (
                    <p className='text-red-500 text-xs mt-1'>{formErrors.zipCode}</p>
                  )}
                </div>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Observaciones de entrega (opcional)
                </label>
                <textarea
                  value={formData.billing.observations || ''}
                  onChange={e => handleInputChange('observations', e.target.value)}
                  placeholder='Ej: Barrio específico, características de la casa, horarios de entrega preferidos...'
                  rows={3}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none'
                />
              </div>
            </CardContent>
          </Card>

          {/* Método de Envío */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Truck className='w-5 h-5 text-primary' />
                Método de Envío
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                <label className='flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50'>
                  <input
                    type='radio'
                    name='shipping'
                    value='shipping'
                    checked={formData.shippingMethod === 'shipping'}
                    onChange={e =>
                      updateFormData({
                        shippingMethod: e.target.value as 'shipping' | 'pickup',
                      })
                    }
                    className='text-primary'
                  />
                  <div className='flex-1'>
                    <div className='font-medium'>Envío a Domicilio</div>
                    <div className='text-sm text-gray-600'>3-5 días hábiles</div>
                  </div>
                  <div className='font-semibold'>
                    {totalPrice >= 50000 ? 'Gratis' : '$10.000'}
                  </div>
                </label>

                <label className='flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50'>
                  <input
                    type='radio'
                    name='shipping'
                    value='pickup'
                    checked={formData.shippingMethod === 'pickup'}
                    onChange={e =>
                      updateFormData({
                        shippingMethod: e.target.value as 'shipping' | 'pickup',
                      })
                    }
                    className='text-primary'
                  />
                  <div className='flex-1'>
                    <div className='font-medium'>Retiro en Tienda</div>
                    <div className='text-sm text-gray-600'>Gratis - Coordinar horario</div>
                  </div>
                  <div className='font-semibold text-green-600'>Gratis</div>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Método de Pago */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <CreditCard className='w-5 h-5 text-primary' />
                Método de Pago
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='flex items-center gap-3 p-4 border rounded-lg bg-primary/5'>
                <div className='w-10 h-10 bg-primary rounded-lg flex items-center justify-center'>
                  <span className='text-white font-bold text-sm'>MP</span>
                </div>
                <div className='flex-1'>
                  <div className='font-medium'>MercadoPago</div>
                  <div className='text-sm text-gray-600'>Tarjetas, efectivo, transferencias</div>
                </div>
                <CheckCircle className='w-5 h-5 text-green-500' />
              </div>
            </CardContent>
          </Card>

          {/* Botón Continuar */}
          <div className='flex justify-end'>
            <Button type='submit' size='lg' className='min-w-[200px]'>
              Revisar Pedido
            </Button>
          </div>
        </form>
      </div>

      {/* Resumen del Pedido */}
      <div className='lg:col-span-1'>{renderOrderSummary()}</div>
    </div>
  )

  // Renderizar resumen del pedido
  const renderOrderSummary = () => (
    <Card className='sticky top-4'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <ShoppingCart className='w-5 h-5 text-primary' />
          Resumen del Pedido
          <Badge variant='outline' size='sm'>
            {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Items del carrito con ProductCard */}
        <div className='max-h-80 overflow-y-auto space-y-4'>
          {cartItems.map((item: any, index: number) => (
            <div key={index} className='border-b border-gray-100 pb-4 last:border-b-0'>
              <CommercialProductCard
                image={
                  item.imgs?.thumbnails?.[0] ||
                  item.imgs?.previews?.[0] ||
                  '/images/products/placeholder.svg'
                }
                title={item.title}
                brand={item.brand || 'Marca'}
                price={item.discountedPrice}
                originalPrice={item.discountedPrice < item.price ? item.price : undefined}
                discount={
                  item.discountedPrice < item.price
                    ? `${Math.round(((item.price - item.discountedPrice) / item.price) * 100)}%`
                    : undefined
                }
                stock={item.quantity} // Mostrar cantidad en el carrito como stock
                productId={item.id}
                cta={`Total: $${(item.discountedPrice * item.quantity).toLocaleString()}`}
                onAddToCart={() => {
                  // En checkout, no necesitamos agregar más al carrito
                }}
                showCartAnimation={false}
                freeShipping={item.discountedPrice >= 50000}
                shippingText={item.discountedPrice >= 50000 ? 'Envío gratis' : 'En carrito'}
              />
            </div>
          ))}
        </div>

        <Separator />

        {/* Totales */}
        <div className='space-y-2'>
          <div className='flex justify-between text-sm'>
            <span>Subtotal</span>
            <span>${totalPrice.toLocaleString()}</span>
          </div>
          <div className='flex justify-between text-sm'>
            <span>Envío</span>
            <span>
              {shippingCost === 0 ? (
                <span className='text-green-600 font-medium'>Gratis</span>
              ) : (
                `$${shippingCost.toLocaleString()}`
              )}
            </span>
          </div>
          {discount > 0 && (
            <div className='flex justify-between text-sm text-green-600'>
              <span>Descuento</span>
              <span>-${discount.toLocaleString()}</span>
            </div>
          )}
          <Separator />
          <div className='flex justify-between font-semibold text-lg'>
            <span>Total</span>
            <span className='text-primary'>${finalTotal ? finalTotal.toLocaleString() : '0'}</span>
          </div>
        </div>

        {/* Beneficios */}
        <div className='bg-green-50 p-3 rounded-lg'>
          <div className='flex items-center gap-2 text-green-700 text-sm'>
            <CheckCircle className='w-4 h-4' />
            <span className='font-medium'>Compra protegida</span>
          </div>
          <p className='text-xs text-green-600 mt-1'>Tu dinero está protegido con MercadoPago</p>
        </div>
      </CardContent>
    </Card>
  )

  // Renderizar paso de confirmación
  const renderConfirmationStep = () => (
    <div className='max-w-4xl mx-auto'>
      <div className='text-center mb-8'>
        <CheckCircle className='w-16 h-16 text-green-500 mx-auto mb-4' />
        <h2 className='text-2xl font-bold text-gray-900 mb-2'>¡Confirma tu Pedido!</h2>
        <p className='text-gray-600'>Revisa todos los datos antes de proceder al pago</p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        {/* Datos del pedido */}
        <div className='space-y-6'>
          {/* Información personal */}
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Información Personal</CardTitle>
            </CardHeader>
            <CardContent className='space-y-2'>
              <p>
                <strong>Nombre:</strong> {formData.billing.firstName} {formData.billing.lastName}
              </p>
              <p>
                <strong>Email:</strong> {formData.billing.email}
              </p>
              <p>
                <strong>Teléfono:</strong> {formData.billing.phone}
              </p>
            </CardContent>
          </Card>

          {/* Dirección de entrega */}
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Dirección de Entrega</CardTitle>
            </CardHeader>
            <CardContent className='space-y-2'>
              <p>{formData.billing.streetAddress}</p>
              {formData.billing.apartment && <p>{formData.billing.apartment}</p>}
              <p>
                {formData.billing.city}, {formData.billing.state}
              </p>
              <p>CP: {formData.billing.zipCode}</p>
              <p>{formData.billing.country}</p>
            </CardContent>
          </Card>

          {/* Método de envío y pago */}
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Métodos Seleccionados</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div className='flex items-center gap-2'>
                <Truck className='w-4 h-4 text-primary' />
                <span>
                  {formData.shippingMethod === 'free'
                    ? 'Envío Estándar (5-7 días)'
                    : 'Envío Express (1-2 días)'}
                </span>
              </div>
              <div className='flex items-center gap-2'>
                <CreditCard className='w-4 h-4 text-primary' />
                <span>MercadoPago</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resumen del pedido */}
        <div>{renderOrderSummary()}</div>
      </div>

      {/* Botones de acción */}
      <div className='flex justify-between mt-8'>
        <Button variant='outline' onClick={handleBackToForm} size='lg'>
          Volver a Editar
        </Button>
        <Button
          onClick={handleConfirmOrder}
          size='lg'
          className='min-w-[200px]'
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className='w-4 h-4 mr-2 animate-spin' />
              Procesando...
            </>
          ) : (
            'Confirmar y Pagar'
          )}
        </Button>
      </div>
    </div>
  )

  // Renderizar paso de procesamiento
  const renderProcessingStep = () => (
    <div className='text-center py-12'>
      <Loader2 className='w-16 h-16 text-primary mx-auto mb-4 animate-spin' />
      <h2 className='text-2xl font-bold text-gray-900 mb-2'>Procesando tu Pedido</h2>
      <p className='text-gray-600 mb-4'>
        Te estamos redirigiendo a MercadoPago para completar el pago...
      </p>
      <div className='max-w-md mx-auto bg-blue-50 p-4 rounded-lg'>
        <p className='text-sm text-blue-700'>
          No cierres esta ventana. Serás redirigido automáticamente.
        </p>
      </div>
    </div>
  )

  // Mostrar errores generales
  if (errors.general) {
    return (
      <div className='max-w-2xl mx-auto text-center py-12'>
        <AlertCircle className='w-16 h-16 text-red-500 mx-auto mb-4' />
        <h2 className='text-2xl font-bold text-gray-900 mb-2'>Error en el Checkout</h2>
        <p className='text-red-600 mb-4'>{errors.general}</p>
        <Button onClick={() => window.location.reload()}>Intentar Nuevamente</Button>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='text-center mb-8'>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>Finalizar Compra</h1>
          <div className='flex items-center justify-center gap-4 text-sm text-gray-600'>
            <span
              className={cn(
                'flex items-center gap-1',
                currentStep === 'form' && 'text-primary font-medium'
              )}
            >
              <span
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs',
                  currentStep === 'form' ? 'bg-primary text-white' : 'bg-gray-200'
                )}
              >
                1
              </span>
              Datos
            </span>
            <div className='w-8 h-px bg-gray-300' />
            <span
              className={cn(
                'flex items-center gap-1',
                currentStep === 'confirmation' && 'text-primary font-medium'
              )}
            >
              <span
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs',
                  currentStep === 'confirmation' ? 'bg-primary text-white' : 'bg-gray-200'
                )}
              >
                2
              </span>
              Confirmación
            </span>
            <div className='w-8 h-px bg-gray-300' />
            <span
              className={cn(
                'flex items-center gap-1',
                currentStep === 'processing' && 'text-primary font-medium'
              )}
            >
              <span
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs',
                  currentStep === 'processing' ? 'bg-primary text-white' : 'bg-gray-200'
                )}
              >
                3
              </span>
              Pago
            </span>
          </div>
        </div>

        {/* Contenido según el paso */}
        {currentStep === 'form' && renderFormStep()}
        {currentStep === 'confirmation' && renderConfirmationStep()}
        {currentStep === 'processing' && renderProcessingStep()}
      </div>
    </div>
  )
}

export default SimplifiedCheckout
