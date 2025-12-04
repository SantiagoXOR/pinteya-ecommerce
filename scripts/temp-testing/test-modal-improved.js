const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navegar a la página principal
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Tomar screenshot inicial
    await page.screenshot({ path: 'homepage-initial.png', fullPage: true });

    // Buscar el campo de búsqueda con múltiples selectores
    let searchInput;
    const searchSelectors = [
      '[data-testid=\
search-input\]',
      '[role=\searchbox\]',
      'input[placeholder*=\Buscar\]',
      'input[type=\search\]',
      '.search-input',
      '#search'
    ];

    for (const selector of searchSelectors) {
      try {
        searchInput = page.locator(selector);
        if (await searchInput.isVisible({ timeout: 2000 })) {
          console.log('Campo de búsqueda encontrado con selector:', selector);
          break;
        }
      } catch (e) {
        console.log('Selector no encontrado:', selector);
      }
    }

    if (!searchInput || !(await searchInput.isVisible())) {
      console.log('No se encontró campo de búsqueda, navegando directamente a productos');
      // Intentar navegar directamente a productos
      await page.goto('http://localhost:3000/productos');
      await page.waitForLoadState('networkidle');
    } else {
      // Buscar cinta papel
      await searchInput.fill('cinta papel');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(3000);
    }

    // Tomar screenshot de los resultados
    await page.screenshot({ path: 'search-results.png', fullPage: true });

    // Buscar productos con múltiples selectores
    const productSelectors = [
      '[data-testid=\commercial-product-card\]',
      '[data-testid=\product-card\]',
      '.product-card',
      'article',
      '[class*=\product\]'
    ];

    let productCards;
    for (const selector of productSelectors) {
      try {
        productCards = page.locator(selector);
        const count = await productCards.count();
        if (count > 0) {
          console.log('Productos encontrados con selector:', selector, 'Cantidad:', count);
          break;
        }
      } catch (e) {
        console.log('Selector de productos no encontrado:', selector);
      }
    }

    if (!productCards || (await productCards.count()) === 0) {
      console.log('No se encontraron productos');
      return;
    }

    // Hacer clic en el primer producto
    const firstProduct = productCards.first();
    await firstProduct.click();
    await page.waitForTimeout(3000);

    // Verificar que el modal se abrió
    const modalSelectors = [
      '[role=\dialog\]',
      '.modal',
      '[data-testid=\product-modal\]',
      '[class*=\modal\]'
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
      console.log('Modal no se abrió, tomando screenshot del estado actual');
      await page.screenshot({ path: 'no-modal-state.png', fullPage: true });
      return;
    }

    // Tomar screenshot del modal
    await page.screenshot({ path: 'modal-cinta-papel.png', fullPage: true });

    // Verificar elementos del modal
    const titleSelectors = ['h1', 'h2', 'h3', '[data-testid=\product-title\]'];
    let productTitle = 'No encontrado';
    for (const selector of titleSelectors) {
      try {
        const title = await page.locator(selector).first().textContent({ timeout: 1000 });
        if (title && title.trim()) {
          productTitle = title.trim();
          break;
        }
      } catch (e) {}
    }

    const priceSelectors = ['text=/\\$[0-9,]+/', '[data-testid=\product-price\]', '.price'];
    let price = 'No encontrado';
    for (const selector of priceSelectors) {
      try {
        const priceText = await page.locator(selector).first().textContent({ timeout: 1000 });
        if (priceText && priceText.includes('$')) {
          price = priceText.trim();
          break;
        }
      } catch (e) {}
    }
    
    console.log('Producto:', productTitle);
    console.log('Precio:', price);

    // Verificar opciones de ancho
    const widthOptions = page.locator('button:has-text(\mm\)');
    const widthCount = await widthOptions.count();
    console.log('Opciones de ancho encontradas:', widthCount);

    for (let i = 0; i < widthCount; i++) {
      try {
        const width = await widthOptions.nth(i).textContent();
        console.log('Ancho disponible:', width);
      } catch (e) {}
    }

    // Verificar opciones de longitud
    const lengthOptions = page.locator('button:has-text(\m\)');
    const lengthCount = await lengthOptions.count();
    console.log('Opciones de longitud encontradas:', lengthCount);

    for (let i = 0; i < lengthCount; i++) {
      try {
        const length = await lengthOptions.nth(i).textContent();
        console.log('Longitud disponible:', length);
      } catch (e) {}
    }

    // Probar cambio de ancho y verificar precio
    if (widthCount > 1) {
      const secondWidth = widthOptions.nth(1);
      await secondWidth.click();
      await page.waitForTimeout(1000);
      
      let newPrice = 'No encontrado';
      for (const selector of priceSelectors) {
        try {
          const priceText = await page.locator(selector).first().textContent({ timeout: 1000 });
          if (priceText && priceText.includes('$')) {
            newPrice = priceText.trim();
            break;
          }
        } catch (e) {}
      }
      console.log('Precio después de cambiar ancho:', newPrice);
    }

    await page.waitForTimeout(5000); // Mantener abierto para inspección

  } catch (error) {
    console.error('Error:', error);
    await page.screenshot({ path: 'error-state.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
