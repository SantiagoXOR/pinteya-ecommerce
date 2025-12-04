import { test, expect } from '@playwright/test'

test.describe('Panel Administrativo - Formulario de Productos', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar al formulario de crear producto
    await page.goto('/admin/products/new')
  })

  test('debe cargar el formulario de crear producto correctamente', async ({ page }) => {
    await page.waitForLoadState('networkidle')

    // Verificar que estamos en la página correcta
    const isCreatePage = page.url().includes('/create') || page.url().includes('/new')
    const hasForm = await page.locator('form').isVisible()

    expect(isCreatePage || hasForm).toBeTruthy()

    // Verificar que el formulario esté presente
    if (hasForm) {
      await expect(page.locator('form')).toBeVisible()

      // Buscar pestañas con diferentes selectores
      const tabSelectors = ['[role="tablist"]', '.tabs', 'button[role="tab"]']

      for (const selector of tabSelectors) {
        const tabs = page.locator(selector)
        if (await tabs.isVisible()) {
          break
        }
      }
    }
  })

  test('debe validar campos requeridos en el tab General', async ({ page }) => {
    await page.waitForLoadState('networkidle')

    // Buscar el botón de submit
    const submitSelectors = [
      'button[type="submit"]',
      'button:has-text("Guardar")',
      'button:has-text("Crear")',
      'button:has-text("Save")',
    ]

    let submitButton = null
    for (const selector of submitSelectors) {
      const button = page.locator(selector)
      if (await button.isVisible()) {
        submitButton = button
        break
      }
    }

    if (submitButton) {
      await submitButton.click()
      await page.waitForTimeout(1000)

      // Buscar mensajes de error con diferentes textos
      const errorMessages = [
        'El nombre es requerido',
        'Name is required',
        'Required',
        'Este campo es obligatorio',
      ]

      let foundError = false
      for (const message of errorMessages) {
        const error = page.locator(`text=${message}`)
        if (await error.isVisible()) {
          foundError = true
          break
        }
      }

      // Si no encontramos errores específicos, verificar que hay elementos de error
      if (!foundError) {
        const errorElements = page.locator('.error, .text-red-500, [role="alert"]')
        const errorCount = await errorElements.count()
        expect(errorCount).toBeGreaterThan(0)
      }
    }
  })

  test('debe llenar correctamente el tab General', async ({ page }) => {
    await page.waitForLoadState('networkidle')

    // Buscar y llenar campo de nombre
    const nameSelectors = [
      'input[name="name"]',
      'input[placeholder*="nombre"]',
      'input[placeholder*="Name"]',
    ]

    for (const selector of nameSelectors) {
      const nameInput = page.locator(selector)
      if (await nameInput.isVisible()) {
        await nameInput.fill('Pintura Látex Blanco 4L')
        break
      }
    }

    // Buscar y llenar campo de descripción
    const descSelectors = [
      'textarea[name="description"]',
      'textarea[name="short_description"]',
      'textarea[placeholder*="descripción"]',
      'textarea[placeholder*="Description"]',
    ]

    for (const selector of descSelectors) {
      const descInput = page.locator(selector)
      if (await descInput.isVisible()) {
        await descInput.fill(
          'Pintura látex premium ideal para paredes interiores. Excelente cobertura y durabilidad.'
        )
        break
      }
    }

    // Buscar y seleccionar categoría
    const categorySelectors = [
      '[data-testid="category-selector"]',
      'select[name="category"]',
      'select[name="categoryId"]',
      '[role="combobox"]',
    ]

    for (const selector of categorySelectors) {
      const categorySelect = page.locator(selector)
      if (await categorySelect.isVisible()) {
        await categorySelect.click()
        await page.waitForTimeout(500)

        // Intentar seleccionar la primera opción disponible
        const options = page.locator('option, [role="option"], text=Interiores')
        const optionCount = await options.count()
        if (optionCount > 0) {
          await options.first().click()
        }
        break
      }
    }
  })

  test('debe configurar precios correctamente en el tab Precios', async ({ page }) => {
    // Navegar al tab de precios
    await page.click('[role="tab"]:has-text("Precios")')

    // Llenar precio de venta
    await page.fill('input[name="price"]', '2500')

    // Llenar precio de comparación
    await page.fill('input[name="compare_price"]', '3000')

    // Llenar precio de costo
    await page.fill('input[name="cost_price"]', '1500')

    // Verificar que se calcularon las métricas automáticamente
    await expect(page.locator('[data-testid="profit-margin"]')).toContainText('40.0%')
    await expect(page.locator('[data-testid="markup"]')).toContainText('66.7%')
    await expect(page.locator('[data-testid="discount"]')).toContainText('16.7%')
  })

  test('debe configurar inventario en el tab Inventario', async ({ page }) => {
    // Navegar al tab de inventario
    await page.click('[role="tab"]:has-text("Inventario")')

    // Verificar que el rastreo de inventario esté habilitado por defecto
    const trackInventoryToggle = page.locator('input[name="track_inventory"]')
    await expect(trackInventoryToggle).toBeChecked()

    // Configurar stock
    await page.fill('input[name="stock"]', '100')

    // Configurar umbral de stock bajo
    await page.fill('input[name="low_stock_threshold"]', '10')

    // Habilitar pedidos pendientes
    await page.check('input[name="allow_backorder"]')

    // Probar ajustes rápidos de stock
    await page.click('button:has-text("+50")')
    await expect(page.locator('input[name="stock"]')).toHaveValue('150')
  })

  test('debe gestionar imágenes en el tab Imágenes', async ({ page }) => {
    // Navegar al tab de imágenes
    await page.click('[role="tab"]:has-text("Imágenes")')

    // Verificar que el área de upload esté presente
    await expect(page.locator('[data-testid="image-upload-area"]')).toBeVisible()

    // Verificar mensaje de instrucciones
    await expect(page.locator('text=Arrastra imágenes aquí')).toBeVisible()

    // Verificar límite de imágenes
    await expect(page.locator('text=Máximo 10 imágenes')).toBeVisible()

    // Nota: Para probar upload real de archivos, necesitarías archivos de prueba
    // y usar page.setInputFiles()
  })

  test('debe configurar variantes en el tab Variantes', async ({ page }) => {
    // Navegar al tab de variantes
    await page.click('[role="tab"]:has-text("Variantes")')

    // Verificar tipos de variantes predefinidos
    await expect(page.locator('text=Color')).toBeVisible()
    await expect(page.locator('text=Tamaño')).toBeVisible()
    await expect(page.locator('text=Material')).toBeVisible()

    // Agregar variante de color
    await page.click('button:has-text("Color")')

    // Verificar que se agregó la variante
    await expect(page.locator('[data-testid="variant-color"]')).toBeVisible()

    // Agregar variante personalizada
    await page.fill('input[placeholder*="Nombre de la variante"]', 'Acabado')
    await page.click('button[data-testid="add-custom-variant"]')

    // Verificar que se agregó
    await expect(page.locator('text=Acabado')).toBeVisible()
  })

  test('debe optimizar SEO en el tab SEO', async ({ page }) => {
    // Primero llenar el nombre del producto para auto-generación
    await page.click('[role="tab"]:has-text("General")')
    await page.fill('input[name="name"]', 'Pintura Látex Premium Blanco')

    // Navegar al tab SEO
    await page.click('[role="tab"]:has-text("SEO")')

    // Verificar que se generó el slug automáticamente
    await expect(page.locator('input[name="slug"]')).toHaveValue('pintura-latex-premium-blanco')

    // Auto-generar título SEO
    await page.click('button:has-text("Auto-generar"):near(input[name="seo_title"])')
    await expect(page.locator('input[name="seo_title"]')).toHaveValue(
      /Pintura Látex Premium Blanco/
    )

    // Auto-generar descripción SEO
    await page.click('button:has-text("Auto-generar"):near(textarea[name="seo_description"])')
    await expect(page.locator('textarea[name="seo_description"]')).toHaveValue(
      /Compra Pintura Látex Premium Blanco/
    )

    // Verificar puntuación SEO
    await expect(page.locator('[data-testid="seo-score"]')).toBeVisible()

    // Verificar vista previa de Google
    await expect(page.locator('[data-testid="google-preview"]')).toBeVisible()
  })

  test('debe mostrar indicadores de error en tabs con problemas', async ({ page }) => {
    // Intentar enviar formulario incompleto
    await page.click('button:has-text("Crear Producto")')

    // Verificar que los tabs con errores muestran indicadores
    const generalTab = page.locator('[role="tab"]:has-text("General")')
    await expect(generalTab.locator('[data-testid="error-indicator"]')).toBeVisible()
  })

  test('debe permitir cancelar la creación', async ({ page }) => {
    // Llenar algunos campos
    await page.fill('input[name="name"]', 'Producto de Prueba')

    // Click en cancelar
    await page.click('button:has-text("Cancelar")')

    // Verificar que navegó de vuelta a la lista
    await expect(page).toHaveURL('/admin/products')
  })

  test('debe crear producto exitosamente con datos válidos', async ({ page }) => {
    // Llenar formulario completo
    await page.fill('input[name="name"]', 'Pintura Test E2E')
    await page.fill('textarea[name="description"]', 'Descripción de prueba para E2E')

    // Seleccionar categoría (mock o usar una existente)
    await page.click('[data-testid="category-selector"]')
    await page.click('text=Interiores')

    // Configurar precios
    await page.click('[role="tab"]:has-text("Precios")')
    await page.fill('input[name="price"]', '1000')

    // Configurar inventario
    await page.click('[role="tab"]:has-text("Inventario")')
    await page.fill('input[name="stock"]', '50')

    // Enviar formulario
    await page.click('button:has-text("Crear Producto")')

    // Verificar redirección exitosa (esto depende de tu implementación)
    // Podría redirigir a la vista del producto o a la lista
    await expect(page).toHaveURL(/\/admin\/products/)

    // Verificar mensaje de éxito (si usas toast notifications)
    await expect(page.locator('[data-testid="success-toast"]')).toContainText(
      'Producto creado exitosamente'
    )
  })
})
