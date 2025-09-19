/**
 * Tests para el hook useGeolocation
 * Verifica la funcionalidad de geolocalización automática y detección de zonas
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useGeolocation } from '../useGeolocation';

// Mock del navigator.geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
};

// Mock del navigator.permissions
const mockPermissions = {
  query: jest.fn().mockResolvedValue({ state: 'prompt' }),
};

// Setup global mocks
Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
});

Object.defineProperty(global.navigator, 'permissions', {
  value: mockPermissions,
  writable: true,
});

// Mock console.log para evitar spam en tests
const originalConsoleLog = console.log;
beforeAll(() => {
  console.log = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
});

describe('useGeolocation Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Estado inicial', () => {
    it('debe inicializar con valores por defecto', () => {
      const { result } = renderHook(() => useGeolocation());

      expect(result.current.location).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.permissionStatus).toBe('unknown');
      expect(result.current.detectedZone).toBeNull();
    });

    it('debe tener las funciones necesarias', () => {
      const { result } = renderHook(() => useGeolocation());

      expect(typeof result.current.requestLocation).toBe('function');
      expect(typeof result.current.getAvailableZones).toBe('function');
      expect(typeof result.current.selectZone).toBe('function');
      expect(Array.isArray(result.current.deliveryZones)).toBe(true);
    });
  });

  describe('Verificación de permisos', () => {
    it('debe verificar permisos al montar el componente', async () => {
      const mockPermissionResult = {
        state: 'prompt',
      };

      mockPermissions.query.mockResolvedValue(mockPermissionResult);

      renderHook(() => useGeolocation());

      await waitFor(() => {
        expect(mockPermissions.query).toHaveBeenCalledWith({ name: 'geolocation' });
      });
    });

    it('debe solicitar ubicación automáticamente si ya tiene permisos', async () => {
      const mockPermissionResult = {
        state: 'granted',
      };

      const mockPosition = {
        coords: {
          latitude: -31.4201,
          longitude: -64.1888,
        },
      };

      mockPermissions.query.mockResolvedValue(mockPermissionResult);
      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      const { result } = renderHook(() => useGeolocation());

      await waitFor(() => {
        expect(result.current.permissionStatus).toBe('granted');
      });

      // Verificar que el hook está funcionando correctamente con permisos granted
      expect(result.current.error).toBeNull();
    });
  });

  describe('Solicitud de ubicación', () => {
    it('debe manejar ubicación exitosa', async () => {
      const mockPosition = {
        coords: {
          latitude: -31.4201,
          longitude: -64.1888,
        },
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      const { result } = renderHook(() => useGeolocation());

      act(() => {
        result.current.requestLocation();
      });

      await waitFor(() => {
        expect(result.current.location).toEqual({
          lat: -31.4201,
          lng: -64.1888,
        });
        expect(result.current.isLoading).toBe(false);
        expect(result.current.permissionStatus).toBe('granted');
        expect(result.current.detectedZone?.name).toBe('Córdoba Capital');
      });
    });

    it('debe manejar error de permisos denegados', async () => {
      const mockError = {
        code: 1, // PERMISSION_DENIED
        message: 'Permission denied',
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error(mockError);
      });

      const { result } = renderHook(() => useGeolocation());

      act(() => {
        result.current.requestLocation();
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Error al obtener ubicación');
        expect(result.current.isLoading).toBe(false);
        expect(result.current.permissionStatus).toBe('unknown');
      });
    });

    it('debe manejar timeout de geolocalización', async () => {
      const mockError = {
        code: 3, // TIMEOUT
        message: 'Timeout',
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error(mockError);
      });

      const { result } = renderHook(() => useGeolocation());

      act(() => {
        result.current.requestLocation();
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Error al obtener ubicación');
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('Detección de zonas', () => {
    it('debe detectar Córdoba Capital para coordenadas locales', async () => {
      const mockPosition = {
        coords: {
          latitude: -31.4201,
          longitude: -64.1888,
        },
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      const { result } = renderHook(() => useGeolocation());

      act(() => {
        result.current.requestLocation();
      });

      await waitFor(() => {
        expect(result.current.detectedZone?.name).toBe('Córdoba Capital');
        expect(result.current.detectedZone?.available).toBe(true);
      });
    });

    it('debe usar Interior de Córdoba como fallback', async () => {
      const mockPosition = {
        coords: {
          latitude: -32.0000, // Fuera del radio de Córdoba Capital
          longitude: -65.0000,
        },
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      const { result } = renderHook(() => useGeolocation());

      act(() => {
        result.current.requestLocation();
      });

      await waitFor(() => {
        expect(result.current.detectedZone?.name).toBe('Interior de Córdoba');
      });
    });
  });

  describe('Selección manual de zona', () => {
    it('debe permitir seleccionar zona manualmente', () => {
      const { result } = renderHook(() => useGeolocation());

      act(() => {
        result.current.selectZone('buenos-aires');
      });

      expect(result.current.detectedZone?.name).toBe('Buenos Aires');
    });

    it('debe ignorar IDs de zona inválidos', () => {
      const { result } = renderHook(() => useGeolocation());

      act(() => {
        result.current.selectZone('zona-inexistente');
      });

      expect(result.current.detectedZone).toBeNull();
    });
  });

  describe('Zonas disponibles', () => {
    it('debe retornar todas las zonas de entrega', () => {
      const { result } = renderHook(() => useGeolocation());

      const zones = result.current.getAvailableZones();

      expect(zones).toHaveLength(4);
      expect(zones.map(z => z.name)).toContain('Córdoba Capital');
      expect(zones.map(z => z.name)).toContain('Interior de Córdoba');
      expect(zones.map(z => z.name)).toContain('Buenos Aires');
      expect(zones.map(z => z.name)).toContain('Rosario');
    });
  });

  describe('Navegador sin soporte', () => {
    it('debe manejar navegador sin geolocalización', () => {
      // Temporalmente remover geolocation
      const originalGeolocation = global.navigator.geolocation;
      Object.defineProperty(global.navigator, 'geolocation', {
        value: undefined,
        writable: true,
      });

      const { result } = renderHook(() => useGeolocation());

      act(() => {
        result.current.requestLocation();
      });

      expect(result.current.error).toBe('Geolocalización no soportada por este navegador');
      expect(result.current.permissionStatus).toBe('denied');

      // Restaurar geolocation
      Object.defineProperty(global.navigator, 'geolocation', {
        value: originalGeolocation,
        writable: true,
      });
    });
  });
});









