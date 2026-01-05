// ===================================
// PINTEYA E-COMMERCE - API MOCK HANDLERS
// ===================================
// Handlers para mockear llamadas de red en tests
// 
// NOTA: Para usar MSW (Mock Service Worker), instalar:
// npm install --save-dev msw
// 
// Por ahora, estos handlers se usan con jest.mock() en jest.setup.js

// Tipos para compatibilidad con MSW (cuando se instale)
export type HttpHandler = any
export type HttpResponse = any

// ===================================
// TIPOS E INTERFACES
// ===================================

export interface MockProduct {
  id: number
  name: string
  slug: string
  description: string
  price: number
  discounted_price: number | null
  stock: number
  category_id: number
  brand: string
  images: string[]
  created_at: string
  category?: {
    id: number
    name: string
    slug: string
  }
}

export interface MockCartItem {
  id: number
  product_id: number
  quantity: number
  price: number
  discounted_price: number | null
}

export interface MockOrder {
  id: number
  user_id: string
  total: number
  status: string
  created_at: string
}

// ===================================
// DATOS MOCK
// ===================================

export const mockProducts: MockProduct[] = [
  {
    id: 1,
    name: 'Pintura Latex Interior Blanco 4L',
    slug: 'pintura-latex-interior-blanco-4l',
    description: 'Pintura látex de alta calidad para interiores',
    price: 18000,
    discounted_price: 15000,
    stock: 10,
    category_id: 1,
    brand: 'El Galgo',
    images: ['/images/products/pintura-latex-blanco.jpg'],
    created_at: '2024-01-01T00:00:00Z',
    category: {
      id: 1,
      name: 'Pinturas',
      slug: 'pinturas',
    },
  },
  {
    id: 2,
    name: 'Esmalte Sintético Azul 1L',
    slug: 'esmalte-sintetico-azul-1l',
    description: 'Esmalte sintético de alta durabilidad',
    price: 8000,
    discounted_price: 7000,
    stock: 5,
    category_id: 2,
    brand: 'Plavicon',
    images: ['/images/products/esmalte-azul.jpg'],
    created_at: '2024-01-01T00:00:00Z',
    category: {
      id: 2,
      name: 'Esmaltes',
      slug: 'esmaltes',
    },
  },
]

export const mockCartItems: MockCartItem[] = [
  {
    id: 1,
    product_id: 1,
    quantity: 2,
    price: 18000,
    discounted_price: 15000,
  },
]

export const mockOrders: MockOrder[] = [
  {
    id: 1,
    user_id: 'test-user-id',
    total: 30000,
    status: 'pending',
    created_at: '2024-01-01T00:00:00Z',
  },
]

// ===================================
// SUPABASE API MOCK FUNCTIONS
// ===================================
// Funciones helper para mockear respuestas de Supabase

export const mockSupabaseResponses = {
  // GET /api/products
  getProducts: () => ({
    success: true,
    data: mockProducts,
    count: mockProducts.length,
  }),

  // GET /api/products/:id
  getProductById: (id: number) => {
    const product = mockProducts.find(p => p.id === id)
    if (!product) {
      return {
        success: false,
        error: 'Product not found',
        status: 404,
      }
    }
    return {
      success: true,
      data: product,
    }
  },

  // GET /api/products?slug=:slug
  getProductBySlug: (slug: string) => {
    const product = mockProducts.find(p => p.slug === slug)
    if (!product) {
      return {
        success: false,
        error: 'Product not found',
        status: 404,
      }
    }
    return {
      success: true,
      data: product,
    }
  },

  // GET /api/cart
  getCart: () => ({
    success: true,
    data: mockCartItems,
    totalItems: mockCartItems.length,
    totalAmount: mockCartItems.reduce(
      (sum, item) => sum + (item.discounted_price || item.price) * item.quantity,
      0
    ),
  }),

  // POST /api/cart
  addToCart: (productId: number, quantity: number) => {
    const newItem: MockCartItem = {
      id: mockCartItems.length + 1,
      product_id: productId,
      quantity,
      price: mockProducts.find(p => p.id === productId)?.price || 0,
      discounted_price: mockProducts.find(p => p.id === productId)?.discounted_price || null,
    }
    mockCartItems.push(newItem)
    return {
      success: true,
      data: newItem,
    }
  },

  // PUT /api/cart/:productId
  updateCartItem: (productId: number, quantity: number) => {
    const item = mockCartItems.find(item => item.product_id === productId)
    if (!item) {
      return {
        success: false,
        error: 'Cart item not found',
        status: 404,
      }
    }
    item.quantity = quantity
    return {
      success: true,
      data: item,
    }
  },

  // DELETE /api/cart/:productId
  removeFromCart: (productId: number) => {
    const index = mockCartItems.findIndex(item => item.product_id === productId)
    if (index === -1) {
      return {
        success: false,
        error: 'Cart item not found',
        status: 404,
      }
    }
    mockCartItems.splice(index, 1)
    return {
      success: true,
      message: 'Item removed from cart',
    }
  },

  // GET /api/orders
  getOrders: () => ({
    success: true,
    data: mockOrders,
    count: mockOrders.length,
  }),

  // POST /api/orders
  createOrder: (orderData: Partial<MockOrder>) => {
    const newOrder: MockOrder = {
      id: mockOrders.length + 1,
      user_id: orderData.user_id || 'test-user-id',
      total: orderData.total || 0,
      status: 'pending',
      created_at: new Date().toISOString(),
    }
    mockOrders.push(newOrder)
    return {
      success: true,
      data: newOrder,
    }
  },

  // GET /api/categories
  getCategories: () => {
    const categories = mockProducts
      .map(p => p.category)
      .filter((c, i, arr) => c && arr.findIndex(cat => cat?.id === c.id) === i)
    
    return {
      success: true,
      data: categories,
      count: categories.length,
    }
  },
}

// ===================================
// MERCADOPAGO API MOCK FUNCTIONS
// ===================================

export const mockMercadoPagoResponses = {
  // POST /api/mercadopago/preferences
  createPreference: (body?: any) => ({
    id: 'mock-preference-id-12345',
    init_point: 'https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=mock-preference-id-12345',
    sandbox_init_point: 'https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=mock-preference-id-12345',
    ...body,
  }),

  // GET /api/mercadopago/payment/:id
  getPayment: (id: string) => ({
    id,
    status: 'approved',
    status_detail: 'accredited',
    transaction_amount: 100,
    currency_id: 'ARS',
    date_created: new Date().toISOString(),
    date_approved: new Date().toISOString(),
  }),

  // POST /api/mercadopago/webhook
  processWebhook: (body?: any) => ({
    success: true,
    message: 'Webhook processed',
    data: body,
  }),
}

// ===================================
// GOOGLE MAPS API MOCK FUNCTIONS
// ===================================

export const mockGoogleMapsResponses = {
  // POST /api/address/validate
  validateAddress: (address?: string) => ({
    success: true,
    data: {
      formatted_address: address || 'Calle Falsa 123, Córdoba, Argentina',
      geometry: {
        location: {
          lat: -31.4201,
          lng: -64.1888,
        },
      },
      address_components: [
        {
          long_name: '123',
          short_name: '123',
          types: ['street_number'],
        },
        {
          long_name: 'Calle Falsa',
          short_name: 'Calle Falsa',
          types: ['route'],
        },
        {
          long_name: 'Córdoba',
          short_name: 'Córdoba',
          types: ['locality', 'political'],
        },
      ],
    },
  }),

  // POST /api/address/geocode
  geocodeAddress: (address?: string) => ({
    success: true,
    data: {
      lat: -31.4201,
      lng: -64.1888,
      address: address || 'Calle Falsa 123, Córdoba, Argentina',
    },
  }),
}

// ===================================
// NEXTAUTH API MOCK FUNCTIONS
// ===================================

export const mockNextAuthResponses = {
  // GET /api/auth/session
  getSession: () => ({
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      image: 'https://example.com/avatar.jpg',
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  }),

  // POST /api/auth/signin
  signIn: (email: string, password: string) => {
    // Mock validation
    if (email === 'test@example.com' && password === 'password') {
      return {
        ok: true,
        status: 200,
        url: '/',
      }
    }
    return {
      ok: false,
      status: 401,
      error: 'Invalid credentials',
    }
  },

  // POST /api/auth/signout
  signOut: () => ({
    ok: true,
    status: 200,
    url: '/',
  }),
}

// ===================================
// EXPORT ALL MOCK RESPONSES
// ===================================

export const mockApiResponses = {
  supabase: mockSupabaseResponses,
  mercadopago: mockMercadoPagoResponses,
  googleMaps: mockGoogleMapsResponses,
  nextAuth: mockNextAuthResponses,
}

