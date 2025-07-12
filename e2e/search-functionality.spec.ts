import { test, expect } from '@playwright/test';

test.describe('Búsqueda Instantánea - Pinteya E-commerce', () => {
  test.beforeEach(async ({ page }) => {
    // Ir a la página principal
    await page.goto('/');
    
    // Esperar a que la página cargue completamente
    await page.waitForLoadState('networkidle');
  });

  test('debería mostrar sugerencias al escribir en el buscador del header', async ({ page }) => {
    console.log('🔍 Iniciando test de búsqueda instantánea...');

    // Localizar el input de búsqueda desktop en el header
    const searchInput = page.locator('[data-testid="desktop-search-input"]');
    await expect(searchInput).toBeVisible();

    console.log('✅ Input de búsqueda desktop encontrado');
    
    // Hacer clic en el input para enfocarlo
    await searchInput.click();
    
    // Escribir "pintura" letra por letra para simular escritura real
    await searchInput.type('pintura', { delay: 100 });
    
    console.log('⌨️ Texto "pintura" escrito');
    
    // Esperar un poco más que el debounce (150ms + margen)
    await page.waitForTimeout(500);
    
    // Verificar que aparece el dropdown de sugerencias
    const dropdown = page.locator('.absolute.top-full.left-0.right-0.z-50');
    await expect(dropdown).toBeVisible({ timeout: 5000 });
    
    console.log('📋 Dropdown de sugerencias visible');
    
    // Verificar que hay productos en las sugerencias
    const productSuggestions = page.locator('text=Productos');
    await expect(productSuggestions).toBeVisible({ timeout: 3000 });
    
    console.log('📦 Sección "Productos" encontrada');
    
    // Verificar que hay al menos una sugerencia de producto
    const productItems = page.locator('[data-testid*="product-"]').or(
      page.locator('text=/.*pintura.*/i').first()
    );
    await expect(productItems.first()).toBeVisible({ timeout: 3000 });
    
    console.log('✅ Sugerencias de productos visibles');
  });

  test('debería hacer request a la API cuando se escribe', async ({ page }) => {
    console.log('🌐 Iniciando test de requests API...');
    
    // Interceptar requests a la API de productos
    const apiRequests: any[] = [];
    
    page.on('request', request => {
      if (request.url().includes('/api/products')) {
        apiRequests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers()
        });
        console.log('📡 Request interceptado:', request.url());
      }
    });
    
    // Localizar y usar el input de búsqueda desktop
    const searchInput = page.locator('[data-testid="desktop-search-input"]');
    await searchInput.click();
    await searchInput.type('lija', { delay: 100 });
    
    // Esperar a que se haga el request
    await page.waitForTimeout(1000);
    
    // Verificar que se hizo al menos un request a la API
    expect(apiRequests.length).toBeGreaterThan(0);
    
    // Verificar que el request incluye el parámetro de búsqueda
    const searchRequest = apiRequests.find(req => 
      req.url.includes('search=lija')
    );
    expect(searchRequest).toBeTruthy();
    
    console.log('✅ Request a API confirmado:', searchRequest?.url);
  });

  test('debería funcionar en la página de test específica', async ({ page }) => {
    console.log('🧪 Iniciando test en página de pruebas...');
    
    // Ir a la página de test
    await page.goto('/test-search');
    await page.waitForLoadState('networkidle');
    
    // Probar el componente SimpleSearch primero
    const simpleSearchInput = page.locator('input[placeholder="Buscar productos..."]');
    await expect(simpleSearchInput).toBeVisible();
    
    await simpleSearchInput.click();
    await simpleSearchInput.type('pintura', { delay: 100 });
    
    // Esperar resultados en el componente simple
    await page.waitForTimeout(1000);
    
    // Verificar que aparecen resultados
    const resultsContainer = page.locator('text=productos encontrados');
    await expect(resultsContainer).toBeVisible({ timeout: 5000 });
    
    console.log('✅ SimpleSearch funcionando');
    
    // Ahora probar el SearchAutocomplete de la página de test
    const autocompleteInput = page.locator('[data-testid="test-search-input"]');
    await autocompleteInput.click();
    await autocompleteInput.type('lija', { delay: 100 });
    
    await page.waitForTimeout(500);
    
    // Verificar dropdown del autocomplete
    const autocompleteDropdown = page.locator('.absolute.top-full.left-0.right-0.z-50');
    await expect(autocompleteDropdown).toBeVisible({ timeout: 3000 });
    
    console.log('✅ SearchAutocomplete funcionando');
  });

  test('debería funcionar tanto en desktop como mobile', async ({ page }) => {
    console.log('📱💻 Iniciando test desktop vs mobile...');

    // Test desktop search
    const desktopSearch = page.locator('[data-testid="desktop-search-input"]');
    if (await desktopSearch.isVisible()) {
      await desktopSearch.click();
      await desktopSearch.type('pintura', { delay: 100 });
      await page.waitForTimeout(500);

      const desktopDropdown = page.locator('.absolute.top-full.left-0.right-0.z-50').first();
      await expect(desktopDropdown).toBeVisible({ timeout: 3000 });
      console.log('✅ Desktop search funcionando');

      await desktopSearch.clear();
    }

    // Simular mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    // Test mobile search
    const mobileSearch = page.locator('[data-testid="mobile-search-input"]');
    if (await mobileSearch.isVisible()) {
      await mobileSearch.click();
      await mobileSearch.type('lija', { delay: 100 });
      await page.waitForTimeout(500);

      const mobileDropdown = page.locator('.absolute.top-full.left-0.right-0.z-50').first();
      await expect(mobileDropdown).toBeVisible({ timeout: 3000 });
      console.log('✅ Mobile search funcionando');
    }
  });
});
