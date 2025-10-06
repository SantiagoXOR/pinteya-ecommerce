// ===================================
// SCRIPT PARA DIAGNOSTICAR WEBHOOK DE CLERK
// ===================================

const https = require('https')
const http = require('http')

// Configuración
const config = {
  productionUrl: 'https://pinteya-ecommerce.vercel.app',
  webhookEndpoints: ['/api/auth/webhook', '/api/webhooks/clerk'],
}

// Función para probar conectividad de un endpoint
async function testEndpoint(url) {
  return new Promise(resolve => {
    const protocol = url.startsWith('https') ? https : http

    const req = protocol.request(
      url,
      {
        method: 'GET',
        timeout: 10000,
      },
      res => {
        let data = ''
        res.on('data', chunk => (data += chunk))
        res.on('end', () => {
          resolve({
            url,
            status: res.statusCode,
            headers: res.headers,
            body: data.substring(0, 200), // Primeros 200 caracteres
          })
        })
      }
    )

    req.on('error', error => {
      resolve({
        url,
        status: 'ERROR',
        error: error.message,
      })
    })

    req.on('timeout', () => {
      req.destroy()
      resolve({
        url,
        status: 'TIMEOUT',
        error: 'Request timeout',
      })
    })

    req.end()
  })
}

// Función para probar webhook con POST
async function testWebhookPost(url) {
  return new Promise(resolve => {
    const testPayload = JSON.stringify({
      type: 'user.created',
      data: {
        id: 'test_user_123',
        email_addresses: [
          {
            email_address: 'test@pinteya.com',
          },
        ],
        first_name: 'Test',
        last_name: 'User',
      },
    })

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': testPayload.length,
        'svix-id': 'test_id',
        'svix-timestamp': Math.floor(Date.now() / 1000).toString(),
        'svix-signature': 'test_signature',
      },
      timeout: 10000,
    }

    const protocol = url.startsWith('https') ? https : http
    const req = protocol.request(url, options, res => {
      let data = ''
      res.on('data', chunk => (data += chunk))
      res.on('end', () => {
        resolve({
          url,
          method: 'POST',
          status: res.statusCode,
          headers: res.headers,
          body: data.substring(0, 500),
        })
      })
    })

    req.on('error', error => {
      resolve({
        url,
        method: 'POST',
        status: 'ERROR',
        error: error.message,
      })
    })

    req.on('timeout', () => {
      req.destroy()
      resolve({
        url,
        method: 'POST',
        status: 'TIMEOUT',
        error: 'Request timeout',
      })
    })

    req.write(testPayload)
    req.end()
  })
}

// Función principal de diagnóstico
async function runDiagnostic() {
  console.log('🔍 DIAGNÓSTICO DE WEBHOOK CLERK - PINTEYA E-COMMERCE')
  console.log('='.repeat(60))
  console.log()

  // 1. Probar conectividad básica
  console.log('📡 Probando conectividad básica...')
  const baseResult = await testEndpoint(config.productionUrl)
  console.log(`   Base URL: ${baseResult.status} - ${baseResult.url}`)
  console.log()

  // 2. Probar endpoints de webhook con GET
  console.log('🔗 Probando endpoints de webhook (GET)...')
  for (const endpoint of config.webhookEndpoints) {
    const url = config.productionUrl + endpoint
    const result = await testEndpoint(url)
    console.log(`   ${endpoint}: ${result.status}`)
    if (result.error) {
      console.log(`      Error: ${result.error}`)
    }
  }
  console.log()

  // 3. Probar endpoints de webhook con POST
  console.log('📤 Probando endpoints de webhook (POST)...')
  for (const endpoint of config.webhookEndpoints) {
    const url = config.productionUrl + endpoint
    const result = await testWebhookPost(url)
    console.log(`   ${endpoint}: ${result.status}`)
    if (result.error) {
      console.log(`      Error: ${result.error}`)
    } else if (result.body) {
      console.log(`      Response: ${result.body.substring(0, 100)}...`)
    }
  }
  console.log()

  // 4. Probar API de sincronización manual
  console.log('🔄 Probando API de sincronización manual...')
  const syncUrl = config.productionUrl + '/api/auth/sync-user'
  const syncResult = await testEndpoint(syncUrl)
  console.log(`   Sync API: ${syncResult.status}`)
  console.log()

  // 5. Recomendaciones
  console.log('💡 RECOMENDACIONES:')
  console.log('   1. Verificar configuración de webhook en Clerk dashboard')
  console.log('   2. Confirmar que CLERK_WEBHOOK_SECRET esté configurado')
  console.log('   3. Revisar logs de Vercel para errores de webhook')
  console.log('   4. Probar sincronización manual si webhook falla')
  console.log()
  console.log('🔧 URLs para configurar en Clerk:')
  config.webhookEndpoints.forEach(endpoint => {
    console.log(`   ${config.productionUrl}${endpoint}`)
  })
}

// Ejecutar diagnóstico
runDiagnostic().catch(console.error)
