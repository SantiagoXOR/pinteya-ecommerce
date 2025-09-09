#!/usr/bin/env node

// ===================================
// SCRIPT PARA PROBAR EVENTOS REACT DIRECTAMENTE
// ===================================

const { chromium } = require('playwright');

const CONFIG = {
  baseUrl: 'http://localhost:3000',
  timeout: 30000
};

async function testReactDirect() {
  console.log('⚛️ Probando eventos React directamente...');
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
  
  // Interceptar logs de consola
  page.on('console', msg => {
    if (msg.type() === 'log' && msg.text().includes('🔄')) {
      console.log(`📝 REACT LOG: ${msg.text()}`);
    } else if (msg.type() === 'error') {
      console.log(`❌ CONSOLE ERROR: ${msg.text()}`);
    }
  });
  
  try {
    // ===================================
    // PASO 1: IR AL CHECKOUT
    // ===================================
    console.log('\n📦 PASO 1: Navegando al checkout...');
    await page.goto(`${CONFIG.baseUrl}/checkout`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // ===================================
    // PASO 2: PROBAR EVENTOS REACT DIRECTOS
    // ===================================
    console.log('\n⚛️ PASO 2: Probando eventos React directos...');
    
    // Función para disparar eventos React usando el objeto React real
    const triggerReactChange = async (selector, value) => {
      return await page.evaluate(({ selector, value }) => {
        const input = document.querySelector(selector);
        if (!input) return { success: false, error: 'Input not found' };
        
        try {
          // Obtener la instancia de React del input
          const reactKey = Object.keys(input).find(key => key.startsWith('__reactInternalInstance') || key.startsWith('__reactFiber'));
          
          if (!reactKey) {
            return { success: false, error: 'React instance not found' };
          }
          
          // Enfocar el input
          input.focus();
          
          // Cambiar el valor usando el setter nativo
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          nativeInputValueSetter.call(input, value);
          
          // Crear evento sintético de React
          const event = new Event('input', { bubbles: true });
          Object.defineProperty(event, 'target', { writable: false, value: input });
          Object.defineProperty(event, 'currentTarget', { writable: false, value: input });
          
          // Disparar el evento
          input.dispatchEvent(event);
          
          // También disparar change
          const changeEvent = new Event('change', { bubbles: true });
          Object.defineProperty(changeEvent, 'target', { writable: false, value: input });
          Object.defineProperty(changeEvent, 'currentTarget', { writable: false, value: input });
          
          input.dispatchEvent(changeEvent);
          
          // Desenfocar
          input.blur();
          
          return { success: true, value: input.value };
        } catch (error) {
          return { success: false, error: error.message };
        }
      }, { selector, value });
    };
    
    // Probar cada campo
    const fields = [
      { selector: 'input[type="email"]', value: 'test@example.com', name: 'Email' },
      { selector: 'input[type="tel"]', value: '+54 351 123 4567', name: 'Teléfono' },
      { selector: 'input[id="streetAddress"]', value: 'Av. Test 1234, Córdoba, Argentina', name: 'Dirección' }
    ];
    
    for (const field of fields) {
      console.log(`  🔄 Probando ${field.name}...`);
      const result = await triggerReactChange(field.selector, field.value);
      
      if (result.success) {
        console.log(`    ✅ ${field.name}: ${result.value}`);
      } else {
        console.log(`    ❌ ${field.name}: ${result.error}`);
      }
      
      await page.waitForTimeout(1000);
    }
    
    // ===================================
    // PASO 3: VERIFICAR ESTADO
    // ===================================
    console.log('\n🔍 PASO 3: Verificando estado después de eventos React...');
    
    await page.waitForTimeout(2000);
    
    // Verificar valores en los inputs
    const emailValue = await page.inputValue('input[type="email"]');
    const phoneValue = await page.inputValue('input[type="tel"]');
    const addressValue = await page.inputValue('input[id="streetAddress"]');
    
    console.log(`  📧 Email value: "${emailValue}"`);
    console.log(`  📞 Phone value: "${phoneValue}"`);
    console.log(`  📍 Address value: "${addressValue}"`);
    
    // Verificar errores
    const validationErrors = await page.locator('.text-red-500, .text-red-600, .text-red-700').count();
    console.log(`  ❌ Errores de validación: ${validationErrors}`);
    
    if (validationErrors > 0) {
      console.log('  📋 Errores encontrados:');
      const errors = await page.locator('.text-red-500, .text-red-600, .text-red-700').all();
      for (let i = 0; i < Math.min(errors.length, 5); i++) {
        const errorText = await errors[i].textContent();
        console.log(`    - Error ${i + 1}: "${errorText?.trim()}"`);
      }
    }
    
    // ===================================
    // PASO 4: PROBAR SUBMIT
    // ===================================
    console.log('\n🚀 PASO 4: Probando submit...');
    
    const submitButton = await page.locator('button[type="submit"]');
    const isDisabled = await submitButton.isDisabled();
    
    console.log(`  🔘 Botón habilitado: ${!isDisabled}`);
    
    if (!isDisabled) {
      console.log('  🔄 Haciendo click en submit...');
      await submitButton.click();
      await page.waitForTimeout(5000);
      
      const walletContainer = await page.locator('#wallet_container').count();
      if (walletContainer > 0) {
        console.log('  🎉 ¡Wallet container apareció!');
      } else {
        console.log('  ❌ Wallet container no apareció');
        
        const errorsAfterSubmit = await page.locator('.text-red-500, .text-red-600, .text-red-700').count();
        console.log(`  ❌ Errores después del submit: ${errorsAfterSubmit}`);
      }
    }
    
    console.log('\n⏳ Manteniendo navegador abierto 10 segundos...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
  } finally {
    await browser.close();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testReactDirect()
    .then(() => {
      console.log('\n✅ Prueba React directa completada');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Error en la prueba:', error);
      process.exit(1);
    });
}

module.exports = { testReactDirect };
