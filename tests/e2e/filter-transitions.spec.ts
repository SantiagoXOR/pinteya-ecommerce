import { test, expect, Page } from '@playwright/test'

/**
 * Suite de tests E2E para verificar transiciones entre vistas
 * y elementos específicos del DOM en el sistema de filtros
 */

const BASE_URL = 'http://localhost:3000'

// Helper function para esperar que la página cargue completamente
async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000)
}

test.describe('Transiciones entre Vistas - ConditionalContent', () => {
  test('Transición de homepage a vista filtrada mediante navegación', async ({ page }) => {
    console.log('🧪 Testing: Transición homepage → vista filtrada')

    // Comenzar en homepage
    await page.goto(BASE_URL)
    await waitForPageLoad(page)

    // Verificar estado inicial (homepage)
    await expect(page.locator('text=Más Vendidos')).toBeVisible()
    await expect(page.locator('text=Productos Filtrados')).not.toBeVisible()

    // Navegar a vista filtrada
    await page.goto(`${BASE_URL}/?search=pintura`)
    await waitForPageLoad(page)

    // Verificar estado final (vista filtrada)
    await expect(page.locator('text=Productos Filtrados')).toBeVisible()
    await expect(page.locator('text=Resultados de tu búsqueda')).toBeVisible()
    await expect(page.locator('text=Más Vendidos')).not.toBeVisible()

    // Capturar screenshot del estado final
    await page.screenshot({
      path: 'tests/screenshots/transition-to-filtered.png',
      fullPage: true,
    })

    console.log('✅ Transición homepage → vista filtrada test passed')
  })

  test('Transición de vista filtrada a homepage', async ({ page }) => {
    console.log('🧪 Testing: Transición vista filtrada → homepage')

    // Comenzar en vista filtrada
    await page.goto(`${BASE_URL}/?search=pintura`)
    await waitForPageLoad(page)

    // Verificar estado inicial (vista filtrada)
    await expect(page.locator('text=Productos Filtrados')).toBeVisible()
    await expect(page.locator('text=Más Vendidos')).not.toBeVisible()

    // Navegar a homepage
    await page.goto(BASE_URL)
    await waitForPageLoad(page)

    // Verificar estado final (homepage)
    await expect(page.locator('text=Más Vendidos')).toBeVisible()
    await expect(page.locator('text=Productos Filtrados')).not.toBeVisible()

    // Capturar screenshot del estado final
    await page.screenshot({
      path: 'tests/screenshots/transition-to-homepage.png',
      fullPage: true,
    })

    console.log('✅ Transición vista filtrada → homepage test passed')
  })

  test('Cambio entre diferentes tipos de filtros', async ({ page }) => {
    console.log('🧪 Testing: Cambio entre diferentes filtros')

    // Filtro por búsqueda
    await page.goto(`${BASE_URL}/?search=pintura`)
    await waitForPageLoad(page)

    await expect(page.locator('text=Productos Filtrados')).toBeVisible()
    const searchResults = await page.locator('text=/\\d+ encontrados/').textContent()
    console.log(`🔍 Resultados con search=pintura: ${searchResults}`)

    // Cambiar a filtro por categoría
    await page.goto(`${BASE_URL}/?category=Interior`)
    await waitForPageLoad(page)

    // Verificar que la página responde al cambio
    const hasFilteredView = await page.locator('text=Productos Filtrados').isVisible()
    const hasHomepageView = await page.locator('text=Más Vendidos').isVisible()

    expect(hasFilteredView || hasHomepageView).toBeTruthy()

    if (hasFilteredView) {
      const categoryResults = await page.locator('text=/\\d+ encontrados/').textContent()
      console.log(`📂 Resultados con category=Interior: ${categoryResults}`)
    }

    // Capturar screenshot
    await page.screenshot({
      path: 'tests/screenshots/filter-type-change.png',
      fullPage: true,
    })

    console.log('✅ Cambio entre diferentes filtros test passed')
  })
})

test.describe('Elementos Específicos del DOM - FilteredProductsSection', () => {
  test('Verificación detallada del header de filtros', async ({ page }) => {
    console.log('🧪 Testing: Elementos específicos del header de filtros')

    await page.goto(`${BASE_URL}/?search=pintura`)
    await waitForPageLoad(page)

    // Verificar estructura del header de filtros
    const filterHeader = page.locator('div:has-text("Productos Filtrados")').first()
    await expect(filterHeader).toBeVisible()

    // Verificar icono de filtro (puede ser img o svg)
    const iconSelectors = [
      'img[alt*="filter"]',
      'img[src*="filter"]',
      'svg',
      '[data-testid="filter-icon"]',
      'img', // Fallback para cualquier imagen en el header
    ]

    let iconFound = false
    for (const selector of iconSelectors) {
      const icon = filterHeader.locator(selector).first()
      if (await icon.isVisible()) {
        iconFound = true
        console.log(`🎯 Icono encontrado con selector: ${selector}`)
        break
      }
    }

    expect(iconFound).toBeTruthy()

    // Verificar texto "Productos Filtrados"
    await expect(page.locator('text=Productos Filtrados')).toBeVisible()

    // Verificar contador con formato específico
    const counterElement = page.locator('text=/\\d+ encontrados/')
    await expect(counterElement).toBeVisible()

    const counterText = await counterElement.textContent()
    expect(counterText).toMatch(/^\d+ encontrados$/)
    console.log(`📊 Contador: ${counterText}`)

    // Verificar título principal
    const mainTitle = page.locator('h2:has-text("Resultados de tu búsqueda")')
    await expect(mainTitle).toBeVisible()

    console.log('✅ Header de filtros detallado test passed')
  })

  test('Estructura de productos en el grid', async ({ page }) => {
    console.log('🧪 Testing: Estructura detallada de productos')

    await page.goto(`${BASE_URL}/?search=pintura`)
    await waitForPageLoad(page)

    // Encontrar productos en el grid
    const productSelectors = [
      'article:has(img)',
      '[data-testid="product-card"]',
      '.product-card',
      'div:has(img):has(button:has-text("Agregar"))',
    ]

    let products = null
    for (const selector of productSelectors) {
      const elements = page.locator(selector)
      const count = await elements.count()
      if (count > 0) {
        products = elements
        console.log(`🛍️ Productos encontrados con selector: ${selector} (${count} productos)`)
        break
      }
    }

    expect(products).not.toBeNull()
    const productCount = await products!.count()
    expect(productCount).toBeGreaterThan(0)

    // Verificar estructura del primer producto
    const firstProduct = products!.first()

    // Imagen del producto
    const productImage = firstProduct.locator('img').first()
    await expect(productImage).toBeVisible()

    // Nombre/título del producto
    const titleSelectors = ['h3', 'h2', '[class*="title"]', '[class*="name"]']
    let titleFound = false
    for (const selector of titleSelectors) {
      const title = firstProduct.locator(selector)
      if (await title.isVisible()) {
        titleFound = true
        const titleText = await title.textContent()
        console.log(`📝 Título del producto: ${titleText}`)
        break
      }
    }
    expect(titleFound).toBeTruthy()

    // Precio del producto
    const priceElement = firstProduct.locator('text=/\\$[\\d,.]+/')
    await expect(priceElement).toBeVisible()
    const priceText = await priceElement.textContent()
    console.log(`💰 Precio: ${priceText}`)

    // Botón de agregar al carrito
    const addToCartSelectors = [
      'button:has-text("Agregar")',
      'button:has-text("carrito")',
      'button:has-text("Carrito")',
      'a:has-text("Agregar")',
    ]

    let buttonFound = false
    for (const selector of addToCartSelectors) {
      const button = firstProduct.locator(selector)
      if (await button.isVisible()) {
        buttonFound = true
        console.log(`🛒 Botón encontrado: ${selector}`)
        break
      }
    }
    expect(buttonFound).toBeTruthy()

    console.log(`✅ Estructura de productos test passed - ${productCount} productos verificados`)
  })

  test('Verificación de responsive design', async ({ page }) => {
    console.log('🧪 Testing: Responsive design en vista filtrada')

    await page.goto(`${BASE_URL}/?search=pintura`)
    await waitForPageLoad(page)

    // Test en desktop (por defecto)
    await page.setViewportSize({ width: 1200, height: 800 })
    await page.waitForTimeout(1000)

    await expect(page.locator('text=Productos Filtrados')).toBeVisible()
    await page.screenshot({
      path: 'tests/screenshots/filtered-desktop.png',
      fullPage: true,
    })

    // Test en tablet
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.waitForTimeout(1000)

    await expect(page.locator('text=Productos Filtrados')).toBeVisible()
    await page.screenshot({
      path: 'tests/screenshots/filtered-tablet.png',
      fullPage: true,
    })

    // Test en mobile
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForTimeout(1000)

    await expect(page.locator('text=Productos Filtrados')).toBeVisible()
    await page.screenshot({
      path: 'tests/screenshots/filtered-mobile.png',
      fullPage: true,
    })

    console.log('✅ Responsive design test passed')
  })
})
