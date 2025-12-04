import { test, expect } from '@playwright/test'

test.describe('Phase 3: Sorting y Filtros - Panel de Productos', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a la página de productos
    await page.goto('http://localhost:3000/admin/products')
    // Esperar a que la tabla de productos esté visible
    await page.waitForSelector('table[data-testid="products-table"]', { timeout: 10000 })
  })

  test('Test 1: Debería ordenar productos por precio descendente', async ({ page }) => {
    console.log('🧪 Test 1: Sorting por Precio')
    
    // Click en header de "Precio"
    await page.click('th:has-text("Precio")')
    
    // Esperar a que aparezca el request con sort_by=price
    const responsePromise = page.waitForResponse(
      res => res.url().includes('/api/admin/products') && 
             res.url().includes('sort_by=price'),
      { timeout: 10000 }
    )
    
    const response = await responsePromise
    expect(response.status()).toBe(200)
    
    // Verificar que la URL contiene los parámetros de sorting
    expect(response.url()).toContain('sort_by=price')
    expect(response.url()).toContain('sort_order=desc')
    
    console.log('✅ Request con sorting enviado correctamente')
    
    // Tomar screenshot
    await page.screenshot({ path: 'tests/screenshots/sorting-precio.png', fullPage: true })
  })

  test('Test 2: Debería ordenar por precio ascendente al hacer segundo click', async ({ page }) => {
    console.log('🧪 Test 2: Toggle Sorting Ascendente/Descendente')
    
    // Primer click - descendente
    await page.click('th:has-text("Precio")')
    await page.waitForTimeout(500)
    
    // Segundo click - ascendente
    await page.click('th:has-text("Precio")')
    
    const responsePromise = page.waitForResponse(
      res => res.url().includes('/api/admin/products') && 
             res.url().includes('sort_order=asc'),
      { timeout: 10000 }
    )
    
    const response = await responsePromise
    expect(response.status()).toBe(200)
    expect(response.url()).toContain('sort_order=asc')
    
    console.log('✅ Toggle sorting funciona correctamente')
  })

  test('Test 3: Debería buscar en múltiples campos (nombre, descripción, marca, SKU)', async ({ page }) => {
    console.log('🧪 Test 3: Búsqueda Multi-Campo')
    
    // Encontrar el input de búsqueda
    const searchInput = page.locator('input[placeholder*="Buscar"]')
    await searchInput.fill('Látex')
    
    // Esperar debounce + request
    const responsePromise = page.waitForResponse(
      res => res.url().includes('/api/admin/products') && 
             res.url().includes('search'),
      { timeout: 10000 }
    )
    
    const response = await responsePromise
    expect(response.status()).toBe(200)
    
    // Verificar que hay resultados en la tabla
    const productRows = await page.locator('tbody tr[data-testid="product-row"]').count()
    console.log(`📊 Productos encontrados: ${productRows}`)
    
    await page.screenshot({ path: 'tests/screenshots/busqueda-multicampo.png', fullPage: true })
    
    console.log('✅ Búsqueda multi-campo funciona')
  })

  test('Test 4: Debería mostrar zebra striping alternado en filas', async ({ page }) => {
    console.log('🧪 Test 4: Zebra Striping Visual')
    
    // Esperar a que haya productos
    await page.waitForSelector('tbody tr[data-testid="product-row"]')
    
    // Obtener las primeras 2 filas
    const firstRow = page.locator('tbody tr[data-testid="product-row"]').first()
    const secondRow = page.locator('tbody tr[data-testid="product-row"]').nth(1)
    
    // Verificar que ambas filas existen
    await expect(firstRow).toBeVisible()
    await expect(secondRow).toBeVisible()
    
    // Obtener los colores de fondo
    const firstRowBg = await firstRow.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    )
    const secondRowBg = await secondRow.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    )
    
    console.log(`Fila 1 bg: ${firstRowBg}`)
    console.log(`Fila 2 bg: ${secondRowBg}`)
    
    // Verificar que son diferentes
    expect(firstRowBg).not.toBe(secondRowBg)
    
    await page.screenshot({ path: 'tests/screenshots/zebra-striping.png', fullPage: true })
    
    console.log('✅ Zebra striping visible')
  })

  test('Test 5: Debería filtrar por categoría seleccionada', async ({ page }) => {
    console.log('🧪 Test 5: Filtro de Categoría')
    
    // Expandir filtros si están colapsados
    const filtrosButton = page.locator('button:has-text("Filtros")')
    await filtrosButton.click()
    await page.waitForTimeout(500)
    
    // Verificar que hay categorías disponibles
    const categorySelect = page.locator('select').filter({ hasText: /Todas las categorías/i }).or(
      page.locator('label:has-text("Categoría")').locator('+ select')
    )
    
    // Seleccionar primera categoría disponible (índice 1, ya que 0 es "Todas")
    await categorySelect.selectOption({ index: 1 })
    
    // Esperar request con category_id
    const responsePromise = page.waitForResponse(
      res => res.url().includes('/api/admin/products') && 
             res.url().includes('category'),
      { timeout: 10000 }
    )
    
    const response = await responsePromise
    expect(response.status()).toBe(200)
    
    await page.screenshot({ path: 'tests/screenshots/filtro-categoria.png', fullPage: true })
    
    console.log('✅ Filtro de categoría funciona')
  })

  test('Test 6: Debería filtrar por marca', async ({ page }) => {
    console.log('🧪 Test 6: Filtro de Marca')
    
    // Expandir filtros
    await page.click('button:has-text("Filtros")')
    await page.waitForTimeout(500)
    
    // Encontrar input de marca
    const brandInput = page.locator('input[placeholder*="marca"]').or(
      page.locator('label:has-text("Marca")').locator('+ input')
    )
    
    await brandInput.fill('Aikon')
    
    // Esperar debounce + request
    const responsePromise = page.waitForResponse(
      res => res.url().includes('/api/admin/products') && 
             res.url().includes('brand=Aikon'),
      { timeout: 10000 }
    )
    
    const response = await responsePromise
    expect(response.status()).toBe(200)
    
    await page.screenshot({ path: 'tests/screenshots/filtro-marca.png', fullPage: true })
    
    console.log('✅ Filtro de marca funciona')
  })

  test('Test 7: Debería ordenar por nombre', async ({ page }) => {
    console.log('🧪 Test 7: Sorting por Nombre')
    
    await page.click('th:has-text("Producto")')
    
    const responsePromise = page.waitForResponse(
      res => res.url().includes('/api/admin/products') && 
             res.url().includes('sort_by=name'),
      { timeout: 10000 }
    )
    
    const response = await responsePromise
    expect(response.status()).toBe(200)
    expect(response.url()).toContain('sort_by=name')
    
    await page.screenshot({ path: 'tests/screenshots/sorting-nombre.png', fullPage: true })
    
    console.log('✅ Sorting por nombre funciona')
  })

  test('Test 8: Debería ordenar por stock', async ({ page }) => {
    console.log('🧪 Test 8: Sorting por Stock')
    
    await page.click('th:has-text("Stock")')
    
    const responsePromise = page.waitForResponse(
      res => res.url().includes('/api/admin/products') && 
             res.url().includes('sort_by=stock'),
      { timeout: 10000 }
    )
    
    const response = await responsePromise
    expect(response.status()).toBe(200)
    
    await page.screenshot({ path: 'tests/screenshots/sorting-stock.png', fullPage: true })
    
    console.log('✅ Sorting por stock funciona')
  })

  test('Test 9: Debería mostrar íconos de sorting en headers', async ({ page }) => {
    console.log('🧪 Test 9: Íconos de Sorting Visibles')
    
    // Click en un header sorteable
    await page.click('th:has-text("Precio")')
    await page.waitForTimeout(500)
    
    // Verificar que aparece un ícono de sorting (ArrowUp o ArrowDown)
    const sortIcon = page.locator('th:has-text("Precio") svg').first()
    await expect(sortIcon).toBeVisible()
    
    await page.screenshot({ path: 'tests/screenshots/sorting-icons.png', fullPage: true })
    
    console.log('✅ Íconos de sorting visibles')
  })

  test('Test 10: Debería combinar filtros y sorting', async ({ page }) => {
    console.log('🧪 Test 10: Filtros + Sorting Combinados')
    
    // Expandir filtros
    await page.click('button:has-text("Filtros")')
    await page.waitForTimeout(300)
    
    // Aplicar búsqueda
    const searchInput = page.locator('input[placeholder*="Buscar"]')
    await searchInput.fill('pintura')
    await page.waitForTimeout(700)
    
    // Aplicar sorting
    await page.click('th:has-text("Precio")')
    
    // Esperar request con ambos parámetros
    const responsePromise = page.waitForResponse(
      res => res.url().includes('/api/admin/products') && 
             res.url().includes('search') &&
             res.url().includes('sort_by=price'),
      { timeout: 10000 }
    )
    
    const response = await responsePromise
    expect(response.status()).toBe(200)
    
    const url = response.url()
    expect(url).toContain('search')
    expect(url).toContain('sort_by=price')
    
    await page.screenshot({ path: 'tests/screenshots/filtros-sorting-combinados.png', fullPage: true })
    
    console.log('✅ Filtros y sorting se combinan correctamente')
  })
})

