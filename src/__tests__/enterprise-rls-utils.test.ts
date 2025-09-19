/**
 * Tests para las Utilidades RLS Enterprise
 * Verifica que Row Level Security funciona correctamente con las utilidades enterprise
 */

// Mock de Supabase
jest.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn()
        }))
      }))
    }))
  }
}));

// Mock de createClient de Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        }))
      }))
    }))
  }))
}));

import {
  validateRLSContext,
  createUserSupabaseClient,
  executeWithRLS,
  checkRLSPermission,
  createRLSFilters,
  withRLS
} from '@/lib/auth/enterprise-rls-utils';
import type { EnterpriseAuthContext } from '@/lib/auth/enterprise-auth-utils';
import { supabaseAdmin } from '@/lib/integrations/supabase';
import { createClient } from '@supabase/supabase-js';

describe('Utilidades RLS Enterprise', () => {
  let mockEnterpriseContext: EnterpriseAuthContext;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock enterprise context
    mockEnterpriseContext = {
      userId: 'user_123',
      sessionId: 'sess_123',
      email: 'admin@test.com',
      role: 'admin',
      permissions: ['admin_access', 'products_create', 'products_read'],
      sessionValid: true,
      securityLevel: 'critical',
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
      supabase: supabaseAdmin,
      validations: {
        jwtValid: true,
        csrfValid: true,
        rateLimitPassed: true,
        originValid: true
      }
    };

    // Mock Supabase admin response
    (supabaseAdmin.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'profile_123',
              supabase_user_id: 'supabase_123',
              clerk_user_id: 'user_123',
              role_id: 1,
              permissions: ['admin_access', 'products_create'],
              is_active: true,
              user_roles: { role_name: 'admin' }
            },
            error: null
          })
        })
      })
    });
  });

  describe('validateRLSContext', () => {
    it('debe validar contexto RLS para usuario admin', async () => {
      const result = await validateRLSContext(mockEnterpriseContext);

      expect(result.valid).toBe(true);
      expect(result.context).toBeDefined();
      expect(result.context?.userId).toBe('user_123');
      expect(result.context?.role).toBe('admin');
      expect(result.context?.permissions).toContain('admin_access');
      expect(result.context?.isActive).toBe(true);
    });

    it('debe fallar si usuario está inactivo', async () => {
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'profile_123',
                is_active: false,
                user_roles: { role_name: 'user' }
              },
              error: null
            })
          })
        })
      });

      const result = await validateRLSContext(mockEnterpriseContext);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Usuario inactivo o no encontrado');
      expect(result.code).toBe('USER_INACTIVE');
    });

    it('debe fallar si hay error en Supabase', async () => {
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' }
            })
          })
        })
      });

      const result = await validateRLSContext(mockEnterpriseContext);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Error obteniendo perfil de usuario');
      expect(result.code).toBe('PROFILE_ERROR');
    });
  });

  describe('createUserSupabaseClient', () => {
    it('debe crear cliente Supabase con contexto de usuario', () => {
      // Mock environment variables
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

      const client = createUserSupabaseClient('supabase_123', 'access-token');

      expect(client).toBeDefined();
      expect(createClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-anon-key',
        expect.objectContaining({
          auth: {
            autoRefreshToken: false,
            persistSession: false
          },
          global: {
            headers: {
              'X-User-ID': 'supabase_123',
              'Authorization': 'Bearer access-token'
            }
          }
        })
      );
    });

    it('debe retornar null si configuración no está disponible', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const client = createUserSupabaseClient('supabase_123');

      expect(client).toBeNull();
    });
  });

  describe('executeWithRLS', () => {
    it('debe ejecutar consulta con RLS habilitado', async () => {
      // Mock environment variables para createUserSupabaseClient
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

      const mockQueryFunction = jest.fn().mockResolvedValue({
        products: [{ id: 1, name: 'Test Product' }],
        total: 1
      });

      const result = await executeWithRLS(
        mockEnterpriseContext,
        mockQueryFunction,
        { enforceRLS: true, auditLog: true }
      );

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(mockQueryFunction).toHaveBeenCalled();
    });

    it('debe usar cliente admin para bypass RLS si es admin', async () => {
      const mockQueryFunction = jest.fn().mockResolvedValue({ data: 'test' });

      const result = await executeWithRLS(
        mockEnterpriseContext,
        mockQueryFunction,
        { bypassRLS: true }
      );

      expect(result.success).toBe(true);
      expect(mockQueryFunction).toHaveBeenCalledWith(
        supabaseAdmin,
        expect.objectContaining({ role: 'admin' })
      );
    });

    it('debe fallar si validación RLS falla', async () => {
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'User not found' }
            })
          })
        })
      });

      const mockQueryFunction = jest.fn();

      const result = await executeWithRLS(
        mockEnterpriseContext,
        mockQueryFunction
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Error obteniendo perfil de usuario');
      expect(mockQueryFunction).not.toHaveBeenCalled();
    });
  });

  describe('checkRLSPermission', () => {
    it('debe permitir acceso a admin siempre', () => {
      const rlsContext = {
        userId: 'user_123',
        role: 'admin' as const,
        permissions: [],
        isActive: true
      };

      const hasPermission = checkRLSPermission(rlsContext, 'any_permission');

      expect(hasPermission).toBe(true);
    });

    it('debe permitir acceso si usuario tiene permiso específico', () => {
      const rlsContext = {
        userId: 'user_123',
        role: 'user' as const,
        permissions: ['products_read'],
        isActive: true
      };

      const hasPermission = checkRLSPermission(rlsContext, 'products_read');

      expect(hasPermission).toBe(true);
    });

    it('debe permitir acceso si usuario es propietario del recurso', () => {
      const rlsContext = {
        userId: 'user_123',
        role: 'user' as const,
        permissions: [],
        isActive: true
      };

      const hasPermission = checkRLSPermission(rlsContext, 'edit_profile', 'user_123');

      expect(hasPermission).toBe(true);
    });

    it('debe denegar acceso si no tiene permisos', () => {
      const rlsContext = {
        userId: 'user_123',
        role: 'user' as const,
        permissions: ['basic_access'],
        isActive: true
      };

      const hasPermission = checkRLSPermission(rlsContext, 'admin_access');

      expect(hasPermission).toBe(false);
    });
  });

  describe('createRLSFilters', () => {
    it('debe crear filtros para user_profiles para usuario normal', () => {
      const rlsContext = {
        userId: 'user_123',
        role: 'user' as const,
        permissions: [],
        isActive: true
      };

      const filters = createRLSFilters(rlsContext, 'user_profiles');

      expect(filters).toEqual({
        clerk_user_id: 'user_123'
      });
    });

    it('debe crear filtros para products para usuario normal', () => {
      const rlsContext = {
        userId: 'user_123',
        role: 'user' as const,
        permissions: [],
        isActive: true
      };

      const filters = createRLSFilters(rlsContext, 'products');

      expect(filters).toEqual({
        is_active: true
      });
    });

    it('no debe crear filtros para admin', () => {
      const rlsContext = {
        userId: 'user_123',
        role: 'admin' as const,
        permissions: ['admin_access'],
        isActive: true
      };

      const filters = createRLSFilters(rlsContext, 'products');

      expect(filters).toEqual({});
    });

    it('debe crear filtros para orders para usuario normal', () => {
      const rlsContext = {
        userId: 'user_123',
        role: 'user' as const,
        permissions: [],
        isActive: true
      };

      const filters = createRLSFilters(rlsContext, 'orders');

      expect(filters).toEqual({
        user_id: 'user_123'
      });
    });
  });

  describe('withRLS middleware', () => {
    it('debe ejecutar handler si contexto enterprise está disponible', async () => {
      const mockRequest = {
        enterpriseAuth: mockEnterpriseContext
      } as any;
      const mockResponse = { status: jest.fn(), json: jest.fn() };
      const mockHandler = jest.fn().mockResolvedValue({ success: true });

      const middleware = withRLS();
      const wrappedHandler = middleware(mockHandler);

      const result = await wrappedHandler(mockRequest, mockResponse);

      expect(mockHandler).toHaveBeenCalledWith(mockRequest, mockResponse);
      expect(mockRequest.rlsContext).toBeDefined();
    });

    it('debe retornar error si contexto enterprise no está disponible', async () => {
      const mockRequest = {} as any;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockHandler = jest.fn();

      const middleware = withRLS();
      const wrappedHandler = middleware(mockHandler);

      const result = await wrappedHandler(mockRequest, mockResponse);

      expect(mockHandler).not.toHaveBeenCalled();

      // Para App Router, verifica que retorna Response
      if (result && typeof result === 'object' && 'status' in result) {
        expect(result.status).toBe(401);
      } else {
        // Para Pages Router, verifica que llama a response methods
        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            error: 'Contexto enterprise no disponible',
            code: 'NO_ENTERPRISE_CONTEXT'
          })
        );
      }
    });
  });
});









