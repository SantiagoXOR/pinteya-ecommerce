const { chromium } = require('playwright');

(async () => {
  console.log('🧪 Iniciando test de verificación de corrección de precios...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Navegar a la página principal
    console.log('🌐 Navegando a http://localhost:3000...');
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(3000);

    // Buscar cinta papel
    console.log('🔍 Buscando "cinta papel"...');
    const searchInput = page.locator('input[placeholder*="Buscar"], input[type="search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('cinta papel');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(3000);
    }

    // Buscar productos
    const productSelectors = [
      '[data-testid="commercial-product-card"]',
      '[data-testid="product-card"]',
      '.product-card',
      'article'
    ];

    let productCards;
    for (const selector of productSelectors) {
      try {
        productCards = page.locator(selector);
        const count = await productCards.count();
        if (count > 0) {
          console.log(`✅ Productos encontrados: ${count} con selector: ${selector}`);
          break;
        }
      } catch (e) {}
    }

    if (!productCards || (await productCards.count()) === 0) {
      console.log('❌ No se encontraron productos');
      return;
    }

    // Buscar específicamente cinta papel
    let cintaPapelCard = null;
    const cardCount = await productCards.count();
    
    for (let i = 0; i < cardCount; i++) {
      const card = productCards.nth(i);
      const cardText = await card.textContent();
      
      if (cardText && cardText.toLowerCase().includes('cinta papel')) {
        console.log(`🎯 Encontrado producto de cinta papel: ${cardText.substring(0, 100)}...`);
        cintaPapelCard = card;
        break;
      }
    }

    if (!cintaPapelCard) {
      console.log('❌ No se encontró producto específico de cinta papel');
      // Usar el primer producto como fallback
      cintaPapelCard = productCards.first();
      console.log('🔄 Usando primer producto como fallback');
    }

    // Hacer clic en el producto
    console.log('👆 Haciendo clic en el producto...');
    await cintaPapelCard.click();
    await page.waitForTimeout(3000);

    // Verificar que el modal se abrió
    const modal = page.locator('[role="dialog"]').first();
    if (!(await modal.isVisible())) {
      console.log('❌ Modal no se abrió');
      return;
    }

    console.log('✅ Modal abierto exitosamente');

    // Tomar screenshot inicial
    await page.screenshot({ 
      path: 'modal-precio-inicial.png', 
      fullPage: true 
    });

    // Extraer precio inicial
    const priceSelectors = [
      'text=/\\$[\\d,]+/',
      '[class*="price"]',
      '.text-orange-500',
      '.font-bold'
    ];

    let initialPrice = 'No encontrado';
    for (const selector of priceSelectors) {
      try {
        const priceElement = modal.locator(selector).first();
        if (await priceElement.isVisible()) {
          initialPrice = await priceElement.textContent();
          break;
        }
      } catch (e) {}
    }

    console.log(`💰 Precio inicial mostrado: ${initialPrice}`);

    // Buscar opciones de ancho
    const widthButtons = await modal.locator('button:has-text("mm")').all();
    console.log(`📏 Opciones de ancho encontradas: ${widthButtons.length}`);

    for (let i = 0; i < widthButtons.length; i++) {
      const buttonText = await widthButtons[i].textContent();
      console.log(`  📐 Opción ${i + 1}: ${buttonText}`);
    }

    // Probar selección de 18mm
    let button18mm = null;
    for (const button of widthButtons) {
      const text = await button.textContent();
      if (text && text.includes('18mm')) {
        button18mm = button;
        break;
      }
    }

    if (button18mm) {
      console.log('🎯 Seleccionando opción 18mm...');
      await button18mm.click();
      await page.waitForTimeout(2000);

      // Verificar precio después de seleccionar 18mm
      let priceAfter18mm = 'No encontrado';
      for (const selector of priceSelectors) {
        try {
          const priceElement = modal.locator(selector).first();
          if (await priceElement.isVisible()) {
            priceAfter18mm = await priceElement.textContent();
            break;
          }
        } catch (e) {}
      }

      console.log(`💰 Precio después de seleccionar 18mm: ${priceAfter18mm}`);

      // Verificar si el precio es correcto
      const expectedPrice = '$1,498.70';
      const expectedPriceAlt = '$1.498,70';
      
      if (priceAfter18mm.includes('1498') || priceAfter18mm.includes('1,498')) {
        console.log('✅ ¡CORRECCIÓN EXITOSA! El precio mostrado es correcto para 18mm');
        console.log(`   Esperado: ${expectedPrice} o ${expectedPriceAlt}`);
        console.log(`   Obtenido: ${priceAfter18mm}`);
      } else {
        console.log('⚠️  El precio aún no coincide exactamente');
        console.log(`   Esperado: ${expectedPrice} o ${expectedPriceAlt}`);
        console.log(`   Obtenido: ${priceAfter18mm}`);
      }

      // Tomar screenshot final
      await page.screenshot({ 
        path: 'modal-precio-18mm-corregido.png', 
        fullPage: true 
      });

    } else {
      console.log('❌ No se encontró botón de 18mm');
    }

    // Probar otras variantes si están disponibles
    const otherWidths = ['24mm', '36mm', '48mm'];
    for (const width of otherWidths) {
      let widthButton = null;
      for (const button of widthButtons) {
        const text = await button.textContent();
        if (text && text.includes(width)) {
          widthButton = button;
          break;
        }
      }

      if (widthButton) {
        console.log(`🧪 Probando ${width}...`);
        await widthButton.click();
        await page.waitForTimeout(1500);

        let priceAfterWidth = 'No encontrado';
        for (const selector of priceSelectors) {
          try {
            const priceElement = modal.locator(selector).first();
            if (await priceElement.isVisible()) {
              priceAfterWidth = await priceElement.textContent();
              break;
            }
          } catch (e) {}
        }

        console.log(`💰 Precio para ${width}: ${priceAfterWidth}`);
      }
    }

    console.log('✅ Test de verificación completado');

  } catch (error) {
    console.log('❌ Error durante el test:', error.message);
    await page.screenshot({ path: 'error-price-fix-test.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();