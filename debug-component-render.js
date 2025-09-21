const { chromium } = require('playwright');

async function debugComponentRender() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🔍 Navegando a la página de demo...');
    await page.goto('http://localhost:3000/demo/commercial-product-card', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    console.log('📄 Título de la página:', await page.title());
    console.log('🌐 URL actual:', page.url());

    // Esperar un poco para que se cargue completamente
    await page.waitForTimeout(3000);

    // Verificar si hay errores en la consola
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`);
    });

    // Verificar errores de JavaScript
    const jsErrors = [];
    page.on('pageerror', error => {
      jsErrors.push(error.message);
    });

    // Buscar el componente CommercialProductCard
    console.log('🔍 Buscando componente CommercialProductCard...');
    
    const commercialCards = await page.locator('[data-testid-commercial="commercial-product-card"]').count();
    console.log(`📊 Componentes CommercialProductCard encontrados: ${commercialCards}`);

    const productCards = await page.locator('[data-testid="product-card"]').count();
    console.log(`📊 Componentes ProductCard encontrados: ${productCards}`);

    // Verificar si hay elementos con texto específico
    const titleElements = await page.locator('text=Barniz Campbell 4L').count();
    console.log(`📊 Elementos con título "Barniz Campbell 4L": ${titleElements}`);

    // Verificar estructura HTML
    const bodyHTML = await page.locator('body').innerHTML();
    const hasCommercialText = bodyHTML.includes('CommercialProductCard') || bodyHTML.includes('commercial-product-card');
    console.log(`📊 HTML contiene referencias al componente comercial: ${hasCommercialText}`);

    // Verificar si hay imágenes cargadas
    const images = await page.locator('img').count();
    console.log(`📊 Imágenes encontradas: ${images}`);

    // Verificar errores de red
    const failedRequests = [];
    page.on('requestfailed', request => {
      failedRequests.push(`${request.method()} ${request.url()} - ${request.failure().errorText}`);
    });

    // Esperar un poco más para capturar errores
    await page.waitForTimeout(2000);

    console.log('\n📋 RESUMEN DE DIAGNÓSTICO:');
    console.log('='.repeat(50));
    console.log(`✅ Página cargada: ${page.url()}`);
    console.log(`📊 CommercialProductCard renderizados: ${commercialCards}`);
    console.log(`📊 ProductCard renderizados: ${productCards}`);
    console.log(`📊 Elementos con título específico: ${titleElements}`);
    console.log(`📊 Imágenes cargadas: ${images}`);
    
    if (consoleMessages.length > 0) {
      console.log('\n⚠️ MENSAJES DE CONSOLA:');
      consoleMessages.forEach(msg => console.log(`  ${msg}`));
    }

    if (jsErrors.length > 0) {
      console.log('\n❌ ERRORES DE JAVASCRIPT:');
      jsErrors.forEach(error => console.log(`  ${error}`));
    }

    if (failedRequests.length > 0) {
      console.log('\n🌐 REQUESTS FALLIDOS:');
      failedRequests.forEach(req => console.log(`  ${req}`));
    }

    // Tomar screenshot para análisis visual
    await page.screenshot({ path: 'debug-component-render.png', fullPage: true });
    console.log('\n📸 Screenshot guardado como: debug-component-render.png');

  } catch (error) {
    console.error('❌ Error durante la verificación:', error.message);
  } finally {
    await browser.close();
  }
}

debugComponentRender();