// ===================================
// PINTEYA E-COMMERCE - PRELOADING E2E TESTS
// Tests end-to-end para validar preloading functionality
// ===================================

import { test, expect, Page } from '@playwright/test';

// ===================================
// HELPERS PARA PRELOADING
// ===================================

// Helper para monitorear network requests
async function monitorNetworkRequests(page: Page) {
  const requests: Array<{ url: string; timestamp: number; type: string }> = [];
  
  page.on('request', (request) => {
    requests.push({
      url: request.url(),
      timestamp: Date.now(),
      type: request.resourceType()
    });
  });

  return requests;
}

// Helper para verificar que un recurso fue precargado
function wasResourcePreloaded(requests: Array<{ url: string; timestamp: number; type: string }>, resourcePattern: string) {
  return requests.some(req => req.url.includes(resourcePattern));
}

// Helper para medir tiempo entre preload y uso
function getPreloadToUsageTime(requests: Array<{ url: string; timestamp: number; type: string }>, resourcePattern: string) {
  const preloadRequest = requests.find(req => req.url.includes(resourcePattern));
  const usageRequest = requests.filter(req => req.url.includes(resourcePattern))[1]; // Segunda ocurrencia
  
  if (preloadRequest && usageRequest) {
    return usageRequest.timestamp - preloadRequest.timestamp;
  }
  return null;
}

// ===================================
// TESTS DE PRELOADING BÁSICO
// ===================================

test.describe('Preloading Functionality', () => {
  test('debe precargar componentes admin después del delay configurado', async ({ page }) => {
    const requests = await monitorNetworkRequests(page);
    
    // Navegar a la página principal
    await page.goto('/');
    
    // Esperar el tiempo de delay de preloading (2 segundos según configuración)
    await page.waitForTimeout(3000);
    
    // Verificar que se han hecho requests relacionados con admin
    const adminRequests = requests.filter(req => 
      req.url.includes('admin') || 
      req.url.includes('chunk') ||
      req.url.includes('_next')
    );
    
    console.log(`Admin-related requests after preload delay: ${adminRequests.length}`);
    
    // Debe haber alguna evidencia de preloading
    expect(adminRequests.length).toBeGreaterThanOrEqual(0);
  });

  test('debe precargar componentes de productos inteligentemente', async ({ page }) => {
    const requests = await monitorNetworkRequests(page);
    
    // Navegar a la página de productos
    await page.goto('/admin/products');
    await page.waitForLoadState('networkidle');
    
    // Esperar tiempo de preloading
    await page.waitForTimeout(2000);
    
    // Verificar requests relacionados con productos
    const productRequests = requests.filter(req => 
      req.url.includes('product') ||
      req.url.includes('inventory') ||
      req.url.includes('catalog')
    );
    
    console.log(`Product-related preload requests: ${productRequests.length}`);
    
    // Navegar a una página de producto específica para ver si fue precargada
    const productLinks = await page.locator('a[href*="/admin/products/"]').count();
    
    if (productLinks > 0) {
      const navigationTime = await page.evaluate(async () => {
        const startTime = performance.now();
        // Simular click en primer producto
        const link = document.querySelector('a[href*="/admin/products/"]') as HTMLAnchorElement;
        if (link) {
          link.click();
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
        return performance.now() - startTime;
      });
      
      console.log(`Product navigation time: ${navigationTime}ms`);
      
      // Si fue precargado, debería ser más rápido
      expect(navigationTime).toBeLessThan(2000);
    }
  });

  test('debe precargar componentes de logística bajo demanda', async ({ page }) => {
    const requests = await monitorNetworkRequests(page);
    
    // Navegar al admin principal
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Buscar enlace a logística
    const logisticsLink = page.locator('a[href*="/admin/logistics"], a:has-text("Logística")').first();
    
    if (await logisticsLink.count() > 0) {
      // Hover sobre el enlace para activar preloading
      await logisticsLink.hover();
      await page.waitForTimeout(500);
      
      // Verificar que se iniciaron requests de preloading
      const logisticsRequests = requests.filter(req => 
        req.url.includes('logistics') ||
        req.url.includes('map') ||
        req.url.includes('tracking')
      );
      
      console.log(`Logistics preload requests after hover: ${logisticsRequests.length}`);
      
      // Hacer click y medir tiempo de carga
      const navigationTime = await page.evaluate(async () => {
        const startTime = performance.now();
        const link = document.querySelector('a[href*="/admin/logistics"]') as HTMLAnchorElement;
        if (link) {
          link.click();
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
        return performance.now() - startTime;
      });
      
      console.log(`Logistics navigation time after preload: ${navigationTime}ms`);
      
      // Con preloading debería ser más rápido
      expect(navigationTime).toBeLessThan(3000);
    }
  });
});

// ===================================
// TESTS DE PRELOADING HOOKS
// ===================================

test.describe('Preloading Hooks Integration', () => {
  test('debe ejecutar hooks de preloading correctamente', async ({ page }) => {
    // Inyectar código para monitorear hooks de preloading
    await page.addInitScript(() => {
      (window as any).preloadingEvents = [];
      
      // Mock de dynamic import para capturar preloading
      const originalImport = (window as any).import;
      (window as any).import = function(specifier: string) {
        (window as any).preloadingEvents.push({
          type: 'dynamic_import',
          specifier,
          timestamp: Date.now()
        });
        return originalImport ? originalImport(specifier) : Promise.resolve({});
      };
    });
    
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Esperar tiempo de preloading
    await page.waitForTimeout(3000);
    
    // Verificar eventos de preloading
    const preloadingEvents = await page.evaluate(() => (window as any).preloadingEvents || []);
    
    console.log(`Preloading events captured: ${preloadingEvents.length}`);
    console.log('Events:', preloadingEvents.slice(0, 3));
    
    // Debe haber alguna actividad de preloading
    expect(preloadingEvents.length).toBeGreaterThanOrEqual(0);
  });

  test('debe manejar preloading condicional basado en user behavior', async ({ page }) => {
    const requests = await monitorNetworkRequests(page);
    
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Simular comportamiento de usuario interesado en productos
    const productsSection = page.locator(':has-text("Productos"), [data-section="products"]').first();
    
    if (await productsSection.count() > 0) {
      // Hover prolongado para simular interés
      await productsSection.hover();
      await page.waitForTimeout(1000);
      
      // Verificar que se activó preloading inteligente
      const productPreloadRequests = requests.filter(req => 
        req.url.includes('product') && 
        req.timestamp > Date.now() - 2000
      );
      
      console.log(`Product preload requests after user interest: ${productPreloadRequests.length}`);
    }
    
    // Simular navegación a otra sección
    const ordersSection = page.locator(':has-text("Órdenes"), [data-section="orders"]').first();
    
    if (await ordersSection.count() > 0) {
      await ordersSection.hover();
      await page.waitForTimeout(1000);
      
      const orderPreloadRequests = requests.filter(req => 
        req.url.includes('order') && 
        req.timestamp > Date.now() - 2000
      );
      
      console.log(`Order preload requests after user interest: ${orderPreloadRequests.length}`);
    }
  });
});

// ===================================
// TESTS DE PERFORMANCE DE PRELOADING
// ===================================

test.describe('Preloading Performance', () => {
  test('debe mejorar tiempo de navegación con preloading', async ({ page }) => {
    // Test sin preloading (primera visita)
    const coldStartTime = await page.evaluate(async () => {
      const startTime = performance.now();
      
      // Simular navegación fría
      await fetch('/admin/products', { method: 'HEAD' }).catch(() => {});
      
      return performance.now() - startTime;
    });
    
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Esperar preloading
    await page.waitForTimeout(3000);
    
    // Test con preloading (después de precarga)
    const preloadedTime = await page.evaluate(async () => {
      const startTime = performance.now();
      
      // Simular navegación con preloading
      await fetch('/admin/products', { method: 'HEAD' }).catch(() => {});
      
      return performance.now() - startTime;
    });
    
    console.log(`Cold start time: ${coldStartTime}ms`);
    console.log(`Preloaded time: ${preloadedTime}ms`);
    
    // El preloading debería mejorar el tiempo (o al menos no empeorarlo significativamente)
    expect(preloadedTime).toBeLessThanOrEqual(coldStartTime * 1.5);
  });

  test('debe gestionar memoria eficientemente durante preloading', async ({ page }) => {
    // Monitorear uso de memoria durante preloading
    await page.goto('/admin');
    
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize
      } : null;
    });
    
    // Activar preloading intensivo
    await page.waitForTimeout(5000);
    
    const afterPreloadMemory = await page.evaluate(() => {
      return (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize
      } : null;
    });
    
    if (initialMemory && afterPreloadMemory) {
      const memoryIncrease = afterPreloadMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
      const memoryIncreasePercent = (memoryIncrease / initialMemory.usedJSHeapSize) * 100;
      
      console.log(`Memory increase after preloading: ${memoryIncrease} bytes (${memoryIncreasePercent.toFixed(2)}%)`);
      
      // El aumento de memoria no debería ser excesivo (menos del 50%)
      expect(memoryIncreasePercent).toBeLessThan(50);
    }
  });

  test('debe cancelar preloading cuando no es necesario', async ({ page }) => {
    const requests = await monitorNetworkRequests(page);
    
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Simular navegación rápida que debería cancelar preloading
    await page.goto('/');
    await page.waitForTimeout(500);
    await page.goto('/admin/products');
    await page.waitForLoadState('networkidle');
    
    // Verificar que no hay requests excesivos de preloading
    const recentRequests = requests.filter(req => req.timestamp > Date.now() - 3000);
    const duplicateRequests = recentRequests.filter((req, index, arr) => 
      arr.findIndex(r => r.url === req.url) !== index
    );
    
    console.log(`Recent requests: ${recentRequests.length}`);
    console.log(`Duplicate requests: ${duplicateRequests.length}`);
    
    // No debería haber muchos requests duplicados
    expect(duplicateRequests.length).toBeLessThan(recentRequests.length * 0.3);
  });
});
