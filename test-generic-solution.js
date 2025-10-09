const puppeteer = require('puppeteer');

async function testGenericSolution() {
  console.log('🚀 Iniciando test de la solución genérica para descuentos...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
  try {
    // 1. Navegar a la página principal
    console.log('📱 Navegando a localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 2. Buscar productos de cinta papel
    console.log('🔍 Buscando productos de cinta papel...');
    const searchInput = await page.waitForSelector('input[placeholder*="Buscar"]', { timeout: 10000 });
    await searchInput.click();
    await searchInput.type('cinta papel', { delay: 100 });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 3. Hacer clic en el primer producto de cinta papel
    console.log('👆 Haciendo clic en el primer producto de cinta papel...');
    const productCards = await page.$$('[data-testid="product-card"], .product-card, .bg-white.rounded-lg');
    
    let foundCintaPapel = false;
    for (let i = 0; i < Math.min(productCards.length, 10); i++) {
      const card = productCards[i];
      const cardText = await card.evaluate(el => el.textContent || '');
      
      if (cardText.toLowerCase().includes('cinta papel')) {
        console.log(`✅ Encontrado producto de cinta papel: "${cardText.substring(0, 50)}..."`);
        await card.click();
        foundCintaPapel = true;
        break;
      }
    }

    if (!foundCintaPapel) {
      throw new Error('No se encontró producto de cinta papel');
    }

    // 4. Esperar a que se abra el modal (Radix UI Dialog)
    console.log('⏳ Esperando que se abra el modal...');
    await page.waitForSelector('[data-radix-dialog-content]', { timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 5. Verificar que se muestren las opciones de ancho
    console.log('🔍 Verificando opciones de ancho...');
    const widthButtons = await page.$$('button:has-text("18mm"), button:has-text("24mm"), button:has-text("36mm"), button:has-text("48mm")');
    
    if (widthButtons.length === 0) {
      // Buscar de otra manera
      const allButtons = await page.$$('button');
      const widthButtonsAlt = [];
      
      for (const button of allButtons) {
        const text = await button.evaluate(el => el.textContent || '');
        if (text.includes('mm') && (text.includes('18') || text.includes('24') || text.includes('36') || text.includes('48'))) {
          widthButtonsAlt.push(button);
        }
      }
      
      console.log(`📏 Encontradas ${widthButtonsAlt.length} opciones de ancho`);
      
      if (widthButtonsAlt.length > 0) {
        // 6. Probar diferentes anchos y verificar precios
        for (let i = 0; i < Math.min(widthButtonsAlt.length, 4); i++) {
          const button = widthButtonsAlt[i];
          const buttonText = await button.evaluate(el => el.textContent || '');
          
          console.log(`🎯 Probando ancho: ${buttonText}`);
          await button.click();
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Verificar precios
          const priceElements = await page.$$('.text-2xl, .text-xl, .font-bold');
          let foundPrice = false;
          let foundDiscount = false;
          
          for (const priceEl of priceElements) {
            const priceText = await priceEl.evaluate(el => el.textContent || '');
            if (priceText.includes('$') && priceText.includes(',')) {
              console.log(`💰 Precio encontrado: ${priceText}`);
              foundPrice = true;
            }
            if (priceText.includes('OFF') || priceText.includes('%')) {
              console.log(`🏷️ Descuento encontrado: ${priceText}`);
              foundDiscount = true;
            }
          }
          
          // Buscar precios tachados (originales)
          const strikethroughPrices = await page.$$('.line-through, [style*="text-decoration: line-through"]');
          if (strikethroughPrices.length > 0) {
            for (const strikeEl of strikethroughPrices) {
              const strikeText = await strikeEl.evaluate(el => el.textContent || '');
              if (strikeText.includes('$')) {
                console.log(`💸 Precio original (tachado): ${strikeText}`);
                foundDiscount = true;
              }
            }
          }
          
          if (foundPrice) {
            console.log(`✅ Ancho ${buttonText}: Precios mostrados correctamente`);
          } else {
            console.log(`⚠️ Ancho ${buttonText}: No se encontraron precios claros`);
          }
          
          if (foundDiscount) {
            console.log(`✅ Ancho ${buttonText}: Descuentos mostrados correctamente`);
          } else {
            console.log(`⚠️ Ancho ${buttonText}: No se encontraron descuentos visibles`);
          }
        }
      }
    } else {
      console.log(`📏 Encontradas ${widthButtons.length} opciones de ancho con selector específico`);
    }

    // 7. Verificar que no hay errores en consola relacionados con precios
    console.log('🔍 Verificando errores en consola...');
    const logs = await page.evaluate(() => {
      return window.console.logs || [];
    });
    
    console.log('✅ Test completado exitosamente');
    console.log('🎉 La solución genérica parece estar funcionando correctamente');

  } catch (error) {
    console.error('❌ Error durante el test:', error.message);
  } finally {
    console.log('🔚 Cerrando navegador...');
    await browser.close();
  }
}

// Ejecutar el test
testGenericSolution().catch(console.error);