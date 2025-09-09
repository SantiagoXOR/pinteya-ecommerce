#!/usr/bin/env node

// ===================================
// SCRIPT PARA DIAGNOSTICAR MERCADOPAGO
// ===================================

const { chromium } = require('playwright');

const CONFIG = {
  baseUrl: 'http://localhost:3000',
  timeout: 30000,
  waitTime: 2000
};

async function debugMercadoPago() {
  console.log('🔍 Iniciando diagnóstico de MercadoPago...');
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
  
  // Interceptar requests y responses
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
          console.log('💳 Preferencia Response:', JSON.stringify(data, null, 2));
        } catch (e) {
          console.log('⚠️ No se pudo parsear respuesta de preferencia');
        }
      }
    }
  });
  
  // Interceptar errores de consola
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`❌ CONSOLE ERROR: ${msg.text()}`);
    } else if (msg.type() === 'warn') {
      console.log(`⚠️ CONSOLE WARN: ${msg.text()}`);
    } else if (msg.text().includes('MercadoPago') || msg.text().includes('wallet') || msg.text().includes('checkout') || msg.text().includes('validation')) {
      console.log(`🔍 CONSOLE: ${msg.text()}`);
    }
  });

  // Interceptar errores de página
  page.on('pageerror', error => {
    console.log(`❌ PAGE ERROR: ${error.message}`);
  });
  
  try {
    // ===================================
    // PASO 1: VERIFICAR VARIABLES DE ENTORNO
    // ===================================
    console.log('\n🔧 PASO 1: Verificando configuración...');
    
    await page.goto(`${CONFIG.baseUrl}/api/health`);
    const healthResponse = await page.textContent('body');
    console.log('  📊 Health check:', healthResponse);
    
    // ===================================
    // PASO 2: AGREGAR PRODUCTO AL CARRITO
    // ===================================
    console.log('\n📦 PASO 2: Agregando producto al carrito...');
    await page.goto(`${CONFIG.baseUrl}/shop`);
    await page.waitForLoadState('networkidle');
    
    try {
      await page.click('button:has-text("Agregar al carrito")');
      console.log('  ✅ Producto agregado al carrito');
      await page.waitForTimeout(1000);
    } catch (e) {
      console.log('  ⚠️ No se pudo agregar producto, continuando...');
    }
    
    // ===================================
    // PASO 3: IR AL CHECKOUT
    // ===================================
    console.log('\n💳 PASO 3: Navegando al checkout...');
    await page.goto(`${CONFIG.baseUrl}/checkout`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(CONFIG.waitTime);
    
    // ===================================
    // PASO 4: VERIFICAR ELEMENTOS DEL CHECKOUT
    // ===================================
    console.log('\n🔍 PASO 4: Verificando elementos del checkout...');
    
    // Verificar formulario
    const emailInput = await page.$('input[type="email"]');
    const phoneInput = await page.$('input[type="tel"]');
    console.log(`  📧 Email input: ${emailInput ? '✅ Presente' : '❌ Ausente'}`);
    console.log(`  📞 Phone input: ${phoneInput ? '✅ Presente' : '❌ Ausente'}`);
    
    // Verificar wallet container
    const walletContainer = await page.$('#wallet_container');
    console.log(`  🏦 Wallet container: ${walletContainer ? '✅ Presente' : '❌ Ausente'}`);
    
    if (walletContainer) {
      const walletContent = await walletContainer.innerHTML();
      console.log(`  📄 Wallet content length: ${walletContent.length} chars`);
      if (walletContent.length < 50) {
        console.log(`  📄 Wallet content: "${walletContent}"`);
      }
    }
    
    // Verificar scripts de MercadoPago
    const mpScripts = await page.$$eval('script', scripts => 
      scripts.filter(script => 
        script.src && script.src.includes('mercadopago')
      ).map(script => script.src)
    );
    console.log(`  📜 Scripts de MercadoPago: ${mpScripts.length}`);
    mpScripts.forEach(src => console.log(`    - ${src}`));
    
    // ===================================
    // PASO 5: ACTIVAR MODO EXPRESS Y LLENAR FORMULARIO
    // ===================================
    console.log('\n📝 PASO 5: Activando modo Express y llenando formulario...');

    // Activar modo Express
    try {
      const expressButton = await page.$('button:has-text("Modo Express")');
      if (expressButton) {
        await expressButton.click();
        console.log('  ✅ Modo Express activado');
        await page.waitForTimeout(1000);
      } else {
        console.log('  ⚠️ Botón de modo Express no encontrado');
      }
    } catch (e) {
      console.log(`  ❌ Error activando modo Express: ${e.message}`);
    }

    // Campos requeridos para modo Express (solo 3)
    const expressFields = [
      { selector: 'input[type="email"]', value: 'test@example.com', name: 'Email' },
      { selector: 'input[type="tel"]', value: '+54 11 1234-5678', name: 'Teléfono' },
      { selector: 'input[type="text"]', value: 'Av. Test 1234, Buenos Aires, Argentina', name: 'Dirección completa' }
    ];

    for (const field of expressFields) {
      try {
        const element = await page.$(field.selector);
        if (element) {
          // ✅ CORREGIDO: Usar click + type para disparar eventos onChange
          await element.click();
          await element.fill(''); // Limpiar primero
          await element.type(field.value); // Escribir caracter por caracter
          console.log(`  ✅ ${field.name} llenado con eventos`);
        } else {
          console.log(`  ⚠️ ${field.name} no encontrado (${field.selector})`);
        }
      } catch (e) {
        console.log(`  ❌ Error llenando ${field.name}: ${e.message}`);
      }
    }

    await page.waitForTimeout(2000);
    
    // ===================================
    // PASO 6: VERIFICAR CREACIÓN DE PREFERENCIA
    // ===================================
    console.log('\n🔄 PASO 6: Intentando crear preferencia...');
    
    // Buscar botón de submit/finalizar
    const submitSelectors = [
      'button[type="submit"]',
      'button:has-text("Finalizar")',
      'button:has-text("Procesar")',
      'button:has-text("Continuar")'
    ];
    
    let submitButton = null;
    for (const selector of submitSelectors) {
      try {
        submitButton = await page.$(selector);
        if (submitButton) {
          console.log(`  ✅ Botón encontrado: ${selector}`);
          break;
        }
      } catch (e) {}
    }
    
    if (submitButton) {
      try {
        // Scroll al botón
        await submitButton.scrollIntoViewIfNeeded();
        await page.waitForTimeout(1000);
        
        console.log('  🔄 Haciendo click en submit...');
        await submitButton.click();

        // Esperar respuesta de la API y verificar cambios
        console.log('  ⏳ Esperando respuesta...');
        await page.waitForTimeout(3000);

        // Verificar si hay errores de validación
        const validationErrors = await page.$$('.error, .text-red-500, .text-red-600, .text-red-700');
        if (validationErrors.length > 0) {
          console.log(`  ❌ Errores de validación encontrados: ${validationErrors.length}`);
          for (let i = 0; i < Math.min(validationErrors.length, 3); i++) {
            const errorText = await validationErrors[i].textContent();
            console.log(`    - Error ${i + 1}: ${errorText?.trim()}`);
          }
        } else {
          console.log('  ✅ No hay errores de validación visibles');
        }

        // Verificar si cambió el step/URL
        const urlAfterSubmit = page.url();
        console.log(`  🌐 URL después de submit: ${urlAfterSubmit}`);

        await page.waitForTimeout(2000);
        
        // Verificar si se creó preferencia
        const walletAfterSubmit = await page.$('#wallet_container');
        if (walletAfterSubmit) {
          const contentAfter = await walletAfterSubmit.innerHTML();
          console.log(`  📄 Wallet después de submit: ${contentAfter.length} chars`);
          
          // Verificar si hay iframe de MercadoPago
          const iframe = await page.$('#wallet_container iframe');
          console.log(`  🖼️ Iframe de MercadoPago: ${iframe ? '✅ Presente' : '❌ Ausente'}`);
          
          if (iframe) {
            const iframeSrc = await iframe.getAttribute('src');
            console.log(`  🔗 Iframe src: ${iframeSrc}`);
          }
        }
        
      } catch (e) {
        console.log(`  ❌ Error en submit: ${e.message}`);
      }
    } else {
      console.log('  ❌ No se encontró botón de submit');
    }
    
    // ===================================
    // PASO 7: VERIFICAR ESTADO FINAL
    // ===================================
    console.log('\n📊 PASO 7: Estado final...');
    
    const finalUrl = page.url();
    console.log(`  🌐 URL final: ${finalUrl}`);
    
    // Verificar errores en la página
    const errorElements = await page.$$('.error, .alert-error, [class*="error"]');
    console.log(`  ❌ Elementos de error: ${errorElements.length}`);
    
    for (let i = 0; i < Math.min(errorElements.length, 3); i++) {
      const errorText = await errorElements[i].textContent();
      console.log(`    - Error ${i + 1}: ${errorText?.trim()}`);
    }
    
    // Verificar estado del wallet
    const finalWallet = await page.$('#wallet_container');
    if (finalWallet) {
      const finalContent = await finalWallet.innerHTML();
      console.log(`  🏦 Estado final del wallet: ${finalContent.length} chars`);
      
      if (finalContent.includes('iframe')) {
        console.log('  ✅ Wallet contiene iframe - MercadoPago cargado');
      } else if (finalContent.includes('error')) {
        console.log('  ❌ Wallet contiene error');
      } else if (finalContent.length < 100) {
        console.log(`  ⚠️ Wallet con poco contenido: "${finalContent}"`);
      }
    }
    
    console.log('\n⏳ Esperando 10 segundos para inspección manual...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error.message);
  } finally {
    await browser.close();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  debugMercadoPago()
    .then(() => {
      console.log('\n✅ Diagnóstico de MercadoPago completado');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Error en diagnóstico:', error);
      process.exit(1);
    });
}

module.exports = { debugMercadoPago };
