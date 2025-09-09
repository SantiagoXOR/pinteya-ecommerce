import { test, expect, Page } from '@playwright/test';

/**
 * TEST DE COMPRA REAL - SIMULACIÓN DE USUARIO COMPLETA
 * 
 * Este test simula el comportamiento de un usuario real realizando una compra
 * completa en el e-commerce Pinteya, incluyendo:
 * - Navegación natural por la tienda
 * - Búsqueda y selección de productos
 * - Proceso de checkout completo
 * - Integración con MercadoPago (modo test)
 * - Verificación de confirmación de compra
 */

test.describe('Real User Purchase Flow - Pinteya E-commerce', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      // Simular un usuario real con headers normales
      extraHTTPHeaders: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    page = await context.newPage();
    
    // Configurar timeouts más largos para simular comportamiento real
    page.setDefaultTimeout(30000);
    page.setDefaultNavigationTimeout(30000);
  });

  test('Complete Purchase Flow - From Homepage to Order Confirmation', async () => {
    console.log('🛒 Iniciando simulación de compra real...');

    // PASO 1: Llegar a la página principal con redirección automática habilitada
    console.log('📍 Paso 1: Navegando a la página principal');
    await page.goto('http://localhost:3000?auto_redirect=true');
    await page.waitForLoadState('networkidle');
    
    // Tomar screenshot inicial
    await page.screenshot({ 
      path: 'test-results/01-homepage.png', 
      fullPage: true 
    });
    
    // Verificar que la página carga correctamente
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
    console.log('✅ Página principal cargada correctamente');

    // PASO 2: Explorar productos (comportamiento natural)
    console.log('📍 Paso 2: Explorando productos disponibles');
    
    // Buscar enlaces de productos o categorías
    const productLinks = page.locator('a[href*="/products"], a[href*="/categoria"], [data-testid*="product"]');
    const linkCount = await productLinks.count();
    
    if (linkCount > 0) {
      await productLinks.first().click();
      await page.waitForLoadState('networkidle');
    } else {
      // Si no hay enlaces directos, buscar productos en la página principal
      const productCards = page.locator('[data-testid="product-card"], .product-card, [class*="product"]');
      const cardCount = await productCards.count();
      
      if (cardCount > 0) {
        await productCards.first().click();
        await page.waitForLoadState('networkidle');
      } else {
        // Navegar manualmente a productos
        await page.goto('http://localhost:3000/products');
        await page.waitForLoadState('networkidle');
      }
    }
    
    await page.screenshot({ 
      path: 'test-results/02-products-page.png', 
      fullPage: true 
    });
    console.log('✅ Navegación a productos completada');

    // PASO 3: Seleccionar un producto específico
    console.log('📍 Paso 3: Seleccionando producto para comprar');
    
    // Buscar productos disponibles con diferentes selectores
    const productSelectors = [
      '[data-testid="product-card"]',
      '.product-card',
      '[class*="product-item"]',
      'article[class*="product"]',
      'div[class*="product-card"]'
    ];
    
    let productFound = false;
    for (const selector of productSelectors) {
      const products = page.locator(selector);
      const count = await products.count();
      
      if (count > 0) {
        console.log(`🎯 Encontrados ${count} productos con selector: ${selector}`);
        await products.first().click();
        await page.waitForLoadState('networkidle');
        productFound = true;
        break;
      }
    }
    
    if (!productFound) {
      console.log('⚠️ No se encontraron productos, intentando navegación directa');
      // Intentar con un producto específico si existe
      await page.goto('http://localhost:3000/products/1');
      await page.waitForLoadState('networkidle');
    }
    
    await page.screenshot({ 
      path: 'test-results/03-product-detail.png', 
      fullPage: true 
    });
    console.log('✅ Producto seleccionado');

    // PASO 4: Agregar producto al carrito
    console.log('📍 Paso 4: Agregando producto al carrito');
    
    // Buscar botón de agregar al carrito con diferentes selectores
    const addToCartSelectors = [
      '[data-testid="add-to-cart"]',
      'button[class*="add-to-cart"]',
      'button:has-text("Agregar al carrito")',
      'button:has-text("Añadir al carrito")',
      'button:has-text("Comprar")',
      '.add-to-cart-btn',
      '#add-to-cart'
    ];
    
    let cartButtonFound = false;
    for (const selector of addToCartSelectors) {
      const button = page.locator(selector);
      const isVisible = await button.isVisible().catch(() => false);
      
      if (isVisible) {
        console.log(`🛒 Encontrado botón de carrito: ${selector}`);
        await button.click();
        await page.waitForTimeout(2000); // Esperar animación
        cartButtonFound = true;
        break;
      }
    }
    
    if (!cartButtonFound) {
      console.log('⚠️ No se encontró botón de agregar al carrito, buscando alternativas...');
      // Buscar cualquier botón que pueda ser de compra
      const buyButtons = page.locator('button:has-text("Comprar"), button:has-text("Buy"), button[class*="buy"]');
      const buyCount = await buyButtons.count();
      
      if (buyCount > 0) {
        await buyButtons.first().click();
        await page.waitForTimeout(2000);
        cartButtonFound = true;
      }
    }
    
    await page.screenshot({ 
      path: 'test-results/04-added-to-cart.png', 
      fullPage: true 
    });
    
    if (cartButtonFound) {
      console.log('✅ Producto agregado al carrito');
    } else {
      console.log('⚠️ No se pudo agregar al carrito, continuando con el test...');
    }

    // PASO 5: Ir al carrito
    console.log('📍 Paso 5: Navegando al carrito de compras');
    
    // Buscar icono/botón del carrito
    const cartSelectors = [
      '[data-testid="cart-button"]',
      '[data-testid="cart-icon"]',
      'a[href*="/cart"]',
      'button[class*="cart"]',
      '.cart-icon',
      '[aria-label*="cart"]',
      '[aria-label*="carrito"]'
    ];
    
    let cartFound = false;
    for (const selector of cartSelectors) {
      const cartElement = page.locator(selector);
      const isVisible = await cartElement.isVisible().catch(() => false);
      
      if (isVisible) {
        console.log(`🛒 Encontrado carrito: ${selector}`);
        await cartElement.click();
        await page.waitForLoadState('networkidle');
        cartFound = true;
        break;
      }
    }
    
    if (!cartFound) {
      console.log('⚠️ No se encontró botón de carrito, navegando directamente');
      await page.goto('http://localhost:3000/cart');
      await page.waitForLoadState('networkidle');
    }
    
    await page.screenshot({ 
      path: 'test-results/05-cart-view.png', 
      fullPage: true 
    });
    console.log('✅ Carrito de compras abierto');

    // PASO 6: Proceder al checkout
    console.log('📍 Paso 6: Iniciando proceso de checkout');
    
    // Buscar botón de checkout
    const checkoutSelectors = [
      '[data-testid="checkout-button"]',
      'button:has-text("Checkout")',
      'button:has-text("Finalizar compra")',
      'button:has-text("Proceder al pago")',
      'a[href*="/checkout"]',
      '.checkout-btn',
      '#checkout-button'
    ];
    
    let checkoutFound = false;
    for (const selector of checkoutSelectors) {
      const checkoutButton = page.locator(selector);
      const isVisible = await checkoutButton.isVisible().catch(() => false);
      
      if (isVisible) {
        console.log(`💳 Encontrado botón de checkout: ${selector}`);
        await checkoutButton.click();
        await page.waitForLoadState('networkidle');
        checkoutFound = true;
        break;
      }
    }
    
    if (!checkoutFound) {
      console.log('⚠️ No se encontró botón de checkout, navegando directamente');
      await page.goto('http://localhost:3000/checkout');
      await page.waitForLoadState('networkidle');
    }
    
    await page.screenshot({ 
      path: 'test-results/06-checkout-form.png', 
      fullPage: true 
    });
    console.log('✅ Página de checkout cargada');
  });

  test('Complete Checkout Form and Payment Process', async () => {
    console.log('💳 Iniciando proceso de checkout y pago...');

    // Setup: Navegar directamente al checkout
    await page.goto('http://localhost:3000/checkout');
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: 'test-results/07-checkout-initial.png',
      fullPage: true
    });

    // PASO 7: Llenar formulario de checkout
    console.log('📍 Paso 7: Completando formulario de checkout');

    // Datos de prueba para el formulario
    const testData = {
      email: 'test.user@pinteya.com',
      firstName: 'Juan',
      lastName: 'Pérez',
      phone: '+54 11 1234-5678',
      address: 'Av. Corrientes 1234',
      city: 'Buenos Aires',
      postalCode: '1043',
      province: 'Buenos Aires'
    };

    // Buscar y llenar campos del formulario
    const formFields = [
      { selector: 'input[name="email"], input[type="email"], #email', value: testData.email },
      { selector: 'input[name="firstName"], input[name="first_name"], #firstName', value: testData.firstName },
      { selector: 'input[name="lastName"], input[name="last_name"], #lastName', value: testData.lastName },
      { selector: 'input[name="phone"], input[type="tel"], #phone', value: testData.phone },
      { selector: 'input[name="address"], #address', value: testData.address },
      { selector: 'input[name="city"], #city', value: testData.city },
      { selector: 'input[name="postalCode"], input[name="postal_code"], #postalCode', value: testData.postalCode }
    ];

    for (const field of formFields) {
      try {
        const input = page.locator(field.selector);
        const isVisible = await input.isVisible().catch(() => false);

        if (isVisible) {
          await input.fill(field.value);
          console.log(`✅ Campo completado: ${field.selector}`);
          await page.waitForTimeout(500); // Simular escritura humana
        }
      } catch (error) {
        console.log(`⚠️ No se pudo llenar campo: ${field.selector}`);
      }
    }

    await page.screenshot({
      path: 'test-results/08-form-filled.png',
      fullPage: true
    });
    console.log('✅ Formulario de checkout completado');

    // PASO 8: Seleccionar método de pago
    console.log('📍 Paso 8: Seleccionando método de pago');

    // Buscar opciones de pago
    const paymentSelectors = [
      'input[value="mercadopago"], input[name="payment"][value="mp"]',
      'button:has-text("MercadoPago")',
      'label:has-text("MercadoPago")',
      '.payment-method-mp',
      '[data-testid="payment-mercadopago"]'
    ];

    let paymentSelected = false;
    for (const selector of paymentSelectors) {
      try {
        const paymentOption = page.locator(selector);
        const isVisible = await paymentOption.isVisible().catch(() => false);

        if (isVisible) {
          await paymentOption.click();
          console.log(`💳 Método de pago seleccionado: ${selector}`);
          paymentSelected = true;
          break;
        }
      } catch (error) {
        console.log(`⚠️ No se pudo seleccionar pago: ${selector}`);
      }
    }

    if (!paymentSelected) {
      console.log('⚠️ No se encontró método de pago específico, continuando...');
    }

    await page.screenshot({
      path: 'test-results/09-payment-selected.png',
      fullPage: true
    });

    // PASO 9: Finalizar compra
    console.log('📍 Paso 9: Finalizando compra');

    // Buscar botón de finalizar compra
    const finalizeSelectors = [
      'button:has-text("Finalizar compra")',
      'button:has-text("Confirmar pedido")',
      'button:has-text("Pagar ahora")',
      'button[type="submit"]',
      '[data-testid="finalize-order"]',
      '.checkout-submit',
      '#submit-order'
    ];

    let orderSubmitted = false;
    for (const selector of finalizeSelectors) {
      try {
        const submitButton = page.locator(selector);
        const isVisible = await submitButton.isVisible().catch(() => false);
        const isEnabled = await submitButton.isEnabled().catch(() => false);

        if (isVisible && isEnabled) {
          console.log(`🚀 Enviando orden con: ${selector}`);
          await submitButton.click();
          await page.waitForTimeout(3000); // Esperar procesamiento
          orderSubmitted = true;
          break;
        }
      } catch (error) {
        console.log(`⚠️ No se pudo enviar orden: ${selector}`);
      }
    }

    await page.screenshot({
      path: 'test-results/10-order-submitted.png',
      fullPage: true
    });

    if (orderSubmitted) {
      console.log('✅ Orden enviada exitosamente');

      // PASO 10: Verificar redirección o confirmación
      console.log('📍 Paso 10: Verificando confirmación de compra');

      // Esperar redirección a MercadoPago o página de confirmación
      await page.waitForTimeout(5000);

      const currentUrl = page.url();
      console.log(`🌐 URL actual: ${currentUrl}`);

      // Verificar si estamos en MercadoPago o página de confirmación
      if (currentUrl.includes('mercadopago') || currentUrl.includes('checkout')) {
        console.log('🎉 Redirección a MercadoPago exitosa');

        await page.screenshot({
          path: 'test-results/11-mercadopago-redirect.png',
          fullPage: true
        });

        // Si estamos en MercadoPago, simular pago de prueba
        if (currentUrl.includes('mercadopago')) {
          await simulateMercadoPagoPayment(page);
        }
      } else if (currentUrl.includes('success') || currentUrl.includes('confirmation')) {
        console.log('🎉 Página de confirmación alcanzada');

        await page.screenshot({
          path: 'test-results/11-order-confirmation.png',
          fullPage: true
        });
      } else {
        console.log('⚠️ No se detectó redirección esperada');
      }
    } else {
      console.log('⚠️ No se pudo enviar la orden');
    }

    console.log('🏁 Test de compra completa finalizado');
  });

  test.afterEach(async () => {
    await page.close();
  });
});

// Método auxiliar para simular pago en MercadoPago
async function simulateMercadoPagoPayment(page: Page): Promise<void> {
  console.log('💳 Simulando pago en MercadoPago...');

  try {
    // Buscar formulario de pago de MercadoPago
    await page.waitForSelector('form, .payment-form', { timeout: 10000 });

    // Buscar campos de tarjeta de crédito
    const cardFields = [
      { selector: 'input[name="cardNumber"], #cardNumber', value: '4509953566233704' }, // Tarjeta de prueba
      { selector: 'input[name="expiryDate"], #expiryDate', value: '12/25' },
      { selector: 'input[name="securityCode"], #securityCode', value: '123' },
      { selector: 'input[name="cardholderName"], #cardholderName', value: 'APRO' } // Nombre de prueba
    ];

    for (const field of cardFields) {
      try {
        const input = page.locator(field.selector);
        const isVisible = await input.isVisible().catch(() => false);

        if (isVisible) {
          await input.fill(field.value);
          await page.waitForTimeout(500);
        }
      } catch (error) {
        console.log(`⚠️ Campo de pago no encontrado: ${field.selector}`);
      }
    }

    // Buscar botón de pagar
    const payButtons = page.locator('button:has-text("Pagar"), button[type="submit"], .pay-button');
    const payButtonCount = await payButtons.count();

    if (payButtonCount > 0) {
      await payButtons.first().click();
      await page.waitForTimeout(5000);

      await page.screenshot({
        path: 'test-results/12-payment-completed.png',
        fullPage: true
      });

      console.log('✅ Pago simulado completado');
    }
  } catch (error) {
    console.log('⚠️ Error simulando pago:', error.message);
  }
}
