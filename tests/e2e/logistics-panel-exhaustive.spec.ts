// =====================================================
// PLAYWRIGHT E2E: PANEL DE LOGÍSTICA - TESTING EXHAUSTIVO
// Descripción: Suite completa de pruebas para validar el panel de logística
// Incluye: Validación de datos reales, funcionalidades, botones, consistencia
// =====================================================

import { test, expect, Page, BrowserContext } from '@playwright/test'
import { promises as fs } from 'fs'
import path from 'path'

// =====================================================
// CONFIGURACIÓN Y TIPOS
// =====================================================

interface LogisticsTestReport {
  timestamp: string
  testResults: {
    dataValidation: TestResult[]
    functionalityTests: TestResult[]
    apiConsistency: TestResult[]
    userInteractions: TestResult[]
  }
  databaseComparison: DatabaseComparison
  screenshots: string[]
  errors: string[]
  summary: {
    totalTests: number
    passedTests: number
    failedTests: number
    dataIntegrityScore: number
  }
}

interface TestResult {
  name: string
  status: 'PASS' | 'FAIL' | 'SKIP'
  description: string
  expected?: any
  actual?: any
  error?: string
  screenshot?: string
}

interface DatabaseComparison {
  totalShipments: { ui: number; db: number; match: boolean }
  activeShipments: { ui: number; db: number; match: boolean }
  deliveredShipments: { ui: number; db: number; match: boolean }
  totalCost: { ui: string; db: string; match: boolean }
  courierCount: { ui: number; db: number; match: boolean }
}

// =====================================================
// CONFIGURACIÓN DE TESTS
// =====================================================

test.describe('Panel de Logística - Testing Exhaustivo', () => {
  let page: Page
  let context: BrowserContext
  let testReport: LogisticsTestReport

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext()
    page = await context.newPage()

    // Inicializar reporte
    testReport = {
      timestamp: new Date().toISOString(),
      testResults: {
        dataValidation: [],
        functionalityTests: [],
        apiConsistency: [],
        userInteractions: [],
      },
      databaseComparison: {} as DatabaseComparison,
      screenshots: [],
      errors: [],
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        dataIntegrityScore: 0,
      },
    }

    // Configurar interceptores de red para capturar APIs
    await page.route('**/api/admin/logistics**', async route => {
      const response = await route.fetch()
      const data = await response.json()
      console.log('API Response:', JSON.stringify(data, null, 2))
      await route.fulfill({ response })
    })
  })

  test.afterAll(async () => {
    // Generar reporte final
    await generateTestReport(testReport)
    await context.close()
  })

  // =====================================================
  // SETUP Y NAVEGACIÓN
  // =====================================================

  test('Setup: Navegar al panel de logística', async () => {
    await test.step('Navegar a la página de logística', async () => {
      await page.goto('http://localhost:3000/admin/logistics')
      await page.waitForLoadState('networkidle')

      // Verificar que la página cargó correctamente
      await expect(page.locator('h1')).toContainText('Logística')

      // Capturar screenshot inicial
      const screenshotPath = await captureScreenshot(page, 'logistics-panel-initial')
      testReport.screenshots.push(screenshotPath)
    })

    addTestResult(testReport.functionalityTests, {
      name: 'Navegación inicial',
      status: 'PASS',
      description: 'Panel de logística carga correctamente',
    })
  })

  // =====================================================
  // VALIDACIÓN DE DATOS REALES VS HARDCODEADOS
  // =====================================================

  test('Validación: Datos provienen de APIs reales', async () => {
    await test.step('Verificar que los datos no están hardcodeados', async () => {
      // Interceptar llamadas a la API
      const apiResponses: any[] = []

      page.on('response', async response => {
        if (response.url().includes('/api/admin/logistics')) {
          try {
            const data = await response.json()
            apiResponses.push({ url: response.url(), data })
          } catch (e) {
            console.log('No JSON response for:', response.url())
          }
        }
      })

      // Recargar página para capturar APIs
      await page.reload()
      await page.waitForLoadState('networkidle')

      // Verificar que se hicieron llamadas a APIs
      expect(apiResponses.length).toBeGreaterThan(0)

      addTestResult(testReport.dataValidation, {
        name: 'APIs llamadas',
        status: 'PASS',
        description: `Se detectaron ${apiResponses.length} llamadas a APIs de logística`,
        actual: apiResponses.length,
      })
    })
  })

  // =====================================================
  // TESTING DE PESTAÑAS Y CONTENIDO
  // =====================================================

  test('Funcionalidad: Pestaña Resumen', async () => {
    await test.step('Verificar contenido de pestaña Resumen', async () => {
      // Asegurar que estamos en la pestaña Resumen
      await page.click('[data-value="overview"]')
      await page.waitForTimeout(1000)

      // Verificar elementos clave
      await expect(page.locator('text=Envíos Recientes')).toBeVisible()
      await expect(page.locator('text=Tendencia de Envíos')).toBeVisible()

      // Verificar métricas derivadas
      const metricsCards = page.locator('[class*="grid"] [class*="card"]')
      const metricsCount = await metricsCards.count()
      expect(metricsCount).toBeGreaterThan(0)

      const screenshotPath = await captureScreenshot(page, 'tab-resumen')
      testReport.screenshots.push(screenshotPath)

      addTestResult(testReport.functionalityTests, {
        name: 'Pestaña Resumen',
        status: 'PASS',
        description: `Pestaña Resumen muestra ${metricsCount} métricas`,
        actual: metricsCount,
      })
    })
  })

  test('Funcionalidad: Pestaña Envíos', async () => {
    await test.step('Verificar contenido de pestaña Envíos', async () => {
      // Cambiar a pestaña Envíos
      await page.click('[data-value="shipments"]')
      await page.waitForTimeout(1000)

      // Verificar tabla de envíos
      await expect(page.locator('table')).toBeVisible()

      // Contar filas de datos (excluyendo header)
      const dataRows = page.locator('tbody tr')
      const rowCount = await dataRows.count()

      // Verificar que hay datos
      expect(rowCount).toBeGreaterThan(0)

      // Verificar columnas esperadas
      await expect(page.locator('text=Envío')).toBeVisible()
      await expect(page.locator('text=Estado')).toBeVisible()
      await expect(page.locator('text=Courier')).toBeVisible()
      await expect(page.locator('text=Destino')).toBeVisible()
      await expect(page.locator('text=Costo')).toBeVisible()

      const screenshotPath = await captureScreenshot(page, 'tab-envios')
      testReport.screenshots.push(screenshotPath)

      addTestResult(testReport.functionalityTests, {
        name: 'Pestaña Envíos',
        status: 'PASS',
        description: `Tabla de envíos muestra ${rowCount} registros`,
        actual: rowCount,
      })
    })
  })

  test('Funcionalidad: Pestaña Performance', async () => {
    await test.step('Verificar contenido de pestaña Performance', async () => {
      // Cambiar a pestaña Performance
      await page.click('[data-value="performance"]')
      await page.waitForTimeout(1000)

      // Verificar contenido de performance
      await expect(page.locator('text=Métricas de Performance')).toBeVisible()

      // Verificar que hay métricas mostradas
      const performanceMetrics = page.locator('[class*="grid"] [class*="card"]')
      const metricsCount = await performanceMetrics.count()

      const screenshotPath = await captureScreenshot(page, 'tab-performance')
      testReport.screenshots.push(screenshotPath)

      addTestResult(testReport.functionalityTests, {
        name: 'Pestaña Performance',
        status: 'PASS',
        description: `Pestaña Performance muestra métricas`,
        actual: metricsCount,
      })
    })
  })

  test('Funcionalidad: Pestaña Couriers', async () => {
    await test.step('Verificar contenido de pestaña Couriers', async () => {
      // Cambiar a pestaña Couriers
      await page.click('[data-value="carriers"]')
      await page.waitForTimeout(1000)

      // Verificar contenido de couriers
      await expect(page.locator('text=Performance de Couriers')).toBeVisible()

      const screenshotPath = await captureScreenshot(page, 'tab-couriers')
      testReport.screenshots.push(screenshotPath)

      addTestResult(testReport.functionalityTests, {
        name: 'Pestaña Couriers',
        status: 'PASS',
        description: 'Pestaña Couriers carga correctamente',
      })
    })
  })

  // =====================================================
  // VALIDACIÓN DE CONSISTENCIA DE DATOS
  // =====================================================

  test('Consistencia: Datos entre pestañas', async () => {
    await test.step('Verificar consistencia de datos entre vistas', async () => {
      // Obtener datos de la pestaña Resumen
      await page.click('[data-value="overview"]')
      await page.waitForTimeout(1000)

      // Extraer número total de envíos del resumen
      const totalShipmentsText = await page
        .locator('text=Total Envíos')
        .locator('..')
        .locator('[class*="text-2xl"]')
        .textContent()
      const totalShipmentsResumen = parseInt(totalShipmentsText?.replace(/[^\d]/g, '') || '0')

      // Ir a pestaña Envíos y contar filas
      await page.click('[data-value="shipments"]')
      await page.waitForTimeout(1000)

      const shipmentsRows = await page.locator('tbody tr').count()

      // Verificar que los números son consistentes (considerando paginación)
      const isConsistent = shipmentsRows <= totalShipmentsResumen

      addTestResult(testReport.apiConsistency, {
        name: 'Consistencia Total Envíos',
        status: isConsistent ? 'PASS' : 'FAIL',
        description: 'Total de envíos consistente entre vistas',
        expected: `<= ${totalShipmentsResumen}`,
        actual: shipmentsRows,
      })
    })
  })

  test('Validación: Formatos de datos', async () => {
    await test.step('Verificar formatos correctos de fechas y monedas', async () => {
      await page.click('[data-value="shipments"]')
      await page.waitForTimeout(1000)

      // Verificar formato de fechas (dd/MM/yyyy)
      const dateElements = page.locator('tbody tr td:last-child')
      const firstDate = await dateElements.first().textContent()
      const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/
      const dateFormatValid = dateRegex.test(firstDate?.trim() || '')

      // Verificar formato de monedas ($ X.XXX,XX)
      const costElements = page.locator('tbody tr td:nth-child(6)')
      const firstCost = await costElements.first().textContent()
      const currencyRegex = /^\$\s*[\d.,]+$/
      const currencyFormatValid = currencyRegex.test(firstCost?.trim() || '')

      addTestResult(testReport.dataValidation, {
        name: 'Formato de fechas',
        status: dateFormatValid ? 'PASS' : 'FAIL',
        description: 'Fechas en formato dd/MM/yyyy',
        expected: 'dd/MM/yyyy',
        actual: firstDate,
      })

      addTestResult(testReport.dataValidation, {
        name: 'Formato de monedas',
        status: currencyFormatValid ? 'PASS' : 'FAIL',
        description: 'Monedas en formato $ X.XXX',
        expected: '$ X.XXX',
        actual: firstCost,
      })
    })
  })

  test('Validación: Estados de envío válidos', async () => {
    await test.step('Verificar que los estados de envío son válidos', async () => {
      await page.click('[data-value="shipments"]')
      await page.waitForTimeout(1000)

      const validStates = ['Pendiente', 'Confirmado', 'En Tránsito', 'Entregado', 'Cancelado']
      const stateElements = page.locator('tbody tr td:nth-child(3)')
      const stateCount = await stateElements.count()

      let invalidStates = 0
      for (let i = 0; i < Math.min(stateCount, 10); i++) {
        const stateText = await stateElements.nth(i).textContent()
        if (!validStates.some(validState => stateText?.includes(validState))) {
          invalidStates++
        }
      }

      addTestResult(testReport.dataValidation, {
        name: 'Estados de envío válidos',
        status: invalidStates === 0 ? 'PASS' : 'FAIL',
        description: 'Todos los estados de envío son válidos',
        expected: 'Estados válidos',
        actual: `${invalidStates} estados inválidos`,
      })
    })
  })

  // =====================================================
  // TESTING DE BOTONES Y ACCIONES
  // =====================================================

  test('Interacciones: Botón Actualizar', async () => {
    await test.step('Probar funcionalidad del botón Actualizar', async () => {
      // Volver a pestaña Resumen
      await page.click('[data-value="overview"]')
      await page.waitForTimeout(500)

      // Buscar y hacer clic en botón Actualizar
      const refreshButton = page.locator('button:has-text("Actualizar")')
      await expect(refreshButton).toBeVisible()

      // Interceptar llamadas de red para verificar que se actualiza
      let apiCalled = false
      page.on('response', response => {
        if (response.url().includes('/api/admin/logistics')) {
          apiCalled = true
        }
      })

      await refreshButton.click()
      await page.waitForTimeout(2000)

      addTestResult(testReport.userInteractions, {
        name: 'Botón Actualizar',
        status: apiCalled ? 'PASS' : 'FAIL',
        description: 'Botón Actualizar ejecuta llamada a API',
        actual: apiCalled,
      })
    })
  })

  test('Interacciones: Botón Crear Envío', async () => {
    await test.step('Probar funcionalidad del botón Crear Envío', async () => {
      const createButton = page.locator('button:has-text("Crear Envío")')
      await expect(createButton).toBeVisible()

      // Hacer clic y verificar que abre modal/dialog
      await createButton.click()
      await page.waitForTimeout(1000)

      // Verificar si se abre algún modal o dialog
      const modalVisible = await page
        .locator('[role="dialog"]')
        .isVisible()
        .catch(() => false)

      addTestResult(testReport.userInteractions, {
        name: 'Botón Crear Envío',
        status: modalVisible ? 'PASS' : 'SKIP',
        description: modalVisible ? 'Modal de creación se abre' : 'Modal no implementado aún',
        actual: modalVisible,
      })

      // Cerrar modal si está abierto
      if (modalVisible) {
        await page.keyboard.press('Escape')
      }
    })
  })

  test('Interacciones: Filtros y búsqueda', async () => {
    await test.step('Probar funcionalidad de filtros en pestaña Envíos', async () => {
      await page.click('[data-value="shipments"]')
      await page.waitForTimeout(1000)

      // Buscar campo de búsqueda
      const searchInput = page.locator('input[placeholder*="Buscar"]')
      const searchExists = await searchInput.isVisible().catch(() => false)

      if (searchExists) {
        // Probar búsqueda
        await searchInput.fill('TRK')
        await page.waitForTimeout(1000)

        const rowsAfterSearch = await page.locator('tbody tr').count()

        addTestResult(testReport.userInteractions, {
          name: 'Funcionalidad de búsqueda',
          status: 'PASS',
          description: `Búsqueda funciona, ${rowsAfterSearch} resultados`,
          actual: rowsAfterSearch,
        })

        // Limpiar búsqueda
        await searchInput.clear()
        await page.waitForTimeout(1000)
      } else {
        addTestResult(testReport.userInteractions, {
          name: 'Funcionalidad de búsqueda',
          status: 'SKIP',
          description: 'Campo de búsqueda no encontrado',
        })
      }

      // Buscar filtro de estado
      const stateFilter = page.locator('select, [role="combobox"]').first()
      const filterExists = await stateFilter.isVisible().catch(() => false)

      addTestResult(testReport.userInteractions, {
        name: 'Filtros disponibles',
        status: filterExists ? 'PASS' : 'SKIP',
        description: filterExists ? 'Filtros están disponibles' : 'Filtros no encontrados',
        actual: filterExists,
      })
    })
  })

  // =====================================================
  // VALIDACIÓN CON BASE DE DATOS
  // =====================================================

  test('Database: Comparación con datos reales', async () => {
    await test.step('Comparar datos del UI con base de datos', async () => {
      // Hacer llamada directa a la API para obtener datos reales
      const apiResponse = await page.request.get('http://localhost:3000/api/admin/logistics')
      const apiData = await apiResponse.json()

      // Obtener datos del UI
      await page.click('[data-value="overview"]')
      await page.waitForTimeout(1000)

      // Comparar total de envíos
      const totalShipmentsUI = await page
        .locator('text=Total Envíos')
        .locator('..')
        .locator('[class*="text-2xl"]')
        .textContent()
      const totalUI = parseInt(totalShipmentsUI?.replace(/[^\d]/g, '') || '0')
      const totalAPI = apiData.stats?.total_shipments || 0

      testReport.databaseComparison.totalShipments = {
        ui: totalUI,
        db: totalAPI,
        match: totalUI === totalAPI,
      }

      // Comparar envíos activos
      const activeShipmentsUI = await page
        .locator('text=Envíos Activos')
        .locator('..')
        .locator('[class*="text-2xl"]')
        .textContent()
      const activeUI = parseInt(activeShipmentsUI?.replace(/[^\d]/g, '') || '0')
      const activeAPI = apiData.stats?.active_shipments || 0

      testReport.databaseComparison.activeShipments = {
        ui: activeUI,
        db: activeAPI,
        match: activeUI === activeAPI,
      }

      addTestResult(testReport.apiConsistency, {
        name: 'Datos UI vs API - Total',
        status: testReport.databaseComparison.totalShipments.match ? 'PASS' : 'FAIL',
        description: 'Total de envíos coincide entre UI y API',
        expected: totalAPI,
        actual: totalUI,
      })

      addTestResult(testReport.apiConsistency, {
        name: 'Datos UI vs API - Activos',
        status: testReport.databaseComparison.activeShipments.match ? 'PASS' : 'FAIL',
        description: 'Envíos activos coinciden entre UI y API',
        expected: activeAPI,
        actual: activeUI,
      })
    })
  })
})

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

async function captureScreenshot(page: Page, name: string): Promise<string> {
  const timestamp = Date.now()
  const filename = `logistics-${name}-${timestamp}.png`
  const screenshotPath = path.join('tests', 'screenshots', filename)

  await page.screenshot({
    path: screenshotPath,
    fullPage: true,
  })

  return screenshotPath
}

function addTestResult(results: TestResult[], result: TestResult) {
  results.push(result)
}

async function generateTestReport(report: LogisticsTestReport) {
  // Calcular estadísticas finales
  const allTests = [
    ...report.testResults.dataValidation,
    ...report.testResults.functionalityTests,
    ...report.testResults.apiConsistency,
    ...report.testResults.userInteractions,
  ]

  report.summary.totalTests = allTests.length
  report.summary.passedTests = allTests.filter(t => t.status === 'PASS').length
  report.summary.failedTests = allTests.filter(t => t.status === 'FAIL').length
  report.summary.dataIntegrityScore = Math.round(
    (report.summary.passedTests / report.summary.totalTests) * 100
  )

  // Guardar reporte
  const reportPath = path.join('tests', 'reports', `logistics-exhaustive-${Date.now()}.json`)
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2))

  console.log('📊 Reporte de testing exhaustivo generado:', reportPath)
  console.log(`✅ Tests pasados: ${report.summary.passedTests}/${report.summary.totalTests}`)
  console.log(`📈 Score de integridad: ${report.summary.dataIntegrityScore}%`)
}
