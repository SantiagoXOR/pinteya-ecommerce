/**
 * Tests de integración para las APIs del sistema de drivers
 * Verifica todas las funcionalidades de las APIs implementadas
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';

// Mock de NextAuth
jest.mock('@/auth', () => ({
  auth: jest.fn()
}));

// Mock de Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn()
}));

// Importar las APIs a testear
import { GET as getProfile, PUT as updateProfile } from '@/app/api/driver/profile/route';
import { GET as getRoute, PUT as updateRoute } from '@/app/api/driver/routes/[id]/route';
import { POST as updateLocation, GET as getLocation } from '@/app/api/driver/location/route';
import { POST as getDirections } from '@/app/api/driver/navigation/directions/route';
import { GET as getDeliveries, POST as updateDelivery } from '@/app/api/driver/deliveries/route';

describe('Driver APIs Integration Tests', () => {
  const mockAuth = require('@/auth').auth;
  const mockCreateClient = require('@/lib/supabase/server').createClient;
  
  const mockSession = {
    user: {
      email: 'carlos@pinteya.com',
      name: 'Carlos Rodríguez'
    }
  };

  const mockDriver = {
    id: 'driver-1',
    name: 'Carlos Rodríguez',
    email: 'carlos@pinteya.com',
    phone: '+54 11 1234-5678',
    vehicle_type: 'Van',
    license_plate: 'ABC123',
    status: 'available',
    current_location: { lat: -34.6037, lng: -58.3816 }
  };

  const mockSupabaseClient = {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: mockDriver, error: null })),
          order: jest.fn(() => Promise.resolve({ data: [], error: null }))
        })),
        in: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({ data: [], error: null }))
        })),
        gte: jest.fn(() => ({
          lte: jest.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: mockDriver, error: null }))
          }))
        }))
      })),
      insert: jest.fn(() => Promise.resolve({ data: null, error: null }))
    }))
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue(mockSession);
    mockCreateClient.mockResolvedValue(mockSupabaseClient);
  });

  describe('Driver Profile API', () => {
    it('should get driver profile successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/driver/profile');
      
      const response = await getProfile(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.driver).toBeDefined();
      expect(data.driver.email).toBe('carlos@pinteya.com');
      expect(data.routes).toBeDefined();
      expect(data.todayStats).toBeDefined();
    });

    it('should update driver profile successfully', async () => {
      const requestBody = {
        status: 'busy',
        current_location: { lat: -34.6118, lng: -58.3960 }
      };

      const request = new NextRequest('http://localhost:3000/api/driver/profile', {
        method: 'PUT',
        body: JSON.stringify(requestBody)
      });

      const response = await updateProfile(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.driver).toBeDefined();
    });

    it('should return 401 for unauthenticated request', async () => {
      mockAuth.mockResolvedValue(null);
      
      const request = new NextRequest('http://localhost:3000/api/driver/profile');
      const response = await getProfile(request);

      expect(response.status).toBe(401);
    });
  });

  describe('Driver Location API', () => {
    it('should update location successfully', async () => {
      const requestBody = {
        location: { lat: -34.6037, lng: -58.3816 },
        speed: 25,
        heading: 180,
        accuracy: 5
      };

      const request = new NextRequest('http://localhost:3000/api/driver/location', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      const response = await updateLocation(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.location).toBeDefined();
      expect(data.driver).toBeDefined();
    });

    it('should get current location successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/driver/location');
      
      const response = await getLocation(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.location).toBeDefined();
      expect(data.status).toBeDefined();
    });

    it('should validate location data', async () => {
      const requestBody = {
        location: { lat: 'invalid', lng: -58.3816 }
      };

      const request = new NextRequest('http://localhost:3000/api/driver/location', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      const response = await updateLocation(request);

      expect(response.status).toBe(400);
    });
  });

  describe('Driver Routes API', () => {
    it('should get route details successfully', async () => {
      const mockRoute = {
        id: 'route-1',
        name: 'Ruta Centro',
        shipments: [
          {
            id: 'shipment-1',
            customer_name: 'Cliente Test',
            destination: {
              address: 'Av. Corrientes 1234',
              coordinates: { lat: -34.6037, lng: -58.3816 }
            }
          }
        ]
      };

      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: mockRoute,
        error: null
      });

      const request = new NextRequest('http://localhost:3000/api/driver/routes/route-1');
      const response = await getRoute(request, { params: { id: 'route-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe('route-1');
      expect(data.shipments).toBeDefined();
    });
  });

  describe('Driver Navigation API', () => {
    it('should calculate directions successfully', async () => {
      // Mock Google Directions API response
      global.fetch = jest.fn(() =>
        Promise.resolve({
          json: () => Promise.resolve({
            status: 'OK',
            routes: [{
              legs: [{
                distance: { value: 5000, text: '5.0 km' },
                duration: { value: 900, text: '15 mins' },
                steps: [{
                  html_instructions: 'Head north on Av. Corrientes',
                  distance: { text: '500 m' },
                  duration: { text: '2 mins' },
                  maneuver: 'straight',
                  start_location: { lat: -34.6037, lng: -58.3816 },
                  end_location: { lat: -34.6000, lng: -58.3816 }
                }]
              }],
              overview_polyline: { points: 'encoded_polyline' },
              bounds: {},
              waypoint_order: []
            }]
          })
        })
      ) as jest.Mock;

      const requestBody = {
        origin: { lat: -34.6037, lng: -58.3816 },
        destination: { lat: -34.6118, lng: -58.3960 }
      };

      const request = new NextRequest('http://localhost:3000/api/driver/navigation/directions', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      const response = await getDirections(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.route).toBeDefined();
      expect(data.instructions).toBeDefined();
      expect(data.summary).toBeDefined();
    });
  });

  describe('Driver Deliveries API', () => {
    it('should get deliveries successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/driver/deliveries');
      
      const response = await getDeliveries(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.deliveries).toBeDefined();
      expect(data.stats).toBeDefined();
    });

    it('should update delivery status successfully', async () => {
      const requestBody = {
        delivery_id: 'delivery-1',
        route_id: 'route-1',
        status: 'delivered',
        delivery_notes: 'Entregado exitosamente'
      };

      const request = new NextRequest('http://localhost:3000/api/driver/deliveries', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      const response = await updateDelivery(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.status).toBe('delivered');
    });
  });
});
