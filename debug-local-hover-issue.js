const puppeteer = require('puppeteer');

async function debugLocalHoverIssue() {
  console.log('🔍 DIAGNÓSTICO ESPECÍFICO PARA PROBLEMA LOCAL DE HOVER');
  console.log('=====================================================');
  
  const browser = await puppeteer.launch({ 
    headless: false, // Mostrar navegador para ver qué pasa
    devtools: true,  // Abrir DevTools automáticamente
    slowMo: 100      // Ralentizar para ver mejor
  });
  
  const page = await browser.newPage();
  
  // Configurar viewport similar al del usuario
  await page.setViewport({ width: 1920, height: 1080 });
  
  try {
    console.log('📍 Navegando a la página...');
    await page.goto('http://localhost:3000/demo/commercial-product-card', { 
      waitUntil: 'networkidle0',
      timeout: 10000 
    });
    
    // Esperar a que las cards se carguen
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 5000 });
    
    console.log('🎯 Analizando cards encontradas...');
    const cards = await page.$$('[data-testid="product-card"]');
    console.log(`✅ Cards encontradas: ${cards.length}`);
    
    if (cards.length === 0) {
      console.log('❌ No se encontraron cards. Verificando selectores alternativos...');
      const alternativeCards = await page.$$('.group');
      console.log(`🔄 Cards con clase .group: ${alternativeCards.length}`);
      return;
    }
    
    // Analizar la primera card en detalle
    const firstCard = cards[0];
    
    console.log('🔬 ANÁLISIS DETALLADO DE LA PRIMERA CARD:');
    console.log('==========================================');
    
    // 1. Verificar estilos computados ANTES del hover
    const initialStyles = await page.evaluate((card) => {
      const computed = window.getComputedStyle(card);
      return {
        transform: computed.transform,
        transition: computed.transition,
        cursor: computed.cursor,
        pointerEvents: computed.pointerEvents,
        zIndex: computed.zIndex,
        position: computed.position,
        display: computed.display,
        visibility: computed.visibility,
        opacity: computed.opacity
      };
    }, firstCard);
    
    console.log('📊 Estilos iniciales:', JSON.stringify(initialStyles, null, 2));
    
    // 2. Verificar clases CSS aplicadas
    const classes = await page.evaluate((card) => {
      return {
        className: card.className,
        hasHoverClass: card.className.includes('hover:'),
        hasTransitionClass: card.className.includes('transition'),
        hasGroupClass: card.className.includes('group')
      };
    }, firstCard);
    
    console.log('🏷️  Clases CSS:', JSON.stringify(classes, null, 2));
    
    // 3. Verificar si hay elementos superpuestos
    const boundingBox = await firstCard.boundingBox();
    console.log('📐 Posición de la card:', boundingBox);
    
    // 4. Simular hover y verificar cambios
    console.log('🖱️  SIMULANDO HOVER...');
    
    // Mover el mouse a la card
    await page.hover('[data-testid="product-card"]');
    
    // Esperar un momento para que se apliquen las transiciones
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Verificar estilos después del hover
    const hoverStyles = await page.evaluate((card) => {
      const computed = window.getComputedStyle(card);
      return {
        transform: computed.transform,
        boxShadow: computed.boxShadow,
        transition: computed.transition
      };
    }, firstCard);
    
    console.log('🎨 Estilos durante hover:', JSON.stringify(hoverStyles, null, 2));
    
    // 5. Verificar si hay errores en consola
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // 6. Verificar si Tailwind CSS está cargado
    const tailwindLoaded = await page.evaluate(() => {
      const stylesheets = Array.from(document.styleSheets);
      return stylesheets.some(sheet => {
        try {
          return Array.from(sheet.cssRules).some(rule => 
            rule.selectorText && rule.selectorText.includes('hover:')
          );
        } catch (e) {
          return false;
        }
      });
    });
    
    console.log('🎨 Tailwind CSS cargado:', tailwindLoaded);
    
    // 7. Verificar si hay CSS personalizado que pueda interferir
    const customCSS = await page.evaluate(() => {
      const styles = Array.from(document.querySelectorAll('style'));
      return styles.map(style => style.textContent).join('\n');
    });
    
    console.log('🎭 CSS personalizado detectado:', customCSS.length > 0);
    if (customCSS.length > 0) {
      console.log('📝 Primeros 500 caracteres:', customCSS.substring(0, 500));
    }
    
    // 8. Verificar eventos de mouse
    const mouseEvents = await page.evaluate((card) => {
      const events = [];
      ['mouseenter', 'mouseleave', 'mouseover', 'mouseout'].forEach(eventType => {
        card.addEventListener(eventType, () => {
          events.push(eventType);
        });
      });
      return events;
    }, firstCard);
    
    console.log('🖱️  Eventos de mouse configurados');
    
    // 9. Forzar hover con JavaScript
    console.log('⚡ FORZANDO HOVER CON JAVASCRIPT...');
    await page.evaluate((card) => {
      // Disparar eventos manualmente
      card.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      card.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      
      // Agregar clase hover manualmente si no existe
      if (!card.classList.contains('hover-active')) {
        card.classList.add('hover-active');
        card.style.transform = 'scale(1.02)';
        card.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
        card.style.transition = 'all 0.2s ease-in-out';
      }
    }, firstCard);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verificar si el hover forzado funcionó
    const forcedHoverStyles = await page.evaluate((card) => {
      const computed = window.getComputedStyle(card);
      return {
        transform: computed.transform,
        boxShadow: computed.boxShadow,
        hasHoverActiveClass: card.classList.contains('hover-active')
      };
    }, firstCard);
    
    console.log('🔧 Estilos después de hover forzado:', JSON.stringify(forcedHoverStyles, null, 2));
    
    console.log('📋 RESUMEN DEL DIAGNÓSTICO:');
    console.log('===========================');
    console.log(`✅ Cards encontradas: ${cards.length}`);
    console.log(`🎨 Tailwind cargado: ${tailwindLoaded}`);
    console.log(`🎭 CSS personalizado: ${customCSS.length > 0}`);
    console.log(`🖱️  Transform inicial: ${initialStyles.transform}`);
    console.log(`🖱️  Transform en hover: ${hoverStyles.transform}`);
    console.log(`🔧 Transform forzado: ${forcedHoverStyles.transform}`);
    console.log(`❌ Errores de consola: ${consoleErrors.length}`);
    
    if (consoleErrors.length > 0) {
      console.log('🚨 ERRORES ENCONTRADOS:');
      consoleErrors.forEach(error => console.log(`   - ${error}`));
    }
    
    // Mantener el navegador abierto para inspección manual
    console.log('🔍 Navegador mantenido abierto para inspección manual...');
    console.log('💡 Presiona Ctrl+C para cerrar cuando termines de inspeccionar');
    
    // Esperar indefinidamente
    await new Promise(() => {});
    
  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error.message);
  }
}

debugLocalHoverIssue().catch(console.error);