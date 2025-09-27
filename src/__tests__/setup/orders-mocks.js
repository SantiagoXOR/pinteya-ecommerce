// ===================================
// PINTEYA E-COMMERCE - ORDERS ENTERPRISE MOCKS
// ===================================
// Mocks centralizados para testing de órdenes siguiendo patrones Fase 1

// ===================================
// MOCK DATA ORDERS
// ===================================

export const mockUser = {
  id: 'test-user-id',
  clerk_id: 'test-clerk-id',
  email: 'test@example.com',
  name: 'Test User',
  phone: '+54911234567',
  role: 'customer',
}

export const mockAdminUser = {
  id: 'admin-user-id',
  clerk_id: 'admin-clerk-id',
  email: 'santiago@xor.com.ar',
  name: 'Admin User',
  phone: '+54911234567',
  role: 'admin',
}

export const mockProducts = [
  {
    id: 1,
    name: 'Pintura Latex Interior Blanco 20L',
    images: ['https://example.com/image1.jpg'],
    sku: 'PAINT-001',
    category: 'Pinturas',
    price: 15000,
    stock: 50,
  },
  {
    id: 2,
    name: 'Rodillo Antigota 23cm',
    images: ['https://example.com/image2.jpg'],
    sku: 'TOOL-001',
    category: 'Herramientas',
    price: 2500,
    stock: 25,
  },
]

export const mockOrderItems = [
  {
    id: 'item-1',
    order_id: 'order-1',
    product_id: 1,
    quantity: 2,
    unit_price: 15000,
    total_price: 30000,
    products: mockProducts[0],
  },
  {
    id: 'item-2',
    order_id: 'order-1',
    product_id: 2,
    quantity: 1,
    unit_price: 2500,
    total_price: 2500,
    products: mockProducts[1],
  },
]

export const mockShippingAddress = {
  street_name: 'Av. Corrientes',
  street_number: '1234',
  zip_code: '1000',
  city_name: 'Buenos Aires',
  state_name: 'CABA',
}

export const mockOrders = [
  {
    id: 'order-1',
    order_number: 'ORD-1234567890-ABC123',
    user_id: 'test-user-id',
    status: 'pending',
    payment_status: 'pending',
    fulfillment_status: 'unfulfilled',
    total_amount: 32500,
    currency: 'ARS',
    shipping_address: JSON.stringify(mockShippingAddress),
    notes: 'Entrega en horario de oficina',
    admin_notes: null,
    tracking_number: null,
    carrier: null,
    estimated_delivery: null,
    metadata: {},
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z',
    user_profiles: mockUser,
    order_items: mockOrderItems,
  },
  {
    id: 'order-2',
    order_number: 'ORD-1234567891-DEF456',
    user_id: 'test-user-id',
    status: 'shipped',
    payment_status: 'paid',
    fulfillment_status: 'fulfilled',
    total_amount: 15000,
    currency: 'ARS',
    shipping_address: JSON.stringify(mockShippingAddress),
    notes: null,
    admin_notes: 'Envío urgente',
    tracking_number: 'TRACK123456',
    carrier: 'oca',
    estimated_delivery: '2024-01-05T18:00:00Z',
    metadata: {},
    created_at: '2024-01-02T10:00:00Z',
    updated_at: '2024-01-03T15:30:00Z',
    user_profiles: mockUser,
    order_items: [mockOrderItems[0]],
  },
]

export const mockStatusHistory = [
  {
    id: 'history-1',
    order_id: 'order-1',
    previous_status: null,
    new_status: 'pending',
    changed_by: 'system',
    reason: 'Orden creada',
    metadata: { trigger: 'automatic' },
    created_at: '2024-01-01T10:00:00Z',
    user_profiles: null,
  },
  {
    id: 'history-2',
    order_id: 'order-1',
    previous_status: 'pending',
    new_status: 'confirmed',
    changed_by: 'admin-user-id',
    reason: 'Pago confirmado',
    metadata: { trigger: 'manual' },
    created_at: '2024-01-01T11:00:00Z',
    user_profiles: mockAdminUser,
  },
]

export const mockOrderNotes = [
  {
    id: 'note-1',
    order_id: 'order-1',
    admin_id: 'admin-user-id',
    note_type: 'internal',
    content: 'Cliente solicitó entrega urgente',
    is_visible_to_customer: false,
    metadata: {},
    created_at: '2024-01-01T12:00:00Z',
    updated_at: '2024-01-01T12:00:00Z',
    user_profiles: mockAdminUser,
  },
]

// ===================================
// MOCK SUPABASE ADMIN PARA ORDERS
// ===================================

export const createMockSupabaseAdmin = () => {
  const mockSupabaseAdmin = {
    from: jest.fn().mockImplementation(table => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
      }

      // Configurar respuestas específicas por tabla
      if (table === 'orders') {
        mockQuery.select.mockImplementation(columns => {
          if (columns && columns.includes('count')) {
            return {
              ...mockQuery,
              single: () => Promise.resolve({ data: null, error: null, count: mockOrders.length }),
            }
          }
          return {
            ...mockQuery,
            single: () => Promise.resolve({ data: mockOrders[0], error: null }),
            range: () =>
              Promise.resolve({
                data: mockOrders,
                error: null,
                count: mockOrders.length,
              }),
          }
        })

        mockQuery.insert.mockImplementation(() => ({
          ...mockQuery,
          select: () => ({
            ...mockQuery,
            single: () =>
              Promise.resolve({
                data: { ...mockOrders[0], id: 'new-order-id' },
                error: null,
              }),
          }),
        }))

        mockQuery.update.mockImplementation(() => ({
          ...mockQuery,
          select: () => ({
            ...mockQuery,
            single: () =>
              Promise.resolve({
                data: { ...mockOrders[0], status: 'confirmed' },
                error: null,
              }),
          }),
        }))
      }

      if (table === 'order_items') {
        mockQuery.insert.mockImplementation(() =>
          Promise.resolve({ data: mockOrderItems, error: null })
        )
      }

      if (table === 'order_status_history') {
        mockQuery.select.mockImplementation(() => ({
          ...mockQuery,
          eq: () => ({
            ...mockQuery,
            order: () => Promise.resolve({ data: mockStatusHistory, error: null }),
          }),
        }))

        mockQuery.insert.mockImplementation(() =>
          Promise.resolve({ data: mockStatusHistory[0], error: null })
        )
      }

      if (table === 'order_notes') {
        mockQuery.select.mockImplementation(() => ({
          ...mockQuery,
          eq: () => ({
            ...mockQuery,
            order: () => Promise.resolve({ data: mockOrderNotes, error: null }),
          }),
        }))

        mockQuery.insert.mockImplementation(() =>
          Promise.resolve({ data: mockOrderNotes[0], error: null })
        )
      }

      if (table === 'user_profiles') {
        mockQuery.select.mockImplementation(() => ({
          ...mockQuery,
          eq: () => ({
            ...mockQuery,
            single: () => Promise.resolve({ data: mockUser, error: null }),
          }),
        }))
      }

      if (table === 'products') {
        mockQuery.select.mockImplementation(() => ({
          ...mockQuery,
          in: () => Promise.resolve({ data: mockProducts, error: null }),
        }))
      }

      return mockQuery
    }),

    // RPC functions
    rpc: jest.fn().mockImplementation((functionName, params) => {
      if (functionName === 'get_daily_order_trends') {
        return Promise.resolve({
          data: [
            { date: '2024-01-01', total_orders: 5, total_revenue: 75000, avg_order_value: 15000 },
            { date: '2024-01-02', total_orders: 3, total_revenue: 45000, avg_order_value: 15000 },
          ],
          error: null,
        })
      }
      return Promise.resolve({ data: null, error: null })
    }),
  }

  return mockSupabaseAdmin
}

// ===================================
// MOCK CLERK AUTH PARA ORDERS
// ===================================

export const createMockClerkAuth = (isAdmin = false) => {
  const mockAuth = jest.fn().mockResolvedValue({
    userId: isAdmin ? 'admin-clerk-id' : 'test-clerk-id',
  })

  const mockCurrentUser = jest.fn().mockResolvedValue({
    id: isAdmin ? 'admin-clerk-id' : 'test-clerk-id',
    emailAddresses: [
      {
        emailAddress: isAdmin ? 'santiago@xor.com.ar' : 'test@example.com',
      },
    ],
    firstName: isAdmin ? 'Admin' : 'Test',
    lastName: 'User',
  })

  return { mockAuth, mockCurrentUser }
}

// ===================================
// MOCK RATE LIMITER PARA ORDERS
// ===================================

export const createMockRateLimiter = () => {
  const mockCheckRateLimit = jest.fn().mockResolvedValue({
    success: true,
    remaining: 100,
    reset: Date.now() + 3600000,
  })

  const mockAddRateLimitHeaders = jest.fn()

  return { mockCheckRateLimit, mockAddRateLimitHeaders }
}

// ===================================
// MOCK LOGGER PARA ORDERS
// ===================================

export const createMockLogger = () => {
  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  }

  return mockLogger
}

// ===================================
// MOCK METRICS COLLECTOR PARA ORDERS
// ===================================

export const createMockMetricsCollector = () => {
  const mockMetricsCollector = {
    recordApiCall: jest.fn(),
    recordError: jest.fn(),
    recordPerformance: jest.fn(),
  }

  return mockMetricsCollector
}

// ===================================
// MOCK FETCH PARA ORDERS
// ===================================

export const createMockFetch = () => {
  const mockFetch = jest.fn().mockImplementation((url, options) => {
    const method = options?.method || 'GET'

    // Mock responses para diferentes endpoints
    if (url.includes('/api/admin/orders') && method === 'GET') {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            data: {
              orders: mockOrders,
              pagination: {
                page: 1,
                limit: 20,
                total: mockOrders.length,
                totalPages: 1,
                hasNextPage: false,
                hasPreviousPage: false,
              },
              filters: {},
            },
            success: true,
            error: null,
          }),
      })
    }

    if (url.includes('/api/admin/orders') && method === 'POST') {
      return Promise.resolve({
        ok: true,
        status: 201,
        json: () =>
          Promise.resolve({
            data: { ...mockOrders[0], id: 'new-order-id' },
            success: true,
            error: null,
          }),
      })
    }

    if (url.includes('/api/admin/orders/') && url.includes('/status') && method === 'POST') {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            data: {
              order: { ...mockOrders[0], status: 'confirmed' },
              previousStatus: 'pending',
              newStatus: 'confirmed',
              statusDescription: 'Confirmada',
            },
            success: true,
            error: null,
          }),
      })
    }

    // Default response
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: null, success: true, error: null }),
    })
  })

  return mockFetch
}

// ===================================
// HELPER FUNCTIONS
// ===================================

export const resetAllMocks = () => {
  jest.clearAllMocks()
}

export const createOrderTestData = (overrides = {}) => {
  return {
    ...mockOrders[0],
    ...overrides,
  }
}

export const createOrderItemTestData = (overrides = {}) => {
  return {
    ...mockOrderItems[0],
    ...overrides,
  }
}

export const createStatusHistoryTestData = (overrides = {}) => {
  return {
    ...mockStatusHistory[0],
    ...overrides,
  }
}
