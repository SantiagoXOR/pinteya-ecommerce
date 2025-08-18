// 🧪 Enterprise Unit Tests - Individual Product API

import { NextRequest } from 'next/server';
import {
  createMockRequest,
  createMockSupabaseClient,
  setupApiTestEnvironment,
  cleanupApiTestEnvironment
} from '@/__tests__/setup/api-mocks';

// Dynamic import for API handlers to avoid module loading issues
let GET: any, PUT: any, DELETE: any;

beforeAll(async () => {
  setupApiTestEnvironment();

  // Import handlers after mocks are set up
  const handlers = await import('../route');
  GET = handlers.GET;
  PUT = handlers.PUT;
  DELETE = handlers.DELETE;
});

describe('/api/admin/products/[id] - Enterprise API Tests', () => {
  let mockSupabase: any;
  let mockRequest: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabase = createMockSupabaseClient();
    mockRequest = createMockRequest({
      supabase: mockSupabase,
    });
  });

  afterAll(() => {
    cleanupApiTestEnvironment();
  });

  describe('GET /api/admin/products/[id]', () => {
    it('should return product successfully', async () => {
      const mockProduct = {
        id: 'test-product-id',
        name: 'Test Product',
        price: 100,
        stock: 10,
        categories: { name: 'Test Category' },
      };

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockProduct,
        error: null,
      });

      const response = await GET(mockRequest, { params: { id: 'test-product-id' } });
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.name).toBe('Test Product');
      expect(responseData.data.category_name).toBe('Test Category');
    });

    it('should handle product not found', async () => {
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      await expect(
        GET(mockRequest, { params: { id: 'non-existent-id' } })
      ).rejects.toThrow('Producto no encontrado');
    });

    it('should validate product ID format', async () => {
      await expect(
        GET(mockRequest, { params: { id: 'invalid-uuid' } })
      ).rejects.toThrow('ID de producto inválido');
    });
  });

  describe('PUT /api/admin/products/[id]', () => {
    beforeEach(() => {
      mockRequest.validatedData = {
        name: 'Updated Product',
        price: 150,
        stock: 20,
      };

      // Mock existing product check
      mockSupabase.from().select().eq().single
        .mockResolvedValueOnce({
          data: { id: 'test-product-id', name: 'Original Product' },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: 'category-id' },
          error: null,
        });
    });

    it('should update product successfully', async () => {
      const mockUpdatedProduct = {
        id: 'test-product-id',
        name: 'Updated Product',
        price: 150,
        stock: 20,
        categories: { name: 'Test Category' },
      };

      mockSupabase.from().update().eq().select().single.mockResolvedValue({
        data: mockUpdatedProduct,
        error: null,
      });

      const response = await PUT(mockRequest, { params: { id: 'test-product-id' } });
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.name).toBe('Updated Product');
      expect(responseData.message).toBe('Producto actualizado exitosamente');
    });

    it('should generate slug when name is updated', async () => {
      mockRequest.validatedData.name = 'New Product Name!';

      mockSupabase.from().update().eq().select().single.mockResolvedValue({
        data: { id: 'test-product-id', slug: 'new-product-name' },
        error: null,
      });

      await PUT(mockRequest, { params: { id: 'test-product-id' } });

      expect(mockSupabase.from().update).toHaveBeenCalledWith(
        expect.objectContaining({
          slug: 'new-product-name',
        })
      );
    });

    it('should validate category exists when updating category_id', async () => {
      mockRequest.validatedData.category_id = 'invalid-category-id';

      mockSupabase.from().select().eq().single
        .mockResolvedValueOnce({
          data: { id: 'test-product-id' },
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'Not found' },
        });

      await expect(
        PUT(mockRequest, { params: { id: 'test-product-id' } })
      ).rejects.toThrow('Categoría no encontrada');
    });

    it('should handle database update errors', async () => {
      mockSupabase.from().update().eq().select().single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(
        PUT(mockRequest, { params: { id: 'test-product-id' } })
      ).rejects.toThrow('Error al actualizar producto');
    });
  });

  describe('DELETE /api/admin/products/[id]', () => {
    beforeEach(() => {
      // Mock existing product check
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { id: 'test-product-id', name: 'Test Product' },
        error: null,
      });
    });

    it('should perform soft delete when product has orders', async () => {
      // Mock order items check - product has orders
      mockSupabase.from().select().eq().limit.mockResolvedValue({
        data: [{ id: 'order-item-id' }],
        error: null,
      });

      // Mock soft delete update
      mockSupabase.from().update().eq.mockResolvedValue({
        error: null,
      });

      const response = await DELETE(mockRequest, { params: { id: 'test-product-id' } });
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.soft_delete).toBe(true);
      expect(responseData.message).toContain('marcado como inactivo');
    });

    it('should perform hard delete when product has no orders', async () => {
      // Mock order items check - no orders
      mockSupabase.from().select().eq().limit.mockResolvedValue({
        data: [],
        error: null,
      });

      // Mock hard delete
      mockSupabase.from().delete().eq.mockResolvedValue({
        error: null,
      });

      const response = await DELETE(mockRequest, { params: { id: 'test-product-id' } });
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.hard_delete).toBe(true);
      expect(responseData.message).toBe('Producto eliminado exitosamente');
    });

    it('should handle delete errors gracefully', async () => {
      mockSupabase.from().select().eq().limit.mockResolvedValue({
        data: [],
        error: null,
      });

      mockSupabase.from().delete().eq.mockResolvedValue({
        error: { message: 'Delete failed' },
      });

      await expect(
        DELETE(mockRequest, { params: { id: 'test-product-id' } })
      ).rejects.toThrow('Error al eliminar producto');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid UUID format', async () => {
      await expect(
        GET(mockRequest, { params: { id: 'not-a-uuid' } })
      ).rejects.toThrow('ID de producto inválido');
    });

    it('should handle missing product ID', async () => {
      await expect(
        GET(mockRequest, { params: { id: '' } })
      ).rejects.toThrow('ID de producto inválido');
    });

    it('should handle database connection errors', async () => {
      mockSupabase.from().select().eq().single.mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(
        GET(mockRequest, { params: { id: 'test-product-id' } })
      ).rejects.toThrow('Database connection failed');
    });
  });

  describe('Audit Logging', () => {
    it('should log update actions', async () => {
      const { logAdminAction } = require('@/lib/api/api-logger');
      
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { id: 'test-product-id', name: 'Original' },
        error: null,
      });

      mockSupabase.from().update().eq().select().single.mockResolvedValue({
        data: { id: 'test-product-id', name: 'Updated' },
        error: null,
      });

      await PUT(mockRequest, { params: { id: 'test-product-id' } });

      expect(logAdminAction).toHaveBeenCalledWith(
        'test-user-id',
        'UPDATE',
        'product',
        'test-product-id',
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should log delete actions', async () => {
      const { logAdminAction } = require('@/lib/api/api-logger');
      
      mockSupabase.from().select().eq().limit.mockResolvedValue({
        data: [],
        error: null,
      });

      mockSupabase.from().delete().eq.mockResolvedValue({
        error: null,
      });

      await DELETE(mockRequest, { params: { id: 'test-product-id' } });

      expect(logAdminAction).toHaveBeenCalledWith(
        'test-user-id',
        'DELETE',
        'product',
        'test-product-id',
        expect.any(Object),
        null
      );
    });
  });
});
