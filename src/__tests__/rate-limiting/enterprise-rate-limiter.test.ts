/**
 * Tests para Sistema Enterprise de Rate Limiting
 * Valida funcionalidad completa del rate limiting con Redis y fallback en memoria
 */

// Mock de Redis
jest.mock('@/lib/redis', () => ({
  isRedisAvailable: jest.fn(),
  enterpriseRateLimit: jest.fn(),
  redis: {
    pipeline: jest.fn(() => ({
      incr: jest.fn(),
      expire: jest.fn(),
      exec: jest.fn()
    })),
    ping: jest.fn()
  }
}));

import { NextRequest } from 'next/server';
import {
  checkEnterpriseRateLimit,
  ENTERPRISE_RATE_LIMIT_CONFIGS,
  ipKeyGenerator,
  userKeyGenerator,
  endpointKeyGenerator,
  hybridKeyGenerator,
  memoryStore,
  metricsCollector
} from '@/lib/rate-limiting/enterprise-rate-limiter';
import { isRedisAvailable, enterpriseRateLimit } from '@/lib/redis';

describe('Sistema Enterprise de Rate Limiting', () => {
  let mockIsRedisAvailable: jest.MockedFunction<typeof isRedisAvailable>;
  let mockEnterpriseRateLimit: jest.MockedFunction<typeof enterpriseRateLimit>;

  beforeEach(() => {
    mockIsRedisAvailable = isRedisAvailable as jest.MockedFunction<typeof isRedisAvailable>;
    mockEnterpriseRateLimit = enterpriseRateLimit as jest.MockedFunction<typeof enterpriseRateLimit>;

    jest.clearAllMocks();

    // Reset memory store
    memoryStore.clear();

    // Reset métricas
    metricsCollector.reset();

    // Configurar mocks por defecto
    mockIsRedisAvailable.mockResolvedValue(false); // Por defecto usar memoria
    mockEnterpriseRateLimit.mockResolvedValue({
      allowed: true,
      count: 1,
      remaining: 49,
      resetTime: Date.now() + 300000
    });
  });

  describe('Configuraciones Predefinidas', () => {
    it('debe tener configuración para autenticación crítica', () => {
      const config = ENTERPRISE_RATE_LIMIT_CONFIGS.CRITICAL_AUTH;
      
      expect(config.windowMs).toBe(15 * 60 * 1000); // 15 minutos
      expect(config.maxRequests).toBe(3);
      expect(config.enableRedis).toBe(true);
      expect(config.enableMetrics).toBe(true);
      expect(config.message).toContain('crítica');
    });

    it('debe tener configuración para APIs admin', () => {
      const config = ENTERPRISE_RATE_LIMIT_CONFIGS.ADMIN_API;
      
      expect(config.windowMs).toBe(5 * 60 * 1000); // 5 minutos
      expect(config.maxRequests).toBe(50);
      expect(config.enableRedis).toBe(true);
      expect(config.enableMetrics).toBe(true);
    });

    it('debe tener configuración para APIs de pagos', () => {
      const config = ENTERPRISE_RATE_LIMIT_CONFIGS.PAYMENT_API;
      
      expect(config.windowMs).toBe(10 * 60 * 1000); // 10 minutos
      expect(config.maxRequests).toBe(15);
      expect(config.enableRedis).toBe(true);
      expect(config.onLimitReached).toBeDefined();
    });

    it('debe tener configuración para APIs públicas', () => {
      const config = ENTERPRISE_RATE_LIMIT_CONFIGS.PUBLIC_API;
      
      expect(config.windowMs).toBe(1 * 60 * 1000); // 1 minuto
      expect(config.maxRequests).toBe(100);
      expect(config.enableLogging).toBe(false);
    });
  });

  describe('Generadores de Claves', () => {
    const mockRequest = {
      headers: new Map([
        ['x-forwarded-for', '192.168.1.1'],
        ['x-clerk-user-id', 'user_123']
      ]),
      nextUrl: { pathname: '/api/test' }
    } as any;

    it('debe generar clave por IP', () => {
      const key = ipKeyGenerator(mockRequest);
      expect(key).toBe('ip:192.168.1.1');
    });

    it('debe generar clave por usuario', () => {
      const key = userKeyGenerator(mockRequest);
      expect(key).toBe('user:user_123');
    });

    it('debe generar clave por endpoint', () => {
      const key = endpointKeyGenerator(mockRequest);
      expect(key).toBe('endpoint:192.168.1.1:/api/test');
    });

    it('debe generar clave híbrida', () => {
      const key = hybridKeyGenerator(mockRequest);
      expect(key).toBe('user:user_123:/api/test');
    });

    it('debe usar IP como fallback cuando no hay usuario', () => {
      const requestWithoutUser = {
        headers: new Map([['x-forwarded-for', '192.168.1.1']]),
        nextUrl: { pathname: '/api/test' }
      } as any;

      const key = userKeyGenerator(requestWithoutUser);
      expect(key).toBe('ip:192.168.1.1');
    });
  });

  describe('Rate Limiting con Redis', () => {
    it('debe usar Redis cuando está disponible', async () => {
      // Configurar Redis como disponible
      mockIsRedisAvailable.mockResolvedValue(true);
      mockEnterpriseRateLimit.mockResolvedValue({
        allowed: true,
        count: 1,
        remaining: 49,
        resetTime: Date.now() + 300000
      });

      const mockRequest = {
        headers: new Map([['x-forwarded-for', '192.168.1.1']]),
        nextUrl: { pathname: '/api/test' }
      } as any;

      const result = await checkEnterpriseRateLimit(mockRequest, 'ADMIN_API');

      expect(result.allowed).toBe(true);
      expect(result.source).toBe('redis');
      expect(mockIsRedisAvailable).toHaveBeenCalled();
      expect(mockEnterpriseRateLimit).toHaveBeenCalled();
    });

    it('debe usar fallback en memoria cuando Redis no está disponible', async () => {
      // Redis no disponible (configuración por defecto)
      mockIsRedisAvailable.mockResolvedValue(false);

      const mockRequest = {
        headers: new Map([['x-forwarded-for', '192.168.1.1']]),
        nextUrl: { pathname: '/api/test' }
      } as any;

      const result = await checkEnterpriseRateLimit(mockRequest, 'ADMIN_API');

      expect(result.allowed).toBe(true);
      expect(result.source).toBe('memory');
      expect(mockIsRedisAvailable).toHaveBeenCalled();
      expect(mockEnterpriseRateLimit).not.toHaveBeenCalled();
    });

    it('debe manejar errores de Redis y usar fallback', async () => {
      // Redis disponible pero con error
      mockIsRedisAvailable.mockResolvedValue(true);
      mockEnterpriseRateLimit.mockRejectedValue(new Error('Redis error'));

      const mockRequest = {
        headers: new Map([['x-forwarded-for', '192.168.1.1']]),
        nextUrl: { pathname: '/api/test' }
      } as any;

      const result = await checkEnterpriseRateLimit(mockRequest, 'ADMIN_API');

      expect(result.allowed).toBe(true);
      expect(result.source).toBe('memory');
    });
  });

  describe('Rate Limiting en Memoria', () => {
    beforeEach(() => {
      mockIsRedisAvailable.mockResolvedValue(false);
    });

    it('debe permitir primera request', async () => {
      const mockRequest = {
        headers: new Map([['x-forwarded-for', '192.168.1.1']]),
        nextUrl: { pathname: '/api/test' }
      } as any;

      const result = await checkEnterpriseRateLimit(mockRequest, 'ADMIN_API');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(49); // 50 - 1
      expect(result.source).toBe('memory');
    });

    it('debe incrementar contador en requests subsecuentes', async () => {
      const mockRequest = {
        headers: new Map([['x-forwarded-for', '192.168.1.1']]),
        nextUrl: { pathname: '/api/test' }
      } as any;

      // Primera request
      const result1 = await checkEnterpriseRateLimit(mockRequest, 'ADMIN_API');
      expect(result1.remaining).toBe(49);

      // Segunda request
      const result2 = await checkEnterpriseRateLimit(mockRequest, 'ADMIN_API');
      expect(result2.remaining).toBe(48);
    });

    it('debe bloquear cuando se excede el límite', async () => {
      const mockRequest = {
        headers: new Map([['x-forwarded-for', '192.168.1.2']]),
        nextUrl: { pathname: '/api/test' }
      } as any;

      // Hacer 3 requests (límite para CRITICAL_AUTH)
      for (let i = 0; i < 3; i++) {
        const result = await checkEnterpriseRateLimit(mockRequest, 'CRITICAL_AUTH');
        expect(result.allowed).toBe(true);
      }

      // Cuarta request debe ser bloqueada
      const result = await checkEnterpriseRateLimit(mockRequest, 'CRITICAL_AUTH');
      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBeDefined();
    });

    it('debe resetear contador después de la ventana', async () => {
      const mockRequest = {
        headers: new Map([['x-forwarded-for', '192.168.1.3']]),
        nextUrl: { pathname: '/api/test' }
      } as any;

      // Configuración con ventana muy corta para testing
      const customConfig = { windowMs: 100 }; // 100ms

      // Primera request
      const result1 = await checkEnterpriseRateLimit(mockRequest, 'ADMIN_API', customConfig);
      expect(result1.allowed).toBe(true);

      // Esperar que expire la ventana
      await new Promise(resolve => setTimeout(resolve, 150));

      // Nueva request después de expiración
      const result2 = await checkEnterpriseRateLimit(mockRequest, 'ADMIN_API', customConfig);
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(49); // Contador reseteado
    });
  });

  describe('Métricas y Logging', () => {
    beforeEach(() => {
      mockIsRedisAvailable.mockResolvedValue(false);
    });

    it('debe registrar métricas cuando está habilitado', async () => {
      const mockRequest = {
        headers: new Map([['x-forwarded-for', '192.168.1.4']]),
        nextUrl: { pathname: '/api/test' }
      } as any;

      await checkEnterpriseRateLimit(mockRequest, 'ADMIN_API');

      const metrics = metricsCollector.getMetrics();
      expect(metrics.totalRequests).toBe(1);
      expect(metrics.allowedRequests).toBe(1);
      expect(metrics.memoryFallbacks).toBe(1);
    });

    it('debe registrar requests bloqueadas en métricas', async () => {
      const mockRequest = {
        headers: new Map([['x-forwarded-for', '192.168.1.5']]),
        nextUrl: { pathname: '/api/test' }
      } as any;

      // Exceder límite
      for (let i = 0; i < 4; i++) {
        await checkEnterpriseRateLimit(mockRequest, 'CRITICAL_AUTH');
      }

      const metrics = metricsCollector.getMetrics();
      expect(metrics.totalRequests).toBe(4);
      expect(metrics.allowedRequests).toBe(3);
      expect(metrics.blockedRequests).toBe(1);
    });

    it('debe incluir métricas de tiempo de respuesta', async () => {
      const mockRequest = {
        headers: new Map([['x-forwarded-for', '192.168.1.6']]),
        nextUrl: { pathname: '/api/test' }
      } as any;

      const result = await checkEnterpriseRateLimit(mockRequest, 'ADMIN_API');

      expect(result.metrics).toBeDefined();
      expect(result.metrics?.responseTime).toBeGreaterThanOrEqual(0); // Puede ser 0 en tests rápidos
      expect(result.metrics?.keyGenerated).toBeDefined();
      expect(typeof result.metrics?.responseTime).toBe('number');
    });
  });

  describe('Configuraciones Personalizadas', () => {
    beforeEach(() => {
      mockIsRedisAvailable.mockResolvedValue(false);
    });

    it('debe aplicar configuración personalizada', async () => {
      const mockRequest = {
        headers: new Map([['x-forwarded-for', '192.168.1.7']]),
        nextUrl: { pathname: '/api/test' }
      } as any;

      const customConfig = {
        maxRequests: 2,
        windowMs: 60000
      };

      // Primera y segunda request deben pasar
      const result1 = await checkEnterpriseRateLimit(mockRequest, 'ADMIN_API', customConfig);
      expect(result1.allowed).toBe(true);

      const result2 = await checkEnterpriseRateLimit(mockRequest, 'ADMIN_API', customConfig);
      expect(result2.allowed).toBe(true);

      // Tercera request debe ser bloqueada
      const result3 = await checkEnterpriseRateLimit(mockRequest, 'ADMIN_API', customConfig);
      expect(result3.allowed).toBe(false);
    });

    it('debe usar generador de clave personalizado', async () => {
      const mockRequest = {
        headers: new Map([['x-forwarded-for', '192.168.1.8']]),
        nextUrl: { pathname: '/api/test' }
      } as any;

      const customConfig = {
        keyGenerator: () => 'custom_key'
      };

      const result = await checkEnterpriseRateLimit(mockRequest, 'ADMIN_API', customConfig);
      expect(result.allowed).toBe(true);
      expect(result.metrics?.keyGenerated).toBe('custom_key');
    });
  });

  describe('Manejo de Errores', () => {
    it('debe manejar configuración no encontrada', async () => {
      const mockRequest = {
        headers: new Map([['x-forwarded-for', '192.168.1.9']]),
        nextUrl: { pathname: '/api/test' }
      } as any;

      const result = await checkEnterpriseRateLimit(mockRequest, 'INVALID_CONFIG' as any);

      expect(result.allowed).toBe(true);
      expect(result.error).toContain('no encontrada');
      expect(result.code).toBe('CONFIG_NOT_FOUND');
      expect(result.source).toBe('error');
    });

    it('debe permitir requests en caso de error interno', async () => {
      mockIsRedisAvailable.mockRejectedValue(new Error('Internal error'));

      const mockRequest = {
        headers: new Map([['x-forwarded-for', '192.168.1.10']]),
        nextUrl: { pathname: '/api/test' }
      } as any;

      const result = await checkEnterpriseRateLimit(mockRequest, 'ADMIN_API');

      expect(result.allowed).toBe(true);
      expect(result.error).toContain('Error interno');
      expect(result.code).toBe('INTERNAL_ERROR');
      expect(result.source).toBe('error');
    });
  });

  describe('Store en Memoria', () => {
    it('debe proporcionar estadísticas del store', () => {
      const stats = memoryStore.getStats();
      
      expect(stats).toHaveProperty('entries');
      expect(stats).toHaveProperty('memoryUsage');
      expect(typeof stats.entries).toBe('number');
      expect(typeof stats.memoryUsage).toBe('number');
    });

    it('debe limpiar entradas expiradas', async () => {
      const mockRequest = {
        headers: new Map([['x-forwarded-for', '192.168.1.11']]),
        nextUrl: { pathname: '/api/test' }
      } as any;

      // Crear entrada con TTL muy corto
      await checkEnterpriseRateLimit(mockRequest, 'ADMIN_API', { windowMs: 50 });

      // Esperar expiración
      await new Promise(resolve => setTimeout(resolve, 100));

      // Nueva request debería crear nueva entrada
      const result = await checkEnterpriseRateLimit(mockRequest, 'ADMIN_API', { windowMs: 60000 });
      expect(result.remaining).toBe(49); // Contador reseteado
    });
  });
});
