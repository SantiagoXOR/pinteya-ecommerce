import { test, expect } from '@playwright/test';

test.describe('Sistema de Búsqueda Instantánea', () => {
  test.beforeEach(async ({ page }) => {
    // Interceptar requests a la API para testing
    await page.route('**/api/products*', async route => {
      const url = route.request().url();
      
      if (url.includes('search=pintura')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: '1',
                name: 'Pintura Látex Interior Premium',
                category: { name: 'Pinturas', slug: 'pinturas' },
                stock: 15,
                price: 2500,
                images: {
                  previews: ['/images/products/pintura-latex.jpg']
                }
              },
              {
                id: '2',
                name: 'Pintura Esmalte Sintético',
                category: { name: 'Pinturas', slug: 'pinturas' },
                stock: 8,
                price: 3200,
                images: {
                  previews: ['/images/products/esmalte.jpg']
                }
              }
            ],
            pagination: {
              total: 2,
              page: 1,
              limit: 12,
              totalPages: 1
            }
          })
        });
      } else if (url.includes('search=xyz123')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [],
            pagination: {
              total: 0,
              page: 1,
              limit: 12,
              totalPages: 0
            }
          })
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/');
  });

  test('debería mostrar sugerencias al escribir en el buscador', async ({ page }) => {
    // Localizar el input de búsqueda
    const searchInput = page.locator('[data-testid="search-input"]').first();
    
    // Hacer click para enfocar
    await searchInput.click();
    
    // Escribir término de búsqueda
    await searchInput.fill('pintura');
    
    // Esperar a que aparezcan las sugerencias
    await page.waitForSelector('[data-testid*="search-input"] + div', { timeout: 2000 });
    
    // Verificar que aparecen sugerencias
    const dropdown = page.locator('[data-testid*="search-input"] + div').first();
    await expect(dropdown).toBeVisible();
    
    // Verificar que hay productos en las sugerencias
    const productSuggestions = dropdown.locator('text=Pintura Látex Interior Premium');
    await expect(productSuggestions).toBeVisible();
  });

  test('debería navegar a resultados al hacer búsqueda', async ({ page }) => {
    const searchInput = page.locator('[data-testid="search-input"]').first();
    
    // Escribir y enviar búsqueda
    await searchInput.fill('pintura');
    await searchInput.press('Enter');
    
    // Verificar navegación a página de resultados
    await expect(page).toHaveURL(/.*\/shop\?search=pintura/);
    
    // Verificar que se muestran los resultados
    await expect(page.locator('text=Resultados de búsqueda')).toBeVisible();
    await expect(page.locator('text=Búsqueda: "pintura"')).toBeVisible();
  });

  test('debería mostrar estado de loading durante búsqueda', async ({ page }) => {
    const searchInput = page.locator('[data-testid="search-input"]').first();
    
    await searchInput.click();
    await searchInput.fill('pintura');
    
    // Verificar indicador de loading
    const loadingIndicator = page.locator('text=Buscando...');
    await expect(loadingIndicator).toBeVisible();
  });

  test('debería manejar búsquedas sin resultados', async ({ page }) => {
    const searchInput = page.locator('[data-testid="search-input"]').first();
    
    // Buscar término que no existe
    await searchInput.fill('xyz123');
    await searchInput.press('Enter');
    
    // Verificar navegación
    await expect(page).toHaveURL(/.*\/shop\?search=xyz123/);
    
    // Verificar mensaje de sin resultados
    await expect(page.locator('text=No se encontraron productos')).toBeVisible();
    await expect(page.locator('text=No hay productos que coincidan')).toBeVisible();
  });

  test('debería seleccionar sugerencia y navegar', async ({ page }) => {
    const searchInput = page.locator('[data-testid="search-input"]').first();
    
    await searchInput.click();
    await searchInput.fill('pintura');
    
    // Esperar sugerencias
    await page.waitForSelector('text=Pintura Látex Interior Premium', { timeout: 2000 });
    
    // Hacer click en una sugerencia
    await page.click('text=Pintura Látex Interior Premium');
    
    // Verificar navegación al producto
    await expect(page).toHaveURL(/.*\/shop-details\/1/);
  });

  test('debería mostrar búsquedas recientes', async ({ page }) => {
    // Realizar una búsqueda primero
    const searchInput = page.locator('[data-testid="search-input"]').first();
    await searchInput.fill('pintura');
    await searchInput.press('Enter');
    
    // Volver al inicio
    await page.goto('/');
    
    // Enfocar el buscador sin escribir
    await searchInput.click();
    
    // Verificar que aparecen búsquedas recientes
    await expect(page.locator('text=Búsquedas recientes')).toBeVisible();
    await expect(page.locator('text=pintura')).toBeVisible();
  });

  test('debería mostrar búsquedas trending por defecto', async ({ page }) => {
    const searchInput = page.locator('[data-testid="search-input"]').first();
    
    // Enfocar sin escribir
    await searchInput.click();
    
    // Verificar búsquedas trending
    await expect(page.locator('text=Búsquedas populares')).toBeVisible();
    await expect(page.locator('text=Pintura látex')).toBeVisible();
    await expect(page.locator('text=Sherwin Williams')).toBeVisible();
  });

  test('debería funcionar el selector de categorías', async ({ page }) => {
    // Hacer click en el selector de categorías
    await page.click('[data-testid="category-selector"]');
    
    // Verificar que se abre el dropdown
    await expect(page.locator('[data-testid="category-dropdown"]')).toBeVisible();
    
    // Seleccionar una categoría
    await page.click('[data-testid="category-pinturas"]');
    
    // Verificar que se actualiza el selector
    await expect(page.locator('text=Pinturas')).toBeVisible();
  });

  test('debería limpiar búsqueda con botón X', async ({ page }) => {
    const searchInput = page.locator('[data-testid="search-input"]').first();
    
    // Escribir algo
    await searchInput.fill('pintura');
    
    // Hacer click en el botón X
    await page.click('button[aria-label="Clear search"]');
    
    // Verificar que se limpia
    await expect(searchInput).toHaveValue('');
  });

  test('debería funcionar navegación con teclado', async ({ page }) => {
    const searchInput = page.locator('[data-testid="search-input"]').first();
    
    await searchInput.click();
    await searchInput.fill('pintura');
    
    // Esperar sugerencias
    await page.waitForSelector('text=Pintura Látex Interior Premium', { timeout: 2000 });
    
    // Navegar con flechas
    await searchInput.press('ArrowDown');
    await searchInput.press('ArrowDown');
    
    // Seleccionar con Enter
    await searchInput.press('Enter');
    
    // Verificar navegación
    await expect(page).toHaveURL(/.*\/shop-details\/.*/);
  });

  test('debería cerrar dropdown al hacer click fuera', async ({ page }) => {
    const searchInput = page.locator('[data-testid="search-input"]').first();
    
    await searchInput.click();
    await searchInput.fill('pintura');
    
    // Verificar que está abierto
    const dropdown = page.locator('[data-testid*="search-input"] + div').first();
    await expect(dropdown).toBeVisible();
    
    // Hacer click fuera
    await page.click('body');
    
    // Verificar que se cierra
    await expect(dropdown).not.toBeVisible();
  });

  test('debería funcionar en móvil', async ({ page }) => {
    // Simular viewport móvil
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Localizar buscador móvil
    const mobileSearchInput = page.locator('[data-testid="mobile-search-input"]');
    
    await mobileSearchInput.click();
    await mobileSearchInput.fill('pintura');
    
    // Verificar que funciona igual
    await page.waitForSelector('text=Pintura Látex Interior Premium', { timeout: 2000 });
    await expect(page.locator('text=Pintura Látex Interior Premium')).toBeVisible();
  });

  test('debería manejar errores de red', async ({ page }) => {
    // Interceptar con error
    await page.route('**/api/products*', async route => {
      await route.abort('failed');
    });

    const searchInput = page.locator('[data-testid="search-input"]').first();
    
    await searchInput.fill('pintura');
    await searchInput.press('Enter');
    
    // Verificar manejo de error
    await expect(page.locator('text=Error en la búsqueda')).toBeVisible();
    await expect(page.locator('text=Intentar nuevamente')).toBeVisible();
  });
});
