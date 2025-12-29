// ===================================
// PINTEYA E-COMMERCE - TESTS PARA SIGNINFORM COMPONENT
// ===================================

import React from 'react'
import { screen, fireEvent, waitFor, act } from '@testing-library/react'
import { SignInForm } from '@/components/Auth/SignInForm'
import { renderWithProviders } from '@/__tests__/utils/test-utils'
import { signIn } from 'next-auth/react'

// Mock next/navigation
const mockGet = jest.fn()

jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(() => ({
    get: mockGet,
    getAll: jest.fn(),
    has: jest.fn(),
    keys: jest.fn(),
    values: jest.fn(),
    entries: jest.fn(),
    forEach: jest.fn(),
    toString: jest.fn(() => ''),
  })),
}))

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
}))

beforeEach(() => {
  jest.clearAllMocks()
  mockGet.mockReturnValue(null)
})

describe('SignInForm Component', () => {
  it('should render sign in form', async () => {
    await act(async () => {
      renderWithProviders(<SignInForm />, {
        authState: 'unauthenticated',
      })
    })

    // Verificar que se renderiza el formulario
    expect(screen.getByRole('heading', { name: /bienvenido|welcome/i })).toBeInTheDocument()
    expect(screen.getByText(/inicia sesión|sign in/i)).toBeInTheDocument()
  })

  it('should display Google sign in button', async () => {
    await act(async () => {
      renderWithProviders(<SignInForm />, {
        authState: 'unauthenticated',
      })
    })

    // Buscar botón de Google usando texto accesible
    const googleButton = screen.getByRole('button', { name: /continuar con google|sign in with google/i })
    expect(googleButton).toBeInTheDocument()
  })

  it('should handle Google sign in click', async () => {
    const mockSignIn = signIn as jest.MockedFunction<typeof signIn>
    mockSignIn.mockResolvedValue({ ok: true, error: null, status: 200, url: '/' })

    await act(async () => {
      renderWithProviders(<SignInForm />, {
        authState: 'unauthenticated',
      })
    })

    const googleButton = screen.getByRole('button', { name: /continuar con google|sign in with google/i })
    
    await act(async () => {
      fireEvent.click(googleButton)
    })

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('google', { callbackUrl: '/' })
    })
  })

  it('should display loading state during sign in', async () => {
    const mockSignIn = signIn as jest.MockedFunction<typeof signIn>
    // Simular un delay en la respuesta
    mockSignIn.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ ok: true, error: null, status: 200, url: '/' }), 100)))

    await act(async () => {
      renderWithProviders(<SignInForm />, {
        authState: 'unauthenticated',
      })
    })

    const googleButton = screen.getByRole('button', { name: /continuar con google|sign in with google/i })
    
    await act(async () => {
      fireEvent.click(googleButton)
    })

    // Verificar que se muestra el estado de carga
    expect(screen.getByText(/iniciando sesión|signing in/i)).toBeInTheDocument()
  })

  it('should display error message from URL params', async () => {
    mockGet.mockImplementation((key: string) => {
      if (key === 'error') return 'OAuthSignin'
      if (key === 'callbackUrl') return '/dashboard'
      return null
    })

    await act(async () => {
      renderWithProviders(<SignInForm />, {
        authState: 'unauthenticated',
      })
    })

    // Verificar que se muestra el mensaje de error
    expect(screen.getByText(/error al conectar con google/i)).toBeInTheDocument()
  })

  it('should use callbackUrl from search params', async () => {
    const mockSignIn = signIn as jest.MockedFunction<typeof signIn>
    mockSignIn.mockResolvedValue({ ok: true, error: null, status: 200, url: '/dashboard' })

    mockGet.mockImplementation((key: string) => {
      if (key === 'callbackUrl') return '/dashboard'
      return null
    })

    await act(async () => {
      renderWithProviders(<SignInForm />, {
        authState: 'unauthenticated',
      })
    })

    const googleButton = screen.getByRole('button', { name: /continuar con google|sign in with google/i })
    
    await act(async () => {
      fireEvent.click(googleButton)
    })

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('google', { callbackUrl: '/dashboard' })
    })
  })

  it('should display security features', async () => {
    await act(async () => {
      renderWithProviders(<SignInForm />, {
        authState: 'unauthenticated',
      })
    })

    // Verificar que se muestran las características de seguridad
    expect(screen.getByText(/autenticación segura|secure authentication/i)).toBeInTheDocument()
    expect(screen.getByText(/protección de datos|data protection/i)).toBeInTheDocument()
    expect(screen.getByText(/acceso rápido|quick access/i)).toBeInTheDocument()
  })

  it('should display terms and privacy links', async () => {
    await act(async () => {
      renderWithProviders(<SignInForm />, {
        authState: 'unauthenticated',
      })
    })

    // Verificar que se muestran los enlaces de términos y privacidad
    expect(screen.getByText(/términos de servicio|terms of service/i)).toBeInTheDocument()
    expect(screen.getByText(/política de privacidad|privacy policy/i)).toBeInTheDocument()
  })

  it('should handle different error types', async () => {
    const errorTypes = [
      { code: 'OAuthCallback', message: /error en la autenticación/i },
      { code: 'OAuthCreateAccount', message: /no se pudo crear tu cuenta/i },
      { code: 'CredentialsSignin', message: /credenciales incorrectas/i },
      { code: 'AccessDenied', message: /acceso denegado/i },
    ]

    for (const { code, message } of errorTypes) {
      mockGet.mockImplementation((key: string) => {
        if (key === 'error') return code
        return null
      })

      const { unmount } = await act(async () => {
        return renderWithProviders(<SignInForm />, {
          authState: 'unauthenticated',
        })
      })

      expect(screen.getByText(message)).toBeInTheDocument()
      
      unmount()
    }
  })

  it('should disable button during loading', async () => {
    const mockSignIn = signIn as jest.MockedFunction<typeof signIn>
    mockSignIn.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ ok: true, error: null, status: 200, url: '/' }), 100)))

    await act(async () => {
      renderWithProviders(<SignInForm />, {
        authState: 'unauthenticated',
      })
    })

    const googleButton = screen.getByRole('button', { name: /continuar con google|sign in with google/i })
    
    await act(async () => {
      fireEvent.click(googleButton)
    })

    // Verificar que el botón está deshabilitado durante la carga
    expect(googleButton).toBeDisabled()
  })
})

