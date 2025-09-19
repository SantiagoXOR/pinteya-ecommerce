// ===================================
// TESTS: Hook useBrandFilter
// ===================================

import { renderHook, act, waitFor } from '@testing-library/react';
import { useBrandFilter, useSimpleBrandFilter } from '@/hooks/useBrandFilter';

// Mock de la API de marcas
jest.mock('@/lib/api/brands', () => ({
  getBrands: jest.fn(() => Promise.resolve({
    success: true,
    data: [
      { name: 'El Galgo', products_count: 5 },
      { name: 'Plavicon', products_count: 8 },
      { name: 'Akapol', products_count: 3 },
      { name: 'Sinteplast', products_count: 2 },
    ]
  }))
}));

// Mock de Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => ({
    get: jest.fn(() => null),
    toString: jest.fn(() => ''),
  }),
}));

describe('useBrandFilter Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Funcionalidad básica', () => {
    it('debería cargar marcas automáticamente', async () => {
      const { result } = renderHook(() => useBrandFilter());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.brands).toEqual([]);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.brands).toHaveLength(4);
      expect(result.current.brands[0]).toEqual({
        name: 'El Galgo',
        products_count: 5
      });
    });

    it('debería permitir deshabilitar carga automática', () => {
      const { result } = renderHook(() => useBrandFilter({ autoLoad: false }));

      expect(result.current.isLoading).toBe(false);
      expect(result.current.brands).toEqual([]);
    });

    it('debería manejar selección de marcas', async () => {
      const { result } = renderHook(() => useBrandFilter());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setSelectedBrands(['El Galgo', 'Plavicon']);
      });

      expect(result.current.selectedBrands).toEqual(['El Galgo', 'Plavicon']);
    });

    it('debería alternar marcas correctamente', async () => {
      const { result } = renderHook(() => useBrandFilter());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Agregar marca
      act(() => {
        result.current.toggleBrand('El Galgo');
      });

      expect(result.current.selectedBrands).toEqual(['El Galgo']);

      // Quitar marca
      act(() => {
        result.current.toggleBrand('El Galgo');
      });

      expect(result.current.selectedBrands).toEqual([]);

      // Agregar múltiples marcas
      act(() => {
        result.current.toggleBrand('El Galgo');
      });
      act(() => {
        result.current.toggleBrand('Plavicon');
      });

      expect(result.current.selectedBrands).toEqual(['El Galgo', 'Plavicon']);
    });

    it('debería limpiar todas las marcas', async () => {
      const { result } = renderHook(() => useBrandFilter());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setSelectedBrands(['El Galgo', 'Plavicon', 'Akapol']);
      });

      expect(result.current.selectedBrands).toHaveLength(3);

      act(() => {
        result.current.clearBrands();
      });

      expect(result.current.selectedBrands).toEqual([]);
    });
  });

  describe('Manejo de errores', () => {
    it('debería manejar errores de API', async () => {
      const mockGetBrands = require('@/lib/api/brands').getBrands;
      mockGetBrands.mockRejectedValueOnce(new Error('Error de red'));

      const { result } = renderHook(() => useBrandFilter());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Error de red');
      expect(result.current.brands).toEqual([]);
    });

    it('debería manejar respuesta de API sin éxito', async () => {
      const mockGetBrands = require('@/lib/api/brands').getBrands;
      mockGetBrands.mockResolvedValueOnce({
        success: false,
        error: 'Error del servidor'
      });

      const { result } = renderHook(() => useBrandFilter());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Error del servidor');
      expect(result.current.brands).toEqual([]);
    });
  });

  describe('Búsqueda de marcas', () => {
    it('debería buscar marcas', async () => {
      const mockGetBrands = require('@/lib/api/brands').getBrands;
      const { result } = renderHook(() => useBrandFilter());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Mock respuesta de búsqueda
      mockGetBrands.mockResolvedValueOnce({
        success: true,
        data: [{ name: 'El Galgo', products_count: 5 }]
      });

      act(() => {
        result.current.searchBrands('galgo');
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockGetBrands).toHaveBeenCalledWith({
        search: 'galgo',
        minProducts: 1
      });
    });
  });

  describe('Refetch', () => {
    it('debería recargar marcas', async () => {
      const mockGetBrands = require('@/lib/api/brands').getBrands;
      const { result } = renderHook(() => useBrandFilter());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Limpiar llamadas anteriores
      mockGetBrands.mockClear();

      act(() => {
        result.current.refetch();
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockGetBrands).toHaveBeenCalledTimes(1);
    });
  });

  describe('Callback onBrandsChange', () => {
    it('debería llamar callback cuando cambian las marcas', async () => {
      const onBrandsChange = jest.fn();
      const { result } = renderHook(() => 
        useBrandFilter({ onBrandsChange })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setSelectedBrands(['El Galgo']);
      });

      expect(onBrandsChange).toHaveBeenCalledWith(['El Galgo']);

      act(() => {
        result.current.toggleBrand('Plavicon');
      });

      expect(onBrandsChange).toHaveBeenCalledWith(['El Galgo', 'Plavicon']);
    });
  });

  describe('Configuración de minProducts', () => {
    it('debería usar minProducts en las consultas', async () => {
      const mockGetBrands = require('@/lib/api/brands').getBrands;
      
      renderHook(() => useBrandFilter({ minProducts: 5 }));

      await waitFor(() => {
        expect(mockGetBrands).toHaveBeenCalledWith({ minProducts: 5 });
      });
    });
  });
});

describe('useSimpleBrandFilter Hook', () => {
  it('debería manejar selección simple de marcas', () => {
    const { result } = renderHook(() => useSimpleBrandFilter());

    expect(result.current.selectedBrands).toEqual([]);

    act(() => {
      result.current.setSelectedBrands(['El Galgo']);
    });

    expect(result.current.selectedBrands).toEqual(['El Galgo']);
  });

  it('debería alternar marcas', () => {
    const { result } = renderHook(() => useSimpleBrandFilter());

    act(() => {
      result.current.toggleBrand('El Galgo');
    });

    expect(result.current.selectedBrands).toEqual(['El Galgo']);

    act(() => {
      result.current.toggleBrand('El Galgo');
    });

    expect(result.current.selectedBrands).toEqual([]);
  });

  it('debería limpiar marcas', () => {
    const { result } = renderHook(() => useSimpleBrandFilter());

    act(() => {
      result.current.setSelectedBrands(['El Galgo', 'Plavicon']);
    });

    expect(result.current.selectedBrands).toHaveLength(2);

    act(() => {
      result.current.clearBrands();
    });

    expect(result.current.selectedBrands).toEqual([]);
  });
});









