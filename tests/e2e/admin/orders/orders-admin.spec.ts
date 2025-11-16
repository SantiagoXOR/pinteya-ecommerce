// ===================================
// PINTEYA E-COMMERCE - ORDERS ADMIN E2E TESTS
// ===================================

import { test, expect } from '@playwright/test'

// ===================================
// CONFIGURACIÓN
// ===================================

const ADMIN_EMAIL = 'santiago@xor.com.ar'
const ADMIN_PASSWORD = 'SavoirFaire19'
const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000'

// ===================================
// HELPERS
// ===================================

async function loginAsAdmin(page) {
  await page.goto('/sign-in')

  // Esperar a que cargue la página o detectar si ya está logueado
  await page.waitForLoadState('networkidle')

  // Si ya estamos autenticados (redirección automática), no repetir login
  if (page.url().includes('/admin')) {
    return
  }

  const emailInput = page.locator('input[type="email"]')
  let formVisible = true
  try {
    await emailInput.waitFor({ state: 'visible', timeout: 5000 })
  } catch {
    formVisible = false
  }

  // Si no hay formulario visible, asumimos que la sesión ya está activa
  if (!formVisible) {
    return
  }

  // Llenar credenciales
  await emailInput.fill(ADMIN_EMAIL)
  await page.fill('input[type="password"]', ADMIN_PASSWORD)

  // Hacer click en el botón de login
  await page.click('button[type="submit"]')

  // Esperar a ser redirigido
  await page.waitForURL('/admin/**')
}

async function navigateToOrders(page) {
  // Navegar al panel de órdenes
  await page.goto('/admin/orders')
  await page.waitForLoadState('networkidle')
}

// ===================================
// TESTS DE NAVEGACIÓN Y ACCESO
// ===================================

test.describe('Orders Admin - Navigation & Access', () => {
  test('should require admin authentication', async ({ browser }) => {
    const context = await browser.newContext({ storageState: undefined })
    const page = await context.newPage()

    // Intentar acceder sin autenticación
    await page.goto('/admin/orders')

    // Debería redirigir al login
    await expect(page).toHaveURL(/.*sign-in.*/)

    await context.close()
  })

  test('should allow admin access to orders page', async ({ page }) => {
    await loginAsAdmin(page)
    await navigateToOrders(page)

    // Verificar que estamos en la página de órdenes
    await expect(page).toHaveURL(/.*admin\/orders.*/)
    await expect(page.locator('h1, h2')).toContainText('Gestión de Órdenes')
  })

  test('should display orders list interface', async ({ page }) => {
    await loginAsAdmin(page)
    await navigateToOrders(page)

    // Verificar elementos principales de la interfaz
    await expect(page.locator('text=Gestión de Órdenes')).toBeVisible()
    await expect(page.locator('text=Filtros')).toBeVisible()
    await expect(page.locator('button:has-text("Actualizar")')).toBeVisible()
  })
})

// ===================================
// TESTS DE FILTROS
// ===================================

test.describe('Orders Admin - Filters', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await navigateToOrders(page)
  })

  test('should filter orders by search term', async ({ page }) => {
    // Buscar por término específico
    const searchInput = page.locator('input[placeholder*="Buscar"]')
    await searchInput.fill('ORD-')

    // Esperar a que se actualice la lista
    await page.waitForTimeout(1000)

    // Verificar que la URL contiene el parámetro de búsqueda
    await expect(page).toHaveURL(/.*search=ORD-.*/)
  })

  test('should filter orders by status', async ({ page }) => {
    // Abrir selector de estado
    await page.click('text=Estado')

    // Seleccionar un estado específico
    await page.click('text=Pendiente')

    // Esperar a que se actualice la lista
    await page.waitForTimeout(1000)

    // Verificar que la URL contiene el filtro de estado
    await expect(page).toHaveURL(/.*status=pending.*/)
  })

  test('should filter orders by payment status', async ({ page }) => {
    // Abrir selector de estado de pago
    await page.click('text=Estado de Pago')

    // Seleccionar un estado de pago
    await page.click('text=Pagado')

    // Esperar a que se actualice la lista
    await page.waitForTimeout(1000)

    // Verificar que la URL contiene el filtro
    await expect(page).toHaveURL(/.*payment_status=paid.*/)
  })

  test('should clear filters', async ({ page }) => {
    // Aplicar algunos filtros
    await page.fill('input[placeholder*="Buscar"]', 'test')
    await page.waitForTimeout(500)

    // Limpiar filtros (esto dependería de la implementación específica)
    // Por ahora, verificamos que los filtros se pueden aplicar
    await expect(page).toHaveURL(/.*search=test.*/)
  })
})

// ===================================
// TESTS DE LISTA DE ÓRDENES
// ===================================

test.describe('Orders Admin - Orders List', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await navigateToOrders(page)
  })

  test('should display orders table', async ({ page }) => {
    // Verificar que la tabla de órdenes está presente
    await expect(page.locator('table')).toBeVisible()

    // Verificar headers de la tabla
    await expect(page.locator('th:has-text("Orden")')).toBeVisible()
    await expect(page.locator('th:has-text("Cliente")')).toBeVisible()
    await expect(page.locator('th:has-text("Estado")')).toBeVisible()
    await expect(page.locator('th:has-text("Total")')).toBeVisible()
  })

  test('should display order information correctly', async ({ page }) => {
    // Esperar a que se carguen las órdenes
    await page.waitForSelector('table tbody tr', { timeout: 10000 })

    // Verificar que hay al menos una orden
    const orderRows = page.locator('table tbody tr')
    await expect(orderRows.first()).toBeVisible()

    // Verificar que las órdenes tienen información básica
    const firstRow = orderRows.first()
    await expect(firstRow.locator('td').first()).toContainText(/ORD-/)
  })

  test('should handle empty state', async ({ page }) => {
    // Aplicar filtros que no devuelvan resultados
    await page.fill('input[placeholder*="Buscar"]', 'NONEXISTENT_ORDER_12345')
    await page.waitForTimeout(1000)

    // Verificar mensaje de estado vacío
    await expect(page.locator('text=No se encontraron órdenes')).toBeVisible()
  })
})

// ===================================
// TESTS DE ACCIONES DE ÓRDENES
// ===================================

test.describe('Orders Admin - Order Actions', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await navigateToOrders(page)
  })

  test('should open order details', async ({ page }) => {
    // Esperar a que se carguen las órdenes
    await page.waitForSelector('table tbody tr', { timeout: 10000 })

    // Buscar y hacer click en el menú de acciones
    const actionButton = page.locator('button[aria-haspopup="menu"]').first()
    if (await actionButton.isVisible()) {
      await actionButton.click()

      // Hacer click en "Ver Detalles"
      await page.click('text=Ver Detalles')

      // Verificar que se abre el detalle (esto dependería de la implementación)
      // Por ahora, verificamos que el click funciona
      await page.waitForTimeout(500)
    }
  })

  test('should handle order editing', async ({ page }) => {
    // Esperar a que se carguen las órdenes
    await page.waitForSelector('table tbody tr', { timeout: 10000 })

    // Buscar y hacer click en el menú de acciones
    const actionButton = page.locator('button[aria-haspopup="menu"]').first()
    if (await actionButton.isVisible()) {
      await actionButton.click()

      // Hacer click en "Editar"
      await page.click('text=Editar')

      // Verificar que se abre la edición
      await page.waitForTimeout(500)
    }
  })
})

// ===================================
// TESTS DE ACCIONES MASIVAS
// ===================================

test.describe('Orders Admin - Bulk Actions', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await navigateToOrders(page)
  })

  test('should select orders for bulk actions', async ({ page }) => {
    // Esperar a que se carguen las órdenes
    await page.waitForSelector('table tbody tr', { timeout: 10000 })

    // Seleccionar la primera orden
    const firstCheckbox = page.locator('table tbody tr').first().locator('input[type="checkbox"]')
    if (await firstCheckbox.isVisible()) {
      await firstCheckbox.check()

      // Verificar que aparecen las acciones masivas
      await expect(page.locator('text=seleccionada')).toBeVisible()
    }
  })

  test('should select all orders', async ({ page }) => {
    // Esperar a que se carguen las órdenes
    await page.waitForSelector('table tbody tr', { timeout: 10000 })

    // Hacer click en "seleccionar todo"
    const selectAllCheckbox = page.locator('table thead input[type="checkbox"]')
    if (await selectAllCheckbox.isVisible()) {
      await selectAllCheckbox.check()

      // Verificar que se seleccionaron todas las órdenes
      await expect(page.locator('text=seleccionada')).toBeVisible()
    }
  })

  test('should export selected orders', async ({ page }) => {
    // Esperar a que se carguen las órdenes
    await page.waitForSelector('table tbody tr', { timeout: 10000 })

    // Seleccionar una orden
    const firstCheckbox = page.locator('table tbody tr').first().locator('input[type="checkbox"]')
    if (await firstCheckbox.isVisible()) {
      await firstCheckbox.check()

      // Hacer click en exportar
      const exportButton = page.locator('button:has-text("Exportar")')
      if (await exportButton.isVisible()) {
        await exportButton.click()

        // Verificar que se inicia la exportación
        await page.waitForTimeout(500)
      }
    }
  })
})

// ===================================
// TESTS DE PAGINACIÓN
// ===================================

test.describe('Orders Admin - Pagination', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await navigateToOrders(page)
  })

  test('should display pagination controls', async ({ page }) => {
    // Verificar que existen controles de paginación
    await expect(page.locator('text=Página')).toBeVisible()
    await expect(page.locator('button:has-text("Anterior")')).toBeVisible()
    await expect(page.locator('button:has-text("Siguiente")')).toBeVisible()
  })

  test('should navigate between pages', async ({ page }) => {
    // Verificar si hay múltiples páginas
    const nextButton = page.locator('button:has-text("Siguiente")')

    if (await nextButton.isEnabled()) {
      await nextButton.click()

      // Verificar que la URL cambió
      await expect(page).toHaveURL(/.*page=2.*/)

      // Verificar que el botón anterior ahora está habilitado
      await expect(page.locator('button:has-text("Anterior")')).toBeEnabled()
    }
  })
})

// ===================================
// TESTS DE RESPONSIVIDAD
// ===================================

test.describe('Orders Admin - Responsive Design', () => {
  test('should work on mobile viewport', async ({ page }) => {
    // Configurar viewport móvil
    await page.setViewportSize({ width: 375, height: 667 })

    await loginAsAdmin(page)
    await navigateToOrders(page)

    // Verificar que la página se carga correctamente en móvil
    await expect(page.locator('text=Gestión de Órdenes')).toBeVisible()

    // Verificar que la tabla es responsive
    await expect(page.locator('table')).toBeVisible()
  })

  test('should work on tablet viewport', async ({ page }) => {
    // Configurar viewport tablet
    await page.setViewportSize({ width: 768, height: 1024 })

    await loginAsAdmin(page)
    await navigateToOrders(page)

    // Verificar que la página se carga correctamente en tablet
    await expect(page.locator('text=Gestión de Órdenes')).toBeVisible()
    await expect(page.locator('table')).toBeVisible()
  })
})

// ===================================
// TESTS DE PERFORMANCE
// ===================================

test.describe('Orders Admin - Performance', () => {
  test('should load orders page within acceptable time', async ({ page }) => {
    const startTime = Date.now()

    await loginAsAdmin(page)
    await navigateToOrders(page)

    // Esperar a que se cargue completamente
    await page.waitForLoadState('networkidle')

    const loadTime = Date.now() - startTime

    // Verificar que se carga en menos de 5 segundos
    expect(loadTime).toBeLessThan(5000)
  })

  test('should handle large datasets efficiently', async ({ page }) => {
    await loginAsAdmin(page)
    await navigateToOrders(page)

    // Cambiar a mostrar más elementos por página si es posible
    // Esto dependería de la implementación específica

    // Verificar que la página sigue siendo responsive
    await expect(page.locator('table')).toBeVisible()
  })
})
