import { test, expect } from '@playwright/test'

/**
 * TESTS ESPECÍFICOS PARA VERIFICAR LA CORRECCIÓN DEL PANEL ADMINISTRATIVO /admin
 *
 * Estos tests verifican que el problema de acceso a /admin ha sido resuelto
 * y que tanto /admin como /admin/products funcionan correctamente.
 */

test.describe('Admin Dashboard Fix Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Configurar timeouts más largos para cargas iniciales
    page.setDefaultTimeout(30000)
    page.setDefaultNavigationTimeout(30000)
  })

  test('should load /admin page without errors', async ({ page }) => {
    // Monitorear errores de consola
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    // Monitorear errores de página
    const pageErrors: string[] = []
    page.on('pageerror', error => {
      pageErrors.push(error.message)
    })

    // Navegar a la página admin
    console.log('🔍 Navegando a /admin...')
    await page.goto('/admin')

    // Esperar a que la página cargue completamente
    await page.waitForLoadState('networkidle')

    // Verificar que no hay errores críticos de JavaScript
    expect(pageErrors.length).toBe(0)

    // Verificar que no hay errores críticos en consola (permitir warnings)
    const criticalErrors = consoleErrors.filter(
      error =>
        error.includes('ReferenceError') ||
        error.includes('TypeError') ||
        error.includes('SyntaxError')
    )
    expect(criticalErrors.length).toBe(0)

    // Verificar que el título de la página es correcto
    await expect(page).toHaveTitle(/Admin Panel/)

    console.log('✅ /admin carga sin errores críticos')
  })

  test('should display admin dashboard components', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    // Verificar que el layout principal está presente
    await expect(page.locator('[data-testid="admin-layout"], .admin-layout, main')).toBeVisible()

    // Verificar que el título de bienvenida está presente
    await expect(page.locator('text=Bienvenido al Panel Administrativo')).toBeVisible()

    // Verificar que las estadísticas rápidas están presentes
    await expect(page.locator('text=Total Productos')).toBeVisible()
    await expect(page.locator('text=Stock Bajo')).toBeVisible()

    // Verificar que los módulos administrativos están presentes
    await expect(page.locator('text=Módulos Administrativos')).toBeVisible()
    await expect(page.locator('text=Productos')).toBeVisible()
    await expect(page.locator('text=Órdenes')).toBeVisible()

    // Verificar que el estado del sistema está presente
    await expect(page.locator('text=Estado del Sistema')).toBeVisible()

    console.log('✅ Todos los componentes del dashboard están visibles')
  })

  test('should load statistics without crashing', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    // Esperar a que las estadísticas carguen (pueden ser datos reales o fallback)
    await page.waitForTimeout(3000)

    // Verificar que las estadísticas muestran números (no "Cargando..." indefinidamente)
    const totalProductsElement = page
      .locator('text=Total Productos')
      .locator('..')
      .locator('text=/^\\d+$/')
    await expect(totalProductsElement).toBeVisible({ timeout: 10000 })

    // Verificar que no hay mensajes de error en las estadísticas
    const errorMessages = page.locator(
      'text=/Error cargando estadísticas|o\\.filter is not a function/'
    )
    await expect(errorMessages).toHaveCount(0)

    console.log('✅ Estadísticas cargan correctamente sin errores')
  })

  test('should navigate to /admin/products successfully', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    // Hacer clic en el enlace de Productos
    await page.click('text=Productos')

    // Esperar a que la página de productos cargue
    await page.waitForLoadState('networkidle')

    // Verificar que estamos en la página de productos
    await expect(page).toHaveURL(/\/admin\/products/)

    // Verificar que la página de productos funciona
    await expect(page.locator('text=Gestión de Productos')).toBeVisible()

    console.log('✅ Navegación a /admin/products funciona correctamente')
  })

  test('should compare /admin with /admin/products functionality', async ({ page }) => {
    // Test /admin
    console.log('🔍 Probando /admin...')
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    const adminLoaded = await page.locator('text=Bienvenido al Panel Administrativo').isVisible()
    expect(adminLoaded).toBe(true)

    // Test /admin/products
    console.log('🔍 Probando /admin/products...')
    await page.goto('/admin/products')
    await page.waitForLoadState('networkidle')

    const productsLoaded = await page.locator('text=Gestión de Productos').isVisible()
    expect(productsLoaded).toBe(true)

    console.log('✅ Ambas páginas (/admin y /admin/products) funcionan correctamente')
  })

  test('should handle authentication gracefully', async ({ page }) => {
    // Monitorear requests de autenticación
    const authRequests: string[] = []
    page.on('request', request => {
      if (request.url().includes('/api/admin/') || request.url().includes('auth')) {
        authRequests.push(request.url())
      }
    })

    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    // Verificar que la página carga incluso si hay problemas de autenticación
    const pageLoaded = await page.locator('text=Bienvenido al Panel Administrativo').isVisible()
    expect(pageLoaded).toBe(true)

    // Verificar que se intentaron hacer requests de autenticación
    expect(authRequests.length).toBeGreaterThan(0)

    console.log('✅ Autenticación manejada gracefully')
    console.log(`📊 Requests de auth detectados: ${authRequests.length}`)
  })

  test('should test diagnostic tools accessibility', async ({ page }) => {
    // Test herramienta de diagnóstico
    console.log('🔍 Probando herramienta de diagnóstico...')
    await page.goto('/debug-admin.html')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('text=Debug Admin Panel')).toBeVisible()

    // Test página de estado de autenticación
    console.log('🔍 Probando página de estado de auth...')
    await page.goto('/test-auth-status')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('text=Estado de Autenticación')).toBeVisible()

    // Test página admin simplificada
    console.log('🔍 Probando página admin simplificada...')
    await page.goto('/admin/page-simple')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('text=Versión Simple')).toBeVisible()

    console.log('✅ Todas las herramientas de diagnóstico son accesibles')
  })

  test('should verify useAdminDashboardStats hook improvements', async ({ page }) => {
    // Monitorear requests de API
    const apiRequests: { url: string; status: number }[] = []
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        apiRequests.push({
          url: response.url(),
          status: response.status(),
        })
      }
    })

    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    // Esperar a que el hook termine de ejecutarse
    await page.waitForTimeout(5000)

    // Verificar que la página no crasheó por errores del hook
    const dashboardVisible = await page
      .locator('text=Bienvenido al Panel Administrativo')
      .isVisible()
    expect(dashboardVisible).toBe(true)

    // Verificar que se hicieron intentos de llamadas a APIs
    const adminApiCalls = apiRequests.filter(req => req.url.includes('/api/admin/'))
    const publicApiCalls = apiRequests.filter(req => req.url.includes('/api/products'))

    console.log(`📊 Admin API calls: ${adminApiCalls.length}`)
    console.log(`📊 Public API calls: ${publicApiCalls.length}`)

    // Debe haber al menos un intento de llamada a API (admin o pública)
    expect(adminApiCalls.length + publicApiCalls.length).toBeGreaterThan(0)

    console.log('✅ Hook useAdminDashboardStats funciona con fallbacks mejorados')
  })

  test('should perform complete admin workflow', async ({ page }) => {
    console.log('🔍 Iniciando workflow completo del admin...')

    // 1. Cargar dashboard principal
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('text=Bienvenido al Panel Administrativo')).toBeVisible()

    // 2. Navegar a productos
    await page.click('text=Productos')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('text=Gestión de Productos')).toBeVisible()

    // 3. Volver al dashboard
    await page.click('text=Dashboard')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('text=Bienvenido al Panel Administrativo')).toBeVisible()

    // 4. Verificar que las estadísticas siguen funcionando
    await expect(page.locator('text=Total Productos')).toBeVisible()

    console.log('✅ Workflow completo del admin funciona correctamente')
  })
})
