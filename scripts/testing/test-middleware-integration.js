#!/usr/bin/env node

/**
 * Script de prueba de integración para el middleware mejorado con Clerk
 * Verifica que las rutas admin estén protegidas correctamente
 */

const https = require('https');
const http = require('http');

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

console.log('🧪 INICIANDO TESTS DE INTEGRACIÓN DEL MIDDLEWARE');
console.log(`📍 Base URL: ${BASE_URL}`);
console.log('=' .repeat(60));

/**
 * Función helper para hacer requests HTTP
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    const requestOptions = {
      method: 'GET',
      headers: {
        'User-Agent': 'Pinteya-Middleware-Test/1.0',
        ...options.headers
      },
      ...options
    };

    const req = client.request(url, requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data,
          url: url
        });
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

/**
 * Test individual
 */
async function runTest(testName, testFn) {
  try {
    console.log(`\n🔍 ${testName}`);
    const result = await testFn();
    console.log(`✅ PASÓ: ${testName}`);
    return { name: testName, status: 'PASSED', result };
  } catch (error) {
    console.log(`❌ FALLÓ: ${testName}`);
    console.log(`   Error: ${error.message}`);
    return { name: testName, status: 'FAILED', error: error.message };
  }
}

/**
 * Tests de rutas públicas
 */
async function testPublicRoutes() {
  const publicRoutes = [
    '/',
    '/shop',
    '/search',
    '/contact',
    '/api/products',
    '/api/categories'
  ];

  const results = [];
  for (const route of publicRoutes) {
    const response = await makeRequest(`${BASE_URL}${route}`);
    if (response.status >= 200 && response.status < 400) {
      results.push(`✅ ${route}: ${response.status}`);
    } else {
      throw new Error(`Ruta pública ${route} falló con status ${response.status}`);
    }
  }
  
  return results;
}

/**
 * Tests de rutas admin sin autenticación
 */
async function testAdminRoutesUnauthorized() {
  const adminRoutes = [
    '/api/admin/products',
    '/api/admin/users',
    '/api/admin/analytics'
  ];

  const results = [];
  for (const route of adminRoutes) {
    const response = await makeRequest(`${BASE_URL}${route}`);
    
    // Debe retornar 401 (Unauthorized) o 403 (Forbidden)
    if (response.status === 401 || response.status === 403) {
      results.push(`✅ ${route}: ${response.status} (Correctamente bloqueado)`);
    } else {
      throw new Error(`Ruta admin ${route} debería estar bloqueada pero retornó ${response.status}`);
    }
  }
  
  return results;
}

/**
 * Tests de rutas admin con headers de autenticación simulados
 */
async function testAdminRoutesWithAuth() {
  const adminRoutes = [
    '/api/admin/products'
  ];

  const results = [];
  for (const route of adminRoutes) {
    // Simular headers de autenticación (esto no funcionará en producción real)
    const response = await makeRequest(`${BASE_URL}${route}`, {
      headers: {
        'x-clerk-user-id': 'test-admin-user',
        'authorization': 'Bearer test-token'
      }
    });
    
    // En desarrollo, podría funcionar; en producción con middleware real, debería fallar
    results.push(`📝 ${route}: ${response.status} (Con headers simulados)`);
  }
  
  return results;
}

/**
 * Tests de archivos estáticos
 */
async function testStaticFiles() {
  const staticRoutes = [
    '/favicon.ico',
    '/_next/static/test', // Esto debería ser manejado por Next.js
  ];

  const results = [];
  for (const route of staticRoutes) {
    try {
      const response = await makeRequest(`${BASE_URL}${route}`);
      results.push(`📁 ${route}: ${response.status}`);
    } catch (error) {
      // Los archivos estáticos pueden no existir, pero no deberían causar errores de middleware
      results.push(`📁 ${route}: Error esperado (${error.message.substring(0, 50)}...)`);
    }
  }
  
  return results;
}

/**
 * Test de performance del middleware
 */
async function testMiddlewarePerformance() {
  const testRoute = `${BASE_URL}/api/products`;
  const iterations = 5;
  const times = [];

  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    await makeRequest(testRoute);
    const end = Date.now();
    times.push(end - start);
  }

  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  const maxTime = Math.max(...times);
  const minTime = Math.min(...times);

  if (avgTime > 2000) {
    throw new Error(`Performance degradada: tiempo promedio ${avgTime}ms > 2000ms`);
  }

  return {
    promedio: `${avgTime.toFixed(2)}ms`,
    maximo: `${maxTime}ms`,
    minimo: `${minTime}ms`,
    iteraciones: iterations
  };
}

/**
 * Función principal
 */
async function main() {
  const tests = [
    ['Rutas Públicas Accesibles', testPublicRoutes],
    ['Rutas Admin Bloqueadas (Sin Auth)', testAdminRoutesUnauthorized],
    ['Rutas Admin con Headers Simulados', testAdminRoutesWithAuth],
    ['Archivos Estáticos', testStaticFiles],
    ['Performance del Middleware', testMiddlewarePerformance]
  ];

  const results = [];
  let passed = 0;
  let failed = 0;

  for (const [name, testFn] of tests) {
    const result = await runTest(name, testFn);
    results.push(result);
    
    if (result.status === 'PASSED') {
      passed++;
    } else {
      failed++;
    }
  }

  // Resumen final
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DE TESTS DE INTEGRACIÓN');
  console.log('='.repeat(60));
  console.log(`✅ Tests Pasados: ${passed}`);
  console.log(`❌ Tests Fallidos: ${failed}`);
  console.log(`📈 Total: ${results.length}`);
  
  if (failed === 0) {
    console.log('\n🎉 ¡TODOS LOS TESTS PASARON!');
    console.log('✨ El middleware está funcionando correctamente');
  } else {
    console.log('\n⚠️  Algunos tests fallaron');
    console.log('🔧 Revisa la configuración del middleware');
  }

  // Detalles de tests fallidos
  const failedTests = results.filter(r => r.status === 'FAILED');
  if (failedTests.length > 0) {
    console.log('\n❌ TESTS FALLIDOS:');
    failedTests.forEach(test => {
      console.log(`   • ${test.name}: ${test.error}`);
    });
  }

  console.log('\n🏁 Tests de integración completados');
  process.exit(failed > 0 ? 1 : 0);
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Error fatal en tests:', error);
    process.exit(1);
  });
}

module.exports = { makeRequest, runTest };
