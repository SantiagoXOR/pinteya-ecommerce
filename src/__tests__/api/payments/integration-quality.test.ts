import { NextRequest } from 'next/server';
import { GET } from '@/app/api/payments/integration-quality/route';
import { auth } from '@clerk/nextjs/server';

// Mock dependencies
jest.mock('@clerk/nextjs/server');
jest.mock('@/lib/supabase');
jest.mock('@/lib/rate-limiter', () => ({
  checkRateLimit: jest.fn(),
  addRateLimitHeaders: jest.fn(),
  RATE_LIMIT_CONFIGS: {
    ANALYTICS: { requests: 100, window: 3600 }
  }
}));
jest.mock('@/lib/metrics', () => ({
  metricsCollector: {
    recordApiCall: jest.fn()
  }
}));
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  },
  LogLevel: {
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error'
  },
  LogCategory: {
    API: 'api'
  }
}));

const mockAuth = auth as jest.MockedFunction<typeof auth>;

describe('/api/payments/integration-quality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock environment variables
    process.env.MERCADOPAGO_ACCESS_TOKEN = 'APP_USR_test_token';
    process.env.NODE_ENV = 'test';
  });

  describe('GET', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockAuth.mockResolvedValue({ userId: null });

      const request = new NextRequest('http://localhost:3000/api/payments/integration-quality');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('No autorizado');
    });

    it('should return quality metrics when user is authenticated', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_123' });

      // Mock rate limiter
      const { checkRateLimit } = require('@/lib/rate-limiter');
      checkRateLimit.mockResolvedValue({ success: true, remaining: 10 });

      // Mock metrics collector
      const { metricsCollector } = require('@/lib/metrics');
      metricsCollector.recordApiCall.mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost:3000/api/payments/integration-quality');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.data.score).toBeGreaterThanOrEqual(0);
      expect(data.data.score).toBeLessThanOrEqual(100);
      expect(data.data.category).toMatch(/^(excellent|good|needs_improvement|poor)$/);
      expect(data.data.details).toBeDefined();
      expect(data.data.details.security).toBeDefined();
      expect(data.data.details.performance).toBeDefined();
      expect(data.data.details.user_experience).toBeDefined();
      expect(data.data.details.integration_completeness).toBeDefined();
    });

    it('should include recommendations when requested', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_123' });

      // Mock rate limiter
      const { checkRateLimit } = require('@/lib/rate-limiter');
      checkRateLimit.mockResolvedValue({ success: true, remaining: 10 });

      // Mock metrics collector
      const { metricsCollector } = require('@/lib/metrics');
      metricsCollector.recordApiCall.mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost:3000/api/payments/integration-quality?include_recommendations=true');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.recommendations).toBeDefined();
      expect(Array.isArray(data.data.recommendations)).toBe(true);
    });

    it('should handle rate limiting', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_123' });

      // Mock rate limiter to return failure
      const { checkRateLimit } = require('@/lib/rate-limiter');
      checkRateLimit.mockResolvedValue({ 
        success: false, 
        remaining: 0,
        resetTime: Date.now() + 60000 
      });

      const request = new NextRequest('http://localhost:3000/api/payments/integration-quality');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Demasiadas solicitudes');
    });

    it('should validate security checks correctly', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_123' });

      // Mock rate limiter
      const { checkRateLimit } = require('@/lib/rate-limiter');
      checkRateLimit.mockResolvedValue({ success: true, remaining: 10 });

      // Mock metrics collector
      const { metricsCollector } = require('@/lib/metrics');
      metricsCollector.recordApiCall.mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost:3000/api/payments/integration-quality');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.details.security).toBeDefined();
      expect(data.data.details.security.score).toBeGreaterThanOrEqual(0);
      expect(data.data.details.security.status).toMatch(/^(pass|warning|fail)$/);
      expect(Array.isArray(data.data.details.security.checks)).toBe(true);
      
      // Verificar que incluye checks específicos de seguridad
      const securityChecks = data.data.details.security.checks;
      const checkNames = securityChecks.map((check: any) => check.name);
      expect(checkNames).toContain('webhook_signature_validation');
      expect(checkNames).toContain('https_usage');
      expect(checkNames).toContain('credentials_security');
      expect(checkNames).toContain('rate_limiting');
    });

    it('should validate performance checks correctly', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_123' });

      // Mock rate limiter
      const { checkRateLimit } = require('@/lib/rate-limiter');
      checkRateLimit.mockResolvedValue({ success: true, remaining: 10 });

      // Mock metrics collector
      const { metricsCollector } = require('@/lib/metrics');
      metricsCollector.recordApiCall.mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost:3000/api/payments/integration-quality');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.details.performance).toBeDefined();
      expect(data.data.details.performance.score).toBeGreaterThanOrEqual(0);
      expect(data.data.details.performance.status).toMatch(/^(pass|warning|fail)$/);
      
      // Verificar que incluye checks específicos de performance
      const performanceChecks = data.data.details.performance.checks;
      const checkNames = performanceChecks.map((check: any) => check.name);
      expect(checkNames).toContain('retry_logic');
      expect(checkNames).toContain('caching');
      expect(checkNames).toContain('monitoring');
    });

    it('should validate user experience checks correctly', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_123' });

      // Mock rate limiter
      const { checkRateLimit } = require('@/lib/rate-limiter');
      checkRateLimit.mockResolvedValue({ success: true, remaining: 10 });

      // Mock metrics collector
      const { metricsCollector } = require('@/lib/metrics');
      metricsCollector.recordApiCall.mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost:3000/api/payments/integration-quality');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.details.user_experience).toBeDefined();
      expect(data.data.details.user_experience.score).toBeGreaterThanOrEqual(0);
      expect(data.data.details.user_experience.status).toMatch(/^(pass|warning|fail)$/);
      
      // Verificar que incluye checks específicos de UX
      const uxChecks = data.data.details.user_experience.checks;
      const checkNames = uxChecks.map((check: any) => check.name);
      expect(checkNames).toContain('wallet_brick');
      expect(checkNames).toContain('auto_return');
      expect(checkNames).toContain('payment_methods');
    });

    it('should validate integration completeness checks correctly', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_123' });

      // Mock rate limiter
      const { checkRateLimit } = require('@/lib/rate-limiter');
      checkRateLimit.mockResolvedValue({ success: true, remaining: 10 });

      // Mock metrics collector
      const { metricsCollector } = require('@/lib/metrics');
      metricsCollector.recordApiCall.mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost:3000/api/payments/integration-quality');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.details.integration_completeness).toBeDefined();
      expect(data.data.details.integration_completeness.score).toBeGreaterThanOrEqual(0);
      expect(data.data.details.integration_completeness.status).toMatch(/^(pass|warning|fail)$/);
      
      // Verificar que incluye checks específicos de completitud
      const integrationChecks = data.data.details.integration_completeness.checks;
      const checkNames = integrationChecks.map((check: any) => check.name);
      expect(checkNames).toContain('webhook_implementation');
      expect(checkNames).toContain('payment_tracking');
      expect(checkNames).toContain('error_handling');
      expect(checkNames).toContain('logging_monitoring');
    });

    it('should calculate score correctly based on individual checks', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_123' });

      // Mock rate limiter
      const { checkRateLimit } = require('@/lib/rate-limiter');
      checkRateLimit.mockResolvedValue({ success: true, remaining: 10 });

      // Mock metrics collector
      const { metricsCollector } = require('@/lib/metrics');
      metricsCollector.recordApiCall.mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost:3000/api/payments/integration-quality');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      
      // Verificar que el score general es el promedio de los scores individuales
      const { security, performance, user_experience, integration_completeness } = data.data.details;
      const expectedScore = Math.round((
        security.score + 
        performance.score + 
        user_experience.score + 
        integration_completeness.score
      ) / 4);
      
      expect(data.data.score).toBe(expectedScore);
    });

    it('should categorize quality correctly based on score', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_123' });

      // Mock rate limiter
      const { checkRateLimit } = require('@/lib/rate-limiter');
      checkRateLimit.mockResolvedValue({ success: true, remaining: 10 });

      // Mock metrics collector
      const { metricsCollector } = require('@/lib/metrics');
      metricsCollector.recordApiCall.mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost:3000/api/payments/integration-quality');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      
      const score = data.data.score;
      const category = data.data.category;
      
      if (score >= 90) {
        expect(category).toBe('excellent');
      } else if (score >= 75) {
        expect(category).toBe('good');
      } else if (score >= 60) {
        expect(category).toBe('needs_improvement');
      } else {
        expect(category).toBe('poor');
      }
    });

    it('should handle errors gracefully', async () => {
      mockAuth.mockRejectedValue(new Error('Auth service error'));

      const request = new NextRequest('http://localhost:3000/api/payments/integration-quality');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Error interno del servidor');
    });

    it('should include processing time in response', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_123' });

      // Mock rate limiter
      const { checkRateLimit } = require('@/lib/rate-limiter');
      checkRateLimit.mockResolvedValue({ success: true, remaining: 10 });

      // Mock metrics collector
      const { metricsCollector } = require('@/lib/metrics');
      metricsCollector.recordApiCall.mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost:3000/api/payments/integration-quality');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.processing_time).toBeDefined();
      expect(typeof data.processing_time).toBe('number');
      expect(data.processing_time).toBeGreaterThanOrEqual(0);
      expect(data.timestamp).toBeDefined();
      expect(typeof data.timestamp).toBe('number');
    });
  });
});
