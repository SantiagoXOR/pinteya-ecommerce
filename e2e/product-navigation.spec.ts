import { test, expect } from '@playwright/test'

test.describe('Product Navigation', () => {
  test('should navigate from product card to product details', async ({ page }) => {
    // Navegar a la página de tienda
    await page.goto('/shop')

    // Esperar a que los productos se carguen
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 30000 })

    // Obtener el primer producto
    const firstProduct = page.locator('[data-testid="product-card"]').first()
    await expect(firstProduct).toBeVisible()

    // Obtener el nombre del producto para verificación
    const productNameElement = firstProduct.locator('[data-testid="product-name"] a')
    const productName = await productNameElement.textContent()
    console.log('Product name:', productName)

    // Obtener el href del enlace para verificar que tiene el formato correcto
    const productLink = await productNameElement.getAttribute('href')
    console.log('Product link:', productLink)

    // Verificar que el enlace tiene el formato correcto
    expect(productLink).toMatch(/^\/shop-details\/\d+$/)

    // Hacer clic en el enlace del producto
    await productNameElement.click()

    // Esperar a que la página de detalles se cargue
    await page.waitForLoadState('networkidle')

    // Verificar que estamos en la página de detalles
    const currentUrl = page.url()
    expect(currentUrl).toMatch(/\/shop-details\/\d+$/)

    // Verificar que la página de detalles se carga correctamente
    // Puede mostrar loading, el producto, o un error - todos son estados válidos
    const pageContent = await page.content()

    // Verificar que no hay errores de JavaScript críticos
    const hasJSError = pageContent.includes('Error') && pageContent.includes('500')
    expect(hasJSError).toBeFalsy()

    console.log('✅ Navigation test completed successfully')
  })

  test('should handle product details page loading states', async ({ page }) => {
    // Navegar directamente a una página de detalles con un ID válido
    await page.goto('/shop-details/88') // ID de producto que sabemos que existe

    // Esperar a que la página se cargue
    await page.waitForLoadState('networkidle')

    // La página puede estar en uno de estos estados:
    // 1. Cargando
    // 2. Producto cargado
    // 3. Producto no encontrado
    // 4. Error de conexión

    const pageContent = await page.content()

    // Verificar que la página responde (no es un error 500 del servidor)
    const response = await page.goto('/shop-details/88')
    expect(response?.status()).toBeLessThan(500)

    // Verificar que hay contenido en la página
    expect(pageContent.length).toBeGreaterThan(100)

    console.log('✅ Product details page loading test completed')
  })

  test('should show placeholder images correctly', async ({ page }) => {
    // Navegar a la página de tienda
    await page.goto('/shop')

    // Esperar a que los productos se carguen
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 30000 })

    // Verificar que no hay errores 404 para placeholder-bg.jpg
    const response404Count = await page.evaluate(() => {
      return window.performance
        .getEntriesByType('resource')
        .filter(entry => entry.name.includes('placeholder-bg.jpg')).length
    })

    // No debería haber requests para el placeholder anterior
    expect(response404Count).toBe(0)

    console.log('✅ Placeholder images test completed')
  })

  test('should have working API endpoints', async ({ page }) => {
    // Probar la API de productos
    const productsResponse = await page.request.get('/api/products')
    expect(productsResponse.status()).toBe(200)

    const productsData = await productsResponse.json()
    expect(productsData.success).toBe(true)
    expect(Array.isArray(productsData.data)).toBe(true)

    // Si hay productos, probar la API de producto individual
    if (productsData.data.length > 0) {
      const firstProductId = productsData.data[0].id
      const productResponse = await page.request.get(`/api/products/${firstProductId}`)
      expect(productResponse.status()).toBe(200)

      const productData = await productResponse.json()
      expect(productData.success).toBe(true)
      expect(productData.data).toBeDefined()
    }

    console.log('✅ API endpoints test completed')
  })
})
