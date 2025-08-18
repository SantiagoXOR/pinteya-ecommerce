// ===================================
// PINTEYA E-COMMERCE - AUDIT TRAIL TESTS
// ===================================

import { 
  AuditTrailManager,
  AuditCategory,
  AuditSeverity,
  AuditResult,
  logAuthentication,
  logPaymentEvent,
  logSecurityViolation,
  logDataAccess,
  logAdminAction
} from '@/lib/security/audit-trail';

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    audit: jest.fn(),
    security: jest.fn(),
    error: jest.fn(),
  },
  LogLevel: {
    INFO: 'info',
    ERROR: 'error',
  },
  LogCategory: {
    SYSTEM: 'system',
  },
}));

// Mock Supabase
const mockSupabaseInsert = jest.fn();
const mockSupabaseSelect = jest.fn();
const mockSupabaseFrom = jest.fn(() => ({
  insert: mockSupabaseInsert,
  select: mockSupabaseSelect,
}));

jest.mock('@/lib/supabase', () => ({
  getSupabaseClient: jest.fn(() => ({
    from: mockSupabaseFrom,
  })),
}));

describe('Audit Trail System Enterprise', () => {
  let auditManager: AuditTrailManager;

  beforeEach(() => {
    jest.clearAllMocks();
    auditManager = new AuditTrailManager();
    
    // Mock successful database operations
    mockSupabaseInsert.mockResolvedValue({ error: null });
    mockSupabaseSelect.mockResolvedValue({ data: [], error: null });
  });

  describe('AuditTrailManager', () => {
    test('debe crear instancia singleton', () => {
      const instance1 = AuditTrailManager.getInstance();
      const instance2 = AuditTrailManager.getInstance();
      
      expect(instance1).toBe(instance2);
    });

    test('debe generar ID único para eventos', async () => {
      const eventData = {
        userId: 'test-user',
        action: 'test_action',
        resource: 'test_resource',
        category: AuditCategory.AUTHENTICATION,
        severity: AuditSeverity.LOW,
        result: AuditResult.SUCCESS,
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent'
      };

      await auditManager.logEvent(eventData);
      await auditManager.logEvent(eventData);

      expect(mockSupabaseInsert).toHaveBeenCalledTimes(2);
      
      const call1 = mockSupabaseInsert.mock.calls[0][0];
      const call2 = mockSupabaseInsert.mock.calls[1][0];
      
      expect(call1.id).not.toBe(call2.id);
      expect(call1.id).toMatch(/^audit_\d+_[a-f0-9]{16}$/);
    });

    test('debe generar hash de integridad', async () => {
      const eventData = {
        userId: 'test-user',
        action: 'test_action',
        resource: 'test_resource',
        category: AuditCategory.AUTHENTICATION,
        severity: AuditSeverity.LOW,
        result: AuditResult.SUCCESS,
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent'
      };

      await auditManager.logEvent(eventData);

      expect(mockSupabaseInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          hash: expect.stringMatching(/^[a-f0-9]{64}$/)
        })
      );
    });

    test('debe almacenar evento en base de datos', async () => {
      const eventData = {
        userId: 'test-user',
        action: 'test_action',
        resource: 'test_resource',
        category: AuditCategory.AUTHENTICATION,
        severity: AuditSeverity.MEDIUM,
        result: AuditResult.SUCCESS,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        metadata: { extra: 'data' }
      };

      await auditManager.logEvent(eventData);

      expect(mockSupabaseFrom).toHaveBeenCalledWith('audit_events');
      expect(mockSupabaseInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'test-user',
          action: 'test_action',
          resource: 'test_resource',
          category: 'authentication',
          severity: 'medium',
          result: 'success',
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0',
          metadata: { extra: 'data' }
        })
      );
    });

    test('debe manejar errores de base de datos', async () => {
      mockSupabaseInsert.mockResolvedValue({ 
        error: { message: 'Database error' } 
      });

      const eventData = {
        action: 'test_action',
        resource: 'test_resource',
        category: AuditCategory.AUTHENTICATION,
        severity: AuditSeverity.LOW,
        result: AuditResult.SUCCESS,
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent'
      };

      // No debe lanzar error, debe manejarlo internamente
      await expect(auditManager.logEvent(eventData)).resolves.not.toThrow();
    });
  });

  describe('Funciones de conveniencia', () => {
    test('logAuthentication debe crear evento de autenticación', async () => {
      await logAuthentication(
        'user_login',
        AuditResult.SUCCESS,
        'user-123',
        { sessionId: 'session-456' },
        { ip: '192.168.1.1', userAgent: 'Chrome' }
      );

      expect(mockSupabaseInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'user_login',
          resource: 'authentication',
          category: 'authentication',
          severity: 'medium',
          result: 'success',
          user_id: 'user-123',
          ip_address: '192.168.1.1',
          user_agent: 'Chrome',
          metadata: { sessionId: 'session-456' },
          compliance_flags: ['ISO27001', 'AUTHENTICATION_LOG']
        })
      );
    });

    test('logPaymentEvent debe crear evento de pago', async () => {
      await logPaymentEvent(
        'payment_processed',
        AuditResult.SUCCESS,
        {
          orderId: 'order-123',
          paymentId: 'payment-456',
          amount: 100.50,
          currency: 'ARS',
          method: 'mercadopago'
        },
        'user-789',
        { ip: '10.0.0.1', userAgent: 'Safari' }
      );

      expect(mockSupabaseInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'payment_processed',
          resource: 'payment:payment-456',
          category: 'payment_processing',
          severity: 'low',
          result: 'success',
          user_id: 'user-789',
          ip_address: '10.0.0.1',
          user_agent: 'Safari',
          metadata: expect.objectContaining({
            orderId: 'order-123',
            paymentId: 'payment-456',
            amount: 100.50,
            currency: 'ARS',
            method: 'mercadopago',
            complianceRequired: true
          }),
          compliance_flags: ['ISO27001', 'PAYMENT_LOG', 'FINANCIAL_COMPLIANCE']
        })
      );
    });

    test('logSecurityViolation debe crear evento crítico', async () => {
      await logSecurityViolation(
        'invalid_signature',
        'HMAC signature validation failed',
        { ip: '192.168.1.100', userAgent: 'Unknown' },
        { attemptedResource: '/api/webhook' }
      );

      expect(mockSupabaseInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'invalid_signature',
          resource: 'security_system',
          category: 'security_violation',
          severity: 'critical',
          result: 'blocked',
          ip_address: '192.168.1.100',
          user_agent: 'Unknown',
          metadata: expect.objectContaining({
            details: 'HMAC signature validation failed',
            attemptedResource: '/api/webhook',
            alertRequired: true
          }),
          compliance_flags: ['ISO27001', 'SECURITY_INCIDENT', 'IMMEDIATE_ALERT']
        })
      );
    });

    test('logDataAccess debe crear evento de acceso a datos', async () => {
      await logDataAccess(
        'user_data_accessed',
        'user_profiles',
        AuditResult.SUCCESS,
        'admin-user',
        { ip: '172.16.0.1', userAgent: 'Firefox' },
        { recordsAccessed: 5 }
      );

      expect(mockSupabaseInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'user_data_accessed',
          resource: 'user_profiles',
          category: 'data_access',
          severity: 'medium',
          result: 'success',
          user_id: 'admin-user',
          ip_address: '172.16.0.1',
          user_agent: 'Firefox',
          metadata: { recordsAccessed: 5 },
          compliance_flags: ['ISO27001', 'DATA_ACCESS_LOG']
        })
      );
    });

    test('logAdminAction debe crear evento administrativo', async () => {
      await logAdminAction(
        'user_role_changed',
        'user:user-123',
        AuditResult.SUCCESS,
        'admin-456',
        { ip: '10.1.1.1', userAgent: 'Edge' },
        { oldRole: 'user', newRole: 'admin' }
      );

      expect(mockSupabaseInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'user_role_changed',
          resource: 'user:user-123',
          category: 'system_administration',
          severity: 'high',
          result: 'success',
          user_id: 'admin-456',
          ip_address: '10.1.1.1',
          user_agent: 'Edge',
          metadata: { oldRole: 'user', newRole: 'admin' },
          compliance_flags: ['ISO27001', 'ADMIN_ACTION', 'PRIVILEGED_ACCESS']
        })
      );
    });
  });

  describe('Severidad automática', () => {
    test('debe asignar severidad HIGH para fallos de autenticación', async () => {
      await logAuthentication(
        'login_failed',
        AuditResult.FAILURE,
        undefined,
        { reason: 'invalid_password' },
        { ip: '192.168.1.1', userAgent: 'Chrome' }
      );

      expect(mockSupabaseInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'high'
        })
      );
    });

    test('debe asignar severidad HIGH para fallos de pago', async () => {
      await logPaymentEvent(
        'payment_failed',
        AuditResult.FAILURE,
        { paymentId: 'payment-123', amount: 100 },
        'user-456',
        { ip: '10.0.0.1', userAgent: 'Safari' }
      );

      expect(mockSupabaseInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'high'
        })
      );
    });

    test('debe asignar severidad HIGH para acceso no autorizado', async () => {
      await logDataAccess(
        'unauthorized_access',
        'sensitive_data',
        AuditResult.UNAUTHORIZED,
        'user-123',
        { ip: '192.168.1.1', userAgent: 'Chrome' }
      );

      expect(mockSupabaseInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'high'
        })
      );
    });
  });

  describe('Compliance flags', () => {
    test('debe incluir flags de compliance apropiados', async () => {
      // Evento de autenticación
      await logAuthentication('login', AuditResult.SUCCESS, 'user-1');
      expect(mockSupabaseInsert).toHaveBeenLastCalledWith(
        expect.objectContaining({
          compliance_flags: ['ISO27001', 'AUTHENTICATION_LOG']
        })
      );

      // Evento de pago
      await logPaymentEvent('payment', AuditResult.SUCCESS, {}, 'user-2');
      expect(mockSupabaseInsert).toHaveBeenLastCalledWith(
        expect.objectContaining({
          compliance_flags: ['ISO27001', 'PAYMENT_LOG', 'FINANCIAL_COMPLIANCE']
        })
      );

      // Violación de seguridad
      await logSecurityViolation('attack', 'details', { ip: '1.1.1.1', userAgent: 'bot' });
      expect(mockSupabaseInsert).toHaveBeenLastCalledWith(
        expect.objectContaining({
          compliance_flags: ['ISO27001', 'SECURITY_INCIDENT', 'IMMEDIATE_ALERT']
        })
      );
    });
  });
});
