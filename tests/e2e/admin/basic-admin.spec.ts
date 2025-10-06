import { test, expect } from '@playwright/test'
import { ensureAuthenticated } from '../auth-setup'

test.describe('Panel Administrativo - Tests Básicos', () => {
  // Hook para asegurar autenticación antes de cada test
  test.beforeEach(async ({ page }) => {
    console.log('🔐 Verificando autenticación antes del test...')
    await ensureAuthenticated(page)
  })

  test('debe cargar el dashboard administrativo', async ({ page }) => {
    console.log('🧪 Test: Carga del dashboard administrativo')

    // Navegar al panel administrativo (ya autenticado por beforeEach)
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    // Verificar que la página carga correctamente
    console.log('🔍 Verificando título de la página...')
    await expect(page).toHaveTitle(/Admin|Panel|Dashboard|Pinteya/)

    // Verificar que hay contenido principal del dashboard
    console.log('🔍 Verificando contenido principal...')
    const mainContentSelectors = [
      'h1',
      'h2',
      '[data-testid="admin-dashboard"]',
      'text=Bienvenido al Panel Administrativo',
      'text=Dashboard',
      'text=Panel',
    ]

    let contentFound = false
    for (const selector of mainContentSelectors) {
      try {
        await expect(page.locator(selector).first()).toBeVisible({ timeout: 5000 })
        console.log(`✅ Contenido encontrado: ${selector}`)
        contentFound = true
        break
      } catch (e) {
        // Continuar con el siguiente selector
      }
    }

    if (!contentFound) {
      // Tomar screenshot para debugging
      await page.screenshot({
        path: `test-results/admin-dashboard-content-missing-${Date.now()}.png`,
        fullPage: true,
      })
      throw new Error('No se encontró contenido principal del dashboard')
    }

    // Verificar que no hay errores críticos de JavaScript
    console.log('🔍 Verificando errores de JavaScript...')
    const errors = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    // Esperar un momento para que se ejecute JavaScript
    await page.waitForTimeout(2000)

    // Filtrar errores críticos (ignorar warnings y errores menores)
    const criticalErrors = errors.filter(
      error =>
        !error.includes('Warning') &&
        !error.includes('favicon') &&
        !error.includes('404') &&
        !error.includes('Failed to load resource') &&
        !error.includes('net::ERR_FAILED') &&
        !error.toLowerCase().includes('chunk')
    )

    if (criticalErrors.length > 0) {
      console.warn('⚠️ Errores críticos encontrados:', criticalErrors)
    }

    expect(criticalErrors.length).toBe(0)
    console.log('✅ Test completado: Dashboard administrativo carga correctamente')
  })

  test('debe navegar a la página de productos', async ({ page }) => {
    console.log('🧪 Test: Navegación a página de productos')

    // Ir al panel administrativo (ya autenticado por beforeEach)
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    // Buscar y hacer click en el enlace de productos
    console.log('🔍 Buscando enlace de productos...')
    const productLinkSelectors = [
      'text=Productos',
      'a[href="/admin/products"]',
      'a[href*="products"]',
      '[data-testid="products-link"]',
      'nav a:has-text("Productos")',
    ]

    let productLink = null
    for (const selector of productLinkSelectors) {
      try {
        productLink = page.locator(selector).first()
        await expect(productLink).toBeVisible({ timeout: 3000 })
        console.log(`✅ Enlace de productos encontrado: ${selector}`)
        break
      } catch (e) {
        // Continuar con el siguiente selector
      }
    }

    if (!productLink) {
      // Tomar screenshot para debugging
      await page.screenshot({
        path: `test-results/products-link-missing-${Date.now()}.png`,
        fullPage: true,
      })
      throw new Error('No se encontró el enlace de productos')
    }

    // Hacer click en el enlace
    console.log('🖱️ Haciendo click en enlace de productos...')
    await productLink.click()
    await page.waitForLoadState('networkidle')

    // Verificar que navegó correctamente
    console.log('🔍 Verificando navegación...')
    await expect(page).toHaveURL(/\/admin\/products/)

    // Verificar que la página de productos carga
    console.log('🔍 Verificando contenido de página de productos...')
    const productPageSelectors = [
      'h1',
      'h2',
      'text=Productos',
      'text=Gestión de Productos',
      '[data-testid="products-page"]',
      'table',
      '.product-list',
    ]

    let pageContentFound = false
    for (const selector of productPageSelectors) {
      try {
        await expect(page.locator(selector).first()).toBeVisible({ timeout: 5000 })
        console.log(`✅ Contenido de productos encontrado: ${selector}`)
        pageContentFound = true
        break
      } catch (e) {
        // Continuar con el siguiente selector
      }
    }

    if (!pageContentFound) {
      // Tomar screenshot para debugging
      await page.screenshot({
        path: `test-results/products-page-content-missing-${Date.now()}.png`,
        fullPage: true,
      })
      throw new Error('No se encontró contenido en la página de productos')
    }

    console.log('✅ Test completado: Navegación a productos exitosa')
  })

  test('debe mostrar el formulario de crear producto', async ({ page }) => {
    await page.goto('/admin/products/new')

    // Verificar que el formulario está presente
    await expect(page.locator('form')).toBeVisible()

    // Verificar que hay campos básicos
    await expect(page.locator('input[name="name"]')).toBeVisible()
    await expect(page.locator('input[name="price"]')).toBeVisible()

    // Verificar botones de acción
    await expect(page.locator('button:has-text("Crear Producto")')).toBeVisible()
    await expect(page.locator('button:has-text("Cancelar")')).toBeVisible()
  })

  test('debe validar campos requeridos en el formulario', async ({ page }) => {
    await page.goto('/admin/products/new')

    // Intentar enviar formulario vacío
    await page.click('button:has-text("Crear Producto")')

    // Verificar que aparecen mensajes de error
    const errorMessages = page.locator('text=requerido')
    await expect(errorMessages.first()).toBeVisible()
  })

  test('debe ser responsive en móviles', async ({ page }) => {
    // Cambiar a viewport móvil
    await page.setViewportSize({ width: 375, height: 667 })

    await page.goto('/admin')

    // Verificar que la página carga en móvil
    await expect(page.locator('h1')).toBeVisible()

    // Verificar que el contenido se adapta
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('debe cargar rápidamente', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('/admin')
    await page.waitForSelector('h1')

    const loadTime = Date.now() - startTime

    // Verificar que carga en menos de 5 segundos (más permisivo)
    expect(loadTime).toBeLessThan(5000)
  })

  test('debe manejar rutas no encontradas', async ({ page }) => {
    await page.goto('/admin/ruta-que-no-existe')

    // Debería redirigir o mostrar error 404
    // Verificar que no se queda en blanco
    const body = await page.locator('body').textContent()
    expect(body).toBeTruthy()
    expect(body.length).toBeGreaterThan(0)
  })

  test('debe tener navegación funcional entre páginas', async ({ page }) => {
    // Ir al admin
    await page.goto('/admin')
    await expect(page.locator('h1')).toBeVisible()

    // Ir a productos
    await page.goto('/admin/products')
    await expect(page.locator('h1')).toBeVisible()

    // Ir a crear producto
    await page.goto('/admin/products/new')
    await expect(page.locator('form')).toBeVisible()

    // Usar botón atrás del navegador
    await page.goBack()
    await expect(page).toHaveURL('/admin/products')
  })

  test('debe mostrar contenido apropiado en cada página', async ({ page }) => {
    // Dashboard
    await page.goto('/admin')
    await expect(page.locator('text=Panel')).toBeVisible()

    // Productos
    await page.goto('/admin/products')
    await expect(page.locator('text=Productos')).toBeVisible()

    // Nuevo producto
    await page.goto('/admin/products/new')
    await expect(page.locator('text=Crear')).toBeVisible()
  })
})
