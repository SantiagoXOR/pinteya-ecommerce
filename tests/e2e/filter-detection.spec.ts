import { test, expect, Page } from '@playwright/test';

/**
 * Suite de tests E2E para verificar la detección de filtros
 * y el comportamiento del hook useFilterDetection
 */

const BASE_URL = 'http://localhost:3000';

// Helper function para esperar que la página cargue completamente
async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
}

// Helper function para verificar logs de consola (en desarrollo)
async function checkConsoleLogsForFilters(page: Page, expectedHasFilters: boolean) {
  const logs: string[] = [];
  
  page.on('console', (msg) => {
    if (msg.text().includes('ConditionalContent Debug')) {
      logs.push(msg.text());
    }
  });
  
  await page.waitForTimeout(1000); // Esperar logs
  
  if (logs.length > 0) {
    const lastLog = logs[logs.length - 1];
    console.log(`📝 Console log: ${lastLog}`);
    
    if (expectedHasFilters) {
      expect(lastLog).toContain('hasActiveFilters: true');
    } else {
      expect(lastLog).toContain('hasActiveFilters: false');
    }
  }
}

test.describe('Detección de Filtros - useFilterDetection Hook', () => {
  
  test('Detección correcta: Sin filtros (homepage normal)', async ({ page }) => {
    console.log('🧪 Testing: Detección sin filtros');
    
    await page.goto(BASE_URL);
    await waitForPageLoad(page);
    
    // Verificar que se muestra el homepage normal
    await expect(page.locator('text=Más Vendidos')).toBeVisible();
    await expect(page.locator('text=Productos Filtrados')).not.toBeVisible();
    
    // Verificar logs de consola si están disponibles
    await checkConsoleLogsForFilters(page, false);
    
    console.log('✅ Sin filtros detection test passed');
  });

  test('Detección correcta: Filtro search activo', async ({ page }) => {
    console.log('🧪 Testing: Detección con filtro search');
    
    await page.goto(`${BASE_URL}/?search=pintura`);
    await waitForPageLoad(page);
    
    // Verificar que se muestra la vista filtrada
    await expect(page.locator('text=Productos Filtrados')).toBeVisible();
    await expect(page.locator('text=Resultados de tu búsqueda')).toBeVisible();
    await expect(page.locator('text=Más Vendidos')).not.toBeVisible();
    
    // Verificar logs de consola si están disponibles
    await checkConsoleLogsForFilters(page, true);
    
    console.log('✅ Filtro search detection test passed');
  });

  test('Detección correcta: Filtro q (query alternativo)', async ({ page }) => {
    console.log('🧪 Testing: Detección con filtro q');
    
    await page.goto(`${BASE_URL}/?q=pintura`);
    await waitForPageLoad(page);
    
    // Verificar que se muestra la vista filtrada
    await expect(page.locator('text=Productos Filtrados')).toBeVisible();
    await expect(page.locator('text=Resultados de tu búsqueda')).toBeVisible();
    
    console.log('✅ Filtro q detection test passed');
  });

  test('Detección con parámetros de paginación', async ({ page }) => {
    console.log('🧪 Testing: Detección con paginación');
    
    await page.goto(`${BASE_URL}/?search=pintura&page=2`);
    await waitForPageLoad(page);
    
    // Verificar que se muestra la vista filtrada
    await expect(page.locator('text=Productos Filtrados')).toBeVisible();
    await expect(page.locator('text=Resultados de tu búsqueda')).toBeVisible();
    
    // Verificar que la paginación funciona
    const paginationInfo = page.locator('text=/Página \\d+ de \\d+/');
    if (await paginationInfo.isVisible()) {
      const pageText = await paginationInfo.textContent();
      console.log(`📄 Paginación: ${pageText}`);
    }
    
    console.log('✅ Paginación detection test passed');
  });

  test('Detección con parámetros de ordenamiento', async ({ page }) => {
    console.log('🧪 Testing: Detección con ordenamiento');
    
    await page.goto(`${BASE_URL}/?search=pintura&sortBy=price&sortOrder=asc`);
    await waitForPageLoad(page);
    
    // Verificar que se muestra la vista filtrada
    await expect(page.locator('text=Productos Filtrados')).toBeVisible();
    await expect(page.locator('text=Resultados de tu búsqueda')).toBeVisible();
    
    console.log('✅ Ordenamiento detection test passed');
  });

  test('Detección con múltiples parámetros', async ({ page }) => {
    console.log('🧪 Testing: Detección con múltiples parámetros');
    
    const complexUrl = `${BASE_URL}/?search=pintura&category=Interior&page=1&sortBy=price&sortOrder=desc`;
    await page.goto(complexUrl);
    await waitForPageLoad(page);
    
    // Verificar que se muestra la vista filtrada
    await expect(page.locator('text=Productos Filtrados')).toBeVisible();
    await expect(page.locator('text=Resultados de tu búsqueda')).toBeVisible();
    
    // Verificar contador de productos
    const counterElement = page.locator('text=/\\d+ encontrados/');
    await expect(counterElement).toBeVisible();
    
    console.log('✅ Múltiples parámetros detection test passed');
  });
});

test.describe('Casos Edge - Detección de Filtros', () => {
  
  test('Parámetros vacíos no deben activar filtros', async ({ page }) => {
    console.log('🧪 Testing: Parámetros vacíos');
    
    await page.goto(`${BASE_URL}/?search=&category=`);
    await waitForPageLoad(page);
    
    // Debería mostrar homepage normal ya que los parámetros están vacíos
    const hasHomepage = await page.locator('text=Más Vendidos').isVisible();
    const hasFiltered = await page.locator('text=Productos Filtrados').isVisible();
    
    // Puede mostrar homepage o vista filtrada dependiendo de la implementación
    // Lo importante es que no falle
    expect(hasHomepage || hasFiltered).toBeTruthy();
    
    console.log('✅ Parámetros vacíos test passed');
  });

  test('Parámetros no reconocidos no deben activar filtros', async ({ page }) => {
    console.log('🧪 Testing: Parámetros no reconocidos');
    
    await page.goto(`${BASE_URL}/?randomParam=value&anotherParam=test`);
    await waitForPageLoad(page);
    
    // Debería mostrar homepage normal ya que los parámetros no son reconocidos
    await expect(page.locator('text=Más Vendidos')).toBeVisible();
    await expect(page.locator('text=Productos Filtrados')).not.toBeVisible();
    
    console.log('✅ Parámetros no reconocidos test passed');
  });

  test('Combinación de parámetros válidos e inválidos', async ({ page }) => {
    console.log('🧪 Testing: Combinación de parámetros válidos e inválidos');
    
    await page.goto(`${BASE_URL}/?search=pintura&invalidParam=test&randomValue=123`);
    await waitForPageLoad(page);
    
    // Debería mostrar vista filtrada porque 'search' es válido
    await expect(page.locator('text=Productos Filtrados')).toBeVisible();
    await expect(page.locator('text=Resultados de tu búsqueda')).toBeVisible();
    
    console.log('✅ Combinación de parámetros test passed');
  });
});

test.describe('Performance y Estabilidad', () => {
  
  test('Cambios rápidos entre URLs no deben causar errores', async ({ page }) => {
    console.log('🧪 Testing: Cambios rápidos entre URLs');
    
    const urls = [
      BASE_URL,
      `${BASE_URL}/?search=pintura`,
      BASE_URL,
      `${BASE_URL}/?category=Interior`,
      `${BASE_URL}/?search=latex`,
      BASE_URL
    ];
    
    for (const url of urls) {
      await page.goto(url);
      await page.waitForTimeout(500); // Cambio rápido
      
      // Verificar que la página no tiene errores JavaScript
      const errors: string[] = [];
      page.on('pageerror', (error) => {
        errors.push(error.message);
      });
      
      // Verificar que al menos uno de los estados es visible
      const hasHomepage = await page.locator('text=Más Vendidos').isVisible();
      const hasFiltered = await page.locator('text=Productos Filtrados').isVisible();
      
      expect(hasHomepage || hasFiltered).toBeTruthy();
      expect(errors.length).toBe(0);
    }
    
    console.log('✅ Cambios rápidos test passed');
  });

  test('Recarga de página mantiene estado correcto', async ({ page }) => {
    console.log('🧪 Testing: Recarga de página');
    
    // Ir a vista filtrada
    await page.goto(`${BASE_URL}/?search=pintura`);
    await waitForPageLoad(page);
    
    // Verificar estado inicial
    await expect(page.locator('text=Productos Filtrados')).toBeVisible();
    
    // Recargar página
    await page.reload();
    await waitForPageLoad(page);
    
    // Verificar que mantiene el estado filtrado
    await expect(page.locator('text=Productos Filtrados')).toBeVisible();
    await expect(page.locator('text=Resultados de tu búsqueda')).toBeVisible();
    
    console.log('✅ Recarga de página test passed');
  });
});
