/**
 * Tests simples para verificar funcionalidad básica del Header
 */

import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock básico de Next.js
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
jest.mock('@/hooks/useGeolocation', () => ({
  useGeolocation: () => ({
    detectedZone: { name: 'Córdoba Capital', available: true },
    requestLocation: jest.fn(),
    selectZone: jest.fn(),
    permissionStatus: 'prompt',
    isLoading: false,
    error: null,
    location: null,
    getAvailableZones: () => [],
    deliveryZones: [],
  }),
}));

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

// Mock del componente de búsqueda
jest.mock('@/components/ui/SearchAutocompleteIntegrated', () => {
  return {
    SearchAutocompleteIntegrated: ({ placeholder }: any) => (
      <input data-testid="search-input" placeholder={placeholder} />
    ),
  };
});

// Mock de Redux
jest.mock('react-redux', () => ({
  useSelector: () => ({ items: [], totalQuantity: 0 }),
  useDispatch: () => jest.fn(),
}));

// Mock de hooks de animación
jest.mock('@/hooks/useCartAnimation', () => ({
  useCartAnimation: () => ({ isAnimating: false }),
}));

// Mock del contexto del carrito
jest.mock('@/app/context/CartSidebarModalContext', () => ({
  useCartSidebarModal: () => ({
    isOpen: false,
    openModal: jest.fn(),
    closeModal: jest.fn(),
  }),
}));

import Header from '../index';

describe('Header Simple Tests', () => {
  beforeEach(() => {
    // Mock window.matchMedia
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

  test('debe renderizar el header sin errores', () => {
    render(<Header />);
    
    // Verificar que el componente se renderiza
    expect(screen.getByTestId('search-input')).toBeInTheDocument();
  });

  test('debe mostrar el placeholder correcto en el campo de búsqueda', () => {
    render(<Header />);
    
    const searchInput = screen.getByTestId('search-input');
    expect(searchInput).toHaveAttribute('placeholder', 'latex interior blanco 20lts');
  });

  test('debe mostrar el logo de Pinteya', () => {
    render(<Header />);
    
    const logo = screen.getByAltText('Pinteya - Tu Pinturería Online');
    expect(logo).toBeInTheDocument();
  });

  test('debe mostrar la ubicación por defecto', () => {
    render(<Header />);
    
    expect(screen.getByText('Córdoba Capital')).toBeInTheDocument();
  });

  test('debe mostrar botón de iniciar sesión cuando no está autenticado', () => {
    render(<Header />);
    
    expect(screen.getByText('Iniciar Sesión')).toBeInTheDocument();
  });

  test('debe tener el logo clickeable con enlace al inicio', () => {
    render(<Header />);
    
    const logoLink = screen.getByAltText('Pinteya - Tu Pinturería Online').closest('a');
    expect(logoLink).toHaveAttribute('href', '/');
  });

  test('debe tener el botón de iniciar sesión con enlace correcto', () => {
    render(<Header />);
    
    const signinLink = screen.getByText('Iniciar Sesión').closest('a');
    expect(signinLink).toHaveAttribute('href', '/signin');
  });
});
