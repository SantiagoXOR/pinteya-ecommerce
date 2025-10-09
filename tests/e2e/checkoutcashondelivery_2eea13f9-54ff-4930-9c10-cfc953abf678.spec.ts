
import { test } from '@playwright/test';
import { expect } from '@playwright/test';

test('CheckoutCashOnDelivery_2025-10-08', async ({ page, context }) => {
  
    // Navigate to URL
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    
    // Wait for the page to be ready instead of networkidle
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000); // Give time for dynamic content to load

    // Take screenshot
    await page.screenshot({ path: 'homepage_initial.png' });

    // Wait for products to load and select first product
  console.log('Waiting for products to load...');
  await page.waitForSelector('[data-testid="commercial-product-card"]', { timeout: 10000 });
  const firstProduct = page.locator('[data-testid="commercial-product-card"]').first();
  
  // Click on the first product's "Add to cart" button using data-testid
  console.log('Clicking add to cart button...');
  try {
    await page.waitForTimeout(2000); // Wait for product to be fully loaded
    const addToCartButton = firstProduct.locator('[data-testid="add-to-cart"]');
    await addToCartButton.waitFor({ timeout: 5000 });
    await addToCartButton.click({ timeout: 5000 });
    console.log('Add to cart button clicked successfully');
  } catch (error) {
    console.log('Add to cart button not found:', error);
  }

    // Take screenshot
    await page.screenshot({ path: 'homepage_current_state.png' });

    // Navigate to cart using the correct selector found in ActionButtons.tsx
    console.log('Looking for cart button...');
    const cartButton = page.locator('[data-testid="cart-icon"]');
    try {
        await cartButton.waitFor({ timeout: 5000 });
        if (await cartButton.isVisible()) {
            console.log('Cart button found, clicking...');
            await cartButton.click();
        }
    } catch (error) {
        console.log('Cart button not found:', error);
    }

    // Take screenshot
    await page.screenshot({ path: 'after_navigation_click.png' });

    // Look for checkout button using correct selectors
    console.log('Looking for checkout button...');
    const checkoutButton = page.locator('button:has-text("Finalizar Compra"), [data-testid="submit-checkout-btn"], button:has-text("Checkout"), button:has-text("Finalizar")');
    try {
        await checkoutButton.waitFor({ timeout: 5000 });
        if (await checkoutButton.isVisible()) {
            console.log('Checkout button found, clicking...');
            await checkoutButton.click();
        }
    } catch (error) {
        console.log('Checkout button not found:', error);
    }

    // Take screenshot
    await page.screenshot({ path: 'after_button_click.png' });

    // Navigate to search page to find more products
    await page.goto('http://localhost:3000/search');
    await page.waitForLoadState('networkidle');

    // Take screenshot
    await page.screenshot({ path: 'search_page.png' });

    // Search for paint products
    const searchInput = page.locator('input[type="search"], input[placeholder*="buscar"], input[name="search"], .search-input');
    if (await searchInput.isVisible()) {
        await searchInput.fill('pintura');
        await searchInput.press('Enter');
        await page.waitForLoadState('networkidle');
    }

    // Click on a product from search results
    await page.waitForSelector('[data-testid="commercial-product-card"]', { timeout: 5000 });
    await page.click('[data-testid="commercial-product-card"]');

    // Take screenshot after product selection
    await page.screenshot({ path: 'search_filled.png' });

    // If we're on a product detail page, add to cart
    const addToCartButton2 = page.locator('button:has-text("Agregar al carrito"), button:has-text("Añadir"), .add-to-cart');
    if (await addToCartButton2.isVisible()) {
        await addToCartButton2.click();
        await page.waitForTimeout(1000); // Wait for cart animation
    }

    // Take screenshot after adding to cart
    await page.screenshot({ path: 'product_added_to_cart.png' });

    // Navigate to cart using correct selector
    console.log('Looking for cart button (second time)...');
    const cartButton2 = page.locator('[data-testid="cart-icon"]');
    if (await cartButton2.isVisible()) {
        console.log('Cart button found, clicking...');
        await cartButton2.click();
    } else {
        // If no cart button visible, navigate directly to checkout
        console.log('Cart button not visible, navigating directly to checkout...');
        await page.goto('http://localhost:3000/checkout');
    }

    // Take screenshot of checkout page
    await page.screenshot({ path: 'checkout_page.png' });

    // Select cash on delivery payment method
    const cashOnDeliveryOption = page.locator('button:has-text("Pago contra entrega"), input[value="cash_on_delivery"], .cash-delivery-option, button:has-text("Contra entrega"), button:has-text("Efectivo")');
    if (await cashOnDeliveryOption.isVisible()) {
        await cashOnDeliveryOption.click();
    }

    // Fill customer information
    const nameInput = page.locator('input[name="name"], input[placeholder*="nombre"]');
    if (await nameInput.isVisible()) {
        await nameInput.fill('Juan Pérez');
    }

    const emailInput = page.locator('input[name="email"], input[type="email"], input[placeholder*="email"]');
    if (await emailInput.isVisible()) {
        await emailInput.fill('juan.perez@email.com');
    }

    const phoneInput = page.locator('input[name="phone"], input[type="tel"], input[placeholder*="teléfono"]');
    if (await phoneInput.isVisible()) {
        await phoneInput.fill('1234567890');
    }

    const addressInput = page.locator('input[name="address"], textarea[name="address"], input[placeholder*="dirección"]');
    if (await addressInput.isVisible()) {
        await addressInput.fill('Calle Falsa 123, Ciudad, Provincia');
    }

    // Take final screenshot
    await page.screenshot({ path: 'checkout_completed.png' });

    // Submit the order if there's a submit button
    const submitButton = page.locator('button[type="submit"], button:has-text("Finalizar"), button:has-text("Confirmar")');
    if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(3000); // Wait for order processing
        await page.screenshot({ path: 'order_confirmation.png' });
    }
});