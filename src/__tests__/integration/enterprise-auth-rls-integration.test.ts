/**
 * Tests de Integración Enterprise Auth + RLS
 * Valida la integración completa entre utilidades enterprise, RLS y APIs
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
    auth: {
      admin: {
        listUsers: jest.fn(),
        createUser: jest.fn()
      }
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
          range: jest.fn(() => ({
            order: jest.fn(() => ({
              then: jest.fn()
            }))
          }))
        })),
        or: jest.fn(() => ({
          eq: jest.fn(() => ({
            range: jest.fn(() => ({
              order: jest.fn()
            }))
          }))
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn()
          }))
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

import { NextRequest } from 'next/server';
import { getAuth, auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

// Importar utilidades enterprise
import {
  getEnterpriseAuthContext,
  requireAdminAuth,
  requireCriticalAuth
} from '@/lib/auth/enterprise-auth-utils';
import {
  validateRLSContext,
  executeWithRLS,
  createRLSFilters
} from '@/lib/auth/enterprise-rls-utils';
import {
  searchEnterpriseUsers,
  getEnterpriseUser
} from '@/lib/auth/enterprise-user-management';
import {
  withCache,
  getCacheStats
} from '@/lib/auth/enterprise-cache';

describe('Integración Enterprise Auth + RLS', () => {
  let mockGetAuth: jest.MockedFunction<typeof getAuth>;
  let mockAuth: jest.MockedFunction<typeof auth>;

  beforeEach(() => {
    mockGetAuth = getAuth as jest.MockedFunction<typeof getAuth>;
    mockAuth = auth as jest.MockedFunction<typeof auth>;
    
    jest.clearAllMocks();

    // Setup environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

    // Mock Clerk auth responses
    mockGetAuth.mockReturnValue({
      userId: 'user_123',
      sessionId: 'sess_123'
    });

    mockAuth.mockResolvedValue({
      userId: 'user_123',
      sessionId: 'sess_123'
    });

    // Mock Supabase responses
    (supabaseAdmin.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'profile_123',
              supabase_user_id: 'supabase_123',
              clerk_user_id: 'user_123',
              email: 'admin@test.com',
              role_id: 1,
              permissions: ['admin_access', 'user_management', 'products_read'],
              is_active: true,
              user_roles: { role_name: 'admin' }
            },
            error: null
          })
        })
      })
    });
  });

  describe('Flujo Completo de Autenticación Enterprise', () => {
    it('debe completar flujo enterprise completo: Auth → RLS → Cache → API', async () => {
      const mockRequest = {
        query: {},
        headers: {},
        url: 'http://localhost:3000/api/test',
        method: 'GET'
      } as any;

      // 1. PASO: Autenticación Enterprise
      const authResult = await getEnterpriseAuthContext(mockRequest, {
        securityLevel: 'critical',
        enableJWTValidation: false, // Simplificar para test
        enableCSRFProtection: false,
        enableRateLimit: false
      });

      expect(authResult.success).toBe(true);
      expect(authResult.context).toBeDefined();
      expect(authResult.context?.userId).toBe('user_123');
      expect(authResult.context?.role).toBe('admin');

      // 2. PASO: Validación RLS
      const rlsValidation = await validateRLSContext(authResult.context!);
      
      expect(rlsValidation.valid).toBe(true);
      expect(rlsValidation.context?.role).toBe('admin');
      expect(rlsValidation.context?.permissions).toContain('admin_access');

      // 3. PASO: Filtros RLS
      const rlsFilters = createRLSFilters(rlsValidation.context!, 'products');
      
      // Admin no debe tener filtros restrictivos
      expect(rlsFilters).toEqual({});

      // 4. PASO: Cache Enterprise
      const cacheStats = getCacheStats();
      
      expect(cacheStats).toBeDefined();
      expect(typeof cacheStats.hits).toBe('number');
      expect(typeof cacheStats.misses).toBe('number');

      // 5. PASO: Integración completa
      expect(authResult.success && rlsValidation.valid).toBe(true);
    });

    it('debe manejar usuario normal con filtros RLS restrictivos', async () => {
      // Mock usuario normal
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'profile_456',
                clerk_user_id: 'user_456',
                email: 'user@test.com',
                role_id: 2,
                permissions: ['basic_access'],
                is_active: true,
                user_roles: { role_name: 'user' }
              },
              error: null
            })
          })
        })
      });

      mockGetAuth.mockReturnValue({
        userId: 'user_456',
        sessionId: 'sess_456'
      });

      const mockRequest = {
        query: {},
        headers: {}
      } as any;

      // 1. Autenticación
      const authResult = await getEnterpriseAuthContext(mockRequest, {
        securityLevel: 'medium',
        enableJWTValidation: false,
        enableCSRFProtection: false,
        enableRateLimit: false
      });

      expect(authResult.success).toBe(true);
      expect(authResult.context?.role).toBe('user');

      // 2. RLS para usuario normal
      const rlsValidation = await validateRLSContext(authResult.context!);
      expect(rlsValidation.valid).toBe(true);

      // 3. Filtros RLS restrictivos para usuario normal
      const productFilters = createRLSFilters(rlsValidation.context!, 'products');
      const userProfileFilters = createRLSFilters(rlsValidation.context!, 'user_profiles');
      const orderFilters = createRLSFilters(rlsValidation.context!, 'orders');

      // Usuario normal debe tener filtros restrictivos
      expect(productFilters).toEqual({ is_active: true });
      expect(userProfileFilters).toEqual({ clerk_user_id: 'user_456' });
      expect(orderFilters).toEqual({ user_id: 'user_456' });
    });
  });

  describe('Integración con APIs Enterprise', () => {
    it('debe integrar correctamente con requireAdminAuth', async () => {
      const mockRequest = { query: {}, headers: {} } as any;

      const result = await requireAdminAuth(mockRequest, ['user_management']);

      expect(result.success).toBe(true);
      expect(result.context?.permissions).toContain('user_management');
    });

    it('debe integrar correctamente con requireCriticalAuth', async () => {
      const mockRequest = { query: {}, headers: {} } as any;

      const result = await requireCriticalAuth(mockRequest);

      expect(result.success).toBe(true);
      expect(result.context?.securityLevel).toBe('critical');
    });

    it('debe ejecutar consultas con RLS correctamente', async () => {
      const mockRequest = { query: {}, headers: {} } as any;
      
      const authResult = await getEnterpriseAuthContext(mockRequest, {
        securityLevel: 'high',
        enableJWTValidation: false,
        enableCSRFProtection: false,
        enableRateLimit: false
      });

      expect(authResult.success).toBe(true);

      const queryResult = await executeWithRLS(
        authResult.context!,
        async (client, rlsContext) => {
          expect(client).toBeDefined();
          expect(rlsContext.role).toBe('admin');
          return { data: 'test' };
        },
        { enforceRLS: true, auditLog: false }
      );

      expect(queryResult.success).toBe(true);
      expect(queryResult.data).toEqual({ data: 'test' });
    });
  });

  describe('Gestión de Usuarios Enterprise', () => {
    it('debe obtener usuario enterprise correctamente', async () => {
      const result = await getEnterpriseUser('user_123');

      expect(result.success).toBe(true);
      expect(result.user?.clerkId).toBe('user_123');
      expect(result.user?.role).toBe('admin');
    });

    it('debe buscar usuarios enterprise con contexto', async () => {
      const mockContext = {
        userId: 'user_123',
        role: 'admin' as const,
        permissions: ['user_management'],
        sessionValid: true,
        securityLevel: 'high' as const,
        supabase: supabaseAdmin,
        validations: {
          jwtValid: true,
          csrfValid: true,
          rateLimitPassed: true,
          originValid: true
        }
      };

      // Mock search response
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          or: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  range: jest.fn().mockResolvedValue({
                    data: [
                      {
                        id: 'profile_123',
                        clerk_user_id: 'user_123',
                        email: 'admin@test.com',
                        role: 'admin',
                        permissions: ['admin_access'],
                        is_active: true
                      }
                    ],
                    error: null,
                    count: 1
                  })
                })
              })
            })
          })
        })
      });

      const result = await searchEnterpriseUsers({
        query: 'admin',
        limit: 10,
        offset: 0
      }, mockContext);

      expect(result.success).toBe(true);
      expect(result.users).toBeDefined();
      expect(result.total).toBe(1);
    });
  });

  describe('Cache Enterprise Integration', () => {
    it('debe usar cache correctamente en operaciones enterprise', async () => {
      const cacheKey = 'test_cache_key';
      const testData = { test: 'data' };

      const result = await withCache(
        cacheKey,
        async () => testData,
        60000 // 1 minuto
      );

      expect(result).toEqual(testData);
    });

    it('debe proporcionar estadísticas de cache', () => {
      const stats = getCacheStats();

      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
      expect(stats).toHaveProperty('entries');
      expect(stats).toHaveProperty('hitRate');
      expect(stats).toHaveProperty('memoryUsage');
    });
  });

  describe('Escenarios de Error', () => {
    it('debe manejar usuario no autenticado', async () => {
      mockGetAuth.mockReturnValue({
        userId: null,
        sessionId: null
      });

      const mockRequest = { query: {}, headers: {} } as any;

      const result = await getEnterpriseAuthContext(mockRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Usuario no autenticado');
      expect(result.code).toBe('NOT_AUTHENTICATED');
    });

    it('debe manejar usuario inactivo en RLS', async () => {
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

      const mockContext = {
        userId: 'user_123',
        role: 'user' as const,
        permissions: [],
        sessionValid: true,
        securityLevel: 'medium' as const,
        supabase: supabaseAdmin,
        validations: {
          jwtValid: true,
          csrfValid: true,
          rateLimitPassed: true,
          originValid: true
        }
      };

      const result = await validateRLSContext(mockContext);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Usuario inactivo o no encontrado');
    });

    it('debe manejar permisos insuficientes', async () => {
      const mockRequest = { query: {}, headers: {} } as any;

      // Mock usuario sin permisos admin
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'profile_123',
                role_id: 2,
                permissions: ['basic_access'],
                is_active: true,
                user_roles: { role_name: 'user' }
              },
              error: null
            })
          })
        })
      });

      const result = await requireAdminAuth(mockRequest, ['admin_access']);

      expect(result.success).toBe(false);
      expect(result.code).toBe('INSUFFICIENT_ROLE');
    });
  });
});
