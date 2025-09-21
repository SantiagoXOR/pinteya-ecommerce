const puppeteer = require('puppeteer');

(async () => {
  console.log('🔍 Iniciando diagnóstico de visibilidad...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 720 }
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('📄 Navegando a la página demo...');
    await page.goto('http://localhost:3000/demo/commercial-product-card', { 
      waitUntil: 'networkidle0',
      timeout: 10000 
    });
    
    // Esperar a que los componentes se rendericen
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('🔍 Analizando layout de la página...');
    
    // Obtener información del viewport y scroll
    const viewportInfo = await page.evaluate(() => {
      return {
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        document: {
          width: document.documentElement.scrollWidth,
          height: document.documentElement.scrollHeight
        },
        scroll: {
          x: window.scrollX,
          y: window.scrollY
        }
      };
    });
    
    console.log('📐 Información del viewport:', JSON.stringify(viewportInfo, null, 2));
    
    // Buscar todas las cards
    const cardsInfo = await page.evaluate(() => {
      const cards = document.querySelectorAll('[data-testid-commercial="commercial-product-card"]');
      console.log(`Encontradas ${cards.length} cards`);
      
      return Array.from(cards).map((card, index) => {
        const rect = card.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(card);
        
        return {
          index,
          rect: {
            top: rect.top,
            left: rect.left,
            bottom: rect.bottom,
            right: rect.right,
            width: rect.width,
            height: rect.height
          },
          isVisible: rect.top < window.innerHeight && rect.bottom > 0 && rect.left < window.innerWidth && rect.right > 0,
          inViewport: rect.top >= 0 && rect.left >= 0 && rect.bottom <= window.innerHeight && rect.right <= window.innerWidth,
          style: {
            display: computedStyle.display,
            visibility: computedStyle.visibility,
            opacity: computedStyle.opacity,
            position: computedStyle.position,
            transform: computedStyle.transform,
            overflow: computedStyle.overflow
          },
          parent: {
            tagName: card.parentElement?.tagName,
            className: card.parentElement?.className,
            style: card.parentElement ? {
              display: window.getComputedStyle(card.parentElement).display,
              overflow: window.getComputedStyle(card.parentElement).overflow,
              height: window.getComputedStyle(card.parentElement).height
            } : null
          }
        };
      });
    });
    
    console.log('🧱 Información de las cards:');
    cardsInfo.forEach((card, i) => {
      console.log(`  Card ${i}:`, {
        visible: card.isVisible,
        inViewport: card.inViewport,
        position: `${card.rect.left}, ${card.rect.top}`,
        size: `${card.rect.width}x${card.rect.height}`,
        display: card.style.display,
        visibility: card.style.visibility,
        opacity: card.style.opacity
      });
    });
    
    // Analizar el contenedor principal
    const containerInfo = await page.evaluate(() => {
      const containers = [
        document.querySelector('main'),
        document.querySelector('.container'),
        document.querySelector('[class*="grid"]'),
        document.querySelector('[class*="flex"]')
      ].filter(Boolean);
      
      return containers.map(container => {
        const rect = container.getBoundingClientRect();
        const style = window.getComputedStyle(container);
        
        return {
          tagName: container.tagName,
          className: container.className,
          rect: {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height
          },
          style: {
            display: style.display,
            overflow: style.overflow,
            height: style.height,
            maxHeight: style.maxHeight,
            position: style.position
          }
        };
      });
    });
    
    console.log('📦 Información de contenedores:', JSON.stringify(containerInfo, null, 2));
    
    // Hacer scroll para ver si las cards se vuelven visibles
    console.log('📜 Probando scroll...');
    await page.evaluate(() => window.scrollTo(0, 500));
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const cardsAfterScroll = await page.evaluate(() => {
      const cards = document.querySelectorAll('[data-testid-commercial="commercial-product-card"]');
      return Array.from(cards).map((card, index) => {
        const rect = card.getBoundingClientRect();
        return {
          index,
          isVisible: rect.top < window.innerHeight && rect.bottom > 0,
          position: `${rect.left}, ${rect.top}`
        };
      });
    });
    
    console.log('📜 Cards después del scroll:');
    cardsAfterScroll.forEach(card => {
      console.log(`  Card ${card.index}: visible=${card.isVisible}, position=${card.position}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})();