/**
 * Tests para las Utilidades de Autenticación Enterprise
 * Verifica que las nuevas utilidades enterprise funcionan correctamente
 */

// Mock de Clerk
jest.mock('@clerk/nextjs/server', () => ({
  getAuth: jest.fn(),
  auth: jest.fn(),
  clerkClient: jest.fn()
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

// Mock de validaciones de seguridad
jest.mock('@/lib/auth/jwt-validation', () => ({
  validateJWTIntegrity: jest.fn(),
  validateJWTPermissions: jest.fn()
}));

jest.mock('@/lib/auth/csrf-protection', () => ({
  validateRequestOrigin: jest.fn()
}));

jest.mock('@/lib/auth/rate-limiting', () => ({
  checkRateLimit: jest.fn(),
  RATE_LIMIT_CONFIGS: {
    admin: { windowMs: 300000, maxRequests: 30 },
    general: { windowMs: 60000, maxRequests: 100 }
  }
}));

jest.mock('@/lib/auth/security-audit', () => ({
  logAuthSuccess: jest.fn(),
  logAuthFailure: jest.fn(),
  logPermissionDenied: jest.fn()
}));

import {
  getEnterpriseAuthContext,
  requireCriticalAuth,
  requireAdminAuth,
  requireBasicAuth,
  withEnterpriseAuth
} from '@/lib/auth/enterprise-auth-utils';
import { getAuth, auth } from '@clerk/nextjs/server';
import { validateJWTIntegrity, validateJWTPermissions } from '@/lib/auth/jwt-validation';
import { validateRequestOrigin } from '@/lib/auth/csrf-protection';
import { checkRateLimit } from '@/lib/auth/rate-limiting';
import { supabaseAdmin } from '@/lib/supabase';

describe('Utilidades de Autenticación Enterprise', () => {
  let mockGetAuth: jest.MockedFunction<typeof getAuth>;
  let mockAuth: jest.MockedFunction<typeof auth>;
  let mockValidateJWT: jest.MockedFunction<typeof validateJWTIntegrity>;
  let mockValidateJWTPermissions: jest.MockedFunction<typeof validateJWTPermissions>;
  let mockValidateOrigin: jest.MockedFunction<typeof validateRequestOrigin>;
  let mockCheckRateLimit: jest.MockedFunction<typeof checkRateLimit>;

  beforeEach(() => {
    mockGetAuth = getAuth as jest.MockedFunction<typeof getAuth>;
    mockAuth = auth as jest.MockedFunction<typeof auth>;
    mockValidateJWT = validateJWTIntegrity as jest.MockedFunction<typeof validateJWTIntegrity>;
    mockValidateJWTPermissions = validateJWTPermissions as jest.MockedFunction<typeof validateJWTPermissions>;
    mockValidateOrigin = validateRequestOrigin as jest.MockedFunction<typeof validateRequestOrigin>;
    mockCheckRateLimit = checkRateLimit as jest.MockedFunction<typeof checkRateLimit>;
    
    jest.clearAllMocks();

    // Setup default mocks
    mockCheckRateLimit.mockResolvedValue({
      allowed: true,
      limit: 30,
      remaining: 29,
      resetTime: Date.now() + 300000
    });

    mockValidateOrigin.mockResolvedValue({
      valid: true
    });

    mockValidateJWT.mockResolvedValue({
      valid: true,
      payload: { sub: 'user_123', iss: 'clerk' }
    });

    mockValidateJWTPermissions.mockResolvedValue({
      valid: true,
      payload: { sub: 'user_123', metadata: { role: 'admin' } }
    });

    // Mock Supabase response
    (supabaseAdmin.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'profile_123',
              email: 'admin@test.com',
              role: 'admin',
              permissions: ['admin_access', 'user_management'],
              metadata: { test: true }
            },
            error: null
          })
        })
      })
    });
  });

  describe('getEnterpriseAuthContext', () => {
    it('debe crear contexto enterprise completo para usuario admin', async () => {
      const mockRequest = {
        query: {},
        headers: {},
        url: 'http://localhost:3000/api/test',
        method: 'GET'
      } as any;

      mockGetAuth.mockReturnValue({
        userId: 'user_123',
        sessionId: 'sess_123'
      });

      const result = await getEnterpriseAuthContext(mockRequest, {
        securityLevel: 'critical',
        enableJWTValidation: true,
        enableCSRFProtection: true,
        enableRateLimit: true
      });

      expect(result.success).toBe(true);
      expect(result.context).toBeDefined();
      expect(result.context?.userId).toBe('user_123');
      expect(result.context?.role).toBe('admin');
      expect(result.context?.permissions).toContain('admin_access');
      expect(result.context?.securityLevel).toBe('critical');
      expect(result.context?.validations.jwtValid).toBe(true);
      expect(result.context?.validations.csrfValid).toBe(true);
      expect(result.context?.validations.rateLimitPassed).toBe(true);
    });

    it('debe fallar si rate limit es excedido', async () => {
      const mockRequest = {
        query: {},
        headers: {}
      } as any;

      mockCheckRateLimit.mockResolvedValue({
        allowed: false,
        limit: 30,
        remaining: 0,
        resetTime: Date.now() + 300000,
        retryAfter: 300,
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED'
      });

      const result = await getEnterpriseAuthContext(mockRequest, {
        enableRateLimit: true,
        rateLimitType: 'admin'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Rate limit exceeded');
      expect(result.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(result.status).toBe(429);
      expect(result.retryAfter).toBe(300);
    });

    it('debe fallar si validación CSRF falla', async () => {
      const mockRequest = {
        query: {},
        headers: {}
      } as any;

      mockValidateOrigin.mockResolvedValue({
        valid: false,
        error: 'Invalid origin',
        code: 'INVALID_ORIGIN'
      });

      const result = await getEnterpriseAuthContext(mockRequest, {
        enableCSRFProtection: true
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid origin');
      expect(result.code).toBe('CSRF_VALIDATION_FAILED');
      expect(result.status).toBe(403);
    });

    it('debe fallar si usuario no está autenticado', async () => {
      const mockRequest = {
        query: {},
        headers: {}
      } as any;

      mockGetAuth.mockReturnValue({
        userId: null,
        sessionId: null
      });

      const result = await getEnterpriseAuthContext(mockRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Usuario no autenticado');
      expect(result.code).toBe('NOT_AUTHENTICATED');
      expect(result.status).toBe(401);
    });

    it('debe fallar si JWT es inválido', async () => {
      const mockRequest = {
        query: {},
        headers: {}
      } as any;

      mockGetAuth.mockReturnValue({
        userId: 'user_123',
        sessionId: 'sess_123'
      });

      mockValidateJWT.mockResolvedValue({
        valid: false,
        error: 'Invalid JWT token',
        code: 'INVALID_TOKEN'
      });

      const result = await getEnterpriseAuthContext(mockRequest, {
        enableJWTValidation: true
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid JWT token');
      expect(result.code).toBe('JWT_VALIDATION_FAILED');
      expect(result.status).toBe(401);
    });

    it('debe fallar si permisos son insuficientes', async () => {
      const mockRequest = {
        query: {},
        headers: {}
      } as any;

      mockGetAuth.mockReturnValue({
        userId: 'user_123',
        sessionId: 'sess_123'
      });

      // Mock usuario sin permisos admin
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'profile_123',
                email: 'user@test.com',
                role: 'user',
                permissions: ['basic_access']
              },
              error: null
            })
          })
        })
      });

      const result = await getEnterpriseAuthContext(mockRequest, {
        requiredRole: 'admin',
        requiredPermissions: ['admin_access']
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Rol requerido: admin');
      expect(result.code).toBe('INSUFFICIENT_ROLE');
      expect(result.status).toBe(403);
    });
  });

  describe('Funciones de conveniencia', () => {
    it('requireCriticalAuth debe usar configuración crítica', async () => {
      const mockRequest = { query: {}, headers: {} } as any;

      mockGetAuth.mockReturnValue({
        userId: 'user_123',
        sessionId: 'sess_123'
      });

      const result = await requireCriticalAuth(mockRequest);

      expect(result.success).toBe(true);
      expect(result.context?.securityLevel).toBe('critical');
      expect(mockCheckRateLimit).toHaveBeenCalled();
      expect(mockValidateOrigin).toHaveBeenCalled();
      expect(mockValidateJWT).toHaveBeenCalled();
    });

    it('requireAdminAuth debe requerir rol admin', async () => {
      const mockRequest = { query: {}, headers: {} } as any;

      mockGetAuth.mockReturnValue({
        userId: 'user_123',
        sessionId: 'sess_123'
      });

      const result = await requireAdminAuth(mockRequest, ['user_management']);

      expect(result.success).toBe(true);
      expect(result.context?.role).toBe('admin');
      expect(result.context?.permissions).toContain('user_management');
    });

    it('requireBasicAuth debe usar configuración básica', async () => {
      const mockRequest = { query: {}, headers: {} } as any;

      mockAuth.mockResolvedValue({
        userId: 'user_123',
        sessionId: 'sess_123'
      });

      const result = await requireBasicAuth(mockRequest);

      expect(result.success).toBe(true);
      expect(result.context?.securityLevel).toBe('low');
    });
  });

  describe('withEnterpriseAuth middleware', () => {
    it('debe ejecutar handler si autenticación es exitosa', async () => {
      const mockRequest = { query: {}, headers: {} } as any;
      const mockResponse = { status: jest.fn(), json: jest.fn() };
      const mockHandler = jest.fn().mockResolvedValue({ success: true });

      mockGetAuth.mockReturnValue({
        userId: 'user_123',
        sessionId: 'sess_123'
      });

      const authFunction = jest.fn().mockResolvedValue({
        success: true,
        context: {
          userId: 'user_123',
          role: 'admin',
          permissions: ['admin_access']
        }
      });

      const middleware = withEnterpriseAuth(authFunction);
      const wrappedHandler = middleware(mockHandler);

      const result = await wrappedHandler(mockRequest, mockResponse);

      expect(authFunction).toHaveBeenCalledWith(mockRequest);
      expect(mockHandler).toHaveBeenCalledWith(mockRequest, mockResponse);
      expect(mockRequest.enterpriseAuth).toBeDefined();
    });

    it('debe retornar error si autenticación falla', async () => {
      const mockRequest = { query: {}, headers: {} } as any;
      const mockResponse = { 
        status: jest.fn().mockReturnThis(), 
        json: jest.fn(),
        setHeader: jest.fn()
      };
      const mockHandler = jest.fn();

      const authFunction = jest.fn().mockResolvedValue({
        success: false,
        error: 'Authentication failed',
        code: 'AUTH_FAILED',
        status: 401
      });

      const middleware = withEnterpriseAuth(authFunction);
      const wrappedHandler = middleware(mockHandler);

      await wrappedHandler(mockRequest, mockResponse);

      expect(authFunction).toHaveBeenCalledWith(mockRequest);
      expect(mockHandler).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Authentication failed',
          code: 'AUTH_FAILED',
          enterprise: true
        })
      );
    });
  });
});
