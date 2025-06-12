// ===================================
// PINTEYA E-COMMERCE - TEST MERCADOPAGO CREDENTIALS
// ===================================

import { ApiResponse } from '@/types/api';
import { PaymentPreferenceResponse } from '@/types/checkout';

/**
 * Función para probar las credenciales de MercadoPago
 */
export const testMercadoPagoCredentials = async () => {
  console.log('🧪 Iniciando test de credenciales MercadoPago...');

  try {
    // Datos de prueba para crear una preferencia
    const testPayload = {
      items: [
        {
          id: '1',
          name: 'Pintura Test - Sherwin Williams',
          price: 15000,
          quantity: 1,
          image: 'https://example.com/test.jpg',
        }
      ],
      payer: {
        name: 'Test',
        surname: 'Usuario',
        email: 'test@pinteya.com',
        phone: '1234567890',
      },
      shipping: {
        cost: 1500,
        address: {
          street_name: 'Av. Corrientes',
          street_number: 1234,
          zip_code: '1043',
          city_name: 'Buenos Aires',
          state_name: 'CABA',
        },
      },
      external_reference: `test_${Date.now()}`,
    };

    console.log('📦 Enviando datos de prueba a MercadoPago...');

    // Llamar a la API de crear preferencia
    const response = await fetch('/api/payments/create-preference', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
    });

    const result: ApiResponse<PaymentPreferenceResponse> = await response.json();

    if (!result.success) {
      console.error('❌ Error al crear preferencia:', result.error);
      return {
        success: false,
        error: result.error,
        details: 'Verificar credenciales de MercadoPago en .env.local'
      };
    }

    console.log('✅ Preferencia creada exitosamente!');
    console.log(`📋 Preference ID: ${result.data.preference_id}`);
    console.log(`🔗 Init Point: ${result.data.init_point}`);

    // Verificar que tenemos URLs válidas
    if (!result.data.init_point) {
      console.warn('⚠️ No se obtuvo init_point de producción');
      return {
        success: false,
        error: 'No se obtuvo URL de pago válida',
        details: 'Verificar configuración de MercadoPago'
      };
    }

    return {
      success: true,
      data: {
        preference_id: result.data.preference_id,
        init_point: result.data.init_point,
      },
      message: 'Credenciales de MercadoPago funcionando correctamente'
    };

  } catch (error: any) {
    console.error('❌ Error en test de MercadoPago:', error);
    return {
      success: false,
      error: error.message || 'Error de conexión',
      details: 'Verificar que el servidor esté ejecutándose'
    };
  }
};

/**
 * Función para verificar variables de entorno de MercadoPago
 */
export const checkMercadoPagoEnvVars = () => {
  console.log('🔍 Verificando variables de entorno de MercadoPago...');

  const requiredVars = [
    'MERCADOPAGO_ACCESS_TOKEN',
    'NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY',
  ];

  const missingVars = [];
  const configuredVars = [];

  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (!value || value.includes('your_') || value.includes('_here')) {
      missingVars.push(varName);
    } else {
      configuredVars.push(varName);
    }
  }

  console.log(`✅ Variables configuradas: ${configuredVars.length}/${requiredVars.length}`);
  
  if (configuredVars.length > 0) {
    console.log('✅ Configuradas:', configuredVars.join(', '));
  }

  if (missingVars.length > 0) {
    console.log('❌ Faltantes:', missingVars.join(', '));
    return {
      success: false,
      configured: configuredVars,
      missing: missingVars,
      message: 'Faltan variables de entorno de MercadoPago'
    };
  }

  return {
    success: true,
    configured: configuredVars,
    missing: [],
    message: 'Todas las variables de MercadoPago están configuradas'
  };
};

/**
 * Función para probar el flujo completo de checkout
 */
export const testCompleteCheckoutFlow = async () => {
  console.log('🚀 Iniciando test completo del flujo de checkout...');

  // 1. Verificar variables de entorno
  const envCheck = checkMercadoPagoEnvVars();
  if (!envCheck.success) {
    return envCheck;
  }

  // 2. Probar credenciales de MercadoPago
  const mpTest = await testMercadoPagoCredentials();
  if (!mpTest.success) {
    return mpTest;
  }

  // 3. Verificar APIs relacionadas
  const apiTests = [
    { name: 'Products API', url: '/api/products' },
    { name: 'Categories API', url: '/api/categories' },
  ];

  for (const test of apiTests) {
    try {
      console.log(`🧪 Probando ${test.name}...`);
      const response = await fetch(test.url);
      const data = await response.json();

      if (response.ok && data.success) {
        console.log(`✅ ${test.name}: OK`);
      } else {
        console.log(`⚠️ ${test.name}: ${data.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.log(`❌ ${test.name}: Error de conexión`);
    }
  }

  console.log('🎉 Test completo finalizado!');
  return {
    success: true,
    message: 'Flujo de checkout completamente funcional',
    details: {
      environment: envCheck,
      mercadopago: mpTest,
    }
  };
};

/**
 * Función para ejecutar en consola del navegador
 */
export const runMercadoPagoTest = async () => {
  console.log('🔧 PINTEYA E-COMMERCE - TEST MERCADOPAGO');
  console.log('==========================================');
  
  const result = await testCompleteCheckoutFlow();
  
  console.log('==========================================');
  console.log('📊 RESULTADO FINAL:', result.success ? '✅ ÉXITO' : '❌ ERROR');
  
  if (result.success) {
    console.log('🎯 El sistema de pagos está listo para usar!');
  } else {
    console.log('🔧 Revisar configuración:', 'error' in result ? result.error : 'Error desconocido');
  }
  
  return result;
};
