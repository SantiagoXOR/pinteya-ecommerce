import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Schema para parámetros de consulta
const querySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
  status: z.enum(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'total', 'status']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// Datos simulados de órdenes para demostración
const mockOrders = [
  {
    id: 'ORD-1757119001-abc123',
    status: 'confirmed',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T11:00:00Z',
    customerInfo: {
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan.perez@email.com',
      phone: '+54 11 1234-5678'
    },
    shippingAddress: {
      streetAddress: 'Av. Corrientes 1234',
      apartment: 'Depto 5B',
      city: 'Buenos Aires',
      state: 'CABA',
      zipCode: 'C1043AAZ',
      country: 'Argentina',
      observations: 'Barrio San Telmo, edificio con portero, disponible de 9 a 18hs'
    },
    items: [
      {
        id: 'prod-001',
        name: 'Pintura Látex Interior Blanco 20L',
        price: 15000,
        quantity: 2,
        image: '/images/products/latex-blanco.jpg'
      },
      {
        id: 'prod-002',
        name: 'Rodillo Antigota Premium',
        price: 2500,
        quantity: 1,
        image: '/images/products/rodillo-premium.jpg'
      }
    ],
    paymentMethod: 'mercadopago',
    paymentStatus: 'paid',
    shippingMethod: 'express',
    totals: {
      subtotal: 32500,
      shipping: 5000,
      discount: 0,
      total: 37500
    },
    trackingNumber: 'TRK-2024-001',
    estimatedDelivery: '2024-01-17',
    orderNotes: 'Cliente prefiere entrega por la mañana'
  },
  {
    id: 'ORD-1757119002-def456',
    status: 'pending',
    createdAt: '2024-01-15T14:20:00Z',
    updatedAt: '2024-01-15T14:20:00Z',
    customerInfo: {
      firstName: 'María',
      lastName: 'González',
      email: 'maria.gonzalez@email.com',
      phone: '+54 11 9876-5432'
    },
    shippingAddress: {
      streetAddress: 'Calle Falsa 123',
      apartment: '',
      city: 'Córdoba',
      state: 'Córdoba',
      zipCode: '5000',
      country: 'Argentina',
      observations: 'Casa con portón verde, barrio Nueva Córdoba'
    },
    items: [
      {
        id: 'prod-003',
        name: 'Esmalte Sintético Azul 1L',
        price: 8500,
        quantity: 3,
        image: '/images/products/esmalte-azul.jpg'
      }
    ],
    paymentMethod: 'bank',
    paymentStatus: 'awaiting_transfer',
    shippingMethod: 'free',
    totals: {
      subtotal: 25500,
      shipping: 2500,
      discount: 2550, // 10% descuento por transferencia
      total: 25450
    },
    trackingNumber: null,
    estimatedDelivery: '2024-01-22',
    orderNotes: ''
  },
  {
    id: 'ORD-1757119003-ghi789',
    status: 'shipped',
    createdAt: '2024-01-14T09:15:00Z',
    updatedAt: '2024-01-15T16:30:00Z',
    customerInfo: {
      firstName: 'Carlos',
      lastName: 'Rodríguez',
      email: 'carlos.rodriguez@email.com',
      phone: '+54 11 5555-1234'
    },
    shippingAddress: {
      streetAddress: 'Av. Santa Fe 2500',
      apartment: 'Local 10',
      city: 'Buenos Aires',
      state: 'CABA',
      zipCode: 'C1425BGH',
      country: 'Argentina',
      observations: 'Entrega comercial, horario de 10 a 19hs de lunes a viernes'
    },
    items: [
      {
        id: 'prod-004',
        name: 'Kit Completo de Pinceles',
        price: 12000,
        quantity: 1,
        image: '/images/products/kit-pinceles.jpg'
      },
      {
        id: 'prod-005',
        name: 'Thinner para Dilución 5L',
        price: 6500,
        quantity: 2,
        image: '/images/products/thinner.jpg'
      }
    ],
    paymentMethod: 'mercadopago',
    paymentStatus: 'paid',
    shippingMethod: 'free',
    totals: {
      subtotal: 25000,
      shipping: 0, // Envío gratis por monto
      discount: 0,
      total: 25000
    },
    trackingNumber: 'TRK-2024-002',
    estimatedDelivery: '2024-01-16',
    orderNotes: 'Fragil - Manejar con cuidado'
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Validar parámetros de consulta
    const params = querySchema.parse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '10',
      status: searchParams.get('status') || undefined,
      search: searchParams.get('search') || undefined,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc',
    });
    
    let filteredOrders = [...mockOrders];
    
    // Filtrar por estado
    if (params.status) {
      filteredOrders = filteredOrders.filter(order => order.status === params.status);
    }
    
    // Filtrar por búsqueda
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      filteredOrders = filteredOrders.filter(order => 
        order.id.toLowerCase().includes(searchLower) ||
        order.customerInfo.firstName.toLowerCase().includes(searchLower) ||
        order.customerInfo.lastName.toLowerCase().includes(searchLower) ||
        order.customerInfo.email.toLowerCase().includes(searchLower) ||
        order.shippingAddress.observations?.toLowerCase().includes(searchLower)
      );
    }
    
    // Ordenar
    filteredOrders.sort((a, b) => {
      let aValue, bValue;
      
      switch (params.sortBy) {
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'total':
          aValue = a.totals.total;
          bValue = b.totals.total;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = a.createdAt;
          bValue = b.createdAt;
      }
      
      if (params.sortOrder === 'desc') {
        return aValue > bValue ? -1 : 1;
      } else {
        return aValue < bValue ? -1 : 1;
      }
    });
    
    // Paginación
    const page = parseInt(params.page);
    const limit = parseInt(params.limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const paginatedOrders = filteredOrders.slice(startIndex, endIndex);
    
    // Estadísticas
    const stats = {
      total: filteredOrders.length,
      pending: filteredOrders.filter(o => o.status === 'pending').length,
      confirmed: filteredOrders.filter(o => o.status === 'confirmed').length,
      shipped: filteredOrders.filter(o => o.status === 'shipped').length,
      delivered: filteredOrders.filter(o => o.status === 'delivered').length,
      cancelled: filteredOrders.filter(o => o.status === 'cancelled').length,
      totalRevenue: filteredOrders.reduce((sum, order) => sum + order.totals.total, 0),
      averageOrderValue: filteredOrders.length > 0 
        ? filteredOrders.reduce((sum, order) => sum + order.totals.total, 0) / filteredOrders.length 
        : 0
    };
    
    // Log de consulta
    console.log('📋 Consulta de órdenes:', {
      page,
      limit,
      status: params.status || 'todas',
      search: params.search || 'sin filtro',
      total: filteredOrders.length,
      returned: paginatedOrders.length
    });
    
    const response = {
      success: true,
      data: {
        orders: paginatedOrders,
        pagination: {
          page,
          limit,
          total: filteredOrders.length,
          totalPages: Math.ceil(filteredOrders.length / limit),
          hasNext: endIndex < filteredOrders.length,
          hasPrev: page > 1
        },
        stats,
        filters: {
          status: params.status,
          search: params.search,
          sortBy: params.sortBy,
          sortOrder: params.sortOrder
        }
      },
      message: `${paginatedOrders.length} órdenes encontradas`
    };
    
    return NextResponse.json(response, { status: 200 });
    
  } catch (error) {
    console.error('❌ Error obteniendo órdenes:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Parámetros de consulta inválidos',
        details: error.errors
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}

// Método OPTIONS para CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}