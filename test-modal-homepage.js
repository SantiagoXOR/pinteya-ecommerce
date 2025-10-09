const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Iniciando test de modal de cinta papel desde homepage...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 // Ralentizar para ver las acciones
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();

  try {
    // 1. Navegar a la página principal
    console.log('📍 Navegando a la página principal...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000); // Esperar a que carguen los productos

    // 2. Tomar screenshot inicial
    await page.screenshot({ 
      path: 'homepage-inicial.png', 
      fullPage: true 
    });
    console.log('📸 Screenshot inicial guardado: homepage-inicial.png');

    // 3. Buscar productos en la página principal
    console.log('🔍 Buscando productos en la página principal...');
    
    // Intentar múltiples selectores para encontrar productos
    const productSelectors = [
      '[data-testid="commercial-product-card"]',
      '.product-card',
      '[class*="product"]',
      'article',
      '[role="article"]'
    ];

    let productCards = [];
    let usedSelector = '';

    for (const selector of productSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        productCards = await page.locator(selector).all();
        if (productCards.length > 0) {
          usedSelector = selector;
          console.log(`✅ Encontrados ${productCards.length} productos con selector: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`❌ No se encontraron productos con selector: ${selector}`);
      }
    }

    if (productCards.length === 0) {
      console.log('❌ No se encontraron productos en la página principal');
      
      // Listar todos los elementos clickeables para debug
      const clickableElements = await page.locator('button, a, [role="button"], [onclick]').all();
      console.log(`🔍 Elementos clickeables encontrados: ${clickableElements.length}`);
      
      for (let i = 0; i < Math.min(10, clickableElements.length); i++) {
        const text = await clickableElements[i].textContent();
        const tagName = await clickableElements[i].evaluate(el => el.tagName);
        console.log(`  ${i + 1}. ${tagName}: "${text?.trim() || 'Sin texto'}"`);
      }
      
      await browser.close();
      return;
    }

    // 4. Buscar productos de cinta papel
    console.log('🔍 Buscando productos de cinta papel...');
    let cintaPapelProduct = null;

    for (let i = 0; i < productCards.length; i++) {
      const card = productCards[i];
      const text = await card.textContent();
      
      if (text && text.toLowerCase().includes('cinta') && text.toLowerCase().includes('papel')) {
        cintaPapelProduct = card;
        console.log(`✅ Encontrado producto de cinta papel: "${text.trim()}"`);
        break;
      }
    }

    if (!cintaPapelProduct) {
      console.log('❌ No se encontró producto de cinta papel');
      
      // Mostrar los primeros productos encontrados para debug
      console.log('🔍 Productos disponibles:');
      for (let i = 0; i < Math.min(5, productCards.length); i++) {
        const text = await productCards[i].textContent();
        console.log(`  ${i + 1}. "${text?.trim() || 'Sin texto'}"`);
      }
      
      await browser.close();
      return;
    }

    // 5. Hacer click en el producto de cinta papel
    console.log('👆 Haciendo click en el producto de cinta papel...');
    await cintaPapelProduct.click();
    await page.waitForTimeout(2000);

    // 6. Verificar que se abrió el modal
    console.log('🔍 Verificando que se abrió el modal...');
    
    const modalSelectors = [
      '[role="dialog"]',
      '.modal',
      '[data-testid="product-modal"]',
      '[class*="modal"]',
      '[class*="dialog"]'
    ];

    let modal = null;
    for (const selector of modalSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        modal = page.locator(selector).first();
        if (await modal.isVisible()) {
          console.log(`✅ Modal encontrado con selector: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`❌ Modal no encontrado con selector: ${selector}`);
      }
    }

    if (!modal || !(await modal.isVisible())) {
      console.log('❌ No se pudo abrir el modal');
      await page.screenshot({ path: 'error-no-modal.png', fullPage: true });
      await browser.close();
      return;
    }

    // 7. Tomar screenshot del modal
    await page.screenshot({ 
      path: 'modal-cinta-papel-abierto.png', 
      fullPage: true 
    });
    console.log('📸 Screenshot del modal guardado: modal-cinta-papel-abierto.png');

    // 8. Extraer información del modal
    console.log('📋 Extrayendo información del modal...');
    
    try {
      // Título del producto
      const titleSelectors = ['h1', 'h2', '[class*="title"]', '[class*="name"]'];
      let productTitle = 'No encontrado';
      
      for (const selector of titleSelectors) {
        try {
          const titleElement = modal.locator(selector).first();
          if (await titleElement.isVisible()) {
            productTitle = await titleElement.textContent();
            break;
          }
        } catch (e) {}
      }
      
      console.log(`📝 Título del producto: ${productTitle}`);

      // Precio
      const priceSelectors = ['[class*="price"]', '[class*="cost"]', 'span:has-text("$")'];
      let productPrice = 'No encontrado';
      
      for (const selector of priceSelectors) {
        try {
          const priceElement = modal.locator(selector).first();
          if (await priceElement.isVisible()) {
            productPrice = await priceElement.textContent();
            break;
          }
        } catch (e) {}
      }
      
      console.log(`💰 Precio: ${productPrice}`);

      // Opciones de ancho
      console.log('🔍 Buscando opciones de ancho...');
      const widthOptions = await modal.locator('button:has-text("mm"), button:has-text("cm")').all();
      console.log(`📏 Opciones de ancho encontradas: ${widthOptions.length}`);
      
      for (let i = 0; i < widthOptions.length; i++) {
        const text = await widthOptions[i].textContent();
        console.log(`  - Opción ${i + 1}: ${text}`);
      }

      // Opciones de longitud
      console.log('🔍 Buscando opciones de longitud...');
      const lengthOptions = await modal.locator('button:has-text("m"), button:has-text("metros")').all();
      console.log(`📏 Opciones de longitud encontradas: ${lengthOptions.length}`);
      
      for (let i = 0; i < lengthOptions.length; i++) {
        const text = await lengthOptions[i].textContent();
        console.log(`  - Opción ${i + 1}: ${text}`);
      }

      // 9. Probar cambio de ancho si hay opciones disponibles
      if (widthOptions.length > 1) {
        console.log('🧪 Probando cambio de ancho...');
        
        // Obtener precio inicial
        const initialPrice = productPrice;
        console.log(`💰 Precio inicial: ${initialPrice}`);
        
        // Hacer click en una opción diferente de ancho
        await widthOptions[1].click();
        await page.waitForTimeout(1000);
        
        // Verificar si cambió el precio
        let newPrice = 'No encontrado';
        for (const selector of priceSelectors) {
          try {
            const priceElement = modal.locator(selector).first();
            if (await priceElement.isVisible()) {
              newPrice = await priceElement.textContent();
              break;
            }
          } catch (e) {}
        }
        
        console.log(`💰 Precio después del cambio: ${newPrice}`);
        
        if (newPrice !== initialPrice) {
          console.log('✅ El precio cambió correctamente al seleccionar diferente ancho');
        } else {
          console.log('⚠️ El precio no cambió o es el mismo');
        }
        
        // Screenshot final
        await page.screenshot({ 
          path: 'modal-cinta-papel-ancho-cambiado.png', 
          fullPage: true 
        });
        console.log('📸 Screenshot con ancho cambiado guardado: modal-cinta-papel-ancho-cambiado.png');
      }

      console.log('✅ Test completado exitosamente');

    } catch (error) {
      console.log('❌ Error al extraer información del modal:', error.message);
    }

  } catch (error) {
    console.log('❌ Error durante el test:', error.message);
    await page.screenshot({ path: 'error-test.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();