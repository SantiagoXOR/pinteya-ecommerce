// ===================================
// MOCKS CENTRALIZADOS PARA COMPONENTES - PINTEYA E-COMMERCE
// ===================================

/**
 * Mocks especializados para componentes React del proyecto
 * Incluye props realistas y comportamientos mock
 */

import React from 'react';

// ===================================
// MOCKS PARA COMPONENTES UI
// ===================================

// Mock para componentes de shadcn/ui
export const mockShadcnComponents = {
  Button: jest.fn(({ children, onClick, ...props }) => 
    React.createElement('button', { onClick, ...props }, children)
  ),
  Input: jest.fn((props) => 
    React.createElement('input', props)
  ),
  Select: jest.fn(({ children, ...props }) => 
    React.createElement('select', props, children)
  ),
  Dialog: jest.fn(({ children, ...props }) => 
    React.createElement('div', { 'data-testid': 'dialog', ...props }, children)
  ),
  Card: jest.fn(({ children, ...props }) => 
    React.createElement('div', { 'data-testid': 'card', ...props }, children)
  ),
  Badge: jest.fn(({ children, ...props }) => 
    React.createElement('span', { 'data-testid': 'badge', ...props }, children)
  )
};

// Mock para Swiper
export const mockSwiperComponents = {
  Swiper: jest.fn(({ children, ...props }) => 
    React.createElement('div', { 'data-testid': 'swiper', ...props }, children)
  ),
  SwiperSlide: jest.fn(({ children, ...props }) => 
    React.createElement('div', { 'data-testid': 'swiper-slide', ...props }, children)
  )
};

// Mock para Next.js components
export const mockNextComponents = {
  Image: jest.fn((props) => 
    React.createElement('img', { 
      'data-testid': 'next-image',
      src: props.src,
      alt: props.alt,
      width: props.width,
      height: props.height
    })
  ),
  Link: jest.fn(({ children, href, ...props }) => 
    React.createElement('a', { href, ...props }, children)
  )
};

// ===================================
// MOCKS PARA COMPONENTES ESPECÍFICOS DEL PROYECTO
// ===================================

// Mock para ProductCard
export const mockProductCardProps = {
  default: {
    product: {
      id: 1,
      name: 'Pintura Látex Interior Blanco 4L',
      slug: 'pintura-latex-interior-blanco-4l',
      price: 2500,
      discounted_price: 2200,
      images: { 
        previews: ['/images/products/pintura-latex-blanco.jpg'],
        main: '/images/products/pintura-latex-blanco-main.jpg'
      },
      brand: 'Sherwin Williams',
      stock: 15,
      category: { name: 'Pinturas' }
    },
    onAddToCart: jest.fn(),
    onQuickView: jest.fn(),
    className: ''
  },
  
  outOfStock: {
    product: {
      id: 2,
      name: 'Producto Agotado',
      slug: 'producto-agotado',
      price: 1000,
      discounted_price: null,
      images: { 
        previews: ['/images/products/placeholder.jpg'],
        main: '/images/products/placeholder-main.jpg'
      },
      brand: 'Test Brand',
      stock: 0,
      category: { name: 'Test Category' }
    },
    onAddToCart: jest.fn(),
    onQuickView: jest.fn(),
    className: ''
  }
};

// Mock para SearchBar
export const mockSearchBarProps = {
  default: {
    value: '',
    onChange: jest.fn(),
    onSubmit: jest.fn(),
    placeholder: 'Buscar productos...',
    loading: false,
    suggestions: [],
    onSuggestionClick: jest.fn(),
    className: ''
  },
  
  withSuggestions: {
    value: 'pintura',
    onChange: jest.fn(),
    onSubmit: jest.fn(),
    placeholder: 'Buscar productos...',
    loading: false,
    suggestions: [
      { id: 1, text: 'Pintura látex', type: 'product' },
      { id: 2, text: 'Pintura esmalte', type: 'product' },
      { id: 3, text: 'Pinturas', type: 'category' }
    ],
    onSuggestionClick: jest.fn(),
    className: ''
  },
  
  loading: {
    value: 'búsqueda',
    onChange: jest.fn(),
    onSubmit: jest.fn(),
    placeholder: 'Buscar productos...',
    loading: true,
    suggestions: [],
    onSuggestionClick: jest.fn(),
    className: ''
  }
};

// Mock para CategoryFilter
export const mockCategoryFilterProps = {
  default: {
    categories: [
      { id: 1, name: 'Pinturas', slug: 'pinturas', count: 25 },
      { id: 2, name: 'Herramientas', slug: 'herramientas', count: 18 },
      { id: 3, name: 'Materiales', slug: 'materiales', count: 32 }
    ],
    selectedCategories: [],
    onCategoryChange: jest.fn(),
    loading: false,
    className: ''
  },
  
  withSelection: {
    categories: [
      { id: 1, name: 'Pinturas', slug: 'pinturas', count: 25 },
      { id: 2, name: 'Herramientas', slug: 'herramientas', count: 18 },
      { id: 3, name: 'Materiales', slug: 'materiales', count: 32 }
    ],
    selectedCategories: [1, 3],
    onCategoryChange: jest.fn(),
    loading: false,
    className: ''
  }
};

// ===================================
// MOCKS PARA EVENTOS Y HANDLERS
// ===================================

export const mockEventHandlers = {
  // Event handlers comunes
  onClick: jest.fn(),
  onChange: jest.fn(),
  onSubmit: jest.fn(),
  onFocus: jest.fn(),
  onBlur: jest.fn(),
  onKeyDown: jest.fn(),
  onMouseEnter: jest.fn(),
  onMouseLeave: jest.fn(),
  
  // Event handlers específicos del e-commerce
  onAddToCart: jest.fn(),
  onRemoveFromCart: jest.fn(),
  onUpdateQuantity: jest.fn(),
  onQuickView: jest.fn(),
  onWishlistAdd: jest.fn(),
  onCategorySelect: jest.fn(),
  onFilterChange: jest.fn(),
  onSortChange: jest.fn(),
  onPageChange: jest.fn(),
  
  // Reset function
  resetAll: () => {
    Object.values(mockEventHandlers).forEach(handler => {
      if (typeof handler === 'function' && handler.mockReset) {
        handler.mockReset();
      }
    });
  }
};

// ===================================
// MOCKS PARA CONTEXTOS
// ===================================

export const mockContextValues = {
  // Cart Context
  cartContext: {
    items: [],
    itemCount: 0,
    total: 0,
    addItem: jest.fn(),
    removeItem: jest.fn(),
    updateQuantity: jest.fn(),
    clearCart: jest.fn(),
    isInCart: jest.fn(() => false),
    getItemQuantity: jest.fn(() => 0)
  },
  
  // Theme Context
  themeContext: {
    theme: 'light',
    setTheme: jest.fn(),
    toggleTheme: jest.fn()
  },
  
  // Search Context
  searchContext: {
    query: '',
    setQuery: jest.fn(),
    results: [],
    loading: false,
    error: null,
    search: jest.fn(),
    clearResults: jest.fn()
  }
};

// ===================================
// HELPERS PARA TESTING
// ===================================

/**
 * Crea props mock para cualquier componente
 */
export function createMockProps<T extends Record<string, any>>(
  baseProps: T,
  overrides: Partial<T> = {}
): T {
  return {
    ...baseProps,
    ...overrides
  };
}

/**
 * Crea un mock de evento React
 */
export function createMockEvent(
  type: string = 'click',
  target: Partial<EventTarget> = {},
  eventProps: Record<string, any> = {}
) {
  return {
    type,
    target: {
      value: '',
      checked: false,
      ...target
    },
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
    currentTarget: target,
    ...eventProps
  };
}

/**
 * Setup para mocks de componentes en tests
 */
export function setupComponentMocks() {
  // Mock React Router
  const mockNavigate = jest.fn();
  const mockUseNavigate = jest.fn(() => mockNavigate);
  const mockUseLocation = jest.fn(() => ({
    pathname: '/',
    search: '',
    hash: '',
    state: null
  }));
  
  // Mock Next.js Router
  const mockPush = jest.fn();
  const mockReplace = jest.fn();
  const mockBack = jest.fn();
  const mockUseRouter = jest.fn(() => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
    pathname: '/',
    query: {},
    asPath: '/'
  }));

  return {
    // React Router mocks
    mockNavigate,
    mockUseNavigate,
    mockUseLocation,
    
    // Next.js Router mocks
    mockPush,
    mockReplace,
    mockBack,
    mockUseRouter,
    
    // Reset function
    resetAllComponentMocks: () => {
      jest.clearAllMocks();
      mockEventHandlers.resetAll();
    }
  };
}

// ===================================
// MOCKS PARA LIBRERÍAS EXTERNAS
// ===================================

export const mockExternalLibraries = {
  // React Hook Form
  useForm: jest.fn(() => ({
    register: jest.fn(),
    handleSubmit: jest.fn((fn) => fn),
    formState: { errors: {}, isSubmitting: false, isValid: true },
    setValue: jest.fn(),
    getValues: jest.fn(),
    reset: jest.fn(),
    watch: jest.fn()
  })),
  
  // React Query
  useQuery: jest.fn(() => ({
    data: null,
    isLoading: false,
    isError: false,
    error: null,
    refetch: jest.fn()
  })),
  
  // Framer Motion
  motion: {
    div: jest.fn(({ children, ...props }) => 
      React.createElement('div', props, children)
    ),
    span: jest.fn(({ children, ...props }) => 
      React.createElement('span', props, children)
    )
  }
};
