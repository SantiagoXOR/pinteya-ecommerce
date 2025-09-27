/**
 * Tests para el Sistema Enterprise de Caché
 * Verifica funcionalidad básica del sistema de caché inteligente
 */

import {
  enterpriseCacheSystem,
  ENTERPRISE_CACHE_CONFIGS,
  EnterpriseCacheUtils,
} from '@/lib/optimization/enterprise-cache-system'

// Mock de dependencias
jest.mock('@/lib/cache-manager', () => ({
  cacheManager: {
    get: jest.fn(),
    set: jest.fn(),
  },
  CACHE_CONFIGS: {
    SYSTEM_CONFIG: { ttl: 300, prefix: 'system' },
    PRODUCT_DATA: { ttl: 1800, prefix: 'products' },
  },
}))

jest.mock('@/lib/redis', () => ({
  redisCache: {
    del: jest.fn(),
    client: {
      scanStream: jest.fn(),
    },
  },
}))

jest.mock('@/lib/security/enterprise-audit-system', () => ({
  enterpriseAuditSystem: {
    logEnterpriseEvent: jest.fn(),
  },
}))

describe('Sistema Enterprise de Caché', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Configuraciones Predefinidas', () => {
    test('debe tener configuración AUTH_CRITICAL', () => {
      expect(ENTERPRISE_CACHE_CONFIGS.AUTH_CRITICAL).toBeDefined()
      expect(ENTERPRISE_CACHE_CONFIGS.AUTH_CRITICAL.ttl).toBe(300)
      expect(ENTERPRISE_CACHE_CONFIGS.AUTH_CRITICAL.prefix).toBe('auth_critical')
      expect(ENTERPRISE_CACHE_CONFIGS.AUTH_CRITICAL.securityLevel).toBe('critical')
      expect(ENTERPRISE_CACHE_CONFIGS.AUTH_CRITICAL.encryptData).toBe(true)
    })

    test('debe tener configuración PRODUCTS_SMART', () => {
      expect(ENTERPRISE_CACHE_CONFIGS.PRODUCTS_SMART).toBeDefined()
      expect(ENTERPRISE_CACHE_CONFIGS.PRODUCTS_SMART.ttl).toBe(1800)
      expect(ENTERPRISE_CACHE_CONFIGS.PRODUCTS_SMART.prefix).toBe('products_smart')
      expect(ENTERPRISE_CACHE_CONFIGS.PRODUCTS_SMART.enableInvalidation).toBe(true)
      expect(ENTERPRISE_CACHE_CONFIGS.PRODUCTS_SMART.enableWarmup).toBe(true)
    })

    test('debe tener configuración PUBLIC_PERFORMANCE', () => {
      expect(ENTERPRISE_CACHE_CONFIGS.PUBLIC_PERFORMANCE).toBeDefined()
      expect(ENTERPRISE_CACHE_CONFIGS.PUBLIC_PERFORMANCE.ttl).toBe(600)
      expect(ENTERPRISE_CACHE_CONFIGS.PUBLIC_PERFORMANCE.warmupStrategy).toBe('eager')
    })

    test('debe tener configuración USER_SESSIONS', () => {
      expect(ENTERPRISE_CACHE_CONFIGS.USER_SESSIONS).toBeDefined()
      expect(ENTERPRISE_CACHE_CONFIGS.USER_SESSIONS.ttl).toBe(7200)
      expect(ENTERPRISE_CACHE_CONFIGS.USER_SESSIONS.encryptData).toBe(true)
    })

    test('debe tener configuración ANALYTICS_DATA', () => {
      expect(ENTERPRISE_CACHE_CONFIGS.ANALYTICS_DATA).toBeDefined()
      expect(ENTERPRISE_CACHE_CONFIGS.ANALYTICS_DATA.ttl).toBe(900)
      expect(ENTERPRISE_CACHE_CONFIGS.ANALYTICS_DATA.compressionLevel).toBe(8)
    })
  })

  describe('Inicialización del Sistema', () => {
    test('debe inicializar correctamente', async () => {
      await expect(enterpriseCacheSystem.initialize()).resolves.not.toThrow()
    })

    test('debe ser singleton', () => {
      const instance1 = enterpriseCacheSystem
      const instance2 = enterpriseCacheSystem
      expect(instance1).toBe(instance2)
    })
  })

  describe('Operaciones de Caché', () => {
    test('debe obtener métricas del sistema', () => {
      const metrics = enterpriseCacheSystem.getMetrics()
      expect(metrics).toBeDefined()
      expect(typeof metrics).toBe('object')
    })

    test('debe obtener estadísticas de invalidación', () => {
      const stats = enterpriseCacheSystem.getInvalidationStats()
      expect(Array.isArray(stats)).toBe(true)
    })

    test('debe obtener estadísticas de warmup', () => {
      const stats = enterpriseCacheSystem.getWarmupStats()
      expect(Array.isArray(stats)).toBe(true)
    })
  })

  describe('Utilidades de Caché', () => {
    test('EnterpriseCacheUtils debe estar definido', () => {
      expect(EnterpriseCacheUtils).toBeDefined()
      expect(typeof EnterpriseCacheUtils.cacheProductData).toBe('function')
      expect(typeof EnterpriseCacheUtils.cachePublicData).toBe('function')
      expect(typeof EnterpriseCacheUtils.invalidateByPatterns).toBe('function')
    })
  })

  describe('Configuración de Seguridad', () => {
    test('configuraciones críticas deben tener encriptación habilitada', () => {
      const criticalConfigs = [
        ENTERPRISE_CACHE_CONFIGS.AUTH_CRITICAL,
        ENTERPRISE_CACHE_CONFIGS.USER_SESSIONS,
      ]

      criticalConfigs.forEach(config => {
        expect(config.encryptData).toBe(true)
        expect(['critical', 'high']).toContain(config.securityLevel)
      })
    })

    test('configuraciones públicas deben tener seguridad básica', () => {
      const publicConfigs = [
        ENTERPRISE_CACHE_CONFIGS.PUBLIC_PERFORMANCE,
        ENTERPRISE_CACHE_CONFIGS.ANALYTICS_DATA,
      ]

      publicConfigs.forEach(config => {
        expect(['basic', 'standard']).toContain(config.securityLevel)
      })
    })
  })

  describe('Configuración de Performance', () => {
    test('configuraciones deben tener TTL apropiados', () => {
      // Auth crítica: TTL corto para seguridad
      expect(ENTERPRISE_CACHE_CONFIGS.AUTH_CRITICAL.ttl).toBeLessThanOrEqual(300)

      // Productos: TTL medio para balance
      expect(ENTERPRISE_CACHE_CONFIGS.PRODUCTS_SMART.ttl).toBeGreaterThan(300)
      expect(ENTERPRISE_CACHE_CONFIGS.PRODUCTS_SMART.ttl).toBeLessThanOrEqual(1800)

      // Sesiones: TTL largo para UX
      expect(ENTERPRISE_CACHE_CONFIGS.USER_SESSIONS.ttl).toBeGreaterThan(1800)
    })

    test('configuraciones deben tener compresión apropiada', () => {
      // Datos críticos: compresión alta
      expect(ENTERPRISE_CACHE_CONFIGS.AUTH_CRITICAL.compressionLevel).toBeGreaterThanOrEqual(9)

      // Analytics: compresión alta para volumen
      expect(ENTERPRISE_CACHE_CONFIGS.ANALYTICS_DATA.compressionLevel).toBeGreaterThanOrEqual(8)

      // Performance público: compresión baja para velocidad
      expect(ENTERPRISE_CACHE_CONFIGS.PUBLIC_PERFORMANCE.compressionLevel).toBeLessThanOrEqual(3)
    })
  })

  describe('Estrategias de Warmup', () => {
    test('configuraciones deben tener estrategias de warmup apropiadas', () => {
      expect(ENTERPRISE_CACHE_CONFIGS.PRODUCTS_SMART.warmupStrategy).toBe('scheduled')
      expect(ENTERPRISE_CACHE_CONFIGS.PUBLIC_PERFORMANCE.warmupStrategy).toBe('eager')
      expect(ENTERPRISE_CACHE_CONFIGS.ANALYTICS_DATA.warmupStrategy).toBe('lazy')
    })

    test('configuraciones con warmup deben tener intervalos definidos', () => {
      const warmupConfigs = Object.values(ENTERPRISE_CACHE_CONFIGS).filter(
        config => config.enableWarmup
      )

      warmupConfigs.forEach(config => {
        if (config.warmupStrategy === 'scheduled') {
          expect(config.warmupInterval).toBeDefined()
          expect(config.warmupInterval).toBeGreaterThan(0)
        }
      })
    })
  })

  describe('Políticas de Eviction', () => {
    test('configuraciones deben tener políticas de eviction apropiadas', () => {
      // Auth crítica: TTL para seguridad
      expect(ENTERPRISE_CACHE_CONFIGS.AUTH_CRITICAL.evictionPolicy).toBe('ttl')

      // Productos: LRU para acceso frecuente
      expect(ENTERPRISE_CACHE_CONFIGS.PRODUCTS_SMART.evictionPolicy).toBe('lru')

      // Performance: LFU para datos populares
      expect(ENTERPRISE_CACHE_CONFIGS.PUBLIC_PERFORMANCE.evictionPolicy).toBe('lfu')
    })
  })
})
