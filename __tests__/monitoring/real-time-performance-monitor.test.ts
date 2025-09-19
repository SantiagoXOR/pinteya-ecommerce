// ===================================
// TESTS - REAL-TIME PERFORMANCE MONITOR
// ===================================

import { 
  RealTimePerformanceMonitor,
  realTimePerformanceMonitor,
  RealTimeMonitoringUtils,
  DEFAULT_THRESHOLDS
} from '@/lib/monitoring/real-time-performance-monitor';

// Mock Redis
jest.mock('@/lib/redis', () => ({
  getRedisClient: () => ({
    setex: jest.fn().mockResolvedValue('OK'),
    get: jest.fn().mockResolvedValue(null),
    del: jest.fn().mockResolvedValue(1)
  })
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  },
  LogCategory: {
    MONITORING: 'monitoring'
  }
}));

describe('RealTimePerformanceMonitor', () => {
  let monitor: RealTimePerformanceMonitor;

  beforeEach(() => {
    monitor = RealTimePerformanceMonitor.getInstance();
    jest.clearAllMocks();
  });

  afterEach(() => {
    monitor.destroy();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = RealTimePerformanceMonitor.getInstance();
      const instance2 = RealTimePerformanceMonitor.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('Web Vitals Recording', () => {
    it('should record web vitals correctly', () => {
      const vitals = {
        lcp: 2300,
        fid: 85,
        cls: 0.08,
        fcp: 1600,
        ttfb: 650,
        inp: 120
      };

      monitor.recordWebVitals(vitals);

      const metrics = monitor.getCurrentMetrics();
      expect(metrics.webVitals).toHaveLength(1);
      
      const recordedVitals = metrics.webVitals[0];
      expect(recordedVitals.lcp).toBe(2300);
      expect(recordedVitals.fid).toBe(85);
      expect(recordedVitals.cls).toBe(0.08);
      expect(recordedVitals.timestamp).toBeGreaterThan(0);
    });

    it('should maintain buffer size limit for web vitals', () => {
      // Agregar más de 50 métricas (límite del buffer)
      for (let i = 0; i < 60; i++) {
        monitor.recordWebVitals({
          lcp: 2000 + i,
          fid: 80 + i,
          cls: 0.05 + (i * 0.001),
          fcp: 1500 + i,
          ttfb: 600 + i,
          inp: 100 + i
        });
      }

      const metrics = monitor.getCurrentMetrics();
      expect(metrics.webVitals).toHaveLength(50); // Máximo 50
      
      // Debería mantener las más recientes
      const latestVitals = metrics.webVitals[metrics.webVitals.length - 1];
      expect(latestVitals.lcp).toBe(2059); // 2000 + 59
    });

    it('should check web vitals thresholds', () => {
      // LCP pobre (>4000ms)
      monitor.recordWebVitals({
        lcp: 4500,
        fid: 50,
        cls: 0.05,
        fcp: 1500,
        ttfb: 600,
        inp: 100
      });

      // Verificar que se llamó al logger para la alerta
      expect(require('@/lib/logger').logger.warn).toHaveBeenCalled();
    });
  });

  describe('API Metrics Recording', () => {
    it('should record API metrics correctly', () => {
      const apiMetrics = {
        endpoint: '/api/products',
        method: 'GET',
        responseTime: 450,
        statusCode: 200,
        requestSize: 1024,
        responseSize: 8192,
        userAgent: 'Mozilla/5.0...',
        ip: '192.168.1.1'
      };

      monitor.recordAPIMetrics(apiMetrics);

      const metrics = monitor.getCurrentMetrics();
      expect(metrics.apiMetrics).toHaveLength(1);
      
      const recordedMetrics = metrics.apiMetrics[0];
      expect(recordedMetrics.endpoint).toBe('/api/products');
      expect(recordedMetrics.responseTime).toBe(450);
      expect(recordedMetrics.statusCode).toBe(200);
    });

    it('should maintain buffer size limit for API metrics', () => {
      // Agregar más de 200 métricas (límite del buffer)
      for (let i = 0; i < 250; i++) {
        monitor.recordAPIMetrics({
          endpoint: `/api/test/${i}`,
          method: 'GET',
          responseTime: 400 + i,
          statusCode: 200,
          requestSize: 1024,
          responseSize: 8192,
          userAgent: 'Test Agent',
          ip: '192.168.1.1'
        });
      }

      const metrics = monitor.getCurrentMetrics();
      expect(metrics.apiMetrics).toHaveLength(200); // Máximo 200
    });

    it('should check API thresholds', () => {
      // Response time crítico
      monitor.recordAPIMetrics({
        endpoint: '/api/slow',
        method: 'GET',
        responseTime: 3500, // > 3000ms (crítico)
        statusCode: 200,
        requestSize: 1024,
        responseSize: 8192,
        userAgent: 'Test Agent',
        ip: '192.168.1.1'
      });

      expect(require('@/lib/logger').logger.warn).toHaveBeenCalled();
    });

    it('should check API error status codes', () => {
      // Error 500
      monitor.recordAPIMetrics({
        endpoint: '/api/error',
        method: 'POST',
        responseTime: 200,
        statusCode: 500,
        requestSize: 1024,
        responseSize: 512,
        userAgent: 'Test Agent',
        ip: '192.168.1.1'
      });

      expect(require('@/lib/logger').logger.warn).toHaveBeenCalled();
    });
  });

  describe('Database Metrics Recording', () => {
    it('should record database metrics correctly', () => {
      const dbMetrics = {
        queryTime: 150,
        queryType: 'SELECT' as const,
        tableName: 'products',
        rowsAffected: 10,
        connectionPoolSize: 20,
        activeConnections: 5,
        waitingConnections: 0
      };

      monitor.recordDatabaseMetrics(dbMetrics);

      const metrics = monitor.getCurrentMetrics();
      expect(metrics.dbMetrics).toHaveLength(1);
      
      const recordedMetrics = metrics.dbMetrics[0];
      expect(recordedMetrics.queryTime).toBe(150);
      expect(recordedMetrics.queryType).toBe('SELECT');
      expect(recordedMetrics.tableName).toBe('products');
    });

    it('should check database thresholds', () => {
      // Query lenta (>5000ms)
      monitor.recordDatabaseMetrics({
        queryTime: 6000,
        queryType: 'SELECT',
        tableName: 'large_table',
        rowsAffected: 1000,
        connectionPoolSize: 20,
        activeConnections: 15,
        waitingConnections: 5
      });

      expect(require('@/lib/logger').logger.warn).toHaveBeenCalled();
    });

    it('should check connection pool issues', () => {
      // Muchas conexiones esperando
      monitor.recordDatabaseMetrics({
        queryTime: 200,
        queryType: 'INSERT',
        tableName: 'orders',
        rowsAffected: 1,
        connectionPoolSize: 20,
        activeConnections: 20,
        waitingConnections: 15 // > 10 (umbral)
      });

      expect(require('@/lib/logger').logger.warn).toHaveBeenCalled();
    });
  });

  describe('Threshold Management', () => {
    it('should use default thresholds', () => {
      expect(DEFAULT_THRESHOLDS.responseTime.warning).toBe(1000);
      expect(DEFAULT_THRESHOLDS.responseTime.critical).toBe(3000);
      expect(DEFAULT_THRESHOLDS.errorRate.warning).toBe(0.05);
      expect(DEFAULT_THRESHOLDS.errorRate.critical).toBe(0.10);
    });

    it('should allow updating thresholds', () => {
      const newThresholds = {
        responseTime: {
          warning: 500,
          critical: 2000
        }
      };

      monitor.updateThresholds(newThresholds);

      // Verificar que se actualizaron
      expect(require('@/lib/logger').logger.info).toHaveBeenCalledWith(
        'monitoring',
        'Performance thresholds updated'
      );
    });
  });

  describe('Alert Management', () => {
    it('should resolve alerts', () => {
      // Primero crear una alerta simulada
      const alertId = 'test-alert-123';
      
      const resolved = monitor.resolveAlert(alertId);
      
      // Como no existe la alerta, debería retornar false
      expect(resolved).toBe(false);
    });
  });

  describe('Subscription System', () => {
    it('should allow subscribing to updates', () => {
      const callback = jest.fn();
      
      const unsubscribe = monitor.subscribe(callback);
      
      // Registrar una métrica para disparar callback
      monitor.recordWebVitals({
        lcp: 2000,
        fid: 80,
        cls: 0.05,
        fcp: 1500,
        ttfb: 600,
        inp: 100
      });

      // El callback debería haber sido llamado
      expect(callback).toHaveBeenCalled();
      
      // Cleanup
      unsubscribe();
    });

    it('should allow unsubscribing', () => {
      const callback = jest.fn();
      
      const unsubscribe = monitor.subscribe(callback);
      unsubscribe();
      
      // Registrar métrica después de unsubscribe
      monitor.recordWebVitals({
        lcp: 2000,
        fid: 80,
        cls: 0.05,
        fcp: 1500,
        ttfb: 600,
        inp: 100
      });

      // El callback no debería ser llamado
      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle subscription errors gracefully', () => {
      const faultyCallback = jest.fn().mockImplementation(() => {
        throw new Error('Callback error');
      });
      
      monitor.subscribe(faultyCallback);
      
      // Esto no debería hacer que el sistema falle
      expect(() => {
        monitor.recordWebVitals({
          lcp: 2000,
          fid: 80,
          cls: 0.05,
          fcp: 1500,
          ttfb: 600,
          inp: 100
        });
      }).not.toThrow();
      
      expect(require('@/lib/logger').logger.error).toHaveBeenCalled();
    });
  });

  describe('getCurrentMetrics', () => {
    it('should return current metrics structure', () => {
      const metrics = monitor.getCurrentMetrics();
      
      expect(metrics).toHaveProperty('realTime');
      expect(metrics).toHaveProperty('webVitals');
      expect(metrics).toHaveProperty('apiMetrics');
      expect(metrics).toHaveProperty('dbMetrics');
      expect(metrics).toHaveProperty('alerts');
      
      expect(Array.isArray(metrics.realTime)).toBe(true);
      expect(Array.isArray(metrics.webVitals)).toBe(true);
      expect(Array.isArray(metrics.apiMetrics)).toBe(true);
      expect(Array.isArray(metrics.dbMetrics)).toBe(true);
      expect(Array.isArray(metrics.alerts)).toBe(true);
    });
  });
});

describe('RealTimeMonitoringUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('recordWebVitals', () => {
    it('should call monitor recordWebVitals', () => {
      const vitals = {
        lcp: 2000,
        fid: 80,
        cls: 0.05,
        fcp: 1500,
        ttfb: 600,
        inp: 100
      };

      RealTimeMonitoringUtils.recordWebVitals(vitals);

      // Verificar que se registraron las métricas
      const metrics = realTimePerformanceMonitor.getCurrentMetrics();
      expect(metrics.webVitals.length).toBeGreaterThan(0);
    });
  });

  describe('recordAPICall', () => {
    it('should call monitor recordAPIMetrics', () => {
      const apiMetrics = {
        endpoint: '/api/test',
        method: 'GET',
        responseTime: 300,
        statusCode: 200,
        requestSize: 1024,
        responseSize: 2048,
        userAgent: 'Test Agent',
        ip: '192.168.1.1'
      };

      RealTimeMonitoringUtils.recordAPICall(apiMetrics);

      const metrics = realTimePerformanceMonitor.getCurrentMetrics();
      expect(metrics.apiMetrics.length).toBeGreaterThan(0);
    });
  });

  describe('recordDatabaseQuery', () => {
    it('should call monitor recordDatabaseMetrics', () => {
      const dbMetrics = {
        queryTime: 100,
        queryType: 'SELECT' as const,
        tableName: 'users',
        rowsAffected: 5,
        connectionPoolSize: 10,
        activeConnections: 3,
        waitingConnections: 0
      };

      RealTimeMonitoringUtils.recordDatabaseQuery(dbMetrics);

      const metrics = realTimePerformanceMonitor.getCurrentMetrics();
      expect(metrics.dbMetrics.length).toBeGreaterThan(0);
    });
  });

  describe('getCurrentStatus', () => {
    it('should return current status when no metrics', () => {
      const status = RealTimeMonitoringUtils.getCurrentStatus();
      
      expect(status).toEqual({
        healthy: false,
        activeAlerts: 0,
        avgResponseTime: 0,
        errorRate: 0,
        lastUpdate: 0
      });
    });

    it('should return current status with metrics', () => {
      // Agregar algunas métricas primero
      RealTimeMonitoringUtils.recordAPICall({
        endpoint: '/api/test',
        method: 'GET',
        responseTime: 200,
        statusCode: 200,
        requestSize: 1024,
        responseSize: 2048,
        userAgent: 'Test Agent',
        ip: '192.168.1.1'
      });

      const status = RealTimeMonitoringUtils.getCurrentStatus();
      
      expect(status.healthy).toBe(true);
      expect(status.activeAlerts).toBe(0);
      expect(status.avgResponseTime).toBeGreaterThan(0);
      expect(status.errorRate).toBe(0);
      expect(status.lastUpdate).toBeGreaterThan(0);
    });

    it('should detect unhealthy status with high error rate', () => {
      // Agregar métricas con errores
      for (let i = 0; i < 10; i++) {
        RealTimeMonitoringUtils.recordAPICall({
          endpoint: '/api/error',
          method: 'GET',
          responseTime: 200,
          statusCode: i < 6 ? 500 : 200, // 60% error rate
          requestSize: 1024,
          responseSize: 2048,
          userAgent: 'Test Agent',
          ip: '192.168.1.1'
        });
      }

      const status = RealTimeMonitoringUtils.getCurrentStatus();
      
      expect(status.healthy).toBe(false); // Error rate > 5%
      expect(status.errorRate).toBeGreaterThan(0.05);
    });

    it('should detect unhealthy status with slow response time', () => {
      // Agregar métrica con response time lento
      RealTimeMonitoringUtils.recordAPICall({
        endpoint: '/api/slow',
        method: 'GET',
        responseTime: 3000, // > 2000ms threshold
        statusCode: 200,
        requestSize: 1024,
        responseSize: 2048,
        userAgent: 'Test Agent',
        ip: '192.168.1.1'
      });

      const status = RealTimeMonitoringUtils.getCurrentStatus();
      
      expect(status.healthy).toBe(false);
      expect(status.avgResponseTime).toBeGreaterThanOrEqual(2000);
    });
  });
});

describe('Performance Monitor Integration', () => {
  let monitor: RealTimePerformanceMonitor;

  beforeEach(() => {
    monitor = RealTimePerformanceMonitor.getInstance();
    jest.clearAllMocks();
  });

  afterEach(() => {
    monitor.destroy();
  });

  it('should handle high volume of metrics efficiently', () => {
    const startTime = Date.now();

    // Generar 1000 métricas de diferentes tipos
    for (let i = 0; i < 1000; i++) {
      monitor.recordWebVitals({
        lcp: 2000 + (i % 1000),
        fid: 80 + (i % 100),
        cls: 0.05 + (i % 10) * 0.01,
        fcp: 1500 + (i % 500),
        ttfb: 600 + (i % 200),
        inp: 100 + (i % 50)
      });

      monitor.recordAPIMetrics({
        endpoint: `/api/endpoint${i % 10}`,
        method: i % 2 === 0 ? 'GET' : 'POST',
        responseTime: 200 + (i % 300),
        statusCode: i % 20 === 0 ? 500 : 200,
        requestSize: 1024,
        responseSize: 2048 + (i % 1000),
        userAgent: 'Load Test Agent',
        ip: `192.168.1.${i % 255}`
      });
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Debería procesar 2000 métricas en menos de 1 segundo
    expect(duration).toBeLessThan(1000);

    const metrics = monitor.getCurrentMetrics();
    
    // Verificar que los buffers respetan los límites
    expect(metrics.webVitals.length).toBeLessThanOrEqual(50);
    expect(metrics.apiMetrics.length).toBeLessThanOrEqual(200);
  });

  it('should maintain performance under concurrent access', async () => {
    const promises = [];

    // Simular acceso concurrente
    for (let i = 0; i < 100; i++) {
      promises.push(
        Promise.resolve().then(() => {
          monitor.recordWebVitals({
            lcp: 2000 + i,
            fid: 80 + i,
            cls: 0.05,
            fcp: 1500,
            ttfb: 600,
            inp: 100
          });
        })
      );

      promises.push(
        Promise.resolve().then(() => {
          monitor.recordAPIMetrics({
            endpoint: `/api/concurrent${i}`,
            method: 'GET',
            responseTime: 200 + i,
            statusCode: 200,
            requestSize: 1024,
            responseSize: 2048,
            userAgent: 'Concurrent Test',
            ip: '192.168.1.1'
          });
        })
      );
    }

    await Promise.all(promises);

    const metrics = monitor.getCurrentMetrics();
    expect(metrics.webVitals.length).toBeGreaterThan(0);
    expect(metrics.apiMetrics.length).toBeGreaterThan(0);
  });

  it('should handle memory cleanup properly', () => {
    // Llenar buffers al máximo
    for (let i = 0; i < 100; i++) {
      monitor.recordWebVitals({
        lcp: 2000,
        fid: 80,
        cls: 0.05,
        fcp: 1500,
        ttfb: 600,
        inp: 100
      });

      monitor.recordAPIMetrics({
        endpoint: '/api/test',
        method: 'GET',
        responseTime: 200,
        statusCode: 200,
        requestSize: 1024,
        responseSize: 2048,
        userAgent: 'Memory Test',
        ip: '192.168.1.1'
      });

      monitor.recordDatabaseMetrics({
        queryTime: 100,
        queryType: 'SELECT',
        tableName: 'test',
        rowsAffected: 1,
        connectionPoolSize: 10,
        activeConnections: 5,
        waitingConnections: 0
      });
    }

    const metrics = monitor.getCurrentMetrics();
    
    // Los buffers deberían mantener sus límites
    expect(metrics.webVitals.length).toBeLessThanOrEqual(50);
    expect(metrics.apiMetrics.length).toBeLessThanOrEqual(200);
    expect(metrics.dbMetrics.length).toBeLessThanOrEqual(100);
  });
});
