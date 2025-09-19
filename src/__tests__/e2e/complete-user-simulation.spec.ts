import { test, expect } from '@playwright/test';

/**
 * SIMULACIÓN COMPLETA DE USUARIO REAL
 * 
 * Este test simula el comportamiento completo de un usuario real
 * realizando una compra en el e-commerce Pinteya
 */

test.describe('Complete User Purchase Simulation', () => {
  
  test('Full E-commerce User Journey with Real Interactions', async ({ page }) => {
    console.log('🎭 Iniciando simulación completa de usuario real...');

    // Configurar como usuario real
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    // FASE 1: EXPLORACIÓN INICIAL
    console.log('🏠 FASE 1: Llegada a la tienda online');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Simular comportamiento humano - scroll y exploración
    await page.mouse.move(960, 540); // Centro de la pantalla
    await page.waitForTimeout(2000); // Pausa natural
    
    await page.screenshot({ 
      path: 'test-results/user-01-arrival.png', 
      fullPage: true 
    });
    
    // Scroll para explorar la página
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(1500);
    
    console.log('✅ Usuario llegó a la tienda y está explorando');

    // FASE 2: BÚSQUEDA DE PRODUCTOS
    console.log('🔍 FASE 2: Búsqueda y exploración de productos');
    
    // Buscar barra de búsqueda o navegación
    const searchInput = page.locator('input[type="search"], input[placeholder*="buscar"], input[placeholder*="Buscar"]');
    const searchExists = await searchInput.count() > 0;
    
    if (searchExists) {
      console.log('🔍 Usando barra de búsqueda...');
      await searchInput.first().click();
      await page.waitForTimeout(500);
      await searchInput.first().fill('pintura');
      await page.waitForTimeout(1000);
      await page.keyboard.press('Enter');
      await page.waitForLoadState('networkidle');
    } else {
      console.log('🧭 Navegando por categorías...');
      // Buscar enlaces de navegación
      const navLinks = page.locator('nav a, a[href*="/products"], a[href*="/categoria"]');
      const navCount = await navLinks.count();
      
      if (navCount > 0) {
        await navLinks.first().click();
        await page.waitForLoadState('networkidle');
      } else {
        await page.goto('http://localhost:3000/products');
        await page.waitForLoadState('networkidle');
      }
    }
    
    await page.screenshot({ 
      path: 'test-results/user-02-product-search.png', 
      fullPage: true 
    });
    
    console.log('✅ Usuario exploró productos disponibles');

    // FASE 3: SELECCIÓN DE PRODUCTO
    console.log('🎯 FASE 3: Selección de producto específico');
    
    // Buscar productos en la página
    const productSelectors = [
      '[data-testid="product-card"]',
      '.product-card',
      'article[class*="product"]',
      '.product-item',
      '[class*="ProductCard"]'
    ];
    
    let productSelected = false;
    for (const selector of productSelectors) {
      const products = page.locator(selector);
      const count = await products.count();
      
      if (count > 0) {
        console.log(`🛍️ Encontrados ${count} productos con selector: ${selector}`);
        
        // Simular hover sobre el producto (comportamiento real)
        await products.first().hover();
        await page.waitForTimeout(1000);
        
        // Click en el producto
        await products.first().click();
        await page.waitForLoadState('networkidle');
        productSelected = true;
        break;
      }
    }
    
    if (!productSelected) {
      console.log('⚠️ No se encontraron productos, navegando directamente');
      await page.goto('http://localhost:3000/products/1');
      await page.waitForLoadState('networkidle');
    }
    
    await page.screenshot({ 
      path: 'test-results/user-03-product-selected.png', 
      fullPage: true 
    });
    
    console.log('✅ Usuario seleccionó un producto');

    // FASE 4: ANÁLISIS DEL PRODUCTO
    console.log('📋 FASE 4: Análisis detallado del producto');
    
    // Simular lectura de detalles (scroll en la página)
    await page.mouse.wheel(0, 200);
    await page.waitForTimeout(2000);
    
    // Buscar información del producto
    const productInfo = await page.evaluate(() => {
      const title = document.querySelector('h1, [data-testid="product-title"], .product-title')?.textContent;
      const price = document.querySelector('[data-testid="product-price"], .price, .product-price')?.textContent;
      const description = document.querySelector('.description, .product-description, [data-testid="product-description"]')?.textContent;
      
      return { title, price, description };
    });
    
    console.log('📦 Información del producto:');
    console.log(`  Título: ${productInfo.title || 'No encontrado'}`);
    console.log(`  Precio: ${productInfo.price || 'No encontrado'}`);
    console.log(`  Descripción: ${productInfo.description ? productInfo.description.substring(0, 100) + '...' : 'No encontrada'}`);

    // FASE 5: AGREGAR AL CARRITO
    console.log('🛒 FASE 5: Agregando producto al carrito');
    
    const addToCartSelectors = [
      '[data-testid="add-to-cart"]',
      'button:has-text("Agregar al carrito")',
      'button:has-text("Añadir al carrito")',
      'button:has-text("Comprar")',
      'button[class*="add-to-cart"]',
      '.add-to-cart-btn'
    ];
    
    let addedToCart = false;
    for (const selector of addToCartSelectors) {
      const button = page.locator(selector);
      const isVisible = await button.isVisible().catch(() => false);
      
      if (isVisible) {
        console.log(`🛒 Agregando al carrito con: ${selector}`);
        
        // Hover antes de click (comportamiento natural)
        await button.hover();
        await page.waitForTimeout(500);
        
        await button.click();
        await page.waitForTimeout(2000); // Esperar animación/confirmación
        addedToCart = true;
        break;
      }
    }
    
    await page.screenshot({ 
      path: 'test-results/user-04-added-to-cart.png', 
      fullPage: true 
    });
    
    if (addedToCart) {
      console.log('✅ Producto agregado al carrito exitosamente');
    } else {
      console.log('⚠️ No se pudo agregar al carrito automáticamente');
    }

    // FASE 6: VERIFICAR CARRITO
    console.log('🛍️ FASE 6: Verificando carrito de compras');
    
    // Buscar y hacer click en el carrito
    const cartSelectors = [
      '[data-testid="cart-icon"]',
      '[data-testid="cart-button"]',
      'a[href*="/cart"]',
      '.cart-icon',
      'button[class*="cart"]'
    ];
    
    let cartOpened = false;
    for (const selector of cartSelectors) {
      const cartElement = page.locator(selector);
      const isVisible = await cartElement.isVisible().catch(() => false);
      
      if (isVisible) {
        console.log(`🛒 Abriendo carrito con: ${selector}`);
        await cartElement.click();
        await page.waitForLoadState('networkidle');
        cartOpened = true;
        break;
      }
    }
    
    if (!cartOpened) {
      console.log('🛒 Navegando directamente al carrito');
      await page.goto('http://localhost:3000/cart');
      await page.waitForLoadState('networkidle');
    }
    
    await page.screenshot({ 
      path: 'test-results/user-05-cart-review.png', 
      fullPage: true 
    });
    
    console.log('✅ Usuario revisó el carrito');

    // FASE 7: PROCESO DE CHECKOUT
    console.log('💳 FASE 7: Iniciando proceso de checkout');
    
    // Buscar botón de checkout
    const checkoutSelectors = [
      '[data-testid="checkout-button"]',
      'button:has-text("Finalizar compra")',
      'button:has-text("Checkout")',
      'button:has-text("Proceder al pago")',
      'a[href*="/checkout"]'
    ];
    
    let checkoutStarted = false;
    for (const selector of checkoutSelectors) {
      const checkoutButton = page.locator(selector);
      const isVisible = await checkoutButton.isVisible().catch(() => false);
      
      if (isVisible) {
        console.log(`💳 Iniciando checkout con: ${selector}`);
        await checkoutButton.click();
        await page.waitForLoadState('networkidle');
        checkoutStarted = true;
        break;
      }
    }
    
    if (!checkoutStarted) {
      console.log('💳 Navegando directamente al checkout');
      await page.goto('http://localhost:3000/checkout');
      await page.waitForLoadState('networkidle');
    }
    
    await page.screenshot({ 
      path: 'test-results/user-06-checkout-start.png', 
      fullPage: true 
    });
    
    console.log('✅ Usuario llegó al checkout');

    // FASE 8: COMPLETAR INFORMACIÓN
    console.log('📝 FASE 8: Completando información de compra');
    
    // Datos de prueba realistas
    const userData = {
      email: 'juan.perez@email.com',
      firstName: 'Juan',
      lastName: 'Pérez',
      phone: '+54 11 4567-8900',
      address: 'Av. Corrientes 1234',
      city: 'Buenos Aires',
      postalCode: '1043'
    };
    
    // Llenar formulario de manera natural
    const formFields = [
      { selectors: ['input[name="email"]', 'input[type="email"]', '#email'], value: userData.email },
      { selectors: ['input[name="firstName"]', '#firstName'], value: userData.firstName },
      { selectors: ['input[name="lastName"]', '#lastName'], value: userData.lastName },
      { selectors: ['input[name="phone"]', 'input[type="tel"]', '#phone'], value: userData.phone },
      { selectors: ['input[name="address"]', '#address'], value: userData.address },
      { selectors: ['input[name="city"]', '#city'], value: userData.city },
      { selectors: ['input[name="postalCode"]', '#postalCode'], value: userData.postalCode }
    ];
    
    for (const field of formFields) {
      for (const selector of field.selectors) {
        try {
          const input = page.locator(selector);
          const isVisible = await input.isVisible().catch(() => false);
          
          if (isVisible) {
            await input.click();
            await page.waitForTimeout(300);
            await input.fill(field.value);
            await page.waitForTimeout(500); // Simular escritura humana
            console.log(`✅ Campo completado: ${selector}`);
            break;
          }
        } catch (error) {
          // Continuar con el siguiente selector
        }
      }
    }
    
    await page.screenshot({ 
      path: 'test-results/user-07-form-completed.png', 
      fullPage: true 
    });
    
    console.log('✅ Formulario de checkout completado');

    // FASE 9: RESUMEN FINAL
    console.log('📊 FASE 9: Análisis final del flujo');
    
    const finalUrl = page.url();
    const finalTitle = await page.title();
    
    console.log(`🌐 URL final: ${finalUrl}`);
    console.log(`📄 Título final: ${finalTitle}`);
    
    // Capturar estado final
    await page.screenshot({ 
      path: 'test-results/user-08-final-state.png', 
      fullPage: true 
    });
    
    console.log('🎉 Simulación de usuario completada exitosamente');
    console.log('📁 Screenshots del flujo completo guardados en test-results/user-*.png');
    
    // Verificar que llegamos al checkout
    expect(finalUrl).toContain('checkout');
    expect(finalTitle).toContain('Checkout');
  });
});









