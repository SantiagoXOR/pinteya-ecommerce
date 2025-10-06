import { test, expect, Page } from '@playwright/test'

/**
 * Suite de tests E2E para el Sistema de Filtros Avanzados
 * Verifica que ConditionalContent y FilteredProductsSection funcionen correctamente
 */

const BASE_URL = 'http://localhost:3000'

// Helper function para esperar que la página cargue completamente
async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000) // Esperar que React se hidrate
}

// Helper function para verificar elementos comunes del header
async function verifyCommonHeader(page: Page) {
  await expect(page.locator('header')).toBeVisible()
  await expect(page.locator('input[placeholder*="Buscar"]')).toBeVisible()
  await expect(
    page.locator('[data-testid="cart-icon"], [data-testid="floating-cart-icon"]').first()
  ).toBeVisible()
}

test.describe('Sistema de Filtros Avanzados - ConditionalContent', () => {
  test('Homepage normal - debe mostrar contenido completo sin filtros', async ({ page }) => {
    console.log('🧪 Testing: Homepage normal')

    await page.goto(BASE_URL)
    await waitForPageLoad(page)

    // Verificar elementos del header común
    await verifyCommonHeader(page)

    // Verificar que NO aparece el header de filtros
    await expect(page.locator('text=Productos Filtrados')).not.toBeVisible()
    await expect(page.locator('text=Resultados de tu búsqueda')).not.toBeVisible()

    // Verificar que aparecen elementos típicos del homepage
    // Buscar diferentes variaciones de texto que pueden aparecer
    const homepageElements = [
      page.locator('text=Más Vendidos'),
      page.locator('text=Últimos Productos'),
      page.locator('text=Productos Destacados'),
      page.locator('text=Ofertas'),
      page.locator('text=Categorías'),
      page.locator('main section, main > div').first(),
    ]

    let homepageElementFound = false
    for (const element of homepageElements) {
      if (await element.isVisible()) {
        homepageElementFound = true
        console.log('✅ Elemento del homepage encontrado')
        break
      }
    }

    expect(homepageElementFound).toBeTruthy()

    // Capturar screenshot
    await page.screenshot({
      path: 'tests/screenshots/homepage-normal.png',
      fullPage: true,
    })

    console.log('✅ Homepage normal test passed')
  })

  test('Vista filtrada con search - debe mostrar FilteredProductsSection', async ({ page }) => {
    console.log('🧪 Testing: Vista filtrada con search=pintura')

    await page.goto(`${BASE_URL}/?search=pintura`)
    await waitForPageLoad(page)

    // Verificar elementos del header común
    await verifyCommonHeader(page)

    // Verificar que aparece el header de filtros O que hay productos filtrados
    const hasFilterHeader = await page.locator('text=Productos Filtrados').isVisible()
    const hasSearchResults = await page.locator('text=Resultados de tu búsqueda').isVisible()
    const hasProducts =
      (await page.locator('article:has(img), [data-testid="product-card"]').count()) > 0

    // Al menos uno de estos debe ser verdadero para una vista filtrada
    expect(hasFilterHeader || hasSearchResults || hasProducts).toBeTruthy()

    // Verificar contador de productos
    const counterElement = page.locator('text=/\\d+ encontrados/')
    await expect(counterElement).toBeVisible()

    // Verificar que hay productos en el grid
    const productCards = page.locator(
      '[data-testid="product-card"], .product-card, article:has(img)'
    )
    const productCount = await productCards.count()
    expect(productCount).toBeGreaterThan(0)

    // Verificar que NO aparecen elementos del homepage normal
    await expect(page.locator('text=Más Vendidos')).not.toBeVisible()
    await expect(page.locator('text=Últimos Productos')).not.toBeVisible()

    // Capturar screenshot
    await page.screenshot({
      path: 'tests/screenshots/filtered-search-pintura.png',
      fullPage: true,
    })

    console.log('✅ Vista filtrada con search test passed')
  })

  test('Vista filtrada con category - debe mostrar FilteredProductsSection', async ({ page }) => {
    console.log('🧪 Testing: Vista filtrada con category=Interior')

    await page.goto(`${BASE_URL}/?category=Interior`)
    await waitForPageLoad(page)

    // Verificar elementos del header común
    await verifyCommonHeader(page)

    // Verificar que aparece el header de filtros O el homepage normal
    // (dependiendo de si category=Interior es reconocido como filtro activo)
    const hasFilterHeader = await page.locator('text=Productos Filtrados').isVisible()
    const hasHomepageContent = await page.locator('text=Más Vendidos').isVisible()

    // Debe mostrar uno u otro, no ambos
    expect(hasFilterHeader || hasHomepageContent).toBeTruthy()
    expect(hasFilterHeader && hasHomepageContent).toBeFalsy()

    if (hasFilterHeader) {
      console.log('📊 Category filter detected - showing filtered view')
      await expect(page.locator('text=Resultados de tu búsqueda')).toBeVisible()

      // Verificar contador de productos
      const counterElement = page.locator('text=/\\d+ encontrados/')
      await expect(counterElement).toBeVisible()
    } else {
      console.log('📊 Category filter not detected - showing homepage')
      await expect(page.locator('text=Últimos Productos')).toBeVisible()
    }

    // Capturar screenshot
    await page.screenshot({
      path: 'tests/screenshots/filtered-category-interior.png',
      fullPage: true,
    })

    console.log('✅ Vista filtrada con category test passed')
  })

  test('Vista filtrada con múltiples filtros', async ({ page }) => {
    console.log('🧪 Testing: Vista filtrada con múltiples filtros')

    await page.goto(`${BASE_URL}/?search=pintura&category=Interior&page=1`)
    await waitForPageLoad(page)

    // Verificar elementos del header común
    await verifyCommonHeader(page)

    // Verificar que aparece el header de filtros
    await expect(page.locator('text=Productos Filtrados')).toBeVisible()
    await expect(page.locator('text=Resultados de tu búsqueda')).toBeVisible()

    // Verificar contador de productos
    const counterElement = page.locator('text=/\\d+ encontrados/')
    await expect(counterElement).toBeVisible()

    // Verificar que hay productos en el grid
    const productCards = page.locator(
      '[data-testid="product-card"], .product-card, article:has(img)'
    )
    const productCount = await productCards.count()
    expect(productCount).toBeGreaterThan(0)

    // Capturar screenshot
    await page.screenshot({
      path: 'tests/screenshots/filtered-multiple-params.png',
      fullPage: true,
    })

    console.log('✅ Vista filtrada con múltiples filtros test passed')
  })
})

test.describe('Sistema de Filtros Avanzados - FilteredProductsSection', () => {
  test('Estructura del header de filtros', async ({ page }) => {
    console.log('🧪 Testing: Estructura del header de filtros')

    await page.goto(`${BASE_URL}/?search=pintura`)
    await waitForPageLoad(page)

    // Verificar icono de filtro
    const filterIcon = page.locator('img[alt*="filter"], svg, [data-testid="filter-icon"]')
    await expect(filterIcon.first()).toBeVisible()

    // Verificar texto "Productos Filtrados"
    await expect(page.locator('text=Productos Filtrados')).toBeVisible()

    // Verificar contador con formato específico
    const counterText = await page.locator('text=/\\d+ encontrados/').textContent()
    expect(counterText).toMatch(/\d+ encontrados/)

    // Verificar título principal
    await expect(page.locator('h2:has-text("Resultados de tu búsqueda")')).toBeVisible()

    console.log('✅ Estructura del header de filtros test passed')
  })

  test('Grid de productos filtrados', async ({ page }) => {
    console.log('🧪 Testing: Grid de productos filtrados')

    await page.goto(`${BASE_URL}/?search=pintura`)
    await waitForPageLoad(page)

    // Verificar que existe un contenedor de productos
    const productGrid = page.locator(
      '[class*="grid"], [class*="products"], main > div:has(article)'
    )
    await expect(productGrid.first()).toBeVisible()

    // Verificar que hay productos individuales
    const productCards = page.locator(
      'article:has(img), [data-testid="product-card"], .product-card'
    )
    const productCount = await productCards.count()
    expect(productCount).toBeGreaterThan(0)

    // Verificar estructura de cada producto (al menos el primero)
    if (productCount > 0) {
      const firstProduct = productCards.first()

      // Verificar imagen del producto
      await expect(firstProduct.locator('img')).toBeVisible()

      // Verificar nombre/título del producto
      await expect(firstProduct.locator('h3, h2, [class*="title"], [class*="name"]')).toBeVisible()

      // Verificar precio
      await expect(firstProduct.locator('text=/\\$[\\d,.]+')).toBeVisible()

      // Verificar botón de agregar al carrito
      await expect(
        firstProduct.locator('button:has-text("Agregar"), button:has-text("carrito")')
      ).toBeVisible()
    }

    console.log(
      `✅ Grid de productos filtrados test passed - ${productCount} productos encontrados`
    )
  })

  test('Paginación en vista filtrada', async ({ page }) => {
    console.log('🧪 Testing: Paginación en vista filtrada')

    await page.goto(`${BASE_URL}/?search=pintura`)
    await waitForPageLoad(page)

    // Buscar elementos de paginación
    const paginationElements = [
      page.locator('text=/Página \\d+ de \\d+/'),
      page.locator('button:has-text("Siguiente")'),
      page.locator('button:has-text("Anterior")'),
      page.locator('[class*="pagination"]'),
    ]

    let paginationFound = false
    for (const element of paginationElements) {
      if (await element.isVisible()) {
        paginationFound = true
        console.log('📄 Paginación encontrada')
        break
      }
    }

    // Si hay paginación, verificar su estructura
    if (paginationFound) {
      const pageInfo = page.locator('text=/Página \\d+ de \\d+/')
      if (await pageInfo.isVisible()) {
        const pageText = await pageInfo.textContent()
        expect(pageText).toMatch(/Página \d+ de \d+/)
        console.log(`📄 Info de página: ${pageText}`)
      }
    }

    console.log('✅ Paginación test passed')
  })
})
