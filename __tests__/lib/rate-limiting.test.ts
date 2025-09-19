// ===================================
// TESTS: Rate Limiting Middleware
// ===================================

import { NextRequest, NextResponse } from 'next/server';
import { 
  createRateLimiter, 
  withRateLimit, 
  RATE_LIMIT_CONFIGS,
  RateLimitConfig 
} from '@/lib/rate-limiting/rate-limiter';

// Mock de NextRequest
function createMockRequest(ip: string = '127.0.0.1', method: string = 'GET'): NextRequest {
  return {
    ip,
    method,
    headers: new Map([
      ['x-forwarded-for', ip],
      ['user-agent', 'test-agent']
    ]),
    url: 'http://localhost:3000/api/test',
  } as any;
}

describe('Rate Limiting Middleware', () => {
  beforeEach(() => {
    // Limpiar el store de memoria antes de cada test
    jest.clearAllMocks();
  });

  describe('createRateLimiter', () => {
    it('should create a rate limiter with correct configuration', () => {
      const config: RateLimitConfig = {
        windowMs: 60000,
        maxRequests: 10,
        message: 'Rate limit exceeded'
      };

      const limiter = createRateLimiter(config);
      expect(limiter).toBeDefined();
      expect(typeof limiter).toBe('function');
    });

    it('should use default configuration when not provided', () => {
      const limiter = createRateLimiter();
      expect(limiter).toBeDefined();
    });
  });

  describe('withRateLimit', () => {
    it('should allow requests within rate limit', async () => {
      const request = createMockRequest();
      const config: RateLimitConfig = {
        windowMs: 60000,
        maxRequests: 5,
        message: 'Too many requests'
      };

      const mockHandler = jest.fn().mockResolvedValue('success');

      const result = await withRateLimit(request, config, mockHandler);

      expect(mockHandler).toHaveBeenCalled();
      expect(result).toBe('success');
    });

    it('should block requests exceeding rate limit', async () => {
      const request = createMockRequest('192.168.1.1');
      const config: RateLimitConfig = {
        windowMs: 60000,
        maxRequests: 1,
        message: 'Rate limit exceeded'
      };

      const mockHandler = jest.fn().mockResolvedValue('success');

      // Primera request - debería pasar
      const result1 = await withRateLimit(request, config, mockHandler);
      expect(result1).toBe('success');

      // Segunda request - debería ser bloqueada
      const result2 = await withRateLimit(request, config, mockHandler);
      expect(result2).toBeInstanceOf(NextResponse);
      
      if (result2 instanceof NextResponse) {
        expect(result2.status).toBe(429);
      }
    });

    it('should handle different IPs independently', async () => {
      const request1 = createMockRequest('192.168.1.1');
      const request2 = createMockRequest('192.168.1.2');
      const config: RateLimitConfig = {
        windowMs: 60000,
        maxRequests: 1,
        message: 'Rate limit exceeded',
        keyGenerator: (req) => {
          const forwarded = req.headers.get('x-forwarded-for');
          const ip = forwarded ? forwarded.split(',')[0] : req.headers.get('x-real-ip') || 'unknown';
          return `ip:${ip}`;
        }
      };

      const mockHandler = jest.fn().mockResolvedValue('success');

      // Ambas requests deberían pasar ya que son de IPs diferentes
      const result1 = await withRateLimit(request1, config, mockHandler);
      const result2 = await withRateLimit(request2, config, mockHandler);

      expect(result1).toBe('success');
      expect(result2).toBe('success');
      expect(mockHandler).toHaveBeenCalledTimes(2);
    });

    it('should reset rate limit after window expires', async () => {
      const request = createMockRequest('192.168.1.3');
      const config: RateLimitConfig = {
        windowMs: 100, // 100ms window
        maxRequests: 1,
        message: 'Rate limit exceeded'
      };

      const mockHandler = jest.fn().mockResolvedValue('success');

      // Primera request
      const result1 = await withRateLimit(request, config, mockHandler);
      expect(result1).toBe('success');

      // Segunda request inmediata - debería ser bloqueada
      const result2 = await withRateLimit(request, config, mockHandler);
      expect(result2).toBeInstanceOf(NextResponse);

      // Esperar que expire la ventana
      await new Promise(resolve => setTimeout(resolve, 150));

      // Tercera request después de expirar - debería pasar
      const result3 = await withRateLimit(request, config, mockHandler);
      expect(result3).toBe('success');
    });

    it('should handle errors in handler gracefully', async () => {
      const request = createMockRequest();
      const config: RateLimitConfig = {
        windowMs: 60000,
        maxRequests: 5,
        message: 'Too many requests'
      };

      const mockHandler = jest.fn().mockRejectedValue(new Error('Handler error'));

      await expect(withRateLimit(request, config, mockHandler)).rejects.toThrow('Handler error');
    });
  });

  describe('RATE_LIMIT_CONFIGS', () => {
    it('should have all required configurations', () => {
      expect(RATE_LIMIT_CONFIGS.products).toBeDefined();
      expect(RATE_LIMIT_CONFIGS.auth).toBeDefined();
      expect(RATE_LIMIT_CONFIGS.admin).toBeDefined();
      expect(RATE_LIMIT_CONFIGS.creation).toBeDefined();
      expect(RATE_LIMIT_CONFIGS.payment).toBeDefined();
      expect(RATE_LIMIT_CONFIGS.webhook).toBeDefined();
    });

    it('should have valid configuration values', () => {
      Object.values(RATE_LIMIT_CONFIGS).forEach(config => {
        expect(config.windowMs).toBeGreaterThan(0);
        expect(config.maxRequests).toBeGreaterThan(0);
        expect(typeof config.message).toBe('string');
        expect(config.message.length).toBeGreaterThan(0);
      });
    });

    it('should have appropriate limits for different endpoints', () => {
      // Products API debería tener límites más altos (lectura)
      expect(RATE_LIMIT_CONFIGS.products.maxRequests).toBeGreaterThan(
        RATE_LIMIT_CONFIGS.creation.maxRequests
      );

      // Auth debería tener límites más estrictos
      expect(RATE_LIMIT_CONFIGS.auth.maxRequests).toBeLessThan(
        RATE_LIMIT_CONFIGS.products.maxRequests
      );

      // Webhooks deberían tener ventanas más cortas
      expect(RATE_LIMIT_CONFIGS.webhook.windowMs).toBeLessThan(
        RATE_LIMIT_CONFIGS.products.windowMs
      );
    });
  });

  describe('IP extraction', () => {
    it('should extract IP from x-forwarded-for header', async () => {
      const request = {
        method: 'GET',
        headers: new Map([
          ['x-forwarded-for', '203.0.113.1, 198.51.100.1'],
          ['user-agent', 'test-agent']
        ]),
        url: 'http://localhost:3000/api/test',
      } as any;

      const config: RateLimitConfig = {
        windowMs: 60000,
        maxRequests: 1,
        message: 'Rate limit exceeded'
      };

      const mockHandler = jest.fn().mockResolvedValue('success');

      // Primera request
      await withRateLimit(request, config, mockHandler);
      
      // Segunda request con la misma IP debería ser bloqueada
      const result = await withRateLimit(request, config, mockHandler);
      expect(result).toBeInstanceOf(NextResponse);
    });

    it('should fallback to x-real-ip header', async () => {
      const request = {
        method: 'GET',
        headers: new Map([
          ['x-real-ip', '203.0.113.2'],
          ['user-agent', 'test-agent']
        ]),
        url: 'http://localhost:3000/api/test',
      } as any;

      const config: RateLimitConfig = {
        windowMs: 60000,
        maxRequests: 1,
        message: 'Rate limit exceeded'
      };

      const mockHandler = jest.fn().mockResolvedValue('success');

      // Primera request
      await withRateLimit(request, config, mockHandler);
      
      // Segunda request con la misma IP debería ser bloqueada
      const result = await withRateLimit(request, config, mockHandler);
      expect(result).toBeInstanceOf(NextResponse);
    });

    it('should use unknown IP when headers are missing', async () => {
      const request = {
        method: 'GET',
        headers: new Map([
          ['user-agent', 'test-agent']
        ]),
        url: 'http://localhost:3000/api/test',
      } as any;

      const config: RateLimitConfig = {
        windowMs: 60000,
        maxRequests: 1,
        message: 'Rate limit exceeded'
      };

      const mockHandler = jest.fn().mockResolvedValue('success');

      const result = await withRateLimit(request, config, mockHandler);
      expect(result).toBe('success');
    });
  });

  describe('Rate limit response format', () => {
    it('should return proper JSON response when rate limited', async () => {
      const request = createMockRequest('192.168.1.4');
      const config: RateLimitConfig = {
        windowMs: 60000,
        maxRequests: 1,
        message: 'Custom rate limit message',
        headers: true,
        legacyHeaders: true,
        standardHeaders: true
      };

      const mockHandler = jest.fn().mockResolvedValue('success');

      // Primera request
      await withRateLimit(request, config, mockHandler);
      
      // Segunda request - debería ser bloqueada
      const result = await withRateLimit(request, config, mockHandler);
      
      if (result instanceof NextResponse) {
        expect(result.status).toBe(429);

        // Verificar que es una respuesta de rate limit
        const body = await result.text();
        const parsedBody = JSON.parse(body);
        expect(parsedBody.error).toBe('Rate limit exceeded');
        expect(parsedBody.message).toBe('Custom rate limit message');
      }
    });
  });
});
