const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
  // Capturar logs específicos
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('availableWidths') || 
        text.includes('variants.length') ||
        text.includes('hasWidthSelector') ||
        text.includes('widthOptions') ||
        text.includes('Getting widths from')) {
      console.log('🔍 LOG:', text);
    }
  });
  
  try {
    console.log('🚀 Navegando a la página principal...');
    await page.goto('http://localhost:3000', { 
      waitUntil: 'domcontentloaded',
      timeout: 10000 
    });
    
    console.log('⏳ Esperando que cargue la página...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Buscar y hacer click en cualquier producto
    console.log('🔍 Buscando productos...');
    const products = await page.$$('article, div[class*="card"], div[class*="product"]');
    console.log(`📦 Productos encontrados: ${products.length}`);
    
    if (products.length > 0) {
      console.log('🖱️ Haciendo click en el primer producto...');
      await products[0].click();
      
      console.log('⏳ Esperando logs del modal...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})();