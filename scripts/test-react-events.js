#!/usr/bin/env node

// ===================================
// SCRIPT PARA PROBAR EVENTOS DE REACT
// ===================================

const { chromium } = require('playwright');

const CONFIG = {
  baseUrl: 'http://localhost:3000',
  timeout: 30000
};

async function testReactEvents() {
  console.log('🧪 Probando eventos de React en el checkout...');
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
    // PASO 2: LLENAR CAMPOS CON EVENTOS DE REACT
    // ===================================
    console.log('\n📝 PASO 2: Llenando campos con eventos de React...');
    
    // Función para disparar eventos de React correctamente
    const fillReactInput = async (selector, value) => {
      return await page.evaluate(({ selector, value }) => {
        const input = document.querySelector(selector);
        if (!input) return false;

        // Enfocar el input primero
        input.focus();

        // Limpiar el valor actual
        input.value = '';

        // Simular eventos de React usando el descriptor nativo
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeInputValueSetter.call(input, value);

        // Crear eventos que React reconoce
        const inputEvent = new Event('input', {
          bubbles: true,
          cancelable: true,
          composed: true
        });

        const changeEvent = new Event('change', {
          bubbles: true,
          cancelable: true,
          composed: true
        });

        // Disparar los eventos en el orden correcto
        input.dispatchEvent(inputEvent);
        input.dispatchEvent(changeEvent);

        // También disparar eventos de teclado para mayor compatibilidad
        const keydownEvent = new KeyboardEvent('keydown', {
          bubbles: true,
          cancelable: true,
          key: 'Enter',
          code: 'Enter'
        });

        const keyupEvent = new KeyboardEvent('keyup', {
          bubbles: true,
          cancelable: true,
          key: 'Enter',
          code: 'Enter'
        });

        input.dispatchEvent(keydownEvent);
        input.dispatchEvent(keyupEvent);

        // Desenfocar para simular comportamiento real
        input.blur();

        return true;
      }, { selector, value });
    };
    
    // Llenar campos uno por uno
    const fields = [
      { selector: 'input[type="email"]', value: 'test@example.com', name: 'Email' },
      { selector: 'input[type="tel"]', value: '+54 351 123 4567', name: 'Teléfono' },
      { selector: 'input[id="streetAddress"]', value: 'Av. Test 1234, Córdoba, Argentina', name: 'Dirección' }
    ];
    
    for (const field of fields) {
      try {
        const filled = await fillReactInput(field.selector, field.value);
        if (filled) {
          console.log(`  ✅ ${field.name} llenado con eventos React`);
        } else {
          console.log(`  ❌ ${field.name} no encontrado (${field.selector})`);
        }
        await page.waitForTimeout(500);
      } catch (e) {
        console.log(`  ❌ Error llenando ${field.name}: ${e.message}`);
      }
    }
    
    // ===================================
    // PASO 3: VERIFICAR ESTADO DEL FORMULARIO
    // ===================================
    console.log('\n🔍 PASO 3: Verificando estado del formulario...');
    
    // Verificar valores en los inputs
    const emailValue = await page.inputValue('input[type="email"]');
    const phoneValue = await page.inputValue('input[type="tel"]');
    const addressValue = await page.inputValue('input[id="streetAddress"]');
    
    console.log(`  📧 Email value: "${emailValue}"`);
    console.log(`  📞 Phone value: "${phoneValue}"`);
    console.log(`  📍 Address value: "${addressValue}"`);
    
    // Verificar si hay errores de validación
    const validationErrors = await page.$$('.text-red-500, .text-red-600, .text-red-700');
    console.log(`  ❌ Errores de validación: ${validationErrors.length}`);
    
    // ===================================
    // PASO 4: INTENTAR SUBMIT
    // ===================================
    console.log('\n🚀 PASO 4: Intentando submit del formulario...');
    
    const submitButton = await page.$('button[type="submit"]');
    if (submitButton) {
      console.log('  ✅ Botón de submit encontrado');
      
      // Verificar si el botón está habilitado
      const isDisabled = await submitButton.isDisabled();
      console.log(`  🔘 Botón habilitado: ${!isDisabled}`);
      
      if (!isDisabled) {
        console.log('  🔄 Haciendo click en submit...');
        await submitButton.click();
        
        // Esperar respuesta
        await page.waitForTimeout(5000);
        
        // Verificar si apareció el wallet
        const walletContainer = await page.$('#wallet_container');
        if (walletContainer) {
          console.log('  ✅ ¡Wallet container apareció!');
          
          const walletContent = await walletContainer.innerHTML();
          if (walletContent.includes('iframe')) {
            console.log('  🎉 ¡MercadoPago Wallet cargado exitosamente!');
          } else {
            console.log(`  ⚠️ Wallet container presente pero sin iframe: ${walletContent.length} chars`);
          }
        } else {
          console.log('  ❌ Wallet container no apareció');
          
          // Verificar errores después del submit
          const errorsAfterSubmit = await page.$$('.text-red-500, .text-red-600, .text-red-700');
          console.log(`  ❌ Errores después del submit: ${errorsAfterSubmit.length}`);
          
          for (let i = 0; i < Math.min(errorsAfterSubmit.length, 3); i++) {
            const errorText = await errorsAfterSubmit[i].textContent();
            console.log(`    - Error ${i + 1}: "${errorText?.trim()}"`);
          }
        }
      } else {
        console.log('  ❌ Botón de submit está deshabilitado');
      }
    } else {
      console.log('  ❌ Botón de submit no encontrado');
    }
    
    // ===================================
    // PASO 5: ESTADO FINAL
    // ===================================
    console.log('\n📊 PASO 5: Estado final...');
    
    const finalUrl = page.url();
    console.log(`  🌐 URL final: ${finalUrl}`);
    
    if (finalUrl.includes('mercadopago.com')) {
      console.log('  🎉 ¡ÉXITO! Redirigido a MercadoPago');
    } else if (finalUrl === `${CONFIG.baseUrl}/checkout`) {
      console.log('  ⚠️ Aún en checkout - verificar validación');
    } else {
      console.log(`  🔄 En otra página: ${finalUrl}`);
    }
    
    console.log('\n⏳ Manteniendo navegador abierto 10 segundos para inspección...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
  } finally {
    await browser.close();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testReactEvents()
    .then(() => {
      console.log('\n✅ Prueba de eventos React completada');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Error en la prueba:', error);
      process.exit(1);
    });
}

module.exports = { testReactEvents };
