// ===================================
// MOCKS CENTRALIZADOS PARA APIs - PINTEYA E-COMMERCE
// ===================================

/**
 * Mocks centralizados y reutilizables para todas las APIs del proyecto
 * Incluye respuestas realistas y manejo completo de casos edge
 */

// ===================================
// TIPOS Y INTERFACES
// ===================================

export interface MockResponseOptions {
  ok?: boolean;
  status?: number;
  statusText?: string;
  delay?: number;
}

export interface MockApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ===================================
// DATOS MOCK REALISTAS
// ===================================

export const mockProducts = [
  {
    id: 1,
    name: 'Pintura Látex Interior Blanco 4L',
    slug: 'pintura-latex-interior-blanco-4l',
    description: 'Pintura látex de alta calidad para interiores, acabado mate',
    price: 2500,
    discounted_price: 2200,
    stock: 15,
    brand: 'Sherwin Williams',
    category_id: 1,
    images: { 
      previews: ['/images/products/pintura-latex-blanco.jpg'],
      main: '/images/products/pintura-latex-blanco-main.jpg'
    },
    category: { 
      id: 1, 
      name: 'Pinturas', 
      slug: 'pinturas' 
    },
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-20T15:30:00Z'
  },
  {
    id: 2,
    name: 'Taladro Percutor 650W',
    slug: 'taladro-percutor-650w',
    description: 'Taladro percutor profesional con mandril de 13mm',
    price: 8500,
    discounted_price: null,
    stock: 8,
    brand: 'Bosch',
    category_id: 2,
    images: { 
      previews: ['/images/products/taladro-bosch.jpg'],
      main: '/images/products/taladro-bosch-main.jpg'
    },
    category: { 
      id: 2, 
      name: 'Herramientas', 
      slug: 'herramientas' 
    },
    created_at: '2024-01-10T08:00:00Z',
    updated_at: '2024-01-18T12:00:00Z'
  },
  {
    id: 3,
    name: 'Cemento Portland 50kg',
    slug: 'cemento-portland-50kg',
    description: 'Cemento Portland tipo I para construcción general',
    price: 1200,
    discounted_price: 1100,
    stock: 25,
    brand: 'Loma Negra',
    category_id: 3,
    images: { 
      previews: ['/images/products/cemento-portland.jpg'],
      main: '/images/products/cemento-portland-main.jpg'
    },
    category: { 
      id: 3, 
      name: 'Materiales', 
      slug: 'materiales' 
    },
    created_at: '2024-01-05T09:00:00Z',
    updated_at: '2024-01-22T11:00:00Z'
  }
];

export const mockCategories = [
  { id: 1, name: 'Pinturas', slug: 'pinturas', description: 'Pinturas para interior y exterior' },
  { id: 2, name: 'Herramientas', slug: 'herramientas', description: 'Herramientas manuales y eléctricas' },
  { id: 3, name: 'Materiales', slug: 'materiales', description: 'Materiales de construcción' },
  { id: 4, name: 'Ferretería', slug: 'ferreteria', description: 'Artículos de ferretería general' }
];

export const mockOrders = [
  {
    id: 1,
    user_id: 'user_123',
    status: 'pending',
    total: 5800,
    items: [
      { product_id: 1, quantity: 2, price: 2200 },
      { product_id: 3, quantity: 1, price: 1100 }
    ],
    created_at: '2024-01-25T14:30:00Z',
    updated_at: '2024-01-25T14:30:00Z'
  },
  {
    id: 2,
    user_id: 'user_456',
    status: 'confirmed',
    total: 8500,
    items: [
      { product_id: 2, quantity: 1, price: 8500 }
    ],
    created_at: '2024-01-24T10:15:00Z',
    updated_at: '2024-01-24T16:20:00Z'
  }
];

// ===================================
// HELPER PARA CREAR RESPUESTAS MOCK COMPLETAS
// ===================================

/**
 * Crea una respuesta mock completa compatible con fetch API
 */
export function createMockResponse(
  data: any, 
  options: MockResponseOptions = {}
): Response {
  const {
    ok = true,
    status = 200,
    statusText = 'OK',
    delay = 0
  } = options;

  const response = {
    ok,
    status,
    statusText,
    headers: new Headers({
      'Content-Type': 'application/json',
      'X-Mock-Response': 'true'
    }),
    url: 'http://localhost:3000/api/mock',
    json: async () => {
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      return data;
    },
    text: async () => {
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      return JSON.stringify(data);
    },
    clone: jest.fn(() => response),
    arrayBuffer: async () => new ArrayBuffer(0),
    blob: async () => new Blob(),
    formData: async () => new FormData(),
    body: null,
    bodyUsed: false,
    redirected: false,
    type: 'basic' as ResponseType
  } as Response;

  return response;
}

// ===================================
// RESPUESTAS MOCK PREDEFINIDAS
// ===================================

export const mockApiResponses = {
  // Productos
  products: {
    success: {
      success: true,
      data: mockProducts,
      pagination: {
        page: 1,
        limit: 12,
        total: mockProducts.length,
        totalPages: 1
      }
    },
    empty: {
      success: true,
      data: [],
      pagination: {
        page: 1,
        limit: 12,
        total: 0,
        totalPages: 0
      }
    },
    error: {
      success: false,
      data: [],
      error: 'Error obteniendo productos',
      pagination: {
        page: 1,
        limit: 12,
        total: 0,
        totalPages: 0
      }
    }
  },

  // Categorías
  categories: {
    success: {
      success: true,
      data: mockCategories
    },
    error: {
      success: false,
      data: [],
      error: 'Error obteniendo categorías'
    }
  },

  // Órdenes
  orders: {
    success: {
      success: true,
      data: mockOrders,
      pagination: {
        page: 1,
        limit: 10,
        total: mockOrders.length,
        totalPages: 1
      }
    },
    error: {
      success: false,
      data: [],
      error: 'Error obteniendo órdenes',
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
      }
    }
  }
};

// ===================================
// CONFIGURACIONES MOCK COMUNES
// ===================================

export const mockConfigurations = {
  // Respuesta exitosa estándar
  success: () => createMockResponse(mockApiResponses.products.success),
  
  // Error de red
  networkError: () => {
    throw new Error('Network Error');
  },
  
  // Error HTTP 500
  serverError: () => createMockResponse(
    { error: 'Internal Server Error' },
    { ok: false, status: 500, statusText: 'Internal Server Error' }
  ),
  
  // Error HTTP 404
  notFound: () => createMockResponse(
    { error: 'Not Found' },
    { ok: false, status: 404, statusText: 'Not Found' }
  ),
  
  // Error HTTP 400
  badRequest: () => createMockResponse(
    { error: 'Bad Request' },
    { ok: false, status: 400, statusText: 'Bad Request' }
  ),
  
  // Respuesta con delay (para testing de loading states)
  delayed: (data: any = mockApiResponses.products.success, delayMs: number = 1000) => 
    createMockResponse(data, { delay: delayMs })
};

// ===================================
// SETUP HELPER PARA TESTS
// ===================================

/**
 * Configura mocks básicos para fetch en tests
 */
export function setupApiMocks() {
  const mockFetch = jest.fn();
  global.fetch = mockFetch;
  
  // Configuración por defecto: respuesta exitosa
  mockFetch.mockResolvedValue(mockConfigurations.success());
  
  return {
    mockFetch,
    resetMocks: () => {
      jest.clearAllMocks();
      mockFetch.mockResolvedValue(mockConfigurations.success());
    },
    mockSuccess: (data?: any) => {
      mockFetch.mockResolvedValueOnce(createMockResponse(data || mockApiResponses.products.success));
    },
    mockError: (error: string = 'API Error') => {
      mockFetch.mockRejectedValueOnce(new Error(error));
    },
    mockHttpError: (status: number = 500, statusText: string = 'Internal Server Error') => {
      mockFetch.mockResolvedValueOnce(createMockResponse(
        { error: statusText },
        { ok: false, status, statusText }
      ));
    }
  };
}
