// ===================================
// TESTS - TIMEOUT CONFIGURATION
// ===================================

import {
  EXTERNAL_API_TIMEOUTS,
  DATABASE_TIMEOUTS,
  CACHE_TIMEOUTS,
  INTERNAL_API_TIMEOUTS,
  COMMON_TIMEOUTS,
  TimeoutUtils,
  RETRY_CONFIG,
} from '@/config/timeouts'

describe('Timeout Configuration', () => {
  describe('EXTERNAL_API_TIMEOUTS', () => {
    it('should have all MercadoPago timeouts defined', () => {
      expect(EXTERNAL_API_TIMEOUTS.MERCADOPAGO).toBeDefined()
      expect(EXTERNAL_API_TIMEOUTS.MERCADOPAGO.PAYMENT_CREATION).toBe(15000)
      expect(EXTERNAL_API_TIMEOUTS.MERCADOPAGO.PAYMENT_STATUS).toBe(10000)
      expect(EXTERNAL_API_TIMEOUTS.MERCADOPAGO.WEBHOOK_PROCESSING).toBe(5000)
      expect(EXTERNAL_API_TIMEOUTS.MERCADOPAGO.PREFERENCE_CREATION).toBe(12000)
      expect(EXTERNAL_API_TIMEOUTS.MERCADOPAGO.REFUND_PROCESSING).toBe(20000)
    })

    it('should have reasonable timeout values', () => {
      // Todos los timeouts deberían ser números positivos
      Object.values(EXTERNAL_API_TIMEOUTS.MERCADOPAGO).forEach(timeout => {
        expect(typeof timeout).toBe('number')
        expect(timeout).toBeGreaterThan(0)
        expect(timeout).toBeLessThanOrEqual(30000) // Máximo 30 segundos
      })
    })

    it('should have third party timeouts', () => {
      expect(EXTERNAL_API_TIMEOUTS.THIRD_PARTY.DEFAULT).toBe(10000)
      expect(EXTERNAL_API_TIMEOUTS.THIRD_PARTY.SLOW_OPERATIONS).toBe(30000)
      expect(EXTERNAL_API_TIMEOUTS.THIRD_PARTY.FAST_OPERATIONS).toBe(5000)
    })
  })

  describe('DATABASE_TIMEOUTS', () => {
    it('should have read operation timeouts', () => {
      expect(DATABASE_TIMEOUTS.READ.SIMPLE_QUERY).toBe(5000)
      expect(DATABASE_TIMEOUTS.READ.COMPLEX_QUERY).toBe(15000)
      expect(DATABASE_TIMEOUTS.READ.AGGREGATION).toBe(20000)
      expect(DATABASE_TIMEOUTS.READ.SEARCH).toBe(10000)
    })

    it('should have write operation timeouts', () => {
      expect(DATABASE_TIMEOUTS.WRITE.INSERT).toBe(8000)
      expect(DATABASE_TIMEOUTS.WRITE.UPDATE).toBe(10000)
      expect(DATABASE_TIMEOUTS.WRITE.DELETE).toBe(12000)
      expect(DATABASE_TIMEOUTS.WRITE.BULK_OPERATIONS).toBe(30000)
    })

    it('should have transaction timeouts', () => {
      expect(DATABASE_TIMEOUTS.TRANSACTION.SIMPLE).toBe(15000)
      expect(DATABASE_TIMEOUTS.TRANSACTION.COMPLEX).toBe(30000)
      expect(DATABASE_TIMEOUTS.TRANSACTION.MIGRATION).toBe(60000)
    })

    it('should have connection timeouts', () => {
      expect(DATABASE_TIMEOUTS.CONNECTION.ACQUIRE).toBe(5000)
      expect(DATABASE_TIMEOUTS.CONNECTION.IDLE_TIMEOUT).toBe(300000)
      expect(DATABASE_TIMEOUTS.CONNECTION.LIFETIME).toBe(1800000)
    })
  })

  describe('CACHE_TIMEOUTS', () => {
    it('should have Redis timeouts', () => {
      expect(CACHE_TIMEOUTS.REDIS.CONNECT).toBe(5000)
      expect(CACHE_TIMEOUTS.REDIS.COMMAND).toBe(3000)
      expect(CACHE_TIMEOUTS.REDIS.PIPELINE).toBe(10000)
    })

    it('should have memory cache timeouts', () => {
      expect(CACHE_TIMEOUTS.MEMORY.OPERATION).toBe(1000)
      expect(CACHE_TIMEOUTS.MEMORY.CLEANUP).toBe(5000)
    })

    it('should have CDN timeouts', () => {
      expect(CACHE_TIMEOUTS.CDN.PURGE).toBe(30000)
      expect(CACHE_TIMEOUTS.CDN.UPLOAD).toBe(60000)
    })
  })

  describe('INTERNAL_API_TIMEOUTS', () => {
    it('should have product API timeouts', () => {
      expect(INTERNAL_API_TIMEOUTS.PRODUCTS.LIST).toBe(8000)
      expect(INTERNAL_API_TIMEOUTS.PRODUCTS.DETAIL).toBe(5000)
      expect(INTERNAL_API_TIMEOUTS.PRODUCTS.SEARCH).toBe(10000)
      expect(INTERNAL_API_TIMEOUTS.PRODUCTS.CREATE).toBe(12000)
      expect(INTERNAL_API_TIMEOUTS.PRODUCTS.UPDATE).toBe(10000)
      expect(INTERNAL_API_TIMEOUTS.PRODUCTS.DELETE).toBe(8000)
    })

    it('should have user API timeouts', () => {
      expect(INTERNAL_API_TIMEOUTS.USERS.AUTHENTICATION).toBe(8000)
      expect(INTERNAL_API_TIMEOUTS.USERS.PROFILE).toBe(5000)
      expect(INTERNAL_API_TIMEOUTS.USERS.UPDATE_PROFILE).toBe(10000)
      expect(INTERNAL_API_TIMEOUTS.USERS.PASSWORD_RESET).toBe(15000)
    })

    it('should have cart API timeouts', () => {
      expect(INTERNAL_API_TIMEOUTS.CART.ADD_ITEM).toBe(5000)
      expect(INTERNAL_API_TIMEOUTS.CART.REMOVE_ITEM).toBe(3000)
      expect(INTERNAL_API_TIMEOUTS.CART.UPDATE_QUANTITY).toBe(4000)
      expect(INTERNAL_API_TIMEOUTS.CART.CLEAR).toBe(3000)
      expect(INTERNAL_API_TIMEOUTS.CART.CHECKOUT).toBe(20000)
    })
  })

  describe('COMMON_TIMEOUTS', () => {
    it('should have predefined common timeouts', () => {
      expect(COMMON_TIMEOUTS.VERY_SHORT).toBeGreaterThan(0)
      expect(COMMON_TIMEOUTS.SHORT).toBeGreaterThan(COMMON_TIMEOUTS.VERY_SHORT)
      expect(COMMON_TIMEOUTS.MEDIUM).toBeGreaterThan(COMMON_TIMEOUTS.SHORT)
      expect(COMMON_TIMEOUTS.LONG).toBeGreaterThan(COMMON_TIMEOUTS.MEDIUM)
      expect(COMMON_TIMEOUTS.VERY_LONG).toBeGreaterThan(COMMON_TIMEOUTS.LONG)
    })
  })

  describe('RETRY_CONFIG', () => {
    it('should have default retry configuration', () => {
      expect(RETRY_CONFIG.DEFAULT.maxRetries).toBe(3)
      expect(RETRY_CONFIG.DEFAULT.baseDelay).toBe(1000)
      expect(RETRY_CONFIG.DEFAULT.maxDelay).toBe(10000)
      expect(RETRY_CONFIG.DEFAULT.backoffMultiplier).toBe(2)
    })

    it('should have critical retry configuration', () => {
      expect(RETRY_CONFIG.CRITICAL.maxRetries).toBe(5)
      expect(RETRY_CONFIG.CRITICAL.baseDelay).toBe(500)
      expect(RETRY_CONFIG.CRITICAL.maxDelay).toBe(5000)
      expect(RETRY_CONFIG.CRITICAL.backoffMultiplier).toBe(1.5)
    })

    it('should have non-critical retry configuration', () => {
      expect(RETRY_CONFIG.NON_CRITICAL.maxRetries).toBe(2)
      expect(RETRY_CONFIG.NON_CRITICAL.baseDelay).toBe(2000)
      expect(RETRY_CONFIG.NON_CRITICAL.maxDelay).toBe(15000)
      expect(RETRY_CONFIG.NON_CRITICAL.backoffMultiplier).toBe(3)
    })
  })
})

describe('TimeoutUtils', () => {
  // Mock NODE_ENV para tests
  const originalEnv = process.env.NODE_ENV

  afterEach(() => {
    process.env.NODE_ENV = originalEnv
  })

  describe('getEnvironmentTimeout', () => {
    it('should apply development multiplier', () => {
      process.env.NODE_ENV = 'development'
      const baseTimeout = 1000
      const adjustedTimeout = TimeoutUtils.getEnvironmentTimeout(baseTimeout)

      // En desarrollo debería ser 2x (multiplier: 2)
      expect(adjustedTimeout).toBe(2000)
    })

    it('should apply staging multiplier', () => {
      process.env.NODE_ENV = 'staging'
      const baseTimeout = 1000
      const adjustedTimeout = TimeoutUtils.getEnvironmentTimeout(baseTimeout)

      // En staging debería ser 1.5x (multiplier: 1.5)
      expect(adjustedTimeout).toBe(1500)
    })

    it('should apply production multiplier', () => {
      process.env.NODE_ENV = 'production'
      const baseTimeout = 1000
      const adjustedTimeout = TimeoutUtils.getEnvironmentTimeout(baseTimeout)

      // En producción debería ser 1x (multiplier: 1)
      expect(adjustedTimeout).toBe(1000)
    })

    it('should respect maximum timeout limits', () => {
      process.env.NODE_ENV = 'development'
      const baseTimeout = 50000 // 50 segundos
      const adjustedTimeout = TimeoutUtils.getEnvironmentTimeout(baseTimeout)

      // No debería exceder el máximo de desarrollo (60000ms)
      expect(adjustedTimeout).toBeLessThanOrEqual(60000)
    })

    it('should default to development for unknown environments', () => {
      process.env.NODE_ENV = 'unknown'
      const baseTimeout = 1000
      const adjustedTimeout = TimeoutUtils.getEnvironmentTimeout(baseTimeout)

      // Debería usar configuración de desarrollo por defecto
      expect(adjustedTimeout).toBe(2000)
    })
  })

  describe('createTimeoutController', () => {
    it('should create AbortController that aborts after timeout', done => {
      const timeout = 100 // 100ms
      const controller = TimeoutUtils.createTimeoutController(timeout)

      expect(controller.signal.aborted).toBe(false)

      setTimeout(() => {
        expect(controller.signal.aborted).toBe(true)
        done()
      }, timeout + 10)
    })

    it('should allow manual abort before timeout', () => {
      const timeout = 1000 // 1 segundo
      const controller = TimeoutUtils.createTimeoutController(timeout)

      expect(controller.signal.aborted).toBe(false)

      controller.abort()
      expect(controller.signal.aborted).toBe(true)
    })
  })

  describe('withTimeout', () => {
    it('should resolve when promise completes before timeout', async () => {
      const fastPromise = new Promise(resolve => {
        setTimeout(() => resolve('success'), 50)
      })

      const result = await TimeoutUtils.withTimeout(fastPromise, 100)
      expect(result).toBe('success')
    })

    it('should reject when promise takes longer than timeout', async () => {
      const slowPromise = new Promise(resolve => {
        setTimeout(() => resolve('success'), 200)
      })

      await expect(TimeoutUtils.withTimeout(slowPromise, 100)).rejects.toThrow(
        'Operation timed out after 100ms'
      )
    })

    it('should use custom error message', async () => {
      const slowPromise = new Promise(resolve => {
        setTimeout(() => resolve('success'), 200)
      })

      await expect(
        TimeoutUtils.withTimeout(slowPromise, 100, 'Custom timeout error')
      ).rejects.toThrow('Custom timeout error')
    })

    it('should reject with original error if promise rejects before timeout', async () => {
      const failingPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Original error')), 50)
      })

      await expect(TimeoutUtils.withTimeout(failingPromise, 100)).rejects.toThrow('Original error')
    })
  })

  describe('withRetry', () => {
    it('should succeed on first attempt', async () => {
      const successfulOperation = jest.fn().mockResolvedValue('success')

      const result = await TimeoutUtils.withRetry(successfulOperation)

      expect(result).toBe('success')
      expect(successfulOperation).toHaveBeenCalledTimes(1)
    })

    it('should retry on failure and eventually succeed', async () => {
      const operation = jest
        .fn()
        .mockRejectedValueOnce(new Error('Attempt 1 failed'))
        .mockRejectedValueOnce(new Error('Attempt 2 failed'))
        .mockResolvedValue('success')

      const result = await TimeoutUtils.withRetry(operation, {
        maxRetries: 3,
        baseDelay: 10, // Delay corto para test
        maxDelay: 100,
        backoffMultiplier: 2,
      })

      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(3)
    })

    it('should fail after max retries', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Always fails'))

      await expect(
        TimeoutUtils.withRetry(operation, {
          maxRetries: 2,
          baseDelay: 10,
          maxDelay: 100,
          backoffMultiplier: 2,
        })
      ).rejects.toThrow('Always fails')

      expect(operation).toHaveBeenCalledTimes(3) // Initial + 2 retries
    })

    it('should implement exponential backoff', async () => {
      const operation = jest
        .fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValue('success')

      const startTime = Date.now()

      await TimeoutUtils.withRetry(operation, {
        maxRetries: 2,
        baseDelay: 100,
        maxDelay: 1000,
        backoffMultiplier: 2,
      })

      const endTime = Date.now()
      const totalTime = endTime - startTime

      // Debería haber esperado al menos 100ms + 200ms = 300ms
      expect(totalTime).toBeGreaterThanOrEqual(250) // Margen para timing
    })

    it('should respect max delay', async () => {
      const operation = jest
        .fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValue('success')

      const startTime = Date.now()

      await TimeoutUtils.withRetry(operation, {
        maxRetries: 2,
        baseDelay: 1000,
        maxDelay: 50, // Máximo muy bajo
        backoffMultiplier: 10,
      })

      const endTime = Date.now()
      const totalTime = endTime - startTime

      // No debería haber esperado más de 100ms total (50ms * 2 retries)
      expect(totalTime).toBeLessThan(200)
    })
  })

  describe('getTimeout', () => {
    it('should return correct timeout for valid category and operation', () => {
      const timeout = TimeoutUtils.getTimeout('database', 'READ.SIMPLE_QUERY')
      expect(timeout).toBeGreaterThan(0)
    })

    it('should return correct timeout for nested operations', () => {
      const timeout = TimeoutUtils.getTimeout('internal-api', 'PRODUCTS.LIST')
      expect(timeout).toBeGreaterThan(0)
    })

    it('should return default timeout for invalid category', () => {
      const timeout = TimeoutUtils.getTimeout('invalid-category', 'SOME_OPERATION')
      expect(timeout).toBeGreaterThan(0)
    })

    it('should return default timeout for invalid operation', () => {
      const timeout = TimeoutUtils.getTimeout('database', 'INVALID_OPERATION')
      expect(timeout).toBeGreaterThan(0)
    })

    it('should handle deep nested operations', () => {
      const timeout = TimeoutUtils.getTimeout('external-api', 'MERCADOPAGO.PAYMENT_CREATION')
      expect(timeout).toBeGreaterThan(0)
    })
  })
})

describe('Timeout Integration Tests', () => {
  it('should work with real async operations', async () => {
    const mockApiCall = () =>
      new Promise(resolve => {
        setTimeout(() => resolve('API response'), 50)
      })

    const controller = TimeoutUtils.createTimeoutController(100)

    const result = await Promise.race([
      mockApiCall(),
      new Promise((_, reject) => {
        controller.signal.addEventListener('abort', () => {
          reject(new Error('Request aborted'))
        })
      }),
    ])

    expect(result).toBe('API response')
  })

  it('should handle timeout in real scenario', async () => {
    const slowApiCall = () =>
      new Promise(resolve => {
        setTimeout(() => resolve('Slow response'), 200)
      })

    await expect(TimeoutUtils.withTimeout(slowApiCall(), 100)).rejects.toThrow(
      'Operation timed out after 100ms'
    )
  })

  it('should work with retry in real scenario', async () => {
    let attempts = 0
    const unreliableApiCall = () =>
      new Promise((resolve, reject) => {
        attempts++
        if (attempts < 3) {
          reject(new Error(`Attempt ${attempts} failed`))
        } else {
          resolve('Success after retries')
        }
      })

    const result = await TimeoutUtils.withRetry(unreliableApiCall, {
      maxRetries: 3,
      baseDelay: 10,
      maxDelay: 100,
      backoffMultiplier: 2,
    })

    expect(result).toBe('Success after retries')
    expect(attempts).toBe(3)
  })
})

describe('Environment-specific Timeout Behavior', () => {
  const originalEnv = process.env.NODE_ENV

  afterEach(() => {
    process.env.NODE_ENV = originalEnv
  })

  it('should have longer timeouts in development', () => {
    process.env.NODE_ENV = 'development'
    const devTimeout = TimeoutUtils.getEnvironmentTimeout(1000)

    process.env.NODE_ENV = 'production'
    const prodTimeout = TimeoutUtils.getEnvironmentTimeout(1000)

    expect(devTimeout).toBeGreaterThan(prodTimeout)
  })

  it('should have intermediate timeouts in staging', () => {
    process.env.NODE_ENV = 'development'
    const devTimeout = TimeoutUtils.getEnvironmentTimeout(1000)

    process.env.NODE_ENV = 'staging'
    const stagingTimeout = TimeoutUtils.getEnvironmentTimeout(1000)

    process.env.NODE_ENV = 'production'
    const prodTimeout = TimeoutUtils.getEnvironmentTimeout(1000)

    expect(stagingTimeout).toBeGreaterThan(prodTimeout)
    expect(stagingTimeout).toBeLessThan(devTimeout)
  })
})
