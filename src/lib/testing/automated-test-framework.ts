import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface TestStep {
  id: string;
  description: string;
  action: string;
  timestamp: string;
  duration: number;
  success: boolean;
  screenshot?: string | undefined;
  details: any;
  category: 'setup' | 'action' | 'verification' | 'cleanup';
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface TestReport {
  id: string;
  name: string;
  description: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  steps: TestStep[];
  summary: {
    totalSteps: number;
    successfulSteps: number;
    failedSteps: number;
    criticalErrors: number;
    warnings: number;
  };
  environment: {
    browser?: string;
    viewport?: { width: number; height: number };
    userAgent?: string;
    url?: string;
  };
  metadata: {
    testVersion: string;
    framework: string;
    executedBy: string;
    tags: string[];
  };
}

export class AutomatedTestFramework {
  private report: TestReport;
  private screenshotCounter: number = 0;
  private reportsDir: string;
  private screenshotsDir: string;

  constructor(testName: string, description: string, options?: {
    reportsDir?: string;
    screenshotsDir?: string;
    tags?: string[];
  }) {
    const testId = uuidv4();
    const timestamp = new Date().toISOString();
    
    this.reportsDir = options?.reportsDir || path.join(process.cwd(), 'test-reports');
    this.screenshotsDir = options?.screenshotsDir || path.join(process.cwd(), 'test-screenshots');
    
    this.report = {
      id: testId,
      name: testName,
      description,
      startTime: timestamp,
      status: 'running',
      steps: [],
      summary: {
        totalSteps: 0,
        successfulSteps: 0,
        failedSteps: 0,
        criticalErrors: 0,
        warnings: 0
      },
      environment: {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Node.js Environment'
      },
      metadata: {
        testVersion: '1.0.0',
        framework: 'AutomatedTestFramework',
        executedBy: 'System',
        tags: options?.tags || []
      }
    };
  }

  /**
   * Ejecuta un paso del test con documentación automática
   */
  async executeStep(
    description: string,
    action: () => Promise<any>,
    options?: {
      category?: TestStep['category'];
      severity?: TestStep['severity'];
      captureScreenshot?: boolean;
      expectedResult?: any;
    }
  ): Promise<any> {
    const stepId = uuidv4();
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    
    console.log(`🔄 Ejecutando paso: ${description}`);
    
    let result: any;
    let success = false;
    let screenshot: string | undefined;
    
    try {
      // Capturar screenshot antes de la acción si es requerido
      if (options?.captureScreenshot) {
        screenshot = await this.captureScreenshot(`step-${this.screenshotCounter++}-before`, description);
      }
      
      // Ejecutar la acción
      result = await action();
      success = true;
      
      console.log(`✅ Paso completado exitosamente: ${description}`);
      
    } catch (error) {
      success = false;
      result = { error: error instanceof Error ? error.message : String(error) };
      console.error(`❌ Error en paso: ${description}`, error);
      
      // Capturar screenshot en caso de error
      if (!screenshot) {
        screenshot = await this.captureScreenshot(`step-${this.screenshotCounter++}-error`, `Error: ${description}`);
      }
    }
    
    const duration = Date.now() - startTime;
    
    const step: TestStep = {
      id: stepId,
      description,
      action: action.toString().substring(0, 200) + '...',
      timestamp,
      duration,
      success,
      screenshot: screenshot || undefined,
      details: {
        result,
        expectedResult: options?.expectedResult,
        actualDuration: duration
      },
      category: options?.category || 'action',
      severity: options?.severity || 'medium'
    };
    
    this.report.steps.push(step);
    this.updateSummary(step);
    
    return result;
  }

  /**
   * Captura una screenshot con timestamp
   */
  private async captureScreenshot(filename: string, description: string): Promise<string> {
    try {
      // Asegurar que el directorio existe
      await fs.mkdir(this.screenshotsDir, { recursive: true });
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const screenshotPath = path.join(this.screenshotsDir, `${timestamp}-${filename}.png`);
      
      // En un entorno real, aquí se capturaría la screenshot
      // Por ahora, creamos un archivo placeholder
      const screenshotData = `Screenshot captured at ${new Date().toISOString()}\nDescription: ${description}\nFilename: ${filename}`;
      await fs.writeFile(screenshotPath.replace('.png', '.txt'), screenshotData);
      
      console.log(`📸 Screenshot capturada: ${screenshotPath}`);
      return screenshotPath;
      
    } catch (error) {
      console.error('Error capturando screenshot:', error);
      return '';
    }
  }

  /**
   * Actualiza el resumen del reporte
   */
  private updateSummary(step: TestStep): void {
    this.report.summary.totalSteps++;
    
    if (step.success) {
      this.report.summary.successfulSteps++;
    } else {
      this.report.summary.failedSteps++;
      
      if (step.severity === 'critical') {
        this.report.summary.criticalErrors++;
      } else if (step.severity === 'high') {
        this.report.summary.warnings++;
      }
    }
  }

  /**
   * Finaliza el test y genera el reporte
   */
  async finishTest(status: 'completed' | 'failed' | 'cancelled' = 'completed'): Promise<string> {
    const endTime = new Date().toISOString();
    const startTime = new Date(this.report.startTime).getTime();
    const duration = Date.now() - startTime;
    
    this.report.endTime = endTime;
    this.report.duration = duration;
    this.report.status = status;
    
    // Generar reporte final
    const reportPath = await this.generateReport();
    
    console.log(`📊 Test finalizado con estado: ${status}`);
    console.log(`📄 Reporte generado: ${reportPath}`);
    console.log(`⏱️  Duración total: ${duration}ms`);
    console.log(`📈 Resumen: ${this.report.summary.successfulSteps}/${this.report.summary.totalSteps} pasos exitosos`);
    
    return reportPath;
  }

  /**
   * Genera el archivo de reporte JSON
   */
  private async generateReport(): Promise<string> {
    try {
      // Asegurar que el directorio existe
      await fs.mkdir(this.reportsDir, { recursive: true });
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const reportFilename = `${this.report.name.replace(/\s+/g, '-').toLowerCase()}-${timestamp}.json`;
      const reportPath = path.join(this.reportsDir, reportFilename);
      
      // Escribir el reporte
      await fs.writeFile(reportPath, JSON.stringify(this.report, null, 2));
      
      return reportPath;
      
    } catch (error) {
      console.error('Error generando reporte:', error);
      throw error;
    }
  }

  /**
   * Obtiene el reporte actual
   */
  getReport(): TestReport {
    return { ...this.report };
  }

  /**
   * Agrega información del entorno
   */
  setEnvironment(env: Partial<TestReport['environment']>): void {
    this.report.environment = { ...this.report.environment, ...env };
  }

  /**
   * Agrega metadatos adicionales
   */
  addMetadata(metadata: Partial<TestReport['metadata']>): void {
    this.report.metadata = { ...this.report.metadata, ...metadata };
  }

  /**
   * Agrega un log personalizado
   */
  async logAction(message: string, data?: any): Promise<void> {
    console.log(`📝 ${message}`, data || '');
    
    // Agregar como paso de documentación
    await this.executeStep(
      `Log: ${message}`,
      async () => ({ logged: true, data }),
      { category: 'setup', severity: 'low' }
    );
  }
}









