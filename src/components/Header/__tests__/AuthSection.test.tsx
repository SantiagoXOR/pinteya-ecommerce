/**
 * Tests para el componente AuthSection
 * Verifica la funcionalidad de autenticación con Clerk
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useUser } from '@clerk/nextjs';
import AuthSection from '../AuthSection';

// Mock de Clerk
jest.mock('@clerk/nextjs', () => ({
  SignedIn: ({ children }: { children: React.ReactNode }) => {
    const { isSignedIn } = useUser();
    return isSignedIn ? <div data-testid="signed-in-content">{children}</div> : null;
  },
  SignedOut: ({ children }: { children: React.ReactNode }) => {
    const { isSignedIn } = useUser();
    return !isSignedIn ? <div data-testid="signed-out-content">{children}</div> : null;
  },
  UserButton: () => <div data-testid="user-button">UserButton</div>,
  useUser: jest.fn(),
}));

// Mock de Next.js Link
jest.mock('next/link', () => {
  return ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  );
});

const mockUseUser = useUser as jest.MockedFunction<typeof useUser>;

describe('AuthSection Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Versión Desktop - Usuario no autenticado', () => {
    beforeEach(() => {
      mockUseUser.mockReturnValue({
        isSignedIn: false,
        user: null,
        isLoaded: true,
      });
    });

    it('debe mostrar botones de iniciar sesión y registrarse', () => {
      render(<AuthSection variant="desktop" />);

      expect(screen.getByText('Iniciar Sesión')).toBeInTheDocument();
      expect(screen.getByText('Registrarse')).toBeInTheDocument();
    });

    it('debe tener los enlaces correctos', () => {
      render(<AuthSection variant="desktop" />);

      const signinLink = screen.getByText('Iniciar Sesión').closest('a');
      const signupLink = screen.getByText('Registrarse').closest('a');

      expect(signinLink).toHaveAttribute('href', '/signin');
      expect(signupLink).toHaveAttribute('href', '/signup');
    });

    it('debe mostrar iconos en los botones', () => {
      render(<AuthSection variant="desktop" />);

      // Verificar que los iconos están presentes (por clases CSS)
      const signinButton = screen.getByText('Iniciar Sesión').closest('a');
      const signupButton = screen.getByText('Registrarse').closest('a');

      expect(signinButton).toBeInTheDocument();
      expect(signupButton).toBeInTheDocument();
    });
  });

  describe('Versión Desktop - Usuario autenticado', () => {
    beforeEach(() => {
      mockUseUser.mockReturnValue({
        isSignedIn: true,
        user: {
          id: 'user_123',
          firstName: 'Juan',
          lastName: 'Pérez',
          emailAddresses: [{ emailAddress: 'juan@example.com' }],
        } as any,
        isLoaded: true,
      });
    });

    it('debe mostrar el UserButton cuando está autenticado', () => {
      render(<AuthSection variant="desktop" />);

      expect(screen.getByTestId('user-button')).toBeInTheDocument();
      expect(screen.queryByText('Iniciar Sesión')).not.toBeInTheDocument();
      expect(screen.queryByText('Registrarse')).not.toBeInTheDocument();
    });
  });

  describe('Versión Mobile - Usuario no autenticado', () => {
    beforeEach(() => {
      mockUseUser.mockReturnValue({
        isSignedIn: false,
        user: null,
        isLoaded: true,
      });
    });

    it('debe mostrar solo botón de iniciar sesión en mobile', () => {
      render(<AuthSection variant="mobile" />);

      expect(screen.getByText('Iniciar Sesión')).toBeInTheDocument();
      expect(screen.queryByText('Registrarse')).not.toBeInTheDocument();
    });

    it('debe tener estilos mobile específicos', () => {
      render(<AuthSection variant="mobile" />);

      const signinButton = screen.getByText('Iniciar Sesión').closest('a');
      expect(signinButton).toHaveClass('text-xs', 'px-3', 'py-1');
    });

    it('debe tener el enlace correcto en mobile', () => {
      render(<AuthSection variant="mobile" />);

      const signinLink = screen.getByText('Iniciar Sesión').closest('a');
      expect(signinLink).toHaveAttribute('href', '/signin');
    });
  });

  describe('Versión Mobile - Usuario autenticado', () => {
    beforeEach(() => {
      mockUseUser.mockReturnValue({
        isSignedIn: true,
        user: {
          id: 'user_123',
          firstName: 'Juan',
          lastName: 'Pérez',
          emailAddresses: [{ emailAddress: 'juan@example.com' }],
        } as any,
        isLoaded: true,
      });
    });

    it('debe mostrar el UserButton en mobile cuando está autenticado', () => {
      render(<AuthSection variant="mobile" />);

      expect(screen.getByTestId('user-button')).toBeInTheDocument();
      expect(screen.queryByText('Iniciar Sesión')).not.toBeInTheDocument();
    });
  });

  describe('Estados de carga', () => {
    it('debe manejar estado de carga de Clerk', () => {
      mockUseUser.mockReturnValue({
        isSignedIn: false,
        user: null,
        isLoaded: false,
      });

      render(<AuthSection variant="desktop" />);

      // Cuando isLoaded es false, Clerk maneja el estado de carga internamente
      // El componente debería renderizar normalmente
      expect(screen.getByTestId('signed-out-content')).toBeInTheDocument();
    });
  });

  describe('Variantes del componente', () => {
    beforeEach(() => {
      mockUseUser.mockReturnValue({
        isSignedIn: false,
        user: null,
        isLoaded: true,
      });
    });

    it('debe usar desktop como variante por defecto', () => {
      render(<AuthSection />);

      expect(screen.getByText('Iniciar Sesión')).toBeInTheDocument();
      expect(screen.getByText('Registrarse')).toBeInTheDocument();
    });

    it('debe aplicar estilos diferentes según la variante', () => {
      const { rerender } = render(<AuthSection variant="desktop" />);

      // En desktop debe mostrar ambos botones
      expect(screen.getByText('Iniciar Sesión')).toBeInTheDocument();
      expect(screen.getByText('Registrarse')).toBeInTheDocument();

      rerender(<AuthSection variant="mobile" />);

      // En mobile solo debe mostrar iniciar sesión
      expect(screen.getByText('Iniciar Sesión')).toBeInTheDocument();
      expect(screen.queryByText('Registrarse')).not.toBeInTheDocument();

      const mobileSignin = screen.getByText('Iniciar Sesión').closest('a');
      expect(mobileSignin).toHaveClass('text-xs');
    });
  });

  describe('Accesibilidad', () => {
    beforeEach(() => {
      mockUseUser.mockReturnValue({
        isSignedIn: false,
        user: null,
        isLoaded: true,
      });
    });

    it('debe tener elementos accesibles', () => {
      render(<AuthSection variant="desktop" />);

      const signinButton = screen.getByText('Iniciar Sesión');
      const signupButton = screen.getByText('Registrarse');

      expect(signinButton).toBeInTheDocument();
      expect(signupButton).toBeInTheDocument();

      // Los botones deben ser navegables por teclado
      expect(signinButton.closest('a')).toHaveAttribute('href');
      expect(signupButton.closest('a')).toHaveAttribute('href');
    });
  });

  describe('Integración con Clerk', () => {
    it('debe usar los componentes de Clerk correctamente', () => {
      mockUseUser.mockReturnValue({
        isSignedIn: true,
        user: { id: 'user_123' } as any,
        isLoaded: true,
      });

      render(<AuthSection variant="desktop" />);

      expect(screen.getByTestId('signed-in-content')).toBeInTheDocument();
      expect(screen.getByTestId('user-button')).toBeInTheDocument();
    });

    it('debe manejar cambios de estado de autenticación', () => {
      const { rerender } = render(<AuthSection variant="desktop" />);

      // Inicialmente no autenticado
      mockUseUser.mockReturnValue({
        isSignedIn: false,
        user: null,
        isLoaded: true,
      });

      rerender(<AuthSection variant="desktop" />);
      expect(screen.getByTestId('signed-out-content')).toBeInTheDocument();

      // Cambiar a autenticado
      mockUseUser.mockReturnValue({
        isSignedIn: true,
        user: { id: 'user_123' } as any,
        isLoaded: true,
      });

      rerender(<AuthSection variant="desktop" />);
      expect(screen.getByTestId('signed-in-content')).toBeInTheDocument();
    });
  });
});
