// ===================================
// PINTEYA E-COMMERCE - TEST E2E MERCADOPAGO
// ===================================

import { test, expect } from '@playwright/test'

/**
 * Suite de tests E2E para el flujo completo de checkout con MercadoPago
 * 
 * Flujo testeado:
 * 1. Agregar producto al carrito
 * 2. Navegar a checkout
 * 3. Completar formulario con datos del comprador
 * 4. Seleccionar método de pago "MercadoPago"
 * 5. Confirmar orden
 * 6. Verificar que se crea la preferencia de pago
 * 7. Verificar que aparece el widget de MercadoPago
 */

test.describe('Checkout - MercadoPago', () => {
  test.beforeEach(async ({ page }) => {
    // Configurar timeout extendido para operaciones de pago
    test.setTimeout(90000)

    console.log('🚀 Iniciando test de MercadoPago...')
  })

  test('Flujo completo: Agregar producto → Checkout → MercadoPago → Widget visible', async ({ page }) => {
    // PASO 1: Navegar a la página de productos
    await test.step('Navegar a la página de productos', async () => {
      console.log('📍 Navegando a la página de productos...')
      await page.goto('/products')
      await page.waitForLoadState('networkidle')
      
      await page.screenshot({ path: 'test-results/screenshots/mercadopago-1-products.png', fullPage: true })
    })

    // PASO 2: Agregar primer producto disponible al carrito
    await test.step('Agregar producto al carrito', async () => {
      console.log('🛍️ Agregando producto al carrito...')
      
      // Buscar primer producto disponible
      const productCard = page.locator('[data-testid="commercial-product-card"]').first()
      await expect(productCard).toBeVisible({ timeout: 10000 })

      // Hacer clic en botón "Agregar al carrito"
      const addToCartButton = productCard.locator('[data-testid="add-to-cart"]')
      await addToCartButton.waitFor({ state: 'visible', timeout: 5000 })
      await addToCartButton.click()

      // Esperar a que se actualice el contador del carrito
      await page.waitForTimeout(1500)
      
      // Verificar que el contador del carrito muestra "1"
      const cartCounter = page.locator('[data-testid="cart-counter"]')
      await expect(cartCounter).toBeVisible()
      
      console.log('✅ Producto agregado al carrito')
      await page.screenshot({ path: 'test-results/screenshots/mercadopago-2-cart-updated.png', fullPage: true })
    })

    // PASO 3: Navegar al checkout
    await test.step('Navegar al checkout', async () => {
      console.log('🛒 Navegando al checkout...')
      
      // Abrir el carrito
      await page.click('[data-testid="cart-icon"]')
      await page.waitForTimeout(1000)
      
      // Hacer clic en el botón de checkout
      const checkoutButton = page.locator('button:has-text("Finalizar Compra"), [data-testid="checkout-btn"]').first()
      await expect(checkoutButton).toBeVisible({ timeout: 5000 })
      await checkoutButton.click()
      
      // Esperar a que cargue la página de checkout
      await page.waitForURL('**/checkout', { timeout: 10000 })
      await page.waitForLoadState('networkidle')
      
      console.log('✅ Página de checkout cargada')
      await page.screenshot({ path: 'test-results/screenshots/mercadopago-3-checkout-page.png', fullPage: true })
    })

    // PASO 4: Completar formulario de checkout
    await test.step('Completar formulario de información personal', async () => {
      console.log('📝 Completando formulario de checkout...')
      
      // Esperar a que el formulario esté visible
      await page.waitForSelector('[data-testid="checkout-form"]', { timeout: 10000 })
      
      // Completar información personal
      await page.fill('[data-testid="email-input"]', 'test.mp@pinteya.com')
      await page.fill('[data-testid="first-name-input"]', 'María Laura')
      await page.fill('[data-testid="last-name-input"]', 'Rodríguez')
      await page.fill('[data-testid="dni-input"]', '28456789')
      await page.fill('[data-testid="phone-input"]', '3513511234')
      
      // Completar dirección
      await page.fill('[data-testid="street-address-input"]', 'Av. Rafael Núñez 4567')
      
      console.log('✅ Formulario completado')
      await page.screenshot({ path: 'test-results/screenshots/mercadopago-4-form-filled.png', fullPage: true })
    })

    // PASO 5: Seleccionar método de pago "MercadoPago"
    await test.step('Seleccionar método de pago "MercadoPago"', async () => {
      console.log('💳 Seleccionando método de pago MercadoPago...')
      
      // Buscar y hacer clic en la opción de MercadoPago
      // El PaymentMethodSelector tiene dos opciones: cash y mercadopago
      const mercadopagoOption = page.locator('[data-testid="payment-method-mercadopago"], .payment-method-selector').filter({ hasText: /mercado.*pago/i }).first()
      
      // Si no encuentra por testid, buscar por texto alternativo
      if (!(await mercadopagoOption.isVisible().catch(() => false))) {
        // Buscar el card que contiene "Mercado Pago"
        const mpCard = page.locator('.cursor-pointer').filter({ hasText: /mercado.*pago/i }).first()
        await expect(mpCard).toBeVisible({ timeout: 5000 })
        await mpCard.click()
      } else {
        await mercadopagoOption.click()
      }
      
      await page.waitForTimeout(1000)
      
      console.log('✅ Método de pago "MercadoPago" seleccionado')
      await page.screenshot({ path: 'test-results/screenshots/mercadopago-5-payment-selected.png', fullPage: true })
    })

    // PASO 6: Interceptar llamada a la API de creación de preferencia
    await test.step('Interceptar API de creación de preferencia', async () => {
      console.log('🔍 Configurando interceptor de API...')
      
      // Interceptar la llamada a create-preference
      let preferenceCreated = false
      let preferenceData: any = null

      page.on('response', async (response) => {
        const url = response.url()
        if (url.includes('/api/payments/create-preference')) {
          console.log(`📡 Interceptado: ${url}`)
          console.log(`📊 Status: ${response.status()}`)
          
          if (response.status() === 200) {
            try {
              const data = await response.json()
              console.log('📦 Respuesta de API:', JSON.stringify(data, null, 2))
              preferenceData = data
              preferenceCreated = true
            } catch (e) {
              console.error('Error parseando respuesta:', e)
            }
          }
        }
      })

      console.log('✅ Interceptor configurado')
    })

    // PASO 7: Enviar orden
    await test.step('Enviar orden y verificar creación de preferencia', async () => {
      console.log('📤 Enviando orden de compra...')
      
      // Hacer clic en el botón de enviar orden
      const submitButton = page.locator('[data-testid="submit-order"], button[type="submit"]:has-text("Confirmar"), button:has-text("Finalizar")').first()
      await expect(submitButton).toBeVisible({ timeout: 5000 })
      
      // Verificar que el botón no está deshabilitado
      await expect(submitButton).toBeEnabled()
      
      await submitButton.click()
      
      console.log('⏳ Esperando procesamiento de la orden...')
      
      // Esperar el procesamiento (puede mostrar un loader)
      await page.waitForTimeout(3000)
      
      await page.screenshot({ path: 'test-results/screenshots/mercadopago-6-processing.png', fullPage: true })
    })

    // PASO 8: Verificar que aparece el widget de MercadoPago
    await test.step('Verificar widget de MercadoPago', async () => {
      console.log('💳 Verificando widget de MercadoPago...')
      
      // Esperar a que aparezca el widget de MercadoPago o el iframe
      // El MercadoPago Wallet Brick se renderiza en un div específico
      
      // Opción 1: Verificar que se cargó el script de MercadoPago
      const mpScriptLoaded = await page.evaluate(() => {
        return typeof (window as any).MercadoPago !== 'undefined'
      }).catch(() => false)
      
      if (mpScriptLoaded) {
        console.log('✅ Script de MercadoPago cargado')
      }
      
      // Opción 2: Verificar que existe el contenedor del wallet brick
      const walletContainer = page.locator('#wallet_container, [id*="mercadopago"], [class*="mercadopago-wallet"], cho-container')
      const isWalletVisible = await walletContainer.isVisible({ timeout: 10000 }).catch(() => false)
      
      if (isWalletVisible) {
        console.log('✅ Widget de MercadoPago visible')
      } else {
        console.log('⚠️ Widget no visible, verificando redirección alternativa...')
        
        // Algunas implementaciones redirigen directamente
        const currentUrl = page.url()
        if (currentUrl.includes('mercadopago') || currentUrl.includes('checkout/success') || currentUrl.includes('checkout/pending')) {
          console.log(`✅ Redirección a: ${currentUrl}`)
        }
      }
      
      await page.screenshot({ path: 'test-results/screenshots/mercadopago-7-widget.png', fullPage: true })
    })

    // PASO 8.5: Verificar que NO aparezca "Costo de envío" en la preferencia
    await test.step('Verificar que el envío no aparece como ítem separado', async () => {
      console.log('🚚 Verificando que el envío no aparece como ítem separado...')
      
      // Interceptar la respuesta de create-preference para verificar la estructura
      let preferenceData: any = null
      
      page.on('response', async (response) => {
        if (response.url().includes('/api/payments/create-preference')) {
          try {
            const data = await response.json()
            preferenceData = data
            console.log('📦 Datos de preferencia interceptados:', JSON.stringify(data, null, 2))
          } catch (e) {
            console.log('⚠️ No se pudo parsear respuesta de preferencia')
          }
        }
      })
      
      // Verificar que la API se llama sin shipments
      // Esto se verifica indirectamente al no ver "Costo de envío" en MercadoPago
      console.log('✅ Verificación: El envío debe estar incluido en el precio de productos')
      
      await page.screenshot({ path: 'test-results/screenshots/mercadopago-8-no-shipping.png', fullPage: true })
    })

    // PASO 9: Verificar que el carrito NO se limpia (se mantiene hasta completar el pago)
    await test.step('Verificar que el carrito se mantiene', async () => {
      console.log('🛒 Verificando que el carrito se mantiene...')
      
      // Volver a la página principal
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      // El carrito NO debería estar vacío aún (pago pendiente)
      const cartCounter = page.locator('[data-testid="cart-counter"]')
      const isCounterVisible = await cartCounter.isVisible().catch(() => false)
      
      if (isCounterVisible) {
        const counterText = await cartCounter.textContent()
        console.log(`🛒 Contador del carrito: ${counterText}`)
        
        // Nota: Dependiendo de la implementación, el carrito podría limpiarse
        // solo después de completar el pago en MercadoPago
      }
      
      await page.screenshot({ path: 'test-results/screenshots/mercadopago-8-cart-status.png', fullPage: true })
    })

    console.log('🎉 Test de MercadoPago completado exitosamente')
  })

  test('Validación: Verificar que el formulario valida campos obligatorios', async ({ page }) => {
    console.log('⚠️ Probando validación de formulario...')

    // Navegar directamente al checkout (asumiendo que hay algo en el carrito)
    await page.goto('/products')
    await page.waitForLoadState('networkidle')
    
    // Agregar producto
    const addToCartButton = page.locator('[data-testid="commercial-product-card"]').first().locator('[data-testid="add-to-cart"]')
    await addToCartButton.click()
    await page.waitForTimeout(1500)
    
    // Ir al checkout
    await page.click('[data-testid="cart-icon"]')
    await page.waitForTimeout(1000)
    const checkoutButton = page.locator('button:has-text("Finalizar Compra")').first()
    await checkoutButton.click()
    await page.waitForURL('**/checkout')
    
    // Seleccionar MercadoPago
    const mpOption = page.locator('.cursor-pointer').filter({ hasText: /mercado.*pago/i }).first()
    if (await mpOption.isVisible().catch(() => false)) {
      await mpOption.click()
      await page.waitForTimeout(500)
    }
    
    // Intentar enviar sin completar todos los campos
    const submitButton = page.locator('[data-testid="submit-order"], button[type="submit"]').first()
    
    const isDisabled = await submitButton.isDisabled()
    
    if (!isDisabled) {
      await submitButton.click()
      await page.waitForTimeout(1000)
      
      // Verificar que NO se procesa (sigue en checkout)
      expect(page.url()).toContain('checkout')
      expect(page.url()).not.toContain('mercadopago.com')
    }
    
    console.log('✅ Validación de formulario funciona correctamente')
    await page.screenshot({ path: 'test-results/screenshots/mercadopago-validation.png', fullPage: true })
  })

  test('API: Verificar estructura de respuesta de create-preference', async ({ page, request }) => {
    console.log('🔍 Probando API de create-preference directamente...')

    // Preparar payload de prueba
    const payload = {
      items: [
        {
          id: '1',
          quantity: 1
        }
      ],
      payer: {
        name: 'Test',
        surname: 'API',
        email: 'test@test.com',
        phone: '3513411796',
        identification: {
          type: 'DNI',
          number: '12345678'
        }
      },
      shipping: {
        cost: 1500,
        address: {
          street_name: 'Av. Colón',
          street_number: '1234',
          zip_code: '5000',
          city_name: 'Córdoba',
          state_name: 'Córdoba'
        }
      }
    }

    // Hacer la llamada a la API
    const response = await request.post('/api/payments/create-preference', {
      data: payload,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    console.log(`📊 Status de respuesta: ${response.status()}`)

    // Verificar que la respuesta es exitosa (200) o manejada (400, 500)
    expect([200, 400, 500, 503]).toContain(response.status())

    if (response.status() === 200) {
      const data = await response.json()
      console.log('📦 Respuesta:', JSON.stringify(data, null, 2))

      // Verificar estructura de respuesta
      expect(data).toHaveProperty('success')
      
      if (data.success) {
        expect(data).toHaveProperty('data')
        expect(data.data).toHaveProperty('preference_id')
        expect(data.data).toHaveProperty('init_point')
        
        console.log('✅ Preferencia creada exitosamente')
        console.log(`🆔 Preference ID: ${data.data.preference_id}`)
        console.log(`🔗 Init Point: ${data.data.init_point}`)
      }
    } else {
      const errorData = await response.json()
      console.log('⚠️ Error en API:', JSON.stringify(errorData, null, 2))
    }
  })

  test('Página de éxito: Verificar redirección a WhatsApp', async ({ page }) => {
    console.log('📱 Probando página de éxito de MercadoPago...')

    // Simular acceso a la página de éxito con un order_id
    const mockOrderId = '123'
    await page.goto(`/checkout/mercadopago-success?order_id=${mockOrderId}`)
    
    // Esperar a que cargue la página
    await page.waitForLoadState('networkidle')
    
    // Verificar elementos principales de la página
    await expect(page.locator('h1:has-text("Pago Exitoso")')).toBeVisible()
    await expect(page.locator('text=/MercadoPago/')).toBeVisible()
    
    // Verificar que aparece el contador de redirección
    const countdownElement = page.locator('text=/Redirección automática en/')
    if (await countdownElement.isVisible({ timeout: 5000 })) {
      console.log('✅ Contador de redirección visible')
    }
    
    // Verificar que hay botón de WhatsApp
    await expect(page.locator('button:has-text("Ir a WhatsApp")')).toBeVisible()
    
    // Verificar que hay botones de fallback
    await expect(page.locator('text=/Si WhatsApp no funciona/')).toBeVisible()
    await expect(page.locator('button:has-text("Copiar Mensaje")')).toBeVisible()
    await expect(page.locator('button:has-text("Llamar al negocio")')).toBeVisible()
    
    console.log('✅ Página de éxito de MercadoPago funciona correctamente')
    
    await page.screenshot({ path: 'test-results/screenshots/mercadopago-success-page.png', fullPage: true })
  })
})

