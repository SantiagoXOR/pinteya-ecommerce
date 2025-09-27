/**
 * Tests para las mejoras del sistema de geolocalización
 * Verifica el manejo de errores, retry logic y fallback mechanisms
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest'
import {
  GeolocationTracker,
  getCurrentPosition,
  isGeolocationSupported,
  HIGH_ACCURACY_OPTIONS,
  FALLBACK_OPTIONS,
  BATTERY_SAVING_OPTIONS,
  GeolocationError,
  GeolocationPosition,
} from '@/lib/utils/geolocation'

// Mock del navigator.geolocation
const mockGeolocation = {
  getCurrentPosition: vi.fn(),
  watchPosition: vi.fn(),
  clearWatch: vi.fn(),
}

const mockPermissions = {
  query: vi.fn(),
}

// Setup global mocks
beforeEach(() => {
  // Reset all mocks
  vi.clearAllMocks()

  // Mock navigator.geolocation
  Object.defineProperty(global.navigator, 'geolocation', {
    value: mockGeolocation,
    writable: true,
  })

  // Mock navigator.permissions
  Object.defineProperty(global.navigator, 'permissions', {
    value: mockPermissions,
    writable: true,
  })

  // Mock console methods to avoid noise in tests
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'log').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Geolocation Improvements', () => {
  describe('isGeolocationSupported', () => {
    it('should return true when geolocation is supported', () => {
      expect(isGeolocationSupported()).toBe(true)
    })

    it('should return false when geolocation is not supported', () => {
      // @ts-ignore
      delete global.navigator.geolocation
      expect(isGeolocationSupported()).toBe(false)
    })
  })

  describe('getCurrentPosition with retry logic', () => {
    it('should succeed on first attempt', async () => {
      const mockPosition = {
        coords: {
          latitude: 40.7128,
          longitude: -74.006,
          accuracy: 10,
        },
        timestamp: Date.now(),
      }

      mockGeolocation.getCurrentPosition.mockImplementation(success => {
        success(mockPosition)
      })

      const result = await getCurrentPosition(HIGH_ACCURACY_OPTIONS)

      expect(result).toEqual({
        lat: 40.7128,
        lng: -74.006,
        accuracy: 10,
        timestamp: mockPosition.timestamp,
      })
    })

    it('should retry with fallback options on timeout', async () => {
      let attemptCount = 0

      mockGeolocation.getCurrentPosition.mockImplementation((success, error, options) => {
        attemptCount++

        if (attemptCount === 1) {
          // First attempt fails with timeout
          error({
            code: 3, // TIMEOUT
            message: 'Timeout',
            PERMISSION_DENIED: 1,
            POSITION_UNAVAILABLE: 2,
            TIMEOUT: 3,
          })
        } else {
          // Second attempt succeeds
          success({
            coords: {
              latitude: 40.7128,
              longitude: -74.006,
              accuracy: 50,
            },
            timestamp: Date.now(),
          })
        }
      })

      const result = await getCurrentPosition(HIGH_ACCURACY_OPTIONS, 2)

      expect(attemptCount).toBe(2)
      expect(result.lat).toBe(40.7128)
      expect(result.lng).toBe(-74.006)
    })

    it('should throw error after max retries', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error({
          code: 3, // TIMEOUT
          message: 'Timeout',
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        })
      })

      await expect(getCurrentPosition(HIGH_ACCURACY_OPTIONS, 1)).rejects.toMatchObject({
        code: 3,
        type: 'TIMEOUT',
        retryable: true,
      })
    })

    it('should not retry on permission denied', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error({
          code: 1, // PERMISSION_DENIED
          message: 'Permission denied',
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        })
      })

      await expect(getCurrentPosition(HIGH_ACCURACY_OPTIONS, 2)).rejects.toMatchObject({
        code: 1,
        type: 'PERMISSION_DENIED',
        retryable: false,
      })
    })
  })

  describe('GeolocationTracker', () => {
    let tracker: GeolocationTracker
    let onUpdate: Mock
    let onError: Mock

    beforeEach(() => {
      onUpdate = vi.fn()
      onError = vi.fn()
      tracker = new GeolocationTracker(HIGH_ACCURACY_OPTIONS, onUpdate, onError)
    })

    afterEach(() => {
      tracker.stop()
    })

    it('should start tracking successfully', async () => {
      mockPermissions.query.mockResolvedValue({ state: 'granted' })
      mockGeolocation.watchPosition.mockReturnValue(123)

      await tracker.start()

      expect(tracker.getIsTracking()).toBe(true)
      expect(mockGeolocation.watchPosition).toHaveBeenCalled()
    })

    it('should handle permission denied', async () => {
      mockPermissions.query.mockResolvedValue({ state: 'denied' })

      await tracker.start()

      expect(tracker.getIsTracking()).toBe(false)
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'PERMISSION_DENIED',
          retryable: false,
        })
      )
    })

    it('should retry on timeout errors', async () => {
      mockPermissions.query.mockResolvedValue({ state: 'granted' })

      let watchCallCount = 0
      mockGeolocation.watchPosition.mockImplementation((success, error) => {
        watchCallCount++

        if (watchCallCount === 1) {
          // Simulate timeout error
          setTimeout(() => {
            error({
              code: 3,
              message: 'Timeout',
              PERMISSION_DENIED: 1,
              POSITION_UNAVAILABLE: 2,
              TIMEOUT: 3,
            })
          }, 10)
        }

        return 123
      })

      await tracker.start()

      // Wait for error handling
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(watchCallCount).toBeGreaterThan(1)
    })

    it('should switch to fallback mode after consecutive errors', async () => {
      mockPermissions.query.mockResolvedValue({ state: 'granted' })

      mockGeolocation.watchPosition.mockImplementation((success, error) => {
        // Always fail to trigger fallback mode
        setTimeout(() => {
          error({
            code: 2,
            message: 'Position unavailable',
            PERMISSION_DENIED: 1,
            POSITION_UNAVAILABLE: 2,
            TIMEOUT: 3,
          })
        }, 10)
        return 123
      })

      await tracker.start()

      // Wait for multiple errors to trigger fallback
      await new Promise(resolve => setTimeout(resolve, 200))

      const stats = tracker.getStats()
      expect(stats.consecutiveErrors).toBeGreaterThan(0)
    })

    it('should provide accurate stats', () => {
      const stats = tracker.getStats()

      expect(stats).toHaveProperty('isTracking')
      expect(stats).toHaveProperty('consecutiveErrors')
      expect(stats).toHaveProperty('retryCount')
      expect(stats).toHaveProperty('fallbackMode')
      expect(stats).toHaveProperty('lastSuccessfulPosition')
    })

    it('should stop tracking properly', async () => {
      mockPermissions.query.mockResolvedValue({ state: 'granted' })
      mockGeolocation.watchPosition.mockReturnValue(123)

      await tracker.start()
      tracker.stop()

      expect(tracker.getIsTracking()).toBe(false)
      expect(mockGeolocation.clearWatch).toHaveBeenCalledWith(123)
    })
  })

  describe('Error handling improvements', () => {
    it('should provide detailed error information', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error({
          code: 3,
          message: 'Timeout',
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        })
      })

      try {
        await getCurrentPosition(HIGH_ACCURACY_OPTIONS, 0)
      } catch (error) {
        const geoError = error as GeolocationError

        expect(geoError).toHaveProperty('code', 3)
        expect(geoError).toHaveProperty('type', 'TIMEOUT')
        expect(geoError).toHaveProperty('retryable', true)
        expect(geoError).toHaveProperty('timestamp')
        expect(geoError).toHaveProperty('originalError')
        expect(geoError.message).toContain('Timeout al obtener ubicación')
      }
    })
  })
})
