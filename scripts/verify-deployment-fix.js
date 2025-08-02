#!/usr/bin/env node

/**
 * PINTEYA E-COMMERCE - VERIFICADOR DE DEPLOYMENT
 * Verifica que el error de Server Action se haya solucionado
 */

const https = require('https');
const fs = require('fs');

console.log('🔍 VERIFICADOR DE DEPLOYMENT - PINTEYA E-COMMERCE');
console.log('Verificando que el error de Server Action se haya solucionado...\n');

const APP_URL = 'https://pinteya-ecommerce.vercel.app';
const VERCEL_API_URL = 'https://api.vercel.com/v6/deployments';

/**
 * Hace una request HTTP
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: data,
            json: null
          };
          
          if (res.headers['content-type']?.includes('application/json')) {
            result.json = JSON.parse(data);
          }
          
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

/**
 * Verifica que la aplicación esté respondiendo
 */
async function verifyAppHealth() {
  console.log('🌐 Verificando salud de la aplicación...');
  
  try {
    const response = await makeRequest(APP_URL);
    
    if (response.statusCode === 200) {
      console.log('✅ Aplicación respondiendo correctamente (200 OK)');
      
      // Verificar que no haya errores de Server Action en el HTML
      if (response.body.includes('Failed to find Server Action')) {
        console.log('❌ ERROR: Todavía se detecta error de Server Action en el HTML');
        return false;
      } else {
        console.log('✅ No se detectan errores de Server Action en el HTML');
        return true;
      }
    } else {
      console.log(`❌ Aplicación respondiendo con error: ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Error verificando aplicación:', error.message);
    return false;
  }
}

/**
 * Verifica páginas críticas
 */
async function verifyCriticalPages() {
  console.log('\n📄 Verificando páginas críticas...');
  
  const pages = [
    { name: 'Home', url: `${APP_URL}` },
    { name: 'Shop', url: `${APP_URL}/shop` },
    { name: 'Search', url: `${APP_URL}/search?q=pintura` },
    { name: 'Sign In', url: `${APP_URL}/signin` }
  ];
  
  const results = [];
  
  for (const page of pages) {
    try {
      console.log(`  🔍 Verificando ${page.name}...`);
      const response = await makeRequest(page.url);
      
      const success = response.statusCode === 200 || response.statusCode === 302;
      const hasServerActionError = response.body.includes('Failed to find Server Action');
      
      results.push({
        name: page.name,
        url: page.url,
        status: response.statusCode,
        success,
        hasServerActionError
      });
      
      if (success && !hasServerActionError) {
        console.log(`    ✅ ${page.name}: OK (${response.statusCode})`);
      } else if (hasServerActionError) {
        console.log(`    ❌ ${page.name}: Server Action Error detectado`);
      } else {
        console.log(`    ⚠️  ${page.name}: ${response.statusCode}`);
      }
      
      // Pequeña pausa entre requests
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.log(`    ❌ ${page.name}: Error - ${error.message}`);
      results.push({
        name: page.name,
        url: page.url,
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
}

/**
 * Verifica el webhook de Clerk
 */
async function verifyWebhook() {
  console.log('\n🔗 Verificando webhook de Clerk...');
  
  try {
    const webhookUrl = `${APP_URL}/api/webhooks/clerk`;
    const response = await makeRequest(webhookUrl, {
      method: 'GET'
    });
    
    // El webhook debería responder con 405 (Method Not Allowed) para GET
    if (response.statusCode === 405) {
      console.log('✅ Webhook endpoint respondiendo correctamente (405 Method Not Allowed para GET)');
      return true;
    } else {
      console.log(`⚠️  Webhook respondiendo con: ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Error verificando webhook:', error.message);
    return false;
  }
}

/**
 * Genera reporte final
 */
function generateReport(appHealth, pageResults, webhookHealth) {
  console.log('\n📊 REPORTE FINAL');
  console.log('================');
  
  const allPagesOk = pageResults.every(page => page.success && !page.hasServerActionError);
  const hasAnyServerActionError = pageResults.some(page => page.hasServerActionError);
  
  console.log(`🌐 Salud de aplicación: ${appHealth ? '✅ OK' : '❌ ERROR'}`);
  console.log(`📄 Páginas críticas: ${allPagesOk ? '✅ OK' : '❌ ERROR'}`);
  console.log(`🔗 Webhook Clerk: ${webhookHealth ? '✅ OK' : '⚠️  WARNING'}`);
  
  if (hasAnyServerActionError) {
    console.log('\n❌ ERRORES DE SERVER ACTION DETECTADOS:');
    pageResults
      .filter(page => page.hasServerActionError)
      .forEach(page => console.log(`   - ${page.name}: ${page.url}`));
  }
  
  const overallSuccess = appHealth && allPagesOk && !hasAnyServerActionError;
  
  console.log(`\n🎯 ESTADO GENERAL: ${overallSuccess ? '✅ SOLUCIONADO' : '❌ REQUIERE ATENCIÓN'}`);
  
  if (overallSuccess) {
    console.log('\n🎉 ¡El error de Server Action ha sido solucionado exitosamente!');
    console.log('✨ La aplicación está funcionando correctamente.');
  } else {
    console.log('\n⚠️  El problema persiste. Acciones recomendadas:');
    console.log('1. Esperar 2-3 minutos más para que el deployment se complete');
    console.log('2. Verificar logs de Vercel para errores de build');
    console.log('3. Hacer redeploy manual desde Vercel dashboard');
  }
  
  return overallSuccess;
}

/**
 * Función principal
 */
async function main() {
  try {
    console.log(`🚀 Iniciando verificación de deployment...\n`);
    console.log(`📍 URL de aplicación: ${APP_URL}\n`);
    
    // Verificaciones
    const appHealth = await verifyAppHealth();
    const pageResults = await verifyCriticalPages();
    const webhookHealth = await verifyWebhook();
    
    // Reporte final
    const success = generateReport(appHealth, pageResults, webhookHealth);
    
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    console.error('\n❌ ERROR EN LA VERIFICACIÓN:', error.message);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = {
  verifyAppHealth,
  verifyCriticalPages,
  verifyWebhook,
  generateReport
};
