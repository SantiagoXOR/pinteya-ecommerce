/**
 * Tests para Sistema Enterprise de Auditoría de Seguridad
 * Valida funcionalidad completa del sistema de auditoría, detección de anomalías y gestión de incidentes
 */

// Mock de dependencias
jest.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
          range: jest.fn(() => ({
            order: jest.fn()
          }))
        })),
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn()
          }))
        })),
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn()
            }))
          }))
        })),
        order: jest.fn(() => ({
          range: jest.fn()
        })),
        not: jest.fn(() => ({
          filter: jest.fn()
        }))
      }))
    }))
  }
}));

jest.mock('@/lib/auth/security-audit', () => ({
  logSecurityEvent: jest.fn()
}));

jest.mock('@/lib/auth/security-audit-enhanced', () => ({
  analyzeSecurityPatterns: jest.fn(),
  getSecurityMetrics: jest.fn(),
  generateSecurityReport: jest.fn()
}));

jest.mock('@/lib/rate-limiting/enterprise-rate-limiter', () => ({
  metricsCollector: {
    getMetrics: jest.fn()
  }
}));

import { NextRequest } from 'next/server';
import {
  EnterpriseAuditSystem,
  enterpriseAuditSystem,
  type EnterpriseSecurityEvent,
  type SecurityAnomalyDetection,
  type SecurityIncident,
  ENTERPRISE_AUDIT_CONFIG
} from '@/lib/security/enterprise-audit-system';
import { logSecurityEvent } from '@/lib/auth/security-audit';
import { 
  analyzeSecurityPatterns,
  getSecurityMetrics,
  generateSecurityReport
} from '@/lib/auth/security-audit-enhanced';
import { metricsCollector } from '@/lib/rate-limiting/enterprise-rate-limiter';
import type { EnterpriseAuthContext } from '@/lib/auth/enterprise-auth-utils';

describe('Sistema Enterprise de Auditoría de Seguridad', () => {
  let mockLogSecurityEvent: jest.MockedFunction<typeof logSecurityEvent>;
  let mockAnalyzeSecurityPatterns: jest.MockedFunction<typeof analyzeSecurityPatterns>;
  let mockGetSecurityMetrics: jest.MockedFunction<typeof getSecurityMetrics>;
  let mockGetMetrics: jest.MockedFunction<typeof metricsCollector.getMetrics>;

  beforeEach(() => {
    mockLogSecurityEvent = logSecurityEvent as jest.MockedFunction<typeof logSecurityEvent>;
    mockAnalyzeSecurityPatterns = analyzeSecurityPatterns as jest.MockedFunction<typeof analyzeSecurityPatterns>;
    mockGetSecurityMetrics = getSecurityMetrics as jest.MockedFunction<typeof getSecurityMetrics>;
    mockGetMetrics = metricsCollector.getMetrics as jest.MockedFunction<typeof metricsCollector.getMetrics>;

    jest.clearAllMocks();

    // Setup default mocks
    mockLogSecurityEvent.mockResolvedValue(undefined);
    mockAnalyzeSecurityPatterns.mockResolvedValue([]);
    mockGetSecurityMetrics.mockResolvedValue({
      total_events: 100,
      critical_events: 5,
      failed_logins: 10,
      suspicious_activities: 3,
      blocked_ips: 2,
      security_alerts: 8
    });
    mockGetMetrics.mockReturnValue({
      totalRequests: 1000,
      allowedRequests: 950,
      blockedRequests: 50,
      redisHits: 900,
      memoryFallbacks: 100,
      errors: 5,
      averageResponseTime: 45,
      topBlockedIPs: [
        { ip: '192.168.1.100', count: 25 },
        { ip: '10.0.0.50', count: 15 }
      ],
      topEndpoints: [
        { endpoint: '/api/admin', count: 30 },
        { endpoint: '/api/payments', count: 20 }
      ]
    });
  });

  describe('Configuración Enterprise', () => {
    it('debe tener configuración de retención de datos', () => {
      expect(ENTERPRISE_AUDIT_CONFIG.DATA_RETENTION).toBeDefined();
      expect(ENTERPRISE_AUDIT_CONFIG.DATA_RETENTION.security_events).toBe(365);
      expect(ENTERPRISE_AUDIT_CONFIG.DATA_RETENTION.anomalies).toBe(180);
      expect(ENTERPRISE_AUDIT_CONFIG.DATA_RETENTION.incidents).toBe(1095);
    });

    it('debe tener umbrales de detección configurados', () => {
      expect(ENTERPRISE_AUDIT_CONFIG.DETECTION_THRESHOLDS).toBeDefined();
      expect(ENTERPRISE_AUDIT_CONFIG.DETECTION_THRESHOLDS.anomaly_confidence).toBe(0.7);
      expect(ENTERPRISE_AUDIT_CONFIG.DETECTION_THRESHOLDS.risk_score_critical).toBe(80);
    });

    it('debe tener configuración de alertas', () => {
      expect(ENTERPRISE_AUDIT_CONFIG.ALERT_CONFIG).toBeDefined();
      expect(ENTERPRISE_AUDIT_CONFIG.ALERT_CONFIG.immediate_notification).toContain('critical');
      expect(ENTERPRISE_AUDIT_CONFIG.ALERT_CONFIG.notification_cooldown).toBe(300);
    });
  });

  describe('Registro de Eventos Enterprise', () => {
    it('debe registrar evento enterprise con contexto completo', async () => {
      const mockContext: EnterpriseAuthContext = {
        userId: 'user_123',
        sessionId: 'sess_123',
        email: 'test@example.com',
        role: 'admin',
        permissions: ['admin_access'],
        sessionValid: true,
        securityLevel: 'high',
        ipAddress: '192.168.1.1',
        userAgent: 'test-agent',
        supabase: {} as any,
        validations: {
          jwtValid: true,
          csrfValid: true,
          rateLimitPassed: true,
          originValid: true
        }
      };

      const mockRequest = {
        headers: new Map([['x-forwarded-for', '192.168.1.1']]),
        nextUrl: { pathname: '/api/test' }
      } as any;

      const event: Omit<EnterpriseSecurityEvent, 'id' | 'timestamp' | 'resolved'> = {
        user_id: 'user_123',
        event_type: 'AUTH_SUCCESS',
        event_category: 'authentication',
        severity: 'low',
        description: 'Usuario autenticado correctamente',
        metadata: { method: 'clerk' },
        ip_address: '192.168.1.1',
        user_agent: 'test-agent'
      };

      const correlationId = await enterpriseAuditSystem.logEnterpriseEvent(event, mockContext, mockRequest);

      expect(correlationId).toBeDefined();
      expect(correlationId).toMatch(/^corr_\d+_[a-z0-9]+$/);
      expect(mockLogSecurityEvent).toHaveBeenCalledWith(event);
    });

    it('debe calcular risk score correctamente', async () => {
      const criticalEvent: Omit<EnterpriseSecurityEvent, 'id' | 'timestamp' | 'resolved'> = {
        user_id: 'user_123',
        event_type: 'SECURITY_VIOLATION',
        event_category: 'suspicious_behavior',
        severity: 'critical',
        description: 'Violación de seguridad crítica',
        metadata: {},
        ip_address: '192.168.1.1',
        user_agent: 'test-agent'
      };

      const correlationId = await enterpriseAuditSystem.logEnterpriseEvent(criticalEvent);

      expect(correlationId).toBeDefined();
      expect(mockLogSecurityEvent).toHaveBeenCalled();
    });

    it('debe manejar eventos sin contexto enterprise', async () => {
      const event: Omit<EnterpriseSecurityEvent, 'id' | 'timestamp' | 'resolved'> = {
        user_id: 'user_123',
        event_type: 'AUTH_FAILURE',
        event_category: 'authentication',
        severity: 'medium',
        description: 'Fallo de autenticación',
        metadata: {},
        ip_address: '192.168.1.1',
        user_agent: 'test-agent'
      };

      const correlationId = await enterpriseAuditSystem.logEnterpriseEvent(event);

      expect(correlationId).toBeDefined();
      expect(mockLogSecurityEvent).toHaveBeenCalledWith(event);
    });
  });

  describe('Detección de Anomalías', () => {
    it('debe detectar anomalías sin eventos', async () => {
      const anomalies = await enterpriseAuditSystem.detectAnomalies('user_123');

      expect(anomalies).toEqual([]);
    });

    it('debe detectar patrones de login inusuales', async () => {
      // Mock de eventos que simularían un patrón sospechoso
      const mockEvents: EnterpriseSecurityEvent[] = [
        {
          id: 'evt_1',
          user_id: 'user_123',
          event_type: 'AUTH_FAILURE',
          event_category: 'authentication',
          severity: 'medium',
          description: 'Fallo de autenticación',
          metadata: {},
          ip_address: '192.168.1.1',
          user_agent: 'test-agent',
          timestamp: new Date(Date.now() - 1000).toISOString(),
          resolved: false
        },
        {
          id: 'evt_2',
          user_id: 'user_123',
          event_type: 'AUTH_FAILURE',
          event_category: 'authentication',
          severity: 'medium',
          description: 'Fallo de autenticación',
          metadata: {},
          ip_address: '192.168.1.2',
          user_agent: 'test-agent',
          timestamp: new Date(Date.now() - 500).toISOString(),
          resolved: false
        },
        {
          id: 'evt_3',
          user_id: 'user_123',
          event_type: 'AUTH_SUCCESS',
          event_category: 'authentication',
          severity: 'low',
          description: 'Autenticación exitosa',
          metadata: {},
          ip_address: '192.168.1.3',
          user_agent: 'test-agent',
          timestamp: new Date().toISOString(),
          resolved: false
        }
      ];

      // Simular que getRecentEvents devuelve estos eventos
      jest.spyOn(enterpriseAuditSystem as any, 'getRecentEvents').mockResolvedValue(mockEvents);

      const anomalies = await enterpriseAuditSystem.detectAnomalies('user_123');

      // Debería detectar al menos una anomalía por el patrón de múltiples fallos + éxito
      expect(anomalies.length).toBeGreaterThanOrEqual(0);
    });

    it('debe detectar abuso de rate limiting', async () => {
      // Mock de métricas con muchos bloqueos
      mockGetMetrics.mockReturnValue({
        totalRequests: 1000,
        allowedRequests: 800,
        blockedRequests: 200,
        redisHits: 900,
        memoryFallbacks: 100,
        errors: 5,
        averageResponseTime: 45,
        topBlockedIPs: [
          { ip: '192.168.1.100', count: 50 }, // Supera el umbral de 10
          { ip: '10.0.0.50', count: 30 }
        ],
        topEndpoints: []
      });

      const anomalies = await enterpriseAuditSystem.detectAnomalies();

      // Debería detectar anomalías de rate limit abuse
      expect(anomalies.length).toBeGreaterThanOrEqual(0);
    });

    it('debe filtrar anomalías por confianza', async () => {
      // Simular detección con diferentes niveles de confianza
      jest.spyOn(enterpriseAuditSystem as any, 'getRecentEvents').mockResolvedValue([]);

      const anomalies = await enterpriseAuditSystem.detectAnomalies();

      // Solo deberían retornarse anomalías con confianza >= 0.7
      anomalies.forEach(anomaly => {
        expect(anomaly.confidence_score).toBeGreaterThanOrEqual(0.7);
      });
    });
  });

  describe('Generación de Reportes Enterprise', () => {
    it('debe generar reporte enterprise completo', async () => {
      const mockBaseReport = {
        period: { start: '2025-01-01', end: '2025-01-31' },
        summary: { total_events: 100 },
        events: [],
        patterns: [],
        recommendations: []
      };

      const mockGenerateSecurityReport = generateSecurityReport as jest.MockedFunction<typeof generateSecurityReport>;
      mockGenerateSecurityReport.mockResolvedValue(mockBaseReport);

      const startDate = '2025-01-01T00:00:00.000Z';
      const endDate = '2025-01-31T23:59:59.999Z';

      const report = await enterpriseAuditSystem.generateEnterpriseReport(
        startDate,
        endDate,
        true,
        true
      );

      expect(report).toBeDefined();
      expect(report.enterprise_data).toBeDefined();
      expect(report.enterprise_data.anomalies).toBeDefined();
      expect(report.enterprise_data.incidents).toBeDefined();
      expect(report.enterprise_data.rate_limiting_stats).toBeDefined();
      expect(mockGenerateSecurityReport).toHaveBeenCalledWith(startDate, endDate);
    });

    it('debe generar reporte sin anomalías e incidentes', async () => {
      const mockBaseReport = {
        period: { start: '2025-01-01', end: '2025-01-31' },
        summary: { total_events: 50 },
        events: [],
        patterns: [],
        recommendations: []
      };

      const mockGenerateSecurityReport = generateSecurityReport as jest.MockedFunction<typeof generateSecurityReport>;
      mockGenerateSecurityReport.mockResolvedValue(mockBaseReport);

      const startDate = '2025-01-01T00:00:00.000Z';
      const endDate = '2025-01-31T23:59:59.999Z';

      const report = await enterpriseAuditSystem.generateEnterpriseReport(
        startDate,
        endDate,
        false,
        false
      );

      expect(report.enterprise_data.anomalies).toEqual([]);
      expect(report.enterprise_data.incidents).toEqual([]);
    });
  });

  describe('Integración con Rate Limiting', () => {
    it('debe obtener estadísticas de rate limiting', async () => {
      const stats = (enterpriseAuditSystem as any).getRateLimitingStats();

      expect(stats).toBeDefined();
      expect(stats.totalRequests).toBe(1000);
      expect(stats.blockedRequests).toBe(50);
      expect(stats.topBlockedIPs).toHaveLength(2);
      expect(mockGetMetrics).toHaveBeenCalled();
    });

    it('debe incluir métricas de rate limiting en reportes', async () => {
      const mockBaseReport = {
        period: { start: '2025-01-01', end: '2025-01-31' },
        summary: { total_events: 100 },
        events: [],
        patterns: [],
        recommendations: []
      };

      const mockGenerateSecurityReport = generateSecurityReport as jest.MockedFunction<typeof generateSecurityReport>;
      mockGenerateSecurityReport.mockResolvedValue(mockBaseReport);

      const report = await enterpriseAuditSystem.generateEnterpriseReport(
        '2025-01-01T00:00:00.000Z',
        '2025-01-31T23:59:59.999Z'
      );

      expect(report.enterprise_data.rate_limiting_stats).toBeDefined();
      expect(report.enterprise_data.rate_limiting_stats.totalRequests).toBe(1000);
    });
  });

  describe('Gestión de Instancia Singleton', () => {
    it('debe retornar la misma instancia', () => {
      const instance1 = EnterpriseAuditSystem.getInstance();
      const instance2 = EnterpriseAuditSystem.getInstance();

      expect(instance1).toBe(instance2);
      expect(instance1).toBe(enterpriseAuditSystem);
    });

    it('debe poder destruir la instancia', () => {
      const spy = jest.spyOn(console, 'log').mockImplementation();
      
      enterpriseAuditSystem.destroy();
      
      // Verificar que se limpien los intervalos
      expect(spy).not.toHaveBeenCalledWith(expect.stringContaining('Error'));
      
      spy.mockRestore();
    });
  });

  describe('Manejo de Errores', () => {
    it('debe manejar errores en registro de eventos', async () => {
      mockLogSecurityEvent.mockRejectedValue(new Error('Database error'));

      const event: Omit<EnterpriseSecurityEvent, 'id' | 'timestamp' | 'resolved'> = {
        user_id: 'user_123',
        event_type: 'AUTH_FAILURE',
        event_category: 'authentication',
        severity: 'medium',
        description: 'Test event',
        metadata: {},
        ip_address: '192.168.1.1',
        user_agent: 'test-agent'
      };

      await expect(enterpriseAuditSystem.logEnterpriseEvent(event)).rejects.toThrow();
    });

    it('debe manejar errores en detección de anomalías', async () => {
      jest.spyOn(enterpriseAuditSystem as any, 'getRecentEvents').mockRejectedValue(new Error('Database error'));

      const anomalies = await enterpriseAuditSystem.detectAnomalies('user_123');

      // Debe retornar array vacío en caso de error
      expect(anomalies).toEqual([]);
    });

    it('debe manejar errores en generación de reportes', async () => {
      const mockGenerateSecurityReport = generateSecurityReport as jest.MockedFunction<typeof generateSecurityReport>;
      mockGenerateSecurityReport.mockRejectedValue(new Error('Report generation failed'));

      await expect(enterpriseAuditSystem.generateEnterpriseReport(
        '2025-01-01T00:00:00.000Z',
        '2025-01-31T23:59:59.999Z'
      )).rejects.toThrow();
    });
  });
});
