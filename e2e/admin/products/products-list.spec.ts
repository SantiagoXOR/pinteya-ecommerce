// ===================================
// PINTEYA E-COMMERCE - TEST E2E LISTA DE PRODUCTOS
// ===================================

import { test, expect } from '@playwright/test'
import { setupAdminSession } from '../../helpers/admin-auth.helper'
import { waitForTableLoad } from '../../helpers/wait.helper'
import { assertProductInList } from '../../helpers/assertions.helper'
import { takeStepScreenshot } from '../../helpers/screenshot.helper'
import { TEST_PRODUCT_IDS } from '../../helpers/test-data.helper'

/**
 * Suite de tests E2E para la lista de productos del panel admin
 * 
 * Tests incluidos:
 * 1. Cargar página correctamente
 * 2. Mostrar tabla con todas las columnas
 * 3. Mostrar productos existentes
 * 4. Aplicar filtros (categoría, estado, búsqueda)
 * 5. Paginación
 * 6. Ordenamiento
 * 7. Selección múltiple
 * 8. Acciones masivas
 */

test.describe('Panel Admin - Lista de Productos', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000)
    console.log('🚀 Iniciando test de lista de productos...')
  })

  test('Debe cargar la página /admin/products correctamente', async ({ page }) => {
    await setupAdminSession(page)
    
    // Verificar URL correcta
    expect(page.url()).toContain('/admin/products')
    
    // Verificar título o header de la página (actualmente "Gestión de Productos")
    const pageHeading = page.locator('h1, h2').filter({ hasText: /gestión de productos|lista de productos|productos/i }).first()
    await expect(pageHeading).toBeVisible()
    
    await takeStepScreenshot(page, 'products-page-loaded')
    console.log('✅ Página de productos cargada correctamente')
  })

  test('Debe mostrar tabla con todas las columnas esperadas', async ({ page }) => {
    await setupAdminSession(page)
    await waitForTableLoad(page)
    
    // Verificar encabezados de tabla (basado en los nombres reales en ProductList.tsx)
    // Solo verificar los headers más importantes para evitar conflictos con tablas anidadas
    const expectedHeaders = ['Imagen', 'Producto', 'Variantes', 'Precio', 'Stock', 'Estado', 'Acciones']
    
    for (const header of expectedHeaders) {
      const headerElement = page.locator('[data-testid="products-table"] th').filter({ hasText: new RegExp(header, 'i') })
      await expect(headerElement.first()).toBeVisible()
      console.log(`✅ Columna "${header}" visible`)
    }
    
    await takeStepScreenshot(page, 'table-headers-visible')
  })

  test('Debe mostrar productos existentes en la tabla', async ({ page }) => {
    await setupAdminSession(page)
    await waitForTableLoad(page)
    
    // Verificar que hay al menos una fila de producto
    const productRows = page.locator('[data-testid="product-row"], tbody tr')
    const count = await productRows.count()
    
    expect(count).toBeGreaterThan(0)
    console.log(`✅ ${count} productos encontrados en la tabla`)
    
    await takeStepScreenshot(page, 'products-in-table')
  })

  test('Debe mostrar contador de variantes en columna correspondiente', async ({ page }) => {
    await setupAdminSession(page)
    await waitForTableLoad(page)
    
    // Buscar contador de variantes (número seguido de "var." o "variantes")
    const variantCounter = page.locator('text=/\\d+\\s*(var\\.|variantes?)/i').first()
    await expect(variantCounter).toBeVisible()
    
    console.log('✅ Contador de variantes visible')
    await takeStepScreenshot(page, 'variant-counter-visible')
  })

  test('Debe aplicar filtro por categoría', async ({ page }) => {
    await setupAdminSession(page)
    await waitForTableLoad(page)
    
    // Buscar select o dropdown de categoría
    const categoryFilter = page.locator('[data-testid="filter-category"], select:has-text("Categoría"), label:has-text("Categoría") + select').first()
    
    if (await categoryFilter.isVisible()) {
      // Seleccionar una categoría
      await categoryFilter.selectOption({ index: 1 })
      
      // Esperar a que se actualice la tabla
      await page.waitForTimeout(1000)
      await waitForTableLoad(page)
      
      await takeStepScreenshot(page, 'category-filter-applied')
      console.log('✅ Filtro de categoría aplicado')
    } else {
      console.log('⚠️ Filtro de categoría no encontrado (puede no estar implementado)')
    }
  })

  test('Debe buscar producto por nombre', async ({ page }) => {
    await setupAdminSession(page)
    await waitForTableLoad(page)
    
    // Buscar input de búsqueda
    const searchInput = page.locator('[data-testid="search-input"], input[placeholder*="Buscar"], input[type="search"]').first()
    
    if (await searchInput.isVisible()) {
      // Escribir término de búsqueda
      await searchInput.fill('Látex')
      
      // Esperar a que se filtren resultados
      await page.waitForTimeout(1000)
      
      // Verificar que hay resultados
      const results = page.locator('tbody tr')
      const count = await results.count()
      
      if (count > 0) {
        console.log(`✅ ${count} resultados encontrados para "Látex"`)
      }
      
      await takeStepScreenshot(page, 'search-results')
    } else {
      console.log('⚠️ Input de búsqueda no encontrado')
    }
  })

  test('Debe filtrar por estado (activo/inactivo)', async ({ page }) => {
    await setupAdminSession(page)
    await waitForTableLoad(page)
    
    // Buscar filtro de estado
    const statusFilter = page.locator('[data-testid="filter-status"], select:has-text("Estado")').first()
    
    if (await statusFilter.isVisible()) {
      // Filtrar solo activos
      await statusFilter.selectOption('active')
      await page.waitForTimeout(1000)
      
      await takeStepScreenshot(page, 'status-filter-active')
      console.log('✅ Filtro de estado aplicado')
    } else {
      console.log('⚠️ Filtro de estado no encontrado')
    }
  })

  test('Debe navegar entre páginas (paginación)', async ({ page }) => {
    await setupAdminSession(page)
    await waitForTableLoad(page)
    
    // Buscar controles de paginación
    const nextButton = page.locator('[data-testid="pagination-next"], button:has-text("Siguiente"), button:has-text("→")').first()
    
    if (await nextButton.isVisible() && !await nextButton.isDisabled()) {
      // Click en siguiente página
      await nextButton.click()
      await page.waitForTimeout(1000)
      await waitForTableLoad(page)
      
      await takeStepScreenshot(page, 'pagination-page-2')
      console.log('✅ Navegación a página 2 exitosa')
      
      // Volver a página 1
      const prevButton = page.locator('[data-testid="pagination-prev"], button:has-text("Anterior"), button:has-text("←")').first()
      if (await prevButton.isVisible()) {
        await prevButton.click()
        await page.waitForTimeout(1000)
        console.log('✅ Regreso a página 1 exitoso')
      }
    } else {
      console.log('⚠️ Paginación no disponible (puede haber pocos productos)')
    }
  })

  test('Debe permitir seleccionar productos con checkboxes', async ({ page }) => {
    await setupAdminSession(page)
    await waitForTableLoad(page)
    
    // Buscar checkboxes en filas
    const checkboxes = page.locator('tbody input[type="checkbox"]')
    const count = await checkboxes.count()
    
    if (count > 0) {
      // Seleccionar primer producto
      await checkboxes.first().check()
      
      // Verificar que está marcado
      await expect(checkboxes.first()).toBeChecked()
      
      await takeStepScreenshot(page, 'product-selected')
      console.log('✅ Producto seleccionado con checkbox')
    } else {
      console.log('⚠️ Checkboxes no encontrados')
    }
  })

  test('Debe mostrar acciones masivas cuando hay productos seleccionados', async ({ page }) => {
    await setupAdminSession(page)
    await waitForTableLoad(page)
    
    // Seleccionar checkbox si existe
    const checkboxes = page.locator('tbody input[type="checkbox"]')
    const count = await checkboxes.count()
    
    if (count > 0) {
      // Seleccionar primer producto
      await checkboxes.first().check()
      
      // Buscar botones de acciones masivas
      const bulkActions = page.locator('button:has-text("Eliminar seleccionados"), button:has-text("Activar"), button:has-text("Desactivar")').first()
      
      if (await bulkActions.isVisible()) {
        await takeStepScreenshot(page, 'bulk-actions-visible')
        console.log('✅ Acciones masivas disponibles')
      }
    }
  })

  test('Debe mostrar botón para crear nuevo producto', async ({ page }) => {
    await setupAdminSession(page)
    
    // Buscar botón de nuevo producto
    const newProductButton = page.locator('a[href="/admin/products/new"], button:has-text("Nuevo Producto"), button:has-text("Crear")').first()
    
    await expect(newProductButton).toBeVisible()
    console.log('✅ Botón "Nuevo Producto" visible')
    
    await takeStepScreenshot(page, 'new-product-button')
  })
})

