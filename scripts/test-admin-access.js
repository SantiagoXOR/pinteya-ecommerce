#!/usr/bin/env node

/**
 * Script de prueba para verificar el acceso al panel administrativo
 * Uso: node scripts/test-admin-access.js
 */

const https = require('https');
const http = require('http');

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

console.log('🧪 INICIANDO PRUEBAS DE ACCESO AL PANEL ADMINISTRATIVO');
console.log('='.repeat(60));

async function makeRequest(path, description) {
  return new Promise((resolve) => {
    const url = new URL(path, BASE_URL);
    const client = url.protocol === 'https:' ? https : http;
    
    console.log(`\n🔍 ${description}`);
    console.log(`   URL: ${url.toString()}`);
    
    const req = client.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const result = {
          status: res.statusCode,
          headers: res.headers,
          redirectLocation: res.headers.location,
          bodyPreview: data.substring(0, 200) + (data.length > 200 ? '...' : ''),
          success: res.statusCode >= 200 && res.statusCode < 400
        };
        
        console.log(`   Status: ${result.status}`);
        if (result.redirectLocation) {
          console.log(`   Redirect: ${result.redirectLocation}`);
        }
        console.log(`   Success: ${result.success ? '✅' : '❌'}`);
        
        resolve(result);
      });
    });
    
    req.on('error', (error) => {
      console.log(`   Error: ❌ ${error.message}`);
      resolve({
        status: 0,
        error: error.message,
        success: false
      });
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      console.log(`   Error: ❌ Timeout`);
      resolve({
        status: 0,
        error: 'Timeout',
        success: false
      });
    });
  });
}

async function runTests() {
  const tests = [
    {
      path: '/api/admin/debug-user-role',
      description: 'Verificar estado del usuario admin'
    },
    {
      path: '/admin',
      description: 'Acceso directo al panel admin'
    },
    {
      path: '/my-account',
      description: 'Acceso a my-account (debería redirigir si es admin)'
    },
    {
      path: '/admin/products',
      description: 'Acceso a sección de productos admin'
    },
    {
      path: '/api/admin/products-direct',
      description: 'API directa de productos admin'
    }
  ];

  const results = [];
  
  for (const test of tests) {
    const result = await makeRequest(test.path, test.description);
    results.push({
      ...test,
      ...result
    });
    
    // Pausa entre requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DE RESULTADOS');
  console.log('='.repeat(60));
  
  results.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.description}`);
    console.log(`   Status: ${result.status} ${result.success ? '✅' : '❌'}`);
    if (result.redirectLocation) {
      console.log(`   Redirect: ${result.redirectLocation}`);
    }
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  console.log(`\n📈 ESTADÍSTICAS:`);
  console.log(`   Exitosos: ${successCount}/${totalCount}`);
  console.log(`   Fallidos: ${totalCount - successCount}/${totalCount}`);
  console.log(`   Porcentaje de éxito: ${Math.round((successCount / totalCount) * 100)}%`);
  
  if (successCount === totalCount) {
    console.log('\n🎉 ¡TODAS LAS PRUEBAS PASARON!');
  } else {
    console.log('\n⚠️  ALGUNAS PRUEBAS FALLARON - Revisar configuración');
  }
  
  console.log('\n💡 PRÓXIMOS PASOS:');
  console.log('   1. Verificar que el servidor esté ejecutándose');
  console.log('   2. Confirmar que el usuario admin esté configurado');
  console.log('   3. Probar manualmente en el navegador');
  console.log('   4. Revisar logs del servidor para más detalles');
}

// Ejecutar pruebas
runTests().catch(console.error);
