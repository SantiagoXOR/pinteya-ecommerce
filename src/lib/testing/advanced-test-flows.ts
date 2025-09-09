// ===================================
// ADVANCED TEST FLOWS
// Sistema avanzado de flujos de testing automatizados
// ===================================

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { ScreenshotManager, ScreenshotMetadata, ScreenshotOptions } from './screenshot-manager';

const execAsync = promisify(exec);

export interface TestFlow {
  id: string;
  name: string;
  description: string;
  steps: TestFlowStep[];
  triggers: TestTrigger[];
  schedule?: TestSchedule;
  notifications: NotificationConfig[];
  retryPolicy: RetryPolicy;
}

export interface TestFlowStep {
  id: string;
  name: string;
  type: 'test-suite' | 'build' | 'deploy' | 'validation' | 'cleanup';
  command: string;
  timeout: number;
  continueOnFailure: boolean;
  dependencies: string[];
  environment?: Record<string, string>;
  artifacts?: string[];
}

export interface TestTrigger {
  type: 'manual' | 'schedule' | 'webhook' | 'file-change' | 'git-push';
  config: Record<string, any>;
}

export interface TestSchedule {
  cron: string;
  timezone: string;
  enabled: boolean;
}

export interface NotificationConfig {
  type: 'email' | 'slack' | 'webhook' | 'console';
  config: Record<string, any>;
  triggers: ('success' | 'failure' | 'start' | 'always')[];
}

export interface RetryPolicy {
  maxRetries: number;
  backoffStrategy: 'linear' | 'exponential' | 'fixed';
  baseDelay: number;
  maxDelay: number;
}

export interface FlowExecution {
  id: string;
  flowId: string;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'success' | 'failed' | 'cancelled';
  steps: StepExecution[];
  trigger: string;
  artifacts: string[];
  logs: string[];
  screenshots: ScreenshotMetadata[];
  screenshotConfig?: ScreenshotFlowConfig;
}

export interface ScreenshotFlowConfig {
  enabled: boolean;
  captureOnStart?: boolean;
  captureOnEnd?: boolean;
  captureOnError?: boolean;
  captureInterval?: number;
  screenshotOptions?: ScreenshotOptions;
  baseUrl?: string;
}

export interface StepExecution {
  stepId: string;
  startTime: Date;
  endTime?: Date;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  exitCode?: number;
  stdout?: string;
  stderr?: string;
  artifacts: string[];
  retryCount: number;
  screenshots: ScreenshotMetadata[];
}

/**
 * Gestor avanzado de flujos de testing
 */
export class AdvancedTestFlowManager {
  private flows: Map<string, TestFlow> = new Map();
  private executions: Map<string, FlowExecution> = new Map();
  private scheduledJobs: Map<string, NodeJS.Timeout> = new Map();
  private screenshotManager: ScreenshotManager;

  constructor(private workingDir: string = process.cwd()) {
    this.screenshotManager = new ScreenshotManager({
      screenshotsDir: path.join(workingDir, 'test-screenshots'),
      browserType: 'chromium'
    });
    this.initializeDefaultFlows();
  }

  /**
   * Inicializar flujos predeterminados
   */
  private initializeDefaultFlows() {
    // Flujo de CI/CD completo
    this.registerFlow({
      id: 'ci-cd-complete',
      name: 'CI/CD Completo',
      description: 'Flujo completo de integración continua y despliegue',
      steps: [
        {
          id: 'install-deps',
          name: 'Instalar Dependencias',
          type: 'build',
          command: 'npm ci',
          timeout: 120000,
          continueOnFailure: false,
          dependencies: [],
          artifacts: ['node_modules']
        },
        {
          id: 'lint-check',
          name: 'Verificación de Linting',
          type: 'validation',
          command: 'npm run lint',
          timeout: 60000,
          continueOnFailure: true,
          dependencies: ['install-deps']
        },
        {
          id: 'type-check',
          name: 'Verificación de Tipos',
          type: 'validation',
          command: 'npm run type-check',
          timeout: 60000,
          continueOnFailure: true,
          dependencies: ['install-deps']
        },
        {
          id: 'unit-tests',
          name: 'Tests Unitarios',
          type: 'test-suite',
          command: 'npm test -- --coverage --passWithNoTests',
          timeout: 300000,
          continueOnFailure: false,
          dependencies: ['install-deps'],
          artifacts: ['coverage']
        },
        {
          id: 'build-app',
          name: 'Build de Aplicación',
          type: 'build',
          command: 'npm run build',
          timeout: 600000,
          continueOnFailure: false,
          dependencies: ['unit-tests'],
          artifacts: ['.next']
        },
        {
          id: 'e2e-tests',
          name: 'Tests E2E',
          type: 'test-suite',
          command: 'npx playwright test --reporter=json',
          timeout: 900000,
          continueOnFailure: true,
          dependencies: ['build-app'],
          artifacts: ['test-results', 'playwright-report']
        }
      ],
      triggers: [
        { type: 'manual', config: {} },
        { type: 'git-push', config: { branch: 'main' } }
      ],
      notifications: [
        {
          type: 'console',
          config: {},
          triggers: ['start', 'success', 'failure']
        }
      ],
      retryPolicy: {
        maxRetries: 2,
        backoffStrategy: 'exponential',
        baseDelay: 5000,
        maxDelay: 30000
      }
    });

    // Flujo de testing rápido
    this.registerFlow({
      id: 'quick-test',
      name: 'Testing Rápido',
      description: 'Flujo rápido para desarrollo',
      steps: [
        {
          id: 'quick-unit-tests',
          name: 'Tests Unitarios Rápidos',
          type: 'test-suite',
          command: 'npm test -- --passWithNoTests --maxWorkers=50%',
          timeout: 120000,
          continueOnFailure: false,
          dependencies: []
        },
        {
          id: 'quick-lint',
          name: 'Lint Rápido',
          type: 'validation',
          command: 'npm run lint -- --fix',
          timeout: 30000,
          continueOnFailure: true,
          dependencies: []
        }
      ],
      triggers: [
        { type: 'manual', config: {} },
        { type: 'file-change', config: { patterns: ['src/**/*.ts', 'src/**/*.tsx'] } }
      ],
      notifications: [
        {
          type: 'console',
          config: {},
          triggers: ['failure']
        }
      ],
      retryPolicy: {
        maxRetries: 1,
        backoffStrategy: 'fixed',
        baseDelay: 2000,
        maxDelay: 2000
      }
    });

    // Flujo de performance testing
    this.registerFlow({
      id: 'performance-test',
      name: 'Testing de Performance',
      description: 'Flujo especializado en performance y Core Web Vitals',
      steps: [
        {
          id: 'build-for-perf',
          name: 'Build Optimizado',
          type: 'build',
          command: 'npm run build',
          timeout: 600000,
          continueOnFailure: false,
          dependencies: [],
          environment: { NODE_ENV: 'production' }
        },
        {
          id: 'lighthouse-audit',
          name: 'Auditoría Lighthouse',
          type: 'validation',
          command: 'npx lighthouse http://localhost:3000 --output=json --output-path=./lighthouse-report.json',
          timeout: 180000,
          continueOnFailure: true,
          dependencies: ['build-for-perf'],
          artifacts: ['lighthouse-report.json']
        },
        {
          id: 'performance-tests',
          name: 'Tests de Performance',
          type: 'test-suite',
          command: 'npm test -- --testPathPattern="performance" --passWithNoTests',
          timeout: 300000,
          continueOnFailure: true,
          dependencies: ['build-for-perf']
        }
      ],
      triggers: [
        { type: 'manual', config: {} }
      ],
      schedule: {
        cron: '0 2 * * *', // Diario a las 2 AM
        timezone: 'America/Argentina/Buenos_Aires',
        enabled: false
      },
      notifications: [
        {
          type: 'console',
          config: {},
          triggers: ['success', 'failure']
        }
      ],
      retryPolicy: {
        maxRetries: 1,
        backoffStrategy: 'fixed',
        baseDelay: 10000,
        maxDelay: 10000
      }
    });
  }

  /**
   * Registrar un nuevo flujo
   */
  registerFlow(flow: TestFlow): void {
    this.flows.set(flow.id, flow);
    
    // Configurar schedule si existe
    if (flow.schedule?.enabled) {
      this.scheduleFlow(flow.id, flow.schedule);
    }
  }

  /**
   * Ejecutar un flujo
   */
  async executeFlow(flowId: string, trigger: string = 'manual'): Promise<FlowExecution> {
    const flow = this.flows.get(flowId);
    if (!flow) {
      throw new Error(`Flujo no encontrado: ${flowId}`);
    }

    const execution: FlowExecution = {
      id: `exec-${flowId}-${Date.now()}`,
      flowId,
      startTime: new Date(),
      status: 'running',
      steps: [],
      trigger,
      artifacts: [],
      logs: []
    };

    this.executions.set(execution.id, execution);

    try {
      await this.notifyFlowStart(flow, execution);
      
      // Ejecutar pasos en orden de dependencias
      const sortedSteps = this.topologicalSort(flow.steps);
      
      for (const step of sortedSteps) {
        const stepExecution = await this.executeStep(step, execution, flow.retryPolicy);
        execution.steps.push(stepExecution);
        
        if (stepExecution.status === 'failed' && !step.continueOnFailure) {
          execution.status = 'failed';
          break;
        }
      }

      if (execution.status === 'running') {
        execution.status = 'success';
      }

    } catch (error) {
      execution.status = 'failed';
      execution.logs.push(`Error en ejecución: ${error}`);
    } finally {
      execution.endTime = new Date();
      await this.notifyFlowComplete(flow, execution);
    }

    return execution;
  }

  /**
   * Ejecutar un paso individual
   */
  private async executeStep(
    step: TestFlowStep, 
    execution: FlowExecution, 
    retryPolicy: RetryPolicy
  ): Promise<StepExecution> {
    const stepExecution: StepExecution = {
      stepId: step.id,
      startTime: new Date(),
      status: 'running',
      artifacts: [],
      retryCount: 0
    };

    let lastError: any;

    for (let attempt = 0; attempt <= retryPolicy.maxRetries; attempt++) {
      try {
        stepExecution.retryCount = attempt;
        
        if (attempt > 0) {
          const delay = this.calculateBackoffDelay(attempt, retryPolicy);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        const { stdout, stderr } = await execAsync(step.command, {
          cwd: this.workingDir,
          timeout: step.timeout,
          env: { ...process.env, ...step.environment }
        });

        stepExecution.status = 'success';
        stepExecution.stdout = stdout;
        stepExecution.stderr = stderr;
        stepExecution.exitCode = 0;
        stepExecution.endTime = new Date();

        // Recopilar artifacts
        if (step.artifacts) {
          stepExecution.artifacts = await this.collectArtifacts(step.artifacts);
        }

        break;

      } catch (error: any) {
        lastError = error;
        stepExecution.stderr = error.stderr || error.message;
        stepExecution.stdout = error.stdout || '';
        stepExecution.exitCode = error.code || 1;

        if (attempt === retryPolicy.maxRetries) {
          stepExecution.status = 'failed';
          stepExecution.endTime = new Date();
        }
      }
    }

    return stepExecution;
  }

  /**
   * Ordenamiento topológico de pasos basado en dependencias
   */
  private topologicalSort(steps: TestFlowStep[]): TestFlowStep[] {
    const visited = new Set<string>();
    const result: TestFlowStep[] = [];
    const stepMap = new Map(steps.map(step => [step.id, step]));

    const visit = (stepId: string) => {
      if (visited.has(stepId)) return;
      visited.add(stepId);

      const step = stepMap.get(stepId);
      if (!step) return;

      // Visitar dependencias primero
      step.dependencies.forEach(depId => visit(depId));
      
      result.push(step);
    };

    steps.forEach(step => visit(step.id));
    return result;
  }

  /**
   * Calcular delay de backoff
   */
  private calculateBackoffDelay(attempt: number, policy: RetryPolicy): number {
    let delay: number;

    switch (policy.backoffStrategy) {
      case 'linear':
        delay = policy.baseDelay * attempt;
        break;
      case 'exponential':
        delay = policy.baseDelay * Math.pow(2, attempt - 1);
        break;
      case 'fixed':
      default:
        delay = policy.baseDelay;
        break;
    }

    return Math.min(delay, policy.maxDelay);
  }

  /**
   * Recopilar artifacts
   */
  private async collectArtifacts(artifactPaths: string[]): Promise<string[]> {
    const artifacts: string[] = [];
    
    for (const artifactPath of artifactPaths) {
      const fullPath = path.join(this.workingDir, artifactPath);
      if (fs.existsSync(fullPath)) {
        artifacts.push(fullPath);
      }
    }

    return artifacts;
  }

  /**
   * Programar ejecución de flujo
   */
  private scheduleFlow(flowId: string, schedule: TestSchedule): void {
    // Implementación simplificada - en producción usar cron job real
    console.log(`📅 Flujo ${flowId} programado: ${schedule.cron}`);
  }

  /**
   * Notificar inicio de flujo
   */
  private async notifyFlowStart(flow: TestFlow, execution: FlowExecution): Promise<void> {
    const startNotifications = flow.notifications.filter(n => 
      n.triggers.includes('start') || n.triggers.includes('always')
    );

    for (const notification of startNotifications) {
      await this.sendNotification(notification, 'start', flow, execution);
    }
  }

  /**
   * Notificar finalización de flujo
   */
  private async notifyFlowComplete(flow: TestFlow, execution: FlowExecution): Promise<void> {
    const completeNotifications = flow.notifications.filter(n => 
      n.triggers.includes(execution.status) || n.triggers.includes('always')
    );

    for (const notification of completeNotifications) {
      await this.sendNotification(notification, execution.status, flow, execution);
    }
  }

  /**
   * Enviar notificación
   */
  private async sendNotification(
    notification: NotificationConfig, 
    event: string, 
    flow: TestFlow, 
    execution: FlowExecution
  ): Promise<void> {
    switch (notification.type) {
      case 'console':
        console.log(`🔔 [${event.toUpperCase()}] Flujo: ${flow.name} | Ejecución: ${execution.id}`);
        break;
      // Implementar otros tipos de notificación según necesidad
    }
  }

  /**
   * Obtener flujos disponibles
   */
  getAvailableFlows(): TestFlow[] {
    return Array.from(this.flows.values());
  }

  /**
   * Obtener ejecuciones
   */
  getExecutions(flowId?: string): FlowExecution[] {
    const executions = Array.from(this.executions.values());
    return flowId ? executions.filter(e => e.flowId === flowId) : executions;
  }

  /**
   * Obtener ejecución específica
   */
  getExecution(executionId: string): FlowExecution | undefined {
    return this.executions.get(executionId);
  }

  /**
   * Ejecutar flujo con capturas de pantalla
   */
  async executeFlowWithScreenshots(
    flowId: string, 
    screenshotConfig: ScreenshotFlowConfig,
    trigger: string = 'manual'
  ): Promise<FlowExecution> {
    const flow = this.flows.get(flowId);
    if (!flow) {
      throw new Error(`Flow ${flowId} not found`);
    }

    const execution: FlowExecution = {
      id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      flowId,
      startTime: new Date(),
      status: 'running',
      steps: [],
      trigger,
      artifacts: [],
      logs: [],
      screenshots: [],
      screenshotConfig
    };

    this.executions.set(execution.id, execution);

    try {
      // Inicializar screenshot manager si está habilitado
      if (screenshotConfig.enabled && screenshotConfig.baseUrl) {
        await this.screenshotManager.initialize({ headless: false });
        await this.screenshotManager.navigateTo(screenshotConfig.baseUrl);
        
        // Captura inicial si está configurada
        if (screenshotConfig.captureOnStart) {
          const screenshot = await this.screenshotManager.captureScreenshot(
            `${execution.id}_start`,
            `Inicio del flujo ${flow.name}`,
            screenshotConfig.screenshotOptions
          );
          execution.screenshots.push(screenshot);
        }
      }

      await this.notifyFlowStart(flow, execution);
      
      const sortedSteps = this.topologicalSort(flow.steps);
      
      for (const step of sortedSteps) {
        const stepExecution = await this.executeStepWithScreenshots(
          step, 
          execution, 
          flow.retryPolicy,
          screenshotConfig
        );
        execution.steps.push(stepExecution);
        
        if (stepExecution.status === 'failed' && !step.continueOnFailure) {
          execution.status = 'failed';
          break;
        }
      }
      
      if (execution.status === 'running') {
        execution.status = 'success';
      }
      
      // Captura final si está configurada
      if (screenshotConfig.enabled && screenshotConfig.captureOnEnd) {
        const screenshot = await this.screenshotManager.captureScreenshot(
          `${execution.id}_end`,
          `Fin del flujo ${flow.name} - Estado: ${execution.status}`,
          screenshotConfig.screenshotOptions
        );
        execution.screenshots.push(screenshot);
      }
      
    } catch (error) {
      execution.status = 'failed';
      execution.logs.push(`Flow execution error: ${error}`);
      
      // Captura de error si está configurada
      if (screenshotConfig.enabled && screenshotConfig.captureOnError) {
        try {
          const screenshot = await this.screenshotManager.captureScreenshot(
            `${execution.id}_error`,
            `Error en flujo ${flow.name}: ${error}`,
            screenshotConfig.screenshotOptions
          );
          execution.screenshots.push(screenshot);
        } catch (screenshotError) {
          execution.logs.push(`Screenshot error: ${screenshotError}`);
        }
      }
    } finally {
      execution.endTime = new Date();
      await this.notifyFlowComplete(flow, execution);
      
      // Cerrar screenshot manager
      if (screenshotConfig.enabled) {
        await this.screenshotManager.close();
      }
    }
    
    return execution;
  }

  /**
   * Ejecutar paso con capturas de pantalla
   */
  private async executeStepWithScreenshots(
    step: TestFlowStep, 
    execution: FlowExecution, 
    retryPolicy: RetryPolicy,
    screenshotConfig: ScreenshotFlowConfig
  ): Promise<StepExecution> {
    const stepExecution: StepExecution = {
      stepId: step.id,
      startTime: new Date(),
      status: 'running',
      artifacts: [],
      retryCount: 0,
      screenshots: []
    };

    let attempt = 0;
    let success = false;

    while (attempt <= retryPolicy.maxRetries && !success) {
      try {
        stepExecution.retryCount = attempt;
        
        // Captura antes del paso
        if (screenshotConfig.enabled) {
          const screenshot = await this.screenshotManager.captureScreenshot(
            `${execution.id}_step_${step.id}_attempt_${attempt}_before`,
            `Antes de ejecutar paso: ${step.name} (intento ${attempt + 1})`,
            screenshotConfig.screenshotOptions
          );
          stepExecution.screenshots.push(screenshot);
        }

        const result = await execAsync(step.command, {
          cwd: this.workingDir,
          timeout: step.timeout,
          env: { ...process.env, ...step.environment }
        });

        stepExecution.stdout = result.stdout;
        stepExecution.stderr = result.stderr;
        stepExecution.exitCode = 0;
        stepExecution.status = 'success';
        success = true;
        
        // Captura después del paso exitoso
        if (screenshotConfig.enabled) {
          const screenshot = await this.screenshotManager.captureScreenshot(
            `${execution.id}_step_${step.id}_success`,
            `Paso completado exitosamente: ${step.name}`,
            screenshotConfig.screenshotOptions
          );
          stepExecution.screenshots.push(screenshot);
        }
        
      } catch (error: any) {
        stepExecution.stderr = error.message;
        stepExecution.exitCode = error.code || 1;
        
        // Captura de error del paso
        if (screenshotConfig.enabled && screenshotConfig.captureOnError) {
          try {
            const screenshot = await this.screenshotManager.captureScreenshot(
              `${execution.id}_step_${step.id}_error_${attempt}`,
              `Error en paso: ${step.name} (intento ${attempt + 1}) - ${error.message}`,
              screenshotConfig.screenshotOptions
            );
            stepExecution.screenshots.push(screenshot);
          } catch (screenshotError) {
            execution.logs.push(`Screenshot error in step ${step.id}: ${screenshotError}`);
          }
        }
        
        if (attempt < retryPolicy.maxRetries) {
          const delay = this.calculateBackoffDelay(attempt, retryPolicy);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          stepExecution.status = 'failed';
        }
      }
      
      attempt++;
    }

    stepExecution.endTime = new Date();
    
    // Recopilar artefactos
    if (step.artifacts) {
      stepExecution.artifacts = await this.collectArtifacts(step.artifacts);
    }

    return stepExecution;
  }

  /**
   * Obtener screenshots de una ejecución
   */
  getExecutionScreenshots(executionId: string): ScreenshotMetadata[] {
    const execution = this.executions.get(executionId);
    if (!execution) {
      return [];
    }
    
    const allScreenshots = [...execution.screenshots];
    
    // Agregar screenshots de los pasos
    execution.steps.forEach(step => {
      allScreenshots.push(...step.screenshots);
    });
    
    return allScreenshots.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }

  /**
   * Obtener estadísticas de screenshots
   */
  getScreenshotStats(executionId: string): {
    total: number;
    byStep: Record<string, number>;
    totalSize: number;
  } {
    const screenshots = this.getExecutionScreenshots(executionId);
    const execution = this.executions.get(executionId);
    
    const stats = {
      total: screenshots.length,
      byStep: {} as Record<string, number>,
      totalSize: screenshots.reduce((sum, s) => sum + (s.fileSize || 0), 0)
    };
    
    if (execution) {
      execution.steps.forEach(step => {
        stats.byStep[step.stepId] = step.screenshots.length;
      });
    }
    
    return stats;
  }
}

// Instancia global del gestor
export const testFlowManager = new AdvancedTestFlowManager();
