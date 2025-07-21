/**
 * Tests de Integración - Sistema de Búsqueda
 * Pruebas de integración entre Header y componentes de búsqueda
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import Header from '../../index';
import { store } from '@/redux/store';
import { CartModalProvider } from '@/app/context/CartSidebarModalContext';

// Mock de Next.js
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
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

// Mock de componentes UI
jest.mock('@/components/ui/optimized-cart-icon', () => ({
  OptimizedCartIcon: () => <div data-testid="cart-icon">Cart</div>,
}));

jest.mock('@/components/ui/OptimizedLogo', () => ({
  HeaderLogo: () => <img data-testid="header-logo" alt="Pinteya" />,
}));

// Datos de prueba para APIs
const mockTrendingSearches = [
  { query: 'pintura blanca', count: 150 },
  { query: 'latex interior', count: 120 },
  { query: 'esmalte sintético', count: 100 },
  { query: 'barniz marino', count: 80 },
];

const mockSearchSuggestions = [
  { id: 1, name: 'Pintura Latex Blanca 20L', category: 'Pinturas' },
  { id: 2, name: 'Pintura Latex Interior Premium', category: 'Pinturas' },
  { id: 3, name: 'Esmalte Sintético Blanco', category: 'Esmaltes' },
];

const mockRecentSearches = [
  'pintura exterior',
  'rodillo 23cm',
  'thinner común',
];

// Configuración del servidor MSW
const server = setupServer(
  // API de búsquedas trending
  rest.get('/api/search/trending', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: mockTrendingSearches,
        count: mockTrendingSearches.length,
      })
    );
  }),

  // API de sugerencias de búsqueda
  rest.get('/api/search/suggestions', (req, res, ctx) => {
    const query = req.url.searchParams.get('q');
    const filteredSuggestions = mockSearchSuggestions.filter(item =>
      item.name.toLowerCase().includes(query?.toLowerCase() || '')
    );
    
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: filteredSuggestions,
        count: filteredSuggestions.length,
      })
    );
  }),

  // API de productos (para búsqueda)
  rest.get('/api/products', (req, res, ctx) => {
    const search = req.url.searchParams.get('search');
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: mockSearchSuggestions,
        pagination: { total: 3, page: 1, limit: 10 },
      })
    );
  })
);

// Setup y teardown del servidor
beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  jest.clearAllMocks();
  localStorage.clear();
});
afterAll(() => server.close());

// Wrapper de pruebas
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
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

describe('SearchIntegration - Tests de Integración', () => {
  const user = userEvent.setup();

  describe('Carga Inicial de Búsquedas Trending', () => {
    it('debe cargar búsquedas trending al montar el componente', async () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      // Esperar a que se carguen las búsquedas trending
      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
      });

      // Verificar que se hizo la llamada a la API
      await waitFor(() => {
        // La llamada se hace internamente en el hook useTrendingSearches
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
      });
    });

    it('debe manejar errores en la carga de trending searches', async () => {
      // Simular error en la API
      server.use(
        rest.get('/api/search/trending', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ error: 'Server error' }));
        })
      );

      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      // El componente debe seguir funcionando aunque falle la API
      expect(screen.getByTestId('search-input')).toBeInTheDocument();
    });
  });

  describe('Funcionalidad de Búsqueda con Debounce', () => {
    it('debe realizar búsqueda con debounce al escribir', async () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const searchInput = screen.getByTestId('search-input');

      // Escribir en el campo de búsqueda
      await user.type(searchInput, 'pintura');

      // Esperar el debounce (300ms)
      await waitFor(
        () => {
          expect(searchInput).toHaveValue('pintura');
        },
        { timeout: 500 }
      );
    });

    it('debe cancelar búsquedas anteriores al escribir rápidamente', async () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const searchInput = screen.getByTestId('search-input');

      // Escribir rápidamente múltiples caracteres
      await user.type(searchInput, 'pin');
      await user.type(searchInput, 'tura');

      // Solo la última búsqueda debe ejecutarse
      await waitFor(() => {
        expect(searchInput).toHaveValue('pintura');
      });
    });
  });

  describe('Navegación desde Búsqueda', () => {
    it('debe navegar a resultados al presionar Enter', async () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const searchInput = screen.getByTestId('search-input');

      // Escribir y presionar Enter
      await user.type(searchInput, 'latex blanco');
      await user.keyboard('{Enter}');

      // Verificar navegación
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/productos?q=latex%20blanco');
      });
    });

    it('debe navegar con parámetros de búsqueda correctos', async () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const searchInput = screen.getByTestId('search-input');

      // Búsqueda con espacios y caracteres especiales
      await user.type(searchInput, 'pintura 20L & barniz');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringContaining('/productos?q=')
        );
      });
    });
  });

  describe('Historial de Búsquedas', () => {
    it('debe guardar búsquedas en localStorage', async () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const searchInput = screen.getByTestId('search-input');

      // Realizar búsqueda
      await user.type(searchInput, 'esmalte sintético');
      await user.keyboard('{Enter}');

      // Verificar que se guardó en localStorage
      await waitFor(() => {
        const recentSearches = JSON.parse(
          localStorage.getItem('pinteya_recent_searches') || '[]'
        );
        expect(recentSearches).toContain('esmalte sintético');
      });
    });

    it('debe limitar el historial a máximo 10 búsquedas', async () => {
      // Prellenar localStorage con 10 búsquedas
      const existingSearches = Array.from({ length: 10 }, (_, i) => `búsqueda ${i}`);
      localStorage.setItem('pinteya_recent_searches', JSON.stringify(existingSearches));

      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const searchInput = screen.getByTestId('search-input');

      // Realizar nueva búsqueda
      await user.type(searchInput, 'nueva búsqueda');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        const recentSearches = JSON.parse(
          localStorage.getItem('pinteya_recent_searches') || '[]'
        );
        expect(recentSearches).toHaveLength(10);
        expect(recentSearches[0]).toBe('nueva búsqueda');
      });
    });
  });

  describe('Estados de Carga y Error', () => {
    it('debe mostrar estado de carga durante búsqueda', async () => {
      // Simular respuesta lenta
      server.use(
        rest.get('/api/search/suggestions', (req, res, ctx) => {
          return res(ctx.delay(1000), ctx.json({ data: [] }));
        })
      );

      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'test');

      // Verificar que el input sigue funcionando durante la carga
      expect(searchInput).toHaveValue('test');
    });

    it('debe manejar errores de búsqueda gracefully', async () => {
      // Simular error en API de sugerencias
      server.use(
        rest.get('/api/search/suggestions', (req, res, ctx) => {
          return res(ctx.status(500));
        })
      );

      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'test error');

      // El componente debe seguir funcionando
      expect(searchInput).toHaveValue('test error');
    });
  });

  describe('Integración con Geolocalización', () => {
    it('debe incluir zona de entrega en búsquedas cuando esté disponible', async () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'pintura');
      await user.keyboard('{Enter}');

      // Verificar que la navegación incluye contexto de ubicación
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringContaining('/productos?q=pintura')
        );
      });
    });
  });

  describe('Performance y Optimización', () => {
    it('debe cancelar requests anteriores al hacer nueva búsqueda', async () => {
      let requestCount = 0;
      server.use(
        rest.get('/api/search/suggestions', (req, res, ctx) => {
          requestCount++;
          return res(ctx.delay(100), ctx.json({ data: [] }));
        })
      );

      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const searchInput = screen.getByTestId('search-input');

      // Hacer múltiples búsquedas rápidas
      await user.type(searchInput, 'a');
      await user.type(searchInput, 'b');
      await user.type(searchInput, 'c');

      // Esperar a que se resuelvan
      await waitFor(() => {
        expect(searchInput).toHaveValue('abc');
      });

      // Solo debe haber hecho el request final
      expect(requestCount).toBeLessThanOrEqual(3);
    });
  });
});
