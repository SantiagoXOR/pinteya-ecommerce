const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Iniciando debug detallado del modal...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Capturar todos los logs de consola
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('🔍 Calculando availableWidths') || 
        text.includes('productType.hasWidthSelector') ||
        text.includes('productType.widthOptions') ||
        text.includes('relatedProducts') ||
        text.includes('variants.length') ||
        text.includes('No hasWidthSelector') ||
        text.includes('No hay opciones de ancho') ||
        text.includes('Using fallback widths')) {
      console.log('🔍 DETAILED LOG:', text);
    }
  });
  
  console.log('📍 Navegando a la página principal...');
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(3000);
  
  console.log('🔍 Buscando producto de cinta papel...');
  const productCard = page.locator('[data-testid="commercial-product-card"]').filter({ hasText: 'Cinta Papel' }).first();
  
  if (await productCard.count() > 0) {
    console.log('✅ Producto encontrado, haciendo click...');
    await productCard.click();
    
    console.log('⏳ Esperando logs del modal...');
    await page.waitForTimeout(8000);
  } else {
    console.log('❌ No se encontró el producto de cinta papel');
  }
  
  await browser.close();
  console.log('✅ Debug completado');
})();