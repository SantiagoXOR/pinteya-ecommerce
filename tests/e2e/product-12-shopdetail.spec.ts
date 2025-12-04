import { test, expect } from '@playwright/test'

test.describe('Product 12 ShopDetail Modal', () => {
  test('muestra capacidades en litros, precio correcto y agrega al carrito', async ({ page }) => {
    await page.goto('/products/12')

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Título del producto
    await expect(page.getByText(/Látex Frentes/i)).toBeVisible()

    // Capacidades visibles en litros (20L, 10L, 4L)
    for (const cap of ['20L', '10L', '4L']) {
      await expect(page.getByRole('button', { name: cap })).toBeVisible()
    }

    // NO deben aparecer capacidades en KG
    for (const cap of ['5KG', '12KG', '24KG']) {
      await expect(page.getByRole('button', { name: cap })).toHaveCount(0)
    }

    // Disponibilidad basada en effectiveStock
    await expect(page.getByText(/Disponible \(\d+ en stock\)/)).toBeVisible()

    // Color inteligente (Blanco Puro)
    await expect(page.locator('text=/Color:\s*Blanco Puro/i')).toBeVisible()

    // Seleccionar 20L y validar precio
    await page.getByRole('button', { name: '20L' }).click()
    await expect(page.getByText(/Capacidad:\s*20L/i)).toBeVisible()
    await expect(page.getByText(/\$114\.310/)).toBeVisible()

    // Cambiar a 10L y validar precio actualizado
    await page.getByRole('button', { name: '10L' }).click()
    await expect(page.getByText(/Capacidad:\s*10L/i)).toBeVisible()
    await expect(page.getByText(/\$67\.820/)).toBeVisible()

    // Botón habilitado (hay stock)
    const addToCart = page.getByRole('button', { name: /Agregar al Carrito/i })
    await expect(addToCart).toBeEnabled()

    // Agregar al carrito y redirigir a /products
    await addToCart.click()
    await expect(page).toHaveURL(/\/products$/)
  })
})