const { chromium } = require('playwright');

async function debugFramerAnimations() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🎬 Verificando animaciones de Framer Motion...');
    await page.goto('http://localhost:3000/demo/commercial-product-card', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    // Esperar a que se cargue completamente
    await page.waitForTimeout(2000);

    // Buscar el primer CommercialProductCard
    const firstCard = page.locator('[data-testid-commercial="commercial-product-card"]').first();
    await firstCard.waitFor({ state: 'visible' });

    console.log('🔍 Componente CommercialProductCard encontrado');

    // Verificar animación inicial (fade-in)
    console.log('🎭 Verificando animación inicial...');
    const initialOpacity = await firstCard.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return styles.opacity;
    });
    console.log(`📊 Opacidad inicial: ${initialOpacity}`);

    // Verificar transformaciones CSS
    const initialTransform = await firstCard.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return styles.transform;
    });
    console.log(`📊 Transform inicial: ${initialTransform}`);

    // Simular hover para verificar animaciones de hover
    console.log('🖱️ Simulando hover...');
    await firstCard.hover();
    await page.waitForTimeout(500); // Esperar a que se complete la animación

    const hoverTransform = await firstCard.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return styles.transform;
    });
    console.log(`📊 Transform en hover: ${hoverTransform}`);

    const hoverBoxShadow = await firstCard.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return styles.boxShadow;
    });
    console.log(`📊 Box-shadow en hover: ${hoverBoxShadow}`);

    // Verificar si hay transiciones CSS
    const transition = await firstCard.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return styles.transition;
    });
    console.log(`📊 Transiciones CSS: ${transition}`);

    // Buscar botón "Agregar al carrito" y verificar sus animaciones
    const addToCartButton = firstCard.locator('button').filter({ hasText: /Agregar al carrito/i }).first();
    
    if (await addToCartButton.count() > 0) {
      console.log('🔘 Botón "Agregar al carrito" encontrado');
      
      // Verificar hover del botón
      await addToCartButton.hover();
      await page.waitForTimeout(300);
      
      const buttonHoverTransform = await addToCartButton.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return styles.transform;
      });
      console.log(`📊 Transform del botón en hover: ${buttonHoverTransform}`);

      // Simular click para verificar animación de loading
      console.log('🖱️ Simulando click en el botón...');
      await addToCartButton.click();
      await page.waitForTimeout(1000); // Esperar animación de loading
      
      // Verificar si aparece el estado de loading
      const loadingState = await addToCartButton.textContent();
      console.log(`📊 Estado del botón después del click: ${loadingState}`);
    }

    // Verificar animaciones de elementos internos
    const priceElement = firstCard.locator('[class*="price"], [class*="text-2xl"]').first();
    if (await priceElement.count() > 0) {
      const priceTransition = await priceElement.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return styles.transition;
      });
      console.log(`📊 Transiciones del precio: ${priceTransition}`);
    }

    // Verificar si Framer Motion está funcionando
    const framerMotionElements = await page.evaluate(() => {
      // Buscar elementos con atributos de Framer Motion
      const motionElements = document.querySelectorAll('[style*="transform"], [data-framer-motion]');
      return motionElements.length;
    });
    console.log(`📊 Elementos con Framer Motion detectados: ${framerMotionElements}`);

    // Verificar errores específicos de animaciones
    const animationErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && (
        msg.text().includes('motion') || 
        msg.text().includes('animation') || 
        msg.text().includes('framer')
      )) {
        animationErrors.push(msg.text());
      }
    });

    console.log('\n🎬 RESUMEN DE ANIMACIONES:');
    console.log('='.repeat(50));
    console.log(`✅ Componente visible y funcional`);
    console.log(`📊 Opacidad inicial: ${initialOpacity}`);
    console.log(`📊 Animación de hover: ${hoverTransform !== initialTransform ? 'FUNCIONANDO' : 'NO DETECTADA'}`);
    console.log(`📊 Box-shadow en hover: ${hoverBoxShadow !== 'none' ? 'FUNCIONANDO' : 'NO DETECTADA'}`);
    console.log(`📊 Transiciones CSS: ${transition !== 'all 0s ease 0s' ? 'CONFIGURADAS' : 'NO CONFIGURADAS'}`);
    console.log(`📊 Elementos con Framer Motion: ${framerMotionElements}`);
    
    if (animationErrors.length > 0) {
      console.log('\n❌ ERRORES DE ANIMACIÓN:');
      animationErrors.forEach(error => console.log(`  ${error}`));
    } else {
      console.log('\n✅ No se detectaron errores de animación');
    }

    // Tomar screenshot del estado hover
    await page.screenshot({ path: 'debug-animations-hover.png', fullPage: true });
    console.log('\n📸 Screenshot con hover guardado como: debug-animations-hover.png');

  } catch (error) {
    console.error('❌ Error durante la verificación de animaciones:', error.message);
  } finally {
    await browser.close();
  }
}

debugFramerAnimations();