/**
 * Tests funcionales simplificados para el Header Mobile
 * Enfoque en verificar que los elementos básicos se renderizan correctamente
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Mocks mínimos necesarios
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>;
  };
});

jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }: any) {
    return <img src={src} alt={alt} {...props} />;
  };
});

// Mock del hook de geolocalización con valores estáticos
jest.mock('@/hooks/useGeolocation', () => ({
  useGeolocation: jest.fn(() => ({
    detectedZone: { name: 'Córdoba Capital', available: true },
    requestLocation: jest.fn(),
    selectZone: jest.fn(),
    permissionStatus: 'prompt',
    isLoading: false,
    error: null,
    location: null,
    getAvailableZones: jest.fn(() => []),
    deliveryZones: [],
  })),
}));

// Mock de Clerk simplificado
jest.mock('@clerk/nextjs', () => ({
  SignedIn: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="signed-in-mock">{children}</div>
  ),
  SignedOut: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="signed-out-mock">{children}</div>
  ),
  UserButton: () => <div data-testid="user-button-mock">UserButton</div>,
  useUser: jest.fn(() => ({ isSignedIn: false, user: null, isLoaded: true })),
}));

// Mock del componente de búsqueda
jest.mock('@/components/ui/SearchAutocompleteIntegrated', () => ({
  SearchAutocompleteIntegrated: function MockSearch({ placeholder, ...props }: any) {
    return (
      <input 
        data-testid="search-autocomplete-mock" 
        placeholder={placeholder}
        {...props}
      />
    );
  },
}));

// Mock de Redux
jest.mock('react-redux', () => ({
  useSelector: jest.fn(() => ({ items: [], totalQuantity: 0 })),
  useDispatch: jest.fn(() => jest.fn()),
}));

// Mock del contexto del carrito
jest.mock('@/app/context/CartSidebarModalContext', () => ({
  useCartSidebarModal: jest.fn(() => ({
    isOpen: false,
    openModal: jest.fn(),
    closeModal: jest.fn(),
  })),
}));

// Mock de hooks de animación
jest.mock('@/hooks/useCartAnimation', () => ({
  useCartAnimation: jest.fn(() => ({ isAnimating: false })),
}));

// Mock de window.matchMedia
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

import Header from '../index';

describe('Header Functional Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderizado Básico', () => {
    test('debe renderizar sin errores', () => {
      expect(() => render(<Header />)).not.toThrow();
    });

    test('debe mostrar el logo de Pinteya', () => {
      render(<Header />);
      const logo = screen.getByAltText('Pinteya - Tu Pinturería Online');
      expect(logo).toBeInTheDocument();
    });

    test('debe mostrar el campo de búsqueda con placeholder correcto', () => {
      render(<Header />);
      const searchInput = screen.getByTestId('search-autocomplete-mock');
      expect(searchInput).toHaveAttribute('placeholder', 'latex interior blanco 20lts');
    });

    test('debe mostrar la ubicación por defecto', () => {
      render(<Header />);
      expect(screen.getByText('Córdoba Capital')).toBeInTheDocument();
    });

    test('debe mostrar elementos de autenticación', () => {
      render(<Header />);
      expect(screen.getByTestId('signed-out-mock')).toBeInTheDocument();
    });
  });

  describe('Interactividad Básica', () => {
    test('logo debe ser clickeable', () => {
      render(<Header />);
      const logoLink = screen.getByAltText('Pinteya - Tu Pinturería Online').closest('a');
      expect(logoLink).toHaveAttribute('href', '/');
    });

    test('debe permitir click en ubicación', () => {
      const mockRequestLocation = jest.fn();
      const { useGeolocation } = require('@/hooks/useGeolocation');
      useGeolocation.mockReturnValue({
        detectedZone: { name: 'Córdoba Capital', available: true },
        requestLocation: mockRequestLocation,
        selectZone: jest.fn(),
        permissionStatus: 'prompt',
        isLoading: false,
        error: null,
        location: null,
        getAvailableZones: jest.fn(() => []),
        deliveryZones: [],
      });

      render(<Header />);
      const locationElement = screen.getByText('Córdoba Capital').closest('div');
      fireEvent.click(locationElement!);

      expect(mockRequestLocation).toHaveBeenCalled();
    });

    test('campo de búsqueda debe ser enfocable', () => {
      render(<Header />);
      const searchInput = screen.getByTestId('search-autocomplete-mock');
      fireEvent.focus(searchInput);
      expect(searchInput).toHaveFocus();
    });
  });

  describe('Estados de Geolocalización', () => {
    test('debe mostrar estado de carga', () => {
      const { useGeolocation } = require('@/hooks/useGeolocation');
      useGeolocation.mockReturnValue({
        detectedZone: null,
        requestLocation: jest.fn(),
        selectZone: jest.fn(),
        permissionStatus: 'prompt',
        isLoading: true,
        error: null,
        location: null,
        getAvailableZones: jest.fn(() => []),
        deliveryZones: [],
      });

      render(<Header />);
      expect(screen.getByText('Detectando ubicación...')).toBeInTheDocument();
    });

    test('debe mostrar estado de permisos denegados', () => {
      const { useGeolocation } = require('@/hooks/useGeolocation');
      useGeolocation.mockReturnValue({
        detectedZone: { name: 'Córdoba Capital', available: true },
        requestLocation: jest.fn(),
        selectZone: jest.fn(),
        permissionStatus: 'denied',
        isLoading: false,
        error: 'Permisos denegados',
        location: null,
        getAvailableZones: jest.fn(() => []),
        deliveryZones: [],
      });

      render(<Header />);
      expect(screen.getByText('Córdoba Capital')).toBeInTheDocument();
    });

    test('debe mostrar estado de ubicación detectada', () => {
      const { useGeolocation } = require('@/hooks/useGeolocation');
      useGeolocation.mockReturnValue({
        detectedZone: { name: 'Villa Carlos Paz', available: true },
        requestLocation: jest.fn(),
        selectZone: jest.fn(),
        permissionStatus: 'granted',
        isLoading: false,
        error: null,
        location: { lat: -31.4201, lng: -64.1888 },
        getAvailableZones: jest.fn(() => []),
        deliveryZones: [],
      });

      render(<Header />);
      expect(screen.getByText('Villa Carlos Paz')).toBeInTheDocument();
      expect(screen.getByText('✓')).toBeInTheDocument();
    });
  });

  describe('Estados de Autenticación', () => {
    test('debe mostrar UserButton cuando está autenticado', () => {
      const { useUser } = require('@clerk/nextjs');
      useUser.mockReturnValue({
        isSignedIn: true,
        user: { id: 'user_123' },
        isLoaded: true,
      });

      render(<Header />);
      expect(screen.getByTestId('user-button-mock')).toBeInTheDocument();
    });

    test('debe mostrar botón de login cuando no está autenticado', () => {
      const { useUser } = require('@clerk/nextjs');
      useUser.mockReturnValue({
        isSignedIn: false,
        user: null,
        isLoaded: true,
      });

      render(<Header />);
      expect(screen.getByTestId('signed-out-mock')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    test('debe tener clases responsive apropiadas', () => {
      render(<Header />);
      const logo = screen.getByAltText('Pinteya - Tu Pinturería Online');
      expect(logo).toHaveClass('h-16', 'w-16'); // 64x64px en mobile
    });

    test('debe mostrar layout mobile específico', () => {
      render(<Header />);
      // Verificar que existe contenido mobile
      const searchInput = screen.getByTestId('search-autocomplete-mock');
      expect(searchInput).toBeInTheDocument();
    });
  });

  describe('Accesibilidad', () => {
    test('debe tener alt text en imágenes', () => {
      render(<Header />);
      const logo = screen.getByAltText('Pinteya - Tu Pinturería Online');
      expect(logo).toHaveAttribute('alt', 'Pinteya - Tu Pinturería Online');
    });

    test('debe tener elementos navegables', () => {
      render(<Header />);
      const logoLink = screen.getByAltText('Pinteya - Tu Pinturería Online').closest('a');
      expect(logoLink).toHaveAttribute('href');
    });
  });
});
