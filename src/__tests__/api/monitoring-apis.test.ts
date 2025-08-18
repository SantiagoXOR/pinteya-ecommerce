// ===================================
// PINTEYA E-COMMERCE - MONITORING APIS TESTS
// ===================================

import { NextRequest } from 'next/server';
import { GET as getConfig, PUT as putConfig } from '@/app/api/admin/monitoring/config/route';
import { GET as getHealth, POST as postHealth } from '@/app/api/admin/monitoring/health/route';
import { GET as getReports } from '@/app/api/admin/monitoring/reports/route';
import { GET as getCustomMetrics, POST as postCustomMetrics } from '@/app/api/admin/monitoring/metrics/custom/route';

// Mock dependencies
jest.mock('@/lib/auth/admin-auth', () => ({
  getAuthenticatedAdmin: jest.fn(() => ({
    isAdmin: true,
    userId: 'admin-user-123'
  }))
}));

jest.mock('@/lib/supabase', () => ({
  getSupabaseClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({ data: null, error: null })),
          order: jest.fn(() => ({
            limit: jest.fn(() => ({ data: [], error: null }))
          }))
        })),
        gte: jest.fn(() => ({
          lte: jest.fn(() => ({
            order: jest.fn(() => ({ data: [], error: null }))
          }))
        })),
        insert: jest.fn(() => ({ error: null })),
        update: jest.fn(() => ({ error: null })),
        delete: jest.fn(() => ({ error: null }))
      }))
    }))
  }))
}));

jest.mock('@/lib/monitoring/enterprise-metrics', () => ({
  enterpriseMetrics: {
    recordMetric: jest.fn()
  },
  MetricType: {
    GAUGE: 'gauge',
    COUNTER: 'counter'
  },
  BusinessMetricCategory: {
    BUSINESS: 'business',
    PERFORMANCE: 'performance'
  }
}));

jest.mock('@/lib/mercadopago/circuit-breaker', () => ({
  mercadoPagoCriticalBreaker: {
    getMetrics: jest.fn(() => ({ state: 'closed', failures: 0 })),
    getState: jest.fn(() => 'closed'),
    reset: jest.fn()
  },
  mercadoPagoStandardBreaker: {
    getMetrics: jest.fn(() => ({ state: 'closed', failures: 0 })),
    getState: jest.fn(() => 'closed'),
    reset: jest.fn()
  },
  webhookProcessingBreaker: {
    getMetrics: jest.fn(() => ({ state: 'closed', failures: 0 })),
    getState: jest.fn(() => 'closed'),
    reset: jest.fn()
  }
}));

jest.mock('@/lib/cache-manager', () => ({
  CacheUtils: {
    set: jest.fn(),
    get: jest.fn(() => ({ test: true, timestamp: Date.now() }))
  }
}));

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

// Helper para crear requests
function createRequest(url: string, options: any = {}) {
  return new NextRequest(url, {
    method: options.method || 'GET',
    body: options.body ? JSON.stringify(options.body) : undefined,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
}

describe('Monitoring APIs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Configuration API', () => {
    test('GET /api/admin/monitoring/config debe retornar configuración', async () => {
      const request = createRequest('http://localhost:3000/api/admin/monitoring/config');
      const response = await getConfig(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.config).toBeDefined();
      expect(data.data.config.metrics).toBeDefined();
      expect(data.data.config.alerts).toBeDefined();
      expect(data.data.config.circuitBreakers).toBeDefined();
      expect(data.data.config.dashboard).toBeDefined();
      expect(data.data.config.compliance).toBeDefined();
    });

    test('PUT /api/admin/monitoring/config debe actualizar configuración de métricas', async () => {
      const request = createRequest('http://localhost:3000/api/admin/monitoring/config', {
        method: 'PUT',
        body: {
          section: 'metrics',
          config: {
            enabled: true,
            flushInterval: 60000,
            retentionDays: 60
          }
        }
      });

      const response = await putConfig(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.section).toBe('metrics');
      expect(data.data.updated).toBeDefined();
    });

    test('PUT /api/admin/monitoring/config debe actualizar configuración de alertas', async () => {
      const request = createRequest('http://localhost:3000/api/admin/monitoring/config', {
        method: 'PUT',
        body: {
          section: 'alerts',
          config: {
            enabled: true,
            escalationEnabled: true,
            defaultCooldown: 10
          }
        }
      });

      const response = await putConfig(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.section).toBe('alerts');
    });

    test('PUT /api/admin/monitoring/config debe resetear circuit breakers', async () => {
      const request = createRequest('http://localhost:3000/api/admin/monitoring/config', {
        method: 'PUT',
        body: {
          section: 'circuitBreakers',
          config: {
            enabled: true,
            reset: ['mercadopago_critical', 'mercadopago_standard']
          }
        }
      });

      const response = await putConfig(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.updated.mercadopago_critical_reset).toBe(true);
      expect(data.data.updated.mercadopago_standard_reset).toBe(true);
    });

    test('PUT /api/admin/monitoring/config debe rechazar sección inválida', async () => {
      const request = createRequest('http://localhost:3000/api/admin/monitoring/config', {
        method: 'PUT',
        body: {
          section: 'invalid_section',
          config: {}
        }
      });

      const response = await putConfig(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Sección de configuración no válida');
    });
  });

  describe('Health Checks API', () => {
    test('GET /api/admin/monitoring/health debe retornar estado de salud', async () => {
      const request = createRequest('http://localhost:3000/api/admin/monitoring/health');
      const response = await getHealth(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.overall).toBeDefined();
      expect(data.data.services).toBeInstanceOf(Array);
      expect(data.data.summary).toBeDefined();
      expect(data.data.uptime).toBeGreaterThan(0);
    });

    test('GET /api/admin/monitoring/health con filtro de servicios', async () => {
      const request = createRequest('http://localhost:3000/api/admin/monitoring/health?services=database,cache');
      const response = await getHealth(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.services.length).toBeGreaterThan(0);
    });

    test('POST /api/admin/monitoring/health debe ejecutar check específico', async () => {
      const request = createRequest('http://localhost:3000/api/admin/monitoring/health', {
        method: 'POST',
        body: {
          action: 'check',
          service: 'database'
        }
      });

      const response = await postHealth(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.service).toBe('database');
    });

    test('POST /api/admin/monitoring/health debe ejecutar recuperación', async () => {
      const request = createRequest('http://localhost:3000/api/admin/monitoring/health', {
        method: 'POST',
        body: {
          action: 'recover',
          service: 'circuit_breakers'
        }
      });

      const response = await postHealth(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.success).toBe(true);
    });

    test('POST /api/admin/monitoring/health debe rechazar acción inválida', async () => {
      const request = createRequest('http://localhost:3000/api/admin/monitoring/health', {
        method: 'POST',
        body: {
          action: 'invalid_action'
        }
      });

      const response = await postHealth(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  describe('Reports API', () => {
    test('GET /api/admin/monitoring/reports debe generar reporte de performance', async () => {
      const request = createRequest('http://localhost:3000/api/admin/monitoring/reports?type=performance');
      const response = await getReports(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.reportType).toBe('performance');
      expect(data.data.report.metrics).toBeDefined();
      expect(data.data.report.trends).toBeInstanceOf(Array);
    });

    test('GET /api/admin/monitoring/reports debe generar reporte de seguridad', async () => {
      const request = createRequest('http://localhost:3000/api/admin/monitoring/reports?type=security');
      const response = await getReports(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.reportType).toBe('security');
      expect(data.data.report.summary).toBeDefined();
      expect(data.data.report.eventsByCategory).toBeDefined();
    });

    test('GET /api/admin/monitoring/reports debe generar reporte de negocio', async () => {
      const request = createRequest('http://localhost:3000/api/admin/monitoring/reports?type=business');
      const response = await getReports(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.reportType).toBe('business');
      expect(data.data.report.metrics).toBeDefined();
      expect(data.data.report.paymentMethods).toBeDefined();
    });

    test('GET /api/admin/monitoring/reports debe generar reporte de compliance', async () => {
      const request = createRequest('http://localhost:3000/api/admin/monitoring/reports?type=compliance');
      const response = await getReports(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.reportType).toBe('compliance');
      expect(data.data.report.standards).toBeDefined();
      expect(data.data.report.auditTrail).toBeDefined();
    });

    test('GET /api/admin/monitoring/reports debe generar reporte resumen', async () => {
      const request = createRequest('http://localhost:3000/api/admin/monitoring/reports?type=summary');
      const response = await getReports(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.reportType).toBe('summary');
      expect(data.data.report.overview).toBeDefined();
      expect(data.data.report.keyMetrics).toBeDefined();
    });

    test('GET /api/admin/monitoring/reports debe rechazar tipo inválido', async () => {
      const request = createRequest('http://localhost:3000/api/admin/monitoring/reports?type=invalid');
      const response = await getReports(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Tipo de reporte no válido');
    });
  });

  describe('Custom Metrics API', () => {
    test('GET /api/admin/monitoring/metrics/custom debe listar definiciones', async () => {
      const request = createRequest('http://localhost:3000/api/admin/monitoring/metrics/custom?action=list');
      const response = await getCustomMetrics(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.definitions).toBeInstanceOf(Array);
      expect(data.data.count).toBeDefined();
    });

    test('GET /api/admin/monitoring/metrics/custom debe obtener estadísticas', async () => {
      const request = createRequest('http://localhost:3000/api/admin/monitoring/metrics/custom?action=stats');
      const response = await getCustomMetrics(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.totalDefinitions).toBeDefined();
      expect(data.data.totalValues).toBeDefined();
      expect(data.data.recentValues).toBeDefined();
    });

    test('POST /api/admin/monitoring/metrics/custom debe crear definición', async () => {
      const request = createRequest('http://localhost:3000/api/admin/monitoring/metrics/custom', {
        method: 'POST',
        body: {
          action: 'create_definition',
          data: {
            name: 'Test Metric',
            description: 'Test metric description',
            type: 'gauge',
            category: 'business',
            unit: 'count'
          }
        }
      });

      const response = await postCustomMetrics(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.metricId).toBeDefined();
      expect(data.data.name).toBe('Test Metric');
    });

    test('POST /api/admin/monitoring/metrics/custom debe registrar valor', async () => {
      const request = createRequest('http://localhost:3000/api/admin/monitoring/metrics/custom', {
        method: 'POST',
        body: {
          action: 'record_value',
          data: {
            metricId: 'custom.test_metric',
            value: 100
          }
        }
      });

      const response = await postCustomMetrics(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.metricId).toBe('custom.test_metric');
      expect(data.data.value).toBe(100);
    });

    test('POST /api/admin/monitoring/metrics/custom debe registrar batch de valores', async () => {
      const request = createRequest('http://localhost:3000/api/admin/monitoring/metrics/custom', {
        method: 'POST',
        body: {
          action: 'record_batch',
          data: {
            values: [
              { metricId: 'custom.metric1', value: 100 },
              { metricId: 'custom.metric2', value: 200 }
            ]
          }
        }
      });

      const response = await postCustomMetrics(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.totalValues).toBe(2);
      expect(data.data.results).toBeInstanceOf(Array);
    });

    test('POST /api/admin/monitoring/metrics/custom debe rechazar acción inválida', async () => {
      const request = createRequest('http://localhost:3000/api/admin/monitoring/metrics/custom', {
        method: 'POST',
        body: {
          action: 'invalid_action',
          data: {}
        }
      });

      const response = await postCustomMetrics(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Acción no válida');
    });
  });

  describe('Error Handling', () => {
    test('APIs deben manejar errores de autenticación', async () => {
      // Mock auth failure
      const { getAuthenticatedAdmin } = require('@/lib/auth/admin-auth');
      getAuthenticatedAdmin.mockReturnValueOnce({
        isAdmin: false,
        userId: null
      });

      const request = createRequest('http://localhost:3000/api/admin/monitoring/config');
      const response = await getConfig(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Acceso no autorizado');
    });

    test('APIs deben manejar errores de base de datos', async () => {
      // Mock database error
      const { getSupabaseClient } = require('@/lib/supabase');
      getSupabaseClient.mockReturnValueOnce(null);

      const request = createRequest('http://localhost:3000/api/admin/monitoring/reports?type=performance');
      const response = await getReports(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Error interno del servidor');
    });
  });
});
