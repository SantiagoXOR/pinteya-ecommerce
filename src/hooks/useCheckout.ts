'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useAppDispatch, useAppSelector } from '@/redux/store'
import {
  selectCartItems,
  selectTotalPrice,
  removeAllItemsFromCart,
} from '@/redux/features/cart-slice'
import {
  CheckoutFormData,
  CheckoutState,
  CreatePreferencePayload,
  PaymentPreferenceResponse,
} from '@/types/checkout'
import { ApiResponse } from '@/types/api'
import { useAuth } from './useAuth'
import { validateEmail, validatePhoneNumber, validateDNI } from '@/lib/utils/consolidated-utils'

const initialFormData: CheckoutFormData = {
  billing: {
    firstName: '',
    lastName: '',
    dni: '',
    companyName: '',
    country: 'Argentina',
    streetAddress: '',
    apartment: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    email: '',
    orderNotes: '',
    observations: '',
  },
  shipping: {
    differentAddress: false,
  },
  paymentMethod: 'cash',
  shippingMethod: 'express',
  couponCode: '',
}

export const useCheckout = () => {
  const dispatch = useAppDispatch()
  const cartItems = useAppSelector(selectCartItems)
  const totalPrice = useAppSelector(selectTotalPrice)
  const { user, isLoaded } = useAuth()

  const [checkoutState, setCheckoutState] = useState<CheckoutState>({
    formData: initialFormData,
    isLoading: false,
    errors: {},
    step: 'form',
    preferenceId: undefined,
    initPoint: undefined,
  })

  // Estado para cupones
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string
    discount: number
    type: 'percentage' | 'fixed'
  } | null>(null)

  // ===================================
  // AUTO-COMPLETAR DATOS DEL USUARIO AUTENTICADO
  // ===================================
  useEffect(() => {
    if (isLoaded && user) {
      const userEmail = user.email || ''
      const fullName = user.name || ''
      const [firstName, ...lastNameParts] = fullName.split(' ')
      const lastName = lastNameParts.join(' ')

      // Solo actualizar si los datos han cambiado para evitar recursión
      setCheckoutState(prev => {
        const currentBilling = prev.formData.billing

        // Verificar si realmente necesitamos actualizar
        const shouldUpdateFirstName = !currentBilling.firstName && firstName
        const shouldUpdateLastName = !currentBilling.lastName && lastName
        const shouldUpdateEmail = !currentBilling.email && userEmail

        if (!shouldUpdateFirstName && !shouldUpdateLastName && !shouldUpdateEmail) {
          return prev
        }

        return {
          ...prev,
          formData: {
            ...prev.formData,
            billing: {
              ...currentBilling,
              firstName: shouldUpdateFirstName ? firstName : currentBilling.firstName,
              lastName: shouldUpdateLastName ? lastName : currentBilling.lastName,
              email: shouldUpdateEmail ? userEmail : currentBilling.email,
            },
          },
        }
      })
    }
  }, [isLoaded, user?.email, user?.name])

  // ===================================
  // FUNCIONES DE CÁLCULO
  // ===================================
  const calculateShippingCost = useCallback(() => {
    const { shippingMethod } = checkoutState.formData

    switch (shippingMethod) {
      case 'free':
        return 0
      case 'standard':
        return totalPrice > 50000 ? 0 : 5000 // Envío gratis por compras mayores a $50,000
      case 'express':
        return 10000
      default:
        return 0
    }
  }, [checkoutState.formData.shippingMethod, totalPrice])

  const calculateDiscount = useCallback(() => {
    if (!appliedCoupon) {
      return 0
    }

    if (appliedCoupon.type === 'percentage') {
      return Math.round((totalPrice * appliedCoupon.discount) / 100)
    } else {
      return appliedCoupon.discount
    }
  }, [appliedCoupon, totalPrice])

  const calculateTotal = useCallback(() => {
    const shipping = calculateShippingCost()
    const discount = calculateDiscount()
    const total = Math.max(0, totalPrice + shipping - discount)
    console.log('🔍 calculateTotal:', { totalPrice, shipping, discount, total })
    return total
  }, [totalPrice, calculateShippingCost, calculateDiscount])

  // Actualizar datos del formulario
  const updateFormData = useCallback((updates: Partial<CheckoutFormData>) => {
    setCheckoutState(prev => ({
      ...prev,
      formData: { ...prev.formData, ...updates },
      errors: {}, // Limpiar errores al actualizar
    }))
  }, [])

  // Actualizar datos de facturación
  const updateBillingData = useCallback((billingData: Partial<CheckoutFormData['billing']>) => {
    setCheckoutState(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        billing: { ...prev.formData.billing, ...billingData },
      },
      errors: {}, // Limpiar errores al actualizar
    }))
  }, [])

  // Actualizar datos de envío
  const updateShippingData = useCallback((shippingData: Partial<CheckoutFormData['shipping']>) => {
    setCheckoutState(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        shipping: { ...prev.formData.shipping, ...shippingData },
      },
      errors: {}, // Limpiar errores al actualizar
    }))
  }, [])

  // Aplicar cupón de descuento
  const applyCoupon = useCallback(async (couponCode: string) => {
    if (!couponCode.trim()) {
      setCheckoutState(prev => ({
        ...prev,
        errors: { ...prev.errors, coupon: 'Ingresa un código de cupón' },
      }))
      return
    }

    try {
      // Simular validación de cupón (aquí iría la llamada a la API)
      const validCoupons = {
        DESCUENTO10: { discount: 10, type: 'percentage' as const },
        ENVIOGRATIS: { discount: 5000, type: 'fixed' as const },
        BIENVENIDO: { discount: 15, type: 'percentage' as const },
      }

      const coupon = validCoupons[couponCode.toUpperCase() as keyof typeof validCoupons]

      if (coupon) {
        setAppliedCoupon({
          code: couponCode.toUpperCase(),
          ...coupon,
        })
        setCheckoutState(prev => ({
          ...prev,
          formData: { ...prev.formData, couponCode: couponCode.toUpperCase() },
          errors: { ...prev.errors, coupon: undefined },
        }))
      } else {
        setCheckoutState(prev => ({
          ...prev,
          errors: { ...prev.errors, coupon: 'Código de cupón inválido' },
        }))
      }
    } catch (error) {
      setCheckoutState(prev => ({
        ...prev,
        errors: { ...prev.errors, coupon: 'Error validando el cupón' },
      }))
    }
  }, [])

  // ===================================
  // FUNCIONES DE VALIDACIÓN
  // ===================================

  // Validar formulario completo
  const validateForm = useCallback(() => {
    const { billing, shipping } = checkoutState.formData
    const errors: Record<string, string> = {}

    // Validaciones básicas
    if (!billing.firstName?.trim()) {
      errors.firstName = 'Nombre es requerido'
    }
    if (!billing.lastName?.trim()) {
      errors.lastName = 'Apellido es requerido'
    }
    if (!billing.email?.trim()) {
      errors.email = 'Email es requerido'
    }
    if (!billing.phone?.trim()) {
      errors.phone = 'Teléfono es requerido'
    }
    if (!billing.streetAddress?.trim()) {
      errors.streetAddress = 'Dirección es requerida'
    }
    if (!billing.city?.trim()) {
      errors.city = 'Ciudad es requerida'
    }
    if (!billing.state?.trim()) {
      errors.state = 'Provincia es requerida'
    }
    if (!billing.zipCode?.trim()) {
      errors.zipCode = 'Código postal es requerido'
    }

    // Validaciones avanzadas
    if (billing.email && !validateEmail(billing.email)) {
      errors.email = 'Email inválido'
    }

    // Validación más permisiva para teléfono en checkout express
    if (billing.phone) {
      const digitsOnly = billing.phone.replace(/\D/g, '')
      // Aceptar 8 a 11 dígitos (fijo/celular argentino, sin prefijo +54)
      if (digitsOnly.length < 8 || digitsOnly.length > 11) {
        errors.phone = 'Teléfono inválido. Ingresá 8–11 dígitos'
      }
    }

    if (billing.streetAddress && billing.streetAddress.length < 10) {
      errors.streetAddress = 'La dirección debe tener al menos 10 caracteres'
    }

    // Validación específica para Córdoba Capital
    if (billing.streetAddress && !billing.streetAddress.toLowerCase().includes('córdoba') && !billing.streetAddress.toLowerCase().includes('cordoba')) {
      errors.streetAddress = 'La dirección debe estar en Córdoba Capital'
    }

    // Validar código postal argentino (formato XXXX o AXXXX)
    if (billing.zipCode && !/^[A-Z]?\d{4}$/.test(billing.zipCode.toUpperCase())) {
      errors.zipCode = 'Código postal inválido'
    }

    // Validar envío si es dirección diferente
    if (shipping.differentAddress) {
      if (!shipping.streetAddress?.trim()) {
        errors.shippingStreetAddress = 'Dirección de envío es requerida'
      }
      if (!shipping.city?.trim()) {
        errors.shippingCity = 'Ciudad de envío es requerida'
      }
      if (!shipping.state?.trim()) {
        errors.shippingState = 'Provincia de envío es requerida'
      }
      if (!shipping.zipCode?.trim()) {
        errors.shippingZipCode = 'Código postal de envío es requerido'
      }

      if (shipping.zipCode && !/^[A-Z]?\d{4}$/.test(shipping.zipCode.toUpperCase())) {
        errors.shippingZipCode = 'Código postal de envío inválido'
      }
    }

    // Validar que hay items en el carrito
    if (cartItems.length === 0) {
      errors.cart = 'El carrito está vacío'
    }

    setCheckoutState(prev => ({ ...prev, errors }))
    return Object.keys(errors).length === 0
  }, [checkoutState.formData, cartItems.length])

  // Validar formulario express (solo campos esenciales)
  const validateExpressForm = useCallback(() => {
    const { billing } = checkoutState.formData
    const errors: Record<string, string> = {}

    console.log('🔍 validateExpressForm - Datos del formulario:', {
      firstName: billing.firstName,
      lastName: billing.lastName,
      dni: billing.dni,
      email: billing.email,
      phone: billing.phone,
      streetAddress: billing.streetAddress,
      paymentMethod: checkoutState.formData.paymentMethod,
      cartItemsLength: cartItems.length,
      currentStep: checkoutState.step, // ✅ NUEVO: Agregar step actual
    })

    // Validaciones esenciales para checkout express
    if (!billing.firstName?.trim()) {
      errors.firstName = 'Nombre es requerido'
    }
    if (!billing.lastName?.trim()) {
      errors.lastName = 'Apellido es requerido'
    }
    if (!billing.dni?.trim()) {
      errors.dni = 'DNI/CUIT es requerido'
    }
    if (!billing.email?.trim()) {
      errors.email = 'Email es requerido'
    }
    if (!billing.phone?.trim()) {
      errors.phone = 'Teléfono es requerido'
    }
    if (!billing.streetAddress?.trim()) {
      errors.streetAddress = 'Dirección es requerida'
    }

    // Validaciones avanzadas
    if (billing.email && !validateEmail(billing.email)) {
      errors.email = 'Email inválido'
    }

    // Validación más permisiva de teléfono para checkout express
    if (billing.phone) {
      const digitsOnly = billing.phone.replace(/\D/g, '')
      // Aceptar 8–13 dígitos (local y E.164 con +54 9)
      if (digitsOnly.length < 8 || digitsOnly.length > 13) {
        errors.phone = 'Teléfono inválido. Ingresá 8–13 dígitos'
      }
    }

    // Validación de DNI/CUIT argentino
    if (billing.dni && !validateDNI(billing.dni)) {
      errors.dni = 'DNI/CUIT inválido. Formato: 12345678 o 20-12345678-9'
    }

    // Validar método de pago
    if (!checkoutState.formData.paymentMethod) {
      errors.paymentMethod = 'Método de pago es requerido'
    }

    // ✅ NUEVO: Solo validar carrito si NO estamos en el step de pago
    // Durante el step 'payment', el carrito ya se vació pero es normal
    if (checkoutState.step !== 'payment' && cartItems.length === 0) {
      errors.cart = 'El carrito está vacío'
    }

    console.log('🔍 validateExpressForm - Errores encontrados:', errors)
    console.log('🔍 validateExpressForm - Formulario válido:', Object.keys(errors).length === 0)

    setCheckoutState(prev => ({ ...prev, errors }))
    return Object.keys(errors).length === 0
  }, [checkoutState.formData, checkoutState.step, cartItems.length]) // ✅ NUEVO: Agregar step a dependencias

  // ===================================
  // FUNCIONES DE PROCESAMIENTO
  // ===================================

  // Procesar checkout express
  const processExpressCheckout = useCallback(async (): Promise<void> => {
    if (!validateExpressForm()) {
      return
    }

    // Marcar que el checkout está en progreso
    sessionStorage.setItem('checkout-in-progress', 'true')

    setCheckoutState(prev => ({ ...prev, isLoading: true, step: 'processing' }))

    try {
      const { billing } = checkoutState.formData
      const shippingCost = calculateShippingCost()

      // Sanitizar teléfono para el backend (solo números, formato argentino 10-11 dígitos)
      let sanitizedPhone = billing.phone?.replace(/\D/g, '') || ''

      // Si empieza con 54 (código de Argentina), remover el código de país
      if (sanitizedPhone.startsWith('54') && sanitizedPhone.length > 11) {
        sanitizedPhone = sanitizedPhone.substring(2) // Remover "54"
      }

      // Si empieza con 9 (código de celular), mantenerlo para que sea 11 dígitos
      // Si no empieza con 9, debería ser 10 dígitos (teléfono fijo)

      console.log('🔍 processExpressCheckout - Teléfono original:', billing.phone)
      console.log('🔍 processExpressCheckout - Teléfono sanitizado:', sanitizedPhone)
      console.log('🔍 processExpressCheckout - Longitud del teléfono:', sanitizedPhone.length)

      // Preparar datos para la API (Express Checkout - campos simplificados)
      const payload: CreatePreferencePayload = {
        items: cartItems.map((item: any) => ({
          id: item.id.toString(),
          name: item.title,
          price: item.discountedPrice,
          quantity: item.quantity,
          image: item.imgs?.previews?.[0] || '',
        })),
        payer: {
          name: billing.firstName || 'Cliente', // Valor por defecto para express checkout
          surname: billing.lastName || 'Express', // Valor por defecto para express checkout
          email: billing.email,
          phone: sanitizedPhone, // Teléfono sanitizado (solo números)
        },
        shipping:
          shippingCost > 0
            ? {
                cost: shippingCost,
                address: (() => {
                  const full = (billing.streetAddress || '').trim()
                  const match = full.match(/^(.*?)(\b\d{1,5}\b)(.*)$/)
                  const street_name = match ? match[1].trim() : full
                  const street_number = match ? match[2].trim() : ''
                  return {
                    street_name,
                    street_number,
                    zip_code: billing.zipCode || '5000',
                    city_name: billing.city || 'Córdoba',
                    state_name: billing.state || 'Córdoba',
                  }
                })(),
              }
            : undefined,
        external_reference: `express_checkout_${Date.now()}`,
      }

      console.log('🔍 processExpressCheckout - Payload enviado:', payload)

      // Llamar a la API
      const response = await fetch('/api/payments/create-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const result: ApiResponse<PaymentPreferenceResponse> = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Error procesando el pago')
      }

      // ✅ SOLUCIÓN FINAL: Redirección directa a MercadoPago
      // Esto evita el problema de hooks con el Wallet Brick embebido
      console.log('🔄 Redirigiendo directamente a MercadoPago:', result.data.init_point)

      // Cambiar a estado de redirección inmediatamente
      setCheckoutState(prev => ({
        ...prev,
        step: 'redirect',
        preferenceId: result.data.preference_id,
        initPoint: result.data.init_point,
        isLoading: false,
      }))
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error procesando el pago'
      console.error('Error en express checkout:', error)
      setCheckoutState(prev => ({
        ...prev,
        isLoading: false,
        step: 'form',
        errors: { general: errorMessage },
      }))
    }
  }, [checkoutState.formData, cartItems, validateExpressForm, calculateShippingCost, dispatch])

  // Procesar checkout completo
  const processCheckout = useCallback(async (): Promise<void> => {
    if (!validateForm()) {
      return
    }

    // Marcar que el checkout está en progreso
    sessionStorage.setItem('checkout-in-progress', 'true')

    setCheckoutState(prev => ({ ...prev, isLoading: true, step: 'processing' }))

    try {
      const { billing, shipping } = checkoutState.formData
      const shippingCost = calculateShippingCost()

      // Preparar datos para la API
      const payload: CreatePreferencePayload = {
        items: cartItems.map((item: any) => ({
          id: item.id.toString(),
          name: item.title,
          price: item.discountedPrice,
          quantity: item.quantity,
          image: item.imgs?.previews?.[0] || '',
        })),
        payer: {
          name: billing.firstName,
          surname: billing.lastName,
          email: billing.email,
          phone: billing.phone,
        },
        shipping:
          shippingCost > 0
            ? {
                cost: shippingCost,
                address: (() => {
                  const full = (shipping.differentAddress ? shipping.streetAddress : billing.streetAddress) || ''
                  const match = full.match(/^(.*?)(\b\d{1,5}\b)(.*)$/)
                  const street_name = match ? match[1].trim() : full.trim()
                  const street_number = match ? match[2].trim() : ''
                  return {
                    street_name,
                    street_number,
                    zip_code: (shipping.differentAddress ? shipping.zipCode : billing.zipCode)!,
                    city_name: (shipping.differentAddress ? shipping.city : billing.city)!,
                    state_name: (shipping.differentAddress ? shipping.state : billing.state)!,
                  }
                })(),
              }
            : undefined,
        external_reference: `checkout_${Date.now()}`,
      }

      // Llamar a la API
      const response = await fetch('/api/payments/create-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const result: ApiResponse<PaymentPreferenceResponse> = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Error procesando el pago')
      }

      // Procesar resultado exitoso - mostrar paso de pago manual
      // NOTA: No limpiar el carrito aquí, se limpiará cuando el pago se complete exitosamente

      // ✅ CORREGIDO: Ir directamente a redirect para evitar error de hooks con MercadoPagoWallet
      console.log('🔄 Redirigiendo directamente a MercadoPago:', result.data.init_point)

      setCheckoutState(prev => ({
        ...prev,
        step: 'redirect',
        preferenceId: result.data.preference_id,
        initPoint: result.data.init_point,
        isLoading: false,
      }))
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error procesando el pago'
      console.error('Error en checkout:', error)
      setCheckoutState(prev => ({
        ...prev,
        isLoading: false,
        step: 'form',
        errors: { general: errorMessage },
      }))
    }
  }, [checkoutState.formData, cartItems, validateForm, calculateShippingCost, dispatch])

  // ===================================
  // CALLBACKS PARA WALLET BRICK
  // ===================================
  const handleWalletReady = useCallback(() => {
    console.log('Wallet Brick está listo')
  }, [])

  const handleWalletError = useCallback((error: any) => {
    console.error('Error en Wallet Brick:', error)
    setCheckoutState(prev => ({
      ...prev,
      errors: { payment: error.message || 'Error en el sistema de pagos' },
      isLoading: false,
    }))
  }, [])

  const handleWalletSubmit = useCallback((data: any) => {
    console.log('💳 Wallet Submit - Pago enviado desde Wallet Brick:', data)
    console.log('💳 Wallet Submit - Cambiando a step redirect')

    // IMPORTANTE: NO limpiar el carrito aquí
    // El carrito se limpiará solo cuando el pago sea confirmado como exitoso
    setCheckoutState(prev => ({
      ...prev,
      step: 'redirect',
      isLoading: false,
    }))
  }, [])

  // ===================================
  // VALORES MEMOIZADOS
  // ===================================
  // Memorizar valores calculados para evitar recursión infinita
  const memoizedShippingCost = useMemo(() => {
    try {
      const cost = calculateShippingCost()
      return typeof cost === 'number' && !isNaN(cost) ? cost : 0
    } catch (error) {
      console.error('❌ Error calculating shippingCost:', error)
      return 0
    }
  }, [calculateShippingCost])

  const memoizedDiscount = useMemo(() => {
    try {
      const disc = calculateDiscount()
      return typeof disc === 'number' && !isNaN(disc) ? disc : 0
    } catch (error) {
      console.error('❌ Error calculating discount:', error)
      return 0
    }
  }, [calculateDiscount])

  const memoizedFinalTotal = useMemo(() => {
    try {
      const total = calculateTotal()
      return typeof total === 'number' && !isNaN(total) ? total : 0
    } catch (error) {
      console.error('❌ Error calculating finalTotal:', error)
      return 0
    }
  }, [calculateTotal])

  // ===================================
  // FUNCIÓN PARA PAGO CONTRA ENTREGA
  // ===================================
  const processCashOnDelivery = useCallback(async () => {
    console.log('💰 Iniciando proceso de pago contra entrega')
    
    // Validar formulario EXPRESS (campos esenciales)
    const isValid = validateExpressForm()
    if (!isValid) {
      // Los errores ya se establecen dentro de validateForm()
      return
    }

    setCheckoutState(prev => ({
      ...prev,
      isLoading: true,
      errors: {},
    }))

    try {
      const { billing, shipping } = checkoutState.formData

      // Sanitizar teléfono para separar código de área y número
      let sanitizedPhone = billing.phone?.replace(/\D/g, '') || ''
      let areaCode = ''
      let phoneNumber = ''

      if (sanitizedPhone.length >= 10) {
        // Para Argentina: primeros 2-4 dígitos son código de área
        if (sanitizedPhone.startsWith('54')) {
          sanitizedPhone = sanitizedPhone.substring(2) // Remover código de país
        }
        
        if (sanitizedPhone.length === 10) {
          // Teléfono fijo: XXXX-XXXXXX
          areaCode = sanitizedPhone.substring(0, 4)
          phoneNumber = sanitizedPhone.substring(4)
        } else if (sanitizedPhone.length === 11) {
          // Celular: XXX-XXXXXXXX
          areaCode = sanitizedPhone.substring(0, 3)
          phoneNumber = sanitizedPhone.substring(3)
        } else {
          // Fallback
          areaCode = sanitizedPhone.substring(0, 3)
          phoneNumber = sanitizedPhone.substring(3)
        }
      } else {
        // Fallback para números cortos
        areaCode = '351' // Código de Córdoba por defecto
        phoneNumber = sanitizedPhone
      }

      // Determinar dirección de envío (separar calle y número si vienen juntos)
      const getStreetComponents = (addr?: string) => {
        const full = (addr || '').trim()
        const match = full.match(/^(.*?)(\b\d{1,5}\b)(.*)$/)
        return {
          street_name: match ? match[1].trim() : full,
          street_number: match ? match[2].trim() : '',
        }
      }

      const shippingAddress = (() => {
        const base = shipping.differentAddress ? getStreetComponents(shipping.streetAddress) : getStreetComponents(billing.streetAddress)
        return {
          street_name: base.street_name,
          street_number: base.street_number,
          city_name: (shipping.differentAddress ? shipping.city : billing.city) || 'Córdoba',
          state_name: (shipping.differentAddress ? shipping.state : billing.state) || 'Córdoba',
          zip_code: (shipping.differentAddress ? shipping.zipCode : billing.zipCode) || '5000',
        }
      })()

      // Preparar payload según el esquema CreateCashOrderSchema
      const payload = {
        items: cartItems.map(item => ({
          id: item.id.toString(), // Convertir a string como espera el esquema
          quantity: item.quantity,
          // Usar 'unit_price' para cumplir con CreateCashOrderSchema
          unit_price: item.discountedPrice || item.price,
        })),
        payer: {
          name: billing.firstName,
          surname: billing.lastName,
          email: billing.email,
          phone: {
            area_code: areaCode,
            number: phoneNumber,
          },
          identification: billing.dni ? {
            type: 'DNI',
            number: billing.dni,
          } : undefined,
        },
        shipments: {
          // ✅ Enviar costo de envío para que el backend lo incluya en el total
          cost: memoizedShippingCost,
          receiver_address: shippingAddress,
        },
        external_reference: `cash_order_${Date.now()}`,
      }

      console.log('📦 Enviando orden de pago contra entrega:', payload)

      // Llamar a la API de cash order
      const response = await fetch('/api/orders/create-cash-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Error creando la orden')
      }

      console.log('✅ Orden de pago contra entrega creada exitosamente:', result.data)

      // Persistir datos clave para la página de éxito
      try {
        const order = result?.data?.order
        const whatsappUrl = result?.data?.whatsapp_url || order?.whatsapp_url
        const whatsappMessage = result?.data?.whatsapp_message
        if (order) {
          const successParams = {
            orderId: order.order_number || String(order.id),
            total: Number(order.total ?? 0),
            whatsappUrl,
            whatsappMessage,
          }
          localStorage.setItem('cashSuccessParams', JSON.stringify(successParams))
          localStorage.setItem('cashOrderData', JSON.stringify(result.data))
        }
      } catch (e) {
        console.error('❌ No se pudo guardar cashSuccessParams en localStorage', e)
      }

      // Limpiar carrito
      dispatch(removeAllItemsFromCart())

      // Actualizar estado a cash_success
      setCheckoutState(prev => ({
        ...prev,
        step: 'cash_success',
        cashOrderData: result.data,
        isLoading: false,
      }))

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error procesando la orden'
      console.error('❌ Error en pago contra entrega:', error)
      setCheckoutState(prev => ({
        ...prev,
        isLoading: false,
        step: 'form',
        errors: { general: errorMessage },
      }))
    }
  }, [checkoutState.formData, cartItems, validateForm, memoizedShippingCost, memoizedDiscount, memoizedFinalTotal, dispatch])

  return {
    // Estado
    formData: checkoutState.formData,
    isLoading: checkoutState.isLoading,
    errors: checkoutState.errors,
    step: checkoutState.step,

    // Datos para Wallet Brick
    preferenceId: checkoutState.preferenceId,
    initPoint: checkoutState.initPoint,

    // Datos para Cash Order
    cashOrderData: checkoutState.cashOrderData,

    // Datos calculados
    cartItems,
    totalPrice,
    shippingCost: memoizedShippingCost,
    discount: memoizedDiscount,
    finalTotal: memoizedFinalTotal,

    // Cupones
    appliedCoupon,
    applyCoupon,

    // Acciones
    updateFormData,
    updateBillingData,
    updateShippingData,
    validateForm,
    validateExpressForm,
    processCheckout,
    processExpressCheckout,
    processCashOnDelivery,

    // Callbacks para Wallet Brick
    handleWalletReady,
    handleWalletError,
    handleWalletSubmit,
  }
}
