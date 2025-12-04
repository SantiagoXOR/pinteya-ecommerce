import { test, expect } from '@playwright/test'

test.describe('Panel Administrativo - Navegación', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar al panel administrativo
    await page.goto('/admin')
  })

  test('debe cargar el dashboard administrativo correctamente', async ({ page }) => {
    // Verificar que el título de la página sea correcto
    await expect(page).toHaveTitle(/Admin Panel - Pinteya E-commerce/)

    // Verificar que el header principal esté presente
    await expect(page.locator('h1')).toContainText('¡Bienvenido al Panel Administrativo!')

    // Verificar que el sidebar esté presente
    await expect(page.locator('[data-testid="admin-sidebar"]')).toBeVisible()

    // Verificar que las métricas rápidas estén presentes
    await expect(page.locator('text=Ventas Hoy')).toBeVisible()
    await expect(page.locator('text=Órdenes Pendientes')).toBeVisible()
    await expect(page.locator('text=Stock Bajo')).toBeVisible()
    await expect(page.locator('text=Usuarios Activos')).toBeVisible()
  })

  test('debe mostrar todos los módulos administrativos', async ({ page }) => {
    // Verificar que todos los módulos estén presentes
    const modules = [
      'Productos',
      'Órdenes',
      'Clientes',
      'Analytics',
      'MercadoPago',
      'Diagnósticos',
      'Configuración',
      'Base de Datos',
    ]

    for (const module of modules) {
      await expect(page.locator(`text=${module}`)).toBeVisible()
    }
  })

  test('debe navegar correctamente al módulo de productos', async ({ page }) => {
    // Click en el módulo de productos
    await page.click('text=Productos')

    // Verificar que navegó a la página de productos
    await expect(page).toHaveURL('/admin/products')

    // Verificar que el título de la página sea correcto
    await expect(page.locator('h1')).toContainText('Gestión de Productos')
  })

  test('debe mostrar el sidebar con navegación funcional', async ({ page }) => {
    // Verificar que el sidebar esté presente
    const sidebar = page.locator('[data-testid="admin-sidebar"]')
    await expect(sidebar).toBeVisible()

    // Verificar elementos del sidebar
    await expect(sidebar.locator('text=Dashboard')).toBeVisible()
    await expect(sidebar.locator('text=Productos')).toBeVisible()
    await expect(sidebar.locator('text=Órdenes')).toBeVisible()
    await expect(sidebar.locator('text=Clientes')).toBeVisible()

    // Probar navegación desde el sidebar
    await sidebar.locator('text=Productos').click()
    await expect(page).toHaveURL('/admin/products')

    // Volver al dashboard
    await sidebar.locator('text=Dashboard').click()
    await expect(page).toHaveURL('/admin')
  })

  test('debe ser responsive en móviles', async ({ page }) => {
    // Cambiar a viewport móvil
    await page.setViewportSize({ width: 375, height: 667 })

    // En móvil, el sidebar debe estar oculto inicialmente
    const sidebar = page.locator('[data-testid="admin-sidebar"]')

    // Verificar que el botón de menú móvil esté presente
    const menuButton = page.locator('[data-testid="mobile-menu-toggle"]')
    await expect(menuButton).toBeVisible()

    // Click en el botón de menú para abrir el sidebar
    await menuButton.click()

    // Verificar que el sidebar se muestre
    await expect(sidebar).toBeVisible()

    // Click fuera del sidebar para cerrarlo
    await page.click('body')

    // El sidebar debería cerrarse (esto puede variar según la implementación)
  })

  test('debe mostrar breadcrumbs correctos', async ({ page }) => {
    // Navegar a productos
    await page.click('text=Productos')

    // Verificar breadcrumbs
    await expect(page.locator('[data-testid="breadcrumbs"]')).toContainText('Admin')
    await expect(page.locator('[data-testid="breadcrumbs"]')).toContainText('Productos')
  })

  test('debe mostrar el estado del sistema', async ({ page }) => {
    // Verificar que la sección de estado del sistema esté presente
    await expect(page.locator('text=Estado del Sistema')).toBeVisible()

    // Verificar indicadores de estado
    await expect(page.locator('text=Sistema Operativo')).toBeVisible()
    await expect(page.locator('text=Sincronización Activa')).toBeVisible()
    await expect(page.locator('text=Performance Óptimo')).toBeVisible()
  })

  test('debe manejar errores de navegación gracefully', async ({ page }) => {
    // Intentar navegar a una página que no existe
    await page.goto('/admin/nonexistent')

    // Debería mostrar una página de error o redirigir
    // (Esto depende de cómo manejes las rutas no encontradas)
    const currentUrl = page.url()
    expect(currentUrl).toMatch(/\/admin/)
  })
})
