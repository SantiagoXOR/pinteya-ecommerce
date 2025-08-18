// 🧪 Enterprise Unit Tests - Product Images API

import { NextRequest } from 'next/server';
import { GET, POST } from '../route';

// Mock Supabase Storage
const mockStorageUpload = jest.fn();
const mockStorageGetPublicUrl = jest.fn();
const mockStorageRemove = jest.fn();

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
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
          neq: jest.fn(),
        })),
      })),
    })),
    storage: {
      from: jest.fn(() => ({
        upload: mockStorageUpload,
        getPublicUrl: mockStorageGetPublicUrl,
        remove: mockStorageRemove,
      })),
    },
  })),
}));

// Mock middleware
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
  ValidationError: jest.fn((message) => new Error(message)),
  NotFoundError: jest.fn((resource) => new Error(`${resource} no encontrado`)),
}));

jest.mock('@/lib/api/api-logger', () => ({
  withApiLogging: jest.fn((handler) => handler),
  logAdminAction: jest.fn(),
}));

jest.mock('@/lib/auth/api-auth-middleware', () => ({
  withAdminAuth: jest.fn(() => (handler) => handler),
}));

describe('/api/admin/products/[id]/images - Enterprise API Tests', () => {
  let mockSupabase: any;
  let mockRequest: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSupabase = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(),
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
            neq: jest.fn(),
          })),
        })),
      })),
    };

    mockRequest = {
      supabase: mockSupabase,
      user: { id: 'test-user-id' },
    } as any;

    // Reset storage mocks
    mockStorageUpload.mockReset();
    mockStorageGetPublicUrl.mockReset();
    mockStorageRemove.mockReset();
  });

  describe('GET /api/admin/products/[id]/images', () => {
    it('should return product images successfully', async () => {
      const mockImages = [
        {
          id: 'image-1',
          url: 'https://example.com/image1.jpg',
          alt_text: 'Image 1',
          is_primary: true,
          display_order: 0,
        },
        {
          id: 'image-2',
          url: 'https://example.com/image2.jpg',
          alt_text: 'Image 2',
          is_primary: false,
          display_order: 1,
        },
      ];

      mockSupabase.from().select().eq().order().order.mockResolvedValue({
        data: mockImages,
        error: null,
      });

      const response = await GET(mockRequest, { params: { id: 'test-product-id' } });
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data).toHaveLength(2);
      expect(responseData.data[0].is_primary).toBe(true);
    });

    it('should handle empty images list', async () => {
      mockSupabase.from().select().eq().order().order.mockResolvedValue({
        data: [],
        error: null,
      });

      const response = await GET(mockRequest, { params: { id: 'test-product-id' } });
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data).toHaveLength(0);
    });

    it('should validate product ID format', async () => {
      await expect(
        GET(mockRequest, { params: { id: 'invalid-uuid' } })
      ).rejects.toThrow('ID de producto inválido');
    });

    it('should handle database errors', async () => {
      mockSupabase.from().select().eq().order().order.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(
        GET(mockRequest, { params: { id: 'test-product-id' } })
      ).rejects.toThrow('Error al obtener imágenes');
    });
  });

  describe('POST /api/admin/products/[id]/images', () => {
    let mockFile: File;
    let mockFormData: FormData;

    beforeEach(() => {
      // Create mock file
      mockFile = new File(['test content'], 'test-image.jpg', {
        type: 'image/jpeg',
      });

      // Create mock FormData
      mockFormData = new FormData();
      mockFormData.append('file', mockFile);
      mockFormData.append('alt_text', 'Test image');
      mockFormData.append('is_primary', 'true');

      // Mock request.formData()
      mockRequest.formData = jest.fn().mockResolvedValue(mockFormData);

      // Mock product exists check
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { id: 'test-product-id', name: 'Test Product' },
        error: null,
      });
    });

    it('should upload image successfully', async () => {
      // Mock storage upload
      mockStorageUpload.mockResolvedValue({
        data: { path: 'products/test-product-id/123_test-image.jpg' },
        error: null,
      });

      mockStorageGetPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://storage.example.com/test-image.jpg' },
      });

      // Mock database insert
      const mockImageRecord = {
        id: 'new-image-id',
        product_id: 'test-product-id',
        url: 'https://storage.example.com/test-image.jpg',
        alt_text: 'Test image',
        is_primary: true,
      };

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: mockImageRecord,
        error: null,
      });

      // Mock update other images to not primary
      mockSupabase.from().update().eq().neq.mockResolvedValue({
        error: null,
      });

      const response = await POST(mockRequest, { params: { id: 'test-product-id' } });
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.success).toBe(true);
      expect(responseData.data.url).toBe('https://storage.example.com/test-image.jpg');
      expect(responseData.message).toBe('Imagen subida exitosamente');

      // Verify storage upload was called
      expect(mockStorageUpload).toHaveBeenCalledWith(
        expect.stringContaining('products/test-product-id/'),
        mockFile,
        expect.objectContaining({
          cacheControl: '3600',
          upsert: false,
        })
      );
    });

    it('should validate file type', async () => {
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      mockFormData.set('file', invalidFile);

      await expect(
        POST(mockRequest, { params: { id: 'test-product-id' } })
      ).rejects.toThrow('Tipo de archivo no permitido');
    });

    it('should validate file size', async () => {
      // Create a large file (6MB)
      const largeContent = new Array(6 * 1024 * 1024).fill('a').join('');
      const largeFile = new File([largeContent], 'large.jpg', { type: 'image/jpeg' });
      mockFormData.set('file', largeFile);

      await expect(
        POST(mockRequest, { params: { id: 'test-product-id' } })
      ).rejects.toThrow('El archivo es demasiado grande');
    });

    it('should handle missing file', async () => {
      mockFormData.delete('file');

      await expect(
        POST(mockRequest, { params: { id: 'test-product-id' } })
      ).rejects.toThrow('No se proporcionó archivo');
    });

    it('should handle product not found', async () => {
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      await expect(
        POST(mockRequest, { params: { id: 'non-existent-product' } })
      ).rejects.toThrow('Producto no encontrado');
    });

    it('should handle storage upload errors', async () => {
      mockStorageUpload.mockResolvedValue({
        data: null,
        error: { message: 'Storage error' },
      });

      await expect(
        POST(mockRequest, { params: { id: 'test-product-id' } })
      ).rejects.toThrow('Error al subir imagen');
    });

    it('should cleanup storage on database insert failure', async () => {
      // Mock successful storage upload
      mockStorageUpload.mockResolvedValue({
        data: { path: 'products/test-product-id/test-image.jpg' },
        error: null,
      });

      mockStorageGetPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://storage.example.com/test-image.jpg' },
      });

      // Mock database insert failure
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(
        POST(mockRequest, { params: { id: 'test-product-id' } })
      ).rejects.toThrow('Error al guardar imagen en base de datos');

      // Verify cleanup was attempted
      expect(mockStorageRemove).toHaveBeenCalledWith(['products/test-product-id/test-image.jpg']);
    });

    it('should update other images when setting as primary', async () => {
      mockStorageUpload.mockResolvedValue({
        data: { path: 'test-path' },
        error: null,
      });

      mockStorageGetPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://example.com/image.jpg' },
      });

      const mockImageRecord = {
        id: 'new-image-id',
        is_primary: true,
      };

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: mockImageRecord,
        error: null,
      });

      await POST(mockRequest, { params: { id: 'test-product-id' } });

      // Verify other images were updated to not primary
      expect(mockSupabase.from().update).toHaveBeenCalledWith({ is_primary: false });
    });

    it('should generate unique filename', async () => {
      mockStorageUpload.mockResolvedValue({
        data: { path: 'test-path' },
        error: null,
      });

      mockStorageGetPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://example.com/image.jpg' },
      });

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: { id: 'test-id' },
        error: null,
      });

      await POST(mockRequest, { params: { id: 'test-product-id' } });

      // Verify filename includes product ID and timestamp
      const uploadCall = mockStorageUpload.mock.calls[0];
      const filename = uploadCall[0];
      
      expect(filename).toContain('products/test-product-id/');
      expect(filename).toContain('test-image.jpg');
    });
  });

  describe('File Validation', () => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const invalidTypes = ['text/plain', 'application/pdf', 'video/mp4'];

    validTypes.forEach(type => {
      it(`should accept ${type} files`, async () => {
        const file = new File(['content'], 'test.jpg', { type });
        const formData = new FormData();
        formData.append('file', file);
        
        mockRequest.formData = jest.fn().mockResolvedValue(formData);

        mockSupabase.from().select().eq().single.mockResolvedValue({
          data: { id: 'test-product-id' },
          error: null,
        });

        mockStorageUpload.mockResolvedValue({
          data: { path: 'test-path' },
          error: null,
        });

        mockStorageGetPublicUrl.mockReturnValue({
          data: { publicUrl: 'https://example.com/image.jpg' },
        });

        mockSupabase.from().insert().select().single.mockResolvedValue({
          data: { id: 'test-id' },
          error: null,
        });

        const response = await POST(mockRequest, { params: { id: 'test-product-id' } });
        expect(response.status).toBe(201);
      });
    });

    invalidTypes.forEach(type => {
      it(`should reject ${type} files`, async () => {
        const file = new File(['content'], 'test.txt', { type });
        const formData = new FormData();
        formData.append('file', file);
        
        mockRequest.formData = jest.fn().mockResolvedValue(formData);

        mockSupabase.from().select().eq().single.mockResolvedValue({
          data: { id: 'test-product-id' },
          error: null,
        });

        await expect(
          POST(mockRequest, { params: { id: 'test-product-id' } })
        ).rejects.toThrow('Tipo de archivo no permitido');
      });
    });
  });
});
