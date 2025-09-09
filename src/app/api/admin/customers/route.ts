import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { logger, LogLevel, LogCategory } from '@/lib/logger';

// Tipos para clientes
interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  created_at: string;
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API: GET /api/admin/customers - Iniciando...');

    // Verificar autenticación
    const session = await auth();
    if (!session?.user) {
      console.log('❌ Usuario no autenticado');
      return NextResponse.json({
        success: false,
        error: 'No autorizado'
      }, { status: 401 });
    }

    logger.log(LogLevel.INFO, LogCategory.API, 'Fetching customers for admin', {
      userId: session.user.id
    });

    // Obtener parámetros de query
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';

    console.log('📊 Parámetros:', { page, limit, search });

    // Calcular offset
    const offset = (page - 1) * limit;

    // Construir query base
    const supabase = createAdminClient();
    let query = supabase
      .from('users')
      .select('id, name, email, created_at', { count: 'exact' });

    // Aplicar filtros de búsqueda si se proporciona
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Aplicar paginación y ordenamiento
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: customers, error, count } = await query;

    if (error) {
      logger.log(LogLevel.ERROR, LogCategory.DATABASE, 'Error fetching customers', { error });
      return NextResponse.json({
        success: false,
        error: 'Error al obtener clientes'
      }, { status: 500 });
    }

    // Formatear datos para el frontend
    const formattedCustomers: Customer[] = customers?.map(customer => ({
      id: customer.id,
      name: customer.name || 'Sin nombre',
      email: customer.email,
      phone: '', // TODO: Agregar campo phone a la tabla users si es necesario
      address: '', // TODO: Agregar campo address a la tabla users si es necesario
      created_at: customer.created_at
    })) || [];

    const response = {
      success: true,
      data: formattedCustomers,
      total: count || 0,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
        hasNext: page < Math.ceil((count || 0) / limit),
        hasPrev: page > 1,
      },
      message: `${formattedCustomers.length} clientes encontrados de ${count || 0} totales`
    };

    console.log('✅ Respuesta exitosa:', {
      customersCount: formattedCustomers.length,
      total: count,
      page,
      totalPages: Math.ceil((count || 0) / limit)
    });

    logger.log(LogLevel.INFO, LogCategory.API, 'Customers fetched successfully', {
      count: formattedCustomers.length,
      total: count
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error en GET /api/admin/customers:', error);
    logger.log(LogLevel.ERROR, LogCategory.API, 'Unexpected error in customers API', { error });

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
    const session = await auth();
    if (!session?.user) {
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
