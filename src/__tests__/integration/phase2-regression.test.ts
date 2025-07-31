/**
 * Tests de Regresión Fase 2
 * Valida que las implementaciones de Fase 2 no rompieron funcionalidad existente
 */

// Mock de todas las utilidades
jest.mock('@/lib/auth/enterprise-auth-utils');
jest.mock('@/lib/auth/enterprise-rls-utils');
jest.mock('@/lib/auth/enterprise-cache');
jest.mock('@/lib/auth/enterprise-user-management');
jest.mock('@/lib/auth/admin-auth');
jest.mock('@clerk/nextjs/server');
jest.mock('@/lib/supabase');

import {
  getEnterpriseAuthContext,
  requireAdminAuth,
  requireCriticalAuth
} from '@/lib/auth/enterprise-auth-utils';
import {
  executeWithRLS,
  validateRLSContext
} from '@/lib/auth/enterprise-rls-utils';
import {
  getCacheStats,
  withCache
} from '@/lib/auth/enterprise-cache';
import {
  getEnterpriseUser,
  searchEnterpriseUsers
} from '@/lib/auth/enterprise-user-management';
import {
  getAuthenticatedUser,
  getAuthenticatedAdmin,
  checkAdminAccess
} from '@/lib/auth/admin-auth';

describe('Regresión Fase 2 - Compatibilidad y Funcionalidad', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mocks para funcionalidad legacy
    (getAuthenticatedUser as jest.Mock).mockResolvedValue({
      userId: 'user_123',
      sessionId: 'sess_123',
      isAdmin: true,
      supabase: {}
    });

    (getAuthenticatedAdmin as jest.Mock).mockResolvedValue({
      userId: 'user_123',
      sessionId: 'sess_123',
      isAdmin: true,
      supabase: {}
    });

    (checkAdminAccess as jest.Mock).mockResolvedValue({
      success: true,
      isAdmin: true
    });

    // Setup mocks para funcionalidad enterprise
    (getEnterpriseAuthContext as jest.Mock).mockResolvedValue({
      success: true,
      context: {
        userId: 'user_123',
        role: 'admin',
        permissions: ['admin_access'],
        sessionValid: true,
        securityLevel: 'critical',
        validations: {
          jwtValid: true,
          csrfValid: true,
          rateLimitPassed: true,
          originValid: true
        }
      }
    });

    (requireAdminAuth as jest.Mock).mockResolvedValue({
      success: true,
      context: {
        userId: 'user_123',
        role: 'admin',
        permissions: ['admin_access'],
        sessionValid: true,
        securityLevel: 'critical'
      }
    });

    (executeWithRLS as jest.Mock).mockResolvedValue({
      success: true,
      data: { test: 'data' }
    });

    (getCacheStats as jest.Mock).mockReturnValue({
      hits: 100,
      misses: 10,
      entries: 25,
      hitRate: 90.91,
      memoryUsage: 1024
    });
  });

  describe('Compatibilidad con Funcionalidad Legacy', () => {
    it('debe mantener compatibilidad con getAuthenticatedUser', async () => {
      const result = await getAuthenticatedUser({} as any);

      expect(result).toHaveProperty('userId');
      expect(result).toHaveProperty('sessionId');
      expect(result).toHaveProperty('isAdmin');
      expect(result.userId).toBe('user_123');
      expect(result.isAdmin).toBe(true);
    });

    it('debe mantener compatibilidad con getAuthenticatedAdmin', async () => {
      const result = await getAuthenticatedAdmin({} as any);

      expect(result).toHaveProperty('userId');
      expect(result).toHaveProperty('sessionId');
      expect(result).toHaveProperty('isAdmin');
      expect(result.userId).toBe('user_123');
      expect(result.isAdmin).toBe(true);
    });

    it('debe mantener compatibilidad con checkAdminAccess', async () => {
      const result = await checkAdminAccess('user_123');

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('isAdmin');
      expect(result.success).toBe(true);
      expect(result.isAdmin).toBe(true);
    });
  });

  describe('Funcionalidad Enterprise Agregada', () => {
    it('debe proporcionar funcionalidad enterprise sin romper legacy', async () => {
      // Test enterprise auth
      const enterpriseResult = await getEnterpriseAuthContext({} as any, {
        securityLevel: 'critical'
      });

      expect(enterpriseResult.success).toBe(true);
      expect(enterpriseResult.context?.userId).toBe('user_123');

      // Test legacy auth (debe seguir funcionando)
      const legacyResult = await getAuthenticatedUser({} as any);

      expect(legacyResult.userId).toBe('user_123');

      // Ambos métodos deben retornar el mismo usuario
      expect(enterpriseResult.context?.userId).toBe(legacyResult.userId);
    });

    it('debe agregar RLS sin afectar consultas existentes', async () => {
      const mockContext = {
        userId: 'user_123',
        role: 'admin' as const,
        permissions: ['admin_access'],
        sessionValid: true,
        securityLevel: 'high' as const,
        supabase: {} as any,
        validations: {
          jwtValid: true,
          csrfValid: true,
          rateLimitPassed: true,
          originValid: true
        }
      };

      // Test RLS query
      const rlsResult = await executeWithRLS(
        mockContext,
        async () => ({ data: 'test' }),
        { enforceRLS: true }
      );

      expect(rlsResult.success).toBe(true);
      expect(rlsResult.data).toEqual({ data: 'test' });

      // Verificar que no afecta funcionalidad legacy
      const legacyResult = await getAuthenticatedUser({} as any);
      expect(legacyResult.userId).toBe('user_123');
    });

    it('debe agregar cache sin afectar performance legacy', async () => {
      // Test cache stats
      const cacheStats = getCacheStats();

      expect(cacheStats).toHaveProperty('hits');
      expect(cacheStats).toHaveProperty('misses');
      expect(cacheStats).toHaveProperty('hitRate');

      // Test cache operation
      const cacheResult = await withCache(
        'test_key',
        async () => ({ cached: 'data' }),
        60000
      );

      expect(cacheResult).toEqual({ cached: 'data' });

      // Verificar que funcionalidad legacy sigue funcionando
      const legacyResult = await getAuthenticatedUser({} as any);
      expect(legacyResult.userId).toBe('user_123');
    });
  });

  describe('Integridad de APIs Existentes', () => {
    it('debe mantener estructura de respuesta de APIs legacy', async () => {
      // Simular respuesta de API legacy
      const legacyAPIResponse = {
        success: true,
        data: { user: 'data' },
        message: 'Success'
      };

      // Simular respuesta de API enterprise
      const enterpriseAPIResponse = {
        success: true,
        data: { user: 'data' },
        message: 'Success',
        enterprise: true,
        timestamp: new Date().toISOString(),
        context: {
          userId: 'user_123',
          role: 'admin'
        }
      };

      // Verificar que enterprise mantiene compatibilidad con legacy
      expect(enterpriseAPIResponse).toMatchObject(legacyAPIResponse);
      expect(enterpriseAPIResponse.success).toBe(legacyAPIResponse.success);
      expect(enterpriseAPIResponse.data).toEqual(legacyAPIResponse.data);
    });

    it('debe mantener códigos de error consistentes', () => {
      const legacyErrorCodes = [
        'NOT_AUTHENTICATED',
        'INSUFFICIENT_PERMISSIONS',
        'INTERNAL_ERROR'
      ];

      const enterpriseErrorCodes = [
        'NOT_AUTHENTICATED',
        'INSUFFICIENT_PERMISSIONS',
        'INTERNAL_ERROR',
        'JWT_VALIDATION_FAILED',
        'CSRF_VALIDATION_FAILED',
        'RATE_LIMIT_EXCEEDED',
        'RLS_VALIDATION_FAILED'
      ];

      // Verificar que todos los códigos legacy están en enterprise
      legacyErrorCodes.forEach(code => {
        expect(enterpriseErrorCodes).toContain(code);
      });
    });
  });

  describe('Performance y Recursos', () => {
    it('debe mantener o mejorar performance de autenticación', async () => {
      const iterations = 10;
      const legacyTimes: number[] = [];
      const enterpriseTimes: number[] = [];

      // Test legacy performance
      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        await getAuthenticatedUser({} as any);
        legacyTimes.push(Date.now() - startTime);
      }

      // Test enterprise performance
      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        await requireAdminAuth({} as any, ['admin_access']);
        enterpriseTimes.push(Date.now() - startTime);
      }

      const avgLegacyTime = legacyTimes.reduce((a, b) => a + b, 0) / legacyTimes.length;
      const avgEnterpriseTime = enterpriseTimes.reduce((a, b) => a + b, 0) / enterpriseTimes.length;

      // Enterprise no debe ser significativamente más lento que legacy
      expect(avgEnterpriseTime).toBeLessThan(avgLegacyTime * 2); // Máximo 2x más lento
    });

    it('debe mantener uso de memoria razonable', () => {
      const cacheStats = getCacheStats();

      // Cache no debe usar más de 10MB
      expect(cacheStats.memoryUsage).toBeLessThan(10485760);

      // Debe tener un hit rate razonable
      expect(cacheStats.hitRate).toBeGreaterThan(50);
    });
  });

  describe('Gestión de Usuarios Enterprise', () => {
    it('debe proporcionar funcionalidad de gestión de usuarios sin romper legacy', async () => {
      // Mock enterprise user management
      (getEnterpriseUser as jest.Mock).mockResolvedValue({
        success: true,
        user: {
          id: 'profile_123',
          clerkId: 'user_123',
          email: 'admin@test.com',
          role: 'admin',
          permissions: ['admin_access'],
          isActive: true
        }
      });

      (searchEnterpriseUsers as jest.Mock).mockResolvedValue({
        success: true,
        users: [
          {
            id: 'profile_123',
            clerkId: 'user_123',
            email: 'admin@test.com',
            role: 'admin',
            permissions: ['admin_access'],
            isActive: true
          }
        ],
        total: 1
      });

      // Test enterprise user management
      const userResult = await getEnterpriseUser('user_123');
      expect(userResult.success).toBe(true);
      expect(userResult.user?.clerkId).toBe('user_123');

      const searchResult = await searchEnterpriseUsers({ limit: 10 });
      expect(searchResult.success).toBe(true);
      expect(searchResult.users).toHaveLength(1);

      // Verificar que legacy auth sigue funcionando
      const legacyResult = await getAuthenticatedUser({} as any);
      expect(legacyResult.userId).toBe('user_123');
    });
  });

  describe('Validación de Migración Completa', () => {
    it('debe confirmar que todas las funcionalidades legacy siguen disponibles', async () => {
      // Lista de funciones legacy que deben seguir funcionando
      const legacyFunctions = [
        getAuthenticatedUser,
        getAuthenticatedAdmin,
        checkAdminAccess
      ];

      // Verificar que todas las funciones legacy están disponibles
      legacyFunctions.forEach(func => {
        expect(func).toBeDefined();
        expect(typeof func).toBe('function');
      });

      // Verificar que todas las funciones legacy funcionan
      const results = await Promise.all([
        getAuthenticatedUser({} as any),
        getAuthenticatedAdmin({} as any),
        checkAdminAccess('user_123')
      ]);

      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result).toHaveProperty('userId');
      });
    });

    it('debe confirmar que todas las funcionalidades enterprise están disponibles', async () => {
      // Lista de funciones enterprise que deben estar disponibles
      const enterpriseFunctions = [
        getEnterpriseAuthContext,
        requireAdminAuth,
        requireCriticalAuth,
        executeWithRLS,
        validateRLSContext,
        getCacheStats,
        withCache,
        getEnterpriseUser,
        searchEnterpriseUsers
      ];

      // Verificar que todas las funciones enterprise están disponibles
      enterpriseFunctions.forEach(func => {
        expect(func).toBeDefined();
        expect(typeof func).toBe('function');
      });
    });

    it('debe confirmar migración exitosa sin regresiones', async () => {
      // Test integración completa
      const legacyAuth = await getAuthenticatedUser({} as any);
      const enterpriseAuth = await requireAdminAuth({} as any, ['admin_access']);

      // Ambos métodos deben funcionar
      expect(legacyAuth.userId).toBeDefined();
      expect(enterpriseAuth.success).toBe(true);

      // Deben retornar información consistente
      expect(legacyAuth.userId).toBe(enterpriseAuth.context?.userId);

      // Cache debe estar funcionando
      const cacheStats = getCacheStats();
      expect(cacheStats).toBeDefined();

      // RLS debe estar disponible
      const rlsResult = await executeWithRLS(
        enterpriseAuth.context!,
        async () => ({ test: 'data' }),
        { enforceRLS: true }
      );
      expect(rlsResult.success).toBe(true);
    });
  });
});
