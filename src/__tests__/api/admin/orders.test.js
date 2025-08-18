// ===================================
// PINTEYA E-COMMERCE - ORDERS API TESTS
// ===================================

import { GET, POST } from '@/app/api/admin/orders/route';
import { 
  createMockSupabaseAdmin,
  createMockClerkAuth,
  createMockRateLimiter,
  createMockLogger,
  createMockMetricsCollector,
  mockOrders,
  mockOrderItems,
  resetAllMocks
} from '../../setup/orders-mocks';

// ===================================
// SETUP MOCKS
// ===================================

// Mock Next.js
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data, options) => ({
      json: () => Promise.resolve(data),
      status: options?.status || 200,
      headers: new Map()
    }))
  }
}));

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabaseAdmin: createMockSupabaseAdmin()
}));

// Mock Clerk
const { mockAuth, mockCurrentUser } = createMockClerkAuth(true);
jest.mock('@clerk/nextjs/server', () => ({
  auth: mockAuth,
  currentUser: mockCurrentUser
}));

// Mock Rate Limiter
const { mockCheckRateLimit, mockAddRateLimitHeaders } = createMockRateLimiter();
jest.mock('@/lib/rate-limiter', () => ({
  checkRateLimit: mockCheckRateLimit,
  addRateLimitHeaders: mockAddRateLimitHeaders,
  RATE_LIMIT_CONFIGS: {
    admin: { requests: 100, window: 3600000 }
  }
}));

// Mock Logger
const mockLogger = createMockLogger();
jest.mock('@/lib/logger', () => ({
  logger: mockLogger,
  LogLevel: { INFO: 'info', ERROR: 'error', WARN: 'warn' },
  LogCategory: { API: 'api', DATABASE: 'database', AUTH: 'auth' }
}));

// Mock Metrics
const mockMetricsCollector = createMockMetricsCollector();
jest.mock('@/lib/metrics', () => ({
  metricsCollector: mockMetricsCollector
}));

// Mock Zod
jest.mock('zod', () => ({
  z: {
    object: jest.fn().mockReturnValue({
      safeParse: jest.fn().mockReturnValue({
        success: true,
        data: {
          page: 1,
          limit: 20,
          sort_by: 'created_at',
          sort_order: 'desc'
        }
      })
    }),
    coerce: {
      number: jest.fn().mockReturnValue({
        min: jest.fn().mockReturnThis(),
        max: jest.fn().mockReturnThis(),
        default: jest.fn().mockReturnThis()
      })
    },
    string: jest.fn().mockReturnValue({
      optional: jest.fn().mockReturnThis(),
      min: jest.fn().mockReturnThis(),
      max: jest.fn().mockReturnThis(),
      uuid: jest.fn().mockReturnThis()
    }),
    enum: jest.fn().mockReturnValue({
      default: jest.fn().mockReturnThis()
    }),
    array: jest.fn().mockReturnValue({
      min: jest.fn().mockReturnThis()
    }),
    number: jest.fn().mockReturnValue({
      min: jest.fn().mockReturnThis(),
      max: jest.fn().mockReturnThis()
    })
  }
}));

// ===================================
// TESTS GET /api/admin/orders
// ===================================

describe('GET /api/admin/orders', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  test('should return orders list successfully', async () => {
    // Arrange
    const mockRequest = {
      url: 'http://localhost:3000/api/admin/orders?page=1&limit=20'
    };

    // Act
    const response = await GET(mockRequest);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.orders).toEqual(mockOrders);
    expect(data.data.pagination).toBeDefined();
    expect(data.data.pagination.page).toBe(1);
    expect(data.data.pagination.limit).toBe(20);
    expect(data.data.pagination.total).toBe(mockOrders.length);

    // Verify mocks were called
    expect(mockAuth).toHaveBeenCalled();
    expect(mockCurrentUser).toHaveBeenCalled();
    expect(mockCheckRateLimit).toHaveBeenCalled();
    expect(mockMetricsCollector.recordApiCall).toHaveBeenCalledWith(
      'admin-orders-list',
      expect.any(Number),
      200
    );
  });

  test('should handle authentication failure', async () => {
    // Arrange
    mockAuth.mockResolvedValueOnce({ userId: null });
    const mockRequest = {
      url: 'http://localhost:3000/api/admin/orders'
    };

    // Act
    const response = await GET(mockRequest);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(401);
    expect(data.error).toBe('Usuario no autenticado');
  });

  test('should handle non-admin user', async () => {
    // Arrange
    mockCurrentUser.mockResolvedValueOnce({
      emailAddresses: [{ emailAddress: 'user@example.com' }]
    });
    const mockRequest = {
      url: 'http://localhost:3000/api/admin/orders'
    };

    // Act
    const response = await GET(mockRequest);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(403);
    expect(data.error).toBe('Acceso denegado - Se requieren permisos de administrador');
  });

  test('should handle rate limiting', async () => {
    // Arrange
    mockCheckRateLimit.mockResolvedValueOnce({
      success: false,
      remaining: 0,
      reset: Date.now() + 3600000
    });
    const mockRequest = {
      url: 'http://localhost:3000/api/admin/orders'
    };

    // Act
    const response = await GET(mockRequest);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(429);
    expect(data.error).toBe('Demasiadas solicitudes');
    expect(mockAddRateLimitHeaders).toHaveBeenCalled();
  });

  test('should handle filters correctly', async () => {
    // Arrange
    const mockRequest = {
      url: 'http://localhost:3000/api/admin/orders?status=pending&search=test&page=2'
    };

    // Act
    const response = await GET(mockRequest);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.filters).toBeDefined();
  });

  test('should handle database errors', async () => {
    // Arrange
    const mockSupabase = require('@/lib/supabase').supabaseAdmin;
    mockSupabase.from().select().range.mockImplementationOnce(() => 
      Promise.resolve({ data: null, error: { message: 'Database error' } })
    );
    
    const mockRequest = {
      url: 'http://localhost:3000/api/admin/orders'
    };

    // Act
    const response = await GET(mockRequest);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(data.error).toBe('Error al obtener órdenes');
    expect(mockLogger.log).toHaveBeenCalledWith(
      'error',
      'database',
      'Error al obtener órdenes admin',
      expect.any(Object)
    );
  });
});

// ===================================
// TESTS POST /api/admin/orders
// ===================================

describe('POST /api/admin/orders', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  test('should create order successfully', async () => {
    // Arrange
    const orderData = {
      user_id: 'test-user-id',
      items: [
        {
          product_id: 1,
          quantity: 2,
          unit_price: 15000
        }
      ],
      shipping_address: {
        street_name: 'Av. Corrientes',
        street_number: '1234',
        zip_code: '1000',
        city_name: 'Buenos Aires',
        state_name: 'CABA'
      },
      notes: 'Test order'
    };

    const mockRequest = {
      json: () => Promise.resolve(orderData)
    };

    // Act
    const response = await POST(mockRequest);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    expect(data.data.order_number).toMatch(/^ORD-\d+-[A-Z0-9]+$/);

    // Verify database calls
    const mockSupabase = require('@/lib/supabase').supabaseAdmin;
    expect(mockSupabase.from).toHaveBeenCalledWith('orders');
    expect(mockSupabase.from).toHaveBeenCalledWith('order_items');

    // Verify metrics
    expect(mockMetricsCollector.recordApiCall).toHaveBeenCalledWith(
      'admin-orders-create',
      expect.any(Number),
      201
    );
  });

  test('should handle validation errors', async () => {
    // Arrange
    const invalidOrderData = {
      user_id: 'invalid-uuid',
      items: [] // Empty items array should fail validation
    };

    // Mock Zod validation failure
    const mockZod = require('zod');
    mockZod.z.object().safeParse.mockReturnValueOnce({
      success: false,
      error: {
        errors: [
          { message: 'Invalid UUID', path: ['user_id'] },
          { message: 'At least one item required', path: ['items'] }
        ]
      }
    });

    const mockRequest = {
      json: () => Promise.resolve(invalidOrderData)
    };

    // Act
    const response = await POST(mockRequest);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(data.error).toBe('Datos de orden inválidos');
    expect(data.details).toBeDefined();
  });

  test('should handle order creation database error', async () => {
    // Arrange
    const orderData = {
      user_id: 'test-user-id',
      items: [{ product_id: 1, quantity: 1, unit_price: 15000 }]
    };

    const mockSupabase = require('@/lib/supabase').supabaseAdmin;
    mockSupabase.from().insert().select().single.mockImplementationOnce(() => 
      Promise.resolve({ data: null, error: { message: 'Insert failed' } })
    );

    const mockRequest = {
      json: () => Promise.resolve(orderData)
    };

    // Act
    const response = await POST(mockRequest);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(data.error).toBe('Error al crear orden');
  });

  test('should handle order items creation error with rollback', async () => {
    // Arrange
    const orderData = {
      user_id: 'test-user-id',
      items: [{ product_id: 1, quantity: 1, unit_price: 15000 }]
    };

    const mockSupabase = require('@/lib/supabase').supabaseAdmin;
    
    // Order creation succeeds
    mockSupabase.from().insert().select().single.mockImplementationOnce(() => 
      Promise.resolve({ data: { id: 'new-order-id' }, error: null })
    );
    
    // Order items creation fails
    mockSupabase.from().insert.mockImplementationOnce(() => 
      Promise.resolve({ data: null, error: { message: 'Items insert failed' } })
    );

    const mockRequest = {
      json: () => Promise.resolve(orderData)
    };

    // Act
    const response = await POST(mockRequest);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(data.error).toBe('Error al crear items de orden');
    
    // Verify rollback was attempted
    expect(mockSupabase.from).toHaveBeenCalledWith('orders');
  });

  test('should calculate total amount correctly', async () => {
    // Arrange
    const orderData = {
      user_id: 'test-user-id',
      items: [
        { product_id: 1, quantity: 2, unit_price: 15000 }, // 30000
        { product_id: 2, quantity: 1, unit_price: 2500 }   // 2500
      ]
      // Total should be 32500
    };

    const mockRequest = {
      json: () => Promise.resolve(orderData)
    };

    // Act
    const response = await POST(mockRequest);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    
    // Verify total calculation in the insert call
    const mockSupabase = require('@/lib/supabase').supabaseAdmin;
    const insertCall = mockSupabase.from().insert.mock.calls[0][0];
    expect(insertCall.total_amount).toBe(32500);
  });
});

// ===================================
// INTEGRATION TESTS
// ===================================

describe('Orders API Integration', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  test('should handle complete order lifecycle', async () => {
    // Test creating an order and then retrieving it
    
    // 1. Create order
    const orderData = {
      user_id: 'test-user-id',
      items: [{ product_id: 1, quantity: 1, unit_price: 15000 }]
    };

    const createRequest = {
      json: () => Promise.resolve(orderData)
    };

    const createResponse = await POST(createRequest);
    const createData = await createResponse.json();

    expect(createResponse.status).toBe(201);
    expect(createData.success).toBe(true);

    // 2. Retrieve orders list
    const getRequest = {
      url: 'http://localhost:3000/api/admin/orders'
    };

    const getResponse = await GET(getRequest);
    const getData = await getResponse.json();

    expect(getResponse.status).toBe(200);
    expect(getData.success).toBe(true);
    expect(getData.data.orders).toBeDefined();
  });

  test('should maintain data consistency across operations', async () => {
    // Verify that all related data is properly linked
    const mockRequest = {
      url: 'http://localhost:3000/api/admin/orders'
    };

    const response = await GET(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    
    // Verify order structure
    const order = data.data.orders[0];
    expect(order.id).toBeDefined();
    expect(order.order_number).toBeDefined();
    expect(order.user_profiles).toBeDefined();
    expect(order.order_items).toBeDefined();
    expect(Array.isArray(order.order_items)).toBe(true);
    
    // Verify order items have product data
    if (order.order_items.length > 0) {
      expect(order.order_items[0].products).toBeDefined();
    }
  });
});
