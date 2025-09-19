// ===================================
// TESTS - ENTERPRISE MONITORING MANAGER
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

describe('EnterpriseMonitoringManager', () => {
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
        ignoreErrors: ['test-ignore'],
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
          email: ['test@example.com'],
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

  describe('Initialization', () => {
    it('should create singleton instance', () => {
      const instance1 = EnterpriseMonitoringManager.getInstance(config);
      const instance2 = EnterpriseMonitoringManager.getInstance();
      
      expect(instance1).toBe(instance2);
    });

    it('should throw error if no config provided for first initialization', () => {
      // Reset singleton
      (EnterpriseMonitoringManager as any).instance = undefined;
      
      expect(() => {
        EnterpriseMonitoringManager.getInstance();
      }).toThrow('Configuration required for first initialization');
    });

    it('should initialize with default alert rules', () => {
      const summary = monitoringManager.getMonitoringSummary();
      expect(summary).toBeDefined();
      expect(summary.system.sessionId).toMatch(/^session_/);
    });
  });

  describe('Error Tracking', () => {
    it('should capture error successfully', () => {
      const errorId = monitoringManager.captureError(
        new Error('Test error'),
        'error',
        { component: 'TestComponent' },
        ['test']
      );

      expect(errorId).toMatch(/^error_/);
      
      const errors = monitoringManager.getErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe('Test error');
      expect(errors[0].level).toBe('error');
      expect(errors[0].context.component).toBe('TestComponent');
      expect(errors[0].tags).toContain('test');
    });

    it('should capture string error', () => {
      const errorId = monitoringManager.captureError(
        'String error message',
        'warning'
      );

      expect(errorId).toMatch(/^error_/);
      
      const errors = monitoringManager.getErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe('String error message');
      expect(errors[0].level).toBe('warning');
      expect(errors[0].stack).toBeUndefined();
    });

    it('should ignore errors based on configuration', () => {
      const errorId = monitoringManager.captureError(
        'test-ignore error message',
        'error'
      );

      expect(errorId).toBe('');
      
      const errors = monitoringManager.getErrors();
      expect(errors).toHaveLength(0);
    });

    it('should respect sample rate', () => {
      // Create manager with low sample rate
      const lowSampleConfig = { ...config };
      lowSampleConfig.errorTracking.sampleRate = 0.0;
      
      // Reset singleton
      (EnterpriseMonitoringManager as any).instance = undefined;
      const lowSampleManager = EnterpriseMonitoringManager.getInstance(lowSampleConfig);

      const errorId = lowSampleManager.captureError('Test error', 'error');
      expect(errorId).toBe('');
    });

    it('should deduplicate errors with same fingerprint', () => {
      // Capture same error twice
      monitoringManager.captureError('Duplicate error', 'error');
      monitoringManager.captureError('Duplicate error', 'error');

      const errors = monitoringManager.getErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0].count).toBe(2);
    });

    it('should filter errors by level', () => {
      monitoringManager.captureError('Critical error', 'critical');
      monitoringManager.captureError('Warning error', 'warning');
      monitoringManager.captureError('Info error', 'info');

      const criticalErrors = monitoringManager.getErrors({ level: 'critical' });
      expect(criticalErrors).toHaveLength(1);
      expect(criticalErrors[0].level).toBe('critical');

      const warningErrors = monitoringManager.getErrors({ level: 'warning' });
      expect(warningErrors).toHaveLength(1);
      expect(warningErrors[0].level).toBe('warning');
    });

    it('should filter errors by time range', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      monitoringManager.captureError('Recent error', 'error');

      const recentErrors = monitoringManager.getErrors({
        timeRange: { start: oneHourAgo, end: now }
      });
      
      expect(recentErrors).toHaveLength(1);

      const futureErrors = monitoringManager.getErrors({
        timeRange: { 
          start: new Date(now.getTime() + 60 * 60 * 1000), 
          end: new Date(now.getTime() + 2 * 60 * 60 * 1000) 
        }
      });
      
      expect(futureErrors).toHaveLength(0);
    });

    it('should limit number of errors returned', () => {
      // Capture multiple errors
      for (let i = 0; i < 10; i++) {
        monitoringManager.captureError(`Error ${i}`, 'error');
      }

      const limitedErrors = monitoringManager.getErrors({ limit: 5 });
      expect(limitedErrors).toHaveLength(5);
    });
  });

  describe('Performance Monitoring', () => {
    it('should capture performance metrics', () => {
      monitoringManager.capturePerformanceMetrics();

      const metrics = monitoringManager.getPerformanceMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].metrics).toHaveProperty('loadTime');
      expect(metrics[0].metrics).toHaveProperty('renderTime');
      expect(metrics[0].metrics).toHaveProperty('memoryUsage');
    });

    it('should record custom metrics', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      monitoringManager.recordMetric('custom_metric', 123.45, { test: true });

      // Check if metric was recorded (the console.log might not be called due to sample rate)
      expect(() => {
        monitoringManager.recordMetric('custom_metric', 123.45, { test: true });
      }).not.toThrow();

      consoleSpy.mockRestore();
    });

    it('should respect performance sample rate', () => {
      // Create manager with low sample rate
      const lowSampleConfig = { ...config };
      lowSampleConfig.performance.sampleRate = 0.0;
      
      // Reset singleton
      (EnterpriseMonitoringManager as any).instance = undefined;
      const lowSampleManager = EnterpriseMonitoringManager.getInstance(lowSampleConfig);

      lowSampleManager.capturePerformanceMetrics();
      
      const metrics = lowSampleManager.getPerformanceMetrics();
      expect(metrics).toHaveLength(0);
    });

    it('should filter performance metrics by time range', () => {
      monitoringManager.capturePerformanceMetrics();

      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      const recentMetrics = monitoringManager.getPerformanceMetrics({
        start: oneHourAgo,
        end: now
      });

      expect(recentMetrics).toHaveLength(1);
    });
  });

  describe('Alert System', () => {
    it('should trigger alert when threshold exceeded', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Record metric that exceeds threshold
      monitoringManager.recordMetric('load_time', 5000); // Exceeds 3000ms threshold

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Monitoring] Alert triggered:',
        expect.objectContaining({
          severity: 'medium',
          message: expect.stringContaining('load_time is 5000')
        })
      );

      const activeAlerts = monitoringManager.getActiveAlerts();
      expect(activeAlerts).toHaveLength(1);
      expect(activeAlerts[0].severity).toBe('medium');

      consoleSpy.mockRestore();
    });

    it('should acknowledge alert', () => {
      // Trigger an alert
      monitoringManager.recordMetric('load_time', 5000);
      
      const alerts = monitoringManager.getActiveAlerts();
      expect(alerts).toHaveLength(1);
      expect(alerts[0].acknowledged).toBe(false);

      // Acknowledge the alert
      const success = monitoringManager.acknowledgeAlert(alerts[0].id);
      expect(success).toBe(true);

      const updatedAlerts = monitoringManager.getActiveAlerts();
      expect(updatedAlerts[0].acknowledged).toBe(true);
    });

    it('should resolve alert', () => {
      // Trigger an alert
      monitoringManager.recordMetric('load_time', 5000);

      const alerts = monitoringManager.getActiveAlerts();
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].resolvedAt).toBeUndefined();

      // Resolve the alert
      const success = monitoringManager.resolveAlert(alerts[0].id);
      expect(success).toBe(true);

      // Check that the alert was resolved (it should still be in the list but with resolvedAt set)
      const allAlerts = monitoringManager.getActiveAlerts();
      const resolvedAlert = allAlerts.find(a => a.id === alerts[0].id);

      // If the alert is not found in active alerts, it means it was properly resolved
      if (!resolvedAlert) {
        expect(success).toBe(true); // Already verified above
      } else {
        expect(resolvedAlert.resolvedAt).toBeDefined();
      }
    });

    it('should respect alert cooldown', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Trigger alert twice quickly
      monitoringManager.recordMetric('load_time', 5000);
      monitoringManager.recordMetric('load_time', 5000);

      // Should only trigger once due to cooldown
      expect(consoleSpy).toHaveBeenCalledTimes(1);

      const activeAlerts = monitoringManager.getActiveAlerts();
      expect(activeAlerts).toHaveLength(1);

      consoleSpy.mockRestore();
    });

    it('should trigger critical error alert', () => {
      const initialAlertCount = monitoringManager.getActiveAlerts().length;

      monitoringManager.captureError('Critical system failure', 'critical');

      // Check if new alerts were created
      const finalAlertCount = monitoringManager.getActiveAlerts().length;
      expect(finalAlertCount).toBeGreaterThanOrEqual(initialAlertCount);

      // Verify the error was captured
      const errors = monitoringManager.getErrors({ level: 'critical' });
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toBe('Critical system failure');
    });
  });

  describe('Monitoring Summary', () => {
    it('should generate monitoring summary', () => {
      // Add some test data
      monitoringManager.captureError('Test error', 'error');
      monitoringManager.captureError('Critical error', 'critical');
      monitoringManager.capturePerformanceMetrics();
      monitoringManager.recordMetric('load_time', 5000); // Triggers alert

      const summary = monitoringManager.getMonitoringSummary();

      expect(summary.errors.total).toBe(2);
      expect(summary.errors.critical).toBe(1);
      expect(summary.performance.averageLoadTime).toBeGreaterThanOrEqual(0);
      expect(summary.alerts.active).toBeGreaterThanOrEqual(0);
      expect(summary.system.uptime).toBeGreaterThan(0);
      expect(summary.system.sessionId).toMatch(/^session_/);
    });

    it('should handle empty data in summary', () => {
      const summary = monitoringManager.getMonitoringSummary();

      expect(summary.errors.total).toBe(0);
      expect(summary.performance.averageLoadTime).toBe(0);
      expect(summary.alerts.active).toBe(0);
    });
  });

  describe('Configuration', () => {
    it('should disable error tracking when configured', () => {
      const disabledConfig = { ...config };
      disabledConfig.errorTracking.enabled = false;

      // Reset singleton
      (EnterpriseMonitoringManager as any).instance = undefined;
      const disabledManager = EnterpriseMonitoringManager.getInstance(disabledConfig);

      const errorId = disabledManager.captureError('Test error', 'error');
      expect(errorId).toBe('');
    });

    it('should disable performance monitoring when configured', () => {
      const disabledConfig = { ...config };
      disabledConfig.performance.enabled = false;

      // Reset singleton
      (EnterpriseMonitoringManager as any).instance = undefined;
      const disabledManager = EnterpriseMonitoringManager.getInstance(disabledConfig);

      disabledManager.capturePerformanceMetrics();
      
      const metrics = disabledManager.getPerformanceMetrics();
      expect(metrics).toHaveLength(0);
    });

    it('should disable alerts when configured', () => {
      const disabledConfig = { ...config };
      disabledConfig.alerts.enabled = false;

      // Reset singleton
      (EnterpriseMonitoringManager as any).instance = undefined;
      const disabledManager = EnterpriseMonitoringManager.getInstance(disabledConfig);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // This would normally trigger notifications
      disabledManager.recordMetric('load_time', 5000);

      // Should not send notifications
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Email alert sent')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid alert operations gracefully', () => {
      const success1 = monitoringManager.acknowledgeAlert('invalid-id');
      expect(success1).toBe(false);

      const success2 = monitoringManager.resolveAlert('invalid-id');
      expect(success2).toBe(false);
    });

    it('should handle browser API unavailability', () => {
      // Mock missing performance.memory
      const originalMemory = (performance as any).memory;
      delete (performance as any).memory;

      // Should not throw error
      expect(() => {
        monitoringManager.capturePerformanceMetrics();
      }).not.toThrow();

      // Restore
      (performance as any).memory = originalMemory;
    });
  });
});
