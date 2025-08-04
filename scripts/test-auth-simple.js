/**
 * Script simple para probar la autenticación de las APIs admin
 */

// Test básico sin autenticación
async function testWithoutAuth() {
  console.log('🔒 Testing API without authentication...');
  
  try {
    const response = await fetch('https://www.pinteya.com/api/admin/products-secure?page=1&limit=5');
    
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    const text = await response.text();
    console.log('Response:', text);
    
    if (response.status === 401) {
      console.log('✅ Correcto: API rechaza requests sin autenticación');
      return true;
    } else {
      console.log('❌ Error: API debería rechazar requests sin autenticación');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error en test:', error.message);
    return false;
  }
}

// Test de la API de monitoreo
async function testMonitoringAPI() {
  console.log('📊 Testing monitoring API...');
  
  try {
    const response = await fetch('https://www.pinteya.com/api/admin/monitoring');
    
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    const text = await response.text();
    console.log('Response:', text);
    
    if (response.status === 401) {
      console.log('✅ Correcto: Monitoring API rechaza requests sin autenticación');
      return true;
    } else {
      console.log('❌ Error: Monitoring API debería rechazar requests sin autenticación');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error en test:', error.message);
    return false;
  }
}

// Test de la API temporal (debería funcionar sin auth)
async function testTemporaryAPI() {
  console.log('🔓 Testing temporary API (should work without auth)...');
  
  try {
    const response = await fetch('https://www.pinteya.com/api/admin/products-test?page=1&limit=5');
    
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API temporal funciona:', {
        success: data.success,
        totalProducts: data.data?.total,
        productsCount: data.data?.products?.length
      });
      return true;
    } else {
      const text = await response.text();
      console.log('❌ Error en API temporal:', text);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error en test:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Iniciando tests de autenticación...\n');

  const tests = [
    { name: 'API Segura sin Auth', fn: testWithoutAuth },
    { name: 'Monitoring API sin Auth', fn: testMonitoringAPI },
    { name: 'API Temporal', fn: testTemporaryAPI }
  ];

  const results = [];

  for (const test of tests) {
    console.log(`\n--- ${test.name} ---`);
    try {
      const result = await test.fn();
      results.push({ name: test.name, success: result });
    } catch (error) {
      console.error(`❌ Error en test ${test.name}:`, error.message);
      results.push({ name: test.name, success: false, error: error.message });
    }
  }

  // Resumen
  console.log('\n📋 RESUMEN DE TESTS:');
  console.log('='.repeat(50));
  
  const passed = results.filter(r => r.success).length;
  const total = results.length;

  results.forEach(result => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${result.name}`);
    if (result.error) {
      console.log(`    Error: ${result.error}`);
    }
  });

  console.log('='.repeat(50));
  console.log(`📊 Resultado: ${passed}/${total} tests pasaron`);
  
  if (passed === total) {
    console.log('🎉 ¡Todos los tests pasaron! Autenticación funcionando correctamente.');
  } else {
    console.log('⚠️  Algunos tests fallaron. Revisar configuración.');
  }

  return passed === total;
}

// Ejecutar tests
if (require.main === module) {
  runTests()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Error ejecutando tests:', error);
      process.exit(1);
    });
}

module.exports = { runTests };
