// ===================================
// TESTS: API Timeouts Configuration
// ===================================

import {
  API_TIMEOUTS,
  ENDPOINT_TIMEOUTS,
  getTimeout,
  getEndpointTimeouts,
  createTimeoutController,
  fetchWithTimeout,
  withDatabaseTimeout,
  withExternalTimeout,
} from '@/lib/config/api-timeouts'

// Mock fetch para tests
global.fetch = jest.fn()
const mockFetch = fetch as jest.MockedFunction<typeof fetch>

// Mock environment variables
const originalEnv = process.env

beforeEach(() => {
  jest.clearAllMocks()
  process.env = { ...originalEnv }
})

afterAll(() => {
  process.env = originalEnv
})

describe('API Timeouts Configuration', () => {
  describe('Environment Variable Integration', () => {
    it('should use default values when env vars are not set', () => {
      // Clear environment variables
      delete process.env.API_TIMEOUT_DEFAULT
      delete process.env.API_TIMEOUT_DATABASE

      // Re-import to get fresh values
      jest.resetModules()
      const { API_TIMEOUTS } = require('@/lib/config/api-timeouts')

      expect(API_TIMEOUTS.default).toBe(30000)
      expect(API_TIMEOUTS.database).toBe(15000)
    })

    it('should use environment variables when provided', () => {
      process.env.API_TIMEOUT_DEFAULT = '45000'
      process.env.API_TIMEOUT_DATABASE = '20000'

      jest.resetModules()
      const { API_TIMEOUTS } = require('@/lib/config/api-timeouts')

      expect(API_TIMEOUTS.default).toBe(45000)
      expect(API_TIMEOUTS.database).toBe(20000)
    })

    it('should handle invalid environment variables gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      process.env.API_TIMEOUT_DEFAULT = 'invalid'
      process.env.API_TIMEOUT_DATABASE = '-1000'

      jest.resetModules()
      const { API_TIMEOUTS } = require('@/lib/config/api-timeouts')

      expect(API_TIMEOUTS.default).toBe(30000) // Should use default
      expect(API_TIMEOUTS.database).toBe(15000) // Should use default
      expect(consoleSpy).toHaveBeenCalledTimes(2)

      consoleSpy.mockRestore()
    })
  })

  describe('getTimeout', () => {
    it('should return correct timeout for each type', () => {
      expect(getTimeout('default')).toBe(API_TIMEOUTS.default)
      expect(getTimeout('database')).toBe(API_TIMEOUTS.database)
      expect(getTimeout('external')).toBe(API_TIMEOUTS.external)
      expect(getTimeout('upload')).toBe(API_TIMEOUTS.upload)
      expect(getTimeout('payment')).toBe(API_TIMEOUTS.payment)
      expect(getTimeout('auth')).toBe(API_TIMEOUTS.auth)
      expect(getTimeout('admin')).toBe(API_TIMEOUTS.admin)
      expect(getTimeout('webhook')).toBe(API_TIMEOUTS.webhook)
      expect(getTimeout('email')).toBe(API_TIMEOUTS.email)
      expect(getTimeout('image')).toBe(API_TIMEOUTS.image)
    })
  })

  describe('getEndpointTimeouts', () => {
    it('should return exact match for known endpoints', () => {
      const timeouts = getEndpointTimeouts('/api/products')
      expect(timeouts).toEqual(ENDPOINT_TIMEOUTS['/api/products'])
    })

    it('should return prefix match for nested endpoints', () => {
      const timeouts = getEndpointTimeouts('/api/products/123')
      expect(timeouts).toEqual(ENDPOINT_TIMEOUTS['/api/products'])
    })

    it('should return default timeouts for unknown endpoints', () => {
      const timeouts = getEndpointTimeouts('/api/unknown')
      expect(timeouts.connection).toBe(5000)
      expect(timeouts.request).toBe(API_TIMEOUTS.default)
      expect(timeouts.response).toBe(10000)
      expect(timeouts.total).toBe(API_TIMEOUTS.default)
    })

    it('should have valid timeout configurations for all endpoints', () => {
      Object.values(ENDPOINT_TIMEOUTS).forEach(config => {
        expect(config.connection).toBeGreaterThan(0)
        expect(config.request).toBeGreaterThan(0)
        expect(config.response).toBeGreaterThan(0)
        expect(config.total).toBeGreaterThan(0)
      })
    })
  })

  describe('createTimeoutController', () => {
    it('should create AbortController with timeout', () => {
      const { controller, timeoutId } = createTimeoutController(1000)

      expect(controller).toBeInstanceOf(AbortController)
      expect(controller.signal).toBeDefined()
      expect(typeof timeoutId).toBe('number')

      clearTimeout(timeoutId)
    })

    it('should abort signal after timeout', done => {
      const { controller, timeoutId } = createTimeoutController(50)

      controller.signal.addEventListener('abort', () => {
        expect(controller.signal.aborted).toBe(true)
        clearTimeout(timeoutId)
        done()
      })
    })
  })

  describe('fetchWithTimeout', () => {
    it('should make successful request within timeout', async () => {
      const mockResponse = new Response('success', { status: 200 })
      mockFetch.mockResolvedValueOnce(mockResponse)

      const response = await fetchWithTimeout('http://example.com', {
        timeout: 5000,
      })

      expect(response).toBe(mockResponse)
      expect(mockFetch).toHaveBeenCalledWith('http://example.com', {
        timeout: 5000,
        signal: expect.any(AbortSignal),
      })
    })

    it('should timeout on slow requests', async () => {
      mockFetch.mockImplementation(
        () =>
          new Promise((resolve, reject) => {
            setTimeout(() => {
              const error = new Error('The operation was aborted')
              error.name = 'AbortError'
              reject(error)
            }, 100)
          })
      )

      await expect(
        fetchWithTimeout('http://example.com', {
          timeout: 50,
        })
      ).rejects.toThrow('Request timeout after 50ms')
    })

    it('should use default timeout when not specified', async () => {
      const mockResponse = new Response('success', { status: 200 })
      mockFetch.mockResolvedValueOnce(mockResponse)

      await fetchWithTimeout('http://example.com')

      expect(mockFetch).toHaveBeenCalledWith('http://example.com', {
        signal: expect.any(AbortSignal),
      })
    })

    it('should handle fetch errors properly', async () => {
      const fetchError = new Error('Network error')
      mockFetch.mockRejectedValueOnce(fetchError)

      await expect(fetchWithTimeout('http://example.com')).rejects.toThrow('Network error')
    })

    it('should handle abort errors as timeout', async () => {
      const abortError = new Error('The operation was aborted')
      abortError.name = 'AbortError'
      mockFetch.mockRejectedValueOnce(abortError)

      await expect(
        fetchWithTimeout('http://example.com', {
          timeout: 1000,
        })
      ).rejects.toThrow('Request timeout after 1000ms')
    })
  })

  describe('withDatabaseTimeout', () => {
    it('should execute operation within timeout', async () => {
      const mockOperation = jest.fn().mockResolvedValue('database result')

      const result = await withDatabaseTimeout(mockOperation, 5000)

      expect(result).toBe('database result')
      expect(mockOperation).toHaveBeenCalledWith(expect.any(AbortSignal))
    })

    it('should use default database timeout when not specified', async () => {
      const mockOperation = jest.fn().mockResolvedValue('result')

      await withDatabaseTimeout(mockOperation)

      expect(mockOperation).toHaveBeenCalledWith(expect.any(AbortSignal))
    })

    it('should handle operation errors', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('DB error'))

      await expect(withDatabaseTimeout(mockOperation)).rejects.toThrow('DB error')
    })

    it('should cleanup timeout on completion', async () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout')
      const mockOperation = jest.fn().mockResolvedValue('result')

      await withDatabaseTimeout(mockOperation, 1000)

      expect(clearTimeoutSpy).toHaveBeenCalled()
      clearTimeoutSpy.mockRestore()
    })

    it('should cleanup timeout on error', async () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout')
      const mockOperation = jest.fn().mockRejectedValue(new Error('error'))

      try {
        await withDatabaseTimeout(mockOperation, 1000)
      } catch (error) {
        // Expected error
      }

      expect(clearTimeoutSpy).toHaveBeenCalled()
      clearTimeoutSpy.mockRestore()
    })
  })

  describe('withExternalTimeout', () => {
    it('should execute operation within timeout', async () => {
      const mockOperation = jest.fn().mockResolvedValue('external result')

      const result = await withExternalTimeout(mockOperation, 5000)

      expect(result).toBe('external result')
      expect(mockOperation).toHaveBeenCalledWith(expect.any(AbortSignal))
    })

    it('should use default external timeout when not specified', async () => {
      const mockOperation = jest.fn().mockResolvedValue('result')

      await withExternalTimeout(mockOperation)

      expect(mockOperation).toHaveBeenCalledWith(expect.any(AbortSignal))
    })
  })

  describe('Timeout Values Validation', () => {
    it('should have reasonable timeout values', () => {
      // Database operations should be faster than external APIs
      expect(API_TIMEOUTS.database).toBeLessThan(API_TIMEOUTS.external)

      // Webhooks should be fastest
      expect(API_TIMEOUTS.webhook).toBeLessThan(API_TIMEOUTS.database)

      // Upload operations should have longest timeout
      expect(API_TIMEOUTS.upload).toBeGreaterThan(API_TIMEOUTS.default)

      // All timeouts should be positive
      Object.values(API_TIMEOUTS).forEach(timeout => {
        expect(timeout).toBeGreaterThan(0)
      })
    })

    it('should have consistent endpoint timeout hierarchies', () => {
      Object.values(ENDPOINT_TIMEOUTS).forEach(config => {
        // Connection timeout should be shortest
        expect(config.connection).toBeLessThanOrEqual(config.request)
        expect(config.connection).toBeLessThanOrEqual(config.response)

        // Total timeout should be longest
        expect(config.total).toBeGreaterThanOrEqual(config.request)
        expect(config.total).toBeGreaterThanOrEqual(config.response)
      })
    })
  })
})
