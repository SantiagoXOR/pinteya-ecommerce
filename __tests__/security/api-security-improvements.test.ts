// ===================================
// TESTS DE MEJORAS DE SEGURIDAD EN APIs
// ===================================
// Verificar que las mejoras de seguridad se aplicaron correctamente

import { NextRequest } from 'next/server';

// Mock de las dependencias
jest.mock('@/lib/rate-limiting/rate-limiter', () => ({
  withRateLimit: jest.fn(),
  RATE_LIMIT_CONFIGS: {
    products: { maxRequests: 100, windowMs: 60000 },
    checkout: { maxRequests: 50, windowMs: 60000 },
    search: { maxRequests: 200, windowMs: 60000 },
    auth: { maxRequests: 30, windowMs: 60000 }
  }
}));

jest.mock('@/lib/config/api-timeouts', () => ({
  API_TIMEOUTS: {
    database: 5000,
    external: 10000
  },
  withDatabaseTimeout: jest.fn(),
  getEndpointTimeouts: jest.fn()
}));

jest.mock('@/lib/logging/security-logger', () => ({
  createSecurityLogger: jest.fn(() => ({
    logEvent: jest.fn(),
    logRateLimitExceeded: jest.fn(),
    context: { ip: '127.0.0.1', userAgent: 'test' }
  }))
}));

jest.mock('@/lib/supabase', () => ({
  getSupabaseClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        order: jest.fn(() => ({
          data: [],
          error: null
        }))
      }))
    }))
  }))
}));

describe('API Security Improvements', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rate Limiting Implementation', () => {
    it('should apply rate limiting to checkout API', async () => {
      const { withRateLimit } = require('@/lib/rate-limiting/rate-limiter');
      const { POST } = require('@/app/api/checkout/validate/route');
      
      // Mock rate limiting success
      withRateLimit.mockImplementation(async (req, config, handler) => {
        expect(config).toBeDefined();
        return await handler();
      });

      const requestBody = {
        customerInfo: {
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          phone: '1234567890'
        },
        shippingAddress: {
          streetAddress: '123 Test St',
          city: 'Test City',
          state: 'Test State',
          zipCode: '12345'
        },
        items: [{
          id: '1',
          name: 'Test Product',
          price: 100,
          quantity: 1
        }],
        paymentMethod: 'mercadopago',
        shippingMethod: 'free',
        totals: {
          subtotal: 100,
          shipping: 0,
          total: 100
        }
      };

      const request = new NextRequest(new Request('http://localhost/api/checkout/validate', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'content-type': 'application/json' }
      }));

      await POST(request);

      expect(withRateLimit).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          maxRequests: expect.any(Number),
          windowMs: expect.any(Number)
        }),
        expect.any(Function)
      );
    });

    it('should apply rate limiting to categories API', async () => {
      const { withRateLimit } = require('@/lib/rate-limiting/rate-limiter');
      const { GET } = require('@/app/api/categories/route');
      
      withRateLimit.mockImplementation(async (req, config, handler) => {
        return await handler();
      });

      const request = new NextRequest(new Request('http://localhost/api/categories'));

      await GET(request);

      expect(withRateLimit).toHaveBeenCalled();
    });

    it('should apply rate limiting to search trending API', async () => {
      const { withRateLimit } = require('@/lib/rate-limiting/rate-limiter');
      const { GET } = require('@/app/api/search/trending/route');
      
      withRateLimit.mockImplementation(async (req, config, handler) => {
        return await handler();
      });

      const request = new NextRequest(new Request('http://localhost/api/search/trending'));

      await GET(request);

      expect(withRateLimit).toHaveBeenCalled();
    });

    it('should apply rate limiting to user profile API', async () => {
      const { withRateLimit } = require('@/lib/rate-limiting/rate-limiter');
      
      // Mock auth
      jest.mock('@/auth', () => ({
        auth: jest.fn(() => Promise.resolve({
          user: { id: 'test-user-id', email: 'test@example.com' }
        }))
      }));

      const { GET } = require('@/app/api/user/profile/route');
      
      withRateLimit.mockImplementation(async (req, config, handler) => {
        return await handler();
      });

      const request = new NextRequest(new Request('http://localhost/api/user/profile'));

      await GET(request);

      expect(withRateLimit).toHaveBeenCalled();
    });
  });

  describe('Security Logging Implementation', () => {
    it('should create security logger for all protected APIs', async () => {
      const { createSecurityLogger } = require('@/lib/logging/security-logger');
      const { GET } = require('@/app/api/categories/route');
      
      const { withRateLimit } = require('@/lib/rate-limiting/rate-limiter');
      withRateLimit.mockImplementation(async (req, config, handler) => {
        return await handler();
      });

      const request = new NextRequest(new Request('http://localhost/api/categories'));

      await GET(request);

      expect(createSecurityLogger).toHaveBeenCalledWith(request);
    });

    it('should log API access events', async () => {
      const mockLogger = {
        logEvent: jest.fn(),
        logRateLimitExceeded: jest.fn(),
        context: { ip: '127.0.0.1', userAgent: 'test' }
      };

      const { createSecurityLogger } = require('@/lib/logging/security-logger');
      createSecurityLogger.mockReturnValue(mockLogger);

      const { withRateLimit } = require('@/lib/rate-limiting/rate-limiter');
      withRateLimit.mockImplementation(async (req, config, handler) => {
        return await handler();
      });

      const { GET } = require('@/app/api/categories/route');
      const request = new NextRequest(new Request('http://localhost/api/categories'));

      await GET(request);

      expect(mockLogger.logEvent).toHaveBeenCalledWith(
        'api_access',
        'low',
        expect.objectContaining({
          endpoint: '/api/categories',
          method: 'GET'
        })
      );
    });
  });

  describe('Database Timeout Implementation', () => {
    it('should apply database timeouts to database queries', async () => {
      const { withDatabaseTimeout } = require('@/lib/config/api-timeouts');
      const { withRateLimit } = require('@/lib/rate-limiting/rate-limiter');
      
      withRateLimit.mockImplementation(async (req, config, handler) => {
        return await handler();
      });

      withDatabaseTimeout.mockImplementation(async (query, timeout) => {
        expect(timeout).toBeDefined();
        return { data: [], error: null };
      });

      const { GET } = require('@/app/api/categories/route');
      const request = new NextRequest(new Request('http://localhost/api/categories'));

      await GET(request);

      expect(withDatabaseTimeout).toHaveBeenCalled();
    });
  });

  describe('Error Handling and Security', () => {
    it('should handle rate limit exceeded scenarios', async () => {
      const mockLogger = {
        logEvent: jest.fn(),
        logRateLimitExceeded: jest.fn(),
        context: { ip: '127.0.0.1', userAgent: 'test' }
      };

      const { createSecurityLogger } = require('@/lib/logging/security-logger');
      createSecurityLogger.mockReturnValue(mockLogger);

      const { withRateLimit } = require('@/lib/rate-limiting/rate-limiter');
      const { NextResponse } = require('next/server');
      
      // Mock rate limit exceeded
      const rateLimitResponse = NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
      
      withRateLimit.mockResolvedValue(rateLimitResponse);

      const { GET } = require('@/app/api/categories/route');
      const request = new NextRequest(new Request('http://localhost/api/categories'));

      const response = await GET(request);

      expect(mockLogger.logRateLimitExceeded).toHaveBeenCalled();
      expect(response.status).toBe(429);
    });

    it('should log security events for errors', async () => {
      const mockLogger = {
        logEvent: jest.fn(),
        logRateLimitExceeded: jest.fn(),
        context: { ip: '127.0.0.1', userAgent: 'test' }
      };

      const { createSecurityLogger } = require('@/lib/logging/security-logger');
      createSecurityLogger.mockReturnValue(mockLogger);

      const { withRateLimit } = require('@/lib/rate-limiting/rate-limiter');
      const { withDatabaseTimeout } = require('@/lib/config/api-timeouts');
      
      withRateLimit.mockImplementation(async (req, config, handler) => {
        return await handler();
      });

      // Mock database error
      withDatabaseTimeout.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' }
      });

      const { GET } = require('@/app/api/categories/route');
      const request = new NextRequest(new Request('http://localhost/api/categories'));

      await GET(request);

      expect(mockLogger.logEvent).toHaveBeenCalledWith(
        'database_error',
        'medium',
        expect.objectContaining({
          error: 'Database connection failed',
          endpoint: '/api/categories'
        })
      );
    });
  });
});
