import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// Tipos para clientes (placeholder)
interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: 'active' | 'inactive' | 'blocked';
  orders_count: number;
  total_spent: number;
  last_order_date?: string;
  created_at: string;
  updated_at: string;
}

// Datos de ejemplo para clientes (placeholder)
const mockCustomers: Customer[] = [
  {
    id: 'cust_1',
    name: 'Juan Pérez',
    email: 'juan@example.com',
    phone: '+54 11 1234-5678',
    status: 'active',
    orders_count: 5,
    total_spent: 45000,
    last_order_date: new Date().toISOString(),
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cust_2',
    name: 'María García',
    email: 'maria@example.com',
    phone: '+54 11 9876-5432',
    status: 'active',
    orders_count: 3,
    total_spent: 28500,
    last_order_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cust_3',
    name: 'Carlos López',
    email: 'carlos@example.com',
    status: 'inactive',
    orders_count: 1,
    total_spent: 12000,
    last_order_date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API: GET /api/admin/customers - Iniciando...');

    // Verificar autenticación
    const { userId } = await auth();
    if (!userId) {
      console.log('❌ Usuario no autenticado');
      return NextResponse.json({
        success: false,
        error: 'No autorizado'
      }, { status: 401 });
    }

    // Obtener parámetros de query
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    console.log('📊 Parámetros:', { page, limit, status, search });

    // Filtrar clientes (placeholder logic)
    let filteredCustomers = [...mockCustomers];
    
    if (status) {
      filteredCustomers = filteredCustomers.filter(customer => customer.status === status);
    }
    
    if (search) {
      filteredCustomers = filteredCustomers.filter(customer => 
        customer.name.toLowerCase().includes(search.toLowerCase()) ||
        customer.email.toLowerCase().includes(search.toLowerCase()) ||
        customer.id.includes(search)
      );
    }

    // Paginación
    const total = filteredCustomers.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedCustomers = filteredCustomers.slice(offset, offset + limit);

    const response = {
      success: true,
      data: paginatedCustomers,
      total,
      pagination: {
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      message: `${paginatedCustomers.length} clientes encontrados de ${total} totales`
    };

    console.log('✅ Respuesta exitosa:', {
      customersCount: paginatedCustomers.length,
      total,
      page,
      totalPages
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error en GET /api/admin/customers:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 API: POST /api/admin/customers - Iniciando...');

    // Verificar autenticación
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'No autorizado'
      }, { status: 401 });
    }

    // TODO: Implementar creación de clientes
    return NextResponse.json({
      success: false,
      error: 'Funcionalidad no implementada aún',
      message: 'La creación de clientes estará disponible en una próxima versión'
    }, { status: 501 });

  } catch (error) {
    console.error('❌ Error en POST /api/admin/customers:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
