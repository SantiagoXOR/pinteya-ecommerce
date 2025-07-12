// ===================================
// PINTEYA E-COMMERCE - REDIS TESTS
// ===================================

import { 
  getRedisClient, 
  isRedisAvailable, 
  RedisCache, 
  getRateLimitInfo, 
  incrementRateLimit 
} from '@/lib/redis';

// Mock ioredis
jest.mock('ioredis', () => {
  const mockRedis = {
    ping: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
    ttl: jest.fn(),
    pipeline: jest.fn(),
    quit: jest.fn(),
    on: jest.fn(),
  };

  return jest.fn().mockImplementation(() => mockRedis);
});

// Obtener referencia al mock después de la definición
const Redis = require('ioredis');
const mockRedis = new Redis();

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
  LogLevel: {
    INFO: 'info',
    DEBUG: 'debug',
    WARN: 'warn',
    ERROR: 'error',
  },
  LogCategory: {
    SYSTEM: 'system',
    CACHE: 'cache',
  },
}));

describe('Redis Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getRedisClient', () => {
    it('should create and return Redis client', () => {
      const client = getRedisClient();
      expect(client).toBeDefined();
      expect(typeof client).toBe('object');
    });

    it('should return same instance on multiple calls', () => {
      const client1 = getRedisClient();
      const client2 = getRedisClient();
      expect(client1).toBe(client2);
    });
  });

  describe('isRedisAvailable', () => {
    it('should return true when Redis is available', async () => {
      mockRedis.ping.mockResolvedValue('PONG');
      
      const available = await isRedisAvailable();
      
      expect(available).toBe(true);
      expect(mockRedis.ping).toHaveBeenCalled();
    });

    it('should return false when Redis is not available', async () => {
      mockRedis.ping.mockRejectedValue(new Error('Connection failed'));
      
      const available = await isRedisAvailable();
      
      expect(available).toBe(false);
      expect(mockRedis.ping).toHaveBeenCalled();
    });
  });
});

describe('RedisCache', () => {
  let cache: RedisCache;

  beforeEach(() => {
    jest.clearAllMocks();
    cache = new RedisCache();
  });

  describe('get', () => {
    it('should get value from cache', async () => {
      const testValue = 'test-value';
      mockRedis.get.mockResolvedValue(testValue);

      const result = await cache.get('test-key');

      expect(result).toBe(testValue);
      expect(mockRedis.get).toHaveBeenCalledWith('test-key');
    });

    it('should return null when key does not exist', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await cache.get('non-existent-key');

      expect(result).toBeNull();
      expect(mockRedis.get).toHaveBeenCalledWith('non-existent-key');
    });

    it('should handle errors gracefully', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis error'));

      const result = await cache.get('error-key');

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should set value without TTL', async () => {
      mockRedis.set.mockResolvedValue('OK');

      const result = await cache.set('test-key', 'test-value');

      expect(result).toBe(true);
      expect(mockRedis.set).toHaveBeenCalledWith('test-key', 'test-value');
    });

    it('should set value with TTL', async () => {
      mockRedis.setex.mockResolvedValue('OK');

      const result = await cache.set('test-key', 'test-value', 3600);

      expect(result).toBe(true);
      expect(mockRedis.setex).toHaveBeenCalledWith('test-key', 3600, 'test-value');
    });

    it('should handle errors gracefully', async () => {
      mockRedis.set.mockRejectedValue(new Error('Redis error'));

      const result = await cache.set('error-key', 'test-value');

      expect(result).toBe(false);
    });
  });

  describe('del', () => {
    it('should delete existing key', async () => {
      mockRedis.del.mockResolvedValue(1);

      const result = await cache.del('test-key');

      expect(result).toBe(true);
      expect(mockRedis.del).toHaveBeenCalledWith('test-key');
    });

    it('should return false for non-existent key', async () => {
      mockRedis.del.mockResolvedValue(0);

      const result = await cache.del('non-existent-key');

      expect(result).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      mockRedis.del.mockRejectedValue(new Error('Redis error'));

      const result = await cache.del('error-key');

      expect(result).toBe(false);
    });
  });

  describe('incr', () => {
    it('should increment counter', async () => {
      mockRedis.incr.mockResolvedValue(5);

      const result = await cache.incr('counter-key');

      expect(result).toBe(5);
      expect(mockRedis.incr).toHaveBeenCalledWith('counter-key');
    });

    it('should handle errors gracefully', async () => {
      mockRedis.incr.mockRejectedValue(new Error('Redis error'));

      const result = await cache.incr('error-key');

      expect(result).toBeNull();
    });
  });

  describe('expire', () => {
    it('should set TTL for existing key', async () => {
      mockRedis.expire.mockResolvedValue(1);

      const result = await cache.expire('test-key', 3600);

      expect(result).toBe(true);
      expect(mockRedis.expire).toHaveBeenCalledWith('test-key', 3600);
    });

    it('should return false for non-existent key', async () => {
      mockRedis.expire.mockResolvedValue(0);

      const result = await cache.expire('non-existent-key', 3600);

      expect(result).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      mockRedis.expire.mockRejectedValue(new Error('Redis error'));

      const result = await cache.expire('error-key', 3600);

      expect(result).toBe(false);
    });
  });

  describe('ttl', () => {
    it('should get TTL for key', async () => {
      mockRedis.ttl.mockResolvedValue(3600);

      const result = await cache.ttl('test-key');

      expect(result).toBe(3600);
      expect(mockRedis.ttl).toHaveBeenCalledWith('test-key');
    });

    it('should handle errors gracefully', async () => {
      mockRedis.ttl.mockRejectedValue(new Error('Redis error'));

      const result = await cache.ttl('error-key');

      expect(result).toBeNull();
    });
  });
});

describe('Rate Limiting Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getRateLimitInfo', () => {
    it('should get rate limit info', async () => {
      const mockPipeline = {
        get: jest.fn().mockReturnThis(),
        ttl: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          [null, '5'],  // count
          [null, 3600]  // ttl
        ])
      };
      mockRedis.pipeline.mockReturnValue(mockPipeline);

      const result = await getRateLimitInfo('test-key');

      expect(result).toEqual({ count: 5, ttl: 3600 });
      expect(mockPipeline.get).toHaveBeenCalledWith('test-key');
      expect(mockPipeline.ttl).toHaveBeenCalledWith('test-key');
    });

    it('should handle errors gracefully', async () => {
      const mockPipeline = {
        get: jest.fn().mockReturnThis(),
        ttl: jest.fn().mockReturnThis(),
        exec: jest.fn().mockRejectedValue(new Error('Pipeline error'))
      };
      mockRedis.pipeline.mockReturnValue(mockPipeline);

      const result = await getRateLimitInfo('error-key');

      expect(result).toBeNull();
    });
  });

  describe('incrementRateLimit', () => {
    it('should increment rate limit counter', async () => {
      const mockPipeline = {
        incr: jest.fn().mockReturnThis(),
        expire: jest.fn().mockReturnThis(),
        ttl: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          [null, 1],    // incr result
          [null, 1],    // expire result
          [null, 3600]  // ttl result
        ])
      };
      mockRedis.pipeline.mockReturnValue(mockPipeline);

      const result = await incrementRateLimit('test-key', 3600);

      expect(result).toEqual({ count: 1, ttl: 3600, isNewWindow: true });
      expect(mockPipeline.incr).toHaveBeenCalledWith('test-key');
      expect(mockPipeline.expire).toHaveBeenCalledWith('test-key', 3600);
    });

    it('should handle errors gracefully', async () => {
      const mockPipeline = {
        incr: jest.fn().mockReturnThis(),
        expire: jest.fn().mockReturnThis(),
        ttl: jest.fn().mockReturnThis(),
        exec: jest.fn().mockRejectedValue(new Error('Pipeline error'))
      };
      mockRedis.pipeline.mockReturnValue(mockPipeline);

      const result = await incrementRateLimit('error-key', 3600);

      expect(result).toBeNull();
    });
  });
});
