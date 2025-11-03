/**
 * DIAGNOSTICO UI/UX - PANEL DE PRODUCTOS
 * 
 * Test completo para diagnosticar funcionalidad del panel admin de productos
 */

import { test, expect } from '@playwright/test'

test.describe('Diagnóstico Panel de Productos', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar al panel de productos
    await page.goto('http://localhost:3000/admin/products')
    // Esperar a que la página cargue completamente
    await page.waitForLoadState('networkidle')
  })

  test('1.1 - Navegación inicial y stats cards', async ({ page }) => {
    console.log('📊 Verificando stats cards...')
    
    // Screenshot inicial
    await page.screenshot({ path: 'diagnostico-inicial.png', fullPage: true })
    
    // Verificar stats cards
    const totalProductos = await page.locator('[data-testid="stat-total-products"]').textContent()
    const activos = await page.locator('[data-testid="stat-active-products"]').textContent()
    const stockBajo = await page.locator('[data-testid="stat-low-stock"]').textContent()
    const sinStock = await page.locator('[data-testid="stat-out-stock"]').textContent()
    
    console.log('Stats Cards:')
    console.log(`  Total: ${totalProductos}`)
    console.log(`  Activos: ${activos}`)
    console.log(`  Stock Bajo: ${stockBajo}`)
    console.log(`  Sin Stock: ${sinStock}`)
    
    expect(totalProductos).toContain('70')
    expect(activos).toContain('70')
    expect(stockBajo).toContain('7')
    expect(sinStock).toContain('0')
  })

  test('1.2 - Test de filtros por tabs', async ({ page }) => {
    console.log('🔍 Probando filtros de tabs...')
    
    // Tab "Todos" - debe mostrar 70
    const badgeTodos = await page.locator('button:has-text("Todos los Productos") .badge').textContent()
    console.log(`  Tab Todos: ${badgeTodos} productos`)
    
    // Click en "Stock Bajo"
    await page.click('button:has-text("Stock Bajo")')
    await page.waitForTimeout(2000)
    await page.screenshot({ path: 'diagnostico-stock-bajo.png', fullPage: true })
    
    const rowsStockBajo = await page.locator('table tbody tr').count()
    console.log(`  Stock Bajo: ${rowsStockBajo} filas en tabla`)
    
    // Click en "Sin Stock"
    await page.click('button:has-text("Sin Stock")')
    await page.waitForTimeout(2000)
    
    const rowsSinStock = await page.locator('table tbody tr').count()
    console.log(`  Sin Stock: ${rowsSinStock} filas en tabla`)
    
    // Volver a "Todos"
    await page.click('button:has-text("Todos los Productos")')
    await page.waitForTimeout(2000)
  })

  test('1.3 - Test de paginación', async ({ page }) => {
    console.log('📄 Probando paginación...')
    
    // Obtener productos de página 1
    const firstProductPage1 = await page.locator('table tbody tr').first().locator('td').nth(1).textContent()
    console.log(`  Página 1 - Primer producto: ${firstProductPage1}`)
    
    // Click en "Siguiente"
    const nextButton = page.locator('[data-testid="pagination-next"]')
    await nextButton.click()
    await page.waitForTimeout(2000)
    
    await page.screenshot({ path: 'diagnostico-pagina-2.png', fullPage: true })
    
    // Obtener productos de página 2
    const firstProductPage2 = await page.locator('table tbody tr').first().locator('td').nth(1).textContent()
    console.log(`  Página 2 - Primer producto: ${firstProductPage2}`)
    
    // Verificar que son diferentes
    expect(firstProductPage1).not.toBe(firstProductPage2)
    console.log('  ✅ Productos son diferentes entre páginas')
  })

  test('1.4 - Verificar búsqueda', async ({ page }) => {
    console.log('🔎 Verificando input de búsqueda...')
    
    // Buscar input de búsqueda
    const searchInput = page.locator('input[type="search"], input[placeholder*="Buscar"], input[placeholder*="buscar"]')
    const searchExists = await searchInput.count() > 0
    
    if (searchExists) {
      console.log('  ✅ Input de búsqueda EXISTE')
      await searchInput.fill('latex')
      await page.waitForTimeout(2000)
      await page.screenshot({ path: 'diagnostico-busqueda.png', fullPage: true })
    } else {
      console.log('  ❌ Input de búsqueda NO EXISTE - Feature faltante')
    }
  })

  test('1.5 - Test crear producto', async ({ page }) => {
    console.log('➕ Probando crear producto...')
    
    // Click en botón "Nuevo"
    await page.click('button:has-text("Nuevo")')
    await page.waitForLoadState('networkidle')
    
    await page.screenshot({ path: 'diagnostico-formulario-nuevo.png', fullPage: true })
    
    // Verificar que navegó a /new
    expect(page.url()).toContain('/admin/products/new')
    console.log('  ✅ Navegación a /new correcta')
    
    // Verificar que el formulario existe
    const form = await page.locator('form').count()
    console.log(`  Formularios encontrados: ${form}`)
  })

  test('1.6 - Test editar producto (CRÍTICO)', async ({ page }) => {
    console.log('✏️ Probando editar producto...')
    
    try {
      // Buscar el botón de menú de acciones (...)
      const actionMenu = page.locator('table tbody tr').first().locator('button').last()
      await actionMenu.click()
      await page.waitForTimeout(1000)
      
      await page.screenshot({ path: 'diagnostico-menu-acciones.png', fullPage: true })
      
      // Click en "Editar"
      await page.click('button:has-text("Editar")')
      await page.waitForTimeout(3000)
      
      await page.screenshot({ path: 'diagnostico-editar-error.png', fullPage: true })
      
      // Capturar URL actual
      const currentUrl = page.url()
      console.log(`  URL después de click Editar: ${currentUrl}`)
      
      // Verificar si hay error en la página
      const hasError = await page.locator('text=/error|Error|500|404/i').count() > 0
      if (hasError) {
        const errorText = await page.locator('text=/error|Error|500|404/i').first().textContent()
        console.log(`  ❌ ERROR ENCONTRADO: ${errorText}`)
      }
      
    } catch (error) {
      console.log(`  ❌ ERROR AL EDITAR: ${error.message}`)
    }
  })

  test('1.7 - Verificar menú de acciones completo', async ({ page }) => {
    console.log('⚙️ Verificando menú de acciones...')
    
    // Abrir menú
    const actionMenu = page.locator('table tbody tr').first().locator('button').last()
    await actionMenu.click()
    await page.waitForTimeout(1000)
    
    // Listar todas las opciones
    const menuItems = await page.locator('[role="menu"] button, .dropdown button, .menu button').allTextContents()
    console.log('  Opciones disponibles:')
    menuItems.forEach(item => console.log(`    - ${item}`))
  })

  test('1.8 - Test operaciones masivas', async ({ page }) => {
    console.log('📦 Verificando operaciones masivas...')
    
    // Buscar checkboxes
    const checkboxes = await page.locator('input[type="checkbox"]').count()
    console.log(`  Checkboxes encontrados: ${checkboxes}`)
    
    if (checkboxes > 0) {
      // Seleccionar primeros 2 productos
      await page.locator('table tbody tr').first().locator('input[type="checkbox"]').check()
      await page.locator('table tbody tr').nth(1).locator('input[type="checkbox"]').check()
      await page.waitForTimeout(1000)
      
      await page.screenshot({ path: 'diagnostico-seleccion-masiva.png', fullPage: true })
      
      // Buscar botón de acciones masivas
      const bulkButton = page.locator('button:has-text("Acciones masivas"), button:has-text("Acciones Masivas")')
      const bulkExists = await bulkButton.count() > 0
      
      if (bulkExists) {
        console.log('  ✅ Botón de acciones masivas EXISTE')
        await bulkButton.click()
        await page.waitForTimeout(1000)
        await page.screenshot({ path: 'diagnostico-acciones-masivas.png', fullPage: true })
      } else {
        console.log('  ❌ Botón de acciones masivas NO ENCONTRADO')
      }
    } else {
      console.log('  ❌ NO hay checkboxes - Feature faltante')
    }
  })

  test('1.9 - Test importar/exportar', async ({ page }) => {
    console.log('📤 Verificando importar/exportar...')
    
    // Buscar botón Exportar
    const exportButton = page.locator('button:has-text("Exportar")')
    const exportExists = await exportButton.count() > 0
    
    if (exportExists) {
      console.log('  ✅ Botón Exportar EXISTE')
      await exportButton.click()
      await page.waitForTimeout(1000)
      await page.screenshot({ path: 'diagnostico-exportar.png', fullPage: true })
      
      // Verificar opciones
      const hasCSV = await page.locator('text=/CSV/i').count() > 0
      const hasExcel = await page.locator('text=/Excel|XLSX/i').count() > 0
      const hasJSON = await page.locator('text=/JSON/i').count() > 0
      
      console.log(`    - CSV: ${hasCSV ? '✅' : '❌'}`)
      console.log(`    - Excel: ${hasExcel ? '✅' : '❌'}`)
      console.log(`    - JSON: ${hasJSON ? '✅' : '❌'}`)
    } else {
      console.log('  ❌ Botón Exportar NO ENCONTRADO')
    }
    
    // Buscar botón Importar
    const importButton = page.locator('button:has-text("Importar")')
    const importExists = await importButton.count() > 0
    console.log(`  Botón Importar: ${importExists ? '✅ EXISTE' : '❌ NO ENCONTRADO'}`)
  })
})

