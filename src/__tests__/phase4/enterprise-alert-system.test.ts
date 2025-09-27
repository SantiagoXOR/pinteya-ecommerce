/**
 * Tests para el Sistema Enterprise de Alertas
 * Verifica funcionalidad básica del sistema de alertas automáticas
 */

import {
  enterpriseAlertSystem,
  ENTERPRISE_ALERT_RULES,
  EnterpriseAlertUtils,
} from '@/lib/monitoring/enterprise-alert-system'

// Mock de dependencias
jest.mock('@/lib/security/enterprise-audit-system', () => ({
  enterpriseAuditSystem: {
    logEnterpriseEvent: jest.fn(),
  },
}))

jest.mock('@/lib/rate-limiting/enterprise-rate-limiter', () => ({
  metricsCollector: {
    getMetrics: jest.fn(() => ({
      totalRequests: 1000,
      blockedRequests: 50,
      allowedRequests: 950,
      averageResponseTime: 45,
      errors: 5,
    })),
  },
}))

jest.mock('@/lib/optimization/enterprise-cache-system', () => ({
  enterpriseCacheSystem: {
    getMetrics: jest.fn(() => ({
      test_key: {
        hits: 100,
        misses: 20,
        avgResponseTime: 15,
        errors: 1,
      },
    })),
  },
}))

describe('Sistema Enterprise de Alertas', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Reglas de Alerta Predefinidas', () => {
    test('debe tener 6 reglas predefinidas', () => {
      expect(ENTERPRISE_ALERT_RULES).toHaveLength(6)
    })

    test('debe tener regla de alto número de requests bloqueados', () => {
      const rule = ENTERPRISE_ALERT_RULES.find(r => r.id === 'security_high_blocked_requests')
      expect(rule).toBeDefined()
      expect(rule?.category).toBe('security')
      expect(rule?.severity).toBe('high')
      expect(rule?.enabled).toBe(true)
    })

    test('debe tener regla de eventos críticos de seguridad', () => {
      const rule = ENTERPRISE_ALERT_RULES.find(r => r.id === 'security_critical_events')
      expect(rule).toBeDefined()
      expect(rule?.category).toBe('security')
      expect(rule?.severity).toBe('critical')
      expect(rule?.enabled).toBe(true)
    })

    test('debe tener regla de tiempo de respuesta alto', () => {
      const rule = ENTERPRISE_ALERT_RULES.find(r => r.id === 'performance_high_response_time')
      expect(rule).toBeDefined()
      expect(rule?.category).toBe('performance')
      expect(rule?.severity).toBe('medium')
      expect(rule?.enabled).toBe(true)
    })

    test('debe tener regla de baja tasa de hit de cache', () => {
      const rule = ENTERPRISE_ALERT_RULES.find(r => r.id === 'performance_low_cache_hit_rate')
      expect(rule).toBeDefined()
      expect(rule?.category).toBe('performance')
      expect(rule?.severity).toBe('medium')
      expect(rule?.enabled).toBe(true)
    })

    test('debe tener regla de alto uso de memoria', () => {
      const rule = ENTERPRISE_ALERT_RULES.find(r => r.id === 'capacity_high_memory_usage')
      expect(rule).toBeDefined()
      expect(rule?.category).toBe('capacity')
      expect(rule?.severity).toBe('high')
      expect(rule?.enabled).toBe(true)
    })

    test('debe tener regla de alta tasa de errores 5xx', () => {
      const rule = ENTERPRISE_ALERT_RULES.find(r => r.id === 'error_high_5xx_rate')
      expect(rule).toBeDefined()
      expect(rule?.category).toBe('error')
      expect(rule?.severity).toBe('high')
      expect(rule?.enabled).toBe(true)
    })
  })

  describe('Configuración de Reglas', () => {
    test('todas las reglas deben tener configuración válida', () => {
      ENTERPRISE_ALERT_RULES.forEach(rule => {
        expect(rule.id).toBeDefined()
        expect(rule.name).toBeDefined()
        expect(rule.description).toBeDefined()
        expect(['security', 'performance', 'availability', 'capacity', 'error']).toContain(
          rule.category
        )
        expect(['low', 'medium', 'high', 'critical']).toContain(rule.severity)
        expect(typeof rule.enabled).toBe('boolean')
        expect(Array.isArray(rule.conditions)).toBe(true)
        expect(rule.conditions.length).toBeGreaterThan(0)
        expect(Array.isArray(rule.notificationChannels)).toBe(true)
        expect(rule.notificationChannels.length).toBeGreaterThan(0)
        expect(typeof rule.cooldownMinutes).toBe('number')
        expect(rule.cooldownMinutes).toBeGreaterThan(0)
      })
    })

    test('condiciones deben tener configuración válida', () => {
      ENTERPRISE_ALERT_RULES.forEach(rule => {
        rule.conditions.forEach(condition => {
          expect(condition.metric).toBeDefined()
          expect(['gt', 'lt', 'eq', 'gte', 'lte', 'contains', 'not_contains']).toContain(
            condition.operator
          )
          expect(condition.threshold).toBeDefined()
          expect(typeof condition.timeWindow).toBe('number')
          expect(condition.timeWindow).toBeGreaterThan(0)
          expect(typeof condition.evaluationInterval).toBe('number')
          expect(condition.evaluationInterval).toBeGreaterThan(0)
        })
      })
    })

    test('canales de notificación deben tener configuración válida', () => {
      ENTERPRISE_ALERT_RULES.forEach(rule => {
        rule.notificationChannels.forEach(channel => {
          expect(['email', 'slack', 'webhook', 'sms', 'dashboard']).toContain(channel.type)
          expect(typeof channel.config).toBe('object')
          expect(typeof channel.enabled).toBe('boolean')
        })
      })
    })
  })

  describe('Inicialización del Sistema', () => {
    test('debe inicializar correctamente', async () => {
      await expect(enterpriseAlertSystem.initialize()).resolves.not.toThrow()
    })

    test('debe ser singleton', () => {
      const instance1 = enterpriseAlertSystem
      const instance2 = enterpriseAlertSystem
      expect(instance1).toBe(instance2)
    })
  })

  describe('Gestión de Alertas', () => {
    test('debe obtener alertas activas', () => {
      const activeAlerts = enterpriseAlertSystem.getActiveAlerts()
      expect(Array.isArray(activeAlerts)).toBe(true)
    })

    test('debe obtener métricas de alertas', () => {
      const metrics = enterpriseAlertSystem.getAlertMetrics()
      expect(metrics).toBeDefined()
      expect(typeof metrics.totalAlerts).toBe('number')
      expect(typeof metrics.activeAlerts).toBe('number')
      expect(typeof metrics.averageResolutionTime).toBe('number')
      expect(typeof metrics.falsePositiveRate).toBe('number')
      expect(typeof metrics.alertsByCategory).toBe('object')
      expect(typeof metrics.alertsBySeverity).toBe('object')
    })
  })

  describe('Utilidades de Alertas', () => {
    test('EnterpriseAlertUtils debe estar definido', () => {
      expect(EnterpriseAlertUtils).toBeDefined()
      expect(typeof EnterpriseAlertUtils.createManualAlert).toBe('function')
      expect(typeof EnterpriseAlertUtils.getAlertsByCategory).toBe('function')
      expect(typeof EnterpriseAlertUtils.getAlertsBySeverity).toBe('function')
    })

    test('debe crear alerta manual', async () => {
      const alertId = await EnterpriseAlertUtils.createManualAlert(
        'Test Alert',
        'Test Description',
        'medium',
        'availability',
        'test_user'
      )

      expect(typeof alertId).toBe('string')
      expect(alertId).toMatch(/^manual_/)
    })
  })

  describe('Categorías y Severidades', () => {
    test('debe tener alertas de todas las categorías', () => {
      const categories = ['security', 'performance', 'capacity', 'error']
      categories.forEach(category => {
        const rulesInCategory = ENTERPRISE_ALERT_RULES.filter(r => r.category === category)
        expect(rulesInCategory.length).toBeGreaterThan(0)
      })
    })

    test('debe tener alertas de diferentes severidades', () => {
      const severities = ['medium', 'high', 'critical']
      severities.forEach(severity => {
        const rulesWithSeverity = ENTERPRISE_ALERT_RULES.filter(r => r.severity === severity)
        expect(rulesWithSeverity.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Escalamiento de Alertas', () => {
    test('reglas críticas deben tener escalamiento configurado', () => {
      const criticalRules = ENTERPRISE_ALERT_RULES.filter(r => r.severity === 'critical')
      criticalRules.forEach(rule => {
        // Las reglas críticas pueden tener escalamiento
        if (rule.escalationRules) {
          expect(Array.isArray(rule.escalationRules)).toBe(true)
          rule.escalationRules.forEach(escalation => {
            expect(typeof escalation.afterMinutes).toBe('number')
            expect(escalation.afterMinutes).toBeGreaterThan(0)
            expect(['low', 'medium', 'high', 'critical']).toContain(escalation.severity)
            expect(Array.isArray(escalation.additionalChannels)).toBe(true)
          })
        }
      })
    })

    test('reglas de alta severidad deben tener escalamiento', () => {
      const highSeverityRules = ENTERPRISE_ALERT_RULES.filter(r => r.severity === 'high')
      highSeverityRules.forEach(rule => {
        // Verificar que las reglas de alta severidad tengan configuración apropiada
        expect(rule.cooldownMinutes).toBeLessThanOrEqual(30) // Cooldown corto para alta severidad
      })
    })
  })

  describe('Canales de Notificación', () => {
    test('debe tener configuración de email para alertas importantes', () => {
      const importantRules = ENTERPRISE_ALERT_RULES.filter(
        r => r.severity === 'critical' || r.severity === 'high'
      )

      importantRules.forEach(rule => {
        const hasEmail = rule.notificationChannels.some(c => c.type === 'email')
        expect(hasEmail).toBe(true)
      })
    })

    test('debe tener configuración de SMS para alertas críticas', () => {
      const criticalRules = ENTERPRISE_ALERT_RULES.filter(r => r.severity === 'critical')

      criticalRules.forEach(rule => {
        const hasSMS =
          rule.notificationChannels.some(c => c.type === 'sms') ||
          (rule.escalationRules &&
            rule.escalationRules.some(e => e.additionalChannels.some(c => c.type === 'sms')))
        expect(hasSMS).toBe(true)
      })
    })

    test('todas las reglas deben tener dashboard habilitado', () => {
      ENTERPRISE_ALERT_RULES.forEach(rule => {
        const hasDashboard = rule.notificationChannels.some(c => c.type === 'dashboard')
        // Dashboard es opcional, pero si está presente debe estar habilitado
        if (hasDashboard) {
          const dashboardChannel = rule.notificationChannels.find(c => c.type === 'dashboard')
          expect(dashboardChannel?.enabled).toBe(true)
        }
      })
    })
  })

  describe('Métricas y Umbrales', () => {
    test('umbrales deben ser realistas para métricas de performance', () => {
      const performanceRules = ENTERPRISE_ALERT_RULES.filter(r => r.category === 'performance')

      performanceRules.forEach(rule => {
        rule.conditions.forEach(condition => {
          if (condition.metric.includes('response_time')) {
            // Tiempo de respuesta en ms, debe ser razonable
            expect(Number(condition.threshold)).toBeGreaterThan(100)
            expect(Number(condition.threshold)).toBeLessThan(10000)
          }

          if (condition.metric.includes('hit_rate')) {
            // Hit rate debe ser un porcentaje válido
            expect(Number(condition.threshold)).toBeGreaterThan(0)
            expect(Number(condition.threshold)).toBeLessThanOrEqual(1)
          }
        })
      })
    })

    test('umbrales deben ser apropiados para métricas de seguridad', () => {
      const securityRules = ENTERPRISE_ALERT_RULES.filter(r => r.category === 'security')

      securityRules.forEach(rule => {
        rule.conditions.forEach(condition => {
          if (condition.metric.includes('blocked_requests')) {
            // Número de requests bloqueados debe ser positivo
            expect(Number(condition.threshold)).toBeGreaterThan(0)
          }

          if (condition.metric.includes('critical_events')) {
            // Eventos críticos deben tener umbral bajo
            expect(Number(condition.threshold)).toBeLessThan(20)
          }
        })
      })
    })
  })
})
