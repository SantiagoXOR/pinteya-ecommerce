/**
 * Tests Responsive - Header
 * Pruebas de comportamiento responsive en diferentes breakpoints
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Header from '../../index';
import AuthSection from '../../AuthSection';
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

// Mock de componentes
jest.mock('@/components/ui/SearchAutocompleteIntegrated', () => ({
  SearchAutocompleteIntegrated: ({ onSearch }: { onSearch: (query: string) => void }) => (
    <input
      data-testid="search-input"
      placeholder="latex interior blanco 20lts"
      className="w-full"
      onChange={(e) => onSearch(e.target.value)}
    />
  ),
}));

jest.mock('@/components/ui/optimized-cart-icon', () => ({
  OptimizedCartIcon: ({ className }: { className: string }) => (
    <div data-testid="cart-icon" className={className}>
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
      className="h-8 w-auto sm:h-10"
    />
  ),
}));

// Utilidad para simular diferentes viewports
const setViewport = (width: number, height: number = 768) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
  
  // Disparar evento resize
  window.dispatchEvent(new Event('resize'));
};

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

describe('Header Responsive Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Mobile (320px - 767px)', () => {
    beforeEach(() => {
      setViewport(375, 667); // iPhone SE
    });

    it('debe mostrar layout mobile correctamente', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      // Verificar elementos principales
      expect(screen.getByTestId('header-logo')).toBeInTheDocument();
      expect(screen.getByTestId('search-input')).toBeInTheDocument();
      expect(screen.getByTestId('signed-out')).toBeInTheDocument();
    });

    it('debe ocultar el botón de carrito en mobile', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const cartButton = screen.getByTestId('cart-icon').closest('button');
      expect(cartButton).toHaveClass('hidden', 'sm:flex');
    });

    it('debe usar AuthSection variant mobile', () => {
      render(
        <TestWrapper>
          <AuthSection variant="mobile" />
        </TestWrapper>
      );

      const authButton = screen.getByRole('button');
      expect(authButton).toHaveClass('bg-white/20');
    });

    it('debe adaptar el tamaño del logo en mobile', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const logo = screen.getByTestId('header-logo');
      expect(logo).toHaveClass('h-8', 'w-auto', 'sm:h-10');
    });

    it('debe mantener funcionalidad de búsqueda en mobile', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'test mobile' } });
      expect(searchInput).toHaveValue('test mobile');
    });

    it('debe mostrar información de geolocalización compacta', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      expect(screen.getByText(/Envíos en/)).toBeInTheDocument();
      expect(screen.getByText('Córdoba Capital')).toBeInTheDocument();
    });
  });

  describe('Tablet (768px - 1023px)', () => {
    beforeEach(() => {
      setViewport(768, 1024); // iPad
    });

    it('debe mostrar layout tablet correctamente', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      // Verificar elementos principales
      expect(screen.getByTestId('header-logo')).toBeInTheDocument();
      expect(screen.getByTestId('search-input')).toBeInTheDocument();
      expect(screen.getByTestId('signed-out')).toBeInTheDocument();
    });

    it('debe mostrar el botón de carrito en tablet', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const cartButton = screen.getByTestId('cart-icon').closest('button');
      expect(cartButton).toBeVisible();
    });

    it('debe usar tamaño de logo intermedio', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const logo = screen.getByTestId('header-logo');
      expect(logo).toHaveClass('sm:h-10');
    });

    it('debe mantener espaciado apropiado en tablet', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const header = screen.getByRole('banner');
      expect(header).toHaveClass('px-4'); // Padding horizontal
    });
  });

  describe('Desktop (1024px+)', () => {
    beforeEach(() => {
      setViewport(1440, 900); // Desktop estándar
    });

    it('debe mostrar layout desktop completo', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      // Verificar todos los elementos
      expect(screen.getByTestId('header-logo')).toBeInTheDocument();
      expect(screen.getByTestId('search-input')).toBeInTheDocument();
      expect(screen.getByTestId('signed-out')).toBeInTheDocument();
      
      const cartButton = screen.getByTestId('cart-icon').closest('button');
      expect(cartButton).toBeVisible();
    });

    it('debe usar AuthSection variant desktop', () => {
      render(
        <TestWrapper>
          <AuthSection variant="desktop" />
        </TestWrapper>
      );

      const authButton = screen.getByRole('button');
      expect(authButton).toHaveClass('bg-white/20');
    });

    it('debe mostrar logo en tamaño completo', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const logo = screen.getByTestId('header-logo');
      expect(logo).toHaveClass('sm:h-10');
    });

    it('debe tener espaciado óptimo para desktop', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const header = screen.getByRole('banner');
      expect(header).toHaveClass('px-4');
    });

    it('debe mostrar todos los elementos del topbar', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      expect(screen.getByText(/Envíos en/)).toBeInTheDocument();
      expect(screen.getByText('Córdoba Capital')).toBeInTheDocument();
    });
  });

  describe('Breakpoints Específicos', () => {
    const breakpoints = [
      { name: 'xs', width: 320 },
      { name: 'sm', width: 640 },
      { name: 'md', width: 768 },
      { name: 'lg', width: 1024 },
      { name: 'xl', width: 1280 },
      { name: '2xl', width: 1536 },
    ];

    breakpoints.forEach(({ name, width }) => {
      it(`debe funcionar correctamente en breakpoint ${name} (${width}px)`, () => {
        setViewport(width);

        render(
          <TestWrapper>
            <Header />
          </TestWrapper>
        );

        // Verificar elementos esenciales en todos los breakpoints
        expect(screen.getByTestId('header-logo')).toBeInTheDocument();
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
        expect(screen.getByTestId('signed-out')).toBeInTheDocument();
      });
    });
  });

  describe('Transiciones Responsive', () => {
    it('debe manejar cambios de viewport dinámicamente', () => {
      const { rerender } = render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      // Comenzar en mobile
      setViewport(375);
      rerender(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const cartButtonMobile = screen.getByTestId('cart-icon').closest('button');
      expect(cartButtonMobile).toHaveClass('hidden');

      // Cambiar a desktop
      setViewport(1024);
      rerender(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const cartButtonDesktop = screen.getByTestId('cart-icon').closest('button');
      expect(cartButtonDesktop).toHaveClass('sm:flex');
    });

    it('debe mantener estado durante cambios de viewport', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'test query' } });

      // Cambiar viewport
      setViewport(375);
      
      // El valor debe mantenerse
      expect(searchInput).toHaveValue('test query');
    });
  });

  describe('Touch Targets', () => {
    it('debe tener touch targets apropiados en mobile', () => {
      setViewport(375);

      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const buttons = screen.getAllByRole('button');
      
      // Los botones deben tener padding suficiente para touch
      buttons.forEach(button => {
        expect(button).toHaveClass(/p-2|px-3|py-2/);
      });
    });

    it('debe mantener accesibilidad en touch devices', () => {
      setViewport(375);

      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const searchInput = screen.getByTestId('search-input');
      
      // Simular touch
      fireEvent.touchStart(searchInput);
      fireEvent.touchEnd(searchInput);
      
      expect(searchInput).toBeInTheDocument();
    });
  });

  describe('Orientación de Dispositivo', () => {
    it('debe funcionar en orientación portrait', () => {
      setViewport(375, 667); // Portrait

      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      expect(screen.getByTestId('header-logo')).toBeInTheDocument();
      expect(screen.getByTestId('search-input')).toBeInTheDocument();
    });

    it('debe funcionar en orientación landscape', () => {
      setViewport(667, 375); // Landscape

      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      expect(screen.getByTestId('header-logo')).toBeInTheDocument();
      expect(screen.getByTestId('search-input')).toBeInTheDocument();
    });
  });

  describe('Performance Responsive', () => {
    it('debe renderizar eficientemente en diferentes tamaños', () => {
      const renderTimes: number[] = [];

      [320, 768, 1024, 1440].forEach(width => {
        setViewport(width);
        
        const startTime = performance.now();
        
        const { unmount } = render(
          <TestWrapper>
            <Header />
          </TestWrapper>
        );
        
        const endTime = performance.now();
        renderTimes.push(endTime - startTime);
        
        unmount();
      });

      // Todos los renders deben ser rápidos (< 50ms)
      renderTimes.forEach(time => {
        expect(time).toBeLessThan(50);
      });
    });
  });

  describe('Contenido Adaptativo', () => {
    it('debe adaptar texto según el espacio disponible', () => {
      // Mobile - texto más corto
      setViewport(375);
      const { rerender } = render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      expect(screen.getByText('Córdoba Capital')).toBeInTheDocument();

      // Desktop - puede mostrar más información
      setViewport(1440);
      rerender(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      expect(screen.getByText('Córdoba Capital')).toBeInTheDocument();
    });

    it('debe priorizar elementos importantes en espacios reducidos', () => {
      setViewport(320); // Muy pequeño

      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      // Elementos esenciales deben estar presentes
      expect(screen.getByTestId('header-logo')).toBeInTheDocument();
      expect(screen.getByTestId('search-input')).toBeInTheDocument();
      
      // Carrito puede estar oculto
      const cartButton = screen.getByTestId('cart-icon').closest('button');
      expect(cartButton).toHaveClass('hidden');
    });
  });
});
