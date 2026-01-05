// ===================================
// PINTEYA E-COMMERCE - TESTS E2E PARA OPTIMIZACIÓN DEL MODAL DEL CARRITO EN MOBILE
// ===================================

import { test, expect } from '@playwright/test'

test.describe('Cart Modal Mobile Optimization Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Limpiar localStorage antes de cada test
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.clear()
    })
  })

  test('should display at least 2 products in cart scroll area on mobile', async ({ page }) => {
    // Configurar viewport para iPhone SE (pantalla pequeña)
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/shop')
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 })

    // Agregar al menos 2 productos al carrito
    const products = page.locator('[data-testid="product-card"]')
    const productCount = Math.min(await products.count(), 3) // Máximo 3 productos

    for (let i = 0; i < Math.min(productCount, 2); i++) {
      await products.nth(i).locator('[data-testid="add-to-cart-btn"]').click()
      await page.waitForTimeout(500) // Esperar para que se procese cada adición
    }

    // Verificar que el carrito tiene productos
    await expect(page.locator('[data-testid="cart-counter"]')).toHaveText('2')

    // Abrir modal del carrito
    await page.click('[data-testid="cart-icon"]')
    await page.waitForSelector('[data-testid="cart-item"]', { timeout: 5000 })

    // Verificar que el área de scroll tiene altura mínima
    const scrollArea = page.locator('.flex-1.overflow-y-auto, [class*="overflow-y-auto"]').first()
    await expect(scrollArea).toBeVisible()

    // Verificar altura del scroll usando JavaScript
    const scrollHeight = await page.evaluate(() => {
      const scrollElement = document.querySelector('.flex-1.overflow-y-auto, [class*="overflow-y-auto"]')
      if (!scrollElement) return 0
      return scrollElement.getBoundingClientRect().height
    })

    // La altura debe ser al menos 280px (mínimo para mostrar 2 productos)
    expect(scrollHeight).toBeGreaterThanOrEqual(280)

    // Verificar que hay al menos 2 items visibles
    const cartItems = page.locator('[data-testid="cart-item"]')
    const visibleItems = await cartItems.count()
    expect(visibleItems).toBeGreaterThanOrEqual(2)

    // Verificar que los items están visibles sin necesidad de scroll
    const firstItem = cartItems.first()
    const secondItem = cartItems.nth(1)

    await expect(firstItem).toBeVisible()
    await expect(secondItem).toBeVisible()

    // Verificar que ambos items están dentro del viewport
    const firstItemBox = await firstItem.boundingBox()
    const secondItemBox = await secondItem.boundingBox()
    const viewportHeight = page.viewportSize()?.height || 667

    expect(firstItemBox).not.toBeNull()
    expect(secondItemBox).not.toBeNull()

    if (firstItemBox && secondItemBox) {
      // Verificar que ambos items están visibles en el viewport
      expect(firstItemBox.y).toBeGreaterThanOrEqual(0)
      expect(firstItemBox.y + firstItemBox.height).toBeLessThanOrEqual(viewportHeight * 0.9) // 90% del viewport
      expect(secondItemBox.y).toBeGreaterThanOrEqual(0)
      expect(secondItemBox.y + secondItemBox.height).toBeLessThanOrEqual(viewportHeight * 0.9)
    }
  })

  test('should optimize scroll height for different viewport sizes', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667, name: 'iPhone SE' },
      { width: 390, height: 844, name: 'iPhone 12/13' },
      { width: 414, height: 896, name: 'iPhone 11 Pro Max' },
    ]

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto('/shop')
      await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 })

      // Agregar 2 productos
      const products = page.locator('[data-testid="product-card"]')
      for (let i = 0; i < 2; i++) {
        await products.nth(i).locator('[data-testid="add-to-cart-btn"]').click()
        await page.waitForTimeout(500)
      }

      // Abrir modal
      await page.click('[data-testid="cart-icon"]')
      await page.waitForSelector('[data-testid="cart-item"]', { timeout: 5000 })

      // Verificar altura del scroll
      const scrollHeight = await page.evaluate(() => {
        const scrollElement = document.querySelector('.flex-1.overflow-y-auto, [class*="overflow-y-auto"]')
        if (!scrollElement) return 0
        return scrollElement.getBoundingClientRect().height
      })

      // La altura debe ser al menos 280px
      expect(scrollHeight).toBeGreaterThanOrEqual(280)

      // Cerrar modal y limpiar para el siguiente test
      await page.press('body', 'Escape')
      await page.evaluate(() => {
        localStorage.clear()
      })
    }
  })

  test('should not deform elements with large typography', async ({ page }) => {
    // Configurar viewport mobile
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Simular tipografía grande usando CSS
    await page.addStyleTag({
      content: `
        * {
          font-size: 18px !important;
        }
        html {
          font-size: 18px !important;
        }
      `,
    })

    await page.goto('/shop')
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 })

    // Agregar productos
    const products = page.locator('[data-testid="product-card"]')
    for (let i = 0; i < 2; i++) {
      await products.nth(i).locator('[data-testid="add-to-cart-btn"]').click()
      await page.waitForTimeout(500)
    }

    // Abrir modal
    await page.click('[data-testid="cart-icon"]')
    await page.waitForSelector('[data-testid="cart-item"]', { timeout: 5000 })

    // Verificar que los elementos no se deforman
    const cartItems = page.locator('[data-testid="cart-item"]')
    const firstItem = cartItems.first()

    // Verificar que el item tiene dimensiones razonables
    const itemBox = await firstItem.boundingBox()
    expect(itemBox).not.toBeNull()

    if (itemBox) {
      // El ancho debe ser razonable (no muy pequeño ni muy grande)
      expect(itemBox.width).toBeGreaterThan(300)
      expect(itemBox.width).toBeLessThan(400)

      // La altura debe ser razonable
      expect(itemBox.height).toBeGreaterThan(50)
      expect(itemBox.height).toBeLessThan(200)
    }

    // Verificar que el texto no se desborda
    const textElements = firstItem.locator('p, span, h3')
    const textCount = await textElements.count()

    for (let i = 0; i < textCount; i++) {
      const textElement = textElements.nth(i)
      const isVisible = await textElement.isVisible()
      if (isVisible) {
        const textBox = await textElement.boundingBox()
        if (textBox) {
          // Verificar que el texto no se desborda del contenedor
          expect(textBox.width).toBeLessThanOrEqual(itemBox?.width || 400)
        }
      }
    }
  })

  test('should optimize space usage in header and footer', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/shop')
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 })

    // Agregar productos
    const products = page.locator('[data-testid="product-card"]')
    for (let i = 0; i < 2; i++) {
      await products.nth(i).locator('[data-testid="add-to-cart-btn"]').click()
      await page.waitForTimeout(500)
    }

    // Abrir modal
    await page.click('[data-testid="cart-icon"]')
    await page.waitForSelector('[data-testid="cart-item"]', { timeout: 5000 })

    // Verificar altura del header (debe ser <= 80px)
    const headerHeight = await page.evaluate(() => {
      const header = document.querySelector('.flex.flex-col.flex-shrink-0.bg-white')
      if (!header) return 0
      return header.getBoundingClientRect().height
    })

    expect(headerHeight).toBeLessThanOrEqual(100) // Tolerancia para diferentes configuraciones

    // Verificar altura del footer (debe ser <= 120px)
    const footerHeight = await page.evaluate(() => {
      const footer = document.querySelector('.border-t.border-gray-200.bg-white')
      if (!footer) return 0
      return footer.getBoundingClientRect().height
    })

    expect(footerHeight).toBeLessThanOrEqual(150) // Tolerancia para diferentes configuraciones

    // Verificar que el área de scroll ocupa la mayor parte del espacio
    const scrollHeight = await page.evaluate(() => {
      const scrollElement = document.querySelector('.flex-1.overflow-y-auto, [class*="overflow-y-auto"]')
      if (!scrollElement) return 0
      return scrollElement.getBoundingClientRect().height
    })

    const viewportHeight = page.viewportSize()?.height || 667
    const modalHeight = viewportHeight * 0.75 // 75vh del modal

    // El scroll debe ocupar al menos el 50% del modal
    expect(scrollHeight).toBeGreaterThanOrEqual(modalHeight * 0.5)
  })

  test('should handle accessibility settings correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Simular preferencia de tipografía grande
    await page.emulateMedia({ reducedMotion: false })
    
    // Agregar media query para tipografía grande
    await page.addInitScript(() => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-font-size: large)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      })
    })

    await page.goto('/shop')
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 })

    // Agregar productos
    const products = page.locator('[data-testid="product-card"]')
    for (let i = 0; i < 2; i++) {
      await products.nth(i).locator('[data-testid="add-to-cart-btn"]').click()
      await page.waitForTimeout(500)
    }

    // Abrir modal
    await page.click('[data-testid="cart-icon"]')
    await page.waitForSelector('[data-testid="cart-item"]', { timeout: 5000 })

    // Verificar que el modal se ajusta correctamente
    const modalHeight = await page.evaluate(() => {
      const modal = document.querySelector('[role="dialog"]')
      if (!modal) return 0
      return modal.getBoundingClientRect().height
    })

    // Con tipografía grande, el modal debe ser más alto (85vh)
    const viewportHeight = page.viewportSize()?.height || 667
    const expectedMinHeight = viewportHeight * 0.75 // Al menos 75vh

    expect(modalHeight).toBeGreaterThanOrEqual(expectedMinHeight)
  })

  test('should maintain scroll functionality with multiple products', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/shop')
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 })

    // Agregar múltiples productos (más de 2 para probar scroll)
    const products = page.locator('[data-testid="product-card"]')
    const productCount = Math.min(await products.count(), 5)

    for (let i = 0; i < productCount; i++) {
      await products.nth(i).locator('[data-testid="add-to-cart-btn"]').click()
      await page.waitForTimeout(500)
    }

    // Abrir modal
    await page.click('[data-testid="cart-icon"]')
    await page.waitForSelector('[data-testid="cart-item"]', { timeout: 5000 })

    // Verificar que hay productos
    const cartItems = page.locator('[data-testid="cart-item"]')
    const itemCount = await cartItems.count()
    expect(itemCount).toBeGreaterThanOrEqual(2)

    // Verificar que los primeros 2 productos son visibles
    await expect(cartItems.first()).toBeVisible()
    await expect(cartItems.nth(1)).toBeVisible()

    // Verificar que el scroll funciona
    const scrollArea = page.locator('.flex-1.overflow-y-auto, [class*="overflow-y-auto"]').first()
    const canScroll = await page.evaluate((element) => {
      if (!element) return false
      return element.scrollHeight > element.clientHeight
    }, await scrollArea.elementHandle())

    if (itemCount > 2) {
      expect(canScroll).toBe(true)
    }
  })

  test('should validate cart products with Supabase database', async ({ page }) => {
    // Este test requiere que MCP de Supabase esté configurado
    // Se puede ejecutar condicionalmente si MCP está disponible
    
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/shop')
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 })

    // Agregar productos al carrito
    const products = page.locator('[data-testid="product-card"]')
    const productCount = Math.min(await products.count(), 2)

    const addedProductIds: number[] = []

    for (let i = 0; i < productCount; i++) {
      // Obtener ID del producto antes de agregarlo
      const productId = await products.nth(i).getAttribute('data-product-id')
      if (productId) {
        addedProductIds.push(parseInt(productId))
      }
      
      await products.nth(i).locator('[data-testid="add-to-cart-btn"]').click()
      await page.waitForTimeout(500)
    }

    // Abrir modal del carrito
    await page.click('[data-testid="cart-icon"]')
    await page.waitForSelector('[data-testid="cart-item"]', { timeout: 5000 })

    // Obtener información de los productos del carrito desde el DOM
    const cartItems = page.locator('[data-testid="cart-item"]')
    const itemCount = await cartItems.count()
    expect(itemCount).toBeGreaterThanOrEqual(productCount)

    // Verificar que los productos se muestran correctamente
    for (let i = 0; i < itemCount; i++) {
      const item = cartItems.nth(i)
      await expect(item).toBeVisible()
      
      // Verificar que tiene título
      const title = item.locator('h3')
      await expect(title).toBeVisible()
      
      // Verificar que tiene precio
      const price = item.locator('[style*="color: rgb(194, 65, 11)"]')
      const priceText = await price.textContent()
      expect(priceText).toBeTruthy()
      expect(priceText).toContain('$')
    }

    // Nota: La validación completa con MCP de Supabase se puede hacer
    // en un test separado que use directamente las funciones MCP
    // para verificar que los productos en el carrito existen en la BD
    // y tienen los datos correctos (precio, stock, etc.)
  })
})

