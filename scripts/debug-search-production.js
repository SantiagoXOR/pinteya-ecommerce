#!/usr/bin/env node

/**
 * Script de debugging para la funcionalidad de búsqueda en producción
 * Pinteya E-commerce
 */

const https = require('https');
const http = require('http');

const PRODUCTION_URL = 'https://pinteya-ecommerce.vercel.app';
const LOCAL_URL = 'http://localhost:3001';

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;
    
    const startTime = Date.now();
    
    const req = client.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const timing = Date.now() - startTime;
        
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData,
            timing,
            success: res.statusCode >= 200 && res.statusCode < 300
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data,
            timing,
            success: false,
            parseError: error.message
          });
        }
      });
    });
    
    req.on('error', (error) => {
      const timing = Date.now() - startTime;
      reject({
        error: error.message,
        timing,
        success: false
      });
    });
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testEndpoint(baseUrl, endpoint, description) {
  const url = `${baseUrl}${endpoint}`;
  
  log(`\n🧪 Testing: ${description}`, 'cyan');
  log(`   URL: ${url}`, 'blue');
  
  try {
    const result = await makeRequest(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Pinteya-Debug-Script/1.0'
      }
    });
    
    if (result.success) {
      log(`   ✅ SUCCESS (${result.status}) - ${result.timing}ms`, 'green');
      
      if (result.data && typeof result.data === 'object') {
        if (result.data.success !== undefined) {
          log(`   📊 API Success: ${result.data.success}`, result.data.success ? 'green' : 'red');
        }
        
        if (result.data.data) {
          const dataLength = Array.isArray(result.data.data) ? result.data.data.length : 'N/A';
          log(`   📦 Data Length: ${dataLength}`, 'yellow');
        }
        
        if (result.data.error) {
          log(`   ❌ API Error: ${result.data.error}`, 'red');
        }
      }
    } else {
      log(`   ❌ FAILED (${result.status}) - ${result.timing}ms`, 'red');
      if (result.parseError) {
        log(`   🔍 Parse Error: ${result.parseError}`, 'red');
      }
    }
    
    return result;
    
  } catch (error) {
    log(`   💥 REQUEST FAILED - ${error.timing}ms`, 'red');
    log(`   🔍 Error: ${error.error}`, 'red');
    return error;
  }
}

async function runDiagnostics(baseUrl, environment) {
  log(`\n${'='.repeat(60)}`, 'bright');
  log(`🔍 DIAGNÓSTICO DE BÚSQUEDA - ${environment.toUpperCase()}`, 'bright');
  log(`🌐 Base URL: ${baseUrl}`, 'bright');
  log(`${'='.repeat(60)}`, 'bright');
  
  const tests = [
    {
      endpoint: '/api/products?limit=3',
      description: 'API de Productos (Básica)'
    },
    {
      endpoint: '/api/products?search=pintura&limit=5',
      description: 'API de Productos (Búsqueda: "pintura")'
    },
    {
      endpoint: '/api/products?search=sherwin&limit=5',
      description: 'API de Productos (Búsqueda: "sherwin")'
    },
    {
      endpoint: '/api/products?search=latex&limit=5',
      description: 'API de Productos (Búsqueda: "latex")'
    },
    {
      endpoint: '/api/search/trending?limit=4',
      description: 'API de Búsquedas Trending'
    },
    {
      endpoint: '/api/products?category=pinturas&limit=3',
      description: 'API de Productos (Por Categoría)'
    }
  ];
  
  const results = [];
  
  for (const test of tests) {
    const result = await testEndpoint(baseUrl, test.endpoint, test.description);
    results.push({ ...test, result });
    
    // Pausa entre requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Resumen
  log(`\n${'='.repeat(60)}`, 'bright');
  log(`📊 RESUMEN - ${environment.toUpperCase()}`, 'bright');
  log(`${'='.repeat(60)}`, 'bright');
  
  const successful = results.filter(r => r.result.success);
  const failed = results.filter(r => !r.result.success);
  
  log(`✅ Exitosos: ${successful.length}/${results.length}`, successful.length === results.length ? 'green' : 'yellow');
  log(`❌ Fallidos: ${failed.length}/${results.length}`, failed.length === 0 ? 'green' : 'red');
  
  if (failed.length > 0) {
    log(`\n🚨 ENDPOINTS FALLIDOS:`, 'red');
    failed.forEach(f => {
      log(`   • ${f.description}: ${f.result.error || f.result.status}`, 'red');
    });
  }
  
  // Calcular tiempo promedio
  const avgTiming = results.reduce((sum, r) => sum + (r.result.timing || 0), 0) / results.length;
  log(`⏱️  Tiempo promedio: ${avgTiming.toFixed(0)}ms`, 'cyan');
  
  return results;
}

async function main() {
  const args = process.argv.slice(2);
  const environment = args[0] || 'production';
  
  log(`🚀 Iniciando diagnóstico de búsqueda...`, 'bright');
  
  if (environment === 'production' || environment === 'prod') {
    await runDiagnostics(PRODUCTION_URL, 'production');
  } else if (environment === 'local' || environment === 'dev') {
    await runDiagnostics(LOCAL_URL, 'local');
  } else if (environment === 'both') {
    await runDiagnostics(LOCAL_URL, 'local');
    await runDiagnostics(PRODUCTION_URL, 'production');
  } else {
    log(`❌ Entorno no válido: ${environment}`, 'red');
    log(`💡 Uso: node scripts/debug-search-production.js [production|local|both]`, 'yellow');
    process.exit(1);
  }
  
  log(`\n✅ Diagnóstico completado!`, 'green');
  log(`💡 Para más detalles, visita: ${PRODUCTION_URL}/debug-search`, 'cyan');
}

// Ejecutar script
if (require.main === module) {
  main().catch(error => {
    log(`💥 Error ejecutando diagnóstico: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { runDiagnostics, testEndpoint };
