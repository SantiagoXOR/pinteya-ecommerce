// ===================================
// SCRIPT DE PRUEBA PARA CHECKOUT
// ===================================

// Función para probar el checkout
async function testCheckout() {
  console.log('🧪 Probando checkout de Pinteya...');

  try {
    // Datos de prueba
    const testData = {
      items: [
        {
          id: '1',
          name: 'Pintura Sherwin Williams - Blanco',
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

    console.log('📦 Enviando datos a la API...');
    console.log('🔗 URL:', 'http://localhost:3001/api/payments/create-preference');

    const response = await fetch('http://localhost:3001/api/payments/create-preference', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log('✅ Checkout exitoso!');
      console.log('📋 Preference ID:', result.data.preference_id);
      console.log('💰 Total:', result.data.total);
      console.log('🔗 URL de pago:', result.data.init_point);
      
      return {
        success: true,
        data: result.data
      };
    } else {
      console.error('❌ Error en checkout:', result.error);
      return {
        success: false,
        error: result.error
      };
    }

  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Ejecutar test si se ejecuta directamente
if (typeof window !== 'undefined') {
  // En el navegador
  window.testCheckout = testCheckout;
  console.log('🔧 Función testCheckout() disponible en la consola');
} else {
  // En Node.js
  testCheckout().then(result => {
    console.log('📊 Resultado final:', result);
    process.exit(result.success ? 0 : 1);
  });
}
