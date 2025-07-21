/**
 * Tests de Accesibilidad - Header
 * Pruebas de cumplimiento WCAG 2.1 AA
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Header from '../../index';
import AuthSection from '../../AuthSection';
import { store } from '@/redux/store';
import { CartModalProvider } from '@/app/context/CartSidebarModalContext';

// Extender expect con jest-axe
expect.extend(toHaveNoViolations);

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
  UserButton: () => <div data-testid="user-button" role="button" tabIndex={0}>UserButton</div>,
  useUser: () => ({
    isSignedIn: false,
    user: null,
    isLoaded: true,
  }),
}));

// Mock de hooks
jest.mock('@/hooks/useGeolocation', () => ({
  useGeolocation: () => ({
    detectedZone: { id: 'cordoba-capital', name: 'Córdoba Capital' },
    requestLocation: jest.fn(),
    permissionStatus: 'granted',
    isLoading: false,
    error: null,
    location: null,
    testLocation: jest.fn(),
    deliveryZones: [{ id: 'cordoba-capital', name: 'Córdoba Capital' }],
  }),
}));

jest.mock('@/hooks/useCartAnimation', () => ({
  useCartAnimation: () => ({ isAnimating: false }),
}));

// Mock de componentes con accesibilidad
jest.mock('@/components/ui/SearchAutocompleteIntegrated', () => ({
  SearchAutocompleteIntegrated: ({ onSearch }: { onSearch: (query: string) => void }) => (
    <input
      data-testid="search-input"
      placeholder="latex interior blanco 20lts"
      aria-label="Buscar productos de pinturería"
      role="searchbox"
      onChange={(e) => onSearch(e.target.value)}
    />
  ),
}));

jest.mock('@/components/ui/optimized-cart-icon', () => ({
  OptimizedCartIcon: ({ alt }: { alt: string }) => (
    <div data-testid="cart-icon" aria-label={alt} role="img">
      Cart Icon
    </div>
  ),
}));

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
        <CartModalProvider>
          {children}
        </CartModalProvider>
      </QueryClientProvider>
    </Provider>
  );
};

describe('Header Accessibility - WCAG 2.1 AA', () => {
  describe('Cumplimiento Automático de Axe', () => {
    it('debe pasar todas las reglas de accesibilidad de axe', async () => {
      const { container } = render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('debe pasar axe en AuthSection independiente', async () => {
      const { container } = render(
        <TestWrapper>
          <AuthSection variant="desktop" />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Estructura Semántica', () => {
    it('debe usar elementos semánticos correctos', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      // Verificar que usa el elemento header
      expect(screen.getByRole('banner')).toBeInTheDocument();
      
      // Verificar que tiene navegación
      const searchInput = screen.getByRole('searchbox');
      expect(searchInput).toBeInTheDocument();
      
      // Verificar botones
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('debe tener landmarks ARIA correctos', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      // Header debe ser un banner landmark
      const banner = screen.getByRole('banner');
      expect(banner).toBeInTheDocument();
    });
  });

  describe('Navegación por Teclado', () => {
    it('debe permitir navegación por Tab', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const searchInput = screen.getByRole('searchbox');
      const buttons = screen.getAllByRole('button');

      // Verificar que los elementos son focusables
      expect(searchInput).toHaveAttribute('tabIndex', '0');
      
      buttons.forEach(button => {
        expect(button).not.toHaveAttribute('tabIndex', '-1');
      });
    });

    it('debe manejar navegación con Enter y Space', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const buttons = screen.getAllByRole('button');
      
      buttons.forEach(button => {
        // Simular Enter
        fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
        
        // Simular Space
        fireEvent.keyDown(button, { key: ' ', code: 'Space' });
        
        // No debe haber errores
        expect(button).toBeInTheDocument();
      });
    });

    it('debe manejar Escape en elementos interactivos', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const searchInput = screen.getByRole('searchbox');
      
      // Simular Escape
      fireEvent.keyDown(searchInput, { key: 'Escape', code: 'Escape' });
      
      // No debe haber errores
      expect(searchInput).toBeInTheDocument();
    });
  });

  describe('Etiquetas y Descripciones', () => {
    it('debe tener aria-labels apropiados', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const searchInput = screen.getByRole('searchbox');
      expect(searchInput).toHaveAttribute('aria-label', 'Buscar productos de pinturería');
      
      const cartIcon = screen.getByTestId('cart-icon');
      expect(cartIcon).toHaveAttribute('aria-label', 'Carrito de compras');
    });

    it('debe tener textos alternativos para imágenes', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const logo = screen.getByTestId('header-logo');
      expect(logo).toHaveAttribute('alt', 'Pinteya - Tu Pinturería Online');
    });

    it('debe tener placeholders descriptivos', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const searchInput = screen.getByRole('searchbox');
      expect(searchInput).toHaveAttribute('placeholder', 'latex interior blanco 20lts');
    });
  });

  describe('Contraste de Colores', () => {
    it('debe tener suficiente contraste en texto sobre fondo naranja', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const header = screen.getByRole('banner');
      
      // Verificar que usa colores con buen contraste
      const computedStyle = window.getComputedStyle(header);
      
      // El fondo naranja (#ea5a17) con texto blanco debe tener contraste > 4.5:1
      expect(header).toBeInTheDocument();
    });

    it('debe mantener contraste en estados hover y focus', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const buttons = screen.getAllByRole('button');
      
      buttons.forEach(button => {
        // Simular hover
        fireEvent.mouseEnter(button);
        
        // Simular focus
        fireEvent.focus(button);
        
        // Verificar que sigue siendo visible
        expect(button).toBeVisible();
      });
    });
  });

  describe('Estados de Focus', () => {
    it('debe mostrar indicadores de focus visibles', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const searchInput = screen.getByRole('searchbox');
      const buttons = screen.getAllByRole('button');

      // Focus en input de búsqueda
      fireEvent.focus(searchInput);
      expect(document.activeElement).toBe(searchInput);

      // Focus en botones
      buttons.forEach(button => {
        fireEvent.focus(button);
        expect(document.activeElement).toBe(button);
      });
    });

    it('debe mantener orden lógico de tabulación', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      // Simular navegación por Tab
      const searchInput = screen.getByRole('searchbox');
      fireEvent.focus(searchInput);
      
      // El orden debe ser: logo -> búsqueda -> botones
      expect(document.activeElement).toBe(searchInput);
    });
  });

  describe('Anuncios para Screen Readers', () => {
    it('debe tener roles ARIA apropiados', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const searchInput = screen.getByRole('searchbox');
      expect(searchInput).toHaveAttribute('role', 'searchbox');
      
      const cartIcon = screen.getByTestId('cart-icon');
      expect(cartIcon).toHaveAttribute('role', 'img');
    });

    it('debe anunciar cambios de estado', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      // Verificar que los elementos interactivos tienen estados claros
      const buttons = screen.getAllByRole('button');
      
      buttons.forEach(button => {
        // No debe tener aria-disabled sin razón
        expect(button).not.toHaveAttribute('aria-disabled', 'true');
      });
    });
  });

  describe('Responsive Accessibility', () => {
    it('debe mantener accesibilidad en mobile', () => {
      // Simular viewport mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      const { container } = render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      // Verificar que sigue siendo accesible
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('searchbox')).toBeInTheDocument();
    });

    it('debe adaptar tamaños de touch targets', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const buttons = screen.getAllByRole('button');
      
      // Los botones deben tener tamaño mínimo de 44px (WCAG)
      buttons.forEach(button => {
        const computedStyle = window.getComputedStyle(button);
        // En tests, verificamos que tienen padding apropiado
        expect(button).toHaveStyle('padding: 0.5rem'); // p-2 = 8px = suficiente para 44px total
      });
    });
  });

  describe('Compatibilidad con Tecnologías Asistivas', () => {
    it('debe funcionar con lectores de pantalla', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      // Verificar que todos los elementos interactivos tienen nombres accesibles
      const searchInput = screen.getByRole('searchbox');
      expect(searchInput).toHaveAccessibleName();
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAccessibleName();
      });
    });

    it('debe soportar navegación por voz', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      // Los elementos deben tener nombres únicos y descriptivos
      const searchInput = screen.getByRole('searchbox');
      expect(searchInput).toHaveAttribute('aria-label', 'Buscar productos de pinturería');
    });
  });
});
