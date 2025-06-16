import { test, expect } from '@playwright/test';

test.describe('Debug Product Details', () => {
  test('debug product navigation and details', async ({ page }) => {
    // Navigate to shop
    await page.goto('/shop');
    
    // Wait for products to load
    await page.waitForSelector('[data-testid="product-card"]');
    
    // Get the first product card
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await expect(firstProduct).toBeVisible();
    
    // Get product name for verification
    const productName = await firstProduct.locator('[data-testid="product-name"]').textContent();
    console.log('Product name:', productName);
    
    // Click on the product name link to navigate to details
    await firstProduct.locator('[data-testid="product-name"] a').click();
    
    // Wait for navigation
    await page.waitForLoadState('networkidle');
    
    // Log current URL
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    // Check if we're on a product details page
    if (currentUrl.includes('/shop-details/')) {
      console.log('✅ Successfully navigated to dynamic product details page');
      
      // Wait a bit for the page to load
      await page.waitForTimeout(2000);
      
      // Check what elements are actually on the page
      const pageContent = await page.content();
      console.log('Page contains "product-price":', pageContent.includes('data-testid="product-price"'));
      console.log('Page contains "Cargando":', pageContent.includes('Cargando'));
      console.log('Page contains "Error":', pageContent.includes('Error'));
      
      // Try to find any price element
      const priceElements = await page.locator('[data-testid="product-price"]').count();
      console.log('Number of product-price elements found:', priceElements);
      
      if (priceElements > 0) {
        console.log('✅ Found product-price element');
        await expect(page.locator('[data-testid="product-price"]')).toBeVisible();
      } else {
        console.log('❌ No product-price element found');
        
        // Check if there's a loading state
        const loadingElements = await page.locator('text=Cargando').count();
        console.log('Loading elements found:', loadingElements);
        
        // Check if there's an error state
        const errorElements = await page.locator('text=Error').count();
        console.log('Error elements found:', errorElements);
        
        // Take a screenshot for debugging
        await page.screenshot({ path: 'debug-product-details.png', fullPage: true });
      }
    } else {
      console.log('❌ Did not navigate to product details page');
      console.log('Expected URL pattern: /shop-details/[id]');
      console.log('Actual URL:', currentUrl);
    }
  });
});
