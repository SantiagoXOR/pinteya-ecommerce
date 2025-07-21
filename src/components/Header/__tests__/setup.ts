/**
 * Setup específico para tests del Header
 */

import '@testing-library/jest-dom';
import 'jest-axe/extend-expect';
import { configure } from '@testing-library/react';
import { server } from './mocks/server';

// Configuración de React Testing Library
configure({
  testIdAttribute: 'data-testid',
  asyncUtilTimeout: 5000,
  computedStyleSupportsPseudoElements: true,
});

// Mock de Next.js Image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />;
  },
}));

// Mock de Next.js Link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  },
}));

// Mock de Next.js Router
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  pathname: '/',
  query: {},
  asPath: '/',
  route: '/',
  events: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  },
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => ({
    get: jest.fn(),
    getAll: jest.fn(),
    has: jest.fn(),
    keys: jest.fn(),
    values: jest.fn(),
    entries: jest.fn(),
    forEach: jest.fn(),
    toString: jest.fn(),
  }),
  usePathname: () => '/',
}));

// Mock de variables de entorno
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = '[STRIPE_PUBLIC_KEY_REMOVED]test';
process.env.CLERK_SECRET_KEY = '[STRIPE_SECRET_KEY_REMOVED]test';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test_anon_key';

// Mock de localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock de sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock de window.matchMedia
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
});

// Mock de IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Mock de ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Mock de Geolocation API
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
};

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
});

// Mock de Permissions API
const mockPermissions = {
  query: jest.fn().mockResolvedValue({ state: 'granted' }),
};

Object.defineProperty(global.navigator, 'permissions', {
  value: mockPermissions,
});

// Mock de fetch global
global.fetch = jest.fn();

// Mock de console para tests más limpios
const originalConsole = { ...console };

beforeAll(() => {
  // Silenciar logs en tests
  console.log = jest.fn();
  console.info = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
  
  // Iniciar MSW server
  server.listen({
    onUnhandledRequest: 'warn',
  });
});

afterEach(() => {
  // Limpiar mocks después de cada test
  jest.clearAllMocks();
  
  // Limpiar localStorage y sessionStorage
  localStorageMock.clear();
  sessionStorageMock.clear();
  
  // Reset MSW handlers
  server.resetHandlers();
  
  // Limpiar timers
  jest.clearAllTimers();
});

afterAll(() => {
  // Restaurar console original
  Object.assign(console, originalConsole);
  
  // Cerrar MSW server
  server.close();
  
  // Restaurar todos los mocks
  jest.restoreAllMocks();
});

// Configuración de timeouts para tests async
jest.setTimeout(10000);

// Mock de performance.now para tests de performance
Object.defineProperty(global, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByName: jest.fn(() => []),
    getEntriesByType: jest.fn(() => []),
  },
});

// Mock de requestAnimationFrame
global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 0));
global.cancelAnimationFrame = jest.fn(id => clearTimeout(id));

// Mock de scrollTo
global.scrollTo = jest.fn();

// Configuración de viewport por defecto
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
});

Object.defineProperty(window, 'innerHeight', {
  writable: true,
  configurable: true,
  value: 768,
});

// Mock de getComputedStyle
global.getComputedStyle = jest.fn(() => ({
  getPropertyValue: jest.fn(),
  backgroundColor: 'rgb(234, 90, 23)', // blaze-orange-600
  color: 'rgb(255, 255, 255)',
  padding: '0.5rem',
  margin: '0',
  display: 'flex',
  position: 'fixed',
  zIndex: '9999',
}));

// Utilidades de testing personalizadas
global.testUtils = {
  // Simular cambio de viewport
  setViewport: (width: number, height: number = 768) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: height,
    });
    window.dispatchEvent(new Event('resize'));
  },
  
  // Simular geolocalización exitosa
  mockGeolocationSuccess: (lat: number = -31.4201, lng: number = -64.1888) => {
    mockGeolocation.getCurrentPosition.mockImplementationOnce((success) => {
      success({
        coords: {
          latitude: lat,
          longitude: lng,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      });
    });
  },
  
  // Simular error de geolocalización
  mockGeolocationError: (code: number = 1, message: string = 'Permission denied') => {
    mockGeolocation.getCurrentPosition.mockImplementationOnce((success, error) => {
      error({
        code,
        message,
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      });
    });
  },
  
  // Limpiar todos los mocks
  clearAllMocks: () => {
    jest.clearAllMocks();
    localStorageMock.clear();
    sessionStorageMock.clear();
  },
};

// Exportar utilidades para uso en tests
export { mockRouter, localStorageMock, sessionStorageMock, mockGeolocation, mockPermissions };
