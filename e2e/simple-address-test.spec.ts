import { test, expect } from '@playwright/test'

test.describe('Test Simple de Validación de Direcciones', () => {
  test('debería cargar la página principal', async ({ page }) => {
    // Navegar a la página principal
    await page.goto('/')
    
    // Verificar que la página se carga
    await expect(page).toHaveTitle(/Pinturas Online/)
  })

  test('debería navegar al checkout', async ({ page }) => {
    // Navegar a la página principal
    await page.goto('/')
    
    // Buscar y hacer clic en el botón de checkout o carrito
    const checkoutButton = page.locator('a[href="/checkout"], button:has-text("Checkout"), button:has-text("Carrito")').first()
    await checkoutButton.click()
    
    // Verificar que estamos en la página de checkout
    await expect(page).toHaveURL(/checkout/)
  })

  test('debería mostrar el campo de dirección en checkout', async ({ page }) => {
    // Navegar directamente al checkout
    await page.goto('/checkout')
    
    // Verificar que el campo de dirección está presente
    await expect(page.getByText('Dirección de entrega')).toBeVisible()
  })
})
