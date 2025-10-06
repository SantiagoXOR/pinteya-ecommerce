// ===================================
// PINTEYA E-COMMERCE - SETUP JEST PARA TESTS DE ANIMACIONES
// ===================================

// Mock global para performance API
global.performance = global.performance || {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByName: jest.fn(() => []),
  getEntriesByType: jest.fn(() => []),
  clearMarks: jest.fn(),
  clearMeasures: jest.fn(),
}

// Mock para requestAnimationFrame y cancelAnimationFrame
global.requestAnimationFrame = jest.fn(cb => {
  return setTimeout(cb, 16) // Simular 60fps
})

global.cancelAnimationFrame = jest.fn(id => {
  clearTimeout(id)
})

// Mock para IntersectionObserver (usado por Framer Motion)
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
}))

// Mock para ResizeObserver (usado por Framer Motion)
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock para matchMedia (prefers-reduced-motion)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock para getComputedStyle (usado por animaciones CSS)
Object.defineProperty(window, 'getComputedStyle', {
  value: jest.fn().mockImplementation(() => ({
    getPropertyValue: jest.fn().mockReturnValue(''),
    setProperty: jest.fn(),
    removeProperty: jest.fn(),
  })),
})

// Mock para CSS.supports (feature detection)
Object.defineProperty(window, 'CSS', {
  value: {
    supports: jest.fn().mockReturnValue(true),
  },
})

// Mock para navigator.userAgent (detección de dispositivos)
Object.defineProperty(navigator, 'userAgent', {
  value:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  configurable: true,
})

// Mock para screen dimensions
Object.defineProperty(screen, 'width', {
  writable: true,
  configurable: true,
  value: 1920,
})

Object.defineProperty(screen, 'height', {
  writable: true,
  configurable: true,
  value: 1080,
})

// Mock para window dimensions
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1920,
})

Object.defineProperty(window, 'innerHeight', {
  writable: true,
  configurable: true,
  value: 1080,
})

// Mock para devicePixelRatio
Object.defineProperty(window, 'devicePixelRatio', {
  writable: true,
  configurable: true,
  value: 1,
})

// Configuración de timeouts para tests de animaciones
jest.setTimeout(10000) // 10 segundos por defecto

// Helper functions para tests de animaciones
global.animationTestHelpers = {
  // Simular prefers-reduced-motion
  mockReducedMotion: (enabled = true) => {
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: query === '(prefers-reduced-motion: reduce)' ? enabled : false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }))
  },

  // Simular viewport móvil
  mockMobileViewport: () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    })
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 667,
    })
  },

  // Simular viewport desktop
  mockDesktopViewport: () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1920,
    })
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 1080,
    })
  },

  // Simular dispositivo de gama baja
  mockLowEndDevice: () => {
    Object.defineProperty(navigator, 'hardwareConcurrency', {
      writable: true,
      configurable: true,
      value: 2, // 2 cores = dispositivo de gama baja
    })

    Object.defineProperty(navigator, 'deviceMemory', {
      writable: true,
      configurable: true,
      value: 2, // 2GB RAM = dispositivo de gama baja
    })
  },

  // Simular dispositivo de gama alta
  mockHighEndDevice: () => {
    Object.defineProperty(navigator, 'hardwareConcurrency', {
      writable: true,
      configurable: true,
      value: 8, // 8 cores = dispositivo de gama alta
    })

    Object.defineProperty(navigator, 'deviceMemory', {
      writable: true,
      configurable: true,
      value: 8, // 8GB RAM = dispositivo de gama alta
    })
  },

  // Avanzar animaciones frame por frame
  advanceAnimationFrames: (frames = 1) => {
    for (let i = 0; i < frames; i++) {
      jest.advanceTimersByTime(16) // 16ms = 1 frame a 60fps
    }
  },

  // Esperar a que termine una animación
  waitForAnimationComplete: async (duration = 2800) => {
    jest.advanceTimersByTime(duration)
    await new Promise(resolve => setTimeout(resolve, 0))
  },

  // Mock de performance metrics
  mockPerformanceMetrics: () => {
    let startTime = 1000
    global.performance.now = jest.fn(() => {
      startTime += 16 // Incrementar 16ms por cada llamada
      return startTime
    })
  },

  // Reset de todos los mocks
  resetAllMocks: () => {
    jest.clearAllMocks()
    jest.clearAllTimers()

    // Reset viewport
    global.animationTestHelpers.mockDesktopViewport()

    // Reset reduced motion
    global.animationTestHelpers.mockReducedMotion(false)

    // Reset performance
    global.performance.now = jest.fn(() => Date.now())
  },
}

// Configuración de console para tests limpios
const originalConsole = { ...console }

// Silenciar logs específicos durante tests
const silencedLogs = [
  '[useCheckoutTransition]',
  '[CheckoutTransitionAnimation]',
  'Framer Motion',
  'React DevTools',
]

console.debug = jest.fn((...args) => {
  const message = args.join(' ')
  if (!silencedLogs.some(log => message.includes(log))) {
    originalConsole.debug(...args)
  }
})

console.warn = jest.fn((...args) => {
  const message = args.join(' ')
  if (!silencedLogs.some(log => message.includes(log))) {
    originalConsole.warn(...args)
  }
})

// Configuración de error handling para tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

// Configuración de cleanup después de cada test
afterEach(() => {
  // Limpiar timers
  jest.clearAllTimers()

  // Limpiar mocks de DOM
  document.body.innerHTML = ''

  // Reset helpers
  if (global.animationTestHelpers) {
    global.animationTestHelpers.resetAllMocks()
  }
})

// Configuración de setup antes de cada test
beforeEach(() => {
  // Usar fake timers por defecto
  jest.useFakeTimers()

  // Reset performance metrics
  if (global.animationTestHelpers) {
    global.animationTestHelpers.mockPerformanceMetrics()
  }
})

// Exportar helpers para uso en tests
module.exports = {
  animationTestHelpers: global.animationTestHelpers,
}
