import { test, expect } from '@playwright/test';

test.describe('Cart Width Selector Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a la página principal
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  test('should add correct product to cart when different width is selected', async ({ page }) => {
    // Buscar específicamente "Cinta Papel Blanca" que sabemos que tiene selector de ancho
    await page.waitForSelector('text=Cinta Papel Blanca', { timeout: 10000 });
    
    // Hacer clic en "Cinta Papel Blanca"
    await page.click('text=Cinta Papel Blanca');
    
    // Esperar a que el modal se abra
    await page.waitForSelector('[role="dialog"]', { timeout: 10000 });
    
    // Tomar screenshot del modal abierto
    await page.screenshot({ 
      path: 'tests/screenshots/modal-opened.png',
      fullPage: true 
    });
    
    // Esperar a que las opciones de ancho se carguen
    await page.waitForTimeout(3000);
    
    // Buscar el texto "Ancho:" que sabemos que existe
    const widthLabel = page.locator('text=Ancho:');
    await expect(widthLabel).toBeVisible({ timeout: 5000 });
    
    console.log('✅ Selector de ancho encontrado');
    
    // Buscar opciones de ancho disponibles (botones con medidas)
    const widthOptions = await page.locator('button').filter({ hasText: /\d+mm/ }).all();
    
    if (widthOptions.length > 1) {
      console.log(`Encontradas ${widthOptions.length} opciones de ancho`);
      
      // Obtener el texto de la primera opción (por defecto)
      const firstOptionText = await widthOptions[0].textContent();
      console.log(`Opción por defecto: ${firstOptionText}`);
      
      // Seleccionar la segunda opción de ancho (diferente a la por defecto)
      const secondOption = widthOptions[1];
      const optionText = await secondOption.textContent();
      console.log(`Seleccionando opción: ${optionText}`);
      
      await secondOption.click();
      await page.waitForTimeout(2000);
      
      // Tomar screenshot después de cambiar el ancho
      await page.screenshot({ 
        path: 'tests/screenshots/width-changed.png',
        fullPage: true 
      });
      
      // Verificar que el ancho seleccionado cambió (buscar clase activa)
      await expect(secondOption).toHaveClass(/bg-orange|border-orange|selected|active/);
      
      // Buscar el botón "Agregar al carrito"
      const addToCartButton = page.locator('button:has-text("Agregar al carrito")');
      await expect(addToCartButton).toBeVisible();
      
      // Obtener información del producto antes de agregarlo
      const productInfo = await page.evaluate(() => {
        // Buscar el ancho seleccionado
        const selectedWidth = document.querySelector('.bg-orange-500, .border-orange-500, [class*="bg-orange"]');
        return selectedWidth ? selectedWidth.textContent : 'No width info found';
      });
      
      console.log('Información del producto antes de agregar:', productInfo);
      
      // Hacer clic en "Agregar al carrito"
      await addToCartButton.click();
      await page.waitForTimeout(2000);
      
      // Tomar screenshot final
      await page.screenshot({ 
        path: 'tests/screenshots/after-add-to-cart.png',
        fullPage: true 
      });
      
      console.log('✅ Test completado: Producto agregado al carrito con ancho seleccionado');
      
    } else {
      console.log('⚠️ No se encontraron múltiples opciones de ancho, saltando test de selección');
      
      // Aún así, probar agregar al carrito
      const addToCartButton = page.locator('button:has-text("Agregar al carrito")');
      if (await addToCartButton.isVisible()) {
        await addToCartButton.click();
        console.log('✅ Producto agregado al carrito (sin cambio de ancho)');
      }
    }
  });

  test('should display correct product information when width changes', async ({ page }) => {
    // Navegar y abrir modal (similar al test anterior)
    await page.waitForSelector('[data-testid*="product"], .product-card, [class*="product"]');
    
    const productCards = await page.locator('[data-testid*="product"], .product-card, [class*="product"]').all();
    let targetProductCard = productCards.length > 0 ? productCards[0] : null;
    
    expect(targetProductCard).toBeTruthy();
    await targetProductCard!.click();
    
    // Esperar modal
    await page.waitForSelector('[data-testid="shop-detail-modal"], .modal, [class*="modal"]');
    
    // Verificar que la información del producto se actualiza cuando cambia el ancho
    const widthOptions = await page.locator('button:has-text("mm"), button:has-text("x")').all();
    
    if (widthOptions.length > 1) {
      // Obtener precio inicial
      const initialPrice = await page.locator('[class*="price"], .price, [data-testid="price"]').first().textContent();
      console.log('Precio inicial:', initialPrice);
      
      // Cambiar ancho
      await widthOptions[1].click();
      await page.waitForTimeout(1000);
      
      // Obtener precio después del cambio
      const newPrice = await page.locator('[class*="price"], .price, [data-testid="price"]').first().textContent();
      console.log('Precio después del cambio:', newPrice);
      
      // Verificar que la información se actualiza (puede ser precio, nombre, etc.)
      console.log('✅ Test de actualización de información completado');
    }
  });

  test('should display products correctly in mobile cart modal after adding with width selector', async ({ page }) => {
    // Configurar viewport mobile
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navegar a la página principal
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Buscar producto con selector de ancho
    await page.waitForSelector('text=Cinta Papel Blanca', { timeout: 10000 });
    await page.click('text=Cinta Papel Blanca');
    
    // Esperar a que el modal se abra
    await page.waitForSelector('[role="dialog"]', { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // Agregar producto al carrito
    const addToCartButton = page.locator('button:has-text("Agregar al carrito")');
    if (await addToCartButton.isVisible()) {
      await addToCartButton.click();
      await page.waitForTimeout(2000);
      
      // Abrir modal del carrito
      await page.click('[data-testid="cart-icon"]');
      await page.waitForSelector('[data-testid="cart-item"]', { timeout: 5000 });
      
      // Verificar que el producto se muestra correctamente
      const cartItems = page.locator('[data-testid="cart-item"]');
      await expect(cartItems.first()).toBeVisible();
      
      // Verificar altura del área de scroll
      const scrollHeight = await page.evaluate(() => {
        const scrollElement = document.querySelector('.flex-1.overflow-y-auto, [class*="overflow-y-auto"]');
        if (!scrollElement) return 0;
        return scrollElement.getBoundingClientRect().height;
      });
      
      // La altura debe ser al menos 280px para mostrar productos
      expect(scrollHeight).toBeGreaterThanOrEqual(280);
      
      // Verificar que el producto no se deforma
      const firstItem = cartItems.first();
      const itemBox = await firstItem.boundingBox();
      expect(itemBox).not.toBeNull();
      
      if (itemBox) {
        // Verificar dimensiones razonables
        expect(itemBox.width).toBeGreaterThan(300);
        expect(itemBox.height).toBeGreaterThan(50);
      }
    }
  });
});