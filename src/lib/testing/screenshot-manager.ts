import { promises as fs } from 'fs';
import path from 'path';
import { Page, Browser, chromium, firefox, webkit } from 'playwright';

export interface ScreenshotOptions {
  fullPage?: boolean;
  quality?: number;
  type?: 'png' | 'jpeg';
  clip?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  mask?: string[]; // CSS selectors to mask
  annotations?: {
    text: string;
    x: number;
    y: number;
    color?: string;
  }[];
}

export interface ScreenshotMetadata {
  filename: string;
  path: string;
  timestamp: string;
  description?: string;
  url?: string;
  viewport?: { width: number; height: number } | undefined;
  fileSize?: number;
  duration?: number;
}

export class ScreenshotManager {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private screenshotsDir: string;
  private browserType: 'chromium' | 'firefox' | 'webkit';

  constructor(options?: {
    screenshotsDir?: string;
    browserType?: 'chromium' | 'firefox' | 'webkit';
  }) {
    this.screenshotsDir = options?.screenshotsDir || path.join(process.cwd(), 'test-screenshots');
    this.browserType = options?.browserType || 'chromium';
  }

  /**
   * Inicializa el navegador y la página
   */
  async initialize(options?: {
    headless?: boolean;
    viewport?: { width: number; height: number };
    userAgent?: string;
  }): Promise<void> {
    try {
      // Seleccionar el navegador
      switch (this.browserType) {
        case 'firefox':
          this.browser = await firefox.launch({ headless: options?.headless ?? true });
          break;
        case 'webkit':
          this.browser = await webkit.launch({ headless: options?.headless ?? true });
          break;
        default:
          this.browser = await chromium.launch({ headless: options?.headless ?? true });
      }

      // Crear contexto y página
      const contextOptions: any = {
        viewport: options?.viewport || { width: 1920, height: 1080 }
      };
      
      if (options?.userAgent) {
        contextOptions.userAgent = options.userAgent;
      }
      
      const context = await this.browser.newContext(contextOptions);

      this.page = await context.newPage();
      
      // Asegurar que el directorio de screenshots existe
      await fs.mkdir(this.screenshotsDir, { recursive: true });
      
      console.log(`🌐 Navegador ${this.browserType} inicializado`);
      
    } catch (error) {
      console.error('Error inicializando navegador:', error);
      throw error;
    }
  }

  /**
   * Navega a una URL
   */
  async navigateTo(url: string, options?: {
    waitUntil?: 'load' | 'domcontentloaded' | 'networkidle';
    timeout?: number;
  }): Promise<void> {
    if (!this.page) {
      throw new Error('Navegador no inicializado. Llama a initialize() primero.');
    }

    try {
      await this.page.goto(url, {
        waitUntil: options?.waitUntil || 'networkidle',
        timeout: options?.timeout || 30000
      });
      
      console.log(`🔗 Navegado a: ${url}`);
      
    } catch (error) {
      console.error(`Error navegando a ${url}:`, error);
      throw error;
    }
  }

  /**
   * Captura una screenshot con opciones avanzadas
   */
  async captureScreenshot(
    filename: string,
    description: string,
    options?: ScreenshotOptions
  ): Promise<ScreenshotMetadata> {
    if (!this.page) {
      throw new Error('Navegador no inicializado. Llama a initialize() primero.');
    }

    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    const timestampForFile = timestamp.replace(/[:.]/g, '-');
    
    try {
      // Preparar nombre del archivo
      const fileExtension = options?.type || 'png';
      const fullFilename = `${timestampForFile}-${filename}.${fileExtension}`;
      const screenshotPath = path.join(this.screenshotsDir, fullFilename);

      // Aplicar máscaras si se especifican
      if (options?.mask && options.mask.length > 0) {
        for (const selector of options.mask) {
          await this.page.locator(selector).evaluate(el => {
            (el as HTMLElement).style.filter = 'blur(10px)';
          }).catch(() => {});
        }
      }

      // Capturar screenshot
      const screenshotOptions: any = {
        path: screenshotPath,
        fullPage: options?.fullPage || false,
        type: options?.type || 'png'
      };
      
      // Solo agregar quality para JPEG
      if (options?.type === 'jpeg' && options?.quality) {
        screenshotOptions.quality = options.quality;
      }
      
      if (options?.clip) {
        screenshotOptions.clip = options.clip;
      }
      
      const screenshotBuffer = await this.page.screenshot(screenshotOptions);

      // Agregar anotaciones si se especifican
      if (options?.annotations && options.annotations.length > 0) {
        await this.addAnnotations(options.annotations);
      }

      const duration = Date.now() - startTime;
      const fileStats = await fs.stat(screenshotPath);
      const currentUrl = this.page.url();
      const viewport = this.page.viewportSize();

      const metadata: ScreenshotMetadata = {
        filename: fullFilename,
        path: screenshotPath,
        timestamp,
        description,
        url: currentUrl,
        viewport: viewport ?? undefined,
        fileSize: fileStats.size,
        duration
      };

      console.log(`📸 Screenshot capturada: ${fullFilename} (${fileStats.size} bytes, ${duration}ms)`);
      
      return metadata;
      
    } catch (error) {
      console.error('Error capturando screenshot:', error);
      throw error;
    }
  }

  /**
   * Captura screenshot de un elemento específico
   */
  async captureElementScreenshot(
    selector: string,
    filename: string,
    description: string,
    options?: Omit<ScreenshotOptions, 'fullPage' | 'clip'>
  ): Promise<ScreenshotMetadata> {
    if (!this.page) {
      throw new Error('Navegador no inicializado. Llama a initialize() primero.');
    }

    try {
      const element = await this.page.locator(selector).first();
      await element.waitFor({ state: 'visible', timeout: 10000 });
      
      const boundingBox = await element.boundingBox();
      if (!boundingBox) {
        throw new Error(`Elemento no encontrado o no visible: ${selector}`);
      }

      return await this.captureScreenshot(filename, description, {
        ...options,
        clip: boundingBox
      });
      
    } catch (error) {
      console.error(`Error capturando screenshot del elemento ${selector}:`, error);
      throw error;
    }
  }

  /**
   * Agrega anotaciones visuales a la página
   */
  private async addAnnotations(annotations: ScreenshotOptions['annotations']): Promise<void> {
    if (!this.page || !annotations) {return;}

    for (const annotation of annotations) {
      await this.page.evaluate((ann) => {
        const div = document.createElement('div');
        div.textContent = ann.text;
        div.style.position = 'absolute';
        div.style.left = `${ann.x}px`;
        div.style.top = `${ann.y}px`;
        div.style.background = ann.color || 'red';
        div.style.color = 'white';
        div.style.padding = '4px 8px';
        div.style.borderRadius = '4px';
        div.style.fontSize = '12px';
        div.style.fontFamily = 'Arial, sans-serif';
        div.style.zIndex = '9999';
        div.style.pointerEvents = 'none';
        document.body.appendChild(div);
      }, annotation);
    }
  }

  /**
   * Espera a que un elemento sea visible antes de capturar
   */
  async waitAndCapture(
    selector: string,
    filename: string,
    description: string,
    options?: ScreenshotOptions & { timeout?: number }
  ): Promise<ScreenshotMetadata> {
    if (!this.page) {
      throw new Error('Navegador no inicializado. Llama a initialize() primero.');
    }

    try {
      await this.page.locator(selector).waitFor({ 
        state: 'visible', 
        timeout: options?.timeout || 10000 
      });
      
      return await this.captureScreenshot(filename, description, options);
      
    } catch (error) {
      console.error(`Error esperando elemento ${selector}:`, error);
      // Capturar screenshot de error
      return await this.captureScreenshot(
        `error-${filename}`,
        `Error esperando: ${description}`,
        options
      );
    }
  }

  /**
   * Captura múltiples screenshots con delay
   */
  async captureSequence(
    screenshots: Array<{
      filename: string;
      description: string;
      delay?: number;
      options?: ScreenshotOptions;
    }>
  ): Promise<ScreenshotMetadata[]> {
    const results: ScreenshotMetadata[] = [];

    for (const screenshot of screenshots) {
      if (screenshot.delay) {
        await this.page?.waitForTimeout(screenshot.delay);
      }
      
      const metadata = await this.captureScreenshot(
        screenshot.filename,
        screenshot.description,
        screenshot.options
      );
      
      results.push(metadata);
    }

    return results;
  }

  /**
   * Obtiene información de la página actual
   */
  async getPageInfo(): Promise<{
    url: string;
    title: string;
    viewport: { width: number; height: number } | null;
    userAgent: string;
  }> {
    if (!this.page) {
      throw new Error('Navegador no inicializado. Llama a initialize() primero.');
    }

    return {
      url: this.page.url(),
      title: await this.page.title(),
      viewport: this.page.viewportSize(),
      userAgent: await this.page.evaluate(() => navigator.userAgent)
    };
  }

  /**
   * Cierra el navegador
   */
  async close(): Promise<void> {
    try {
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
        this.page = null;
        console.log('🔒 Navegador cerrado');
      }
    } catch (error) {
      console.error('Error cerrando navegador:', error);
    }
  }

  /**
   * Obtiene la página actual (para operaciones avanzadas)
   */
  getPage(): Page | null {
    return this.page;
  }
}

// Instancia global del screenshot manager
export const screenshotManager = new ScreenshotManager();









