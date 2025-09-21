const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🌐 Navegando a la página de demo...');
  await page.goto('http://localhost:3000/demo/commercial-product-card');
  await page.waitForLoadState('networkidle');
  
  // Verificar el título de la página
  const title = await page.title();
  console.log('📄 Título de la página:', title);
  
  // Verificar si hay errores 404 o de carga
  const url = page.url();
  console.log('🔗 URL actual:', url);
  
  // Buscar todos los elementos con data-testid
  const testIds = await page.evaluate(() => {
    const elements = document.querySelectorAll('[data-testid]');
    return Array.from(elements).map(el => ({
      testId: el.getAttribute('data-testid'),
      tagName: el.tagName,
      className: el.className
    }));
  });
  
  console.log('🎯 Elementos con data-testid encontrados:', testIds);
  
  // Buscar específicamente elementos con data-testid-commercial
  const commercialTestIds = await page.evaluate(() => {
    const elements = document.querySelectorAll('[data-testid-commercial]');
    return Array.from(elements).map(el => ({
      testId: el.getAttribute('data-testid-commercial'),
      tagName: el.tagName,
      className: el.className,
      visible: el.offsetWidth > 0 && el.offsetHeight > 0
    }));
  });
  
  console.log('🏪 Elementos con data-testid-commercial encontrados:', commercialTestIds);
  
  // Verificar si CommercialProductCard está en el DOM
  const commercialCards = await page.locator('*').filter({ hasText: 'CommercialProductCard' }).count();
  console.log('🛍️ Elementos que contienen "CommercialProductCard":', commercialCards);
  
  // Verificar el HTML completo de la página (primeros 2000 caracteres)
  const htmlContent = await page.content();
  console.log('📝 Contenido HTML (primeros 500 chars):', htmlContent.substring(0, 500));
  
  // Buscar cualquier elemento que pueda ser una tarjeta de producto
  const productCards = await page.evaluate(() => {
    const possibleCards = document.querySelectorAll('[class*="card"], [class*="product"], div[class*="bg-white"]');
    return Array.from(possibleCards).map(el => ({
      className: el.className,
      tagName: el.tagName,
      hasImage: el.querySelector('img') !== null,
      hasPrice: el.textContent.includes('$') || el.textContent.includes('precio'),
      visible: el.offsetWidth > 0 && el.offsetHeight > 0
    }));
  });
  
  console.log('🃏 Posibles tarjetas de producto encontradas:', productCards.slice(0, 5));
  
  await browser.close();
})();