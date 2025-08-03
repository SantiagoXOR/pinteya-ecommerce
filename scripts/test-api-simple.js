#!/usr/bin/env node

/**
 * Script para probar la API products-simple en producción
 * Pinteya E-commerce - Agosto 2025
 */

const https = require('https');

console.log('🧪 PROBANDO API PRODUCTS-SIMPLE EN PRODUCCIÓN\n');

// Función para hacer request
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, (response) => {
      let data = '';
      response.on('data', (chunk) => data += chunk);
      response.on('end', () => resolve({
        statusCode: response.statusCode,
        statusMessage: response.statusMessage,
        data: data,
        url: url
      }));
    });
    request.on('error', reject);
    request.setTimeout(10000, () => {
      request.destroy();
      reject(new Error('Timeout'));
    });
  });
}

// Test de la API simple
async function testSimpleAPI() {
  const testUrl = 'https://www.pinteya.com/api/admin/products-simple?page=1&limit=5';
  
  console.log('📋 Probando API products-simple...');
  console.log(`📍 URL: ${testUrl}\n`);
  
  try {
    const response = await makeRequest(testUrl);
    
    console.log(`📊 Status: ${response.statusCode} ${response.statusMessage}`);
    
    if (response.statusCode === 200) {
      try {
        const data = JSON.parse(response.data);
        
        console.log('✅ API FUNCIONANDO CORRECTAMENTE');
        console.log(`📦 Productos encontrados: ${data.data?.products?.length || 0}`);
        console.log(`📊 Total en BD: ${data.data?.total || 0}`);
        console.log(`📄 Página: ${data.data?.pagination?.page || 0}`);
        console.log(`🔧 Método: ${data.meta?.method || 'unknown'}`);
        
        if (data.data?.products?.length > 0) {
          console.log('\n📋 Primer producto:');
          const firstProduct = data.data.products[0];
          console.log(`   • ID: ${firstProduct.id}`);
          console.log(`   • Nombre: ${firstProduct.name}`);
          console.log(`   • Precio: $${firstProduct.price}`);
          console.log(`   • Stock: ${firstProduct.stock}`);
        }
        
        return true;
        
      } catch (parseError) {
        console.log('❌ Error parseando JSON:');
        console.log(response.data.substring(0, 200) + '...');
        return false;
      }
    } else {
      console.log('❌ API retornó error:');
      console.log(response.data.substring(0, 200) + '...');
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Error de conexión: ${error.message}`);
    return false;
  }
}

// Función principal
async function main() {
  console.log('🎯 OBJETIVO: Verificar que la corrección de authResult funciona\n');
  
  const success = await testSimpleAPI();
  
  console.log('\n' + '='.repeat(60));
  
  if (success) {
    console.log('🎉 ¡CORRECCIÓN EXITOSA!');
    console.log('✅ La API products-simple funciona sin errores');
    console.log('✅ El problema de authResult está resuelto');
    console.log('\n📋 Próximos pasos:');
    console.log('   1. Recargar página de debug en navegador');
    console.log('   2. Probar "Probar API Productos" nuevamente');
    console.log('   3. Verificar panel /admin/products');
  } else {
    console.log('❌ La corrección aún no está desplegada o hay otros errores');
    console.log('⏳ Esperar unos minutos más para el deployment');
    console.log('🔄 Ejecutar este script nuevamente');
  }
  
  console.log('\n🔗 URLs para probar manualmente:');
  console.log('   🧪 Debug: https://www.pinteya.com/admin/debug-products');
  console.log('   📦 Admin: https://www.pinteya.com/admin/products');
  console.log('   🔧 API: https://www.pinteya.com/api/admin/products-simple?page=1&limit=5');
}

// Ejecutar
main().catch(console.error);
