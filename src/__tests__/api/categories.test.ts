// ===================================
// PINTEYA E-COMMERCE - TESTS PARA API CATEGORIES
// ===================================

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/categories/route';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        order: jest.fn(() => ({
          data: [
            { id: 1, name: 'Pinturas', slug: 'pinturas' },
            { id: 2, name: 'Herramientas', slug: 'herramientas' },
          ],
          error: null,
        })),
      })),
    })),
  },
}));

describe('/api/categories', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
      });
    });

    it('should handle database errors', async () => {
      // Mock error response
      const { supabaseAdmin } = require('@/lib/supabase');
      supabaseAdmin.from.mockReturnValue({
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
      expect(data.error).toBe('Error obteniendo categorías');
    });

    it('should handle empty categories', async () => {
      // Mock empty response
      const { supabaseAdmin } = require('@/lib/supabase');
      supabaseAdmin.from.mockReturnValue({
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
      const { supabaseAdmin } = require('@/lib/supabase');
      supabaseAdmin.from.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const request = new NextRequest('http://localhost:3000/api/categories');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Error interno del servidor');
    });
  });
});
