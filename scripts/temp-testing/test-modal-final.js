const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('Navegando a la página principal...');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Tomar screenshot inicial
    await page.screenshot({ path: 'homepage-test.png', fullPage: true });

    // Navegar directamente a productos
    console.log('Navegando a la página de productos...');
    await page.goto('http://localhost:3000/productos');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Tomar screenshot de productos
    await page.screenshot({ path: 'productos-page.png', fullPage: true });

    // Buscar productos con múltiples selectores
    const productSelectors = [
      '[data-testid="commercial-product-card"]',
      '[data-testid="product-card"]',
      '.product-card',
      'article',
      'div[class*="card"]',
      'div[class*="product"]'
    ];

    let productCards;
    let foundSelector = '';
    for (const selector of productSelectors) {
      try {
        productCards = page.locator(selector);
        const count = await productCards.count();
        if (count > 0) {
          console.log('Productos encontrados con selector:', selector, 'Cantidad:', count);
          foundSelector = selector;
          break;
        }
      } catch (e) {
        console.log('Selector de productos no encontrado:', selector);
      }
    }

    if (!productCards || (await productCards.count()) === 0) {
      console.log('No se encontraron productos, listando todos los elementos visibles...');
      
      // Listar todos los elementos clickeables
      const clickableElements = page.locator('button, a, div[onclick], [role="button"]');
      const clickableCount = await clickableElements.count();
      console.log('Elementos clickeables encontrados:', clickableCount);
      
      for (let i = 0; i < Math.min(10, clickableCount); i++) {
        try {
          const text = await clickableElements.nth(i).textContent();
          const tagName = await clickableElements.nth(i).evaluate(el => el.tagName);
          console.log('Elemento', i, ':', tagName, '-', text?.substring(0, 50));
        } catch (e) {}
      }
      
      return;
    }

    // Buscar específicamente productos de cinta papel
    console.log('Buscando productos de cinta papel...');
    const allProducts = await productCards.all();
    let cintaPapelProduct = null;
    
    for (let i = 0; i < allProducts.length; i++) {
      try {
        const productText = await allProducts[i].textContent();
        if (productText && productText.toLowerCase().includes('cinta')) {
          console.log('Producto de cinta encontrado:', productText.substring(0, 100));
          cintaPapelProduct = allProducts[i];
          break;
        }
      } catch (e) {}
    }

    if (!cintaPapelProduct) {
      console.log('No se encontró producto de cinta papel, usando el primer producto disponible');
      cintaPapelProduct = productCards.first();
    }

    // Hacer clic en el producto
    console.log('Haciendo clic en el producto...');
    await cintaPapelProduct.click();
    await page.waitForTimeout(3000);

    // Verificar que el modal se abrió
    const modalSelectors = [
      '[role="dialog"]',
      '.modal',
      '[data-testid="product-modal"]',
      'div[class*="modal"]',
      'div[class*="dialog"]'
    ];

    let modal;
    for (const selector of modalSelectors) {
      try {
        modal = page.locator(selector);
        if (await modal.isVisible({ timeout: 2000 })) {
          console.log('Modal encontrado con selector:', selector);
          break;
        }
      } catch (e) {
        console.log('Modal no encontrado con selector:', selector);
      }
    }

    if (!modal || !(await modal.isVisible())) {
      console.log('Modal no se abrió, verificando si hay overlay o popup...');
      
      // Buscar cualquier elemento que pueda ser un modal
      const possibleModals = page.locator('div[style*="position: fixed"], div[style*="z-index"]');
      const modalCount = await possibleModals.count();
      console.log('Posibles modales encontrados:', modalCount);
      
      await page.screenshot({ path: 'no-modal-state.png', fullPage: true });
      return;
    }

    // Tomar screenshot del modal
    await page.screenshot({ path: 'modal-cinta-papel-final.png', fullPage: true });

    // Extraer información del modal
    console.log('\n=== INFORMACIÓN DEL MODAL ===');
    
    // Título del producto
    const titleSelectors = ['h1', 'h2', 'h3', '[data-testid="product-title"]', 'div[class*="title"]'];
    for (const selector of titleSelectors) {
      try {
        const title = await page.locator(selector).first().textContent({ timeout: 1000 });
        if (title && title.trim() && title.length > 3) {
          console.log('Título del producto:', title.trim());
          break;
        }
      } catch (e) {}
    }

    // Precio
    const priceSelectors = [
      'text=/\\$[0-9,]+/',
      '[data-testid="product-price"]',
      'div[class*="price"]',
      'span[class*="price"]'
    ];
    
    for (const selector of priceSelectors) {
      try {
        const priceText = await page.locator(selector).first().textContent({ timeout: 1000 });
        if (priceText && priceText.includes('$')) {
          console.log('Precio encontrado:', priceText.trim());
          break;
        }
      } catch (e) {}
    }

    // Buscar todas las opciones de botones (ancho y longitud)
    const allButtons = page.locator('button');
    const buttonCount = await allButtons.count();
    console.log('\nBotones encontrados en el modal:', buttonCount);
    
    const widthOptions = [];
    const lengthOptions = [];
    
    for (let i = 0; i < buttonCount; i++) {
      try {
        const buttonText = await allButtons.nth(i).textContent();
        if (buttonText) {
          const text = buttonText.trim();
          if (text.includes('mm')) {
            widthOptions.push(text);
          } else if (text.includes('m') && !text.includes('mm')) {
            lengthOptions.push(text);
          }
        }
      } catch (e) {}
    }
    
    console.log('Opciones de ancho encontradas:', widthOptions);
    console.log('Opciones de longitud encontradas:', lengthOptions);

    // Probar cambio de ancho si hay opciones
    if (widthOptions.length > 1) {
      console.log('\nProbando cambio de ancho...');
      
      // Buscar el botón del segundo ancho
      const secondWidthButton = page.locator('button', { hasText: widthOptions[1] });
      if (await secondWidthButton.isVisible()) {
        await secondWidthButton.click();
        await page.waitForTimeout(2000);
        
        // Verificar cambio de precio
        for (const selector of priceSelectors) {
          try {
            const newPriceText = await page.locator(selector).first().textContent({ timeout: 1000 });
            if (newPriceText && newPriceText.includes('$')) {
              console.log('Precio después de cambiar ancho:', newPriceText.trim());
              break;
            }
          } catch (e) {}
        }
        
        await page.screenshot({ path: 'modal-after-width-change-final.png', fullPage: true });
      }
    }

    // Buscar texto de ancho seleccionado
    const allText = await page.textContent('body');
    if (allText.includes('Ancho seleccionado')) {
      const lines = allText.split('\n');
      for (const line of lines) {
        if (line.includes('Ancho seleccionado')) {
          console.log('Texto encontrado:', line.trim());
        }
      }
    }

    console.log('\n=== TEST COMPLETADO ===');
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('Error durante el test:', error);
    await page.screenshot({ path: 'error-final.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();