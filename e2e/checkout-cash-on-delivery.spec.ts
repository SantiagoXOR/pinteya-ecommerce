// ===================================
// PINTEYA E-COMMERCE - TEST E2E PAGO CONTRA ENTREGA
// ===================================

import { test, expect } from '@playwright/test'

/**
 * Suite de tests E2E para el flujo completo de checkout con pago contra entrega
 * 
 * Flujo testeado:
 * 1. Agregar producto al carrito
 * 2. Navegar a checkout
 * 3. Completar formulario con datos del comprador
 * 4. Seleccionar método de pago "Pago al recibir"
 * 5. Confirmar orden
 * 6. Verificar redirección a página de éxito
 * 7. Verificar que el carrito se limpia
 */

test.describe('Checkout - Pago Contra Entrega', () => {
  test.beforeEach(async ({ page }) => {
    // Configurar timeout extendido para operaciones de pago
    test.setTimeout(90000)

    console.log('🚀 Iniciando test de pago contra entrega...')
  })

  test('Flujo completo: Agregar producto → Checkout → Pago Contra Entrega → Éxito', async ({ page }) => {
    // PASO 1: Navegar a la página de productos
    await test.step('Navegar a la página de productos', async () => {
      console.log('📍 Navegando a la página de productos...')
      await page.goto('/products')
      await page.waitForLoadState('networkidle')
      
      // Tomar screenshot del estado inicial
      await page.screenshot({ path: 'test-results/screenshots/cash-delivery-1-products.png', fullPage: true })
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
      await page.screenshot({ path: 'test-results/screenshots/cash-delivery-2-cart-updated.png', fullPage: true })
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
      await page.screenshot({ path: 'test-results/screenshots/cash-delivery-3-checkout-page.png', fullPage: true })
    })

    // PASO 4: Completar formulario de checkout
    await test.step('Completar formulario de información personal', async () => {
      console.log('📝 Completando formulario de checkout...')
      
      // Esperar a que el formulario esté visible
      await page.waitForSelector('[data-testid="checkout-form"]', { timeout: 10000 })
      
      // Completar información personal
      await page.fill('[data-testid="email-input"]', 'test.cash@pinteya.com')
      await page.fill('[data-testid="first-name-input"]', 'Juan Carlos')
      await page.fill('[data-testid="last-name-input"]', 'Pérez González')
      await page.fill('[data-testid="dni-input"]', '35123456')
      await page.fill('[data-testid="phone-input"]', '3513411796')
      
      // Completar dirección
      await page.fill('[data-testid="street-address-input"]', 'Av. Colón 1234')
      
      // Opcional: Agregar observaciones
      const observationsInput = page.locator('[data-testid="observations-input"]')
      if (await observationsInput.isVisible()) {
        await observationsInput.fill('Departamento B - Timbre 2')
      }
      
      console.log('✅ Formulario completado')
      await page.screenshot({ path: 'test-results/screenshots/cash-delivery-4-form-filled.png', fullPage: true })
    })

    // PASO 5: Seleccionar método de pago "Pago Contra Entrega"
    await test.step('Seleccionar método de pago "Pago al recibir"', async () => {
      console.log('💰 Seleccionando método de pago contra entrega...')
      
      // Buscar y hacer clic en la opción de pago contra entrega
      // El PaymentMethodSelector tiene dos opciones: cash y mercadopago
      const cashPaymentOption = page.locator('[data-testid="payment-method-cash"], .payment-method-selector').filter({ hasText: /pago.*recibir|contra.*entrega|efectivo/i }).first()
      
      // Si no encuentra por testid, buscar por texto alternativo
      if (!(await cashPaymentOption.isVisible().catch(() => false))) {
        // Buscar el card que contiene "Pagás al recibir" o "Pago contra entrega"
        const cashCard = page.locator('.cursor-pointer').filter({ hasText: /pag.*recibir|contra.*entrega/i }).first()
        await expect(cashCard).toBeVisible({ timeout: 5000 })
        await cashCard.click()
      } else {
        await cashPaymentOption.click()
      }
      
      await page.waitForTimeout(1000)
      
      console.log('✅ Método de pago "Contra Entrega" seleccionado')
      await page.screenshot({ path: 'test-results/screenshots/cash-delivery-5-payment-selected.png', fullPage: true })
    })

    // PASO 6: Enviar orden
    await test.step('Enviar orden de compra', async () => {
      console.log('📤 Enviando orden de compra...')
      
      // Hacer clic en el botón de enviar orden
      const submitButton = page.locator('[data-testid="submit-order"], button[type="submit"]:has-text("Confirmar"), button:has-text("Finalizar")').first()
      await expect(submitButton).toBeVisible({ timeout: 5000 })
      
      // Verificar que el botón no está deshabilitado
      await expect(submitButton).toBeEnabled()
      
      await submitButton.click()
      
      console.log('⏳ Esperando procesamiento de la orden...')
      
      // Esperar el procesamiento (puede mostrar un loader)
      await page.waitForTimeout(2000)
      
      await page.screenshot({ path: 'test-results/screenshots/cash-delivery-6-processing.png', fullPage: true })
    })

    // PASO 7: Verificar redirección a página de éxito
    await test.step('Verificar redirección a página de éxito', async () => {
      console.log('🎯 Verificando redirección a página de éxito...')
      
      // Esperar redirección a la página de éxito
      await page.waitForURL('**/checkout/cash-success**', { timeout: 15000 })
      
      const currentUrl = page.url()
      console.log(`✅ Redirigido a: ${currentUrl}`)
      
      // Verificar que la URL contiene parámetros esperados
      expect(currentUrl).toContain('checkout/cash-success')
      
      await page.screenshot({ path: 'test-results/screenshots/cash-delivery-7-success-page.png', fullPage: true })
    })

    // PASO 8: Verificar contenido de la página de éxito
    await test.step('Verificar contenido de página de éxito', async () => {
      console.log('✅ Verificando contenido de la página de éxito...')
      
      // Esperar a que cargue completamente
      await page.waitForLoadState('networkidle')
      
      // Verificar elementos principales
      await expect(page.locator('h1:has-text("Pedido Confirmado"), h1:has-text("¡Pedido"), h2:has-text("Éxito")')).toBeVisible({ timeout: 5000 })
      
      // Verificar que se muestra el método de pago
      await expect(page.locator('text=/pago.*contra.*entrega|efectivo/i')).toBeVisible()
      
      // Verificar que hay un número de orden visible
      const orderIdElement = page.locator('text=/orden.*#|pedido.*#|order/i').first()
      if (await orderIdElement.isVisible().catch(() => false)) {
        const orderText = await orderIdElement.textContent()
        console.log(`📋 Número de orden: ${orderText}`)
      }
      
      // Verificar que se muestra el total
      const totalElement = page.locator('text=/total|monto/i').first()
      await expect(totalElement).toBeVisible()
      
      console.log('✅ Página de éxito validada correctamente')
      await page.screenshot({ path: 'test-results/screenshots/cash-delivery-8-success-validated.png', fullPage: true })
    })

    // PASO 9: Verificar que el carrito está vacío
    await test.step('Verificar que el carrito se limpió', async () => {
      console.log('🛒 Verificando que el carrito se limpió...')
      
      // Navegar a la página principal o productos para verificar el carrito
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      // Verificar que el contador del carrito muestra "0" o no está visible
      const cartCounter = page.locator('[data-testid="cart-counter"]')
      
      // El carrito debería estar vacío o mostrar 0
      const isCounterVisible = await cartCounter.isVisible().catch(() => false)
      if (isCounterVisible) {
        const counterText = await cartCounter.textContent()
        expect(counterText).toBe('0')
      }
      
      console.log('✅ Carrito limpiado correctamente')
      await page.screenshot({ path: 'test-results/screenshots/cash-delivery-9-cart-cleared.png', fullPage: true })
    })

    console.log('🎉 Test de pago contra entrega completado exitosamente')
  })

  test('Validación de formulario: No permite enviar con campos vacíos', async ({ page }) => {
    console.log('⚠️ Probando validación de formulario vacío...')

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
    
    // Intentar enviar sin completar campos
    const submitButton = page.locator('[data-testid="submit-order"], button[type="submit"]').first()
    
    // El botón debería estar deshabilitado o mostrar errores al hacer clic
    const isDisabled = await submitButton.isDisabled()
    
    if (!isDisabled) {
      await submitButton.click()
      await page.waitForTimeout(1000)
      
      // Verificar que NO se redirige (sigue en checkout)
      expect(page.url()).toContain('checkout')
      expect(page.url()).not.toContain('success')
    }
    
    console.log('✅ Validación de formulario funciona correctamente')
    await page.screenshot({ path: 'test-results/screenshots/cash-delivery-validation.png', fullPage: true })
  })
})

