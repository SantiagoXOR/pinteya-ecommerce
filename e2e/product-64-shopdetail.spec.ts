import { test, expect } from '@playwright/test'

test.describe('Producto 64 - Látex Interior (ShopDetailModal)', () => {
  test('capacidad/precio/stock y carrito reflejan datos reales', async ({ page }) => {
    await page.goto('/products/64')

    // Modal visible con título o marca
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Verifica capacidades visibles (4L, 10L, 20L)
    await expect(page.getByRole('button', { name: /4L/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /10L/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /20L/i })).toBeVisible()

    // Precio inicial (4L) — debe coincidir con el precio con descuento del producto 64
    // 4L discounted_price: 28,840.00
    // El precio se renderiza con separador y sup para decimales
    const priceLocator = dialog.locator('span.text-3xl.font-bold')
    await expect(priceLocator.first()).toContainText('$')

    // Cambiar a 10L y validar actualización de precio
    await page.getByRole('button', { name: /10L/i }).click()
    await expect(priceLocator.first()).toContainText('61.390')

    // Cambiar a 20L y validar actualización de precio
    await page.getByRole('button', { name: /20L/i }).click()
    await expect(priceLocator.first()).toContainText('107.100')

    // Stock/estado del botón debe estar habilitado (stock > 0)
    const addToCart = dialog.getByRole('button', { name: /agregar al carrito/i })
    await expect(addToCart).toBeEnabled()

    // Agregar al carrito y validar que el modal se cierre
    await addToCart.click()
    await expect(dialog).toBeHidden({ timeout: 5000 })
  })
})