import { renderHook, act } from '@testing-library/react'
import { useMobileCheckoutNavigation } from '@/hooks/useMobileCheckoutNavigation'
import { useRouter } from 'next/navigation'

// Mock de next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock de useSwipeGestures
jest.mock('@/hooks/useSwipeGestures', () => ({
  useSwipeGestures: jest.fn(() => ({ current: null })),
}))

// Mock de navigator.vibrate
Object.defineProperty(navigator, 'vibrate', {
  writable: true,
  value: jest.fn(),
})

// Mock de window.hapticFeedback
Object.defineProperty(window, 'hapticFeedback', {
  writable: true,
  value: {
    impactLight: jest.fn(),
    impactMedium: jest.fn(),
    impactHeavy: jest.fn(),
  },
})

// Mock de window.addEventListener y removeEventListener
const mockAddEventListener = jest.fn()
const mockRemoveEventListener = jest.fn()
Object.defineProperty(window, 'addEventListener', {
  writable: true,
  value: mockAddEventListener,
})
Object.defineProperty(window, 'removeEventListener', {
  writable: true,
  value: mockRemoveEventListener,
})

// Mock de navigator.userAgent
Object.defineProperty(navigator, 'userAgent', {
  writable: true,
  value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
})

// Mock de window.innerWidth
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  value: 1024,
})

const mockRouter = {
  back: jest.fn(),
  push: jest.fn(),
  replace: jest.fn(),
}

describe('useMobileCheckoutNavigation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)

    // Reset window properties
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 1024,
    })

    Object.defineProperty(navigator, 'userAgent', {
      writable: true,
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    })
  })

  describe('Configuración por defecto', () => {
    it('debe inicializar con valores por defecto', () => {
      const { result } = renderHook(() => useMobileCheckoutNavigation())

      expect(result.current.isMobile).toBe(false)
      expect(result.current.isInteracting).toBe(false)
      expect(result.current.containerRef).toBeDefined()
      expect(typeof result.current.goBack).toBe('function')
      expect(typeof result.current.goForward).toBe('function')
      expect(typeof result.current.triggerHapticFeedback).toBe('function')
    })

    it('debe configurar event listeners para resize', () => {
      renderHook(() => useMobileCheckoutNavigation())

      expect(mockAddEventListener).toHaveBeenCalledWith('resize', expect.any(Function))
    })
  })

  describe('Detección de dispositivo móvil', () => {
    it('debe detectar dispositivo móvil por user agent', () => {
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      })

      const { result } = renderHook(() => useMobileCheckoutNavigation())

      expect(result.current.isMobile).toBe(true)
    })

    it('debe detectar dispositivo móvil por tamaño de pantalla', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: 600,
      })

      const { result } = renderHook(() => useMobileCheckoutNavigation())

      expect(result.current.isMobile).toBe(true)
    })

    it('debe detectar dispositivo Android', () => {
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Linux; Android 10; SM-G975F)',
      })

      const { result } = renderHook(() => useMobileCheckoutNavigation())

      expect(result.current.isMobile).toBe(true)
    })
  })

  describe('Navegación', () => {
    it('debe llamar router.back() cuando se ejecuta goBack', () => {
      const { result } = renderHook(() => useMobileCheckoutNavigation())

      act(() => {
        result.current.goBack()
      })

      expect(mockRouter.back).toHaveBeenCalledTimes(1)
    })

    it('debe ejecutar callback personalizado onSwipeBack', () => {
      const mockOnSwipeBack = jest.fn(() => true) // Retornar true para evitar router.back()
      const { result } = renderHook(() =>
        useMobileCheckoutNavigation({ onSwipeBack: mockOnSwipeBack })
      )

      act(() => {
        result.current.goBack()
      })

      expect(mockOnSwipeBack).toHaveBeenCalledTimes(1)
      expect(mockRouter.back).not.toHaveBeenCalled()
    })

    it('debe ejecutar callback personalizado onSwipeForward', () => {
      const mockOnSwipeForward = jest.fn()
      const { result } = renderHook(() =>
        useMobileCheckoutNavigation({ onSwipeForward: mockOnSwipeForward })
      )

      act(() => {
        result.current.goForward()
      })

      expect(mockOnSwipeForward).toHaveBeenCalledTimes(1)
    })
  })

  describe('Feedback háptico', () => {
    beforeEach(() => {
      // Simular dispositivo móvil
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      })
    })

    it('debe activar vibración con patrón light', () => {
      const { result } = renderHook(() => useMobileCheckoutNavigation())

      act(() => {
        result.current.triggerHapticFeedback('light')
      })

      expect(navigator.vibrate).toHaveBeenCalledWith([10])
    })

    it('debe activar vibración con patrón medium', () => {
      const { result } = renderHook(() => useMobileCheckoutNavigation())

      act(() => {
        result.current.triggerHapticFeedback('medium')
      })

      expect(navigator.vibrate).toHaveBeenCalledWith([20])
    })

    it('debe activar vibración con patrón heavy', () => {
      const { result } = renderHook(() => useMobileCheckoutNavigation())

      act(() => {
        result.current.triggerHapticFeedback('heavy')
      })

      expect(navigator.vibrate).toHaveBeenCalledWith([30])
    })

    it('debe usar patrón light por defecto', () => {
      const { result } = renderHook(() => useMobileCheckoutNavigation())

      act(() => {
        result.current.triggerHapticFeedback()
      })

      expect(navigator.vibrate).toHaveBeenCalledWith([10])
    })

    it('no debe activar vibración si está deshabilitado', () => {
      const { result } = renderHook(() =>
        useMobileCheckoutNavigation({ enableHapticFeedback: false })
      )

      act(() => {
        result.current.triggerHapticFeedback()
      })

      expect(navigator.vibrate).not.toHaveBeenCalled()
    })

    it('no debe activar vibración en desktop', () => {
      // Simular desktop
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      })
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: 1024,
      })

      const { result } = renderHook(() => useMobileCheckoutNavigation())

      act(() => {
        result.current.triggerHapticFeedback()
      })

      expect(navigator.vibrate).not.toHaveBeenCalled()
    })

    it('debe manejar errores de vibración gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'debug').mockImplementation()
      ;(navigator.vibrate as jest.Mock).mockImplementation(() => {
        throw new Error('Vibration not supported')
      })

      const { result } = renderHook(() => useMobileCheckoutNavigation())

      act(() => {
        result.current.triggerHapticFeedback()
      })

      expect(consoleSpy).toHaveBeenCalledWith('Haptic feedback not available:', expect.any(Error))

      consoleSpy.mockRestore()
    })
  })

  describe('Configuración personalizada', () => {
    it('debe respetar enableSwipeGestures = false', () => {
      const { useSwipeGestures } = require('@/hooks/useSwipeGestures')

      renderHook(() => useMobileCheckoutNavigation({ enableSwipeGestures: false }))

      expect(useSwipeGestures).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: false,
        })
      )
    })

    it('debe respetar enableKeyboardNavigation = false', () => {
      // Mock document.addEventListener
      const mockDocumentAddEventListener = jest.fn()
      const originalAddEventListener = document.addEventListener
      document.addEventListener = mockDocumentAddEventListener

      renderHook(() => useMobileCheckoutNavigation({ enableKeyboardNavigation: false }))

      // Verificar que no se agregaron listeners de teclado
      const keyboardListeners = mockDocumentAddEventListener.mock.calls.filter(
        call => call[0] === 'keydown'
      )
      expect(keyboardListeners).toHaveLength(0)

      // Restaurar
      document.addEventListener = originalAddEventListener
    })
  })

  describe('Estado de interacción', () => {
    it('debe inicializar isInteracting como false', () => {
      const { result } = renderHook(() => useMobileCheckoutNavigation())
      expect(result.current.isInteracting).toBe(false)
    })

    it('debe proporcionar containerRef para touch events', () => {
      const { result } = renderHook(() => useMobileCheckoutNavigation())

      // Verificar que el containerRef existe y es un objeto ref válido
      expect(result.current.containerRef).toBeDefined()
      expect(result.current.containerRef.current).toBeNull() // Inicialmente null
      expect(typeof result.current.containerRef).toBe('object')
    })

    it('debe detectar correctamente dispositivos móviles', () => {
      // Simular dispositivo móvil por user agent
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      })

      const { result } = renderHook(() => useMobileCheckoutNavigation())
      expect(result.current.isMobile).toBe(true)
    })
  })

  describe('Cleanup', () => {
    it('debe remover event listeners al desmontar', () => {
      const { unmount } = renderHook(() => useMobileCheckoutNavigation())

      unmount()

      expect(mockRemoveEventListener).toHaveBeenCalledWith('resize', expect.any(Function))
    })
  })

  describe('Casos edge', () => {
    it('debe manejar múltiples tipos de user agents móviles', () => {
      const mobileUserAgents = [
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        'Mozilla/5.0 (Linux; Android 10; SM-G975F)',
        'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)',
        'Mozilla/5.0 (iPod touch; CPU iPhone OS 14_0 like Mac OS X)',
        'Mozilla/5.0 (BlackBerry; U; BlackBerry 9900)',
        'Opera/9.80 (J2ME/MIDP; Opera Mini/9.80)',
      ]

      mobileUserAgents.forEach(userAgent => {
        Object.defineProperty(navigator, 'userAgent', {
          writable: true,
          value: userAgent,
        })

        const { result } = renderHook(() => useMobileCheckoutNavigation())
        expect(result.current.isMobile).toBe(true)
      })
    })

    it('debe manejar resize events correctamente', () => {
      const { result } = renderHook(() => useMobileCheckoutNavigation())

      // Inicialmente desktop
      expect(result.current.isMobile).toBe(false)

      // Simular resize a móvil
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: 600,
      })

      // Obtener el callback de resize
      const resizeCallback = mockAddEventListener.mock.calls.find(call => call[0] === 'resize')?.[1]

      act(() => {
        resizeCallback?.()
      })

      expect(result.current.isMobile).toBe(true)
    })
  })
})
