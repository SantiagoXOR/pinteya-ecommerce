#!/usr/bin/env node

/**
 * SCRIPT DE DEBUG ESPECÍFICO PARA MIDDLEWARE
 *
 * Este script hace requests específicos para verificar si el middleware se ejecuta
 * y captura los logs del servidor para análisis.
 */

const fetch = globalThis.fetch

async function testSpecificRoute(url, description) {
  console.log(`\n🔍 Testing: ${description}`)
  console.log(`📍 URL: ${url}`)

  try {
    const response = await fetch(url, {
      method: 'GET',
      timeout: 10000,
      headers: {
        'User-Agent': 'Middleware-Debug-Test/1.0',
      },
    })

    console.log(`📊 Status: ${response.status}`)
    console.log(
      `📋 Headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2)}`
    )

    if (response.status === 401 || response.status === 403) {
      console.log(`✅ PROTEGIDO - Middleware funcionando correctamente`)
    } else if (response.status === 200) {
      console.log(`❌ VULNERABLE - Middleware NO está funcionando`)
    } else {
      console.log(`⚠️  Status inesperado: ${response.status}`)
    }
  } catch (error) {
    console.log(`💥 Error: ${error.message}`)
  }
}

async function runDebugTests() {
  console.log('🔒 INICIANDO DEBUG DE MIDDLEWARE...\n')

  // Test rutas específicas
  await testSpecificRoute('http://localhost:3000/admin', 'Ruta UI Admin Principal')
  await testSpecificRoute('http://localhost:3000/api/admin/products', 'API Admin Products')
  await testSpecificRoute('http://localhost:3000/api/products', 'API Pública (debe funcionar)')

  console.log('\n🔍 VERIFICAR LOGS DEL SERVIDOR PARA VER SI EL MIDDLEWARE SE EJECUTA')
  console.log('Buscar líneas que contengan: [MIDDLEWARE EJECUTÁNDOSE]')
}

runDebugTests()
