const { chromium } = require('playwright');

async function testAnimationsInteractive() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 // Ralentizar para ver las animaciones
  });
  const page = await browser.newPage();

  try {
    console.log('🎬 Iniciando prueba interactiva de animaciones...');
    
    // Navegar a la página
    await page.goto('http://localhost:3000/demo/commercial-product-card', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    console.log('✅ Página cargada');

    // Esperar a que se cargue completamente
    await page.waitForTimeout(3000);

    // Buscar el primer CommercialProductCard
    const firstCard = page.locator('[data-testid-commercial="commercial-product-card"]').first();
    await firstCard.waitFor({ state: 'visible' });

    console.log('✅ Componente CommercialProductCard encontrado');

    // Verificar si Framer Motion está cargado
    const framerMotionLoaded = await page.evaluate(() => {
      return typeof window !== 'undefined' && 
             window.FramerMotion !== undefined ||
             document.querySelector('[data-framer-motion]') !== null ||
             document.querySelector('[style*="transform"]') !== null;
    });
    console.log(`📊 Framer Motion detectado: ${framerMotionLoaded}`);

    // Verificar estilos computados iniciales
    console.log('\n🔍 VERIFICANDO ESTILOS INICIALES:');
    const initialStyles = await firstCard.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        opacity: styles.opacity,
        transform: styles.transform,
        transition: styles.transition,
        willChange: styles.willChange,
        backfaceVisibility: styles.backfaceVisibility
      };
    });
    console.log('📊 Estilos iniciales:', JSON.stringify(initialStyles, null, 2));

    // Verificar si el elemento tiene atributos de Framer Motion
    const motionAttributes = await firstCard.evaluate(el => {
      const attrs = {};
      for (let attr of el.attributes) {
        if (attr.name.includes('data-framer') || attr.name.includes('motion')) {
          attrs[attr.name] = attr.value;
        }
      }
      return attrs;
    });
    console.log('📊 Atributos de Motion:', JSON.stringify(motionAttributes, null, 2));

    // Probar animación de hover paso a paso
    console.log('\n🖱️ PROBANDO ANIMACIÓN DE HOVER:');
    
    // Antes del hover
    console.log('📊 Estado antes del hover...');
    const beforeHover = await firstCard.evaluate(el => {
      const styles = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return {
        transform: styles.transform,
        boxShadow: styles.boxShadow,
        scale: styles.scale,
        width: rect.width,
        height: rect.height
      };
    });
    console.log('📊 Antes del hover:', JSON.stringify(beforeHover, null, 2));

    // Hacer hover
    await firstCard.hover();
    console.log('🖱️ Hover aplicado, esperando animación...');
    await page.waitForTimeout(1000); // Esperar a que se complete la animación

    // Después del hover
    const afterHover = await firstCard.evaluate(el => {
      const styles = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return {
        transform: styles.transform,
        boxShadow: styles.boxShadow,
        scale: styles.scale,
        width: rect.width,
        height: rect.height
      };
    });
    console.log('📊 Después del hover:', JSON.stringify(afterHover, null, 2));

    // Comparar cambios
    const hasTransformChanged = beforeHover.transform !== afterHover.transform;
    const hasBoxShadowChanged = beforeHover.boxShadow !== afterHover.boxShadow;
    const hasSizeChanged = beforeHover.width !== afterHover.width || beforeHover.height !== afterHover.height;

    console.log('\n📊 ANÁLISIS DE CAMBIOS:');
    console.log(`🔄 Transform cambió: ${hasTransformChanged}`);
    console.log(`🌟 Box-shadow cambió: ${hasBoxShadowChanged}`);
    console.log(`📏 Tamaño cambió: ${hasSizeChanged}`);

    // Verificar errores de JavaScript
    const jsErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        jsErrors.push(msg.text());
      }
    });

    // Probar el botón de agregar al carrito
    console.log('\n🔘 PROBANDO BOTÓN AGREGAR AL CARRITO:');
    const addToCartButton = firstCard.locator('button[data-testid="add-to-cart"]').first();
    
    if (await addToCartButton.count() > 0) {
      console.log('✅ Botón encontrado');
      
      // Estilos antes del hover del botón
      const buttonBeforeHover = await addToCartButton.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          transform: styles.transform,
          backgroundColor: styles.backgroundColor,
          scale: styles.scale
        };
      });
      console.log('📊 Botón antes del hover:', JSON.stringify(buttonBeforeHover, null, 2));

      // Hover en el botón
      await addToCartButton.hover();
      await page.waitForTimeout(500);

      const buttonAfterHover = await addToCartButton.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          transform: styles.transform,
          backgroundColor: styles.backgroundColor,
          scale: styles.scale
        };
      });
      console.log('📊 Botón después del hover:', JSON.stringify(buttonAfterHover, null, 2));

      const buttonHasChanged = JSON.stringify(buttonBeforeHover) !== JSON.stringify(buttonAfterHover);
      console.log(`🔄 Botón cambió en hover: ${buttonHasChanged}`);
    }

    // Verificar si hay elementos con animaciones CSS
    const cssAnimations = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      let animatedElements = 0;
      let transitionElements = 0;
      
      elements.forEach(el => {
        const styles = window.getComputedStyle(el);
        if (styles.animation !== 'none') animatedElements++;
        if (styles.transition !== 'all 0s ease 0s') transitionElements++;
      });
      
      return { animatedElements, transitionElements };
    });
    console.log('\n📊 ELEMENTOS CON ANIMACIONES CSS:');
    console.log(`🎭 Elementos con animation: ${cssAnimations.animatedElements}`);
    console.log(`🔄 Elementos con transition: ${cssAnimations.transitionElements}`);

    // Verificar configuración de prefers-reduced-motion
    const prefersReducedMotion = await page.evaluate(() => {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    });
    console.log(`♿ Prefers-reduced-motion: ${prefersReducedMotion}`);

    // Resumen final
    console.log('\n🎬 RESUMEN FINAL:');
    console.log('='.repeat(50));
    console.log(`✅ Componente renderizado correctamente`);
    console.log(`📊 Framer Motion detectado: ${framerMotionLoaded}`);
    console.log(`🔄 Animación de hover funcionando: ${hasTransformChanged || hasBoxShadowChanged || hasSizeChanged}`);
    console.log(`🌟 Box-shadow en hover: ${hasBoxShadowChanged ? 'SÍ' : 'NO'}`);
    console.log(`♿ Animaciones reducidas: ${prefersReducedMotion ? 'SÍ' : 'NO'}`);
    console.log(`❌ Errores JS: ${jsErrors.length}`);

    if (jsErrors.length > 0) {
      console.log('\n❌ ERRORES DETECTADOS:');
      jsErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    // Mantener el navegador abierto para inspección manual
    console.log('\n🔍 Navegador mantenido abierto para inspección manual...');
    console.log('Presiona Ctrl+C para cerrar');
    
    // Esperar indefinidamente
    await new Promise(() => {});

  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message);
  } finally {
    // El navegador se cerrará cuando se presione Ctrl+C
  }
}

testAnimationsInteractive();