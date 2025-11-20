'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAppSelector } from '@/redux/store'
import { selectCartItems, selectTotalPrice } from '@/redux/features/cart-slice'
import { useCheckout } from './useCheckout'

export type MetaCheckoutStep = 'summary' | 'contact' | 'shipping' | 'payment' | 'confirmation'

export interface MetaCheckoutState {
  currentStep: MetaCheckoutStep
  formData: {
    contact: {
      email: string
      phone: string
    }
    shipping: {
      firstName: string
      lastName: string
      dni: string
      streetAddress: string
      city: string
      state: string
      zipCode: string
      apartment?: string
    }
    paymentMethod: 'mercadopago' | 'cash'
  }
  errors: Record<string, string>
  isValid: Record<MetaCheckoutStep, boolean>
}

const STORAGE_KEY = 'meta_checkout_state'

const initialFormData: MetaCheckoutState['formData'] = {
  contact: {
    email: '',
    phone: '',
  },
  shipping: {
    firstName: '',
    lastName: '',
    dni: '',
    streetAddress: '',
    city: '',
    state: '',
    zipCode: '',
    apartment: '',
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
    isLoading,
    errors: checkoutErrors,
  } = useCheckout()

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
    if (checkoutFormData.billing.email && !state.formData.contact.email) {
      setState((prev) => ({
        ...prev,
        formData: {
          ...prev.formData,
          contact: {
            email: checkoutFormData.billing.email,
            phone: checkoutFormData.billing.phone,
          },
          shipping: {
            ...prev.formData.shipping,
            firstName: checkoutFormData.billing.firstName,
            lastName: checkoutFormData.billing.lastName,
            dni: checkoutFormData.billing.dni || '',
            streetAddress: checkoutFormData.billing.streetAddress,
            city: checkoutFormData.billing.city,
            state: checkoutFormData.billing.state,
            zipCode: checkoutFormData.billing.zipCode,
            apartment: checkoutFormData.billing.apartment,
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

  // Validar email
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Validar teléfono (formato argentino básico)
  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^(\+?54)?\s?9?\s?\d{4}[\s-]?\d{4}$/
    return phoneRegex.test(phone.replace(/\s/g, ''))
  }

  // Validar DNI
  const validateDNI = (dni: string): boolean => {
    return /^\d{7,8}$/.test(dni)
  }

  // Validar paso actual
  const validateStep = useCallback((step: MetaCheckoutStep): boolean => {
    switch (step) {
      case 'summary':
        return Array.isArray(cartItems) && cartItems.length > 0

      case 'contact':
        return (
          validateEmail(state.formData.contact.email) &&
          validatePhone(state.formData.contact.phone)
        )

      case 'shipping':
        return (
          state.formData.shipping.firstName.trim() !== '' &&
          state.formData.shipping.lastName.trim() !== '' &&
          validateDNI(state.formData.shipping.dni) &&
          state.formData.shipping.streetAddress.trim() !== '' &&
          state.formData.shipping.city.trim() !== '' &&
          state.formData.shipping.state.trim() !== '' &&
          state.formData.shipping.zipCode.trim() !== ''
        )

      case 'payment':
        return state.formData.paymentMethod !== ''

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

  // Navegar al siguiente paso
  const nextStep = useCallback(() => {
    const steps: MetaCheckoutStep[] = ['summary', 'contact', 'shipping', 'payment', 'confirmation']
    const currentIndex = steps.indexOf(state.currentStep)

    if (currentIndex < steps.length - 1) {
      const nextStepValue = steps[currentIndex + 1]
      setState((prev) => ({
        ...prev,
        currentStep: nextStepValue,
      }))
    }
  }, [state.currentStep])

  // Navegar al paso anterior
  const previousStep = useCallback(() => {
    const steps: MetaCheckoutStep[] = ['summary', 'contact', 'shipping', 'payment', 'confirmation']
    const currentIndex = steps.indexOf(state.currentStep)

    if (currentIndex > 0) {
      const previousStepValue = steps[currentIndex - 1]
      setState((prev) => ({
        ...prev,
        currentStep: previousStepValue,
      }))
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
    setState((prev) => ({
      ...prev,
      formData: {
        ...prev.formData,
        contact: {
          ...prev.formData.contact,
          ...data,
        },
      },
      errors: {},
    }))
  }, [])

  // Actualizar datos de envío
  const updateShipping = useCallback((data: Partial<MetaCheckoutState['formData']['shipping']>) => {
    setState((prev) => ({
      ...prev,
      formData: {
        ...prev.formData,
        shipping: {
          ...prev.formData.shipping,
          ...data,
        },
      },
      errors: {},
    }))
  }, [])

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
      firstName: state.formData.shipping.firstName,
      lastName: state.formData.shipping.lastName,
      dni: state.formData.shipping.dni,
      email: state.formData.contact.email,
      phone: state.formData.contact.phone,
      streetAddress: state.formData.shipping.streetAddress,
      city: state.formData.shipping.city,
      state: state.formData.shipping.state,
      zipCode: state.formData.shipping.zipCode,
      apartment: state.formData.shipping.apartment,
    })
    updateFormData({ paymentMethod: state.formData.paymentMethod })
  }, [state.formData, updateBillingData, updateFormData])

  // Procesar checkout
  const processCheckout = useCallback(async () => {
    syncWithCheckout()

    if (state.formData.paymentMethod === 'cash') {
      await processCashOnDelivery()
    } else {
      await processExpressCheckout()
    }
  }, [state.formData.paymentMethod, syncWithCheckout, processCashOnDelivery, processExpressCheckout])

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
    clearState,
    canProceed: state.isValid[state.currentStep],
  }
}

