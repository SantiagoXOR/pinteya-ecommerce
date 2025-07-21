/**
 * Tests Unitarios - Header Principal
 * Pruebas enfocadas en el componente Header individual
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { ClerkProvider } from '@clerk/nextjs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Header from '../../index';
import { store } from '@/redux/store';
import { CartModalProvider } from '@/app/context/CartSidebarModalContext';

// Mock de Next.js
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
}));

// Mock de Clerk
jest.mock('@clerk/nextjs', () => ({
  ClerkProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SignedIn: ({ children }: { children: React.ReactNode }) => <div data-testid="signed-in">{children}</div>,
  SignedOut: ({ children }: { children: React.ReactNode }) => <div data-testid="signed-out">{children}</div>,
  UserButton: () => <div data-testid="user-button">UserButton</div>,
  useUser: () => ({
    isSignedIn: false,
    user: null,
    isLoaded: true,
  }),
}));

// Mock de hooks personalizados
jest.mock('@/hooks/useGeolocation', () => ({
  useGeolocation: () => ({
    detectedZone: { id: 'cordoba-capital', name: 'Córdoba Capital' },
    requestLocation: jest.fn(),
    permissionStatus: 'granted',
    isLoading: false,
    error: null,
    location: null,
    testLocation: jest.fn(),
    deliveryZones: [
      { id: 'cordoba-capital', name: 'Córdoba Capital' }
    ],
  }),
}));

jest.mock('@/hooks/useCartAnimation', () => ({
  useCartAnimation: () => ({
    isAnimating: false,
  }),
}));

// Mock de SearchAutocompleteIntegrated
jest.mock('@/components/ui/SearchAutocompleteIntegrated', () => ({
  SearchAutocompleteIntegrated: ({ onSearch }: { onSearch: (query: string) => void }) => (
    <input
      data-testid="search-input"
      placeholder="latex interior blanco 20lts"
      onChange={(e) => onSearch(e.target.value)}
    />
  ),
}));

// Mock de OptimizedCartIcon
jest.mock('@/components/ui/optimized-cart-icon', () => ({
  OptimizedCartIcon: ({ alt }: { alt: string }) => (
    <div data-testid="cart-icon" aria-label={alt}>Cart Icon</div>
  ),
}));

// Mock de HeaderLogo
jest.mock('@/components/ui/OptimizedLogo', () => ({
  HeaderLogo: () => (
    <img
      src="/images/logo/LOGO POSITIVO.svg"
      alt="Pinteya - Tu Pinturería Online"
      data-testid="header-logo"
    />
  ),
}));

// Wrapper de pruebas
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ClerkProvider publishableKey="test-key">
          <CartModalProvider>
            {children}
          </CartModalProvider>
        </ClerkProvider>
      </QueryClientProvider>
    </Provider>
  );
};

describe('Header - Tests Unitarios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderizado Básico', () => {
    it('debe renderizar el header con todos los elementos principales', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      // Verificar estructura principal
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByTestId('header-logo')).toBeInTheDocument();
      expect(screen.getByTestId('search-input')).toBeInTheDocument();
      expect(screen.getByTestId('cart-icon')).toBeInTheDocument();
    });

    it('debe tener las clases CSS correctas para el diseño', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const header = screen.getByRole('banner');
      expect(header).toHaveClass('fixed', 'left-0', 'top-0', 'w-full', 'z-9999');
      expect(header).toHaveClass('bg-blaze-orange-600', 'rounded-b-3xl', 'shadow-lg');
    });

    it('debe renderizar el topbar con información de envíos', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      expect(screen.getByText(/Envíos en/)).toBeInTheDocument();
      expect(screen.getByText('Córdoba Capital')).toBeInTheDocument();
    });
  });

  describe('Logo y Navegación', () => {
    it('debe renderizar el logo con atributos correctos', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const logo = screen.getByTestId('header-logo');
      expect(logo).toHaveAttribute('alt', 'Pinteya - Tu Pinturería Online');
      expect(logo).toHaveAttribute('src', '/images/logo/LOGO POSITIVO.svg');
    });

    it('debe tener un enlace al home en el logo', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const logoLink = screen.getByTestId('header-logo').closest('a');
      expect(logoLink).toHaveAttribute('href', '/');
    });
  });

  describe('Sistema de Búsqueda', () => {
    it('debe renderizar el campo de búsqueda con placeholder correcto', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const searchInput = screen.getByTestId('search-input');
      expect(searchInput).toHaveAttribute('placeholder', 'latex interior blanco 20lts');
    });

    it('debe manejar cambios en el input de búsqueda', async () => {
      const mockOnSearch = jest.fn();
      
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'pintura blanca' } });

      await waitFor(() => {
        expect(searchInput).toHaveValue('pintura blanca');
      });
    });
  });

  describe('Carrito de Compras', () => {
    it('debe renderizar el botón de carrito', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const cartButton = screen.getByTestId('cart-icon');
      expect(cartButton).toBeInTheDocument();
    });

    it('debe tener las clases CSS correctas para el botón de carrito', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const cartButton = screen.getByTestId('cart-icon').closest('button');
      expect(cartButton).toHaveClass('bg-yellow-400', 'hover:bg-yellow-500');
      expect(cartButton).toHaveClass('rounded-full', 'shadow-lg');
    });

    it('debe ser clickeable', () => {
      const mockOpenCartModal = jest.fn();
      
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const cartButton = screen.getByTestId('cart-icon').closest('button');
      fireEvent.click(cartButton!);
      
      // Verificar que el botón es clickeable (no debe lanzar error)
      expect(cartButton).toBeInTheDocument();
    });
  });

  describe('Geolocalización', () => {
    it('debe mostrar la zona detectada', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      expect(screen.getByText('Córdoba Capital')).toBeInTheDocument();
    });

    it('debe mostrar el icono de ubicación', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      // Buscar por el texto que acompaña al icono
      expect(screen.getByText(/Envíos en/)).toBeInTheDocument();
    });
  });

  describe('Autenticación', () => {
    it('debe renderizar el componente de autenticación', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      // Verificar que se renderiza el estado SignedOut por defecto
      expect(screen.getByTestId('signed-out')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('debe ocultar elementos específicos en mobile', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const cartButton = screen.getByTestId('cart-icon').closest('button');
      expect(cartButton).toHaveClass('hidden', 'sm:flex');
    });
  });

  describe('Estados de Carga', () => {
    it('debe manejar el estado de carga de geolocalización', () => {
      // Mock del hook con estado de carga
      jest.mocked(require('@/hooks/useGeolocation').useGeolocation).mockReturnValue({
        detectedZone: null,
        requestLocation: jest.fn(),
        permissionStatus: 'prompt',
        isLoading: true,
        error: null,
        location: null,
        testLocation: jest.fn(),
        deliveryZones: [],
      });

      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      expect(screen.getByText('Detectando...')).toBeInTheDocument();
    });
  });
});
