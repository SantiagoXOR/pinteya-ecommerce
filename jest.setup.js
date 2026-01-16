// ===================================
// PINTEYA E-COMMERCE - SETUP DE JEST
// ===================================

// Importar fake-indexeddb antes que cualquier otra cosa para que IndexedDB esté disponible
import 'fake-indexeddb/auto'

// Polyfills para MSW
import { TextEncoder, TextDecoder } from 'util'
import { ReadableStream, WritableStream, TransformStream } from 'stream/web'

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder
global.ReadableStream = ReadableStream
global.WritableStream = WritableStream
global.TransformStream = TransformStream

// Polyfill para structuredClone (requerido por fake-indexeddb en Node.js)
if (!global.structuredClone) {
  global.structuredClone = (obj) => {
    return JSON.parse(JSON.stringify(obj))
  }
}

// Mock fetch si no está disponible
if (!global.fetch) {
  global.fetch = jest.fn()
}

// Mock BroadcastChannel para MSW
global.BroadcastChannel = class BroadcastChannel {
  constructor(name) {
    this.name = name
  }
  postMessage() {}
  close() {}
  addEventListener() {}
  removeEventListener() {}
}

import '@testing-library/jest-dom'

// Mock TanStack Query para tests - Versión completa con QueryCache
jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query')

  // Mock completo del QueryCache
  const mockQueryCache = {
    clear: jest.fn(),
    get: jest.fn(() => null),
    getAll: jest.fn(() => []),
    find: jest.fn(() => null),
    findAll: jest.fn(() => []),
    notify: jest.fn(),
    onFocus: jest.fn(),
    onOnline: jest.fn(),
    subscribe: jest.fn(() => jest.fn()),
    build: jest.fn(),
  }

  // Mock completo del MutationCache
  const mockMutationCache = {
    clear: jest.fn(),
    getAll: jest.fn(() => []),
    find: jest.fn(() => null),
    findAll: jest.fn(() => []),
    notify: jest.fn(),
    subscribe: jest.fn(() => jest.fn()),
    build: jest.fn(),
  }

  // Mock del QueryClient con todos los métodos necesarios
  const mockQueryClient = {
    clear: jest.fn(),
    getQueryCache: jest.fn(() => mockQueryCache),
    getMutationCache: jest.fn(() => mockMutationCache),
    setQueryData: jest.fn(),
    getQueryData: jest.fn(),
    invalidateQueries: jest.fn(),
    removeQueries: jest.fn(),
    prefetchQuery: jest.fn(),
    defaultQueryOptions: jest.fn(() => ({})),
    getDefaultOptions: jest.fn(() => ({
      queries: {},
      mutations: {},
    })),
    mount: jest.fn(),
    unmount: jest.fn(),
    isFetching: jest.fn(() => 0),
    isMutating: jest.fn(() => 0),
  }

  return {
    ...actual,
    QueryClient: jest.fn().mockImplementation(() => mockQueryClient),
    useQuery: jest.fn(() => ({
      data: null,
      error: null,
      isLoading: false,
      isError: false,
      isSuccess: true,
      isFetching: false,
      isStale: false,
      dataUpdatedAt: Date.now(),
      refetch: jest.fn(),
    })),
    useQueryClient: jest.fn(() => mockQueryClient),
    QueryClientProvider: ({ children }) => children,
  }
})

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
  useSearchParams: jest.fn(() => ({
    get: jest.fn(key => {
      if (key === 'q') return 'test-query'
      return null
    }),
    getAll: jest.fn(),
    has: jest.fn(),
    keys: jest.fn(),
    values: jest.fn(),
    entries: jest.fn(),
    forEach: jest.fn(),
    toString: jest.fn(() => 'q=test-query'),
  })),
  usePathname() {
    return '/'
  },
}))

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: props => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />
  },
}))

// Mock Next.js Link component
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }) => {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    )
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
      configurable: true,
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

// Mock NextAuth.js components and functions
jest.mock('next-auth', () => ({
  default: jest.fn(() => ({
    handlers: { GET: jest.fn(), POST: jest.fn() },
    auth: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
  })),
}))

jest.mock('next-auth/providers/google', () => ({
  default: jest.fn(() => ({
    id: 'google',
    name: 'Google',
    type: 'oauth',
  })),
}))

// Mock NextAuth.js React hooks
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        image: 'https://example.com/avatar.jpg',
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    },
    status: 'authenticated',
  })),
  signIn: jest.fn(() => Promise.resolve({ ok: true, error: null })),
  signOut: jest.fn(() => Promise.resolve({ url: '/api/auth/signin' })),
  getProviders: jest.fn(() =>
    Promise.resolve({
      google: {
        id: 'google',
        name: 'Google',
        type: 'oauth',
        signinUrl: '/api/auth/signin/google',
        callbackUrl: '/api/auth/callback/google',
      },
    })
  ),
  SessionProvider: ({ children }) => children,
}))

// Mock NextAuth.js auth function
jest.mock('@/auth', () => ({
  auth: jest.fn(() =>
    Promise.resolve({
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        image: 'https://example.com/avatar.jpg',
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    })
  ),
  signIn: jest.fn(),
  signOut: jest.fn(),
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
    'select',
    'eq',
    'gte',
    'lte',
    'gt',
    'lt',
    'or',
    'and',
    'ilike',
    'like',
    'in',
    'order',
    'neq',
    'is',
    'not',
  ]

  chainableMethods.forEach(method => {
    builder[method] = jest.fn(() => builder)
  })

  // Métodos que retornan promesas
  builder.range = jest.fn(() => Promise.resolve(mockSupabaseResponse))
  builder.single = jest.fn(() =>
    Promise.resolve({
      data: { id: 1, name: 'Test Category', slug: 'test-category' },
      error: null,
    })
  )

  // Agregar soporte para Promise (then/catch) para casos donde no se llama a range()
  builder.then = jest.fn(callback => {
    return Promise.resolve(callback(mockSupabaseResponse))
  })
  builder.catch = jest.fn(callback => {
    return Promise.resolve()
  })

  // Métodos especiales
  builder.insert = jest.fn(data => {
    // Para inserts que no necesitan select (como order_items)
    if (Array.isArray(data) && data[0]?.order_id) {
      return Promise.resolve({ data: null, error: null })
    }

    return {
      select: jest.fn(columns => ({
        single: jest.fn(() => {
          // Crear un objeto de usuario válido para inserts de usuarios (array)
          if (Array.isArray(data) && data[0]?.clerk_id) {
            return Promise.resolve({
              data: {
                id: 'test-user-id',
                clerk_id: data[0].clerk_id,
                email: data[0].email || 'test@example.com',
                name: data[0].name || 'Test User',
              },
              error: null,
            })
          }
          // Para inserts de usuarios sin array (objeto directo)
          if (data?.clerk_id) {
            return Promise.resolve({
              data: {
                id: 'test-user-id',
                clerk_id: data.clerk_id,
                email: data.email || 'test@example.com',
                name: data.name || 'Test User',
              },
              error: null,
            })
          }
          // Para otros tipos de insert, usar el mock por defecto
          return Promise.resolve({
            data: { id: 1, ...mockSupabaseResponse.data[0] },
            error: null,
          })
        }),
      })),
    }
  })

  builder.update = jest.fn(() => ({
    eq: jest.fn(() => Promise.resolve({ error: null })),
  }))

  builder.delete = jest.fn(() => ({
    eq: jest.fn(() => Promise.resolve({ error: null })),
  }))

  // Método para consultas con IN (productos)
  builder.in = jest.fn(() =>
    Promise.resolve({
      data: [
        {
          id: 1,
          name: 'Test Product 1',
          price: 1000,
          discounted_price: null,
          stock: 10,
          images: { previews: ['test1.jpg'] },
          category: { name: 'Test Category', slug: 'test-category' },
        },
        {
          id: 2,
          name: 'Test Product 2',
          price: 2000,
          discounted_price: 1800,
          stock: 5,
          images: { previews: ['test2.jpg'] },
          category: { name: 'Test Category', slug: 'test-category' },
        },
      ],
      error: null,
    })
  )

  return builder
}

// Mock principal de Supabase - Versión mejorada
jest.mock('@/lib/supabase', () => {
  // Mock completo del query builder con todos los métodos
  const createMockQueryBuilder = () => {
    const mockData = {
      data: [
        { brand: 'El Galgo', product_count: 3 },
        { brand: 'Plavicon', product_count: 5 },
        { brand: 'Akapol', product_count: 2 },
      ],
      error: null,
    }

    const mockQueryBuilder = {
      select: jest.fn(() => mockQueryBuilder),
      from: jest.fn(() => mockQueryBuilder),
      insert: jest.fn(() => mockQueryBuilder),
      update: jest.fn(() => mockQueryBuilder),
      delete: jest.fn(() => mockQueryBuilder),
      eq: jest.fn(() => mockQueryBuilder),
      neq: jest.fn(() => mockQueryBuilder),
      gt: jest.fn(() => mockQueryBuilder),
      gte: jest.fn(() => mockQueryBuilder),
      lt: jest.fn(() => mockQueryBuilder),
      lte: jest.fn(() => mockQueryBuilder),
      like: jest.fn(() => mockQueryBuilder),
      ilike: jest.fn(() => mockQueryBuilder),
      is: jest.fn(() => mockQueryBuilder),
      in: jest.fn(() => mockQueryBuilder),
      not: jest.fn(() => mockQueryBuilder),
      or: jest.fn(() => mockQueryBuilder),
      and: jest.fn(() => mockQueryBuilder),
      order: jest.fn(() => mockQueryBuilder),
      limit: jest.fn(() => mockQueryBuilder),
      range: jest.fn(() => mockQueryBuilder),
      single: jest.fn(() => Promise.resolve(mockData)),
      maybeSingle: jest.fn(() => Promise.resolve(mockData)),
      then: jest.fn(callback => Promise.resolve(callback(mockData))),
      catch: jest.fn(() => Promise.resolve()),
    }

    return mockQueryBuilder
  }

  const mockClient = {
    from: jest.fn(() => createMockQueryBuilder()),
    auth: {
      getUser: jest.fn(() =>
        Promise.resolve({
          data: { user: null },
          error: null,
        })
      ),
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

// Mock para @/lib/integrations/supabase
jest.mock('@/lib/integrations/supabase', () => {
  const mockSupabaseClient = {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      like: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      contains: jest.fn().mockReturnThis(),
      containedBy: jest.fn().mockReturnThis(),
      rangeGt: jest.fn().mockReturnThis(),
      rangeGte: jest.fn().mockReturnThis(),
      rangeLt: jest.fn().mockReturnThis(),
      rangeLte: jest.fn().mockReturnThis(),
      rangeAdjacent: jest.fn().mockReturnThis(),
      overlaps: jest.fn().mockReturnThis(),
      textSearch: jest.fn().mockReturnThis(),
      match: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      filter: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      csv: jest.fn().mockResolvedValue({ data: '', error: null }),
      geojson: jest.fn().mockResolvedValue({ data: null, error: null }),
      explain: jest.fn().mockResolvedValue({ data: null, error: null }),
      rollback: jest.fn().mockResolvedValue({ data: null, error: null }),
      returns: jest.fn().mockReturnThis(),
      then: jest.fn().mockResolvedValue({ data: [], error: null }),
    })),
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signUp: jest.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
      signInWithPassword: jest
        .fn()
        .mockResolvedValue({ data: { user: null, session: null }, error: null }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: jest
        .fn()
        .mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } }),
    },
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({ data: null, error: null }),
        download: jest.fn().mockResolvedValue({ data: null, error: null }),
        remove: jest.fn().mockResolvedValue({ data: null, error: null }),
        list: jest.fn().mockResolvedValue({ data: [], error: null }),
        getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'mock-url' } }),
      })),
    },
    rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
  }

  return {
    supabase: mockSupabaseClient,
    supabaseAdmin: mockSupabaseClient,
    getSupabaseClient: jest.fn(() => mockSupabaseClient),
    handleSupabaseError: jest.fn(),
    mockSupabaseClient,
  }
})

// Mock NextAuth.js para tests de API
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(() =>
    Promise.resolve({
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
      },
    })
  ),
}))

// Mock auth utilities para compatibilidad
jest.mock('@/lib/auth/admin-auth', () => ({
  getAuthUser: jest.fn(() =>
    Promise.resolve({
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
    })
  ),
  getAuthUserId: jest.fn(() => Promise.resolve('test-user-id')),
  requireAuth: jest.fn(() =>
    Promise.resolve({
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
    })
  ),
}))

// Mock MercadoPago - Versión completa
jest.mock('@/lib/integrations/mercadopago', () => ({
  createMercadoPagoClient: jest.fn(() => ({
    accessToken: 'TEST-mock-token',
    options: {
      timeout: 5000,
      idempotencyKey: 'mock-key',
    },
  })),
  preference: {
    create: jest.fn(() =>
      Promise.resolve({
        id: 'mock-preference-id',
        init_point: 'https://mock-mercadopago.com/checkout',
        sandbox_init_point: 'https://sandbox-mercadopago.com/checkout',
      })
    ),
  },
  payment: {
    get: jest.fn(() =>
      Promise.resolve({
        id: 'mock-payment-id',
        status: 'approved',
        transaction_amount: 100,
      })
    ),
  },
  createPaymentPreference: jest.fn(() =>
    Promise.resolve({
      id: 'mock-preference-id',
      init_point: 'https://mock-mercadopago.com/checkout',
    })
  ),
  getPaymentInfo: jest.fn(() =>
    Promise.resolve({
      id: 'mock-payment-id',
      status: 'approved',
    })
  ),
  validateWebhookSignature: jest.fn(() => true),
  validateWebhookOrigin: jest.fn(() => true),
}))

// Mock Redis para tests
jest.mock('@/lib/redis', () => ({
  redis: {
    get: jest.fn(() => Promise.resolve(null)),
    set: jest.fn(() => Promise.resolve('OK')),
    del: jest.fn(() => Promise.resolve(1)),
    incr: jest.fn(() => Promise.resolve(1)),
    expire: jest.fn(() => Promise.resolve(1)),
    ping: jest.fn(() => Promise.resolve('PONG')),
    disconnect: jest.fn(() => Promise.resolve()),
  },
  RedisCache: jest.fn().mockImplementation(() => ({
    get: jest.fn(() => Promise.resolve(null)),
    set: jest.fn(() => Promise.resolve(true)),
    del: jest.fn(() => Promise.resolve(true)),
    incr: jest.fn(() => Promise.resolve(1)),
    expire: jest.fn(() => Promise.resolve(true)),
    ping: jest.fn(() => Promise.resolve(true)),
  })),
  isRedisAvailable: jest.fn(() => false),
}))

// Mock Rate Limiter
jest.mock('@/lib/enterprise/rate-limiter', () => ({
  checkRateLimit: jest.fn(() =>
    Promise.resolve({
      success: true,
      remaining: 100,
      reset: Date.now() + 60000,
    })
  ),
  RateLimiter: jest.fn().mockImplementation(() => ({
    check: jest.fn(() =>
      Promise.resolve({
        success: true,
        remaining: 100,
        reset: Date.now() + 60000,
      })
    ),
  })),
}))

// ===================================
// MOCK API RESPONSES
// ===================================
// Importar funciones mock de handlers
const { mockApiResponses } = require('./src/__tests__/mocks/handlers')

// Mock global fetch con respuestas de handlers
global.fetch = jest.fn((url, options) => {
  const urlString = typeof url === 'string' ? url : url.toString()
  
  // Mock para /api/products
  if (urlString.includes('/api/products')) {
    const urlObj = new URL(urlString, 'http://localhost')
    const id = urlObj.pathname.split('/').pop()
    const slug = urlObj.searchParams.get('slug')
    
    if (id && id !== 'products') {
      const response = mockApiResponses.supabase.getProductById(Number(id))
      return Promise.resolve(
        new Response(JSON.stringify(response), {
          status: response.status || 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    }
    
    if (slug) {
      const response = mockApiResponses.supabase.getProductBySlug(slug)
      return Promise.resolve(
        new Response(JSON.stringify(response), {
          status: response.status || 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    }
    
    const response = mockApiResponses.supabase.getProducts()
    return Promise.resolve(
      new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )
  }
  
  // Mock para /api/cart
  if (urlString.includes('/api/cart')) {
    if (options?.method === 'POST') {
      const body = JSON.parse(options.body || '{}')
      const response = mockApiResponses.supabase.addToCart(body.product_id, body.quantity)
      return Promise.resolve(
        new Response(JSON.stringify(response), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    }
    
    if (options?.method === 'PUT') {
      const productId = urlString.split('/').pop()
      const body = JSON.parse(options.body || '{}')
      const response = mockApiResponses.supabase.updateCartItem(Number(productId), body.quantity)
      return Promise.resolve(
        new Response(JSON.stringify(response), {
          status: response.status || 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    }
    
    if (options?.method === 'DELETE') {
      const productId = urlString.split('/').pop()
      const response = mockApiResponses.supabase.removeFromCart(Number(productId))
      return Promise.resolve(
        new Response(JSON.stringify(response), {
          status: response.status || 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    }
    
    const response = mockApiResponses.supabase.getCart()
    return Promise.resolve(
      new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )
  }
  
  // Mock para /api/mercadopago
  if (urlString.includes('/api/mercadopago/preferences')) {
    const body = options?.body ? JSON.parse(options.body) : {}
    const response = mockApiResponses.mercadopago.createPreference(body)
    return Promise.resolve(
      new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )
  }
  
  // Mock para /api/auth
  if (urlString.includes('/api/auth/session')) {
    const response = mockApiResponses.nextAuth.getSession()
    return Promise.resolve(
      new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )
  }
  
  // Default response
  return Promise.resolve(
    new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  )
})

// ===================================
// SHADCN/UI COMPONENTS MOCKS
// ===================================

// Mock para componentes de shadcn/ui que usan Radix UI
jest.mock('@radix-ui/react-dialog', () => {
  const React = require('react')
  return {
    Root: ({ children, open, onOpenChange }) =>
      React.createElement('div', { 'data-testid': 'dialog-root', 'data-open': open }, open && children),
    Trigger: ({ children, onClick }) =>
      React.createElement('button', { onClick }, children),
    Portal: ({ children }) => React.createElement('div', null, children),
    Overlay: ({ children }) => React.createElement('div', { 'data-testid': 'dialog-overlay' }, children),
    Content: ({ children }) => React.createElement('div', { 'data-testid': 'dialog-content' }, children),
    Title: ({ children }) => React.createElement('h2', { 'data-testid': 'dialog-title' }, children),
    Description: ({ children }) => React.createElement('p', { 'data-testid': 'dialog-description' }, children),
    Close: ({ children, onClick }) =>
      React.createElement('button', { onClick, 'data-testid': 'dialog-close' }, children),
  }
})

jest.mock('@radix-ui/react-dropdown-menu', () => {
  const React = require('react')
  return {
    Root: ({ children }) => React.createElement('div', null, children),
    Trigger: ({ children, onClick }) => React.createElement('button', { onClick }, children),
    Content: ({ children }) => React.createElement('div', { 'data-testid': 'dropdown-content' }, children),
    Item: ({ children, onClick }) =>
      React.createElement('div', { onClick, 'data-testid': 'dropdown-item' }, children),
  }
})

jest.mock('@radix-ui/react-select', () => {
  const React = require('react')
  return {
    Root: ({ children, onValueChange, value }) =>
      React.createElement('div', { 'data-testid': 'select-root', 'data-value': value }, children),
    Trigger: ({ children, onClick }) =>
      React.createElement('button', { onClick, 'data-testid': 'select-trigger' }, children),
    Content: ({ children }) => React.createElement('div', { 'data-testid': 'select-content' }, children),
    Item: ({ children, onClick, value }) =>
      React.createElement(
        'div',
        { onClick: () => onClick?.(value), 'data-testid': 'select-item', 'data-value': value },
        children
      ),
  }
})

jest.mock('@radix-ui/react-popover', () => {
  const React = require('react')
  return {
    Root: ({ children, open, onOpenChange }) =>
      React.createElement('div', { 'data-testid': 'popover-root', 'data-open': open }, open && children),
    Trigger: ({ children, onClick }) => React.createElement('button', { onClick }, children),
    Content: ({ children }) => React.createElement('div', { 'data-testid': 'popover-content' }, children),
  }
})

jest.mock('@radix-ui/react-tooltip', () => {
  const React = require('react')
  return {
    Root: ({ children }) => React.createElement('div', null, children),
    Trigger: ({ children }) => React.createElement('div', null, children),
    Content: ({ children }) => React.createElement('div', { 'data-testid': 'tooltip-content' }, children),
  }
})

jest.mock('@radix-ui/react-tabs', () => {
  const React = require('react')
  return {
    Root: ({ children, defaultValue }) =>
      React.createElement('div', { 'data-testid': 'tabs-root', 'data-default-value': defaultValue }, children),
    List: ({ children }) => React.createElement('div', { 'data-testid': 'tabs-list' }, children),
    Trigger: ({ children, onClick, value }) =>
      React.createElement('button', { onClick, 'data-testid': 'tabs-trigger', 'data-value': value }, children),
    Content: ({ children, value }) =>
      React.createElement('div', { 'data-testid': 'tabs-content', 'data-value': value }, children),
  }
})

// ===================================
// MOCK DE OPTIMIZED IMPORTS
// ===================================
// Mock para evitar problemas con @tabler/icons-react y módulos ES

jest.mock('@/lib/optimized-imports', () => {
  const React = require('react')
  return {
    Loader2: () => React.createElement('svg', { 'data-testid': 'loader-2' }),
    CreditCard: () => React.createElement('svg', { 'data-testid': 'credit-card' }),
    AlertTriangle: () => React.createElement('svg', { 'data-testid': 'alert-triangle' }),
    ShoppingCart: () => React.createElement('svg', { 'data-testid': 'shopping-cart' }),
    Truck: () => React.createElement('svg', { 'data-testid': 'truck' }),
    CheckCircle: () => React.createElement('svg', { 'data-testid': 'check-circle' }),
    User: () => React.createElement('svg', { 'data-testid': 'user' }),
    MapPin: () => React.createElement('svg', { 'data-testid': 'map-pin' }),
    Shield: () => React.createElement('svg', { 'data-testid': 'shield' }),
    Phone: () => React.createElement('svg', { 'data-testid': 'phone' }),
    Mail: () => React.createElement('svg', { 'data-testid': 'mail' }),
    MessageCircle: () => React.createElement('svg', { 'data-testid': 'message-circle' }),
    Zap: () => React.createElement('svg', { 'data-testid': 'zap' }),
    Gift: () => React.createElement('svg', { 'data-testid': 'gift' }),
    Star: () => React.createElement('svg', { 'data-testid': 'star' }),
    Users: () => React.createElement('svg', { 'data-testid': 'users' }),
    Clock: () => React.createElement('svg', { 'data-testid': 'clock' }),
    Eye: () => React.createElement('svg', { 'data-testid': 'eye' }),
    TrendingUp: () => React.createElement('svg', { 'data-testid': 'trending-up' }),
    ArrowLeft: () => React.createElement('svg', { 'data-testid': 'arrow-left' }),
    ChevronDown: () => React.createElement('svg', { 'data-testid': 'chevron-down' }),
    ChevronUp: () => React.createElement('svg', { 'data-testid': 'chevron-up' }),
    Package: () => React.createElement('svg', { 'data-testid': 'package' }),
    AlertCircle: () => React.createElement('svg', { 'data-testid': 'alert-circle' }),
  }
})

// ===================================
// CLEANUP
// ===================================

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks()
  localStorageMock.clear()
  sessionStorageMock.clear()
  
  // Limpiar mocks de fetch
  if (global.fetch && typeof global.fetch.mockClear === 'function') {
    global.fetch.mockClear()
  }
})
