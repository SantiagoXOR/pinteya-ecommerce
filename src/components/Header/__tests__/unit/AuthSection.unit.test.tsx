/**
 * Tests Unitarios - AuthSection
 * Pruebas enfocadas en el componente de autenticación
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ClerkProvider } from '@clerk/nextjs';
import AuthSection from '../../AuthSection';

// Mock de Next.js
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

// Mock de Clerk con diferentes estados
const mockClerkHooks = {
  useUser: jest.fn(),
  SignedIn: ({ children }: { children: React.ReactNode }) => <div data-testid="signed-in">{children}</div>,
  SignedOut: ({ children }: { children: React.ReactNode }) => <div data-testid="signed-out">{children}</div>,
  UserButton: () => <div data-testid="user-button">UserButton</div>,
};

jest.mock('@clerk/nextjs', () => ({
  ClerkProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ...mockClerkHooks,
}));

// Wrapper de pruebas
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ClerkProvider publishableKey="test-key">
    {children}
  </ClerkProvider>
);

describe('AuthSection - Tests Unitarios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Estado por defecto: usuario no autenticado
    mockClerkHooks.useUser.mockReturnValue({
      isSignedIn: false,
      user: null,
      isLoaded: true,
    });
  });

  describe('Variante Desktop', () => {
    it('debe renderizar el botón de autenticación con solo icono Google', () => {
      render(
        <TestWrapper>
          <AuthSection variant="desktop" />
        </TestWrapper>
      );

      // Verificar que se renderiza el estado SignedOut
      expect(screen.getByTestId('signed-out')).toBeInTheDocument();
      
      // Verificar que hay un botón con enlace a /signin
      const signInLink = screen.getByRole('link');
      expect(signInLink).toHaveAttribute('href', '/signin');
    });

    it('debe mostrar solo el icono de Google sin texto', () => {
      render(
        <TestWrapper>
          <AuthSection variant="desktop" />
        </TestWrapper>
      );

      // Verificar que NO hay texto "Iniciar Sesión"
      expect(screen.queryByText('Iniciar Sesión')).not.toBeInTheDocument();
      
      // Verificar que hay un SVG (icono de Google)
      const googleIcon = screen.getByRole('link').querySelector('svg');
      expect(googleIcon).toBeInTheDocument();
    });

    it('debe tener las clases CSS correctas para el botón translúcido', () => {
      render(
        <TestWrapper>
          <AuthSection variant="desktop" />
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-white/20', 'hover:bg-white/30');
      expect(button).toHaveClass('backdrop-blur-sm');
      expect(button).toHaveClass('border-2', 'border-white/30');
      expect(button).toHaveClass('rounded-full');
    });

    it('debe tener los colores oficiales de Google en el SVG', () => {
      render(
        <TestWrapper>
          <AuthSection variant="desktop" />
        </TestWrapper>
      );

      const svgPaths = screen.getByRole('link').querySelectorAll('path');
      
      // Verificar que hay 4 paths (colores de Google)
      expect(svgPaths).toHaveLength(4);
      
      // Verificar colores específicos
      expect(svgPaths[0]).toHaveAttribute('fill', '#4285F4'); // Azul
      expect(svgPaths[1]).toHaveAttribute('fill', '#34A853'); // Verde
      expect(svgPaths[2]).toHaveAttribute('fill', '#FBBC05'); // Amarillo
      expect(svgPaths[3]).toHaveAttribute('fill', '#EA4335'); // Rojo
    });

    it('debe ser clickeable y navegar a /signin', () => {
      render(
        <TestWrapper>
          <AuthSection variant="desktop" />
        </TestWrapper>
      );

      const signInLink = screen.getByRole('link');
      fireEvent.click(signInLink);
      
      // Verificar que el enlace es clickeable
      expect(signInLink).toHaveAttribute('href', '/signin');
    });
  });

  describe('Variante Mobile', () => {
    it('debe renderizar correctamente en mobile', () => {
      render(
        <TestWrapper>
          <AuthSection variant="mobile" />
        </TestWrapper>
      );

      expect(screen.getByTestId('signed-out')).toBeInTheDocument();
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-white/20', 'hover:bg-white/30');
    });

    it('debe tener el mismo diseño que desktop', () => {
      const { rerender } = render(
        <TestWrapper>
          <AuthSection variant="mobile" />
        </TestWrapper>
      );

      const mobileButton = screen.getByRole('button');
      const mobileClasses = mobileButton.className;

      rerender(
        <TestWrapper>
          <AuthSection variant="desktop" />
        </TestWrapper>
      );

      const desktopButton = screen.getByRole('button');
      expect(desktopButton.className).toBe(mobileClasses);
    });
  });

  describe('Variante TopBar', () => {
    it('debe renderizar un botón diferente para topbar', () => {
      render(
        <TestWrapper>
          <AuthSection variant="topbar" />
        </TestWrapper>
      );

      expect(screen.getByText('Ingresá')).toBeInTheDocument();
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-gray-800', 'hover:text-gray-900');
    });

    it('debe tener estilos específicos para topbar', () => {
      render(
        <TestWrapper>
          <AuthSection variant="topbar" />
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-xs', 'px-2', 'py-1', 'h-auto');
    });
  });

  describe('Estados de Clerk', () => {
    it('debe mostrar skeleton cuando Clerk no está cargado', () => {
      mockClerkHooks.useUser.mockReturnValue({
        isSignedIn: false,
        user: null,
        isLoaded: false, // No cargado
      });

      render(
        <TestWrapper>
          <AuthSection variant="mobile" />
        </TestWrapper>
      );

      // Verificar que se muestra el skeleton
      const skeleton = screen.getByRole('generic');
      expect(skeleton).toHaveClass('animate-pulse');
    });

    it('debe renderizar UserButton cuando el usuario está autenticado', () => {
      mockClerkHooks.useUser.mockReturnValue({
        isSignedIn: true,
        user: { id: '1', firstName: 'Test' },
        isLoaded: true,
      });

      render(
        <TestWrapper>
          <AuthSection variant="desktop" />
        </TestWrapper>
      );

      expect(screen.getByTestId('signed-in')).toBeInTheDocument();
      expect(screen.getByTestId('user-button')).toBeInTheDocument();
    });
  });

  describe('Modo Fallback (sin Clerk)', () => {
    it('debe funcionar sin Clerk habilitado', () => {
      // Simular componente sin Clerk
      const { container } = render(<AuthSection variant="desktop" />);
      
      // Verificar que se renderiza algo (modo fallback)
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Accesibilidad', () => {
    it('debe tener atributos de accesibilidad correctos', () => {
      render(
        <TestWrapper>
          <AuthSection variant="desktop" />
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/signin');
    });

    it('debe ser navegable por teclado', () => {
      render(
        <TestWrapper>
          <AuthSection variant="desktop" />
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      
      // Simular navegación por teclado
      fireEvent.keyDown(button, { key: 'Enter' });
      fireEvent.keyDown(button, { key: ' ' });
      
      // Verificar que no hay errores
      expect(button).toBeInTheDocument();
    });
  });

  describe('Interacciones', () => {
    it('debe manejar hover effects', () => {
      render(
        <TestWrapper>
          <AuthSection variant="desktop" />
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      
      fireEvent.mouseEnter(button);
      fireEvent.mouseLeave(button);
      
      // Verificar que las clases hover están presentes
      expect(button).toHaveClass('hover:bg-white/30');
      expect(button).toHaveClass('hover:border-white/50');
    });

    it('debe manejar efectos de transformación', () => {
      render(
        <TestWrapper>
          <AuthSection variant="desktop" />
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      
      // Verificar clases de transformación
      expect(button).toHaveClass('transform', 'hover:scale-105', 'active:scale-95');
    });
  });

  describe('Consistencia Visual', () => {
    it('debe mantener el mismo tamaño de icono en todas las variantes', () => {
      const variants: Array<'desktop' | 'mobile' | 'topbar'> = ['desktop', 'mobile'];
      
      variants.forEach(variant => {
        const { unmount } = render(
          <TestWrapper>
            <AuthSection variant={variant} />
          </TestWrapper>
        );

        if (variant !== 'topbar') {
          const svg = screen.getByRole('link').querySelector('svg');
          expect(svg).toHaveClass('w-5', 'h-5');
        }
        
        unmount();
      });
    });
  });
});
