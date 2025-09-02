#!/usr/bin/env node

/**
 * SCRIPT DE DEBUG ESPECÍFICO PARA NEXTAUTH.JS
 * 
 * Verifica si NextAuth.js está configurado correctamente
 */

const fetch = globalThis.fetch;

async function testNextAuthEndpoints() {
  console.log('🔍 TESTING NEXTAUTH.JS ENDPOINTS...\n');
  
  const endpoints = [
    '/api/auth/providers',
    '/api/auth/session',
    '/api/auth/csrf',
    '/api/auth/signin',
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`📍 Testing: ${endpoint}`);
      
      const response = await fetch(`http://localhost:3000${endpoint}`, {
        method: 'GET',
        timeout: 10000,
      });

      console.log(`📊 Status: ${response.status}`);
      
      if (response.status === 200) {
        const text = await response.text();
        console.log(`📋 Response: ${text.substring(0, 200)}...`);
        console.log(`✅ NextAuth.js endpoint funcionando\n`);
      } else {
        console.log(`❌ NextAuth.js endpoint no funciona\n`);
      }

    } catch (error) {
      console.log(`💥 Error: ${error.message}\n`);
    }
  }
}

async function testMiddlewareExecution() {
  console.log('🔍 TESTING MIDDLEWARE EXECUTION...\n');
  
  try {
    const response = await fetch('http://localhost:3000/admin', {
      method: 'GET',
      timeout: 10000,
      headers: {
        'User-Agent': 'NextAuth-Debug-Test/1.0'
      }
    });

    console.log(`📊 Status: ${response.status}`);
    console.log(`📋 Headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2)}`);
    
    if (response.status === 401 || response.status === 403) {
      console.log(`✅ MIDDLEWARE FUNCIONANDO - Acceso denegado correctamente`);
    } else if (response.status === 200) {
      console.log(`❌ MIDDLEWARE NO FUNCIONANDO - Acceso permitido sin auth`);
    } else if (response.status === 307 || response.status === 302) {
      console.log(`🔄 MIDDLEWARE FUNCIONANDO - Redirigiendo a login`);
      console.log(`📍 Location: ${response.headers.get('location')}`);
    }

  } catch (error) {
    console.log(`💥 Error: ${error.message}`);
  }
}

async function runDebugTests() {
  console.log('🔒 INICIANDO DEBUG DE NEXTAUTH.JS...\n');
  
  await testNextAuthEndpoints();
  await testMiddlewareExecution();
  
  console.log('\n🔍 VERIFICAR LOGS DEL SERVIDOR PARA MÁS INFORMACIÓN');
}

runDebugTests();
