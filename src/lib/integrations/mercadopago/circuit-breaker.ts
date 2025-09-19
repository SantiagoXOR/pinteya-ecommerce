// ===================================
// PINTEYA E-COMMERCE - CIRCUIT BREAKER PATTERN ENTERPRISE
// ===================================

import { logger, LogLevel, LogCategory } from '@/lib/enterprise/logger';
import { metricsCollector } from '@/lib/enterprise/metrics';

// Estados del Circuit Breaker
export enum CircuitBreakerState {
  CLOSED = 'CLOSED',     // Funcionamiento normal
  OPEN = 'OPEN',         // Circuito abierto, rechaza requests
  HALF_OPEN = 'HALF_OPEN' // Probando si el servicio se recuperó
}

// Configuración del Circuit Breaker
export interface CircuitBreakerConfig {
  failureThreshold: number;      // Número de fallos para abrir el circuito
  recoveryTimeout: number;       // Tiempo antes de intentar recuperación (ms)
  monitoringWindow: number;      // Ventana de monitoreo para contar fallos (ms)
  halfOpenMaxCalls: number;      // Máximo de llamadas en estado HALF_OPEN
  successThreshold: number;      // Éxitos necesarios para cerrar el circuito
}

// Configuraciones predefinidas
export const CIRCUIT_BREAKER_CONFIGS = {
  MERCADOPAGO_CRITICAL: {
    failureThreshold: 5,
    recoveryTimeout: 60000,      // 1 minuto
    monitoringWindow: 120000,    // 2 minutos
    halfOpenMaxCalls: 3,
    successThreshold: 2
  },
  MERCADOPAGO_STANDARD: {
    failureThreshold: 3,
    recoveryTimeout: 30000,      // 30 segundos
    monitoringWindow: 60000,     // 1 minuto
    halfOpenMaxCalls: 2,
    successThreshold: 1
  },
  WEBHOOK_PROCESSING: {
    failureThreshold: 10,
    recoveryTimeout: 15000,      // 15 segundos
    monitoringWindow: 30000,     // 30 segundos
    halfOpenMaxCalls: 5,
    successThreshold: 3
  }
} as const;

// Métricas del Circuit Breaker
interface CircuitBreakerMetrics {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  rejectedCalls: number;
  lastFailureTime: number;
  lastSuccessTime: number;
  stateChanges: number;
}

// Resultado de ejecución
export interface CircuitBreakerResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  state: CircuitBreakerState;
  executionTime: number;
  wasRejected: boolean;
}

/**
 * Circuit Breaker Enterprise para MercadoPago
 * Implementa el patrón Circuit Breaker con estados y recuperación automática
 */
export class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failures: number = 0;
  private successes: number = 0;
  private lastFailureTime: number = 0;
  private lastSuccessTime: number = 0;
  private halfOpenCalls: number = 0;
  private stateChanges: number = 0;
  private metrics: CircuitBreakerMetrics;

  constructor(
    private name: string,
    private config: CircuitBreakerConfig
  ) {
    this.metrics = {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      rejectedCalls: 0,
      lastFailureTime: 0,
      lastSuccessTime: 0,
      stateChanges: 0
    };

    logger.debug(LogLevel.DEBUG, `Circuit Breaker initialized: ${name}`, {
      config: this.config
    }, LogCategory.SYSTEM);
  }

  /**
   * Ejecuta una operación protegida por el circuit breaker
   */
  async execute<T>(operation: () => Promise<T>): Promise<CircuitBreakerResult<T>> {
    const startTime = Date.now();
    this.metrics.totalCalls++;

    // Verificar si debemos rechazar la llamada
    if (this.shouldReject()) {
      this.metrics.rejectedCalls++;
      
      await this.recordMetrics('rejected');
      
      return {
        success: false,
        error: new Error(`Circuit breaker is ${this.state} - operation rejected`),
        state: this.state,
        executionTime: Date.now() - startTime,
        wasRejected: true
      };
    }

    try {
      // Ejecutar la operación
      const result = await operation();
      
      // Registrar éxito
      await this.onSuccess();
      
      const executionTime = Date.now() - startTime;
      await this.recordMetrics('success', executionTime);
      
      return {
        success: true,
        data: result,
        state: this.state,
        executionTime,
        wasRejected: false
      };

    } catch (error) {
      // Registrar fallo
      await this.onFailure(error as Error);
      
      const executionTime = Date.now() - startTime;
      await this.recordMetrics('failure', executionTime);
      
      return {
        success: false,
        error: error as Error,
        state: this.state,
        executionTime,
        wasRejected: false
      };
    }
  }

  /**
   * Determina si debemos rechazar la operación
   */
  private shouldReject(): boolean {
    const now = Date.now();

    switch (this.state) {
      case CircuitBreakerState.CLOSED:
        return false;

      case CircuitBreakerState.OPEN:
        // Verificar si es tiempo de intentar recuperación
        if (now - this.lastFailureTime >= this.config.recoveryTimeout) {
          this.transitionToHalfOpen();
          return false;
        }
        return true;

      case CircuitBreakerState.HALF_OPEN:
        // Limitar llamadas en estado HALF_OPEN
        return this.halfOpenCalls >= this.config.halfOpenMaxCalls;

      default:
        return false;
    }
  }

  /**
   * Maneja un éxito en la operación
   */
  private async onSuccess(): Promise<void> {
    this.lastSuccessTime = Date.now();
    this.metrics.successfulCalls++;

    switch (this.state) {
      case CircuitBreakerState.HALF_OPEN:
        this.successes++;
        this.halfOpenCalls++;
        
        if (this.successes >= this.config.successThreshold) {
          this.transitionToClosed();
        }
        break;

      case CircuitBreakerState.CLOSED:
        // Reset failure counter en ventana de monitoreo
        if (this.isInMonitoringWindow()) {
          this.failures = 0;
        }
        break;
    }
  }

  /**
   * Maneja un fallo en la operación
   */
  private async onFailure(error: Error): Promise<void> {
    this.lastFailureTime = Date.now();
    this.metrics.failedCalls++;
    this.failures++;

    logger.warn(LogLevel.WARN, `Circuit Breaker failure: ${this.name}`, {
      error: error.message,
      failures: this.failures,
      state: this.state
    }, LogCategory.SYSTEM);

    switch (this.state) {
      case CircuitBreakerState.CLOSED:
        if (this.failures >= this.config.failureThreshold) {
          this.transitionToOpen();
        }
        break;

      case CircuitBreakerState.HALF_OPEN:
        this.transitionToOpen();
        break;
    }
  }

  /**
   * Transición a estado OPEN
   */
  private transitionToOpen(): void {
    this.state = CircuitBreakerState.OPEN;
    this.stateChanges++;
    this.metrics.stateChanges++;
    this.halfOpenCalls = 0;
    this.successes = 0;

    logger.warn(LogLevel.WARN, `Circuit Breaker OPENED: ${this.name}`, {
      failures: this.failures,
      threshold: this.config.failureThreshold
    }, LogCategory.SYSTEM);
  }

  /**
   * Transición a estado HALF_OPEN
   */
  private transitionToHalfOpen(): void {
    this.state = CircuitBreakerState.HALF_OPEN;
    this.stateChanges++;
    this.metrics.stateChanges++;
    this.halfOpenCalls = 0;
    this.successes = 0;

    logger.info(LogLevel.INFO, `Circuit Breaker HALF-OPEN: ${this.name}`, {
      recoveryTimeout: this.config.recoveryTimeout
    }, LogCategory.SYSTEM);
  }

  /**
   * Transición a estado CLOSED
   */
  private transitionToClosed(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.stateChanges++;
    this.metrics.stateChanges++;
    this.failures = 0;
    this.successes = 0;
    this.halfOpenCalls = 0;

    logger.info(LogLevel.INFO, `Circuit Breaker CLOSED: ${this.name}`, {
      successThreshold: this.config.successThreshold
    }, LogCategory.SYSTEM);
  }

  /**
   * Verifica si estamos en la ventana de monitoreo
   */
  private isInMonitoringWindow(): boolean {
    const now = Date.now();
    return (now - this.lastFailureTime) <= this.config.monitoringWindow;
  }

  /**
   * Registra métricas del circuit breaker
   */
  private async recordMetrics(
    operation: 'success' | 'failure' | 'rejected',
    executionTime?: number
  ): Promise<void> {
    try {
      await metricsCollector.recordMetric(`circuit_breaker.${this.name}.${operation}`, 1, {
        state: this.state,
        operation
      });

      if (executionTime) {
        await metricsCollector.recordMetric(
          `circuit_breaker.${this.name}.execution_time`,
          executionTime,
          { state: this.state }
        );
      }

      // Métricas de estado
      await metricsCollector.recordMetric(`circuit_breaker.${this.name}.state_changes`, this.stateChanges);
      await metricsCollector.recordMetric(`circuit_breaker.${this.name}.failure_rate`, 
        this.metrics.totalCalls > 0 ? this.metrics.failedCalls / this.metrics.totalCalls : 0
      );

    } catch (error) {
      logger.error(LogLevel.ERROR, `Failed to record circuit breaker metrics: ${this.name}`, {
        error: error instanceof Error ? error.message : 'Unknown error'
      }, LogCategory.SYSTEM);
    }
  }

  /**
   * Obtiene el estado actual del circuit breaker
   */
  getState(): CircuitBreakerState {
    return this.state;
  }

  /**
   * Obtiene las métricas del circuit breaker
   */
  getMetrics(): CircuitBreakerMetrics & { state: CircuitBreakerState; config: CircuitBreakerConfig } {
    return {
      ...this.metrics,
      state: this.state,
      config: this.config
    };
  }

  /**
   * Fuerza el reset del circuit breaker (solo para testing/admin)
   */
  reset(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.halfOpenCalls = 0;
    this.lastFailureTime = 0;
    this.lastSuccessTime = 0;

    logger.info(LogLevel.INFO, `Circuit Breaker manually reset: ${this.name}`, {}, LogCategory.SYSTEM);
  }
}

// Instancias globales de circuit breakers
export const mercadoPagoCriticalBreaker = new CircuitBreaker(
  'mercadopago_critical',
  CIRCUIT_BREAKER_CONFIGS.MERCADOPAGO_CRITICAL
);

export const mercadoPagoStandardBreaker = new CircuitBreaker(
  'mercadopago_standard', 
  CIRCUIT_BREAKER_CONFIGS.MERCADOPAGO_STANDARD
);

export const webhookProcessingBreaker = new CircuitBreaker(
  'webhook_processing',
  CIRCUIT_BREAKER_CONFIGS.WEBHOOK_PROCESSING
);

/**
 * Wrapper para operaciones críticas de MercadoPago
 */
export async function executeMercadoPagoCritical<T>(
  operation: () => Promise<T>
): Promise<CircuitBreakerResult<T>> {
  return mercadoPagoCriticalBreaker.execute(operation);
}

/**
 * Wrapper para operaciones estándar de MercadoPago
 */
export async function executeMercadoPagoStandard<T>(
  operation: () => Promise<T>
): Promise<CircuitBreakerResult<T>> {
  return mercadoPagoStandardBreaker.execute(operation);
}

/**
 * Wrapper para procesamiento de webhooks
 */
export async function executeWebhookProcessing<T>(
  operation: () => Promise<T>
): Promise<CircuitBreakerResult<T>> {
  return webhookProcessingBreaker.execute(operation);
}









