// 🧪 Enterprise Integration Tests - Admin Products API

import { createMocks } from 'node-mocks-http';
import { NextRequest } from 'next/server';

// Import the actual API handlers
import { GET as getProduct, PUT as updateProduct, DELETE as deleteProduct } from '@/app/api/admin/products/[id]/route';
import { GET as getImages, POST as uploadImage } from '@/app/api/admin/products/[id]/images/route';
import { POST as validateSlug } from '@/app/api/admin/products/validate-slug/route';

// Mock Supabase client
const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(),
        limit: jest.fn(),
        order: jest.fn(() => ({
          order: jest.fn(),
        })),
      })),
    })),
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(),
      })),
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
        neq: jest.fn(),
      })),
    })),
    delete: jest.fn(() => ({
      eq: jest.fn(),
    })),
  })),
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn(),
      getPublicUrl: jest.fn(),
      remove: jest.fn(),
    })),
  },
};

// Mock auth
const mockAuthResult = {
  success: true,
  user: { id: 'test-user-id', email: 'test@example.com' },
  supabase: mockSupabaseClient,
};

jest.mock('@/lib/auth/admin-auth', () => ({
  checkCRUDPermissions: jest.fn().mockResolvedValue(mockAuthResult),
}));

// Mock middleware to pass through
jest.mock('@/lib/api/middleware-composer', () => ({
  composeMiddlewares: jest.fn((...middlewares) => (handler) => handler),
}));

jest.mock('@/lib/api/error-handler', () => ({
  withErrorHandler: jest.fn((handler) => handler),
  ApiError: class ApiError extends Error {
    constructor(message: string, public statusCode: number = 500) {
      super(message);
    }
  },
  NotFoundError: jest.fn((resource) => new Error(`${resource} no encontrado`)),
  ValidationError: jest.fn((message) => new Error(message)),
}));

jest.mock('@/lib/api/api-logger', () => ({
  withApiLogging: jest.fn((handler) => handler),
  logAdminAction: jest.fn(),
}));

jest.mock('@/lib/auth/api-auth-middleware', () => ({
  withAdminAuth: jest.fn(() => (handler) => handler),
}));

jest.mock('@/lib/validation/admin-schemas', () => ({
  withValidation: jest.fn(() => (handler) => handler),
}));

describe('Admin Products API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Product CRUD Operations', () => {
    const mockProduct = {
      id: 'test-product-id',
      name: 'Test Product',
      description: 'Test Description',
      price: 100,
      stock: 10,
      category_id: 'test-category-id',
      slug: 'test-product',
      status: 'active',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      categories: { id: 'test-category-id', name: 'Test Category' },
    };

    describe('GET Product', () => {
      it('should retrieve product successfully', async () => {
        mockSupabaseClient.from().select().eq().single.mockResolvedValue({
          data: mockProduct,
          error: null,
        });

        const mockRequest = {
          supabase: mockSupabaseClient,
          user: { id: 'test-user-id' },
        } as any;

        const response = await getProduct(mockRequest, { params: { id: 'test-product-id' } });
        const responseData = await response.json();

        expect(response.status).toBe(200);
        expect(responseData.success).toBe(true);
        expect(responseData.data.name).toBe('Test Product');
        expect(responseData.data.category_name).toBe('Test Category');
        expect(responseData.data.categories).toBeUndefined();
      });

      it('should handle product not found', async () => {
        mockSupabaseClient.from().select().eq().single.mockResolvedValue({
          data: null,
          error: { message: 'Not found' },
        });

        const mockRequest = {
          supabase: mockSupabaseClient,
          user: { id: 'test-user-id' },
        } as any;

        await expect(
          getProduct(mockRequest, { params: { id: 'non-existent-id' } })
        ).rejects.toThrow('Producto no encontrado');
      });
    });

    describe('PUT Product', () => {
      it('should update product successfully', async () => {
        const updateData = {
          name: 'Updated Product',
          price: 150,
          stock: 20,
        };

        // Mock existing product check
        mockSupabaseClient.from().select().eq().single
          .mockResolvedValueOnce({
            data: mockProduct,
            error: null,
          });

        // Mock update operation
        mockSupabaseClient.from().update().eq().select().single.mockResolvedValue({
          data: { ...mockProduct, ...updateData, slug: 'updated-product' },
          error: null,
        });

        const mockRequest = {
          supabase: mockSupabaseClient,
          user: { id: 'test-user-id' },
          validatedData: updateData,
        } as any;

        const response = await updateProduct(mockRequest, { params: { id: 'test-product-id' } });
        const responseData = await response.json();

        expect(response.status).toBe(200);
        expect(responseData.success).toBe(true);
        expect(responseData.data.name).toBe('Updated Product');
        expect(responseData.message).toBe('Producto actualizado exitosamente');
      });

      it('should validate category when updating category_id', async () => {
        const updateData = {
          category_id: 'new-category-id',
        };

        // Mock existing product check
        mockSupabaseClient.from().select().eq().single
          .mockResolvedValueOnce({
            data: mockProduct,
            error: null,
          })
          .mockResolvedValueOnce({
            data: { id: 'new-category-id' },
            error: null,
          });

        mockSupabaseClient.from().update().eq().select().single.mockResolvedValue({
          data: { ...mockProduct, category_id: 'new-category-id' },
          error: null,
        });

        const mockRequest = {
          supabase: mockSupabaseClient,
          user: { id: 'test-user-id' },
          validatedData: updateData,
        } as any;

        const response = await updateProduct(mockRequest, { params: { id: 'test-product-id' } });
        const responseData = await response.json();

        expect(response.status).toBe(200);
        expect(responseData.success).toBe(true);
      });
    });

    describe('DELETE Product', () => {
      it('should perform soft delete when product has orders', async () => {
        // Mock existing product check
        mockSupabaseClient.from().select().eq().single.mockResolvedValue({
          data: mockProduct,
          error: null,
        });

        // Mock order items check - has orders
        mockSupabaseClient.from().select().eq().limit.mockResolvedValue({
          data: [{ id: 'order-item-id' }],
          error: null,
        });

        // Mock soft delete update
        mockSupabaseClient.from().update().eq.mockResolvedValue({
          error: null,
        });

        const mockRequest = {
          supabase: mockSupabaseClient,
          user: { id: 'test-user-id' },
        } as any;

        const response = await deleteProduct(mockRequest, { params: { id: 'test-product-id' } });
        const responseData = await response.json();

        expect(response.status).toBe(200);
        expect(responseData.success).toBe(true);
        expect(responseData.soft_delete).toBe(true);
        expect(responseData.message).toContain('marcado como inactivo');
      });

      it('should perform hard delete when product has no orders', async () => {
        // Mock existing product check
        mockSupabaseClient.from().select().eq().single.mockResolvedValue({
          data: mockProduct,
          error: null,
        });

        // Mock order items check - no orders
        mockSupabaseClient.from().select().eq().limit.mockResolvedValue({
          data: [],
          error: null,
        });

        // Mock hard delete
        mockSupabaseClient.from().delete().eq.mockResolvedValue({
          error: null,
        });

        const mockRequest = {
          supabase: mockSupabaseClient,
          user: { id: 'test-user-id' },
        } as any;

        const response = await deleteProduct(mockRequest, { params: { id: 'test-product-id' } });
        const responseData = await response.json();

        expect(response.status).toBe(200);
        expect(responseData.success).toBe(true);
        expect(responseData.hard_delete).toBe(true);
        expect(responseData.message).toBe('Producto eliminado exitosamente');
      });
    });
  });

  describe('Product Images Operations', () => {
    const mockImages = [
      {
        id: 'image-1',
        product_id: 'test-product-id',
        url: 'https://example.com/image1.jpg',
        alt_text: 'Image 1',
        is_primary: true,
        display_order: 0,
      },
      {
        id: 'image-2',
        product_id: 'test-product-id',
        url: 'https://example.com/image2.jpg',
        alt_text: 'Image 2',
        is_primary: false,
        display_order: 1,
      },
    ];

    describe('GET Images', () => {
      it('should retrieve product images successfully', async () => {
        mockSupabaseClient.from().select().eq().order().order.mockResolvedValue({
          data: mockImages,
          error: null,
        });

        const mockRequest = {
          supabase: mockSupabaseClient,
          user: { id: 'test-user-id' },
        } as any;

        const response = await getImages(mockRequest, { params: { id: 'test-product-id' } });
        const responseData = await response.json();

        expect(response.status).toBe(200);
        expect(responseData.success).toBe(true);
        expect(responseData.data).toHaveLength(2);
        expect(responseData.data[0].is_primary).toBe(true);
      });
    });

    describe('POST Image Upload', () => {
      it('should upload image successfully', async () => {
        // Mock product exists check
        mockSupabaseClient.from().select().eq().single.mockResolvedValue({
          data: { id: 'test-product-id', name: 'Test Product' },
          error: null,
        });

        // Mock storage upload
        mockSupabaseClient.storage.from().upload.mockResolvedValue({
          data: { path: 'products/test-product-id/123_test.jpg' },
          error: null,
        });

        mockSupabaseClient.storage.from().getPublicUrl.mockReturnValue({
          data: { publicUrl: 'https://storage.example.com/test.jpg' },
        });

        // Mock database insert
        const mockImageRecord = {
          id: 'new-image-id',
          product_id: 'test-product-id',
          url: 'https://storage.example.com/test.jpg',
          alt_text: 'Test image',
          is_primary: true,
        };

        mockSupabaseClient.from().insert().select().single.mockResolvedValue({
          data: mockImageRecord,
          error: null,
        });

        // Mock update other images
        mockSupabaseClient.from().update().eq().neq.mockResolvedValue({
          error: null,
        });

        // Create mock file and form data
        const mockFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
        const mockFormData = new FormData();
        mockFormData.append('file', mockFile);
        mockFormData.append('alt_text', 'Test image');
        mockFormData.append('is_primary', 'true');

        const mockRequest = {
          supabase: mockSupabaseClient,
          user: { id: 'test-user-id' },
          formData: jest.fn().mockResolvedValue(mockFormData),
        } as any;

        const response = await uploadImage(mockRequest, { params: { id: 'test-product-id' } });
        const responseData = await response.json();

        expect(response.status).toBe(201);
        expect(responseData.success).toBe(true);
        expect(responseData.data.url).toBe('https://storage.example.com/test.jpg');
        expect(responseData.message).toBe('Imagen subida exitosamente');
      });
    });
  });

  describe('Slug Validation', () => {
    it('should validate slug availability', async () => {
      // Mock slug check - available
      mockSupabaseClient.from().select().eq().limit.mockResolvedValue({
        data: [],
        error: null,
      });

      const mockRequest = {
        supabase: mockSupabaseClient,
        user: { id: 'test-user-id' },
        validatedData: { slug: 'new-product-slug' },
      } as any;

      const response = await validateSlug(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.available).toBe(true);
      expect(responseData.message).toBe('Slug disponible');
    });

    it('should detect slug conflicts', async () => {
      // Mock slug check - not available
      mockSupabaseClient.from().select().eq().limit.mockResolvedValue({
        data: [{ id: 'existing-product-id' }],
        error: null,
      });

      const mockRequest = {
        supabase: mockSupabaseClient,
        user: { id: 'test-user-id' },
        validatedData: { slug: 'existing-slug' },
      } as any;

      const response = await validateSlug(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.available).toBe(false);
      expect(responseData.message).toBe('Slug ya está en uso');
    });

    it('should exclude current product when editing', async () => {
      // Mock slug check excluding current product
      mockSupabaseClient.from().select().eq().neq = jest.fn(() => ({
        limit: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }));

      const mockRequest = {
        supabase: mockSupabaseClient,
        user: { id: 'test-user-id' },
        validatedData: { 
          slug: 'product-slug',
          productId: 'current-product-id'
        },
      } as any;

      const response = await validateSlug(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.available).toBe(true);
    });
  });

  describe('End-to-End Product Workflow', () => {
    it('should complete full product creation workflow', async () => {
      // 1. Validate slug
      mockSupabaseClient.from().select().eq().limit.mockResolvedValue({
        data: [],
        error: null,
      });

      const slugRequest = {
        supabase: mockSupabaseClient,
        user: { id: 'test-user-id' },
        validatedData: { slug: 'new-product' },
      } as any;

      const slugResponse = await validateSlug(slugRequest);
      const slugData = await slugResponse.json();

      expect(slugData.available).toBe(true);

      // 2. Create product (simulated)
      const newProduct = {
        id: 'new-product-id',
        name: 'New Product',
        slug: 'new-product',
        price: 100,
        stock: 10,
        category_id: 'test-category-id',
      };

      // 3. Upload image
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: newProduct,
        error: null,
      });

      mockSupabaseClient.storage.from().upload.mockResolvedValue({
        data: { path: 'products/new-product-id/image.jpg' },
        error: null,
      });

      mockSupabaseClient.storage.from().getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://storage.example.com/image.jpg' },
      });

      mockSupabaseClient.from().insert().select().single.mockResolvedValue({
        data: {
          id: 'image-id',
          product_id: 'new-product-id',
          url: 'https://storage.example.com/image.jpg',
          is_primary: true,
        },
        error: null,
      });

      const mockFile = new File(['content'], 'image.jpg', { type: 'image/jpeg' });
      const mockFormData = new FormData();
      mockFormData.append('file', mockFile);
      mockFormData.append('is_primary', 'true');

      const imageRequest = {
        supabase: mockSupabaseClient,
        user: { id: 'test-user-id' },
        formData: jest.fn().mockResolvedValue(mockFormData),
      } as any;

      const imageResponse = await uploadImage(imageRequest, { params: { id: 'new-product-id' } });
      const imageData = await imageResponse.json();

      expect(imageResponse.status).toBe(201);
      expect(imageData.success).toBe(true);

      // 4. Retrieve complete product
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: {
          ...newProduct,
          categories: { name: 'Test Category' },
        },
        error: null,
      });

      const getRequest = {
        supabase: mockSupabaseClient,
        user: { id: 'test-user-id' },
      } as any;

      const getResponse = await getProduct(getRequest, { params: { id: 'new-product-id' } });
      const getData = await getResponse.json();

      expect(getResponse.status).toBe(200);
      expect(getData.data.name).toBe('New Product');
      expect(getData.data.category_name).toBe('Test Category');
    });
  });
});
