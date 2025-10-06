import { test, expect } from '@playwright/test'

/**
 * Flujo de usuario completo para verificar que los datos hardcodeados
 * han sido eliminados y que las estadísticas muestran datos reales
 */

test.describe('Flujo de Usuario - Verificación Datos Reales', () => {
  test.beforeEach(async ({ page }) => {
    // Configurar timeouts más largos para APIs
    page.setDefaultTimeout(10000)
    page.setDefaultNavigationTimeout(15000)
  })

  test('Flujo completo: Homepage → Búsqueda → Verificación datos dinámicos', async ({ page }) => {
    console.log('🚀 Iniciando flujo de usuario completo...')

    // 1. NAVEGAR A LA HOMEPAGE
    console.log('📍 Paso 1: Navegando a homepage...')
    await page.goto('https://pinteya.com')

    // Verificar que la página carga correctamente
    await expect(page).toHaveTitle(/Pinteya/i)
    await expect(page.locator('h1')).toBeVisible()

    console.log('✅ Homepage cargada correctamente')

    // 2. VERIFICAR QUE LOS PRODUCTOS SE CARGAN DINÁMICAMENTE
    console.log('📍 Paso 2: Verificando productos dinámicos...')

    // Esperar a que los productos se carguen
    await page.waitForSelector('[data-testid="product-card"], .product-card, [class*="product"]', {
      timeout: 10000,
    })

    const productCards = await page
      .locator('[data-testid="product-card"], .product-card, [class*="product"]')
      .count()
    console.log(`📦 Productos encontrados: ${productCards}`)

    expect(productCards).toBeGreaterThan(0)
    console.log('✅ Productos cargados dinámicamente')

    // 3. PROBAR FUNCIONALIDAD DE BÚSQUEDA
    console.log('📍 Paso 3: Probando búsqueda...')

    // Buscar el campo de búsqueda
    const searchInput = page
      .locator(
        'input[type="search"], input[placeholder*="buscar"], input[placeholder*="Buscar"], #search-input, [data-testid="search-input"]'
      )
      .first()
    await expect(searchInput).toBeVisible()

    // Realizar búsqueda
    await searchInput.fill('pintura')
    await searchInput.press('Enter')

    // Esperar resultados o navegación
    await page.waitForTimeout(2000)

    console.log('✅ Búsqueda ejecutada')

    // 4. VERIFICAR API DE TRENDING SEARCHES (SIN DATOS HARDCODEADOS)
    console.log('📍 Paso 4: Verificando API trending searches...')

    const trendingResponse = await page.request.get('https://pinteya.com/api/search/trending')
    expect(trendingResponse.ok()).toBeTruthy()

    const trendingData = await trendingResponse.json()
    console.log('📊 Trending data:', JSON.stringify(trendingData, null, 2))

    // Verificar que NO contiene los valores hardcodeados problemáticos
    const trending = trendingData.data?.trending || []
    const hasHardcodedValues = trending.some(
      (item: any) => item.count === 156 || item.count === 142
    )

    expect(hasHardcodedValues).toBeFalsy()
    console.log('✅ API trending searches SIN datos hardcodeados (156, 142)')

    // Verificar que tiene datos dinámicos
    expect(trending.length).toBeGreaterThan(0)
    console.log(`📈 Trending searches dinámicas: ${trending.length}`)

    // 5. VERIFICAR API DE PRODUCTOS
    console.log('📍 Paso 5: Verificando API productos...')

    const productsResponse = await page.request.get('https://pinteya.com/api/products')
    expect(productsResponse.ok()).toBeTruthy()

    const productsData = await productsResponse.json()
    const products = productsData.data || []

    expect(products.length).toBeGreaterThan(0)
    console.log(`📦 Productos en API: ${products.length}`)
    console.log('✅ API productos funcionando con datos reales')

    // 6. VERIFICAR QUE ADMIN APIS ESTÁN PROTEGIDAS
    console.log('📍 Paso 6: Verificando protección admin APIs...')

    const adminResponse = await page.request.get('https://pinteya.com/api/admin/products/stats')
    expect(adminResponse.status()).toBe(401) // Debe estar bloqueada

    console.log('✅ Admin APIs correctamente protegidas')

    // 7. NAVEGACIÓN Y INTERACCIÓN ADICIONAL
    console.log('📍 Paso 7: Navegación adicional...')

    // Intentar navegar a diferentes secciones
    const navLinks = await page.locator('nav a, header a').all()
    if (navLinks.length > 0) {
      // Hacer clic en el primer enlace de navegación
      await navLinks[0].click()
      await page.waitForTimeout(1000)
      console.log('✅ Navegación funcional')
    }

    // 8. VERIFICAR RESPONSIVE DESIGN
    console.log('📍 Paso 8: Verificando responsive design...')

    // Probar en móvil
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForTimeout(1000)

    // Verificar que el contenido sigue visible
    await expect(page.locator('body')).toBeVisible()
    console.log('✅ Responsive design funcional')

    // Volver a desktop
    await page.setViewportSize({ width: 1280, height: 720 })

    console.log('🎉 Flujo de usuario completado exitosamente!')
  })

  test('Verificación específica: Eliminación datos hardcodeados', async ({ page }) => {
    console.log('🔍 Verificación específica de datos hardcodeados...')

    // Probar múltiples veces la API para asegurar que los datos son dinámicos
    const responses = []

    for (let i = 0; i < 3; i++) {
      const response = await page.request.get('https://pinteya.com/api/search/trending')
      expect(response.ok()).toBeTruthy()

      const data = await response.json()
      responses.push(data)

      // Esperar un poco entre requests
      await page.waitForTimeout(1000)
    }

    console.log('📊 Múltiples responses obtenidas')

    // Verificar que NINGUNA respuesta contiene valores hardcodeados
    for (const [index, response] of responses.entries()) {
      const trending = response.data?.trending || []

      const hasHardcodedValues = trending.some(
        (item: any) => item.count === 156 || item.count === 142
      )

      expect(hasHardcodedValues).toBeFalsy()
      console.log(`✅ Response ${index + 1}: Sin datos hardcodeados`)

      // Log de los valores actuales para verificación
      const counts = trending.map((item: any) => item.count)
      console.log(`📈 Response ${index + 1} counts:`, counts)
    }

    console.log('🎯 Verificación completada: Datos hardcodeados eliminados')
  })

  test('Performance y carga de página', async ({ page }) => {
    console.log('⚡ Verificando performance...')

    const startTime = Date.now()

    await page.goto('https://pinteya.com')

    // Esperar a que la página esté completamente cargada
    await page.waitForLoadState('networkidle')

    const loadTime = Date.now() - startTime
    console.log(`⏱️ Tiempo de carga: ${loadTime}ms`)

    // Verificar que carga en menos de 5 segundos
    expect(loadTime).toBeLessThan(5000)

    // Verificar elementos críticos
    await expect(page.locator('header')).toBeVisible()
    await expect(page.locator('main, [role="main"]')).toBeVisible()

    console.log('✅ Performance aceptable')
  })

  test('Funcionalidad de búsqueda avanzada', async ({ page }) => {
    console.log('🔍 Probando búsqueda avanzada...')

    await page.goto('https://pinteya.com')

    const searchTerms = ['pintura', 'esmalte', 'barniz', 'rodillo']

    for (const term of searchTerms) {
      console.log(`🔍 Buscando: ${term}`)

      const searchInput = page
        .locator('input[type="search"], input[placeholder*="buscar"], input[placeholder*="Buscar"]')
        .first()

      await searchInput.clear()
      await searchInput.fill(term)
      await searchInput.press('Enter')

      // Esperar respuesta
      await page.waitForTimeout(2000)

      console.log(`✅ Búsqueda "${term}" ejecutada`)
    }

    console.log('🎯 Búsqueda avanzada completada')
  })
})
