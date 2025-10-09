const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Iniciando debug de logs del modal...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Capturar todos los logs de consola
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('🎯 ShopDetailModal') || 
        text.includes('Product Type Detection') ||
        text.includes('Has width selector') ||
        text.includes('Width options')) {
      console.log('🔍 DEBUG LOG:', text);
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
    await page.waitForTimeout(5000);
  } else {
    console.log('❌ No se encontró el producto de cinta papel');
  }
  
  await browser.close();
  console.log('✅ Debug completado');
})();