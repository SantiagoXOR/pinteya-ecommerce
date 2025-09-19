#!/usr/bin/env node

// ===================================
// SCRIPT PARA PRUEBA MANUAL DE MERCADOPAGO
// ===================================

const { chromium } = require('playwright');

const CONFIG = {
  baseUrl: 'http://localhost:3000',
  timeout: 30000
};

async function manualTestMercadoPago() {
  console.log('🔍 Abriendo navegador para prueba manual de MercadoPago...');
  console.log(`🌐 URL base: ${CONFIG.baseUrl}`);
  console.log('\n📋 INSTRUCCIONES:');
  console.log('1. ✅ Agregar producto al carrito desde /shop');
  console.log('2. ✅ Ir a /checkout');
  console.log('3. ✅ Llenar formulario Express:');
  console.log('   - Email: test@example.com');
  console.log('   - Teléfono: +54 11 1234-5678');
  console.log('   - Dirección: Av. Test 1234, Buenos Aires, Argentina');
  console.log('4. ✅ Hacer click en "Finalizar Compra"');
  console.log('5. ✅ Verificar si aparece MercadoPago Wallet');
  console.log('\n⏰ El navegador se mantendrá abierto por 5 minutos...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  page.setDefaultTimeout(CONFIG.timeout);
  
  // Interceptar requests importantes
  page.on('request', request => {
    if (request.url().includes('mercadopago') || request.url().includes('payments')) {
      console.log(`📡 REQUEST: ${request.method()} ${request.url()}`);
    }
  });
  
  page.on('response', async response => {
    if (response.url().includes('mercadopago') || response.url().includes('payments')) {
      console.log(`📡 RESPONSE: ${response.status()} ${response.url()}`);
      if (response.url().includes('/api/payments/create-preference')) {
        try {
          const data = await response.json();
          console.log('💳 Preferencia creada:', {
            success: data.success,
            preference_id: data.data?.preference_id,
            init_point: data.data?.init_point ? 'Presente' : 'Ausente'
          });
        } catch (e) {
          console.log('⚠️ No se pudo parsear respuesta de preferencia');
        }
      }
    }
  });
  
  // Interceptar errores
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`❌ CONSOLE ERROR: ${msg.text()}`);
    } else if (msg.text().includes('MercadoPago') || msg.text().includes('wallet') || msg.text().includes('checkout')) {
      console.log(`🔍 CONSOLE: ${msg.text()}`);
    }
  });
  
  page.on('pageerror', error => {
    console.log(`❌ PAGE ERROR: ${error.message}`);
  });
  
  try {
    // Ir a la página de shop
    console.log('\n🛍️ Navegando a /shop...');
    await page.goto(`${CONFIG.baseUrl}/shop`);
    await page.waitForLoadState('networkidle');
    
    // Agregar producto automáticamente
    try {
      await page.click('button:has-text("Agregar al carrito")');
      console.log('✅ Producto agregado automáticamente');
      await page.waitForTimeout(1000);
    } catch (e) {
      console.log('⚠️ No se pudo agregar producto automáticamente');
    }
    
    // Ir al checkout
    console.log('\n💳 Navegando a /checkout...');
    await page.goto(`${CONFIG.baseUrl}/checkout`);
    await page.waitForLoadState('networkidle');
    
    console.log('\n🎯 CHECKOUT CARGADO - Ahora puedes probar manualmente:');
    console.log('   1. Verificar que está en modo Express');
    console.log('   2. Llenar los 3 campos requeridos');
    console.log('   3. Hacer click en "Finalizar Compra"');
    console.log('   4. Verificar si aparece el Wallet de MercadoPago');
    
    // Mantener abierto por 5 minutos
    console.log('\n⏰ Manteniendo navegador abierto por 5 minutos...');
    await page.waitForTimeout(300000); // 5 minutos
    
  } catch (error) {
    console.error('❌ Error en la prueba manual:', error.message);
  } finally {
    console.log('\n🏁 Cerrando navegador...');
    await browser.close();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  manualTestMercadoPago()
    .then(() => {
      console.log('\n✅ Prueba manual completada');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Error en la prueba manual:', error);
      process.exit(1);
    });
}

module.exports = { manualTestMercadoPago };
