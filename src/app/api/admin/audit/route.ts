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
  }
};

// ===================================
// ESQUEMAS DE VALIDACIÓN
// ===================================
const AuditFiltersSchema = z.object({
  table_name: z.string().optional(),
  action: z.enum(['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'IMPORT']).optional(),
  user_id: z.string().uuid().optional(),
  record_id: z.string().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sort_by: z.enum(['created_at', 'table_name', 'action', 'user_id']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

const ExportAuditSchema = z.object({
  format: z.enum(['csv', 'json', 'xlsx']).default('csv'),
  filters: AuditFiltersSchema.optional(),
  include_details: z.boolean().default(false)
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

interface AuditLogData {
  id: string;
  table_name: string;
  record_id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'IMPORT';
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  user_id: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  user?: {
    id: string;
    email: string;
    full_name: string;
    role: string;
  };
}

interface AuditStats {
  total_logs: number;
  actions_summary: Record<string, number>;
  tables_summary: Record<string, number>;
  users_summary: Record<string, number>;
  recent_activity: {
    last_24h: number;
    last_7d: number;
    last_30d: number;
  };
  top_users: Array<{
    user_id: string;
    user_name: string;
    action_count: number;
  }>;
  top_tables: Array<{
    table_name: string;
    action_count: number;
  }>;
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

async function getAuditLogs(filters: z.infer<typeof AuditFiltersSchema>) {
  let query = supabase
    .from('audit_logs')
    .select(`
      *,
      user:profiles!audit_logs_user_id_fkey(
        id,
        email,
        full_name,
        role
      )
    `);

  // Aplicar filtros
  if (filters.table_name) {
    query = query.eq('table_name', filters.table_name);
  }

  if (filters.action) {
    query = query.eq('action', filters.action);
  }

  if (filters.user_id) {
    query = query.eq('user_id', filters.user_id);
  }

  if (filters.record_id) {
    query = query.eq('record_id', filters.record_id);
  }

  if (filters.date_from) {
    query = query.gte('created_at', filters.date_from);
  }

  if (filters.date_to) {
    query = query.lte('created_at', filters.date_to);
  }

  if (filters.search) {
    query = query.or(`table_name.ilike.%${filters.search}%,action.ilike.%${filters.search}%,record_id.ilike.%${filters.search}%`);
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
    throw new Error(`Error al obtener logs de auditoría: ${error.message}`);
  }

  return {
    logs: data || [],
    total: count || 0,
    totalPages: Math.ceil((count || 0) / filters.limit)
  };
}

async function getAuditStats(): Promise<AuditStats> {
  // Obtener todos los logs para estadísticas
  const { data: allLogs, error } = await supabase
    .from('audit_logs')
    .select(`
      *,
      user:profiles!audit_logs_user_id_fkey(
        id,
        email,
        full_name,
        role
      )
    `);

  if (error) {
    throw new Error(`Error al obtener estadísticas de auditoría: ${error.message}`);
  }

  const logs = allLogs || [];
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Resumen de acciones
  const actionsSummary = logs.reduce((acc, log) => {
    acc[log.action] = (acc[log.action] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Resumen de tablas
  const tablesSummary = logs.reduce((acc, log) => {
    acc[log.table_name] = (acc[log.table_name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Resumen de usuarios
  const usersSummary = logs.reduce((acc, log) => {
    const userName = log.user?.full_name || log.user?.email || 'Usuario desconocido';
    acc[userName] = (acc[userName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Actividad reciente
  const recentActivity = {
    last_24h: logs.filter(log => new Date(log.created_at) >= last24h).length,
    last_7d: logs.filter(log => new Date(log.created_at) >= last7d).length,
    last_30d: logs.filter(log => new Date(log.created_at) >= last30d).length
  };

  // Top usuarios
  const userCounts = logs.reduce((acc, log) => {
    const userId = log.user_id;
    const userName = log.user?.full_name || log.user?.email || 'Usuario desconocido';
    if (!acc[userId]) {
      acc[userId] = { user_id: userId, user_name: userName, action_count: 0 };
    }
    acc[userId].action_count++;
    return acc;
  }, {} as Record<string, { user_id: string; user_name: string; action_count: number }>);

  const topUsers = Object.values(userCounts)
    .sort((a, b) => b.action_count - a.action_count)
    .slice(0, 10);

  // Top tablas
  const topTables = Object.entries(tablesSummary)
    .map(([table_name, action_count]) => ({ table_name, action_count }))
    .sort((a, b) => b.action_count - a.action_count)
    .slice(0, 10);

  return {
    total_logs: logs.length,
    actions_summary: actionsSummary,
    tables_summary: tablesSummary,
    users_summary: usersSummary,
    recent_activity: recentActivity,
    top_users: topUsers,
    top_tables: topTables
  };
}

async function exportAuditLogs(
  format: 'csv' | 'json' | 'xlsx',
  filters?: z.infer<typeof AuditFiltersSchema>,
  includeDetails: boolean = false
) {
  // Obtener logs con filtros aplicados
  const { logs } = await getAuditLogs(filters || {
    page: 1,
    limit: 10000, // Límite alto para exportación
    sort_by: 'created_at',
    sort_order: 'desc'
  });

  // Preparar datos para exportación
  const exportData = logs.map(log => {
    const baseData = {
      id: log.id,
      tabla: log.table_name,
      registro_id: log.record_id,
      accion: log.action,
      usuario: log.user?.full_name || log.user?.email || 'Desconocido',
      email_usuario: log.user?.email || '',
      rol_usuario: log.user?.role || '',
      fecha_creacion: log.created_at,
      ip_address: log.ip_address || '',
      user_agent: log.user_agent || ''
    };

    if (includeDetails) {
      return {
        ...baseData,
        valores_anteriores: log.old_values ? JSON.stringify(log.old_values) : '',
        valores_nuevos: log.new_values ? JSON.stringify(log.new_values) : ''
      };
    }

    return baseData;
  });

  return {
    data: exportData,
    filename: `audit_logs_${new Date().toISOString().split('T')[0]}.${format}`,
    count: exportData.length
  };
}

async function createAuditLog(
  tableName: string,
  recordId: string,
  action: string,
  oldValues: Record<string, unknown>,
  newValues: Record<string, unknown>,
  userId: string,
  request: NextRequest
) {
  const ipAddress = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  const { error } = await supabase
    .from('audit_logs')
    .insert({
      table_name: tableName,
      record_id: recordId,
      action,
      old_values: oldValues,
      new_values: newValues,
      user_id: userId,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: new Date().toISOString()
    });

  if (error) {
    logger.log(LogLevel.ERROR, LogCategory.API, 'Error al crear log de auditoría', { error });
  }
}

// ===================================
// GET - Obtener logs de auditoría
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
      'admin-audit'
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
    const action = searchParams.get('action');

    // Manejar diferentes acciones
    if (action === 'stats') {
      // Obtener estadísticas
      const stats = await getAuditStats();

      // Registrar métricas
      metricsCollector.recordApiCall({
        endpoint: '/api/admin/audit',
        method: 'GET',
        statusCode: 200,
        responseTime: Date.now() - startTime,
        userId: authResult.userId
      });

      const response: ApiResponse<AuditStats> = {
        data: stats,
        success: true,
        message: 'Estadísticas de auditoría obtenidas exitosamente'
      };

      const nextResponse = NextResponse.json(response);
      addRateLimitHeaders(nextResponse, rateLimitResult);
      return nextResponse;
    }

    if (action === 'export') {
      // Exportar logs
      const format = (searchParams.get('format') as 'csv' | 'json' | 'xlsx') || 'csv';
      const includeDetails = searchParams.get('include_details') === 'true';
      
      const filters = AuditFiltersSchema.parse({
        table_name: searchParams.get('table_name'),
        action: searchParams.get('filter_action'),
        user_id: searchParams.get('user_id'),
        record_id: searchParams.get('record_id'),
        date_from: searchParams.get('date_from'),
        date_to: searchParams.get('date_to'),
        search: searchParams.get('search')
      });

      const exportResult = await exportAuditLogs(format, filters, includeDetails);

      // Crear log de auditoría para la exportación
      await createAuditLog(
        'audit_logs',
        'export',
        'EXPORT',
        null,
        { format, filters, includeDetails, count: exportResult.count },
        authResult.userId!,
        request
      );

      // Registrar métricas
      metricsCollector.recordApiCall({
        endpoint: '/api/admin/audit',
        method: 'GET',
        statusCode: 200,
        responseTime: Date.now() - startTime,
        userId: authResult.userId
      });

      const response: ApiResponse<typeof exportResult> = {
        data: exportResult,
        success: true,
        message: `Logs exportados exitosamente en formato ${format}`
      };

      const nextResponse = NextResponse.json(response);
      addRateLimitHeaders(nextResponse, rateLimitResult);
      return nextResponse;
    }

    // Obtener logs normales
    const filters = AuditFiltersSchema.parse({
      table_name: searchParams.get('table_name'),
      action: searchParams.get('action'),
      user_id: searchParams.get('user_id'),
      record_id: searchParams.get('record_id'),
      date_from: searchParams.get('date_from'),
      date_to: searchParams.get('date_to'),
      search: searchParams.get('search'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      sort_by: searchParams.get('sort_by'),
      sort_order: searchParams.get('sort_order')
    });

    const { logs, total, totalPages } = await getAuditLogs(filters);

    // Registrar métricas
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/audit',
      method: 'GET',
      statusCode: 200,
      responseTime: Date.now() - startTime,
      userId: authResult.userId
    });

    const response: ApiResponse<AuditLogData[]> = {
      data: logs,
      success: true,
      message: 'Logs de auditoría obtenidos exitosamente',
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages
      }
    };

    const nextResponse = NextResponse.json(response);
    addRateLimitHeaders(nextResponse, rateLimitResult);
    return nextResponse;

  } catch (error) {
    logger.log(LogLevel.ERROR, LogCategory.API, 'Error en GET /api/admin/audit', { error });

    // Registrar métricas de error
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/audit',
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
// POST - Crear log de auditoría manual
// ===================================
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Rate limiting
    const rateLimitResult = await checkRateLimit(
      request,
      {
        windowMs: RATE_LIMIT_CONFIGS.admin.windowMs,
        maxRequests: Math.floor(RATE_LIMIT_CONFIGS.admin.maxRequests / 2),
        message: 'Demasiadas creaciones de logs de auditoría'
      },
      'admin-audit-create'
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
    const { table_name, record_id, action, old_values, new_values } = body;

    if (!table_name || !record_id || !action) {
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Datos requeridos faltantes: table_name, record_id, action',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Crear log de auditoría
    await createAuditLog(
      table_name,
      record_id,
      action,
      old_values,
      new_values,
      authResult.userId!,
      request
    );

    // Registrar métricas
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/audit',
      method: 'POST',
      statusCode: 201,
      responseTime: Date.now() - startTime,
      userId: authResult.userId
    });

    const response: ApiResponse<null> = {
      data: null,
      success: true,
      message: 'Log de auditoría creado exitosamente'
    };

    const nextResponse = NextResponse.json(response, { status: 201 });
    addRateLimitHeaders(nextResponse, rateLimitResult);
    return nextResponse;

  } catch (error) {
    logger.log(LogLevel.ERROR, LogCategory.API, 'Error en POST /api/admin/audit', { error });

    // Registrar métricas de error
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/audit',
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










