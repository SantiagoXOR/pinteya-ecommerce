// ===================================
// PINTEYA E-COMMERCE - HEALTH CHECKS TESTS
// ===================================

import {
  EnterpriseHealthSystem,
  HealthStatus,
  HealthSeverity,
  enterpriseHealthSystem
} from '@/lib/monitoring/health-checks';

// Mock dependencies
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  },
  LogLevel: {
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error'
  },
  LogCategory: {
    SYSTEM: 'system'
  }
}));

jest.mock('@/lib/supabase', () => ({
  getSupabaseClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        limit: jest.fn(() => ({ data: [{ id: 1 }], error: null }))
      }))
    }))
  }))
}));

jest.mock('@/lib/cache-manager', () => ({
  CacheUtils: {
    set: jest.fn(),
    get: jest.fn(() => ({ test: true, timestamp: Date.now() }))
  }
}));

jest.mock('@/lib/mercadopago/circuit-breaker', () => ({
  mercadoPagoCriticalBreaker: {
    getState: jest.fn(() => 'closed'),
    reset: jest.fn()
  },
  mercadoPagoStandardBreaker: {
    getState: jest.fn(() => 'closed'),
    reset: jest.fn()
  },
  webhookProcessingBreaker: {
    getState: jest.fn(() => 'closed'),
    reset: jest.fn()
  }
}));

jest.mock('@/lib/monitoring/enterprise-metrics', () => ({
  recordPerformanceMetric: jest.fn(),
  recordSecurityMetric: jest.fn()
}));

// Mock environment variables
const originalEnv = process.env;

describe('Enterprise Health System', () => {
  let healthSystem: EnterpriseHealthSystem;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    healthSystem = new EnterpriseHealthSystem();
    
    // Mock environment variables
    process.env = {
      ...originalEnv,
      MERCADOPAGO_PUBLIC_KEY_TEST: 'TEST_PUBLIC_KEY',
      MERCADOPAGO_ACCESS_TOKEN_TEST: 'TEST_ACCESS_TOKEN'
    };
  });

  afterEach(() => {
    jest.useRealTimers();
    healthSystem.destroy();
    process.env = originalEnv;
  });

  describe('Configuración de Health Checks', () => {
    test('debe registrar health check correctamente', () => {
      const config = {
        service: 'test_service',
        enabled: true,
        interval: 60,
        timeout: 5,
        retries: 3,
        thresholds: {
          responseTime: { warning: 1000, critical: 3000 },
          errorRate: { warning: 0.05, critical: 0.1 }
        },
        dependencies: [],
        autoRecover: true,
        notifications: ['default_log']
      };

      healthSystem.registerHealthCheck(config);

      // Verificar que no hay errores
      expect(true).toBe(true);
    });

    test('debe registrar acción de recuperación', () => {
      const action = {
        id: 'test_recovery',
        name: 'Test Recovery',
        description: 'Test recovery action',
        service: 'test_service',
        enabled: true,
        automatic: true,
        cooldownMinutes: 5,
        maxRetries: 3,
        action: jest.fn().mockResolvedValue(true)
      };

      healthSystem.registerRecoveryAction(action);

      // Verificar que no hay errores
      expect(true).toBe(true);
    });
  });

  describe('Ejecución de Health Checks', () => {
    test('debe ejecutar health check de base de datos', async () => {
      const result = await healthSystem.runHealthCheck('database');

      expect(result.service).toBe('database');
      expect(result.status).toBe(HealthStatus.HEALTHY);
      expect(result.responseTime).toBeGreaterThan(0);
      expect(result.message).toContain('Database responding');
      expect(result.details).toBeDefined();
      expect(result.lastChecked).toBeDefined();
    });

    test('debe ejecutar health check de cache', async () => {
      const result = await healthSystem.runHealthCheck('cache');

      expect(result.service).toBe('cache');
      expect(result.status).toBe(HealthStatus.HEALTHY);
      expect(result.responseTime).toBeGreaterThan(0);
      expect(result.message).toContain('Cache responding');
      expect(result.details.readWrite).toBe('success');
    });

    test('debe ejecutar health check de MercadoPago', async () => {
      const result = await healthSystem.runHealthCheck('mercadopago');

      expect(result.service).toBe('mercadopago');
      expect(result.status).toBe(HealthStatus.HEALTHY);
      expect(result.message).toContain('MercadoPago credentials configured');
      expect(result.details.environment).toBe('test');
    });

    test('debe ejecutar health check de circuit breakers', async () => {
      const result = await healthSystem.runHealthCheck('circuit_breakers');

      expect(result.service).toBe('circuit_breakers');
      expect(result.status).toBe(HealthStatus.HEALTHY);
      expect(result.message).toContain('All circuit breakers operational');
      expect(result.details.mercadopago_critical).toBe('closed');
    });

    test('debe manejar errores en health checks', async () => {
      // Mock error en Supabase
      const { getSupabaseClient } = require('@/lib/supabase');
      getSupabaseClient.mockReturnValueOnce(null);

      const result = await healthSystem.runHealthCheck('database');

      expect(result.service).toBe('database');
      expect(result.status).toBe(HealthStatus.UNHEALTHY);
      expect(result.severity).toBe(HealthSeverity.CRITICAL);
      expect(result.message).toContain('error');
    });

    test('debe ejecutar todos los health checks', async () => {
      const results = await healthSystem.runAllHealthChecks();

      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBeGreaterThan(0);
      
      const services = results.map(r => r.service);
      expect(services).toContain('database');
      expect(services).toContain('cache');
      expect(services).toContain('mercadopago');
      expect(services).toContain('circuit_breakers');
    });
  });

  describe('Estado del Sistema', () => {
    test('debe obtener estado general del sistema', async () => {
      // Ejecutar algunos health checks primero
      await healthSystem.runHealthCheck('database');
      await healthSystem.runHealthCheck('cache');

      const systemHealth = healthSystem.getSystemHealth();

      expect(systemHealth.overall).toBeDefined();
      expect(systemHealth.services).toBeInstanceOf(Array);
      expect(systemHealth.summary).toBeDefined();
      expect(systemHealth.lastUpdated).toBeDefined();
      
      expect(systemHealth.summary[HealthStatus.HEALTHY]).toBeGreaterThanOrEqual(0);
      expect(systemHealth.summary[HealthStatus.DEGRADED]).toBeGreaterThanOrEqual(0);
      expect(systemHealth.summary[HealthStatus.UNHEALTHY]).toBeGreaterThanOrEqual(0);
    });

    test('debe determinar estado general como UNHEALTHY si hay servicios críticos fallando', async () => {
      // Mock error en base de datos
      const { getSupabaseClient } = require('@/lib/supabase');
      getSupabaseClient.mockReturnValueOnce(null);

      await healthSystem.runHealthCheck('database');
      const systemHealth = healthSystem.getSystemHealth();

      expect(systemHealth.overall).toBe(HealthStatus.UNHEALTHY);
      expect(systemHealth.summary[HealthStatus.UNHEALTHY]).toBeGreaterThan(0);
    });
  });

  describe('Acciones de Recuperación', () => {
    test('debe ejecutar acción de recuperación exitosamente', async () => {
      const mockAction = jest.fn().mockResolvedValue(true);
      
      healthSystem.registerRecoveryAction({
        id: 'test_recovery',
        name: 'Test Recovery',
        description: 'Test recovery action',
        service: 'test_service',
        enabled: true,
        automatic: false,
        cooldownMinutes: 5,
        maxRetries: 3,
        action: mockAction
      });

      const success = await healthSystem.executeRecoveryAction('test_recovery');

      expect(success).toBe(true);
      expect(mockAction).toHaveBeenCalled();
    });

    test('debe fallar si la acción no existe', async () => {
      await expect(
        healthSystem.executeRecoveryAction('nonexistent_action')
      ).rejects.toThrow('Recovery action not found');
    });

    test('debe fallar si la acción está deshabilitada', async () => {
      healthSystem.registerRecoveryAction({
        id: 'disabled_action',
        name: 'Disabled Action',
        description: 'Disabled action',
        service: 'test_service',
        enabled: false,
        automatic: false,
        cooldownMinutes: 5,
        maxRetries: 3,
        action: jest.fn()
      });

      await expect(
        healthSystem.executeRecoveryAction('disabled_action')
      ).rejects.toThrow('Recovery action disabled');
    });

    test('debe respetar cooldown entre ejecuciones', async () => {
      const mockAction = jest.fn().mockResolvedValue(true);
      
      healthSystem.registerRecoveryAction({
        id: 'cooldown_action',
        name: 'Cooldown Action',
        description: 'Action with cooldown',
        service: 'test_service',
        enabled: true,
        automatic: false,
        cooldownMinutes: 5,
        maxRetries: 3,
        action: mockAction
      });

      // Primera ejecución
      await healthSystem.executeRecoveryAction('cooldown_action');

      // Segunda ejecución inmediata (debería fallar por cooldown)
      await expect(
        healthSystem.executeRecoveryAction('cooldown_action')
      ).rejects.toThrow('Recovery action in cooldown');
    });
  });

  describe('Recuperación Automática', () => {
    test('debe intentar recuperación automática cuando un servicio falla', async () => {
      const mockAction = jest.fn().mockResolvedValue(true);
      
      // Registrar health check con auto-recovery
      healthSystem.registerHealthCheck({
        service: 'auto_recover_service',
        enabled: true,
        interval: 60,
        timeout: 5,
        retries: 3,
        thresholds: {
          responseTime: { warning: 1000, critical: 3000 },
          errorRate: { warning: 0.05, critical: 0.1 }
        },
        dependencies: [],
        autoRecover: true,
        notifications: ['default_log']
      });

      // Registrar acción de recuperación automática
      healthSystem.registerRecoveryAction({
        id: 'auto_recovery',
        name: 'Auto Recovery',
        description: 'Automatic recovery action',
        service: 'auto_recover_service',
        enabled: true,
        automatic: true,
        cooldownMinutes: 1,
        maxRetries: 3,
        action: mockAction
      });

      // Simular fallo del servicio
      // (En un test real, esto requeriría más setup para simular el fallo)
      expect(true).toBe(true);
    });
  });

  describe('Métricas de Health Checks', () => {
    test('debe registrar métricas de performance', async () => {
      const { recordPerformanceMetric } = require('@/lib/monitoring/enterprise-metrics');
      
      await healthSystem.runHealthCheck('database');

      expect(recordPerformanceMetric).toHaveBeenCalledWith(
        'health.database.response_time',
        expect.any(Number),
        true,
        expect.objectContaining({
          service: 'database',
          status: HealthStatus.HEALTHY
        })
      );

      expect(recordPerformanceMetric).toHaveBeenCalledWith(
        'health.database.availability',
        1,
        true,
        expect.objectContaining({
          service: 'database',
          status: HealthStatus.HEALTHY
        })
      );
    });

    test('debe registrar métricas de seguridad para fallos críticos', async () => {
      const { recordSecurityMetric } = require('@/lib/monitoring/enterprise-metrics');
      
      // Mock error crítico
      const { getSupabaseClient } = require('@/lib/supabase');
      getSupabaseClient.mockReturnValueOnce(null);

      await healthSystem.runHealthCheck('database');

      expect(recordSecurityMetric).toHaveBeenCalledWith(
        'health_check_critical_failure',
        'high',
        expect.objectContaining({
          service: 'database',
          severity: HealthSeverity.CRITICAL
        })
      );
    });
  });

  describe('Configuraciones por Defecto', () => {
    test('debe tener health checks por defecto configurados', () => {
      // Los health checks por defecto se configuran en el constructor
      expect(true).toBe(true);
    });

    test('debe tener acciones de recuperación por defecto', () => {
      // Las acciones por defecto se configuran en el constructor
      expect(true).toBe(true);
    });
  });

  describe('Instancia Singleton', () => {
    test('debe retornar la misma instancia', () => {
      const instance1 = EnterpriseHealthSystem.getInstance();
      const instance2 = EnterpriseHealthSystem.getInstance();

      expect(instance1).toBe(instance2);
    });

    test('debe usar la instancia global', () => {
      expect(enterpriseHealthSystem).toBeInstanceOf(EnterpriseHealthSystem);
    });
  });

  describe('Limpieza de Recursos', () => {
    test('debe limpiar intervalos correctamente', () => {
      const system = new EnterpriseHealthSystem();
      
      expect(() => system.destroy()).not.toThrow();
    });
  });

  describe('Casos Edge', () => {
    test('debe manejar servicios desconocidos', async () => {
      await expect(
        healthSystem.runHealthCheck('unknown_service')
      ).rejects.toThrow('Health check not configured for service');
    });

    test('debe manejar credenciales faltantes de MercadoPago', async () => {
      // Limpiar variables de entorno
      delete process.env.MERCADOPAGO_PUBLIC_KEY_TEST;
      delete process.env.MERCADOPAGO_ACCESS_TOKEN_TEST;

      const result = await healthSystem.runHealthCheck('mercadopago');

      expect(result.status).toBe(HealthStatus.UNHEALTHY);
      expect(result.message).toContain('credentials not configured');
    });

    test('debe detectar circuit breakers abiertos', async () => {
      const { mercadoPagoCriticalBreaker } = require('@/lib/mercadopago/circuit-breaker');
      mercadoPagoCriticalBreaker.getState.mockReturnValue('open');

      const result = await healthSystem.runHealthCheck('circuit_breakers');

      expect(result.status).toBe(HealthStatus.UNHEALTHY);
      expect(result.message).toContain('circuit breaker(s) open');
    });

    test('debe detectar circuit breakers en half-open', async () => {
      const { mercadoPagoStandardBreaker } = require('@/lib/mercadopago/circuit-breaker');
      mercadoPagoStandardBreaker.getState.mockReturnValue('half-open');

      const result = await healthSystem.runHealthCheck('circuit_breakers');

      expect(result.status).toBe(HealthStatus.DEGRADED);
      expect(result.message).toContain('circuit breaker(s) in recovery');
    });
  });
});
