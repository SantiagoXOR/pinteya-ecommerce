/**
 * Screenshot Manager
 * 
 * Gestiona la captura, almacenamiento y recuperación de screenshots
 * para tests automatizados y reportes de calidad.
 */

export interface ScreenshotOptions {
  name: string;
  stepName?: string;
  fullPage?: boolean;
  width?: number;
  height?: number;
  quality?: number;
  format?: 'png' | 'jpeg';
  selector?: string;
  timeout?: number;
}

export interface ScreenshotInfo {
  id: string;
  name: string;
  stepName?: string;
  url: string;
  thumbnailUrl?: string;
  timestamp: Date;
  size: number;
  dimensions: {
    width: number;
    height: number;
  };
  format: string;
  status: 'success' | 'failed' | 'pending';
  metadata?: {
    testId?: string;
    flowId?: string;
    stepId?: string;
    browser?: string;
    viewport?: string;
    userAgent?: string;
  };
}

export interface ScreenshotStorage {
  save(screenshot: Buffer, info: Omit<ScreenshotInfo, 'id' | 'url' | 'thumbnailUrl'>): Promise<ScreenshotInfo>;
  get(id: string): Promise<ScreenshotInfo | null>;
  list(filters?: ScreenshotFilters): Promise<ScreenshotInfo[]>;
  delete(id: string): Promise<boolean>;
}

export interface ScreenshotFilters {
  testId?: string;
  flowId?: string;
  stepId?: string;
  status?: 'success' | 'failed' | 'pending';
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
}

/**
 * Implementación de almacenamiento en memoria para desarrollo/testing
 */
class InMemoryScreenshotStorage implements ScreenshotStorage {
  private screenshots: Map<string, ScreenshotInfo> = new Map();
  private screenshotData: Map<string, Buffer> = new Map();

  async save(screenshot: Buffer, info: Omit<ScreenshotInfo, 'id' | 'url' | 'thumbnailUrl'>): Promise<ScreenshotInfo> {
    const id = this.generateId();
    const screenshotInfo: ScreenshotInfo = {
      ...info,
      id,
      url: `/api/screenshots/${id}`,
      thumbnailUrl: `/api/screenshots/${id}/thumbnail`,
      size: screenshot.length
    };

    this.screenshots.set(id, screenshotInfo);
    this.screenshotData.set(id, screenshot);

    return screenshotInfo;
  }

  async get(id: string): Promise<ScreenshotInfo | null> {
    return this.screenshots.get(id) || null;
  }

  async list(filters: ScreenshotFilters = {}): Promise<ScreenshotInfo[]> {
    let screenshots = Array.from(this.screenshots.values());

    // Aplicar filtros
    if (filters.testId) {
      screenshots = screenshots.filter(s => s.metadata?.testId === filters.testId);
    }
    if (filters.flowId) {
      screenshots = screenshots.filter(s => s.metadata?.flowId === filters.flowId);
    }
    if (filters.stepId) {
      screenshots = screenshots.filter(s => s.metadata?.stepId === filters.stepId);
    }
    if (filters.status) {
      screenshots = screenshots.filter(s => s.status === filters.status);
    }
    if (filters.dateFrom) {
      screenshots = screenshots.filter(s => s.timestamp >= filters.dateFrom!);
    }
    if (filters.dateTo) {
      screenshots = screenshots.filter(s => s.timestamp <= filters.dateTo!);
    }

    // Ordenar por timestamp descendente
    screenshots.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Aplicar límite
    if (filters.limit) {
      screenshots = screenshots.slice(0, filters.limit);
    }

    return screenshots;
  }

  async delete(id: string): Promise<boolean> {
    const deleted = this.screenshots.delete(id);
    this.screenshotData.delete(id);
    return deleted;
  }

  getScreenshotData(id: string): Buffer | null {
    return this.screenshotData.get(id) || null;
  }

  private generateId(): string {
    return `screenshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Manager principal para screenshots
 */
export class ScreenshotManager {
  private storage: ScreenshotStorage;
  private isInitialized: boolean = false;

  constructor(storage?: ScreenshotStorage) {
    this.storage = storage || new InMemoryScreenshotStorage();
  }

  /**
   * Inicializa el manager (para configuraciones que requieren setup)
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {return;}
    
    // Aquí se podría inicializar Playwright u otras dependencias
    console.log('📸 Inicializando Screenshot Manager...');
    this.isInitialized = true;
  }

  /**
   * Captura un screenshot
   */
  async captureScreenshot(options: ScreenshotOptions): Promise<ScreenshotInfo> {
    await this.initialize();

    try {
      console.log(`📸 Capturando screenshot: ${options.name}`);
      
      // Simular captura de screenshot (en producción usaríamos Playwright)
      const mockScreenshot = await this.generateMockScreenshot(options);
      
      const screenshotInfo = await this.storage.save(mockScreenshot.buffer, {
        name: options.name,
        stepName: options.stepName,
        timestamp: new Date(),
        dimensions: mockScreenshot.dimensions,
        format: options.format || 'png',
        status: 'success',
        metadata: {
          browser: 'chromium',
          viewport: `${options.width || 1280}x${options.height || 720}`,
          userAgent: 'Mozilla/5.0 (Test Browser)'
        }
      });

      console.log(`✅ Screenshot capturado: ${screenshotInfo.id}`);
      return screenshotInfo;

    } catch (error) {
      console.error(`❌ Error capturando screenshot: ${options.name}`, error);
      
      // Crear entrada de error
      const errorInfo = await this.storage.save(Buffer.alloc(0), {
        name: options.name,
        stepName: options.stepName,
        timestamp: new Date(),
        dimensions: { width: 0, height: 0 },
        format: 'png',
        status: 'failed',
        metadata: {
          error: error instanceof Error ? error.message : String(error)
        }
      });

      return errorInfo;
    }
  }

  /**
   * Captura múltiples screenshots en secuencia
   */
  async captureMultipleScreenshots(optionsList: ScreenshotOptions[]): Promise<ScreenshotInfo[]> {
    const results: ScreenshotInfo[] = [];
    
    for (const options of optionsList) {
      const screenshot = await this.captureScreenshot(options);
      results.push(screenshot);
      
      // Pequeña pausa entre capturas
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return results;
  }

  /**
   * Obtiene un screenshot por ID
   */
  async getScreenshot(id: string): Promise<ScreenshotInfo | null> {
    return await this.storage.get(id);
  }

  /**
   * Lista screenshots con filtros opcionales
   */
  async listScreenshots(filters?: ScreenshotFilters): Promise<ScreenshotInfo[]> {
    return await this.storage.list(filters);
  }

  /**
   * Elimina un screenshot
   */
  async deleteScreenshot(id: string): Promise<boolean> {
    return await this.storage.delete(id);
  }

  /**
   * Obtiene estadísticas de screenshots
   */
  async getStatistics(): Promise<{
    total: number;
    successful: number;
    failed: number;
    totalSize: number;
    averageSize: number;
    byFormat: Record<string, number>;
    byStatus: Record<string, number>;
  }> {
    const screenshots = await this.listScreenshots();
    
    const stats = {
      total: screenshots.length,
      successful: screenshots.filter(s => s.status === 'success').length,
      failed: screenshots.filter(s => s.status === 'failed').length,
      totalSize: screenshots.reduce((sum, s) => sum + s.size, 0),
      averageSize: 0,
      byFormat: {} as Record<string, number>,
      byStatus: {} as Record<string, number>
    };

    stats.averageSize = stats.total > 0 ? stats.totalSize / stats.total : 0;

    // Contar por formato
    screenshots.forEach(s => {
      stats.byFormat[s.format] = (stats.byFormat[s.format] || 0) + 1;
      stats.byStatus[s.status] = (stats.byStatus[s.status] || 0) + 1;
    });

    return stats;
  }

  /**
   * Limpia screenshots antiguos
   */
  async cleanupOldScreenshots(olderThanDays: number = 7): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    const screenshots = await this.listScreenshots({
      dateTo: cutoffDate
    });
    
    let deletedCount = 0;
    for (const screenshot of screenshots) {
      const deleted = await this.deleteScreenshot(screenshot.id);
      if (deleted) {deletedCount++;}
    }
    
    console.log(`🧹 Limpieza completada: ${deletedCount} screenshots eliminados`);
    return deletedCount;
  }

  /**
   * Genera un screenshot mock para desarrollo/testing
   */
  private async generateMockScreenshot(options: ScreenshotOptions): Promise<{
    buffer: Buffer;
    dimensions: { width: number; height: number };
  }> {
    // Simular tiempo de captura
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
    
    const width = options.width || 1280;
    const height = options.height || 720;
    
    // Generar datos mock de imagen (en producción sería la imagen real)
    const mockImageSize = Math.floor(width * height * 0.1); // Aproximación del tamaño
    const buffer = Buffer.alloc(mockImageSize);
    
    // Llenar con datos aleatorios para simular una imagen
    for (let i = 0; i < buffer.length; i++) {
      buffer[i] = Math.floor(Math.random() * 256);
    }
    
    return {
      buffer,
      dimensions: { width, height }
    };
  }

  /**
   * Obtiene los datos binarios de un screenshot (para la implementación en memoria)
   */
  getScreenshotData(id: string): Buffer | null {
    if (this.storage instanceof InMemoryScreenshotStorage) {
      return this.storage.getScreenshotData(id);
    }
    return null;
  }
}

// Instancia singleton del manager
export const screenshotManager = new ScreenshotManager();

// Utilidades para trabajar con screenshots
export class ScreenshotUtils {
  /**
   * Convierte un buffer de imagen a base64
   */
  static bufferToBase64(buffer: Buffer, format: string = 'png'): string {
    return `data:image/${format};base64,${buffer.toString('base64')}`;
  }

  /**
   * Genera un nombre de archivo para screenshot
   */
  static generateFilename(name: string, format: string = 'png', timestamp?: Date): string {
    const date = timestamp || new Date();
    const dateStr = date.toISOString().replace(/[:.]/g, '-');
    const safeName = name.replace(/[^a-zA-Z0-9-_]/g, '_');
    return `${safeName}_${dateStr}.${format}`;
  }

  /**
   * Calcula el tamaño legible de un archivo
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) {return '0 Bytes';}
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Valida las opciones de screenshot
   */
  static validateOptions(options: ScreenshotOptions): string[] {
    const errors: string[] = [];
    
    if (!options.name || options.name.trim() === '') {
      errors.push('El nombre del screenshot es requerido');
    }
    
    if (options.width && (options.width < 100 || options.width > 4000)) {
      errors.push('El ancho debe estar entre 100 y 4000 píxeles');
    }
    
    if (options.height && (options.height < 100 || options.height > 4000)) {
      errors.push('La altura debe estar entre 100 y 4000 píxeles');
    }
    
    if (options.quality && (options.quality < 0 || options.quality > 100)) {
      errors.push('La calidad debe estar entre 0 y 100');
    }
    
    return errors;
  }
}









