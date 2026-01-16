/**
 * Script para probar el sistema de analytics localmente
 * Simula eventos del navegador y verifica que se capturen correctamente
 */

const http = require('http')

const BASE_URL = 'http://localhost:3000'

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

// Función para hacer requests HTTP
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = ''
      res.on('data', (chunk) => {
        body += chunk
      })
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {}
          resolve({ status: res.statusCode, headers: res.headers, data: parsed })
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data: body })
        }
      })
    })

    req.on('error', (error) => {
      reject(error)
    })

    if (data) {
      req.write(JSON.stringify(data))
    }

    req.end()
  })
}

// Función para enviar evento de analytics
async function sendAnalyticsEvent(event) {
  const url = new URL('/api/track/events', BASE_URL)
  
  const options = {
    hostname: url.hostname,
    port: url.port || 3000,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  }

  try {
    const response = await makeRequest(options, event)
    return response
  } catch (error) {
    log(`❌ Error enviando evento: ${error.message}`, 'red')
    throw error
  }
}

// Función para verificar eventos en la base de datos (a través de la API)
async function checkEventsInDB(eventType = 'add_to_cart', limit = 5) {
  const url = new URL('/api/analytics/metrics', BASE_URL)
  url.searchParams.set('startDate', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
  url.searchParams.set('endDate', new Date().toISOString())

  const options = {
    hostname: url.hostname,
    port: url.port || 3000,
    path: url.pathname + url.search,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  }

  try {
    const response = await makeRequest(options)
    return response
  } catch (error) {
    log(`❌ Error verificando eventos: ${error.message}`, 'red')
    throw error
  }
}

// Test principal
async function runTests() {
  log('\n🧪 Iniciando pruebas del sistema de analytics...\n', 'cyan')

  // Test 1: Verificar que el servidor está corriendo
  log('📡 Test 1: Verificando que el servidor está corriendo...', 'blue')
  try {
    const url = new URL('/', BASE_URL)
    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname,
      method: 'GET',
    }
    const response = await makeRequest(options)
    if (response.status === 200) {
      log('✅ Servidor está corriendo correctamente', 'green')
    } else {
      log(`⚠️ Servidor respondió con status ${response.status}`, 'yellow')
    }
  } catch (error) {
    log(`❌ Error conectando al servidor: ${error.message}`, 'red')
    log('💡 Asegúrate de que el servidor esté corriendo en http://localhost:3000', 'yellow')
    process.exit(1)
  }

  // Test 2: Enviar evento page_view
  log('\n📄 Test 2: Enviando evento page_view...', 'blue')
  try {
    const pageViewEvent = {
      event: 'page_view',
      category: 'navigation',
      action: 'view',
      label: '/test-page',
      value: null,
      sessionId: `test-session-${Date.now()}`,
      userId: 'test-user-123',
      page: '/test-page',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      timestamp: Date.now(),
    }

    const response = await sendAnalyticsEvent(pageViewEvent)
    if (response.status === 200) {
      log('✅ Evento page_view enviado correctamente', 'green')
      log(`   Response: ${JSON.stringify(response.data)}`, 'cyan')
    } else {
      log(`⚠️ Evento enviado pero status: ${response.status}`, 'yellow')
    }
  } catch (error) {
    log(`❌ Error en test 2: ${error.message}`, 'red')
  }

  // Test 3: Enviar evento add_to_cart
  log('\n🛒 Test 3: Enviando evento add_to_cart...', 'blue')
  try {
    const addToCartEvent = {
      event: 'add_to_cart',
      category: 'shop',
      action: 'add_to_cart',
      label: 'product-123',
      value: 1000,
      sessionId: `test-session-${Date.now()}`,
      userId: 'test-user-123',
      page: '/product/123',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      timestamp: Date.now(),
      metadata: {
        productName: 'Producto de Prueba',
        category: 'Test Category',
        price: 1000,
        quantity: 1,
        currency: 'ARS',
      },
    }

    const response = await sendAnalyticsEvent(addToCartEvent)
    if (response.status === 200) {
      log('✅ Evento add_to_cart enviado correctamente', 'green')
      log(`   Response: ${JSON.stringify(response.data)}`, 'cyan')
    } else {
      log(`⚠️ Evento enviado pero status: ${response.status}`, 'yellow')
      log(`   Response: ${JSON.stringify(response.data)}`, 'yellow')
    }
  } catch (error) {
    log(`❌ Error en test 3: ${error.message}`, 'red')
  }

  // Test 4: Verificar eventos en la base de datos
  log('\n📊 Test 4: Verificando eventos en la base de datos...', 'blue')
  try {
    await new Promise((resolve) => setTimeout(resolve, 2000)) // Esperar 2 segundos para que se procese
    
    const response = await checkEventsInDB()
    if (response.status === 200) {
      log('✅ API de métricas respondió correctamente', 'green')
      log(`   Métricas obtenidas: ${JSON.stringify(response.data, null, 2)}`, 'cyan')
      
      if (response.data.ecommerce) {
        log(`   📈 Cart Additions: ${response.data.ecommerce.cartAdditions || 0}`, 'cyan')
        log(`   📈 Total Revenue: ${response.data.ecommerce.totalRevenue || 0}`, 'cyan')
      }
    } else {
      log(`⚠️ API respondió con status: ${response.status}`, 'yellow')
      log(`   Response: ${JSON.stringify(response.data)}`, 'yellow')
    }
  } catch (error) {
    log(`❌ Error en test 4: ${error.message}`, 'red')
  }

  // Test 5: Enviar múltiples eventos
  log('\n🔄 Test 5: Enviando múltiples eventos...', 'blue')
  try {
    const events = [
      {
        event: 'product_view',
        category: 'shop',
        action: 'view_item',
        label: 'product-456',
        value: null,
        sessionId: `test-session-${Date.now()}`,
        userId: 'test-user-123',
        page: '/product/456',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        timestamp: Date.now(),
      },
      {
        event: 'begin_checkout',
        category: 'shop',
        action: 'begin_checkout',
        label: 'checkout',
        value: 2000,
        sessionId: `test-session-${Date.now()}`,
        userId: 'test-user-123',
        page: '/checkout',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        timestamp: Date.now(),
      },
    ]

    let successCount = 0
    for (const event of events) {
      try {
        const response = await sendAnalyticsEvent(event)
        if (response.status === 200) {
          successCount++
        }
      } catch (error) {
        log(`   ⚠️ Error enviando evento ${event.event}: ${error.message}`, 'yellow')
      }
      await new Promise((resolve) => setTimeout(resolve, 500)) // Esperar entre eventos
    }

    log(`✅ ${successCount}/${events.length} eventos enviados correctamente`, 'green')
  } catch (error) {
    log(`❌ Error en test 5: ${error.message}`, 'red')
  }

  log('\n✨ Pruebas completadas!\n', 'cyan')
  log('💡 Para verificar los eventos en la base de datos, ejecuta:', 'yellow')
  log('   SELECT * FROM analytics_events_optimized ORDER BY created_at DESC LIMIT 10;', 'yellow')
  log('')
}

// Ejecutar tests
runTests().catch((error) => {
  log(`\n❌ Error fatal: ${error.message}`, 'red')
  process.exit(1)
})
