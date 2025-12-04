const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('🔍 Navegando a la página principal...');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    console.log('📦 Buscando productos de cinta papel...');
    const productCards = await page.locator('[data-testid="commercial-product-card"]').all();
    console.log(`Encontrados ${productCards.length} productos`);
    
    let cintaPapelFound = false;
    
    for (let i = 0; i < productCards.length; i++) {
      const card = productCards[i];
      const title = await card.locator('h3, .product-title, [class*="title"]').first().textContent();
      
      if (title && title.toLowerCase().includes('cinta') && title.toLowerCase().includes('papel')) {
        console.log(`🎯 Encontrado producto: "${title}"`);
        
        // Obtener precio antes de abrir modal
        const priceElement = await card.locator('[class*="price"], .text-orange-500, .font-bold').first();
        const priceText = await priceElement.textContent();
        console.log(`💰 Precio en tarjeta: ${priceText}`);
        
        // Click para abrir modal
        await card.click();
        await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
        
        console.log('📋 Modal abierto, extrayendo información detallada...');
        
        // Obtener título del modal
        const modalTitle = await page.locator('[role="dialog"] h2, [role="dialog"] h1, [role="dialog"] .text-xl').first().textContent();
        console.log(`📝 Título del modal: ${modalTitle}`);
        
        // Obtener precio del modal
        const modalPrice = await page.locator('[role="dialog"] [class*="price"], [role="dialog"] .text-orange-500, [role="dialog"] .font-bold').first().textContent();
        console.log(`💰 Precio en modal: ${modalPrice}`);
        
        // Buscar precio original (tachado)
        const originalPriceElements = await page.locator('[role="dialog"] [class*="line-through"], [role="dialog"] .line-through').all();
        if (originalPriceElements.length > 0) {
          const originalPrice = await originalPriceElements[0].textContent();
          console.log(`💸 Precio original (tachado): ${originalPrice}`);
        }
        
        // Buscar descuento
        const discountElements = await page.locator('[role="dialog"] [class*="discount"], [role="dialog"] .bg-red-500, [role="dialog"] .bg-orange-500').all();
        if (discountElements.length > 0) {
          const discount = await discountElements[0].textContent();
          console.log(`🏷️ Descuento: ${discount}`);
        }
        
        // Obtener opciones de ancho
        const widthOptions = await page.locator('[role="dialog"] button[class*="border"]').all();
        console.log(`📏 Opciones de ancho encontradas: ${widthOptions.length}`);
        
        for (let j = 0; j < widthOptions.length; j++) {
          const option = widthOptions[j];
          const optionText = await option.textContent();
          console.log(`  - Opción ${j + 1}: ${optionText}`);
          
          if (optionText && optionText.includes('18mm')) {
            console.log('🎯 Seleccionando opción 18mm...');
            await option.click();
            await page.waitForTimeout(1000);
            
            // Obtener precio después de seleccionar 18mm
            const newPrice = await page.locator('[role="dialog"] [class*="price"], [role="dialog"] .text-orange-500, [role="dialog"] .font-bold').first().textContent();
            console.log(`💰 Precio con 18mm: ${newPrice}`);
            
            // Buscar precio original actualizado
            const newOriginalPriceElements = await page.locator('[role="dialog"] [class*="line-through"], [role="dialog"] .line-through').all();
            if (newOriginalPriceElements.length > 0) {
              const newOriginalPrice = await newOriginalPriceElements[0].textContent();
              console.log(`💸 Precio original con 18mm (tachado): ${newOriginalPrice}`);
            }
            
            // Verificar cálculo del descuento
            console.log('\n🧮 VERIFICACIÓN DE CÁLCULOS:');
            console.log('Precio esperado original: $2.141');
            console.log('Precio esperado con descuento 30%: $1.498,70');
            console.log(`Precio actual mostrado: ${newPrice}`);
            
            break;
          }
        }
        
        cintaPapelFound = true;
        break;
      }
    }
    
    if (!cintaPapelFound) {
      console.log('❌ No se encontró ningún producto de cinta papel');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})();