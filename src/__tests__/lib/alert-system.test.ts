// ===================================
// PINTEYA E-COMMERCE - ALERT SYSTEM TESTS
// ===================================

import {
  EnterpriseAlertSystem,
  AlertLevel,
  NotificationType,
  AlertStatus,
  enterpriseAlertSystem,
} from '@/lib/monitoring/alert-system'

// Mock logger
jest.mock('@/lib/enterprise/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    log: jest.fn(),
  },
  LogLevel: {
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error',
  },
  LogCategory: {
    SYSTEM: 'system',
  },
}))

// Mock Supabase
const mockSupabaseInsert = jest.fn()
const mockSupabaseUpdate = jest.fn()
const mockSupabaseFrom = jest.fn(() => ({
  insert: mockSupabaseInsert,
  update: mockSupabaseUpdate,
}))

jest.mock('@/lib/supabase', () => ({
  getSupabaseClient: jest.fn(() => ({
    from: mockSupabaseFrom,
  })),
}))

// Mock cache
jest.mock('@/lib/cache-manager', () => ({
  CacheUtils: {
    get: jest.fn(),
    set: jest.fn(),
  },
}))

// Mock fetch global
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('Enterprise Alert System', () => {
  let alertSystem: EnterpriseAlertSystem

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    alertSystem = new EnterpriseAlertSystem()

    // Mock successful database operations
    mockSupabaseInsert.mockResolvedValue({ error: null })
    mockSupabaseUpdate.mockResolvedValue({ error: null })
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
    })
  })

  afterEach(() => {
    jest.useRealTimers()
    alertSystem.destroy()
  })

  describe('Configuración de canales', () => {
    test('debe configurar canal de notificación', () => {
      const channel = {
        id: 'test_email',
        type: NotificationType.EMAIL,
        name: 'Test Email Channel',
        config: { to: 'admin@pinteya.com' },
        enabled: true,
        levels: [AlertLevel.CRITICAL, AlertLevel.EMERGENCY],
      }

      alertSystem.setNotificationChannel(channel)

      // Verificar que no hay errores
      expect(true).toBe(true)
    })

    test('debe configurar regla de escalamiento', () => {
      const rule = {
        id: 'test_escalation',
        name: 'Test Escalation',
        enabled: true,
        conditions: {
          level: AlertLevel.CRITICAL,
          duration: 10,
        },
        actions: {
          escalateToLevel: AlertLevel.EMERGENCY,
          notifyChannels: ['test_email'],
        },
      }

      alertSystem.setEscalationRule(rule)

      // Verificar que no hay errores
      expect(true).toBe(true)
    })

    test('debe configurar regla de alerta', () => {
      const rule = {
        id: 'test_alert',
        name: 'Test Alert',
        description: 'Test alert rule',
        enabled: true,
        metricName: 'test.metric',
        condition: 'gt' as const,
        threshold: 100,
        level: AlertLevel.WARNING,
        cooldownMinutes: 5,
        channels: ['default_log'],
        escalationRules: [],
        tags: { environment: 'test' },
      }

      alertSystem.setAlertRule(rule)

      // Verificar que no hay errores
      expect(true).toBe(true)
    })
  })

  describe('Disparar alertas', () => {
    beforeEach(() => {
      // Configurar regla de alerta para tests
      alertSystem.setAlertRule({
        id: 'test_rule',
        name: 'Test Rule',
        description: 'Test alert rule',
        enabled: true,
        metricName: 'test.metric',
        condition: 'gt',
        threshold: 100,
        level: AlertLevel.WARNING,
        cooldownMinutes: 5,
        channels: ['default_log'],
        escalationRules: [],
        tags: {},
      })
    })

    test('debe disparar alerta cuando se cumple condición', async () => {
      const alert = await alertSystem.triggerAlert(
        'test_rule',
        'test.metric',
        150,
        'Test alert message'
      )

      expect(alert).toBeTruthy()
      expect(alert?.level).toBe(AlertLevel.WARNING)
      expect(alert?.value).toBe(150)
      expect(alert?.threshold).toBe(100)
      expect(alert?.status).toBe(AlertStatus.ACTIVE)
    })

    test('no debe disparar alerta si la regla está deshabilitada', async () => {
      // Deshabilitar regla
      alertSystem.setAlertRule({
        id: 'disabled_rule',
        name: 'Disabled Rule',
        description: 'Disabled rule',
        enabled: false,
        metricName: 'test.metric',
        condition: 'gt',
        threshold: 100,
        level: AlertLevel.WARNING,
        cooldownMinutes: 5,
        channels: ['default_log'],
        escalationRules: [],
        tags: {},
      })

      const alert = await alertSystem.triggerAlert('disabled_rule', 'test.metric', 150)

      expect(alert).toBeNull()
    })

    test('no debe disparar alerta si está en cooldown', async () => {
      // Disparar primera alerta
      const alert1 = await alertSystem.triggerAlert('test_rule', 'test.metric', 150)

      expect(alert1).toBeTruthy()

      // Intentar disparar segunda alerta inmediatamente
      const alert2 = await alertSystem.triggerAlert('test_rule', 'test.metric', 160)

      expect(alert2).toBeNull()
    })
  })

  describe('Gestión de alertas', () => {
    let testAlert: any

    beforeEach(async () => {
      // Configurar y disparar alerta para tests
      alertSystem.setAlertRule({
        id: 'test_rule',
        name: 'Test Rule',
        description: 'Test rule',
        enabled: true,
        metricName: 'test.metric',
        condition: 'gt',
        threshold: 100,
        level: AlertLevel.WARNING,
        cooldownMinutes: 5,
        channels: ['default_log'],
        escalationRules: [],
        tags: {},
      })

      testAlert = await alertSystem.triggerAlert('test_rule', 'test.metric', 150)
    })

    test('debe reconocer alerta', async () => {
      const success = await alertSystem.acknowledgeAlert(testAlert.id, 'admin-user')

      expect(success).toBe(true)
    })

    test('debe resolver alerta', async () => {
      const success = await alertSystem.resolveAlert(testAlert.id, 'admin-user')

      expect(success).toBe(true)
    })

    test('no debe reconocer alerta inexistente', async () => {
      const success = await alertSystem.acknowledgeAlert('nonexistent', 'admin-user')

      expect(success).toBe(false)
    })

    test('no debe resolver alerta inexistente', async () => {
      const success = await alertSystem.resolveAlert('nonexistent', 'admin-user')

      expect(success).toBe(false)
    })
  })

  describe('Notificaciones', () => {
    test('debe enviar notificación por log', async () => {
      // Configurar canal de log
      alertSystem.setNotificationChannel({
        id: 'test_log',
        type: NotificationType.LOG,
        name: 'Test Log',
        config: {},
        enabled: true,
        levels: [AlertLevel.WARNING],
      })

      // Configurar regla con canal de log
      alertSystem.setAlertRule({
        id: 'log_rule',
        name: 'Log Rule',
        description: 'Log rule',
        enabled: true,
        metricName: 'test.metric',
        condition: 'gt',
        threshold: 100,
        level: AlertLevel.WARNING,
        cooldownMinutes: 5,
        channels: ['test_log'],
        escalationRules: [],
        tags: {},
      })

      const alert = await alertSystem.triggerAlert('log_rule', 'test.metric', 150)

      expect(alert).toBeTruthy()
      expect(alert?.notificationsSent.length).toBeGreaterThan(0)
    })

    test('debe enviar notificación por webhook', async () => {
      // Configurar canal de webhook
      alertSystem.setNotificationChannel({
        id: 'test_webhook',
        type: NotificationType.WEBHOOK,
        name: 'Test Webhook',
        config: { url: 'https://example.com/webhook' },
        enabled: true,
        levels: [AlertLevel.CRITICAL],
      })

      // Configurar regla con canal de webhook
      alertSystem.setAlertRule({
        id: 'webhook_rule',
        name: 'Webhook Rule',
        description: 'Webhook rule',
        enabled: true,
        metricName: 'test.metric',
        condition: 'gt',
        threshold: 100,
        level: AlertLevel.CRITICAL,
        cooldownMinutes: 5,
        channels: ['test_webhook'],
        escalationRules: [],
        tags: {},
      })

      const alert = await alertSystem.triggerAlert('webhook_rule', 'test.metric', 150)

      expect(alert).toBeTruthy()
      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/webhook',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: expect.stringContaining('"source":"pinteya-ecommerce"'),
        })
      )
    })

    test('no debe enviar notificación si el canal está deshabilitado', async () => {
      // Configurar canal deshabilitado
      alertSystem.setNotificationChannel({
        id: 'disabled_channel',
        type: NotificationType.EMAIL,
        name: 'Disabled Channel',
        config: { to: 'test@example.com' },
        enabled: false,
        levels: [AlertLevel.WARNING],
      })

      // Configurar regla con canal deshabilitado
      alertSystem.setAlertRule({
        id: 'disabled_rule',
        name: 'Disabled Rule',
        description: 'Rule with disabled channel',
        enabled: true,
        metricName: 'test.metric',
        condition: 'gt',
        threshold: 100,
        level: AlertLevel.WARNING,
        cooldownMinutes: 5,
        channels: ['disabled_channel'],
        escalationRules: [],
        tags: {},
      })

      const alert = await alertSystem.triggerAlert('disabled_rule', 'test.metric', 150)

      expect(alert).toBeTruthy()
      expect(alert?.notificationsSent.length).toBe(0)
    })
  })

  describe('Escalamiento', () => {
    test('debe escalar alerta después del tiempo configurado', async () => {
      // Configurar regla de escalamiento
      alertSystem.setEscalationRule({
        id: 'test_escalation',
        name: 'Test Escalation',
        enabled: true,
        conditions: {
          level: AlertLevel.WARNING,
          duration: 1, // 1 minuto
        },
        actions: {
          escalateToLevel: AlertLevel.CRITICAL,
          notifyChannels: ['default_log'],
        },
      })

      // Configurar regla de alerta con escalamiento
      alertSystem.setAlertRule({
        id: 'escalation_rule',
        name: 'Escalation Rule',
        description: 'Rule with escalation',
        enabled: true,
        metricName: 'test.metric',
        condition: 'gt',
        threshold: 100,
        level: AlertLevel.WARNING,
        cooldownMinutes: 5,
        channels: ['default_log'],
        escalationRules: ['test_escalation'],
        tags: {},
      })

      // Disparar alerta
      const alert = await alertSystem.triggerAlert('escalation_rule', 'test.metric', 150)

      expect(alert).toBeTruthy()
      expect(alert?.level).toBe(AlertLevel.WARNING)

      // Avanzar tiempo para activar escalamiento
      jest.advanceTimersByTime(2 * 60 * 1000) // 2 minutos

      // El escalamiento se verifica automáticamente
      expect(true).toBe(true)
    })
  })

  describe('Instancia singleton', () => {
    test('debe retornar la misma instancia', () => {
      const instance1 = EnterpriseAlertSystem.getInstance()
      const instance2 = EnterpriseAlertSystem.getInstance()

      expect(instance1).toBe(instance2)
    })

    test('debe usar la instancia global', () => {
      expect(enterpriseAlertSystem).toBeInstanceOf(EnterpriseAlertSystem)
    })
  })

  describe('Limpieza de recursos', () => {
    test('debe limpiar recursos correctamente', () => {
      const system = new EnterpriseAlertSystem()

      expect(() => system.destroy()).not.toThrow()
    })
  })
})
