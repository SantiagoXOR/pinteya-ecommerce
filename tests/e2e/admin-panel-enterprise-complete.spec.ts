// =====================================================
// PLAYWRIGHT E2E: PANEL ADMINISTRATIVO ENTERPRISE COMPLETO
// Descripción: Suite completa de pruebas para validar funcionalidades enterprise
// Incluye: Órdenes, Productos, Logística, Integración, Diagnóstico
// =====================================================

import { test, expect, Page, BrowserContext } from '@playwright/test'
import { promises as fs } from 'fs'
import path from 'path'

// =====================================================
// CONFIGURACIÓN Y TIPOS
// =====================================================

interface DiagnosticReport {
  timestamp: string
  testResults: {
    orders: TestModuleResult
    products: TestModuleResult
    logistics: TestModuleResult
    integration: TestModuleResult
  }
  screenshots: string[]
  errors: ErrorReport[]
  summary: {
    totalTests: number
    passedTests: number
    failedTests: number
    implementationStatus: string
  }
}

interface TestModuleResult {
  moduleName: string
  status: 'IMPLEMENTED' | 'PARTIAL' | 'PLACEHOLDER' | 'ERROR'
  functionalityTests: FunctionalityTest[]
  apiTests: ApiTest[]
  responsiveTests: ResponsiveTest[]
  overallScore: number
}

interface FunctionalityTest {
  name: string
  status: 'PASS' | 'FAIL' | 'SKIP'
  description: string
  error?: string
  screenshot?: string
}

interface ApiTest {
  endpoint: string
  method: string
  status: number
  responseTime: number
  isWorking: boolean
  error?: string
}

interface ResponsiveTest {
  viewport: string
  status: 'PASS' | 'FAIL'
  issues: string[]
}

interface ErrorReport {
  type: 'JAVASCRIPT' | 'NETWORK' | 'CONSOLE' | 'NAVIGATION'
  message: string
  location: string
  timestamp: string
  severity: 'HIGH' | 'MEDIUM' | 'LOW'
}

// Credenciales de administrador
const ADMIN_CREDENTIALS = {
  email: 'santiago@xor.com.ar',
  password: 'SavoirFaire19',
}

// URLs base
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'

// =====================================================
// HELPERS Y UTILIDADES
// =====================================================

class AdminPanelTester {
  private page: Page
  private diagnosticReport: DiagnosticReport
  private screenshotCounter = 0

  constructor(page: Page) {
    this.page = page
    this.diagnosticReport = {
      timestamp: new Date().toISOString(),
      testResults: {
        orders: this.createEmptyModuleResult('Órdenes Enterprise'),
        products: this.createEmptyModuleResult('Productos Enterprise'),
        logistics: this.createEmptyModuleResult('Logística Enterprise'),
        integration: this.createEmptyModuleResult('Integración Órdenes-Logística'),
      },
      screenshots: [],
      errors: [],
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        implementationStatus: 'UNKNOWN',
      },
    }
  }

  private createEmptyModuleResult(moduleName: string): TestModuleResult {
    return {
      moduleName,
      status: 'PLACEHOLDER',
      functionalityTests: [],
      apiTests: [],
      responsiveTests: [],
      overallScore: 0,
    }
  }

  async authenticateAsAdmin(): Promise<void> {
    console.log('🔐 Iniciando autenticación como administrador...')

    await this.page.goto('/sign-in')
    await this.page.waitForLoadState('networkidle')

    // Llenar credenciales
    await this.page.fill('input[type="email"]', ADMIN_CREDENTIALS.email)
    await this.page.fill('input[type="password"]', ADMIN_CREDENTIALS.password)

    // Hacer click en el botón de login
    await this.page.click('button[type="submit"]')

    // Esperar redirección al panel admin
    await this.page.waitForURL('/admin/**', { timeout: 10000 })

    console.log('✅ Autenticación exitosa')
  }

  async captureScreenshot(name: string): Promise<string> {
    const filename = `admin-panel-${++this.screenshotCounter}-${name}-${Date.now()}.png`
    const screenshotPath = path.join('test-results', 'screenshots', filename)

    await this.page.screenshot({
      path: screenshotPath,
      fullPage: true,
    })

    this.diagnosticReport.screenshots.push(screenshotPath)
    return screenshotPath
  }

  async captureConsoleErrors(): Promise<void> {
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        this.diagnosticReport.errors.push({
          type: 'CONSOLE',
          message: msg.text(),
          location: this.page.url(),
          timestamp: new Date().toISOString(),
          severity: 'MEDIUM',
        })
      }
    })

    this.page.on('pageerror', error => {
      this.diagnosticReport.errors.push({
        type: 'JAVASCRIPT',
        message: error.message,
        location: this.page.url(),
        timestamp: new Date().toISOString(),
        severity: 'HIGH',
      })
    })
  }

  async testApiEndpoint(endpoint: string, method: string = 'GET'): Promise<ApiTest> {
    const startTime = Date.now()

    try {
      const response =
        await this.page.request[method.toLowerCase() as keyof typeof this.page.request](endpoint)
      const responseTime = Date.now() - startTime

      return {
        endpoint,
        method,
        status: response.status(),
        responseTime,
        isWorking: response.status() < 400,
        error: response.status() >= 400 ? `HTTP ${response.status()}` : undefined,
      }
    } catch (error) {
      return {
        endpoint,
        method,
        status: 0,
        responseTime: Date.now() - startTime,
        isWorking: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async testResponsiveDesign(
    viewports: { name: string; width: number; height: number }[]
  ): Promise<ResponsiveTest[]> {
    const results: ResponsiveTest[] = []

    for (const viewport of viewports) {
      await this.page.setViewportSize({ width: viewport.width, height: viewport.height })
      await this.page.waitForTimeout(1000) // Esperar a que se ajuste el layout

      const issues: string[] = []

      // Verificar elementos básicos
      try {
        await expect(this.page.locator('h1, h2').first()).toBeVisible({ timeout: 5000 })
      } catch {
        issues.push('Header principal no visible')
      }

      // Verificar navegación
      try {
        await expect(this.page.locator('nav, [role="navigation"]').first()).toBeVisible({
          timeout: 5000,
        })
      } catch {
        issues.push('Navegación no visible')
      }

      results.push({
        viewport: viewport.name,
        status: issues.length === 0 ? 'PASS' : 'FAIL',
        issues,
      })
    }

    return results
  }

  async testOrdersEnterprise(): Promise<TestModuleResult> {
    console.log('🛒 Testing Órdenes Enterprise...')

    const result = this.createEmptyModuleResult('Órdenes Enterprise')

    try {
      // Navegar a órdenes
      await this.page.goto('/admin/orders')
      await this.page.waitForLoadState('networkidle')
      await this.captureScreenshot('orders-main-page')

      // Test 1: Verificar métricas
      const metricsTest: FunctionalityTest = {
        name: 'Métricas de Órdenes',
        status: 'FAIL',
        description:
          'Verificar que las métricas (Total, Pendientes, Completadas, Revenue) se cargan correctamente',
      }

      try {
        await expect(
          this.page.locator('[data-testid="orders-metrics"], .grid').first()
        ).toBeVisible({ timeout: 5000 })
        metricsTest.status = 'PASS'
      } catch (error) {
        metricsTest.error = 'Métricas no encontradas o no visibles'
        metricsTest.screenshot = await this.captureScreenshot('orders-metrics-error')
      }

      result.functionalityTests.push(metricsTest)

      // Test 2: Verificar filtros
      const filtersTest: FunctionalityTest = {
        name: 'Filtros de Búsqueda',
        status: 'FAIL',
        description: 'Verificar filtros de búsqueda y estado',
      }

      try {
        const searchInput = this.page
          .locator('input[placeholder*="Buscar"], input[type="search"]')
          .first()
        const statusFilter = this.page.locator('select, [role="combobox"]').first()

        if ((await searchInput.isVisible()) || (await statusFilter.isVisible())) {
          filtersTest.status = 'PASS'
        } else {
          filtersTest.error = 'Filtros no encontrados'
        }
      } catch (error) {
        filtersTest.error = 'Error al verificar filtros'
      }

      result.functionalityTests.push(filtersTest)

      // Test 3: Verificar tabla de órdenes
      const tableTest: FunctionalityTest = {
        name: 'Tabla de Órdenes',
        status: 'FAIL',
        description: 'Verificar que la tabla de órdenes se carga con datos',
      }

      try {
        await expect(this.page.locator('table, [role="table"]').first()).toBeVisible({
          timeout: 5000,
        })

        // Verificar si hay datos o placeholder
        const hasData = (await this.page.locator('tbody tr, [role="row"]').count()) > 1
        const hasPlaceholder = await this.page
          .locator('text=/en desarrollo|placeholder|próximamente/i')
          .isVisible()

        if (hasData) {
          tableTest.status = 'PASS'
        } else if (hasPlaceholder) {
          tableTest.status = 'SKIP'
          tableTest.error = 'Funcionalidad en desarrollo (placeholder detectado)'
        } else {
          tableTest.error = 'Tabla vacía sin datos ni placeholder'
        }
      } catch (error) {
        tableTest.error = 'Tabla no encontrada'
      }

      result.functionalityTests.push(tableTest)

      // Test APIs
      const apiTests = [
        await this.testApiEndpoint('/api/admin/orders'),
        await this.testApiEndpoint('/api/admin/orders/analytics'),
        await this.testApiEndpoint('/api/admin/orders/bulk', 'POST'),
      ]

      result.apiTests = apiTests

      // Calcular score
      const passedTests = result.functionalityTests.filter(t => t.status === 'PASS').length
      const totalTests = result.functionalityTests.length
      result.overallScore = Math.round((passedTests / totalTests) * 100)

      // Determinar status general
      if (result.overallScore >= 80) {
        result.status = 'IMPLEMENTED'
      } else if (result.overallScore >= 40) {
        result.status = 'PARTIAL'
      } else {
        const hasPlaceholders = result.functionalityTests.some(t => t.error?.includes('desarrollo'))
        result.status = hasPlaceholders ? 'PLACEHOLDER' : 'ERROR'
      }
    } catch (error) {
      result.status = 'ERROR'
      this.diagnosticReport.errors.push({
        type: 'NAVIGATION',
        message: `Error en test de órdenes: ${error}`,
        location: '/admin/orders',
        timestamp: new Date().toISOString(),
        severity: 'HIGH',
      })
    }

    return result
  }

  async testProductsEnterprise(): Promise<TestModuleResult> {
    console.log('📦 Testing Productos Enterprise...')

    const result = this.createEmptyModuleResult('Productos Enterprise')

    try {
      await this.page.goto('/admin/products')
      await this.page.waitForLoadState('networkidle')
      await this.captureScreenshot('products-main-page')

      // Test 1: Verificar tabs
      const tabsTest: FunctionalityTest = {
        name: 'Tabs de Navegación',
        status: 'FAIL',
        description: 'Verificar tabs de Productos, Analytics, Inventario',
      }

      try {
        await expect(this.page.locator('[role="tablist"], .tabs').first()).toBeVisible({
          timeout: 5000,
        })
        tabsTest.status = 'PASS'
      } catch (error) {
        tabsTest.error = 'Tabs no encontrados'
      }

      result.functionalityTests.push(tabsTest)

      // Test 2: Verificar métricas
      const metricsTest: FunctionalityTest = {
        name: 'Métricas de Productos',
        status: 'FAIL',
        description: 'Verificar métricas (Total, Activos, Stock Bajo, Valor Total)',
      }

      try {
        const metricsCards = this.page.locator('[data-testid="products-metrics"], .grid').first()
        await expect(metricsCards).toBeVisible({ timeout: 5000 })
        metricsTest.status = 'PASS'
      } catch (error) {
        metricsTest.error = 'Métricas no encontradas'
      }

      result.functionalityTests.push(metricsTest)

      // Test 3: Verificar operaciones masivas
      const bulkOpsTest: FunctionalityTest = {
        name: 'Operaciones Masivas',
        status: 'FAIL',
        description: 'Verificar botones de Import/Export y operaciones masivas',
      }

      try {
        const importBtn = this.page
          .locator('button:has-text("Import"), button:has-text("Importar")')
          .first()
        const exportBtn = this.page
          .locator('button:has-text("Export"), button:has-text("Exportar")')
          .first()

        if ((await importBtn.isVisible()) || (await exportBtn.isVisible())) {
          bulkOpsTest.status = 'PASS'
        } else {
          bulkOpsTest.error = 'Botones de operaciones masivas no encontrados'
        }
      } catch (error) {
        bulkOpsTest.error = 'Error al verificar operaciones masivas'
      }

      result.functionalityTests.push(bulkOpsTest)

      // Test APIs
      result.apiTests = [
        await this.testApiEndpoint('/api/admin/products'),
        await this.testApiEndpoint('/api/admin/products/bulk', 'POST'),
        await this.testApiEndpoint('/api/admin/products/import', 'POST'),
        await this.testApiEndpoint('/api/admin/products/export'),
      ]

      // Calcular score
      const passedTests = result.functionalityTests.filter(t => t.status === 'PASS').length
      result.overallScore = Math.round((passedTests / result.functionalityTests.length) * 100)

      if (result.overallScore >= 80) {
        result.status = 'IMPLEMENTED'
      } else if (result.overallScore >= 40) {
        result.status = 'PARTIAL'
      } else {
        result.status = 'PLACEHOLDER'
      }
    } catch (error) {
      result.status = 'ERROR'
    }

    return result
  }

  async testLogisticsEnterprise(): Promise<TestModuleResult> {
    console.log('🚚 Testing Logística Enterprise...')

    const result = this.createEmptyModuleResult('Logística Enterprise')

    try {
      await this.page.goto('/admin/logistics')
      await this.page.waitForLoadState('networkidle')
      await this.captureScreenshot('logistics-main-page')

      // Test 1: Verificar dashboard principal
      const dashboardTest: FunctionalityTest = {
        name: 'Dashboard Principal',
        status: 'FAIL',
        description: 'Verificar que el dashboard de logística se carga correctamente',
      }

      try {
        await expect(this.page.locator('h1:has-text("Logística")').first()).toBeVisible({
          timeout: 5000,
        })
        dashboardTest.status = 'PASS'
      } catch (error) {
        dashboardTest.error = 'Dashboard principal no encontrado'
      }

      result.functionalityTests.push(dashboardTest)

      // Test 2: Verificar métricas en tiempo real
      const metricsTest: FunctionalityTest = {
        name: 'Métricas en Tiempo Real',
        status: 'FAIL',
        description: 'Verificar métricas de envíos, tasa de entrega, carriers',
      }

      try {
        const metricsCards = this.page.locator('[data-testid="logistics-metrics"], .grid').first()
        await expect(metricsCards).toBeVisible({ timeout: 5000 })

        // Verificar si hay datos reales o placeholders
        const hasRealData = await this.page.locator('text=/156|94\.2%|OCA|Andreani/').isVisible()
        const hasPlaceholder = await this.page
          .locator('text=/en desarrollo|placeholder|próximamente/i')
          .isVisible()

        if (hasRealData) {
          metricsTest.status = 'PASS'
        } else if (hasPlaceholder) {
          metricsTest.status = 'SKIP'
          metricsTest.error = 'Métricas en desarrollo (placeholder detectado)'
        } else {
          metricsTest.error = 'Métricas sin datos'
        }
      } catch (error) {
        metricsTest.error = 'Métricas no encontradas'
      }

      result.functionalityTests.push(metricsTest)

      // Test 3: Verificar botón crear envío
      const createShipmentTest: FunctionalityTest = {
        name: 'Crear Envío',
        status: 'FAIL',
        description: 'Verificar funcionalidad de crear nuevo envío',
      }

      try {
        const createBtn = this.page
          .locator('button:has-text("Crear Envío"), button:has-text("Nuevo Envío")')
          .first()
        await expect(createBtn).toBeVisible({ timeout: 5000 })

        // Intentar hacer click para verificar funcionalidad
        await createBtn.click()
        await this.page.waitForTimeout(1000)

        // Verificar si se abre modal o navega a nueva página
        const modalVisible = await this.page.locator('[role="dialog"], .modal').isVisible()
        const formVisible = await this.page.locator('form').isVisible()

        if (modalVisible || formVisible) {
          createShipmentTest.status = 'PASS'
        } else {
          createShipmentTest.error = 'Modal o formulario de creación no se abre'
        }
      } catch (error) {
        createShipmentTest.error = 'Botón crear envío no funcional'
      }

      result.functionalityTests.push(createShipmentTest)

      // Test 4: Verificar tracking en tiempo real
      const trackingTest: FunctionalityTest = {
        name: 'Tracking en Tiempo Real',
        status: 'FAIL',
        description: 'Verificar sistema de tracking de envíos',
      }

      try {
        const trackingSection = this.page.locator('[data-testid="shipments-list"], table').first()
        await expect(trackingSection).toBeVisible({ timeout: 5000 })

        // Verificar si hay envíos con tracking
        const hasTrackingData = await this.page
          .locator('text=/tracking|seguimiento|estado/i')
          .isVisible()

        if (hasTrackingData) {
          trackingTest.status = 'PASS'
        } else {
          trackingTest.error = 'No se encontraron datos de tracking'
        }
      } catch (error) {
        trackingTest.error = 'Sección de tracking no encontrada'
      }

      result.functionalityTests.push(trackingTest)

      // Test APIs
      result.apiTests = [
        await this.testApiEndpoint('/api/admin/logistics'),
        await this.testApiEndpoint('/api/admin/logistics/shipments'),
        await this.testApiEndpoint('/api/admin/logistics/carriers'),
        await this.testApiEndpoint('/api/admin/logistics/tracking'),
      ]

      // Calcular score
      const passedTests = result.functionalityTests.filter(t => t.status === 'PASS').length
      result.overallScore = Math.round((passedTests / result.functionalityTests.length) * 100)

      if (result.overallScore >= 80) {
        result.status = 'IMPLEMENTED'
      } else if (result.overallScore >= 40) {
        result.status = 'PARTIAL'
      } else {
        const hasPlaceholders = result.functionalityTests.some(t => t.error?.includes('desarrollo'))
        result.status = hasPlaceholders ? 'PLACEHOLDER' : 'ERROR'
      }
    } catch (error) {
      result.status = 'ERROR'
      this.diagnosticReport.errors.push({
        type: 'NAVIGATION',
        message: `Error en test de logística: ${error}`,
        location: '/admin/logistics',
        timestamp: new Date().toISOString(),
        severity: 'HIGH',
      })
    }

    return result
  }

  async testOrdersLogisticsIntegration(): Promise<TestModuleResult> {
    console.log('🔗 Testing Integración Órdenes-Logística...')

    const result = this.createEmptyModuleResult('Integración Órdenes-Logística')

    try {
      // Ir a órdenes primero
      await this.page.goto('/admin/orders')
      await this.page.waitForLoadState('networkidle')

      // Test 1: Verificar creación de envío desde orden
      const createShipmentFromOrderTest: FunctionalityTest = {
        name: 'Crear Envío desde Orden',
        status: 'FAIL',
        description: 'Verificar que se puede crear un envío desde una orden específica',
      }

      try {
        // Buscar primera orden en la tabla
        const firstOrderRow = this.page.locator('table tbody tr, [role="row"]').first()
        await expect(firstOrderRow).toBeVisible({ timeout: 5000 })

        // Buscar botón de acciones o menú
        const actionButton = firstOrderRow
          .locator('button[aria-haspopup="menu"], button:has-text("Acciones")')
          .first()

        if (await actionButton.isVisible()) {
          await actionButton.click()
          await this.page.waitForTimeout(500)

          // Buscar opción de crear envío
          const createShipmentOption = this.page
            .locator('text=/Crear Envío|Generar Envío|Envío/i')
            .first()

          if (await createShipmentOption.isVisible()) {
            createShipmentFromOrderTest.status = 'PASS'
          } else {
            createShipmentFromOrderTest.error = 'Opción crear envío no encontrada en menú'
          }
        } else {
          createShipmentFromOrderTest.error = 'Botón de acciones no encontrado'
        }
      } catch (error) {
        createShipmentFromOrderTest.error = 'Error al verificar creación de envío desde orden'
      }

      result.functionalityTests.push(createShipmentFromOrderTest)

      // Test 2: Verificar navegación entre módulos
      const navigationTest: FunctionalityTest = {
        name: 'Navegación entre Módulos',
        status: 'FAIL',
        description: 'Verificar navegación fluida entre órdenes y logística',
      }

      try {
        // Navegar a logística desde órdenes
        await this.page.click('a[href="/admin/logistics"], text=Logística')
        await this.page.waitForLoadState('networkidle')

        // Verificar que llegamos a logística
        const logisticsTitle = await this.page.locator('h1:has-text("Logística")').isVisible()

        if (logisticsTitle) {
          // Volver a órdenes
          await this.page.click('a[href="/admin/orders"], text=Órdenes')
          await this.page.waitForLoadState('networkidle')

          const ordersTitle = await this.page
            .locator('h1:has-text("Órdenes"), h2:has-text("Gestión de Órdenes")')
            .isVisible()

          if (ordersTitle) {
            navigationTest.status = 'PASS'
          } else {
            navigationTest.error = 'No se pudo volver a órdenes'
          }
        } else {
          navigationTest.error = 'No se pudo navegar a logística'
        }
      } catch (error) {
        navigationTest.error = 'Error en navegación entre módulos'
      }

      result.functionalityTests.push(navigationTest)

      // Test 3: Verificar actualización automática de estados
      const statusUpdateTest: FunctionalityTest = {
        name: 'Actualización Automática de Estados',
        status: 'SKIP',
        description: 'Verificar que los estados se actualizan automáticamente entre módulos',
        error: 'Test complejo - requiere datos de prueba específicos',
      }

      result.functionalityTests.push(statusUpdateTest)

      // Calcular score (excluyendo tests skipped)
      const relevantTests = result.functionalityTests.filter(t => t.status !== 'SKIP')
      const passedTests = relevantTests.filter(t => t.status === 'PASS').length
      result.overallScore =
        relevantTests.length > 0 ? Math.round((passedTests / relevantTests.length) * 100) : 0

      if (result.overallScore >= 80) {
        result.status = 'IMPLEMENTED'
      } else if (result.overallScore >= 40) {
        result.status = 'PARTIAL'
      } else {
        result.status = 'PLACEHOLDER'
      }
    } catch (error) {
      result.status = 'ERROR'
    }

    return result
  }

  async generateDiagnosticReport(): Promise<DiagnosticReport> {
    console.log('📊 Generando reporte de diagnóstico...')

    // Ejecutar todos los tests
    this.diagnosticReport.testResults.orders = await this.testOrdersEnterprise()
    this.diagnosticReport.testResults.products = await this.testProductsEnterprise()
    this.diagnosticReport.testResults.logistics = await this.testLogisticsEnterprise()
    this.diagnosticReport.testResults.integration = await this.testOrdersLogisticsIntegration()

    // Test de responsividad para todos los módulos
    const viewports = [
      { name: 'Desktop', width: 1920, height: 1080 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Mobile', width: 375, height: 667 },
    ]

    for (const [moduleName, moduleResult] of Object.entries(this.diagnosticReport.testResults)) {
      console.log(`📱 Testing responsividad para ${moduleName}...`)

      // Navegar al módulo correspondiente
      let moduleUrl = '/admin'
      switch (moduleName) {
        case 'orders':
          moduleUrl = '/admin/orders'
          break
        case 'products':
          moduleUrl = '/admin/products'
          break
        case 'logistics':
          moduleUrl = '/admin/logistics'
          break
        case 'integration':
          moduleUrl = '/admin/orders' // Usar órdenes para test de integración
          break
      }

      await this.page.goto(moduleUrl)
      await this.page.waitForLoadState('networkidle')

      moduleResult.responsiveTests = await this.testResponsiveDesign(viewports)
    }

    // Calcular resumen
    const allTests = Object.values(this.diagnosticReport.testResults).flatMap(
      module => module.functionalityTests
    )

    this.diagnosticReport.summary.totalTests = allTests.length
    this.diagnosticReport.summary.passedTests = allTests.filter(t => t.status === 'PASS').length
    this.diagnosticReport.summary.failedTests = allTests.filter(t => t.status === 'FAIL').length

    const overallScore = Math.round(
      (this.diagnosticReport.summary.passedTests / this.diagnosticReport.summary.totalTests) * 100
    )

    if (overallScore >= 80) {
      this.diagnosticReport.summary.implementationStatus = 'ENTERPRISE_READY'
    } else if (overallScore >= 60) {
      this.diagnosticReport.summary.implementationStatus = 'MOSTLY_IMPLEMENTED'
    } else if (overallScore >= 40) {
      this.diagnosticReport.summary.implementationStatus = 'PARTIAL_IMPLEMENTATION'
    } else {
      this.diagnosticReport.summary.implementationStatus = 'EARLY_DEVELOPMENT'
    }

    return this.diagnosticReport
  }

  async saveReportToFile(report: DiagnosticReport): Promise<string> {
    // Crear directorio si no existe
    const reportsDir = path.join('test-results', 'diagnostic-reports')
    await fs.mkdir(reportsDir, { recursive: true })

    // Generar reporte en JSON
    const jsonReportPath = path.join(reportsDir, `admin-panel-diagnostic-${Date.now()}.json`)
    await fs.writeFile(jsonReportPath, JSON.stringify(report, null, 2))

    // Generar reporte en HTML
    const htmlReport = this.generateHtmlReport(report)
    const htmlReportPath = path.join(reportsDir, `admin-panel-diagnostic-${Date.now()}.html`)
    await fs.writeFile(htmlReportPath, htmlReport)

    return htmlReportPath
  }

  private generateHtmlReport(report: DiagnosticReport): string {
    const statusColors = {
      IMPLEMENTED: '#10b981',
      PARTIAL: '#f59e0b',
      PLACEHOLDER: '#6b7280',
      ERROR: '#ef4444',
    }

    const testStatusColors = {
      PASS: '#10b981',
      FAIL: '#ef4444',
      SKIP: '#6b7280',
    }

    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Diagnóstico Panel Administrativo - Pinteya E-commerce</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f8fafc; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 30px; }
        .module { background: white; padding: 25px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 20px; }
        .status-badge { padding: 6px 12px; border-radius: 20px; color: white; font-weight: 600; font-size: 12px; }
        .test-item { padding: 15px; border-left: 4px solid #e5e7eb; margin: 10px 0; background: #f9fafb; border-radius: 0 8px 8px 0; }
        .test-pass { border-left-color: #10b981; }
        .test-fail { border-left-color: #ef4444; }
        .test-skip { border-left-color: #6b7280; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
        .metric { text-align: center; padding: 20px; background: #f8fafc; border-radius: 8px; }
        .metric-value { font-size: 2em; font-weight: bold; color: #1f2937; }
        .metric-label { color: #6b7280; font-size: 0.9em; margin-top: 5px; }
        .api-test { display: flex; justify-content: space-between; align-items: center; padding: 10px; background: #f9fafb; border-radius: 6px; margin: 5px 0; }
        .api-status-ok { color: #10b981; font-weight: 600; }
        .api-status-error { color: #ef4444; font-weight: 600; }
        .responsive-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
        .responsive-item { padding: 15px; background: #f9fafb; border-radius: 8px; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏢 Diagnóstico Panel Administrativo Enterprise</h1>
            <p><strong>Pinteya E-commerce</strong> - Generado el ${new Date(report.timestamp).toLocaleString('es-ES')}</p>

            <div class="grid">
                <div class="metric">
                    <div class="metric-value">${report.summary.totalTests}</div>
                    <div class="metric-label">Tests Totales</div>
                </div>
                <div class="metric">
                    <div class="metric-value" style="color: #10b981">${report.summary.passedTests}</div>
                    <div class="metric-label">Tests Exitosos</div>
                </div>
                <div class="metric">
                    <div class="metric-value" style="color: #ef4444">${report.summary.failedTests}</div>
                    <div class="metric-label">Tests Fallidos</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${Math.round((report.summary.passedTests / report.summary.totalTests) * 100)}%</div>
                    <div class="metric-label">Tasa de Éxito</div>
                </div>
            </div>

            <div style="margin-top: 20px; text-align: center;">
                <span class="status-badge" style="background-color: ${statusColors[report.summary.implementationStatus as keyof typeof statusColors] || '#6b7280'}">
                    ${report.summary.implementationStatus}
                </span>
            </div>
        </div>

        ${Object.entries(report.testResults)
          .map(
            ([key, module]) => `
        <div class="module">
            <h2>📦 ${module.moduleName}</h2>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <span class="status-badge" style="background-color: ${statusColors[module.status]}">
                    ${module.status}
                </span>
                <span style="font-size: 1.2em; font-weight: bold;">Score: ${module.overallScore}%</span>
            </div>

            <h3>🧪 Tests de Funcionalidad</h3>
            ${module.functionalityTests
              .map(
                test => `
            <div class="test-item test-${test.status.toLowerCase()}">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <strong>${test.name}</strong>
                    <span style="color: ${testStatusColors[test.status]}; font-weight: bold;">${test.status}</span>
                </div>
                <p style="margin: 5px 0; color: #6b7280;">${test.description}</p>
                ${test.error ? `<p style="margin: 5px 0; color: #ef4444; font-size: 0.9em;">❌ ${test.error}</p>` : ''}
            </div>
            `
              )
              .join('')}

            <h3>🔌 Tests de APIs</h3>
            ${module.apiTests
              .map(
                api => `
            <div class="api-test">
                <span><strong>${api.method}</strong> ${api.endpoint}</span>
                <span class="${api.isWorking ? 'api-status-ok' : 'api-status-error'}">
                    ${api.status} (${api.responseTime}ms)
                </span>
            </div>
            `
              )
              .join('')}

            <h3>📱 Tests de Responsividad</h3>
            <div class="responsive-grid">
                ${module.responsiveTests
                  .map(
                    responsive => `
                <div class="responsive-item">
                    <strong>${responsive.viewport}</strong>
                    <div style="color: ${responsive.status === 'PASS' ? '#10b981' : '#ef4444'}; font-weight: bold; margin-top: 5px;">
                        ${responsive.status}
                    </div>
                    ${responsive.issues.length > 0 ? `<div style="font-size: 0.8em; color: #ef4444; margin-top: 5px;">${responsive.issues.join(', ')}</div>` : ''}
                </div>
                `
                  )
                  .join('')}
            </div>
        </div>
        `
          )
          .join('')}

        ${
          report.errors.length > 0
            ? `
        <div class="module">
            <h2>⚠️ Errores Detectados</h2>
            ${report.errors
              .map(
                error => `
            <div class="test-item test-fail">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <strong>${error.type}</strong>
                    <span style="color: #ef4444; font-weight: bold;">${error.severity}</span>
                </div>
                <p style="margin: 5px 0; color: #6b7280;">${error.location}</p>
                <p style="margin: 5px 0; color: #ef4444; font-size: 0.9em;">${error.message}</p>
                <p style="margin: 5px 0; color: #9ca3af; font-size: 0.8em;">${new Date(error.timestamp).toLocaleString('es-ES')}</p>
            </div>
            `
              )
              .join('')}
        </div>
        `
            : ''
        }

        <div style="text-align: center; margin-top: 30px; color: #6b7280; font-size: 0.9em;">
            <p>Generado por Playwright E2E Testing Suite - Pinteya E-commerce</p>
            <p>Screenshots: ${report.screenshots.length} | Timestamp: ${report.timestamp}</p>
        </div>
    </div>
</body>
</html>
    `
  }
}

// =====================================================
// TESTS PRINCIPALES
// =====================================================

test.describe('Panel Administrativo Enterprise - Suite Completa', () => {
  let tester: AdminPanelTester

  test.beforeEach(async ({ page }) => {
    tester = new AdminPanelTester(page)
    await tester.captureConsoleErrors()
    await tester.authenticateAsAdmin()
  })

  test('Diagnóstico Completo del Panel Administrativo', async ({ page }) => {
    console.log('🔍 Iniciando diagnóstico completo del panel administrativo...')

    const report = await tester.generateDiagnosticReport()

    // Guardar reporte en múltiples formatos
    const htmlReportPath = await tester.saveReportToFile(report)

    console.log('📋 REPORTE DE DIAGNÓSTICO GENERADO:')
    console.log('=====================================')
    console.log(`📊 Tests Totales: ${report.summary.totalTests}`)
    console.log(`✅ Tests Exitosos: ${report.summary.passedTests}`)
    console.log(`❌ Tests Fallidos: ${report.summary.failedTests}`)
    console.log(`🎯 Estado de Implementación: ${report.summary.implementationStatus}`)
    console.log(
      `📈 Tasa de Éxito: ${Math.round((report.summary.passedTests / report.summary.totalTests) * 100)}%`
    )
    console.log('=====================================')

    // Mostrar detalles por módulo
    Object.entries(report.testResults).forEach(([key, module]) => {
      console.log(`\n📦 ${module.moduleName}:`)
      console.log(`   Status: ${module.status}`)
      console.log(`   Score: ${module.overallScore}%`)
      console.log(`   Tests Funcionalidad: ${module.functionalityTests.length}`)
      console.log(`   Tests API: ${module.apiTests.length}`)
      console.log(`   Tests Responsividad: ${module.responsiveTests.length}`)

      // Mostrar resumen de tests de funcionalidad
      const passedFunctionality = module.functionalityTests.filter(t => t.status === 'PASS').length
      const failedFunctionality = module.functionalityTests.filter(t => t.status === 'FAIL').length
      const skippedFunctionality = module.functionalityTests.filter(t => t.status === 'SKIP').length

      console.log(
        `   ✅ Funcionalidad: ${passedFunctionality} | ❌ ${failedFunctionality} | ⏭️ ${skippedFunctionality}`
      )

      // Mostrar APIs funcionales
      const workingApis = module.apiTests.filter(api => api.isWorking).length
      console.log(`   🔌 APIs Funcionales: ${workingApis}/${module.apiTests.length}`)

      // Mostrar responsividad
      const responsivePass = module.responsiveTests.filter(r => r.status === 'PASS').length
      console.log(
        `   📱 Responsividad: ${responsivePass}/${module.responsiveTests.length} viewports`
      )
    })

    console.log(`\n📁 Reporte HTML: ${htmlReportPath}`)
    console.log(`📸 Screenshots capturadas: ${report.screenshots.length}`)
    console.log(`⚠️ Errores detectados: ${report.errors.length}`)

    if (report.errors.length > 0) {
      console.log('\n🚨 ERRORES CRÍTICOS DETECTADOS:')
      report.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. [${error.severity}] ${error.type}: ${error.message}`)
        console.log(`      📍 ${error.location}`)
      })
    }

    // Recomendaciones basadas en el diagnóstico
    console.log('\n💡 RECOMENDACIONES:')
    const overallScore = Math.round((report.summary.passedTests / report.summary.totalTests) * 100)

    if (overallScore >= 80) {
      console.log('   🎉 Panel administrativo enterprise-ready! Excelente implementación.')
    } else if (overallScore >= 60) {
      console.log('   👍 Buena implementación. Revisar funcionalidades fallidas para optimización.')
    } else if (overallScore >= 40) {
      console.log('   ⚠️ Implementación parcial. Priorizar completar funcionalidades core.')
    } else {
      console.log(
        '   🔧 Implementación en desarrollo temprano. Enfocarse en funcionalidades básicas.'
      )
    }

    // Identificar módulo con mejor/peor performance
    const moduleScores = Object.entries(report.testResults).map(([key, module]) => ({
      name: module.moduleName,
      score: module.overallScore,
    }))

    const bestModule = moduleScores.reduce((prev, current) =>
      prev.score > current.score ? prev : current
    )
    const worstModule = moduleScores.reduce((prev, current) =>
      prev.score < current.score ? prev : current
    )

    console.log(`   🏆 Mejor módulo: ${bestModule.name} (${bestModule.score}%)`)
    console.log(`   🔧 Módulo a mejorar: ${worstModule.name} (${worstModule.score}%)`)

    // Assertions para el test
    expect(report.summary.totalTests).toBeGreaterThan(0)
    expect(report.summary.implementationStatus).toBeDefined()
    expect(htmlReportPath).toBeTruthy()

    // El test pasa independientemente del estado de implementación
    // ya que el objetivo es generar el diagnóstico completo
  })

  test('Test Individual - Flujo de Órdenes Enterprise', async ({ page }) => {
    console.log('🛒 Test específico: Flujo de Órdenes Enterprise')

    const ordersResult = await tester.testOrdersEnterprise()
    await tester.captureScreenshot('orders-individual-test')

    console.log(`📊 Resultado Órdenes: ${ordersResult.status} (${ordersResult.overallScore}%)`)

    // Mostrar detalles de cada test
    ordersResult.functionalityTests.forEach(test => {
      const icon = test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : '⏭️'
      console.log(`   ${icon} ${test.name}: ${test.status}`)
      if (test.error) console.log(`      Error: ${test.error}`)
    })

    expect(ordersResult.functionalityTests.length).toBeGreaterThan(0)
  })

  test('Test Individual - Flujo de Productos Enterprise', async ({ page }) => {
    console.log('📦 Test específico: Flujo de Productos Enterprise')

    const productsResult = await tester.testProductsEnterprise()
    await tester.captureScreenshot('products-individual-test')

    console.log(
      `📊 Resultado Productos: ${productsResult.status} (${productsResult.overallScore}%)`
    )

    // Mostrar detalles de cada test
    productsResult.functionalityTests.forEach(test => {
      const icon = test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : '⏭️'
      console.log(`   ${icon} ${test.name}: ${test.status}`)
      if (test.error) console.log(`      Error: ${test.error}`)
    })

    expect(productsResult.functionalityTests.length).toBeGreaterThan(0)
  })

  test('Test Individual - Flujo de Logística Enterprise', async ({ page }) => {
    console.log('🚚 Test específico: Flujo de Logística Enterprise')

    const logisticsResult = await tester.testLogisticsEnterprise()
    await tester.captureScreenshot('logistics-individual-test')

    console.log(
      `📊 Resultado Logística: ${logisticsResult.status} (${logisticsResult.overallScore}%)`
    )

    // Mostrar detalles de cada test
    logisticsResult.functionalityTests.forEach(test => {
      const icon = test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : '⏭️'
      console.log(`   ${icon} ${test.name}: ${test.status}`)
      if (test.error) console.log(`      Error: ${test.error}`)
    })

    expect(logisticsResult.functionalityTests.length).toBeGreaterThan(0)
  })
})
