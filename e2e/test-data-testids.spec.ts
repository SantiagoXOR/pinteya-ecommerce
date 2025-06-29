// ===================================
// PINTEYA E-COMMERCE - TEST SIMPLE PARA VERIFICAR DATA-TESTIDS
// ===================================

import { test, expect } from '@playwright/test'

test.describe('Data TestIDs Verification', () => {
  test('should find product cards on shop page', async ({ page }) => {
    // Navigate directly to shop
    await page.goto('/shop')
    
    // Wait for page to load
    await page.waitForLoadState('networkidle')
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'debug-shop-page.png', fullPage: true })
    
    // Check if products are loading
    const loadingText = page.locator('text=Cargando productos')
    const errorText = page.locator('text=Error')
    
    console.log('Loading text visible:', await loadingText.isVisible())
    console.log('Error text visible:', await errorText.isVisible())
    
    // Wait for products to load (longer timeout)
    try {
      await page.waitForSelector('[data-testid="product-card"]', { timeout: 30000 })
      console.log('✅ Found product cards')
      
      const productCards = page.locator('[data-testid="product-card"]')
      const count = await productCards.count()
      console.log(`Found ${count} product cards`)
      
      if (count > 0) {
        // Check if first product has required elements
        const firstCard = productCards.first()
        const productName = firstCard.locator('[data-testid="product-name"]')
        const productPrice = firstCard.locator('[data-testid="product-price"]')
        const addToCartBtn = firstCard.locator('[data-testid="add-to-cart-btn"]')
        
        console.log('Product name visible:', await productName.isVisible())
        console.log('Product price visible:', await productPrice.isVisible())
        console.log('Add to cart button visible:', await addToCartBtn.isVisible())
      }
      
    } catch (error) {
      console.log('❌ No product cards found')
      
      // Check what's actually on the page
      const pageContent = await page.content()
      console.log('Page contains ProductCard:', pageContent.includes('ProductCard'))
      console.log('Page contains data-testid:', pageContent.includes('data-testid'))
      
      // Check for any products at all
      const anyProducts = page.locator('text=Pintura')
      const productCount = await anyProducts.count()
      console.log(`Found ${productCount} elements with "Pintura" text`)
    }
  })

  test('should find search input in header', async ({ page }) => {
    await page.goto('/')

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Take screenshot for debugging
    await page.screenshot({ path: 'debug-header.png', fullPage: true })

    // Check if header exists
    const header = page.locator('header')
    console.log('Header exists:', await header.count())

    // Look for search input
    const searchInput = page.locator('[data-testid="search-input"]')
    console.log('Search input count:', await searchInput.count())
    console.log('Search input visible:', await searchInput.isVisible())

    // Check for any search-related elements
    const anySearch = page.locator('input[placeholder*="Busco"]')
    const searchCount = await anySearch.count()
    console.log(`Found ${searchCount} search inputs with "Busco" placeholder`)

    // Check for any input elements
    const allInputs = page.locator('input')
    const inputCount = await allInputs.count()
    console.log(`Found ${inputCount} total input elements`)

    if (inputCount > 0) {
      for (let i = 0; i < inputCount; i++) {
        const input = allInputs.nth(i)
        const placeholder = await input.getAttribute('placeholder')
        const testId = await input.getAttribute('data-testid')
        console.log(`Input ${i}: placeholder="${placeholder}", data-testid="${testId}"`)
      }
    }
  })

  test('should find cart icon in header', async ({ page }) => {
    await page.goto('/')

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Look for cart icon
    const cartIcon = page.locator('[data-testid="cart-icon"]')
    console.log('Cart icon count:', await cartIcon.count())
    console.log('Cart icon visible:', await cartIcon.isVisible())

    // Look for cart counter
    const cartCounter = page.locator('[data-testid="cart-counter"]')
    console.log('Cart counter count:', await cartCounter.count())
    console.log('Cart counter visible:', await cartCounter.isVisible())

    // Check for any cart-related elements
    const anyCart = page.locator('[class*="cart"], [id*="cart"]')
    const cartCount = await anyCart.count()
    console.log(`Found ${cartCount} elements with cart in class/id`)

    // Check for shopping bag icons
    const shoppingBag = page.locator('svg, [class*="shopping"], [class*="bag"]')
    const bagCount = await shoppingBag.count()
    console.log(`Found ${bagCount} shopping/bag related elements`)
  })
})
