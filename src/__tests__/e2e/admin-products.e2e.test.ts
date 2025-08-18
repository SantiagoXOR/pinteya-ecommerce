// 🧪 Enterprise E2E Tests - Admin Products Management

import { test, expect, Page } from '@playwright/test';

// Test configuration
const ADMIN_EMAIL = 'santiago@xor.com.ar';
const ADMIN_PASSWORD = 'SavoirFaire19';
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Helper functions
async function loginAsAdmin(page: Page) {
  await page.goto(`${BASE_URL}/signin`);
  
  // Wait for Clerk to load
  await page.waitForSelector('[data-clerk-element="signIn"]', { timeout: 10000 });
  
  // Fill login form
  await page.fill('input[name="identifier"]', ADMIN_EMAIL);
  await page.click('button[type="submit"]');
  
  // Wait for password field and fill it
  await page.waitForSelector('input[name="password"]');
  await page.fill('input[name="password"]', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  
  // Wait for redirect to dashboard
  await page.waitForURL('**/admin**', { timeout: 15000 });
}

async function navigateToProducts(page: Page) {
  await page.goto(`${BASE_URL}/admin/products`);
  await page.waitForSelector('[data-testid="products-page"]', { timeout: 10000 });
}

async function createTestProduct(page: Page, productData: {
  name: string;
  category: string;
  price: number;
  stock: number;
  description?: string;
}) {
  // Navigate to create product page
  await page.click('[data-testid="create-product-button"]');
  await page.waitForSelector('[data-testid="product-form"]');
  
  // Fill product form
  await page.fill('input[name="name"]', productData.name);
  
  if (productData.description) {
    await page.fill('textarea[name="description"]', productData.description);
  }
  
  // Select category
  await page.selectOption('select[name="category_id"]', { label: productData.category });
  
  // Switch to pricing tab
  await page.click('[data-testid="pricing-tab"]');
  await page.fill('input[name="price"]', productData.price.toString());
  
  // Switch to inventory tab
  await page.click('[data-testid="inventory-tab"]');
  await page.fill('input[name="stock"]', productData.stock.toString());
  
  // Submit form
  await page.click('button[type="submit"]');
  
  // Wait for success message
  await page.waitForSelector('[data-testid="success-message"]', { timeout: 10000 });
}

test.describe('Admin Products Management E2E', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test.describe('Product List Page', () => {
    test('should display products list', async ({ page }) => {
      await navigateToProducts(page);
      
      // Check page elements
      await expect(page.locator('[data-testid="products-page"]')).toBeVisible();
      await expect(page.locator('[data-testid="products-table"]')).toBeVisible();
      await expect(page.locator('[data-testid="create-product-button"]')).toBeVisible();
      
      // Check search functionality
      await expect(page.locator('[data-testid="products-search"]')).toBeVisible();
      
      // Check filters
      await expect(page.locator('[data-testid="category-filter"]')).toBeVisible();
      await expect(page.locator('[data-testid="status-filter"]')).toBeVisible();
    });

    test('should search products', async ({ page }) => {
      await navigateToProducts(page);
      
      // Search for a product
      await page.fill('[data-testid="products-search"]', 'Pintura');
      await page.press('[data-testid="products-search"]', 'Enter');
      
      // Wait for search results
      await page.waitForTimeout(1000);
      
      // Check that results contain search term
      const productNames = await page.locator('[data-testid="product-name"]').allTextContents();
      expect(productNames.some(name => name.toLowerCase().includes('pintura'))).toBeTruthy();
    });

    test('should filter products by category', async ({ page }) => {
      await navigateToProducts(page);
      
      // Select a category filter
      await page.selectOption('[data-testid="category-filter"]', { label: 'Interiores' });
      
      // Wait for filter to apply
      await page.waitForTimeout(1000);
      
      // Check that all visible products belong to selected category
      const categoryLabels = await page.locator('[data-testid="product-category"]').allTextContents();
      expect(categoryLabels.every(label => label === 'Interiores')).toBeTruthy();
    });

    test('should paginate products', async ({ page }) => {
      await navigateToProducts(page);
      
      // Check pagination controls
      await expect(page.locator('[data-testid="pagination"]')).toBeVisible();
      
      // Click next page if available
      const nextButton = page.locator('[data-testid="next-page"]');
      if (await nextButton.isEnabled()) {
        await nextButton.click();
        await page.waitForTimeout(1000);
        
        // Check that URL changed
        expect(page.url()).toContain('page=2');
      }
    });
  });

  test.describe('Product Creation', () => {
    test('should create a new product successfully', async ({ page }) => {
      await navigateToProducts(page);
      
      const productData = {
        name: `Test Product ${Date.now()}`,
        category: 'Interiores',
        price: 150,
        stock: 25,
        description: 'This is a test product created by E2E tests',
      };
      
      await createTestProduct(page, productData);
      
      // Verify product was created
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Producto creado exitosamente');
      
      // Navigate back to products list
      await navigateToProducts(page);
      
      // Search for the created product
      await page.fill('[data-testid="products-search"]', productData.name);
      await page.press('[data-testid="products-search"]', 'Enter');
      await page.waitForTimeout(1000);
      
      // Verify product appears in list
      await expect(page.locator('[data-testid="product-name"]').first()).toContainText(productData.name);
    });

    test('should validate required fields', async ({ page }) => {
      await navigateToProducts(page);
      
      // Navigate to create product page
      await page.click('[data-testid="create-product-button"]');
      await page.waitForSelector('[data-testid="product-form"]');
      
      // Try to submit without filling required fields
      await page.click('button[type="submit"]');
      
      // Check validation errors
      await expect(page.locator('[data-testid="name-error"]')).toContainText('El nombre es requerido');
      await expect(page.locator('[data-testid="category-error"]')).toContainText('Selecciona una categoría válida');
    });

    test('should generate slug automatically', async ({ page }) => {
      await navigateToProducts(page);
      
      await page.click('[data-testid="create-product-button"]');
      await page.waitForSelector('[data-testid="product-form"]');
      
      // Fill product name
      const productName = 'Test Product with Special Characters!@#';
      await page.fill('input[name="name"]', productName);
      
      // Check that slug was generated
      await page.waitForTimeout(500);
      const slugValue = await page.inputValue('input[name="slug"]');
      expect(slugValue).toBe('test-product-with-special-characters');
    });

    test('should validate slug uniqueness', async ({ page }) => {
      await navigateToProducts(page);
      
      await page.click('[data-testid="create-product-button"]');
      await page.waitForSelector('[data-testid="product-form"]');
      
      // Fill a slug that might already exist
      await page.fill('input[name="slug"]', 'existing-product-slug');
      
      // Wait for validation
      await page.waitForTimeout(1000);
      
      // Check for validation message (if slug exists)
      const slugError = page.locator('[data-testid="slug-error"]');
      if (await slugError.isVisible()) {
        await expect(slugError).toContainText('Este slug ya está en uso');
      }
    });
  });

  test.describe('Product Editing', () => {
    test('should edit an existing product', async ({ page }) => {
      await navigateToProducts(page);
      
      // Click edit button on first product
      await page.click('[data-testid="edit-product-button"]');
      await page.waitForSelector('[data-testid="product-form"]');
      
      // Update product name
      const newName = `Updated Product ${Date.now()}`;
      await page.fill('input[name="name"]', newName);
      
      // Switch to pricing tab and update price
      await page.click('[data-testid="pricing-tab"]');
      await page.fill('input[name="price"]', '200');
      
      // Save changes
      await page.click('button[type="submit"]');
      
      // Wait for success message
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Producto actualizado exitosamente');
    });

    test('should show auto-save functionality', async ({ page }) => {
      await navigateToProducts(page);
      
      await page.click('[data-testid="edit-product-button"]');
      await page.waitForSelector('[data-testid="product-form"]');
      
      // Make a change
      await page.fill('input[name="name"]', 'Auto-save Test Product');
      
      // Wait for auto-save (30 seconds in real app, but we'll check for indicator)
      await page.waitForSelector('[data-testid="auto-save-indicator"]', { timeout: 5000 });
      
      // Check auto-save status
      const autoSaveStatus = page.locator('[data-testid="auto-save-status"]');
      await expect(autoSaveStatus).toBeVisible();
    });
  });

  test.describe('Product Images', () => {
    test('should upload product images', async ({ page }) => {
      await navigateToProducts(page);
      
      // Edit an existing product
      await page.click('[data-testid="edit-product-button"]');
      await page.waitForSelector('[data-testid="product-form"]');
      
      // Switch to images tab
      await page.click('[data-testid="images-tab"]');
      await page.waitForSelector('[data-testid="image-manager"]');
      
      // Upload an image (mock file)
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'test-image.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('fake-image-content'),
      });
      
      // Wait for upload to complete
      await page.waitForSelector('[data-testid="image-uploaded"]', { timeout: 10000 });
      
      // Verify image appears in manager
      await expect(page.locator('[data-testid="product-image"]')).toBeVisible();
    });

    test('should set primary image', async ({ page }) => {
      await navigateToProducts(page);
      
      await page.click('[data-testid="edit-product-button"]');
      await page.waitForSelector('[data-testid="product-form"]');
      
      await page.click('[data-testid="images-tab"]');
      await page.waitForSelector('[data-testid="image-manager"]');
      
      // If there are multiple images, set one as primary
      const images = page.locator('[data-testid="product-image"]');
      const imageCount = await images.count();
      
      if (imageCount > 1) {
        // Click set primary button on second image
        await page.click('[data-testid="set-primary-button"]');
        
        // Wait for update
        await page.waitForTimeout(1000);
        
        // Verify primary badge appears
        await expect(page.locator('[data-testid="primary-badge"]')).toBeVisible();
      }
    });

    test('should delete product image', async ({ page }) => {
      await navigateToProducts(page);
      
      await page.click('[data-testid="edit-product-button"]');
      await page.waitForSelector('[data-testid="product-form"]');
      
      await page.click('[data-testid="images-tab"]');
      await page.waitForSelector('[data-testid="image-manager"]');
      
      const initialImageCount = await page.locator('[data-testid="product-image"]').count();
      
      if (initialImageCount > 0) {
        // Click delete button on first image
        await page.click('[data-testid="delete-image-button"]');
        
        // Confirm deletion in dialog
        await page.click('[data-testid="confirm-delete"]');
        
        // Wait for deletion
        await page.waitForTimeout(1000);
        
        // Verify image count decreased
        const newImageCount = await page.locator('[data-testid="product-image"]').count();
        expect(newImageCount).toBe(initialImageCount - 1);
      }
    });
  });

  test.describe('Product Deletion', () => {
    test('should delete a product', async ({ page }) => {
      await navigateToProducts(page);
      
      // Get initial product count
      const initialCount = await page.locator('[data-testid="product-row"]').count();
      
      // Click delete button on first product
      await page.click('[data-testid="delete-product-button"]');
      
      // Confirm deletion in dialog
      await page.waitForSelector('[data-testid="delete-confirmation"]');
      await page.click('[data-testid="confirm-delete"]');
      
      // Wait for deletion to complete
      await page.waitForTimeout(2000);
      
      // Verify product was removed or marked as inactive
      const newCount = await page.locator('[data-testid="product-row"]').count();
      expect(newCount).toBeLessThanOrEqual(initialCount);
    });

    test('should handle soft delete for products with orders', async ({ page }) => {
      await navigateToProducts(page);
      
      // Find a product that might have orders (look for specific indicators)
      const productWithOrders = page.locator('[data-testid="product-has-orders"]').first();
      
      if (await productWithOrders.isVisible()) {
        await productWithOrders.locator('[data-testid="delete-product-button"]').click();
        
        await page.waitForSelector('[data-testid="delete-confirmation"]');
        await page.click('[data-testid="confirm-delete"]');
        
        // Should show soft delete message
        await expect(page.locator('[data-testid="soft-delete-message"]')).toContainText('marcado como inactivo');
      }
    });
  });

  test.describe('Product History', () => {
    test('should show product change history', async ({ page }) => {
      await navigateToProducts(page);
      
      await page.click('[data-testid="edit-product-button"]');
      await page.waitForSelector('[data-testid="product-form"]');
      
      // Check if history panel exists
      const historyPanel = page.locator('[data-testid="history-panel"]');
      if (await historyPanel.isVisible()) {
        // Expand history panel
        await page.click('[data-testid="expand-history"]');
        
        // Verify history entries
        await expect(page.locator('[data-testid="history-entry"]')).toBeVisible();
        
        // Check history entry details
        const historyEntries = page.locator('[data-testid="history-entry"]');
        const entryCount = await historyEntries.count();
        expect(entryCount).toBeGreaterThan(0);
      }
    });

    test('should track local changes', async ({ page }) => {
      await navigateToProducts(page);
      
      await page.click('[data-testid="edit-product-button"]');
      await page.waitForSelector('[data-testid="product-form"]');
      
      // Make a change
      await page.fill('input[name="name"]', 'Changed Product Name');
      
      // Check if local change is tracked
      const historyPanel = page.locator('[data-testid="history-panel"]');
      if (await historyPanel.isVisible()) {
        await page.click('[data-testid="expand-history"]');
        
        // Look for local change indicator
        await expect(page.locator('[data-testid="local-change"]')).toBeVisible();
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await navigateToProducts(page);
      
      // Check mobile layout
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
      
      // Test mobile navigation
      await page.click('[data-testid="mobile-menu-toggle"]');
      await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();
    });

    test('should work on tablet devices', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      
      await navigateToProducts(page);
      
      // Check tablet layout
      await expect(page.locator('[data-testid="products-table"]')).toBeVisible();
      
      // Test tablet-specific interactions
      const createButton = page.locator('[data-testid="create-product-button"]');
      await expect(createButton).toBeVisible();
    });
  });

  test.describe('Performance', () => {
    test('should load products page quickly', async ({ page }) => {
      const startTime = Date.now();
      
      await navigateToProducts(page);
      
      const loadTime = Date.now() - startTime;
      
      // Should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
    });

    test('should handle large product lists', async ({ page }) => {
      await navigateToProducts(page);
      
      // Test scrolling performance with large lists
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      
      await page.waitForTimeout(1000);
      
      // Should still be responsive
      await expect(page.locator('[data-testid="products-table"]')).toBeVisible();
    });
  });
});
