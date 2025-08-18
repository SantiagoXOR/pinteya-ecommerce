// ===================================
// PINTEYA E-COMMERCE - ADMIN ORDERS API ENTERPRISE
// ===================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { auth, currentUser } from '@clerk/nextjs/server';
import { ApiResponse } from '@/types/api';
import { z } from 'zod';
import { logger, LogLevel, LogCategory } from '@/lib/logger';
import { checkRateLimit, addRateLimitHeaders, RATE_LIMIT_CONFIGS } from '@/lib/rate-limiter';
import { metricsCollector } from '@/lib/metrics';

// ===================================
// SCHEMAS DE VALIDACIÓN ENTERPRISE
// ===================================

const OrderFiltersSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.string().optional(),
  payment_status: z.string().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  search: z.string().optional(),
  sort_by: z.enum(['created_at', 'total_amount', 'order_number']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

const CreateOrderSchema = z.object({
  user_id: z.string().uuid('ID de usuario inválido'),
  items: z.array(z.object({
    product_id: z.number().min(1),
    quantity: z.number().min(1).max(99),
    unit_price: z.number().min(0),
  })).min(1, 'Al menos un item es requerido'),
  shipping_address: z.object({
    street_name: z.string().min(1),
    street_number: z.string().min(1),
    zip_code: z.string().min(1),
    city_name: z.string().min(1),
    state_name: z.string().min(1),
  }).optional(),
  notes: z.string().optional(),
});

// ===================================
// MIDDLEWARE DE AUTENTICACIÓN ADMIN
// ===================================

async function validateAdminAuth() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { error: 'Usuario no autenticado', status: 401 };
    }

    const user = await currentUser();
    if (!user) {
      return { error: 'Usuario no encontrado', status: 401 };
    }

    // Verificar si es admin (usando email como en otros endpoints admin)
    const isAdmin = user.emailAddresses?.[0]?.emailAddress === 'santiago@xor.com.ar';
    if (!isAdmin) {
      return { error: 'Acceso denegado - Se requieren permisos de administrador', status: 403 };
    }

    return { user, userId };
  } catch (error) {
    logger.log(LogLevel.ERROR, LogCategory.AUTH, 'Error en validación admin', { error });
    return { error: 'Error de autenticación', status: 500 };
  }
}

// ===================================
// GET - Listar órdenes con filtros avanzados
// ===================================
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Rate limiting
    const rateLimitResult = await checkRateLimit(
      request,
      RATE_LIMIT_CONFIGS.admin.requests,
      RATE_LIMIT_CONFIGS.admin.window,
      'admin-orders'
    );

    if (!rateLimitResult.success) {
      const response = NextResponse.json(
        { error: 'Demasiadas solicitudes' },
        { status: 429 }
      );
      addRateLimitHeaders(response, rateLimitResult);
      return response;
    }

    // Validar autenticación admin
    const authResult = await validateAdminAuth();
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    // Validar parámetros de consulta
    const { searchParams } = new URL(request.url);
    const filtersResult = OrderFiltersSchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      status: searchParams.get('status'),
      payment_status: searchParams.get('payment_status'),
      date_from: searchParams.get('date_from'),
      date_to: searchParams.get('date_to'),
      search: searchParams.get('search'),
      sort_by: searchParams.get('sort_by'),
      sort_order: searchParams.get('sort_order'),
    });

    if (!filtersResult.success) {
      return NextResponse.json(
        { error: 'Parámetros de consulta inválidos', details: filtersResult.error.errors },
        { status: 400 }
      );
    }

    const filters = filtersResult.data;

    // Construir query base con joins optimizados
    let query = supabaseAdmin
      .from('orders')
      .select(`
        id,
        order_number,
        status,
        payment_status,
        total_amount,
        currency,
        created_at,
        updated_at,
        shipping_address,
        notes,
        user_profiles!orders_user_id_fkey (
          id,
          name,
          email
        ),
        order_items (
          id,
          quantity,
          unit_price,
          total_price,
          products (
            id,
            name,
            images
          )
        )
      `, { count: 'exact' });

    // Aplicar filtros
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.payment_status) {
      query = query.eq('payment_status', filters.payment_status);
    }

    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from);
    }

    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to);
    }

    if (filters.search) {
      query = query.or(`order_number.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`);
    }

    // Aplicar ordenamiento y paginación
    const from = (filters.page - 1) * filters.limit;
    const to = from + filters.limit - 1;

    const { data: orders, error, count } = await query
      .order(filters.sort_by, { ascending: filters.sort_order === 'asc' })
      .range(from, to);

    if (error) {
      logger.log(LogLevel.ERROR, LogCategory.DATABASE, 'Error al obtener órdenes admin', { error });
      return NextResponse.json(
        { error: 'Error al obtener órdenes' },
        { status: 500 }
      );
    }

    // Calcular estadísticas
    const totalPages = Math.ceil((count || 0) / filters.limit);
    const hasNextPage = filters.page < totalPages;
    const hasPreviousPage = filters.page > 1;

    // Métricas de performance
    const responseTime = Date.now() - startTime;
    metricsCollector.recordApiCall('admin-orders-list', responseTime, 200);

    const response: ApiResponse<{
      orders: typeof orders;
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
      };
      filters: typeof filters;
    }> = {
      data: {
        orders,
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total: count || 0,
          totalPages,
          hasNextPage,
          hasPreviousPage,
        },
        filters,
      },
      success: true,
      error: null,
    };

    const nextResponse = NextResponse.json(response);
    addRateLimitHeaders(nextResponse, rateLimitResult);

    logger.log(LogLevel.INFO, LogCategory.API, 'Órdenes admin obtenidas exitosamente', {
      count: orders?.length,
      total: count,
      responseTime,
    });

    return nextResponse;

  } catch (error) {
    const responseTime = Date.now() - startTime;
    metricsCollector.recordApiCall('admin-orders-list', responseTime, 500);

    logger.log(LogLevel.ERROR, LogCategory.API, 'Error en GET /api/admin/orders', { error });

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// ===================================
// POST - Crear nueva orden (admin)
// ===================================
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Rate limiting
    const rateLimitResult = await checkRateLimit(
      request,
      RATE_LIMIT_CONFIGS.admin.requests,
      RATE_LIMIT_CONFIGS.admin.window,
      'admin-orders-create'
    );

    if (!rateLimitResult.success) {
      const response = NextResponse.json(
        { error: 'Demasiadas solicitudes' },
        { status: 429 }
      );
      addRateLimitHeaders(response, rateLimitResult);
      return response;
    }

    // Validar autenticación admin
    const authResult = await validateAdminAuth();
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    // Validar datos de entrada
    const body = await request.json();
    const validationResult = CreateOrderSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Datos de orden inválidos', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const orderData = validationResult.data;

    // Generar número de orden único
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Calcular total
    const totalAmount = orderData.items.reduce((sum, item) =>
      sum + (item.unit_price * item.quantity), 0
    );

    // Crear orden en transacción
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: orderData.user_id,
        order_number: orderNumber,
        status: 'pending',
        payment_status: 'pending',
        total_amount: totalAmount,
        currency: 'ARS',
        shipping_address: orderData.shipping_address ? JSON.stringify(orderData.shipping_address) : null,
        notes: orderData.notes,
      })
      .select()
      .single();

    if (orderError) {
      logger.log(LogLevel.ERROR, LogCategory.DATABASE, 'Error al crear orden', { orderError });
      return NextResponse.json(
        { error: 'Error al crear orden' },
        { status: 500 }
      );
    }

    // Crear items de la orden
    const orderItems = orderData.items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.unit_price * item.quantity,
    }));

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      // Rollback: eliminar orden creada
      await supabaseAdmin.from('orders').delete().eq('id', order.id);

      logger.log(LogLevel.ERROR, LogCategory.DATABASE, 'Error al crear items de orden', { itemsError });
      return NextResponse.json(
        { error: 'Error al crear items de orden' },
        { status: 500 }
      );
    }

    // Métricas de performance
    const responseTime = Date.now() - startTime;
    metricsCollector.recordApiCall('admin-orders-create', responseTime, 201);

    const response: ApiResponse<typeof order> = {
      data: order,
      success: true,
      error: null,
    };

    const nextResponse = NextResponse.json(response, { status: 201 });
    addRateLimitHeaders(nextResponse, rateLimitResult);

    logger.log(LogLevel.INFO, LogCategory.API, 'Orden creada exitosamente por admin', {
      orderId: order.id,
      orderNumber,
      totalAmount,
      responseTime,
    });

    return nextResponse;

  } catch (error) {
    const responseTime = Date.now() - startTime;
    metricsCollector.recordApiCall('admin-orders-create', responseTime, 500);

    logger.log(LogLevel.ERROR, LogCategory.API, 'Error en POST /api/admin/orders', { error });

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
