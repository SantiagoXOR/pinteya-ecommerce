import { test, expect } from '@playwright/test'

test.describe('CategoryTogglePillsWithSearch', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a la página principal
    await page.goto('http://localhost:3000')

    // Esperar a que las pills de categorías se carguen
    await page.waitForSelector('[data-testid="category-pills-container"]', { timeout: 10000 })
  })

  test('should display category pills', async ({ page }) => {
    // Verificar que el contenedor de pills existe
    const pillsContainer = page.locator('[data-testid="category-pills-container"]')
    await expect(pillsContainer).toBeVisible()

    // Verificar que hay al menos una pill de categoría
    const categoryPills = page.locator('button[data-testid^="category-pill-"]')
    await expect(categoryPills.first()).toBeVisible()

    // Contar el número de pills
    const pillCount = await categoryPills.count()
    expect(pillCount).toBeGreaterThan(0)
  })

  test('should toggle category selection', async ({ page }) => {
    // Encontrar la primera pill de categoría
    const firstPill = page.locator('button[data-testid^="category-pill-"]').first()
    await expect(firstPill).toBeVisible()

    // Obtener el estado inicial (no seleccionado)
    const initialClasses = await firstPill.getAttribute('class')

    // Hacer click en la pill
    await firstPill.click()

    // Verificar que el estado cambió
    const newClasses = await firstPill.getAttribute('class')
    expect(newClasses).not.toBe(initialClasses)

    // Verificar que se muestra el indicador de filtros activos
    const clearButton = page.locator('button:has-text("Limpiar")')
    await expect(clearButton).toBeVisible()
  })

  test('should clear all filters', async ({ page }) => {
    // Seleccionar una categoría
    const firstPill = page.locator('button[data-testid^="category-pill-"]').first()
    await firstPill.click()

    // Verificar que aparece el botón limpiar
    const clearButton = page.locator('button:has-text("Limpiar")')
    await expect(clearButton).toBeVisible()

    // Hacer click en limpiar
    await clearButton.click()

    // Verificar que el botón limpiar desaparece
    await expect(clearButton).not.toBeVisible()
  })

  test('should scroll horizontally with mouse wheel', async ({ page }) => {
    const pillsContainer = page.locator('[data-testid="category-pills-container"]')

    // Obtener la posición inicial de scroll
    const initialScrollLeft = await pillsContainer.evaluate(el => el.scrollLeft)

    // Simular scroll horizontal con rueda del mouse
    await pillsContainer.hover()
    await page.mouse.wheel(100, 0)

    // Verificar que el scroll cambió
    const newScrollLeft = await pillsContainer.evaluate(el => el.scrollLeft)
    expect(newScrollLeft).not.toBe(initialScrollLeft)
  })

  test('should handle drag scrolling', async ({ page }) => {
    const pillsContainer = page.locator('[data-testid="category-pills-container"]')

    // Obtener la posición inicial
    const initialScrollLeft = await pillsContainer.evaluate(el => el.scrollLeft)

    // Simular drag scroll
    const box = await pillsContainer.boundingBox()
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
      await page.mouse.down()
      await page.mouse.move(box.x + box.width / 2 - 100, box.y + box.height / 2)
      await page.mouse.up()
    }

    // Verificar que el scroll cambió
    const newScrollLeft = await pillsContainer.evaluate(el => el.scrollLeft)
    expect(newScrollLeft).not.toBe(initialScrollLeft)
  })

  test('should log category changes to console', async ({ page }) => {
    // Escuchar mensajes de consola
    const consoleMessages: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'log' && msg.text().includes('Categorías seleccionadas:')) {
        consoleMessages.push(msg.text())
      }
    })

    // Seleccionar una categoría
    const firstPill = page.locator('button[data-testid^="category-pill-"]').first()
    await firstPill.click()

    // Esperar un poco para que se procese el evento
    await page.waitForTimeout(500)

    // Verificar que se registró el mensaje en consola
    expect(consoleMessages.length).toBeGreaterThan(0)
    expect(consoleMessages[0]).toContain('Categorías seleccionadas:')
  })
})
