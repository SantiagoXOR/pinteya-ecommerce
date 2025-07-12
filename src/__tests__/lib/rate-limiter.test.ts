// ===================================
// PINTEYA E-COMMERCE - RATE LIMITER TESTS
// ===================================

import { NextRequest } from 'next/server';
import { 
  checkRateLimit, 
  createRateLimitMiddleware, 
  RATE_LIMIT_CONFIGS,
  endpointKeyGenerator,
  userKeyGenerator 
} from '@/lib/rate-limiter';

// Mock Redis
jest.mock('@/lib/redis', () => ({
  isRedisAvailable: jest.fn().mockResolvedValue(false), // Usar fallback en memoria para tests
  incrementRateLimit: jest.fn(),
  getRateLimitInfo: jest.fn(),
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
  LogLevel: {
    DEBUG: 'debug',
    WARN: 'warn',
    ERROR: 'error',
  },
  LogCategory: {
    SECURITY: 'security',
  },
}));

describe('Rate Limiter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Limpiar memoria entre tests
    const memoryStore = (global as any).memoryStore;
    if (memoryStore) {
      memoryStore.clear();
    }
  });

  describe('checkRateLimit', () => {
    it('should allow requests within limit', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });

      const config = {
        windowMs: 60000,
        maxRequests: 10,
        message: 'Rate limit exceeded',
        standardHeaders: true,
      };

      const result = await checkRateLimit(request, config);

      expect(result.success).toBe(true);
      expect(result.limit).toBe(10);
      expect(result.remaining).toBe(9);
      expect(result.retryAfter).toBeUndefined();
    });

    it('should block requests exceeding limit', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.2' },
      });

      const config = {
        windowMs: 60000,
        maxRequests: 2,
        message: 'Rate limit exceeded',
        standardHeaders: true,
      };

      // Hacer 3 requests (exceder el límite de 2)
      await checkRateLimit(request, config); // 1
      await checkRateLimit(request, config); // 2
      const result = await checkRateLimit(request, config); // 3 - debería fallar

      expect(result.success).toBe(false);
      expect(result.limit).toBe(2);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it('should reset counter after window expires', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.3' },
      });

      const config = {
        windowMs: 100, // 100ms window para test rápido
        maxRequests: 1,
        message: 'Rate limit exceeded',
        standardHeaders: true,
      };

      // Primera request
      const result1 = await checkRateLimit(request, config);
      expect(result1.success).toBe(true);

      // Segunda request inmediata (debería fallar)
      const result2 = await checkRateLimit(request, config);
      expect(result2.success).toBe(false);

      // Esperar que expire la ventana
      await new Promise(resolve => setTimeout(resolve, 150));

      // Tercera request después de expirar (debería pasar)
      const result3 = await checkRateLimit(request, config);
      expect(result3.success).toBe(true);
    });

    it('should use custom key generator', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.4' },
      });

      const customKeyGenerator = jest.fn().mockReturnValue('custom-key');
      const config = {
        windowMs: 60000,
        maxRequests: 5,
        keyGenerator: customKeyGenerator,
        message: 'Rate limit exceeded',
        standardHeaders: true,
      };

      await checkRateLimit(request, config);

      expect(customKeyGenerator).toHaveBeenCalledWith(request);
    });
  });

  describe('Key Generators', () => {
    it('should generate endpoint-specific keys', () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.5' },
      });

      const generator = endpointKeyGenerator('create-preference');
      const key = generator(request);

      expect(key).toBe('rate_limit:endpoint:create-preference:ip:192.168.1.5');
    });

    it('should generate user-specific keys', () => {
      const request = new NextRequest('http://localhost:3000/api/test');
      const generator = userKeyGenerator('user-123');
      const key = generator(request);

      expect(key).toBe('rate_limit:user:user-123');
    });
  });

  describe('Rate Limit Configs', () => {
    it('should have payment API config', () => {
      const config = RATE_LIMIT_CONFIGS.PAYMENT_API;
      
      expect(config.windowMs).toBe(60000);
      expect(config.maxRequests).toBe(10);
      expect(config.message).toContain('pago');
      expect(config.standardHeaders).toBe(true);
    });

    it('should have webhook API config', () => {
      const config = RATE_LIMIT_CONFIGS.WEBHOOK_API;
      
      expect(config.windowMs).toBe(60000);
      expect(config.maxRequests).toBe(100);
      expect(config.message).toContain('webhook');
      expect(config.standardHeaders).toBe(true);
    });

    it('should have authenticated user config', () => {
      const config = RATE_LIMIT_CONFIGS.AUTHENTICATED_USER;
      
      expect(config.windowMs).toBe(60000);
      expect(config.maxRequests).toBe(30);
      expect(config.standardHeaders).toBe(true);
    });

    it('should have general IP config', () => {
      const config = RATE_LIMIT_CONFIGS.GENERAL_IP;
      
      expect(config.windowMs).toBe(60000);
      expect(config.maxRequests).toBe(50);
      expect(config.standardHeaders).toBe(true);
    });

    it('should have query API config', () => {
      const config = RATE_LIMIT_CONFIGS.QUERY_API;
      
      expect(config.windowMs).toBe(60000);
      expect(config.maxRequests).toBe(100);
      expect(config.standardHeaders).toBe(true);
    });
  });

  describe('createRateLimitMiddleware', () => {
    it('should return null for allowed requests', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.6' },
      });

      const config = {
        windowMs: 60000,
        maxRequests: 10,
        message: 'Rate limit exceeded',
        standardHeaders: true,
      };

      const middleware = createRateLimitMiddleware(config);
      const result = await middleware(request);

      expect(result).toBeNull();
    });

    it('should return 429 response for blocked requests', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.7' },
      });

      const config = {
        windowMs: 60000,
        maxRequests: 1,
        message: 'Custom rate limit message',
        standardHeaders: true,
        legacyHeaders: true,
      };

      const middleware = createRateLimitMiddleware(config);
      
      // Primera request (permitida)
      const result1 = await middleware(request);
      expect(result1).toBeNull();

      // Segunda request (bloqueada)
      const result2 = await middleware(request);
      expect(result2).not.toBeNull();
      expect(result2!.status).toBe(429);

      const responseData = await result2!.json();
      expect(responseData.error).toBe('Custom rate limit message');
      expect(responseData.retryAfter).toBeGreaterThan(0);

      // Verificar headers
      expect(result2!.headers.get('RateLimit-Limit')).toBe('1');
      expect(result2!.headers.get('RateLimit-Remaining')).toBe('0');
      expect(result2!.headers.get('X-RateLimit-Limit')).toBe('1');
      expect(result2!.headers.get('Retry-After')).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing IP gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/test');

      const config = {
        windowMs: 60000,
        maxRequests: 10,
        message: 'Rate limit exceeded',
        standardHeaders: true,
      };

      const result = await checkRateLimit(request, config);

      expect(result.success).toBe(true);
      expect(result.limit).toBe(10);
    });
  });
});
