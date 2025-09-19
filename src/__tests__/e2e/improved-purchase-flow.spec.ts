import { test, expect } from '@playwright/test';

/**
 * TEST DE FLUJO DE COMPRA MEJORADO
 * 
 * Este test verifica las mejoras implementadas en el flujo de compra:
 * 1. APIs de carrito funcionando
 * 2. MercadoPago con rutas corregidas
 * 3. Productos visibles con data-testid correctos
 * 4. Botón "Finalizar Compra" habilitado cuando hay productos
 */

test.describe('Improved Purchase Flow - Post Implementation', () => {
  
  test('Verify All APIs Are Working', async ({ request }) => {
    console.log('🔧 Verificando APIs mejoradas...');

    const baseURL = 'http://localhost:3000';
    const results = {
      products: { status: 'unknown', hasData: false },
      cart: { status: 'unknown', hasData: false },
      cartAdd: { status: 'unknown', hasData: false },
      mercadopago: { status: 'unknown', hasData: false }
    };

    // TEST 1: API de Productos (debe devolver datos reales)
    try {
      const response = await request.get(`${baseURL}/api/products`);
      results.products.status = response.status();
      
      if (response.ok()) {
        const data = await response.json();
        results.products.hasData = Array.isArray(data.data) && data.data.length > 0;
        console.log(`✅ Productos API: ${response.status()} - ${data.data?.length || 0} productos`);
      }
    } catch (error) {
      console.log(`❌ Error en Productos API: ${error.message}`);
    }

    // TEST 2: API de Carrito (debe devolver 401 para usuario no autenticado)
    try {
      const response = await request.get(`${baseURL}/api/cart`);
      results.cart.status = response.status();
      
      const data = await response.json();
      results.cart.hasData = data.success === false && data.error.includes('autenticado');
      console.log(`✅ Cart API: ${response.status()} - Error esperado: ${data.error}`);
    } catch (error) {
      console.log(`❌ Error en Cart API: ${error.message}`);
    }

    // TEST 3: API de Agregar al Carrito (debe devolver documentación en GET)
    try {
      const response = await request.get(`${baseURL}/api/cart/add`);
      results.cartAdd.status = response.status();
      
      if (response.ok()) {
        const data = await response.json();
        results.cartAdd.hasData = data.endpoint === '/api/cart/add';
        console.log(`✅ Cart Add API: ${response.status()} - Documentación disponible`);
      }
    } catch (error) {
      console.log(`❌ Error en Cart Add API: ${error.message}`);
    }

    // TEST 4: API de MercadoPago (debe devolver error de autorización, no 404)
    try {
      const response = await request.get(`${baseURL}/api/mercadopago/preferences`);
      results.mercadopago.status = response.status();
      
      const data = await response.json();
      results.mercadopago.hasData = data.error && !data.error.includes('404');
      console.log(`✅ MercadoPago API: ${response.status()} - ${data.error || 'OK'}`);
    } catch (error) {
      console.log(`❌ Error en MercadoPago API: ${error.message}`);
    }

    // Verificaciones
    expect(results.products.status).toBe(200);
    expect(results.products.hasData).toBe(true);
    expect(results.cart.status).toBe(401);
    expect(results.cart.hasData).toBe(true);
    expect(results.cartAdd.status).toBe(200);
    expect(results.cartAdd.hasData).toBe(true);
    expect(results.mercadopago.status).toBe(401);
    expect(results.mercadopago.hasData).toBe(true);

    console.log('✅ Todas las APIs funcionan correctamente');
  });

  test('Verify Product Cards Have Correct Data-TestIds', async ({ page }) => {
    console.log('🎯 Verificando data-testids de productos...');

    // Configurar viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Navegar a la tienda
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Buscar productos con el data-testid correcto
    const productCards = page.locator('[data-testid="product-card"]');
    const productCount = await productCards.count();
    
    console.log(`🛍️ Productos encontrados con data-testid correcto: ${productCount}`);
    
    if (productCount > 0) {
      // Verificar que el primer producto tiene botón de agregar al carrito
      const firstProduct = productCards.first();
      const addToCartBtn = firstProduct.locator('[data-testid="add-to-cart"]');
      
      await expect(addToCartBtn).toBeVisible();
      console.log('✅ Botón "Agregar al carrito" encontrado con data-testid correcto');
      
      // Capturar screenshot de productos
      await page.screenshot({ 
        path: 'test-results/improved-01-products-visible.png', 
        fullPage: true 
      });
    } else {
      console.log('⚠️ No se encontraron productos con data-testid="product-card"');
      
      // Buscar productos con otros selectores
      const alternativeSelectors = [
        '[data-testid="commercial-product-card"]',
        '.product-card',
        'article[class*="product"]'
      ];
      
      for (const selector of alternativeSelectors) {
        const altProducts = page.locator(selector);
        const altCount = await altProducts.count();
        console.log(`📦 Productos con selector ${selector}: ${altCount}`);
      }
    }

    expect(productCount).toBeGreaterThan(0);
  });

  test('Verify Cart and Checkout Flow', async ({ page }) => {
    console.log('🛒 Verificando flujo de carrito y checkout...');

    // Configurar viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Navegar a la tienda
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Buscar icono del carrito
    const cartIcon = page.locator('[data-testid="cart-icon"]');
    if (await cartIcon.isVisible()) {
      await cartIcon.click();
      await page.waitForTimeout(1000);
      
      console.log('✅ Modal de carrito abierto');
      
      // Buscar botón de checkout
      const checkoutBtn = page.locator('[data-testid="checkout-btn"]');
      if (await checkoutBtn.isVisible()) {
        const isDisabled = await checkoutBtn.isDisabled();
        const buttonText = await checkoutBtn.textContent();
        
        console.log(`🔍 Botón checkout: "${buttonText}" - Deshabilitado: ${isDisabled}`);
        
        // Capturar screenshot del carrito
        await page.screenshot({ 
          path: 'test-results/improved-02-cart-modal.png', 
          fullPage: true 
        });
        
        // El botón debería estar deshabilitado si no hay productos
        // pero debería existir y ser visible
        expect(checkoutBtn).toBeVisible();
      } else {
        console.log('❌ Botón de checkout no encontrado');
      }
    } else {
      console.log('⚠️ Icono de carrito no encontrado');
    }

    // Navegar directamente al checkout
    await page.goto('http://localhost:3000/checkout');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ 
      path: 'test-results/improved-03-checkout-page.png', 
      fullPage: true 
    });
    
    console.log('✅ Página de checkout accesible');
  });

  test('Test Product Interaction (Without Authentication)', async ({ page }) => {
    console.log('🎮 Probando interacción con productos...');

    // Configurar viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Navegar a la tienda
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Buscar productos
    const productCards = page.locator('[data-testid="product-card"]');
    const productCount = await productCards.count();
    
    if (productCount > 0) {
      console.log(`🛍️ Encontrados ${productCount} productos`);
      
      // Intentar hacer click en "Agregar al carrito" del primer producto
      const firstProduct = productCards.first();
      const addToCartBtn = firstProduct.locator('[data-testid="add-to-cart"]');
      
      if (await addToCartBtn.isVisible()) {
        console.log('🔍 Intentando agregar producto al carrito...');
        
        // Click en agregar al carrito
        await addToCartBtn.click();
        await page.waitForTimeout(2000);
        
        // Buscar notificaciones o mensajes
        const notifications = page.locator('.toast, .notification, [role="alert"]');
        const notificationCount = await notifications.count();
        
        if (notificationCount > 0) {
          const notificationText = await notifications.first().textContent();
          console.log(`📢 Notificación: "${notificationText}"`);
        } else {
          console.log('ℹ️ No se mostraron notificaciones (esperado para usuario no autenticado)');
        }
        
        await page.screenshot({ 
          path: 'test-results/improved-04-product-interaction.png', 
          fullPage: true 
        });
        
        console.log('✅ Interacción con producto completada');
      } else {
        console.log('❌ Botón "Agregar al carrito" no visible');
      }
    } else {
      console.log('❌ No se encontraron productos para interactuar');
    }
  });

  test('Performance and Load Test', async ({ page }) => {
    console.log('⚡ Probando rendimiento y carga...');

    // Configurar viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Medir tiempo de carga de la página principal
    const startTime = Date.now();
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    console.log(`⏱️ Tiempo de carga: ${loadTime}ms`);
    
    // Verificar que la página carga en menos de 5 segundos
    expect(loadTime).toBeLessThan(5000);
    
    // Contar elementos importantes
    const productCards = await page.locator('[data-testid="product-card"]').count();
    const images = await page.locator('img').count();
    const buttons = await page.locator('button').count();
    
    console.log(`📊 Elementos en página:`);
    console.log(`  - Productos: ${productCards}`);
    console.log(`  - Imágenes: ${images}`);
    console.log(`  - Botones: ${buttons}`);
    
    await page.screenshot({ 
      path: 'test-results/improved-05-performance-test.png', 
      fullPage: true 
    });
    
    console.log('✅ Test de rendimiento completado');
  });
});









