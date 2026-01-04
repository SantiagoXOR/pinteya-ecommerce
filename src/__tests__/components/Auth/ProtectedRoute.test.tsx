// ===================================
// PINTEYA E-COMMERCE - TESTS PARA PROTECTEDROUTE COMPONENT
// ===================================

import React from 'react'
import { screen, waitFor, act } from '@testing-library/react'
import ProtectedRoute from '@/components/Auth/ProtectedRoute'
import { renderWithProviders } from '@/__tests__/utils/test-utils'
import { useRouter } from 'next/navigation'

// Mock next/navigation
const mockPush = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  })),
}))

// Mock useAuth hook
const mockUseAuth = {
  isLoaded: true,
  isSignedIn: false,
  user: null,
}

jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(() => mockUseAuth),
}))

beforeEach(() => {
  jest.clearAllMocks()
  mockPush.mockClear()
  mockUseAuth.isLoaded = true
  mockUseAuth.isSignedIn = false
  mockUseAuth.user = null
})

describe('ProtectedRoute Component', () => {
  it('should render children when user is authenticated', async () => {
    mockUseAuth.isSignedIn = true
    mockUseAuth.user = {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
    }

    await act(async () => {
      renderWithProviders(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>,
        {
          authState: 'authenticated',
        }
      )
    })

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('should redirect to signin when user is not authenticated', async () => {
    mockUseAuth.isSignedIn = false
    mockUseAuth.isLoaded = true

    await act(async () => {
      renderWithProviders(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>,
        {
          authState: 'unauthenticated',
        }
      )
    })

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/signin')
    })
  })

  it('should show fallback while loading', async () => {
    mockUseAuth.isLoaded = false
    mockUseAuth.isSignedIn = false

    await act(async () => {
      renderWithProviders(
        <ProtectedRoute fallback={<div>Loading...</div>}>
          <div>Protected Content</div>
        </ProtectedRoute>,
        {
          authState: 'loading',
        }
      )
    })

    // Verificar que se muestra el fallback durante la carga
    expect(screen.getByText('Loading...')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('should show default loading spinner when no fallback provided', async () => {
    mockUseAuth.isLoaded = false
    mockUseAuth.isSignedIn = false

    await act(async () => {
      renderWithProviders(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>,
        {
          authState: 'loading',
        }
      )
    })

    // Verificar que se muestra el spinner por defecto
    const spinner = screen.queryByRole('status') || document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('should show access denied message when not authenticated', async () => {
    mockUseAuth.isSignedIn = false
    mockUseAuth.isLoaded = true

    await act(async () => {
      renderWithProviders(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>,
        {
          authState: 'unauthenticated',
        }
      )
    })

    // Verificar que se muestra el mensaje de acceso restringido
    expect(screen.getByText(/acceso restringido|restricted access/i)).toBeInTheDocument()
    expect(screen.getByText(/necesitas iniciar sesión|you need to sign in/i)).toBeInTheDocument()
  })

  it('should show sign in button when not authenticated', async () => {
    mockUseAuth.isSignedIn = false
    mockUseAuth.isLoaded = true

    await act(async () => {
      renderWithProviders(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>,
        {
          authState: 'unauthenticated',
        }
      )
    })

    // Buscar botón de iniciar sesión
    const signInButton = screen.getByRole('button', { name: /iniciar sesión|sign in/i })
    expect(signInButton).toBeInTheDocument()
  })

  it('should use custom fallback when provided', async () => {
    mockUseAuth.isLoaded = false
    mockUseAuth.isSignedIn = false

    await act(async () => {
      renderWithProviders(
        <ProtectedRoute fallback={<div>Custom Loading...</div>}>
          <div>Protected Content</div>
        </ProtectedRoute>,
        {
          authState: 'loading',
        }
      )
    })

    expect(screen.getByText('Custom Loading...')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('should handle authentication state changes', async () => {
    // Inicialmente no autenticado
    mockUseAuth.isSignedIn = false
    mockUseAuth.isLoaded = true

    const { rerender } = await act(async () => {
      return renderWithProviders(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>,
        {
          authState: 'unauthenticated',
        }
      )
    })

    // Verificar redirección
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/signin')
    })

    // Cambiar a autenticado
    mockUseAuth.isSignedIn = true
    mockUseAuth.user = {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
    }

    await act(async () => {
      rerender(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      )
    })

    // Verificar que ahora se muestra el contenido
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })
})



