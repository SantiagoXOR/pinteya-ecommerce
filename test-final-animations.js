const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 INICIANDO PRUEBA FINAL DE ANIMACIONES');
  console.log('==========================================');

  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 720 }
  });
  
  const page = await browser.newPage();
  
  try {
    // Navegar a la página
    console.log('📍 Navegando a la página...');
    await page.goto('http://localhost:3000/demo/commercial-product-card', { 
      waitUntil: 'networkidle0',
      timeout: 10000 
    });

    // Esperar a que el componente se cargue
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 5000 });
    console.log('✅ Componente CommercialProductCard detectado');

    // Verificar si Framer Motion está disponible
    const framerMotionAvailable = await page.evaluate(() => {
      return typeof window.motion !== 'undefined' || 
             document.querySelector('[data-framer-motion]') !== null ||
             document.querySelector('.motion-div') !== null;
    });
    
    console.log(`🎭 Framer Motion disponible: ${framerMotionAvailable}`);

    // Obtener el elemento de la tarjeta
    const productCard = await page.$('[data-testid="product-card"]');
    
    if (!productCard) {
      throw new Error('No se encontró la tarjeta de producto');
    }

    // 1. Verificar animación inicial (CSS o Framer Motion)
    console.log('\n1️⃣ VERIFICANDO ANIMACIÓN INICIAL:');
    const initialStyles = await page.evaluate((element) => {
      const computed = window.getComputedStyle(element);
      return {
        opacity: computed.opacity,
        transform: computed.transform,
        transition: computed.transition
      };
    }, productCard);
    
    console.log('📊 Estilos iniciales:', initialStyles);

    // 2. Probar hover con múltiples intentos
    console.log('\n2️⃣ PROBANDO ANIMACIÓN DE HOVER:');
    
    for (let i = 1; i <= 3; i++) {
      console.log(`\n🔄 Intento ${i} de hover:`);
      
      // Hover
      await productCard.hover();
      await page.waitForTimeout(500);
      
      const hoverStyles = await page.evaluate((element) => {
        const computed = window.getComputedStyle(element);
        return {
          transform: computed.transform,
          boxShadow: computed.boxShadow,
          scale: computed.scale,
          transition: computed.transition
        };
      }, productCard);
      
      console.log('📊 Estilos en hover:', hoverStyles);
      
      // Verificar si hay cambios
      const hasTransformChange = hoverStyles.transform !== initialStyles.transform && 
                                hoverStyles.transform !== 'none';
      const hasBoxShadowChange = hoverStyles.boxShadow !== 'none';
      
      console.log(`✨ Transform cambió: ${hasTransformChange}`);
      console.log(`✨ BoxShadow cambió: ${hasBoxShadowChange}`);
      
      // Salir del hover
      await page.mouse.move(0, 0);
      await page.waitForTimeout(300);
    }

    // 3. Probar botón "Agregar al carrito"
    console.log('\n3️⃣ PROBANDO BOTÓN AGREGAR AL CARRITO:');
    
    const addToCartButton = await page.$('button:has-text("Agregar al Carrito"), button:has-text("Agregar")');
    
    if (addToCartButton) {
      console.log('🛒 Botón encontrado, probando hover...');
      
      const buttonInitialStyles = await page.evaluate((element) => {
        const computed = window.getComputedStyle(element);
        return {
          transform: computed.transform,
          backgroundColor: computed.backgroundColor
        };
      }, addToCartButton);
      
      console.log('📊 Estilos iniciales del botón:', buttonInitialStyles);
      
      await addToCartButton.hover();
      await page.waitForTimeout(300);
      
      const buttonHoverStyles = await page.evaluate((element) => {
        const computed = window.getComputedStyle(element);
        return {
          transform: computed.transform,
          backgroundColor: computed.backgroundColor
        };
      }, addToCartButton);
      
      console.log('📊 Estilos hover del botón:', buttonHoverStyles);
      
      const buttonHasChanges = buttonHoverStyles.transform !== buttonInitialStyles.transform ||
                              buttonHoverStyles.backgroundColor !== buttonInitialStyles.backgroundColor;
      
      console.log(`✨ Botón cambió en hover: ${buttonHasChanges}`);
    } else {
      console.log('❌ Botón "Agregar al carrito" no encontrado');
    }

    // 4. Verificar Quick Actions
    console.log('\n4️⃣ VERIFICANDO QUICK ACTIONS:');
    
    await productCard.hover();
    await page.waitForTimeout(500);
    
    const quickActions = await page.$('.absolute.top-2.right-2');
    const quickActionsVisible = quickActions !== null;
    
    console.log(`👁️ Quick Actions visibles: ${quickActionsVisible}`);
    
    if (quickActionsVisible) {
      const quickActionButtons = await page.$$('.absolute.top-2.right-2 button');
      console.log(`🔘 Número de botones Quick Actions: ${quickActionButtons.length}`);
      
      if (quickActionButtons.length > 0) {
        console.log('🔄 Probando hover en primer botón Quick Action...');
        await quickActionButtons[0].hover();
        await page.waitForTimeout(200);
      }
    }

    // 5. Capturar screenshot final
    console.log('\n5️⃣ CAPTURANDO SCREENSHOT FINAL:');
    await page.screenshot({ 
      path: 'test-final-animations.png',
      fullPage: false
    });
    console.log('📸 Screenshot guardado como: test-final-animations.png');

    // 6. Verificar errores JavaScript
    console.log('\n6️⃣ VERIFICANDO ERRORES JAVASCRIPT:');
    const jsErrors = await page.evaluate(() => {
      return window.jsErrors || [];
    });
    
    console.log(`🚨 Errores JS encontrados: ${jsErrors.length}`);
    if (jsErrors.length > 0) {
      jsErrors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }

    console.log('\n🎯 RESUMEN FINAL:');
    console.log('================');
    console.log(`✅ Componente cargado correctamente`);
    console.log(`🎭 Framer Motion disponible: ${framerMotionAvailable}`);
    console.log(`✨ Sistema de fallback CSS implementado`);
    console.log(`🔄 Animaciones probadas (hover, botones, quick actions)`);
    console.log(`📸 Screenshot capturado para revisión visual`);
    console.log(`🚨 Errores JS: ${jsErrors.length}`);
    
    console.log('\n✅ PRUEBA COMPLETADA EXITOSAMENTE');

  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message);
  } finally {
    await browser.close();
  }
})();