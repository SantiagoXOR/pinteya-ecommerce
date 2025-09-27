import { test, expect, Page } from '@playwright/test'
import { AdvancedTestFlowManager } from '../../lib/test-flow-manager'
import { ScreenshotManager } from '../../lib/screenshot-manager'

/**
 * Test de Flujo Completo - Integración de todos los componentes
 *
 * Este test demuestra la integración completa de:
 * 1. Ejecución automatizada de flujos de test
 * 2. Captura automática de screenshots
 * 3. Almacenamiento y gestión de resultados
 * 4. Visualización en el dashboard de reportes
 */

test.describe('Complete Flow Integration Test', () => {
  let testFlowManager: AdvancedTestFlowManager
  let screenshotManager: ScreenshotManager
  let page: Page

  test.beforeAll(async ({ browser }) => {
    // Inicializar managers
    testFlowManager = new AdvancedTestFlowManager()
    screenshotManager = new ScreenshotManager()

    // Crear nueva página
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
    })
    page = await context.newPage()
  })

  test('Complete E-Commerce Flow with Screenshots', async () => {
    // Iniciar flujo de test completo
    const flowId = await testFlowManager.startFlow({
      name: 'Complete E-Commerce User Journey',
      description: 'Test completo del flujo de usuario desde navegación hasta compra',
      screenshotOptions: {
        enabled: true,
        captureOnFailure: true,
        captureSteps: true,
        quality: 85,
      },
    })

    console.log(`Iniciado flujo de test: ${flowId}`)

    try {
      // Paso 1: Navegación inicial
      await testFlowManager.executeStep(flowId, {
        name: 'Navigate to Homepage',
        action: async () => {
          await page.goto('http://localhost:3000')
          await page.waitForLoadState('networkidle')

          // Capturar screenshot del paso
          const screenshotId = await screenshotManager.captureStep(flowId, 'homepage-load', page, {
            stepName: 'Homepage Loaded',
            status: 'success',
          })

          console.log(`Screenshot capturado: ${screenshotId}`)

          // Verificar elementos principales
          await expect(page.locator('header')).toBeVisible()
          await expect(page.locator('nav')).toBeVisible()
          await expect(page.locator('main')).toBeVisible()
        },
      })

      // Paso 2: Navegación a productos
      await testFlowManager.executeStep(flowId, {
        name: 'Browse Products',
        action: async () => {
          await page.click('a[href*="products"]')
          await page.waitForLoadState('networkidle')

          const screenshotId = await screenshotManager.captureStep(flowId, 'products-page', page, {
            stepName: 'Products Page',
            status: 'success',
          })

          console.log(`Screenshot productos: ${screenshotId}`)

          // Verificar carga de productos
          await expect(page.locator('[data-testid="product-card"]').first()).toBeVisible()
          const productCount = await page.locator('[data-testid="product-card"]').count()
          expect(productCount).toBeGreaterThan(0)
        },
      })

      // Paso 3: Selección de producto
      await testFlowManager.executeStep(flowId, {
        name: 'Select Product',
        action: async () => {
          await page.click('[data-testid="product-card"]:first-child')
          await page.waitForLoadState('networkidle')

          const screenshotId = await screenshotManager.captureStep(flowId, 'product-detail', page, {
            stepName: 'Product Detail View',
            status: 'success',
          })

          console.log(`Screenshot detalle producto: ${screenshotId}`)

          // Verificar página de detalle
          await expect(page.locator('[data-testid="product-title"]')).toBeVisible()
          await expect(page.locator('[data-testid="product-price"]')).toBeVisible()
          await expect(page.locator('[data-testid="add-to-cart"]')).toBeVisible()
        },
      })

      // Paso 4: Agregar al carrito
      await testFlowManager.executeStep(flowId, {
        name: 'Add to Cart',
        action: async () => {
          await page.click('[data-testid="add-to-cart"]')
          await page.waitForTimeout(1000) // Esperar animación

          const screenshotId = await screenshotManager.captureStep(flowId, 'add-to-cart', page, {
            stepName: 'Product Added to Cart',
            status: 'success',
          })

          console.log(`Screenshot agregar carrito: ${screenshotId}`)

          // Verificar notificación o actualización del carrito
          await expect(page.locator('[data-testid="cart-count"]')).toContainText('1')
        },
      })

      // Paso 5: Ver carrito
      await testFlowManager.executeStep(flowId, {
        name: 'View Cart',
        action: async () => {
          await page.click('[data-testid="cart-button"]')
          await page.waitForLoadState('networkidle')

          const screenshotId = await screenshotManager.captureStep(flowId, 'cart-view', page, {
            stepName: 'Shopping Cart View',
            status: 'success',
          })

          console.log(`Screenshot carrito: ${screenshotId}`)

          // Verificar contenido del carrito
          await expect(page.locator('[data-testid="cart-item"]')).toBeVisible()
          await expect(page.locator('[data-testid="cart-total"]')).toBeVisible()
          await expect(page.locator('[data-testid="checkout-button"]')).toBeVisible()
        },
      })

      // Paso 6: Proceso de checkout (simulado)
      await testFlowManager.executeStep(flowId, {
        name: 'Checkout Process',
        action: async () => {
          await page.click('[data-testid="checkout-button"]')
          await page.waitForLoadState('networkidle')

          const screenshotId = await screenshotManager.captureStep(flowId, 'checkout-form', page, {
            stepName: 'Checkout Form',
            status: 'success',
          })

          console.log(`Screenshot checkout: ${screenshotId}`)

          // Verificar formulario de checkout
          await expect(page.locator('[data-testid="checkout-form"]')).toBeVisible()
        },
      })

      // Completar flujo exitosamente
      await testFlowManager.completeFlow(flowId, {
        status: 'success',
        summary: 'Flujo completo de e-commerce ejecutado exitosamente con 6 screenshots capturados',
      })

      console.log(`Flujo completado exitosamente: ${flowId}`)
    } catch (error) {
      // Capturar screenshot del error
      const errorScreenshotId = await screenshotManager.captureStep(flowId, 'error-state', page, {
        stepName: 'Test Failure',
        status: 'failure',
      })

      console.log(`Screenshot de error: ${errorScreenshotId}`)

      // Marcar flujo como fallido
      await testFlowManager.completeFlow(flowId, {
        status: 'failed',
        summary: `Flujo falló en: ${error.message}`,
        error: error.message,
      })

      throw error
    }
  })

  test('Verify Test Results in Dashboard', async () => {
    // Navegar al dashboard de admin
    await page.goto('http://localhost:3000/admin/test-reports')
    await page.waitForLoadState('networkidle')

    // Verificar que el dashboard carga correctamente
    await expect(page.locator('h1')).toContainText('Test Reports')

    // Verificar que hay datos de test
    await expect(page.locator('[data-testid="total-tests"]')).toBeVisible()
    await expect(page.locator('[data-testid="success-rate"]')).toBeVisible()

    // Verificar pestaña de screenshots
    await page.click('[data-testid="screenshots-tab"]')
    await page.waitForTimeout(500)

    // Verificar que se muestran screenshots
    const screenshotElements = page.locator('[data-testid="screenshot-preview"]')
    const screenshotCount = await screenshotElements.count()

    console.log(`Screenshots encontrados en dashboard: ${screenshotCount}`)
    expect(screenshotCount).toBeGreaterThan(0)

    // Capturar screenshot del dashboard final
    await screenshotManager.captureStep('dashboard-verification', 'dashboard-final', page, {
      stepName: 'Dashboard with Test Results',
      status: 'success',
    })
  })

  test('API Integration Test', async () => {
    console.log('🔧 Probando integración de APIs de test...')

    // Probar API de ejecución de tests
    const response = await page.request.post('/api/admin/test-execution', {
      data: {
        suites: ['unit', 'components'],
        screenshotOptions: {
          enabled: true,
          onFailure: true,
          quality: 80,
        },
      },
    })

    expect(response.ok()).toBeTruthy()
    const result = await response.json()

    console.log('API Test Result:', JSON.stringify(result, null, 2))

    // Verificar que la respuesta tenga contenido
    expect(result).toBeDefined()
    expect(typeof result).toBe('object')

    // Probar API de screenshots con executionId si está disponible
    let executionId = 'test-execution-id'
    if (result.data && result.data.executionId) {
      executionId = result.data.executionId
    }

    const screenshotsResponse = await page.request.get(
      `/api/admin/test-screenshots?action=list&executionId=${executionId}`
    )

    // La API puede devolver 400 si no hay screenshots, eso está bien
    if (screenshotsResponse.ok()) {
      const screenshotsResult = await screenshotsResponse.json()
      console.log('Screenshots API Response:', JSON.stringify(screenshotsResult, null, 2))
      expect(screenshotsResult).toBeDefined()
    } else {
      console.log('Screenshots API returned non-200 status (expected for empty results)')
    }
  })

  test.afterAll(async () => {
    // Limpiar recursos
    await page.close()
    console.log('Test de flujo completo finalizado')
  })
})

/**
 * Utilidades adicionales para el test
 */
class TestFlowValidator {
  static async validateScreenshotIntegration(page: Page) {
    // Verificar que los screenshots se almacenan correctamente
    const response = await page.request.get('/api/admin/test-screenshots?action=stats')
    const stats = await response.json()

    return {
      totalScreenshots: stats.total || 0,
      successScreenshots: stats.byStatus?.success || 0,
      failureScreenshots: stats.byStatus?.failure || 0,
    }
  }

  static async validateDashboardData(page: Page) {
    // Verificar que el dashboard muestra datos actualizados
    await page.goto('/admin/test-reports')
    await page.waitForLoadState('networkidle')

    const totalTests = await page.locator('[data-testid="total-tests"]').textContent()
    const successRate = await page.locator('[data-testid="success-rate"]').textContent()

    return {
      totalTests: parseInt(totalTests || '0'),
      successRate: parseFloat(successRate || '0'),
    }
  }
}

export { TestFlowValidator }
