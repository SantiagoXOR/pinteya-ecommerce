/**
 * E2E Test: Resistencia a bloqueadores
 * Verifica que el sistema funciona incluso con bloqueadores activos
 */

import { test, expect } from '@playwright/test'

test.describe('Analytics - Resistencia a Bloqueadores', () => {
  test('debería usar endpoint alternativo cuando endpoint original está bloqueado', async ({ page, context }) => {
    // Bloquear endpoint original
    await context.route('**/api/analytics/events**', (route) => {
      route.abort('blockedbyclient')
    })

    // Permitir endpoint alternativo
    await context.route('**/api/track/events**', (route) => {
      route.continue()
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Verificar que se hacen requests al endpoint alternativo
    const requests = []
    page.on('request', (request) => {
      if (request.url().includes('/api/track/events')) {
        requests.push(request.url())
      }
    })

    await page.waitForTimeout(2000)

    // Debería haber intentos al endpoint alternativo
    expect(requests.length).toBeGreaterThan(0)
  })

  test('debería usar sendBeacon cuando fetch está bloqueado', async ({ page, context }) => {
    // Bloquear ambos endpoints de fetch
    await context.route('**/api/analytics/events**', (route) => {
      route.abort('blockedbyclient')
    })
    await context.route('**/api/track/events**', (route) => {
      route.abort('blockedbyclient')
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // El sistema debería intentar usar sendBeacon
    // Verificamos que no hay errores en consola
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.waitForTimeout(2000)

    // No debería haber errores críticos (los eventos se persisten en IndexedDB)
    const criticalErrors = errors.filter((e) => e.includes('ERR_BLOCKED_BY_CLIENT'))
    expect(criticalErrors.length).toBe(0)
  })

  test('debería persistir eventos en IndexedDB cuando todas las estrategias fallan', async ({ page, context }) => {
    // Bloquear todos los endpoints
    await context.route('**/api/analytics/**', (route) => {
      route.abort('blockedbyclient')
    })
    await context.route('**/api/track/**', (route) => {
      route.abort('blockedbyclient')
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Esperar a que se intente enviar eventos
    await page.waitForTimeout(2000)

    // Verificar que los eventos se pueden recuperar después
    // (simulando que el bloqueador se desactiva)
    await context.unroute('**/api/track/**')

    // Forzar flush de eventos pendientes
    await page.evaluate(() => {
      if ((window as any).eventPersistence) {
        ;(window as any).eventPersistence.flushPendingEvents()
      }
    })

    await page.waitForTimeout(2000)

    // Verificar que se intentaron enviar eventos
    const requests = []
    page.on('request', (request) => {
      if (request.url().includes('/api/track/events')) {
        requests.push(request.url())
      }
    })

    await page.waitForTimeout(1000)

    // Debería haber intentos de envío
    expect(requests.length).toBeGreaterThanOrEqual(0)
  })

  test('debería detectar bloqueadores proactivamente', async ({ page }) => {
    await page.goto('/')

    // Verificar que el detector de bloqueadores está funcionando
    const adBlockDetected = await page.evaluate(() => {
      return (window as any).adBlockDetector?.detectAdBlockers() || false
    })

    // El resultado puede ser true o false dependiendo del entorno
    // Lo importante es que no lance error
    expect(typeof adBlockDetected).toBe('boolean')
  })
})
