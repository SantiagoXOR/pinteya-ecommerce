// ===================================
// PINTEYA E-COMMERCE - TESTS PARA API USER PROFILE
// ===================================

import { NextRequest } from 'next/server';
import { GET, PUT } from '@/app/api/user/profile/route';

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
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => ({
            data: {
              id: '1',
              clerk_id: 'clerk_123',
              name: 'Usuario Demo',
              email: 'usuario@demo.com',
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

    // Configurar mock de currentUser por defecto
    const { currentUser } = require('@clerk/nextjs/server');
    currentUser.mockResolvedValue(mockUser);

    // Resetear el mock de Supabase a su estado por defecto
    const { supabaseAdmin } = require('@/lib/supabase');
    supabaseAdmin.from.mockReturnValue({
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
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => ({
            data: {
              id: '1',
              clerk_id: 'clerk_123',
              name: 'Usuario Demo',
              email: 'usuario@demo.com',
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
    });
  });

  describe('GET', () => {
    it('should return user profile successfully', async () => {
      // Asegurar que currentUser devuelve un usuario válido
      const { currentUser } = require('@clerk/nextjs/server');
      currentUser.mockResolvedValue(mockUser);

      // Asegurar que Supabase devuelve datos válidos
      const { supabaseAdmin } = require('@/lib/supabase');
      supabaseAdmin.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
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
      });

      const request = new NextRequest('http://localhost:3000/api/user/profile');

      const response = await GET(request);
      const data = await response.json();

      // Si el test falla, mostrar la respuesta real para debug
      if (response.status !== 200) {
        console.log('Response status:', response.status);
        console.log('Response data:', data);
      }

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user).toEqual({
        id: '1',
        clerk_id: 'clerk_123',
        name: 'Juan Pérez',
        email: 'juan@example.com',
      });
    });

    it('should handle unauthenticated user (currently returns demo user)', async () => {
      const { currentUser } = require('@clerk/nextjs/server');
      currentUser.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/user/profile');

      const response = await GET(request);
      const data = await response.json();

      // La API actual devuelve un usuario demo cuando no hay autenticación
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user).toBeDefined();
    });

    it('should create demo user when not found in database', async () => {
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
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => ({
              data: {
                id: '1',
                clerk_id: 'demo-user-id',
                name: 'Usuario Demo',
                email: 'usuario@demo.com',
              },
              error: null,
            })),
          })),
        })),
      });

      const request = new NextRequest('http://localhost:3000/api/user/profile');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user.name).toBe('Usuario Demo');
    });
  });

  describe('PUT', () => {
    it('should update user profile successfully', async () => {
      const { currentUser } = require('@clerk/nextjs/server');
      currentUser.mockResolvedValue(mockUser);

      const requestBody = { name: 'Juan Carlos Pérez', email: 'juan@example.com' };
      const request = new NextRequest('http://localhost:3000/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify(requestBody),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user.name).toBe('Juan Carlos Pérez');
    });

    it('should handle missing required fields', async () => {
      const { currentUser } = require('@clerk/nextjs/server');
      currentUser.mockResolvedValue(mockUser);

      const request = new NextRequest('http://localhost:3000/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Juan Carlos Pérez' }), // Falta email
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Nombre y email son requeridos');
    });

    it('should handle database update error', async () => {
      const { currentUser } = require('@clerk/nextjs/server');
      currentUser.mockResolvedValue(mockUser);

      const { supabaseAdmin } = require('@/lib/supabase');
      supabaseAdmin.from.mockReturnValue({
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

      const requestBody = { name: 'Juan Carlos Pérez', email: 'juan@example.com' };
      const request = new NextRequest('http://localhost:3000/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify(requestBody),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Error al actualizar perfil de usuario');
    });
  });
});
