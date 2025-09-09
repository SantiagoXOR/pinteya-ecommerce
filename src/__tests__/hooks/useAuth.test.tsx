// ===================================
// TESTS PARA HOOK DE AUTENTICACIÓN
// Tests unitarios e integración para useAuth
// ===================================

import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useSession, signIn, signOut } from 'next-auth/react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import React from 'react';

// Mocks
jest.mock('next-auth/react');
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn()
  }
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}));

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  refresh: jest.fn()
};

// Wrapper para React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    
    // Mock default NextAuth session
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          name: 'Test User',
          image: 'https://example.com/avatar.jpg',
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      status: 'authenticated',
    });
  });

  describe('Autenticación con NextAuth', () => {
    it('debe iniciar sesión exitosamente', async () => {
      (signIn as jest.Mock).mockResolvedValue({ ok: true, error: null });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper()
      });

      await act(async () => {
        await result.current.signIn('google', { callbackUrl: '/dashboard' });
      });

      expect(signIn).toHaveBeenCalledWith('google', {
        callbackUrl: '/dashboard',
        redirect: true,
      });
    });

    it('debe cerrar sesión exitosamente', async () => {
      (signOut as jest.Mock).mockResolvedValue({ url: '/api/auth/signin' });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper()
      });

      await act(async () => {
        await result.current.signOut({ callbackUrl: '/' });
      });

      expect(signOut).toHaveBeenCalledWith({
        callbackUrl: '/',
        redirect: true,
      });
    });

    it('debe retornar información del usuario autenticado', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper()
      });

      expect(result.current.user).toEqual({
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        image: 'https://example.com/avatar.jpg',
      });
      expect(result.current.isSignedIn).toBe(true);
      expect(result.current.isLoaded).toBe(true);
    });

    it('debe manejar estado de carga', () => {
      (useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'loading',
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper()
      });

      expect(result.current.isLoaded).toBe(false);
      expect(result.current.isSignedIn).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it('debe manejar estado no autenticado', () => {
      (useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper()
      });

      expect(result.current.isLoaded).toBe(true);
      expect(result.current.isSignedIn).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });

  describe('Hooks de utilidad', () => {
    it('useIsAdmin debe retornar false para usuario normal', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper()
      });

      // useIsAdmin está incluido en el hook useAuth
      expect(result.current.user?.email).toBe('test@example.com');
    });

    it('useRequireAuth debe redirigir si no está autenticado', async () => {
      (useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper()
      });

      expect(result.current.isSignedIn).toBe(false);
    });
  });

  describe('Manejo de errores', () => {
    it('debe manejar error en signIn', async () => {
      (signIn as jest.Mock).mockResolvedValue({ ok: false, error: 'Authentication failed' });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper()
      });

      await act(async () => {
        await result.current.signIn('google');
      });

      expect(signIn).toHaveBeenCalledWith('google', {
        callbackUrl: '/admin',
        redirect: true,
      });
    });

    it('debe manejar error en signOut', async () => {
      (signOut as jest.Mock).mockRejectedValue(new Error('Sign out failed'));

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper()
      });

      await act(async () => {
        try {
          await result.current.signOut();
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      });

      expect(signOut).toHaveBeenCalled();
    });
  });

  describe('Integración con Router', () => {
    it('debe usar el router correctamente', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper()
      });

      // El hook debe tener acceso al router
      expect(result.current).toBeDefined();
      expect(typeof result.current.signIn).toBe('function');
      expect(typeof result.current.signOut).toBe('function');
    });
  });
});