// ===================================
// ERROR BOUNDARY MANAGER
// ===================================
// Sistema centralizado de gestión de Error Boundaries

import { ErrorInfo } from 'react';

// ===================================
// INTERFACES Y TIPOS
// ===================================

export interface ErrorBoundaryConfig {
  level: 'page' | 'section' | 'component';
  enableRetry: boolean;
  maxRetries: number;
  retryDelay: number;
  enableAutoRecovery: boolean;
  recoveryTimeout: number;
  enableReporting: boolean;
  fallbackComponent?: React.ComponentType<any>;
}

export interface ErrorMetrics {
  errorId: string;
  timestamp: number;
  errorType: string;
  component: string;
  level: string;
  retryCount: number;
  resolved: boolean;
  resolutionTime?: number;
  userImpact: 'low' | 'medium' | 'high' | 'critical';
}

export interface ErrorPattern {
  pattern: string;
  frequency: number;
  lastOccurrence: number;
  affectedComponents: string[];
  suggestedFix?: string;
}

// ===================================
// ERROR BOUNDARY MANAGER
// ===================================

class ErrorBoundaryManager {
  private static instance: ErrorBoundaryManager;
  private errors: Map<string, ErrorMetrics> = new Map();
  private patterns: Map<string, ErrorPattern> = new Map();
  private configs: Map<string, ErrorBoundaryConfig> = new Map();
  private listeners: Array<(error: ErrorMetrics) => void> = [];

  private constructor() {
    this.initializeDefaultConfigs();
    this.setupGlobalErrorHandlers();
  }

  static getInstance(): ErrorBoundaryManager {
    if (!ErrorBoundaryManager.instance) {
      ErrorBoundaryManager.instance = new ErrorBoundaryManager();
    }
    return ErrorBoundaryManager.instance;
  }

  // ===================================
  // CONFIGURACIÓN
  // ===================================

  private initializeDefaultConfigs() {
    // Configuración para páginas
    this.configs.set('page', {
      level: 'page',
      enableRetry: true,
      maxRetries: 2,
      retryDelay: 2000,
      enableAutoRecovery: true,
      recoveryTimeout: 5000,
      enableReporting: true
    });

    // Configuración para secciones
    this.configs.set('section', {
      level: 'section',
      enableRetry: true,
      maxRetries: 3,
      retryDelay: 1000,
      enableAutoRecovery: true,
      recoveryTimeout: 3000,
      enableReporting: true
    });

    // Configuración para componentes
    this.configs.set('component', {
      level: 'component',
      enableRetry: true,
      maxRetries: 5,
      retryDelay: 500,
      enableAutoRecovery: true,
      recoveryTimeout: 2000,
      enableReporting: false // Solo reportar errores críticos
    });
  }

  getConfig(level: string): ErrorBoundaryConfig {
    return this.configs.get(level) || this.configs.get('component')!;
  }

  updateConfig(level: string, config: Partial<ErrorBoundaryConfig>) {
    const currentConfig = this.getConfig(level);
    this.configs.set(level, { ...currentConfig, ...config });
  }

  // ===================================
  // GESTIÓN DE ERRORES
  // ===================================

  reportError(
    error: Error,
    errorInfo: ErrorInfo,
    context: {
      errorId: string;
      level: string;
      component: string;
      retryCount: number;
    }
  ) {
    const errorMetrics: ErrorMetrics = {
      errorId: context.errorId,
      timestamp: Date.now(),
      errorType: this.classifyError(error),
      component: context.component,
      level: context.level,
      retryCount: context.retryCount,
      resolved: false,
      userImpact: this.assessUserImpact(context.level, error)
    };

    // Almacenar métricas
    this.errors.set(context.errorId, errorMetrics);

    // Detectar patrones
    this.detectErrorPattern(error, context.component);

    // Notificar listeners
    this.notifyListeners(errorMetrics);

    // Reportar a sistemas externos si es necesario
    if (this.shouldReportExternally(errorMetrics)) {
      this.reportToExternalSystems(errorMetrics, error, errorInfo);
    }

    console.log('📊 Error reported to ErrorBoundaryManager:', errorMetrics);
  }

  markErrorResolved(errorId: string, resolutionTime?: number) {
    const error = this.errors.get(errorId);
    if (error) {
      error.resolved = true;
      error.resolutionTime = resolutionTime || Date.now() - error.timestamp;
      this.errors.set(errorId, error);
    }
  }

  // ===================================
  // CLASIFICACIÓN Y ANÁLISIS
  // ===================================

  private classifyError(error: Error): string {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';

    // Errores de chunk loading
    if (message.includes('loading chunk') || message.includes('loading css chunk')) {
      return 'ChunkLoadError';
    }

    // Errores de red
    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      return 'NetworkError';
    }

    // Errores de React
    if (stack.includes('react') || message.includes('render')) {
      return 'ReactError';
    }

    // Errores de JavaScript
    if (error.name === 'TypeError') {return 'TypeError';}
    if (error.name === 'ReferenceError') {return 'ReferenceError';}
    if (error.name === 'SyntaxError') {return 'SyntaxError';}

    return 'UnknownError';
  }

  private assessUserImpact(level: string, error: Error): ErrorMetrics['userImpact'] {
    // Impacto crítico para errores de página
    if (level === 'page') {return 'critical';}

    // Impacto alto para errores de sección
    if (level === 'section') {return 'high';}

    // Evaluar por tipo de error
    const errorType = this.classifyError(error);
    switch (errorType) {
      case 'ChunkLoadError':
        return 'high'; // Impide la carga de funcionalidad
      case 'NetworkError':
        return 'medium'; // Puede afectar datos
      case 'ReactError':
        return level === 'component' ? 'low' : 'medium';
      default:
        return 'low';
    }
  }

  private detectErrorPattern(error: Error, component: string) {
    const patternKey = `${error.name}:${component}`;
    const existing = this.patterns.get(patternKey);

    if (existing) {
      existing.frequency++;
      existing.lastOccurrence = Date.now();
      if (!existing.affectedComponents.includes(component)) {
        existing.affectedComponents.push(component);
      }
    } else {
      this.patterns.set(patternKey, {
        pattern: patternKey,
        frequency: 1,
        lastOccurrence: Date.now(),
        affectedComponents: [component],
        suggestedFix: this.getSuggestedFix(error)
      });
    }
  }

  private getSuggestedFix(error: Error): string | undefined {
    const errorType = this.classifyError(error);
    
    switch (errorType) {
      case 'ChunkLoadError':
        return 'Consider implementing chunk retry logic or reducing bundle size';
      case 'NetworkError':
        return 'Implement network retry with exponential backoff';
      case 'TypeError':
        return 'Add null/undefined checks and proper type validation';
      case 'ReactError':
        return 'Review component lifecycle and state management';
      default:
        return undefined;
    }
  }

  // ===================================
  // REPORTE EXTERNO
  // ===================================

  private shouldReportExternally(errorMetrics: ErrorMetrics): boolean {
    // Reportar errores críticos y de alto impacto
    if (errorMetrics.userImpact === 'critical' || errorMetrics.userImpact === 'high') {
      return true;
    }

    // Reportar errores frecuentes
    const pattern = Array.from(this.patterns.values())
      .find(p => p.pattern.includes(errorMetrics.errorType));
    
    if (pattern && pattern.frequency >= 5) {
      return true;
    }

    return false;
  }

  private async reportToExternalSystems(
    errorMetrics: ErrorMetrics,
    error: Error,
    errorInfo: ErrorInfo
  ) {
    try {
      // Reportar al sistema de monitoreo enterprise
      if (typeof window !== 'undefined') {
        const enterpriseMonitoring = (window as any).__enterprise_monitoring;
        if (enterpriseMonitoring) {
          enterpriseMonitoring.trackError(error, {
            context: 'error_boundary',
            component: errorMetrics.component,
            level: errorMetrics.level,
            errorId: errorMetrics.errorId
          });
        }
      }

      // Reportar a API de errores
      await fetch('/api/monitoring/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          errorMetrics,
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack
          },
          errorInfo: {
            componentStack: errorInfo.componentStack
          }
        })
      });

    } catch (reportError) {
      console.error('❌ Failed to report to external systems:', reportError);
    }
  }

  // ===================================
  // MANEJO GLOBAL DE ERRORES
  // ===================================

  private setupGlobalErrorHandlers() {
    if (typeof window === 'undefined') {return;}

    // Manejar errores JavaScript no capturados
    window.addEventListener('error', (event) => {
      this.handleGlobalError(event.error, 'global_javascript_error');
    });

    // Manejar promesas rechazadas no capturadas
    window.addEventListener('unhandledrejection', (event) => {
      this.handleGlobalError(event.reason, 'unhandled_promise_rejection');
    });

    // Manejar errores de recursos (imágenes, scripts, etc.)
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.handleResourceError(event);
      }
    }, true);
  }

  private handleGlobalError(error: any, type: string) {
    const errorId = `global_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const errorMetrics: ErrorMetrics = {
      errorId,
      timestamp: Date.now(),
      errorType: type,
      component: 'global',
      level: 'page',
      retryCount: 0,
      resolved: false,
      userImpact: 'high'
    };

    this.errors.set(errorId, errorMetrics);
    this.notifyListeners(errorMetrics);

    console.error(`🌐 Global error (${type}):`, error);
  }

  private handleResourceError(event: Event) {
    const target = event.target as HTMLElement;
    const resourceType = target.tagName?.toLowerCase() || 'unknown';
    const src = (target as any).src || (target as any).href || 'unknown';

    console.warn(`📦 Resource loading error (${resourceType}):`, src);

    // Intentar recargar recursos críticos
    if (resourceType === 'script' && src.includes('chunk')) {
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  }

  // ===================================
  // LISTENERS Y MÉTRICAS
  // ===================================

  addErrorListener(listener: (error: ErrorMetrics) => void) {
    this.listeners.push(listener);
  }

  removeErrorListener(listener: (error: ErrorMetrics) => void) {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  private notifyListeners(error: ErrorMetrics) {
    this.listeners.forEach(listener => {
      try {
        listener(error);
      } catch (listenerError) {
        console.error('❌ Error in error listener:', listenerError);
      }
    });
  }

  // ===================================
  // MÉTRICAS Y REPORTES
  // ===================================

  getErrorMetrics(): {
    totalErrors: number;
    errorsByType: Record<string, number>;
    errorsByComponent: Record<string, number>;
    errorsByImpact: Record<string, number>;
    patterns: ErrorPattern[];
    recentErrors: ErrorMetrics[];
  } {
    const errors = Array.from(this.errors.values());
    const patterns = Array.from(this.patterns.values());

    return {
      totalErrors: errors.length,
      errorsByType: this.groupBy(errors, 'errorType'),
      errorsByComponent: this.groupBy(errors, 'component'),
      errorsByImpact: this.groupBy(errors, 'userImpact'),
      patterns: patterns.sort((a, b) => b.frequency - a.frequency),
      recentErrors: errors
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 10)
    };
  }

  private groupBy<T>(array: T[], key: keyof T): Record<string, number> {
    return array.reduce((acc, item) => {
      const value = String(item[key]);
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  clearOldErrors(maxAge: number = 24 * 60 * 60 * 1000) { // 24 horas por defecto
    const cutoff = Date.now() - maxAge;
    
    for (const [errorId, error] of this.errors.entries()) {
      if (error.timestamp < cutoff) {
        this.errors.delete(errorId);
      }
    }

    for (const [patternKey, pattern] of this.patterns.entries()) {
      if (pattern.lastOccurrence < cutoff) {
        this.patterns.delete(patternKey);
      }
    }
  }

  // ===================================
  // UTILIDADES
  // ===================================

  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'critical';
    errorRate: number;
    criticalErrors: number;
    recommendations: string[];
  } {
    const errors = Array.from(this.errors.values());
    const recentErrors = errors.filter(e => e.timestamp > Date.now() - 60000); // Últimos 60 segundos
    const criticalErrors = errors.filter(e => e.userImpact === 'critical').length;
    
    const errorRate = recentErrors.length;
    let status: 'healthy' | 'degraded' | 'critical' = 'healthy';
    const recommendations: string[] = [];

    if (criticalErrors > 0) {
      status = 'critical';
      recommendations.push('Resolver errores críticos inmediatamente');
    } else if (errorRate > 5) {
      status = 'degraded';
      recommendations.push('Alta tasa de errores detectada');
    }

    // Analizar patrones frecuentes
    const frequentPatterns = Array.from(this.patterns.values())
      .filter(p => p.frequency >= 3);
    
    if (frequentPatterns.length > 0) {
      recommendations.push('Revisar patrones de errores frecuentes');
      if (status === 'healthy') {status = 'degraded';}
    }

    return {
      status,
      errorRate,
      criticalErrors,
      recommendations
    };
  }
}

// ===================================
// EXPORT
// ===================================

export const errorBoundaryManager = ErrorBoundaryManager.getInstance();
export default ErrorBoundaryManager;









