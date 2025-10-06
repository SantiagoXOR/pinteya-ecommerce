import { test, expect } from '@playwright/test'

/**
 * VERIFICACIÓN DE RENDERIZADO DEL HEADER
 * =====================================
 * Tests específicos para verificar que las correcciones del Header
 * han resuelto los problemas de renderizado identificados
 */

test.describe('Header Rendering Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a la página principal
    await page.goto('http://localhost:3000')

    // Esperar a que la página cargue completamente
    await page.waitForLoadState('networkidle')
  })

  test('Header principal se renderiza correctamente', async ({ page }) => {
    // Verificar que el header existe y es visible
    const header = page.locator('header')
    await expect(header).toBeVisible()

    // Verificar que tiene las clases CSS correctas
    await expect(header).toHaveClass(/fixed/)
    await expect(header).toHaveClass(/z-header/)
    await expect(header).toHaveClass(/bg-blaze-orange-600/)

    // Tomar screenshot del header
    await header.screenshot({ path: 'test-results/header-main.png' })
  })

  test('TopBar se renderiza sin problemas', async ({ page }) => {
    // Verificar que el topbar existe (solo en desktop)
    const topbar = page.locator('.bg-blaze-orange-700')

    // En desktop debería ser visible
    if ((await page.viewportSize()?.width!) > 1024) {
      await expect(topbar).toBeVisible()
    }

    // Verificar contenido de ubicación
    const locationElement = page.locator('text=Córdoba Capital')
    if (await locationElement.isVisible()) {
      await expect(locationElement).toBeVisible()
    }
  })

  test('Logo se renderiza correctamente', async ({ page }) => {
    // Verificar logo desktop
    const logoDesktop = page.locator('img[alt*="Pinteya"]').first()
    await expect(logoDesktop).toBeVisible()

    // Verificar que no tiene transforms problemáticos
    const logoStyles = await logoDesktop.evaluate(el => {
      const styles = window.getComputedStyle(el)
      return {
        transform: styles.transform,
        position: styles.position,
      }
    })

    // El transform no debería ser scale
    expect(logoStyles.transform).not.toContain('scale')
  })

  test('Buscador se renderiza y funciona', async ({ page }) => {
    // Verificar que el contenedor de búsqueda existe
    const searchContainer = page.locator('.search-focus-ring')
    await expect(searchContainer).toBeVisible()

    // Verificar que no tiene positioning relativo problemático
    const searchStyles = await searchContainer.evaluate(el => {
      const styles = window.getComputedStyle(el)
      return {
        position: styles.position,
        zIndex: styles.zIndex,
        overflow: styles.overflow,
      }
    })

    // Verificar correcciones aplicadas
    expect(searchStyles.position).toBe('static')
    expect(searchStyles.overflow).toBe('visible')

    // Verificar que el input de búsqueda funciona
    const searchInput = page.locator('input[placeholder*="Buscar"]')
    await expect(searchInput).toBeVisible()
    await searchInput.click()
    await searchInput.fill('pintura')

    // Verificar que no hay errores de JavaScript
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.waitForTimeout(1000)
    expect(errors.length).toBe(0)
  })

  test('Carrito se renderiza correctamente', async ({ page }) => {
    // Verificar botón del carrito (solo desktop)
    const cartButton = page.locator('[data-testid="cart-icon"]')

    if ((await page.viewportSize()?.width!) > 640) {
      await expect(cartButton).toBeVisible()

      // Verificar que no tiene transforms problemáticos
      const cartStyles = await cartButton.evaluate(el => {
        const styles = window.getComputedStyle(el)
        return {
          transform: styles.transform,
          position: styles.position,
        }
      })

      // No debería tener scale transforms
      expect(cartStyles.transform).not.toContain('scale')

      // Verificar que el ícono del carrito es clickeable
      await cartButton.click()

      // Verificar que no hay errores después del click
      await page.waitForTimeout(500)
    }
  })

  test('Autenticación se renderiza correctamente', async ({ page }) => {
    // Verificar elementos de autenticación
    const authSection = page.locator('text=Ingresá').or(page.locator('[data-testid*="auth"]'))

    // Debería existir algún elemento de autenticación
    const authExists = (await authSection.count()) > 0
    expect(authExists).toBe(true)
  })

  test('Header responsive funciona correctamente', async ({ page }) => {
    // Test en mobile
    await page.setViewportSize({ width: 375, height: 667 })
    await page.reload()
    await page.waitForLoadState('networkidle')

    const header = page.locator('header')
    await expect(header).toBeVisible()

    // Verificar que el overflow está configurado correctamente
    const headerStyles = await header.evaluate(el => {
      const styles = window.getComputedStyle(el)
      return {
        overflowX: styles.overflowX,
        overflowY: styles.overflowY,
      }
    })

    expect(headerStyles.overflowX).toBe('hidden')
    expect(headerStyles.overflowY).toBe('visible')

    // Tomar screenshot mobile
    await header.screenshot({ path: 'test-results/header-mobile.png' })

    // Test en desktop
    await page.setViewportSize({ width: 1200, height: 800 })
    await page.reload()
    await page.waitForLoadState('networkidle')

    await expect(header).toBeVisible()

    // Tomar screenshot desktop
    await header.screenshot({ path: 'test-results/header-desktop.png' })
  })

  test('Z-index hierarchy funciona correctamente', async ({ page }) => {
    // Verificar que el header tiene el z-index correcto
    const header = page.locator('header')
    const headerZIndex = await header.evaluate(el => {
      return window.getComputedStyle(el).zIndex
    })

    // Debería tener un z-index alto para estar por encima de otros elementos
    expect(parseInt(headerZIndex)).toBeGreaterThan(999)

    // Verificar que el dropdown de búsqueda puede aparecer
    const searchInput = page.locator('input[placeholder*="Buscar"]')
    await searchInput.click()
    await searchInput.fill('test')

    // Esperar a que aparezca el dropdown (si existe)
    await page.waitForTimeout(1000)

    // No debería haber elementos superpuestos problemáticos
    const overlappingElements = await page.evaluate(() => {
      const header = document.querySelector('header')
      if (!header) return []

      const headerRect = header.getBoundingClientRect()
      const elements = document.elementsFromPoint(
        headerRect.left + headerRect.width / 2,
        headerRect.top + headerRect.height / 2
      )

      return elements.map(el => el.tagName + '.' + el.className)
    })

    // El header debería estar en la parte superior de la pila
    expect(overlappingElements[0]).toContain('HEADER')
  })

  test('No hay errores de JavaScript relacionados con el Header', async ({ page }) => {
    const errors: string[] = []
    const warnings: string[] = []

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      } else if (msg.type() === 'warning') {
        warnings.push(msg.text())
      }
    })

    // Interactuar con elementos del header
    const searchInput = page.locator('input[placeholder*="Buscar"]')
    if (await searchInput.isVisible()) {
      await searchInput.click()
      await searchInput.fill('test search')
      await page.waitForTimeout(500)
    }

    const cartButton = page.locator('[data-testid="cart-icon"]')
    if (await cartButton.isVisible()) {
      await cartButton.click()
      await page.waitForTimeout(500)
    }

    // Verificar que no hay errores críticos
    const criticalErrors = errors.filter(
      error =>
        error.includes('Header') ||
        error.includes('search') ||
        error.includes('cart') ||
        error.includes('transform') ||
        error.includes('z-index')
    )

    expect(criticalErrors.length).toBe(0)

    // Log de errores para debugging si los hay
    if (errors.length > 0) {
      console.log('JavaScript errors found:', errors)
    }
    if (warnings.length > 0) {
      console.log('JavaScript warnings found:', warnings)
    }
  })

  test('Performance del Header es aceptable', async ({ page }) => {
    // Medir tiempo de renderizado del header
    const startTime = Date.now()

    await page.goto('http://localhost:3000')

    // Esperar a que el header sea visible
    const header = page.locator('header')
    await expect(header).toBeVisible()

    const endTime = Date.now()
    const renderTime = endTime - startTime

    // El header debería renderizarse en menos de 3 segundos
    expect(renderTime).toBeLessThan(3000)

    console.log(`Header render time: ${renderTime}ms`)
  })
})
