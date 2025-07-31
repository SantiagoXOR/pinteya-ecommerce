/**
 * Tests para las validaciones de seguridad avanzadas
 * Verifica permisos granulares y contexto de seguridad
 */

import { NextRequest } from 'next/server';
import type { NextApiRequest } from 'next';

// Mock de Clerk
jest.mock('@clerk/nextjs/server', () => ({
  clerkClient: jest.fn(() => ({
    users: {
      getUser: jest.fn()
    }
  }))
}));

// Mock de Supabase
jest.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(() => ({
      insert: jest.fn(() => ({ error: null })),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          gte: jest.fn(() => ({
            not: jest.fn(() => ({ data: [], error: null }))
          }))
        }))
      }))
    }))
  }
}));

import {
  getPermissionsByRole,
  isValidAdminRole,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getSecurityContext,
  validateSecurityContext,
  validateProductPermissions,
  withSecurityValidation
} from '@/lib/auth/security-validations';
import { clerkClient } from '@clerk/nextjs/server';

describe('Validaciones de Seguridad', () => {
  let mockClerkClient: jest.MockedFunction<typeof clerkClient>;

  beforeEach(() => {
    mockClerkClient = clerkClient as jest.MockedFunction<typeof clerkClient>;
    jest.clearAllMocks();
  });

  describe('getPermissionsByRole', () => {
    it('debe retornar permisos completos para admin', () => {
      const permissions = getPermissionsByRole('admin');
      
      expect(permissions.isAdmin).toBe(true);
      expect(permissions.canDeleteProducts).toBe(true);
      expect(permissions.canManageUsers).toBe(true);
      expect(permissions.canAccessAdmin).toBe(true);
    });

    it('debe retornar permisos limitados para moderator', () => {
      const permissions = getPermissionsByRole('moderator');
      
      expect(permissions.isAdmin).toBe(false);
      expect(permissions.isModerator).toBe(true);
      expect(permissions.canDeleteProducts).toBe(false);
      expect(permissions.canManageUsers).toBe(false);
      expect(permissions.canAccessAdmin).toBe(true);
    });

    it('debe retornar permisos básicos para manager', () => {
      const permissions = getPermissionsByRole('manager');
      
      expect(permissions.isAdmin).toBe(false);
      expect(permissions.isModerator).toBe(false);
      expect(permissions.canDeleteProducts).toBe(false);
      expect(permissions.canAccessAdmin).toBe(true);
      expect(permissions.canViewAnalytics).toBe(true);
    });

    it('debe retornar sin permisos para user', () => {
      const permissions = getPermissionsByRole('user');
      
      expect(permissions.isAdmin).toBe(false);
      expect(permissions.canAccessAdmin).toBe(false);
      expect(permissions.canReadProducts).toBe(false);
    });

    it('debe retornar permisos de user para rol desconocido', () => {
      const permissions = getPermissionsByRole('unknown_role');
      
      expect(permissions.isAdmin).toBe(false);
      expect(permissions.canAccessAdmin).toBe(false);
    });
  });

  describe('isValidAdminRole', () => {
    it('debe validar roles administrativos', () => {
      expect(isValidAdminRole('admin')).toBe(true);
      expect(isValidAdminRole('moderator')).toBe(true);
      expect(isValidAdminRole('manager')).toBe(true);
    });

    it('debe rechazar roles no administrativos', () => {
      expect(isValidAdminRole('user')).toBe(false);
      expect(isValidAdminRole('guest')).toBe(false);
      expect(isValidAdminRole('')).toBe(false);
    });
  });

  describe('hasPermission', () => {
    it('debe verificar permisos individuales correctamente', () => {
      const adminPermissions = getPermissionsByRole('admin');
      const userPermissions = getPermissionsByRole('user');

      expect(hasPermission(adminPermissions, 'canDeleteProducts')).toBe(true);
      expect(hasPermission(userPermissions, 'canDeleteProducts')).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    it('debe verificar que al menos un permiso esté presente', () => {
      const moderatorPermissions = getPermissionsByRole('moderator');

      expect(hasAnyPermission(moderatorPermissions, ['canDeleteProducts', 'canWriteProducts'])).toBe(true);
      expect(hasAnyPermission(moderatorPermissions, ['canDeleteProducts', 'canManageUsers'])).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    it('debe verificar que todos los permisos estén presentes', () => {
      const adminPermissions = getPermissionsByRole('admin');
      const moderatorPermissions = getPermissionsByRole('moderator');

      expect(hasAllPermissions(adminPermissions, ['canReadProducts', 'canWriteProducts'])).toBe(true);
      expect(hasAllPermissions(moderatorPermissions, ['canReadProducts', 'canDeleteProducts'])).toBe(false);
    });
  });

  describe('getSecurityContext', () => {
    it('debe obtener contexto de seguridad completo', async () => {
      const mockUser = {
        id: 'user_123',
        publicMetadata: {
          role: 'admin',
          department: 'IT',
          isActive: true
        },
        emailAddresses: [{
          verification: { status: 'verified' }
        }]
      };

      mockClerkClient.mockReturnValue({
        users: {
          getUser: jest.fn().mockResolvedValue(mockUser)
        }
      } as any);

      const mockRequest = {
        headers: {
          get: jest.fn().mockImplementation((key) => {
            if (key === 'x-forwarded-for') return '192.168.1.1';
            if (key === 'user-agent') return 'Test Browser';
            return null;
          })
        }
      } as any;

      const context = await getSecurityContext('user_123', mockRequest);

      expect(context).toBeDefined();
      expect(context?.userId).toBe('user_123');
      expect(context?.userRole).toBe('admin');
      expect(context?.permissions.isAdmin).toBe(true);
      expect(context?.metadata.emailVerified).toBe(true);
      expect(context?.ipAddress).toBe('192.168.1.1');
      expect(context?.userAgent).toBe('Test Browser');
    });

    it('debe manejar usuario no encontrado', async () => {
      mockClerkClient.mockReturnValue({
        users: {
          getUser: jest.fn().mockResolvedValue(null)
        }
      } as any);

      const context = await getSecurityContext('user_not_found');

      expect(context).toBeNull();
    });

    it('debe manejar errores de Clerk', async () => {
      mockClerkClient.mockReturnValue({
        users: {
          getUser: jest.fn().mockRejectedValue(new Error('Clerk error'))
        }
      } as any);

      const context = await getSecurityContext('user_error');

      expect(context).toBeNull();
    });
  });

  describe('validateSecurityContext', () => {
    beforeEach(() => {
      const mockUser = {
        id: 'user_123',
        publicMetadata: {
          role: 'admin',
          isActive: true
        },
        emailAddresses: [{
          verification: { status: 'verified' }
        }]
      };

      mockClerkClient.mockReturnValue({
        users: {
          getUser: jest.fn().mockResolvedValue(mockUser)
        }
      } as any);
    });

    it('debe validar contexto exitosamente para admin', async () => {
      const result = await validateSecurityContext(
        'user_123',
        'PRODUCT_DELETE',
        ['canDeleteProducts']
      );

      expect(result.valid).toBe(true);
      expect(result.context).toBeDefined();
      expect(result.context?.permissions.canDeleteProducts).toBe(true);
    });

    it('debe rechazar permisos insuficientes', async () => {
      const mockUser = {
        id: 'user_123',
        publicMetadata: {
          role: 'user',
          isActive: true
        },
        emailAddresses: [{
          verification: { status: 'verified' }
        }]
      };

      mockClerkClient.mockReturnValue({
        users: {
          getUser: jest.fn().mockResolvedValue(mockUser)
        }
      } as any);

      const result = await validateSecurityContext(
        'user_123',
        'PRODUCT_DELETE',
        ['canDeleteProducts']
      );

      expect(result.valid).toBe(false);
      expect(result.code).toBe('INSUFFICIENT_PERMISSIONS');
      expect(result.severity).toBe('high');
    });

    it('debe rechazar usuario inactivo', async () => {
      const mockUser = {
        id: 'user_123',
        publicMetadata: {
          role: 'admin',
          isActive: false
        },
        emailAddresses: [{
          verification: { status: 'verified' }
        }]
      };

      mockClerkClient.mockReturnValue({
        users: {
          getUser: jest.fn().mockResolvedValue(mockUser)
        }
      } as any);

      const result = await validateSecurityContext(
        'user_123',
        'PRODUCT_READ',
        ['canReadProducts']
      );

      expect(result.valid).toBe(false);
      expect(result.code).toBe('USER_INACTIVE');
      expect(result.severity).toBe('medium');
    });
  });

  describe('validateProductPermissions', () => {
    beforeEach(() => {
      const mockUser = {
        id: 'user_123',
        publicMetadata: {
          role: 'admin',
          isActive: true
        },
        emailAddresses: [{
          verification: { status: 'verified' }
        }]
      };

      mockClerkClient.mockReturnValue({
        users: {
          getUser: jest.fn().mockResolvedValue(mockUser)
        }
      } as any);
    });

    it('debe validar permisos de lectura', async () => {
      const result = await validateProductPermissions('user_123', 'read');

      expect(result.valid).toBe(true);
    });

    it('debe validar permisos de creación', async () => {
      const result = await validateProductPermissions('user_123', 'create');

      expect(result.valid).toBe(true);
    });

    it('debe validar permisos de eliminación', async () => {
      const result = await validateProductPermissions('user_123', 'delete');

      expect(result.valid).toBe(true);
    });
  });

  describe('withSecurityValidation wrapper', () => {
    it('debe crear wrapper funcional', () => {
      const mockHandler = jest.fn();
      const wrappedHandler = withSecurityValidation(['canReadProducts'], 'PRODUCT_READ')(mockHandler);

      expect(typeof wrappedHandler).toBe('function');
    });

    it('debe rechazar request sin userId', async () => {
      const mockHandler = jest.fn();
      const wrappedHandler = withSecurityValidation(['canReadProducts'], 'PRODUCT_READ')(mockHandler);

      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue(null)
        }
      } as any;

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await wrappedHandler(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Usuario no autenticado',
        code: 'AUTH_REQUIRED'
      });
    });
  });
});
