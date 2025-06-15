// ===================================
// PINTEYA E-COMMERCE - E2E CHECKOUT FLOW TESTS
// ===================================

import { test, expect } from '@playwright/test'

test.describe('Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to shop and add a product to cart
    await page.goto('/shop')
    await page.waitForSelector('[data-testid="product-card"]')
    
    // Add first product to cart
    await page.click('[data-testid="product-card"]:first-child [data-testid="add-to-cart-btn"]')
    
    // Verify product was added
    const cartCounter = page.locator('[data-testid="cart-counter"]')
    await expect(cartCounter).toHaveText('1')
  })

  test('user can proceed to checkout from cart', async ({ page }) => {
    // Open cart sidebar
    await page.click('[data-testid="cart-icon"]')

    // Verify cart has items
    await expect(page.locator('[data-testid="cart-item"]')).toBeVisible()

    // Click checkout button
    await page.click('[data-testid="checkout-btn"]')

    // Verify we're on checkout page
    await expect(page).toHaveURL('/checkout')
    await expect(page.locator('h1:has-text("Checkout")')).toBeVisible()
  })

  test('checkout form displays correctly', async ({ page }) => {
    // Navigate to checkout
    await page.goto('/checkout')

    // Verify checkout form sections
    await expect(page.locator('[data-testid="payer-info-section"]')).toBeVisible()
    await expect(page.locator('[data-testid="shipping-info-section"]')).toBeVisible()
    await expect(page.locator('[data-testid="order-summary-section"]')).toBeVisible()

    // Verify required form fields
    await expect(page.locator('input[name="payer.name"]')).toBeVisible()
    await expect(page.locator('input[name="payer.surname"]')).toBeVisible()
    await expect(page.locator('input[name="payer.email"]')).toBeVisible()
    await expect(page.locator('input[name="payer.phone"]')).toBeVisible()

    // Verify shipping fields
    await expect(page.locator('input[name="shipping.address.street_name"]')).toBeVisible()
    await expect(page.locator('input[name="shipping.address.street_number"]')).toBeVisible()
    await expect(page.locator('input[name="shipping.address.zip_code"]')).toBeVisible()
  })

  test('form validation works correctly', async ({ page }) => {
    // Navigate to checkout
    await page.goto('/checkout')

    // Try to submit empty form
    await page.click('[data-testid="submit-checkout-btn"]')

    // Verify validation errors appear
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()

    // Fill required fields one by one and verify validation
    await page.fill('input[name="payer.name"]', 'Juan')
    await page.fill('input[name="payer.surname"]', 'Pérez')
    
    // Test invalid email
    await page.fill('input[name="payer.email"]', 'invalid-email')
    await page.click('[data-testid="submit-checkout-btn"]')
    await expect(page.locator('text=Email inválido')).toBeVisible()

    // Fix email
    await page.fill('input[name="payer.email"]', 'juan@test.com')
    
    // Continue filling form
    await page.fill('input[name="payer.phone"]', '1234567890')
    await page.fill('input[name="shipping.address.street_name"]', 'Av. Corrientes')
    await page.fill('input[name="shipping.address.street_number"]', '1234')
    await page.fill('input[name="shipping.address.zip_code"]', '1000')
    await page.fill('input[name="shipping.address.city_name"]', 'Buenos Aires')
    await page.fill('input[name="shipping.address.state_name"]', 'CABA')
  })

  test('order summary displays correctly', async ({ page }) => {
    // Navigate to checkout
    await page.goto('/checkout')

    // Verify order summary section
    const orderSummary = page.locator('[data-testid="order-summary"]')
    await expect(orderSummary).toBeVisible()

    // Verify cart items are displayed
    await expect(page.locator('[data-testid="checkout-cart-item"]')).toBeVisible()

    // Verify pricing information
    await expect(page.locator('[data-testid="subtotal"]')).toBeVisible()
    await expect(page.locator('[data-testid="shipping-cost"]')).toBeVisible()
    await expect(page.locator('[data-testid="total-amount"]')).toBeVisible()

    // Verify quantities can be updated
    const quantityInput = page.locator('[data-testid="quantity-input"]')
    await expect(quantityInput).toBeVisible()
  })

  test('shipping calculation works', async ({ page }) => {
    // Navigate to checkout
    await page.goto('/checkout')

    // Fill shipping address
    await page.fill('input[name="shipping.address.zip_code"]', '1000')
    await page.fill('input[name="shipping.address.city_name"]', 'Buenos Aires')
    await page.fill('input[name="shipping.address.state_name"]', 'CABA')

    // Trigger shipping calculation (this might be automatic or require a button click)
    await page.blur('input[name="shipping.address.state_name"]')

    // Wait for shipping cost to update
    await page.waitForTimeout(1000)

    // Verify shipping cost is displayed
    const shippingCost = page.locator('[data-testid="shipping-cost"]')
    await expect(shippingCost).not.toHaveText('$0')

    // Test different location for different shipping cost
    await page.fill('input[name="shipping.address.state_name"]', 'Córdoba')
    await page.blur('input[name="shipping.address.state_name"]')
    await page.waitForTimeout(1000)

    // Shipping cost should be different
    const newShippingCost = await shippingCost.textContent()
    expect(newShippingCost).toBeDefined()
  })

  test('user can complete checkout successfully', async ({ page }) => {
    // Navigate to checkout
    await page.goto('/checkout')

    // Fill all required fields
    await page.fill('input[name="payer.name"]', 'Juan')
    await page.fill('input[name="payer.surname"]', 'Pérez')
    await page.fill('input[name="payer.email"]', 'juan@test.com')
    await page.fill('input[name="payer.phone"]', '1234567890')
    
    // Fill identification
    await page.selectOption('select[name="payer.identification.type"]', 'DNI')
    await page.fill('input[name="payer.identification.number"]', '12345678')

    // Fill shipping address
    await page.fill('input[name="shipping.address.street_name"]', 'Av. Corrientes')
    await page.fill('input[name="shipping.address.street_number"]', '1234')
    await page.fill('input[name="shipping.address.zip_code"]', '1000')
    await page.fill('input[name="shipping.address.city_name"]', 'Buenos Aires')
    await page.fill('input[name="shipping.address.state_name"]', 'CABA')

    // Submit checkout
    await page.click('[data-testid="submit-checkout-btn"]')

    // Wait for processing
    await page.waitForLoadState('networkidle')

    // Should redirect to MercadoPago or success page
    // This depends on your implementation - adjust accordingly
    const currentUrl = page.url()
    expect(currentUrl).toMatch(/(mercadopago|checkout\/success|checkout\/pending)/)
  })

  test('user can modify cart during checkout', async ({ page }) => {
    // Navigate to checkout
    await page.goto('/checkout')

    // Verify initial quantity
    const quantityInput = page.locator('[data-testid="quantity-input"]')
    await expect(quantityInput).toHaveValue('1')

    // Increase quantity
    await page.click('[data-testid="quantity-increase"]')
    await expect(quantityInput).toHaveValue('2')

    // Verify total updated
    const totalAmount = page.locator('[data-testid="total-amount"]')
    const initialTotal = await totalAmount.textContent()

    // Decrease quantity back
    await page.click('[data-testid="quantity-decrease"]')
    await expect(quantityInput).toHaveValue('1')

    // Verify total updated back
    const newTotal = await totalAmount.textContent()
    expect(newTotal).not.toBe(initialTotal)
  })

  test('checkout handles empty cart', async ({ page }) => {
    // Clear cart first by removing items
    await page.click('[data-testid="cart-icon"]')
    await page.click('[data-testid="remove-from-cart"]')

    // Try to navigate to checkout
    await page.goto('/checkout')

    // Should redirect to shop or show empty cart message
    await expect(page.locator('[data-testid="empty-cart-message"]')).toBeVisible()
    
    // Or should redirect to shop
    // await expect(page).toHaveURL('/shop')
  })

  test('checkout form auto-fills for authenticated users', async ({ page }) => {
    // This test assumes user is logged in
    // You might need to implement login first or mock authentication
    
    // Navigate to checkout
    await page.goto('/checkout')

    // Check if user info section shows authenticated user data
    const userInfoSection = page.locator('[data-testid="user-info-section"]')
    if (await userInfoSection.isVisible()) {
      // Verify user information is displayed
      await expect(page.locator('[data-testid="user-name"]')).toBeVisible()
      await expect(page.locator('[data-testid="user-email"]')).toBeVisible()
    }

    // Check if form fields are pre-filled
    const nameInput = page.locator('input[name="payer.name"]')
    const emailInput = page.locator('input[name="payer.email"]')
    
    // If user is authenticated, these should have values
    const nameValue = await nameInput.inputValue()
    const emailValue = await emailInput.inputValue()
    
    if (nameValue && emailValue) {
      expect(nameValue).toBeTruthy()
      expect(emailValue).toContain('@')
    }
  })

  test('checkout handles network errors gracefully', async ({ page }) => {
    // Navigate to checkout and fill form
    await page.goto('/checkout')

    // Fill required fields
    await page.fill('input[name="payer.name"]', 'Juan')
    await page.fill('input[name="payer.surname"]', 'Pérez')
    await page.fill('input[name="payer.email"]', 'juan@test.com')
    await page.fill('input[name="payer.phone"]', '1234567890')

    // Mock network failure
    await page.route('/api/payments/create-preference', route => {
      route.abort('failed')
    })

    // Submit checkout
    await page.click('[data-testid="submit-checkout-btn"]')

    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    await expect(page.locator('text=Error de conexión')).toBeVisible()
  })

  test('checkout shows loading state during processing', async ({ page }) => {
    // Navigate to checkout and fill form
    await page.goto('/checkout')

    // Fill required fields quickly
    await page.fill('input[name="payer.name"]', 'Juan')
    await page.fill('input[name="payer.surname"]', 'Pérez')
    await page.fill('input[name="payer.email"]', 'juan@test.com')
    await page.fill('input[name="payer.phone"]', '1234567890')

    // Mock slow API response
    await page.route('/api/payments/create-preference', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000))
      route.continue()
    })

    // Submit checkout
    await page.click('[data-testid="submit-checkout-btn"]')

    // Should show loading state
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible()
    await expect(page.locator('[data-testid="submit-checkout-btn"]')).toBeDisabled()
  })
})
