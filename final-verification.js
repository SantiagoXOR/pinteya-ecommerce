#!/usr/bin/env node

/**
 * Script final para verificar que los datos hardcodeados han sido eliminados
 * y que las estadísticas muestran datos reales
 */

const https = require('https');
const http = require('http');

async function testAPI(url, description) {
  return new Promise((resolve) => {
    console.log(`\n🔍 Testing: ${description}`);
    console.log(`📡 URL: ${url}`);
    
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`📊 Status: ${res.statusCode}`);
        
        try {
          const jsonData = JSON.parse(data);
          console.log(`✅ Response received`);
          
          resolve({
            status: res.statusCode,
            data: jsonData,
            success: res.statusCode >= 200 && res.statusCode < 300
          });
        } catch (e) {
          console.log(`❌ Invalid JSON response`);
          resolve({
            status: res.statusCode,
            data: null,
            success: false,
            error: 'Invalid JSON'
          });
        }
      });
    });
    
    req.on('error', (error) => {
      console.error(`❌ Error:`, error.message);
      resolve({
        status: 0,
        data: null,
        success: false,
        error: error.message
      });
    });
    
    req.setTimeout(10000, () => {
      console.error(`⏰ Timeout`);
      req.destroy();
      resolve({
        status: 0,
        data: null,
        success: false,
        error: 'Timeout'
      });
    });
  });
}

async function main() {
  console.log('🎯 VERIFICACIÓN FINAL - ELIMINACIÓN DE DATOS HARDCODEADOS');
  console.log('=========================================================');
  
  // Test 1: Trending Searches API
  console.log('\n📈 VERIFICANDO TRENDING SEARCHES API');
  console.log('====================================');
  
  const trendingResult = await testAPI('http://localhost:3000/api/search/trending', 'Trending Searches API');
  
  if (trendingResult.success && trendingResult.data) {
    const trending = trendingResult.data.data?.trending || [];
    
    console.log(`📊 Trending searches encontradas: ${trending.length}`);
    
    // Verificar si contiene los valores hardcodeados problemáticos
    const hasHardcodedValues = trending.some(item => 
      item.count === 156 || item.count === 142
    );
    
    if (hasHardcodedValues) {
      console.log('❌ PROBLEMA: Aún contiene valores hardcodeados (156, 142)');
    } else {
      console.log('✅ ÉXITO: No contiene valores hardcodeados (156, 142)');
    }
    
    console.log('\n📋 Valores actuales:');
    trending.forEach((item, index) => {
      console.log(`   ${index + 1}. "${item.query}": ${item.count} búsquedas`);
    });
    
    // Verificar si los valores son dinámicos (diferentes cada vez)
    const counts = trending.map(item => item.count);
    const uniqueCounts = [...new Set(counts)];
    
    if (uniqueCounts.length > 1) {
      console.log('✅ ÉXITO: Valores dinámicos detectados (diferentes counts)');
    } else {
      console.log('⚠️ ADVERTENCIA: Todos los valores son iguales (posible hardcoding)');
    }
  } else {
    console.log('❌ FALLO: No se pudo obtener trending searches');
  }
  
  // Test 2: Products API para estadísticas
  console.log('\n📦 VERIFICANDO PRODUCTS API PARA ESTADÍSTICAS');
  console.log('=============================================');
  
  const productsResult = await testAPI('http://localhost:3000/api/products', 'Products API');
  
  if (productsResult.success && productsResult.data) {
    const products = productsResult.data.data || [];
    
    console.log(`📊 Total productos: ${products.length}`);
    
    if (products.length > 0) {
      // Calcular estadísticas reales
      const withStock = products.filter(p => p.stock && p.stock > 0).length;
      const lowStock = products.filter(p => p.stock && p.stock > 0 && p.stock <= 10).length;
      const noStock = products.filter(p => !p.stock || p.stock === 0).length;
      
      console.log('\n📈 Estadísticas calculadas:');
      console.log(`   ✅ Productos con stock: ${withStock}`);
      console.log(`   ⚠️ Stock bajo (≤10): ${lowStock}`);
      console.log(`   ❌ Sin stock: ${noStock}`);
      
      // Verificar marcas
      const brands = [...new Set(products.map(p => p.brand).filter(Boolean))];
      console.log(`   🏷️ Marcas únicas: ${brands.length}`);
      console.log(`   📋 Marcas: ${brands.slice(0, 5).join(', ')}${brands.length > 5 ? '...' : ''}`);
    }
  } else {
    console.log('❌ FALLO: No se pudo obtener productos');
  }
  
  // Test 3: Verificar que Admin APIs están protegidas
  console.log('\n🔒 VERIFICANDO PROTECCIÓN DE ADMIN APIS');
  console.log('======================================');
  
  const adminResult = await testAPI('http://localhost:3000/api/admin/products/stats', 'Admin Products Stats API');
  
  if (adminResult.status === 401 || adminResult.status === 403) {
    console.log('✅ ÉXITO: Admin API correctamente protegida');
  } else if (adminResult.success) {
    console.log('⚠️ ADVERTENCIA: Admin API accesible sin autenticación');
  } else {
    console.log('❌ FALLO: Error inesperado en Admin API');
  }
  
  // Resumen final
  console.log('\n🎯 RESUMEN FINAL');
  console.log('================');
  
  const trendingFixed = trendingResult.success && 
    trendingResult.data?.data?.trending &&
    !trendingResult.data.data.trending.some(item => item.count === 156 || item.count === 142);
  
  const productsWorking = productsResult.success && productsResult.data?.data?.length > 0;
  const adminProtected = adminResult.status === 401 || adminResult.status === 403;
  
  console.log(`✅ Trending searches sin hardcoding: ${trendingFixed ? 'SÍ' : 'NO'}`);
  console.log(`✅ Products API funcionando: ${productsWorking ? 'SÍ' : 'NO'}`);
  console.log(`✅ Admin APIs protegidas: ${adminProtected ? 'SÍ' : 'NO'}`);
  
  if (trendingFixed && productsWorking && adminProtected) {
    console.log('\n🎉 ¡ÉXITO TOTAL! Todos los problemas han sido resueltos:');
    console.log('   ✅ Datos hardcodeados eliminados');
    console.log('   ✅ Estadísticas muestran datos reales');
    console.log('   ✅ APIs funcionando correctamente');
    console.log('   ✅ Seguridad implementada');
  } else {
    console.log('\n⚠️ Algunos problemas persisten:');
    if (!trendingFixed) console.log('   ❌ Trending searches aún tiene datos hardcodeados');
    if (!productsWorking) console.log('   ❌ Products API no funciona correctamente');
    if (!adminProtected) console.log('   ❌ Admin APIs no están protegidas');
  }
}

main().catch(console.error);
