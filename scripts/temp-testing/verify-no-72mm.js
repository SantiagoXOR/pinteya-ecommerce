const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🔍 Verificando que la opción de 72mm ya no esté disponible');
    
    // Navegar a la página principal
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Buscar productos de cinta papel
    const productCards = await page.locator('[data-testid="commercial-product-card"]').all();
    
    if (productCards.length === 0) {
      console.log('❌ No se encontraron productos');
      return;
    }

    // Buscar específicamente la cinta papel
    let cintaPapelFound = false;
    
    for (let i = 0; i < productCards.length; i++) {
      const card = productCards[i];
      const cardText = await card.textContent();
      
      if (cardText && cardText.toLowerCase().includes('cinta papel')) {
        console.log('✅ Encontrada cinta papel, haciendo clic...');
        await card.click();
        cintaPapelFound = true;
        break;
      }
    }

    if (!cintaPapelFound) {
      console.log('❌ No se encontró producto de cinta papel');
      return;
    }

    // Esperar a que aparezca el modal
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    console.log('✅ Modal abierto');

    // Verificar opciones de ancho disponibles
    const widthButtons = await page.locator('button:has-text("mm")').all();
    console.log(`📏 Opciones de ancho encontradas: ${widthButtons.length}`);

    const availableWidths = [];
    for (const button of widthButtons) {
      const text = await button.textContent();
      availableWidths.push(text);
      console.log(`   - ${text}`);
    }

    // Verificar que NO existe la opción de 72mm
    const has72mm = availableWidths.some(width => width && width.includes('72mm'));
    
    if (has72mm) {
      console.log('❌ ERROR: La opción de 72mm todavía está disponible');
    } else {
      console.log('✅ CORRECTO: La opción de 72mm ya no está disponible');
    }

    // Verificar que las opciones correctas están disponibles
    const expectedWidths = ['18mm', '24mm', '36mm', '48mm'];
    const allExpectedPresent = expectedWidths.every(expected => 
      availableWidths.some(available => available && available.includes(expected))
    );

    if (allExpectedPresent) {
      console.log('✅ CORRECTO: Todas las opciones esperadas están disponibles');
    } else {
      console.log('❌ ERROR: Faltan algunas opciones esperadas');
    }

    await page.waitForTimeout(3000);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();
