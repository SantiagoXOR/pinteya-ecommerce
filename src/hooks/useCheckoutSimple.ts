"use client";

import { useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/store';
import { selectCartItems, selectTotalPrice } from '@/redux/features/cart-slice';
import { CheckoutFormData, CheckoutState } from '@/types/checkout';

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
    observations: '',
  },
  shipping: {
    differentAddress: false,
  },
  paymentMethod: 'mercadopago',
  shippingMethod: 'free',
  couponCode: '',
};

export const useCheckoutSimple = () => {
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector(selectCartItems);
  const totalPrice = useAppSelector(selectTotalPrice);

  const [checkoutState, setCheckoutState] = useState<CheckoutState>({
    formData: initialFormData,
    isLoading: false,
    errors: {},
    step: 'form',
    preferenceId: undefined,
    initPoint: undefined,
  });

  // Actualizar datos del formulario
  const updateFormData = useCallback((updates: Partial<CheckoutFormData>) => {
    setCheckoutState(prev => ({
      ...prev,
      formData: { ...prev.formData, ...updates },
      errors: {}, // Limpiar errores al actualizar
    }));
  }, []);

  // Validar formulario
  const validateForm = useCallback(() => {
    const { billing, shipping } = checkoutState.formData;
    const errors: Record<string, string> = {};

    // Validaciones básicas
    if (!billing.firstName?.trim()) errors.firstName = 'Nombre es requerido';
    if (!billing.lastName?.trim()) errors.lastName = 'Apellido es requerido';
    if (!billing.email?.trim()) errors.email = 'Email es requerido';
    if (!billing.phone?.trim()) errors.phone = 'Teléfono es requerido';
    if (!billing.streetAddress?.trim()) errors.streetAddress = 'Dirección es requerida';
    if (!billing.city?.trim()) errors.city = 'Ciudad es requerida';
    if (!billing.state?.trim()) errors.state = 'Provincia es requerida';
    if (!billing.zipCode?.trim()) errors.zipCode = 'Código postal es requerido';

    // Validar email
    if (billing.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billing.email)) {
      errors.email = 'Email inválido';
    }

    // Validar que hay items en el carrito
    if (cartItems.length === 0) {
      errors.cart = 'El carrito está vacío';
    }

    setCheckoutState(prev => ({ ...prev, errors }));
    return Object.keys(errors).length === 0;
  }, [checkoutState.formData, cartItems.length]);

  // Procesar checkout
  const processCheckout = useCallback(async () => {
    if (!validateForm()) {
      return { success: false, error: 'Por favor completa todos los campos requeridos' };
    }

    setCheckoutState(prev => ({ ...prev, isLoading: true }));

    try {
      // Simular procesamiento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setCheckoutState(prev => ({ 
        ...prev, 
        isLoading: false,
        step: 'success'
      }));

      return { success: true };
    } catch (error) {
      setCheckoutState(prev => ({ ...prev, isLoading: false }));
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error procesando el checkout' 
      };
    }
  }, [validateForm]);

  return {
    // Estado
    formData: checkoutState.formData,
    errors: checkoutState.errors,
    isLoading: checkoutState.isLoading,
    step: checkoutState.step,
    
    // Datos del carrito
    cartItems,
    totalPrice,
    
    // Funciones
    updateFormData,
    validateForm,
    processCheckout,
  };
};
