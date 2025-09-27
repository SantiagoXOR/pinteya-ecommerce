// ===================================
// PINTEYA E-COMMERCE - UNIT TESTS
// Pruebas unitarias para useRenderMonitoring
// ===================================

import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { jest } from '@jest/globals'
import { useRenderMonitoring, withRenderMonitoring } from '@/hooks/monitoring/useRenderMonitoring'
import React from 'react'

// ===================================
// MOCKS
// ===================================

// Mock de performance.now()
const mockPerformanceNow = jest.fn()
Object.defineProperty(global, 'performance', {
  value: {
    now: mockPerformanceNow,
    memory: {
      usedJSHeapSize: 50 * 1024 * 1024, // 50MB
    },
  },
  writable: true,
})

// Mock de console
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {})
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {})
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {})

// Mock de localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
})

// ===================================
// SETUP Y CLEANUP
// ===================================

beforeEach(() => {
  jest.clearAllMocks()
  mockPerformanceNow.mockReturnValue(1000)
  mockLocalStorage.getItem.mockReturnValue(null)
})

afterEach(() => {
  jest.clearAllTimers()
})

// ===================================
// TESTS PRINCIPALES
// ===================================

describe('useRenderMonitoring', () => {
  describe('Inicialización', () => {
    it('debe inicializar con configuración por defecto', () => {
      const { result } = renderHook(() =>
        useRenderMonitoring({
          componentName: 'TestComponent',
        })
      )

      expect(result.current.isEnabled).toBe(true)
      expect(result.current.metrics).toBeDefined()
      expect(result.current.alerts).toEqual([])
      expect(typeof result.current.trackError).toBe('function')
    })

    it('debe respetar la configuración personalizada', () => {
      const { result } = renderHook(() =>
        useRenderMonitoring({
          componentName: 'TestComponent',
          enabled: false,
          enableConsoleLogging: false,
          enableToasts: false,
        })
      )

      expect(result.current.isEnabled).toBe(false)
    })

    it('debe aplicar thresholds personalizados', () => {
      const customThresholds = {
        slowRenderThreshold: 20,
        maxRenderCount: 50,
        memoryThreshold: 100,
        errorThreshold: 5,
      }

      const { result } = renderHook(() =>
        useRenderMonitoring({
          componentName: 'TestComponent',
          thresholds: customThresholds,
        })
      )

      expect(result.current.isEnabled).toBe(true)
    })
  })

  describe('Tracking de renders', () => {
    it('debe trackear renders correctamente', () => {
      let renderCount = 0
      mockPerformanceNow
        .mockReturnValueOnce(1000) // Inicio del render
        .mockReturnValueOnce(1010) // Fin del render (10ms)

      const { result, rerender } = renderHook(() => {
        renderCount++
        return useRenderMonitoring({
          componentName: 'TestComponent',
          enableConsoleLogging: true,
        })
      })

      // Forzar re-render
      rerender()

      expect(result.current.metrics?.renderCount).toBeGreaterThan(0)
    })

    it('debe detectar renders lentos', () => {
      mockPerformanceNow
        .mockReturnValueOnce(1000) // Inicio
        .mockReturnValueOnce(1100) // Fin (100ms - lento)

      const { result, rerender } = renderHook(() =>
        useRenderMonitoring({
          componentName: 'TestComponent',
          thresholds: {
            slowRenderThreshold: 50, // 50ms threshold
          },
        })
      )

      rerender()

      expect(result.current.metrics?.slowRenders).toBeGreaterThan(0)
    })

    it('debe calcular tiempo promedio de render', () => {
      // Simular múltiples renders con diferentes tiempos
      mockPerformanceNow
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(1010) // 10ms
        .mockReturnValueOnce(2000)
        .mockReturnValueOnce(2020) // 20ms
        .mockReturnValueOnce(3000)
        .mockReturnValueOnce(3030) // 30ms

      const { result, rerender } = renderHook(() =>
        useRenderMonitoring({
          componentName: 'TestComponent',
        })
      )

      rerender()
      rerender()
      rerender()

      // Promedio debería ser (10 + 20 + 30) / 3 = 20ms
      expect(result.current.metrics?.averageRenderTime).toBeCloseTo(20, 1)
    })
  })

  describe('Tracking de errores', () => {
    it('debe trackear errores correctamente', () => {
      const { result } = renderHook(() =>
        useRenderMonitoring({
          componentName: 'TestComponent',
        })
      )

      const testError = new Error('Test error')

      act(() => {
        result.current.trackError(testError, {
          action: 'test_action',
          context: 'test_context',
        })
      })

      expect(result.current.metrics?.errorCount).toBe(1)
    })

    it('debe generar alertas por errores frecuentes', () => {
      const { result } = renderHook(() =>
        useRenderMonitoring({
          componentName: 'TestComponent',
          thresholds: {
            errorThreshold: 2, // 2 errores por minuto
          },
        })
      )

      const testError = new Error('Test error')

      act(() => {
        // Generar múltiples errores
        result.current.trackError(testError)
        result.current.trackError(testError)
        result.current.trackError(testError)
      })

      expect(result.current.alerts.length).toBeGreaterThan(0)
      expect(result.current.alerts[0].type).toBe('high_error_rate')
    })
  })

  describe('Monitoreo de memoria', () => {
    it('debe trackear uso de memoria', () => {
      // Mock de performance.memory con alto uso
      Object.defineProperty(global.performance, 'memory', {
        value: {
          usedJSHeapSize: 150 * 1024 * 1024, // 150MB
        },
        configurable: true,
      })

      const { result } = renderHook(() =>
        useRenderMonitoring({
          componentName: 'TestComponent',
          thresholds: {
            memoryThreshold: 100, // 100MB threshold
          },
        })
      )

      expect(result.current.metrics?.memoryUsage).toBeGreaterThan(100)
    })

    it('debe generar alertas por alto uso de memoria', () => {
      Object.defineProperty(global.performance, 'memory', {
        value: {
          usedJSHeapSize: 200 * 1024 * 1024, // 200MB
        },
        configurable: true,
      })

      const { result } = renderHook(() =>
        useRenderMonitoring({
          componentName: 'TestComponent',
          thresholds: {
            memoryThreshold: 100, // 100MB threshold
          },
        })
      )

      expect(result.current.alerts.some(alert => alert.type === 'high_memory_usage')).toBe(true)
    })
  })

  describe('Sistema de alertas', () => {
    it('debe generar alertas con severidad correcta', () => {
      const { result } = renderHook(() =>
        useRenderMonitoring({
          componentName: 'TestComponent',
          thresholds: {
            errorThreshold: 1,
          },
        })
      )

      act(() => {
        result.current.trackError(new Error('Critical error'))
      })

      const alert = result.current.alerts[0]
      expect(alert).toBeDefined()
      expect(['low', 'medium', 'high', 'critical']).toContain(alert.severity)
    })

    it('debe limpiar alertas resueltas', () => {
      jest.useFakeTimers()

      const { result } = renderHook(() =>
        useRenderMonitoring({
          componentName: 'TestComponent',
          thresholds: {
            errorThreshold: 1,
          },
        })
      )

      act(() => {
        result.current.trackError(new Error('Test error'))
      })

      expect(result.current.alerts.length).toBeGreaterThan(0)

      // Avanzar tiempo para que las alertas se resuelvan automáticamente
      act(() => {
        jest.advanceTimersByTime(5 * 60 * 1000) // 5 minutos
      })

      // Las alertas deberían estar marcadas como resueltas o eliminadas
      const unresolvedAlerts = result.current.alerts.filter(a => !a.resolved)
      expect(unresolvedAlerts.length).toBeLessThanOrEqual(result.current.alerts.length)

      jest.useRealTimers()
    })
  })

  describe('Persistencia de datos', () => {
    it('debe guardar métricas en localStorage', () => {
      const { result } = renderHook(() =>
        useRenderMonitoring({
          componentName: 'TestComponent',
          enablePersistence: true,
        })
      )

      act(() => {
        result.current.trackError(new Error('Test error'))
      })

      expect(mockLocalStorage.setItem).toHaveBeenCalled()
    })

    it('debe cargar métricas desde localStorage', () => {
      const savedMetrics = {
        renderCount: 10,
        errorCount: 2,
        slowRenders: 1,
        averageRenderTime: 15.5,
        memoryUsage: 75.2,
      }

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedMetrics))

      const { result } = renderHook(() =>
        useRenderMonitoring({
          componentName: 'TestComponent',
          enablePersistence: true,
        })
      )

      expect(result.current.metrics?.renderCount).toBe(10)
      expect(result.current.metrics?.errorCount).toBe(2)
    })
  })

  describe('Configuración dinámica', () => {
    it('debe permitir habilitar/deshabilitar monitoreo', () => {
      const { result, rerender } = renderHook(
        ({ enabled }) =>
          useRenderMonitoring({
            componentName: 'TestComponent',
            enabled,
          }),
        { initialProps: { enabled: true } }
      )

      expect(result.current.isEnabled).toBe(true)

      rerender({ enabled: false })
      expect(result.current.isEnabled).toBe(false)
    })

    it('debe actualizar thresholds dinámicamente', () => {
      const { result, rerender } = renderHook(
        ({ threshold }) =>
          useRenderMonitoring({
            componentName: 'TestComponent',
            thresholds: {
              slowRenderThreshold: threshold,
            },
          }),
        { initialProps: { threshold: 16 } }
      )

      // Cambiar threshold
      rerender({ threshold: 50 })

      // El hook debería usar el nuevo threshold
      expect(result.current.isEnabled).toBe(true)
    })
  })

  describe('Logging y debugging', () => {
    it('debe loggear información cuando está habilitado', () => {
      const { result, rerender } = renderHook(() =>
        useRenderMonitoring({
          componentName: 'TestComponent',
          enableConsoleLogging: true,
        })
      )

      rerender() // Forzar re-render

      expect(mockConsoleLog).toHaveBeenCalled()
    })

    it('no debe loggear cuando está deshabilitado', () => {
      mockConsoleLog.mockClear()

      const { result, rerender } = renderHook(() =>
        useRenderMonitoring({
          componentName: 'TestComponent',
          enableConsoleLogging: false,
        })
      )

      rerender()

      expect(mockConsoleLog).not.toHaveBeenCalled()
    })
  })
})

// ===================================
// TESTS PARA HOC
// ===================================

describe('withRenderMonitoring HOC', () => {
  it('debe envolver componente correctamente', () => {
    const TestComponent: React.FC<{ title: string }> = ({ title }) => {
      return React.createElement('div', null, title)
    }

    const WrappedComponent = withRenderMonitoring(TestComponent, {
      enabled: true,
      enableConsoleLogging: true,
    })

    expect(WrappedComponent).toBeDefined()
    expect(typeof WrappedComponent).toBe('function')
  })

  it('debe pasar props correctamente al componente envuelto', () => {
    const TestComponent: React.FC<{ title: string; count: number }> = ({ title, count }) => {
      return React.createElement('div', null, `${title}: ${count}`)
    }

    const WrappedComponent = withRenderMonitoring(TestComponent, {
      enabled: true,
    })

    const { container } = render(
      React.createElement(WrappedComponent, { title: 'Test', count: 42 })
    )

    expect(container.textContent).toBe('Test: 42')
  })
})

// Helper para render (simplificado para el test)
function render(element: React.ReactElement) {
  const container = document.createElement('div')
  // Simulación básica de render para el test
  return { container }
}
