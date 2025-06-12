// ===================================
// SCRIPT DE DIAGNÓSTICO PARA CHECKOUT
// ===================================

async function debugCheckout() {
  console.log('🔍 Diagnosticando problema de checkout...');

  try {
    // 1. Verificar que el servidor esté corriendo
    console.log('\n1️⃣ Verificando servidor...');
    const healthCheck = await fetch('http://localhost:3001/api/products');
    if (healthCheck.ok) {
      console.log('✅ Servidor funcionando');
    } else {
      console.log('❌ Servidor no responde');
      return { success: false, error: 'Servidor no responde' };
    }

    // 2. Datos de prueba mínimos
    const testData = {
      items: [
        {
          id: '1',
          name: 'Pintura Test',
          price: 1000,
          quantity: 1,
          image: '',
        }
      ],
      payer: {
        name: 'Test',
        surname: 'Usuario',
        email: 'test@pinteya.com',
        phone: '1234567890',
      },
      external_reference: `debug_${Date.now()}`,
    };

    console.log('\n2️⃣ Enviando datos de prueba...');
    console.log('📦 Payload:', JSON.stringify(testData, null, 2));

    const response = await fetch('http://localhost:3001/api/payments/create-preference', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    console.log('\n3️⃣ Respuesta del servidor...');
    console.log('📊 Status:', response.status);
    console.log('📋 Status Text:', response.statusText);

    const result = await response.json();
    console.log('📄 Response Body:', JSON.stringify(result, null, 2));

    if (response.ok && result.success) {
      console.log('\n✅ CHECKOUT FUNCIONANDO');
      console.log('🎉 Preferencia creada exitosamente');
      return { success: true, data: result.data };
    } else {
      console.log('\n❌ ERROR EN CHECKOUT');
      console.log('🔍 Error:', result.error);
      console.log('📝 Mensaje:', result.message || 'Sin mensaje');
      
      // Análisis del error
      if (result.error?.includes('orden')) {
        console.log('\n🔍 ANÁLISIS: Problema con creación de orden en Supabase');
        console.log('💡 Posibles causas:');
        console.log('   - Tabla orders no existe');
        console.log('   - Permisos RLS incorrectos');
        console.log('   - Estructura de tabla incorrecta');
        console.log('   - Usuario temporal no válido');
      }
      
      if (result.error?.includes('productos')) {
        console.log('\n🔍 ANÁLISIS: Problema con productos');
        console.log('💡 Posibles causas:');
        console.log('   - Producto ID no existe');
        console.log('   - Stock insuficiente');
        console.log('   - Tabla products no accesible');
      }
      
      return { success: false, error: result.error };
    }

  } catch (error) {
    console.error('\n❌ ERROR DE CONEXIÓN:', error.message);
    console.log('💡 Posibles causas:');
    console.log('   - Servidor no está corriendo (npm run dev)');
    console.log('   - Puerto 3001 no disponible');
    console.log('   - Error de red');
    
    return { success: false, error: error.message };
  }
}

// Función para verificar productos
async function checkProducts() {
  console.log('\n🛍️ Verificando productos...');
  
  try {
    const response = await fetch('http://localhost:3001/api/products');
    const result = await response.json();
    
    if (result.success && result.data?.length > 0) {
      console.log(`✅ ${result.data.length} productos encontrados`);
      console.log('📋 Primer producto:', {
        id: result.data[0].id,
        name: result.data[0].name,
        price: result.data[0].price,
        stock: result.data[0].stock,
      });
      return result.data[0];
    } else {
      console.log('❌ No se encontraron productos');
      return null;
    }
  } catch (error) {
    console.log('❌ Error obteniendo productos:', error.message);
    return null;
  }
}

// Función para probar con producto real
async function testWithRealProduct() {
  console.log('\n🧪 Probando con producto real...');
  
  const product = await checkProducts();
  if (!product) {
    console.log('❌ No hay productos para probar');
    return;
  }

  const testData = {
    items: [
      {
        id: product.id.toString(),
        name: product.name,
        price: product.discounted_price || product.price,
        quantity: 1,
        image: product.images?.previews?.[0] || '',
      }
    ],
    payer: {
      name: 'Test',
      surname: 'Usuario',
      email: 'test@pinteya.com',
      phone: '1234567890',
    },
    external_reference: `real_product_${Date.now()}`,
  };

  console.log('📦 Probando con producto:', product.name);
  
  try {
    const response = await fetch('http://localhost:3001/api/payments/create-preference', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log('✅ ÉXITO con producto real');
      console.log('🔗 Init Point:', result.data.init_point);
    } else {
      console.log('❌ ERROR con producto real:', result.error);
    }
    
    return result;
  } catch (error) {
    console.log('❌ Error en test con producto real:', error.message);
    return { success: false, error: error.message };
  }
}

// Función principal
async function main() {
  console.log('🚀 DIAGNÓSTICO COMPLETO DE CHECKOUT - PINTEYA');
  console.log('=' .repeat(60));
  
  // Test básico
  const basicResult = await debugCheckout();
  
  if (!basicResult.success) {
    // Test con producto real si el básico falla
    await testWithRealProduct();
  }
  
  console.log('\n📊 RESUMEN DEL DIAGNÓSTICO:');
  console.log('=' .repeat(40));
  
  if (basicResult.success) {
    console.log('🎉 CHECKOUT FUNCIONANDO CORRECTAMENTE');
    console.log('✅ API de pagos operativa');
    console.log('✅ MercadoPago configurado');
    console.log('✅ Supabase conectado');
  } else {
    console.log('❌ CHECKOUT CON PROBLEMAS');
    console.log('🔧 Revisar logs del servidor');
    console.log('🔧 Verificar configuración de Supabase');
    console.log('🔧 Comprobar variables de entorno');
  }
  
  return basicResult;
}

// Ejecutar si es llamado directamente
if (typeof window !== 'undefined') {
  // En el navegador
  window.debugCheckout = debugCheckout;
  window.checkProducts = checkProducts;
  window.testWithRealProduct = testWithRealProduct;
  console.log('🔧 Funciones disponibles: debugCheckout(), checkProducts(), testWithRealProduct()');
} else {
  // En Node.js
  main().then(result => {
    process.exit(result.success ? 0 : 1);
  });
}
