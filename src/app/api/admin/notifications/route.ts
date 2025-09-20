// Configuración para Node.js Runtime
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@/lib/auth/config';
import { checkRateLimit, addRateLimitHeaders } from '@/lib/enterprise/rate-limiter';
import { logger, LogLevel, LogCategory } from '@/lib/enterprise/logger';
import { metricsCollector } from '@/lib/enterprise/metrics';

// ===================================
// CONFIGURACIÓN
// ===================================
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const RATE_LIMIT_CONFIGS = {
  admin: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 100,
    message: 'Demasiadas solicitudes administrativas'
  },
  create: {
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 10,
    message: 'Demasiadas notificaciones creadas'
  }
};

// ===================================
// ESQUEMAS DE VALIDACIÓN
// ===================================
const NotificationFiltersSchema = z.object({
  type: z.enum(['info', 'warning', 'error', 'success']).optional(),
  status: z.enum(['read', 'unread', 'archived']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  recipient_type: z.enum(['user', 'admin', 'all']).optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sort_by: z.enum(['created_at', 'updated_at', 'priority', 'type']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

const CreateNotificationSchema = z.object({
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  type: z.enum(['info', 'warning', 'error', 'success']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  recipient_type: z.enum(['user', 'admin', 'all']),
  recipient_ids: z.array(z.string()).optional(),
  action_url: z.string().url().optional(),
  action_label: z.string().max(50).optional(),
  expires_at: z.string().datetime().optional(),
  metadata: z.record(z.any()).optional()
});

const BulkActionSchema = z.object({
  action: z.enum(['mark_read', 'mark_unread', 'archive', 'delete']),
  notification_ids: z.array(z.string()).min(1)
});

// ===================================
// TIPOS
// ===================================
interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'read' | 'unread' | 'archived';
  recipient_type: 'user' | 'admin' | 'all';
  recipient_id?: string;
  action_url?: string;
  action_label?: string;
  expires_at?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by: string;
}

// ===================================
// FUNCIONES AUXILIARES
// ===================================
async function validateAdminAuth() {
  const session = await auth();
  
  if (!session?.user) {
    return { error: 'No autorizado', status: 401 };
  }

  // Verificar rol de administrador
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (profile?.role !== 'admin') {
    return { error: 'Acceso denegado', status: 403 };
  }

  return { userId: session.user.id };
}

async function getNotifications(filters: z.infer<typeof NotificationFiltersSchema>) {
  let query = supabase
    .from('notifications')
    .select(`
      *,
      recipient:profiles!notifications_recipient_id_fkey(
        id,
        email,
        full_name
      ),
      creator:profiles!notifications_created_by_fkey(
        id,
        email,
        full_name
      )
    `);

  // Aplicar filtros
  if (filters.type) {
    query = query.eq('type', filters.type);
  }

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.priority) {
    query = query.eq('priority', filters.priority);
  }

  if (filters.recipient_type) {
    query = query.eq('recipient_type', filters.recipient_type);
  }

  if (filters.date_from) {
    query = query.gte('created_at', filters.date_from);
  }

  if (filters.date_to) {
    query = query.lte('created_at', filters.date_to);
  }

  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,message.ilike.%${filters.search}%`);
  }

  // Contar total
  const { count } = await query.select('*', { count: 'exact', head: true });

  // Aplicar paginación y ordenamiento
  const offset = (filters.page - 1) * filters.limit;
  query = query
    .order(filters.sort_by, { ascending: filters.sort_order === 'asc' })
    .range(offset, offset + filters.limit - 1);

  const { data, error } = await query;

  if (error) {
    throw new Error(`Error al obtener notificaciones: ${error.message}`);
  }

  return {
    notifications: data || [],
    total: count || 0,
    totalPages: Math.ceil((count || 0) / filters.limit)
  };
}

async function createNotification(
  notificationData: z.infer<typeof CreateNotificationSchema>,
  createdBy: string
) {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      ...notificationData,
      created_by: createdBy,
      status: 'unread'
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Error al crear notificación: ${error.message}`);
  }

  // Si es para usuarios específicos, crear registros individuales
  if (notificationData.recipient_ids && notificationData.recipient_ids.length > 0) {
    const individualNotifications = notificationData.recipient_ids.map(recipientId => ({
      ...notificationData,
      recipient_id: recipientId,
      recipient_type: 'user' as const,
      created_by: createdBy,
      status: 'unread' as const
    }));

    await supabase
      .from('notifications')
      .insert(individualNotifications);
  }

  return data;
}

async function performBulkAction(
  action: string,
  notificationIds: string[],
  userId: string
) {
  let updateData: Partial<NotificationData> = {};

  switch (action) {
    case 'mark_read':
      updateData = { status: 'read' };
      break;
    case 'mark_unread':
      updateData = { status: 'unread' };
      break;
    case 'archive':
      updateData = { status: 'archived' };
      break;
    case 'delete':
      const { error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .in('id', notificationIds);
      
      if (deleteError) {
        throw new Error(`Error al eliminar notificaciones: ${deleteError.message}`);
      }
      
      return { affected: notificationIds.length };
  }

  const { data, error } = await supabase
    .from('notifications')
    .update({
      ...updateData,
      updated_at: new Date().toISOString()
    })
    .in('id', notificationIds)
    .select();

  if (error) {
    throw new Error(`Error en acción masiva: ${error.message}`);
  }

  return { affected: data?.length || 0 };
}

async function getNotificationStats() {
  const { data: stats, error } = await supabase
    .from('notifications')
    .select('type, status, priority')
    .not('status', 'eq', 'archived');

  if (error) {
    throw new Error(`Error al obtener estadísticas: ${error.message}`);
  }

  const summary = {
    total: stats.length,
    unread: stats.filter(n => n.status === 'unread').length,
    by_type: {
      info: stats.filter(n => n.type === 'info').length,
      warning: stats.filter(n => n.type === 'warning').length,
      error: stats.filter(n => n.type === 'error').length,
      success: stats.filter(n => n.type === 'success').length
    },
    by_priority: {
      low: stats.filter(n => n.priority === 'low').length,
      medium: stats.filter(n => n.priority === 'medium').length,
      high: stats.filter(n => n.priority === 'high').length,
      urgent: stats.filter(n => n.priority === 'urgent').length
    }
  };

  return summary;
}

// ===================================
// GET - Obtener notificaciones
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
        message: RATE_LIMIT_CONFIGS.admin.message
      },
      'admin-notifications'
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

    // Parsear parámetros de consulta
    const { searchParams } = new URL(request.url);
    const filters = NotificationFiltersSchema.parse({
      type: searchParams.get('type'),
      status: searchParams.get('status'),
      priority: searchParams.get('priority'),
      recipient_type: searchParams.get('recipient_type'),
      date_from: searchParams.get('date_from'),
      date_to: searchParams.get('date_to'),
      search: searchParams.get('search'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      sort_by: searchParams.get('sort_by'),
      sort_order: searchParams.get('sort_order')
    });

    // Obtener notificaciones
    const { notifications, total, totalPages } = await getNotifications(filters);

    // Obtener estadísticas si se solicita
    let stats = null;
    if (searchParams.get('include_stats') === 'true') {
      stats = await getNotificationStats();
    }

    // Registrar métricas
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/notifications',
      method: 'GET',
      statusCode: 200,
      responseTime: Date.now() - startTime,
      userId: authResult.userId
    });

    const response: ApiResponse<NotificationData[]> = {
      data: notifications,
      success: true,
      message: 'Notificaciones obtenidas exitosamente',
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages
      },
      ...(stats && { stats })
    };

    const nextResponse = NextResponse.json(response);
    addRateLimitHeaders(nextResponse, rateLimitResult);
    return nextResponse;

  } catch (error) {
    logger.log(LogLevel.ERROR, LogCategory.API, 'Error en GET /api/admin/notifications', { error });

    // Registrar métricas de error
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/notifications',
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
// POST - Crear notificación o acción masiva
// ===================================
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Rate limiting
    const rateLimitResult = await checkRateLimit(
      request,
      {
        windowMs: RATE_LIMIT_CONFIGS.create.windowMs,
        maxRequests: RATE_LIMIT_CONFIGS.create.maxRequests,
        message: RATE_LIMIT_CONFIGS.create.message
      },
      'admin-notifications-create'
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

    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // Determinar si es acción masiva o creación
    if (action === 'bulk') {
      // Validar datos para acción masiva
      const validationResult = BulkActionSchema.safeParse(body);
      if (!validationResult.success) {
        const errorResponse: ApiResponse<null> = {
          data: null,
          success: false,
          error: 'Datos de acción masiva inválidos',
        };
        return NextResponse.json(errorResponse, { status: 400 });
      }

      // Ejecutar acción masiva
      const result = await performBulkAction(
        validationResult.data.action,
        validationResult.data.notification_ids,
        authResult.userId!
      );

      // Registrar métricas
      metricsCollector.recordApiCall({
        endpoint: '/api/admin/notifications',
        method: 'POST',
        statusCode: 200,
        responseTime: Date.now() - startTime,
        userId: authResult.userId
      });

      const response: ApiResponse<typeof result> = {
        data: result,
        success: true,
        message: `Acción ${validationResult.data.action} ejecutada en ${result.affected} notificaciones`
      };

      const nextResponse = NextResponse.json(response);
      addRateLimitHeaders(nextResponse, rateLimitResult);
      return nextResponse;
    } else {
      // Validar datos para crear notificación
      const validationResult = CreateNotificationSchema.safeParse(body);
      if (!validationResult.success) {
        const errorResponse: ApiResponse<null> = {
          data: null,
          success: false,
          error: 'Datos de notificación inválidos',
        };
        return NextResponse.json(errorResponse, { status: 400 });
      }

      // Crear notificación
      const notification = await createNotification(
        validationResult.data,
        authResult.userId!
      );

      // Registrar métricas
      metricsCollector.recordApiCall({
        endpoint: '/api/admin/notifications',
        method: 'POST',
        statusCode: 201,
        responseTime: Date.now() - startTime,
        userId: authResult.userId
      });

      const response: ApiResponse<NotificationData> = {
        data: notification,
        success: true,
        message: 'Notificación creada exitosamente'
      };

      const nextResponse = NextResponse.json(response, { status: 201 });
      addRateLimitHeaders(nextResponse, rateLimitResult);
      return nextResponse;
    }

  } catch (error) {
    logger.log(LogLevel.ERROR, LogCategory.API, 'Error en POST /api/admin/notifications', { error });

    // Registrar métricas de error
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/notifications',
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










