// ===================================
// PINTEYA E-COMMERCE - ADMIN USERS API ENTERPRISE
// ===================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/integrations/supabase';
import { auth } from '@/auth';
import { ApiResponse } from '@/types/api';
import { z } from 'zod';
import { logger, LogLevel, LogCategory } from '@/lib/enterprise/logger';
import { checkRateLimit } from '@/lib/auth/rate-limiting';
import { addRateLimitHeaders, RATE_LIMIT_CONFIGS } from '@/lib/enterprise/rate-limiter';
import { metricsCollector } from '@/lib/enterprise/metrics';

// ===================================
// SCHEMAS DE VALIDACIÓN
// ===================================

const UserFiltersSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(25),
  search: z.string().optional().nullable(),
  status: z.enum(['active', 'inactive', 'banned']).optional().nullable(),
  role: z.enum(['user', 'admin', 'moderator']).optional().nullable(),
  date_from: z.string().optional().nullable(),
  date_to: z.string().optional().nullable(),
  sort_by: z.enum(['created_at', 'email', 'name', 'last_login']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

const CreateUserSchema = z.object({
  email: z.string().email('Email inválido'),
  name: z.string().min(1, 'Nombre requerido').max(100, 'Máximo 100 caracteres'),
  password: z.string().min(8, 'Mínimo 8 caracteres').max(100, 'Máximo 100 caracteres'),
  role: z.enum(['user', 'admin', 'moderator']).default('user'),
  is_active: z.boolean().default(true),
  phone: z.string().optional().nullable(),
  address: z.object({
    street_name: z.string().optional(),
    street_number: z.string().optional(),
    zip_code: z.string().optional(),
    city_name: z.string().optional(),
    state_name: z.string().optional(),
  }).optional().nullable(),
});

const UpdateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  role: z.enum(['user', 'admin', 'moderator']).optional(),
  is_active: z.boolean().optional(),
  phone: z.string().optional().nullable(),
  address: z.object({
    street_name: z.string().optional(),
    street_number: z.string().optional(),
    zip_code: z.string().optional(),
    city_name: z.string().optional(),
    state_name: z.string().optional(),
  }).optional().nullable(),
});

// ===================================
// TIPOS DE DATOS
// ===================================

interface UserWithStats {
  id: string;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  phone?: string;
  address?: any;
  created_at: string;
  updated_at: string;
  last_login?: string;
  orders_count: number;
  total_spent: number;
  avatar_url?: string;
}

interface UsersListResponse {
  users: UserWithStats[];
  total: number;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: {
    search?: string;
    status?: string;
    role?: string;
    date_from?: string;
    date_to?: string;
  };
  sort: {
    by: string;
    order: string;
  };
}

// ===================================
// MIDDLEWARE DE AUTENTICACIÓN ADMIN
// ===================================

async function validateAdminAuth() {
  try {
    // BYPASS TEMPORAL PARA DESARROLLO
    if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
      return {
        user: {
          id: 'dev-admin',
          email: 'santiago@xor.com.ar',
          name: 'Dev Admin'
        },
        userId: 'dev-admin'
      };
    }

    const session = await auth();
    if (!session?.user) {
      return { error: 'Usuario no autenticado', status: 401 };
    }

    // Verificar si es admin
    const isAdmin = session.user.email === 'santiago@xor.com.ar';
    if (!isAdmin) {
      return { error: 'Acceso denegado - Se requieren permisos de administrador', status: 403 };
    }

    return { user: session.user, userId: session.user.id };
  } catch (error) {
    logger.log(LogLevel.ERROR, LogCategory.AUTH, 'Error en validación admin', { error });
    return { error: 'Error de autenticación', status: 500 };
  }
}

// ===================================
// FUNCIONES AUXILIARES
// ===================================

async function getUsersWithStats(filters: any, pagination: any) {
  try {
    let query = supabaseAdmin
      .from('user_profiles')
      .select(`
        id,
        email,
        first_name,
        last_name,
        role_id,
        is_active,
        metadata,
        created_at,
        updated_at,
        user_roles (
          role_name,
          permissions
        )
      `, { count: 'exact' });

    // Aplicar filtros
    if (filters.search) {
      query = query.or(`email.ilike.%${filters.search}%,name.ilike.%${filters.search}%`);
    }

    if (filters.status) {
      if (filters.status === 'active') {
        query = query.eq('is_active', true);
      } else if (filters.status === 'inactive') {
        query = query.eq('is_active', false);
      }
    }

    if (filters.role) {
      query = query.eq('role', filters.role);
    }

    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from);
    }

    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to);
    }

    // Aplicar ordenamiento
    query = query.order(pagination.sort_by, { ascending: pagination.sort_order === 'asc' });

    // Aplicar paginación
    const from = (pagination.page - 1) * pagination.limit;
    const to = from + pagination.limit - 1;
    query = query.range(from, to);

    const { data: users, error, count } = await query;

    if (error) {
      throw error;
    }

    // Obtener estadísticas de órdenes para cada usuario
    const usersWithStats: UserWithStats[] = [];
    
    if (users && users.length > 0) {
      const userIds = users.map(user => user.id);
      
      // Obtener estadísticas de órdenes
      const { data: orderStats } = await supabaseAdmin
        .from('orders')
        .select('user_id, total')
        .in('user_id', userIds)
        .eq('status', 'completed');

      // Calcular estadísticas por usuario
      const statsMap = orderStats?.reduce((acc: any, order) => {
        if (!acc[order.user_id]) {
          acc[order.user_id] = { orders_count: 0, total_spent: 0 };
        }
        acc[order.user_id].orders_count += 1;
        acc[order.user_id].total_spent += order.total || 0;
        return acc;
      }, {}) || {};

      // Combinar datos
      for (const user of users) {
        const stats = statsMap[user.id] || { orders_count: 0, total_spent: 0 };
        usersWithStats.push({
          ...user,
          orders_count: stats.orders_count,
          total_spent: stats.total_spent
        });
      }
    }

    return {
      users: usersWithStats,
      total: count || 0
    };
  } catch (error) {
    logger.log(LogLevel.ERROR, LogCategory.API, 'Error obteniendo usuarios con estadísticas', { error });
    throw error;
  }
}

// ===================================
// GET - Listar usuarios con filtros y estadísticas
// ===================================
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Rate limiting
    const rateLimitResult = await checkRateLimit(
      request,
      {
        windowMs: RATE_LIMIT_CONFIGS.admin.windowMs,
        maxRequests: RATE_LIMIT_CONFIGS.admin.maxRequests,
        message: RATE_LIMIT_CONFIGS.admin.message || 'Demasiadas solicitudes administrativas'
      },
      'admin-users'
    );

    if (!rateLimitResult.success) {
      const response = NextResponse.json(
        { error: rateLimitResult.message },
        { status: 429 }
      );
      addRateLimitHeaders(response, rateLimitResult);
      return response;
    }

    // Validar autenticación admin
    const authResult = await validateAdminAuth();
    if (authResult.error) {
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: authResult.error,
      };
      return NextResponse.json(errorResponse, { status: authResult.status });
    }

    // Validar parámetros
    const { searchParams } = new URL(request.url);
    const validationResult = UserFiltersSchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      search: searchParams.get('search'),
      status: searchParams.get('status'),
      role: searchParams.get('role'),
      date_from: searchParams.get('date_from'),
      date_to: searchParams.get('date_to'),
      sort_by: searchParams.get('sort_by'),
      sort_order: searchParams.get('sort_order'),
    });

    if (!validationResult.success) {
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Parámetros inválidos',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const filters = validationResult.data;
    const { users, total } = await getUsersWithStats(filters, filters);

    const totalPages = Math.ceil(total / filters.limit);

    const responseData: UsersListResponse = {
      users,
      total,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        totalPages,
        hasNext: filters.page < totalPages,
        hasPrev: filters.page > 1,
      },
      filters: {
        search: filters.search || undefined,
        status: filters.status || undefined,
        role: filters.role || undefined,
        date_from: filters.date_from || undefined,
        date_to: filters.date_to || undefined,
      },
      sort: {
        by: filters.sort_by,
        order: filters.sort_order,
      },
    };

    // Registrar métricas
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/users',
      method: 'GET',
      statusCode: 200,
      responseTime: Date.now() - startTime,
      userId: authResult.userId
    });

    // Log de auditoría
    logger.log(LogLevel.INFO, LogCategory.ADMIN, 'Lista de usuarios consultada', {
      userId: authResult.userId,
      filters,
      total
    });

    const response: ApiResponse<UsersListResponse> = {
      data: responseData,
      success: true,
      message: 'Usuarios obtenidos exitosamente'
    };

    const nextResponse = NextResponse.json(response);
    addRateLimitHeaders(nextResponse, rateLimitResult);
    return nextResponse;

  } catch (error) {
    logger.log(LogLevel.ERROR, LogCategory.API, 'Error en GET /api/admin/users', { error });

    // Registrar métricas de error
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/users',
      method: 'GET',
      statusCode: 500,
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    const errorResponse: ApiResponse<null> = {
      data: null,
      success: false,
      error: 'Error interno del servidor',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// ===================================
// POST - Crear nuevo usuario
// ===================================
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Rate limiting
    const rateLimitResult = await checkRateLimit(
      request,
      {
        windowMs: RATE_LIMIT_CONFIGS.admin.windowMs,
        maxRequests: RATE_LIMIT_CONFIGS.admin.maxRequests,
        message: RATE_LIMIT_CONFIGS.admin.message || 'Demasiadas solicitudes administrativas'
      },
      'admin-users-create'
    );

    if (!rateLimitResult.success) {
      const response = NextResponse.json(
        { error: rateLimitResult.message },
        { status: 429 }
      );
      addRateLimitHeaders(response, rateLimitResult);
      return response;
    }

    // Validar autenticación admin
    const authResult = await validateAdminAuth();
    if (authResult.error) {
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: authResult.error,
      };
      return NextResponse.json(errorResponse, { status: authResult.status });
    }

    // Validar datos de entrada
    const body = await request.json();
    const validationResult = CreateUserSchema.safeParse(body);

    if (!validationResult.success) {
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Datos de usuario inválidos',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const userData = validationResult.data;

    // Verificar si el email ya existe
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', userData.email)
      .single();

    if (existingUser) {
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'El email ya está registrado',
      };
      return NextResponse.json(errorResponse, { status: 409 });
    }

    // Crear usuario en Supabase Auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        name: userData.name,
        role: userData.role
      }
    });

    if (authError || !authUser.user) {
      logger.log(LogLevel.ERROR, LogCategory.AUTH, 'Error creando usuario en Auth', { authError });
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Error creando usuario',
      };
      return NextResponse.json(errorResponse, { status: 500 });
    }

    // Crear perfil de usuario en la tabla users
    const { data: newUser, error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authUser.user.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        is_active: userData.is_active,
        phone: userData.phone,
        address: userData.address,
      })
      .select()
      .single();

    if (profileError) {
      // Si falla la creación del perfil, eliminar el usuario de Auth
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      
      logger.log(LogLevel.ERROR, LogCategory.API, 'Error creando perfil de usuario', { profileError });
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Error creando perfil de usuario',
      };
      return NextResponse.json(errorResponse, { status: 500 });
    }

    // Registrar métricas
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/users',
      method: 'POST',
      statusCode: 201,
      responseTime: Date.now() - startTime,
      userId: authResult.userId
    });

    // Log de auditoría
    logger.log(LogLevel.INFO, LogCategory.ADMIN, 'Usuario creado', {
      adminUserId: authResult.userId,
      newUserId: newUser.id,
      email: newUser.email,
      role: newUser.role
    });

    const userWithStats: UserWithStats = {
      ...newUser,
      orders_count: 0,
      total_spent: 0
    };

    const response: ApiResponse<UserWithStats> = {
      data: userWithStats,
      success: true,
      message: 'Usuario creado exitosamente'
    };

    const nextResponse = NextResponse.json(response, { status: 201 });
    addRateLimitHeaders(nextResponse, rateLimitResult);
    return nextResponse;

  } catch (error) {
    logger.log(LogLevel.ERROR, LogCategory.API, 'Error en POST /api/admin/users', { error });

    // Registrar métricas de error
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/users',
      method: 'POST',
      statusCode: 500,
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    const errorResponse: ApiResponse<null> = {
      data: null,
      success: false,
      error: 'Error interno del servidor',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}









