// ===================================
// PINTEYA E-COMMERCE - E2E SHOPPING FLOW TESTS
// ===================================

import { test, expect } from '@playwright/test'

test.describe('Shopping Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage before each test
    await page.goto('/')
  })

  test('user can browse products and add to cart', async ({ page }) => {
    // Navigate to shop
    await page.click('text=Tienda')
    await expect(page).toHaveURL('/shop')

    // Wait for products to load
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 })

    // Verify products are displayed
    const productCards = page.locator('[data-testid="product-card"]')
    await expect(productCards).toHaveCount.greaterThan(0)

    // Click on first product
    const firstProduct = productCards.first()
    await firstProduct.click()

    // Verify product details page
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('[data-testid="product-price"]')).toBeVisible()

    // Add to cart
    await page.click('[data-testid="add-to-cart-btn"]')

    // Verify cart counter updated
    const cartCounter = page.locator('[data-testid="cart-counter"]')
    await expect(cartCounter).toHaveText('1')

    // Open cart sidebar
    await page.click('[data-testid="cart-icon"]')

    // Verify product in cart
    await expect(page.locator('[data-testid="cart-item"]')).toBeVisible()
  })

  test('user can search for products', async ({ page }) => {
    // Navigate to shop
    await page.goto('/shop')

    // Search for products
    const searchInput = page.locator('[data-testid="search-input"]')
    await searchInput.fill('pintura')
    await searchInput.press('Enter')

    // Wait for search results
    await page.waitForLoadState('networkidle')

    // Verify search results
    const productCards = page.locator('[data-testid="product-card"]')
    await expect(productCards).toHaveCount.greaterThan(0)

    // Verify search term is highlighted or products contain search term
    const productNames = page.locator('[data-testid="product-name"]')
    const firstProductName = await productNames.first().textContent()
    expect(firstProductName?.toLowerCase()).toContain('pintura')
  })

  test('user can filter products by category', async ({ page }) => {
    // Navigate to shop
    await page.goto('/shop')

    // Wait for categories to load
    await page.waitForSelector('[data-testid="category-filter"]')

    // Click on a category filter
    await page.click('[data-testid="category-filter"]:has-text("Pinturas Látex")')

    // Wait for filtered results
    await page.waitForLoadState('networkidle')

    // Verify filtered products
    const productCards = page.locator('[data-testid="product-card"]')
    await expect(productCards).toHaveCount.greaterThan(0)

    // Verify all products belong to selected category
    const categoryLabels = page.locator('[data-testid="product-category"]')
    const count = await categoryLabels.count()
    
    for (let i = 0; i < count; i++) {
      const categoryText = await categoryLabels.nth(i).textContent()
      expect(categoryText).toContain('Látex')
    }
  })

  test('user can add multiple products to cart', async ({ page }) => {
    // Navigate to shop
    await page.goto('/shop')

    // Wait for products to load
    await page.waitForSelector('[data-testid="product-card"]')

    // Add first product to cart
    await page.click('[data-testid="product-card"]:nth-child(1) [data-testid="add-to-cart-btn"]')
    
    // Wait a bit for the action to complete
    await page.waitForTimeout(500)

    // Add second product to cart
    await page.click('[data-testid="product-card"]:nth-child(2) [data-testid="add-to-cart-btn"]')

    // Verify cart counter shows 2 items
    const cartCounter = page.locator('[data-testid="cart-counter"]')
    await expect(cartCounter).toHaveText('2')

    // Open cart sidebar
    await page.click('[data-testid="cart-icon"]')

    // Verify both products in cart
    const cartItems = page.locator('[data-testid="cart-item"]')
    await expect(cartItems).toHaveCount(2)
  })

  test('user can update product quantity in cart', async ({ page }) => {
    // Navigate to shop and add product to cart
    await page.goto('/shop')
    await page.waitForSelector('[data-testid="product-card"]')
    await page.click('[data-testid="product-card"]:first-child [data-testid="add-to-cart-btn"]')

    // Open cart sidebar
    await page.click('[data-testid="cart-icon"]')

    // Increase quantity
    await page.click('[data-testid="quantity-increase"]')

    // Verify quantity updated
    const quantityInput = page.locator('[data-testid="quantity-input"]')
    await expect(quantityInput).toHaveValue('2')

    // Verify cart counter updated
    const cartCounter = page.locator('[data-testid="cart-counter"]')
    await expect(cartCounter).toHaveText('2')

    // Verify total price updated
    const totalPrice = page.locator('[data-testid="cart-total"]')
    await expect(totalPrice).toBeVisible()
  })

  test('user can remove products from cart', async ({ page }) => {
    // Navigate to shop and add product to cart
    await page.goto('/shop')
    await page.waitForSelector('[data-testid="product-card"]')
    await page.click('[data-testid="product-card"]:first-child [data-testid="add-to-cart-btn"]')

    // Open cart sidebar
    await page.click('[data-testid="cart-icon"]')

    // Remove product from cart
    await page.click('[data-testid="remove-from-cart"]')

    // Verify cart is empty
    await expect(page.locator('[data-testid="empty-cart-message"]')).toBeVisible()

    // Verify cart counter is hidden or shows 0
    const cartCounter = page.locator('[data-testid="cart-counter"]')
    await expect(cartCounter).not.toBeVisible()
  })

  test('user can add products to wishlist', async ({ page }) => {
    // Navigate to shop
    await page.goto('/shop')
    await page.waitForSelector('[data-testid="product-card"]')

    // Add product to wishlist
    await page.click('[data-testid="product-card"]:first-child [data-testid="wishlist-btn"]')

    // Verify wishlist counter updated
    const wishlistCounter = page.locator('[data-testid="wishlist-counter"]')
    await expect(wishlistCounter).toHaveText('1')

    // Navigate to wishlist (if accessible)
    // This depends on your implementation
    // await page.click('[data-testid="wishlist-icon"]')
    // await expect(page.locator('[data-testid="wishlist-item"]')).toBeVisible()
  })

  test('user can view product details', async ({ page }) => {
    // Navigate to shop
    await page.goto('/shop')
    await page.waitForSelector('[data-testid="product-card"]')

    // Get product name from card
    const productName = await page.locator('[data-testid="product-card"]:first-child [data-testid="product-name"]').textContent()

    // Click on product to view details
    await page.click('[data-testid="product-card"]:first-child')

    // Verify we're on product details page
    await expect(page.locator('h1')).toHaveText(productName || '')
    await expect(page.locator('[data-testid="product-description"]')).toBeVisible()
    await expect(page.locator('[data-testid="product-price"]')).toBeVisible()
    await expect(page.locator('[data-testid="product-stock"]')).toBeVisible()

    // Verify product images
    await expect(page.locator('[data-testid="product-image"]')).toBeVisible()

    // Verify add to cart button
    await expect(page.locator('[data-testid="add-to-cart-btn"]')).toBeVisible()
  })

  test('user can navigate using breadcrumbs', async ({ page }) => {
    // Navigate to shop
    await page.goto('/shop')
    await page.waitForSelector('[data-testid="product-card"]')

    // Click on a product
    await page.click('[data-testid="product-card"]:first-child')

    // Verify breadcrumbs are present
    await expect(page.locator('[data-testid="breadcrumb"]')).toBeVisible()

    // Click on shop breadcrumb to go back
    await page.click('[data-testid="breadcrumb"] a:has-text("Tienda")')

    // Verify we're back on shop page
    await expect(page).toHaveURL('/shop')
  })

  test('responsive design works on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Navigate to shop
    await page.goto('/shop')

    // Verify mobile menu button is visible
    await expect(page.locator('[data-testid="mobile-menu-btn"]')).toBeVisible()

    // Open mobile menu
    await page.click('[data-testid="mobile-menu-btn"]')

    // Verify mobile menu is open
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible()

    // Verify products are displayed in mobile layout
    await page.waitForSelector('[data-testid="product-card"]')
    const productCards = page.locator('[data-testid="product-card"]')
    await expect(productCards).toHaveCount.greaterThan(0)
  })
})
