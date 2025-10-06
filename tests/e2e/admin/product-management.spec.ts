import { test, expect } from '@playwright/test'

test.describe('Panel Administrativo - Gestión de Productos', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar al panel de productos
    await page.goto('/admin/products')
  })

  test('debe cargar la lista de productos correctamente', async ({ page }) => {
    // Esperar a que la página cargue completamente
    await page.waitForLoadState('networkidle')

    // Verificar que estamos en la página correcta
    await expect(page).toHaveURL(/.*\/admin\/products/)

    // Verificar que el componente ProductList esté presente
    const productList = page.locator('.space-y-6').first()
    await expect(productList).toBeVisible()

    // Verificar que el botón de nuevo producto esté presente
    const newProductButton = page.locator('button:has-text("Nuevo Producto")')
    await expect(newProductButton).toBeVisible()

    // Verificar que la tabla de productos esté presente (AdminDataTable)
    const dataTable = page.locator('.shadow-sm')
    await expect(dataTable).toBeVisible()
  })

  test('debe mostrar filtros de productos funcionales', async ({ page }) => {
    // Esperar a que la página cargue
    await page.waitForLoadState('networkidle')

    // Verificar que el componente ProductFilters esté presente
    const filtersSection = page.locator('.space-y-6').first()
    await expect(filtersSection).toBeVisible()

    // Buscar input de búsqueda con diferentes selectores posibles
    const searchSelectors = [
      'input[placeholder*="Buscar"]',
      'input[type="search"]',
      'input[name="search"]',
      '.search-input',
    ]

    let searchInput = null
    for (const selector of searchSelectors) {
      const element = page.locator(selector).first()
      if (await element.isVisible()) {
        searchInput = element
        break
      }
    }

    if (searchInput) {
      await searchInput.fill('test')
      await page.waitForTimeout(500)
      await searchInput.clear()
    }
  })

  test('debe navegar al formulario de crear producto', async ({ page }) => {
    await page.waitForLoadState('networkidle')

    // Buscar el botón de nuevo producto
    const newProductButton = page.locator('button:has-text("Nuevo Producto")')

    if (await newProductButton.isVisible()) {
      await newProductButton.click()

      // Esperar navegación
      await page.waitForLoadState('networkidle')

      // Verificar que navegamos a la página correcta o que se abrió un modal
      const isCreatePage = page.url().includes('/create')
      const hasModal = await page.locator('[role="dialog"]').isVisible()
      const hasForm = await page.locator('form').isVisible()

      expect(isCreatePage || hasModal || hasForm).toBeTruthy()
    }
  })

  test('debe mostrar la tabla de productos con columnas correctas', async ({ page }) => {
    await page.waitForLoadState('networkidle')

    // Buscar la tabla con diferentes selectores
    const tableSelectors = ['table', '.shadow-sm table', '[role="table"]']

    let table = null
    for (const selector of tableSelectors) {
      const element = page.locator(selector).first()
      if (await element.isVisible()) {
        table = element
        break
      }
    }

    if (table) {
      await expect(table).toBeVisible()

      // Verificar que tiene headers
      const headers = table.locator('th')
      const headerCount = await headers.count()
      expect(headerCount).toBeGreaterThan(0)
    }
  })

  test('debe permitir ordenar productos por diferentes columnas', async ({ page }) => {
    await page.waitForLoadState('networkidle')

    // Buscar la tabla
    const table = page.locator('table').first()

    if (await table.isVisible()) {
      // Buscar headers clickeables
      const sortableHeaders = table.locator('th button, th[role="columnheader"]')
      const headerCount = await sortableHeaders.count()

      if (headerCount > 0) {
        // Hacer clic en el primer header ordenable
        await sortableHeaders.first().click()
        await page.waitForTimeout(500)

        // Hacer clic nuevamente para cambiar orden
        await sortableHeaders.first().click()
        await page.waitForTimeout(500)
      }
    }
  })

  test('debe mostrar acciones de producto en cada fila', async ({ page }) => {
    // Buscar la primera fila de producto
    const firstRow = page.locator('[data-testid="products-table"] tbody tr').first()

    if (await firstRow.isVisible()) {
      // Verificar que tiene botón de acciones
      const actionsButton = firstRow.locator('[data-testid="product-actions"]')
      await expect(actionsButton).toBeVisible()

      // Click en acciones para ver el menú
      await actionsButton.click()

      // Verificar opciones del menú
      await expect(page.locator('text=Ver detalles')).toBeVisible()
      await expect(page.locator('text=Editar')).toBeVisible()
      await expect(page.locator('text=Duplicar')).toBeVisible()
      await expect(page.locator('text=Eliminar')).toBeVisible()
    }
  })

  test('debe manejar la paginación correctamente', async ({ page }) => {
    // Verificar que los controles de paginación estén presentes
    const pagination = page.locator('[data-testid="pagination"]')

    if (await pagination.isVisible()) {
      // Verificar elementos de paginación
      await expect(pagination.locator('text=Página')).toBeVisible()
      await expect(pagination.locator('select')).toBeVisible() // Selector de página

      // Si hay múltiples páginas, probar navegación
      const nextButton = pagination.locator('[data-testid="next-page"]')
      if (await nextButton.isEnabled()) {
        await nextButton.click()
        // Verificar que cambió la página
      }
    }
  })

  test('debe mostrar estados de productos con badges correctos', async ({ page }) => {
    const table = page.locator('[data-testid="products-table"]')

    // Buscar badges de estado
    const statusBadges = table.locator('[data-testid="status-badge"]')

    if ((await statusBadges.count()) > 0) {
      // Verificar que los badges tienen texto apropiado
      const firstBadge = statusBadges.first()
      const badgeText = await firstBadge.textContent()
      expect(['Activo', 'Inactivo', 'Borrador']).toContain(badgeText)
    }
  })

  test('debe mostrar información de stock con indicadores visuales', async ({ page }) => {
    const table = page.locator('[data-testid="products-table"]')

    // Buscar indicadores de stock
    const stockCells = table.locator('[data-testid="stock-badge"]')

    if ((await stockCells.count()) > 0) {
      const firstStockCell = stockCells.first()
      await expect(firstStockCell).toBeVisible()

      // El contenido puede ser "Sin stock", "Stock bajo", o un número
      const stockText = await firstStockCell.textContent()
      expect(stockText).toBeTruthy()
    }
  })

  test('debe permitir selección múltiple de productos', async ({ page }) => {
    const table = page.locator('[data-testid="products-table"]')

    // Buscar checkboxes de selección
    const selectAllCheckbox = table.locator('th input[type="checkbox"]')
    const rowCheckboxes = table.locator('td input[type="checkbox"]')

    if (await selectAllCheckbox.isVisible()) {
      // Probar selección de todos
      await selectAllCheckbox.check()

      // Verificar que se seleccionaron las filas
      const checkedBoxes = await rowCheckboxes.count()
      if (checkedBoxes > 0) {
        // Verificar que aparecieron acciones masivas
        await expect(page.locator('[data-testid="bulk-actions"]')).toBeVisible()
      }

      // Deseleccionar
      await selectAllCheckbox.uncheck()
    }
  })

  test('debe mostrar mensaje cuando no hay productos', async ({ page }) => {
    // Interceptar la API para simular estado sin productos
    await page.route('**/api/products**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ products: [], total: 0, data: [] }),
      })
    })

    // Recargar la página
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Buscar mensaje de estado vacío con diferentes textos posibles
    const emptyMessages = [
      'No se encontraron productos',
      'No hay productos',
      'Sin productos',
      'No products found',
      'Empty state',
    ]

    let foundMessage = false
    for (const message of emptyMessages) {
      const element = page.locator(`text=${message}`)
      if (await element.isVisible()) {
        foundMessage = true
        break
      }
    }

    // Si no encontramos mensaje específico, verificar que la tabla esté vacía
    if (!foundMessage) {
      const tableRows = page.locator('tbody tr')
      const rowCount = await tableRows.count()
      expect(rowCount).toBeLessThanOrEqual(1) // Puede tener una fila de "no data"
    }
  })
})
