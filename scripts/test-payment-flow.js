#!/usr/bin/env node

// ===================================
// SCRIPT PARA PROBAR EL FLUJO COMPLETO DE PAGO
// ===================================

const { chromium } = require('playwright');

const CONFIG = {
  baseUrl: 'http://localhost:3000',
  timeout: 30000,
  waitTime: 2000
};

async function testPaymentFlow() {
  console.log('🧪 Iniciando prueba del flujo completo de pago...');
  console.log(`🌐 URL base: ${CONFIG.baseUrl}`);
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  page.setDefaultTimeout(CONFIG.timeout);
  
  try {
    // ===================================
    // PASO 1: AGREGAR PRODUCTO AL CARRITO
    // ===================================
    console.log('\n📦 PASO 1: Agregando producto al carrito...');
    await page.goto(`${CONFIG.baseUrl}/shop`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(CONFIG.waitTime);
    
    // Buscar y hacer click en "Agregar al carrito"
    const addToCartSelectors = [
      'button:has-text("Agregar al carrito")',
      'button:has-text("Add to Cart")',
      '.add-to-cart',
      '.product-card button'
    ];
    
    let productAdded = false;
    for (const selector of addToCartSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          await element.click();
          productAdded = true;
          console.log(`  ✅ Producto agregado con: ${selector}`);
          break;
        }
      } catch (e) {}
    }
    
    if (!productAdded) {
      console.log('  ⚠️ No se pudo agregar producto, continuando...');
    }
    
    await page.waitForTimeout(1000);
    
    // ===================================
    // PASO 2: IR AL CHECKOUT
    // ===================================
    console.log('\n💳 PASO 2: Navegando al checkout...');
    await page.goto(`${CONFIG.baseUrl}/checkout`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(CONFIG.waitTime);
    
    // ===================================
    // PASO 3: LLENAR FORMULARIO
    // ===================================
    console.log('\n📝 PASO 3: Llenando formulario de checkout...');
    
    const formFields = [
      { selectors: ['input[type="email"]'], value: 'test@example.com' },
      { selectors: ['input[type="tel"]'], value: '+54 11 1234-5678' },
      { selectors: ['input[name="address"]', 'input[name="street"]'], value: 'Av. Test 1234' },
      { selectors: ['input[name="city"]'], value: 'Buenos Aires' },
      { selectors: ['input[name="zipCode"]'], value: '1043' }
    ];
    
    for (const field of formFields) {
      for (const selector of field.selectors) {
        try {
          const element = await page.$(selector);
          if (element) {
            await element.fill(field.value);
            console.log(`  ✅ Campo llenado: ${selector}`);
            break;
          }
        } catch (e) {}
      }
    }
    
    await page.waitForTimeout(1000);
    
    // ===================================
    // PASO 4: VERIFICAR WALLET BRICK
    // ===================================
    console.log('\n🏦 PASO 4: Verificando MercadoPago Wallet...');
    
    // Esperar a que aparezca el Wallet Brick
    try {
      await page.waitForSelector('#wallet_container', { timeout: 10000 });
      console.log('  ✅ Wallet container encontrado');
      
      // Verificar si hay contenido en el wallet
      const walletContent = await page.$('#wallet_container iframe, #wallet_container .mp-wallet');
      if (walletContent) {
        console.log('  ✅ Wallet Brick cargado correctamente');
      } else {
        console.log('  ⚠️ Wallet container vacío');
      }
      
    } catch (e) {
      console.log('  ❌ Wallet container no encontrado');
    }
    
    // ===================================
    // PASO 5: VERIFICAR PREFERENCIA DE PAGO
    // ===================================
    console.log('\n🔍 PASO 5: Verificando creación de preferencia...');
    
    // Interceptar requests a la API
    page.on('response', async (response) => {
      if (response.url().includes('/api/payments/create-preference')) {
        console.log(`  📡 API Response: ${response.status()}`);
        if (response.status() === 200) {
          try {
            const data = await response.json();
            console.log('  ✅ Preferencia creada:', {
              success: data.success,
              preference_id: data.data?.preference_id,
              init_point: data.data?.init_point ? 'Presente' : 'Ausente'
            });
          } catch (e) {
            console.log('  ⚠️ No se pudo parsear respuesta');
          }
        } else {
          console.log('  ❌ Error en API:', response.status());
        }
      }
    });
    
    // ===================================
    // PASO 6: INTENTAR PROCESAR PAGO
    // ===================================
    console.log('\n💰 PASO 6: Intentando procesar pago...');
    
    // Buscar botón de pago
    const paymentSelectors = [
      'button:has-text("Pagar")',
      'button:has-text("Finalizar")',
      'button:has-text("Proceder")',
      '.mp-button',
      '#wallet_container button'
    ];
    
    let paymentButtonFound = false;
    for (const selector of paymentSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          console.log(`  ✅ Botón de pago encontrado: ${selector}`);
          paymentButtonFound = true;
          
          // Intentar hacer click
          try {
            await element.click();
            console.log('  ✅ Click en botón de pago exitoso');
            await page.waitForTimeout(3000);
            
            // Verificar si hay redirección
            const currentUrl = page.url();
            if (currentUrl.includes('mercadopago.com')) {
              console.log('  ✅ Redirección a MercadoPago exitosa');
              console.log(`  🌐 URL actual: ${currentUrl}`);
            } else if (currentUrl !== `${CONFIG.baseUrl}/checkout`) {
              console.log(`  ✅ Redirección detectada: ${currentUrl}`);
            } else {
              console.log('  ⚠️ No se detectó redirección');
            }
            
          } catch (e) {
            console.log(`  ❌ Error haciendo click: ${e.message}`);
          }
          break;
        }
      } catch (e) {}
    }
    
    if (!paymentButtonFound) {
      console.log('  ❌ No se encontró botón de pago');
    }
    
    // ===================================
    // PASO 7: VERIFICAR ESTADO FINAL
    // ===================================
    console.log('\n📊 PASO 7: Estado final del flujo...');
    
    const finalUrl = page.url();
    console.log(`  🌐 URL final: ${finalUrl}`);
    
    if (finalUrl.includes('mercadopago.com')) {
      console.log('  ✅ ÉXITO: Usuario redirigido a MercadoPago');
      console.log('  💳 El flujo de pago está funcionando correctamente');
    } else if (finalUrl.includes('/checkout/success')) {
      console.log('  ✅ ÉXITO: Pago completado exitosamente');
    } else if (finalUrl.includes('/checkout/failure')) {
      console.log('  ❌ FALLO: Pago rechazado');
    } else if (finalUrl.includes('/checkout/pending')) {
      console.log('  ⏳ PENDIENTE: Pago en procesamiento');
    } else {
      console.log('  ⚠️ ESTADO DESCONOCIDO: Verificar configuración');
    }
    
    // Esperar un poco más para ver el resultado
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('❌ Error en el flujo de pago:', error.message);
  } finally {
    console.log('\n🏁 Prueba completada. Cerrando navegador en 10 segundos...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testPaymentFlow()
    .then(() => {
      console.log('\n✅ Prueba del flujo de pago completada');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Error en la prueba:', error);
      process.exit(1);
    });
}

module.exports = { testPaymentFlow };
