const puppeteer = require('puppeteer');

async function debugHoverDetailed() {
  console.log('🔍 Iniciando diagnóstico detallado de hover...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true,
    slowMo: 100
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  
  try {
    await page.goto('http://localhost:3000/demo/commercial-product-card', { 
      waitUntil: 'networkidle0',
      timeout: 10000 
    });

    console.log('📄 Página cargada, analizando hover...');

    // Obtener todas las cards
    const cards = await page.$$('[data-testid-commercial="commercial-product-card"]');
    console.log(`🎯 Encontradas ${cards.length} cards comerciales`);

    if (cards.length === 0) {
      console.log('❌ No se encontraron cards comerciales');
      // Buscar por data-testid alternativo
      const cardsByTestId = await page.$$('[data-testid="product-card"]');
      console.log(`🔄 Buscando por data-testid="product-card": ${cardsByTestId.length} encontradas`);
      
      if (cardsByTestId.length === 0) {
        // Buscar por clase de card
        const cardsByClass = await page.$$('.cursor-pointer.rounded-xl');
        console.log(`🔄 Buscando por clase .cursor-pointer.rounded-xl: ${cardsByClass.length} encontradas`);
      }
    }

    // Analizar la primera card en detalle
    const firstCard = cards[0] || 
                     (await page.$$('[data-testid="product-card"]'))[0] ||
                     (await page.$$('.cursor-pointer.rounded-xl'))[0];
    
    if (firstCard) {
      console.log('🎯 Analizando primera card...');
      
      // Estado inicial
      const initialState = await page.evaluate((card) => {
        const rect = card.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(card);
        
        return {
          visible: rect.top >= 0 && rect.top <= window.innerHeight,
          position: `${rect.left}, ${rect.top}`,
          size: `${rect.width}x${rect.height}`,
          className: card.className,
          transform: computedStyle.transform,
          transition: computedStyle.transition,
          cursor: computedStyle.cursor,
          pointerEvents: computedStyle.pointerEvents
        };
      }, firstCard);
      
      console.log('📊 Estado inicial:', initialState);

      // Hacer hover
      console.log('🖱️ Haciendo hover...');
      await firstCard.hover();
      
      // Esperar un momento para que se aplique la animación
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Estado después del hover
      const hoverState = await page.evaluate((card) => {
        const rect = card.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(card);
        
        return {
          transform: computedStyle.transform,
          transition: computedStyle.transition,
          cursor: computedStyle.cursor,
          boxShadow: computedStyle.boxShadow,
          className: card.className,
          hasHoverClass: card.classList.contains('hover:scale-105') || 
                        card.classList.contains('hover\\:scale-105'),
          pseudoClasses: {
            hover: card.matches(':hover'),
            focus: card.matches(':focus')
          }
        };
      }, firstCard);
      
      console.log('📊 Estado después del hover:', hoverState);

      // Verificar CSS computado específicamente para hover
      const hoverCSS = await page.evaluate(() => {
        // Crear un elemento temporal para probar las clases
        const testDiv = document.createElement('div');
        testDiv.className = 'transition-all duration-200 hover:scale-105 hover:shadow-lg';
        document.body.appendChild(testDiv);
        
        const computedStyle = window.getComputedStyle(testDiv);
        const result = {
          transition: computedStyle.transition,
          transform: computedStyle.transform,
          willChange: computedStyle.willChange
        };
        
        document.body.removeChild(testDiv);
        return result;
      });
      
      console.log('🎨 CSS de prueba para hover:', hoverCSS);

      // Verificar si Tailwind CSS está cargado
      const tailwindCheck = await page.evaluate(() => {
        const testDiv = document.createElement('div');
        testDiv.className = 'bg-red-500 text-white p-4';
        document.body.appendChild(testDiv);
        
        const computedStyle = window.getComputedStyle(testDiv);
        const hasTailwind = computedStyle.backgroundColor === 'rgb(239, 68, 68)';
        
        document.body.removeChild(testDiv);
        return {
          hasTailwind,
          backgroundColor: computedStyle.backgroundColor,
          padding: computedStyle.padding
        };
      });
      
      console.log('🎨 Verificación de Tailwind CSS:', tailwindCheck);

      // Probar hover manual con JavaScript
      console.log('🧪 Probando hover manual con JavaScript...');
      
      const manualHoverTest = await page.evaluate((card) => {
        // Simular hover con eventos
        const mouseEnterEvent = new MouseEvent('mouseenter', {
          bubbles: true,
          cancelable: true,
          view: window
        });
        
        const mouseOverEvent = new MouseEvent('mouseover', {
          bubbles: true,
          cancelable: true,
          view: window
        });
        
        card.dispatchEvent(mouseEnterEvent);
        card.dispatchEvent(mouseOverEvent);
        
        // Forzar la clase hover
        card.classList.add('hover');
        
        const computedStyle = window.getComputedStyle(card);
        
        return {
          transform: computedStyle.transform,
          transition: computedStyle.transition,
          eventsFired: true,
          hoverClassAdded: card.classList.contains('hover')
        };
      }, firstCard);
      
      console.log('🧪 Resultado del hover manual:', manualHoverTest);

    } else {
      console.log('❌ No se pudo encontrar ninguna card para analizar');
    }

    // Verificar errores de consola
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    console.log(`❌ Errores de consola: ${consoleErrors.length}`);
    consoleErrors.forEach(error => console.log(`   - ${error}`));

  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error);
  } finally {
    await browser.close();
  }
}

debugHoverDetailed().catch(console.error);