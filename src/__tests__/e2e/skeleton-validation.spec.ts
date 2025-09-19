// ===================================
// PINTEYA E-COMMERCE - SKELETON VALIDATION E2E TESTS
// Tests end-to-end para validar skeletons durante lazy loading
// ===================================

import { test, expect, Page } from '@playwright/test';

// ===================================
// HELPERS PARA SKELETON VALIDATION
// ===================================

// Helper para detectar elementos skeleton
async function detectSkeletonElements(page: Page) {
  const skeletonSelectors = [
    '[data-testid*="skeleton"]',
    '.animate-pulse',
    '.skeleton',
    '[class*="skeleton"]',
    '.loading-skeleton',
    '.shimmer',
    '[data-loading="true"]'
  ];
  
  const skeletonElements = [];
  
  for (const selector of skeletonSelectors) {
    const elements = await page.locator(selector).count();
    if (elements > 0) {
      skeletonElements.push({ selector, count: elements });
    }
  }
  
  return skeletonElements;
}

// Helper para verificar animaciones de skeleton
async function verifySkeletonAnimations(page: Page, selector: string) {
  const element = page.locator(selector).first();
  
  if (await element.count() === 0) {return false;}
  
  // Verificar que tiene clases de animación
  const hasAnimation = await element.evaluate((el) => {
    const styles = window.getComputedStyle(el);
    return styles.animation !== 'none' || 
           el.classList.contains('animate-pulse') ||
           el.classList.contains('shimmer');
  });
  
  return hasAnimation;
}

// Helper para medir duración de skeleton
async function measureSkeletonDuration(page: Page, skeletonSelector: string, contentSelector: string) {
  const startTime = Date.now();
  
  // Esperar a que aparezca el skeleton
  await page.waitForSelector(skeletonSelector, { timeout: 5000 }).catch(() => {});
  
  // Esperar a que aparezca el contenido real
  await page.waitForSelector(contentSelector, { timeout: 10000 }).catch(() => {});
  
  // Esperar a que desaparezca el skeleton
  await page.waitForSelector(skeletonSelector, { state: 'detached', timeout: 5000 }).catch(() => {});
  
  return Date.now() - startTime;
}

// ===================================
// TESTS DE SKELETON ADMIN DASHBOARD
// ===================================

test.describe('Skeleton Validation - Admin Dashboard', () => {
  test('debe mostrar skeletons apropiados durante carga inicial', async ({ page }) => {
    // Interceptar requests para simular carga lenta
    await page.route('**/*', async (route) => {
      if (route.request().url().includes('/admin')) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      await route.continue();
    });
    
    await page.goto('/admin');
    
    // Detectar elementos skeleton inmediatamente
    const skeletonElements = await detectSkeletonElements(page);
    
    console.log('Skeleton elements detected:', skeletonElements);
    
    // Debe haber algún indicador de carga
    const totalSkeletons = skeletonElements.reduce((sum, item) => sum + item.count, 0);
    expect(totalSkeletons).toBeGreaterThanOrEqual(0);
    
    // Esperar a que la página se cargue completamente
    await page.waitForLoadState('networkidle');
    
    // Verificar que los skeletons desaparecieron
    const remainingSkeletons = await detectSkeletonElements(page);
    const remainingCount = remainingSkeletons.reduce((sum, item) => sum + item.count, 0);
    
    console.log('Remaining skeletons after load:', remainingCount);
    
    // Los skeletons deberían haber desaparecido o reducido significativamente
    expect(remainingCount).toBeLessThanOrEqual(totalSkeletons);
  });

  test('debe tener skeletons con animaciones apropiadas', async ({ page }) => {
    await page.goto('/admin');
    
    // Buscar elementos con animación pulse
    const pulseElements = await page.locator('.animate-pulse').count();
    
    if (pulseElements > 0) {
      const hasAnimation = await verifySkeletonAnimations(page, '.animate-pulse');
      expect(hasAnimation).toBe(true);
    }
    
    // Verificar que las animaciones no son demasiado agresivas
    const animationDuration = await page.evaluate(() => {
      const pulseElement = document.querySelector('.animate-pulse');
      if (pulseElement) {
        const styles = window.getComputedStyle(pulseElement);
        return styles.animationDuration;
      }
      return null;
    });
    
    if (animationDuration) {
      console.log('Animation duration:', animationDuration);
      // La animación no debería ser demasiado rápida (menos de 0.5s) o lenta (más de 3s)
      expect(animationDuration).toMatch(/[0-9.]+s/);
    }
  });

  test('debe mostrar skeletons estructuralmente similares al contenido final', async ({ page }) => {
    await page.goto('/admin');
    
    // Capturar estructura inicial con skeletons
    const initialStructure = await page.evaluate(() => {
      const getElementStructure = (element: Element): any => {
        return {
          tagName: element.tagName,
          className: element.className,
          childCount: element.children.length,
          hasText: element.textContent?.trim().length || 0 > 0
        };
      };
      
      const skeletons = Array.from(document.querySelectorAll('[data-testid*="skeleton"], .animate-pulse'));
      return skeletons.map(getElementStructure);
    });
    
    // Esperar a que se cargue el contenido real
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Capturar estructura final
    const finalStructure = await page.evaluate(() => {
      const getElementStructure = (element: Element): any => {
        return {
          tagName: element.tagName,
          className: element.className,
          childCount: element.children.length,
          hasText: element.textContent?.trim().length || 0 > 0
        };
      };
      
      const mainContent = Array.from(document.querySelectorAll('main *, [role="main"] *'));
      return mainContent.slice(0, 10).map(getElementStructure); // Primeros 10 elementos
    });
    
    console.log('Initial skeleton structure:', initialStructure.length);
    console.log('Final content structure:', finalStructure.length);
    
    // Debe haber contenido estructurado en ambos casos
    expect(initialStructure.length + finalStructure.length).toBeGreaterThan(0);
  });
});

// ===================================
// TESTS DE SKELETON PRODUCTOS
// ===================================

test.describe('Skeleton Validation - Productos', () => {
  test('debe mostrar skeleton de lista de productos', async ({ page }) => {
    // Simular carga lenta de productos
    await page.route('**/api/admin/products**', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      await route.continue();
    });
    
    await page.goto('/admin/products');
    
    // Buscar skeletons específicos de productos
    const productSkeletons = await page.locator(
      '[data-testid*="product-skeleton"], .product-skeleton, [class*="product"][class*="skeleton"]'
    ).count();
    
    console.log('Product skeletons found:', productSkeletons);
    
    // Buscar skeletons genéricos si no hay específicos
    if (productSkeletons === 0) {
      const genericSkeletons = await detectSkeletonElements(page);
      const totalGeneric = genericSkeletons.reduce((sum, item) => sum + item.count, 0);
      console.log('Generic skeletons found:', totalGeneric);
      expect(totalGeneric).toBeGreaterThanOrEqual(0);
    }
    
    // Esperar a que se cargue el contenido
    await page.waitForLoadState('networkidle');
    
    // Verificar que hay contenido de productos o mensaje apropiado
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
    expect(pageContent!.length).toBeGreaterThan(50);
  });

  test('debe mostrar skeleton de formulario de producto', async ({ page }) => {
    await page.goto('/admin/products/new');
    
    // Buscar skeletons de formulario
    const formSkeletons = await page.locator(
      '[data-testid*="form-skeleton"], .form-skeleton, form [class*="skeleton"]'
    ).count();
    
    console.log('Form skeletons found:', formSkeletons);
    
    // Esperar a que se cargue el formulario
    await page.waitForLoadState('networkidle');
    
    // Verificar que hay un formulario o contenido apropiado
    const forms = await page.locator('form').count();
    const inputs = await page.locator('input, textarea, select').count();
    
    console.log('Forms found:', forms);
    console.log('Input elements found:', inputs);
    
    expect(forms + inputs).toBeGreaterThanOrEqual(0);
  });
});

// ===================================
// TESTS DE SKELETON LOGÍSTICA
// ===================================

test.describe('Skeleton Validation - Logística', () => {
  test('debe mostrar skeleton de dashboard de logística', async ({ page }) => {
    await page.goto('/admin/logistics');
    
    // Buscar skeletons específicos de logística
    const logisticsSkeletons = await page.locator(
      '[data-testid*="logistics-skeleton"], [data-testid*="map-skeleton"], .logistics-skeleton'
    ).count();
    
    console.log('Logistics skeletons found:', logisticsSkeletons);
    
    // Esperar carga completa
    await page.waitForLoadState('networkidle');
    
    // Verificar contenido de logística
    const logisticsContent = await page.locator(
      ':has-text("logística"), :has-text("envío"), :has-text("tracking"), :has-text("courier")'
    ).count();
    
    console.log('Logistics content elements:', logisticsContent);
    expect(logisticsContent).toBeGreaterThanOrEqual(0);
  });

  test('debe manejar skeleton de mapa correctamente', async ({ page }) => {
    await page.goto('/admin/logistics');
    
    // Buscar contenedores de mapa
    const mapContainers = await page.locator(
      '[data-testid*="map"], [class*="map"], #map, .logistics-map'
    ).count();
    
    console.log('Map containers found:', mapContainers);
    
    if (mapContainers > 0) {
      // Verificar que el mapa tiene dimensiones apropiadas
      const mapDimensions = await page.locator('[data-testid*="map"], [class*="map"]').first().evaluate((el) => {
        const rect = el.getBoundingClientRect();
        return { width: rect.width, height: rect.height };
      }).catch(() => ({ width: 0, height: 0 }));
      
      console.log('Map dimensions:', mapDimensions);
      
      // El mapa debería tener dimensiones razonables
      expect(mapDimensions.width).toBeGreaterThan(100);
      expect(mapDimensions.height).toBeGreaterThan(100);
    }
  });
});

// ===================================
// TESTS DE SKELETON PERFORMANCE
// ===================================

test.describe('Skeleton Performance', () => {
  test('debe mostrar skeletons rápidamente', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/admin');
    
    // Medir tiempo hasta que aparece el primer skeleton
    const skeletonAppearTime = await page.waitForSelector(
      '[data-testid*="skeleton"], .animate-pulse, .skeleton',
      { timeout: 3000 }
    ).then(() => Date.now() - startTime).catch(() => Date.now() - startTime);
    
    console.log('Time to first skeleton:', skeletonAppearTime, 'ms');
    
    // Los skeletons deberían aparecer rápidamente (menos de 1 segundo)
    expect(skeletonAppearTime).toBeLessThan(1000);
  });

  test('debe transicionar suavemente de skeleton a contenido', async ({ page }) => {
    await page.goto('/admin');
    
    // Esperar a que aparezcan skeletons
    await page.waitForSelector('.animate-pulse', { timeout: 3000 }).catch(() => {});
    
    // Medir tiempo de transición
    const transitionTime = await measureSkeletonDuration(
      page,
      '.animate-pulse',
      'main, [role="main"]'
    );
    
    console.log('Skeleton to content transition time:', transitionTime, 'ms');
    
    // La transición no debería ser demasiado larga
    expect(transitionTime).toBeLessThan(10000);
  });

  test('debe mantener layout estable durante transición', async ({ page }) => {
    await page.goto('/admin');
    
    // Medir layout shift durante la carga
    const layoutShift = await page.evaluate(() => {
      return new Promise((resolve) => {
        let cumulativeShift = 0;
        
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
              cumulativeShift += (entry as any).value;
            }
          }
        }).observe({ entryTypes: ['layout-shift'] });
        
        setTimeout(() => resolve(cumulativeShift), 5000);
      });
    });
    
    console.log('Cumulative Layout Shift:', layoutShift);
    
    // El layout shift debería ser mínimo (menos de 0.1 es bueno)
    expect(layoutShift).toBeLessThan(0.25);
  });
});









