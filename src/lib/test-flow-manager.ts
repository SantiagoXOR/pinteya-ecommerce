/**
 * Advanced Test Flow Manager
 * 
 * Gestiona la ejecución de flujos de test completos incluyendo:
 * - Ejecución de tests automatizados
 * - Captura de screenshots
 * - Generación de reportes
 * - Integración con el dashboard
 */

import { ScreenshotManager } from './screenshot-manager';

export interface TestStep {
  id: string;
  name: string;
  description: string;
  action: () => Promise<void>;
  expectedResult?: string;
  screenshot?: boolean;
  timeout?: number;
}

export interface TestFlow {
  id: string;
  name: string;
  description: string;
  steps: TestStep[];
  tags?: string[];
  priority?: 'low' | 'medium' | 'high' | 'critical';
  environment?: string;
}

export interface TestFlowResult {
  flowId: string;
  flowName: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  steps: TestStepResult[];
  screenshots: string[];
  errors: string[];
  metadata?: Record<string, any>;
}

export interface TestStepResult {
  stepId: string;
  stepName: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  screenshot?: string;
  error?: string;
  logs?: string[];
}

export interface TestFlowOptions {
  screenshotEnabled?: boolean;
  screenshotOnFailure?: boolean;
  screenshotOnSuccess?: boolean;
  timeout?: number;
  retries?: number;
  parallel?: boolean;
  environment?: string;
  tags?: string[];
}

export class AdvancedTestFlowManager {
  private screenshotManager: ScreenshotManager;
  private activeFlows: Map<string, TestFlowResult> = new Map();
  private flowHistory: TestFlowResult[] = [];

  constructor() {
    this.screenshotManager = new ScreenshotManager();
  }

  /**
   * Ejecuta un flujo de test completo
   */
  async executeFlow(
    flow: TestFlow, 
    options: TestFlowOptions = {}
  ): Promise<TestFlowResult> {
    const flowResult: TestFlowResult = {
      flowId: flow.id,
      flowName: flow.name,
      startTime: new Date(),
      status: 'running',
      steps: [],
      screenshots: [],
      errors: [],
      metadata: {
        environment: options.environment || 'test',
        tags: flow.tags || [],
        priority: flow.priority || 'medium'
      }
    };

    this.activeFlows.set(flow.id, flowResult);

    try {
      console.log(`🚀 Iniciando flujo: ${flow.name}`);
      
      // Tomar screenshot inicial si está habilitado
      if (options.screenshotEnabled) {
        const initialScreenshot = await this.screenshotManager.captureScreenshot({
          name: `${flow.id}_initial`,
          stepName: 'Inicio del flujo',
          fullPage: true
        });
        flowResult.screenshots.push(initialScreenshot.id);
      }

      // Ejecutar cada paso del flujo
      for (let i = 0; i < flow.steps.length; i++) {
        const step = flow.steps[i];
        const stepResult = await this.executeStep(step, flowResult, options);
        flowResult.steps.push(stepResult);

        // Si el paso falla y no hay reintentos, detener el flujo
        if (stepResult.status === 'failed' && !options.retries) {
          flowResult.status = 'failed';
          break;
        }
      }

      // Determinar el estado final del flujo
      if (flowResult.status === 'running') {
        const hasFailedSteps = flowResult.steps.some(step => step.status === 'failed');
        flowResult.status = hasFailedSteps ? 'failed' : 'passed';
      }

      // Tomar screenshot final si está habilitado
      if (options.screenshotEnabled) {
        const finalScreenshot = await this.screenshotManager.captureScreenshot({
          name: `${flow.id}_final`,
          stepName: 'Fin del flujo',
          fullPage: true
        });
        flowResult.screenshots.push(finalScreenshot.id);
      }

    } catch (error) {
      console.error(`❌ Error en flujo ${flow.name}:`, error);
      flowResult.status = 'failed';
      flowResult.errors.push(error instanceof Error ? error.message : String(error));
    } finally {
      flowResult.endTime = new Date();
      flowResult.duration = flowResult.endTime.getTime() - flowResult.startTime.getTime();
      
      this.activeFlows.delete(flow.id);
      this.flowHistory.push(flowResult);
      
      console.log(`✅ Flujo completado: ${flow.name} - Estado: ${flowResult.status}`);
    }

    return flowResult;
  }

  /**
   * Ejecuta un paso individual del test
   */
  private async executeStep(
    step: TestStep, 
    flowResult: TestFlowResult, 
    options: TestFlowOptions
  ): Promise<TestStepResult> {
    const stepResult: TestStepResult = {
      stepId: step.id,
      stepName: step.name,
      status: 'running',
      startTime: new Date(),
      logs: []
    };

    try {
      console.log(`  🔄 Ejecutando paso: ${step.name}`);
      stepResult.logs?.push(`Iniciando paso: ${step.name}`);

      // Ejecutar la acción del paso con timeout
      const timeout = step.timeout || options.timeout || 30000;
      await Promise.race([
        step.action(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`Timeout de ${timeout}ms excedido`)), timeout)
        )
      ]);

      stepResult.status = 'passed';
      stepResult.logs?.push(`Paso completado exitosamente`);
      console.log(`    ✅ Paso completado: ${step.name}`);

      // Tomar screenshot si está configurado
      if (step.screenshot || options.screenshotOnSuccess) {
        const screenshot = await this.screenshotManager.captureScreenshot({
          name: `${flowResult.flowId}_step_${step.id}`,
          stepName: step.name,
          fullPage: false
        });
        stepResult.screenshot = screenshot.id;
        flowResult.screenshots.push(screenshot.id);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      stepResult.status = 'failed';
      stepResult.error = errorMessage;
      stepResult.logs?.push(`Error: ${errorMessage}`);
      flowResult.errors.push(`Paso ${step.name}: ${errorMessage}`);
      
      console.error(`    ❌ Paso fallido: ${step.name} - ${errorMessage}`);

      // Tomar screenshot en caso de error
      if (options.screenshotOnFailure !== false) {
        try {
          const errorScreenshot = await this.screenshotManager.captureScreenshot({
            name: `${flowResult.flowId}_error_${step.id}`,
            stepName: `${step.name} (Error)`,
            fullPage: true
          });
          stepResult.screenshot = errorScreenshot.id;
          flowResult.screenshots.push(errorScreenshot.id);
        } catch (screenshotError) {
          console.error('Error capturando screenshot de error:', screenshotError);
        }
      }
    } finally {
      stepResult.endTime = new Date();
      stepResult.duration = stepResult.endTime.getTime() - stepResult.startTime.getTime();
    }

    return stepResult;
  }

  /**
   * Ejecuta múltiples flujos en paralelo
   */
  async executeFlowsParallel(
    flows: TestFlow[], 
    options: TestFlowOptions = {}
  ): Promise<TestFlowResult[]> {
    console.log(`🚀 Ejecutando ${flows.length} flujos en paralelo`);
    
    const promises = flows.map(flow => this.executeFlow(flow, options));
    const results = await Promise.allSettled(promises);
    
    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        // Crear un resultado de error para flujos que fallaron completamente
        return {
          flowId: flows[index].id,
          flowName: flows[index].name,
          startTime: new Date(),
          endTime: new Date(),
          duration: 0,
          status: 'failed' as const,
          steps: [],
          screenshots: [],
          errors: [result.reason?.message || 'Error desconocido'],
          metadata: {}
        };
      }
    });
  }

  /**
   * Obtiene el estado de un flujo activo
   */
  getFlowStatus(flowId: string): TestFlowResult | null {
    return this.activeFlows.get(flowId) || null;
  }

  /**
   * Obtiene el historial de flujos ejecutados
   */
  getFlowHistory(limit?: number): TestFlowResult[] {
    const history = [...this.flowHistory].reverse();
    return limit ? history.slice(0, limit) : history;
  }

  /**
   * Obtiene estadísticas de los flujos
   */
  getFlowStatistics(): {
    total: number;
    passed: number;
    failed: number;
    successRate: number;
    averageDuration: number;
    totalScreenshots: number;
  } {
    const total = this.flowHistory.length;
    const passed = this.flowHistory.filter(f => f.status === 'passed').length;
    const failed = this.flowHistory.filter(f => f.status === 'failed').length;
    const successRate = total > 0 ? (passed / total) * 100 : 0;
    
    const totalDuration = this.flowHistory.reduce((sum, f) => sum + (f.duration || 0), 0);
    const averageDuration = total > 0 ? totalDuration / total : 0;
    
    const totalScreenshots = this.flowHistory.reduce((sum, f) => sum + f.screenshots.length, 0);

    return {
      total,
      passed,
      failed,
      successRate,
      averageDuration,
      totalScreenshots
    };
  }

  /**
   * Limpia el historial de flujos
   */
  clearHistory(): void {
    this.flowHistory = [];
  }

  /**
   * Detiene todos los flujos activos
   */
  stopAllFlows(): void {
    for (const [flowId, flowResult] of this.activeFlows) {
      flowResult.status = 'failed';
      flowResult.endTime = new Date();
      flowResult.duration = flowResult.endTime.getTime() - flowResult.startTime.getTime();
      flowResult.errors.push('Flujo detenido manualmente');
      
      this.flowHistory.push(flowResult);
    }
    
    this.activeFlows.clear();
  }
}

// Flujos de test predefinidos para e-commerce
export const predefinedFlows: TestFlow[] = [
  {
    id: 'ecommerce-complete-flow',
    name: 'Flujo Completo E-commerce',
    description: 'Test completo del flujo de compra en e-commerce',
    priority: 'critical',
    tags: ['e-commerce', 'checkout', 'integration'],
    steps: [
      {
        id: 'navigate-home',
        name: 'Navegar a página principal',
        description: 'Abrir la página principal del e-commerce',
        action: async () => {
          // Simulación de navegación
          await new Promise(resolve => setTimeout(resolve, 1000));
        },
        screenshot: true
      },
      {
        id: 'search-product',
        name: 'Buscar producto',
        description: 'Buscar un producto específico',
        action: async () => {
          await new Promise(resolve => setTimeout(resolve, 800));
        },
        screenshot: true
      },
      {
        id: 'add-to-cart',
        name: 'Agregar al carrito',
        description: 'Agregar producto al carrito de compras',
        action: async () => {
          await new Promise(resolve => setTimeout(resolve, 600));
        },
        screenshot: true
      },
      {
        id: 'checkout-process',
        name: 'Proceso de checkout',
        description: 'Completar el proceso de compra',
        action: async () => {
          await new Promise(resolve => setTimeout(resolve, 1200));
        },
        screenshot: true
      },
      {
        id: 'payment-confirmation',
        name: 'Confirmación de pago',
        description: 'Verificar confirmación de pago',
        action: async () => {
          await new Promise(resolve => setTimeout(resolve, 500));
        },
        screenshot: true
      }
    ]
  },
  {
    id: 'user-registration-flow',
    name: 'Flujo de Registro de Usuario',
    description: 'Test del proceso de registro de nuevos usuarios',
    priority: 'high',
    tags: ['authentication', 'registration'],
    steps: [
      {
        id: 'open-registration',
        name: 'Abrir formulario de registro',
        description: 'Navegar al formulario de registro',
        action: async () => {
          await new Promise(resolve => setTimeout(resolve, 500));
        },
        screenshot: true
      },
      {
        id: 'fill-form',
        name: 'Llenar formulario',
        description: 'Completar datos de registro',
        action: async () => {
          await new Promise(resolve => setTimeout(resolve, 1000));
        },
        screenshot: true
      },
      {
        id: 'submit-registration',
        name: 'Enviar registro',
        description: 'Enviar formulario de registro',
        action: async () => {
          await new Promise(resolve => setTimeout(resolve, 800));
        },
        screenshot: true
      }
    ]
  }
];

// Instancia singleton del manager
export const testFlowManager = new AdvancedTestFlowManager();