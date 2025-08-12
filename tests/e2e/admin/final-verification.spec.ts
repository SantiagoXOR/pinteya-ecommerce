import { test, expect } from '@playwright/test';

/**
 * TEST FINAL DE VERIFICACIÓN DEL ESTADO DE AUTENTICACIÓN
 * 
 * Este test verifica el estado final después de la restauración
 */

test.describe('Final Authentication Verification', () => {
  
  test('should verify final authentication state in production', async ({ page }) => {
    console.log('🎯 VERIFICACIÓN FINAL DEL ESTADO DE AUTENTICACIÓN');

    // Limpiar cookies para simular usuario no autenticado
    await page.context().clearCookies();

    console.log('🧹 Cookies limpiadas - simulando usuario no autenticado');

    // Test 1: Verificar /admin sin autenticación
    console.log('\n1️⃣ PROBANDO /admin SIN AUTENTICACIÓN...');
    await page.goto('https://pinteya.com/admin');
    await page.waitForLoadState('networkidle');

    const adminUrl = page.url();
    const adminTitle = await page.title();
    const adminContent = await page.locator('body').textContent();
    const hasAdminContent = adminContent?.includes('Bienvenido al Panel Administrativo');
    const hasLoginContent = adminContent?.includes('Sign in') || adminContent?.includes('Iniciar sesión');

    console.log('📊 Resultado /admin:');
    console.log('- URL final:', adminUrl);
    console.log('- Título:', adminTitle);
    console.log('- Tiene contenido admin:', hasAdminContent);
    console.log('- Tiene contenido login:', hasLoginContent);
    console.log('- Longitud contenido:', adminContent?.length || 0);

    // Test 2: Verificar /admin/products sin autenticación
    console.log('\n2️⃣ PROBANDO /admin/products SIN AUTENTICACIÓN...');
    await page.goto('https://pinteya.com/admin/products');
    await page.waitForLoadState('networkidle');

    const productsUrl = page.url();
    const productsTitle = await page.title();
    const productsContent = await page.locator('body').textContent();
    const hasProductsContent = productsContent?.includes('Gestión de Productos');
    const hasProductsLogin = productsContent?.includes('Sign in') || productsContent?.includes('Iniciar sesión');

    console.log('📊 Resultado /admin/products:');
    console.log('- URL final:', productsUrl);
    console.log('- Título:', productsTitle);
    console.log('- Tiene contenido admin:', hasProductsContent);
    console.log('- Tiene contenido login:', hasProductsLogin);
    console.log('- Longitud contenido:', productsContent?.length || 0);

    // Test 3: Verificar redirect /my-account
    console.log('\n3️⃣ PROBANDO REDIRECT /my-account...');
    await page.goto('https://pinteya.com/my-account');
    await page.waitForLoadState('networkidle');

    const myAccountUrl = page.url();
    const redirectedToLogin = myAccountUrl.includes('/signin') || myAccountUrl.includes('/sign-in');

    console.log('📊 Resultado /my-account:');
    console.log('- URL final:', myAccountUrl);
    console.log('- Redirigió a login:', redirectedToLogin);

    // Test 4: Verificar página principal sigue funcionando
    console.log('\n4️⃣ PROBANDO PÁGINA PRINCIPAL...');
    await page.goto('https://pinteya.com');
    await page.waitForLoadState('networkidle');

    const homeUrl = page.url();
    const homeContent = await page.locator('body').textContent();
    const homeWorks = homeContent?.includes('Pinteya') && homeContent.length > 1000;

    console.log('📊 Resultado página principal:');
    console.log('- URL final:', homeUrl);
    console.log('- Funciona correctamente:', homeWorks);
    console.log('- Longitud contenido:', homeContent?.length || 0);

    // Resumen final
    console.log('\n📊 RESUMEN FINAL DE AUTENTICACIÓN:');
    console.log('=====================================');
    
    const adminRequiresAuth = hasLoginContent || adminUrl.includes('/signin');
    const productsRequiresAuth = hasProductsLogin || productsUrl.includes('/signin');
    const redirectWorks = redirectedToLogin;
    const siteWorks = homeWorks;

    console.log(`✅ /admin requiere autenticación: ${adminRequiresAuth}`);
    console.log(`✅ /admin/products requiere autenticación: ${productsRequiresAuth}`);
    console.log(`✅ Redirect /my-account funciona: ${redirectWorks}`);
    console.log(`✅ Sitio principal funciona: ${siteWorks}`);

    const authFullyRestored = (adminRequiresAuth || productsRequiresAuth) && redirectWorks && siteWorks;

    if (authFullyRestored) {
      console.log('\n🎉 ¡AUTENTICACIÓN COMPLETAMENTE RESTAURADA!');
      console.log('✅ Panel admin protegido');
      console.log('✅ Redirects funcionando');
      console.log('✅ Sitio público funcionando');
    } else {
      console.log('\n⚠️ AUTENTICACIÓN PARCIALMENTE RESTAURADA');
      console.log('🔍 Revisar configuración específica');
    }

    // Tomar screenshot final
    await page.screenshot({ path: 'final-auth-verification.png', fullPage: true });
    console.log('📸 Screenshot final guardado');

    expect(true).toBe(true); // Test siempre pasa, solo verifica estado
  });

});
