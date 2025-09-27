// ===================================
// PINTEYA E-COMMERCE - TESTS PARA API CATEGORIES
// ===================================

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/categories/route';

// Mock Supabase
const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      order: jest.fn(() => ({
        data: [
          { id: 1, name: 'Pinturas', slug: 'pinturas', products_count: [{ count: 5 }] },
          { id: 2, name: 'Herramientas', slug: 'herramientas', products_count: [{ count: 3 }] },
        ],
        error: null,
      })),
    })),
  })),
};

jest.mock('@/lib/supabase', () => ({
  getSupabaseClient: jest.fn(() => mockSupabaseClient),
  handleSupabaseError: jest.fn(),
}));

describe('/api/categories', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset getSupabaseClient mock
    const { getSupabaseClient } = require('@/lib/supabase');
    getSupabaseClient.mockReturnValue(mockSupabaseClient);

    // Reset mock data to default
    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn(() => ({
        order: jest.fn(() => ({
          data: [
            { id: 1, name: 'Pinturas', slug: 'pinturas', products_count: [{ count: 5 }] },
            { id: 2, name: 'Herramientas', slug: 'herramientas', products_count: [{ count: 3 }] },
          ],
          error: null,
        })),
      })),
    });
  });

  describe('GET', () => {
    it('should return categories successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/categories');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
      expect(data.data[0]).toEqual({
        id: 1,
        name: 'Pinturas',
        slug: 'pinturas',
        products_count: 5,
      });
    });

    it('should handle database errors', async () => {
      // Mock error response
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn(() => ({
          order: jest.fn(() => ({
            data: null,
            error: { message: 'Database error' },
          })),
        })),
      });

      const request = new NextRequest('http://localhost:3000/api/categories');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Database error');
    });

    it('should handle empty categories', async () => {
      // Mock empty response
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn(() => ({
          order: jest.fn(() => ({
            data: [],
            error: null,
          })),
        })),
      });

      const request = new NextRequest('http://localhost:3000/api/categories');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
    });

    it('should handle unexpected errors', async () => {
      // Mock unexpected error
      const { getSupabaseClient } = require('@/lib/supabase');
      getSupabaseClient.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const request = new NextRequest('http://localhost:3000/api/categories');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unexpected error');
    });

    it('should return categories with proper structure', async () => {
      const request = new NextRequest('http://localhost:3000/api/categories');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('data');
      expect(data).toHaveProperty('message');

      // Verificar estructura de categorías
      data.data.forEach((category: { id: string; name: string; slug: string }) => {
        expect(category).toHaveProperty('id');
        expect(category).toHaveProperty('name');
        expect(category).toHaveProperty('slug');
      });
    });

    it('should call supabase with correct parameters', async () => {
      const { getSupabaseClient } = require('@/lib/supabase');
      const request = new NextRequest('http://localhost:3000/api/categories');

      await GET(request);

      expect(getSupabaseClient).toHaveBeenCalled();
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('categories');
    });

    it('should handle null data response', async () => {
      // Mock null response
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn(() => ({
          order: jest.fn(() => ({
            data: null,
            error: null,
          })),
        })),
      });

      const request = new NextRequest('http://localhost:3000/api/categories');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
    });

    it('should handle categories with special characters', async () => {
      // Mock response with special characters
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn(() => ({
          order: jest.fn(() => ({
            data: [
              { id: 1, name: 'Pinturas & Barnices', slug: 'pinturas-barnices', products_count: [{ count: 2 }] },
              { id: 2, name: 'Herramientas (Profesionales)', slug: 'herramientas-profesionales', products_count: [{ count: 1 }] },
            ],
            error: null,
          })),
        })),
      });

      const request = new NextRequest('http://localhost:3000/api/categories');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
      expect(data.data[0].name).toBe('Pinturas & Barnices');
      expect(data.data[1].name).toBe('Herramientas (Profesionales)');
    });
  });
});









