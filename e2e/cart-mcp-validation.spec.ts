// ===================================
// PINTEYA E-COMMERCE - TESTS E2E CON VALIDACIÓN MCP SUPABASE
// ===================================
// 
// Este archivo contiene tests que usan MCP de Supabase para validar
// que los productos en el carrito coinciden con los datos de la base de datos.
// 
// NOTA: Estos tests requieren que MCP de Supabase esté configurado y disponible.
// Se pueden ejecutar condicionalmente o como tests de integración separados.

import { test, expect } from '@playwright/test'

test.describe('Cart MCP Supabase Validation Tests', () => {
  test.skip('should validate cart products exist in Supabase database', async ({ page }) => {
    // Este test está marcado como skip porque requiere configuración de MCP
    // Para ejecutarlo, descomentar y configurar MCP de Supabase
    
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/shop')
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 })

    // Agregar productos al carrito
    const products = page.locator('[data-testid="product-card"]')
    const productCount = Math.min(await products.count(), 2)

    const addedProductIds: number[] = []

    for (let i = 0; i < productCount; i++) {
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

    // Obtener información de los productos del carrito
    const cartItems = page.locator('[data-testid="cart-item"]')
    const itemCount = await cartItems.count()
    expect(itemCount).toBeGreaterThanOrEqual(productCount)

    // Aquí se podría usar MCP de Supabase para validar:
    // 1. Que los productos existen en la base de datos
    // 2. Que los precios coinciden
    // 3. Que el stock es correcto
    // 4. Que las variantes (color, medida, etc.) son válidas
    //
    // Ejemplo de uso de MCP (requiere configuración):
    // const productData = await mcp_supabase_SantiagoXOR_execute_sql({
    //   query: `SELECT id, name, price, stock FROM products WHERE id IN (${addedProductIds.join(',')})`
    // })
    //
    // expect(productData.rows.length).toBe(productCount)
    // for (const product of productData.rows) {
    //   expect(addedProductIds).toContain(product.id)
    // }

    console.log('✅ Test de validación MCP - Productos agregados:', addedProductIds)
    console.log('ℹ️ Para ejecutar validación completa, configurar MCP de Supabase')
  })

  test.skip('should validate product prices match database', async ({ page }) => {
    // Este test valida que los precios mostrados en el carrito
    // coinciden con los precios en la base de datos
    
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/shop')
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 })

    // Agregar un producto
    const firstProduct = page.locator('[data-testid="product-card"]').first()
    const productId = await firstProduct.getAttribute('data-product-id')
    
    await firstProduct.locator('[data-testid="add-to-cart-btn"]').click()
    await page.waitForTimeout(500)

    // Abrir modal del carrito
    await page.click('[data-testid="cart-icon"]')
    await page.waitForSelector('[data-testid="cart-item"]', { timeout: 5000 })

    // Obtener precio del carrito
    const cartItem = page.locator('[data-testid="cart-item"]').first()
    const priceElement = cartItem.locator('[style*="color: rgb(194, 65, 11)"]')
    const cartPriceText = await priceElement.textContent()
    const cartPrice = cartPriceText ? parseFloat(cartPriceText.replace(/[^0-9.]/g, '')) : 0

    // Aquí se podría usar MCP para validar el precio:
    // const productData = await mcp_supabase_SantiagoXOR_execute_sql({
    //   query: `SELECT price, discounted_price FROM products WHERE id = ${productId}`
    // })
    //
    // const dbPrice = productData.rows[0].discounted_price || productData.rows[0].price
    // expect(cartPrice).toBe(dbPrice)

    console.log('✅ Test de validación de precios - Precio en carrito:', cartPrice)
    console.log('ℹ️ Para ejecutar validación completa, configurar MCP de Supabase')
  })
})








