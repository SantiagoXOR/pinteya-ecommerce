// ===================================
// PINTEYA E-COMMERCE - TEST PARA VERIFICAR CORRECCIÓN ERROR 401
// ===================================

import { getAuthenticatedAdmin, getAuthenticatedUser } from '@/lib/auth/admin-auth';
import { auth } from '@/auth';

// Mocks
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
  currentUser: jest.fn(),
  getAuth: jest.fn(),
}));

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;

describe('Admin Auth 401 Fix', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn(); // Silenciar logs en tests
    console.warn = jest.fn();
  });

  describe('getAuthenticatedUser - Verificación de Roles Corregida', () => {
    it('debe verificar admin usando publicMetadata correctamente', async () => {
      // Simular usuario admin con rol en publicMetadata
      mockAuth.mockResolvedValue({
        userId: 'user_admin123',
        sessionId: 'sess_123',
        sessionClaims: {
          publicMetadata: { role: 'admin' },
          privateMetadata: {}
        }
      });

      const result = await getAuthenticatedUser();

      expect(result).toEqual({
        userId: 'user_admin123',
        sessionId: 'sess_123',
        isAdmin: true
      });
    });

    it('debe verificar admin usando privateMetadata correctamente', async () => {
      // Simular usuario admin con rol en privateMetadata
      mockAuth.mockResolvedValue({
        userId: 'user_admin123',
        sessionId: 'sess_123',
        sessionClaims: {
          publicMetadata: {},
          privateMetadata: { role: 'admin' }
        }
      });

      const result = await getAuthenticatedUser();

      expect(result).toEqual({
        userId: 'user_admin123',
        sessionId: 'sess_123',
        isAdmin: true
      });
    });

    it('debe usar fallback a currentUser cuando sessionClaims no tiene rol', async () => {
      // Simular sessionClaims sin rol
      mockAuth.mockResolvedValue({
        userId: 'user_admin123',
        sessionId: 'sess_123',
        sessionClaims: {
          publicMetadata: {},
          privateMetadata: {}
        }
      });

      // Simular currentUser con rol admin
      mockCurrentUser.mockResolvedValue({
        id: 'user_admin123',
        publicMetadata: { role: 'admin' },
        privateMetadata: {}
      });

      const result = await getAuthenticatedUser();

      expect(result).toEqual({
        userId: 'user_admin123',
        sessionId: 'sess_123',
        isAdmin: true
      });

      expect(mockCurrentUser).toHaveBeenCalled();
    });

    it('debe identificar usuario no-admin correctamente', async () => {
      // Simular usuario regular
      mockAuth.mockResolvedValue({
        userId: 'user_regular123',
        sessionId: 'sess_123',
        sessionClaims: {
          publicMetadata: { role: 'customer' },
          privateMetadata: {}
        }
      });

      // Mock currentUser para que también retorne rol no-admin
      mockCurrentUser.mockResolvedValue({
        id: 'user_regular123',
        publicMetadata: { role: 'customer' },
        privateMetadata: {}
      });

      const result = await getAuthenticatedUser();

      expect(result).toEqual({
        userId: 'user_regular123',
        sessionId: 'sess_123',
        isAdmin: false
      });
    });

    it('debe manejar usuario sin rol definido', async () => {
      // Simular usuario sin rol
      mockAuth.mockResolvedValue({
        userId: 'user_norole123',
        sessionId: 'sess_123',
        sessionClaims: {
          publicMetadata: {},
          privateMetadata: {}
        }
      });

      // Simular currentUser también sin rol
      mockCurrentUser.mockResolvedValue({
        id: 'user_norole123',
        publicMetadata: {},
        privateMetadata: {}
      });

      const result = await getAuthenticatedUser();

      expect(result).toEqual({
        userId: 'user_norole123',
        sessionId: 'sess_123',
        isAdmin: false
      });
    });

    it('debe manejar error en fallback gracefully', async () => {
      // Simular sessionClaims sin rol
      mockAuth.mockResolvedValue({
        userId: 'user_admin123',
        sessionId: 'sess_123',
        sessionClaims: {
          publicMetadata: {},
          privateMetadata: {}
        }
      });

      // Simular error en currentUser
      mockCurrentUser.mockRejectedValue(new Error('Clerk API error'));

      const result = await getAuthenticatedUser();

      expect(result).toEqual({
        userId: 'user_admin123',
        sessionId: 'sess_123',
        isAdmin: false
      });

      expect(console.warn).toHaveBeenCalledWith(
        '[AUTH] Error en fallback de verificación de admin:',
        expect.any(Error)
      );
    });
  });

  describe('getAuthenticatedAdmin - Integración Completa', () => {
    it('debe retornar admin válido cuando usuario tiene rol correcto', async () => {
      // Mock getAuthenticatedUser para retornar admin
      mockAuth.mockResolvedValue({
        userId: 'user_admin123',
        sessionId: 'sess_123',
        sessionClaims: {
          publicMetadata: { role: 'admin' },
          privateMetadata: {}
        }
      });

      const result = await getAuthenticatedAdmin();

      expect(result.userId).toBe('user_admin123');
      expect(result.isAdmin).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.status).toBeUndefined();
    });

    it('debe retornar error 401 cuando usuario no está autenticado', async () => {
      // Mock usuario no autenticado
      mockAuth.mockResolvedValue({
        userId: null,
        sessionId: null,
        sessionClaims: null
      });

      const result = await getAuthenticatedAdmin();

      expect(result.userId).toBeNull();
      expect(result.isAdmin).toBe(false);
      expect(result.error).toBe('Usuario no autenticado');
      expect(result.status).toBe(401);
    });

    it('debe retornar error 403 cuando usuario no es admin', async () => {
      // Mock usuario autenticado pero no admin
      mockAuth.mockResolvedValue({
        userId: 'user_regular123',
        sessionId: 'sess_123',
        sessionClaims: {
          publicMetadata: { role: 'customer' },
          privateMetadata: {}
        }
      });

      const result = await getAuthenticatedAdmin();

      expect(result.userId).toBe('user_regular123');
      expect(result.isAdmin).toBe(false);
      expect(result.error).toBe('Permisos de administrador requeridos');
      expect(result.status).toBe(403);
    });
  });

  describe('Casos Edge - Compatibilidad con Producción', () => {
    it('debe manejar sessionClaims null/undefined', async () => {
      mockAuth.mockResolvedValue({
        userId: 'user_123',
        sessionId: 'sess_123',
        sessionClaims: null
      });

      mockCurrentUser.mockResolvedValue({
        id: 'user_123',
        publicMetadata: { role: 'admin' },
        privateMetadata: {}
      });

      const result = await getAuthenticatedUser();

      expect(result.isAdmin).toBe(true);
      expect(mockCurrentUser).toHaveBeenCalled();
    });

    it('debe manejar metadata con valores no-string', async () => {
      mockAuth.mockResolvedValue({
        userId: 'user_123',
        sessionId: 'sess_123',
        sessionClaims: {
          publicMetadata: { role: 123 }, // Valor no-string
          privateMetadata: {}
        }
      });

      // Mock currentUser también con valor no-string
      mockCurrentUser.mockResolvedValue({
        id: 'user_123',
        publicMetadata: { role: 123 },
        privateMetadata: {}
      });

      const result = await getAuthenticatedUser();

      expect(result.isAdmin).toBe(false);
    });

    it('debe priorizar publicMetadata sobre privateMetadata', async () => {
      mockAuth.mockResolvedValue({
        userId: 'user_123',
        sessionId: 'sess_123',
        sessionClaims: {
          publicMetadata: { role: 'admin' },
          privateMetadata: { role: 'customer' }
        }
      });

      const result = await getAuthenticatedUser();

      expect(result.isAdmin).toBe(true);
    });
  });
});

describe('Regresión - Verificar que NO se usa metadata directamente', () => {
  it('NO debe usar sessionClaims.metadata.role (bug anterior)', async () => {
    // Simular el caso problemático anterior
    mockAuth.mockResolvedValue({
      userId: 'user_admin123',
      sessionId: 'sess_123',
      sessionClaims: {
        metadata: { role: 'admin' }, // Ubicación incorrecta
        publicMetadata: {},
        privateMetadata: {}
      }
    });

    mockCurrentUser.mockResolvedValue({
      id: 'user_admin123',
      publicMetadata: {},
      privateMetadata: {}
    });

    const result = await getAuthenticatedUser();

    // Debe ser false porque no está en publicMetadata/privateMetadata
    expect(result.isAdmin).toBe(false);
  });
});
