import React, { useState } from 'react'
// FORCE RECOMPILE - NUEVOS CAMPOS AGREGADOS
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/core/utils'
import { useMobileCheckoutNavigation } from '@/hooks/useMobileCheckoutNavigation'

import {
  Mail,
  Phone,
  MapPin,
  CreditCard,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  User,
} from 'lucide-react'

interface ExpressFormProps {
  formData: {
    firstName: string
    lastName: string
    dni: string
    email: string
    phone: string
    streetAddress: string
    observations?: string
  }
  errors?: Record<string, string>
  onFieldChange: (field: string, value: string) => void
  onSubmit: (e: React.FormEvent) => void
  isProcessing?: boolean
  paymentMethod?: string
  onPaymentMethodChange?: (method: string) => void
  isFormValid?: boolean
}

const ExpressForm: React.FC<ExpressFormProps> = ({
  formData,
  errors = {},
  onFieldChange,
  onSubmit,
  isProcessing = false,
  paymentMethod = 'mercadopago',
  onPaymentMethodChange,
  isFormValid = false,
}) => {
  // Hook para navegación móvil mejorada
  const { containerRef, isMobile, triggerHapticFeedback, isInteracting } =
    useMobileCheckoutNavigation({
      enableSwipeGestures: false, // Deshabilitado para no interferir con el scroll
      enableHapticFeedback: true,
      enableKeyboardNavigation: true,
    })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isFormValid) {
      triggerHapticFeedback('heavy')
    }
    onSubmit(e)
  }

  const handleFieldFocus = () => {
    if (isMobile) {
      triggerHapticFeedback('light')
    }
  }

  return (
    <form
      ref={containerRef}
      onSubmit={handleSubmit}
      className={cn(
        'space-y-6 transition-all duration-200',
        isInteracting && isMobile && 'scale-[0.995]'
      )}
    >
      <div className='space-y-4'>
        {/* Campo Email */}
        <div className='space-y-2'>
          <Label
            htmlFor='email'
            className='text-sm font-medium text-gray-700 flex items-center gap-2'
          >
            <Mail className='w-4 h-4' />
            Email
          </Label>
          <div className='relative'>
            <Input
              id='email'
              type='email'
              data-testid='email-input'
              value={formData.email}
              onChange={e => onFieldChange('email', e.target.value)}
              onFocus={handleFieldFocus}
              placeholder='tu@email.com'
              className={cn(
                'pl-10 text-base transition-all duration-200',
                isMobile ? 'h-14 text-lg' : 'h-12',
                errors.email
                  ? 'border-red-500 focus:border-red-500'
                  : formData.email && !errors.email
                    ? 'border-green-500 focus:border-green-600'
                    : 'border-gray-300 focus:border-blue-500',
                isMobile && 'touch-manipulation focus:scale-[1.02]'
              )}
              required
            />
            <Mail className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
            {formData.email && !errors.email && (
              <CheckCircle className='absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-500' />
            )}
          </div>
          {errors.email && (
            <p className='text-sm text-red-600 flex items-center gap-1'>
              <AlertCircle className='w-4 h-4' />
              {errors.email}
            </p>
          )}
        </div>

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
                data-testid='first-name-input'
                value={formData.firstName}
                onChange={e => onFieldChange('firstName', e.target.value)}
                onFocus={handleFieldFocus}
                placeholder='Juan'
                className={cn(
                  'pl-10 text-base transition-all duration-200',
                  isMobile ? 'h-14 text-lg' : 'h-12',
                  errors.firstName
                    ? 'border-red-500 focus:border-red-500'
                    : formData.firstName && !errors.firstName
                      ? 'border-green-500 focus:border-green-600'
                      : 'border-gray-300 focus:border-blue-500',
                  isMobile && 'touch-manipulation focus:scale-[1.02]'
                )}
                required
              />
              <User className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
              {formData.firstName && !errors.firstName && (
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
                data-testid='last-name-input'
                value={formData.lastName}
                onChange={e => onFieldChange('lastName', e.target.value)}
                onFocus={handleFieldFocus}
                placeholder='Pérez'
                className={cn(
                  'pl-10 text-base transition-all duration-200',
                  isMobile ? 'h-14 text-lg' : 'h-12',
                  errors.lastName
                    ? 'border-red-500 focus:border-red-500'
                    : formData.lastName && !errors.lastName
                      ? 'border-green-500 focus:border-green-600'
                      : 'border-gray-300 focus:border-blue-500',
                  isMobile && 'touch-manipulation focus:scale-[1.02]'
                )}
                required
              />
              <User className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
              {formData.lastName && !errors.lastName && (
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

        {/* Campo DNI/CUIT */}
        <div className='space-y-2'>
          <Label
            htmlFor='dni'
            className='text-sm font-medium text-gray-700 flex items-center gap-2'
          >
            <CreditCard className='w-4 h-4' />
            DNI / CUIT
          </Label>
          <div className='relative'>
            <Input
              id='dni'
              type='text'
              data-testid='dni-input'
              value={formData.dni}
              onChange={e => onFieldChange('dni', e.target.value)}
              onFocus={handleFieldFocus}
              placeholder='12345678 o 20-12345678-9'
              className={cn(
                'pl-10 text-base transition-all duration-200',
                isMobile ? 'h-14 text-lg' : 'h-12',
                errors.dni
                  ? 'border-red-500 focus:border-red-500'
                  : formData.dni && !errors.dni
                    ? 'border-green-500 focus:border-green-600'
                    : 'border-gray-300 focus:border-blue-500',
                isMobile && 'touch-manipulation focus:scale-[1.02]'
              )}
              required
            />
            <CreditCard className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
            {formData.dni && !errors.dni && (
              <CheckCircle className='absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-500' />
            )}
          </div>
          {errors.dni && (
            <p className='text-sm text-red-600 flex items-center gap-1'>
              <AlertCircle className='w-4 h-4' />
              {errors.dni}
            </p>
          )}
          <p className='text-xs text-gray-500'>
            Ingresa tu DNI (8 dígitos) o CUIT (formato: 20-12345678-9)
          </p>
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
              data-testid='phone-input'
              value={formData.phone}
              onChange={e => onFieldChange('phone', e.target.value)}
              onFocus={handleFieldFocus}
              placeholder='351 123 4567'
              className={cn(
                'pl-10 text-base transition-all duration-200',
                isMobile ? 'h-14 text-lg' : 'h-12',
                errors.phone
                  ? 'border-red-500 focus:border-red-500'
                  : formData.phone && !errors.phone
                    ? 'border-green-500 focus:border-green-600'
                    : 'border-gray-300 focus:border-blue-500',
                isMobile && 'touch-manipulation focus:scale-[1.02]'
              )}
              required
            />
            <Phone className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
            {formData.phone && !errors.phone && (
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

        {/* Campo Dirección */}
        <div className='space-y-2'>
          <Label
            htmlFor='streetAddress'
            className='text-sm font-medium text-gray-700 flex items-center gap-2'
          >
            <MapPin className='w-4 h-4' />
            Dirección
          </Label>
          <div className='relative'>
            <Input
              id='streetAddress'
              type='text'
              data-testid='address-input'
              value={formData.streetAddress}
              onChange={e => onFieldChange('streetAddress', e.target.value)}
              onFocus={handleFieldFocus}
              placeholder='Av. Corrientes 1234, Córdoba'
              className={cn(
                'pl-10 text-base transition-all duration-200',
                isMobile ? 'h-14 text-lg' : 'h-12',
                errors.streetAddress
                  ? 'border-red-500 focus:border-red-500'
                  : formData.streetAddress && !errors.streetAddress
                    ? 'border-green-500 focus:border-green-600'
                    : 'border-gray-300 focus:border-blue-500',
                isMobile && 'touch-manipulation focus:scale-[1.02]'
              )}
              required
            />
            <MapPin className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
            {formData.streetAddress && !errors.streetAddress && (
              <CheckCircle className='absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-500' />
            )}
          </div>
          {errors.streetAddress && (
            <p className='text-sm text-red-600 flex items-center gap-1'>
              <AlertCircle className='w-4 h-4' />
              {errors.streetAddress}
            </p>
          )}
        </div>

        {/* Campo Observaciones */}
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
              onChange={e => onFieldChange('observations', e.target.value)}
              onFocus={handleFieldFocus}
              placeholder='Ej: Barrio Nueva Córdoba, casa con portón azul, disponible de 9 a 18hs'
              className={cn(
                'w-full pl-10 pt-3 pb-3 pr-3 text-base transition-all duration-200 resize-none',
                isMobile ? 'min-h-[100px] text-lg' : 'min-h-[80px]',
                'border-gray-300 focus:border-blue-500 rounded-md',
                isMobile && 'touch-manipulation focus:scale-[1.02]'
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
    </form>
  )
}

export default ExpressForm
