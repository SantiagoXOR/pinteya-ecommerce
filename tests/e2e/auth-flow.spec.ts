import { test, expect } from '@playwright/test';

test.describe('Flujo de Autenticación NextAuth.js', () => {
  test('debería cargar la página principal', async ({ page }) => {
    // Ir a la página principal
    await page.goto('http://localhost:3000');
    
    // Verificar que la página carga
    await expect(page).toHaveTitle(/Pinteya/);
    
    // Tomar screenshot
    await page.screenshot({ path: 'test-results/01-homepage.png' });
    
    console.log('✅ Página principal cargada correctamente');
  });

  test('debería mostrar la página de login', async ({ page }) => {
    // Ir directamente a la página de login
    await page.goto('http://localhost:3000/auth/signin');
    
    // Verificar que la página de login carga
    await expect(page.locator('text=Google')).toBeVisible();
    
    // Tomar screenshot
    await page.screenshot({ path: 'test-results/02-login-page.png' });
    
    console.log('✅ Página de login cargada correctamente');
  });

  test('debería iniciar el flujo de Google OAuth', async ({ page }) => {
    // Ir a la página de login
    await page.goto('http://localhost:3000/auth/signin');
    
    // Esperar a que aparezca el botón de Google
    const googleButton = page.locator('button:has-text("Google"), a:has-text("Google")').first();
    await expect(googleButton).toBeVisible();
    
    // Tomar screenshot antes del click
    await page.screenshot({ path: 'test-results/03-before-google-click.png' });
    
    // Hacer click en el botón de Google
    await googleButton.click();
    
    // Esperar a que se redirija (puede ser a Google o a una página de error)
    await page.waitForLoadState('networkidle');
    
    // Tomar screenshot después del click
    await page.screenshot({ path: 'test-results/04-after-google-click.png' });
    
    // Verificar la URL actual
    const currentUrl = page.url();
    console.log('🔗 URL actual después del click:', currentUrl);
    
    // Verificar si nos redirigió a Google o a una página de error
    if (currentUrl.includes('accounts.google.com')) {
      console.log('✅ Redirección a Google OAuth exitosa');
      
      // Verificar elementos de la página de Google
      await expect(page.locator('input[type="email"], input[type="text"]')).toBeVisible();
      console.log('✅ Página de login de Google cargada');
      
    } else if (currentUrl.includes('/auth/error')) {
      console.log('⚠️ Redirigido a página de error');
      
      // Capturar el error
      const errorText = await page.textContent('body');
      console.log('❌ Error encontrado:', errorText);
      
    } else {
      console.log('🤔 Redirección inesperada a:', currentUrl);
    }
  });

  test('debería manejar el callback de Google', async ({ page }) => {
    // Simular un callback de Google (esto requeriría credenciales reales)
    // Por ahora, solo verificamos que la ruta existe
    
    const callbackUrl = 'http://localhost:3000/api/auth/callback/google?code=test&state=test';
    
    // Ir al callback (esto debería mostrar un error de configuración)
    await page.goto(callbackUrl);
    
    // Esperar a que se procese
    await page.waitForLoadState('networkidle');
    
    // Tomar screenshot
    await page.screenshot({ path: 'test-results/05-callback-test.png' });
    
    const currentUrl = page.url();
    console.log('🔗 URL después del callback simulado:', currentUrl);
    
    // Verificar si nos redirige a error o a la página principal
    if (currentUrl.includes('/auth/error')) {
      console.log('⚠️ Callback redirigió a página de error (esperado sin credenciales válidas)');
    } else if (currentUrl === 'http://localhost:3000/') {
      console.log('✅ Callback exitoso - redirigido a página principal');
    } else {
      console.log('🤔 Callback redirigió a:', currentUrl);
    }
  });

  test('debería verificar el estado de la sesión', async ({ page }) => {
    // Ir a la página principal
    await page.goto('http://localhost:3000');
    
    // Verificar el endpoint de sesión
    const sessionResponse = await page.request.get('http://localhost:3000/api/auth/session');
    const sessionData = await sessionResponse.json();
    
    console.log('📊 Estado de la sesión:', sessionData);
    console.log('🔐 Usuario autenticado:', !!sessionData.user);
    
    // Tomar screenshot del estado actual
    await page.screenshot({ path: 'test-results/06-session-state.png' });
  });

  test('debería verificar los providers disponibles', async ({ page }) => {
    // Verificar los providers
    const providersResponse = await page.request.get('http://localhost:3000/api/auth/providers');
    const providersData = await providersResponse.json();
    
    console.log('🔧 Providers disponibles:', Object.keys(providersData));
    console.log('📋 Configuración de Google:', providersData.google ? '✅ Configurado' : '❌ No configurado');
    
    expect(providersData.google).toBeDefined();
    expect(providersData.google.name).toBe('Google');
  });
});
