/**
 * Mocks compartidos para tests de analytics
 * Centraliza todos los mocks comunes para evitar duplicación
 */

// Mock de fetch global
export const mockFetch = jest.fn()

// Mock de navigator.sendBeacon
export const mockSendBeacon = jest.fn()

// Mock de window
export const mockWindow = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  indexedDB: global.indexedDB,
  location: {
    pathname: '/',
    href: 'http://localhost:3000/',
  },
}

// Mock de document
export const mockDocument = {
  createElement: jest.fn(() => ({
    innerHTML: '',
    className: '',
    style: {},
    offsetHeight: 100,
    offsetWidth: 100,
  })),
  body: {
    appendChild: jest.fn(),
    removeChild: jest.fn(),
  },
  querySelector: jest.fn(),
  getElementById: jest.fn(),
}

// Setup global de mocks
export function setupAnalyticsMocks() {
  // Mock fetch
  global.fetch = mockFetch as any

  // Mock navigator.sendBeacon
  if (typeof global.navigator === 'undefined') {
    ;(global as any).navigator = {}
  }
  ;(global.navigator as any).sendBeacon = mockSendBeacon

  // Mock window (solo métodos, no propiedades que causan conflictos)
  if (typeof global.window === 'undefined') {
    ;(global as any).window = mockWindow
  } else {
    // Solo asignar métodos, no propiedades como location que causan conflictos
    if (mockWindow.addEventListener) {
      global.window.addEventListener = mockWindow.addEventListener as any
    }
    if (mockWindow.removeEventListener) {
      global.window.removeEventListener = mockWindow.removeEventListener as any
    }
    // No asignar location directamente, solo mockear si es necesario
  }

  // Mock document (solo métodos, no propiedades que causan conflictos)
  if (typeof global.document === 'undefined') {
    ;(global as any).document = mockDocument
  } else {
    // Solo asignar métodos, no propiedades como body que causan conflictos
    if (mockDocument.createElement) {
      global.document.createElement = mockDocument.createElement as any
    }
    if (mockDocument.querySelector) {
      global.document.querySelector = mockDocument.querySelector as any
    }
    if (mockDocument.getElementById) {
      global.document.getElementById = mockDocument.getElementById as any
    }
    // Mock body solo si no existe
    if (!global.document.body) {
      ;(global.document as any).body = mockDocument.body
    } else {
      // Solo asignar métodos del body
      if (mockDocument.body.appendChild) {
        global.document.body.appendChild = mockDocument.body.appendChild as any
      }
      if (mockDocument.body.removeChild) {
        global.document.body.removeChild = mockDocument.body.removeChild as any
      }
    }
  }
}

// Cleanup de mocks
export function cleanupAnalyticsMocks() {
  mockFetch.mockClear()
  mockSendBeacon.mockClear()
  mockWindow.addEventListener.mockClear()
  mockWindow.removeEventListener.mockClear()
  mockDocument.createElement.mockClear()
  mockDocument.body.appendChild.mockClear()
  mockDocument.body.removeChild.mockClear()
}

// Helper para crear eventos de analytics mock
export function createMockAnalyticsEvent(overrides?: Partial<any>) {
  return {
    event: 'page_view',
    category: 'navigation',
    action: 'view',
    label: '/test',
    value: undefined,
    userId: undefined,
    sessionId: 'test-session-123',
    page: '/test',
    userAgent: 'Mozilla/5.0 (Test)',
    metadata: {},
    ...overrides,
  }
}

// Helper para crear respuesta de fetch mock
export function createMockFetchResponse(data: any, status: number = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    headers: new Headers(),
  } as Response)
}

// Helper para simular bloqueo de fetch
export function simulateAdBlock() {
  mockFetch.mockRejectedValue(new Error('ERR_BLOCKED_BY_CLIENT'))
}

// Helper para simular fetch exitoso
export function simulateFetchSuccess(data: any = { success: true }) {
  mockFetch.mockResolvedValue(createMockFetchResponse(data))
}

// Helper para simular sendBeacon exitoso
export function simulateSendBeaconSuccess() {
  mockSendBeacon.mockReturnValue(true)
}

// Helper para simular sendBeacon fallido
export function simulateSendBeaconFailure() {
  mockSendBeacon.mockReturnValue(false)
}
