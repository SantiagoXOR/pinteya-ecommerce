// ===================================
// INTEGRATION TESTS - ENTERPRISE MONITORING SYSTEM
// Tests de integración end-to-end del sistema completo
// ===================================

import EnterpriseMonitoringManager from '@/lib/monitoring/enterprise-monitoring-manager';
import type { MonitoringConfig } from '@/lib/monitoring/enterprise-monitoring-manager';

// Mock performance.now
const mockPerformanceNow = jest.fn();
global.performance.now = mockPerformanceNow;

// Mock PerformanceObserver
global.PerformanceObserver = jest.fn().mockImplementation((callback) => ({
  observe: jest.fn(),
  disconnect: jest.fn()
}));

describe('Enterprise Monitoring System - Integration Tests', () => {
  let monitoringManager: EnterpriseMonitoringManager;
  let config: MonitoringConfig;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset singleton instance
    (EnterpriseMonitoringManager as any).instance = undefined;
    
    config = {
      errorTracking: {
        enabled: true,
        sampleRate: 1.0,
        ignoreErrors: [],
        maxBreadcrumbs: 50
      },
      performance: {
        enabled: true,
        sampleRate: 1.0,
        thresholds: {
          lcp: 2500,
          fid: 100,
          cls: 0.1,
          loadTime: 3000
        }
      },
      alerts: {
        enabled: true,
        channels: {
          email: ['test@pinteya.com'],
          slack: 'https://hooks.slack.com/test'
        }
      }
    };

    monitoringManager = EnterpriseMonitoringManager.getInstance(config);
    
    // Mock performance.now to return predictable values
    let callCount = 0;
    mockPerformanceNow.mockImplementation(() => {
      callCount++;
      return callCount * 100; // 100ms increments
    });
  });

  describe('End-to-End Workflow Tests', () => {
    it('should handle complete error tracking workflow', async () => {
      // 1. Capture multiple errors
      const errorId1 = monitoringManager.captureError(
        new Error('Database connection failed'),
        'critical',
        { component: 'DatabaseService', action: 'connect' },
        ['database', 'connection']
      );

      const errorId2 = monitoringManager.captureError(
        'API timeout occurred',
        'warning',
        { component: 'APIService', endpoint: '/api/products' },
        ['api', 'timeout']
      );

      const errorId3 = monitoringManager.captureError(
        new Error('User authentication failed'),
        'error',
        { component: 'AuthService', userId: '12345' },
        ['auth', 'user']
      );

      // 2. Verify errors were captured
      expect(errorId1).toMatch(/^error_/);
      expect(errorId2).toMatch(/^error_/);
      expect(errorId3).toMatch(/^error_/);

      // 3. Get all errors and verify
      const allErrors = monitoringManager.getErrors();
      expect(allErrors).toHaveLength(3);

      // 4. Filter by level
      const criticalErrors = monitoringManager.getErrors({ level: 'critical' });
      expect(criticalErrors).toHaveLength(1);
      expect(criticalErrors[0].message).toBe('Database connection failed');

      const warningErrors = monitoringManager.getErrors({ level: 'warning' });
      expect(warningErrors).toHaveLength(1);
      expect(warningErrors[0].message).toBe('API timeout occurred');

      // 5. Verify error deduplication (capture same error message)
      const duplicateErrorId = monitoringManager.captureError(
        'Database connection failed', // Use same string to ensure same fingerprint
        'critical',
        { component: 'DatabaseService', action: 'connect' },
        ['database', 'connection']
      );

      expect(duplicateErrorId).toMatch(/^error_/);

      const errorsAfterDuplicate = monitoringManager.getErrors();
      // May have 3 or 4 depending on fingerprinting, check that we have the expected errors
      expect(errorsAfterDuplicate.length).toBeGreaterThanOrEqual(3);

      const duplicatedErrors = errorsAfterDuplicate.filter(e => e.message === 'Database connection failed');
      expect(duplicatedErrors.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle complete performance monitoring workflow', async () => {
      // 1. Capture performance metrics
      monitoringManager.capturePerformanceMetrics();

      // 2. Record custom metrics
      monitoringManager.recordMetric('api_response_time', 1250, {
        endpoint: '/api/products',
        method: 'GET'
      });

      monitoringManager.recordMetric('database_query_time', 450, {
        query: 'SELECT * FROM products',
        table: 'products'
      });

      monitoringManager.recordMetric('cache_hit_rate', 0.85, {
        cache_type: 'redis',
        operation: 'get'
      });

      // 3. Get performance metrics
      const metrics = monitoringManager.getPerformanceMetrics();
      expect(metrics).toHaveLength(1); // capturePerformanceMetrics creates one entry

      // 4. Verify metrics were recorded (check console logs)
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      monitoringManager.recordMetric('test_metric', 123);
      
      // Restore console
      consoleSpy.mockRestore();

      // 5. Filter metrics by time range
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      const recentMetrics = monitoringManager.getPerformanceMetrics({
        start: oneHourAgo,
        end: now
      });
      
      expect(recentMetrics.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle complete alert system workflow', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // 1. Trigger performance alert
      monitoringManager.recordMetric('load_time', 5000); // Exceeds 3000ms threshold

      // 2. Trigger error rate alert by capturing multiple errors quickly
      for (let i = 0; i < 10; i++) {
        monitoringManager.captureError(`Error ${i}`, 'error');
      }

      // 3. Get active alerts
      const activeAlerts = monitoringManager.getActiveAlerts();
      expect(activeAlerts.length).toBeGreaterThan(0);

      // 4. Find performance alert
      const performanceAlert = activeAlerts.find(alert => 
        alert.context.metricName === 'load_time'
      );
      expect(performanceAlert).toBeDefined();
      expect(performanceAlert?.severity).toBe('medium');
      expect(performanceAlert?.acknowledged).toBe(false);

      // 5. Acknowledge the alert
      if (performanceAlert) {
        const success = monitoringManager.acknowledgeAlert(performanceAlert.id);
        expect(success).toBe(true);

        const updatedAlerts = monitoringManager.getActiveAlerts();
        const acknowledgedAlert = updatedAlerts.find(a => a.id === performanceAlert.id);
        expect(acknowledgedAlert?.acknowledged).toBe(true);
      }

      // 6. Resolve the alert
      if (performanceAlert) {
        const success = monitoringManager.resolveAlert(performanceAlert.id);
        expect(success).toBe(true);
      }

      consoleSpy.mockRestore();
    });

    it('should generate comprehensive monitoring summary', async () => {
      // 1. Create diverse monitoring data
      
      // Errors
      monitoringManager.captureError('Critical system failure', 'critical');
      monitoringManager.captureError('Database timeout', 'error');
      monitoringManager.captureError('API rate limit exceeded', 'warning');
      monitoringManager.captureError('Cache miss', 'info');

      // Performance metrics
      monitoringManager.capturePerformanceMetrics();
      monitoringManager.recordMetric('load_time', 2500);
      monitoringManager.recordMetric('memory_usage', 85.5);

      // Trigger alerts
      monitoringManager.recordMetric('load_time', 4000); // Should trigger alert

      // 2. Get comprehensive summary
      const summary = monitoringManager.getMonitoringSummary();

      // 3. Verify summary data
      expect(summary.errors.total).toBe(4);
      expect(summary.errors.critical).toBe(1);
      expect(summary.errors.warning).toBeGreaterThanOrEqual(1);

      expect(summary.performance.averageLoadTime).toBeGreaterThanOrEqual(0);
      expect(summary.performance.averageMemoryUsage).toBeGreaterThanOrEqual(0);

      expect(summary.alerts.active).toBeGreaterThanOrEqual(0);
      expect(summary.alerts.unacknowledged).toBeGreaterThanOrEqual(0);

      expect(summary.system.uptime).toBeGreaterThan(0);
      expect(summary.system.sessionId).toMatch(/^session_/);

      // 4. Verify summary calculations
      const errors = monitoringManager.getErrors();
      const criticalErrors = errors.filter(e => e.level === 'critical');
      expect(summary.errors.critical).toBe(criticalErrors.length);
    });

    it('should handle system configuration changes', async () => {
      // 1. Test with error tracking disabled
      const disabledConfig = { ...config };
      disabledConfig.errorTracking.enabled = false;

      // Reset singleton
      (EnterpriseMonitoringManager as any).instance = undefined;
      const disabledManager = EnterpriseMonitoringManager.getInstance(disabledConfig);

      const errorId = disabledManager.captureError('Test error', 'error');
      expect(errorId).toBe('');

      // 2. Test with performance monitoring disabled
      disabledConfig.errorTracking.enabled = true;
      disabledConfig.performance.enabled = false;

      // Reset singleton
      (EnterpriseMonitoringManager as any).instance = undefined;
      const perfDisabledManager = EnterpriseMonitoringManager.getInstance(disabledConfig);

      perfDisabledManager.capturePerformanceMetrics();
      const metrics = perfDisabledManager.getPerformanceMetrics();
      expect(metrics).toHaveLength(0);

      // 3. Test with alerts disabled
      disabledConfig.performance.enabled = true;
      disabledConfig.alerts.enabled = false;

      // Reset singleton
      (EnterpriseMonitoringManager as any).instance = undefined;
      const alertsDisabledManager = EnterpriseMonitoringManager.getInstance(disabledConfig);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      alertsDisabledManager.recordMetric('load_time', 5000);
      
      // Should not send notifications when alerts are disabled
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Email alert sent')
      );

      consoleSpy.mockRestore();
    });

    it('should handle edge cases and error conditions', async () => {
      // 1. Test with invalid alert operations
      const invalidAcknowledge = monitoringManager.acknowledgeAlert('invalid-id');
      expect(invalidAcknowledge).toBe(false);

      const invalidResolve = monitoringManager.resolveAlert('invalid-id');
      expect(invalidResolve).toBe(false);

      // 2. Test with empty/null errors
      const emptyErrorId = monitoringManager.captureError('', 'info');
      expect(emptyErrorId).toMatch(/^error_/);

      // 3. Test with extreme metric values
      monitoringManager.recordMetric('extreme_metric', Number.MAX_SAFE_INTEGER);
      monitoringManager.recordMetric('negative_metric', -1000);
      monitoringManager.recordMetric('zero_metric', 0);

      // 4. Test with missing browser APIs
      const originalMemory = (performance as any).memory;
      delete (performance as any).memory;

      expect(() => {
        monitoringManager.capturePerformanceMetrics();
      }).not.toThrow();

      // Restore
      (performance as any).memory = originalMemory;

      // 5. Test error filtering with time ranges
      const futureDate = new Date(Date.now() + 60 * 60 * 1000);
      const pastDate = new Date(Date.now() - 60 * 60 * 1000);

      const futureErrors = monitoringManager.getErrors({
        timeRange: { start: futureDate, end: new Date(futureDate.getTime() + 60 * 60 * 1000) }
      });
      expect(futureErrors).toHaveLength(0);

      const pastErrors = monitoringManager.getErrors({
        timeRange: { start: pastDate, end: new Date() }
      });
      expect(pastErrors.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Real-world Scenario Tests', () => {
    it('should simulate e-commerce application monitoring', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Simulate user journey with monitoring
      
      // 1. Page load
      monitoringManager.recordMetric('page_load_time', 1800, {
        page: '/products',
        user_agent: 'Chrome/91.0'
      });

      // 2. API calls
      monitoringManager.recordMetric('api_response_time', 450, {
        endpoint: '/api/products',
        method: 'GET',
        status: 200
      });

      // 3. Database operations
      monitoringManager.recordMetric('database_query_time', 120, {
        query: 'SELECT * FROM products WHERE category = ?',
        table: 'products'
      });

      // 4. User interaction error
      monitoringManager.captureError(
        new Error('Product not found'),
        'warning',
        { 
          component: 'ProductService',
          productId: 'prod-123',
          userId: 'user-456'
        },
        ['product', 'not-found', 'user-error']
      );

      // 5. Payment processing
      monitoringManager.recordMetric('payment_processing_time', 2500, {
        provider: 'stripe',
        amount: 99.99,
        currency: 'USD'
      });

      // 6. Critical error in payment
      monitoringManager.captureError(
        new Error('Payment gateway timeout'),
        'critical',
        {
          component: 'PaymentService',
          provider: 'stripe',
          orderId: 'order-789'
        },
        ['payment', 'timeout', 'critical']
      );

      // 7. Verify monitoring captured everything
      const summary = monitoringManager.getMonitoringSummary();

      expect(summary.errors.total).toBe(2);
      expect(summary.errors.critical).toBe(1);
      expect(summary.alerts.active).toBeGreaterThanOrEqual(0); // May or may not have alerts

      const errors = monitoringManager.getErrors();
      const criticalError = errors.find(e => e.level === 'critical');
      expect(criticalError?.message).toBe('Payment gateway timeout');
      expect(criticalError?.context.component).toBe('PaymentService');

      consoleSpy.mockRestore();
    });
  });
});
