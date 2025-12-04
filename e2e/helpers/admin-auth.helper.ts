// ===================================
// ADMIN AUTHENTICATION HELPER
// Funciones auxiliares para autenticación bypass en tests
// ===================================

import { Page } from '@playwright/test'

/**
 * Configura bypass de autenticación para tests admin
 * Establece headers y cookies necesarios para acceder al panel sin login real
 */
export async function setupAdminBypass(page: Page) {
  await page.addInitScript(() => {
    // Simular usuario admin en el contexto de la página
    window.localStorage.setItem('admin-bypass', 'true')
  })

  // Establecer headers de bypass
  await page.setExtraHTTPHeaders({
    'x-bypass-auth': 'true',
    'x-test-admin': 'true',
    'x-playwright-test': 'true',
  })

  // Establecer cookies de sesión simulada
  await page.context().addCookies([
    {
      name: 'admin-bypass',
      value: 'true',
      domain: 'localhost',
      path: '/',
    },
    {
      name: 'test-user-email',
      value: 'santiago@xor.com.ar',
      domain: 'localhost',
      path: '/',
    },
  ])

  console.log('✅ Admin bypass configurado para tests')
}

/**
 * Navega al panel administrativo de productos
 * Verifica que la autenticación bypass funcione correctamente
 */
export async function navigateToAdminPanel(page: Page) {
  const startTime = Date.now()
  
  await page.goto('/admin/products', {
    waitUntil: 'networkidle',
    timeout: 30000,
  })

  const loadTime = Date.now() - startTime
  console.log(`📍 Navegado a /admin/products en ${loadTime}ms`)
}

/**
 * Verifica que se puede acceder al panel admin
 * Verifica elementos clave de la interfaz
 */
export async function verifyAdminAccess(page: Page) {
  // Verificar que estamos en la página correcta
  const url = page.url()
  console.log(`🔍 URL actual: ${url}`)

  // Verificar que no hay redirección al home (significa que auth bypass funcionó)
  await page.waitForURL(/\/admin\/products/, { timeout: 5000 })

  // Esperar a que cargue el contenido principal
  await page.waitForLoadState('networkidle')

  console.log('✅ Acceso admin verificado')
}

/**
 * Verifica que el usuario tiene permisos de admin
 * (en bypass mode siempre debería ser true)
 */
export async function verifyAdminPermissions(page: Page) {
  // Verificar que no hay mensaje de "access denied"
  const accessDenied = await page.locator('text=Acceso denegado').count()
  if (accessDenied > 0) {
    throw new Error('Acceso denegado al panel admin')
  }

  // Verificar que no hay redirección a home
  const currentUrl = page.url()
  if (!currentUrl.includes('/admin')) {
    throw new Error('Redirección inesperada fuera del panel admin')
  }

  console.log('✅ Permisos de admin verificados')
}

/**
 * Inicializa sesión de admin para tests
 * Configura bypass y navega al panel
 */
export async function setupAdminSession(page: Page) {
  await setupAdminBypass(page)
  await navigateToAdminPanel(page)
  await verifyAdminAccess(page)
  await verifyAdminPermissions(page)
}

/**
 * Limpia cookies y localStorage después de tests
 */
export async function cleanupAdminSession(page: Page) {
  await page.context().clearCookies()
  await page.evaluate(() => {
    window.localStorage.clear()
  })
  console.log('🧹 Sesión admin limpiada')
}

