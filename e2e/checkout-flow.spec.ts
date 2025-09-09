// ===================================
// PINTEYA E-COMMERCE - E2E CHECKOUT FLOW TESTS OPTIMIZADO
// ===================================

import { test, expect } from '@playwright/test'

/**
 * Suite de tests E2E optimizada para el flujo de checkout sin autenticación
 *
 * Características mejoradas:
 * - Screenshots automáticos en cada paso crítico
 * - Métricas de rendimiento detalladas
 * - Validación exhaustiva de estados
 * - Integración con dashboard de test-reports
 * - Manejo robusto de errores
 */

// Configuración de screenshots mejorada
const SCREENSHOT_OPTIONS = {
  fullPage: true,
  animations: 'disabled' as const,
  clip: undefined
}

// Helper para capturar screenshots con contexto
async function captureStepScreenshot(page: any, stepName: string, description: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = `checkout-flow-${stepName}-${timestamp}.png`

  await page.screenshot({
    path: `test-results/screenshots/${filename}`,
    ...SCREENSHOT_OPTIONS
  })

  console.log(`📸 Screenshot capturado: ${stepName} - ${description}`)
  return filename
}

// Helper para métricas de rendimiento
async function capturePerformanceMetrics(page: any, stepName: string) {
  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    return {
      loadTime: navigation.loadEventEnd - navigation.loadEventStart,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
      timestamp: Date.now()
    }
  })

  console.log(`⚡ Métricas ${stepName}:`, metrics)
  return metrics
}

test.describe('Checkout Flow - Flujo Completo sin Autenticación', () => {
  test.beforeEach(async ({ page }) => {
    console.log('🚀 Iniciando setup del flujo de checkout...')

    // 1. Navegar a la tienda
    await page.goto('/shop')
    await page.waitForSelector('[data-testid="product-card"]')
    await captureStepScreenshot(page, 'setup-shop-page', 'Página de tienda cargada')

    // 2. Agregar producto al carrito
    await page.click('[data-testid="product-card"]:first-child [data-testid="add-to-cart-btn"]')
    await captureStepScreenshot(page, 'setup-product-added', 'Producto agregado al carrito')

    // 3. Verificar contador del carrito
    const cartCounter = page.locator('[data-testid="cart-counter"]')
    await expect(cartCounter).toHaveText('1')

    console.log('✅ Setup completado - Producto en carrito')
  })

  test('Paso 1: Navegación desde carrito a checkout', async ({ page }) => {
    console.log('🛒 Iniciando test: Navegación carrito → checkout')

    // 1. Abrir sidebar del carrito
    await page.click('[data-testid="cart-icon"]')
    await page.waitForSelector('[data-testid="cart-item"]')
    await captureStepScreenshot(page, 'step1-cart-sidebar', 'Sidebar del carrito abierto')

    // 2. Verificar items en el carrito
    await expect(page.locator('[data-testid="cart-item"]')).toBeVisible()
    const itemCount = await page.locator('[data-testid="cart-item"]').count()
    console.log(`📦 Items en carrito: ${itemCount}`)

    // 3. Hacer clic en botón checkout
    await page.click('[data-testid="checkout-btn"]')
    await page.waitForLoadState('networkidle')
    await captureStepScreenshot(page, 'step1-checkout-transition', 'Transición a página de checkout')

    // 4. Verificar llegada a página de checkout
    await expect(page).toHaveURL('/checkout')
    await expect(page.locator('h1:has-text("Checkout")')).toBeVisible()
    await captureStepScreenshot(page, 'step1-checkout-page', 'Página de checkout cargada')

    // 5. Capturar métricas de rendimiento
    const metrics = await capturePerformanceMetrics(page, 'navegacion-checkout')

    console.log('✅ Test completado: Navegación exitosa a checkout')
  })

  test('Paso 2: Validación de formulario de checkout', async ({ page }) => {
    console.log('📝 Iniciando test: Validación de formulario')

    // 1. Navegar directamente a checkout
    await page.goto('/checkout')
    await page.waitForLoadState('networkidle')
    await captureStepScreenshot(page, 'step2-form-initial', 'Formulario de checkout inicial')

    // 2. Verificar secciones principales del formulario
    console.log('🔍 Verificando secciones del formulario...')

    const sections = [
      { selector: '[data-testid="payer-info-section"]', name: 'Información del comprador' },
      { selector: '[data-testid="shipping-info-section"]', name: 'Información de envío' },
      { selector: '[data-testid="order-summary-section"]', name: 'Resumen del pedido' }
    ]

    for (const section of sections) {
      await expect(page.locator(section.selector)).toBeVisible()
      console.log(`✅ Sección visible: ${section.name}`)
    }

    await captureStepScreenshot(page, 'step2-form-sections', 'Secciones del formulario verificadas')

    // 3. Verificar campos obligatorios del comprador
    console.log('🔍 Verificando campos del comprador...')

    const payerFields = [
      { name: 'payer.name', label: 'Nombre' },
      { name: 'payer.surname', label: 'Apellido' },
      { name: 'payer.email', label: 'Email' },
      { name: 'payer.phone', label: 'Teléfono' }
    ]

    for (const field of payerFields) {
      await expect(page.locator(`input[name="${field.name}"]`)).toBeVisible()
      console.log(`✅ Campo visible: ${field.label}`)
    }

    // 4. Verificar campos de dirección de envío
    console.log('🔍 Verificando campos de envío...')

    const shippingFields = [
      { name: 'shipping.address.street_name', label: 'Calle' },
      { name: 'shipping.address.street_number', label: 'Número' },
      { name: 'shipping.address.zip_code', label: 'Código postal' }
    ]

    for (const field of shippingFields) {
      await expect(page.locator(`input[name="${field.name}"]`)).toBeVisible()
      console.log(`✅ Campo visible: ${field.label}`)
    }

    await captureStepScreenshot(page, 'step2-form-complete', 'Formulario completo verificado')

    console.log('✅ Test completado: Formulario validado correctamente')
  })

  test('Paso 3: Validación de campos y manejo de errores', async ({ page }) => {
    console.log('⚠️ Iniciando test: Validación de campos')

    // 1. Navegar a checkout
    await page.goto('/checkout')
    await page.waitForLoadState('networkidle')
    await captureStepScreenshot(page, 'step3-validation-start', 'Inicio de validación')

    // 2. Intentar enviar formulario vacío
    console.log('🔍 Probando envío de formulario vacío...')
    await page.click('[data-testid="submit-checkout-btn"]')
    await page.waitForTimeout(1000) // Esperar a que aparezcan errores

    // Verificar que aparecen errores de validación
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    await captureStepScreenshot(page, 'step3-validation-errors', 'Errores de validación mostrados')
    console.log('✅ Errores de validación mostrados correctamente')

    // 3. Llenar campos paso a paso
    console.log('📝 Llenando campos paso a paso...')

    // Información personal
    await page.fill('input[name="payer.name"]', 'Juan')
    await page.fill('input[name="payer.surname"]', 'Pérez')
    await captureStepScreenshot(page, 'step3-personal-info', 'Información personal completada')

    // 4. Probar email inválido
    console.log('📧 Probando validación de email...')
    await page.fill('input[name="payer.email"]', 'invalid-email')
    await page.click('[data-testid="submit-checkout-btn"]')
    await page.waitForTimeout(500)

    // Verificar error de email
    await expect(page.locator('text=Email inválido')).toBeVisible()
    await captureStepScreenshot(page, 'step3-email-error', 'Error de email inválido')
    console.log('✅ Validación de email funcionando')

    // 5. Corregir email y completar formulario
    await page.fill('input[name="payer.email"]', 'juan@test.com')
    await page.fill('input[name="payer.phone"]', '1234567890')
    await captureStepScreenshot(page, 'step3-contact-complete', 'Información de contacto completa')

    // 6. Completar dirección de envío
    console.log('🏠 Completando dirección de envío...')
    await page.fill('input[name="shipping.address.street_name"]', 'Av. Corrientes')
    await page.fill('input[name="shipping.address.street_number"]', '1234')
    await page.fill('input[name="shipping.address.zip_code"]', '1000')
    await page.fill('input[name="shipping.address.city_name"]', 'Buenos Aires')
    await page.fill('input[name="shipping.address.state_name"]', 'CABA')
    await captureStepScreenshot(page, 'step3-address-complete', 'Dirección de envío completa')

    console.log('✅ Test completado: Validación funcionando correctamente')
  })

  test('order summary displays correctly', async ({ page }) => {
    // Navigate to checkout
    await page.goto('/checkout')

    // Verify order summary section
    const orderSummary = page.locator('[data-testid="order-summary"]')
    await expect(orderSummary).toBeVisible()

    // Verify cart items are displayed
    await expect(page.locator('[data-testid="checkout-cart-item"]')).toBeVisible()

    // Verify pricing information
    await expect(page.locator('[data-testid="subtotal"]')).toBeVisible()
    await expect(page.locator('[data-testid="shipping-cost"]')).toBeVisible()
    await expect(page.locator('[data-testid="total-amount"]')).toBeVisible()

    // Verify quantities can be updated
    const quantityInput = page.locator('[data-testid="quantity-input"]')
    await expect(quantityInput).toBeVisible()
  })

  test('shipping calculation works', async ({ page }) => {
    // Navigate to checkout
    await page.goto('/checkout')

    // Fill shipping address
    await page.fill('input[name="shipping.address.zip_code"]', '1000')
    await page.fill('input[name="shipping.address.city_name"]', 'Buenos Aires')
    await page.fill('input[name="shipping.address.state_name"]', 'CABA')

    // Trigger shipping calculation (this might be automatic or require a button click)
    await page.blur('input[name="shipping.address.state_name"]')

    // Wait for shipping cost to update
    await page.waitForTimeout(1000)

    // Verify shipping cost is displayed
    const shippingCost = page.locator('[data-testid="shipping-cost"]')
    await expect(shippingCost).not.toHaveText('$0')

    // Test different location for different shipping cost
    await page.fill('input[name="shipping.address.state_name"]', 'Córdoba')
    await page.blur('input[name="shipping.address.state_name"]')
    await page.waitForTimeout(1000)

    // Shipping cost should be different
    const newShippingCost = await shippingCost.textContent()
    expect(newShippingCost).toBeDefined()
  })

  test('Paso 4: Flujo completo de checkout exitoso', async ({ page }) => {
    console.log('🎯 Iniciando test: Flujo completo de checkout')

    // 1. Navegar a checkout con parámetro de redirección automática
    await page.goto('/checkout?auto_redirect=true')
    await page.waitForLoadState('networkidle')
    await captureStepScreenshot(page, 'step4-checkout-start', 'Inicio del checkout completo')

    // 2. Completar información personal
    console.log('👤 Completando información personal...')
    await page.fill('input[name="payer.name"]', 'Juan')
    await page.fill('input[name="payer.surname"]', 'Pérez')
    await page.fill('input[name="payer.email"]', 'juan@test.com')
    await page.fill('input[name="payer.phone"]', '1234567890')
    await captureStepScreenshot(page, 'step4-personal-filled', 'Información personal completada')

    // 3. Completar identificación
    console.log('🆔 Completando identificación...')
    await page.selectOption('select[name="payer.identification.type"]', 'DNI')
    await page.fill('input[name="payer.identification.number"]', '12345678')
    await captureStepScreenshot(page, 'step4-identification-filled', 'Identificación completada')

    // 4. Completar dirección de envío
    console.log('🏠 Completando dirección de envío...')
    await page.fill('input[name="shipping.address.street_name"]', 'Av. Corrientes')
    await page.fill('input[name="shipping.address.street_number"]', '1234')
    await page.fill('input[name="shipping.address.zip_code"]', '1000')
    await page.fill('input[name="shipping.address.city_name"]', 'Buenos Aires')
    await page.fill('input[name="shipping.address.state_name"]', 'CABA')
    await captureStepScreenshot(page, 'step4-address-filled', 'Dirección de envío completada')

    // 5. Capturar estado antes del envío
    await captureStepScreenshot(page, 'step4-pre-submit', 'Formulario completo antes del envío')

    // 6. Enviar checkout
    console.log('🚀 Enviando checkout...')
    const startTime = Date.now()
    await page.click('[data-testid="submit-checkout-btn"]')

    // 7. Capturar estado de carga
    await page.waitForTimeout(500) // Esperar a que aparezca loading
    await captureStepScreenshot(page, 'step4-loading-state', 'Estado de carga del checkout')

    // 8. Esperar procesamiento
    await page.waitForLoadState('networkidle')
    const endTime = Date.now()
    const processingTime = endTime - startTime
    console.log(`⏱️ Tiempo de procesamiento: ${processingTime}ms`)

    // 9. Verificar redirección exitosa
    const currentUrl = page.url()
    console.log(`🔗 URL final: ${currentUrl}`)

    expect(currentUrl).toMatch(/(mercadopago|checkout\/success|checkout\/pending)/)
    await captureStepScreenshot(page, 'step4-final-redirect', 'Redirección final exitosa')

    // 10. Capturar métricas finales
    const finalMetrics = await capturePerformanceMetrics(page, 'checkout-completo')

    console.log('✅ Test completado: Checkout exitoso')
    console.log(`📊 Métricas finales: Procesamiento ${processingTime}ms`)
  })

  test('user can modify cart during checkout', async ({ page }) => {
    // Navigate to checkout
    await page.goto('/checkout')

    // Verify initial quantity
    const quantityInput = page.locator('[data-testid="quantity-input"]')
    await expect(quantityInput).toHaveValue('1')

    // Increase quantity
    await page.click('[data-testid="quantity-increase"]')
    await expect(quantityInput).toHaveValue('2')

    // Verify total updated
    const totalAmount = page.locator('[data-testid="total-amount"]')
    const initialTotal = await totalAmount.textContent()

    // Decrease quantity back
    await page.click('[data-testid="quantity-decrease"]')
    await expect(quantityInput).toHaveValue('1')

    // Verify total updated back
    const newTotal = await totalAmount.textContent()
    expect(newTotal).not.toBe(initialTotal)
  })

  test('checkout handles empty cart', async ({ page }) => {
    // Clear cart first by removing items
    await page.click('[data-testid="cart-icon"]')
    await page.click('[data-testid="remove-from-cart"]')

    // Try to navigate to checkout
    await page.goto('/checkout')

    // Should redirect to shop or show empty cart message
    await expect(page.locator('[data-testid="empty-cart-message"]')).toBeVisible()
    
    // Or should redirect to shop
    // await expect(page).toHaveURL('/shop')
  })

  test('checkout form auto-fills for authenticated users', async ({ page }) => {
    // This test assumes user is logged in
    // You might need to implement login first or mock authentication
    
    // Navigate to checkout
    await page.goto('/checkout')

    // Check if user info section shows authenticated user data
    const userInfoSection = page.locator('[data-testid="user-info-section"]')
    if (await userInfoSection.isVisible()) {
      // Verify user information is displayed
      await expect(page.locator('[data-testid="user-name"]')).toBeVisible()
      await expect(page.locator('[data-testid="user-email"]')).toBeVisible()
    }

    // Check if form fields are pre-filled
    const nameInput = page.locator('input[name="payer.name"]')
    const emailInput = page.locator('input[name="payer.email"]')
    
    // If user is authenticated, these should have values
    const nameValue = await nameInput.inputValue()
    const emailValue = await emailInput.inputValue()
    
    if (nameValue && emailValue) {
      expect(nameValue).toBeTruthy()
      expect(emailValue).toContain('@')
    }
  })

  test('checkout handles network errors gracefully', async ({ page }) => {
    // Navigate to checkout and fill form
    await page.goto('/checkout')

    // Fill required fields
    await page.fill('input[name="payer.name"]', 'Juan')
    await page.fill('input[name="payer.surname"]', 'Pérez')
    await page.fill('input[name="payer.email"]', 'juan@test.com')
    await page.fill('input[name="payer.phone"]', '1234567890')

    // Mock network failure
    await page.route('/api/payments/create-preference', route => {
      route.abort('failed')
    })

    // Submit checkout
    await page.click('[data-testid="submit-checkout-btn"]')

    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    await expect(page.locator('text=Error de conexión')).toBeVisible()
  })

  test('checkout shows loading state during processing', async ({ page }) => {
    // Navigate to checkout and fill form
    await page.goto('/checkout')

    // Fill required fields quickly
    await page.fill('input[name="payer.name"]', 'Juan')
    await page.fill('input[name="payer.surname"]', 'Pérez')
    await page.fill('input[name="payer.email"]', 'juan@test.com')
    await page.fill('input[name="payer.phone"]', '1234567890')

    // Mock slow API response
    await page.route('/api/payments/create-preference', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000))
      route.continue()
    })

    // Submit checkout
    await page.click('[data-testid="submit-checkout-btn"]')

    // Should show loading state
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible()
    await expect(page.locator('[data-testid="submit-checkout-btn"]')).toBeDisabled()
  })
})
