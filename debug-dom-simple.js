const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🚀 Navegando a la página principal...');
    await page.goto('http://localhost:3000');
    
    console.log('⏳ Esperando que cargue la página...');
    await page.waitForTimeout(8000);

    console.log('🔍 Inspeccionando el DOM...');
    
    // Obtener todo el HTML de la página
    const bodyHTML = await page.locator('body').innerHTML();
    console.log('📄 Longitud del HTML:', bodyHTML.length);
    
    // Buscar elementos que contengan "cinta"
    const elementsWithCinta = await page.locator('*:has-text("cinta")').all();
    console.log(`🔍 Elementos que contienen "cinta": ${elementsWithCinta.length}`);
    
    for (let i = 0; i < Math.min(elementsWithCinta.length, 5); i++) {
      const text = await elementsWithCinta[i].textContent();
      console.log(`📝 Elemento ${i + 1}: ${text?.substring(0, 100)}...`);
    }
    
    // Buscar elementos que contengan "papel"
    const elementsWithPapel = await page.locator('*:has-text("papel")').all();
    console.log(`🔍 Elementos que contienen "papel": ${elementsWithPapel.length}`);
    
    // Buscar todos los elementos clickeables
    const clickableElements = await page.locator('button, a, [role="button"], [onclick]').all();
    console.log(`🖱️ Elementos clickeables: ${clickableElements.length}`);
    
    // Buscar productos específicamente
    const productElements = await page.locator('[class*="product"], [data-testid*="product"], article, .card').all();
    console.log(`📦 Elementos tipo producto: ${productElements.length}`);
    
    if (productElements.length > 0) {
      for (let i = 0; i < Math.min(productElements.length, 3); i++) {
        const text = await productElements[i].textContent();
        console.log(`📦 Producto ${i + 1}: ${text?.substring(0, 150)}...`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})();