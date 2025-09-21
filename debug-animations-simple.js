const puppeteer = require('puppeteer');

(async () => {
  console.log('🔍 Iniciando diagnóstico completo de animaciones...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 720 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Capturar errores de consola
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  try {
    console.log('🔍 Navegando a la página demo...');
    await page.goto('http://localhost:3000/demo/commercial-product-card', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    console.log('✅ Página cargada exitosamente');

    // Esperar a que los componentes se rendericen
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Hacer scroll hacia abajo para hacer visibles las cards
    console.log('📜 Haciendo scroll para hacer visibles las cards...');
    await page.evaluate(() => {
      window.scrollTo(0, 800);
    });
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Buscar CommercialProductCards
    console.log('🔍 Buscando CommercialProductCards...');
    const cards = await page.$$('[data-testid-commercial]');
    console.log(`🧱 CommercialProductCards encontradas: ${cards.length}`);

    if (cards.length > 0) {
      // Verificar visibilidad después del scroll
      for (let i = 0; i < cards.length; i++) {
        const cardInfo = await cards[i].evaluate(el => {
          const rect = el.getBoundingClientRect();
          const isVisible = rect.top >= 0 && rect.left >= 0 && 
                           rect.bottom <= window.innerHeight && 
                           rect.right <= window.innerWidth;
          return {
            hasImage: !!el.querySelector('img'),
            hasButton: !!el.querySelector('button'),
            visible: isVisible,
            position: `${Math.round(rect.top)}, ${Math.round(rect.left)}`,
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          };
        });
        console.log(`  Card ${i}:`, cardInfo);
      }

      // Probar hover en la primera card visible
      console.log('🖱️ Probando hover en las cards...');
      const firstCard = cards[0];
      
      // Hacer scroll específico a la primera card
      await firstCard.scrollIntoView();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Obtener información antes del hover
      const beforeHover = await firstCard.evaluate(el => {
        const quickActions = el.querySelector('[class*="quick-actions"], [class*="QuickActions"]');
        const style = window.getComputedStyle(el);
        return {
          hasQuickActions: !!quickActions,
          quickActionsVisible: quickActions ? window.getComputedStyle(quickActions).opacity !== '0' : false,
          transform: style.transform,
          transition: style.transition
        };
      });
      console.log('📊 Estado antes del hover:', beforeHover);

      // Hacer hover
      await firstCard.hover();
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Obtener información después del hover
      const afterHover = await firstCard.evaluate(el => {
        const quickActions = el.querySelector('[class*="quick-actions"], [class*="QuickActions"]');
        const style = window.getComputedStyle(el);
        return {
          hasQuickActions: !!quickActions,
          quickActionsVisible: quickActions ? window.getComputedStyle(quickActions).opacity !== '0' : false,
          transform: style.transform,
          transition: style.transition
        };
      });
      console.log('📊 Estado después del hover:', afterHover);

      // Verificar si hay cambios en las animaciones
      const hasAnimation = beforeHover.transform !== afterHover.transform || 
                          beforeHover.quickActionsVisible !== afterHover.quickActionsVisible;
      console.log(`🎬 ¿Hay animación en hover? ${hasAnimation ? '✅ SÍ' : '❌ NO'}`);
    }

    // Verificar estado de Framer Motion
    const framerMotionStatus = await page.evaluate(() => {
      return {
        hasFramerMotionScript: !!document.querySelector('script[src*="framer-motion"]'),
        hasMotionInWindow: typeof window.motion !== 'undefined',
        hasFramerMotionInWindow: typeof window.framerMotion !== 'undefined',
        motionElements: document.querySelectorAll('[class*="motion"], [style*="transform"]').length,
        animatedElements: document.querySelectorAll('[class*="animate"], [class*="transition"]').length
      };
    });
    console.log('🎬 Estado de Framer Motion:', framerMotionStatus);

    // Verificar estilos CSS de transición
    const cssTransitions = await page.evaluate(() => {
      const cards = document.querySelectorAll('[data-testid-commercial]');
      const transitions = [];
      cards.forEach((card, index) => {
        const style = window.getComputedStyle(card);
        transitions.push({
          cardIndex: index,
          transition: style.transition,
          transform: style.transform,
          hasHoverClass: card.classList.toString().includes('hover')
        });
      });
      return transitions;
    });
    console.log('🎨 Transiciones CSS:', cssTransitions);

    // Esperar un poco más para capturar errores
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('❌ Errores de consola encontrados:', consoleErrors.length);
    if (consoleErrors.length > 0) {
      consoleErrors.forEach((error, index) => {
        console.log(`  Error ${index + 1}: ${error}`);
      });
    }

    console.log('✅ Diagnóstico completado');

  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error.message);
  } finally {
    await browser.close();
  }
})();