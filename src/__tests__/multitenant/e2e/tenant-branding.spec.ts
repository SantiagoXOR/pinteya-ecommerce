/**
 * Tests E2E - Tenant Branding
 * 
 * Verifica que:
 * - Logo correcto por tenant
 * - Colores del tema correctos por tenant
 * - Favicon correcto por tenant
 * - Imágenes hero correctas por tenant
 * - Footer muestra nombre correcto del tenant
 * - WhatsApp number correcto por tenant
 */

import { test, expect } from '@playwright/test'

test.describe('Tenant Branding', () => {
  test('should show correct logo for Pinteya', async ({ page }) => {
    await page.goto('http://pinteya.pintureriadigital.com:3000', {
      waitUntil: 'networkidle',
    })

    // Buscar logo en el header
    const logo = page.locator('img[alt*="Pinteya"], img[src*="pinteya"]').first()
    await expect(logo).toBeVisible()
  })

  test('should show correct logo for Pintemas', async ({ page }) => {
    await page.goto('http://pintemas.pintureriadigital.com:3000', {
      waitUntil: 'networkidle',
    })

    const logo = page.locator('img[alt*="Pintemas"], img[src*="pintemas"]').first()
    await expect(logo).toBeVisible()
  })

  test('should apply correct CSS variables for Pinteya colors', async ({ page }) => {
    await page.goto('http://pinteya.pintureriadigital.com:3000', {
      waitUntil: 'networkidle',
    })

    // Verificar que las variables CSS están aplicadas
    const primaryColor = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--tenant-primary')
    })

    // Pinteya debería tener color primario #f27a1d
    expect(primaryColor.trim()).toContain('#f27a1d')
  })

  test('should apply correct CSS variables for Pintemas colors', async ({ page }) => {
    await page.goto('http://pintemas.pintureriadigital.com:3000', {
      waitUntil: 'networkidle',
    })

    const primaryColor = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--tenant-primary')
    })

    // Pintemas debería tener color primario diferente
    expect(primaryColor.trim()).not.toContain('#f27a1d')
  })

  test('should show correct favicon for tenant', async ({ page }) => {
    await page.goto('http://pinteya.pintureriadigital.com:3000', {
      waitUntil: 'networkidle',
    })

    // Verificar favicon
    const favicon = page.locator('link[rel="icon"], link[rel="shortcut icon"]')
    await expect(favicon).toHaveAttribute('href', /pinteya/)
  })

  test('should show correct tenant name in footer', async ({ page }) => {
    await page.goto('http://pinteya.pintureriadigital.com:3000', {
      waitUntil: 'networkidle',
    })

    // Buscar nombre del tenant en el footer
    const footer = page.locator('footer')
    await expect(footer).toContainText('Pinteya')
  })

  test('should show correct WhatsApp number for tenant', async ({ page }) => {
    await page.goto('http://pinteya.pintureriadigital.com:3000', {
      waitUntil: 'networkidle',
    })

    // Buscar link de WhatsApp
    const whatsappLink = page.locator('a[href*="wa.me"], a[href*="whatsapp"]').first()
    if (await whatsappLink.count() > 0) {
      const href = await whatsappLink.getAttribute('href')
      expect(href).toContain('5493516323002') // Número de Pinteya
    }
  })

  test('should load hero images from tenant directory', async ({ page }) => {
    await page.goto('http://pinteya.pintureriadigital.com:3000', {
      waitUntil: 'networkidle',
    })

    // Buscar imágenes hero
    const heroImages = page.locator('img[src*="/tenants/pinteya/hero"]')
    const count = await heroImages.count()

    // Debería haber al menos una imagen hero
    expect(count).toBeGreaterThan(0)
  })
})
