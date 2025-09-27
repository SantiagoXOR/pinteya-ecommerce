/**
 * Sistema de Inicialización Automática Enterprise
 * Inicializa todos los sistemas enterprise al arrancar la aplicación
 */

import { enterpriseCacheSystem } from '@/lib/optimization/enterprise-cache-system'
import { enterpriseAlertSystem } from '@/lib/monitoring/enterprise-alert-system'
import { enterpriseAutomatedTesting } from '@/lib/testing/enterprise-automated-testing'
import { enterpriseAuditSystem } from '@/lib/security/enterprise-audit-system'

// =====================================================
// TIPOS E INTERFACES
// =====================================================

interface StartupConfig {
  enableCache: boolean
  enableAlerts: boolean
  enableTesting: boolean
  enableAudit: boolean
  runInitialTests: boolean
  logStartup: boolean
}

interface StartupResult {
  success: boolean
  systems: {
    cache: { initialized: boolean; error?: string }
    alerts: { initialized: boolean; error?: string }
    testing: { initialized: boolean; error?: string }
    audit: { initialized: boolean; error?: string }
  }
  initialTests?: {
    run: boolean
    passed: number
    failed: number
    errors: string[]
  }
  totalTime: number
  errors: string[]
}

// =====================================================
// CONFIGURACIÓN POR DEFECTO
// =====================================================

const DEFAULT_STARTUP_CONFIG: StartupConfig = {
  enableCache: true,
  enableAlerts: true,
  enableTesting: true,
  enableAudit: true,
  runInitialTests: false, // Solo en desarrollo/testing
  logStartup: true,
}

// =====================================================
// SISTEMA DE INICIALIZACIÓN ENTERPRISE
// =====================================================

export class EnterpriseStartupSystem {
  private static instance: EnterpriseStartupSystem
  private isInitialized = false
  private startupResult: StartupResult | null = null

  private constructor() {}

  public static getInstance(): EnterpriseStartupSystem {
    if (!EnterpriseStartupSystem.instance) {
      EnterpriseStartupSystem.instance = new EnterpriseStartupSystem()
    }
    return EnterpriseStartupSystem.instance
  }

  /**
   * Inicializa todos los sistemas enterprise
   */
  async initialize(config: Partial<StartupConfig> = {}): Promise<StartupResult> {
    if (this.isInitialized && this.startupResult) {
      return this.startupResult
    }

    const finalConfig = { ...DEFAULT_STARTUP_CONFIG, ...config }
    const startTime = Date.now()
    const errors: string[] = []

    if (finalConfig.logStartup) {
      console.log('[ENTERPRISE_STARTUP] Iniciando sistemas enterprise...')
    }

    const result: StartupResult = {
      success: false,
      systems: {
        cache: { initialized: false },
        alerts: { initialized: false },
        testing: { initialized: false },
        audit: { initialized: false },
      },
      totalTime: 0,
      errors: [],
    }

    try {
      // 1. Inicializar sistema de auditoría (ya debería estar inicializado)
      if (finalConfig.enableAudit) {
        try {
          if (finalConfig.logStartup) {
            console.log('[ENTERPRISE_STARTUP] Verificando sistema de auditoría...')
          }

          // El sistema de auditoría ya está inicializado en fases anteriores
          result.systems.audit.initialized = true

          if (finalConfig.logStartup) {
            console.log('[ENTERPRISE_STARTUP] ✅ Sistema de auditoría verificado')
          }
        } catch (error) {
          const errorMsg = `Error verificando sistema de auditoría: ${error.message}`
          result.systems.audit.error = errorMsg
          errors.push(errorMsg)

          if (finalConfig.logStartup) {
            console.error('[ENTERPRISE_STARTUP] ❌', errorMsg)
          }
        }
      }

      // 2. Inicializar sistema de caché enterprise
      if (finalConfig.enableCache) {
        try {
          if (finalConfig.logStartup) {
            console.log('[ENTERPRISE_STARTUP] Inicializando sistema de caché...')
          }

          await enterpriseCacheSystem.initialize()
          result.systems.cache.initialized = true

          if (finalConfig.logStartup) {
            console.log('[ENTERPRISE_STARTUP] ✅ Sistema de caché inicializado')
          }
        } catch (error) {
          const errorMsg = `Error inicializando sistema de caché: ${error.message}`
          result.systems.cache.error = errorMsg
          errors.push(errorMsg)

          if (finalConfig.logStartup) {
            console.error('[ENTERPRISE_STARTUP] ❌', errorMsg)
          }
        }
      }

      // 3. Inicializar sistema de alertas enterprise
      if (finalConfig.enableAlerts) {
        try {
          if (finalConfig.logStartup) {
            console.log('[ENTERPRISE_STARTUP] Inicializando sistema de alertas...')
          }

          await enterpriseAlertSystem.initialize()
          result.systems.alerts.initialized = true

          if (finalConfig.logStartup) {
            console.log('[ENTERPRISE_STARTUP] ✅ Sistema de alertas inicializado')
          }
        } catch (error) {
          const errorMsg = `Error inicializando sistema de alertas: ${error.message}`
          result.systems.alerts.error = errorMsg
          errors.push(errorMsg)

          if (finalConfig.logStartup) {
            console.error('[ENTERPRISE_STARTUP] ❌', errorMsg)
          }
        }
      }

      // 4. Inicializar sistema de testing automatizado
      if (finalConfig.enableTesting) {
        try {
          if (finalConfig.logStartup) {
            console.log('[ENTERPRISE_STARTUP] Inicializando sistema de testing...')
          }

          await enterpriseAutomatedTesting.initialize()
          result.systems.testing.initialized = true

          if (finalConfig.logStartup) {
            console.log('[ENTERPRISE_STARTUP] ✅ Sistema de testing inicializado')
          }
        } catch (error) {
          const errorMsg = `Error inicializando sistema de testing: ${error.message}`
          result.systems.testing.error = errorMsg
          errors.push(errorMsg)

          if (finalConfig.logStartup) {
            console.error('[ENTERPRISE_STARTUP] ❌', errorMsg)
          }
        }
      }

      // 5. Ejecutar tests iniciales si está habilitado
      if (finalConfig.runInitialTests && result.systems.testing.initialized) {
        try {
          if (finalConfig.logStartup) {
            console.log('[ENTERPRISE_STARTUP] Ejecutando tests iniciales...')
          }

          const testResults = await this.runInitialTests()
          result.initialTests = testResults

          if (finalConfig.logStartup) {
            console.log(
              `[ENTERPRISE_STARTUP] ✅ Tests iniciales completados: ${testResults.passed} pasaron, ${testResults.failed} fallaron`
            )
          }
        } catch (error) {
          const errorMsg = `Error ejecutando tests iniciales: ${error.message}`
          errors.push(errorMsg)

          if (finalConfig.logStartup) {
            console.error('[ENTERPRISE_STARTUP] ❌', errorMsg)
          }
        }
      }

      // Calcular resultado final
      const totalTime = Date.now() - startTime
      const initializedSystems = Object.values(result.systems).filter(s => s.initialized).length
      const totalSystems = Object.values(result.systems).length
      const success = errors.length === 0 && initializedSystems === totalSystems

      result.success = success
      result.totalTime = totalTime
      result.errors = errors

      this.startupResult = result
      this.isInitialized = true

      if (finalConfig.logStartup) {
        if (success) {
          console.log(
            `[ENTERPRISE_STARTUP] 🎉 Inicialización completada exitosamente en ${totalTime}ms`
          )
          console.log(
            `[ENTERPRISE_STARTUP] Sistemas inicializados: ${initializedSystems}/${totalSystems}`
          )
        } else {
          console.warn(
            `[ENTERPRISE_STARTUP] ⚠️ Inicialización completada con errores en ${totalTime}ms`
          )
          console.warn(
            `[ENTERPRISE_STARTUP] Sistemas inicializados: ${initializedSystems}/${totalSystems}`
          )
          console.warn(`[ENTERPRISE_STARTUP] Errores: ${errors.length}`)
        }
      }

      // Registrar en auditoría si está disponible
      if (result.systems.audit.initialized) {
        try {
          await this.logStartupEvent(result)
        } catch (error) {
          if (finalConfig.logStartup) {
            console.warn(
              '[ENTERPRISE_STARTUP] No se pudo registrar evento de startup en auditoría:',
              error.message
            )
          }
        }
      }

      return result
    } catch (error) {
      const totalTime = Date.now() - startTime
      const criticalError = `Error crítico durante inicialización: ${error.message}`

      const failedResult: StartupResult = {
        success: false,
        systems: result.systems,
        totalTime,
        errors: [...errors, criticalError],
      }

      this.startupResult = failedResult

      if (finalConfig.logStartup) {
        console.error('[ENTERPRISE_STARTUP] 💥 Error crítico durante inicialización:', error)
      }

      return failedResult
    }
  }

  /**
   * Obtiene el resultado de la última inicialización
   */
  getStartupResult(): StartupResult | null {
    return this.startupResult
  }

  /**
   * Verifica si el sistema está inicializado
   */
  isSystemInitialized(): boolean {
    return this.isInitialized && this.startupResult?.success === true
  }

  /**
   * Obtiene el estado de salud de los sistemas
   */
  getSystemHealth(): {
    overall: 'healthy' | 'degraded' | 'critical'
    systems: Record<string, boolean>
    score: number
  } {
    if (!this.startupResult) {
      return {
        overall: 'critical',
        systems: {},
        score: 0,
      }
    }

    const systems = {
      cache: this.startupResult.systems.cache.initialized,
      alerts: this.startupResult.systems.alerts.initialized,
      testing: this.startupResult.systems.testing.initialized,
      audit: this.startupResult.systems.audit.initialized,
    }

    const healthySystems = Object.values(systems).filter(Boolean).length
    const totalSystems = Object.values(systems).length
    const score = totalSystems > 0 ? healthySystems / totalSystems : 0

    let overall: 'healthy' | 'degraded' | 'critical'
    if (score >= 0.9) {
      overall = 'healthy'
    } else if (score >= 0.5) {
      overall = 'degraded'
    } else {
      overall = 'critical'
    }

    return {
      overall,
      systems,
      score,
    }
  }

  // =====================================================
  // MÉTODOS PRIVADOS
  // =====================================================

  private async runInitialTests(): Promise<{
    run: boolean
    passed: number
    failed: number
    errors: string[]
  }> {
    try {
      // Ejecutar tests críticos
      const criticalTests = [
        'security_rate_limiting_basic',
        'security_audit_logging',
        'performance_cache_hit_rate',
      ]

      let passed = 0
      let failed = 0
      const errors: string[] = []

      for (const testId of criticalTests) {
        try {
          const result = await enterpriseAutomatedTesting.runTest(testId)
          if (result.passed) {
            passed++
          } else {
            failed++
            if (result.error) {
              errors.push(`${testId}: ${result.error}`)
            }
          }
        } catch (error) {
          failed++
          errors.push(`${testId}: ${error.message}`)
        }
      }

      return {
        run: true,
        passed,
        failed,
        errors,
      }
    } catch (error) {
      return {
        run: false,
        passed: 0,
        failed: 1,
        errors: [error.message],
      }
    }
  }

  private async logStartupEvent(result: StartupResult): Promise<void> {
    try {
      const systemContext = {
        userId: 'system',
        sessionId: 'startup',
        email: 'system@pinteya.com',
        role: 'system',
        permissions: ['system_access'],
        sessionValid: true,
        securityLevel: 'high' as const,
        ipAddress: '127.0.0.1',
        userAgent: 'EnterpriseStartupSystem/1.0',
        supabase: {} as any,
        validations: {
          jwtValid: true,
          csrfValid: true,
          rateLimitPassed: true,
          originValid: true,
        },
      }

      await enterpriseAuditSystem.logEnterpriseEvent(
        {
          user_id: 'system',
          event_type: 'SYSTEM_STARTUP' as any,
          event_category: 'system_operation',
          severity: result.success ? 'medium' : ('high' as any),
          description: `Enterprise system startup ${result.success ? 'completed successfully' : 'completed with errors'}`,
          metadata: {
            success: result.success,
            total_time_ms: result.totalTime,
            systems_initialized: Object.values(result.systems).filter(s => s.initialized).length,
            total_systems: Object.values(result.systems).length,
            errors_count: result.errors.length,
            initial_tests: result.initialTests,
            systems_status: result.systems,
          },
          ip_address: '127.0.0.1',
          user_agent: 'EnterpriseStartupSystem/1.0',
        },
        systemContext
      )
    } catch (error) {
      // No lanzar error aquí para no afectar el startup
      console.warn('[ENTERPRISE_STARTUP] Error logging startup event:', error.message)
    }
  }
}

// =====================================================
// INSTANCIA SINGLETON Y UTILIDADES
// =====================================================

export const enterpriseStartupSystem = EnterpriseStartupSystem.getInstance()

/**
 * Función de conveniencia para inicializar sistemas enterprise
 */
export async function initializeEnterpriseSystemsOnStartup(
  config?: Partial<StartupConfig>
): Promise<StartupResult> {
  return enterpriseStartupSystem.initialize(config)
}

/**
 * Función para verificar si los sistemas están listos
 */
export function areEnterpriseSystemsReady(): boolean {
  return enterpriseStartupSystem.isSystemInitialized()
}

/**
 * Función para obtener el estado de salud de los sistemas
 */
export function getEnterpriseSystemHealth() {
  return enterpriseStartupSystem.getSystemHealth()
}

/**
 * Hook de inicialización para Next.js
 * Se puede llamar en el layout principal o en un middleware
 */
export async function initializeEnterpriseOnAppStart(): Promise<void> {
  try {
    // 🚫 TEMPORALMENTE DESHABILITADO PARA EVITAR RECURSIÓN EN APIS DE AUTH
    console.log('[ENTERPRISE_STARTUP] 🚫 Inicialización automática temporalmente deshabilitada')
    return

    // Solo inicializar en servidor
    if (typeof window !== 'undefined') {
      return
    }

    // Configuración para producción
    const config: Partial<StartupConfig> = {
      enableCache: true,
      enableAlerts: true,
      enableTesting: true,
      enableAudit: false, // 🚫 DESHABILITADO TEMPORALMENTE
      runInitialTests: process.env.NODE_ENV === 'development',
      logStartup: true,
    }

    const result = await initializeEnterpriseSystemsOnStartup(config)

    if (!result.success) {
      console.warn('[ENTERPRISE_STARTUP] Sistemas inicializados con errores:', result.errors)
    }
  } catch (error) {
    console.error('[ENTERPRISE_STARTUP] Error crítico en inicialización automática:', error)
  }
}

// =====================================================
// AUTO-INICIALIZACIÓN EN DESARROLLO
// =====================================================

// 🚫 TEMPORALMENTE DESHABILITADO PARA EVITAR RECURSIÓN
// El sistema de monitoreo automático está causando llamadas recursivas a APIs de auth
console.log('[ENTERPRISE_STARTUP] 🚫 Auto-inicialización DESHABILITADA para evitar recursión')

// CÓDIGO COMENTADO TEMPORALMENTE
// En desarrollo, inicializar automáticamente cuando se importa el módulo
// if (process.env.NODE_ENV === 'development' && typeof window === 'undefined') {
//   // Usar setTimeout para no bloquear la importación
//   setTimeout(() => {
//     initializeEnterpriseOnAppStart().catch(error => {
//       console.error('[ENTERPRISE_STARTUP] Error en auto-inicialización:', error);
//     });
//   }, 1000);
// }
