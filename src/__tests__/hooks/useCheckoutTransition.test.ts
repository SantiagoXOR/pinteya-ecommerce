// ===================================
// PINTEYA E-COMMERCE - TESTS UNITARIOS PARA useCheckoutTransition HOOK
// ===================================

import { renderHook, act, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import useCheckoutTransition from '@/hooks/useCheckoutTransition';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock performance API para navegadores que no lo soportan
const mockPerformance = {
  now: jest.fn(() => Date.now()),
};

Object.defineProperty(global, 'performance', {
  value: mockPerformance,
  writable: true,
});

// Mock console methods para tests limpios
const originalConsole = { ...console };
beforeAll(() => {
  console.debug = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  Object.assign(console, originalConsole);
});

describe('useCheckoutTransition Hook - Tests Unitarios', () => {
  const mockPush = jest.fn();
  const mockRouter = {
    push: mockPush,
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    mockPerformance.now.mockReturnValue(1000);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Estados Básicos del Hook', () => {
    it('debe inicializar con estados correctos por defecto', () => {
      const { result } = renderHook(() => useCheckoutTransition());

      expect(result.current.isTransitioning).toBe(false);
      expect(result.current.isButtonDisabled).toBe(false);
      expect(result.current.transitionProgress).toBe(0);
      expect(result.current.skipAnimation).toBe(false);
      expect(result.current.performanceMetrics.startTime).toBe(null);
      expect(typeof result.current.startTransition).toBe('function');
    });

    it('debe cambiar isTransitioning a true cuando se inicia la transición', () => {
      const { result } = renderHook(() => useCheckoutTransition());

      act(() => {
        result.current.startTransition();
      });

      expect(result.current.isTransitioning).toBe(true);
      expect(result.current.isButtonDisabled).toBe(true);
    });

    it('debe resetear isTransitioning después de la duración especificada', async () => {
      const { result } = renderHook(() => useCheckoutTransition());

      act(() => {
        result.current.startTransition();
      });

      expect(result.current.isTransitioning).toBe(true);

      // Avanzar tiempo hasta completar la animación
      act(() => {
        jest.advanceTimersByTime(2800);
      });

      await waitFor(() => {
        expect(result.current.isTransitioning).toBe(false);
      });
    });
  });

  describe('Detección de prefers-reduced-motion', () => {
    const mockMatchMedia = jest.fn();

    beforeEach(() => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: mockMatchMedia,
      });
    });

    it('debe detectar prefers-reduced-motion: reduce', () => {
      const mockMediaQuery = {
        matches: true,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      };
      mockMatchMedia.mockReturnValue(mockMediaQuery);

      const { result } = renderHook(() => useCheckoutTransition());

      expect(result.current.skipAnimation).toBe(true);
    });

    it('debe usar animación normal cuando prefers-reduced-motion: no-preference', () => {
      const mockMediaQuery = {
        matches: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      };
      mockMatchMedia.mockReturnValue(mockMediaQuery);

      const { result } = renderHook(() => useCheckoutTransition());

      expect(result.current.skipAnimation).toBe(false);
    });

    it('debe manejar cambios dinámicos en prefers-reduced-motion', () => {
      const mockMediaQuery = {
        matches: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      };
      mockMatchMedia.mockReturnValue(mockMediaQuery);

      const { result } = renderHook(() => useCheckoutTransition());

      expect(result.current.skipAnimation).toBe(false);

      // Simular cambio a reduced motion
      const changeHandler = mockMediaQuery.addEventListener.mock.calls[0][1];
      act(() => {
        changeHandler({ matches: true });
      });

      expect(result.current.skipAnimation).toBe(true);
    });

    it('debe manejar navegadores sin soporte para addEventListener', () => {
      const mockMediaQuery = {
        matches: false,
        addListener: jest.fn(),
        removeListener: jest.fn(),
      };
      mockMatchMedia.mockReturnValue(mockMediaQuery);

      const { result } = renderHook(() => useCheckoutTransition());

      expect(mockMediaQuery.addListener).toHaveBeenCalled();
      expect(result.current.skipAnimation).toBe(false);
    });
  });

  describe('Callbacks y Eventos', () => {
    it('debe ejecutar onTransitionStart cuando se inicia la transición', () => {
      const onTransitionStart = jest.fn();
      const { result } = renderHook(() => 
        useCheckoutTransition({ onTransitionStart })
      );

      act(() => {
        result.current.startTransition();
      });

      expect(onTransitionStart).toHaveBeenCalledTimes(1);
    });

    it('debe ejecutar onTransitionComplete cuando termina la transición', async () => {
      const onTransitionComplete = jest.fn();
      const { result } = renderHook(() => 
        useCheckoutTransition({ onTransitionComplete })
      );

      act(() => {
        result.current.startTransition();
      });

      act(() => {
        jest.advanceTimersByTime(2800);
      });

      await waitFor(() => {
        expect(onTransitionComplete).toHaveBeenCalledTimes(1);
      });
    });

    it('debe manejar errores en callbacks y ejecutar onTransitionError', () => {
      const onTransitionStart = jest.fn(() => {
        throw new Error('Test error');
      });
      const onTransitionError = jest.fn();

      const { result } = renderHook(() => 
        useCheckoutTransition({ onTransitionStart, onTransitionError })
      );

      act(() => {
        result.current.startTransition();
      });

      expect(onTransitionError).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('Prevención de Múltiples Activaciones', () => {
    it('debe ignorar múltiples llamadas a startTransition', () => {
      const onTransitionStart = jest.fn();
      const { result } = renderHook(() => 
        useCheckoutTransition({ onTransitionStart })
      );

      act(() => {
        result.current.startTransition();
        result.current.startTransition();
        result.current.startTransition();
      });

      expect(onTransitionStart).toHaveBeenCalledTimes(1);
      expect(result.current.isTransitioning).toBe(true);
    });

    it('debe permitir nueva transición después de completar la anterior', async () => {
      const onTransitionStart = jest.fn();
      const { result } = renderHook(() => 
        useCheckoutTransition({ onTransitionStart })
      );

      // Primera transición
      act(() => {
        result.current.startTransition();
      });

      // Completar primera transición
      act(() => {
        jest.advanceTimersByTime(2800);
      });

      await waitFor(() => {
        expect(result.current.isTransitioning).toBe(false);
      });

      // Segunda transición debe funcionar
      act(() => {
        result.current.startTransition();
      });

      expect(onTransitionStart).toHaveBeenCalledTimes(2);
    });
  });

  describe('Performance Tracking', () => {
    it('debe trackear métricas de performance cuando está habilitado', () => {
      const { result } = renderHook(() => 
        useCheckoutTransition({ enablePerformanceTracking: true })
      );

      act(() => {
        result.current.startTransition();
      });

      expect(result.current.performanceMetrics.startTime).toBe(1000);

      act(() => {
        jest.advanceTimersByTime(2800);
      });

      expect(result.current.performanceMetrics.endTime).toBeTruthy();
      expect(result.current.performanceMetrics.duration).toBeTruthy();
    });

    it('debe actualizar transitionProgress durante la animación', () => {
      const { result } = renderHook(() => useCheckoutTransition());

      act(() => {
        result.current.startTransition();
      });

      expect(result.current.transitionProgress).toBe(0);

      // Avanzar parcialmente
      act(() => {
        jest.advanceTimersByTime(1400); // 50% de 2800ms
      });

      expect(result.current.transitionProgress).toBeGreaterThan(0);
      expect(result.current.transitionProgress).toBeLessThan(100);
    });
  });

  describe('Configuraciones Personalizadas', () => {
    it('debe usar duración personalizada cuando se proporciona', async () => {
      const customDuration = 1000;
      const onTransitionComplete = jest.fn();
      
      const { result } = renderHook(() => 
        useCheckoutTransition({ 
          customDuration, 
          onTransitionComplete 
        })
      );

      act(() => {
        result.current.startTransition();
      });

      // No debe completarse con la duración por defecto
      act(() => {
        jest.advanceTimersByTime(2800);
      });

      expect(onTransitionComplete).not.toHaveBeenCalled();

      // Debe completarse con la duración personalizada
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(onTransitionComplete).toHaveBeenCalled();
      });
    });

    it('debe deshabilitar animación cuando enableAnimation es false', () => {
      const { result } = renderHook(() => 
        useCheckoutTransition({ enableAnimation: false })
      );

      expect(result.current.skipAnimation).toBe(true);
    });
  });

  describe('Navegación y Cleanup', () => {
    it('debe navegar a /checkout al completar la transición', async () => {
      const { result } = renderHook(() => useCheckoutTransition());

      act(() => {
        result.current.startTransition();
      });

      act(() => {
        jest.advanceTimersByTime(2800);
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/checkout');
      });
    });

    it('debe limpiar timeouts en unmount', () => {
      const { result, unmount } = renderHook(() => useCheckoutTransition());

      act(() => {
        result.current.startTransition();
      });

      // Unmount antes de que termine la animación
      unmount();

      // Avanzar tiempo - no debería causar errores
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      // No debe haber navegación después del unmount
      expect(mockPush).not.toHaveBeenCalled();
    });
  });
});
