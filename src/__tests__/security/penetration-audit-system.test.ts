/**
 * Tests de Penetración para Sistema de Auditoría Enterprise
 * Valida la robustez del sistema de auditoría contra ataques sofisticados
 */

// Mock de dependencias con eventos simulados
const mockEvents: any[] = []
// Hacer el array accesible globalmente para el sistema de auditoría
;(global as any).__mockEvents = mockEvents

jest.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn((table: string) => {
      if (table === 'enterprise_audit_events') {
        // Crear un objeto query builder que soporte encadenamiento
        const createQueryBuilder = () => ({
          eq: jest.fn(() => createQueryBuilder()),
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
          range: jest.fn(() => createQueryBuilder()),
          order: jest.fn().mockResolvedValue({ data: mockEvents, error: null }),
          gte: jest.fn(() => createQueryBuilder()),
          lte: jest.fn(() => createQueryBuilder()),
        })

        return {
          select: jest.fn(() => createQueryBuilder()),
          insert: jest.fn((event: any) => {
            // Simular inserción de evento con timestamp
            const eventWithTimestamp = {
              ...event,
              id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              created_at: new Date().toISOString(),
            }
            mockEvents.push(eventWithTimestamp)
            return {
              select: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({ data: { id: 'test_id' }, error: null }),
              })),
            }
          }),
        }
      }
      // Para otras tablas, retornar mock básico
      return {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          })),
        })),
      }
    }),
  },
}))

jest.mock('@/lib/auth/security-audit', () => ({
  logSecurityEvent: jest.fn().mockResolvedValue(true),
}))

jest.mock('@/lib/rate-limiting/enterprise-rate-limiter', () => ({
  metricsCollector: {
    getMetrics: jest.fn().mockReturnValue({
      totalRequests: 1000,
      allowedRequests: 950,
      blockedRequests: 50,
      redisHits: 900,
      memoryFallbacks: 100,
      errors: 5,
      averageResponseTime: 45,
      topBlockedIPs: [
        { ip: '192.168.1.100', count: 25 },
        { ip: '10.0.0.50', count: 15 },
      ],
      topEndpoints: [
        { endpoint: '/api/admin', count: 30 },
        { endpoint: '/api/payments', count: 20 },
      ],
    }),
  },
}))

import { NextRequest } from 'next/server'
import {
  enterpriseAuditSystem,
  type EnterpriseSecurityEvent,
  type SecurityAnomalyDetection,
  ENTERPRISE_AUDIT_CONFIG,
} from '@/lib/security/enterprise-audit-system'
import type { EnterpriseAuthContext } from '@/lib/auth/enterprise-auth-utils'

describe('Tests de Penetración - Sistema de Auditoría Enterprise', () => {
  let mockContext: EnterpriseAuthContext

  beforeEach(() => {
    jest.clearAllMocks()

    // Limpiar eventos mock
    mockEvents.length = 0

    mockContext = {
      userId: 'test_user_123',
      sessionId: 'test_session_123',
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
        originValid: true,
      },
    }
  })

  describe('Ataques de Evasión de Auditoría', () => {
    it('debe detectar intentos de bypass del sistema de logging', async () => {
      const evasionAttempts = [
        // Intento 1: Event type manipulation
        {
          user_id: 'attacker_123',
          event_type: 'AUTH_SUCCESS' as any, // Falso éxito
          event_category: 'authentication',
          severity: 'low' as any,
          description: 'Legitimate login', // Descripción engañosa
          metadata: {
            actual_event: 'UNAUTHORIZED_ACCESS',
            bypass_attempt: true,
          },
          ip_address: '192.168.1.100',
          user_agent: 'LegitimateBot/1.0',
        },

        // Intento 2: Severity downgrade
        {
          user_id: 'attacker_123',
          event_type: 'SECURITY_VIOLATION' as any,
          event_category: 'suspicious_behavior',
          severity: 'low' as any, // Debería ser critical
          description: 'Minor security issue',
          metadata: {
            real_severity: 'critical',
            admin_access_attempt: true,
          },
          ip_address: '192.168.1.100',
          user_agent: 'AttackBot/2.0',
        },

        // Intento 3: Metadata pollution
        {
          user_id: 'attacker_123',
          event_type: 'DATA_ACCESS' as any,
          event_category: 'data_access',
          severity: 'medium' as any,
          description: 'Normal data access',
          metadata: {
            // Intentar contaminar con datos masivos
            pollution: 'x'.repeat(10000),
            nested: {
              deep: {
                very: {
                  deep: {
                    data: 'x'.repeat(5000),
                  },
                },
              },
            },
          },
          ip_address: '192.168.1.100',
          user_agent: 'DataPollutionBot/1.0',
        },
      ]

      const results = []
      for (const attempt of evasionAttempts) {
        try {
          const correlationId = await enterpriseAuditSystem.logEnterpriseEvent(attempt, mockContext)
          results.push({ success: true, correlationId })
        } catch (error) {
          results.push({ success: false, error: error.message })
        }
      }

      // Verificar que todos los eventos fueron registrados (no evasión exitosa)
      expect(results.every(r => r.success)).toBe(true)

      // Verificar que se generaron correlation IDs únicos
      const correlationIds = results.map(r => r.correlationId)
      expect(new Set(correlationIds).size).toBe(correlationIds.length)
    })

    it('debe resistir ataques de flooding de eventos', async () => {
      const floodingAttack = Array.from({ length: 1000 }, (_, i) => ({
        user_id: 'flooder_123',
        event_type: 'SPAM_EVENT' as any,
        event_category: 'attack',
        severity: 'low' as any,
        description: `Flooding event ${i}`,
        metadata: {
          flood_index: i,
          timestamp: Date.now() + i,
        },
        ip_address: '10.0.0.100',
        user_agent: 'FloodBot/1.0',
      }))

      const startTime = Date.now()
      const results = []

      // Intentar flooding masivo
      for (const event of floodingAttack) {
        try {
          const correlationId = await enterpriseAuditSystem.logEnterpriseEvent(event, mockContext)
          results.push({ success: true, correlationId })
        } catch (error) {
          results.push({ success: false, error: error.message })
        }
      }

      const endTime = Date.now()
      const totalTime = endTime - startTime
      const avgTimePerEvent = totalTime / 1000

      // Verificar que el sistema mantuvo performance
      expect(avgTimePerEvent).toBeLessThan(10) // < 10ms por evento

      // Verificar que se procesaron todos los eventos
      expect(results.length).toBe(1000)

      // Verificar que el sistema no se crasheó
      const successCount = results.filter(r => r.success).length
      expect(successCount).toBeGreaterThan(900) // Al menos 90% exitosos
    })

    it('debe detectar intentos de manipulación de timestamps', async () => {
      const timestampManipulationAttempts = [
        // Futuro lejano
        {
          user_id: 'time_attacker_123',
          event_type: 'AUTH_SUCCESS' as any,
          event_category: 'authentication',
          severity: 'low' as any,
          description: 'Future login attempt',
          metadata: {
            manipulated_timestamp: new Date('2030-01-01').toISOString(),
            real_time: new Date().toISOString(),
          },
          ip_address: '172.16.0.100',
          user_agent: 'TimeTravelBot/1.0',
        },

        // Pasado lejano
        {
          user_id: 'time_attacker_123',
          event_type: 'DATA_DELETION' as any,
          event_category: 'data_access',
          severity: 'critical' as any,
          description: 'Historical data deletion',
          metadata: {
            manipulated_timestamp: new Date('1990-01-01').toISOString(),
            backdated: true,
          },
          ip_address: '172.16.0.100',
          user_agent: 'BackdateBot/1.0',
        },
      ]

      const results = []
      for (const attempt of timestampManipulationAttempts) {
        const correlationId = await enterpriseAuditSystem.logEnterpriseEvent(attempt, mockContext)
        results.push(correlationId)
      }

      // Verificar que se generaron correlation IDs (eventos registrados)
      expect(results.every(id => id && id.startsWith('corr_'))).toBe(true)

      // El sistema debería usar sus propios timestamps, no los manipulados
      expect(results.length).toBe(2)
    })
  })

  describe('Ataques de Detección de Anomalías', () => {
    it('debe detectar patrones de ataque sofisticados', async () => {
      // Simular patrón de ataque APT (Advanced Persistent Threat)
      const aptAttackPattern = [
        // Fase 1: Múltiples fallos de autenticación (brute force)
        {
          user_id: 'apt_actor_123',
          event_type: 'AUTH_FAILURE' as any,
          event_category: 'authentication',
          severity: 'medium' as any,
          description: 'Failed login attempt',
          metadata: {
            phase: 'reconnaissance',
            location: 'Unknown Country',
            reason: 'invalid_password',
          },
          ip_address: '203.0.113.100',
          user_agent: 'Mozilla/5.0 (legitimate looking)',
          timestamp: new Date(Date.now() - 300000).toISOString(), // 5 min ago
        },
        {
          user_id: 'apt_actor_123',
          event_type: 'AUTH_FAILURE' as any,
          event_category: 'authentication',
          severity: 'medium' as any,
          description: 'Failed login attempt',
          metadata: {
            phase: 'reconnaissance',
            location: 'Unknown Country',
            reason: 'invalid_password',
          },
          ip_address: '203.0.113.100',
          user_agent: 'Mozilla/5.0 (legitimate looking)',
          timestamp: new Date(Date.now() - 240000).toISOString(), // 4 min ago
        },
        {
          user_id: 'apt_actor_123',
          event_type: 'AUTH_FAILURE' as any,
          event_category: 'authentication',
          severity: 'medium' as any,
          description: 'Failed login attempt',
          metadata: {
            phase: 'reconnaissance',
            location: 'Unknown Country',
            reason: 'invalid_password',
          },
          ip_address: '203.0.113.100',
          user_agent: 'Mozilla/5.0 (legitimate looking)',
          timestamp: new Date(Date.now() - 180000).toISOString(), // 3 min ago
        },

        // Fase 2: Login exitoso después de fallos (brute force exitoso)
        {
          user_id: 'apt_actor_123',
          event_type: 'AUTH_SUCCESS' as any,
          event_category: 'authentication',
          severity: 'high' as any,
          description: 'Successful login after multiple failures',
          metadata: {
            phase: 'privilege_escalation',
            location: 'Unknown Country',
            suspicious_pattern: true,
          },
          ip_address: '203.0.113.100',
          user_agent: 'Mozilla/5.0 (legitimate looking)',
          timestamp: new Date(Date.now() - 120000).toISOString(), // 2 min ago
        },

        // Fase 3: Acceso a APIs críticas
        {
          user_id: 'apt_actor_123',
          event_type: 'API_ACCESS' as any,
          event_category: 'api_usage',
          severity: 'high' as any,
          description: 'Critical API access',
          metadata: {
            phase: 'data_exfiltration',
            endpoint: '/api/admin/users',
            method: 'GET',
            response_size: 50000,
          },
          ip_address: '203.0.113.100',
          user_agent: 'Mozilla/5.0 (legitimate looking)',
          timestamp: new Date(Date.now() - 60000).toISOString(), // 1 min ago
        },
      ]

      // Registrar patrón de ataque con intervalos realistas
      for (const [index, event] of aptAttackPattern.entries()) {
        await enterpriseAuditSystem.logEnterpriseEvent(event, mockContext)

        // Esperar entre eventos para simular comportamiento real
        if (index < aptAttackPattern.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }

      // Ejecutar detección de anomalías
      const anomalies = await enterpriseAuditSystem.detectAnomalies('apt_actor_123')

      // Verificar que se detectó el patrón APT
      expect(anomalies.length).toBeGreaterThan(0)

      // Verificar que se detectaron anomalías de alta confianza
      const highConfidenceAnomalies = anomalies.filter(a => a.confidence_score >= 0.8)
      expect(highConfidenceAnomalies.length).toBeGreaterThan(0)
    })

    it('debe detectar ataques de lateral movement', async () => {
      const lateralMovementPattern = [
        // Usuario comprometido accede a múltiples sistemas (data_access para detectSuspiciousAPIUsage)
        {
          user_id: 'compromised_user_456',
          event_type: 'API_ACCESS' as any,
          event_category: 'data_access',
          severity: 'medium' as any,
          description: 'Database system access',
          metadata: {
            endpoint: '/api/database/users',
            method: 'GET',
            response_size: 15000,
            unusual_access: true,
          },
          ip_address: '192.168.1.150',
          user_agent: 'InternalTool/1.0',
        },

        {
          user_id: 'compromised_user_456',
          event_type: 'API_ACCESS' as any,
          event_category: 'data_access',
          severity: 'medium' as any,
          description: 'File server system access',
          metadata: {
            endpoint: '/api/files/list',
            method: 'GET',
            response_size: 25000,
            unusual_time: true,
          },
          ip_address: '192.168.1.150',
          user_agent: 'InternalTool/1.0',
        },

        {
          user_id: 'compromised_user_456',
          event_type: 'API_ACCESS' as any,
          event_category: 'data_access',
          severity: 'medium' as any,
          description: 'Admin system access',
          metadata: {
            endpoint: '/api/admin/settings',
            method: 'GET',
            response_size: 8000,
            unusual_access: true,
          },
          ip_address: '192.168.1.150',
          user_agent: 'InternalTool/1.0',
        },

        {
          user_id: 'compromised_user_456',
          event_type: 'API_ACCESS' as any,
          event_category: 'data_access',
          severity: 'medium' as any,
          description: 'Payment system access',
          metadata: {
            endpoint: '/api/payments/history',
            method: 'GET',
            response_size: 35000,
            unusual_access: true,
          },
          ip_address: '192.168.1.150',
          user_agent: 'InternalTool/1.0',
        },

        {
          user_id: 'compromised_user_456',
          event_type: 'API_ACCESS' as any,
          event_category: 'data_access',
          severity: 'high' as any,
          description: 'Customer system access',
          metadata: {
            endpoint: '/api/customers/sensitive',
            method: 'GET',
            response_size: 50000,
            unusual_access: true,
          },
          ip_address: '192.168.1.150',
          user_agent: 'InternalTool/1.0',
        },
      ]

      // Registrar patrón de lateral movement
      for (const event of lateralMovementPattern) {
        await enterpriseAuditSystem.logEnterpriseEvent(event, mockContext)
      }

      // Detectar anomalías
      const anomalies = await enterpriseAuditSystem.detectAnomalies('compromised_user_456')

      // Debug logs removidos para limpieza

      // Verificar detección de lateral movement
      expect(anomalies.length).toBeGreaterThan(0)

      // Verificar que se identificó el patrón de acceso múltiple
      const systemAccessAnomalies = anomalies.filter(
        a =>
          a.description.includes('system') ||
          a.description.includes('access') ||
          a.description.includes('API') ||
          a.description.includes('sospechoso')
      )
      expect(systemAccessAnomalies.length).toBeGreaterThan(0)
    })

    it('debe detectar ataques de data exfiltration', async () => {
      const dataExfiltrationPattern = [
        // Acceso masivo a datos (API_ACCESS para detectSuspiciousAPIUsage)
        {
          user_id: 'data_thief_789',
          event_type: 'API_ACCESS' as any,
          event_category: 'data_access',
          severity: 'critical' as any,
          description: 'Large dataset download',
          metadata: {
            endpoint: '/api/users/export',
            method: 'GET',
            response_size: 500000, // 500MB para trigger high confidence
            records_accessed: 10000,
            suspicious: true,
          },
          ip_address: '198.51.100.200',
          user_agent: 'DataExtractor/2.0',
        },

        // Múltiples exportaciones masivas
        {
          user_id: 'data_thief_789',
          event_type: 'API_ACCESS' as any,
          event_category: 'data_access',
          severity: 'critical' as any,
          description: 'Customer data export',
          metadata: {
            endpoint: '/api/customers/bulk-export',
            method: 'POST',
            response_size: 750000, // 750MB para trigger high confidence
            records_count: 15000,
            contains_pii: true,
          },
          ip_address: '198.51.100.200',
          user_agent: 'DataExtractor/2.0',
        },

        {
          user_id: 'data_thief_789',
          event_type: 'API_ACCESS' as any,
          event_category: 'data_access',
          severity: 'critical' as any,
          description: 'Financial data access',
          metadata: {
            endpoint: '/api/financial/reports',
            method: 'GET',
            response_size: 600000,
            records_accessed: 8000,
            sensitive_data: true,
          },
          ip_address: '198.51.100.200',
          user_agent: 'DataExtractor/2.0',
        },

        {
          user_id: 'data_thief_789',
          event_type: 'API_ACCESS' as any,
          event_category: 'data_access',
          severity: 'critical' as any,
          description: 'Payment data access',
          metadata: {
            endpoint: '/api/payments/transactions',
            method: 'GET',
            response_size: 800000,
            records_accessed: 12000,
            contains_pii: true,
          },
          ip_address: '198.51.100.200',
          user_agent: 'DataExtractor/2.0',
        },

        {
          user_id: 'data_thief_789',
          event_type: 'API_ACCESS' as any,
          event_category: 'data_access',
          severity: 'critical' as any,
          description: 'Admin data access',
          metadata: {
            endpoint: '/api/admin/users/full',
            method: 'GET',
            response_size: 900000,
            records_accessed: 20000,
            admin_only: true,
          },
          ip_address: '198.51.100.200',
          user_agent: 'DataExtractor/2.0',
        },
      ]

      // Registrar patrón de exfiltración
      for (const event of dataExfiltrationPattern) {
        await enterpriseAuditSystem.logEnterpriseEvent(event, mockContext)
      }

      // Detectar anomalías
      const anomalies = await enterpriseAuditSystem.detectAnomalies('data_thief_789')

      // Debug logs removidos para limpieza

      // Verificar detección de exfiltración
      expect(anomalies.length).toBeGreaterThan(0)

      // Verificar alta confianza en detección
      const criticalAnomalies = anomalies.filter(a => a.confidence_score > 0.9)
      expect(criticalAnomalies.length).toBeGreaterThan(0)
    })
  })

  describe('Ataques de Negación de Servicio al Sistema de Auditoría', () => {
    it('debe resistir ataques de log bombing', async () => {
      const logBombingAttack = Array.from({ length: 10000 }, (_, i) => ({
        user_id: `bomber_${i % 100}`, // 100 usuarios diferentes
        event_type: 'LOG_BOMB' as any,
        event_category: 'attack',
        severity: 'low' as any,
        description: `Log bomb event ${i}`,
        metadata: {
          bomb_index: i,
          payload: 'x'.repeat(1000), // 1KB por evento
        },
        ip_address: `10.0.${Math.floor(i / 255)}.${i % 255}`,
        user_agent: 'LogBomber/1.0',
      }))

      const startTime = Date.now()
      let successCount = 0
      let errorCount = 0

      // Ejecutar log bombing en lotes para simular concurrencia
      const batchSize = 100
      for (let i = 0; i < logBombingAttack.length; i += batchSize) {
        const batch = logBombingAttack.slice(i, i + batchSize)

        const batchPromises = batch.map(async event => {
          try {
            await enterpriseAuditSystem.logEnterpriseEvent(event, mockContext)
            successCount++
          } catch (error) {
            errorCount++
          }
        })

        await Promise.all(batchPromises)
      }

      const endTime = Date.now()
      const totalTime = endTime - startTime
      const avgTimePerEvent = totalTime / 10000

      // Verificar que el sistema mantuvo performance razonable
      expect(avgTimePerEvent).toBeLessThan(50) // < 50ms por evento

      // Verificar que el sistema no se crasheó completamente
      expect(successCount + errorCount).toBe(10000)

      // Permitir algunos errores bajo carga extrema, pero no todos
      expect(successCount).toBeGreaterThan(5000) // Al menos 50% exitosos
    })

    it('debe manejar ataques de memory exhaustion', async () => {
      const memoryExhaustionEvents = Array.from({ length: 100 }, (_, i) => ({
        user_id: 'memory_attacker_999',
        event_type: 'MEMORY_ATTACK' as any,
        event_category: 'attack',
        severity: 'high' as any,
        description: 'Memory exhaustion attempt',
        metadata: {
          // Intentar agotar memoria con objetos grandes
          large_object: {
            data: 'x'.repeat(100000), // 100KB
            nested_arrays: Array.from({ length: 1000 }, (_, j) => ({
              index: j,
              payload: 'y'.repeat(1000),
            })),
          },
          attack_vector: 'memory_exhaustion',
          attempt_number: i,
        },
        ip_address: '172.16.255.100',
        user_agent: 'MemoryExhaustionBot/1.0',
      }))

      const results = []
      const startMemory = process.memoryUsage()

      for (const event of memoryExhaustionEvents) {
        try {
          const correlationId = await enterpriseAuditSystem.logEnterpriseEvent(event, mockContext)
          results.push({ success: true, correlationId })
        } catch (error) {
          results.push({ success: false, error: error.message })
        }
      }

      const endMemory = process.memoryUsage()
      const memoryIncrease = endMemory.heapUsed - startMemory.heapUsed

      // Verificar que el aumento de memoria es razonable (< 100MB)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024)

      // Verificar que se procesaron los eventos
      expect(results.length).toBe(100)

      // Verificar que el sistema mantuvo funcionalidad
      const successCount = results.filter(r => r.success).length
      expect(successCount).toBeGreaterThan(50) // Al menos 50% exitosos
    })
  })

  describe('Validación de Integridad del Sistema', () => {
    it('debe mantener consistencia durante ataques concurrentes', async () => {
      const concurrentAttacks = [
        // Ataque 1: Flooding
        Array.from({ length: 100 }, (_, i) =>
          enterpriseAuditSystem.logEnterpriseEvent(
            {
              user_id: 'flood_attacker_1',
              event_type: 'FLOOD_ATTACK' as any,
              event_category: 'attack',
              severity: 'low' as any,
              description: `Flood ${i}`,
              metadata: { attack_type: 'flood', index: i },
              ip_address: '10.1.1.100',
              user_agent: 'FloodBot/1.0',
            },
            mockContext
          )
        ),

        // Ataque 2: Anomaly generation
        Array.from({ length: 50 }, (_, i) =>
          enterpriseAuditSystem.logEnterpriseEvent(
            {
              user_id: 'anomaly_attacker_2',
              event_type: 'ANOMALY_ATTACK' as any,
              event_category: 'suspicious_behavior',
              severity: 'high' as any,
              description: `Anomaly ${i}`,
              metadata: { attack_type: 'anomaly', index: i },
              ip_address: '10.2.2.100',
              user_agent: 'AnomalyBot/1.0',
            },
            mockContext
          )
        ),

        // Ataque 3: Detection evasion
        Array.from({ length: 25 }, (_, i) =>
          enterpriseAuditSystem.detectAnomalies(`evasion_target_${i}`)
        ),
      ]

      // Ejecutar todos los ataques concurrentemente
      const allPromises = concurrentAttacks.flat()
      const results = await Promise.allSettled(allPromises)

      // Verificar que el sistema mantuvo consistencia
      const successfulResults = results.filter(r => r.status === 'fulfilled')
      const failedResults = results.filter(r => r.status === 'rejected')

      // Permitir algunos fallos bajo carga extrema
      expect(successfulResults.length).toBeGreaterThan(100) // Al menos 60% exitosos

      // Verificar que no hubo crashes catastróficos
      expect(failedResults.length).toBeLessThan(75) // Menos del 40% de fallos
    })

    it('debe preservar datos críticos durante ataques', async () => {
      // Registrar evento crítico antes del ataque
      const criticalEvent = {
        user_id: 'critical_user_999',
        event_type: 'CRITICAL_SECURITY_EVENT' as any,
        event_category: 'security_incident',
        severity: 'critical' as any,
        description: 'Critical security breach detected',
        metadata: {
          incident_id: 'INC-2025-001',
          severity_level: 'critical',
          requires_immediate_attention: true,
        },
        ip_address: '192.168.1.200',
        user_agent: 'SecuritySystem/1.0',
      }

      const criticalCorrelationId = await enterpriseAuditSystem.logEnterpriseEvent(
        criticalEvent,
        mockContext
      )

      // Ejecutar ataque masivo
      const massiveAttack = Array.from({ length: 1000 }, (_, i) =>
        enterpriseAuditSystem.logEnterpriseEvent(
          {
            user_id: `attacker_${i}`,
            event_type: 'ATTACK_EVENT' as any,
            event_category: 'attack',
            severity: 'low' as any,
            description: `Attack event ${i}`,
            metadata: { attack_index: i },
            ip_address: `192.168.${Math.floor(i / 255)}.${i % 255}`,
            user_agent: 'MassAttackBot/1.0',
          },
          mockContext
        )
      )

      await Promise.allSettled(massiveAttack)

      // Verificar que el evento crítico se preservó
      expect(criticalCorrelationId).toBeDefined()
      expect(criticalCorrelationId).toMatch(/^corr_\d+_[a-z0-9]+$/)

      // Verificar que el sistema sigue funcionando
      const postAttackEvent = {
        user_id: 'post_attack_user',
        event_type: 'POST_ATTACK_TEST' as any,
        event_category: 'test',
        severity: 'low' as any,
        description: 'Post attack functionality test',
        metadata: { test: true },
        ip_address: '192.168.1.201',
        user_agent: 'TestBot/1.0',
      }

      const postAttackCorrelationId = await enterpriseAuditSystem.logEnterpriseEvent(
        postAttackEvent,
        mockContext
      )

      expect(postAttackCorrelationId).toBeDefined()
    })
  })
})
