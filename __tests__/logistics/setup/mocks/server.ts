// =====================================================
// MOCKS: MSW SERVER PARA LOGISTICS TESTING
// Descripción: Mock Service Worker para interceptar APIs
// Basado en: MSW + REST + Handlers
// =====================================================

import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { 
  mockShipment, 
  mockTrackingEvent, 
  mockCourier, 
  mockLogisticsStats,
  mockGeofenceZone 
} from '../test-config';

// =====================================================
// HANDLERS DE API
// =====================================================

const handlers = [
  // =====================================================
  // DASHBOARD API
  // =====================================================
  http.get('/api/admin/logistics', () => {
    return HttpResponse.json({
      success: true,
      data: {
        stats: mockLogisticsStats,
        recent_shipments: [mockShipment],
        performance_metrics: [
          {
            date: '2024-02-10',
            shipments_count: 25,
            delivered_count: 20,
            on_time_count: 18,
            total_cost: 37500
          },
          {
            date: '2024-02-11',
            shipments_count: 30,
            delivered_count: 25,
            on_time_count: 23,
            total_cost: 45000
          }
        ],
        carrier_performance: [
          {
            carrier_id: 1,
            carrier_name: 'OCA',
            success_rate: 95.5,
            avg_delivery_time: 2.3,
            total_shipments: 150
          },
          {
            carrier_id: 2,
            carrier_name: 'Andreani',
            success_rate: 92.1,
            avg_delivery_time: 2.8,
            total_shipments: 120
          }
        ]
      }
    });
  }),

  // =====================================================
  // SHIPMENTS API
  // =====================================================
  http.get('/api/admin/logistics/shipments', ({ request }) => {
    const url = new URL(request.url);
    const page = url.searchParams.get('page') || '1';
    const limit = url.searchParams.get('limit') || '10';
    const status = url.searchParams.get('status');
    
    let shipments = [mockShipment];
    if (status) {
      shipments = shipments.filter(s => s.status === status);
    }
    
    return HttpResponse.json({
      success: true,
      data: {
        shipments,
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total: shipments.length,
          total_pages: Math.ceil(shipments.length / parseInt(limit))
        }
      }
    });
  }),

  http.post('/api/admin/logistics/shipments', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      success: true,
      data: {
        ...body,
        id: Date.now(),
        shipment_number: `SHP-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    });
  }),

  http.get('/api/admin/logistics/shipments/:id', ({ params }) => {
    const { id } = params;
    
    return HttpResponse.json({
      success: true,
      data: {
        ...mockShipment,
        id: parseInt(id as string)
      }
    });
  }),

  http.put('/api/admin/logistics/shipments/:id', async ({ params, request }) => {
    const { id } = params;
    const body = await request.json();
    
    return HttpResponse.json({
      success: true,
      data: {
        ...mockShipment,
        ...body,
        id: parseInt(id as string),
        updated_at: new Date().toISOString()
      }
    });
  }),

  http.delete('/api/admin/logistics/shipments/:id', ({ params }) => {
    const { id } = params;
    
    return HttpResponse.json({
      success: true,
      message: `Shipment ${id} deleted successfully`
    });
  }),

  // =====================================================
  // TRACKING API
  // =====================================================
  http.get('/api/admin/logistics/tracking/:id', ({ params }) => {
    const { id } = params;
    
    return HttpResponse.json({
      success: true,
      data: {
        shipment_id: parseInt(id as string),
        tracking_events: [mockTrackingEvent],
        current_status: 'in_transit',
        estimated_delivery: '2024-02-15T18:00:00Z'
      }
    });
  }),

  // =====================================================
  // COURIERS API
  // =====================================================
  http.get('/api/admin/logistics/couriers', () => {
    return HttpResponse.json({
      success: true,
      data: {
        couriers: [mockCourier],
        total: 1
      }
    });
  }),

  http.post('/api/admin/logistics/couriers/quote', async ({ request }) => {
    const body = await request.json();
    
    return HttpResponse.json({
      success: true,
      data: {
        quotes: [
          {
            courier_id: 1,
            courier_name: 'OCA',
            service_type: 'standard',
            price: 1250.00,
            estimated_days: 3,
            currency: 'ARS'
          },
          {
            courier_id: 2,
            courier_name: 'Andreani',
            service_type: 'express',
            price: 1850.00,
            estimated_days: 2,
            currency: 'ARS'
          }
        ]
      }
    });
  }),

  // =====================================================
  // GEOFENCES API
  // =====================================================
  http.get('/api/admin/logistics/geofences', () => {
    return HttpResponse.json({
      success: true,
      data: {
        zones: [mockGeofenceZone],
        total: 1
      }
    });
  }),

  http.post('/api/admin/logistics/geofences', async ({ request }) => {
    const body = await request.json();
    
    return HttpResponse.json({
      success: true,
      data: {
        ...body,
        id: Date.now(),
        created_at: new Date().toISOString()
      }
    });
  }),

  // =====================================================
  // ERROR HANDLERS PARA TESTING
  // =====================================================
  http.get('/api/admin/logistics/error-test', () => {
    return new HttpResponse(null, { status: 500 });
  }),

  http.get('/api/admin/logistics/timeout-test', async () => {
    await new Promise(resolve => setTimeout(resolve, 5000));
    return HttpResponse.json({ success: true });
  }),

  http.get('/api/admin/logistics/rate-limit-test', () => {
    return new HttpResponse(null, { status: 429 });
  })
];

// =====================================================
// DYNAMIC HANDLERS PARA TESTING ESPECÍFICO
// =====================================================

export const mockDashboardError = () => {
  return http.get('/api/admin/logistics', () => {
    return new HttpResponse(null, { status: 500 });
  });
};

export const mockEmptyShipments = () => {
  return http.get('/api/admin/logistics/shipments', () => {
    return HttpResponse.json({
      success: true,
      data: {
        shipments: [],
        pagination: {
          current_page: 1,
          per_page: 10,
          total: 0,
          total_pages: 0
        }
      }
    });
  });
};

export const mockEmptyTracking = () => {
  return http.get('/api/admin/logistics/tracking/:id', () => {
    return HttpResponse.json({
      success: true,
      data: {
        tracking_events: [],
        current_status: 'unknown'
      }
    });
  });
};

export const mockInactiveCouriers = () => {
  return http.get('/api/admin/logistics/couriers', () => {
    return HttpResponse.json({
      success: true,
      data: {
        couriers: [],
        total: 0
      }
    });
  });
};

// =====================================================
// SERVER SETUP
// =====================================================

export const server = setupServer(...handlers);

// =====================================================
// UTILIDADES PARA TESTING
// =====================================================

export const simulateNetworkError = (endpoint: string) => {
  server.use(
    http.get(endpoint, () => {
      return HttpResponse.error();
    })
  );
};

export const simulateSlowResponse = (endpoint: string, delay: number = 2000) => {
  server.use(
    http.get(endpoint, async () => {
      await new Promise(resolve => setTimeout(resolve, delay));
      return HttpResponse.json({
        success: true,
        data: {}
      });
    })
  );
};
