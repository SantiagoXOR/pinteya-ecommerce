// ===================================
// PINTEYA E-COMMERCE - CACHE MANAGER TESTS
// ===================================

import { CacheManager, cacheManager, CACHE_CONFIGS, CacheUtils } from '@/lib/cache-manager'

// Mock Redis
jest.mock('@/lib/redis', () => ({
  redisCache: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  },
}))

// Mock logger
jest.mock('@/lib/enterprise/logger', () => ({
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
    CACHE: 'cache',
    SYSTEM: 'system',
  },
}))

describe('CacheManager', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = CacheManager.getInstance()
      const instance2 = CacheManager.getInstance()

      expect(instance1).toBe(instance2)
      expect(instance1).toBe(cacheManager)
    })
  })

  describe('get', () => {
    it('should return cached value when available', async () => {
      const { redisCache } = require('@/lib/redis')
      const testData = { id: 1, name: 'Test' }

      redisCache.get.mockResolvedValue(JSON.stringify(testData))

      const result = await cacheManager.get('test-key', CACHE_CONFIGS.PRODUCT_DATA)

      expect(result).toEqual(testData)
      expect(redisCache.get).toHaveBeenCalledWith('cache:product:test-key')
    })

    it('should return null when cache miss', async () => {
      const { redisCache } = require('@/lib/redis')

      redisCache.get.mockResolvedValue(null)

      const result = await cacheManager.get('missing-key', CACHE_CONFIGS.PRODUCT_DATA)

      expect(result).toBeNull()
    })

    it('should handle errors gracefully', async () => {
      const { redisCache } = require('@/lib/redis')
      const { logger } = require('@/lib/enterprise/logger')

      redisCache.get.mockRejectedValue(new Error('Redis error'))

      const result = await cacheManager.get('error-key', CACHE_CONFIGS.PRODUCT_DATA)

      expect(result).toBeNull()
      expect(logger.error).toHaveBeenCalled()
    })
  })

  describe('set', () => {
    it('should store value in cache', async () => {
      const { redisCache } = require('@/lib/redis')
      const testData = { id: 1, name: 'Test' }

      redisCache.set.mockResolvedValue(true)

      const result = await cacheManager.set('test-key', testData, CACHE_CONFIGS.PRODUCT_DATA)

      expect(result).toBe(true)
      expect(redisCache.set).toHaveBeenCalledWith(
        'cache:product:test-key',
        JSON.stringify(testData),
        CACHE_CONFIGS.PRODUCT_DATA.ttl
      )
    })

    it('should handle serialization errors', async () => {
      const { logger } = require('@/lib/enterprise/logger')

      // Crear objeto circular que no se puede serializar
      const circularObj: any = { name: 'test' }
      circularObj.self = circularObj

      await expect(
        cacheManager.set('circular-key', circularObj, CACHE_CONFIGS.PRODUCT_DATA)
      ).resolves.toBe(false)

      expect(logger.error).toHaveBeenCalled()
    })
  })

  describe('delete', () => {
    it('should delete value from cache', async () => {
      const { redisCache } = require('@/lib/redis')

      redisCache.del.mockResolvedValue(true)

      const result = await cacheManager.delete('test-key', CACHE_CONFIGS.PRODUCT_DATA)

      expect(result).toBe(true)
      expect(redisCache.del).toHaveBeenCalledWith('cache:product:test-key')
    })
  })

  describe('getOrSet', () => {
    it('should return cached value if available', async () => {
      const { redisCache } = require('@/lib/redis')
      const cachedData = { id: 1, name: 'Cached' }
      const fetcherFn = jest.fn().mockResolvedValue({ id: 1, name: 'Fresh' })

      redisCache.get.mockResolvedValue(JSON.stringify(cachedData))

      const result = await cacheManager.getOrSet('test-key', fetcherFn, CACHE_CONFIGS.PRODUCT_DATA)

      expect(result).toEqual(cachedData)
      expect(fetcherFn).not.toHaveBeenCalled()
    })

    it('should fetch and cache value if not in cache', async () => {
      const { redisCache } = require('@/lib/redis')
      const freshData = { id: 1, name: 'Fresh' }
      const fetcherFn = jest.fn().mockResolvedValue(freshData)

      redisCache.get.mockResolvedValue(null)
      redisCache.set.mockResolvedValue(true)

      const result = await cacheManager.getOrSet('test-key', fetcherFn, CACHE_CONFIGS.PRODUCT_DATA)

      expect(result).toEqual(freshData)
      expect(fetcherFn).toHaveBeenCalled()
    })

    it('should propagate fetcher errors', async () => {
      const { redisCache } = require('@/lib/redis')
      const fetcherError = new Error('Fetcher failed')
      const fetcherFn = jest.fn().mockRejectedValue(fetcherError)

      redisCache.get.mockResolvedValue(null)

      await expect(
        cacheManager.getOrSet('test-key', fetcherFn, CACHE_CONFIGS.PRODUCT_DATA)
      ).rejects.toThrow('Fetcher failed')
    })
  })

  describe('Cache Configurations', () => {
    it('should have MercadoPago response config', () => {
      const config = CACHE_CONFIGS.MERCADOPAGO_RESPONSE

      expect(config.ttl).toBe(300)
      expect(config.prefix).toBe('mp_response')
      expect(config.compress).toBe(true)
      expect(config.serialize).toBe(true)
    })

    it('should have payment info config', () => {
      const config = CACHE_CONFIGS.PAYMENT_INFO

      expect(config.ttl).toBe(1800)
      expect(config.prefix).toBe('payment_info')
      expect(config.serialize).toBe(true)
    })

    it('should have product data config', () => {
      const config = CACHE_CONFIGS.PRODUCT_DATA

      expect(config.ttl).toBe(900)
      expect(config.prefix).toBe('product')
      expect(config.compress).toBe(true)
      expect(config.serialize).toBe(true)
    })
  })

  describe('Compression', () => {
    it('should compress large data when enabled', async () => {
      const { redisCache } = require('@/lib/redis')
      const largeData = 'x'.repeat(2000) // String > 1000 chars

      redisCache.set.mockResolvedValue(true)

      await cacheManager.set('large-key', largeData, {
        ...CACHE_CONFIGS.PRODUCT_DATA,
        compress: true,
      })

      const setCall = redisCache.set.mock.calls[0]
      expect(setCall[1]).toContain('COMPRESSED:')
    })

    it('should decompress data when retrieving', async () => {
      const { redisCache } = require('@/lib/redis')
      const originalData = 'test data'
      const compressedData = `COMPRESSED:"${originalData}"`

      redisCache.get.mockResolvedValue(compressedData)

      const result = await cacheManager.get('compressed-key', {
        ...CACHE_CONFIGS.PRODUCT_DATA,
        compress: true,
      })

      expect(result).toBe(originalData)
    })
  })
})

describe('CacheUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('cacheMercadoPagoResponse', () => {
    it('should cache MercadoPago response', async () => {
      const { redisCache } = require('@/lib/redis')
      const responseData = { id: 'mp123', status: 'approved' }
      const fetcherFn = jest.fn().mockResolvedValue(responseData)

      redisCache.get.mockResolvedValue(null)
      redisCache.set.mockResolvedValue(true)

      const result = await CacheUtils.cacheMercadoPagoResponse('test-key', fetcherFn)

      expect(result).toEqual(responseData)
      expect(fetcherFn).toHaveBeenCalled()
    })
  })

  describe('cachePaymentInfo', () => {
    it('should cache payment info with payment ID', async () => {
      const { redisCache } = require('@/lib/redis')
      const paymentData = { id: '123', amount: 100 }
      const fetcherFn = jest.fn().mockResolvedValue(paymentData)

      redisCache.get.mockResolvedValue(null)
      redisCache.set.mockResolvedValue(true)

      const result = await CacheUtils.cachePaymentInfo('123', fetcherFn)

      expect(result).toEqual(paymentData)
      expect(redisCache.get).toHaveBeenCalledWith('cache:payment_info:payment:123')
    })
  })

  describe('cacheProductData', () => {
    it('should cache product data with product ID', async () => {
      const { redisCache } = require('@/lib/redis')
      const productData = { id: '456', name: 'Test Product' }
      const fetcherFn = jest.fn().mockResolvedValue(productData)

      redisCache.get.mockResolvedValue(null)
      redisCache.set.mockResolvedValue(true)

      const result = await CacheUtils.cacheProductData('456', fetcherFn)

      expect(result).toEqual(productData)
      expect(redisCache.get).toHaveBeenCalledWith('cache:product:product:456')
    })
  })

  describe('invalidatePayment', () => {
    it('should invalidate payment cache', async () => {
      const { redisCache } = require('@/lib/redis')

      redisCache.del.mockResolvedValue(true)

      const result = await CacheUtils.invalidatePayment('123')

      expect(result).toBe(true)
      expect(redisCache.del).toHaveBeenCalledWith('cache:payment_info:payment:123')
    })
  })

  describe('invalidateProduct', () => {
    it('should invalidate product cache', async () => {
      const { redisCache } = require('@/lib/redis')

      redisCache.del.mockResolvedValue(true)

      const result = await CacheUtils.invalidateProduct('456')

      expect(result).toBe(true)
      expect(redisCache.del).toHaveBeenCalledWith('cache:product:product:456')
    })
  })
})
