// ===================================
// PINTEYA E-COMMERCE - JEST SETUP FASE 3
// ===================================

// Polyfills para Node.js
import { TextEncoder, TextDecoder } from 'util';

// Configurar polyfills globales
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock de fetch global
global.fetch = jest.fn();

// Mock de Request y Response para Next.js
global.Request = jest.fn().mockImplementation((url, options = {}) => ({
  url,
  method: options.method || 'GET',
  headers: new Map(Object.entries(options.headers || {})),
  body: options.body,
  json: jest.fn().mockResolvedValue({}),
  text: jest.fn().mockResolvedValue(''),
  nextUrl: {
    searchParams: new URLSearchParams()
  }
}));

global.Response = jest.fn().mockImplementation((body, options = {}) => ({
  status: options.status || 200,
  statusText: options.statusText || 'OK',
  headers: new Map(Object.entries(options.headers || {})),
  body,
  json: jest.fn().mockResolvedValue(body ? JSON.parse(body) : {}),
  text: jest.fn().mockResolvedValue(body || ''),
  ok: (options.status || 200) >= 200 && (options.status || 200) < 300
}));

global.Headers = jest.fn().mockImplementation((init) => {
  const headers = new Map();
  if (init) {
    if (Array.isArray(init)) {
      init.forEach(([key, value]) => headers.set(key, value));
    } else if (typeof init === 'object') {
      Object.entries(init).forEach(([key, value]) => headers.set(key, value));
    }
  }
  return headers;
});

// Mock de URLSearchParams
global.URLSearchParams = URLSearchParams;

// Mock de crypto para Node.js
const crypto = require('crypto');
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => crypto.randomUUID(),
    getRandomValues: (arr) => crypto.randomFillSync(arr),
    subtle: {
      digest: async (algorithm, data) => {
        const hash = crypto.createHash(algorithm.replace('-', '').toLowerCase());
        hash.update(data);
        return hash.digest();
      }
    }
  }
});

// Mock de performance
global.performance = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByName: jest.fn(() => []),
  getEntriesByType: jest.fn(() => []),
  clearMarks: jest.fn(),
  clearMeasures: jest.fn()
};

// Mock de console para tests silenciosos
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
};

// Restaurar console en modo verbose
if (process.env.JEST_VERBOSE === 'true') {
  global.console = originalConsole;
}

// Mock de process.env para tests
process.env = {
  ...process.env,
  NODE_ENV: 'test',
  NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
  MERCADOPAGO_PUBLIC_KEY_TEST: 'TEST_PUBLIC_KEY',
  MERCADOPAGO_ACCESS_TOKEN_TEST: 'TEST_ACCESS_TOKEN',
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'test-clerk-key',
  CLERK_SECRET_KEY: 'test-clerk-secret',
  WEBHOOK_SECRET: 'test-webhook-secret',
  REDIS_URL: 'redis://localhost:6379',
  ALERT_WEBHOOK_URL: 'https://test.webhook.com'
};

// Mock de timers para tests
jest.useFakeTimers({
  doNotFake: ['nextTick', 'setImmediate']
});

// Configuración de timeouts
jest.setTimeout(30000);

// Mock de módulos externos comunes
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    expire: jest.fn(),
    flushall: jest.fn(),
    on: jest.fn(),
    off: jest.fn()
  }))
}));

// Mock de Next.js router
jest.mock('next/router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    pathname: '/admin/monitoring',
    query: {},
    asPath: '/admin/monitoring',
    route: '/admin/monitoring',
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn()
    }
  }))
}));

// Mock de Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn()
  })),
  usePathname: jest.fn(() => '/admin/monitoring'),
  useSearchParams: jest.fn(() => new URLSearchParams())
}));

// Mock de Clerk
jest.mock('@clerk/nextjs', () => ({
  useAuth: jest.fn(() => ({
    isSignedIn: true,
    userId: 'test-user-id',
    sessionId: 'test-session-id',
    getToken: jest.fn().mockResolvedValue('test-token')
  })),
  useUser: jest.fn(() => ({
    user: {
      id: 'test-user-id',
      emailAddresses: [{ emailAddress: 'test@example.com' }],
      publicMetadata: { role: 'admin' }
    },
    isLoaded: true
  })),
  auth: jest.fn(() => ({
    userId: 'test-user-id',
    sessionId: 'test-session-id',
    getToken: jest.fn().mockResolvedValue('test-token')
  })),
  currentUser: jest.fn(() => ({
    id: 'test-user-id',
    emailAddresses: [{ emailAddress: 'test@example.com' }],
    publicMetadata: { role: 'admin' }
  })),
  ClerkProvider: ({ children }) => children,
  SignInButton: ({ children }) => children,
  SignOutButton: ({ children }) => children,
  UserButton: () => 'UserButton'
}));

// Mock de Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({ data: null, error: null })),
          order: jest.fn(() => ({
            limit: jest.fn(() => ({ data: [], error: null }))
          }))
        })),
        insert: jest.fn(() => ({ error: null })),
        update: jest.fn(() => ({ error: null })),
        delete: jest.fn(() => ({ error: null }))
      })),
      rpc: jest.fn(() => ({ data: [], error: null }))
    })),
    auth: {
      getUser: jest.fn(() => ({ data: { user: null }, error: null })),
      signInWithPassword: jest.fn(() => ({ data: { user: null }, error: null })),
      signOut: jest.fn(() => ({ error: null }))
    }
  }))
}));

// Configuración de ResizeObserver mock
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

// Configuración de IntersectionObserver mock
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

// Mock de window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  }))
});

// Mock de localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock de sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
});

// Configuración de cleanup después de cada test
afterEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
  
  // Limpiar localStorage y sessionStorage mocks
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
  
  sessionStorageMock.getItem.mockClear();
  sessionStorageMock.setItem.mockClear();
  sessionStorageMock.removeItem.mockClear();
  sessionStorageMock.clear.mockClear();
});

// Configuración de cleanup después de todos los tests
afterAll(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

// Configuración de error handling para tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Configuración de warnings
const originalWarn = console.warn;
console.warn = (...args) => {
  // Suprimir warnings específicos de React/Next.js en tests
  const message = args[0];
  if (
    typeof message === 'string' &&
    (message.includes('Warning: ReactDOM.render is deprecated') ||
     message.includes('Warning: componentWillReceiveProps') ||
     message.includes('Warning: componentWillMount'))
  ) {
    return;
  }
  originalWarn.apply(console, args);
};
