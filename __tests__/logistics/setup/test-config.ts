// =====================================================
// CONFIGURACIÓN: TESTING SUITE LOGISTICS ENTERPRISE
// Descripción: Configuración optimizada para testing del módulo de logística
// Basado en: Jest + RTL + MSW + Testing Library
// =====================================================

import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

// Interfaces para tipado
interface MockWebSocketInstance {
  send: jest.Mock;
  close: jest.Mock;
  readyState: number;
  CONNECTING: number;
  OPEN: number;
  CLOSING: number;
  CLOSED: number;
  addEventListener: jest.Mock;
  removeEventListener: jest.Mock;
  onopen: (() => void) | null;
  onclose: (() => void) | null;
  onmessage: (() => void) | null;
  onerror: (() => void) | null;
}

interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
}

interface GeolocationPosition {
  coords: Coordinates;
}

type CoordinatesPair = [number, number];

// =====================================================
// CONFIGURACIÓN DE TESTING LIBRARY
// =====================================================

configure({
  testIdAttribute: 'data-testid',
  asyncUtilTimeout: 5000,
  computedStyleSupportsPseudoElements: true
});

// =====================================================
// CONFIGURACIÓN DE MOCKS SIMPLES (SIN MSW)
// =====================================================

// Mock global fetch para APIs
global.fetch = jest.fn();

// Configurar mocks antes de todos los tests
beforeAll(() => {
  // Mock básico para APIs de logistics
  (global.fetch as jest.Mock).mockImplementation((url: string) => {
    if (url.includes('/api/admin/logistics')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          data: [],
          success: true,
          message: 'Mock response'
        })
      });
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({})
    });
  });
});

// Resetear mocks después de cada test
afterEach(() => {
  jest.clearAllMocks();
});

// Limpiar después de todos los tests
afterAll(() => {
  jest.restoreAllMocks();
});

// =====================================================
// MOCKS GLOBALES
// =====================================================

// Mock de MapLibre GL JS
jest.mock('maplibre-gl', () => ({
  Map: jest.fn(() => ({
    on: jest.fn(),
    off: jest.fn(),
    addSource: jest.fn(),
    addLayer: jest.fn(),
    getSource: jest.fn(() => ({
      setData: jest.fn()
    })),
    setStyle: jest.fn(),
    fitBounds: jest.fn(),
    remove: jest.fn(),
    getCanvas: jest.fn(() => ({
      style: {}
    })),
    readyState: 1
  })),
  LngLatBounds: jest.fn(() => ({
    extend: jest.fn()
  }))
}));

// Mock de WebSocket
global.WebSocket = jest.fn(() => ({
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  send: jest.fn(),
  close: jest.fn(),
  readyState: 1,
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3
})) as MockWebSocketInstance;

// Mock de Notification API
Object.defineProperty(window, 'Notification', {
  writable: true,
  value: jest.fn(() => ({
    close: jest.fn()
  }))
});

Object.defineProperty(Notification, 'permission', {
  writable: true,
  value: 'granted'
});

// Mock de geolocation
Object.defineProperty(navigator, 'geolocation', {
  writable: true,
  value: {
    getCurrentPosition: jest.fn((success) => 
      success({
        coords: {
          latitude: -34.6037,
          longitude: -58.3816,
          accuracy: 10
        }
      })
    ),
    watchPosition: jest.fn(),
    clearWatch: jest.fn()
  }
});

// Mock de IntersectionObserver
global.IntersectionObserver = jest.fn(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
})) as jest.MockedClass<typeof IntersectionObserver>;

// Mock de ResizeObserver
global.ResizeObserver = jest.fn(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
})) as jest.MockedClass<typeof ResizeObserver>;

// =====================================================
// UTILIDADES DE TESTING
// =====================================================

export const mockShipment = {
  id: 1,
  shipment_number: 'SHP-001',
  order_id: 1,
  status: 'in_transit',
  carrier_id: 1,
  shipping_service: 'standard',
  tracking_number: 'TRK-123456',
  delivery_address: {
    street: 'Av. Corrientes',
    number: '1234',
    apartment: '',
    neighborhood: 'San Nicolás',
    city: 'Buenos Aires',
    state: 'Buenos Aires',
    postal_code: '1043',
    country: 'Argentina'
  },
  pickup_address: {
    street: 'Av. Santa Fe',
    number: '5678',
    apartment: '',
    neighborhood: 'Palermo',
    city: 'Buenos Aires',
    state: 'Buenos Aires',
    postal_code: '1425',
    country: 'Argentina'
  },
  weight_kg: 2.5,
  dimensions_cm: '30x20x15',
  total_cost: 1500,
  estimated_delivery_date: '2024-02-15',
  special_instructions: 'Llamar antes de entregar',
  notes: 'Producto frágil',
  created_at: '2024-02-10T10:00:00Z',
  updated_at: '2024-02-10T10:00:00Z',
  carrier: {
    id: 1,
    name: 'OCA',
    code: 'OCA',
    logo_url: '/logos/oca.png',
    is_active: true
  },
  items: [{
    id: 1,
    product_id: 1,
    quantity: 1,
    weight_kg: 2.5
  }]
};

export const mockTrackingEvent = {
  id: 1,
  shipment_id: 1,
  status: 'in_transit',
  description: 'Paquete en tránsito hacia destino',
  location: 'Buenos Aires, Argentina',
  latitude: -34.6037,
  longitude: -58.3816,
  occurred_at: '2024-02-10T12:00:00Z',
  created_at: '2024-02-10T12:00:00Z'
};

export const mockCourier = {
  id: 1,
  name: 'OCA',
  code: 'OCA',
  logo_url: '/logos/oca.png',
  website_url: 'https://oca.com.ar',
  contact_phone: '+54 11 4000-0000',
  contact_email: 'info@oca.com.ar',
  is_active: true,
  supported_services: ['standard', 'express'],
  coverage_areas: ['Buenos Aires', 'Córdoba', 'Santa Fe'],
  base_cost: 500,
  cost_per_kg: 100,
  api_config: {
    base_url: 'https://api.oca.com.ar',
    api_key: 'test-key',
    environment: 'sandbox'
  },
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

export const mockLogisticsStats = {
  total_shipments: 150,
  pending_shipments: 25,
  confirmed_shipments: 30,
  in_transit_shipments: 45,
  delivered_shipments: 40,
  exception_shipments: 5,
  cancelled_shipments: 5,
  average_delivery_time: 3.5,
  on_time_delivery_rate: 92.5,
  total_shipping_cost: 225000,
  active_couriers: 4
};

export const mockGeofenceZone = {
  id: 'test-zone',
  name: 'Zona de Prueba',
  type: 'delivery_zone' as const,
  coordinates: [
    [-58.5, -34.5],
    [-58.4, -34.5],
    [-58.4, -34.6],
    [-58.5, -34.6],
    [-58.5, -34.5]
  ] as [number, number][],
  center: [-58.45, -34.55] as [number, number],
  active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  rules: [{
    id: 'rule-1',
    event_type: 'enter' as const,
    action: 'notification' as const,
    conditions: {
      shipment_status: ['in_transit']
    },
    active: true
  }],
  stats: {
    total_events: 50,
    enter_events: 25,
    exit_events: 25,
    unique_shipments: 30,
    avg_dwell_time: 45,
    last_event: '2024-02-10T10:00:00Z'
  }
};

// =====================================================
// HELPERS DE TESTING
// =====================================================

export const waitForLoadingToFinish = () => {
  return new Promise(resolve => setTimeout(resolve, 100));
};

export const mockIntersectionObserver = () => {
  const mockIntersectionObserver = jest.fn();
  mockIntersectionObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null
  });
  window.IntersectionObserver = mockIntersectionObserver;
};

export const mockResizeObserver = () => {
  const mockResizeObserver = jest.fn();
  mockResizeObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null
  });
  window.ResizeObserver = mockResizeObserver;
};

export const createMockWebSocket = () => {
  const mockWebSocket = {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    send: jest.fn(),
    close: jest.fn(),
    readyState: 1,
    CONNECTING: 0,
    OPEN: 1,
    CLOSING: 2,
    CLOSED: 3,
    onopen: null,
    onclose: null,
    onmessage: null,
    onerror: null
  };
  
  global.WebSocket = jest.fn(() => mockWebSocket) as jest.MockedClass<typeof WebSocket>;
  return mockWebSocket;
};

// =====================================================
// CUSTOM MATCHERS
// =====================================================

expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
  
  toHaveValidCoordinates(received: CoordinatesPair) {
    const isValid = Array.isArray(received) && 
                   received.length === 2 && 
                   typeof received[0] === 'number' && 
                   typeof received[1] === 'number' &&
                   received[0] >= -180 && received[0] <= 180 &&
                   received[1] >= -90 && received[1] <= 90;
    
    if (isValid) {
      return {
        message: () => `expected ${received} not to be valid coordinates`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be valid coordinates [lng, lat]`,
        pass: false,
      };
    }
  }
});

// =====================================================
// TIPOS PARA CUSTOM MATCHERS
// =====================================================

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeWithinRange(floor: number, ceiling: number): R;
      toHaveValidCoordinates(): R;
    }
  }
}
