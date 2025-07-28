// ===================================
// PINTEYA E-COMMERCE - CHECKOUT HOOK
// ===================================

import { useState, useCallback, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/redux/store';
import { selectCartItems, selectTotalPrice, removeAllItemsFromCart } from '@/redux/features/cart-slice';
import { CheckoutFormData, CheckoutState, CreatePreferencePayload, PaymentPreferenceResponse } from '@/types/checkout';
import { ApiResponse } from '@/types/api';
import { useUser } from '@clerk/nextjs';

const initialFormData: CheckoutFormData = {
  billing: {
    firstName: '',
    lastName: '',
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
  },
  shipping: {
    differentAddress: false,
  },
  paymentMethod: 'mercadopago',
  shippingMethod: 'free',
  couponCode: '',
};

export const useCheckout = () => {
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector(selectCartItems);
  const totalPrice = useAppSelector(selectTotalPrice);
  const { user, isLoaded } = useUser();

  const [checkoutState, setCheckoutState] = useState<CheckoutState>({
    formData: initialFormData,
    isLoading: false,
    errors: {},
    step: 'form',
    preferenceId: undefined,
    initPoint: undefined,
  });

  // ===================================
  // AUTO-COMPLETAR DATOS DEL USUARIO AUTENTICADO
  // ===================================
  useEffect(() => {
    if (isLoaded && user) {
      const userEmail = user.emailAddresses[0]?.emailAddress || '';
      const firstName = user.firstName || '';
      const lastName = user.lastName || '';
      const fullName = user.fullName || `${firstName} ${lastName}`.trim();

      // Auto-completar datos de facturación con información de Clerk
      setCheckoutState(prev => ({
        ...prev,
        formData: {
          ...prev.formData,
          billing: {
            ...prev.formData.billing,
            firstName: firstName || prev.formData.billing.firstName,
            lastName: lastName || prev.formData.billing.lastName,
            email: userEmail || prev.formData.billing.email,
          },
        },
      }));
    }
  }, [isLoaded, user]);

  // Estado para cupones
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
    type: 'percentage' | 'fixed';
  } | null>(null);

  // Actualizar datos del formulario
  const updateFormData = useCallback((updates: Partial<CheckoutFormData>) => {
    setCheckoutState(prev => ({
      ...prev,
      formData: { ...prev.formData, ...updates },
      errors: {}, // Limpiar errores al actualizar
    }));
  }, []);

  // Actualizar datos de facturación
  const updateBillingData = useCallback((billingData: Partial<CheckoutFormData['billing']>) => {
    setCheckoutState(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        billing: { ...prev.formData.billing, ...billingData },
      },
      errors: {},
    }));
  }, []);

  // Actualizar datos de envío
  const updateShippingData = useCallback((shippingData: Partial<CheckoutFormData['shipping']>) => {
    setCheckoutState(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        shipping: { ...prev.formData.shipping, ...shippingData },
      },
      errors: {},
    }));
  }, []);

  // Validar formulario
  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    const { billing, shipping } = checkoutState.formData;

    // Validaciones de facturación
    if (!billing.firstName.trim()) errors.firstName = 'Nombre es requerido';
    if (!billing.lastName.trim()) errors.lastName = 'Apellido es requerido';
    if (!billing.email.trim()) errors.email = 'Email es requerido';
    if (!billing.phone.trim()) errors.phone = 'Teléfono es requerido';
    if (!billing.streetAddress.trim()) errors.streetAddress = 'Dirección es requerida';
    if (!billing.city.trim()) errors.city = 'Ciudad es requerida';
    if (!billing.state.trim()) errors.state = 'Provincia es requerida';
    if (!billing.zipCode.trim()) errors.zipCode = 'Código postal es requerido';

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (billing.email && !emailRegex.test(billing.email)) {
      errors.email = 'Email inválido';
    }

    // Validaciones de envío si es diferente
    if (shipping.differentAddress) {
      if (!shipping.firstName?.trim()) errors.shippingFirstName = 'Nombre de envío es requerido';
      if (!shipping.lastName?.trim()) errors.shippingLastName = 'Apellido de envío es requerido';
      if (!shipping.streetAddress?.trim()) errors.shippingStreetAddress = 'Dirección de envío es requerida';
      if (!shipping.city?.trim()) errors.shippingCity = 'Ciudad de envío es requerida';
      if (!shipping.state?.trim()) errors.shippingState = 'Provincia de envío es requerida';
      if (!shipping.zipCode?.trim()) errors.shippingZipCode = 'Código postal de envío es requerido';
    }

    // Validar que hay items en el carrito
    if (cartItems.length === 0) {
      errors.cart = 'El carrito está vacío';
    }

    setCheckoutState(prev => ({ ...prev, errors }));
    return Object.keys(errors).length === 0;
  }, [checkoutState.formData, cartItems.length]);

  // Manejar cupones
  const applyCoupon = useCallback((couponCode: string, discount: number) => {
    if (couponCode && discount > 0) {
      // Determinar tipo de descuento basado en el valor
      const type = discount <= 100 ? 'percentage' : 'fixed';
      setAppliedCoupon({ code: couponCode, discount, type });
    } else {
      setAppliedCoupon(null);
    }
  }, []);

  // Calcular descuento
  const calculateDiscount = useCallback((): number => {
    if (!appliedCoupon) return 0;

    const price = Number(totalPrice);
    if (isNaN(price)) return 0;

    if (appliedCoupon.type === 'fixed') {
      return appliedCoupon.discount;
    } else {
      return Math.round(price * (appliedCoupon.discount / 100));
    }
  }, [appliedCoupon, totalPrice]);

  // Calcular costos
  const calculateShippingCost = useCallback((): number => {
    const { shippingMethod } = checkoutState.formData;
    let shippingCost = 0;
    const price = Number(totalPrice);

    if (isNaN(price)) return 0;

    switch (shippingMethod) {
      case 'express':
        shippingCost = 2500; // $25 ARS
        break;
      case 'pickup':
        shippingCost = 0;
        break;
      case 'free':
      default:
        shippingCost = price > 50000 ? 0 : 1500; // Envío gratis por compras > $500 ARS
        break;
    }

    // Si el cupón es de envío gratis, aplicar descuento
    if (appliedCoupon?.code === 'ENVIOGRATIS') {
      shippingCost = 0;
    }

    return shippingCost;
  }, [checkoutState.formData, totalPrice, appliedCoupon]);

  const calculateTotal = useCallback((): number => {
    const price = Number(totalPrice);
    if (isNaN(price)) return 0;

    const shipping = calculateShippingCost();
    const discount = calculateDiscount();

    return Math.max(0, price + shipping - discount);
  }, [totalPrice, calculateShippingCost, calculateDiscount]);

  // Procesar checkout
  const processCheckout = useCallback(async (): Promise<void> => {
    if (!validateForm()) {
      return;
    }

    setCheckoutState(prev => ({ ...prev, isLoading: true, step: 'processing' }));

    try {
      const { billing, shipping } = checkoutState.formData;
      const shippingCost = calculateShippingCost();

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
        shipping: shippingCost > 0 ? {
          cost: shippingCost,
          address: {
            street_name: shipping.differentAddress ? shipping.streetAddress! : billing.streetAddress,
            street_number: "123", // Número por defecto como string
            zip_code: shipping.differentAddress ? shipping.zipCode! : billing.zipCode,
            city_name: shipping.differentAddress ? shipping.city! : billing.city,
            state_name: shipping.differentAddress ? shipping.state! : billing.state,
          },
        } : undefined,
        external_reference: `checkout_${Date.now()}`,
      };

      // Llamar a la API
      const response = await fetch('/api/payments/create-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result: ApiResponse<PaymentPreferenceResponse> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Error procesando el pago');
      }

      // Limpiar carrito
      dispatch(removeAllItemsFromCart());

      // ✅ MEJORADO: Usar Wallet Brick en lugar de redirección directa
      setCheckoutState(prev => ({
        ...prev,
        step: 'payment',
        preferenceId: result.data.preference_id,
        initPoint: result.data.init_point
      }));

    } catch (error: any) {
      console.error('Error en checkout:', error);
      setCheckoutState(prev => ({
        ...prev,
        isLoading: false,
        step: 'form',
        errors: { general: error.message || 'Error procesando el pago' },
      }));
    }
  }, [checkoutState.formData, cartItems, validateForm, calculateShippingCost, dispatch]);

  // ===================================
  // CALLBACKS PARA WALLET BRICK
  // ===================================
  const handleWalletReady = useCallback(() => {
  }, []);

  const handleWalletError = useCallback((error: any) => {
    console.error('Error en Wallet Brick:', error);
    setCheckoutState(prev => ({
      ...prev,
      errors: { payment: error.message || 'Error en el sistema de pagos' },
      isLoading: false,
    }));
  }, []);

  const handleWalletSubmit = useCallback((data: any) => {
    setCheckoutState(prev => ({ ...prev, step: 'redirect' }));
  }, []);

  return {
    // Estado
    formData: checkoutState.formData,
    isLoading: checkoutState.isLoading,
    errors: checkoutState.errors,
    step: checkoutState.step,

    // ✅ NUEVO: Datos para Wallet Brick
    preferenceId: checkoutState.preferenceId,
    initPoint: checkoutState.initPoint,

    // Datos calculados
    cartItems,
    totalPrice,
    shippingCost: calculateShippingCost(),
    discount: calculateDiscount(),
    finalTotal: calculateTotal(),

    // Cupones
    appliedCoupon,
    applyCoupon,

    // Acciones
    updateFormData,
    updateBillingData,
    updateShippingData,
    validateForm,
    processCheckout,

    // ✅ NUEVO: Callbacks para Wallet Brick
    handleWalletReady,
    handleWalletError,
    handleWalletSubmit,
  };
};
