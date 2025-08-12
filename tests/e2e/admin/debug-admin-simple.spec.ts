import { test, expect } from '@playwright/test';

/**
 * TEST SIMPLE PARA DEBUGGEAR EL PROBLEMA DE /admin
 */

test.describe('Debug Admin Simple', () => {
  
  test('should capture what happens when accessing /admin', async ({ page }) => {
    // Configurar timeouts más largos
    page.setDefaultTimeout(30000);
    page.setDefaultNavigationTimeout(30000);

    // Capturar todos los logs
    const logs: string[] = [];
    page.on('console', msg => {
      logs.push(`[${msg.type()}] ${msg.text()}`);
    });

    // Capturar errores
    const errors: string[] = [];
    page.on('pageerror', error => {
      errors.push(error.message);
    });

    // Capturar requests
    const requests: { url: string; status?: number; method: string }[] = [];
    page.on('request', request => {
      requests.push({
        url: request.url(),
        method: request.method()
      });
    });

    page.on('response', response => {
      const req = requests.find(r => r.url === response.url());
      if (req) {
        req.status = response.status();
      }
    });

    console.log('🔍 Navegando a /admin...');
    
    try {
      await page.goto('/admin');
      console.log('✅ Navegación completada');
    } catch (error) {
      console.log('❌ Error en navegación:', error);
    }

    // Esperar un poco para que la página se cargue
    await page.waitForTimeout(5000);

    // Capturar el HTML de la página
    const html = await page.content();
    console.log('📄 HTML length:', html.length);

    // Verificar si hay contenido básico
    const hasHtml = html.includes('<html');
    const hasBody = html.includes('<body');
    const hasTitle = await page.title();

    console.log('📊 Análisis de página:');
    console.log('- Tiene HTML:', hasHtml);
    console.log('- Tiene BODY:', hasBody);
    console.log('- Título:', hasTitle);
    console.log('- Errores JS:', errors.length);
    console.log('- Logs consola:', logs.length);
    console.log('- Requests:', requests.length);

    // Mostrar algunos logs importantes
    console.log('\n🔍 Errores encontrados:');
    errors.forEach(error => console.log('❌', error));

    console.log('\n🔍 Logs importantes:');
    logs.filter(log => log.includes('error') || log.includes('Error')).forEach(log => console.log('⚠️', log));

    console.log('\n🔍 Requests importantes:');
    requests.filter(req => req.url.includes('/admin') || req.url.includes('/api/')).forEach(req => {
      console.log(`📡 ${req.method} ${req.url} - ${req.status || 'pending'}`);
    });

    // Verificar si la página está completamente en blanco
    const bodyText = await page.locator('body').textContent();
    console.log('\n📝 Contenido del body (primeros 200 chars):');
    console.log(bodyText?.substring(0, 200) || 'VACÍO');

    // Intentar encontrar elementos específicos
    const hasAdminLayout = await page.locator('[data-testid="admin-layout"], .admin-layout, main').count();
    const hasWelcomeText = await page.locator('text=Bienvenido').count();
    const hasErrorText = await page.locator('text=Error').count();
    const hasLoadingText = await page.locator('text=Cargando').count();

    console.log('\n🔍 Elementos encontrados:');
    console.log('- Admin layout:', hasAdminLayout);
    console.log('- Texto bienvenida:', hasWelcomeText);
    console.log('- Texto error:', hasErrorText);
    console.log('- Texto cargando:', hasLoadingText);

    // Tomar screenshot para análisis visual
    await page.screenshot({ path: 'debug-admin-screenshot.png', fullPage: true });
    console.log('📸 Screenshot guardado como debug-admin-screenshot.png');

    // El test siempre pasa, solo recopila información
    expect(true).toBe(true);
  });

  test('should compare /admin with /admin/products', async ({ page }) => {
    console.log('\n🔍 COMPARANDO /admin vs /admin/products');

    // Test /admin/products primero (sabemos que funciona)
    console.log('\n📦 Probando /admin/products...');
    await page.goto('/admin/products');
    await page.waitForTimeout(3000);

    const productsTitle = await page.title();
    const productsBodyText = await page.locator('body').textContent();
    const productsHasContent = productsBodyText && productsBodyText.length > 100;

    console.log('- Título:', productsTitle);
    console.log('- Tiene contenido:', productsHasContent);
    console.log('- Longitud body:', productsBodyText?.length || 0);

    // Test /admin
    console.log('\n🏠 Probando /admin...');
    await page.goto('/admin');
    await page.waitForTimeout(3000);

    const adminTitle = await page.title();
    const adminBodyText = await page.locator('body').textContent();
    const adminHasContent = adminBodyText && adminBodyText.length > 100;

    console.log('- Título:', adminTitle);
    console.log('- Tiene contenido:', adminHasContent);
    console.log('- Longitud body:', adminBodyText?.length || 0);

    console.log('\n📊 COMPARACIÓN:');
    console.log('- /admin/products funciona:', productsHasContent);
    console.log('- /admin funciona:', adminHasContent);
    console.log('- Diferencia de contenido:', (productsBodyText?.length || 0) - (adminBodyText?.length || 0));

    expect(true).toBe(true);
  });

  test('should test diagnostic pages', async ({ page }) => {
    console.log('\n🔧 PROBANDO PÁGINAS DE DIAGNÓSTICO');

    const pagesToTest = [
      { url: '/debug-admin.html', name: 'Debug Admin HTML' },
      { url: '/test-auth-status', name: 'Test Auth Status' },
      { url: '/admin/page-simple', name: 'Admin Simple' }
    ];

    for (const pageTest of pagesToTest) {
      console.log(`\n🔍 Probando ${pageTest.name}...`);
      
      try {
        await page.goto(pageTest.url);
        await page.waitForTimeout(2000);

        const title = await page.title();
        const bodyText = await page.locator('body').textContent();
        const hasContent = bodyText && bodyText.length > 50;

        console.log(`- URL: ${pageTest.url}`);
        console.log(`- Título: ${title}`);
        console.log(`- Tiene contenido: ${hasContent}`);
        console.log(`- Longitud: ${bodyText?.length || 0}`);

        if (!hasContent) {
          console.log(`❌ ${pageTest.name} no tiene contenido`);
        } else {
          console.log(`✅ ${pageTest.name} funciona`);
        }
      } catch (error) {
        console.log(`❌ Error en ${pageTest.name}:`, error);
      }
    }

    expect(true).toBe(true);
  });

});
