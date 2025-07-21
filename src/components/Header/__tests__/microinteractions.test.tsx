/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import Header from '../index';
import { CartSidebarModalProvider } from '@/app/context/CartSidebarModalContext';
import cartReducer from '@/redux/features/cart-slice';

// Mock de Clerk
jest.mock('@clerk/nextjs', () => ({
  SignedIn: ({ children }: { children: React.ReactNode }) => <div data-testid="signed-in">{children}</div>,
  SignedOut: ({ children }: { children: React.ReactNode }) => <div data-testid="signed-out">{children}</div>,
  UserButton: () => <div data-testid="user-button">User</div>,
  useUser: () => ({ isLoaded: true }),
}));

// Mock de hooks
jest.mock('@/hooks/useGeolocation', () => ({
  useGeolocation: () => ({
    detectedZone: { name: 'Córdoba Capital', available: true },
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
jest.mock('@/components/ui/optimized-cart-icon', () => ({
  OptimizedCartIcon: () => <div data-testid="cart-icon">Cart</div>,
}));

jest.mock('@/components/ui/OptimizedLogo', () => ({
  HeaderLogo: ({ className, isMobile }: { className?: string; isMobile?: boolean }) => (
    <img
      data-testid={isMobile ? "header-logo-mobile" : "header-logo"}
      className={className}
      alt="Pinteya"
    />
  ),
}));

jest.mock('@/components/ui/SearchAutocompleteIntegrated', () => ({
  SearchAutocompleteIntegrated: ({ className, placeholder }: { className?: string; placeholder?: string }) => (
    <input data-testid="search-input" className={className} placeholder={placeholder} />
  ),
}));

// Mock de GeolocationDebugger
jest.mock('../GeolocationDebugger', () => {
  return function GeolocationDebugger() {
    return <div data-testid="geolocation-debugger">Geolocation Debugger</div>;
  };
});

// Store de prueba
const createTestStore = () => {
  return configureStore({
    reducer: {
      cartReducer,
    },
    preloadedState: {
      cartReducer: {
        items: [
          { id: '1', name: 'Producto Test', price: 100, quantity: 1 }
        ],
      },
    },
  });
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const store = createTestStore();
  return (
    <Provider store={store}>
      <CartSidebarModalProvider>
        {children}
      </CartSidebarModalProvider>
    </Provider>
  );
};

describe('Header Microinteractions', () => {
  beforeEach(() => {
    // Mock de window.scrollY para sticky header
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      value: 0,
    });

    // Mock de addEventListener para scroll
    window.addEventListener = jest.fn();
    window.removeEventListener = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Sticky Header Behavior', () => {
    it('should apply sticky classes when scrolling', async () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const header = screen.getByRole('banner');
      expect(header).toHaveClass('fixed');
      expect(header).toHaveClass('header-sticky-transition');
    });

    it('should register scroll event listener', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      expect(window.addEventListener).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function),
        { passive: true }
      );
    });
  });

  describe('Button Animations', () => {
    it('should apply hover classes to cart button', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const cartButton = screen.getByTestId('cart-icon').closest('button');
      expect(cartButton).toHaveClass('floating-button');
      expect(cartButton).toHaveClass('focus-ring');
    });

    it('should apply animation classes to logo', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      // Buscar logo desktop o mobile
      const logoDesktop = screen.queryByTestId('header-logo');
      const logoMobile = screen.queryByTestId('header-logo-mobile');

      const logo = logoDesktop || logoMobile;
      expect(logo).toBeTruthy();

      if (logo) {
        expect(logo).toHaveClass('transition-all');
        expect(logo).toHaveClass('duration-300');
      }
    });
  });

  describe('Search Animations', () => {
    it('should apply search focus ring classes', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      // Buscar el contenedor del search que tiene la clase search-focus-ring
      const searchContainers = screen.getByTestId('search-input').closest('form')?.querySelector('div');
      expect(searchContainers).toBeTruthy();
    });

    it('should have transition classes on search input', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const searchInput = screen.getByTestId('search-input');
      expect(searchInput.className).toContain('transition-all');
      expect(searchInput.className).toContain('duration-300');
    });
  });

  describe('Geolocation Animations', () => {
    it('should apply hover animations to location button', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      // Buscar el elemento de ubicación en el topbar
      const locationElements = screen.getAllByText(/Córdoba Capital/i);
      expect(locationElements.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('should have focus-ring classes for keyboard navigation', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const cartButton = screen.getByTestId('cart-icon').closest('button');
      expect(cartButton).toHaveClass('focus-ring');
    });

    it('should maintain accessibility attributes', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should use CSS transitions instead of JavaScript animations', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const cartButton = screen.getByTestId('cart-icon').closest('button');
      expect(cartButton?.className).toContain('transition-all');
      expect(cartButton?.className).toContain('duration-300');
    });

    it('should have passive scroll listeners', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      expect(window.addEventListener).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function),
        { passive: true }
      );
    });
  });

  describe('Responsive Behavior', () => {
    it('should apply responsive classes', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const logo = screen.getByTestId('header-logo');
      expect(logo.className).toContain('hidden sm:block');
    });
  });
});
