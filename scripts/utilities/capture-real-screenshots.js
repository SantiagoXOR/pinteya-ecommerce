#!/usr/bin/env node

// ===================================
// SCRIPT PARA CAPTURAR SCREENSHOTS REALES DEL FLUJO DE CHECKOUT
// ===================================

const { chromium } = require('playwright')
const fs = require('fs/promises')
const path = require('path')

// Configuración
const CONFIG = {
  baseUrl: 'http://localhost:3000',
  screenshotsDir: path.join(__dirname, '..', 'public', 'test-screenshots'),
  viewport: { width: 1920, height: 1080 },
  timeout: 30000,
  waitTime: 3000,
  quality: 90,
}

// Pasos del flujo de checkout REAL
const CHECKOUT_STEPS = [
  {
    id: 'setup-shop-page',
    name: 'Página de tienda cargada',
    description: 'Usuario navega a la página de productos',
    url: '/shop',
    actions: async page => {
      console.log('  📄 Navegando a la página de tienda...')
      await page.goto(`${CONFIG.baseUrl}/shop`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(CONFIG.waitTime)
    },
    fullPage: true,
  },
  {
    id: 'setup-product-added',
    name: 'Producto agregado al carrito',
    description: 'Usuario agrega un producto al carrito',
    url: '/shop',
    actions: async page => {
      console.log('  🛒 Agregando producto al carrito...')
      await page.goto(`${CONFIG.baseUrl}/shop`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)

      // Buscar botón de agregar al carrito con múltiples selectores
      const addToCartSelectors = [
        'button:has-text("Agregar al carrito")',
        'button:has-text("Add to Cart")',
        'button:has-text("Agregar")',
        '.add-to-cart',
        '[data-testid="add-to-cart"]',
        '.product-card button',
        '.btn-primary',
      ]

      let clicked = false
      for (const selector of addToCartSelectors) {
        try {
          const element = await page.$(selector)
          if (element) {
            await element.click()
            clicked = true
            console.log(`    ✅ Clicked: ${selector}`)
            break
          }
        } catch (e) {
          console.log(`    ❌ Failed: ${selector}`)
        }
      }

      if (!clicked) {
        console.log('    ⚠️ No se encontró botón de agregar al carrito, continuando...')
      }

      await page.waitForTimeout(2000)
    },
    fullPage: false,
  },
  {
    id: 'step1-cart-sidebar',
    name: 'Sidebar del carrito abierto',
    description: 'Sidebar del carrito con productos visibles',
    url: '/shop',
    actions: async page => {
      console.log('  🛒 Abriendo sidebar del carrito...')
      await page.goto(`${CONFIG.baseUrl}/shop`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)

      // Primero agregar producto
      const addToCartSelectors = [
        'button:has-text("Agregar al carrito")',
        'button:has-text("Agregar")',
        '.add-to-cart',
        '.product-card button',
      ]

      for (const selector of addToCartSelectors) {
        try {
          const element = await page.$(selector)
          if (element) {
            await element.click()
            break
          }
        } catch (e) {}
      }

      await page.waitForTimeout(1000)

      // Luego abrir carrito
      const cartSelectors = [
        '.cart-icon',
        '[data-testid="cart-icon"]',
        'button:has-text("Cart")',
        'button:has-text("Carrito")',
        '.shopping-cart',
      ]

      for (const selector of cartSelectors) {
        try {
          const element = await page.$(selector)
          if (element) {
            await element.click()
            console.log(`    ✅ Opened cart: ${selector}`)
            break
          }
        } catch (e) {}
      }

      await page.waitForTimeout(2000)
    },
    fullPage: false,
  },
  {
    id: 'step1-checkout-page',
    name: 'Página de checkout cargada',
    description: 'Formulario de checkout completamente cargado',
    url: '/checkout',
    actions: async page => {
      console.log('  💳 Navegando a página de checkout...')
      await page.goto(`${CONFIG.baseUrl}/checkout`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(CONFIG.waitTime)
    },
    fullPage: true,
  },
  {
    id: 'step2-form-initial',
    name: 'Formulario de checkout inicial',
    description: 'Estado inicial del formulario de checkout',
    url: '/checkout',
    actions: async page => {
      console.log('  📝 Mostrando formulario inicial...')
      await page.goto(`${CONFIG.baseUrl}/checkout`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(CONFIG.waitTime)

      // Scroll para mostrar mejor el formulario
      await page.evaluate(() => window.scrollTo(0, 200))
      await page.waitForTimeout(1000)
    },
    fullPage: false,
  },
  {
    id: 'step3-validation-errors',
    name: 'Errores de validación mostrados',
    description: 'Errores de validación visibles en formulario vacío',
    url: '/checkout',
    actions: async page => {
      console.log('  ❌ Mostrando errores de validación...')
      await page.goto(`${CONFIG.baseUrl}/checkout`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)

      // Intentar enviar formulario vacío
      const submitSelectors = [
        'button[type="submit"]',
        'button:has-text("Finalizar")',
        'button:has-text("Submit")',
        'button:has-text("Continuar")',
        '.submit-btn',
        '.btn-primary',
      ]

      for (const selector of submitSelectors) {
        try {
          const element = await page.$(selector)
          if (element) {
            await element.click()
            console.log(`    ✅ Clicked submit: ${selector}`)
            break
          }
        } catch (e) {}
      }

      await page.waitForTimeout(2000)
    },
    fullPage: true,
  },
  {
    id: 'step4-personal-filled',
    name: 'Información personal completada',
    description: 'Campos de información personal completados',
    url: '/checkout',
    actions: async page => {
      console.log('  👤 Llenando información personal...')
      await page.goto(`${CONFIG.baseUrl}/checkout`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)

      // Llenar campos de información personal
      const fields = [
        {
          selectors: [
            'input[name="firstName"]',
            'input[name="first_name"]',
            'input[placeholder*="nombre" i]',
          ],
          value: 'Juan',
        },
        {
          selectors: [
            'input[name="lastName"]',
            'input[name="last_name"]',
            'input[placeholder*="apellido" i]',
          ],
          value: 'Pérez',
        },
        {
          selectors: ['input[name="email"]', 'input[type="email"]'],
          value: 'juan.perez@example.com',
        },
        {
          selectors: [
            'input[name="phone"]',
            'input[type="tel"]',
            'input[placeholder*="teléfono" i]',
          ],
          value: '+54 11 1234-5678',
        },
      ]

      for (const field of fields) {
        for (const selector of field.selectors) {
          try {
            const element = await page.$(selector)
            if (element) {
              await element.fill(field.value)
              console.log(`    ✅ Filled ${selector}: ${field.value}`)
              break
            }
          } catch (e) {}
        }
      }

      await page.waitForTimeout(1000)
    },
    fullPage: false,
  },
  {
    id: 'step4-address-filled',
    name: 'Dirección de envío completada',
    description: 'Formulario completo con dirección de envío',
    url: '/checkout',
    actions: async page => {
      console.log('  🏠 Llenando dirección de envío...')
      await page.goto(`${CONFIG.baseUrl}/checkout`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)

      // Llenar todos los campos
      const allFields = [
        { selectors: ['input[name="firstName"]', 'input[name="first_name"]'], value: 'Juan' },
        { selectors: ['input[name="lastName"]', 'input[name="last_name"]'], value: 'Pérez' },
        {
          selectors: ['input[name="email"]', 'input[type="email"]'],
          value: 'juan.perez@example.com',
        },
        { selectors: ['input[name="phone"]', 'input[type="tel"]'], value: '+54 11 1234-5678' },
        {
          selectors: ['input[name="address"]', 'input[name="street"]'],
          value: 'Av. Corrientes 1234',
        },
        { selectors: ['input[name="city"]'], value: 'Buenos Aires' },
        { selectors: ['input[name="zipCode"]', 'input[name="postal_code"]'], value: '1043' },
      ]

      for (const field of allFields) {
        for (const selector of field.selectors) {
          try {
            const element = await page.$(selector)
            if (element) {
              await element.fill(field.value)
              break
            }
          } catch (e) {}
        }
      }

      await page.evaluate(() => window.scrollTo(0, 500))
      await page.waitForTimeout(1000)
    },
    fullPage: true,
  },
  {
    id: 'step5-payment-method',
    name: 'Selección de método de pago',
    description: 'Opciones de pago disponibles (MercadoPago, efectivo)',
    url: '/checkout',
    actions: async page => {
      console.log('  💳 Mostrando métodos de pago...')
      await page.goto(`${CONFIG.baseUrl}/checkout`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)

      // Llenar formulario completo primero
      const allFields = [
        { selectors: ['input[type="email"]'], value: 'juan.perez@example.com' },
        { selectors: ['input[type="tel"]'], value: '+54 11 1234-5678' },
        {
          selectors: ['input[name="address"]', 'input[name="street"]'],
          value: 'Av. Corrientes 1234',
        },
        { selectors: ['input[name="city"]'], value: 'Buenos Aires' },
        { selectors: ['input[name="zipCode"]'], value: '1043' },
      ]

      for (const field of allFields) {
        for (const selector of field.selectors) {
          try {
            const element = await page.$(selector)
            if (element) {
              await element.fill(field.value)
              break
            }
          } catch (e) {}
        }
      }

      // Scroll para mostrar métodos de pago
      await page.evaluate(() => window.scrollTo(0, 800))
      await page.waitForTimeout(1500)
    },
    fullPage: false,
  },
  {
    id: 'step6-order-review',
    name: 'Revisión final del pedido',
    description: 'Resumen completo antes de confirmar compra',
    url: '/checkout',
    actions: async page => {
      console.log('  📋 Mostrando revisión final...')
      await page.goto(`${CONFIG.baseUrl}/checkout`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)

      // Llenar formulario completo
      const allFields = [
        { selectors: ['input[type="email"]'], value: 'juan.perez@example.com' },
        { selectors: ['input[type="tel"]'], value: '+54 11 1234-5678' },
        { selectors: ['input[name="address"]'], value: 'Av. Corrientes 1234' },
        { selectors: ['input[name="city"]'], value: 'Buenos Aires' },
        { selectors: ['input[name="zipCode"]'], value: '1043' },
      ]

      for (const field of allFields) {
        for (const selector of field.selectors) {
          try {
            const element = await page.$(selector)
            if (element) {
              await element.fill(field.value)
              break
            }
          } catch (e) {}
        }
      }

      // Seleccionar método de pago
      const paymentSelectors = [
        'input[name="payment"][value="mercadopago"]',
        'input[id="mercadopago"]',
        'label[for="mercadopago"]',
      ]

      for (const selector of paymentSelectors) {
        try {
          const element = await page.$(selector)
          if (element) {
            await element.click()
            break
          }
        } catch (e) {}
      }

      // Scroll para mostrar resumen completo
      await page.evaluate(() => window.scrollTo(0, 1000))
      await page.waitForTimeout(1500)
    },
    fullPage: true,
  },
  {
    id: 'step7-processing-state',
    name: 'Estado de procesamiento',
    description: 'Loading state durante el procesamiento del pago',
    url: '/checkout',
    actions: async page => {
      console.log('  ⏳ Simulando estado de procesamiento...')
      await page.goto(`${CONFIG.baseUrl}/checkout`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)

      // Llenar formulario completo
      const allFields = [
        { selectors: ['input[type="email"]'], value: 'juan.perez@example.com' },
        { selectors: ['input[type="tel"]'], value: '+54 11 1234-5678' },
        { selectors: ['input[name="address"]'], value: 'Av. Corrientes 1234' },
        { selectors: ['input[name="city"]'], value: 'Buenos Aires' },
        { selectors: ['input[name="zipCode"]'], value: '1043' },
      ]

      for (const field of allFields) {
        for (const selector of field.selectors) {
          try {
            const element = await page.$(selector)
            if (element) {
              await element.fill(field.value)
              break
            }
          } catch (e) {}
        }
      }

      // Intentar hacer submit para capturar loading state
      const submitSelectors = [
        'button[type="submit"]',
        'button:has-text("Finalizar")',
        'button:has-text("Proceder")',
        '.submit-btn',
      ]

      for (const selector of submitSelectors) {
        try {
          const element = await page.$(selector)
          if (element) {
            await element.click()
            // Capturar inmediatamente el loading state
            await page.waitForTimeout(500)
            break
          }
        } catch (e) {}
      }
    },
    fullPage: false,
  },
  {
    id: 'step8-success-page',
    name: 'Página de pago exitoso',
    description: 'Confirmación de compra exitosa',
    url: '/checkout/success?payment_id=123456789&status=approved&external_reference=test-order-123',
    actions: async page => {
      console.log('  ✅ Navegando a página de éxito...')
      await page.goto(
        `${CONFIG.baseUrl}/checkout/success?payment_id=123456789&status=approved&external_reference=test-order-123`
      )
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(CONFIG.waitTime)
    },
    fullPage: true,
  },
  {
    id: 'step9-failure-page',
    name: 'Página de pago rechazado',
    description: 'Error en el procesamiento del pago',
    url: '/checkout/failure?payment_id=123456789&status=rejected&external_reference=test-order-123',
    actions: async page => {
      console.log('  ❌ Navegando a página de error...')
      await page.goto(
        `${CONFIG.baseUrl}/checkout/failure?payment_id=123456789&status=rejected&external_reference=test-order-123`
      )
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(CONFIG.waitTime)
    },
    fullPage: true,
  },
  {
    id: 'step10-pending-page',
    name: 'Página de pago pendiente',
    description: 'Pago en proceso de verificación',
    url: '/checkout/pending?payment_id=123456789&status=pending&external_reference=test-order-123',
    actions: async page => {
      console.log('  ⏳ Navegando a página pendiente...')
      await page.goto(
        `${CONFIG.baseUrl}/checkout/pending?payment_id=123456789&status=pending&external_reference=test-order-123`
      )
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(CONFIG.waitTime)
    },
    fullPage: true,
  },
]

// Pasos adicionales opcionales para cobertura completa
const OPTIONAL_CHECKOUT_STEPS = [
  {
    id: 'bonus-express-mode',
    name: 'Modo checkout express',
    description: 'Vista del checkout en modo express/simplificado',
    url: '/checkout',
    actions: async page => {
      console.log('  🚀 Activando modo express...')
      await page.goto(`${CONFIG.baseUrl}/checkout`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)

      // Buscar toggle de modo express
      const expressSelectors = [
        'button:has-text("Express")',
        'button:has-text("Rápido")',
        '.express-toggle',
        '[data-testid="express-mode"]',
      ]

      for (const selector of expressSelectors) {
        try {
          const element = await page.$(selector)
          if (element) {
            await element.click()
            await page.waitForTimeout(1000)
            break
          }
        } catch (e) {}
      }

      await page.waitForTimeout(1500)
    },
    fullPage: true,
  },
]

// Función para crear directorios
async function createDirectories() {
  try {
    await fs.mkdir(CONFIG.screenshotsDir, { recursive: true })
    await fs.mkdir(path.join(CONFIG.screenshotsDir, 'thumbs'), { recursive: true })
    console.log(`📁 Directorios creados en: ${CONFIG.screenshotsDir}`)
  } catch (error) {
    console.error('Error creando directorios:', error)
  }
}

// Función para capturar screenshot
async function captureScreenshot(page, step) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = `${step.id}-${timestamp}.png`
  const thumbFilename = `${step.id}-${timestamp}-thumb.png`

  const fullPath = path.join(CONFIG.screenshotsDir, filename)
  const thumbPath = path.join(CONFIG.screenshotsDir, 'thumbs', thumbFilename)

  try {
    // Capturar screenshot principal
    await page.screenshot({
      path: fullPath,
      fullPage: step.fullPage || false,
    })

    // Crear thumbnail
    await page.screenshot({
      path: thumbPath,
      fullPage: false,
      clip: { x: 0, y: 0, width: 400, height: 300 },
    })

    const stats = await fs.stat(fullPath)

    return {
      id: step.id,
      stepName: step.name,
      url: `/test-screenshots/${filename}`,
      previewUrl: `/test-screenshots/thumbs/${thumbFilename}`,
      timestamp: new Date().toISOString(),
      status: 'success',
      metadata: {
        width: CONFIG.viewport.width,
        height: CONFIG.viewport.height,
        size: stats.size,
      },
    }
  } catch (error) {
    console.error(`❌ Error capturando ${step.id}:`, error.message)
    return null
  }
}

// Función principal
async function captureRealScreenshots(includeOptional = false) {
  console.log('🎬 Iniciando captura de screenshots REALES del flujo de checkout...')
  console.log(`🌐 URL base: ${CONFIG.baseUrl}`)

  // Combinar pasos principales con opcionales si se solicita
  const allSteps = includeOptional
    ? [...CHECKOUT_STEPS, ...OPTIONAL_CHECKOUT_STEPS]
    : CHECKOUT_STEPS
  console.log(`📋 Total de pasos a capturar: ${allSteps.length}`)

  await createDirectories()

  const browser = await chromium.launch({
    headless: false, // Mostrar navegador para debug
    slowMo: 800, // Ralentizar para ver qué pasa
  })

  const context = await browser.newContext({
    viewport: CONFIG.viewport,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  })

  const page = await context.newPage()
  page.setDefaultTimeout(CONFIG.timeout)

  const results = []

  try {
    for (let i = 0; i < allSteps.length; i++) {
      const step = allSteps[i]
      console.log(`\n📸 [${i + 1}/${allSteps.length}] Capturando: ${step.name}`)

      try {
        // Ejecutar acciones del paso
        await step.actions(page)

        // Capturar screenshot
        const result = await captureScreenshot(page, step)
        if (result) {
          results.push(result)
          console.log(`  ✅ Screenshot guardado: ${result.url}`)
        }
      } catch (error) {
        console.error(`  ❌ Error en paso ${step.id}:`, error.message)
      }
    }

    // Guardar metadata
    const metadata = {
      generated: new Date().toISOString(),
      total: results.length,
      type: 'real-screenshots-extended',
      description:
        'Screenshots reales del flujo completo de checkout incluyendo páginas de resultado',
      coverage: {
        basic_flow: allSteps.filter(s => !s.id.startsWith('bonus')).length,
        result_pages: allSteps.filter(
          s => s.id.includes('success') || s.id.includes('failure') || s.id.includes('pending')
        ).length,
        optional_features: allSteps.filter(s => s.id.startsWith('bonus')).length,
      },
      screenshots: results,
    }

    const metadataPath = path.join(CONFIG.screenshotsDir, 'metadata.json')
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))

    console.log(`\n🎉 Captura completada:`)
    console.log(`   - ${results.length} screenshots capturados`)
    console.log(`   - Metadata: ${metadataPath}`)
    console.log(`   - Acceso: ${CONFIG.baseUrl}/test-screenshots/`)
  } finally {
    await browser.close()
  }

  return results
}

// Ejecutar si se llama directamente
if (require.main === module) {
  captureRealScreenshots()
    .then(results => {
      console.log('\n📊 Screenshots capturados:')
      results.forEach((result, index) => {
        console.log(`  ${index + 1}. ${result.stepName} - ${result.url}`)
      })
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ Error general:', error)
      process.exit(1)
    })
}

module.exports = { captureRealScreenshots }
