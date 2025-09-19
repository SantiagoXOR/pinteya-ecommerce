/**
 * Script detallado para debuggear la autenticación del panel admin
 */

// Test directo de la API con diferentes enfoques
async function testAPIDirectly() {
  console.log('🔍 Testing API directly...');
  
  try {
    // Test 1: Sin autenticación (debería dar 401)
    console.log('\n--- Test 1: Sin autenticación ---');
    const response1 = await fetch('https://www.pinteya.com/api/admin/products-secure?page=1&limit=5');
    console.log('Status:', response1.status);
    console.log('Status Text:', response1.statusText);
    
    if (response1.status === 401) {
      console.log('✅ Correcto: API rechaza requests sin auth');
    } else {
      const text1 = await response1.text();
      console.log('Response:', text1.substring(0, 200));
    }

    // Test 2: Con token inválido (debería dar 401)
    console.log('\n--- Test 2: Token inválido ---');
    const response2 = await fetch('https://www.pinteya.com/api/admin/products-secure?page=1&limit=5', {
      headers: {
        'Authorization': 'Bearer invalid-token-123',
        'Content-Type': 'application/json'
      }
    });
    console.log('Status:', response2.status);
    console.log('Status Text:', response2.statusText);
    
    if (response2.status === 401) {
      console.log('✅ Correcto: API rechaza tokens inválidos');
    } else {
      const text2 = await response2.text();
      console.log('Response:', text2.substring(0, 200));
    }

    // Test 3: Verificar estructura de respuesta de error
    console.log('\n--- Test 3: Análisis de respuesta 403 ---');
    const response3 = await fetch('https://www.pinteya.com/api/admin/products-secure?page=1&limit=5', {
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Status:', response3.status);
    console.log('Headers:', Object.fromEntries(response3.headers.entries()));
    
    const text3 = await response3.text();
    console.log('Response body:', text3);
    
    // Intentar parsear como JSON
    try {
      const json3 = JSON.parse(text3);
      console.log('Parsed JSON:', json3);
    } catch (e) {
      console.log('No es JSON válido');
    }

  } catch (error) {
    console.error('❌ Error en tests:', error.message);
  }
}

// Test de la API de monitoreo
async function testMonitoringAPI() {
  console.log('\n📊 Testing Monitoring API...');
  
  try {
    const response = await fetch('https://www.pinteya.com/api/admin/monitoring');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    const text = await response.text();
    console.log('Response:', text.substring(0, 300));
    
  } catch (error) {
    console.error('❌ Error en monitoring test:', error.message);
  }
}

// Test de headers y CORS
async function testHeaders() {
  console.log('\n🌐 Testing Headers and CORS...');
  
  try {
    const response = await fetch('https://www.pinteya.com/api/admin/products-secure?page=1&limit=5', {
      method: 'OPTIONS'
    });
    
    console.log('OPTIONS Status:', response.status);
    console.log('CORS Headers:', {
      'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
    });
    
  } catch (error) {
    console.error('❌ Error en headers test:', error.message);
  }
}

// Test de la API temporal para comparar
async function testTemporaryAPI() {
  console.log('\n🔓 Testing Temporary API (comparison)...');
  
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
    } else {
      const text = await response.text();
      console.log('❌ Error en API temporal:', text.substring(0, 200));
    }
    
  } catch (error) {
    console.error('❌ Error en test API temporal:', error.message);
  }
}

// Test de diferentes User-Agents
async function testUserAgents() {
  console.log('\n🤖 Testing Different User Agents...');
  
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'curl/7.68.0',
    'PostmanRuntime/7.28.0'
  ];
  
  for (const ua of userAgents) {
    try {
      console.log(`\nTesting with UA: ${ua.substring(0, 30)}...`);
      const response = await fetch('https://www.pinteya.com/api/admin/products-secure?page=1&limit=1', {
        headers: {
          'User-Agent': ua,
          'Authorization': 'Bearer test-token'
        }
      });
      
      console.log('Status:', response.status);
      
    } catch (error) {
      console.log('Error:', error.message);
    }
  }
}

// Test de rate limiting
async function testRateLimit() {
  console.log('\n🚦 Testing Rate Limiting...');
  
  try {
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(
        fetch('https://www.pinteya.com/api/admin/products-secure?page=1&limit=1', {
          headers: {
            'Authorization': 'Bearer test-token'
          }
        })
      );
    }
    
    const responses = await Promise.all(promises);
    
    responses.forEach((response, index) => {
      console.log(`Request ${index + 1}: ${response.status} ${response.statusText}`);
    });
    
  } catch (error) {
    console.error('❌ Error en rate limit test:', error.message);
  }
}

async function runAllTests() {
  console.log('🧪 Iniciando debugging detallado de autenticación...\n');
  console.log('='.repeat(60));

  await testAPIDirectly();
  await testMonitoringAPI();
  await testHeaders();
  await testTemporaryAPI();
  await testUserAgents();
  await testRateLimit();

  console.log('\n='.repeat(60));
  console.log('🏁 Tests de debugging completados');
  console.log('\nAnálisis:');
  console.log('- Si todas las APIs dan 403, puede ser Cloudflare');
  console.log('- Si solo la API segura da 403, es problema de autenticación');
  console.log('- Si la API temporal funciona, el problema es específico de auth');
}

// Ejecutar tests
if (require.main === module) {
  runAllTests()
    .then(() => {
      console.log('✅ Debugging completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en debugging:', error);
      process.exit(1);
    });
}

module.exports = { runAllTests };
