/**
 * Prueba Integral del Pipeline Completo de Compra
 *
 * Esta prueba verifica todo el flujo de compra desde la selección del producto
 * hasta la confirmación en el panel de órdenes, interactuando con todas las APIs.
 */

const { chromium } = require('playwright')
const axios = require('axios')

const BASE_URL = 'http://localhost:3000'
const API_BASE = `${BASE_URL}/api`

// Configuración de la prueba
const TEST_CONFIG = {
  timeout: 30000,
  viewport: { width: 1280, height: 720 },
  headless: false,
  slowMo: 500, // Para mejor visualización
}

// Datos de prueba
const TEST_DATA = {
  customer: {
    email: 'test@example.com',
    name: 'Usuario Prueba',
    phone: '+54 11 1234-5678',
    address: 'Av. Corrientes 1234, CABA',
  },
  observations: 'Entrega entre 9-17hs. Casa con portón azul. Timbre funciona.',
}

class PurchasePipelineTest {
  constructor() {
    this.browser = null
    this.page = null
    this.testResults = {
      steps: [],
      apis: [],
      errors: [],
      startTime: Date.now(),
    }
  }

  async init() {
    console.log('🚀 Iniciando prueba integral del pipeline de compra...')
    this.browser = await chromium.launch(TEST_CONFIG)
    this.page = await this.browser.newPage()
    await this.page.setViewportSize(TEST_CONFIG.viewport)

    // Interceptar requests para monitorear APIs
    this.page.on('response', response => {
      if (response.url().includes('/api/')) {
        this.testResults.apis.push({
          url: response.url(),
          status: response.status(),
          method: response.request().method(),
          timestamp: Date.now(),
        })
      }
    })
  }

  async logStep(step, success = true, details = '') {
    const result = {
      step,
      success,
      details,
      timestamp: Date.now(),
      screenshot: `step-${this.testResults.steps.length + 1}-${step.replace(/\s+/g, '-').toLowerCase()}.png`,
    }

    this.testResults.steps.push(result)
    console.log(`${success ? '✅' : '❌'} ${step}${details ? ': ' + details : ''}`)

    // Tomar screenshot de cada paso
    try {
      await this.page.screenshot({
        path: `test-screenshots/${result.screenshot}`,
        fullPage: false,
      })
    } catch (error) {
      console.warn('⚠️ No se pudo tomar screenshot:', error.message)
    }
  }

  async testAPIEndpoint(endpoint, method = 'GET', data = null) {
    try {
      const config = {
        method,
        url: `${API_BASE}${endpoint}`,
        timeout: 10000,
      }

      if (data) {
        config.data = data
        config.headers = { 'Content-Type': 'application/json' }
      }

      const response = await axios(config)
      await this.logStep(`API ${method} ${endpoint}`, true, `Status: ${response.status}`)
      return response.data
    } catch (error) {
      await this.logStep(`API ${method} ${endpoint}`, false, error.message)
      this.testResults.errors.push({ endpoint, error: error.message })
      throw error
    }
  }

  async step1_LoadHomepage() {
    await this.logStep('Navegando a la página principal')
    await this.page.goto(BASE_URL, { waitUntil: 'networkidle' })

    // Verificar que la página cargó correctamente
    const title = await this.page.title()
    if (!title) {
      throw new Error('La página principal no cargó correctamente')
    }

    await this.logStep('Página principal cargada', true, `Título: ${title}`)
  }

  async step2_TestProductsAPI() {
    await this.logStep('Probando API de productos')

    // Probar diferentes endpoints de productos
    const endpoints = [
      '/products',
      '/products?limit=10',
      '/products?categories=pinturas',
      '/search/trending?limit=4',
    ]

    for (const endpoint of endpoints) {
      await this.testAPIEndpoint(endpoint)
    }
  }

  async step3_SelectProduct() {
    await this.logStep('Seleccionando primer producto')

    // Esperar a que los productos carguen
    await this.page.waitForSelector('[data-testid="product-card"], .product-card, .grid > div', {
      timeout: 10000,
    })

    // Hacer clic en el primer producto
    await this.page.click(
      '[data-testid="product-card"]:first-child, .product-card:first-child, .grid > div:first-child'
    )

    // Esperar a que cargue la página del producto
    await this.page.waitForLoadState('networkidle')
    await this.logStep('Producto seleccionado correctamente')
  }

  async step4_AddToCart() {
    await this.logStep('Agregando producto al carrito')

    // Buscar y hacer clic en el botón de agregar al carrito
    const addToCartSelectors = [
      'button:has-text("Agregar al carrito"):not([aria-label*="Cerrar"])',
      '.add-to-cart:not(.close)',
      'button[data-action="add-to-cart"]',
    ]

    let clicked = false
    for (const selector of addToCartSelectors) {
      try {
        await this.page.click(selector, { timeout: 5000 })
        clicked = true
        break
      } catch (error) {
        continue
      }
    }

    if (!clicked) {
      throw new Error('No se pudo encontrar el botón de agregar al carrito')
    }

    await this.logStep('Producto agregado al carrito')
  }

  async step5_ViewCart() {
    await this.logStep('Navegando al carrito')

    // Hacer clic en el ícono del carrito
    const cartSelectors = [
      '[data-testid="cart-icon"]',
      '.cart-icon',
      'button[aria-label*="carrito"]:not([aria-label*="Cerrar"])',
      'a[href*="cart"]',
    ]

    let clicked = false
    for (const selector of cartSelectors) {
      try {
        await this.page.click(selector, { timeout: 5000 })
        clicked = true
        break
      } catch (error) {
        continue
      }
    }

    if (!clicked) {
      throw new Error('No se pudo acceder al carrito')
    }

    await this.page.waitForLoadState('networkidle')
    await this.logStep('Carrito visualizado correctamente')
  }

  async step6_ProceedToCheckout() {
    await this.logStep('Procediendo al checkout')

    // Hacer clic en el botón de checkout
    const checkoutSelectors = [
      'button:has-text("Finalizar Compra")',
      'button:has-text("Checkout")',
      'button:has-text("Proceder al pago")',
      '[data-testid="checkout-btn"]',
      '.checkout-btn',
    ]

    let clicked = false
    for (const selector of checkoutSelectors) {
      try {
        await this.page.click(selector, { timeout: 5000 })
        clicked = true
        break
      } catch (error) {
        continue
      }
    }

    if (!clicked) {
      throw new Error('No se pudo acceder al checkout')
    }

    await this.page.waitForLoadState('networkidle')
    await this.logStep('Checkout cargado correctamente')
  }

  async step7_FillCheckoutForm() {
    await this.logStep('Completando formulario de checkout')

    // Llenar email
    try {
      await this.page.fill('input[type="email"]', TEST_DATA.customer.email)
      await this.logStep('Email completado', true, TEST_DATA.customer.email)
    } catch (error) {
      await this.logStep('Error al completar email', false, error.message)
    }

    // Llenar nombre si existe el campo
    try {
      await this.page.fill(
        'input[name="name"], input[placeholder*="nombre"]',
        TEST_DATA.customer.name
      )
      await this.logStep('Nombre completado', true, TEST_DATA.customer.name)
    } catch (error) {
      console.log('Campo nombre no encontrado (opcional)')
    }

    // Llenar teléfono si existe el campo
    try {
      await this.page.fill('input[type="tel"], input[name="phone"]', TEST_DATA.customer.phone)
      await this.logStep('Teléfono completado', true, TEST_DATA.customer.phone)
    } catch (error) {
      console.log('Campo teléfono no encontrado (opcional)')
    }

    // Llenar observaciones
    try {
      await this.page.fill(
        'textarea[name="observations"], textarea[placeholder*="observaciones"]',
        TEST_DATA.observations
      )
      await this.logStep('Observaciones completadas', true, 'Campo de observaciones funcional')
    } catch (error) {
      await this.logStep('Error en campo observaciones', false, error.message)
    }
  }

  async step8_TestCheckoutAPIs() {
    await this.logStep('Probando APIs de checkout')

    // Datos válidos para las APIs de checkout
    const validCheckoutData = {
      customerInfo: {
        firstName: 'Usuario',
        lastName: 'Prueba',
        email: 'test@example.com',
        phone: '+54 11 1234-5678',
      },
      shippingAddress: {
        streetAddress: 'Av. Corrientes 1234',
        apartment: 'Depto 5B',
        city: 'Buenos Aires',
        state: 'CABA',
        zipCode: '1043',
        country: 'Argentina',
        observations: 'Entrega entre 9-17hs. Casa con portón azul.',
      },
      items: [
        {
          id: 'test-product-1',
          name: 'Pintura Test',
          price: 2500,
          quantity: 1,
          stock: 10,
        },
      ],
      paymentMethod: 'mercadopago',
      shippingMethod: 'free',
      totals: {
        subtotal: 2500,
        shipping: 2500, // Costo de envío para método 'free' con subtotal < 25000
        discount: 0,
        total: 5000, // subtotal + shipping
      },
      orderNotes: 'Orden de prueba del pipeline',
    }

    // Probar APIs relacionadas con checkout
    const checkoutAPIs = [
      { endpoint: '/auth/session', method: 'GET' },
      { endpoint: '/checkout/validate', method: 'POST', data: validCheckoutData },
      { endpoint: '/orders/create', method: 'POST', data: validCheckoutData },
    ]

    for (const api of checkoutAPIs) {
      try {
        await this.testAPIEndpoint(api.endpoint, api.method, api.data)
      } catch (error) {
        console.log(`API ${api.endpoint} no disponible o requiere autenticación`)
      }
    }
  }

  async step9_SubmitOrder() {
    await this.logStep('Enviando orden de compra')

    // Buscar y hacer clic en el botón de finalizar compra
    const submitSelectors = [
      'button:has-text("Finalizar Compra")',
      'button[type="submit"]',
      '.submit-order',
      '[data-testid="submit-order"]',
    ]

    let submitted = false
    for (const selector of submitSelectors) {
      try {
        await this.page.click(selector, { timeout: 5000 })
        submitted = true
        break
      } catch (error) {
        continue
      }
    }

    if (!submitted) {
      await this.logStep(
        'Botón finalizar compra encontrado pero no clickeable',
        false,
        'Verificar implementación'
      )
    } else {
      await this.page.waitForLoadState('networkidle')
      await this.logStep('Orden enviada correctamente')
    }
  }

  async step10_VerifyOrdersPanel() {
    await this.logStep('Verificando panel de órdenes')

    try {
      // Navegar al panel de órdenes (si existe)
      await this.page.goto(`${BASE_URL}/admin/orders`, { waitUntil: 'networkidle' })
      await this.logStep('Panel de órdenes accesible')

      // Probar API de órdenes
      await this.testAPIEndpoint('/orders')
    } catch (error) {
      await this.logStep('Panel de órdenes no accesible', false, 'Puede requerir autenticación')
    }
  }

  async generateReport() {
    const endTime = Date.now()
    const duration = endTime - this.testResults.startTime

    const report = {
      summary: {
        totalSteps: this.testResults.steps.length,
        successfulSteps: this.testResults.steps.filter(s => s.success).length,
        failedSteps: this.testResults.steps.filter(s => !s.success).length,
        totalAPIs: this.testResults.apis.length,
        successfulAPIs: this.testResults.apis.filter(a => a.status < 400).length,
        duration: `${(duration / 1000).toFixed(2)}s`,
        timestamp: new Date().toISOString(),
      },
      steps: this.testResults.steps,
      apis: this.testResults.apis,
      errors: this.testResults.errors,
    }

    // Guardar reporte
    const fs = require('fs')
    const reportPath = `test-reports/purchase-pipeline-${Date.now()}.json`

    try {
      if (!fs.existsSync('test-reports')) {
        fs.mkdirSync('test-reports', { recursive: true })
      }
      if (!fs.existsSync('test-screenshots')) {
        fs.mkdirSync('test-screenshots', { recursive: true })
      }

      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
      console.log(`\n📊 Reporte guardado en: ${reportPath}`)
    } catch (error) {
      console.error('Error al guardar reporte:', error.message)
    }

    return report
  }

  async run() {
    try {
      await this.init()

      // Ejecutar todos los pasos del pipeline
      await this.step1_LoadHomepage()
      await this.step2_TestProductsAPI()
      await this.step3_SelectProduct()
      await this.step4_AddToCart()
      await this.step5_ViewCart()
      await this.step6_ProceedToCheckout()
      await this.step7_FillCheckoutForm()
      await this.step8_TestCheckoutAPIs()
      await this.step9_SubmitOrder()
      await this.step10_VerifyOrdersPanel()

      const report = await this.generateReport()

      console.log('\n🎉 PRUEBA INTEGRAL COMPLETADA')
      console.log('================================')
      console.log(
        `✅ Pasos exitosos: ${report.summary.successfulSteps}/${report.summary.totalSteps}`
      )
      console.log(`🌐 APIs exitosas: ${report.summary.successfulAPIs}/${report.summary.totalAPIs}`)
      console.log(`⏱️ Duración total: ${report.summary.duration}`)

      if (report.summary.failedSteps > 0) {
        console.log('\n❌ ERRORES ENCONTRADOS:')
        report.errors.forEach(error => {
          console.log(`- ${error.endpoint || 'General'}: ${error.error}`)
        })
      }

      return report
    } catch (error) {
      console.error('\n💥 ERROR CRÍTICO EN LA PRUEBA:', error.message)
      this.testResults.errors.push({ general: error.message })
      throw error
    } finally {
      if (this.browser) {
        await this.browser.close()
      }
    }
  }
}

// Ejecutar la prueba
if (require.main === module) {
  const test = new PurchasePipelineTest()
  test
    .run()
    .then(report => {
      console.log('\n✨ Prueba completada exitosamente')
      process.exit(report.summary.failedSteps > 0 ? 1 : 0)
    })
    .catch(error => {
      console.error('\n💥 La prueba falló:', error.message)
      process.exit(1)
    })
}

module.exports = PurchasePipelineTest
