// ===================================
// PINTEYA E-COMMERCE - TESTS E2E PARA PERSISTENCIA DEL CARRITO
// ===================================

import { test, expect } from '@playwright/test'

test.describe('Cart Persistence E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Limpiar localStorage antes de cada test
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.clear()
    })
  })

  test('should persist cart items in localStorage for unauthenticated users', async ({ page }) => {
    // Navegar a la tienda
    await page.goto('/shop')
    await page.waitForSelector('[data-testid="product-card"]')

    // Agregar producto al carrito
    const firstProduct = page.locator('[data-testid="product-card"]').first()
    await firstProduct.locator('[data-testid="add-to-cart-btn"]').click()

    // Verificar que el carrito se actualiza
    const cartCounter = page.locator('[data-testid="cart-counter"]')
    await expect(cartCounter).toHaveText('1')

    // Verificar que se guardó en localStorage
    const localStorageData = await page.evaluate(() => {
      return localStorage.getItem('pinteya-cart')
    })

    expect(localStorageData).toBeTruthy()

    const parsedData = JSON.parse(localStorageData!)
    expect(parsedData.items).toHaveLength(1)
    expect(parsedData.timestamp).toBeTruthy()
    expect(parsedData.version).toBe('1.0.0')
  })

  test('should restore cart from localStorage after page reload', async ({ page }) => {
    // Navegar a la tienda y agregar producto
    await page.goto('/shop')
    await page.waitForSelector('[data-testid="product-card"]')

    const firstProduct = page.locator('[data-testid="product-card"]').first()
    const productName = await firstProduct.locator('[data-testid="product-name"]').textContent()
    await firstProduct.locator('[data-testid="add-to-cart-btn"]').click()

    // Verificar carrito inicial
    await expect(page.locator('[data-testid="cart-counter"]')).toHaveText('1')

    // Recargar la página
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Verificar que el carrito se restauró
    await expect(page.locator('[data-testid="cart-counter"]')).toHaveText('1')

    // Abrir carrito y verificar contenido
    await page.click('[data-testid="cart-icon"]')
    await page.waitForSelector('[data-testid="cart-item"]')

    const cartItem = page.locator('[data-testid="cart-item"]').first()
    const cartItemName = await cartItem.locator('h3').textContent()

    expect(cartItemName).toContain(productName?.trim())
  })

  test('should maintain cart when navigating between pages', async ({ page }) => {
    // Agregar producto desde la página principal
    await page.goto('/')

    // Buscar productos en la página principal (si los hay)
    const homeProducts = page.locator('[data-testid="product-card"]')
    const homeProductCount = await homeProducts.count()

    if (homeProductCount > 0) {
      await homeProducts.first().locator('[data-testid="add-to-cart-btn"]').click()
      await expect(page.locator('[data-testid="cart-counter"]')).toHaveText('1')
    } else {
      // Si no hay productos en home, ir a shop
      await page.goto('/shop')
      await page.waitForSelector('[data-testid="product-card"]')
      await page
        .locator('[data-testid="product-card"]')
        .first()
        .locator('[data-testid="add-to-cart-btn"]')
        .click()
      await expect(page.locator('[data-testid="cart-counter"]')).toHaveText('1')
    }

    // Navegar a diferentes páginas
    await page.goto('/about')
    await expect(page.locator('[data-testid="cart-counter"]')).toHaveText('1')

    await page.goto('/contact')
    await expect(page.locator('[data-testid="cart-counter"]')).toHaveText('1')

    await page.goto('/shop')
    await expect(page.locator('[data-testid="cart-counter"]')).toHaveText('1')

    // Verificar que el carrito mantiene el contenido
    await page.click('[data-testid="cart-icon"]')
    await page.waitForSelector('[data-testid="cart-item"]')

    const cartItems = page.locator('[data-testid="cart-item"]')
    await expect(cartItems).toHaveCount(1)
  })

  test('should handle multiple products in cart persistence', async ({ page }) => {
    await page.goto('/shop')
    await page.waitForSelector('[data-testid="product-card"]')

    // Agregar múltiples productos
    const products = page.locator('[data-testid="product-card"]')
    const productCount = Math.min(await products.count(), 3) // Máximo 3 productos

    for (let i = 0; i < productCount; i++) {
      await products.nth(i).locator('[data-testid="add-to-cart-btn"]').click()
      await page.waitForTimeout(500) // Esperar para que se procese cada adición
    }

    // Verificar contador del carrito
    await expect(page.locator('[data-testid="cart-counter"]')).toHaveText(productCount.toString())

    // Recargar página
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Verificar que todos los productos se mantuvieron
    await expect(page.locator('[data-testid="cart-counter"]')).toHaveText(productCount.toString())

    // Verificar contenido del carrito
    await page.click('[data-testid="cart-icon"]')
    await page.waitForSelector('[data-testid="cart-item"]')

    const cartItems = page.locator('[data-testid="cart-item"]')
    await expect(cartItems).toHaveCount(productCount)
  })

  test('should update quantities and persist changes', async ({ page }) => {
    await page.goto('/shop')
    await page.waitForSelector('[data-testid="product-card"]')

    // Agregar producto al carrito
    await page
      .locator('[data-testid="product-card"]')
      .first()
      .locator('[data-testid="add-to-cart-btn"]')
      .click()
    await expect(page.locator('[data-testid="cart-counter"]')).toHaveText('1')

    // Abrir carrito
    await page.click('[data-testid="cart-icon"]')
    await page.waitForSelector('[data-testid="cart-item"]')

    // Verificar si hay controles de cantidad en el carrito sidebar
    const quantityControls = page.locator('[data-testid="quantity-increase"]')
    const hasQuantityControls = (await quantityControls.count()) > 0

    if (hasQuantityControls) {
      // Aumentar cantidad
      await page.click('[data-testid="quantity-increase"]')
      await page.waitForTimeout(500)

      // Verificar que la cantidad se actualizó
      const quantityDisplay = page.locator('[data-testid="quantity-input"]')
      await expect(quantityDisplay).toHaveText('2')

      // Cerrar carrito y recargar página
      await page.press('body', 'Escape') // Cerrar modal
      await page.reload()
      await page.waitForLoadState('networkidle')

      // Verificar que la cantidad se mantuvo
      await page.click('[data-testid="cart-icon"]')
      await page.waitForSelector('[data-testid="cart-item"]')

      const persistedQuantity = page.locator('[data-testid="quantity-input"]')
      await expect(persistedQuantity).toHaveText('2')
    } else {
      console.log('Quantity controls not available in cart sidebar')
    }
  })

  test('should remove items and persist empty state', async ({ page }) => {
    await page.goto('/shop')
    await page.waitForSelector('[data-testid="product-card"]')

    // Agregar producto al carrito
    await page
      .locator('[data-testid="product-card"]')
      .first()
      .locator('[data-testid="add-to-cart-btn"]')
      .click()
    await expect(page.locator('[data-testid="cart-counter"]')).toHaveText('1')

    // Abrir carrito y remover producto
    await page.click('[data-testid="cart-icon"]')
    await page.waitForSelector('[data-testid="cart-item"]')

    await page.click('[data-testid="remove-from-cart"]')
    await page.waitForTimeout(500)

    // Verificar que el carrito está vacío
    const emptyMessage = page.locator('[data-testid="empty-cart-message"]')
    await expect(emptyMessage).toBeVisible()

    // Verificar contador del carrito
    const cartCounter = page.locator('[data-testid="cart-counter"]')
    const isCounterVisible = await cartCounter.isVisible()

    if (isCounterVisible) {
      await expect(cartCounter).toHaveText('0')
    }

    // Recargar página y verificar que el estado vacío persiste
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Verificar que el carrito sigue vacío
    await page.click('[data-testid="cart-icon"]')
    await expect(page.locator('[data-testid="empty-cart-message"]')).toBeVisible()
  })

  test('should handle localStorage corruption gracefully', async ({ page }) => {
    await page.goto('/')

    // Corromper localStorage
    await page.evaluate(() => {
      localStorage.setItem('pinteya-cart', 'invalid-json-data')
    })

    // Navegar a shop y agregar producto
    await page.goto('/shop')
    await page.waitForSelector('[data-testid="product-card"]')

    await page
      .locator('[data-testid="product-card"]')
      .first()
      .locator('[data-testid="add-to-cart-btn"]')
      .click()

    // Verificar que el carrito funciona normalmente a pesar de la corrupción
    await expect(page.locator('[data-testid="cart-counter"]')).toHaveText('1')

    // Verificar que localStorage se limpió y se creó nuevo
    const newLocalStorageData = await page.evaluate(() => {
      return localStorage.getItem('pinteya-cart')
    })

    expect(newLocalStorageData).toBeTruthy()

    const parsedData = JSON.parse(newLocalStorageData!)
    expect(parsedData.items).toHaveLength(1)
  })

  test('should expire old cart data after 7 days', async ({ page }) => {
    await page.goto('/')

    // Crear datos de carrito antiguos (más de 7 días)
    const oldTimestamp = Date.now() - 8 * 24 * 60 * 60 * 1000 // 8 días atrás
    const oldCartData = {
      items: [{ id: 1, title: 'Old Product', quantity: 1 }],
      timestamp: oldTimestamp,
      version: '1.0.0',
    }

    await page.evaluate(data => {
      localStorage.setItem('pinteya-cart', JSON.stringify(data))
    }, oldCartData)

    // Recargar página
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Verificar que el carrito está vacío (datos expirados)
    const cartCounter = page.locator('[data-testid="cart-counter"]')
    const isCounterVisible = await cartCounter.isVisible()

    if (isCounterVisible) {
      await expect(cartCounter).toHaveText('0')
    }

    // Verificar que localStorage se limpió
    const clearedData = await page.evaluate(() => {
      return localStorage.getItem('pinteya-cart')
    })

    expect(clearedData).toBeNull()
  })

  test('should clear cart when using "Vaciar Carrito" button with elegant modal', async ({
    page,
  }) => {
    // Agregar productos al carrito
    await page.goto('/shop')
    await page.waitForSelector('[data-testid="product-card"]')

    // Agregar múltiples productos
    const products = page.locator('[data-testid="product-card"]')
    const productCount = Math.min(await products.count(), 2) // Máximo 2 productos

    for (let i = 0; i < productCount; i++) {
      await products.nth(i).locator('[data-testid="add-to-cart-btn"]').click()
      await page.waitForTimeout(500)
    }

    // Verificar que el carrito tiene productos
    await expect(page.locator('[data-testid="cart-counter"]')).toHaveText(productCount.toString())

    // Ir a la página del carrito
    await page.goto('/cart')
    await page.waitForSelector('[data-testid="clear-cart-btn"]')

    // Hacer clic en "Vaciar Carrito" para abrir el modal
    await page.click('[data-testid="clear-cart-btn"]')
    await page.waitForTimeout(500)

    // Verificar que el modal de confirmación aparece
    const modalTitle = page.locator('text=¿Vaciar carrito?')
    await expect(modalTitle).toBeVisible()

    // Verificar que el mensaje dinámico aparece correctamente
    const expectedMessage = productCount === 1 ? 'el producto' : `los ${productCount} productos`
    const modalDescription = page.locator(
      `text=¿Estás seguro de que quieres eliminar ${expectedMessage} del carrito?`
    )
    await expect(modalDescription).toBeVisible()

    // Verificar que los botones del modal están presentes
    const confirmButton = page.locator('text=Sí, vaciar carrito')
    const cancelButton = page.locator('text=Cancelar')
    await expect(confirmButton).toBeVisible()
    await expect(cancelButton).toBeVisible()

    // Hacer clic en confirmar
    await confirmButton.click()
    await page.waitForTimeout(1000)

    // Verificar que se muestra el mensaje de carrito vacío
    const emptyMessage = page.locator('text=Tu carrito está vacío')
    await expect(emptyMessage).toBeVisible()

    // Verificar que localStorage se limpió
    const clearedData = await page.evaluate(() => {
      return localStorage.getItem('pinteya-cart')
    })

    expect(clearedData).toBeNull()

    // Verificar que el contador del carrito no es visible o es 0
    const cartCounter = page.locator('[data-testid="cart-counter"]')
    const isCounterVisible = await cartCounter.isVisible()

    if (isCounterVisible) {
      await expect(cartCounter).toHaveText('0')
    }

    // Recargar página y verificar que el carrito sigue vacío
    await page.reload()
    await page.waitForLoadState('networkidle')

    const emptyMessageAfterReload = page.locator('text=Tu carrito está vacío')
    await expect(emptyMessageAfterReload).toBeVisible()
  })

  test('should cancel cart clearing when using modal cancel button', async ({ page }) => {
    // Agregar un producto al carrito
    await page.goto('/shop')
    await page.waitForSelector('[data-testid="product-card"]')

    const products = page.locator('[data-testid="product-card"]')
    await products.first().locator('[data-testid="add-to-cart-btn"]').click()
    await page.waitForTimeout(500)

    // Verificar que el carrito tiene el producto
    await expect(page.locator('[data-testid="cart-counter"]')).toHaveText('1')

    // Ir a la página del carrito
    await page.goto('/cart')
    await page.waitForSelector('[data-testid="clear-cart-btn"]')

    // Hacer clic en "Vaciar Carrito" para abrir el modal
    await page.click('[data-testid="clear-cart-btn"]')
    await page.waitForTimeout(500)

    // Verificar que el modal aparece
    const modalTitle = page.locator('text=¿Vaciar carrito?')
    await expect(modalTitle).toBeVisible()

    // Hacer clic en cancelar
    const cancelButton = page.locator('text=Cancelar')
    await cancelButton.click()
    await page.waitForTimeout(500)

    // Verificar que el modal se cerró
    await expect(modalTitle).not.toBeVisible()

    // Verificar que el carrito sigue teniendo el producto
    await expect(page.locator('[data-testid="cart-counter"]')).toHaveText('1')

    // Verificar que el producto sigue en la página del carrito
    const cartItems = page.locator('[data-testid="cart-item"]')
    await expect(cartItems).toHaveCount(1)

    // Verificar que localStorage mantiene el producto
    const localStorageData = await page.evaluate(() => {
      const data = localStorage.getItem('pinteya-cart')
      return data ? JSON.parse(data) : null
    })

    expect(localStorageData).not.toBeNull()
    expect(localStorageData.items.length).toBe(1)
  })

  test('should remove individual items from cart sidebar', async ({ page }) => {
    // Agregar productos al carrito
    await page.goto('/shop')
    await page.waitForSelector('[data-testid="product-card"]')

    // Agregar 2 productos diferentes
    const products = page.locator('[data-testid="product-card"]')
    const productCount = Math.min(await products.count(), 2)

    for (let i = 0; i < productCount; i++) {
      await products.nth(i).locator('[data-testid="add-to-cart-btn"]').click()
      await page.waitForTimeout(500)
    }

    // Verificar que el carrito tiene productos
    await expect(page.locator('[data-testid="cart-counter"]')).toHaveText(productCount.toString())

    // Abrir carrito sidebar
    await page.click('[data-testid="cart-icon"]')
    await page.waitForSelector('[data-testid="cart-item"]')

    // Verificar que hay items en el carrito sidebar
    const cartItems = page.locator('[data-testid="cart-item"]')
    const initialItemCount = await cartItems.count()
    expect(initialItemCount).toBeGreaterThan(0)

    // Eliminar el primer item
    const removeButtons = page.locator('[data-testid="remove-from-cart"]')
    await removeButtons.first().click()
    await page.waitForTimeout(1000)

    // Verificar que se eliminó un item
    const remainingItems = await cartItems.count()
    expect(remainingItems).toBe(initialItemCount - 1)

    // Verificar que el contador se actualizó
    if (remainingItems > 0) {
      await expect(page.locator('[data-testid="cart-counter"]')).toHaveText(
        remainingItems.toString()
      )
    } else {
      // Si no quedan items, el contador no debería ser visible
      const cartCounter = page.locator('[data-testid="cart-counter"]')
      const isCounterVisible = await cartCounter.isVisible()
      expect(isCounterVisible).toBeFalsy()
    }

    // Verificar que localStorage se actualizó correctamente
    const updatedLocalStorageData = await page.evaluate(() => {
      const data = localStorage.getItem('pinteya-cart')
      return data ? JSON.parse(data) : null
    })

    if (remainingItems > 0) {
      expect(updatedLocalStorageData).not.toBeNull()
      expect(updatedLocalStorageData.items.length).toBe(remainingItems)
    } else {
      expect(updatedLocalStorageData).toBeNull()
    }

    // Recargar página y verificar persistencia
    await page.reload()
    await page.waitForLoadState('networkidle')

    if (remainingItems > 0) {
      await expect(page.locator('[data-testid="cart-counter"]')).toHaveText(
        remainingItems.toString()
      )
    } else {
      const cartCounter = page.locator('[data-testid="cart-counter"]')
      const isCounterVisible = await cartCounter.isVisible()
      expect(isCounterVisible).toBeFalsy()
    }
  })

  test('should display at least 2 products in mobile viewport', async ({ page }) => {
    // Configurar viewport mobile
    await page.setViewportSize({ width: 375, height: 667 })
    
    await page.goto('/shop')
    await page.waitForSelector('[data-testid="product-card"]')

    // Agregar al menos 2 productos
    const products = page.locator('[data-testid="product-card"]')
    const productCount = Math.min(await products.count(), 2)

    for (let i = 0; i < productCount; i++) {
      await products.nth(i).locator('[data-testid="add-to-cart-btn"]').click()
      await page.waitForTimeout(500)
    }

    // Abrir modal del carrito
    await page.click('[data-testid="cart-icon"]')
    await page.waitForSelector('[data-testid="cart-item"]', { timeout: 5000 })

    // Verificar que hay al menos 2 productos visibles
    const cartItems = page.locator('[data-testid="cart-item"]')
    const itemCount = await cartItems.count()
    expect(itemCount).toBeGreaterThanOrEqual(2)

    // Verificar que los primeros 2 productos son visibles
    await expect(cartItems.first()).toBeVisible()
    await expect(cartItems.nth(1)).toBeVisible()

    // Verificar altura del área de scroll
    const scrollHeight = await page.evaluate(() => {
      const scrollElement = document.querySelector('.flex-1.overflow-y-auto, [class*="overflow-y-auto"]')
      if (!scrollElement) return 0
      return scrollElement.getBoundingClientRect().height
    })

    expect(scrollHeight).toBeGreaterThanOrEqual(280)
  })
})
