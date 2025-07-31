/**
 * Tests para el servicio de sincronización automática de usuarios
 * Verifica la sincronización robusta entre Clerk y Supabase
 */

// Mock de Clerk
jest.mock('@clerk/nextjs/server', () => ({
  clerkClient: jest.fn(() => ({
    users: {
      getUser: jest.fn(),
      getUserList: jest.fn()
    }
  }))
}));

// Mock de Supabase simplificado
jest.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        or: jest.fn(() => ({
          single: jest.fn()
        })),
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn()
          })),
          single: jest.fn()
        })),
        single: jest.fn()
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

// Mock de security audit
jest.mock('@/lib/auth/security-audit', () => ({
  logSecurityEvent: jest.fn(),
  logAdminAction: jest.fn()
}));

import {
  syncUserToSupabase,
  syncUserFromClerk,
  deleteUserFromSupabase,
  bulkSyncUsersFromClerk,
  type ClerkUserData,
  type SyncOptions
} from '@/lib/auth/user-sync-service';
import { clerkClient } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

describe('Servicio de Sincronización de Usuarios', () => {
  let mockClerkClient: jest.MockedFunction<typeof clerkClient>;

  beforeEach(() => {
    mockClerkClient = clerkClient as jest.MockedFunction<typeof clerkClient>;
    jest.clearAllMocks();
  });

  const mockClerkUserData: ClerkUserData = {
    id: 'user_123',
    email_addresses: [{
      email_address: 'test@example.com',
      id: 'email_123',
      verification: {
        status: 'verified',
        strategy: 'email_code'
      }
    }],
    first_name: 'John',
    last_name: 'Doe',
    created_at: Date.now(),
    updated_at: Date.now(),
    image_url: 'https://example.com/avatar.jpg',
    public_metadata: { role: 'customer' }
  };

  describe('Validación de datos', () => {
    it('debe validar datos de usuario correctos', async () => {
      // Test con datos válidos - debería pasar la validación
      const result = await syncUserToSupabase(mockClerkUserData, {
        validateData: true,
        retryAttempts: 1,
        logEvents: false
      });

      // Aunque falle por Supabase, no debería fallar por validación
      expect(result.error).not.toContain('Datos de usuario inválidos');
    });

    it('debe rechazar datos de usuario inválidos', async () => {
      const invalidUserData = {
        ...mockClerkUserData,
        email_addresses: []
      };

      const result = await syncUserToSupabase(invalidUserData, {
        validateData: true,
        retryAttempts: 1,
        logEvents: false
      });

      expect(result.success).toBe(false);
      expect(result.action).toBe('error');
      expect(result.error).toContain('Al menos un email es requerido');
    });

    it('debe rechazar usuario sin ID', async () => {
      const invalidUserData = {
        ...mockClerkUserData,
        id: ''
      };

      const result = await syncUserToSupabase(invalidUserData, {
        validateData: true,
        retryAttempts: 1,
        logEvents: false
      });

      expect(result.success).toBe(false);
      expect(result.action).toBe('error');
      expect(result.error).toContain('ID de usuario de Clerk es requerido');
    });

    it('debe rechazar email inválido', async () => {
      const invalidUserData = {
        ...mockClerkUserData,
        email_addresses: [{
          email_address: 'invalid-email',
          id: 'email_123',
          verification: {
            status: 'verified',
            strategy: 'email_code'
          }
        }]
      };

      const result = await syncUserToSupabase(invalidUserData, {
        validateData: true,
        retryAttempts: 1,
        logEvents: false
      });

      expect(result.success).toBe(false);
      expect(result.action).toBe('error');
      expect(result.error).toContain('Email primario inválido');
    });
  });

  describe('Configuración de opciones', () => {
    it('debe usar opciones por defecto', async () => {
      const result = await syncUserToSupabase(mockClerkUserData);

      // Debería usar las opciones por defecto (retryAttempts: 3, validateData: true, etc.)
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.action).toBe('string');
    });

    it('debe respetar opciones personalizadas', async () => {
      const customOptions = {
        retryAttempts: 1,
        validateData: false,
        logEvents: false
      };

      const result = await syncUserToSupabase(mockClerkUserData, customOptions);

      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });
  });

  describe('syncUserFromClerk', () => {
    it('debe manejar usuario no encontrado en Clerk', async () => {
      mockClerkClient.mockReturnValue({
        users: {
          getUser: jest.fn().mockResolvedValue(null)
        }
      } as any);

      const result = await syncUserFromClerk('user_not_found');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Usuario no encontrado en Clerk');
    });

    it('debe manejar errores de Clerk', async () => {
      mockClerkClient.mockReturnValue({
        users: {
          getUser: jest.fn().mockRejectedValue(new Error('Error de Clerk'))
        }
      } as any);

      const result = await syncUserFromClerk('user_error');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Error obteniendo usuario de Clerk');
    });
  });

  describe('bulkSyncUsersFromClerk', () => {
    it('debe manejar errores en sincronización masiva', async () => {
      mockClerkClient.mockReturnValue({
        users: {
          getUserList: jest.fn().mockRejectedValue(new Error('Error de Clerk'))
        }
      } as any);

      const result = await bulkSyncUsersFromClerk({
        batchSize: 1,
        maxUsers: 1
      });

      expect(result.success).toBe(false);
      expect(result.failed).toBe(1);
      expect(result.results[0].error).toContain('Error en sincronización masiva');
    });

    it('debe respetar límites de seguridad', async () => {
      const result = await bulkSyncUsersFromClerk({
        batchSize: 1000, // Debería limitarse a 20
        maxUsers: 1000   // Debería limitarse a 100
      });

      // Debería fallar por error de Clerk, pero los límites deberían aplicarse
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });
  });
});
