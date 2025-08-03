#!/usr/bin/env node

/**
 * 🧪 SCRIPT DE PRUEBA: Corrección Panel Administrativo
 * 
 * Este script verifica que la corrección del panel administrativo
 * funcione correctamente probando la API directamente.
 */

const https = require('https');
const http = require('http');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data,
            parseError: error.message
          });
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

async function testAdminProductsAPI() {
  log(colors.cyan, '\n🧪 INICIANDO PRUEBAS DE CORRECCIÓN ADMIN PRODUCTS\n');
  
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  
  // Test 1: API con parámetros corregidos
  log(colors.yellow, '📋 Test 1: Verificando API con parámetros corregidos...');
  
  try {
    const testUrl = `${baseUrl}/api/admin/products-direct?page=1&limit=5`;
    log(colors.blue, `   URL: ${testUrl}`);
    
    const response = await makeRequest(testUrl);
    
    if (response.status === 200) {
      log(colors.green, '   ✅ Status: 200 OK');
      
      if (response.data.success) {
        log(colors.green, '   ✅ Response success: true');
        
        if (response.data.data && response.data.data.products) {
          log(colors.green, `   ✅ Products found: ${response.data.data.products.length}`);
          log(colors.green, `   ✅ Total products: ${response.data.data.total}`);
          
          if (response.data.data.pagination) {
            log(colors.green, `   ✅ Pagination: page ${response.data.data.pagination.page}, limit ${response.data.data.pagination.limit}`);
          }
          
          // Verificar estructura esperada por el hook
          log(colors.yellow, '\n📋 Test 2: Verificando estructura de datos...');
          
          const hasRequiredFields = 
            response.data.data.products &&
            typeof response.data.data.total === 'number' &&
            response.data.data.pagination &&
            typeof response.data.data.pagination.page === 'number' &&
            typeof response.data.data.pagination.limit === 'number' &&
            typeof response.data.data.pagination.totalPages === 'number';
          
          if (hasRequiredFields) {
            log(colors.green, '   ✅ Estructura de datos correcta');
            
            // Simular transformación del hook
            const transformedData = {
              data: response.data.data.products,
              total: response.data.data.total,
              page: response.data.data.pagination.page,
              pageSize: response.data.data.pagination.limit,
              totalPages: response.data.data.pagination.totalPages
            };
            
            log(colors.green, '   ✅ Transformación simulada exitosa:');
            log(colors.blue, `      - Products: ${transformedData.data.length}`);
            log(colors.blue, `      - Total: ${transformedData.total}`);
            log(colors.blue, `      - Page: ${transformedData.page}`);
            log(colors.blue, `      - PageSize: ${transformedData.pageSize}`);
            log(colors.blue, `      - TotalPages: ${transformedData.totalPages}`);
            
          } else {
            log(colors.red, '   ❌ Estructura de datos incorrecta');
          }
          
        } else {
          log(colors.red, '   ❌ No se encontraron productos en la respuesta');
        }
      } else {
        log(colors.red, '   ❌ Response success: false');
      }
    } else {
      log(colors.red, `   ❌ Status: ${response.status}`);
      if (response.data) {
        log(colors.red, `   ❌ Error: ${JSON.stringify(response.data, null, 2)}`);
      }
    }
    
  } catch (error) {
    log(colors.red, `   ❌ Error de conexión: ${error.message}`);
    log(colors.yellow, '   ⚠️  Asegúrate de que el servidor esté ejecutándose');
  }
  
  // Test 3: Verificar diferentes parámetros
  log(colors.yellow, '\n📋 Test 3: Verificando paginación...');
  
  try {
    const testUrl2 = `${baseUrl}/api/admin/products-direct?page=2&limit=10`;
    log(colors.blue, `   URL: ${testUrl2}`);
    
    const response2 = await makeRequest(testUrl2);
    
    if (response2.status === 200 && response2.data.success) {
      log(colors.green, '   ✅ Paginación funcionando correctamente');
      log(colors.blue, `   📄 Página 2, productos: ${response2.data.data.products.length}`);
    } else {
      log(colors.red, '   ❌ Error en paginación');
    }
    
  } catch (error) {
    log(colors.red, `   ❌ Error en test de paginación: ${error.message}`);
  }
  
  log(colors.cyan, '\n🎉 PRUEBAS COMPLETADAS\n');
  
  log(colors.yellow, '📝 PRÓXIMOS PASOS:');
  log(colors.blue, '   1. Abrir http://localhost:3000/admin/products');
  log(colors.blue, '   2. Verificar que los productos se muestren correctamente');
  log(colors.blue, '   3. Probar paginación y filtros');
  log(colors.blue, '   4. Revisar logs en consola del navegador');
  log(colors.blue, '   5. Confirmar que no hay errores "Error fetching products"');
}

// Ejecutar pruebas
testAdminProductsAPI().catch(error => {
  log(colors.red, `❌ Error fatal: ${error.message}`);
  process.exit(1);
});
