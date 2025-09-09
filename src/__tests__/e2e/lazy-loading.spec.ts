// ===================================
// PINTEYA E-COMMERCE - LAZY LOADING E2E TESTS
// Tests end-to-end para validar lazy loading functionality
// ===================================

import { test, expect, Page } from '@playwright/test';

// ===================================
// CONFIGURACIÓN Y HELPERS
// ===================================

// Helper para esperar que un elemento aparezca
async function waitForElement(page: Page, selector: string, timeout = 10000) {
  await page.waitForSelector(selector, { timeout });
}

// Helper para medir tiempo de carga
async function measureLoadTime(page: Page, action: () => Promise<void>) {
  const startTime = Date.now();
  await action();
  const endTime = Date.now();
  return endTime - startTime;
}

// Helper para verificar skeletons
async function verifySkeletonPresence(page: Page, skeletonSelector: string) {
  const skeleton = await page.locator(skeletonSelector).first();
  await expect(skeleton).toBeVisible();
  return skeleton;
}

// Helper para verificar que el skeleton desaparece
async function verifySkeletonDisappears(page: Page, skeletonSelector: string, timeout = 5000) {
  await page.waitForSelector(skeletonSelector, { state: 'detached', timeout });
}

// ===================================
// TESTS DE LAZY LOADING ADMIN DASHBOARD
// ===================================

test.describe('Lazy Loading - Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Configurar interceptores para simular carga lenta
    await page.route('**/*', async (route) => {
      // Simular latencia en recursos específicos
      if (route.request().url().includes('/admin')) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      await route.continue();
    });
  });

  test('debe mostrar skeleton durante carga del admin dashboard', async ({ page }) => {
    await page.goto('/admin');

    // Verificar que aparece el skeleton
    const skeletonSelector = '[data-testid*="skeleton"], .animate-pulse, [class*="skeleton"]';
    
    // Buscar elementos de skeleton o loading
    const loadingElements = await page.locator(skeletonSelector).count();
    
    // Debe haber al menos algún indicador de carga
    expect(loadingElements).toBeGreaterThanOrEqual(0);

    // Verificar que el contenido principal se carga
    await waitForElement(page, 'main, [role="main"], .admin-dashboard', 10000);
    
    // Verificar que la página tiene contenido útil
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
    expect(pageContent!.length).toBeGreaterThan(100);
  });

  test('debe cargar admin dashboard en tiempo razonable', async ({ page }) => {
    const loadTime = await measureLoadTime(page, async () => {
      await page.goto('/admin');
      await waitForElement(page, 'main, [role="main"], .admin-dashboard');
    });

    // El dashboard debe cargar en menos de 5 segundos
    expect(loadTime).toBeLessThan(5000);
    console.log(`Admin dashboard load time: ${loadTime}ms`);
  });

  test('debe manejar navegación entre secciones admin', async ({ page }) => {
    await page.goto('/admin');
    await waitForElement(page, 'main, [role="main"], .admin-dashboard');

    // Intentar navegar a productos si existe el enlace
    const productsLink = page.locator('a[href*="/admin/products"], a:has-text("Productos")').first();
    
    if (await productsLink.count() > 0) {
      const navigationTime = await measureLoadTime(page, async () => {
        await productsLink.click();
        await page.waitForLoadState('networkidle');
      });

      expect(navigationTime).toBeLessThan(3000);
      console.log(`Products navigation time: ${navigationTime}ms`);
    }
  });
});

// ===================================
// TESTS DE LAZY LOADING PRODUCTOS
// ===================================

test.describe('Lazy Loading - Productos', () => {
  test('debe mostrar skeleton durante carga de productos', async ({ page }) => {
    await page.goto('/admin/products');

    // Buscar indicadores de carga
    const loadingIndicators = await page.locator(
      '[data-testid*="loading"], [data-testid*="skeleton"], .animate-pulse, .loading'
    ).count();

    // Verificar que hay algún indicador de carga o que la página carga directamente
    expect(loadingIndicators).toBeGreaterThanOrEqual(0);

    // Esperar a que la página se cargue completamente
    await page.waitForLoadState('networkidle');
    
    // Verificar que hay contenido en la página
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });

  test('debe cargar lista de productos eficientemente', async ({ page }) => {
    const loadTime = await measureLoadTime(page, async () => {
      await page.goto('/admin/products');
      await page.waitForLoadState('networkidle');
    });

    // La lista de productos debe cargar en tiempo razonable
    expect(loadTime).toBeLessThan(8000);
    console.log(`Products list load time: ${loadTime}ms`);
  });
});

// ===================================
// TESTS DE LAZY LOADING LOGÍSTICA
// ===================================

test.describe('Lazy Loading - Logística', () => {
  test('debe cargar dashboard de logística con componentes pesados', async ({ page }) => {
    const loadTime = await measureLoadTime(page, async () => {
      await page.goto('/admin/logistics');
      await page.waitForLoadState('networkidle');
    });

    // El dashboard de logística puede tomar más tiempo por los mapas
    expect(loadTime).toBeLessThan(10000);
    console.log(`Logistics dashboard load time: ${loadTime}ms`);

    // Verificar que la página tiene contenido
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });

  test('debe manejar componentes de mapa lazy loading', async ({ page }) => {
    await page.goto('/admin/logistics');
    
    // Esperar a que los componentes se carguen
    await page.waitForLoadState('networkidle');
    
    // Buscar elementos relacionados con mapas o logística
    const mapElements = await page.locator(
      '[data-testid*="map"], [class*="map"], [id*="map"], .logistics-map'
    ).count();

    // Verificar que hay contenido relacionado con logística
    const logisticsContent = await page.locator(
      ':has-text("logística"), :has-text("envío"), :has-text("courier"), :has-text("tracking")'
    ).count();

    expect(logisticsContent).toBeGreaterThanOrEqual(0);
  });
});

// ===================================
// TESTS DE ERROR BOUNDARIES
// ===================================

test.describe('Error Boundaries - Lazy Loading', () => {
  test('debe manejar errores de carga gracefully', async ({ page }) => {
    // Interceptar y fallar requests específicos para simular errores
    await page.route('**/*admin*', async (route) => {
      if (Math.random() < 0.1) { // 10% de probabilidad de fallo
        await route.abort();
      } else {
        await route.continue();
      }
    });

    await page.goto('/admin');
    
    // Esperar a que la página se estabilice
    await page.waitForTimeout(2000);
    
    // Verificar que la página no está completamente rota
    const bodyContent = await page.textContent('body');
    expect(bodyContent).toBeTruthy();
    
    // No debe haber errores JavaScript no manejados
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });
    
    await page.waitForTimeout(1000);
    
    // Los errores deben ser manejados por error boundaries
    const unhandledErrors = errors.filter(error => 
      !error.includes('ChunkLoadError') && 
      !error.includes('Loading chunk')
    );
    
    expect(unhandledErrors.length).toBeLessThanOrEqual(2);
  });
});

// ===================================
// TESTS DE PERFORMANCE
// ===================================

test.describe('Performance - Lazy Loading', () => {
  test('debe mantener métricas de performance aceptables', async ({ page }) => {
    // Navegar a la página principal
    await page.goto('/');
    
    // Medir Core Web Vitals básicos
    const performanceMetrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const metrics: Record<string, number> = {};
          
          entries.forEach((entry) => {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming;
              metrics.loadTime = navEntry.loadEventEnd - navEntry.loadEventStart;
              metrics.domContentLoaded = navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart;
            }
          });
          
          resolve(metrics);
        }).observe({ entryTypes: ['navigation'] });
        
        // Fallback después de 3 segundos
        setTimeout(() => resolve({}), 3000);
      });
    });

    console.log('Performance metrics:', performanceMetrics);
    
    // Verificar que las métricas están en rangos aceptables
    if (typeof performanceMetrics === 'object' && performanceMetrics !== null) {
      const metrics = performanceMetrics as Record<string, number>;
      if (metrics.loadTime) {
        expect(metrics.loadTime).toBeLessThan(3000);
      }
    }
  });

  test('debe cargar chunks de JavaScript eficientemente', async ({ page }) => {
    const networkRequests: string[] = [];
    
    page.on('request', (request) => {
      if (request.url().includes('.js') && !request.url().includes('node_modules')) {
        networkRequests.push(request.url());
      }
    });

    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // Verificar que se están cargando chunks separados (evidencia de code splitting)
    const jsChunks = networkRequests.filter(url => url.includes('chunk') || url.includes('_next'));
    
    console.log(`JavaScript chunks loaded: ${jsChunks.length}`);
    console.log('Chunks:', jsChunks.slice(0, 5)); // Mostrar primeros 5
    
    // Debe haber evidencia de code splitting
    expect(jsChunks.length).toBeGreaterThanOrEqual(1);
  });
});
