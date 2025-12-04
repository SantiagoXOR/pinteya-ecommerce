import { test, expect } from '@playwright/test'

/**
 * DIAGNÓSTICO COMPLETO: PANEL DE PRODUCTOS ADMIN
 * 
 * Este test verifica:
 * - Stats cards muestran números correctos
 * - Lista de productos carga correctamente
 * - Filtros de tabs funcionan
 * - Paginación funciona
 * - Cambio de tamaño de página funciona
 */

test.describe('Panel de Productos Admin - Diagnóstico Completo', () => {
  let consoleLogs: string[] = []
  let consoleErrors: string[] = []

  test.beforeEach(async ({ page }) => {
    // Capturar logs de consola
    page.on('console', msg => {
      const text = msg.text()
      consoleLogs.push(`[${msg.type()}] ${text}`)
      console.log(`[BROWSER ${msg.type()}]:`, text)
    })

    // Capturar errores
    page.on('pageerror', error => {
      consoleErrors.push(error.message)
      console.log('[BROWSER ERROR]:', error.message)
    })

    // Navegar al panel de productos
    console.log('\n🔍 Navegando a /admin/products...')
    await page.goto('http://localhost:3000/admin/products', {
      waitUntil: 'networkidle',
      timeout: 30000,
    })

    // Esperar a que cargue el contenido
    await page.waitForTimeout(3000)
  })

  test('1. Estado Inicial - Verificar Elementos del DOM', async ({ page }) => {
    console.log('\n📊 === VERIFICANDO ESTADO INICIAL ===\n')

    // Screenshot inicial
    await page.screenshot({
      path: 'panel-productos-inicial.png',
      fullPage: true,
    })
    console.log('✅ Screenshot inicial guardado')

    // Verificar Stats Cards
    console.log('\n📊 Stats Cards:')
    const statsCards = await page.locator('.border-t-4').count()
    console.log(`  - Cards encontradas: ${statsCards}`)

    try {
      const totalText = await page.locator('text=Total Productos').locator('..').locator('.text-3xl').first().textContent()
      console.log(`  - Total Productos: ${totalText}`)
    } catch (e) {
      console.log('  - Total Productos: NO ENCONTRADO')
    }

    try {
      const activosText = await page.locator('text=Activos').locator('..').locator('.text-3xl').first().textContent()
      console.log(`  - Activos: ${activosText}`)
    } catch (e) {
      console.log('  - Activos: NO ENCONTRADO')
    }

    // Verificar Tabs
    console.log('\n📑 Tabs:')
    const allTab = await page.locator('text=Todos los Productos').isVisible()
    const lowStockTab = await page.locator('text=Stock Bajo').isVisible()
    const outOfStockTab = await page.locator('text=Sin Stock').isVisible()
    console.log(`  - Tab "Todos": ${allTab}`)
    console.log(`  - Tab "Stock Bajo": ${lowStockTab}`)
    console.log(`  - Tab "Sin Stock": ${outOfStockTab}`)

    // Verificar Tabla de Productos
    console.log('\n📋 Tabla de Productos:')
    const rows = await page.locator('table tbody tr').count()
    console.log(`  - Filas en tabla: ${rows}`)

    const images = await page.locator('table tbody img').count()
    console.log(`  - Imágenes: ${images}`)

    if (rows > 0) {
      const firstRow = await page.locator('table tbody tr').first().textContent()
      console.log(`  - Primera fila: ${firstRow?.substring(0, 100)}...`)
    }

    // Verificar Paginación
    console.log('\n📄 Paginación:')
    try {
      const footer = await page.locator('text=/Mostrando .* de .* productos/').textContent()
      console.log(`  - Footer: ${footer}`)
    } catch (e) {
      console.log('  - Footer: NO ENCONTRADO')
    }

    try {
      const pageText = await page.locator('text=/Página .* de .*/').textContent()
      console.log(`  - Página: ${pageText}`)
    } catch (e) {
      console.log('  - Página: NO ENCONTRADO')
    }

    // Logs capturados
    console.log(`\n📝 Logs de consola capturados: ${consoleLogs.length}`)
    console.log(`❌ Errores capturados: ${consoleErrors.length}`)
  })

  test('2. Test Filtro - Tab Stock Bajo', async ({ page }) => {
    console.log('\n🧪 === TESTEANDO FILTRO "STOCK BAJO" ===\n')

    await page.waitForTimeout(2000)

    // Contar productos antes
    const rowsBefore = await page.locator('table tbody tr').count()
    console.log(`📊 Productos ANTES de filtrar: ${rowsBefore}`)

    try {
      const footerBefore = await page.locator('text=/Mostrando .* de .* productos/').textContent()
      console.log(`📊 Footer ANTES: ${footerBefore}`)
    } catch (e) {
      console.log('📊 Footer ANTES: NO ENCONTRADO')
    }

    // Click en tab Stock Bajo
    console.log('\n🖱️  Click en tab "Stock Bajo"...')
    await page.click('text=Stock Bajo')
    await page.waitForTimeout(3000)

    // Screenshot después
    await page.screenshot({
      path: 'panel-productos-stock-bajo.png',
      fullPage: true,
    })
    console.log('✅ Screenshot guardado')

    // Contar productos después
    const rowsAfter = await page.locator('table tbody tr').count()
    console.log(`\n📊 Productos DESPUÉS de filtrar: ${rowsAfter}`)

    try {
      const footerAfter = await page.locator('text=/Mostrando .* de .* productos/').textContent()
      console.log(`📊 Footer DESPUÉS: ${footerAfter}`)
    } catch (e) {
      console.log('📊 Footer DESPUÉS: NO ENCONTRADO')
    }

    // Verificar si hay mensaje "No se encontraron datos"
    const noData = await page.locator('text=/No se encontraron/i').isVisible().catch(() => false)
    console.log(`\n⚠️  Mensaje "No se encontraron datos": ${noData}`)

    console.log(`\n📊 Cambio de productos: ${rowsBefore} → ${rowsAfter}`)
  })

  test('3. Test Paginación - Cambio de Página', async ({ page }) => {
    console.log('\n🧪 === TESTEANDO CAMBIO DE PÁGINA ===\n')

    await page.waitForTimeout(2000)

    // Obtener primer producto de página 1
    let firstProductBefore = ''
    try {
      firstProductBefore = await page.locator('table tbody tr').first().locator('td').nth(1).textContent() || ''
      console.log(`📊 Primer producto PÁGINA 1: ${firstProductBefore.substring(0, 50)}`)
    } catch (e) {
      console.log('📊 No se pudo obtener primer producto')
    }

    // Buscar botón "Siguiente"
    console.log('\n🖱️  Buscando botón "Siguiente" (>)...')
    const nextButton = await page.locator('button:has-text(">")').first()
    const isEnabled = await nextButton.isEnabled()
    console.log(`  - Botón habilitado: ${isEnabled}`)

    if (isEnabled) {
      console.log('🖱️  Click en "Siguiente"...')
      await nextButton.click()
      await page.waitForTimeout(3000)

      // Screenshot página 2
      await page.screenshot({
        path: 'panel-productos-pagina-2.png',
        fullPage: true,
      })
      console.log('✅ Screenshot página 2 guardado')

      // Verificar cambio de página
      try {
        const pageText = await page.locator('text=/Página .* de .*/').textContent()
        console.log(`\n📄 Indicador de página: ${pageText}`)
      } catch (e) {
        console.log('📄 Indicador de página: NO ENCONTRADO')
      }

      // Obtener primer producto de página 2
      let firstProductAfter = ''
      try {
        firstProductAfter = await page.locator('table tbody tr').first().locator('td').nth(1).textContent() || ''
        console.log(`📊 Primer producto PÁGINA 2: ${firstProductAfter.substring(0, 50)}`)
      } catch (e) {
        console.log('📊 No se pudo obtener primer producto de página 2')
      }

      // Comparar
      const changed = firstProductBefore !== firstProductAfter
      console.log(`\n✅ ¿Productos cambiaron?: ${changed}`)
      if (!changed) {
        console.log('❌ PROBLEMA: Los productos NO cambiaron al cambiar de página')
      }
    } else {
      console.log('⚠️  Botón "Siguiente" está deshabilitado')
    }
  })

  test('4. Test Cambio de Tamaño de Página', async ({ page }) => {
    console.log('\n🧪 === TESTEANDO CAMBIO DE TAMAÑO DE PÁGINA ===\n')

    await page.waitForTimeout(2000)

    // Contar filas antes
    const rowsBefore = await page.locator('table tbody tr').count()
    console.log(`📊 Filas ANTES: ${rowsBefore}`)

    // Buscar dropdown de tamaño
    console.log('\n🖱️  Buscando dropdown "Mostrando X"...')
    const dropdowns = await page.locator('select').all()
    console.log(`  - Dropdowns encontrados: ${dropdowns.length}`)

    if (dropdowns.length > 0) {
      const dropdown = dropdowns[0]
      
      // Obtener opciones disponibles
      const options = await dropdown.locator('option').allTextContents()
      console.log(`  - Opciones: ${options.join(', ')}`)

      // Seleccionar 100
      console.log('\n🖱️  Seleccionando "100"...')
      await dropdown.selectOption('100')
      await page.waitForTimeout(3000)

      // Screenshot
      await page.screenshot({
        path: 'panel-productos-100-items.png',
        fullPage: true,
      })
      console.log('✅ Screenshot guardado')

      // Contar filas después
      const rowsAfter = await page.locator('table tbody tr').count()
      console.log(`\n📊 Filas DESPUÉS: ${rowsAfter}`)

      try {
        const footer = await page.locator('text=/Mostrando .* de .* productos/').textContent()
        console.log(`📊 Footer: ${footer}`)
      } catch (e) {
        console.log('📊 Footer: NO ENCONTRADO')
      }

      const changed = rowsAfter !== rowsBefore
      console.log(`\n✅ ¿Cantidad de filas cambió?: ${changed} (${rowsBefore} → ${rowsAfter})`)
      if (!changed || rowsAfter === 20) {
        console.log('❌ PROBLEMA: No se cargaron los 100 productos, sigue mostrando los mismos')
      }
    } else {
      console.log('❌ NO SE ENCONTRÓ dropdown de tamaño de página')
    }
  })

  test('5. Capturar HTML y Generar Reporte', async ({ page }) => {
    console.log('\n📝 === GENERANDO REPORTE FINAL ===\n')

    await page.waitForTimeout(2000)

    // Capturar texto visible
    const visibleText = await page.locator('body').textContent()
    
    // Verificar elementos clave
    const hasStatsCards = visibleText?.includes('Total Productos')
    const hasTabs = visibleText?.includes('Todos los Productos')
    const hasTable = await page.locator('table').isVisible()
    const hasPagination = visibleText?.includes('Mostrando')

    console.log('📊 Elementos encontrados:')
    console.log(`  - Stats Cards: ${hasStatsCards}`)
    console.log(`  - Tabs: ${hasTabs}`)
    console.log(`  - Tabla: ${hasTable}`)
    console.log(`  - Paginación: ${hasPagination}`)

    console.log(`\n📝 Total de logs capturados: ${consoleLogs.length}`)
    console.log(`❌ Total de errores: ${consoleErrors.length}`)

    if (consoleErrors.length > 0) {
      console.log('\n❌ ERRORES ENCONTRADOS:')
      consoleErrors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err}`)
      })
    }

    // Logs importantes
    const importantLogs = consoleLogs.filter(log => 
      log.includes('ProductList') || 
      log.includes('useProductsEnterprise') ||
      log.includes('API Response')
    )
    
    if (importantLogs.length > 0) {
      console.log('\n📝 LOGS IMPORTANTES:')
      importantLogs.slice(0, 10).forEach(log => {
        console.log(`  ${log}`)
      })
    }
  })
})


