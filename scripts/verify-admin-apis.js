// ===================================
// PINTEYA E-COMMERCE - VERIFICACIÓN DE APIs ADMIN
// ===================================

const https = require('https');
const http = require('http');

// Configuración de verificación
const VERIFICATION_CONFIG = {
  baseUrl: process.env.VERCEL_URL || 'https://pinteya.com',
  timeout: 10000,
  retries: 3
};

// APIs críticas a verificar
const CRITICAL_APIS = [
  '/api/admin/monitoring/metrics',
  '/api/admin/monitoring',
  '/api/admin/monitoring/enterprise-metrics',
  '/api/admin/products',
  '/api/admin/orders',
  '/api/admin/analytics/cleanup',
  '/api/admin/users',
  '/api/admin/settings'
];

// APIs de monitoreo específicas (Fase 3)
const MONITORING_APIS = [
  '/api/admin/monitoring/health',
  '/api/admin/monitoring/alerts',
  '/api/admin/monitoring/config',
  '/api/admin/monitoring/reports'
];

// Función para hacer request HTTP/HTTPS
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'Pinteya-Admin-Verifier/1.0',
        'Accept': 'application/json',
        ...options.headers
      },
      timeout: VERIFICATION_CONFIG.timeout
    };

    const req = client.request(requestOptions, (res) => {
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
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Función para verificar una API específica
async function verifyAPI(apiPath, retryCount = 0) {
  const url = `${VERIFICATION_CONFIG.baseUrl}${apiPath}`;
  
  try {
    console.log(`🔍 Verificando: ${apiPath}`);
    
    const response = await makeRequest(url);
    
    // Analizar resultado
    const result = {
      path: apiPath,
      url: url,
      status: response.status,
      success: false,
      message: '',
      details: {}
    };

    // Determinar si es exitoso
    if (response.status === 200) {
      result.success = true;
      result.message = 'API responde correctamente';
    } else if (response.status === 401) {
      result.message = '❌ ERROR 401 - Problema de autenticación detectado';
      result.details.authError = true;
    } else if (response.status === 403) {
      result.message = '⚠️ ERROR 403 - Acceso denegado (esperado sin autenticación)';
      result.details.accessDenied = true;
    } else if (response.status === 404) {
      result.message = '❌ ERROR 404 - API no encontrada';
      result.details.notFound = true;
    } else if (response.status === 500) {
      result.message = '❌ ERROR 500 - Error interno del servidor';
      result.details.serverError = true;
    } else if (response.status >= 300 && response.status < 400) {
      result.message = `🔄 REDIRECT ${response.status} - Posible redirección de autenticación`;
      result.details.redirect = true;
    } else {
      result.message = `⚠️ STATUS ${response.status} - Respuesta inesperada`;
    }

    // Verificar headers de seguridad
    result.details.securityHeaders = {
      csp: !!response.headers['content-security-policy'],
      frameOptions: !!response.headers['x-frame-options'],
      contentType: !!response.headers['x-content-type-options']
    };

    return result;

  } catch (error) {
    if (retryCount < VERIFICATION_CONFIG.retries) {
      console.log(`⏳ Reintentando ${apiPath} (${retryCount + 1}/${VERIFICATION_CONFIG.retries})`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      return verifyAPI(apiPath, retryCount + 1);
    }

    return {
      path: apiPath,
      url: url,
      status: 0,
      success: false,
      message: `❌ ERROR DE CONEXIÓN: ${error.message}`,
      details: { connectionError: true, error: error.message }
    };
  }
}

// Función principal de verificación
async function runVerification() {
  console.log('🚀 Iniciando verificación de APIs admin...');
  console.log(`📡 Base URL: ${VERIFICATION_CONFIG.baseUrl}`);
  console.log(`⏱️ Timeout: ${VERIFICATION_CONFIG.timeout}ms`);
  console.log('=' * 60);

  const results = {
    timestamp: new Date().toISOString(),
    baseUrl: VERIFICATION_CONFIG.baseUrl,
    summary: {
      total: 0,
      success: 0,
      authErrors: 0,
      notFound: 0,
      serverErrors: 0,
      connectionErrors: 0
    },
    apis: []
  };

  // Verificar APIs críticas
  console.log('\n📋 VERIFICANDO APIs CRÍTICAS:');
  for (const api of CRITICAL_APIS) {
    const result = await verifyAPI(api);
    results.apis.push(result);
    results.summary.total++;

    if (result.success) {
      results.summary.success++;
      console.log(`✅ ${api}: ${result.message}`);
    } else {
      if (result.details.authError) results.summary.authErrors++;
      if (result.details.notFound) results.summary.notFound++;
      if (result.details.serverError) results.summary.serverErrors++;
      if (result.details.connectionError) results.summary.connectionErrors++;
      
      console.log(`❌ ${api}: ${result.message}`);
    }
  }

  // Verificar APIs de monitoreo
  console.log('\n📊 VERIFICANDO APIs DE MONITOREO (Fase 3):');
  for (const api of MONITORING_APIS) {
    const result = await verifyAPI(api);
    results.apis.push(result);
    results.summary.total++;

    if (result.success) {
      results.summary.success++;
      console.log(`✅ ${api}: ${result.message}`);
    } else {
      if (result.details.authError) results.summary.authErrors++;
      if (result.details.notFound) results.summary.notFound++;
      if (result.details.serverError) results.summary.serverErrors++;
      if (result.details.connectionError) results.summary.connectionErrors++;
      
      console.log(`❌ ${api}: ${result.message}`);
    }
  }

  // Generar resumen
  console.log('\n' + '=' * 60);
  console.log('📊 RESUMEN DE VERIFICACIÓN:');
  console.log(`📈 Total APIs verificadas: ${results.summary.total}`);
  console.log(`✅ APIs funcionando: ${results.summary.success}`);
  console.log(`❌ Errores 401 (Auth): ${results.summary.authErrors}`);
  console.log(`❌ Errores 404 (Not Found): ${results.summary.notFound}`);
  console.log(`❌ Errores 500 (Server): ${results.summary.serverErrors}`);
  console.log(`❌ Errores de conexión: ${results.summary.connectionErrors}`);

  const successRate = Math.round((results.summary.success / results.summary.total) * 100);
  console.log(`📊 Tasa de éxito: ${successRate}%`);

  // Evaluación final
  if (results.summary.authErrors > 0) {
    console.log('\n🚨 PROBLEMA CRÍTICO: Se detectaron errores 401');
    console.log('   La corrección del error 401 NO está funcionando correctamente');
  } else if (results.summary.connectionErrors > 3) {
    console.log('\n⚠️ PROBLEMA DE CONECTIVIDAD: Múltiples errores de conexión');
    console.log('   Posibles problemas de infraestructura o red');
  } else if (successRate >= 80) {
    console.log('\n✅ VERIFICACIÓN EXITOSA: APIs admin funcionando correctamente');
  } else {
    console.log('\n⚠️ VERIFICACIÓN PARCIAL: Algunos problemas detectados');
  }

  // Guardar resultados
  const fs = require('fs');
  fs.writeFileSync('./admin-apis-verification.json', JSON.stringify(results, null, 2));
  console.log('\n📄 Resultados guardados en: admin-apis-verification.json');

  return results;
}

// Ejecutar verificación si es llamado directamente
if (require.main === module) {
  runVerification().catch(console.error);
}

module.exports = { runVerification, verifyAPI };
