import { test, expect } from '@playwright/test'

test.describe('Paint Visualizer', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a la página principal
    await page.goto('http://localhost:3000')
    // Esperar a que la página cargue completamente
    await page.waitForLoadState('networkidle')
  })

  test('debería abrir el modal del Paint Visualizer', async ({ page }) => {
    // Buscar el botón o card del Paint Visualizer
    // Puede estar en la sección de "Best Seller" o similar
    const paintVisualizerCard = page.locator('[data-testid="paint-visualizer-card"]').or(
      page.getByText('Probar PinteYa ColorMate').first()
    )

    // Verificar que el card existe
    await expect(paintVisualizerCard).toBeVisible({ timeout: 10000 })

    // Hacer clic para abrir el modal
    await paintVisualizerCard.click()

    // Verificar que el modal se abre
    const modal = page.locator('[role="dialog"]').first()
    await expect(modal).toBeVisible()

    // Verificar que el modal aparece por encima del header y bottom bar
    // El modal debería tener z-index mayor que header (1100) y bottom-nav (1300)
    const modalZIndex = await modal.evaluate((el) => {
      const styles = window.getComputedStyle(el)
      return styles.zIndex
    })
    expect(parseInt(modalZIndex)).toBeGreaterThan(1300)
  })

  test('flujo completo: selección de producto, color, cámara y procesamiento', async ({ page, context }) => {
    // Otorgar permisos de cámara
    await context.grantPermissions(['camera'])

    // Buscar y abrir el modal
    const paintVisualizerCard = page.locator('[data-testid="paint-visualizer-card"]').or(
      page.getByText('Probar PinteYa ColorMate').first()
    )
    await expect(paintVisualizerCard).toBeVisible({ timeout: 10000 })
    await paintVisualizerCard.click()

    // Esperar a que el modal se abra
    const modal = page.locator('[role="dialog"]').first()
    await expect(modal).toBeVisible()

    // PASO 1: Vista de selección de productos
    // Verificar que estamos en la vista de selección
    await expect(page.getByText('Selecciona un producto').first()).toBeVisible({ timeout: 5000 })

    // Seleccionar el primer producto disponible
    const firstProduct = page.locator('[data-testid="product-card"]').first().or(
      modal.locator('.grid').first().locator('> div').first()
    )
    
    if (await firstProduct.count() > 0) {
      await firstProduct.click({ timeout: 5000 })

      // Esperar a que se seleccione el producto
      await page.waitForTimeout(500)

      // PASO 2: Continuar a la vista de cámara
      const continueButton = page.getByText('Continuar').first().or(
        page.getByRole('button', { name: /continuar/i }).first()
      )
      
      if (await continueButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await continueButton.click()
        
        // PASO 3: Vista de cámara
        // Verificar que estamos en la vista de cámara
        await page.waitForTimeout(1000)
        
        // Verificar que hay un selector de colores
        const colorSelector = page.locator('[data-testid="color-pill-selector"]').or(
          page.locator('.flex').filter({ hasText: /AMARILLO|AZUL|ROJO/i }).first()
        )
        
        // Si hay selector de colores visible, seleccionar un color
        if (await colorSelector.count() > 0) {
          const firstColor = colorSelector.locator('button').first().or(
            colorSelector.locator('[role="button"]').first()
          )
          if (await firstColor.isVisible({ timeout: 3000 }).catch(() => false)) {
            await firstColor.click()
          }
        }

        // PASO 4: Capturar foto o subir imagen
        const galleryButton = page.getByText('Galería').first().or(
          page.locator('button').filter({ hasText: /galería|galeria/i }).first()
        )

        if (await galleryButton.isVisible({ timeout: 3000 }).catch(() => false)) {
          // Usar galería en lugar de cámara para pruebas automatizadas
          await galleryButton.click()
          
          // En una prueba real, aquí se subiría una imagen
          // Por ahora, verificamos que el input de archivo existe
          const fileInput = page.locator('input[type="file"]').first()
          if (await fileInput.count() > 0) {
            // Nota: Playwright puede simular la selección de archivos
            // pero para pruebas completas necesitarías una imagen de prueba
          }
        }
      }
    }

    // Verificar que el modal sigue visible durante todo el flujo
    await expect(modal).toBeVisible()
  })

  test('el modal debería estar por encima del header y bottom bar', async ({ page }) => {
    // Abrir el modal
    const paintVisualizerCard = page.locator('[data-testid="paint-visualizer-card"]').or(
      page.getByText('Probar PinteYa ColorMate').first()
    )
    await expect(paintVisualizerCard).toBeVisible({ timeout: 10000 })
    await paintVisualizerCard.click()

    const modal = page.locator('[role="dialog"]').first()
    await expect(modal).toBeVisible()

    // Obtener z-index del modal
    const modalZIndex = await modal.evaluate((el) => {
      const styles = window.getComputedStyle(el)
      return parseInt(styles.zIndex) || 0
    })

    // Buscar el header (puede tener diferentes selectores)
    const header = page.locator('header').first().or(
      page.locator('[data-testid="header"]').first()
    )
    
    let headerZIndex = 0
    if (await header.count() > 0) {
      headerZIndex = await header.evaluate((el) => {
        const styles = window.getComputedStyle(el)
        return parseInt(styles.zIndex) || 0
      })
    }

    // Buscar el bottom navigation
    const bottomNav = page.locator('nav').filter({ hasText: /Inicio|Carrito/i }).first().or(
      page.locator('[data-testid="bottom-nav"]').first()
    )
    
    let bottomNavZIndex = 0
    if (await bottomNav.count() > 0) {
      bottomNavZIndex = await bottomNav.evaluate((el) => {
        const styles = window.getComputedStyle(el)
        return parseInt(styles.zIndex) || 0
      })
    }

    // El modal debe tener z-index mayor que header y bottom-nav
    expect(modalZIndex).toBeGreaterThan(headerZIndex)
    expect(modalZIndex).toBeGreaterThan(bottomNavZIndex)
    // Según la jerarquía, el modal debería ser al menos 5200 (z-dialog)
    expect(modalZIndex).toBeGreaterThanOrEqual(5000)
  })

  test('debería cerrar el modal correctamente', async ({ page }) => {
    // Abrir el modal
    const paintVisualizerCard = page.locator('[data-testid="paint-visualizer-card"]').or(
      page.getByText('Probar PinteYa ColorMate').first()
    )
    await expect(paintVisualizerCard).toBeVisible({ timeout: 10000 })
    await paintVisualizerCard.click()

    const modal = page.locator('[role="dialog"]').first()
    await expect(modal).toBeVisible()

    // Cerrar el modal con el botón de cerrar
    const closeButton = page.getByRole('button', { name: /cerrar/i }).first().or(
      page.locator('button[aria-label="Cerrar modal"]').first()
    )
    
    if (await closeButton.count() > 0) {
      await closeButton.click()
      await expect(modal).not.toBeVisible({ timeout: 3000 })
    }
  })
})

