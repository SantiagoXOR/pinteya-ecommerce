// ===================================
// PINTEYA E-COMMERCE - TESTING UTILITIES
// ===================================

import { CreatePreferencePayload, PaymentPreferenceResponse } from '@/types/checkout';
import { ApiResponse } from '@/types/api';

/**
 * Función para probar el flujo completo de checkout
 */
export const testCheckoutFlow = async () => {
  console.log('🧪 Iniciando test del flujo de checkout...');

  // 1. Test de productos disponibles
  console.log('📦 Verificando productos disponibles...');
  try {
    const productsResponse = await fetch('/api/products');
    const productsData = await productsResponse.json();
    
    if (!productsData.success || productsData.data.length === 0) {
      throw new Error('No hay productos disponibles');
    }
    
    console.log(`✅ ${productsData.data.length} productos disponibles`);
  } catch (error) {
    console.error('❌ Error al obtener productos:', error);
    return false;
  }

  // 2. Test de creación de preferencia de pago (simulado)
  console.log('💳 Probando creación de preferencia de pago...');
  try {
    const testPayload: CreatePreferencePayload = {
      items: [
        {
          id: '1',
          name: 'Pintura Látex Interior Blanco 20L',
          price: 15000,
          quantity: 2,
          image: '/images/products/pintura-latex.jpg',
        },
        {
          id: '2',
          name: 'Rodillo Antigota 23cm',
          price: 3500,
          quantity: 1,
          image: '/images/products/rodillo.jpg',
        }
      ],
      payer: {
        name: 'Juan',
        surname: 'Pérez',
        email: 'juan.perez@test.com',
        phone: '+54 11 1234-5678',
      },
      shipping: {
        cost: 1500,
        address: {
          street_name: 'Av. Corrientes',
          street_number: '1234',
          zip_code: '1043',
          city_name: 'Buenos Aires',
          state_name: 'CABA',
        },
      },
      external_reference: `test_${Date.now()}`,
    };

    const paymentResponse = await fetch('/api/payments/create-preference', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
    });

    const paymentData: ApiResponse<PaymentPreferenceResponse> = await paymentResponse.json();
    
    if (!paymentData.success) {
      throw new Error(paymentData.error || 'Error al crear preferencia');
    }

    console.log('✅ Preferencia de pago creada exitosamente');
    console.log(`📋 Preference ID: ${paymentData.data.preference_id}`);
    console.log(`🔗 Init Point: ${paymentData.data.init_point}`);

    return {
      success: true,
      preferenceId: paymentData.data.preference_id,
      initPoint: paymentData.data.init_point,
    };

  } catch (error) {
    console.error('❌ Error al crear preferencia de pago:', error);
    return false;
  }
};

/**
 * Función para probar las APIs individualmente
 */
export const testAPIs = async () => {
  console.log('🔍 Probando APIs individuales...');

  const tests = [
    {
      name: 'Productos',
      url: '/api/products',
      method: 'GET',
    },
    {
      name: 'Categorías',
      url: '/api/categories',
      method: 'GET',
    },
    {
      name: 'Test General',
      url: '/api/test',
      method: 'GET',
    },
  ];

  const results = [];

  for (const test of tests) {
    try {
      console.log(`🧪 Probando API: ${test.name}...`);
      
      const response = await fetch(test.url, {
        method: test.method,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log(`✅ ${test.name}: OK`);
        results.push({ ...test, status: 'success', data });
      } else {
        console.log(`❌ ${test.name}: Error - ${data.error || 'Unknown error'}`);
        results.push({ ...test, status: 'error', error: data.error });
      }
    } catch (error) {
      console.log(`❌ ${test.name}: Error de conexión - ${error}`);
      results.push({ ...test, status: 'error', error: error.message });
    }
  }

  return results;
};

/**
 * Función para validar el estado del carrito
 */
export const validateCartState = (cartItems: any[]) => {
  console.log('🛒 Validando estado del carrito...');

  if (cartItems.length === 0) {
    console.log('⚠️ El carrito está vacío');
    return false;
  }

  let totalItems = 0;
  let totalPrice = 0;

  cartItems.forEach(item => {
    totalItems += item.quantity;
    totalPrice += item.discountedPrice * item.quantity;
  });

  console.log(`✅ Carrito válido:`);
  console.log(`   📦 ${cartItems.length} productos únicos`);
  console.log(`   🔢 ${totalItems} items totales`);
  console.log(`   💰 Total: $${totalPrice.toLocaleString()}`);

  return {
    isValid: true,
    uniqueProducts: cartItems.length,
    totalItems,
    totalPrice,
  };
};

/**
 * Función para simular un flujo completo de usuario
 */
export const simulateUserFlow = async () => {
  console.log('👤 Simulando flujo completo de usuario...');

  // 1. Verificar productos
  console.log('1️⃣ Usuario navega a la tienda...');
  const apiResults = await testAPIs();
  
  if (apiResults.some(result => result.status === 'error')) {
    console.log('❌ Algunas APIs no están funcionando correctamente');
    return false;
  }

  // 2. Simular agregar productos al carrito
  console.log('2️⃣ Usuario agrega productos al carrito...');
  const mockCartItems = [
    {
      id: 1,
      title: 'Pintura Látex Interior Blanco 20L',
      price: 18000,
      discountedPrice: 15000,
      quantity: 2,
    },
    {
      id: 2,
      title: 'Rodillo Antigota 23cm',
      price: 4000,
      discountedPrice: 3500,
      quantity: 1,
    }
  ];

  const cartValidation = validateCartState(mockCartItems);
  if (!cartValidation || typeof cartValidation === 'boolean') {
    if (process.env.NODE_ENV === 'development') {
      console.log('❌ Error en validación del carrito');
    }
    return false;
  }

  // 3. Probar checkout
  if (process.env.NODE_ENV === 'development') {
    console.log('3️⃣ Usuario procede al checkout...');
  }
  const checkoutResult = await testCheckoutFlow();

  if (!checkoutResult) {
    if (process.env.NODE_ENV === 'development') {
      console.log('❌ Error en el proceso de checkout');
    }
    return false;
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('🎉 ¡Flujo completo exitoso!');
  }
  return {
    success: true,
    cartValidation,
    checkoutResult,
  };
};

// Función para ejecutar desde la consola del navegador
if (typeof window !== 'undefined') {
  (window as any).testPinteya = {
    testCheckoutFlow,
    testAPIs,
    validateCartState,
    simulateUserFlow,
  };
}
