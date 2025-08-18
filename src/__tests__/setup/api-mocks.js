// 🧪 Enterprise API Mocks for Testing

// Mock Next.js API Route handlers
export const createMockApiHandler = (implementation) => {
  return jest.fn().mockImplementation(async (request, context) => {
    try {
      return await implementation(request, context);
    } catch (error) {
      return {
        status: 500,
        json: () => Promise.resolve({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
        }),
      };
    }
  });
};

// Mock Supabase client for API tests
export const createMockSupabaseClient = () => ({
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
        limit: jest.fn().mockResolvedValue({ data: [], error: null }),
        order: jest.fn(() => ({
          order: jest.fn().mockResolvedValue({ data: [], error: null }),
        })),
      })),
    })),
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      })),
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        })),
        neq: jest.fn().mockResolvedValue({ error: null }),
      })),
    })),
    delete: jest.fn(() => ({
      eq: jest.fn().mockResolvedValue({ error: null }),
    })),
  })),
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
      getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://test.com/image.jpg' } }),
      remove: jest.fn().mockResolvedValue({ error: null }),
    })),
  },
});

// Mock request with common properties
export const createMockRequest = (overrides = {}) => ({
  url: 'http://localhost:3000/api/test',
  method: 'GET',
  headers: new Map(),
  json: jest.fn().mockResolvedValue({}),
  formData: jest.fn().mockResolvedValue(new FormData()),
  text: jest.fn().mockResolvedValue(''),
  supabase: createMockSupabaseClient(),
  user: { id: 'test-user-id', email: 'test@example.com' },
  validatedData: {},
  ...overrides,
});

// Mock response helpers
export const createMockResponse = (data, status = 200) => ({
  status,
  ok: status >= 200 && status < 300,
  json: () => Promise.resolve(data),
  text: () => Promise.resolve(JSON.stringify(data)),
});

// Mock file for upload tests
export const createMockFile = (name = 'test.jpg', type = 'image/jpeg', size = 1024) => {
  const file = new File(['test content'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

// Mock FormData for file uploads
export const createMockFormData = (files = {}, fields = {}) => {
  const formData = new FormData();
  
  Object.entries(files).forEach(([key, file]) => {
    formData.append(key, file);
  });
  
  Object.entries(fields).forEach(([key, value]) => {
    formData.append(key, value);
  });
  
  return formData;
};

// Mock auth result
export const createMockAuthResult = (success = true, user = null) => ({
  success,
  user: user || { id: 'test-user-id', email: 'test@example.com' },
  supabase: createMockSupabaseClient(),
  status: success ? 200 : 401,
  error: success ? null : 'Unauthorized',
});

// Helper to setup API test environment
export const setupApiTestEnvironment = () => {
  // Mock auth functions
  jest.doMock('@/lib/auth/admin-auth', () => ({
    checkCRUDPermissions: jest.fn().mockResolvedValue(createMockAuthResult()),
  }));

  // Mock API logger
  jest.doMock('@/lib/api/api-logger', () => ({
    withApiLogging: jest.fn((handler) => handler),
    logAdminAction: jest.fn(),
  }));

  // Mock error handler
  jest.doMock('@/lib/api/error-handler', () => ({
    withErrorHandler: jest.fn((handler) => handler),
    ApiError: class ApiError extends Error {
      constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
      }
    },
    NotFoundError: jest.fn((resource) => new Error(`${resource} no encontrado`)),
    ValidationError: jest.fn((message) => new Error(message)),
  }));

  // Mock middleware composer
  jest.doMock('@/lib/api/middleware-composer', () => ({
    composeMiddlewares: jest.fn((...middlewares) => (handler) => handler),
  }));

  // Mock auth middleware
  jest.doMock('@/lib/auth/api-auth-middleware', () => ({
    withAdminAuth: jest.fn(() => (handler) => handler),
  }));

  // Mock validation middleware
  jest.doMock('@/lib/validation/admin-schemas', () => ({
    withValidation: jest.fn(() => (handler) => handler),
  }));
};

// Cleanup function
export const cleanupApiTestEnvironment = () => {
  jest.clearAllMocks();
  jest.resetModules();
};
