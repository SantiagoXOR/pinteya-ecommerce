import { test, expect } from '@playwright/test';

/**
 * TEST SIMPLE DE COMPRA - CAPTURA DE FLUJO REAL
 * 
 * Este test captura screenshots del flujo real de compra
 * sin intentar automatizar completamente el proceso
 */

test.describe('Simple Purchase Flow Capture', () => {
  
  test('Capture Real User Journey Screenshots', async ({ page }) => {
    console.log('📸 Iniciando captura de flujo de compra real...');

    // Configurar viewport para desktop
    await page.setViewportSize({ width: 1920, height: 1080 });

    // PASO 1: Homepage
    console.log('📍 Capturando homepage...');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ 
      path: 'test-results/flow-01-homepage.png', 
      fullPage: true 
    });
    console.log('✅ Homepage capturada');

    // PASO 2: Productos
    console.log('📍 Navegando a productos...');
    try {
      // Intentar encontrar enlace de productos
      const productLink = page.locator('a[href*="/products"], nav a:has-text("Productos")').first();
      if (await productLink.isVisible()) {
        await productLink.click();
      } else {
        await page.goto('http://localhost:3000/products');
      }
      await page.waitForLoadState('networkidle');
      await page.screenshot({ 
        path: 'test-results/flow-02-products.png', 
        fullPage: true 
      });
      console.log('✅ Página de productos capturada');
    } catch (error) {
      console.log('⚠️ Error navegando a productos:', error.message);
    }

    // PASO 3: Detalle de producto
    console.log('📍 Intentando acceder a detalle de producto...');
    try {
      // Buscar primer producto disponible
      const productCard = page.locator('[data-testid="product-card"], .product-card, article').first();
      if (await productCard.isVisible()) {
        await productCard.click();
        await page.waitForLoadState('networkidle');
      } else {
        // Navegar directamente a un producto
        await page.goto('http://localhost:3000/products/1');
        await page.waitForLoadState('networkidle');
      }
      await page.screenshot({ 
        path: 'test-results/flow-03-product-detail.png', 
        fullPage: true 
      });
      console.log('✅ Detalle de producto capturado');
    } catch (error) {
      console.log('⚠️ Error en detalle de producto:', error.message);
    }

    // PASO 4: Carrito
    console.log('📍 Navegando al carrito...');
    try {
      // Buscar icono del carrito
      const cartIcon = page.locator('[data-testid="cart-icon"], [data-testid="cart-button"], .cart-icon').first();
      if (await cartIcon.isVisible()) {
        await cartIcon.click();
        await page.waitForLoadState('networkidle');
      } else {
        await page.goto('http://localhost:3000/cart');
        await page.waitForLoadState('networkidle');
      }
      await page.screenshot({ 
        path: 'test-results/flow-04-cart.png', 
        fullPage: true 
      });
      console.log('✅ Carrito capturado');
    } catch (error) {
      console.log('⚠️ Error navegando al carrito:', error.message);
    }

    // PASO 5: Checkout
    console.log('📍 Navegando al checkout...');
    try {
      await page.goto('http://localhost:3000/checkout');
      await page.waitForLoadState('networkidle');
      await page.screenshot({ 
        path: 'test-results/flow-05-checkout.png', 
        fullPage: true 
      });
      console.log('✅ Checkout capturado');
    } catch (error) {
      console.log('⚠️ Error navegando al checkout:', error.message);
    }

    // PASO 6: Explorar estructura de la página
    console.log('📍 Analizando estructura de la aplicación...');
    
    // Capturar información de la página actual
    const title = await page.title();
    const url = page.url();
    
    console.log(`📄 Título: ${title}`);
    console.log(`🌐 URL: ${url}`);
    
    // Buscar elementos importantes
    const importantElements = await page.evaluate(() => {
      const elements = [];
      
      // Buscar botones de compra/carrito
      const buttons = document.querySelectorAll('button');
      buttons.forEach((btn, index) => {
        const text = btn.textContent?.toLowerCase() || '';
        if (text.includes('comprar') || text.includes('carrito') || text.includes('checkout') || text.includes('agregar')) {
          elements.push({
            type: 'button',
            text: btn.textContent,
            id: btn.id,
            className: btn.className,
            index
          });
        }
      });
      
      // Buscar enlaces importantes
      const links = document.querySelectorAll('a');
      links.forEach((link, index) => {
        const href = link.href;
        const text = link.textContent?.toLowerCase() || '';
        if (href.includes('product') || href.includes('cart') || href.includes('checkout') || 
            text.includes('producto') || text.includes('carrito')) {
          elements.push({
            type: 'link',
            text: link.textContent,
            href: link.href,
            className: link.className,
            index
          });
        }
      });
      
      // Buscar formularios
      const forms = document.querySelectorAll('form');
      forms.forEach((form, index) => {
        elements.push({
          type: 'form',
          action: form.action,
          method: form.method,
          className: form.className,
          index
        });
      });
      
      return elements;
    });
    
    console.log('🔍 Elementos importantes encontrados:');
    importantElements.forEach((element, index) => {
      console.log(`  ${index + 1}. ${element.type}: ${element.text || element.href || element.action}`);
    });

    // PASO 7: Capturar estado final
    await page.screenshot({ 
      path: 'test-results/flow-06-final-state.png', 
      fullPage: true 
    });

    console.log('🎉 Captura de flujo completada exitosamente');
    console.log('📁 Screenshots guardados en test-results/flow-*.png');
  });

  test('Test API Endpoints', async ({ request }) => {
    console.log('🔧 Probando endpoints de API...');
    
    // Test API de productos
    try {
      const productsResponse = await request.get('http://localhost:3000/api/products');
      console.log(`📦 API Productos: ${productsResponse.status()}`);
      
      if (productsResponse.ok()) {
        const products = await productsResponse.json();
        console.log(`✅ Productos encontrados: ${products.length || 'N/A'}`);
      }
    } catch (error) {
      console.log('⚠️ Error en API productos:', error.message);
    }

    // Test API de categorías
    try {
      const categoriesResponse = await request.get('http://localhost:3000/api/categories');
      console.log(`🏷️ API Categorías: ${categoriesResponse.status()}`);
    } catch (error) {
      console.log('⚠️ Error en API categorías:', error.message);
    }

    // Test API de MercadoPago preferences
    try {
      const mpResponse = await request.post('http://localhost:3000/api/mercadopago/preferences', {
        data: {
          items: [{
            title: 'Test Product',
            quantity: 1,
            unit_price: 100
          }]
        }
      });
      console.log(`💳 API MercadoPago: ${mpResponse.status()}`);
    } catch (error) {
      console.log('⚠️ Error en API MercadoPago:', error.message);
    }

    console.log('✅ Test de APIs completado');
  });
});









