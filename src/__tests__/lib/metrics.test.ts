// ===================================
// PINTEYA E-COMMERCE - METRICS TESTS
// ===================================

import { MetricsCollector, metricsCollector } from '@/lib/metrics';

// Mock Redis
jest.mock('@/lib/redis', () => ({
  redisCache: {
    incr: jest.fn(),
    expire: jest.fn(),
    get: jest.fn(),
    client: {
      lpush: jest.fn(),
      ltrim: jest.fn(),
      expire: jest.fn(),
      lrange: jest.fn(),
    },
  },
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
  LogLevel: {
    DEBUG: 'debug',
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error',
  },
  LogCategory: {
    SYSTEM: 'system',
  },
}));

describe('MetricsCollector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = MetricsCollector.getInstance();
      const instance2 = MetricsCollector.getInstance();
      
      expect(instance1).toBe(instance2);
      expect(instance1).toBe(metricsCollector);
    });
  });

  describe('recordRequest', () => {
    it('should record successful request metrics', async () => {
      const { redisCache } = require('@/lib/redis');
      
      await metricsCollector.recordRequest(
        'create-preference',
        'POST',
        200,
        1500,
        { clientIP: '192.168.1.1' }
      );

      // Verificar que se registraron las métricas correctas
      expect(redisCache.incr).toHaveBeenCalledWith(
        expect.stringContaining('metrics:create-preference:POST:requests:total')
      );
      expect(redisCache.incr).toHaveBeenCalledWith(
        expect.stringContaining('metrics:create-preference:POST:requests:success')
      );
      expect(redisCache.client.lpush).toHaveBeenCalledWith(
        expect.stringContaining('metrics:create-preference:POST:response_time'),
        '1500'
      );
    });

    it('should record error request metrics', async () => {
      const { redisCache } = require('@/lib/redis');
      
      await metricsCollector.recordRequest(
        'create-preference',
        'POST',
        500,
        2000
      );

      expect(redisCache.incr).toHaveBeenCalledWith(
        expect.stringContaining('metrics:create-preference:POST:requests:total')
      );
      expect(redisCache.incr).toHaveBeenCalledWith(
        expect.stringContaining('metrics:create-preference:POST:requests:error')
      );
      expect(redisCache.incr).toHaveBeenCalledWith(
        expect.stringContaining('metrics:create-preference:POST:errors:5xx')
      );
    });

    it('should record rate limited request metrics', async () => {
      const { redisCache } = require('@/lib/redis');
      
      await metricsCollector.recordRequest(
        'webhook',
        'POST',
        429,
        500
      );

      expect(redisCache.incr).toHaveBeenCalledWith(
        expect.stringContaining('metrics:webhook:POST:requests:total')
      );
      expect(redisCache.incr).toHaveBeenCalledWith(
        expect.stringContaining('metrics:webhook:POST:requests:rate_limited')
      );
    });

    it('should categorize 4xx errors correctly', async () => {
      const { redisCache } = require('@/lib/redis');
      
      await metricsCollector.recordRequest(
        'create-preference',
        'POST',
        400,
        300
      );

      expect(redisCache.incr).toHaveBeenCalledWith(
        expect.stringContaining('metrics:create-preference:POST:errors:4xx')
      );
    });

    it('should handle errors gracefully', async () => {
      const { redisCache } = require('@/lib/redis');
      const { logger } = require('@/lib/logger');
      
      redisCache.incr.mockRejectedValue(new Error('Redis error'));
      
      // No debería lanzar error
      await expect(metricsCollector.recordRequest(
        'test-endpoint',
        'GET',
        200,
        1000
      )).resolves.not.toThrow();

      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('recordRetry', () => {
    it('should record successful retry metrics without errors', async () => {
      await expect(metricsCollector.recordRetry(
        'createPaymentPreference',
        3,
        true,
        5000
      )).resolves.not.toThrow();
    });

    it('should record failed retry metrics without errors', async () => {
      await expect(metricsCollector.recordRetry(
        'getPaymentInfo',
        2,
        false,
        3000
      )).resolves.not.toThrow();
    });
  });

  describe('recordRateLimit', () => {
    it('should record rate limit metrics without errors', async () => {
      await expect(metricsCollector.recordRateLimit(
        'create-preference',
        false,
        8,
        10
      )).resolves.not.toThrow();
    });

    it('should record blocked rate limit metrics without errors', async () => {
      await expect(metricsCollector.recordRateLimit(
        'webhook',
        true,
        0,
        100
      )).resolves.not.toThrow();
    });
  });

  describe('getApiMetrics', () => {
    it('should return empty metrics when no data available', async () => {
      const { redisCache } = require('@/lib/redis');
      
      // Mock empty responses
      redisCache.get.mockResolvedValue(null);
      redisCache.client.lrange.mockResolvedValue([]);
      
      const metrics = await metricsCollector.getApiMetrics('test-endpoint', 'GET', 1);
      
      expect(metrics).toEqual({
        requests: { total: 0, success: 0, error: 0, rate_limited: 0 },
        response_times: { count: 0, sum: 0, avg: 0, min: 0, max: 0, p95: 0, p99: 0 },
        error_rates: { '4xx': 0, '5xx': 0, network: 0, timeout: 0 },
        retry_stats: { total_retries: 0, successful_retries: 0, failed_retries: 0, avg_attempts: 0 },
      });
    });

    it('should aggregate metrics correctly', async () => {
      const { redisCache } = require('@/lib/redis');
      
      // Mock counter data
      redisCache.get.mockImplementation((key) => {
        if (key.includes('total')) return '100';
        if (key.includes('success')) return '95';
        if (key.includes('error')) return '5';
        return '0';
      });
      
      // Mock response time data
      redisCache.client.lrange.mockResolvedValue(['1000', '1500', '2000', '800', '1200']);
      
      const metrics = await metricsCollector.getApiMetrics('test-endpoint', 'GET', 1);
      
      expect(metrics.requests.total).toBeGreaterThan(0);
      expect(metrics.requests.success).toBeGreaterThan(0);
      expect(metrics.response_times.count).toBeGreaterThan(0);
      expect(metrics.response_times.avg).toBeGreaterThan(0);
    });

    it('should handle errors gracefully and return empty metrics', async () => {
      const { redisCache } = require('@/lib/redis');
      const { logger } = require('@/lib/logger');
      
      redisCache.get.mockRejectedValue(new Error('Redis error'));
      
      const metrics = await metricsCollector.getApiMetrics('test-endpoint', 'GET', 1);
      
      expect(logger.error).toHaveBeenCalled();
      expect(metrics.requests.total).toBe(0);
    });
  });

  describe('Window Key Generation', () => {
    it('should generate consistent window keys', () => {
      const collector = new (MetricsCollector as any)();
      const timestamp1 = 1640995200000; // 2022-01-01 00:00:00
      const timestamp2 = 1640995260000; // 2022-01-01 00:01:00 (same window)
      const timestamp3 = 1640995500000; // 2022-01-01 00:05:00 (next window)
      
      const key1 = collector.getWindowKey('test:metric', timestamp1);
      const key2 = collector.getWindowKey('test:metric', timestamp2);
      const key3 = collector.getWindowKey('test:metric', timestamp3);
      
      expect(key1).toBe(key2); // Same 5-minute window
      expect(key1).not.toBe(key3); // Different window
    });
  });

  describe('Value Statistics', () => {
    it('should calculate percentiles correctly', async () => {
      const collector = metricsCollector as any;
      const { redisCache } = require('@/lib/redis');

      // Mock response times: [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]
      const values = Array.from({ length: 10 }, (_, i) => ((i + 1) * 100).toString());

      // Mock para que solo devuelva valores una vez
      redisCache.client.lrange.mockResolvedValueOnce(values).mockResolvedValue([]);

      const stats = await collector.getValueStats('test:response_time', 0, Date.now());

      expect(stats.count).toBe(10);
      expect(stats.min).toBe(100);
      expect(stats.max).toBe(1000);
      expect(stats.avg).toBe(550);
      expect(stats.p95).toBeGreaterThan(900); // 95th percentile
      expect(stats.p99).toBeGreaterThan(950); // 99th percentile
    });

    it('should handle empty value arrays', async () => {
      const collector = metricsCollector as any;
      const { redisCache } = require('@/lib/redis');
      
      redisCache.client.lrange.mockResolvedValue([]);
      
      const stats = await collector.getValueStats('test:response_time', 0, Date.now());
      
      expect(stats).toEqual({
        count: 0,
        sum: 0,
        avg: 0,
        min: 0,
        max: 0,
        p95: 0,
        p99: 0,
      });
    });
  });
});
