const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Capturar todos los logs de consola
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('📏 Related products data:') || 
        text.includes('📏 Available measures from related products:') ||
        text.includes('📏 Getting widths from related products:')) {
      console.log('🔍 RELATED PRODUCTS LOG:', text);
    }
  });

  try {
    console.log('🚀 Navegando a la página principal...');
    await page.goto('http://localhost:3000');
    
    console.log('⏳ Esperando que cargue la página...');
    await page.waitForTimeout(5000);

    console.log('🔍 Buscando productos...');
    // Intentar diferentes selectores
    let productCards = await page.locator('[data-testid="product-card"]').all();
    if (productCards.length === 0) {
      productCards = await page.locator('.product-card').all();
    }
    if (productCards.length === 0) {
      productCards = await page.locator('article').all();
    }
    console.log(`📦 Productos encontrados: ${productCards.length}`);

    let targetProduct = null;
    for (const card of productCards) {
      try {
        const title = await card.locator('h3').textContent();
        console.log(`📝 Título encontrado: ${title}`);
        if (title && title.toLowerCase().includes('cinta papel')) {
          console.log(`🎯 Producto encontrado: ${title}`);
          targetProduct = card;
          break;
        }
      } catch (e) {
        // Intentar con otros selectores
        try {
          const title = await card.locator('h2').textContent();
          console.log(`📝 Título encontrado (h2): ${title}`);
          if (title && title.toLowerCase().includes('cinta papel')) {
            console.log(`🎯 Producto encontrado: ${title}`);
            targetProduct = card;
            break;
          }
        } catch (e2) {
          console.log('⚠️ No se pudo obtener título del producto');
        }
      }
    }

    if (targetProduct) {
      console.log('🖱️ Haciendo clic en el producto...');
      await targetProduct.click();
      
      console.log('⏳ Esperando que aparezca el modal...');
      await page.waitForSelector('[data-testid="shop-detail-modal"]', { timeout: 5000 });
      
      console.log('⏳ Esperando logs de productos relacionados...');
      await page.waitForTimeout(5000);
      
      console.log('✅ Debug completado');
    } else {
      console.log('❌ No se encontró producto de cinta papel');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})();