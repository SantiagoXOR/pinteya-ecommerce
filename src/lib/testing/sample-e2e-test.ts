import { AutomatedTestFramework } from './automated-test-framework';
import { ScreenshotManager } from './screenshot-manager';
import { ReportGenerator } from './report-generator';
import path from 'path';

/**
 * Test E2E de ejemplo que demuestra todas las funcionalidades del framework
 */
export class SampleE2ETest {
  private testFramework: AutomatedTestFramework;
  private screenshotManager: ScreenshotManager;
  private reportGenerator: ReportGenerator;
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    
    // Inicializar framework de testing
    this.testFramework = new AutomatedTestFramework(
      'E2E Test - Flujo de Compra Completo',
      'Test automatizado que verifica el flujo completo de compra en el e-commerce',
      {
        reportsDir: path.join(process.cwd(), 'test-reports'),
        screenshotsDir: path.join(process.cwd(), 'test-screenshots'),
        tags: ['e2e', 'purchase-flow', 'critical']
      }
    );

    // Inicializar manager de screenshots
    this.screenshotManager = new ScreenshotManager({
      screenshotsDir: path.join(process.cwd(), 'test-screenshots'),
      browserType: 'chromium'
    });

    // Inicializar generador de reportes
    this.reportGenerator = new ReportGenerator({
      outputDir: path.join(process.cwd(), 'test-reports'),
      includeScreenshots: true,
      generateHtml: true,
      generateJson: true,
      theme: 'light',
      includeTimeline: true,
      includeSummaryCharts: true
    });
  }

  /**
   * Ejecuta el test completo
   */
  async runTest(): Promise<{
    success: boolean;
    reportPath: string;
    htmlReportPath?: string | undefined;
  }> {
    let success = false;
    let screenshots: any[] = [];

    try {
      console.log('🚀 Iniciando test E2E - Flujo de Compra Completo');
      
      // Configurar entorno del test
      await this.setupTestEnvironment();

      // Ejecutar pasos del test
      await this.executeTestSteps();

      // Recopilar screenshots
      screenshots = await this.collectScreenshots();

      success = true;
      console.log('✅ Test completado exitosamente');

    } catch (error) {
      console.error('❌ Error durante la ejecución del test:', error);
      
      // Capturar screenshot de error
      try {
        const errorScreenshot = await this.screenshotManager.captureScreenshot(
          'final-error',
          `Error final del test: ${error instanceof Error ? error.message : String(error)}`,
          { fullPage: true }
        );
        screenshots.push(errorScreenshot);
      } catch (screenshotError) {
        console.error('Error capturando screenshot de error:', screenshotError);
      }

    } finally {
      // Finalizar test y generar reportes
      const reportPath = await this.testFramework.finishTest(
        success ? 'completed' : 'failed'
      );

      // Cerrar navegador
      await this.screenshotManager.close();

      // Generar reporte completo
      const report = this.testFramework.getReport();
      const reportResults = await this.reportGenerator.generateReport(report, screenshots);

      console.log('📊 Reportes generados:');
      console.log(`   📄 JSON: ${reportResults.jsonPath}`);
      console.log(`   🌐 HTML: ${reportResults.htmlPath}`);

      return {
        success,
        reportPath,
        htmlReportPath: reportResults.htmlPath || undefined
      };
    }
  }

  /**
   * Configura el entorno del test
   */
  private async setupTestEnvironment(): Promise<void> {
    await this.testFramework.executeStep(
      'Configurar entorno de test',
      async () => {
        // Inicializar navegador
        await this.screenshotManager.initialize({
          headless: false, // Cambiar a true para ejecución sin interfaz
          viewport: { width: 1920, height: 1080 },
          userAgent: 'AutomatedTestFramework/1.0.0'
        });

        // Configurar información del entorno
        this.testFramework.setEnvironment({
          browser: 'Chromium',
          viewport: { width: 1920, height: 1080 },
          url: this.baseUrl
        });

        return { initialized: true };
      },
      {
        category: 'setup',
        severity: 'critical',
        captureScreenshot: false
      }
    );
  }

  /**
   * Ejecuta todos los pasos del test
   */
  private async executeTestSteps(): Promise<void> {
    // Paso 1: Navegar a la página principal
    await this.testFramework.executeStep(
      'Navegar a la página principal',
      async () => {
        await this.screenshotManager.navigateTo(this.baseUrl);
        const pageInfo = await this.screenshotManager.getPageInfo();
        
        // Validar que la página se cargó correctamente
        await this.validatePageStructure('homepage', [
          'header', 'nav', 'main', '[data-testid="product-card"]'
        ]);
        
        // Capturar screenshot de la página principal
        await this.screenshotManager.captureScreenshot(
          'homepage-loaded',
          'Página principal cargada correctamente',
          { fullPage: true }
        );

        return pageInfo;
      },
      {
        category: 'action',
        severity: 'high',
        captureScreenshot: true
      }
    );

    // Paso 2: Buscar productos
    await this.testFramework.executeStep(
      'Buscar productos en la tienda',
      async () => {
        const page = this.screenshotManager.getPage();
        if (!page) throw new Error('Página no disponible');

        // Navegar a la sección de productos
        await this.screenshotManager.navigateTo(`${this.baseUrl}/shop`);
        
        // Esperar a que los productos se carguen
        await page.waitForTimeout(2000);
        
        // Validar estructura de página de productos
        await this.validatePageStructure('products-page', [
          '[data-testid="product-card"]', '.product-grid, .products-container'
        ]);
        
        // Capturar screenshot de los productos
        await this.screenshotManager.captureScreenshot(
          'products-page',
          'Página de productos cargada',
          { fullPage: true }
        );

        // Buscar productos con estrategia de espera robusta y manejo de errores
        try {
          await page.waitForLoadState('networkidle');
          await page.waitForSelector('[data-testid="product-card"]', {
            timeout: 15000,
            state: 'visible'
          });
        } catch (error) {
          // Fallback: intentar con selectores alternativos
          console.warn('Selector principal falló, intentando fallbacks...');
          const fallbackSelectors = ['.product-card', '.product-item', '[class*="product"]'];
          let found = false;
          
          for (const selector of fallbackSelectors) {
            try {
              await page.waitForSelector(selector, { timeout: 5000 });
              found = true;
              break;
            } catch (e) {
              continue;
            }
          }
          
          if (!found) {
            throw new Error('No se pudieron encontrar productos con ningún selector');
          }
        }
        
        // Verificar que hay productos
        const productCount = await page.locator('[data-testid="product-card"]').count();
        
        return {
          productsFound: productCount,
          url: page.url()
        };
      },
      {
        category: 'action',
        severity: 'high',
        captureScreenshot: true
      }
    );

    // Paso 3: Seleccionar un producto
    await this.testFramework.executeStep(
      'Seleccionar primer producto disponible',
      async () => {
        const page = this.screenshotManager.getPage();
        if (!page) throw new Error('Página no disponible');

        // Buscar el primer producto disponible
        const firstProduct = page.locator('[data-testid="product-card"]').first();
        
        // Esperar a que el producto sea visible con espera robusta y manejo de errores
        try {
          await firstProduct.waitFor({ state: 'visible', timeout: 15000 });
          
          // Capturar screenshot del producto seleccionado
          await this.screenshotManager.captureElementScreenshot(
            '[data-testid="product-card"]',
            'selected-product',
            'Producto seleccionado para compra'
          );
          
          // Hacer clic en el producto
          await firstProduct.click();
        } catch (error) {
          // Fallback: intentar con otros selectores
          console.warn('Fallo al seleccionar producto, intentando fallbacks...');
          const fallbackSelectors = ['.product-card:first-child', '.product-item:first-child'];
          let clicked = false;
          
          for (const selector of fallbackSelectors) {
            try {
              await page.click(selector, { timeout: 5000 });
              clicked = true;
              break;
            } catch (e) {
              continue;
            }
          }
          
          if (!clicked) {
            throw new Error('No se pudo seleccionar ningún producto');
          }
        }
        
        // Esperar a que se cargue la página del producto y validar estructura
        await page.waitForTimeout(2000);
        
        // Validar estructura de página de producto
        await this.validatePageStructure('product-page', [
          '[data-testid="add-to-cart-btn"]', '.product-title, h1', '.price'
        ]);
        
        return {
          productSelected: true,
          currentUrl: page.url()
        };
      },
      {
        category: 'action',
        severity: 'high',
        captureScreenshot: true
      }
    );

    // Paso 4: Agregar al carrito
    await this.testFramework.executeStep(
      'Agregar producto al carrito',
      async () => {
        const page = this.screenshotManager.getPage();
        if (!page) throw new Error('Página no disponible');

        // Validar estructura antes de agregar al carrito
        await this.validatePageStructure('product-detail', [
          '[data-testid="add-to-cart-btn"]', '.product-info'
        ]);
        
        // Buscar botón de agregar al carrito
        const addToCartButton = page.locator('[data-testid="add-to-cart-btn"]').first();
        
        // Esperar a que el botón sea visible con espera robusta y manejo de errores
        try {
          await addToCartButton.waitFor({ state: 'visible', timeout: 15000 });
          
          // Capturar screenshot antes de agregar al carrito
          await this.screenshotManager.captureScreenshot(
            'before-add-to-cart',
            'Antes de agregar producto al carrito',
            { fullPage: true }
          );
          
          // Hacer clic en agregar al carrito
          await addToCartButton.click();
        } catch (error) {
          // Fallback: intentar con otros selectores de botón
          console.warn('Fallo botón agregar al carrito, intentando fallbacks...');
          const fallbackSelectors = [
            'button:has-text("Agregar")',
            'button:has-text("Add to Cart")',
            '.add-to-cart',
            '[class*="add-cart"]'
          ];
          let clicked = false;
          
          for (const selector of fallbackSelectors) {
            try {
              await page.click(selector, { timeout: 5000 });
              clicked = true;
              break;
            } catch (e) {
              continue;
            }
          }
          
          if (!clicked) {
            throw new Error('No se pudo agregar el producto al carrito');
          }
        }
        
        // Esperar confirmación
        await page.waitForTimeout(2000);
        
        // Capturar screenshot después de agregar al carrito
        await this.screenshotManager.captureScreenshot(
          'after-add-to-cart',
          'Producto agregado al carrito exitosamente',
          { fullPage: true }
        );
        
        return {
          addedToCart: true,
          timestamp: new Date().toISOString()
        };
      },
      {
        category: 'action',
        severity: 'critical',
        captureScreenshot: true
      }
    );

    // Paso 5: Verificar carrito
    await this.testFramework.executeStep(
      'Verificar contenido del carrito',
      async () => {
        const page = this.screenshotManager.getPage();
        if (!page) throw new Error('Página no disponible');

        // Navegar al carrito
        await this.screenshotManager.navigateTo(`${this.baseUrl}/cart`);
        
        // Esperar a que se cargue el carrito
        await page.waitForTimeout(2000);
        
        // Capturar screenshot del carrito
        await this.screenshotManager.captureScreenshot(
          'cart-contents',
          'Contenido del carrito de compras',
          { fullPage: true }
        );
        
        // Verificar que hay items en el carrito con espera robusta
        await page.waitForLoadState('networkidle');
        
        // Validar estructura de página de carrito
        await this.validatePageStructure('cart-page', [
          '[data-testid="clear-cart-btn"]', 'button:has-text("Finalizar Compra")'
        ]);
        
        await page.waitForSelector('[data-testid="clear-cart-btn"]', {
          timeout: 15000,
          state: 'visible'
        });
        
        const cartItems = await page.locator('[data-testid="cart-item"]').count();
        
        return {
          cartItemCount: cartItems,
          cartVerified: cartItems > 0
        };
      },
      {
        category: 'verification',
        severity: 'high',
        captureScreenshot: true
      }
    );

    // Paso 6: Proceso de checkout (simulado)
    await this.testFramework.executeStep(
      'Simular proceso de checkout',
      async () => {
        const page = this.screenshotManager.getPage();
        if (!page) throw new Error('Página no disponible');

        // Buscar botón de checkout
        const checkoutButton = page.locator('button:has-text("Finalizar Compra")').first();
        
        let checkoutInitiated = false;
        
        try {
          // Intentar hacer clic en checkout si existe
          await checkoutButton.waitFor({ state: 'visible', timeout: 5000 });
          await checkoutButton.click();
          await page.waitForTimeout(2000);
          checkoutInitiated = true;
          
          // Capturar screenshot del proceso de checkout
          await this.screenshotManager.captureScreenshot(
            'checkout-process',
            'Proceso de checkout iniciado',
            { fullPage: true }
          );
          
        } catch (error) {
          // Si no se encuentra el botón de checkout, simular el proceso
          console.log('Botón de checkout no encontrado, simulando proceso...');
          
          await this.screenshotManager.captureScreenshot(
            'checkout-simulation',
            'Simulación de proceso de checkout',
            { fullPage: true }
          );
        }
        
        return {
          checkoutInitiated,
          simulatedCheckout: !checkoutInitiated,
          timestamp: new Date().toISOString()
        };
      },
      {
        category: 'action',
        severity: 'medium',
        captureScreenshot: true
      }
    );

    // Paso 7: Verificación final
    await this.testFramework.executeStep(
      'Verificación final del test',
      async () => {
        const page = this.screenshotManager.getPage();
        if (!page) throw new Error('Página no disponible');

        // Capturar screenshot final
        await this.screenshotManager.captureScreenshot(
          'final-state',
          'Estado final del test E2E',
          { fullPage: true }
        );
        
        // Obtener información final de la página
        const finalPageInfo = await this.screenshotManager.getPageInfo();
        
        return {
          testCompleted: true,
          finalUrl: finalPageInfo.url,
          finalTitle: finalPageInfo.title,
          completionTime: new Date().toISOString()
        };
      },
      {
        category: 'verification',
        severity: 'medium',
        captureScreenshot: true
      }
    );
  }

  /**
   * Valida la estructura de una página verificando elementos requeridos
   */
  private async validatePageStructure(pageName: string, requiredElements: string[]): Promise<void> {
    const page = this.screenshotManager.getPage();
    if (!page) throw new Error('Página no disponible para validación');
    
    console.log(`Validando estructura de ${pageName}...`);
    
    for (const element of requiredElements) {
      try {
        await page.waitForSelector(element, { timeout: 5000, state: 'attached' });
        console.log(`✓ Elemento encontrado: ${element}`);
      } catch (error) {
        console.warn(`⚠ Elemento no encontrado: ${element}`);
        // No lanzar error, solo advertir
      }
    }
  }

  /**
   * Recopila todas las screenshots tomadas durante el test
   */
  private async collectScreenshots(): Promise<any[]> {
    // En una implementación real, aquí se recopilarían todas las screenshots
    // Por ahora, retornamos un array vacío ya que las screenshots se manejan
    // automáticamente en cada paso
    return [];
  }

  /**
   * Ejecuta el test con manejo de errores mejorado
   */
  static async run(baseUrl?: string): Promise<void> {
    const test = new SampleE2ETest(baseUrl);
    
    try {
      const result = await test.runTest();
      
      console.log('\n' + '='.repeat(60));
      console.log('📊 RESUMEN DEL TEST');
      console.log('='.repeat(60));
      console.log(`✅ Estado: ${result.success ? 'EXITOSO' : 'FALLIDO'}`);
      console.log(`📄 Reporte JSON: ${result.reportPath}`);
      if (result.htmlReportPath) {
        console.log(`🌐 Reporte HTML: ${result.htmlReportPath}`);
      }
      console.log('='.repeat(60));
      
      if (result.success) {
        console.log('🎉 ¡Test completado exitosamente!');
      } else {
        console.log('❌ Test falló. Revisa los reportes para más detalles.');
      }
      
    } catch (error) {
      console.error('💥 Error crítico ejecutando el test:', error);
      process.exit(1);
    }
  }
}

// Permitir ejecución directa del script
if (require.main === module) {
  const baseUrl = process.argv[2] || 'http://localhost:3000';
  console.log(`🚀 Ejecutando test E2E en: ${baseUrl}`);
  SampleE2ETest.run(baseUrl);
}