// ===================================
// PINTEYA E-COMMERCE - MERCADOPAGO METRICS API TESTS
// ===================================

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/admin/mercadopago/metrics/route';

// Mock de Clerk
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(() => ({
    userId: 'test-user-id',
    sessionId: 'test-session-id',
  })),
}));

// Mock del metrics collector
jest.mock('@/lib/metrics', () => ({
  metricsCollector: {
    getMercadoPagoMetrics: jest.fn(() => Promise.resolve({
      payment_creation: {
        requests: { total: 100, success: 95, error: 5, rate_limited: 2 },
        response_times: { avg: 250, min: 100, max: 500, p95: 400, p99: 450 },
        retry_stats: { total_retries: 3, successful_retries: 2, failed_retries: 1 },
      },
      payment_queries: {
        requests: { total: 50, success: 48, error: 2, rate_limited: 1 },
        response_times: { avg: 150, min: 80, max: 300, p95: 250, p99: 280 },
        retry_stats: { total_retries: 1, successful_retries: 1, failed_retries: 0 },
      },
      webhook_processing: {
        requests: { total: 200, success: 195, error: 5, rate_limited: 0 },
        response_times: { avg: 100, min: 50, max: 200, p95: 180, p99: 190 },
        retry_stats: { total_retries: 2, successful_retries: 2, failed_retries: 0 },
      },
    })),
  },
}));

// Mock de Redis
jest.mock('@/lib/redis', () => ({
  isRedisAvailable: jest.fn(() => Promise.resolve(true)),
}));

// Mock del logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
  LogCategory: {
    API: 'api',
  },
}));

describe('/api/admin/mercadopago/metrics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/admin/mercadopago/metrics', () => {
    it('should return metrics successfully for authenticated user', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/mercadopago/metrics');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.data.realTimeMetrics).toBeDefined();
      expect(data.data.endpointMetrics).toBeDefined();
      expect(data.data.systemHealth).toBeDefined();
      expect(data.data.alerts).toBeDefined();
    });

    it('should calculate real-time metrics correctly', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/mercadopago/metrics');
      
      const response = await GET(request);
      const data = await response.json();

      const realTimeMetrics = data.data.realTimeMetrics;
      
      // Total requests = 100 + 50 + 200 = 350
      expect(realTimeMetrics.totalRequests).toBe(350);
      
      // Success rate = (95 + 48 + 195) / 350 = 338/350 = 96.57%
      expect(realTimeMetrics.successRate).toBeCloseTo(96.57, 1);
      
      // Error rate = (5 + 2 + 5) / 350 = 12/350 = 3.43%
      expect(realTimeMetrics.errorRate).toBeCloseTo(3.43, 1);
      
      // Rate limit hits = 2 + 1 + 0 = 3
      expect(realTimeMetrics.rateLimitHits).toBe(3);
      
      // Retry attempts = 3 + 1 + 2 = 6
      expect(realTimeMetrics.retryAttempts).toBe(6);
    });

    it('should include endpoint-specific metrics', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/mercadopago/metrics');
      
      const response = await GET(request);
      const data = await response.json();

      const endpointMetrics = data.data.endpointMetrics;
      
      // Create Preference metrics
      expect(endpointMetrics.createPreference.requests).toBe(100);
      expect(endpointMetrics.createPreference.successRate).toBe(95);
      expect(endpointMetrics.createPreference.averageResponseTime).toBe(250);
      expect(endpointMetrics.createPreference.errorCount).toBe(5);
      
      // Webhook metrics
      expect(endpointMetrics.webhook.requests).toBe(200);
      expect(endpointMetrics.webhook.successRate).toBe(97.5);
      expect(endpointMetrics.webhook.averageResponseTime).toBe(100);
      expect(endpointMetrics.webhook.errorCount).toBe(5);
      
      // Payment Query metrics
      expect(endpointMetrics.paymentQuery.requests).toBe(50);
      expect(endpointMetrics.paymentQuery.successRate).toBe(96);
      expect(endpointMetrics.paymentQuery.averageResponseTime).toBe(150);
      expect(endpointMetrics.paymentQuery.errorCount).toBe(2);
    });

    it('should include system health information', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/mercadopago/metrics');
      
      const response = await GET(request);
      const data = await response.json();

      const systemHealth = data.data.systemHealth;
      
      expect(systemHealth.redisStatus).toBe('connected');
      expect(systemHealth.lastUpdate).toBeDefined();
      expect(systemHealth.uptime).toBeGreaterThan(0);
    });

    it('should generate alerts for high error rates', async () => {
      // Mock high error rate scenario
      const { metricsCollector } = require('@/lib/metrics');
      metricsCollector.getMercadoPagoMetrics.mockResolvedValueOnce({
        payment_creation: {
          requests: { total: 100, success: 80, error: 20, rate_limited: 0 },
          response_times: { avg: 250 },
          retry_stats: { total_retries: 0, successful_retries: 0, failed_retries: 0 },
        },
        payment_queries: {
          requests: { total: 0, success: 0, error: 0, rate_limited: 0 },
          response_times: { avg: 0 },
          retry_stats: { total_retries: 0, successful_retries: 0, failed_retries: 0 },
        },
        webhook_processing: {
          requests: { total: 0, success: 0, error: 0, rate_limited: 0 },
          response_times: { avg: 0 },
          retry_stats: { total_retries: 0, successful_retries: 0, failed_retries: 0 },
        },
      });

      const request = new NextRequest('http://localhost:3000/api/admin/mercadopago/metrics');
      
      const response = await GET(request);
      const data = await response.json();

      const alerts = data.data.alerts;
      
      // Should have an error alert for high error rate (20%)
      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('error');
      expect(alerts[0].message).toContain('Tasa de error alta');
    });

    it('should generate alerts for high response times', async () => {
      // Mock high response time scenario
      const { metricsCollector } = require('@/lib/metrics');
      metricsCollector.getMercadoPagoMetrics.mockResolvedValueOnce({
        payment_creation: {
          requests: { total: 100, success: 100, error: 0, rate_limited: 0 },
          response_times: { avg: 5000 }, // 5 seconds
          retry_stats: { total_retries: 0, successful_retries: 0, failed_retries: 0 },
        },
        payment_queries: {
          requests: { total: 0, success: 0, error: 0, rate_limited: 0 },
          response_times: { avg: 0 },
          retry_stats: { total_retries: 0, successful_retries: 0, failed_retries: 0 },
        },
        webhook_processing: {
          requests: { total: 0, success: 0, error: 0, rate_limited: 0 },
          response_times: { avg: 0 },
          retry_stats: { total_retries: 0, successful_retries: 0, failed_retries: 0 },
        },
      });

      const request = new NextRequest('http://localhost:3000/api/admin/mercadopago/metrics');
      
      const response = await GET(request);
      const data = await response.json();

      const alerts = data.data.alerts;
      
      // Should have a warning alert for high response time
      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('warning');
      expect(alerts[0].message).toContain('Tiempo de respuesta alto');
    });

    it('should return 401 for unauthenticated requests', async () => {
      // Mock unauthenticated user
      const { auth } = require('@clerk/nextjs/server');
      auth.mockReturnValueOnce({ userId: null });

      const request = new NextRequest('http://localhost:3000/api/admin/mercadopago/metrics');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('No autorizado');
    });
  });

  describe('POST /api/admin/mercadopago/metrics', () => {
    it('should reset metrics successfully for authenticated user', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/mercadopago/metrics', {
        method: 'POST',
      });
      
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Métricas reiniciadas correctamente');
    });

    it('should return 401 for unauthenticated requests', async () => {
      // Mock unauthenticated user
      const { auth } = require('@clerk/nextjs/server');
      auth.mockReturnValueOnce({ userId: null });

      const request = new NextRequest('http://localhost:3000/api/admin/mercadopago/metrics', {
        method: 'POST',
      });
      
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('No autorizado');
    });
  });
});
