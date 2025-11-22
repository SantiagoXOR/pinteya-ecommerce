'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAppSelector } from '@/redux/store'
import { selectCartItems, selectTotalPrice } from '@/redux/features/cart-slice'
import { useCheckout } from './useCheckout'
import { validateEmail, validatePhoneNumber, validateDNI } from '@/lib/utils/consolidated-utils'

export type MetaCheckoutStep = 'summary' | 'contact' | 'shipping' | 'payment' | 'confirmation'

export interface MetaCheckoutState {
  currentStep: MetaCheckoutStep
  formData: {
    contact: {
      firstName: string
      lastName: string
      phone: string
    }
    shipping: {
      streetAddress: string
      apartment?: string
      observations?: string
    }
    paymentMethod: 'mercadopago' | 'cash'
  }
  errors: Record<string, string>
  isValid: Record<MetaCheckoutStep, boolean>
}

const STORAGE_KEY = 'meta_checkout_state'

const initialFormData: MetaCheckoutState['formData'] = {
  contact: {
    firstName: '',
    lastName: '',
    phone: '',
  },
  shipping: {
    streetAddress: '',
    apartment: '',
    observations: '',
  },
  paymentMethod: 'mercadopago',
}

export const useMetaCheckout = () => {
  // Obtener items del carrito desde Redux directamente
  const cartItemsFromRedux = useAppSelector(selectCartItems)
  const totalPriceFromRedux = useAppSelector(selectTotalPrice)
  
  // Asegurar que cartItems siempre sea un array válido
  const cartItems = useMemo(() => {
    if (cartItemsFromRedux === undefined || cartItemsFromRedux === null) {
      return []
    }
    return Array.isArray(cartItemsFromRedux) ? cartItemsFromRedux : []
  }, [cartItemsFromRedux])
  
  const totalPrice = useMemo(() => {
    return typeof totalPriceFromRedux === 'number' ? totalPriceFromRedux : 0
  }, [totalPriceFromRedux])
  
  const {
    formData: checkoutFormData,
    updateBillingData,
    updateFormData,
    processExpressCheckout,
    processCashOnDelivery,
    isLoading: checkoutIsLoading,
    errors: checkoutErrors,
    step: checkoutStep, // ✅ AGREGAR: Exponer step para redirección
    cashOrderData, // ✅ AGREGAR: Exponer cashOrderData para redirección
    finalTotal, // ✅ AGREGAR: Exponer finalTotal para redirección
    initPoint, // ✅ AGREGAR: Exponer initPoint para redirección a MercadoPago
  } = useCheckout()

  // ✅ Estado local de loading que se actualiza inmediatamente al hacer clic
  const [localIsLoading, setLocalIsLoading] = useState(false)

  const [state, setState] = useState<MetaCheckoutState>(() => {
    // Intentar recuperar del localStorage
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored)
          return {
            currentStep: parsed.currentStep || 'summary',
            formData: { ...initialFormData, ...parsed.formData },
            errors: {},
            isValid: parsed.isValid || {
              summary: true,
              contact: false,
              shipping: false,
              payment: false,
              confirmation: false,
            },
          }
        }
      } catch (error) {
        console.warn('Error recuperando estado del checkout:', error)
      }
    }

    return {
      currentStep: 'summary',
      formData: initialFormData,
      errors: {},
      isValid: {
        summary: true,
        contact: false,
        shipping: false,
        payment: false,
        confirmation: false,
      },
    }
  })

  // Sincronizar con datos del usuario autenticado si están disponibles
  useEffect(() => {
    if (checkoutFormData.billing.firstName && !state.formData.contact.firstName) {
      setState((prev) => ({
        ...prev,
        formData: {
          ...prev.formData,
          contact: {
            firstName: checkoutFormData.billing.firstName,
            lastName: checkoutFormData.billing.lastName,
            phone: checkoutFormData.billing.phone,
          },
                  shipping: {
                    ...prev.formData.shipping,
                    streetAddress: checkoutFormData.billing.streetAddress,
                    apartment: checkoutFormData.billing.apartment || '',
                    observations: checkoutFormData.billing.observations || '',
                  },
        },
      }))
    }
  }, [checkoutFormData.billing])

  // Guardar estado en localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      } catch (error) {
        console.warn('Error guardando estado del checkout:', error)
      }
    }
  }, [state])

  // Validar teléfono (usando la misma lógica permisiva del checkout original)
  const validatePhone = (phone: string): boolean => {
    if (!phone || phone.trim() === '') return false
    
    // Primero validar que solo contenga caracteres válidos para teléfonos
    // Permitir: dígitos, espacios, guiones, paréntesis, + (código de país)
    const validCharsRegex = /^[\d\s\-\(\)\+]+$/
    if (!validCharsRegex.test(phone)) {
      return false
    }
    
    // Luego contar solo dígitos, aceptar 8-13 dígitos (como en validateExpressForm)
    const digitsOnly = phone.replace(/\D/g, '')
    return digitsOnly.length >= 8 && digitsOnly.length <= 13
  }

  // Validar nombre/apellido (debe tener al menos 2 caracteres y no ser solo números)
  const validateName = (name: string): boolean => {
    if (!name || name.trim() === '') return false
    const trimmed = name.trim()
    // Debe tener al menos 2 caracteres y contener al menos una letra
    return trimmed.length >= 2 && /[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(trimmed)
  }

  // Validar campo individual (para validación en tiempo real)
  const validateField = useCallback((step: MetaCheckoutStep, field: string, value: string): string | null => {
    switch (step) {
      case 'contact':
        if (field === 'firstName') {
          if (!value?.trim()) {
            return 'Nombre es requerido'
          }
          if (!validateName(value)) {
            return 'El nombre debe tener al menos 2 caracteres y contener letras'
          }
        }
        if (field === 'lastName') {
          if (!value?.trim()) {
            return 'Apellido es requerido'
          }
          if (!validateName(value)) {
            return 'El apellido debe tener al menos 2 caracteres y contener letras'
          }
        }
        if (field === 'phone') {
          if (!value?.trim()) {
            return 'Teléfono es requerido'
          }
          if (!validatePhone(value)) {
            return 'Teléfono inválido. Ingresá 8–13 dígitos'
          }
        }
        break

      case 'shipping':
        if (field === 'streetAddress' && !value?.trim()) {
          return 'Dirección es requerida'
        }
        break
    }
    return null
  }, [])

  // Validar y generar errores para el paso actual
  const validateCurrentStep = useCallback((): boolean => {
    const errors: Record<string, string> = {}

    switch (state.currentStep) {
      case 'contact':
        const firstNameError = validateField('contact', 'firstName', state.formData.contact.firstName)
        if (firstNameError) errors.firstName = firstNameError
        
        const lastNameError = validateField('contact', 'lastName', state.formData.contact.lastName)
        if (lastNameError) errors.lastName = lastNameError
        
        const phoneError = validateField('contact', 'phone', state.formData.contact.phone)
        if (phoneError) errors.phone = phoneError
        break

      case 'shipping':
        const streetAddressError = validateField('shipping', 'streetAddress', state.formData.shipping.streetAddress)
        if (streetAddressError) errors.streetAddress = streetAddressError
        break

      case 'payment':
        if (!state.formData.paymentMethod) {
          errors.paymentMethod = 'Método de pago es requerido'
        }
        break
    }

    setState((prev) => ({
      ...prev,
      errors,
    }))

    return Object.keys(errors).length === 0
  }, [state.currentStep, state.formData])

  // Validar paso actual (sin generar errores, solo verificar)
  const validateStep = useCallback((step: MetaCheckoutStep): boolean => {
    switch (step) {
      case 'summary':
        return Array.isArray(cartItems) && cartItems.length > 0

      case 'contact':
        return (
          validateName(state.formData.contact.firstName) &&
          validateName(state.formData.contact.lastName) &&
          validatePhone(state.formData.contact.phone)
        )

      case 'shipping':
        return state.formData.shipping.streetAddress?.trim() !== ''

      case 'payment':
        return !!state.formData.paymentMethod

      case 'confirmation':
        return Object.values(state.isValid).every((v) => v)

      default:
        return false
    }
  }, [state.formData, cartItems])

  // Actualizar validación cuando cambian los datos
  useEffect(() => {
    const isValid = validateStep(state.currentStep)
    setState((prev) => ({
      ...prev,
      isValid: {
        ...prev.isValid,
        [state.currentStep]: isValid,
      },
    }))
  }, [state.currentStep, state.formData, validateStep])

  // Navegar al siguiente paso (con validación)
  const nextStep = useCallback(() => {
    // Validar antes de avanzar
    if (!validateCurrentStep()) {
      return
    }

    const steps: MetaCheckoutStep[] = ['summary', 'contact', 'shipping', 'payment', 'confirmation']
    const currentIndex = steps.indexOf(state.currentStep)

    if (currentIndex < steps.length - 1) {
      const nextStepValue = steps[currentIndex + 1]
      if (nextStepValue) {
        setState((prev) => ({
          ...prev,
          currentStep: nextStepValue,
          errors: {}, // Limpiar errores al avanzar
        }))
      }
    }
  }, [state.currentStep, validateCurrentStep])

  // Navegar al paso anterior
  const previousStep = useCallback(() => {
    const steps: MetaCheckoutStep[] = ['summary', 'contact', 'shipping', 'payment', 'confirmation']
    const currentIndex = steps.indexOf(state.currentStep)

    if (currentIndex > 0) {
      const previousStepValue = steps[currentIndex - 1]
      if (previousStepValue) {
        setState((prev) => ({
          ...prev,
          currentStep: previousStepValue,
        }))
      }
    }
  }, [state.currentStep])

  // Ir a un paso específico
  const goToStep = useCallback((step: MetaCheckoutStep) => {
    setState((prev) => ({
      ...prev,
      currentStep: step,
    }))
  }, [])

  // Actualizar datos de contacto
  const updateContact = useCallback((data: Partial<MetaCheckoutState['formData']['contact']>) => {
    setState((prev) => {
      const updatedContact = {
        ...prev.formData.contact,
        ...data,
      }
      
      // Validar en tiempo real y actualizar errores
      const errors = { ...prev.errors }
      if (data.firstName !== undefined) {
        const error = validateField('contact', 'firstName', updatedContact.firstName)
        if (error) {
          errors.firstName = error
        } else {
          delete errors.firstName
        }
      }
      if (data.lastName !== undefined) {
        const error = validateField('contact', 'lastName', updatedContact.lastName)
        if (error) {
          errors.lastName = error
        } else {
          delete errors.lastName
        }
      }
      if (data.phone !== undefined) {
        const error = validateField('contact', 'phone', updatedContact.phone)
        if (error) {
          errors.phone = error
        } else {
          delete errors.phone
        }
      }

      return {
        ...prev,
        formData: {
          ...prev.formData,
          contact: updatedContact,
        },
        errors,
      }
    })
  }, [validateField])

  // Actualizar datos de envío
  const updateShipping = useCallback((data: Partial<MetaCheckoutState['formData']['shipping']>) => {
    setState((prev) => {
      const updatedShipping = {
        ...prev.formData.shipping,
        ...data,
      }
      
      // Validar en tiempo real y actualizar errores
      const errors = { ...prev.errors }
      Object.keys(data).forEach((key) => {
        const error = validateField('shipping', key, updatedShipping[key as keyof typeof updatedShipping] as string)
        if (error) {
          errors[key] = error
        } else {
          delete errors[key]
        }
      })

      return {
        ...prev,
        formData: {
          ...prev.formData,
          shipping: updatedShipping,
        },
        errors,
      }
    })
  }, [validateField])

  // Actualizar método de pago
  const updatePaymentMethod = useCallback((method: 'mercadopago' | 'cash') => {
    setState((prev) => ({
      ...prev,
      formData: {
        ...prev.formData,
        paymentMethod: method,
      },
    }))
    updateFormData({ paymentMethod: method })
  }, [updateFormData])

  // Sincronizar con checkout principal antes de procesar
  const syncWithCheckout = useCallback(() => {
    updateBillingData({
      firstName: state.formData.contact.firstName,
      lastName: state.formData.contact.lastName,
      dni: '', // DNI no se pide en shipping, se puede agregar después si es necesario
      email: '', // Email se puede obtener después si es necesario
      phone: state.formData.contact.phone,
      streetAddress: state.formData.shipping.streetAddress,
      city: 'Córdoba', // Ciudad fija para Córdoba Capital
      state: 'Córdoba', // Provincia fija para Córdoba Capital
      zipCode: '5000', // Código postal por defecto para Córdoba Capital
      apartment: state.formData.shipping.apartment || '',
      observations: state.formData.shipping.observations || '',
    })
    updateFormData({ paymentMethod: state.formData.paymentMethod })
  }, [state.formData, updateBillingData, updateFormData])

  // Procesar checkout
  const processCheckout = useCallback(async () => {
    // ✅ ACTUALIZAR: Establecer loading inmediatamente antes de cualquier operación
    setLocalIsLoading(true)
    
    try {
      // ✅ CORREGIR: Preparar datos directamente para evitar problemas de timing
      const billingData = {
        firstName: state.formData.contact.firstName,
        lastName: state.formData.contact.lastName,
        dni: '', // DNI no se pide en flujo meta
        email: '', // Email no se pide en flujo meta
        phone: state.formData.contact.phone,
        streetAddress: state.formData.shipping.streetAddress,
        city: 'Córdoba',
        state: 'Córdoba',
        zipCode: '5000',
        apartment: state.formData.shipping.apartment || '',
        observations: state.formData.shipping.observations || '',
      }

      console.log('🔄 useMetaCheckout - Datos preparados para processCashOnDelivery:', {
        firstName: billingData.firstName,
        lastName: billingData.lastName,
        phone: billingData.phone,
        streetAddress: billingData.streetAddress
      })

      // ✅ Sincronizar estado para mantener consistencia (pero usar datos directos para validación)
      syncWithCheckout()

      if (state.formData.paymentMethod === 'cash') {
        // ✅ CORREGIR: Pasar datos directamente para evitar problemas de timing con el estado
        await processCashOnDelivery(true, billingData)
      } else {
        // Pasar true para indicar que es flujo meta (no requiere DNI ni email)
        await processExpressCheckout(true)
      }
    } catch (error) {
      // Manejar errores si es necesario
      console.error('Error en processCheckout:', error)
      // El error se manejará en useCheckout, pero reseteamos nuestro loading local
      setLocalIsLoading(false)
    }
    // Nota: No reseteamos localIsLoading aquí porque queremos que se mantenga
    // hasta que checkoutIsLoading también sea false (manejado por useEffect)
  }, [state.formData, syncWithCheckout, processCashOnDelivery, processExpressCheckout])

  // Limpiar estado
  const clearState = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
    }
    setState({
      currentStep: 'summary',
      formData: initialFormData,
      errors: {},
      isValid: {
        summary: true,
        contact: false,
        shipping: false,
        payment: false,
        confirmation: false,
      },
    })
  }, [])

  // ✅ Combinar ambos estados de loading para respuesta inmediata
  const isLoading = localIsLoading || checkoutIsLoading

  // ✅ Sincronizar localIsLoading cuando checkoutIsLoading cambia
  useEffect(() => {
    if (!checkoutIsLoading && localIsLoading) {
      // Si checkout terminó, resetear local también
      setLocalIsLoading(false)
    }
  }, [checkoutIsLoading, localIsLoading])

  return {
    state,
    cartItems: Array.isArray(cartItems) ? cartItems : [],
    totalPrice: typeof totalPrice === 'number' ? totalPrice : 0,
    isLoading,
    errors: { ...state.errors, ...checkoutErrors },
    nextStep,
    previousStep,
    goToStep,
    updateContact,
    updateShipping,
    updatePaymentMethod,
    processCheckout,
    validateStep,
    validateCurrentStep,
    clearState,
    canProceed: state.isValid[state.currentStep],
    // ✅ AGREGAR: Exponer estado de useCheckout para redirección
    checkoutStep, // step del checkout principal (form, cash_success, etc.)
    cashOrderData, // datos de la orden de cash on delivery
    finalTotal, // total final calculado
    initPoint, // URL de redirección a MercadoPago
  }
}

