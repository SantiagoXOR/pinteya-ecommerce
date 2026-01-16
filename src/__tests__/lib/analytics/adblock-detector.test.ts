/**
 * Tests para adblock-detector.ts
 * Verifica detección de bloqueadores y cache
 */

import { adBlockDetector } from '@/lib/analytics/adblock-detector'
import {
  setupAnalyticsMocks,
  cleanupAnalyticsMocks,
  createMockFetchResponse,
} from '../../../../__tests__/setup/analytics-mocks'

describe('AdBlockDetector', () => {
  beforeEach(() => {
    setupAnalyticsMocks()
    adBlockDetector.clearCache()
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    cleanupAnalyticsMocks()
    jest.useRealTimers()
  })

  describe('detectBlocking()', () => {
    it('debería detectar bloqueo cuando fetch falla con ERR_BLOCKED_BY_CLIENT', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValue(
        new Error('ERR_BLOCKED_BY_CLIENT')
      )

      const result = await adBlockDetector.detectBlocking('/api/track/events')

      expect(result.isBlocked).toBe(true)
      expect(result.method).toBe('fetch')
      expect(result.reason).toContain('ERR_BLOCKED_BY_CLIENT')
    })

    it('debería detectar bloqueo cuando fetch falla con Failed to fetch', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValue(
        new Error('Failed to fetch')
      )

      const result = await adBlockDetector.detectBlocking('/api/track/events')

      expect(result.isBlocked).toBe(true)
      expect(result.method).toBe('fetch')
    })

    it('debería retornar no bloqueado cuando fetch es exitoso', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue(
        createMockFetchResponse({}, 200)
      )

      const result = await adBlockDetector.detectBlocking('/api/track/events')

      expect(result.isBlocked).toBe(false)
      expect(result.method).toBe('fetch')
    })

    it('debería usar cache para resultados previos', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue(
        createMockFetchResponse({}, 200)
      )

      // Primera llamada
      const result1 = await adBlockDetector.detectBlocking('/api/track/events')
      expect(global.fetch).toHaveBeenCalledTimes(1)

      // Segunda llamada debería usar cache
      const result2 = await adBlockDetector.detectBlocking('/api/track/events')
      expect(global.fetch).toHaveBeenCalledTimes(1) // No se llama de nuevo

      expect(result1).toEqual(result2)
    })

    it('debería limpiar cache después de TTL', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue(
        createMockFetchResponse({}, 200)
      )

      // Primera llamada
      await adBlockDetector.detectBlocking('/api/track/events')
      expect(global.fetch).toHaveBeenCalledTimes(1)

      // Avanzar tiempo más allá del TTL (5 minutos)
      jest.advanceTimersByTime(5 * 60 * 1000 + 1000)

      // Segunda llamada debería hacer fetch de nuevo
      await adBlockDetector.detectBlocking('/api/track/events')
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })

    it('debería manejar timeout correctamente', async () => {
      // Simular un timeout usando AbortController
      const abortError = new Error('AbortError')
      abortError.name = 'AbortError'
      ;(global.fetch as jest.Mock).mockRejectedValue(abortError)

      const result = await adBlockDetector.detectBlocking('/api/track/events')

      expect(result.isBlocked).toBe(true)
      expect(result.method).toBe('fetch')
    })
  })

  describe('isSendBeaconAvailable()', () => {
    it('debería retornar true cuando sendBeacon está disponible', () => {
      ;(global.navigator as any).sendBeacon = jest.fn()
      expect(adBlockDetector.isSendBeaconAvailable()).toBe(true)
    })

    it('debería retornar false cuando sendBeacon no está disponible', () => {
      delete (global.navigator as any).sendBeacon
      expect(adBlockDetector.isSendBeaconAvailable()).toBe(false)
    })

    it('debería retornar false cuando navigator no está definido', () => {
      // Guardar referencia original
      const originalNavigator = global.navigator
      const originalSendBeacon = (global.navigator as any)?.sendBeacon
      
      // Eliminar sendBeacon pero mantener navigator
      if ((global.navigator as any)?.sendBeacon) {
        delete (global.navigator as any).sendBeacon
      }

      expect(adBlockDetector.isSendBeaconAvailable()).toBe(false)

      // Restaurar
      if (originalSendBeacon) {
        ;(global.navigator as any).sendBeacon = originalSendBeacon
      }
    })
  })

  describe('detectAdBlockers()', () => {
    it('debería retornar false cuando window no está definido', () => {
      const originalWindow = global.window
      ;(global as any).window = undefined

      expect(adBlockDetector.detectAdBlockers()).toBe(false)

      ;(global as any).window = originalWindow
    })

    it('debería detectar bloqueadores cuando elemento test es ocultado', () => {
      const mockDiv = {
        innerHTML: '',
        className: '',
        style: {} as any,
        offsetHeight: 0, // Simula que está oculto (bloqueado)
        offsetWidth: 100,
      }

      ;(global.document.createElement as jest.Mock).mockReturnValue(mockDiv)
      ;(global.document.body.appendChild as jest.Mock).mockImplementation(() => {})
      ;(global.document.body.removeChild as jest.Mock).mockImplementation(() => {})

      const result = adBlockDetector.detectAdBlockers()

      expect(result).toBe(true)
      expect(global.document.createElement).toHaveBeenCalledWith('div')
      expect(global.document.body.appendChild).toHaveBeenCalledWith(mockDiv)
      expect(global.document.body.removeChild).toHaveBeenCalledWith(mockDiv)
    })

    it('debería retornar false cuando elemento test no está ocultado', () => {
      const mockDiv = {
        innerHTML: '',
        className: '',
        style: {} as any,
        offsetHeight: 100, // No está oculto
        offsetWidth: 100,
      }

      ;(global.document.createElement as jest.Mock).mockReturnValue(mockDiv)
      ;(global.document.body.appendChild as jest.Mock).mockImplementation(() => {})
      ;(global.document.body.removeChild as jest.Mock).mockImplementation(() => {})

      const result = adBlockDetector.detectAdBlockers()

      expect(result).toBe(false)
    })
  })

  describe('clearCache()', () => {
    it('debería limpiar el cache de detección', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue(
        createMockFetchResponse({}, 200)
      )

      // Hacer una detección para llenar el cache
      await adBlockDetector.detectBlocking('/api/track/events')
      expect(global.fetch).toHaveBeenCalledTimes(1)

      // Limpiar cache
      adBlockDetector.clearCache()

      // Nueva detección debería hacer fetch de nuevo
      await adBlockDetector.detectBlocking('/api/track/events')
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('Manejo de errores', () => {
    it('debería manejar errores de red correctamente', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValue(
        new TypeError('Network error')
      )

      const result = await adBlockDetector.detectBlocking('/api/track/events')

      expect(result.isBlocked).toBe(true)
      expect(result.method).toBe('fetch')
    })

    it('debería manejar AbortError correctamente', async () => {
      const abortError = new Error('AbortError')
      abortError.name = 'AbortError'
      ;(global.fetch as jest.Mock).mockRejectedValue(abortError)

      const result = await adBlockDetector.detectBlocking('/api/track/events')

      expect(result.isBlocked).toBe(true)
    })

    it('debería retornar no bloqueado para errores desconocidos', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValue(
        new Error('Unknown error')
      )

      const result = await adBlockDetector.detectBlocking('/api/track/events')

      expect(result.isBlocked).toBe(false)
    })
  })
})
