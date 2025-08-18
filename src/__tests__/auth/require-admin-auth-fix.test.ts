// ===================================
// PINTEYA E-COMMERCE - TEST PARA VERIFICAR CORRECCIÓN requireAdminAuth
// ===================================

import { NextRequest } from 'next/server';

// Mock completo de supabase-auth-utils
jest.mock('@/lib/auth/supabase-auth-utils', () => ({
  requireAdminAuth: jest.fn(),
}));

// Mock de getAuthenticatedAdmin
jest.mock('@/lib/auth/admin-auth', () => ({
  getAuthenticatedAdmin: jest.fn(),
}));

const mockGetAuthenticatedAdmin = getAuthenticatedAdmin as jest.MockedFunction<typeof getAuthenticatedAdmin>;

describe('requireAdminAuth - Corrección Error 401', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn(); // Silenciar logs en tests
    console.warn = jest.fn();
  });

  it('debe usar getAuthenticatedAdmin corregida y autorizar admin correctamente', async () => {
    // Mock de usuario admin válido
    mockGetAuthenticatedAdmin.mockResolvedValue({
      userId: 'user_admin123',
      sessionId: 'sess_123',
      isAdmin: true,
      user: {
        id: 'user_admin123',
        email: 'santiago@xor.com.ar'
      }
    });

    const mockRequest = new NextRequest('https://example.com/api/admin/monitoring');
    const result = await requireAdminAuth(mockRequest);

    expect(result).toEqual({
      success: true,
      user: {
        id: 'user_admin123',
        email: 'santiago@xor.com.ar',
        role: 'admin',
        permissions: {}
      },
      supabase: undefined,
      isAdmin: true
    });

    expect(mockGetAuthenticatedAdmin).toHaveBeenCalledWith(mockRequest);
  });

  it('debe rechazar usuario no autenticado', async () => {
    // Mock de usuario no autenticado
    mockGetAuthenticatedAdmin.mockResolvedValue({
      userId: null,
      isAdmin: false,
      error: 'Usuario no autenticado',
      status: 401
    });

    const mockRequest = new NextRequest('https://example.com/api/admin/monitoring');
    const result = await requireAdminAuth(mockRequest);

    expect(result).toEqual({
      success: false,
      error: 'Usuario no autenticado',
      status: 401
    });
  });

  it('debe rechazar usuario autenticado pero no admin', async () => {
    // Mock de usuario regular (no admin)
    mockGetAuthenticatedAdmin.mockResolvedValue({
      userId: 'user_regular123',
      isAdmin: false,
      user: {
        id: 'user_regular123',
        email: 'user@example.com'
      }
    });

    const mockRequest = new NextRequest('https://example.com/api/admin/monitoring');
    const result = await requireAdminAuth(mockRequest);

    expect(result).toEqual({
      success: false,
      error: 'Acceso denegado: se requiere rol de administrador',
      status: 403
    });
  });

  it('debe manejar errores de getAuthenticatedAdmin', async () => {
    // Mock de error en getAuthenticatedAdmin
    mockGetAuthenticatedAdmin.mockRejectedValue(new Error('Clerk API error'));

    const mockRequest = new NextRequest('https://example.com/api/admin/monitoring');
    const result = await requireAdminAuth(mockRequest);

    expect(result).toEqual({
      success: false,
      error: 'Error interno del servidor',
      status: 500
    });
  });

  it('debe manejar usuario admin sin objeto user completo', async () => {
    // Mock de admin con datos mínimos
    mockGetAuthenticatedAdmin.mockResolvedValue({
      userId: 'user_admin123',
      isAdmin: true,
      user: undefined // Sin objeto user completo
    });

    const mockRequest = new NextRequest('https://example.com/api/admin/monitoring');
    const result = await requireAdminAuth(mockRequest);

    expect(result).toEqual({
      success: true,
      user: {
        id: 'user_admin123',
        email: 'unknown',
        role: 'admin',
        permissions: {}
      },
      supabase: undefined,
      isAdmin: true
    });
  });
});

describe('requireAdminAuth - Integración con APIs de Monitoreo', () => {
  it('debe funcionar correctamente para /api/admin/monitoring', async () => {
    mockGetAuthenticatedAdmin.mockResolvedValue({
      userId: 'user_admin123',
      isAdmin: true,
      user: {
        id: 'user_admin123',
        email: 'santiago@xor.com.ar'
      }
    });

    const mockRequest = new NextRequest('https://pinteya.com/api/admin/monitoring');
    const result = await requireAdminAuth(mockRequest);

    expect(result.success).toBe(true);
    expect(result.user?.role).toBe('admin');
  });

  it('debe funcionar correctamente para /api/admin/monitoring/enterprise-metrics', async () => {
    mockGetAuthenticatedAdmin.mockResolvedValue({
      userId: 'user_admin123',
      isAdmin: true,
      user: {
        id: 'user_admin123',
        email: 'santiago@xor.com.ar'
      }
    });

    const mockRequest = new NextRequest('https://pinteya.com/api/admin/monitoring/enterprise-metrics');
    const result = await requireAdminAuth(mockRequest, ['admin_access', 'monitoring_access']);

    expect(result.success).toBe(true);
    expect(result.isAdmin).toBe(true);
  });
});

describe('requireAdminAuth - Verificación de Regresión', () => {
  it('NO debe usar la función getAuthenticatedUser antigua (que esperaba Bearer token)', async () => {
    // Este test verifica que ya no se use la función que esperaba Bearer tokens
    mockGetAuthenticatedAdmin.mockResolvedValue({
      userId: 'user_admin123',
      isAdmin: true,
      user: {
        id: 'user_admin123',
        email: 'santiago@xor.com.ar'
      }
    });

    const mockRequest = new NextRequest('https://pinteya.com/api/admin/monitoring');
    // NO agregar header Authorization - debe funcionar con cookies de sesión
    
    const result = await requireAdminAuth(mockRequest);

    expect(result.success).toBe(true);
    expect(mockGetAuthenticatedAdmin).toHaveBeenCalledWith(mockRequest);
  });
});
