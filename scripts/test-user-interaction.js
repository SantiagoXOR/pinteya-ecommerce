#!/usr/bin/env node

// ===================================
// SCRIPT PARA SIMULAR INTERACCIÓN REAL DEL USUARIO
// ===================================

const { chromium } = require('playwright');

const CONFIG = {
  baseUrl: 'http://localhost:3000',
  timeout: 30000
};

async function testUserInteraction() {
  console.log('👤 Simulando interacción real del usuario...');
  console.log(`🌐 URL base: ${CONFIG.baseUrl}`);
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 // Más lento para simular usuario real
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  page.setDefaultTimeout(CONFIG.timeout);
  
  // Interceptar requests importantes
  page.on('request', request => {
    if (request.url().includes('payments')) {
      console.log(`📡 REQUEST: ${request.method()} ${request.url()}`);
    }
  });
  
  page.on('response', async response => {
    if (response.url().includes('payments')) {
      console.log(`📡 RESPONSE: ${response.status()} ${response.url()}`);
      if (response.url().includes('/api/payments/create-preference')) {
        try {
          const data = await response.json();
          console.log('💳 Preferencia creada exitosamente:', {
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
    }
  });
  
  try {
    // ===================================
    // PASO 1: AGREGAR PRODUCTO Y IR AL CHECKOUT
    // ===================================
    console.log('\n📦 PASO 1: Agregando producto y navegando al checkout...');
    await page.goto(`${CONFIG.baseUrl}/shop`);
    await page.waitForLoadState('networkidle');
    
    try {
      await page.click('button:has-text("Agregar al carrito")');
      console.log('  ✅ Producto agregado');
      await page.waitForTimeout(1000);
    } catch (e) {
      console.log('  ⚠️ No se pudo agregar producto automáticamente');
    }
    
    await page.goto(`${CONFIG.baseUrl}/checkout`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // ===================================
    // PASO 2: LLENAR CAMPOS COMO USUARIO REAL
    // ===================================
    console.log('\n📝 PASO 2: Llenando campos como usuario real...');
    
    // Email
    console.log('  📧 Llenando email...');
    const emailInput = await page.locator('input[type="email"]');
    await emailInput.click();
    await emailInput.clear();
    await emailInput.type('test@example.com', { delay: 50 });
    await page.waitForTimeout(500);
    
    // Teléfono
    console.log('  📞 Llenando teléfono...');
    const phoneInput = await page.locator('input[type="tel"]');
    await phoneInput.click();
    await phoneInput.clear();
    await phoneInput.type('+54 351 123 4567', { delay: 50 });
    await page.waitForTimeout(500);
    
    // Dirección
    console.log('  📍 Llenando dirección...');
    const addressInput = await page.locator('input[id="streetAddress"]');
    await addressInput.click();
    await addressInput.clear();
    await addressInput.type('Av. Test 1234, Córdoba, Argentina', { delay: 50 });
    await page.waitForTimeout(500);
    
    // Hacer click fuera para disparar blur
    await page.click('body');
    await page.waitForTimeout(1000);
    
    // ===================================
    // PASO 3: VERIFICAR ESTADO DEL FORMULARIO
    // ===================================
    console.log('\n🔍 PASO 3: Verificando estado del formulario...');
    
    // Verificar valores en los inputs
    const emailValue = await emailInput.inputValue();
    const phoneValue = await phoneInput.inputValue();
    const addressValue = await addressInput.inputValue();
    
    console.log(`  📧 Email value: "${emailValue}"`);
    console.log(`  📞 Phone value: "${phoneValue}"`);
    console.log(`  📍 Address value: "${addressValue}"`);
    
    // Verificar si hay errores de validación
    const validationErrors = await page.locator('.text-red-500, .text-red-600, .text-red-700').count();
    console.log(`  ❌ Errores de validación: ${validationErrors}`);
    
    if (validationErrors > 0) {
      console.log('  📋 Listando errores de validación:');
      const errors = await page.locator('.text-red-500, .text-red-600, .text-red-700').all();
      for (let i = 0; i < Math.min(errors.length, 5); i++) {
        const errorText = await errors[i].textContent();
        console.log(`    - Error ${i + 1}: "${errorText?.trim()}"`);
      }
    }
    
    // ===================================
    // PASO 4: VERIFICAR ESTADO DEL BOTÓN
    // ===================================
    console.log('\n🔘 PASO 4: Verificando estado del botón...');
    
    const submitButton = await page.locator('button[type="submit"]');
    const isDisabled = await submitButton.isDisabled();
    const buttonText = await submitButton.textContent();
    
    console.log(`  🔘 Botón texto: "${buttonText?.trim()}"`);
    console.log(`  🔘 Botón habilitado: ${!isDisabled}`);
    
    // ===================================
    // PASO 5: INTENTAR SUBMIT
    // ===================================
    console.log('\n🚀 PASO 5: Intentando submit del formulario...');
    
    if (!isDisabled) {
      console.log('  🔄 Haciendo click en submit...');
      await submitButton.click();
      
      // Esperar respuesta
      await page.waitForTimeout(5000);
      
      // Verificar si apareció el wallet
      const walletContainer = await page.locator('#wallet_container').count();
      if (walletContainer > 0) {
        console.log('  ✅ ¡Wallet container apareció!');
        
        const walletContent = await page.locator('#wallet_container').innerHTML();
        if (walletContent.includes('iframe')) {
          console.log('  🎉 ¡MercadoPago Wallet cargado exitosamente!');
        } else {
          console.log(`  ⚠️ Wallet container presente pero sin iframe: ${walletContent.length} chars`);
        }
      } else {
        console.log('  ❌ Wallet container no apareció');
        
        // Verificar errores después del submit
        const errorsAfterSubmit = await page.locator('.text-red-500, .text-red-600, .text-red-700').count();
        console.log(`  ❌ Errores después del submit: ${errorsAfterSubmit}`);
        
        if (errorsAfterSubmit > 0) {
          console.log('  📋 Errores después del submit:');
          const errors = await page.locator('.text-red-500, .text-red-600, .text-red-700').all();
          for (let i = 0; i < Math.min(errors.length, 5); i++) {
            const errorText = await errors[i].textContent();
            console.log(`    - Error ${i + 1}: "${errorText?.trim()}"`);
          }
        }
      }
    } else {
      console.log('  ❌ Botón de submit está deshabilitado');
    }
    
    // ===================================
    // PASO 6: ESTADO FINAL
    // ===================================
    console.log('\n📊 PASO 6: Estado final...');
    
    const finalUrl = page.url();
    console.log(`  🌐 URL final: ${finalUrl}`);
    
    if (finalUrl.includes('mercadopago.com')) {
      console.log('  🎉 ¡ÉXITO! Redirigido a MercadoPago');
    } else if (finalUrl === `${CONFIG.baseUrl}/checkout`) {
      console.log('  ⚠️ Aún en checkout - verificar validación');
    } else {
      console.log(`  🔄 En otra página: ${finalUrl}`);
    }
    
    console.log('\n⏳ Manteniendo navegador abierto 15 segundos para inspección manual...');
    await page.waitForTimeout(15000);
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
  } finally {
    await browser.close();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testUserInteraction()
    .then(() => {
      console.log('\n✅ Prueba de interacción de usuario completada');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Error en la prueba:', error);
      process.exit(1);
    });
}

module.exports = { testUserInteraction };
