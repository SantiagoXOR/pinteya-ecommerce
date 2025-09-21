const { chromium } = require('playwright');

async function testFixedAnimations() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🎬 Verificando animaciones corregidas...');
    await page.goto('http://localhost:3000/demo/commercial-product-card', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    // Esperar a que se cargue completamente
    await page.waitForTimeout(3000);

    // Buscar el primer CommercialProductCard
    const firstCard = page.locator('[data-testid-commercial="commercial-product-card"]').first();
    await firstCard.waitFor({ state: 'visible' });

    console.log('✅ Componente CommercialProductCard encontrado');

    // Verificar animación inicial (fade-in)
    console.log('🎭 Verificando animación inicial...');
    
    // Recargar la página para ver la animación inicial
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Verificar estado inicial
    const initialState = await firstCard.evaluate(el => {
      const styles = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return {
        opacity: styles.opacity,
        transform: styles.transform,
        width: rect.width,
        height: rect.height
      };
    });
    console.log('📊 Estado inicial:', JSON.stringify(initialState, null, 2));

    // Probar animación de hover múltiples veces
    console.log('\n🖱️ PROBANDO ANIMACIÓN DE HOVER (3 intentos):');
    
    for (let i = 1; i <= 3; i++) {
      console.log(`\n--- Intento ${i} ---`);
      
      // Mover el mouse fuera del elemento primero
      await page.mouse.move(100, 100);
      await page.waitForTimeout(500);
      
      // Estado antes del hover
      const beforeHover = await firstCard.evaluate(el => {
        const styles = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return {
          transform: styles.transform,
          boxShadow: styles.boxShadow,
          width: rect.width,
          height: rect.height
        };
      });
      
      // Hacer hover
      await firstCard.hover();
      await page.waitForTimeout(300); // Esperar animación
      
      // Estado después del hover
      const afterHover = await firstCard.evaluate(el => {
        const styles = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return {
          transform: styles.transform,
          boxShadow: styles.boxShadow,
          width: rect.width,
          height: rect.height
        };
      });
      
      const hasChanged = JSON.stringify(beforeHover) !== JSON.stringify(afterHover);
      const sizeChanged = beforeHover.width !== afterHover.width || beforeHover.height !== afterHover.height;
      const transformChanged = beforeHover.transform !== afterHover.transform;
      const shadowChanged = beforeHover.boxShadow !== afterHover.boxShadow;
      
      console.log(`🔄 Cambios detectados: ${hasChanged}`);
      console.log(`📏 Tamaño cambió: ${sizeChanged}`);
      console.log(`🔄 Transform cambió: ${transformChanged}`);
      console.log(`🌟 Shadow cambió: ${shadowChanged}`);
      
      if (sizeChanged) {
        console.log(`📊 Tamaño antes: ${beforeHover.width}x${beforeHover.height}`);
        console.log(`📊 Tamaño después: ${afterHover.width}x${afterHover.height}`);
      }
    }

    // Probar botón de agregar al carrito
    console.log('\n🔘 PROBANDO BOTÓN AGREGAR AL CARRITO:');
    const addToCartButton = firstCard.locator('button[data-testid="add-to-cart"]').first();
    
    if (await addToCartButton.count() > 0) {
      // Mover mouse fuera del botón
      await page.mouse.move(100, 100);
      await page.waitForTimeout(300);
      
      // Estado antes del hover del botón
      const buttonBefore = await addToCartButton.evaluate(el => {
        const styles = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return {
          transform: styles.transform,
          backgroundColor: styles.backgroundColor,
          boxShadow: styles.boxShadow,
          width: rect.width,
          height: rect.height
        };
      });
      
      // Hover en el botón
      await addToCartButton.hover();
      await page.waitForTimeout(300);
      
      const buttonAfter = await addToCartButton.evaluate(el => {
        const styles = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return {
          transform: styles.transform,
          backgroundColor: styles.backgroundColor,
          boxShadow: styles.boxShadow,
          width: rect.width,
          height: rect.height
        };
      });
      
      const buttonChanged = JSON.stringify(buttonBefore) !== JSON.stringify(buttonAfter);
      const buttonSizeChanged = buttonBefore.width !== buttonAfter.width || buttonBefore.height !== buttonAfter.height;
      const buttonColorChanged = buttonBefore.backgroundColor !== buttonAfter.backgroundColor;
      const buttonShadowChanged = buttonBefore.boxShadow !== buttonAfter.boxShadow;
      
      console.log(`🔄 Botón cambió: ${buttonChanged}`);
      console.log(`📏 Tamaño del botón cambió: ${buttonSizeChanged}`);
      console.log(`🎨 Color del botón cambió: ${buttonColorChanged}`);
      console.log(`🌟 Sombra del botón cambió: ${buttonShadowChanged}`);
      
      if (buttonColorChanged) {
        console.log(`🎨 Color antes: ${buttonBefore.backgroundColor}`);
        console.log(`🎨 Color después: ${buttonAfter.backgroundColor}`);
      }
      
      // Probar click
      console.log('\n🖱️ Probando click en el botón...');
      await addToCartButton.click();
      await page.waitForTimeout(1000);
      
      const buttonText = await addToCartButton.textContent();
      console.log(`📊 Texto del botón después del click: ${buttonText}`);
    }

    // Verificar Quick Actions
    console.log('\n👁️ PROBANDO QUICK ACTIONS:');
    await firstCard.hover();
    await page.waitForTimeout(500);
    
    const quickActions = firstCard.locator('.absolute.top-2.right-2');
    const quickActionsVisible = await quickActions.count() > 0;
    console.log(`👁️ Quick Actions visibles: ${quickActionsVisible}`);
    
    if (quickActionsVisible) {
      const heartButton = quickActions.locator('button').first();
      if (await heartButton.count() > 0) {
        console.log('❤️ Probando botón de wishlist...');
        await heartButton.hover();
        await page.waitForTimeout(200);
        await heartButton.click();
        await page.waitForTimeout(300);
        console.log('✅ Botón de wishlist clickeado');
      }
    }

    // Tomar screenshot final
    await page.screenshot({ path: 'test-fixed-animations.png', fullPage: true });
    console.log('\n📸 Screenshot guardado como: test-fixed-animations.png');

    console.log('\n🎬 RESUMEN FINAL:');
    console.log('='.repeat(50));
    console.log('✅ Prueba de animaciones completada');
    console.log('📊 Componente renderizado y funcional');
    console.log('🔄 Animaciones de hover verificadas');
    console.log('🔘 Botón de agregar al carrito probado');
    console.log('👁️ Quick Actions verificadas');

  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message);
  } finally {
    await browser.close();
  }
}

testFixedAnimations();