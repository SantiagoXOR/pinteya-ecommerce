import { test, expect } from '@playwright/test'

/**
 * Test simple para verificar que la geolocalización automática esté desactivada
 */

test.describe('Geolocalización - Test Simple', () => {
  test('Página debe cargar sin solicitar geolocalización automáticamente', async ({ page }) => {
    // Navegar a la página principal
    await page.goto('/')

    // Esperar a que la página cargue
    await page.waitForLoadState('networkidle')

    // Verificar que el header está visible
    const header = page.locator('header')
    await expect(header).toBeVisible()

    // Verificar que no hay diálogos de permisos visibles
    const dialogs = page.locator('[role="dialog"]')
    await expect(dialogs).toHaveCount(0)

    // Verificar que el TopBar está presente
    const topBar = page.locator('header').first()
    await expect(topBar).toBeVisible()
  })

  test('TopBar debe mostrar información de envío sin geolocalización', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Buscar texto relacionado con envíos
    const deliveryText = page.locator('text=/envío/i').first()
    await expect(deliveryText).toBeVisible()
  })

  test('No debe haber popups automáticos al cargar', async ({ page }) => {
    // Interceptar diálogos del navegador
    let dialogAppeared = false
    page.on('dialog', () => {
      dialogAppeared = true
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Esperar un momento para ver si aparece algún diálogo
    await page.waitForTimeout(3000)

    // Verificar que no apareció ningún diálogo
    expect(dialogAppeared).toBeFalsy()
  })

  test('Header debe renderizar completamente', async ({ page }) => {
    await page.goto('/')

    // Verificar elementos principales del header
    const header = page.locator('header')
    await expect(header).toBeVisible()

    // Verificar que hay contenido en el header
    const headerContent = await header.textContent()
    expect(headerContent).toBeTruthy()
    expect(headerContent!.length).toBeGreaterThan(0)
  })
})
