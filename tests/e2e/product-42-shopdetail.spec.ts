import { test, expect } from '@playwright/test'

test.describe('Product 42 ShopDetail Modal', () => {
  test('muestra capacidades, stock y agrega al carrito', async ({ page }) => {
    await page.goto('/products/42')

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Título del producto
    await expect(page.getByText(/Recuplast Frentes/i)).toBeVisible()

    // Capacidades visibles (20L, 10L, 4L, 1L)
    for (const cap of ['20L', '10L', '4L', '1L']) {
      await expect(page.getByRole('button', { name: cap })).toBeVisible()
    }

    // Stock disponible mostrado
    await expect(page.getByText(/Disponible \(\d+ en stock\)/)).toBeVisible()

    // Resumen muestra capacidad seleccionada
    await expect(page.getByText(/Capacidad:\s*20L/i)).toBeVisible()

    // Agregar al carrito y redirigir a /products
    await page.getByRole('button', { name: /Agregar al Carrito/i }).click()
    await expect(page).toHaveURL(/\/products$/)
  })
})