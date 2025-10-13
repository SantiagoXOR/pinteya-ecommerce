import { test, expect } from '@playwright/test'

// Verificación del modal para el producto ID 22 (Látex Muros 24KG)
test.describe('ShopDetailModal - Producto 22', () => {
  test('debe mostrar solo el color y capacidad relevantes y precio correcto', async ({ page }) => {
    // Navegar al producto por slug
    await page.goto('/products/latex-muros-24kg-plavicon')
    await page.waitForLoadState('networkidle')

    // Abrir el modal si existe botón para ello
    const openButtons = page.locator('button:has-text("Agregar al Carrito"), button:has-text("Ver detalles")')
    if ((await openButtons.count()) > 0) {
      await openButtons.first().click({ force: true })
      await page.waitForTimeout(500)
    }

    // Validar capacidad: debe existir 24KG y NO las capacidades por defecto 1L/4L/10L/20L
    const kgCapacity = page.locator('button:has-text("24KG")')
    await expect(kgCapacity).toBeVisible()

    const oneL = page.locator('button:has-text("1L")')
    const fourL = page.locator('button:has-text("4L")')
    const tenL = page.locator('button:has-text("10L")')
    const twentyL = page.locator('button:has-text("20L")')

    await expect(oneL).toHaveCount(0)
    await expect(fourL).toHaveCount(0)
    await expect(tenL).toHaveCount(0)
    await expect(twentyL).toHaveCount(0)

    // Validar color: debe mostrar "Blanco Puro"
    const colorSummary = page.locator('text=/Color:\\s*Blanco Puro/i')
    await expect(colorSummary).toBeVisible()

    // Validar precio total mostrado
    const totalPrice = page.locator('text=/\$?\s*157\.?059/i')
    await expect(totalPrice).toBeVisible()

    // Intentar agregar al carrito (solo validar que el botón existe y es clickable)
    const addToCart = page.locator('button:has-text("Agregar al Carrito")')
    await expect(addToCart).toBeVisible()
    await addToCart.click()
  })
})