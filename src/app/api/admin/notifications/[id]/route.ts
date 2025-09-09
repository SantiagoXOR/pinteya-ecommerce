import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@/auth';
import { checkRateLimit } from '@/lib/rate-limiter';
import { logger, LogLevel, LogCategory } from '@/lib/logger';
import { metricsCollector } from '@/lib/metrics';

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
  update: {
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 20,
    message: 'Demasiadas actualizaciones de notificación'
  },
  delete: {
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 10,
    message: 'Demasiadas eliminaciones de notificación'
  }
};

// ===================================
// ESQUEMAS DE VALIDACIÓN
// ===================================
const ParamsSchema = z.object({
  id: z.string().uuid('ID de notificación inválido')
});

const UpdateNotificationSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  message: z.string().min(1).max(1000).optional(),
  type: z.enum(['info', 'warning', 'error', 'success']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  status: z.enum(['read', 'unread', 'archived']).optional(),
  action_url: z.string().url().optional(),
  action_label: z.string().max(50).optional(),
  expires_at: z.string().datetime().optional().nullable(),
  metadata: z.record(z.any()).optional()
});

// ===================================
// TIPOS
// ===================================
interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
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
  recipient?: {
    id: string;
    email: string;
    full_name: string;
  };
  creator?: {
    id: string;
    email: string;
    full_name: string;
  };
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

async function getNotificationById(id: string): Promise<NotificationData> {
  const { data, error } = await supabase
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
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Notificación no encontrada');
    }
    throw new Error(`Error al obtener notificación: ${error.message}`);
  }

  return data;
}

async function updateNotification(
  id: string,
  updateData: z.infer<typeof UpdateNotificationSchema>,
  userId: string
): Promise<NotificationData> {
  const { data, error } = await supabase
    .from('notifications')
    .update({
      ...updateData,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
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
    `)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Notificación no encontrada');
    }
    throw new Error(`Error al actualizar notificación: ${error.message}`);
  }

  // Registrar auditoría
  await supabase
    .from('audit_logs')
    .insert({
      table_name: 'notifications',
      record_id: id,
      action: 'UPDATE',
      old_values: null, // Se podría implementar para guardar valores anteriores
      new_values: updateData,
      user_id: userId,
      created_at: new Date().toISOString()
    });

  return data;
}

async function deleteNotification(id: string, userId: string): Promise<void> {
  // Primero obtener la notificación para auditoría
  const notification = await getNotificationById(id);

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Error al eliminar notificación: ${error.message}`);
  }

  // Registrar auditoría
  await supabase
    .from('audit_logs')
    .insert({
      table_name: 'notifications',
      record_id: id,
      action: 'DELETE',
      old_values: notification,
      new_values: null,
      user_id: userId,
      created_at: new Date().toISOString()
    });
}

async function markAsRead(id: string, userId: string): Promise<NotificationData> {
  return updateNotification(id, { status: 'read' }, userId);
}

async function markAsUnread(id: string, userId: string): Promise<NotificationData> {
  return updateNotification(id, { status: 'unread' }, userId);
}

async function archiveNotification(id: string, userId: string): Promise<NotificationData> {
  return updateNotification(id, { status: 'archived' }, userId);
}

// ===================================
// GET - Obtener notificación por ID
// ===================================
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      'admin-notification-get'
    );

    if (!rateLimitResult.success) {
      const response = NextResponse.json(
        { error: rateLimitResult.message },
        { status: 429 }
      );
      addRateLimitHeaders(response, rateLimitResult);
      return response;
    }

    // Validar parámetros
    const validationResult = ParamsSchema.safeParse(params);
    if (!validationResult.success) {
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'ID de notificación inválido',
      };
      return NextResponse.json(errorResponse, { status: 400 });
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

    // Obtener notificación
    const notification = await getNotificationById(validationResult.data.id);

    // Registrar métricas
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/notifications/[id]',
      method: 'GET',
      statusCode: 200,
      responseTime: Date.now() - startTime,
      userId: authResult.userId
    });

    const response: ApiResponse<NotificationData> = {
      data: notification,
      success: true,
      message: 'Notificación obtenida exitosamente'
    };

    const nextResponse = NextResponse.json(response);
    addRateLimitHeaders(nextResponse, rateLimitResult);
    return nextResponse;

  } catch (error) {
    logger.log(LogLevel.ERROR, LogCategory.API, 'Error en GET /api/admin/notifications/[id]', { error, params });

    // Registrar métricas de error
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/notifications/[id]',
      method: 'GET',
      statusCode: error instanceof Error && error.message === 'Notificación no encontrada' ? 404 : 500,
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    const statusCode = error instanceof Error && error.message === 'Notificación no encontrada' ? 404 : 500;
    const errorResponse: ApiResponse<null> = {
      data: null,
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor',
    };

    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

// ===================================
// PUT - Actualizar notificación
// ===================================
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();

  try {
    // Rate limiting
    const rateLimitResult = await checkRateLimit(
      request,
      {
        windowMs: RATE_LIMIT_CONFIGS.update.windowMs,
        maxRequests: RATE_LIMIT_CONFIGS.update.maxRequests,
        message: RATE_LIMIT_CONFIGS.update.message
      },
      'admin-notification-update'
    );

    if (!rateLimitResult.success) {
      const response = NextResponse.json(
        { error: rateLimitResult.message },
        { status: 429 }
      );
      addRateLimitHeaders(response, rateLimitResult);
      return response;
    }

    // Validar parámetros
    const paramsValidation = ParamsSchema.safeParse(params);
    if (!paramsValidation.success) {
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'ID de notificación inválido',
      };
      return NextResponse.json(errorResponse, { status: 400 });
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
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // Manejar acciones específicas
    if (action) {
      let updatedNotification: NotificationData;
      
      switch (action) {
        case 'mark_read':
          updatedNotification = await markAsRead(paramsValidation.data.id, authResult.userId!);
          break;
        case 'mark_unread':
          updatedNotification = await markAsUnread(paramsValidation.data.id, authResult.userId!);
          break;
        case 'archive':
          updatedNotification = await archiveNotification(paramsValidation.data.id, authResult.userId!);
          break;
        default:
          const errorResponse: ApiResponse<null> = {
            data: null,
            success: false,
            error: 'Acción no válida',
          };
          return NextResponse.json(errorResponse, { status: 400 });
      }

      // Registrar métricas
      metricsCollector.recordApiCall({
        endpoint: '/api/admin/notifications/[id]',
        method: 'PUT',
        statusCode: 200,
        responseTime: Date.now() - startTime,
        userId: authResult.userId
      });

      const response: ApiResponse<NotificationData> = {
        data: updatedNotification,
        success: true,
        message: `Notificación ${action.replace('_', ' ')} exitosamente`
      };

      const nextResponse = NextResponse.json(response);
      addRateLimitHeaders(nextResponse, rateLimitResult);
      return nextResponse;
    }

    // Actualización general
    const validationResult = UpdateNotificationSchema.safeParse(body);
    if (!validationResult.success) {
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Datos de notificación inválidos',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Actualizar notificación
    const updatedNotification = await updateNotification(
      paramsValidation.data.id,
      validationResult.data,
      authResult.userId!
    );

    // Registrar métricas
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/notifications/[id]',
      method: 'PUT',
      statusCode: 200,
      responseTime: Date.now() - startTime,
      userId: authResult.userId
    });

    const response: ApiResponse<NotificationData> = {
      data: updatedNotification,
      success: true,
      message: 'Notificación actualizada exitosamente'
    };

    const nextResponse = NextResponse.json(response);
    addRateLimitHeaders(nextResponse, rateLimitResult);
    return nextResponse;

  } catch (error) {
    logger.log(LogLevel.ERROR, LogCategory.API, 'Error en PUT /api/admin/notifications/[id]', { error, params });

    // Registrar métricas de error
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/notifications/[id]',
      method: 'PUT',
      statusCode: error instanceof Error && error.message === 'Notificación no encontrada' ? 404 : 500,
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    const statusCode = error instanceof Error && error.message === 'Notificación no encontrada' ? 404 : 500;
    const errorResponse: ApiResponse<null> = {
      data: null,
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor',
    };

    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

// ===================================
// DELETE - Eliminar notificación
// ===================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();

  try {
    // Rate limiting
    const rateLimitResult = await checkRateLimit(
      request,
      {
        windowMs: RATE_LIMIT_CONFIGS.delete.windowMs,
        maxRequests: RATE_LIMIT_CONFIGS.delete.maxRequests,
        message: RATE_LIMIT_CONFIGS.delete.message
      },
      'admin-notification-delete'
    );

    if (!rateLimitResult.success) {
      const response = NextResponse.json(
        { error: rateLimitResult.message },
        { status: 429 }
      );
      addRateLimitHeaders(response, rateLimitResult);
      return response;
    }

    // Validar parámetros
    const validationResult = ParamsSchema.safeParse(params);
    if (!validationResult.success) {
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'ID de notificación inválido',
      };
      return NextResponse.json(errorResponse, { status: 400 });
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

    // Eliminar notificación
    await deleteNotification(validationResult.data.id, authResult.userId!);

    // Registrar métricas
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/notifications/[id]',
      method: 'DELETE',
      statusCode: 200,
      responseTime: Date.now() - startTime,
      userId: authResult.userId
    });

    const response: ApiResponse<null> = {
      data: null,
      success: true,
      message: 'Notificación eliminada exitosamente'
    };

    const nextResponse = NextResponse.json(response);
    addRateLimitHeaders(nextResponse, rateLimitResult);
    return nextResponse;

  } catch (error) {
    logger.log(LogLevel.ERROR, LogCategory.API, 'Error en DELETE /api/admin/notifications/[id]', { error, params });

    // Registrar métricas de error
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/notifications/[id]',
      method: 'DELETE',
      statusCode: error instanceof Error && error.message === 'Notificación no encontrada' ? 404 : 500,
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    const statusCode = error instanceof Error && error.message === 'Notificación no encontrada' ? 404 : 500;
    const errorResponse: ApiResponse<null> = {
      data: null,
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor',
    };

    return NextResponse.json(errorResponse, { status: statusCode });
  }
}