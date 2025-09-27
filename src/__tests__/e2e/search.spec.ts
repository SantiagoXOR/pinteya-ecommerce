// ===================================
// E2E TESTS: Search Functionality - Playwright
// ===================================

import { test, expect } from '@playwright/test'

// ===================================
// CONFIGURACIÓN
// ===================================

test.describe('Search Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a la página principal
    await page.goto('/')

    // Esperar a que la página cargue completamente
    await page.waitForLoadState('networkidle')
  })

  // ===================================
  // TESTS DE NAVEGACIÓN BÁSICA
  // ===================================

  test('should navigate to search results page when searching from header', async ({ page }) => {
    // Buscar el input de búsqueda en el header
    const searchInput = page.getByTestId('search-input')
    await expect(searchInput).toBeVisible()

    // Escribir término de búsqueda
    await searchInput.fill('pintura')

    // Presionar Enter para buscar
    await searchInput.press('Enter')

    // Verificar navegación a página de resultados
    await expect(page).toHaveURL(/\/search\?search=pintura/)

    // Verificar que se muestra el término buscado
    await expect(page.getByText('Búsqueda: "pintura"')).toBeVisible()
  })

  test('should show search results for valid query', async ({ page }) => {
    // Ir directamente a página de búsqueda
    await page.goto('/search?search=pintura')

    // Esperar a que carguen los resultados
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 })

    // Verificar que hay resultados
    const productCards = page.locator('[data-testid="product-card"]')
    await expect(productCards).toHaveCount.greaterThan(0)

    // Verificar que se muestra el conteo de resultados
    await expect(page.getByText(/\d+ productos? encontrados?/)).toBeVisible()
  })

  // ===================================
  // TESTS DE DEBOUNCING
  // ===================================

  test('should debounce search input correctly', async ({ page }) => {
    const searchInput = page.getByTestId('search-input')

    // Escribir rápidamente varios caracteres
    await searchInput.fill('p')
    await page.waitForTimeout(50)
    await searchInput.fill('pi')
    await page.waitForTimeout(50)
    await searchInput.fill('pin')
    await page.waitForTimeout(50)
    await searchInput.fill('pint')
    await page.waitForTimeout(50)
    await searchInput.fill('pintura')

    // Esperar el tiempo de debounce (150ms)
    await page.waitForTimeout(200)

    // Verificar que las sugerencias aparecen
    const suggestionsDropdown = page.locator('[data-testid="search-suggestions"]')
    await expect(suggestionsDropdown).toBeVisible({ timeout: 5000 })
  })

  // ===================================
  // TESTS DE ESTADOS DE LOADING
  // ===================================

  test('should show loading state during search', async ({ page }) => {
    // Interceptar la API para hacer la respuesta más lenta
    await page.route('**/api/products**', async route => {
      await page.waitForTimeout(1000) // Simular latencia
      await route.continue()
    })

    await page.goto('/search?search=pintura')

    // Verificar que se muestra el estado de loading
    await expect(page.getByText('Buscando productos...')).toBeVisible()

    // Verificar que se muestran los skeletons
    const skeletons = page.locator('.animate-pulse')
    await expect(skeletons.first()).toBeVisible()

    // Esperar a que termine la carga
    await expect(page.getByText('Buscando productos...')).toBeHidden({ timeout: 15000 })
  })

  test('should show loading spinner in search input', async ({ page }) => {
    const searchInput = page.getByTestId('search-input')

    // Interceptar API para simular latencia
    await page.route('**/api/products**', async route => {
      await page.waitForTimeout(500)
      await route.continue()
    })

    await searchInput.fill('pintura')

    // Verificar que aparece el spinner en el input
    const spinner = page.locator('.animate-spin').first()
    await expect(spinner).toBeVisible({ timeout: 2000 })
  })

  // ===================================
  // TESTS DE MANEJO DE ERRORES
  // ===================================

  test('should handle network errors gracefully', async ({ page }) => {
    // Interceptar API para simular error de red
    await page.route('**/api/products**', route => route.abort('failed'))

    await page.goto('/search?search=pintura')

    // Verificar que se muestra mensaje de error
    await expect(page.getByText(/Error en la búsqueda/)).toBeVisible({ timeout: 10000 })

    // Verificar que hay botón de reintentar
    const retryButton = page.getByText('Intentar nuevamente')
    await expect(retryButton).toBeVisible()
  })

  test('should show no results message for empty search', async ({ page }) => {
    // Buscar algo que no existe
    await page.goto('/search?search=productoquenoexiste123')

    // Verificar mensaje de sin resultados
    await expect(page.getByText('No se encontraron productos')).toBeVisible({ timeout: 10000 })

    // Verificar sugerencias
    await expect(page.getByText('Sugerencias:')).toBeVisible()
    await expect(page.getByText('Verifica la ortografía')).toBeVisible()
  })

  // ===================================
  // TESTS DE FILTROS Y ORDENAMIENTO
  // ===================================

  test('should allow sorting search results', async ({ page }) => {
    await page.goto('/search?search=pintura')

    // Esperar a que carguen los resultados
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 })

    // Encontrar el selector de ordenamiento
    const sortSelect = page.locator('select').filter({ hasText: 'Más relevante' })
    await expect(sortSelect).toBeVisible()

    // Cambiar a ordenamiento por precio
    await sortSelect.selectOption('price-asc')

    // Verificar que la URL se actualiza o los productos se reordenan
    await page.waitForTimeout(1000)

    // Los productos deberían estar ordenados por precio
    const productPrices = await page.locator('[data-testid="product-price"]').allTextContents()
    expect(productPrices.length).toBeGreaterThan(0)
  })

  test('should switch between grid and list view', async ({ page }) => {
    await page.goto('/search?search=pintura')

    // Esperar resultados
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 })

    // Verificar vista grid por defecto
    const gridButton = page.getByText('Grid')
    await expect(gridButton).toHaveClass(/bg-blaze-orange-500/)

    // Cambiar a vista lista
    const listButton = page.getByText('Lista')
    await listButton.click()

    // Verificar que cambió la vista
    await expect(listButton).toHaveClass(/bg-blaze-orange-500/)
    await expect(gridButton).not.toHaveClass(/bg-blaze-orange-500/)
  })

  // ===================================
  // TESTS DE CATEGORÍAS
  // ===================================

  test('should search within specific category', async ({ page }) => {
    const searchInput = page.getByTestId('search-input')

    // Abrir selector de categorías
    const categorySelector = page.getByTestId('category-selector')
    await categorySelector.click()

    // Seleccionar categoría específica
    await page.getByTestId('category-pinturas').click()

    // Buscar
    await searchInput.fill('latex')
    await searchInput.press('Enter')

    // Verificar que la URL incluye la categoría
    await expect(page).toHaveURL(/\/search\?search=latex&category=pinturas/)

    // Verificar que se muestra la categoría en los resultados
    await expect(page.getByText('Categoría: pinturas')).toBeVisible()
  })

  // ===================================
  // TESTS DE SUGERENCIAS
  // ===================================

  test('should show and select search suggestions', async ({ page }) => {
    const searchInput = page.getByTestId('search-input')

    // Escribir término parcial
    await searchInput.fill('pint')

    // Esperar sugerencias
    await page.waitForTimeout(200)

    // Verificar que aparecen sugerencias
    const suggestionsDropdown = page.locator('[data-testid="search-suggestions"]')
    await expect(suggestionsDropdown).toBeVisible({ timeout: 5000 })

    // Seleccionar una sugerencia
    const firstSuggestion = suggestionsDropdown.locator('button').first()
    await firstSuggestion.click()

    // Verificar navegación
    await expect(page).toHaveURL(/\/search\?search=/)
  })

  // ===================================
  // TESTS DE RESPONSIVE
  // ===================================

  test('should work correctly on mobile devices', async ({ page }) => {
    // Configurar viewport móvil
    await page.setViewportSize({ width: 375, height: 667 })

    await page.goto('/')

    // En móvil, el buscador debería estar en la parte inferior del header
    const mobileSearchInput = page.getByTestId('mobile-search-input')
    await expect(mobileSearchInput).toBeVisible()

    // Buscar desde móvil
    await mobileSearchInput.fill('pintura')
    await mobileSearchInput.press('Enter')

    // Verificar navegación
    await expect(page).toHaveURL(/\/search\?search=pintura/)

    // Verificar que los resultados se muestran correctamente en móvil
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 })
    const productCards = page.locator('[data-testid="product-card"]')
    await expect(productCards.first()).toBeVisible()
  })

  // ===================================
  // TESTS DE PERFORMANCE
  // ===================================

  test('should load search results within acceptable time', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('/search?search=pintura')

    // Esperar a que aparezcan los resultados
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 })

    const endTime = Date.now()
    const loadTime = endTime - startTime

    // Verificar que carga en menos de 5 segundos
    expect(loadTime).toBeLessThan(5000)
  })

  // ===================================
  // TEST DE INTEGRACIÓN COMPLETA
  // ===================================

  test('should complete full search workflow with error recovery', async ({ page }) => {
    // 1. Navegar a la página principal
    await page.goto('/')

    // 2. Buscar desde el header
    const searchInput = page.getByTestId('search-input')
    await searchInput.fill('pintura')

    // 3. Verificar sugerencias aparecen
    await page.waitForTimeout(200)
    const suggestionsDropdown = page.locator('[data-testid="search-suggestions"]')
    await expect(suggestionsDropdown).toBeVisible({ timeout: 5000 })

    // 4. Presionar Enter para buscar
    await searchInput.press('Enter')

    // 5. Verificar navegación correcta
    await expect(page).toHaveURL(/\/search\?search=pintura/)

    // 6. Verificar loading state
    await expect(page.getByText('Buscando productos...')).toBeVisible()

    // 7. Esperar resultados
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 })

    // 8. Verificar que hay resultados
    const productCards = page.locator('[data-testid="product-card"]')
    await expect(productCards).toHaveCount.greaterThan(0)

    // 9. Cambiar ordenamiento
    const sortSelect = page.locator('select').filter({ hasText: 'Más relevante' })
    await sortSelect.selectOption('price-asc')

    // 10. Cambiar vista
    const listButton = page.getByText('Lista')
    await listButton.click()

    // 11. Verificar que todo funciona correctamente
    await expect(listButton).toHaveClass(/bg-blaze-orange-500/)
    await expect(productCards.first()).toBeVisible()

    console.log('✅ Flujo completo de búsqueda completado exitosamente')
  })
})
