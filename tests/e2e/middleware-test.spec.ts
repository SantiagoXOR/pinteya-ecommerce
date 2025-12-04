/**
 * TEST SIMPLE PARA VERIFICAR MIDDLEWARE DE TESTING
 *
 * Este test verifica que el middleware de testing permite
 * acceso a rutas administrativas sin autenticación real.
 */

import { test, expect } from '@playwright/test'

test.describe('Middleware de Testing', () => {
  test('debe permitir acceso a /admin sin autenticación', async ({ page }) => {
    console.log('🧪 Probando acceso a /admin con middleware de testing...')

    // Configurar headers de testing
    await page.setExtraHTTPHeaders({
      'x-playwright-test': 'true',
      'x-test-auth': 'bypass',
    })

    // Navegar a /admin
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    // Verificar que NO fuimos redirigidos al login
    const currentUrl = page.url()
    console.log(`📍 URL actual: ${currentUrl}`)

    expect(currentUrl).not.toContain('/auth/signin')
    expect(currentUrl).toContain('/admin')

    // Verificar que la página cargó contenido
    const bodyText = await page.textContent('body')
    expect(bodyText).toBeTruthy()
    expect(bodyText!.length).toBeGreaterThan(100)

    console.log('✅ Acceso a /admin permitido por middleware de testing')
  })

  test('debe permitir acceso a /admin/products sin autenticación', async ({ page }) => {
    console.log('🧪 Probando acceso a /admin/products con middleware de testing...')

    // Configurar headers de testing
    await page.setExtraHTTPHeaders({
      'x-playwright-test': 'true',
      'x-test-auth': 'bypass',
    })

    // Navegar a /admin/products
    await page.goto('/admin/products')
    await page.waitForLoadState('networkidle')

    // Verificar que NO fuimos redirigidos al login
    const currentUrl = page.url()
    console.log(`📍 URL actual: ${currentUrl}`)

    expect(currentUrl).not.toContain('/auth/signin')
    expect(currentUrl).toContain('/admin/products')

    // Verificar que la página cargó contenido
    const bodyText = await page.textContent('body')
    expect(bodyText).toBeTruthy()
    expect(bodyText!.length).toBeGreaterThan(100)

    console.log('✅ Acceso a /admin/products permitido por middleware de testing')
  })

  test('debe verificar headers de testing en middleware', async ({ page }) => {
    console.log('🧪 Verificando headers de testing...')

    // Configurar headers de testing
    await page.setExtraHTTPHeaders({
      'x-playwright-test': 'true',
      'x-test-auth': 'bypass',
      'User-Agent': 'Playwright-Test-Agent',
    })

    // Interceptar respuestas para verificar headers
    const responses: any[] = []
    page.on('response', response => {
      if (response.url().includes('/admin')) {
        responses.push({
          url: response.url(),
          status: response.status(),
          headers: response.headers(),
        })
      }
    })

    // Navegar a /admin
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    // Verificar que recibimos respuestas exitosas
    expect(responses.length).toBeGreaterThan(0)

    const adminResponse = responses.find(r => r.url.endsWith('/admin'))
    if (adminResponse) {
      expect(adminResponse.status).toBeLessThan(400)
      console.log(`✅ Respuesta de /admin: ${adminResponse.status}`)
    }

    console.log('✅ Headers de testing verificados')
  })
})
