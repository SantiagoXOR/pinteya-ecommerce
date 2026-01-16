/**
 * Setup de Supabase para tests
 * Mock del cliente de Supabase para tests unitarios
 */

export interface MockSupabaseClient {
  from: jest.Mock
  rpc: jest.Mock
  auth: {
    getUser: jest.Mock
    getSession: jest.Mock
  }
}

// Crear mock del cliente de Supabase
export function createMockSupabaseClient(): MockSupabaseClient {
  const mockFrom = jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
  }))

  const mockRpc = jest.fn().mockResolvedValue({ data: null, error: null })

  const mockAuth = {
    getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
  }

  return {
    from: mockFrom,
    rpc: mockRpc,
    auth: mockAuth,
  }
}

// Helper para crear respuesta exitosa de Supabase
export function createSupabaseSuccessResponse<T>(data: T) {
  return {
    data,
    error: null,
    status: 200,
    statusText: 'OK',
  }
}

// Helper para crear respuesta de error de Supabase
export function createSupabaseErrorResponse(message: string, code?: string) {
  return {
    data: null,
    error: {
      message,
      code: code || 'UNKNOWN_ERROR',
      details: null,
      hint: null,
    },
    status: 400,
    statusText: 'Bad Request',
  }
}

// Mock de eventos de analytics para tests
export const mockAnalyticsEvents = [
  {
    id: '1',
    event_type: 1,
    category_id: 1,
    action_id: 1,
    label: '/',
    value: null,
    user_id: null,
    session_hash: 1234567890,
    page_id: 1,
    created_at: Math.floor(Date.now() / 1000) - 3600,
    analytics_event_types: { name: 'page_view' },
    analytics_categories: { name: 'navigation' },
    analytics_actions: { name: 'view' },
  },
  {
    id: '2',
    event_type: 5,
    category_id: 2,
    action_id: 7,
    label: 'product-123',
    value: 1000,
    user_id: null,
    session_hash: 1234567890,
    page_id: 2,
    created_at: Math.floor(Date.now() / 1000) - 1800,
    analytics_event_types: { name: 'add_to_cart' },
    analytics_categories: { name: 'ecommerce' },
    analytics_actions: { name: 'add' },
  },
  {
    id: '3',
    event_type: 8,
    category_id: 2,
    action_id: 9,
    label: 'order-456',
    value: 5000,
    user_id: 'user-123',
    session_hash: 1234567890,
    page_id: 3,
    created_at: Math.floor(Date.now() / 1000) - 600,
    analytics_event_types: { name: 'purchase' },
    analytics_categories: { name: 'ecommerce' },
    analytics_actions: { name: 'purchase' },
  },
]
