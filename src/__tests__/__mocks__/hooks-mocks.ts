// ===================================
// MOCKS CENTRALIZADOS PARA HOOKS - PINTEYA E-COMMERCE
// ===================================

/**
 * Mocks especializados para hooks del proyecto
 * Incluye estados realistas y funciones mock completas
 */

import { mockProducts, mockCategories, mockOrders } from './api-mocks';

// ===================================
// MOCKS PARA useProducts
// ===================================

export const mockUseProductsState = {
  // Estado inicial
  initial: {
    products: [],
    loading: true,
    error: null,
    pagination: {
      page: 1,
      limit: 12,
      total: 0,
      totalPages: 0
    },
    filters: {},
    hasProducts: false,
    isEmpty: false,
    hasError: false,
    hasNextPage: false,
    hasPrevPage: false
  },

  // Estado con productos cargados
  loaded: {
    products: mockProducts,
    loading: false,
    error: null,
    pagination: {
      page: 1,
      limit: 12,
      total: mockProducts.length,
      totalPages: 1
    },
    filters: {},
    hasProducts: true,
    isEmpty: false,
    hasError: false,
    hasNextPage: false,
    hasPrevPage: false
  },

  // Estado con error
  error: {
    products: [],
    loading: false,
    error: 'Error obteniendo productos',
    pagination: {
      page: 1,
      limit: 12,
      total: 0,
      totalPages: 0
    },
    filters: {},
    hasProducts: false,
    isEmpty: true,
    hasError: true,
    hasNextPage: false,
    hasPrevPage: false
  },

  // Estado cargando
  loading: {
    products: [],
    loading: true,
    error: null,
    pagination: {
      page: 1,
      limit: 12,
      total: 0,
      totalPages: 0
    },
    filters: {},
    hasProducts: false,
    isEmpty: false,
    hasError: false,
    hasNextPage: false,
    hasPrevPage: false
  }
};

export const mockUseProductsFunctions = {
  fetchProducts: jest.fn(),
  updateFilters: jest.fn(),
  changePage: jest.fn(),
  changeLimit: jest.fn(),
  changeSorting: jest.fn(),
  searchProducts: jest.fn(),
  filterByCategory: jest.fn(),
  filterByPriceRange: jest.fn(),
  clearFilters: jest.fn(),
  refresh: jest.fn()
};

export function createMockUseProducts(state = mockUseProductsState.loaded) {
  return {
    ...state,
    ...mockUseProductsFunctions
  };
}

// ===================================
// MOCKS PARA useSearchErrorHandler
// ===================================

export const mockUseSearchErrorHandlerState = {
  // Estado inicial
  initial: {
    currentError: null,
    retryCount: 0,
    isRetrying: false,
    hasError: false,
    retryConfig: {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffFactor: 2
    }
  },

  // Estado con error
  withError: {
    currentError: {
      type: 'network' as const,
      message: 'Error de conexión. Verifica tu conexión a internet.',
      retryable: true,
      timestamp: Date.now()
    },
    retryCount: 0,
    isRetrying: false,
    hasError: true,
    retryConfig: {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffFactor: 2
    }
  },

  // Estado reintentando
  retrying: {
    currentError: {
      type: 'server' as const,
      message: 'Error del servidor. Intenta nuevamente en unos momentos.',
      retryable: true,
      timestamp: Date.now()
    },
    retryCount: 1,
    isRetrying: true,
    hasError: true,
    retryConfig: {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffFactor: 2
    }
  }
};

export const mockUseSearchErrorHandlerFunctions = {
  handleError: jest.fn(),
  executeWithRetry: jest.fn(),
  clearError: jest.fn(),
  retryManually: jest.fn()
};

export function createMockUseSearchErrorHandler(state = mockUseSearchErrorHandlerState.initial) {
  return {
    ...state,
    ...mockUseSearchErrorHandlerFunctions
  };
}

// ===================================
// MOCKS PARA useCart
// ===================================

export const mockCartItems = [
  {
    id: 1,
    product: mockProducts[0],
    quantity: 2,
    price: mockProducts[0].discounted_price || mockProducts[0].price,
    subtotal: (mockProducts[0].discounted_price || mockProducts[0].price) * 2
  },
  {
    id: 2,
    product: mockProducts[1],
    quantity: 1,
    price: mockProducts[1].price,
    subtotal: mockProducts[1].price
  }
];

export const mockUseCartState = {
  // Carrito vacío
  empty: {
    items: [],
    itemCount: 0,
    total: 0,
    subtotal: 0,
    tax: 0,
    shipping: 0,
    isEmpty: true,
    isLoading: false
  },

  // Carrito con items
  withItems: {
    items: mockCartItems,
    itemCount: mockCartItems.reduce((sum, item) => sum + item.quantity, 0),
    total: mockCartItems.reduce((sum, item) => sum + item.subtotal, 0),
    subtotal: mockCartItems.reduce((sum, item) => sum + item.subtotal, 0),
    tax: 0,
    shipping: 0,
    isEmpty: false,
    isLoading: false
  }
};

export const mockUseCartFunctions = {
  addItem: jest.fn(),
  removeItem: jest.fn(),
  updateQuantity: jest.fn(),
  clearCart: jest.fn(),
  getItemQuantity: jest.fn(),
  isInCart: jest.fn()
};

export function createMockUseCart(state = mockUseCartState.empty) {
  return {
    ...state,
    ...mockUseCartFunctions
  };
}

// ===================================
// MOCKS PARA useAuth (NextAuth)
// ===================================

export const mockUser = {
  id: 'user_123',
  name: 'Juan Pérez',
  email: 'juan.perez@example.com',
  image: '/images/avatars/user-123.jpg',
  role: 'customer'
};

export const mockSession = {
  user: mockUser,
  expires: '2024-12-31T23:59:59.999Z'
};

export const mockUseSessionState = {
  // No autenticado
  unauthenticated: {
    data: null,
    status: 'unauthenticated' as const
  },

  // Autenticado
  authenticated: {
    data: mockSession,
    status: 'authenticated' as const
  },

  // Cargando
  loading: {
    data: null,
    status: 'loading' as const
  }
};

export function createMockUseSession(state = mockUseSessionState.unauthenticated) {
  return state;
}

// ===================================
// MOCKS PARA useGeolocation
// ===================================

export const mockGeolocationState = {
  // Estado inicial
  initial: {
    location: null,
    loading: false,
    error: null,
    supported: true
  },

  // Ubicación obtenida
  located: {
    location: {
      latitude: -34.6037,
      longitude: -58.3816,
      accuracy: 10,
      timestamp: Date.now()
    },
    loading: false,
    error: null,
    supported: true
  },

  // Error de geolocalización
  error: {
    location: null,
    loading: false,
    error: 'Geolocation permission denied',
    supported: true
  },

  // No soportado
  unsupported: {
    location: null,
    loading: false,
    error: 'Geolocation not supported',
    supported: false
  }
};

export const mockUseGeolocationFunctions = {
  getCurrentLocation: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn()
};

export function createMockUseGeolocation(state = mockGeolocationState.initial) {
  return {
    ...state,
    ...mockUseGeolocationFunctions
  };
}

// ===================================
// SETUP HELPER PARA HOOKS
// ===================================

/**
 * Configura mocks para múltiples hooks en tests
 */
export function setupHooksMocks() {
  // Mock useProducts
  const mockUseProducts = jest.fn(() => createMockUseProducts());
  
  // Mock useSearchErrorHandler
  const mockUseSearchErrorHandler = jest.fn(() => createMockUseSearchErrorHandler());
  
  // Mock useCart
  const mockUseCart = jest.fn(() => createMockUseCart());
  
  // Mock useSession
  const mockUseSession = jest.fn(() => createMockUseSession());
  
  // Mock useGeolocation
  const mockUseGeolocation = jest.fn(() => createMockUseGeolocation());

  return {
    mockUseProducts,
    mockUseSearchErrorHandler,
    mockUseCart,
    mockUseSession,
    mockUseGeolocation,
    resetAllMocks: () => {
      jest.clearAllMocks();
      mockUseProducts.mockReturnValue(createMockUseProducts());
      mockUseSearchErrorHandler.mockReturnValue(createMockUseSearchErrorHandler());
      mockUseCart.mockReturnValue(createMockUseCart());
      mockUseSession.mockReturnValue(createMockUseSession());
      mockUseGeolocation.mockReturnValue(createMockUseGeolocation());
    }
  };
}









