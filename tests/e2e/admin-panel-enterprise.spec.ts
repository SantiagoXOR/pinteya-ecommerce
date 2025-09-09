// =====================================================
// PLAYWRIGHT E2E: PANEL ADMINISTRATIVO ENTERPRISE
// Descripción: Suite completa de pruebas para validar funcionalidades enterprise
// Incluye: Órdenes, Productos, Logística, Integración
// =====================================================

import { test, expect, Page, BrowserContext } from '@playwright/test';
import { promises as fs } from 'fs';
import path from 'path';

// =====================================================
// CONFIGURACIÓN Y TIPOS
// =====================================================

interface TestResult {
  module: string;
  functionality: string;
  status: 'IMPLEMENTED' | 'PLACEHOLDER' | 'ERROR' | 'NOT_FOUND';
  details: string;
  screenshot?: string;
  apiCalls?: Array<{ url: string; status: number; response?: any }>;
}

interface DiagnosticReport {
  timestamp: string;
  totalTests: number;
  implemented: number;
  placeholders: number;
  errors: number;
  notFound: number;
  results: TestResult[];
  summary: {
    orders: { total: number; implemented: number };
    products: { total: number; implemented: number };
    logistics: { total: number; implemented: number };
    integration: { total: number; implemented: number };
  };
}

let diagnosticReport: DiagnosticReport = {
  timestamp: new Date().toISOString(),
  totalTests: 0,
  implemented: 0,
  placeholders: 0,
  errors: 0,
  notFound: 0,
  results: [],
  summary: {
    orders: { total: 0, implemented: 0 },
    products: { total: 0, implemented: 0 },
    logistics: { total: 0, implemented: 0 },
    integration: { total: 0, implemented: 0 }
  }
};

// =====================================================
// UTILIDADES
// =====================================================

async function addTestResult(result: TestResult) {
  diagnosticReport.results.push(result);
  diagnosticReport.totalTests++;
  
  switch (result.status) {
    case 'IMPLEMENTED':
      diagnosticReport.implemented++;
      break;
    case 'PLACEHOLDER':
      diagnosticReport.placeholders++;
      break;
    case 'ERROR':
      diagnosticReport.errors++;
      break;
    case 'NOT_FOUND':
      diagnosticReport.notFound++;
      break;
  }

  // Actualizar summary por módulo
  const moduleKey = result.module.toLowerCase() as keyof typeof diagnosticReport.summary;
  if (diagnosticReport.summary[moduleKey]) {
    diagnosticReport.summary[moduleKey].total++;
    if (result.status === 'IMPLEMENTED') {
      diagnosticReport.summary[moduleKey].implemented++;
    }
  }
}

async function captureScreenshot(page: Page, name: string): Promise<string> {
  const screenshotPath = `tests/screenshots/${name}-${Date.now()}.png`;
  await page.screenshot({ path: screenshotPath, fullPage: true });
  return screenshotPath;
}

async function checkForPlaceholder(page: Page, selector?: string): Promise<boolean> {
  const placeholderTexts = [
    'en desarrollo',
    'próximamente',
    'estará disponible',
    'coming soon',
    'placeholder',
    'mock data',
    'datos de ejemplo'
  ];

  const content = selector ? 
    await page.locator(selector).textContent() || '' :
    await page.textContent('body') || '';

  return placeholderTexts.some(text => 
    content.toLowerCase().includes(text.toLowerCase())
  );
}

async function interceptApiCalls(page: Page): Promise<Array<{ url: string; status: number; response?: any }>> {
  const apiCalls: Array<{ url: string; status: number; response?: any }> = [];
  
  page.on('response', async (response) => {
    if (response.url().includes('/api/')) {
      try {
        const responseData = await response.json().catch(() => null);
        apiCalls.push({
          url: response.url(),
          status: response.status(),
          response: responseData
        });
      } catch (error) {
        apiCalls.push({
          url: response.url(),
          status: response.status()
        });
      }
    }
  });

  return apiCalls;
}

async function waitForPageLoad(page: Page, timeout = 10000) {
  await page.waitForLoadState('networkidle', { timeout });
  await page.waitForTimeout(2000); // Esperar a que React se hidrate
}

// =====================================================
// SETUP Y TEARDOWN
// =====================================================

test.beforeAll(async () => {
  // Crear directorio de screenshots si no existe
  await fs.mkdir('tests/screenshots', { recursive: true });
  console.log('🚀 Iniciando suite de pruebas Enterprise Panel Admin');
});

test.afterAll(async () => {
  // Generar reporte final
  const reportPath = `tests/reports/diagnostic-report-${Date.now()}.json`;
  await fs.mkdir('tests/reports', { recursive: true });
  await fs.writeFile(reportPath, JSON.stringify(diagnosticReport, null, 2));
  
  console.log('\n📊 REPORTE DE DIAGNÓSTICO ENTERPRISE');
  console.log('=====================================');
  console.log(`📅 Timestamp: ${diagnosticReport.timestamp}`);
  console.log(`📋 Total Tests: ${diagnosticReport.totalTests}`);
  console.log(`✅ Implementadas: ${diagnosticReport.implemented} (${((diagnosticReport.implemented / diagnosticReport.totalTests) * 100).toFixed(1)}%)`);
  console.log(`🚧 Placeholders: ${diagnosticReport.placeholders} (${((diagnosticReport.placeholders / diagnosticReport.totalTests) * 100).toFixed(1)}%)`);
  console.log(`❌ Errores: ${diagnosticReport.errors} (${((diagnosticReport.errors / diagnosticReport.totalTests) * 100).toFixed(1)}%)`);
  console.log(`🔍 No Encontradas: ${diagnosticReport.notFound} (${((diagnosticReport.notFound / diagnosticReport.totalTests) * 100).toFixed(1)}%)`);
  
  console.log('\n📊 RESUMEN POR MÓDULO:');
  Object.entries(diagnosticReport.summary).forEach(([module, stats]) => {
    const percentage = stats.total > 0 ? ((stats.implemented / stats.total) * 100).toFixed(1) : '0';
    console.log(`  ${module.toUpperCase()}: ${stats.implemented}/${stats.total} (${percentage}%)`);
  });
  
  console.log(`\n📄 Reporte completo guardado en: ${reportPath}`);
});

// =====================================================
// TESTS PRINCIPALES
// =====================================================

test.describe('Panel Administrativo Enterprise - Pinteya E-commerce', () => {
  
  test('1. Flujo de Órdenes Enterprise', async ({ page }) => {
    console.log('\n🔍 Probando Módulo de Órdenes Enterprise...');
    
    const apiCalls = await interceptApiCalls(page);
    
    try {
      // Navegar a órdenes
      await page.goto('/admin/orders');
      await waitForPageLoad(page);
      
      // Verificar que la página carga
      const title = await page.locator('h1').textContent();
      if (title?.includes('Gestión de Órdenes')) {
        await addTestResult({
          module: 'orders',
          functionality: 'Navegación a /admin/orders',
          status: 'IMPLEMENTED',
          details: 'Página carga correctamente con título enterprise'
        });
      } else {
        await addTestResult({
          module: 'orders',
          functionality: 'Navegación a /admin/orders',
          status: 'ERROR',
          details: `Título inesperado: ${title}`,
          screenshot: await captureScreenshot(page, 'orders-navigation-error')
        });
      }

      // Verificar métricas
      const metricsCards = await page.locator('[data-testid="metrics-card"], .grid .card').count();
      if (metricsCards >= 4) {
        const hasPlaceholder = await checkForPlaceholder(page, '.grid');
        await addTestResult({
          module: 'orders',
          functionality: 'Métricas de Órdenes',
          status: hasPlaceholder ? 'PLACEHOLDER' : 'IMPLEMENTED',
          details: `${metricsCards} tarjetas de métricas encontradas`
        });
      } else {
        await addTestResult({
          module: 'orders',
          functionality: 'Métricas de Órdenes',
          status: 'ERROR',
          details: `Solo ${metricsCards} métricas encontradas, esperadas 4+`,
          screenshot: await captureScreenshot(page, 'orders-metrics-error')
        });
      }

      // Verificar filtros de búsqueda
      const searchInput = page.locator('input[placeholder*="Buscar"], input[placeholder*="orden"]');
      if (await searchInput.count() > 0) {
        await addTestResult({
          module: 'orders',
          functionality: 'Filtros de Búsqueda',
          status: 'IMPLEMENTED',
          details: 'Input de búsqueda encontrado'
        });
        
        // Probar búsqueda
        await searchInput.fill('test');
        await page.waitForTimeout(1000);
      } else {
        await addTestResult({
          module: 'orders',
          functionality: 'Filtros de Búsqueda',
          status: 'NOT_FOUND',
          details: 'Input de búsqueda no encontrado'
        });
      }

      // Verificar operaciones masivas
      const bulkOperations = page.locator('button:has-text("Acciones masivas"), button:has-text("Operaciones masivas")');
      if (await bulkOperations.count() > 0) {
        await addTestResult({
          module: 'orders',
          functionality: 'Operaciones Masivas',
          status: 'IMPLEMENTED',
          details: 'Botón de operaciones masivas encontrado'
        });
      } else {
        await addTestResult({
          module: 'orders',
          functionality: 'Operaciones Masivas',
          status: 'NOT_FOUND',
          details: 'Botón de operaciones masivas no encontrado'
        });
      }

      // Verificar tabs
      const tabs = page.locator('[role="tablist"] button, .tabs button');
      const tabCount = await tabs.count();
      if (tabCount >= 3) {
        await addTestResult({
          module: 'orders',
          functionality: 'Sistema de Tabs',
          status: 'IMPLEMENTED',
          details: `${tabCount} tabs encontrados`
        });
      } else {
        await addTestResult({
          module: 'orders',
          functionality: 'Sistema de Tabs',
          status: 'ERROR',
          details: `Solo ${tabCount} tabs encontrados, esperados 3+`
        });
      }

    } catch (error) {
      await addTestResult({
        module: 'orders',
        functionality: 'Flujo General',
        status: 'ERROR',
        details: `Error general: ${error}`,
        screenshot: await captureScreenshot(page, 'orders-general-error')
      });
    }
  });

  test('2. Flujo de Productos Enterprise', async ({ page }) => {
    console.log('\n🔍 Probando Módulo de Productos Enterprise...');
    
    try {
      // Navegar a productos
      await page.goto('/admin/products');
      await waitForPageLoad(page);
      
      // Verificar navegación
      const title = await page.locator('h1').textContent();
      if (title?.includes('Gestión de Productos')) {
        await addTestResult({
          module: 'products',
          functionality: 'Navegación a /admin/products',
          status: 'IMPLEMENTED',
          details: 'Página carga correctamente'
        });
      } else {
        await addTestResult({
          module: 'products',
          functionality: 'Navegación a /admin/products',
          status: 'ERROR',
          details: `Título inesperado: ${title}`,
          screenshot: await captureScreenshot(page, 'products-navigation-error')
        });
      }

      // Verificar métricas de productos
      const metricsCards = await page.locator('.grid .card').count();
      if (metricsCards >= 4) {
        await addTestResult({
          module: 'products',
          functionality: 'Métricas de Productos',
          status: 'IMPLEMENTED',
          details: `${metricsCards} métricas encontradas`
        });
      } else {
        await addTestResult({
          module: 'products',
          functionality: 'Métricas de Productos',
          status: 'ERROR',
          details: `Solo ${metricsCards} métricas encontradas`
        });
      }

      // Verificar operaciones masivas
      const bulkOpsCard = page.locator('text="Operaciones Masivas"').first();
      if (await bulkOpsCard.count() > 0) {
        await addTestResult({
          module: 'products',
          functionality: 'Operaciones Masivas',
          status: 'IMPLEMENTED',
          details: 'Sección de operaciones masivas encontrada'
        });

        // Verificar botones de import/export
        const importBtn = page.locator('button:has-text("Importar")');
        const exportBtn = page.locator('button:has-text("Exportar")');
        
        if (await importBtn.count() > 0 && await exportBtn.count() > 0) {
          await addTestResult({
            module: 'products',
            functionality: 'Import/Export CSV',
            status: 'IMPLEMENTED',
            details: 'Botones de import/export encontrados'
          });
        } else {
          await addTestResult({
            module: 'products',
            functionality: 'Import/Export CSV',
            status: 'NOT_FOUND',
            details: 'Botones de import/export no encontrados'
          });
        }
      } else {
        await addTestResult({
          module: 'products',
          functionality: 'Operaciones Masivas',
          status: 'NOT_FOUND',
          details: 'Sección de operaciones masivas no encontrada'
        });
      }

      // Verificar tabs de productos
      const tabs = page.locator('[role="tablist"] button');
      const tabCount = await tabs.count();
      if (tabCount >= 3) {
        await addTestResult({
          module: 'products',
          functionality: 'Tabs (Productos/Analytics/Inventario)',
          status: 'IMPLEMENTED',
          details: `${tabCount} tabs encontrados`
        });

        // Probar tab de Analytics
        const analyticsTab = page.locator('button:has-text("Analytics")');
        if (await analyticsTab.count() > 0) {
          await analyticsTab.click();
          await page.waitForTimeout(1000);
          
          const hasPlaceholder = await checkForPlaceholder(page);
          await addTestResult({
            module: 'products',
            functionality: 'Tab Analytics',
            status: hasPlaceholder ? 'PLACEHOLDER' : 'IMPLEMENTED',
            details: hasPlaceholder ? 'Muestra placeholder "en desarrollo"' : 'Contenido implementado'
          });
        }
      } else {
        await addTestResult({
          module: 'products',
          functionality: 'Tabs (Productos/Analytics/Inventario)',
          status: 'ERROR',
          details: `Solo ${tabCount} tabs encontrados`
        });
      }

    } catch (error) {
      await addTestResult({
        module: 'products',
        functionality: 'Flujo General',
        status: 'ERROR',
        details: `Error general: ${error}`,
        screenshot: await captureScreenshot(page, 'products-general-error')
      });
    }
  });

  test('3. Flujo de Logística Enterprise', async ({ page }) => {
    console.log('\n🔍 Probando Módulo de Logística Enterprise...');
    
    try {
      // Navegar a logística
      await page.goto('/admin/logistics');
      await waitForPageLoad(page);
      
      // Verificar navegación
      const pageLoaded = await page.locator('h1, h2, [data-testid="logistics-dashboard"]').count() > 0;
      if (pageLoaded) {
        await addTestResult({
          module: 'logistics',
          functionality: 'Navegación a /admin/logistics',
          status: 'IMPLEMENTED',
          details: 'Página de logística carga correctamente'
        });
      } else {
        await addTestResult({
          module: 'logistics',
          functionality: 'Navegación a /admin/logistics',
          status: 'ERROR',
          details: 'Página no carga correctamente',
          screenshot: await captureScreenshot(page, 'logistics-navigation-error')
        });
      }

      // Verificar dashboard de métricas
      const metricsCards = await page.locator('.card, [data-testid="metric-card"]').count();
      if (metricsCards >= 4) {
        await addTestResult({
          module: 'logistics',
          functionality: 'Dashboard de Métricas',
          status: 'IMPLEMENTED',
          details: `${metricsCards} métricas encontradas`
        });
      } else {
        await addTestResult({
          module: 'logistics',
          functionality: 'Dashboard de Métricas',
          status: 'ERROR',
          details: `Solo ${metricsCards} métricas encontradas`
        });
      }

      // Verificar tabs de logística
      const tabs = page.locator('[role="tablist"] button, .tabs button');
      const tabCount = await tabs.count();
      if (tabCount >= 4) {
        await addTestResult({
          module: 'logistics',
          functionality: 'Tabs de Logística',
          status: 'IMPLEMENTED',
          details: `${tabCount} tabs encontrados`
        });
      } else {
        await addTestResult({
          module: 'logistics',
          functionality: 'Tabs de Logística',
          status: 'ERROR',
          details: `Solo ${tabCount} tabs encontrados`
        });
      }

      // Verificar carriers
      const carriersSection = page.locator('text="Carriers", text="Transportistas"');
      if (await carriersSection.count() > 0) {
        await addTestResult({
          module: 'logistics',
          functionality: 'Gestión de Carriers',
          status: 'IMPLEMENTED',
          details: 'Sección de carriers encontrada'
        });
      } else {
        await addTestResult({
          module: 'logistics',
          functionality: 'Gestión de Carriers',
          status: 'NOT_FOUND',
          details: 'Sección de carriers no encontrada'
        });
      }

    } catch (error) {
      await addTestResult({
        module: 'logistics',
        functionality: 'Flujo General',
        status: 'ERROR',
        details: `Error general: ${error}`,
        screenshot: await captureScreenshot(page, 'logistics-general-error')
      });
    }
  });

  test('4. Integración Órdenes-Logística', async ({ page }) => {
    console.log('\n🔍 Probando Integración Órdenes-Logística...');
    
    try {
      // Ir a órdenes primero
      await page.goto('/admin/orders');
      await waitForPageLoad(page);
      
      // Buscar una orden para probar integración
      const orderRows = page.locator('table tbody tr, [data-testid="order-row"]');
      const orderCount = await orderRows.count();
      
      if (orderCount > 0) {
        await addTestResult({
          module: 'integration',
          functionality: 'Lista de Órdenes para Integración',
          status: 'IMPLEMENTED',
          details: `${orderCount} órdenes encontradas`
        });

        // Intentar hacer clic en la primera orden
        const firstOrder = orderRows.first();
        const viewButton = firstOrder.locator('button:has-text("Ver"), button[aria-label*="ver"]');
        
        if (await viewButton.count() > 0) {
          await addTestResult({
            module: 'integration',
            functionality: 'Botón Ver Detalle de Orden',
            status: 'IMPLEMENTED',
            details: 'Botón de ver detalle encontrado'
          });
        } else {
          await addTestResult({
            module: 'integration',
            functionality: 'Botón Ver Detalle de Orden',
            status: 'NOT_FOUND',
            details: 'Botón de ver detalle no encontrado'
          });
        }
      } else {
        await addTestResult({
          module: 'integration',
          functionality: 'Lista de Órdenes para Integración',
          status: 'ERROR',
          details: 'No se encontraron órdenes para probar integración'
        });
      }

      // Verificar si existe funcionalidad de crear envío
      const createShipmentBtn = page.locator('button:has-text("Crear Envío"), button:has-text("Nuevo Envío")');
      if (await createShipmentBtn.count() > 0) {
        await addTestResult({
          module: 'integration',
          functionality: 'Crear Envío desde Orden',
          status: 'IMPLEMENTED',
          details: 'Botón crear envío encontrado'
        });
      } else {
        await addTestResult({
          module: 'integration',
          functionality: 'Crear Envío desde Orden',
          status: 'NOT_FOUND',
          details: 'Funcionalidad de crear envío no encontrada'
        });
      }

    } catch (error) {
      await addTestResult({
        module: 'integration',
        functionality: 'Flujo General de Integración',
        status: 'ERROR',
        details: `Error general: ${error}`,
        screenshot: await captureScreenshot(page, 'integration-general-error')
      });
    }
  });

  test('5. Diagnóstico de APIs y Responsividad', async ({ page }) => {
    console.log('\n🔍 Probando APIs y Responsividad...');
    
    const apiCalls = await interceptApiCalls(page);
    
    try {
      // Probar diferentes tamaños de pantalla
      const viewports = [
        { width: 1920, height: 1080, name: 'Desktop' },
        { width: 768, height: 1024, name: 'Tablet' },
        { width: 375, height: 667, name: 'Mobile' }
      ];

      for (const viewport of viewports) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto('/admin/orders');
        await waitForPageLoad(page);
        
        // Verificar que el contenido es visible
        const isVisible = await page.locator('h1').isVisible();
        await addTestResult({
          module: 'integration',
          functionality: `Responsividad ${viewport.name}`,
          status: isVisible ? 'IMPLEMENTED' : 'ERROR',
          details: `Viewport ${viewport.width}x${viewport.height} - Contenido ${isVisible ? 'visible' : 'no visible'}`
        });
      }

      // Resetear viewport
      await page.setViewportSize({ width: 1920, height: 1080 });

      // Verificar APIs principales
      const apiEndpoints = [
        '/admin/orders',
        '/admin/products', 
        '/admin/logistics'
      ];

      for (const endpoint of apiEndpoints) {
        await page.goto(endpoint);
        await waitForPageLoad(page);
        
        // Verificar errores de JavaScript
        const errors: string[] = [];
        page.on('pageerror', (error) => {
          errors.push(error.message);
        });

        await page.waitForTimeout(2000);

        if (errors.length === 0) {
          await addTestResult({
            module: 'integration',
            functionality: `JavaScript Errors ${endpoint}`,
            status: 'IMPLEMENTED',
            details: 'No se detectaron errores de JavaScript'
          });
        } else {
          await addTestResult({
            module: 'integration',
            functionality: `JavaScript Errors ${endpoint}`,
            status: 'ERROR',
            details: `Errores detectados: ${errors.join(', ')}`,
            screenshot: await captureScreenshot(page, `js-errors-${endpoint.replace(/\//g, '-')}`)
          });
        }
      }

    } catch (error) {
      await addTestResult({
        module: 'integration',
        functionality: 'Diagnóstico APIs y Responsividad',
        status: 'ERROR',
        details: `Error general: ${error}`,
        screenshot: await captureScreenshot(page, 'diagnostic-general-error')
      });
    }
  });

});
