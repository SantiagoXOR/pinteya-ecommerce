import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/payments/reports/route';
import { auth } from '@/auth';

// Mock dependencies
jest.mock('@clerk/nextjs/server');
jest.mock('@/lib/supabase');
jest.mock('@/lib/rate-limiter');
jest.mock('@/lib/metrics');
jest.mock('@/lib/logger');

const mockAuth = auth as jest.MockedFunction<typeof auth>;

describe('/api/payments/reports', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock environment variables
    process.env.MERCADOPAGO_ACCESS_TOKEN = 'APP_USR_test_token';
    process.env.NODE_ENV = 'test';
  });

  describe('GET', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockAuth.mockResolvedValue({ userId: null });

      const request = new NextRequest('http://localhost:3000/api/payments/reports');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('No autorizado');
    });

    it('should return report data when user is authenticated', async () => {
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
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: [
            {
              id: 1,
              total_amount: 1000,
              status: 'completed',
              payment_status: 'approved',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T01:00:00Z',
              order_items: [
                {
                  quantity: 2,
                  unit_price: 500,
                  products: {
                    name: 'Test Product',
                    category_id: 'cat_1'
                  }
                }
              ]
            }
          ],
          error: null
        })
      };
      getSupabaseClient.mockReturnValue(mockSupabase);

      const request = new NextRequest('http://localhost:3000/api/payments/reports');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.data.type).toBe('account_money');
      expect(data.data.records).toBeDefined();
      expect(Array.isArray(data.data.records)).toBe(true);
      expect(data.data.total_records).toBeDefined();
    });

    it('should handle different report types', async () => {
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
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: [],
          error: null
        })
      };
      getSupabaseClient.mockReturnValue(mockSupabase);

      // Test released_money report
      const request1 = new NextRequest('http://localhost:3000/api/payments/reports?type=released_money');
      const response1 = await GET(request1);
      const data1 = await response1.json();

      expect(response1.status).toBe(200);
      expect(data1.data.type).toBe('released_money');

      // Test sales_report
      const request2 = new NextRequest('http://localhost:3000/api/payments/reports?type=sales_report');
      const response2 = await GET(request2);
      const data2 = await response2.json();

      expect(response2.status).toBe(200);
      expect(data2.data.type).toBe('sales_report');
    });

    it('should validate report type parameter', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_123' });

      // Mock rate limiter
      const { checkRateLimit } = require('@/lib/rate-limiter');
      checkRateLimit.mockResolvedValue({ success: true, remaining: 10 });

      const request = new NextRequest('http://localhost:3000/api/payments/reports?type=invalid_type');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Tipo de reporte inválido');
    });

    it('should include metrics when requested', async () => {
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
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: [
            {
              id: 1,
              total_amount: 1000,
              status: 'completed',
              payment_status: 'approved',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T01:00:00Z',
              order_items: []
            }
          ],
          error: null
        })
      };
      getSupabaseClient.mockReturnValue(mockSupabase);

      const request = new NextRequest('http://localhost:3000/api/payments/reports?include_metrics=true');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.metrics).toBeDefined();
      expect(data.data.metrics.total_transactions).toBeDefined();
      expect(data.data.metrics.total_amount).toBeDefined();
      expect(data.data.metrics.successful_payments).toBeDefined();
      expect(data.data.metrics.failed_payments).toBeDefined();
      expect(data.data.metrics.conversion_rate).toBeDefined();
      expect(data.data.metrics.average_ticket).toBeDefined();
    });

    it('should handle date range parameters', async () => {
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
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: [],
          error: null
        })
      };
      getSupabaseClient.mockReturnValue(mockSupabase);

      const dateFrom = '2024-01-01';
      const dateTo = '2024-01-31';
      const request = new NextRequest(`http://localhost:3000/api/payments/reports?date_from=${dateFrom}&date_to=${dateTo}`);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.date_from).toContain('2024-01-01');
      expect(data.data.date_to).toContain('2024-01-31');
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

      const request = new NextRequest('http://localhost:3000/api/payments/reports');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Demasiadas solicitudes');
    });
  });

  describe('POST', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockAuth.mockResolvedValue({ userId: null });

      const request = new NextRequest('http://localhost:3000/api/payments/reports', {
        method: 'POST',
        body: JSON.stringify({
          type: 'account_money',
          date_from: '2024-01-01',
          date_to: '2024-01-31'
        })
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('No autorizado');
    });

    it('should create a new report when user is authenticated', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_123' });

      // Mock rate limiter
      const { checkRateLimit } = require('@/lib/rate-limiter');
      checkRateLimit.mockResolvedValue({ success: true, remaining: 10 });

      // Mock metrics collector
      const { metricsCollector } = require('@/lib/metrics');
      metricsCollector.recordApiCall.mockResolvedValue(undefined);

      const requestBody = {
        type: 'account_money',
        date_from: '2024-01-01',
        date_to: '2024-01-31'
      };

      const request = new NextRequest('http://localhost:3000/api/payments/reports', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.data.id).toBeDefined();
      expect(data.data.type).toBe('account_money');
      expect(data.data.date_from).toBe('2024-01-01');
      expect(data.data.date_to).toBe('2024-01-31');
      expect(data.data.status).toBe('pending');
      expect(data.data.created_at).toBeDefined();
    });

    it('should validate required parameters', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_123' });

      // Mock rate limiter
      const { checkRateLimit } = require('@/lib/rate-limiter');
      checkRateLimit.mockResolvedValue({ success: true, remaining: 10 });

      // Test missing type
      const request1 = new NextRequest('http://localhost:3000/api/payments/reports', {
        method: 'POST',
        body: JSON.stringify({
          date_from: '2024-01-01',
          date_to: '2024-01-31'
        })
      });
      const response1 = await POST(request1);
      const data1 = await response1.json();

      expect(response1.status).toBe(400);
      expect(data1.success).toBe(false);
      expect(data1.error).toBe('Faltan parámetros requeridos');

      // Test missing date_from
      const request2 = new NextRequest('http://localhost:3000/api/payments/reports', {
        method: 'POST',
        body: JSON.stringify({
          type: 'account_money',
          date_to: '2024-01-31'
        })
      });
      const response2 = await POST(request2);
      const data2 = await response2.json();

      expect(response2.status).toBe(400);
      expect(data2.success).toBe(false);
      expect(data2.error).toBe('Faltan parámetros requeridos');
    });

    it('should handle rate limiting for report creation', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_123' });

      // Mock rate limiter to return failure
      const { checkRateLimit } = require('@/lib/rate-limiter');
      checkRateLimit.mockResolvedValue({ 
        success: false, 
        remaining: 0,
        resetTime: Date.now() + 60000 
      });

      const request = new NextRequest('http://localhost:3000/api/payments/reports', {
        method: 'POST',
        body: JSON.stringify({
          type: 'account_money',
          date_from: '2024-01-01',
          date_to: '2024-01-31'
        })
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Demasiadas solicitudes');
    });

    it('should handle errors gracefully', async () => {
      mockAuth.mockRejectedValue(new Error('Auth service error'));

      const request = new NextRequest('http://localhost:3000/api/payments/reports', {
        method: 'POST',
        body: JSON.stringify({
          type: 'account_money',
          date_from: '2024-01-01',
          date_to: '2024-01-31'
        })
      });
      const response = await POST(request);
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

      const request = new NextRequest('http://localhost:3000/api/payments/reports', {
        method: 'POST',
        body: JSON.stringify({
          type: 'account_money',
          date_from: '2024-01-01',
          date_to: '2024-01-31'
        })
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.processing_time).toBeDefined();
      expect(typeof data.processing_time).toBe('number');
      expect(data.processing_time).toBeGreaterThanOrEqual(0);
      expect(data.timestamp).toBeDefined();
      expect(typeof data.timestamp).toBe('number');
    });
  });
});
