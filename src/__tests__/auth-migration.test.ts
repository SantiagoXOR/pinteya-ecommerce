/**
 * Tests para la migración de autenticación de headers a getAuth(req)
 * Verifica que el sistema migrado funciona correctamente
 */

// Mock de Clerk
jest.mock('@clerk/nextjs/server', () => ({
  getAuth: jest.fn(),
  auth: jest.fn()
}));

// Mock de Supabase
jest.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        }))
      }))
    }))
  }
}));

import {
  getAuthenticatedUser,
  getAuthenticatedAdmin,
  getAuthFromHeaders
} from '@/lib/auth/admin-auth';
import { getAuth, auth } from '@clerk/nextjs/server';

describe('Migración de Autenticación', () => {
  let mockGetAuth: jest.MockedFunction<typeof getAuth>;
  let mockAuth: jest.MockedFunction<typeof auth>;

  beforeEach(() => {
    mockGetAuth = getAuth as jest.MockedFunction<typeof getAuth>;
    mockAuth = auth as jest.MockedFunction<typeof auth>;
    jest.clearAllMocks();
  });

  describe('getAuthenticatedUser (migrado)', () => {
    it('debe usar getAuth para NextApiRequest', async () => {
      const mockRequest = {
        query: {},
        headers: {}
      } as any;

      mockGetAuth.mockReturnValue({
        userId: 'user_123',
        sessionId: 'sess_123',
        getToken: jest.fn().mockResolvedValue('mock_token')
      });

      const result = await getAuthenticatedUser(mockRequest);

      expect(mockGetAuth).toHaveBeenCalledWith(mockRequest);
      expect(result.userId).toBe('user_123');
      expect(result.sessionId).toBe('sess_123');
    });

    it('debe usar auth() para App Router', async () => {
      mockAuth.mockResolvedValue({
        userId: 'user_456',
        sessionId: 'sess_456',
        sessionClaims: {
          metadata: { role: 'admin' }
        }
      });

      const result = await getAuthenticatedUser();

      expect(mockAuth).toHaveBeenCalled();
      expect(result.userId).toBe('user_456');
      expect(result.sessionId).toBe('sess_456');
      expect(result.isAdmin).toBe(true);
    });

    it('debe manejar usuarios no autenticados', async () => {
      mockAuth.mockResolvedValue({
        userId: null,
        sessionId: null
      });

      const result = await getAuthenticatedUser();

      expect(result.userId).toBeNull();
      expect(result.error).toBe('Usuario no autenticado');
    });

    it('debe manejar errores de autenticación', async () => {
      mockAuth.mockRejectedValue(new Error('Auth error'));

      const result = await getAuthenticatedUser();

      expect(result.userId).toBeNull();
      expect(result.error).toContain('Error de autenticación');
    });
  });

  describe('getAuthenticatedAdmin (nueva función)', () => {
    it('debe combinar autenticación y verificación de admin', async () => {
      mockAuth.mockResolvedValue({
        userId: 'admin_123',
        sessionId: 'sess_123',
        sessionClaims: {
          metadata: { role: 'admin' }
        }
      });

      const result = await getAuthenticatedAdmin();

      expect(result.userId).toBe('admin_123');
      expect(result.isAdmin).toBe(true);
      expect(result.sessionId).toBe('sess_123');
    });

    it('debe rechazar usuarios no admin', async () => {
      mockAuth.mockResolvedValue({
        userId: 'user_123',
        sessionId: 'sess_123',
        sessionClaims: {
          metadata: { role: 'user' }
        }
      });

      const result = await getAuthenticatedAdmin();

      expect(result.userId).toBe('user_123');
      expect(result.isAdmin).toBe(false);
      expect(result.error).toBe('Permisos de administrador requeridos');
      expect(result.status).toBe(403);
    });

    it('debe manejar usuarios no autenticados', async () => {
      mockAuth.mockResolvedValue({
        userId: null,
        sessionId: null
      });

      const result = await getAuthenticatedAdmin();

      expect(result.userId).toBeNull();
      expect(result.isAdmin).toBe(false);
      expect(result.error).toBe('Usuario no autenticado');
      expect(result.status).toBe(401);
    });
  });

  describe('getAuthFromHeaders (deprecada)', () => {
    it('debe marcar como deprecada y funcionar', async () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('user_123')
        }
      } as any;

      const result = await getAuthFromHeaders(mockRequest);

      expect(result.userId).toBe('user_123');
      expect(result.deprecated).toBe(true);
    });

    it('debe manejar headers faltantes', async () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue(null)
        }
      } as any;

      const result = await getAuthFromHeaders(mockRequest);

      expect(result.userId).toBeNull();
      expect(result.deprecated).toBe(true);
      expect(result.error).toBe('Header x-clerk-user-id no encontrado');
    });
  });

  describe('Migración completa', () => {
    it('debe tener todas las funciones definidas', () => {
      expect(typeof getAuthenticatedUser).toBe('function');
      expect(typeof getAuthenticatedAdmin).toBe('function');
      expect(typeof getAuthFromHeaders).toBe('function');
    });

    it('debe retornar estructuras correctas', async () => {
      mockAuth.mockResolvedValue({
        userId: 'user_123',
        sessionId: 'sess_123',
        sessionClaims: {
          metadata: { role: 'admin' }
        }
      });

      const userResult = await getAuthenticatedUser();
      const adminResult = await getAuthenticatedAdmin();

      // Verificar estructura de getAuthenticatedUser
      expect(userResult).toHaveProperty('userId');
      expect(userResult).toHaveProperty('sessionId');
      expect(userResult).toHaveProperty('isAdmin');

      // Verificar estructura de getAuthenticatedAdmin
      expect(adminResult).toHaveProperty('userId');
      expect(adminResult).toHaveProperty('sessionId');
      expect(adminResult).toHaveProperty('isAdmin');
      // status solo está presente en casos de error
    });

    it('debe manejar diferentes tipos de request', async () => {
      // Test con NextApiRequest
      const apiRequest = { query: {}, headers: {} } as any;
      mockGetAuth.mockReturnValue({
        userId: 'user_api',
        sessionId: 'sess_api',
        getToken: jest.fn()
      });

      const apiResult = await getAuthenticatedUser(apiRequest);
      expect(mockGetAuth).toHaveBeenCalledWith(apiRequest);
      expect(apiResult.userId).toBe('user_api');

      // Test sin request (App Router)
      mockAuth.mockResolvedValue({
        userId: 'user_app',
        sessionId: 'sess_app'
      });

      const appResult = await getAuthenticatedUser();
      expect(mockAuth).toHaveBeenCalled();
      expect(appResult.userId).toBe('user_app');
    });
  });

  describe('Compatibilidad y migración', () => {
    it('debe mantener compatibilidad con APIs existentes', async () => {
      // Test que verifica que las APIs migradas siguen funcionando
      mockAuth.mockResolvedValue({
        userId: 'user_123',
        sessionId: 'sess_123'
      });

      const result = await getAuthenticatedUser();
      
      // Debe retornar la misma estructura que antes
      expect(result).toHaveProperty('userId');
      expect(result).toHaveProperty('sessionId');
      expect(typeof result.userId).toBe('string');
    });

    it('debe proporcionar información de migración', async () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('user_123')
        }
      } as any;

      const deprecatedResult = await getAuthFromHeaders(mockRequest);
      
      expect(deprecatedResult.deprecated).toBe(true);
      expect(deprecatedResult.userId).toBe('user_123');
    });
  });
});
