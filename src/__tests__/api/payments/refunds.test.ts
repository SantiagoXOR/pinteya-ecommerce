import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/payments/refunds/route';
import { auth } from '@clerk/nextjs/server';

// Mock dependencies
jest.mock('@clerk/nextjs/server');
jest.mock('@/lib/supabase', () => ({
  getSupabaseClient: jest.fn()
}));
jest.mock('@/lib/rate-limiter', () => ({
  checkRateLimit: jest.fn(),
  addRateLimitHeaders: jest.fn(),
  RATE_LIMIT_CONFIGS: {
    PAYMENT_CREATION: { requests: 10, window: 3600 },
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
    API: 'api',
    PAYMENT: 'payment'
  }
}));
jest.mock('@/lib/mercadopago', () => ({
  createMercadoPagoClient: jest.fn()
}));

const mockAuth = auth as jest.MockedFunction<typeof auth>;

describe('/api/payments/refunds', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock environment variables
    process.env.MERCADOPAGO_ACCESS_TOKEN = 'APP_USR_test_token';
    process.env.NODE_ENV = 'test';
  });

  describe('POST', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockAuth.mockResolvedValue({ userId: null });

      const request = new NextRequest('http://localhost:3000/api/payments/refunds', {
        method: 'POST',
        body: JSON.stringify({
          payment_id: 'payment_123',
          amount: 1000
        })
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('No autorizado');
    });

    it('should process refund when user is authenticated and payment exists', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_123' });

      // Mock rate limiter
      const { checkRateLimit } = require('@/lib/rate-limiter');
      checkRateLimit.mockResolvedValue({ success: true, remaining: 10 });

      // Mock metrics collector
      const { metricsCollector } = require('@/lib/metrics');
      metricsCollector.recordApiCall.mockResolvedValue(undefined);

      // Mock Supabase
      const { getSupabaseClient } = require('@/lib/supabase');
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 1,
            total_amount: 1000,
            payment_status: 'approved',
            external_reference: 'payment_123'
          },
          error: null
        }),
        update: jest.fn().mockReturnThis(),
        insert: jest.fn().mockResolvedValue({ data: null, error: null })
      };
      getSupabaseClient.mockReturnValue(mockSupabase);

      const requestBody = {
        payment_id: 'payment_123',
        amount: 500,
        reason: 'Customer request'
      };

      const request = new NextRequest('http://localhost:3000/api/payments/refunds', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.data.payment_id).toBe('payment_123');
      expect(data.data.amount).toBe(500);
      expect(data.data.status).toBeDefined();
    });

    it('should validate required payment_id', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_123' });

      // Mock rate limiter
      const { checkRateLimit } = require('@/lib/rate-limiter');
      checkRateLimit.mockResolvedValue({ success: true, remaining: 10 });

      const request = new NextRequest('http://localhost:3000/api/payments/refunds', {
        method: 'POST',
        body: JSON.stringify({
          amount: 500
        })
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('payment_id es requerido');
    });

    it('should return 404 when payment is not found', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_123' });

      // Mock rate limiter
      const { checkRateLimit } = require('@/lib/rate-limiter');
      checkRateLimit.mockResolvedValue({ success: true, remaining: 10 });

      // Mock Supabase to return no order
      const { getSupabaseClient } = require('@/lib/supabase');
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' }
        })
      };
      getSupabaseClient.mockReturnValue(mockSupabase);

      const request = new NextRequest('http://localhost:3000/api/payments/refunds', {
        method: 'POST',
        body: JSON.stringify({
          payment_id: 'nonexistent_payment'
        })
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Pago no encontrado');
    });

    it('should validate payment status is approved', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_123' });

      // Mock rate limiter
      const { checkRateLimit } = require('@/lib/rate-limiter');
      checkRateLimit.mockResolvedValue({ success: true, remaining: 10 });

      // Mock Supabase to return pending payment
      const { getSupabaseClient } = require('@/lib/supabase');
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 1,
            total_amount: 1000,
            payment_status: 'pending',
            external_reference: 'payment_123'
          },
          error: null
        })
      };
      getSupabaseClient.mockReturnValue(mockSupabase);

      const request = new NextRequest('http://localhost:3000/api/payments/refunds', {
        method: 'POST',
        body: JSON.stringify({
          payment_id: 'payment_123'
        })
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Solo se pueden reembolsar pagos aprobados');
    });

    it('should validate refund amount does not exceed original payment', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_123' });

      // Mock rate limiter
      const { checkRateLimit } = require('@/lib/rate-limiter');
      checkRateLimit.mockResolvedValue({ success: true, remaining: 10 });

      // Mock Supabase
      const { getSupabaseClient } = require('@/lib/supabase');
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 1,
            total_amount: 1000,
            payment_status: 'approved',
            external_reference: 'payment_123'
          },
          error: null
        })
      };
      getSupabaseClient.mockReturnValue(mockSupabase);

      const request = new NextRequest('http://localhost:3000/api/payments/refunds', {
        method: 'POST',
        body: JSON.stringify({
          payment_id: 'payment_123',
          amount: 1500 // More than original payment
        })
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('El monto del reembolso no puede ser mayor al pago original');
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

      const request = new NextRequest('http://localhost:3000/api/payments/refunds', {
        method: 'POST',
        body: JSON.stringify({
          payment_id: 'payment_123'
        })
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Demasiadas solicitudes');
    });
  });

  describe('GET', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockAuth.mockResolvedValue({ userId: null });

      const request = new NextRequest('http://localhost:3000/api/payments/refunds');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('No autorizado');
    });

    it('should return refunds list when user is authenticated', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_123' });

      // Mock rate limiter
      const { checkRateLimit } = require('@/lib/rate-limiter');
      checkRateLimit.mockResolvedValue({ success: true, remaining: 10 });

      // Mock metrics collector
      const { metricsCollector } = require('@/lib/metrics');
      metricsCollector.recordApiCall.mockResolvedValue(undefined);

      // Mock Supabase
      const { getSupabaseClient } = require('@/lib/supabase');
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [
            {
              id: 1,
              payment_id: 'payment_123',
              refund_id: 'refund_456',
              amount: 500,
              status: 'approved',
              created_at: '2024-01-01T00:00:00Z',
              orders: {
                id: 1,
                total_amount: 1000,
                created_at: '2024-01-01T00:00:00Z'
              }
            }
          ],
          error: null
        })
      };
      getSupabaseClient.mockReturnValue(mockSupabase);

      const request = new NextRequest('http://localhost:3000/api/payments/refunds');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.pagination).toBeDefined();
    });

    it('should handle pagination parameters', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_123' });

      // Mock rate limiter
      const { checkRateLimit } = require('@/lib/rate-limiter');
      checkRateLimit.mockResolvedValue({ success: true, remaining: 10 });

      // Mock metrics collector
      const { metricsCollector } = require('@/lib/metrics');
      metricsCollector.recordApiCall.mockResolvedValue(undefined);

      // Mock Supabase
      const { getSupabaseClient } = require('@/lib/supabase');
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [],
          error: null
        })
      };
      getSupabaseClient.mockReturnValue(mockSupabase);

      const request = new NextRequest('http://localhost:3000/api/payments/refunds?limit=5&offset=10');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.pagination.limit).toBe(5);
      expect(data.pagination.offset).toBe(10);
    });

    it('should filter by status when provided', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_123' });

      // Mock rate limiter
      const { checkRateLimit } = require('@/lib/rate-limiter');
      checkRateLimit.mockResolvedValue({ success: true, remaining: 10 });

      // Mock metrics collector
      const { metricsCollector } = require('@/lib/metrics');
      metricsCollector.recordApiCall.mockResolvedValue(undefined);

      // Mock Supabase
      const { getSupabaseClient } = require('@/lib/supabase');
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [],
          error: null
        })
      };
      getSupabaseClient.mockReturnValue(mockSupabase);

      const request = new NextRequest('http://localhost:3000/api/payments/refunds?status=approved');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockSupabase.eq).toHaveBeenCalledWith('status', 'approved');
    });
  });
});
