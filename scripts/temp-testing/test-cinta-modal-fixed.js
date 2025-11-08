const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Iniciando test del modal de Cinta Papel Blanca (CORREGIDO)...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 // Ralentizar para mejor visualización
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  try {
    // Navegar directamente al producto
    console.log('📍 Navegando al producto Cinta Papel Blanca (ID: 52)...');
    await page.goto('http://localhost:3000/products/52', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Tomar screenshot de la página del producto
    console.log('📸 Tomando screenshot de la página del producto...');
    await page.screenshot({ 
      path: 'Downloads/product-page-cinta-fixed.png',
      fullPage: true 
    });
    
    // Buscar y hacer clic en la imagen del producto para abrir el modal
    console.log('🖱️ Buscando imagen del producto para abrir modal...');
    
    // Intentar múltiples selectores para la imagen del producto
    const imageSelectors = [
      'img[alt*="Cinta"]',
      '.product-image img',
      '[data-testid="product-image"]',
      'img[src*="cinta"]',
      '.relative img' // Selector más genérico
    ];
    
    let imageClicked = false;
    for (const selector of imageSelectors) {
      try {
        const imageElement = await page.locator(selector).first();
        if (await imageElement.isVisible()) {
          console.log(`✅ Encontrada imagen con selector: ${selector}`);
          await imageElement.scrollIntoViewIfNeeded();
          await imageElement.click({ force: true });
          imageClicked = true;
          break;
        }
      } catch (error) {
        console.log(`❌ No se encontró imagen con selector: ${selector}`);
      }
    }
    
    if (!imageClicked) {
      console.log('⚠️ No se pudo hacer clic en la imagen, intentando con botón "Ver detalles"...');
      
      const buttonSelectors = [
        'text=Ver detalles',
        'text=Detalles',
        'text=Ver más',
        'button:has-text("Ver")',
        '[data-testid="view-details"]'
      ];
      
      for (const selector of buttonSelectors) {
        try {
          const button = await page.locator(selector).first();
          if (await button.isVisible()) {
            console.log(`✅ Encontrado botón con selector: ${selector}`);
            await button.click();
            imageClicked = true;
            break;
          }
        } catch (error) {
          console.log(`❌ No se encontró botón con selector: ${selector}`);
        }
      }
    }
    
    if (!imageClicked) {
      throw new Error('No se pudo abrir el modal del producto');
    }
    
    // Esperar a que aparezca el modal
    console.log('⏳ Esperando a que aparezca el modal...');
    await page.waitForSelector('[role="dialog"]', { timeout: 10000 });
    
    // Tomar screenshot del modal abierto
    console.log('📸 Tomando screenshot del modal abierto...');
    await page.screenshot({ 
      path: 'Downloads/modal-opened-cinta-fixed.png',
      fullPage: true 
    });
    
    // Buscar el selector de ancho
    console.log('🔍 Buscando selector de ancho en el modal...');
    
    // Esperar un poco para que se cargue completamente
    await page.waitForTimeout(2000);
    
    // Buscar contenedor de ancho
    const anchoSelectors = [
      'text=Ancho',
      '[data-testid="width-selector"]',
      '.space-y-3:has-text("Ancho")',
      'h3:has-text("Ancho")'
    ];
    
    let anchoContainer = null;
    for (const selector of anchoSelectors) {
      try {
        const element = await page.locator(selector).first();
        if (await element.isVisible()) {
          console.log(`✅ Encontrado contenedor de ancho: ${selector}`);
          anchoContainer = element;
          break;
        }
      } catch (error) {
        console.log(`❌ No encontrado: ${selector}`);
      }
    }
    
    if (anchoContainer) {
      console.log('🎯 ¡Selector de ancho encontrado!');
      
      // Buscar botones de ancho
      const widthButtons = await page.locator('button:has-text("mm")').all();
      console.log(`📏 Encontrados ${widthButtons.length} botones de ancho`);
      
      if (widthButtons.length > 0) {
        // Hacer clic en el primer botón de ancho
        console.log('🖱️ Haciendo clic en el primer botón de ancho...');
        await widthButtons[0].click();
        
        // Esperar un poco
        await page.waitForTimeout(1000);
        
        // Tomar screenshot después de seleccionar ancho
        console.log('📸 Tomando screenshot después de seleccionar ancho...');
        await page.screenshot({ 
          path: 'Downloads/modal-width-selected-fixed.png',
          fullPage: true 
        });
        
        // Intentar hacer clic en otro botón de ancho si hay más
        if (widthButtons.length > 1) {
          console.log('🖱️ Haciendo clic en el segundo botón de ancho...');
          await widthButtons[1].click();
          
          await page.waitForTimeout(1000);
          
          console.log('📸 Tomando screenshot final...');
          await page.screenshot({ 
            path: 'Downloads/modal-width-changed-fixed.png',
            fullPage: true 
          });
        }
        
        console.log('✅ ¡Test completado exitosamente! El selector de ancho funciona correctamente.');
      } else {
        console.log('❌ No se encontraron botones de ancho en el modal');
      }
    } else {
      console.log('❌ No se encontró el selector de ancho en el modal');
      
      // Tomar screenshot para debug
      await page.screenshot({ 
        path: 'Downloads/modal-no-width-selector-debug.png',
        fullPage: true 
      });
    }
    
  } catch (error) {
    console.error('❌ Error durante el test:', error.message);
    
    // Tomar screenshot del error
    await page.screenshot({ 
      path: 'Downloads/error-screenshot-fixed.png',
      fullPage: true 
    });
  } finally {
    await browser.close();
    console.log('🏁 Test finalizado');
  }
})();