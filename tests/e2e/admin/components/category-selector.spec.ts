import { test, expect } from '@playwright/test'

test.describe('Componente CategorySelector', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a una página que contenga el CategorySelector
    await page.goto('/admin/products/new')
  })

  test('debe mostrar el selector de categorías correctamente', async ({ page }) => {
    // Verificar que el selector esté presente
    const categorySelector = page.locator('[data-testid="category-selector"]')
    await expect(categorySelector).toBeVisible()

    // Verificar placeholder
    await expect(categorySelector).toContainText('Selecciona una categoría')
  })

  test('debe abrir el dropdown al hacer click', async ({ page }) => {
    const categorySelector = page.locator('[data-testid="category-selector"]')

    // Click para abrir dropdown
    await categorySelector.click()

    // Verificar que se abrió el dropdown
    await expect(page.locator('[data-testid="category-dropdown"]')).toBeVisible()

    // Verificar que tiene barra de búsqueda
    await expect(page.locator('input[placeholder*="Buscar categorías"]')).toBeVisible()
  })

  test('debe mostrar categorías en estructura de árbol', async ({ page }) => {
    const categorySelector = page.locator('[data-testid="category-selector"]')
    await categorySelector.click()

    // Verificar que las categorías se muestran
    const categoryList = page.locator('[data-testid="category-list"]')
    await expect(categoryList).toBeVisible()

    // Verificar que hay categorías disponibles
    const categoryItems = page.locator('[data-testid="category-item"]')
    await expect(categoryItems.first()).toBeVisible()
  })

  test('debe permitir búsqueda de categorías', async ({ page }) => {
    const categorySelector = page.locator('[data-testid="category-selector"]')
    await categorySelector.click()

    // Buscar una categoría específica
    const searchInput = page.locator('input[placeholder*="Buscar categorías"]')
    await searchInput.fill('Interior')

    // Verificar que se filtran los resultados
    await page.waitForTimeout(300) // Esperar debounce

    // Las categorías mostradas deberían contener "Interior"
    const visibleCategories = page.locator('[data-testid="category-item"]:visible')
    const firstCategory = visibleCategories.first()
    if (await firstCategory.isVisible()) {
      const categoryText = await firstCategory.textContent()
      expect(categoryText?.toLowerCase()).toContain('interior')
    }
  })

  test('debe seleccionar una categoría correctamente', async ({ page }) => {
    const categorySelector = page.locator('[data-testid="category-selector"]')
    await categorySelector.click()

    // Seleccionar la primera categoría disponible
    const firstCategory = page.locator('[data-testid="category-item"]').first()
    const categoryText = await firstCategory.textContent()

    await firstCategory.click()

    // Verificar que se cerró el dropdown
    await expect(page.locator('[data-testid="category-dropdown"]')).not.toBeVisible()

    // Verificar que se actualizó el selector con la categoría seleccionada
    await expect(categorySelector).toContainText(categoryText || '')
  })

  test('debe expandir/colapsar categorías padre', async ({ page }) => {
    const categorySelector = page.locator('[data-testid="category-selector"]')
    await categorySelector.click()

    // Buscar una categoría que tenga hijos
    const parentCategory = page.locator('[data-testid="category-parent"]').first()

    if (await parentCategory.isVisible()) {
      // Click en el botón de expandir
      const expandButton = parentCategory.locator('[data-testid="expand-button"]')
      await expandButton.click()

      // Verificar que se expandió (aparecieron categorías hijas)
      const childCategories = parentCategory.locator('[data-testid="category-child"]')
      await expect(childCategories.first()).toBeVisible()

      // Click nuevamente para colapsar
      await expandButton.click()

      // Verificar que se colapsó
      await expect(childCategories.first()).not.toBeVisible()
    }
  })

  test('debe cerrar el dropdown al hacer click fuera', async ({ page }) => {
    const categorySelector = page.locator('[data-testid="category-selector"]')
    await categorySelector.click()

    // Verificar que está abierto
    await expect(page.locator('[data-testid="category-dropdown"]')).toBeVisible()

    // Click fuera del dropdown
    await page.click('body')

    // Verificar que se cerró
    await expect(page.locator('[data-testid="category-dropdown"]')).not.toBeVisible()
  })

  test('debe mostrar estado de carga mientras obtiene categorías', async ({ page }) => {
    // Interceptar la request de categorías para simular carga lenta
    await page.route('/api/categories', async route => {
      await page.waitForTimeout(1000) // Simular delay
      await route.continue()
    })

    // Recargar la página para activar el interceptor
    await page.reload()

    const categorySelector = page.locator('[data-testid="category-selector"]')

    // Verificar estado de carga
    await expect(categorySelector).toContainText('Cargando...')
  })

  test('debe manejar errores de carga de categorías', async ({ page }) => {
    // Interceptar la request para simular error
    await page.route('/api/categories', async route => {
      await route.abort('failed')
    })

    // Recargar la página
    await page.reload()

    const categorySelector = page.locator('[data-testid="category-selector"]')
    await categorySelector.click()

    // Verificar mensaje de error
    await expect(page.locator('text=Error al cargar categorías')).toBeVisible()
  })

  test('debe mostrar opción para crear nueva categoría si está habilitada', async ({ page }) => {
    const categorySelector = page.locator('[data-testid="category-selector"]')
    await categorySelector.click()

    // Verificar si la opción de crear está presente
    const createButton = page.locator('button:has-text("Crear nueva categoría")')

    if (await createButton.isVisible()) {
      await createButton.click()

      // Verificar que se abre modal o formulario de creación
      // (Esto depende de tu implementación)
      await expect(page.locator('[data-testid="create-category-modal"]')).toBeVisible()
    }
  })

  test('debe ser accesible con navegación por teclado', async ({ page }) => {
    const categorySelector = page.locator('[data-testid="category-selector"]')

    // Focus en el selector
    await categorySelector.focus()

    // Abrir con Enter
    await page.keyboard.press('Enter')
    await expect(page.locator('[data-testid="category-dropdown"]')).toBeVisible()

    // Navegar con flechas
    await page.keyboard.press('ArrowDown')

    // Seleccionar con Enter
    await page.keyboard.press('Enter')

    // Verificar que se cerró el dropdown
    await expect(page.locator('[data-testid="category-dropdown"]')).not.toBeVisible()
  })
})
