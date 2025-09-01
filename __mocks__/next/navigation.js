/**
 * Mock para next/navigation
 * Resuelve problemas con useSearchParams, useRouter, usePathname
 */

// Mock para useRouter
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockPrefetch = jest.fn();
const mockBack = jest.fn();
const mockForward = jest.fn();
const mockRefresh = jest.fn();

const mockRouter = {
  push: mockPush,
  replace: mockReplace,
  prefetch: mockPrefetch,
  back: mockBack,
  forward: mockForward,
  refresh: mockRefresh,
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

const useRouter = jest.fn(() => mockRouter);

// Mock para useSearchParams - más robusto
const mockSearchParams = {
  get: jest.fn((key) => null),
  set: jest.fn(),
  delete: jest.fn(),
  has: jest.fn(() => false),
  toString: jest.fn(() => ''),
  entries: jest.fn(() => []),
  keys: jest.fn(() => []),
  values: jest.fn(() => []),
  forEach: jest.fn(),
  append: jest.fn(),
  clear: jest.fn(),
};

const useSearchParams = jest.fn(() => mockSearchParams);

// Mock para usePathname
const usePathname = jest.fn(() => '/');

// Mock para useParams
const useParams = jest.fn(() => ({}));

// Mock para redirect
const redirect = jest.fn();

// Mock para notFound
const notFound = jest.fn();

// Exportar todos los mocks
module.exports = {
  useRouter,
  useSearchParams,
  usePathname,
  useParams,
  redirect,
  notFound,
  
  // Helpers para tests
  __setMockRouter: (newRouter) => {
    Object.assign(mockRouter, newRouter);
  },

  __setMockSearchParams: (params) => {
    // Reset all mock functions
    Object.keys(mockSearchParams).forEach(key => {
      if (typeof mockSearchParams[key] === 'function') {
        mockSearchParams[key].mockReset();
      }
    });

    // Set up new behavior
    mockSearchParams.get.mockImplementation((key) => params[key] || null);
    mockSearchParams.has.mockImplementation((key) => key in params);
    mockSearchParams.toString.mockReturnValue(
      Object.entries(params).map(([k, v]) => `${k}=${v}`).join('&')
    );
  },

  __setMockPathname: (pathname) => {
    usePathname.mockReturnValue(pathname);
  },

  __resetMocks: () => {
    mockPush.mockReset();
    mockReplace.mockReset();
    mockPrefetch.mockReset();
    mockBack.mockReset();
    mockForward.mockReset();
    mockRefresh.mockReset();

    // Reset search params
    Object.keys(mockSearchParams).forEach(key => {
      if (typeof mockSearchParams[key] === 'function') {
        mockSearchParams[key].mockReset();
      }
    });
    mockSearchParams.get.mockReturnValue(null);
    mockSearchParams.has.mockReturnValue(false);
    mockSearchParams.toString.mockReturnValue('');

    usePathname.mockReturnValue('/');
    useParams.mockReturnValue({});
  }
};

// Para compatibilidad con ES modules
module.exports.__esModule = true;
module.exports.default = module.exports;
