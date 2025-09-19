// ===================================
// TESTS - ADVANCED ALERTING ENGINE
// ===================================

import { 
  AdvancedAlertingEngine,
  AlertType,
  AlertSeverity,
  AlertChannel,
  AlertStatus,
  advancedAlertingEngine
} from '@/lib/monitoring/advanced-alerting-engine';

// Mock fetch para webhooks
global.fetch = jest.fn();

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

describe('AdvancedAlertingEngine', () => {
  let alertingEngine: AdvancedAlertingEngine;

  beforeEach(() => {
    alertingEngine = AdvancedAlertingEngine.getInstance();
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  afterEach(() => {
    alertingEngine.destroy();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = AdvancedAlertingEngine.getInstance();
      const instance2 = AdvancedAlertingEngine.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('Channel Configuration', () => {
    it('should configure Slack channel correctly', () => {
      const config = {
        channel: AlertChannel.SLACK,
        enabled: true,
        config: {
          webhookUrl: 'https://hooks.slack.com/test',
          slackChannel: '#alerts'
        },
        filters: {
          severities: [AlertSeverity.HIGH, AlertSeverity.CRITICAL]
        }
      };

      alertingEngine.configureChannel(AlertChannel.SLACK, config);

      expect(require('@/lib/logger').logger.info).toHaveBeenCalledWith(
        'monitoring',
        expect.stringContaining('Alert channel configured'),
        expect.objectContaining({
          channel: AlertChannel.SLACK
        })
      );
    });

    it('should configure email channel correctly', () => {
      const config = {
        channel: AlertChannel.EMAIL,
        enabled: true,
        config: {
          smtpHost: 'smtp.gmail.com',
          smtpPort: 587,
          smtpUser: 'alerts@pinteya.com',
          smtpPassword: 'password',
          recipients: ['admin@pinteya.com']
        },
        filters: {
          severities: [AlertSeverity.CRITICAL]
        }
      };

      alertingEngine.configureChannel(AlertChannel.EMAIL, config);

      expect(require('@/lib/logger').logger.info).toHaveBeenCalled();
    });

    it('should disable channel when enabled is false', () => {
      const config = {
        channel: AlertChannel.SLACK,
        enabled: false,
        config: {},
        filters: {}
      };

      alertingEngine.configureChannel(AlertChannel.SLACK, config);

      expect(require('@/lib/logger').logger.info).toHaveBeenCalledWith(
        'monitoring',
        expect.stringContaining('disabled')
      );
    });
  });

  describe('Alert Creation', () => {
    beforeEach(() => {
      // Configurar canal de prueba
      alertingEngine.configureChannel(AlertChannel.SLACK, {
        channel: AlertChannel.SLACK,
        enabled: true,
        config: {
          webhookUrl: 'https://hooks.slack.com/test',
          slackChannel: '#alerts'
        },
        filters: {
          severities: [AlertSeverity.LOW, AlertSeverity.MEDIUM, AlertSeverity.HIGH, AlertSeverity.CRITICAL]
        }
      });
    });

    it('should create performance alert', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200
      });

      const alertId = await alertingEngine.createAlert(
        AlertType.PERFORMANCE,
        AlertSeverity.HIGH,
        'High response time detected',
        'API response time exceeded 3 seconds',
        {
          endpoint: '/api/products',
          responseTime: 3200,
          threshold: 3000
        }
      );

      expect(alertId).toBeDefined();
      expect(typeof alertId).toBe('string');
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should create error alert', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200
      });

      const alertId = await alertingEngine.createAlert(
        AlertType.ERROR,
        AlertSeverity.CRITICAL,
        'Critical error in payment processing',
        'Payment gateway returned 500 error',
        {
          endpoint: '/api/payments',
          errorCode: 500,
          errorMessage: 'Internal server error'
        }
      );

      expect(alertId).toBeDefined();
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should create security alert', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200
      });

      const alertId = await alertingEngine.createAlert(
        AlertType.SECURITY,
        AlertSeverity.CRITICAL,
        'Suspicious login activity',
        'Multiple failed login attempts from same IP',
        {
          ip: '192.168.1.100',
          attempts: 10,
          timeWindow: '5 minutes'
        }
      );

      expect(alertId).toBeDefined();
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should handle alert creation failure gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const alertId = await alertingEngine.createAlert(
        AlertType.PERFORMANCE,
        AlertSeverity.HIGH,
        'Test alert',
        'Test description',
        {}
      );

      expect(alertId).toBeDefined();
      expect(require('@/lib/logger').logger.error).toHaveBeenCalled();
    });
  });

  describe('Alert Filtering', () => {
    beforeEach(() => {
      // Configurar canal que solo acepta HIGH y CRITICAL
      alertingEngine.configureChannel(AlertChannel.SLACK, {
        channel: AlertChannel.SLACK,
        enabled: true,
        config: {
          webhookUrl: 'https://hooks.slack.com/test',
          slackChannel: '#alerts'
        },
        filters: {
          severities: [AlertSeverity.HIGH, AlertSeverity.CRITICAL]
        }
      });
    });

    it('should send alert when severity matches filter', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200
      });

      await alertingEngine.createAlert(
        AlertType.PERFORMANCE,
        AlertSeverity.HIGH,
        'High severity alert',
        'This should be sent',
        {}
      );

      expect(global.fetch).toHaveBeenCalled();
    });

    it('should not send alert when severity does not match filter', async () => {
      await alertingEngine.createAlert(
        AlertType.PERFORMANCE,
        AlertSeverity.LOW,
        'Low severity alert',
        'This should not be sent',
        {}
      );

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should filter by alert type', () => {
      alertingEngine.configureChannel(AlertChannel.EMAIL, {
        channel: AlertChannel.EMAIL,
        enabled: true,
        config: {
          smtpHost: 'smtp.test.com',
          smtpPort: 587,
          smtpUser: 'test@test.com',
          smtpPassword: 'password',
          recipients: ['admin@test.com']
        },
        filters: {
          types: [AlertType.SECURITY, AlertType.ERROR]
        }
      });

      // Esta configuración debería filtrar solo alertas de seguridad y error
      expect(require('@/lib/logger').logger.info).toHaveBeenCalled();
    });
  });

  describe('Alert Deduplication', () => {
    beforeEach(() => {
      alertingEngine.configureChannel(AlertChannel.SLACK, {
        channel: AlertChannel.SLACK,
        enabled: true,
        config: {
          webhookUrl: 'https://hooks.slack.com/test',
          slackChannel: '#alerts'
        },
        filters: {
          severities: [AlertSeverity.LOW, AlertSeverity.MEDIUM, AlertSeverity.HIGH, AlertSeverity.CRITICAL]
        }
      });
    });

    it('should deduplicate identical alerts', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200
      });

      // Crear la misma alerta dos veces
      const alert1 = await alertingEngine.createAlert(
        AlertType.PERFORMANCE,
        AlertSeverity.HIGH,
        'Duplicate alert test',
        'This is a duplicate alert',
        { endpoint: '/api/test' }
      );

      const alert2 = await alertingEngine.createAlert(
        AlertType.PERFORMANCE,
        AlertSeverity.HIGH,
        'Duplicate alert test',
        'This is a duplicate alert',
        { endpoint: '/api/test' }
      );

      // Solo debería haber enviado una notificación
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(alert1).toBe(alert2); // Deberían ser la misma alerta
    });

    it('should not deduplicate different alerts', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200
      });

      await alertingEngine.createAlert(
        AlertType.PERFORMANCE,
        AlertSeverity.HIGH,
        'First alert',
        'This is the first alert',
        { endpoint: '/api/test1' }
      );

      await alertingEngine.createAlert(
        AlertType.PERFORMANCE,
        AlertSeverity.HIGH,
        'Second alert',
        'This is the second alert',
        { endpoint: '/api/test2' }
      );

      // Deberían ser dos notificaciones diferentes
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Alert Resolution', () => {
    it('should resolve alert successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200
      });

      alertingEngine.configureChannel(AlertChannel.SLACK, {
        channel: AlertChannel.SLACK,
        enabled: true,
        config: {
          webhookUrl: 'https://hooks.slack.com/test',
          slackChannel: '#alerts'
        },
        filters: {
          severities: [AlertSeverity.HIGH]
        }
      });

      const alertId = await alertingEngine.createAlert(
        AlertType.PERFORMANCE,
        AlertSeverity.HIGH,
        'Test alert for resolution',
        'This alert will be resolved',
        {}
      );

      const resolved = await alertingEngine.resolveAlert(alertId, 'Issue fixed');

      expect(resolved).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(2); // Create + resolve
    });

    it('should return false for non-existent alert', async () => {
      const resolved = await alertingEngine.resolveAlert('non-existent-id', 'Test');
      expect(resolved).toBe(false);
    });
  });

  describe('Alert Statistics', () => {
    beforeEach(() => {
      alertingEngine.configureChannel(AlertChannel.SLACK, {
        channel: AlertChannel.SLACK,
        enabled: true,
        config: {
          webhookUrl: 'https://hooks.slack.com/test',
          slackChannel: '#alerts'
        },
        filters: {
          severities: [AlertSeverity.LOW, AlertSeverity.MEDIUM, AlertSeverity.HIGH, AlertSeverity.CRITICAL]
        }
      });
    });

    it('should return correct statistics', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200
      });

      // Crear varias alertas
      await alertingEngine.createAlert(AlertType.PERFORMANCE, AlertSeverity.HIGH, 'Alert 1', 'Description 1', {});
      await alertingEngine.createAlert(AlertType.ERROR, AlertSeverity.CRITICAL, 'Alert 2', 'Description 2', {});
      await alertingEngine.createAlert(AlertType.SECURITY, AlertSeverity.MEDIUM, 'Alert 3', 'Description 3', {});

      const stats = alertingEngine.getAlertStats();

      expect(stats.totalAlerts).toBe(3);
      expect(stats.activeAlerts).toBe(3);
      expect(stats.resolvedAlerts).toBe(0);
      expect(stats.alertsByType[AlertType.PERFORMANCE]).toBe(1);
      expect(stats.alertsByType[AlertType.ERROR]).toBe(1);
      expect(stats.alertsByType[AlertType.SECURITY]).toBe(1);
      expect(stats.alertsBySeverity[AlertSeverity.HIGH]).toBe(1);
      expect(stats.alertsBySeverity[AlertSeverity.CRITICAL]).toBe(1);
      expect(stats.alertsBySeverity[AlertSeverity.MEDIUM]).toBe(1);
    });

    it('should update statistics after resolution', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200
      });

      const alertId = await alertingEngine.createAlert(
        AlertType.PERFORMANCE,
        AlertSeverity.HIGH,
        'Test alert',
        'Test description',
        {}
      );

      await alertingEngine.resolveAlert(alertId, 'Resolved');

      const stats = alertingEngine.getAlertStats();

      expect(stats.totalAlerts).toBe(1);
      expect(stats.activeAlerts).toBe(0);
      expect(stats.resolvedAlerts).toBe(1);
    });
  });

  describe('Rate Limiting', () => {
    beforeEach(() => {
      alertingEngine.configureChannel(AlertChannel.SLACK, {
        channel: AlertChannel.SLACK,
        enabled: true,
        config: {
          webhookUrl: 'https://hooks.slack.com/test',
          slackChannel: '#alerts'
        },
        filters: {
          severities: [AlertSeverity.HIGH]
        },
        rateLimiting: {
          maxAlertsPerMinute: 2,
          maxAlertsPerHour: 10
        }
      });
    });

    it('should respect rate limiting', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200
      });

      // Crear 3 alertas rápidamente (límite es 2 por minuto)
      await alertingEngine.createAlert(AlertType.PERFORMANCE, AlertSeverity.HIGH, 'Alert 1', 'Description 1', {});
      await alertingEngine.createAlert(AlertType.PERFORMANCE, AlertSeverity.HIGH, 'Alert 2', 'Description 2', {});
      await alertingEngine.createAlert(AlertType.PERFORMANCE, AlertSeverity.HIGH, 'Alert 3', 'Description 3', {});

      // Solo deberían haberse enviado 2 notificaciones
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Escalation', () => {
    it('should configure escalation rules', () => {
      const escalationRules = [
        {
          level: 1,
          delay: 300000, // 5 minutos
          channels: [AlertChannel.SLACK]
        },
        {
          level: 2,
          delay: 900000, // 15 minutos
          channels: [AlertChannel.EMAIL]
        },
        {
          level: 3,
          delay: 1800000, // 30 minutos
          channels: [AlertChannel.SMS]
        }
      ];

      alertingEngine.configureEscalation(escalationRules);

      expect(require('@/lib/logger').logger.info).toHaveBeenCalledWith(
        'monitoring',
        'Alert escalation rules configured',
        expect.objectContaining({
          levels: 3
        })
      );
    });
  });

  describe('Multiple Channels', () => {
    it('should send to multiple configured channels', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200
      });

      // Configurar múltiples canales
      alertingEngine.configureChannel(AlertChannel.SLACK, {
        channel: AlertChannel.SLACK,
        enabled: true,
        config: {
          webhookUrl: 'https://hooks.slack.com/test',
          slackChannel: '#alerts'
        },
        filters: {
          severities: [AlertSeverity.HIGH]
        }
      });

      alertingEngine.configureChannel(AlertChannel.WEBHOOK, {
        channel: AlertChannel.WEBHOOK,
        enabled: true,
        config: {
          url: 'https://api.example.com/alerts',
          headers: { 'Authorization': 'Bearer token' }
        },
        filters: {
          severities: [AlertSeverity.HIGH]
        }
      });

      await alertingEngine.createAlert(
        AlertType.PERFORMANCE,
        AlertSeverity.HIGH,
        'Multi-channel alert',
        'This should go to multiple channels',
        {}
      );

      // Debería haber enviado a ambos canales
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle channel configuration errors', () => {
      expect(() => {
        alertingEngine.configureChannel(AlertChannel.SLACK, {
          channel: AlertChannel.SLACK,
          enabled: true,
          config: {}, // Configuración incompleta
          filters: {}
        });
      }).not.toThrow();

      expect(require('@/lib/logger').logger.error).toHaveBeenCalled();
    });

    it('should handle notification failures gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      alertingEngine.configureChannel(AlertChannel.SLACK, {
        channel: AlertChannel.SLACK,
        enabled: true,
        config: {
          webhookUrl: 'https://hooks.slack.com/test',
          slackChannel: '#alerts'
        },
        filters: {
          severities: [AlertSeverity.HIGH]
        }
      });

      const alertId = await alertingEngine.createAlert(
        AlertType.PERFORMANCE,
        AlertSeverity.HIGH,
        'Test alert',
        'Test description',
        {}
      );

      expect(alertId).toBeDefined();
      expect(require('@/lib/logger').logger.error).toHaveBeenCalled();
    });
  });
});

describe('AdvancedAlertingEngine Integration', () => {
  let alertingEngine: AdvancedAlertingEngine;

  beforeEach(() => {
    alertingEngine = AdvancedAlertingEngine.getInstance();
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  afterEach(() => {
    alertingEngine.destroy();
  });

  it('should handle high volume of alerts efficiently', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200
    });

    alertingEngine.configureChannel(AlertChannel.SLACK, {
      channel: AlertChannel.SLACK,
      enabled: true,
      config: {
        webhookUrl: 'https://hooks.slack.com/test',
        slackChannel: '#alerts'
      },
      filters: {
        severities: [AlertSeverity.LOW, AlertSeverity.MEDIUM, AlertSeverity.HIGH, AlertSeverity.CRITICAL]
      }
    });

    const startTime = Date.now();

    // Crear 100 alertas
    const promises = [];
    for (let i = 0; i < 100; i++) {
      promises.push(
        alertingEngine.createAlert(
          AlertType.PERFORMANCE,
          AlertSeverity.MEDIUM,
          `Alert ${i}`,
          `Description ${i}`,
          { index: i }
        )
      );
    }

    await Promise.all(promises);

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Debería procesar 100 alertas en menos de 2 segundos
    expect(duration).toBeLessThan(2000);

    const stats = alertingEngine.getAlertStats();
    expect(stats.totalAlerts).toBe(100);
  });

  it('should maintain performance under concurrent access', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200
    });

    alertingEngine.configureChannel(AlertChannel.SLACK, {
      channel: AlertChannel.SLACK,
      enabled: true,
      config: {
        webhookUrl: 'https://hooks.slack.com/test',
        slackChannel: '#alerts'
      },
      filters: {
        severities: [AlertSeverity.HIGH]
      }
    });

    // Simular acceso concurrente
    const promises = [];
    for (let i = 0; i < 50; i++) {
      promises.push(
        alertingEngine.createAlert(
          AlertType.PERFORMANCE,
          AlertSeverity.HIGH,
          `Concurrent Alert ${i}`,
          `Concurrent Description ${i}`,
          { concurrent: true, index: i }
        )
      );
    }

    const results = await Promise.all(promises);

    // Todas las alertas deberían haberse creado exitosamente
    expect(results.every(id => typeof id === 'string')).toBe(true);

    const stats = alertingEngine.getAlertStats();
    expect(stats.totalAlerts).toBe(50);
  });
});
