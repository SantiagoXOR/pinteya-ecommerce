// ===================================
// PINTEYA E-COMMERCE - SETUP DE JEST
// ===================================

import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
    }
  },
}))

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />
  },
}))

// Mock Next.js Link component
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }) => {
    return <a href={href} {...props}>{children}</a>
  },
}))

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'test-clerk-key'
process.env.CLERK_SECRET_KEY = 'test-clerk-secret'
process.env.MERCADOPAGO_ACCESS_TOKEN = 'test-mp-token'
process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY = 'test-mp-public-key'

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {
    return null
  }
  disconnect() {
    return null
  }
  unobserve() {
    return null
  }
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {
    return null
  }
  disconnect() {
    return null
  }
  unobserve() {
    return null
  }
}

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.sessionStorage = sessionStorageMock

// Mock fetch
global.fetch = jest.fn()

// Mock Request and Response for Next.js API tests
global.Request = class Request {
  constructor(input, init = {}) {
    // Use defineProperty to handle read-only properties
    Object.defineProperty(this, 'url', {
      value: input,
      writable: false,
      enumerable: true,
      configurable: true
    })
    this.method = init.method || 'GET'
    this.headers = new Headers(init.headers)
    this.body = init.body
  }

  async json() {
    return JSON.parse(this.body || '{}')
  }

  async text() {
    return this.body || ''
  }
}

global.Response = class Response {
  constructor(body, init = {}) {
    this.body = body
    this.status = init.status || 200
    this.statusText = init.statusText || 'OK'
    this.headers = new Headers(init.headers)
    this.ok = this.status >= 200 && this.status < 300
  }

  static json(data, init = {}) {
    return new Response(JSON.stringify(data), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init.headers,
      },
    })
  }

  async json() {
    return JSON.parse(this.body || '{}')
  }

  async text() {
    return this.body || ''
  }
}

global.Headers = class Headers {
  constructor(init = {}) {
    this.headers = new Map()
    if (init) {
      Object.entries(init).forEach(([key, value]) => {
        this.headers.set(key.toLowerCase(), value)
      })
    }
  }

  get(name) {
    return this.headers.get(name.toLowerCase())
  }

  set(name, value) {
    this.headers.set(name.toLowerCase(), value)
  }

  has(name) {
    return this.headers.has(name.toLowerCase())
  }

  delete(name) {
    this.headers.delete(name.toLowerCase())
  }

  // Método entries() requerido por NextRequest
  entries() {
    return this.headers.entries()
  }

  // Métodos adicionales para compatibilidad completa
  keys() {
    return this.headers.keys()
  }

  values() {
    return this.headers.values()
  }

  forEach(callback, thisArg) {
    this.headers.forEach(callback, thisArg)
  }

  // Symbol.iterator para hacer Headers iterable
  [Symbol.iterator]() {
    return this.headers.entries()
  }
}

// Suppress console errors in tests unless explicitly needed
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})

// Mock Context Providers
jest.mock('@/app/context/CartSidebarModalContext', () => ({
  useCartModalContext: () => ({
    isOpen: false,
    openModal: jest.fn(),
    closeModal: jest.fn(),
  }),
  CartModalProvider: ({ children }) => children,
}))

jest.mock('@/app/context/QuickViewModalContext', () => ({
  useModalContext: () => ({
    isOpen: false,
    openModal: jest.fn(),
    closeModal: jest.fn(),
    selectedProduct: null,
  }),
  ModalProvider: ({ children }) => children,
}))

// Mock Clerk components
jest.mock('@clerk/nextjs', () => ({
  SignedIn: ({ children }) => <div data-testid="signed-in">{children}</div>,
  SignedOut: ({ children }) => <div data-testid="signed-out">{children}</div>,
  UserButton: () => <div data-testid="user-button">User Button</div>,
  useAuth: () => ({
    isSignedIn: false,
    userId: null,
  }),
  useUser: () => ({
    user: null,
    isLoaded: true,
  }),
}))

// Mock Supabase - Configuración completa y robusta
const mockSupabaseResponse = {
  data: [
    {
      id: 1,
      name: 'Test Product 1',
      slug: 'test-product-1',
      description: 'Test description',
      price: 1000,
      discounted_price: 900,
      stock: 10,
      category_id: 1,
      brand: 'Test Brand',
      images: ['test1.jpg'],
      created_at: '2024-01-01T00:00:00Z',
      category: { id: 1, name: 'Test Category', slug: 'test-category' },
    },
    {
      id: 2,
      name: 'Test Product 2',
      slug: 'test-product-2',
      description: 'Test description 2',
      price: 2000,
      discounted_price: 2000,
      stock: 5,
      category_id: 2,
      brand: 'Test Brand 2',
      images: ['test2.jpg'],
      created_at: '2024-01-01T00:00:00Z',
      category: { id: 2, name: 'Test Category 2', slug: 'test-category-2' },
    },
  ],
  error: null,
  count: 2,
}

// Función para crear un mock robusto de query builder
const createMockQueryBuilder = () => {
  const builder = {}

  // Métodos que retornan el builder para chaining
  const chainableMethods = [
    'select', 'eq', 'gte', 'lte', 'gt', 'lt', 'or', 'and',
    'ilike', 'like', 'in', 'order', 'neq', 'is', 'not'
  ]

  chainableMethods.forEach(method => {
    builder[method] = jest.fn(() => builder)
  })

  // Métodos que retornan promesas
  builder.range = jest.fn(() => Promise.resolve(mockSupabaseResponse))
  builder.single = jest.fn(() => Promise.resolve({
    data: { id: 1, name: 'Test Category', slug: 'test-category' },
    error: null,
  }))

  // Métodos especiales
  builder.insert = jest.fn((data) => {
    // Para inserts que no necesitan select (como order_items)
    if (Array.isArray(data) && data[0]?.order_id) {
      return Promise.resolve({ data: null, error: null });
    }

    return {
      select: jest.fn((columns) => ({
        single: jest.fn(() => {
          // Crear un objeto de usuario válido para inserts de usuarios (array)
          if (Array.isArray(data) && data[0]?.clerk_id) {
            return Promise.resolve({
              data: {
                id: 'test-user-id',
                clerk_id: data[0].clerk_id,
                email: data[0].email || 'test@example.com',
                name: data[0].name || 'Test User'
              },
              error: null,
            });
          }
          // Para inserts de usuarios sin array (objeto directo)
          if (data?.clerk_id) {
            return Promise.resolve({
              data: {
                id: 'test-user-id',
                clerk_id: data.clerk_id,
                email: data.email || 'test@example.com',
                name: data.name || 'Test User'
              },
              error: null,
            });
          }
          // Para otros tipos de insert, usar el mock por defecto
          return Promise.resolve({
            data: { id: 1, ...mockSupabaseResponse.data[0] },
            error: null,
          });
        }),
      }))
    };
  })

  builder.update = jest.fn(() => ({
    eq: jest.fn(() => Promise.resolve({ error: null })),
  }))

  builder.delete = jest.fn(() => ({
    eq: jest.fn(() => Promise.resolve({ error: null })),
  }))

  // Método para consultas con IN (productos)
  builder.in = jest.fn(() => Promise.resolve({
    data: [
      {
        id: 1,
        name: 'Test Product 1',
        price: 1000,
        discounted_price: null,
        stock: 10,
        images: { previews: ['test1.jpg'] },
        category: { name: 'Test Category', slug: 'test-category' }
      },
      {
        id: 2,
        name: 'Test Product 2',
        price: 2000,
        discounted_price: 1800,
        stock: 5,
        images: { previews: ['test2.jpg'] },
        category: { name: 'Test Category', slug: 'test-category' }
      }
    ],
    error: null
  }))

  return builder
}

// Mock principal de Supabase - Exportaciones nombradas
jest.mock('@/lib/supabase', () => {
  const mockClient = {
    from: jest.fn(() => createMockQueryBuilder()),
    auth: {
      getUser: jest.fn(() => Promise.resolve({
        data: { user: null },
        error: null,
      })),
    },
  }

  return {
    getSupabaseClient: jest.fn(() => mockClient),
    supabase: mockClient,
    supabaseAdmin: mockClient,
    handleSupabaseError: jest.fn((error, context) => {
      if (error?.message) {
        throw new Error(error.message)
      }
      throw new Error('Supabase error')
    }),
    isAuthenticated: jest.fn(() => Promise.resolve(false)),
    getCurrentUser: jest.fn(() => Promise.resolve(null)),
  }
})

// Mock adicional para importaciones directas
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}))

// Mock Clerk para tests de API
jest.mock('@clerk/nextjs/server', () => ({
  currentUser: jest.fn(() => Promise.resolve(null)),
  auth: jest.fn(() => ({
    userId: null,
    user: null,
  })),
}))

jest.mock('@/lib/clerk', () => ({
  getAuthUser: jest.fn(() => Promise.resolve(null)),
  getAuthUserId: jest.fn(() => Promise.resolve(null)),
}))

// Mock MercadoPago
jest.mock('@/lib/mercadopago', () => ({
  preference: {
    create: jest.fn(() => Promise.resolve({
      id: 'test-preference-id',
      init_point: 'https://test-mercadopago.com/checkout',
    })),
  },
  payment: {
    get: jest.fn(() => Promise.resolve({
      id: 'test-payment-id',
      status: 'approved',
      external_reference: 'test-order-id',
    })),
  },
  getPaymentInfo: jest.fn(() => Promise.resolve({
    success: true,
    data: {
      id: 'test-payment-id',
      status: 'approved',
      external_reference: 'test-order-id',
    },
  })),
  validateWebhookSignature: jest.fn(() => true),
}))

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks()
  localStorageMock.clear()
  sessionStorageMock.clear()
})
