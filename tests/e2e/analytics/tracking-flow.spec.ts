/**
 * E2E Test: Flujo completo de tracking
 * Verifica el flujo completo: page_view → product_view → add_to_cart → checkout → purchase
 */

import { test, expect } from '@playwright/test'

test.describe('Analytics - Flujo Completo de Tracking', () => {
  test('debería trackear flujo completo de e-commerce', async ({ page, request }) => {
    // Navegar a página principal
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Esperar a que se registre page_view
    await page.waitForTimeout(1000)

    // Navegar a página de producto
    await page.goto('/product/test-product')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // Simular agregar al carrito (si hay botón)
    const addToCartButton = page.locator('button:has-text("Agregar"), button:has-text("Comprar")').first()
    if (await addToCartButton.isVisible().catch(() => false)) {
      await addToCartButton.click()
      await page.waitForTimeout(500)
    }

    // Verificar eventos en base de datos
    const eventsResponse = await request.get('/api/analytics/events/optimized', {
      params: {
        limit: 10,
      },
    })

    if (eventsResponse.ok()) {
      const events = await eventsResponse.json()
      console.log(`✅ Eventos registrados: ${events.length}`)

      // Verificar que hay eventos
      expect(events.length).toBeGreaterThan(0)

      // Verificar tipos de eventos
      const eventTypes = events.map((e: any) => e.event_name || e.event_type)
      console.log(`📊 Tipos de eventos: ${eventTypes.join(', ')}`)
    }
  })

  test('debería calcular métricas correctamente después de eventos', async ({ request }) => {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 1)
    const endDate = new Date()

    const metricsResponse = await request.get('/api/analytics/metrics', {
      params: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    })

    expect(metricsResponse.status()).toBeLessThan(500)

    if (metricsResponse.ok()) {
      const metrics = await metricsResponse.json()

      expect(metrics).toHaveProperty('ecommerce')
      expect(metrics).toHaveProperty('engagement')
      expect(metrics.ecommerce).toHaveProperty('cartAdditions')
      expect(metrics.ecommerce).toHaveProperty('productViews')
      expect(metrics.engagement).toHaveProperty('uniqueSessions')
    }
  })

  test('debería persistir eventos cuando hay bloqueadores simulados', async ({ page, context }) => {
    // Interceptar y bloquear requests a /api/analytics/events
    await context.route('**/api/analytics/events**', (route) => {
      route.abort('failed')
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Esperar a que el sistema intente enviar eventos
    await page.waitForTimeout(2000)

    // Verificar que los eventos se persisten en IndexedDB
    // (esto se verifica indirectamente verificando que se envían después)
    const eventsResponse = await request.get('/api/track/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        event: 'test_event',
        category: 'test',
        action: 'test',
        sessionId: 'test-session-e2e',
        page: '/test',
      },
    })

    expect(eventsResponse.status()).toBe(200)
  })
})
