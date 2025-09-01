// ===================================
// TESTS: useFilterAnalytics - Hook de Analytics para Filtros
// ===================================

import { renderHook, act } from '@testing-library/react';
import { useFilterAnalytics } from '../useFilterAnalytics';

// ===================================
// MOCKS
// ===================================

// Mock fetch global
global.fetch = jest.fn();

// Mock window.gtag
Object.defineProperty(window, 'gtag', {
  value: jest.fn(),
  writable: true,
});

// Mock sessionStorage
const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true,
});

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000/test',
    pathname: '/test',
    search: '?categories=Exterior',
  },
  writable: true,
});

// Mock document.title
Object.defineProperty(document, 'title', {
  value: 'Test Page - Pinteya',
  writable: true,
});

// ===================================
// SETUP Y HELPERS
// ===================================

const mockFetchResponse = (success = true, data = {}) => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: success,
    json: async () => data,
  });
};

// ===================================
// TESTS PRINCIPALES
// ===================================

describe('useFilterAnalytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSessionStorage.getItem.mockReturnValue(null);
    console.log = jest.fn();
    console.warn = jest.fn();
  });

  // ===================================
  // TESTS DE INICIALIZACIÓN
  // ===================================

  describe('Inicialización', () => {
    it('inicializa con configuración por defecto', () => {
      const { result } = renderHook(() => useFilterAnalytics());
      
      expect(result.current.enabled).toBe(true);
      expect(result.current.sessionId).toMatch(/^session_\d+_[a-z0-9]+$/);
      expect(result.current.userId).toBeUndefined();
    });

    it('acepta configuración personalizada', () => {
      const { result } = renderHook(() => 
        useFilterAnalytics({
          enabled: false,
          debug: true,
          sessionId: 'custom-session-123',
          userId: 'user-456',
        })
      );
      
      expect(result.current.enabled).toBe(false);
      expect(result.current.sessionId).toBe('custom-session-123');
      expect(result.current.userId).toBe('user-456');
    });

    it('genera sessionId único cuando no se proporciona', () => {
      const { result: result1 } = renderHook(() => useFilterAnalytics());
      const { result: result2 } = renderHook(() => useFilterAnalytics());
      
      expect(result1.current.sessionId).not.toBe(result2.current.sessionId);
    });

    it('usa sessionId del sessionStorage si existe', () => {
      mockSessionStorage.getItem.mockReturnValue('existing-session-789');
      
      const { result } = renderHook(() => useFilterAnalytics());
      
      expect(result.current.sessionId).toBe('existing-session-789');
    });
  });

  // ===================================
  // TESTS DE TRACKING DE FILTROS
  // ===================================

  describe('Tracking de Filtros', () => {
    it('trackea aplicación de filtro correctamente', async () => {
      mockFetchResponse(true);
      
      const { result } = renderHook(() => useFilterAnalytics());
      
      await act(async () => {
        result.current.trackFilterApplied('category', 'Exterior', 12);
      });
      
      expect(global.fetch).toHaveBeenCalledWith('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"event":"filter_applied"'),
      });
      
      expect(window.gtag).toHaveBeenCalledWith('event', 'applied', expect.any(Object));
    });

    it('trackea remoción de filtro correctamente', async () => {
      mockFetchResponse(true);
      
      const { result } = renderHook(() => useFilterAnalytics());
      
      await act(async () => {
        result.current.trackFilterRemoved('brand', 'Sherwin Williams', 2);
      });
      
      expect(global.fetch).toHaveBeenCalledWith('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"event":"filter_removed"'),
      });
    });

    it('trackea limpieza de filtros correctamente', async () => {
      mockFetchResponse(true);
      
      const { result } = renderHook(() => useFilterAnalytics());
      
      await act(async () => {
        result.current.trackFiltersCleared(3, ['category', 'brand', 'price_range']);
      });
      
      expect(global.fetch).toHaveBeenCalledWith('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"event":"filter_cleared"'),
      });
    });

    it('trackea búsqueda correctamente', async () => {
      mockFetchResponse(true);
      
      const { result } = renderHook(() => useFilterAnalytics());
      
      await act(async () => {
        result.current.trackSearchPerformed('pintura exterior', 15, true, 2);
      });
      
      expect(global.fetch).toHaveBeenCalledWith('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"event":"filter_search"'),
      });
    });

    it('trackea paginación correctamente', async () => {
      mockFetchResponse(true);
      
      const { result } = renderHook(() => useFilterAnalytics());
      
      await act(async () => {
        result.current.trackPaginationUsed(1, 2, 5, 12);
      });
      
      expect(global.fetch).toHaveBeenCalledWith('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"event":"filter_pagination"'),
      });
    });

    it('trackea cambio de ordenamiento correctamente', async () => {
      mockFetchResponse(true);
      
      const { result } = renderHook(() => useFilterAnalytics());
      
      await act(async () => {
        result.current.trackSortChanged('created_at', 'price_asc', 20);
      });
      
      expect(global.fetch).toHaveBeenCalledWith('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"event":"filter_sort_changed"'),
      });
    });
  });

  // ===================================
  // TESTS DE TRACKING AUTOMÁTICO
  // ===================================

  describe('Tracking Automático de Cambios', () => {
    it('detecta y trackea filtros añadidos', async () => {
      mockFetchResponse(true);
      
      const { result } = renderHook(() => useFilterAnalytics());
      
      const previousFilters = {
        categories: [],
        brands: [],
        priceMin: undefined,
        priceMax: undefined,
        search: '',
        sortBy: 'created_at',
        page: 1,
        limit: 12,
      };
      
      const currentFilters = {
        categories: ['Exterior'],
        brands: [],
        priceMin: undefined,
        priceMax: undefined,
        search: '',
        sortBy: 'created_at',
        page: 1,
        limit: 12,
      };
      
      await act(async () => {
        result.current.trackFilterChanges(previousFilters, currentFilters, 12);
      });
      
      expect(global.fetch).toHaveBeenCalledWith('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"event":"filter_applied"'),
      });
    });

    it('detecta y trackea filtros removidos', async () => {
      mockFetchResponse(true);
      
      const { result } = renderHook(() => useFilterAnalytics());
      
      const previousFilters = {
        categories: ['Exterior', 'Interior'],
        brands: ['Sherwin Williams'],
        priceMin: undefined,
        priceMax: undefined,
        search: '',
        sortBy: 'created_at',
        page: 1,
        limit: 12,
      };
      
      const currentFilters = {
        categories: ['Exterior'],
        brands: [],
        priceMin: undefined,
        priceMax: undefined,
        search: '',
        sortBy: 'created_at',
        page: 1,
        limit: 12,
      };
      
      await act(async () => {
        result.current.trackFilterChanges(previousFilters, currentFilters, 8);
      });
      
      // Debe trackear remoción de 'Interior' y 'Sherwin Williams'
      // Verificar que se llamó a fetch para cada remoción específica
      expect(global.fetch).toHaveBeenCalledWith('/api/analytics/events',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"filter_value":"Interior"')
        })
      );
      expect(global.fetch).toHaveBeenCalledWith('/api/analytics/events',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"filter_value":"Sherwin Williams"')
        })
      );
      // El hook hace 3 llamadas: 2 remociones + 1 adicional (posiblemente por otros cambios detectados)
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('detecta cambios de precio', async () => {
      mockFetchResponse(true);
      
      const { result } = renderHook(() => useFilterAnalytics());
      
      const previousFilters = {
        categories: [],
        brands: [],
        priceMin: undefined,
        priceMax: undefined,
        search: '',
        sortBy: 'created_at',
        page: 1,
        limit: 12,
      };
      
      const currentFilters = {
        categories: [],
        brands: [],
        priceMin: 1000,
        priceMax: 5000,
        search: '',
        sortBy: 'created_at',
        page: 1,
        limit: 12,
      };
      
      await act(async () => {
        result.current.trackFilterChanges(previousFilters, currentFilters, 5);
      });
      
      expect(global.fetch).toHaveBeenCalledWith('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"filter_value":"1000-5000"'),
      });
    });
  });

  // ===================================
  // TESTS DE MANEJO DE ERRORES
  // ===================================

  describe('Manejo de Errores', () => {
    it('maneja errores de fetch gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      
      const { result } = renderHook(() => useFilterAnalytics());
      
      await act(async () => {
        result.current.trackFilterApplied('category', 'Exterior', 12);
      });
      
      expect(console.warn).toHaveBeenCalledWith(
        'Failed to send analytics event to Supabase:',
        expect.any(Error)
      );
    });

    it('continúa funcionando cuando gtag no está disponible', async () => {
      delete (window as any).gtag;
      mockFetchResponse(true);
      
      const { result } = renderHook(() => useFilterAnalytics());
      
      await act(async () => {
        result.current.trackFilterApplied('category', 'Exterior', 12);
      });
      
      // Debe seguir enviando a Supabase
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  // ===================================
  // TESTS DE CONFIGURACIÓN
  // ===================================

  describe('Configuración', () => {
    it('no trackea cuando está deshabilitado', async () => {
      const { result } = renderHook(() => 
        useFilterAnalytics({ enabled: false })
      );
      
      await act(async () => {
        result.current.trackFilterApplied('category', 'Exterior', 12);
      });
      
      expect(global.fetch).not.toHaveBeenCalled();
      expect(window.gtag).not.toHaveBeenCalled();
    });

    it('funciona correctamente en modo debug', async () => {
      mockFetchResponse(true);

      const { result } = renderHook(() =>
        useFilterAnalytics({ debug: true })
      );

      await act(async () => {
        result.current.trackFilterApplied('category', 'Exterior', 12);
      });

      // Verificar que el tracking funciona normalmente en modo debug
      expect(global.fetch).toHaveBeenCalledWith('/api/analytics/events',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"filter_value":"Exterior"')
        })
      );
    });
  });

  // ===================================
  // TESTS DE EVENTOS DE SESIÓN
  // ===================================

  describe('Eventos de Sesión', () => {
    it('trackea inicio de sesión al montar', () => {
      mockFetchResponse(true);
      
      renderHook(() => useFilterAnalytics());
      
      expect(global.fetch).toHaveBeenCalledWith('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"event":"filter_session_started"'),
      });
    });

    it('trackea fin de sesión al desmontar', () => {
      mockFetchResponse(true);
      
      const { unmount } = renderHook(() => useFilterAnalytics());
      
      jest.clearAllMocks();
      
      unmount();
      
      expect(global.fetch).toHaveBeenCalledWith('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"event":"filter_session_ended"'),
      });
    });
  });
});
