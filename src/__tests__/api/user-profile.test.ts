// ===================================
// PINTEYA E-COMMERCE - TESTS PARA API USER PROFILE
// ===================================

import { NextRequest } from 'next/server';
import { GET, PATCH } from '@/app/api/user/profile/route';

// Mock Clerk
jest.mock('@clerk/nextjs/server', () => ({
  currentUser: jest.fn(),
}));

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({
            data: {
              id: '1',
              clerk_id: 'clerk_123',
              name: 'Juan Pérez',
              email: 'juan@example.com',
            },
            error: null,
          })),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => ({
              data: {
                id: '1',
                clerk_id: 'clerk_123',
                name: 'Juan Carlos Pérez',
                email: 'juan@example.com',
              },
              error: null,
            })),
          })),
        })),
      })),
    })),
  },
}));

const mockUser = {
  id: 'clerk_123',
  emailAddresses: [{ emailAddress: 'juan@example.com' }],
  firstName: 'Juan',
  lastName: 'Pérez',
};

describe('/api/user/profile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return user profile successfully', async () => {
      const { currentUser } = require('@clerk/nextjs/server');
      currentUser.mockResolvedValue(mockUser);

      const request = new NextRequest('http://localhost:3000/api/user/profile');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.profile).toEqual({
        id: '1',
        clerk_id: 'clerk_123',
        name: 'Juan Pérez',
        email: 'juan@example.com',
      });
    });

    it('should handle unauthenticated user', async () => {
      const { currentUser } = require('@clerk/nextjs/server');
      currentUser.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/user/profile');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('No autenticado');
    });

    it('should handle user not found in database', async () => {
      const { currentUser } = require('@clerk/nextjs/server');
      currentUser.mockResolvedValue(mockUser);

      const { supabaseAdmin } = require('@/lib/supabase');
      supabaseAdmin.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: null,
              error: { code: 'PGRST116' },
            })),
          })),
        })),
      });

      const request = new NextRequest('http://localhost:3000/api/user/profile');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Usuario no encontrado');
    });
  });

  describe('PATCH', () => {
    it('should update user profile successfully', async () => {
      const { currentUser } = require('@clerk/nextjs/server');
      currentUser.mockResolvedValue(mockUser);

      const requestBody = { name: 'Juan Carlos Pérez' };
      const request = new NextRequest('http://localhost:3000/api/user/profile', {
        method: 'PATCH',
        body: JSON.stringify(requestBody),
      });
      
      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.profile.name).toBe('Juan Carlos Pérez');
    });

    it('should handle invalid JSON', async () => {
      const { currentUser } = require('@clerk/nextjs/server');
      currentUser.mockResolvedValue(mockUser);

      const request = new NextRequest('http://localhost:3000/api/user/profile', {
        method: 'PATCH',
        body: 'invalid json',
      });
      
      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Datos inválidos');
    });

    it('should handle database update error', async () => {
      const { currentUser } = require('@clerk/nextjs/server');
      currentUser.mockResolvedValue(mockUser);

      const { supabaseAdmin } = require('@/lib/supabase');
      supabaseAdmin.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: { id: '1', clerk_id: 'clerk_123' },
              error: null,
            })),
          })),
        })),
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(() => ({
                data: null,
                error: { message: 'Update failed' },
              })),
            })),
          })),
        })),
      });

      const requestBody = { name: 'Juan Carlos Pérez' };
      const request = new NextRequest('http://localhost:3000/api/user/profile', {
        method: 'PATCH',
        body: JSON.stringify(requestBody),
      });
      
      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Error actualizando perfil');
    });
  });
});
