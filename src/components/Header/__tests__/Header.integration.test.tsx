/**
 * Tests de integración para el Header
 * Verifica la funcionalidad completa del header mobile
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { configureStore } from '@reduxjs/toolkit';
import Header from '../index';
import { cartReducer } from '@/redux/features/cart-slice';
import { CartSidebarModalProvider } from '@/app/context/CartSidebarModalContext';

// Mock de Clerk
jest.mock('@clerk/nextjs', () => ({
  SignedIn: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="signed-in">{children}</div>
  ),
  SignedOut: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="signed-out">{children}</div>
  ),
  UserButton: () => <div data-testid="user-button">UserButton</div>,
  useUser: () => ({ isSignedIn: false, user: null, isLoaded: true }),
}));

// Mock de Next.js
jest.mock('next/link', () => {
  return ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  );
});

jest.mock('next/image', () => {
  return ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} {...props} />
  );
});

// Mock del hook de geolocalización
const mockRequestLocation = jest.fn();
const mockSelectZone = jest.fn();

jest.mock('@/hooks/useGeolocation', () => ({
  useGeolocation: () => ({
    detectedZone: { name: 'Córdoba Capital', available: true },
    requestLocation: mockRequestLocation,
    selectZone: mockSelectZone,
    permissionStatus: 'prompt',
    isLoading: false,
    error: null,
    location: null,
    getAvailableZones: () => [],
    deliveryZones: [],
  }),
}));

// Mock del componente de búsqueda
jest.mock('@/components/ui/SearchAutocompleteIntegrated', () => {
  return {
    SearchAutocompleteIntegrated: ({ placeholder, className }: any) => (
      <input
        data-testid="search-input"
        placeholder={placeholder}
        className={className}
      />
    ),
  };
});

// Mock de hooks de animación
jest.mock('@/hooks/useCartAnimation', () => ({
  useCartAnimation: () => ({ isAnimating: false }),
}));

// Setup del store de Redux
const createTestStore = () => {
  return configureStore({
    reducer: {
      cartReducer,
    },
    preloadedState: {
      cartReducer: {
        items: [],
        totalQuantity: 0,
        totalPrice: 0,
      },
    },
  });
};

// Setup del QueryClient
const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
};

// Wrapper de providers para tests
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const store = createTestStore();
  const queryClient = createTestQueryClient();

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <CartSidebarModalProvider>
          {children}
        </CartSidebarModalProvider>
      </QueryClientProvider>
    </Provider>
  );
};

describe('Header Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock window.matchMedia para responsive
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  describe('Renderizado del Header Mobile', () => {
    it('debe renderizar todos los elementos del header mobile', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      // Verificar logo
      expect(screen.getByAltText('Pinteya - Tu Pinturería Online')).toBeInTheDocument();

      // Verificar campo de búsqueda
      expect(screen.getByTestId('search-input')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('latex interior blanco 20lts')).toBeInTheDocument();

      // Verificar ubicación
      expect(screen.getByText(/Envíos en/)).toBeInTheDocument();
      expect(screen.getByText('Córdoba Capital')).toBeInTheDocument();

      // Verificar autenticación
      expect(screen.getByTestId('signed-out')).toBeInTheDocument();
    });

    it('debe tener el layout correcto en mobile', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      // Verificar que el logo y búsqueda están en la misma línea
      const logo = screen.getByAltText('Pinteya - Tu Pinturería Online');
      const searchInput = screen.getByTestId('search-input');

      expect(logo).toBeInTheDocument();
      expect(searchInput).toBeInTheDocument();
    });
  });

  describe('Funcionalidad del Logo', () => {
    it('debe ser clickeable y navegar al inicio', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const logoLink = screen.getByAltText('Pinteya - Tu Pinturería Online').closest('a');
      expect(logoLink).toHaveAttribute('href', '/');
    });

    it('debe tener el tamaño correcto (64x64px)', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const logo = screen.getByAltText('Pinteya - Tu Pinturería Online');
      expect(logo).toHaveClass('h-16', 'w-16'); // 64px = 16 * 4px
    });
  });

  describe('Campo de Búsqueda', () => {
    it('debe tener el placeholder correcto', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      expect(screen.getByPlaceholderText('latex interior blanco 20lts')).toBeInTheDocument();
    });

    it('debe tener los estilos correctos', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const searchInput = screen.getByTestId('search-input');
      expect(searchInput).toHaveClass('bg-[#fff3c5]'); // Fondo amarillo
    });
  });

  describe('Funcionalidad de Geolocalización', () => {
    it('debe mostrar la ubicación detectada', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      expect(screen.getByText('Córdoba Capital')).toBeInTheDocument();
    });

    it('debe solicitar ubicación al hacer click', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const locationButton = screen.getByText(/Envíos en/).closest('div');
      fireEvent.click(locationButton!);

      expect(mockRequestLocation).toHaveBeenCalled();
    });

    it('debe mostrar estado de carga', () => {
      // Mock del hook con estado de carga
      jest.doMock('@/hooks/useGeolocation', () => ({
        useGeolocation: () => ({
          detectedZone: null,
          requestLocation: mockRequestLocation,
          selectZone: mockSelectZone,
          permissionStatus: 'prompt',
          isLoading: true,
          error: null,
          location: null,
          getAvailableZones: () => [],
          deliveryZones: [],
        }),
      }));

      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      expect(screen.getByText('Detectando ubicación...')).toBeInTheDocument();
    });
  });

  describe('Autenticación', () => {
    it('debe mostrar botón de iniciar sesión cuando no está autenticado', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      expect(screen.getByText('Iniciar Sesión')).toBeInTheDocument();
    });

    it('debe tener el enlace correcto para iniciar sesión', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const signinLink = screen.getByText('Iniciar Sesión').closest('a');
      expect(signinLink).toHaveAttribute('href', '/signin');
    });
  });

  describe('Responsive Design', () => {
    it('debe ocultar elementos desktop en mobile', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      // El header desktop debería estar oculto en mobile
      const desktopElements = screen.queryAllByText('Todo');
      expect(desktopElements).toHaveLength(0);
    });

    it('debe mostrar layout mobile específico', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      // Verificar que existe el contenedor mobile
      const mobileContainer = screen.getByText(/Envíos a/).closest('.sm\\:hidden');
      expect(mobileContainer).toBeInTheDocument();
    });
  });

  describe('Interacciones del Usuario', () => {
    it('debe manejar click en logo', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const logo = screen.getByAltText('Pinteya - Tu Pinturería Online');
      fireEvent.click(logo);

      // El logo debería ser clickeable (verificado por el href)
      const logoLink = logo.closest('a');
      expect(logoLink).toHaveAttribute('href', '/');
    });

    it('debe manejar click en ubicación', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const locationElement = screen.getByText(/Envíos en/).closest('div');
      fireEvent.click(locationElement!);

      expect(mockRequestLocation).toHaveBeenCalled();
    });

    it('debe manejar focus en campo de búsqueda', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const searchInput = screen.getByTestId('search-input');
      fireEvent.focus(searchInput);

      expect(searchInput).toHaveFocus();
    });
  });

  describe('Estados de Error', () => {
    it('debe manejar error de geolocalización', () => {
      // Mock del hook con error
      jest.doMock('@/hooks/useGeolocation', () => ({
        useGeolocation: () => ({
          detectedZone: { name: 'Córdoba Capital', available: true },
          requestLocation: mockRequestLocation,
          selectZone: mockSelectZone,
          permissionStatus: 'denied',
          isLoading: false,
          error: 'Permisos de ubicación denegados',
          location: null,
          getAvailableZones: () => [],
          deliveryZones: [],
        }),
      }));

      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      // Debería mostrar la ubicación por defecto
      expect(screen.getByText('Córdoba Capital')).toBeInTheDocument();
    });
  });

  describe('Accesibilidad', () => {
    it('debe tener elementos accesibles por teclado', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const logo = screen.getByAltText('Pinteya - Tu Pinturería Online');
      const searchInput = screen.getByTestId('search-input');
      const signinButton = screen.getByText('Iniciar Sesión');

      expect(logo.closest('a')).toHaveAttribute('href');
      expect(searchInput).toBeInTheDocument();
      expect(signinButton.closest('a')).toHaveAttribute('href');
    });

    it('debe tener textos alternativos apropiados', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      expect(screen.getByAltText('Pinteya - Tu Pinturería Online')).toBeInTheDocument();
    });
  });
});
