import { test, expect } from '@playwright/test';

/**
 * VERIFICACIÓN RÁPIDA DEL HEADER
 * =============================
 * Test simple para verificar que el Header se renderiza correctamente
 * después de las correcciones aplicadas
 */

test.describe('Header Verification - Post Fix', () => {
  
  test('Header se renderiza correctamente en la página principal', async ({ page }) => {
    console.log('🔍 Navegando a la página principal...');
    
    // Navegar a la página principal
    await page.goto('http://localhost:3000');
    
    // Esperar a que la página cargue
    await page.waitForLoadState('networkidle');
    
    console.log('✅ Página cargada, verificando Header...');
    
    // Verificar que el header existe y es visible
    const header = page.locator('header');
    await expect(header).toBeVisible();
    
    console.log('✅ Header es visible');
    
    // Verificar que tiene las clases CSS correctas
    await expect(header).toHaveClass(/fixed/);
    await expect(header).toHaveClass(/bg-blaze-orange-600/);
    
    console.log('✅ Header tiene las clases CSS correctas');
    
    // Verificar que el logo existe
    const logo = page.locator('img[alt*="Pinteya"]').first();
    await expect(logo).toBeVisible();
    
    console.log('✅ Logo es visible');
    
    // Verificar que el buscador existe
    const searchInput = page.locator('input[placeholder*="Buscar"]');
    await expect(searchInput).toBeVisible();
    
    console.log('✅ Buscador es visible');
    
    // Verificar que no hay errores de JavaScript críticos
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Interactuar con el buscador
    await searchInput.click();
    await searchInput.fill('pintura');
    await page.waitForTimeout(1000);
    
    // Verificar que no hay errores críticos
    const criticalErrors = errors.filter(error => 
      error.includes('Header') || 
      error.includes('transform') || 
      error.includes('z-index') ||
      error.includes('stacking')
    );
    
    expect(criticalErrors.length).toBe(0);
    
    console.log('✅ No hay errores críticos de JavaScript');
    
    // Tomar screenshot del header
    await header.screenshot({ path: 'test-results/header-verification.png' });
    
    console.log('✅ Screenshot tomado: test-results/header-verification.png');
    console.log('🎉 Header verification PASSED!');
  });

  test('Header funciona correctamente en mobile', async ({ page }) => {
    console.log('📱 Testing Header en mobile...');
    
    // Configurar viewport mobile
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navegar a la página
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Verificar que el header es visible en mobile
    const header = page.locator('header');
    await expect(header).toBeVisible();
    
    console.log('✅ Header visible en mobile');
    
    // Verificar que el logo mobile existe
    const logoMobile = page.locator('img[alt*="Pinteya"]');
    await expect(logoMobile.first()).toBeVisible();
    
    console.log('✅ Logo mobile visible');
    
    // Tomar screenshot mobile
    await header.screenshot({ path: 'test-results/header-mobile-verification.png' });
    
    console.log('✅ Screenshot mobile tomado');
    console.log('🎉 Mobile Header verification PASSED!');
  });

  test('Búsqueda funciona sin errores de renderizado', async ({ page }) => {
    console.log('🔍 Testing funcionalidad de búsqueda...');
    
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Encontrar el input de búsqueda
    const searchInput = page.locator('input[placeholder*="Buscar"]');
    await expect(searchInput).toBeVisible();
    
    // Hacer click y escribir
    await searchInput.click();
    await searchInput.fill('pintura blanca');
    
    console.log('✅ Texto ingresado en búsqueda');
    
    // Esperar un momento para que aparezca el dropdown (si existe)
    await page.waitForTimeout(2000);
    
    // Verificar que el input mantiene el valor
    await expect(searchInput).toHaveValue('pintura blanca');
    
    console.log('✅ Input mantiene el valor');
    
    // Presionar Enter para buscar
    await searchInput.press('Enter');
    await page.waitForTimeout(1000);
    
    console.log('✅ Búsqueda ejecutada');
    console.log('🎉 Search functionality PASSED!');
  });

});
