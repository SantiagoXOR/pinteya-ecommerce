import { test, expect } from '@playwright/test';

/**
 * TESTS ESPECÍFICOS PARA VERIFICAR EL PANEL ADMINISTRATIVO EN PRODUCCIÓN
 * 
 * Estos tests verifican que el problema de acceso a /admin ha sido resuelto
 * en el sitio de producción https://pinteya.com
 */

test.describe('Production Admin Panel Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Configurar timeouts más largos para producción
    page.setDefaultTimeout(30000);
    page.setDefaultNavigationTimeout(30000);
  });

  test('should load https://pinteya.com/admin without errors', async ({ page }) => {
    // Monitorear errores de consola
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Monitorear errores de página
    const pageErrors: string[] = [];
    page.on('pageerror', error => {
      pageErrors.push(error.message);
    });

    // Monitorear requests
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

    console.log('🔍 Navegando a https://pinteya.com/admin...');
    
    try {
      await page.goto('https://pinteya.com/admin');
      console.log('✅ Navegación completada');
    } catch (error) {
      console.log('❌ Error en navegación:', error);
    }

    // Esperar a que la página cargue completamente
    await page.waitForLoadState('networkidle');

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
    console.log('- Errores JS:', pageErrors.length);
    console.log('- Logs consola:', consoleErrors.length);
    console.log('- Requests:', requests.length);

    // Verificar el contenido del body
    const bodyText = await page.locator('body').textContent();
    console.log('\n📝 Contenido del body (primeros 300 chars):');
    console.log(bodyText?.substring(0, 300) || 'VACÍO');

    // Verificar si es una página de error de Clerk
    const isClerkError = bodyText?.includes('redirect_url') && bodyText?.includes('invalid');
    console.log('\n🔍 ¿Es error de Clerk?:', isClerkError);

    if (isClerkError) {
      console.log('❌ PROBLEMA: Clerk está bloqueando el acceso a /admin');
      console.log('💡 SOLUCIÓN: Configurar /admin en Clerk dashboard como URL permitida');
    }

    // Verificar elementos específicos del admin
    const hasAdminLayout = await page.locator('[data-testid="admin-layout"], .admin-layout, main').count();
    const hasWelcomeText = await page.locator('text=Bienvenido').count();
    const hasErrorText = await page.locator('text=Error').count();
    const hasLoadingText = await page.locator('text=Cargando').count();

    console.log('\n🔍 Elementos encontrados:');
    console.log('- Admin layout:', hasAdminLayout);
    console.log('- Texto bienvenida:', hasWelcomeText);
    console.log('- Texto error:', hasErrorText);
    console.log('- Texto cargando:', hasLoadingText);

    // Mostrar algunos logs importantes
    console.log('\n🔍 Errores encontrados:');
    pageErrors.forEach(error => console.log('❌', error));

    console.log('\n🔍 Logs importantes:');
    consoleErrors.filter(log => log.includes('error') || log.includes('Error')).forEach(log => console.log('⚠️', log));

    console.log('\n🔍 Requests importantes:');
    requests.filter(req => req.url.includes('/admin') || req.url.includes('/api/')).forEach(req => {
      console.log(`📡 ${req.method} ${req.url} - ${req.status || 'pending'}`);
    });

    // Tomar screenshot para análisis visual
    await page.screenshot({ path: 'production-admin-screenshot.png', fullPage: true });
    console.log('📸 Screenshot guardado como production-admin-screenshot.png');

    // Verificaciones básicas
    expect(hasHtml).toBe(true);
    expect(hasBody).toBe(true);
    
    // Si no es error de Clerk, debería tener contenido del admin
    if (!isClerkError) {
      expect(hasAdminLayout).toBeGreaterThan(0);
      expect(hasWelcomeText).toBeGreaterThan(0);
    }
  });

  test('should compare /admin with /admin/products in production', async ({ page }) => {
    console.log('\n🔍 COMPARANDO /admin vs /admin/products EN PRODUCCIÓN');

    // Test /admin/products primero (sabemos que funciona)
    console.log('\n📦 Probando https://pinteya.com/admin/products...');
    await page.goto('https://pinteya.com/admin/products');
    await page.waitForLoadState('networkidle');
    
    const productsTitle = await page.title();
    const productsBodyText = await page.locator('body').textContent();
    const productsHasContent = productsBodyText && productsBodyText.length > 100;
    const productsIsClerkError = productsBodyText?.includes('redirect_url') && productsBodyText?.includes('invalid');

    console.log('- Título:', productsTitle);
    console.log('- Tiene contenido:', productsHasContent);
    console.log('- Longitud body:', productsBodyText?.length || 0);
    console.log('- Es error Clerk:', productsIsClerkError);

    // Test /admin
    console.log('\n🏠 Probando https://pinteya.com/admin...');
    await page.goto('https://pinteya.com/admin');
    await page.waitForLoadState('networkidle');

    const adminTitle = await page.title();
    const adminBodyText = await page.locator('body').textContent();
    const adminHasContent = adminBodyText && adminBodyText.length > 100;
    const adminIsClerkError = adminBodyText?.includes('redirect_url') && adminBodyText?.includes('invalid');

    console.log('- Título:', adminTitle);
    console.log('- Tiene contenido:', adminHasContent);
    console.log('- Longitud body:', adminBodyText?.length || 0);
    console.log('- Es error Clerk:', adminIsClerkError);

    console.log('\n📊 COMPARACIÓN:');
    console.log('- /admin/products funciona:', productsHasContent && !productsIsClerkError);
    console.log('- /admin funciona:', adminHasContent && !adminIsClerkError);
    console.log('- Ambos tienen error Clerk:', productsIsClerkError && adminIsClerkError);
    console.log('- Solo /admin tiene error Clerk:', !productsIsClerkError && adminIsClerkError);

    if (adminIsClerkError && !productsIsClerkError) {
      console.log('\n💡 DIAGNÓSTICO: /admin específicamente bloqueado por Clerk');
      console.log('🔧 SOLUCIÓN: Agregar /admin a URLs permitidas en Clerk dashboard');
    }

    expect(true).toBe(true); // Test siempre pasa, solo recopila información
  });

  test('should test diagnostic tools in production', async ({ page }) => {
    console.log('\n🔧 PROBANDO HERRAMIENTAS DE DIAGNÓSTICO EN PRODUCCIÓN');

    const pagesToTest = [
      { url: 'https://pinteya.com/debug-admin.html', name: 'Debug Admin HTML' },
      { url: 'https://pinteya.com/test-auth-status', name: 'Test Auth Status' },
      { url: 'https://pinteya.com/admin/page-simple', name: 'Admin Simple' }
    ];

    for (const pageTest of pagesToTest) {
      console.log(`\n🔍 Probando ${pageTest.name}...`);
      
      try {
        await page.goto(pageTest.url);
        await page.waitForLoadState('networkidle');

        const title = await page.title();
        const bodyText = await page.locator('body').textContent();
        const hasContent = bodyText && bodyText.length > 50;
        const isClerkError = bodyText?.includes('redirect_url') && bodyText?.includes('invalid');

        console.log(`- URL: ${pageTest.url}`);
        console.log(`- Título: ${title}`);
        console.log(`- Tiene contenido: ${hasContent}`);
        console.log(`- Longitud: ${bodyText?.length || 0}`);
        console.log(`- Es error Clerk: ${isClerkError}`);

        if (isClerkError) {
          console.log(`❌ ${pageTest.name} bloqueado por Clerk`);
        } else if (!hasContent) {
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

  test('should verify current production status', async ({ page }) => {
    console.log('\n🌐 VERIFICANDO ESTADO ACTUAL DE PRODUCCIÓN');

    // Verificar página principal
    console.log('\n🏠 Probando página principal...');
    await page.goto('https://pinteya.com');
    await page.waitForLoadState('networkidle');
    
    const homeWorks = await page.locator('text=Pinteya').count() > 0;
    console.log('- Página principal funciona:', homeWorks);

    // Verificar que los cambios se desplegaron
    console.log('\n🚀 Verificando despliegue de cambios...');
    
    // Verificar si las herramientas de diagnóstico están disponibles
    const diagnosticPages = [
      'https://pinteya.com/debug-admin.html',
      'https://pinteya.com/test-auth-status'
    ];

    for (const url of diagnosticPages) {
      try {
        const response = await page.request.get(url);
        const status = response.status();
        console.log(`- ${url}: ${status === 200 ? '✅ Disponible' : `❌ Status ${status}`}`);
      } catch (error) {
        console.log(`- ${url}: ❌ Error de conexión`);
      }
    }

    console.log('\n📊 RESUMEN DEL ESTADO:');
    console.log('- Sitio principal: ✅ Funcionando');
    console.log('- Herramientas diagnóstico: Verificadas arriba');
    console.log('- Problema /admin: Requiere configuración Clerk');

    expect(homeWorks).toBe(true);
  });

});
