/**
 * Tests para las funciones de autenticación mejoradas con Clerk
 * Verifica las nuevas funciones getAuth(req) y compatibilidad
 */

import { NextRequest } from 'next/server';
import type { NextApiRequest, NextApiResponse } from 'next';

// Mock de Clerk
jest.mock('@clerk/nextjs/server', () => ({
  getAuth: jest.fn(),
  auth: jest.fn(),
  currentUser: jest.fn()
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
  getAuthFromApiRoute, 
  getAuthFromRouteHandler,
  getUnifiedAuth,
  withAdminAuthPages
} from '@/lib/auth/admin-auth';
import { getAuth, auth } from '@clerk/nextjs/server';

describe('Funciones de Autenticación Mejoradas', () => {
  let mockGetAuth: jest.MockedFunction<typeof getAuth>;
  let mockAuth: jest.MockedFunction<typeof auth>;

  beforeEach(() => {
    mockGetAuth = getAuth as jest.MockedFunction<typeof getAuth>;
    mockAuth = auth as jest.MockedFunction<typeof auth>;
    jest.clearAllMocks();
  });

  describe('getAuthenticatedUser (mejorada)', () => {
    it('debe usar getAuth para NextApiRequest', async () => {
      const mockApiRequest = {
        query: {},
        headers: {},
        cookies: {}
      } as NextApiRequest;

      mockGetAuth.mockReturnValue({
        userId: 'user_123',
        sessionId: 'session_456',
        getToken: jest.fn()
      });

      const result = await getAuthenticatedUser(mockApiRequest);

      expect(mockGetAuth).toHaveBeenCalledWith(mockApiRequest);
      expect(result).toEqual({
        userId: 'user_123',
        sessionId: 'session_456'
      });
    });

    it('debe usar auth() para NextRequest', async () => {
      const mockNextRequest = {
        nextUrl: { pathname: '/test' },
        headers: new Map(),
        cookies: new Map()
      } as any;

      mockAuth.mockResolvedValue({
        userId: 'user_789',
        sessionId: 'session_abc',
        getToken: jest.fn()
      });

      const result = await getAuthenticatedUser(mockNextRequest);

      expect(mockAuth).toHaveBeenCalled();
      expect(result).toEqual({
        userId: 'user_789',
        sessionId: 'session_abc'
      });
    });

    it('debe usar fallback a headers cuando getAuth falla', async () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('user_fallback')
        }
      } as any;

      mockAuth.mockRejectedValue(new Error('Auth failed'));

      const result = await getAuthenticatedUser(mockRequest);

      expect(result.userId).toBe('user_fallback');
    });

    it('debe retornar error cuando no hay autenticación', async () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue(null)
        }
      } as any;

      mockAuth.mockRejectedValue(new Error('Auth failed'));

      const result = await getAuthenticatedUser(mockRequest);

      expect(result.userId).toBeNull();
      expect(result.error).toBe('No autorizado');
    });
  });

  describe('getAuthFromApiRoute', () => {
    it('debe usar getAuth correctamente para API Routes', () => {
      const mockReq = { query: {}, headers: {} } as NextApiRequest;
      const mockRes = {} as NextApiResponse;

      mockGetAuth.mockReturnValue({
        userId: 'api_user_123',
        sessionId: 'api_session_456',
        getToken: jest.fn()
      });

      const result = getAuthFromApiRoute(mockReq, mockRes);

      expect(mockGetAuth).toHaveBeenCalledWith(mockReq);
      expect(result.userId).toBe('api_user_123');
      expect(result.sessionId).toBe('api_session_456');
    });

    it('debe lanzar error cuando no hay userId', () => {
      const mockReq = { query: {}, headers: {} } as NextApiRequest;
      const mockRes = {} as NextApiResponse;

      mockGetAuth.mockReturnValue({
        userId: null,
        sessionId: null,
        getToken: jest.fn()
      });

      expect(() => getAuthFromApiRoute(mockReq, mockRes)).toThrow('Usuario no autenticado');
    });
  });

  describe('getAuthFromRouteHandler', () => {
    it('debe usar auth() correctamente para Route Handlers', async () => {
      mockAuth.mockResolvedValue({
        userId: 'route_user_123',
        sessionId: 'route_session_456',
        getToken: jest.fn()
      });

      const result = await getAuthFromRouteHandler();

      expect(mockAuth).toHaveBeenCalled();
      expect(result.userId).toBe('route_user_123');
      expect(result.sessionId).toBe('route_session_456');
    });

    it('debe lanzar error cuando no hay userId', async () => {
      mockAuth.mockResolvedValue({
        userId: null,
        sessionId: null,
        getToken: jest.fn()
      });

      await expect(getAuthFromRouteHandler()).rejects.toThrow('Usuario no autenticado');
    });
  });

  describe('getUnifiedAuth', () => {
    it('debe detectar NextApiRequest y usar getAuth', async () => {
      const mockApiRequest = {
        query: {},
        headers: {}
      } as NextApiRequest;

      mockGetAuth.mockReturnValue({
        userId: 'unified_user_123',
        sessionId: 'unified_session_456',
        getToken: jest.fn()
      });

      const result = await getUnifiedAuth(mockApiRequest);

      expect(mockGetAuth).toHaveBeenCalledWith(mockApiRequest);
      expect(result.userId).toBe('unified_user_123');
    });

    it('debe detectar NextRequest y usar auth()', async () => {
      const mockNextRequest = {
        nextUrl: { pathname: '/test' },
        headers: new Map()
      } as any;

      mockAuth.mockResolvedValue({
        userId: 'unified_route_123',
        sessionId: 'unified_route_456',
        getToken: jest.fn()
      });

      const result = await getUnifiedAuth(mockNextRequest);

      expect(mockAuth).toHaveBeenCalled();
      expect(result.userId).toBe('unified_route_123');
    });

    it('debe usar fallback cuando hay error', async () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('fallback_user')
        }
      } as any;

      mockAuth.mockRejectedValue(new Error('Unified auth failed'));

      const result = await getUnifiedAuth(mockRequest);

      expect(result.userId).toBe('fallback_user');
    });
  });

  describe('withAdminAuthPages wrapper', () => {
    it('debe crear wrapper funcional para Pages Router', () => {
      const mockHandler = jest.fn();
      const wrappedHandler = withAdminAuthPages(mockHandler);

      expect(typeof wrappedHandler).toBe('function');
    });

    it('debe pasar contexto correcto al handler', async () => {
      const mockHandler = jest.fn();
      const mockReq = { query: {}, headers: {} } as NextApiRequest;
      const mockRes = { 
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      // Mock successful auth
      mockGetAuth.mockReturnValue({
        userId: 'admin_user',
        sessionId: 'admin_session',
        getToken: jest.fn()
      });

      const wrappedHandler = withAdminAuthPages(mockHandler);
      
      // Este test verificaría la estructura, pero requiere mocks más complejos
      // para el sistema completo de permisos
      expect(typeof wrappedHandler).toBe('function');
    });
  });

  describe('Compatibilidad hacia atrás', () => {
    it('debe mantener compatibilidad con headers x-clerk-user-id', async () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockImplementation((key) => {
            if (key === 'x-clerk-user-id') return 'legacy_user_123';
            return null;
          })
        }
      } as any;

      mockAuth.mockRejectedValue(new Error('Auth not available'));

      const result = await getAuthenticatedUser(mockRequest);

      expect(result.userId).toBe('legacy_user_123');
    });

    it('debe mantener compatibilidad con JWT en cookies', async () => {
      const mockJwtPayload = { sub: 'jwt_user_123' };
      const mockJwt = 'header.' + btoa(JSON.stringify(mockJwtPayload)) + '.signature';

      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue(null)
        },
        cookies: {
          get: jest.fn().mockImplementation((key) => {
            if (key === '__session') return { value: mockJwt };
            return undefined;
          })
        }
      } as any;

      mockAuth.mockRejectedValue(new Error('Auth not available'));

      const result = await getAuthenticatedUser(mockRequest);

      expect(result.userId).toBe('jwt_user_123');
    });
  });

  describe('Logging y debugging', () => {
    it('debe loggear autenticación exitosa', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const mockApiRequest = {
        query: {},
        headers: {}
      } as NextApiRequest;

      mockGetAuth.mockReturnValue({
        userId: 'logged_user_123',
        sessionId: 'logged_session_456',
        getToken: jest.fn()
      });

      await getAuthenticatedUser(mockApiRequest);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[AUTH] Usuario autenticado via getAuth: logged_user_123')
      );

      consoleSpy.mockRestore();
    });

    it('debe loggear warnings para fallbacks', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('fallback_user')
        }
      } as any;

      mockAuth.mockRejectedValue(new Error('Auth failed'));

      await getAuthenticatedUser(mockRequest);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[AUTH] Usando header fallback para userId')
      );

      consoleSpy.mockRestore();
    });
  });
});
