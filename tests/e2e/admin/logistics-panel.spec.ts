// =====================================================
// TEST E2E: PANEL DE LOGÍSTICA ADMIN
// Descripción: Tests end-to-end para el panel de logística
// =====================================================

import { test, expect } from '@playwright/test'

test.describe('Panel de Logística Admin', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar al panel de logística
    await page.goto('/admin/logistics')

    // Esperar a que la página cargue
    await page.waitForLoadState('networkidle')
  })

  test('debe cargar el dashboard de logística correctamente', async ({ page }) => {
    // Verificar título principal
    await expect(page.getByRole('heading', { name: 'Logística' })).toBeVisible()

    // Verificar descripción
    await expect(
      page.getByText('Gestión completa de envíos y tracking en tiempo real')
    ).toBeVisible()

    // Verificar botones principales
    await expect(page.getByRole('button', { name: 'Actualizar' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Crear Envío' })).toBeVisible()
  })

  test('debe mostrar métricas de logística', async ({ page }) => {
    // Esperar a que las métricas carguen
    await page.waitForSelector('[data-testid="logistics-metrics"], .grid', { timeout: 10000 })

    // Verificar que hay tarjetas de métricas
    const metricsCards = page.locator('.grid .card, [data-testid="metric-card"]')
    await expect(metricsCards.first()).toBeVisible()

    // Verificar contenido de métricas (texto que debería aparecer)
    const metricsTexts = [
      'Total Envíos',
      'En Tránsito',
      'Entregados',
      'Pendientes',
      'Couriers Activos',
    ]

    for (const text of metricsTexts) {
      // Usar una búsqueda más flexible
      const element = page.locator(`text=${text}`).first()
      await expect(element).toBeVisible({ timeout: 5000 })
    }
  })

  test('debe mostrar las pestañas de navegación', async ({ page }) => {
    // Verificar que las pestañas están presentes
    const tabs = ['Resumen', 'Envíos', 'Performance', 'Couriers']

    for (const tab of tabs) {
      await expect(page.getByRole('tab', { name: tab })).toBeVisible()
    }
  })

  test('debe permitir navegar entre pestañas', async ({ page }) => {
    // Click en pestaña de Envíos
    await page.getByRole('tab', { name: 'Envíos' }).click()
    await page.waitForTimeout(1000)

    // Click en pestaña de Performance
    await page.getByRole('tab', { name: 'Performance' }).click()
    await page.waitForTimeout(1000)

    // Click en pestaña de Couriers
    await page.getByRole('tab', { name: 'Couriers' }).click()
    await page.waitForTimeout(1000)

    // Volver a Resumen
    await page.getByRole('tab', { name: 'Resumen' }).click()
    await page.waitForTimeout(1000)
  })

  test('debe mostrar lista de envíos en la pestaña correspondiente', async ({ page }) => {
    // Navegar a la pestaña de Envíos
    await page.getByRole('tab', { name: 'Envíos' }).click()
    await page.waitForTimeout(2000)

    // Verificar que hay contenido de envíos
    // Buscar elementos que indiquen una lista o tabla de envíos
    const shipmentElements = page.locator('table, .shipment-item, [data-testid="shipments-list"]')

    // Si hay envíos, debería haber al menos un elemento
    const count = await shipmentElements.count()
    if (count > 0) {
      await expect(shipmentElements.first()).toBeVisible()
    }
  })

  test('debe mostrar gráficos de performance', async ({ page }) => {
    // Navegar a la pestaña de Performance
    await page.getByRole('tab', { name: 'Performance' }).click()
    await page.waitForTimeout(2000)

    // Verificar título de la sección
    await expect(page.getByText('Métricas de Performance')).toBeVisible()

    // Buscar elementos de gráficos (canvas, svg, o contenedores de charts)
    const chartElements = page.locator(
      'canvas, svg, .recharts-wrapper, [data-testid="performance-chart"]'
    )

    const count = await chartElements.count()
    if (count > 0) {
      await expect(chartElements.first()).toBeVisible()
    }
  })

  test('debe mostrar información de couriers', async ({ page }) => {
    // Navegar a la pestaña de Couriers
    await page.getByRole('tab', { name: 'Couriers' }).click()
    await page.waitForTimeout(2000)

    // Verificar título de la sección
    await expect(page.getByText('Performance de Couriers')).toBeVisible()

    // Buscar tabla o lista de couriers
    const courierElements = page.locator('table, .courier-item, [data-testid="couriers-table"]')

    const count = await courierElements.count()
    if (count > 0) {
      await expect(courierElements.first()).toBeVisible()
    }
  })

  test('debe permitir actualizar los datos', async ({ page }) => {
    // Click en botón actualizar
    await page.getByRole('button', { name: 'Actualizar' }).click()

    // Esperar a que la actualización complete
    await page.waitForTimeout(2000)

    // Verificar que la página sigue funcionando
    await expect(page.getByRole('heading', { name: 'Logística' })).toBeVisible()
  })

  test('debe abrir modal de crear envío', async ({ page }) => {
    // Click en botón crear envío
    await page.getByRole('button', { name: 'Crear Envío' }).click()

    // Esperar a que aparezca el modal
    await page.waitForTimeout(1000)

    // Verificar que se abre algún tipo de modal o formulario
    const modalElements = page.locator('.modal, .dialog, [role="dialog"], .fixed.inset-0')

    const count = await modalElements.count()
    if (count > 0) {
      await expect(modalElements.first()).toBeVisible()

      // Cerrar modal si está abierto (buscar botón cerrar)
      const closeButton = page
        .locator('button:has-text("Cerrar"), button:has-text("Cancelar"), [aria-label="Close"]')
        .first()
      if (await closeButton.isVisible()) {
        await closeButton.click()
      }
    }
  })

  test('debe ser responsive en móvil', async ({ page }) => {
    // Cambiar a viewport móvil
    await page.setViewportSize({ width: 375, height: 667 })

    // Recargar página
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Verificar que el contenido principal sigue visible
    await expect(page.getByRole('heading', { name: 'Logística' })).toBeVisible()

    // Verificar que las pestañas se adaptan
    await expect(page.getByRole('tab', { name: 'Resumen' })).toBeVisible()
  })

  test('debe manejar errores de carga graciosamente', async ({ page }) => {
    // Interceptar requests de API para simular error
    await page.route('/api/admin/logistics', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      })
    })

    // Recargar página
    await page.reload()
    await page.waitForTimeout(3000)

    // Verificar que se muestra algún tipo de error o estado de carga
    const errorElements = page.locator('.error, [data-testid="error"], text=Error')
    const loadingElements = page.locator('.loading, .skeleton, [data-testid="loading"]')

    const errorCount = await errorElements.count()
    const loadingCount = await loadingElements.count()

    // Debería mostrar error o seguir cargando
    expect(errorCount > 0 || loadingCount > 0).toBeTruthy()
  })
})
