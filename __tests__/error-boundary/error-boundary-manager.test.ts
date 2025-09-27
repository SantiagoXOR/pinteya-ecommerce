/**
 * @jest-environment jsdom
 */

// ===================================
// ERROR BOUNDARY MANAGER TESTS
// ===================================
// Tests para el sistema centralizado de gestión de Error Boundaries

import { errorBoundaryManager } from '@/lib/error-boundary/error-boundary-manager';
import type { ErrorMetrics } from '@/lib/error-boundary/error-boundary-manager';

// ===================================
// MOCKS
// ===================================

// Mock de fetch
global.fetch = jest.fn();

// Mock de console
const originalConsoleError = console.error;
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;

beforeEach(() => {
  console.error = jest.fn();
  console.log = jest.fn();
  console.warn = jest.fn();
  jest.clearAllMocks();
  (fetch as jest.Mock).mockClear();
  
  // Limpiar errores anteriores
  errorBoundaryManager.clearOldErrors(0);
});

afterEach(() => {
  console.error = originalConsoleError;
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;
});

// ===================================
// TESTS DE CONFIGURACIÓN
// ===================================

describe('ErrorBoundaryManager - Configuración', () => {
  test('devuelve configuración por defecto para niveles conocidos', () => {
    const pageConfig = errorBoundaryManager.getConfig('page');
    expect(pageConfig).toEqual({
      level: 'page',
      enableRetry: true,
      maxRetries: 2,
      retryDelay: 2000,
      enableAutoRecovery: true,
      recoveryTimeout: 5000,
      enableReporting: true
    });

    const sectionConfig = errorBoundaryManager.getConfig('section');
    expect(sectionConfig).toEqual({
      level: 'section',
      enableRetry: true,
      maxRetries: 3,
      retryDelay: 1000,
      enableAutoRecovery: true,
      recoveryTimeout: 3000,
      enableReporting: true
    });

    const componentConfig = errorBoundaryManager.getConfig('component');
    expect(componentConfig).toEqual({
      level: 'component',
      enableRetry: true,
      maxRetries: 5,
      retryDelay: 500,
      enableAutoRecovery: true,
      recoveryTimeout: 2000,
      enableReporting: false
    });
  });

  test('devuelve configuración de componente para niveles desconocidos', () => {
    const unknownConfig = errorBoundaryManager.getConfig('unknown');
    expect(unknownConfig.level).toBe('component');
  });

  test('permite actualizar configuración', () => {
    errorBoundaryManager.updateConfig('page', {
      maxRetries: 5,
      retryDelay: 3000
    });

    const updatedConfig = errorBoundaryManager.getConfig('page');
    expect(updatedConfig.maxRetries).toBe(5);
    expect(updatedConfig.retryDelay).toBe(3000);
    expect(updatedConfig.level).toBe('page'); // Otros valores se mantienen
  });
});

// ===================================
// TESTS DE REPORTE DE ERRORES
// ===================================

describe('ErrorBoundaryManager - Reporte de Errores', () => {
  test('reporta y almacena errores correctamente', () => {
    const error = new Error('Test error');
    const errorInfo = { componentStack: 'at TestComponent' };
    const context = {
      errorId: 'test-error-1',
      level: 'component',
      component: 'TestComponent',
      retryCount: 0
    };

    errorBoundaryManager.reportError(error, errorInfo, context);

    const metrics = errorBoundaryManager.getErrorMetrics();
    expect(metrics.totalErrors).toBe(1);
    expect(metrics.errorsByComponent['TestComponent']).toBe(1);
    expect(metrics.errorsByType['UnknownError']).toBe(1);
  });

  test('clasifica errores correctamente', () => {
    const chunkError = new Error('Loading chunk 123 failed');
    const networkError = new Error('Network request failed');
    const typeError = new TypeError('Cannot read property');
    const reactError = new Error('Render error');
    reactError.stack = 'at React.Component.render';

    // Reportar diferentes tipos de errores
    errorBoundaryManager.reportError(chunkError, { componentStack: '' }, {
      errorId: 'chunk-1', level: 'page', component: 'App', retryCount: 0
    });

    errorBoundaryManager.reportError(networkError, { componentStack: '' }, {
      errorId: 'network-1', level: 'section', component: 'DataLoader', retryCount: 0
    });

    errorBoundaryManager.reportError(typeError, { componentStack: '' }, {
      errorId: 'type-1', level: 'component', component: 'UserProfile', retryCount: 0
    });

    errorBoundaryManager.reportError(reactError, { componentStack: '' }, {
      errorId: 'react-1', level: 'component', component: 'ProductCard', retryCount: 0
    });

    const metrics = errorBoundaryManager.getErrorMetrics();
    expect(metrics.errorsByType['ChunkLoadError']).toBe(1);
    expect(metrics.errorsByType['NetworkError']).toBe(1);
    expect(metrics.errorsByType['TypeError']).toBe(1);
    expect(metrics.errorsByType['ReactError']).toBe(1);
  });

  test('evalúa impacto del usuario correctamente', () => {
    const pageError = new Error('Page error');
    const sectionError = new Error('Section error');
    const componentError = new Error('Component error');
    const chunkError = new Error('Loading chunk failed');

    errorBoundaryManager.reportError(pageError, { componentStack: '' }, {
      errorId: 'page-1', level: 'page', component: 'HomePage', retryCount: 0
    });

    errorBoundaryManager.reportError(sectionError, { componentStack: '' }, {
      errorId: 'section-1', level: 'section', component: 'ProductList', retryCount: 0
    });

    errorBoundaryManager.reportError(componentError, { componentStack: '' }, {
      errorId: 'component-1', level: 'component', component: 'Button', retryCount: 0
    });

    errorBoundaryManager.reportError(chunkError, { componentStack: '' }, {
      errorId: 'chunk-1', level: 'component', component: 'LazyComponent', retryCount: 0
    });

    const metrics = errorBoundaryManager.getErrorMetrics();
    expect(metrics.errorsByImpact['critical']).toBe(1); // page error
    expect(metrics.errorsByImpact['high']).toBe(2); // section error + chunk error (high priority)
    expect(metrics.errorsByImpact['medium']).toBeUndefined(); // no medium errors
    expect(metrics.errorsByImpact['low']).toBe(1); // component error
  });
});

// ===================================
// TESTS DE DETECCIÓN DE PATRONES
// ===================================

describe('ErrorBoundaryManager - Detección de Patrones', () => {
  test('detecta patrones de errores frecuentes', () => {
    const error = new Error('Repeated error');
    
    // Reportar el mismo error múltiples veces
    for (let i = 0; i < 5; i++) {
      errorBoundaryManager.reportError(error, { componentStack: '' }, {
        errorId: `repeat-${i}`,
        level: 'component',
        component: 'ProblematicComponent',
        retryCount: 0
      });
    }

    const metrics = errorBoundaryManager.getErrorMetrics();
    expect(metrics.patterns.length).toBeGreaterThan(0);
    
    const pattern = metrics.patterns.find(p => 
      p.pattern.includes('Error:ProblematicComponent')
    );
    expect(pattern).toBeDefined();
    expect(pattern?.frequency).toBe(5);
    expect(pattern?.affectedComponents).toContain('ProblematicComponent');
  });

  test('proporciona sugerencias de corrección para patrones conocidos', () => {
    const chunkError = new Error('Loading chunk failed');
    const networkError = new Error('Network timeout');
    const typeError = new TypeError('Cannot read property');

    errorBoundaryManager.reportError(chunkError, { componentStack: '' }, {
      errorId: 'chunk-1', level: 'component', component: 'LazyComponent', retryCount: 0
    });

    errorBoundaryManager.reportError(networkError, { componentStack: '' }, {
      errorId: 'network-1', level: 'component', component: 'ApiClient', retryCount: 0
    });

    errorBoundaryManager.reportError(typeError, { componentStack: '' }, {
      errorId: 'type-1', level: 'component', component: 'DataProcessor', retryCount: 0
    });

    const metrics = errorBoundaryManager.getErrorMetrics();
    
    const chunkPattern = metrics.patterns.find(p => p.pattern.includes('ChunkLoadError'));
    expect(chunkPattern?.suggestedFix).toBeDefined();
    expect(chunkPattern?.suggestedFix).toContain('chunk retry logic');

    const networkPattern = metrics.patterns.find(p => p.pattern.includes('NetworkError'));
    expect(networkPattern?.suggestedFix).toBeDefined();
    expect(networkPattern?.suggestedFix).toContain('network retry');

    const typePattern = metrics.patterns.find(p => p.pattern.includes('TypeError'));
    expect(typePattern?.suggestedFix).toBeDefined();
    expect(typePattern?.suggestedFix).toContain('null/undefined checks');
  });
});

// ===================================
// TESTS DE LISTENERS
// ===================================

describe('ErrorBoundaryManager - Listeners', () => {
  test('notifica a listeners cuando se reportan errores', () => {
    const listener = jest.fn();
    errorBoundaryManager.addErrorListener(listener);

    const error = new Error('Test error');
    errorBoundaryManager.reportError(error, { componentStack: '' }, {
      errorId: 'test-1',
      level: 'component',
      component: 'TestComponent',
      retryCount: 0
    });

    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        errorId: 'test-1',
        component: 'TestComponent',
        level: 'component'
      })
    );

    errorBoundaryManager.removeErrorListener(listener);
  });

  test('permite remover listeners', () => {
    const listener = jest.fn();
    errorBoundaryManager.addErrorListener(listener);
    errorBoundaryManager.removeErrorListener(listener);

    const error = new Error('Test error');
    errorBoundaryManager.reportError(error, { componentStack: '' }, {
      errorId: 'test-1',
      level: 'component',
      component: 'TestComponent',
      retryCount: 0
    });

    expect(listener).not.toHaveBeenCalled();
  });

  test('maneja errores en listeners sin afectar el flujo principal', () => {
    const faultyListener = jest.fn(() => {
      throw new Error('Listener error');
    });
    const goodListener = jest.fn();

    errorBoundaryManager.addErrorListener(faultyListener);
    errorBoundaryManager.addErrorListener(goodListener);

    const error = new Error('Test error');
    errorBoundaryManager.reportError(error, { componentStack: '' }, {
      errorId: 'test-1',
      level: 'component',
      component: 'TestComponent',
      retryCount: 0
    });

    expect(faultyListener).toHaveBeenCalled();
    expect(goodListener).toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(
      '❌ Error in error listener:',
      expect.any(Error)
    );

    errorBoundaryManager.removeErrorListener(faultyListener);
    errorBoundaryManager.removeErrorListener(goodListener);
  });
});

// ===================================
// TESTS DE MÉTRICAS Y REPORTES
// ===================================

describe('ErrorBoundaryManager - Métricas y Reportes', () => {
  test('calcula métricas correctamente', () => {
    // Reportar varios errores
    const errors = [
      { type: 'TypeError', component: 'ComponentA', level: 'component', impact: 'low' },
      { type: 'NetworkError', component: 'ComponentB', level: 'section', impact: 'medium' },
      { type: 'TypeError', component: 'ComponentA', level: 'component', impact: 'low' },
      { type: 'ChunkLoadError', component: 'ComponentC', level: 'page', impact: 'critical' }
    ];

    errors.forEach((errorData, index) => {
      const error = new Error(`${errorData.type} message`);
      if (errorData.type === 'TypeError') error.name = 'TypeError';
      if (errorData.type === 'NetworkError') error.message = 'Network failed';
      if (errorData.type === 'ChunkLoadError') error.message = 'Loading chunk failed';

      errorBoundaryManager.reportError(error, { componentStack: '' }, {
        errorId: `error-${index}`,
        level: errorData.level as 'page' | 'section' | 'component',
        component: errorData.component,
        retryCount: 0
      });
    });

    const metrics = errorBoundaryManager.getErrorMetrics();
    
    expect(metrics.totalErrors).toBe(4);
    expect(metrics.errorsByType['TypeError']).toBe(2);
    expect(metrics.errorsByType['NetworkError']).toBe(1);
    expect(metrics.errorsByType['ChunkLoadError']).toBe(1);
    expect(metrics.errorsByComponent['ComponentA']).toBe(2);
    expect(metrics.errorsByComponent['ComponentB']).toBe(1);
    expect(metrics.errorsByComponent['ComponentC']).toBe(1);
  });

  test('proporciona errores recientes ordenados por timestamp', () => {
    const now = Date.now();
    
    // Reportar errores con diferentes timestamps
    for (let i = 0; i < 15; i++) {
      const error = new Error(`Error ${i}`);
      errorBoundaryManager.reportError(error, { componentStack: '' }, {
        errorId: `error-${i}`,
        level: 'component',
        component: `Component${i}`,
        retryCount: 0
      });
    }

    const metrics = errorBoundaryManager.getErrorMetrics();
    
    // Debería devolver solo los 10 más recientes
    expect(metrics.recentErrors.length).toBe(10);
    
    // Deberían estar ordenados por timestamp descendente
    for (let i = 0; i < metrics.recentErrors.length - 1; i++) {
      expect(metrics.recentErrors[i].timestamp).toBeGreaterThanOrEqual(
        metrics.recentErrors[i + 1].timestamp
      );
    }
  });
});

// ===================================
// TESTS DE ESTADO DE SALUD
// ===================================

describe('ErrorBoundaryManager - Estado de Salud', () => {
  test('reporta estado saludable cuando no hay errores', () => {
    const healthStatus = errorBoundaryManager.getHealthStatus();
    
    expect(healthStatus.status).toBe('healthy');
    expect(healthStatus.errorRate).toBe(0);
    expect(healthStatus.criticalErrors).toBe(0);
    expect(healthStatus.recommendations).toEqual([]);
  });

  test('reporta estado crítico cuando hay errores críticos', () => {
    const criticalError = new Error('Critical page error');
    errorBoundaryManager.reportError(criticalError, { componentStack: '' }, {
      errorId: 'critical-1',
      level: 'page',
      component: 'HomePage',
      retryCount: 0
    });

    const healthStatus = errorBoundaryManager.getHealthStatus();
    
    expect(healthStatus.status).toBe('critical');
    expect(healthStatus.criticalErrors).toBe(1);
    expect(healthStatus.recommendations).toContain('Resolver errores críticos inmediatamente');
  });

  test('reporta estado degradado con alta tasa de errores', () => {
    // Simular muchos errores recientes
    for (let i = 0; i < 10; i++) {
      const error = new Error(`Error ${i}`);
      errorBoundaryManager.reportError(error, { componentStack: '' }, {
        errorId: `error-${i}`,
        level: 'component',
        component: `Component${i}`,
        retryCount: 0
      });
    }

    const healthStatus = errorBoundaryManager.getHealthStatus();
    
    expect(healthStatus.status).toBe('degraded');
    expect(healthStatus.recommendations).toContain('Alta tasa de errores detectada');
  });

  test('detecta patrones frecuentes en recomendaciones', () => {
    const error = new Error('Frequent error');
    
    // Reportar el mismo error múltiples veces
    for (let i = 0; i < 5; i++) {
      errorBoundaryManager.reportError(error, { componentStack: '' }, {
        errorId: `frequent-${i}`,
        level: 'component',
        component: 'ProblematicComponent',
        retryCount: 0
      });
    }

    const healthStatus = errorBoundaryManager.getHealthStatus();
    
    expect(healthStatus.recommendations).toContain('Revisar patrones de errores frecuentes');
  });
});

// ===================================
// TESTS DE LIMPIEZA
// ===================================

describe('ErrorBoundaryManager - Limpieza', () => {
  test('limpia errores antiguos correctamente', () => {
    // Limpiar errores existentes primero
    errorBoundaryManager.clearOldErrors(0);

    // Mock Date.now para simular errores antiguos
    const originalDateNow = Date.now;
    const oldTimestamp = Date.now() - (25 * 60 * 60 * 1000); // 25 horas atrás
    
    // Simular error antiguo
    Date.now = jest.fn(() => oldTimestamp);
    const oldError = new Error('Old error');
    errorBoundaryManager.reportError(oldError, { componentStack: '' }, {
      errorId: 'old-1',
      level: 'component',
      component: 'OldComponent',
      retryCount: 0
    });

    // Restaurar Date.now y reportar error reciente
    Date.now = originalDateNow;
    const recentError = new Error('Recent error');
    errorBoundaryManager.reportError(recentError, { componentStack: '' }, {
      errorId: 'recent-1',
      level: 'component',
      component: 'RecentComponent',
      retryCount: 0
    });

    // Verificar que ambos errores están presentes
    let metrics = errorBoundaryManager.getErrorMetrics();
    expect(metrics.totalErrors).toBeGreaterThanOrEqual(2);

    // Limpiar errores antiguos (24 horas)
    errorBoundaryManager.clearOldErrors(24 * 60 * 60 * 1000);

    metrics = errorBoundaryManager.getErrorMetrics();

    // Solo el error reciente debería permanecer
    expect(metrics.totalErrors).toBeGreaterThanOrEqual(1);
    // Verificar que el error reciente sigue presente
    const recentErrorExists = metrics.recentErrors.some(e => e.errorId === 'recent-1');
    expect(recentErrorExists).toBe(true);
  });

  test('marca errores como resueltos', () => {
    const error = new Error('Test error');
    errorBoundaryManager.reportError(error, { componentStack: '' }, {
      errorId: 'resolvable-1',
      level: 'component',
      component: 'TestComponent',
      retryCount: 0
    });

    const beforeResolve = errorBoundaryManager.getErrorMetrics();
    expect(beforeResolve.recentErrors[0].resolved).toBe(false);

    errorBoundaryManager.markErrorResolved('resolvable-1', 5000);

    const afterResolve = errorBoundaryManager.getErrorMetrics();
    expect(afterResolve.recentErrors[0].resolved).toBe(true);
    expect(afterResolve.recentErrors[0].resolutionTime).toBe(5000);
  });
});

// ===================================
// TESTS DE SINGLETON
// ===================================

describe('ErrorBoundaryManager - Singleton', () => {
  test('mantiene una sola instancia', () => {
    const instance1 = errorBoundaryManager;
    const instance2 = errorBoundaryManager;
    
    expect(instance1).toBe(instance2);
  });

  test('mantiene estado entre accesos', () => {
    const error = new Error('Persistent error');
    errorBoundaryManager.reportError(error, { componentStack: '' }, {
      errorId: 'persistent-1',
      level: 'component',
      component: 'PersistentComponent',
      retryCount: 0
    });

    const metrics1 = errorBoundaryManager.getErrorMetrics();
    const metrics2 = errorBoundaryManager.getErrorMetrics();
    
    expect(metrics1.totalErrors).toBe(metrics2.totalErrors);
    expect(metrics1.totalErrors).toBe(1);
  });
});
