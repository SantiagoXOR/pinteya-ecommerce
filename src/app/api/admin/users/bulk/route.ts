// Configuración para Node.js Runtime
export const runtime = 'nodejs';

// ===================================
// PINTEYA E-COMMERCE - ADMIN USERS BULK OPERATIONS API ENTERPRISE
// ===================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/integrations/supabase';
import { auth } from '@/lib/auth/config';
import { ApiResponse } from '@/types/api';
import { z } from 'zod';
import { logger, LogLevel, LogCategory } from '@/lib/enterprise/logger';
import { checkRateLimit } from '@/lib/auth/rate-limiting';
import { addRateLimitHeaders, RATE_LIMIT_CONFIGS } from '@/lib/enterprise/rate-limiter';
import { metricsCollector } from '@/lib/enterprise/metrics';

// ===================================
// CONFIGURACIÓN
// ===================================

const MAX_BULK_OPERATIONS = 100;
const BATCH_SIZE = 10;

// ===================================
// SCHEMAS DE VALIDACIÓN
// ===================================

const BulkUserOperationSchema = z.object({
  operation: z.enum(['activate', 'deactivate', 'delete', 'update_role', 'export']),
  user_ids: z.array(z.string().uuid()).min(1, 'Debe seleccionar al menos un usuario').max(MAX_BULK_OPERATIONS, `Máximo ${MAX_BULK_OPERATIONS} usuarios por operación`),
  data: z.object({
    role: z.enum(['user', 'admin', 'moderator']).optional(),
    export_format: z.enum(['csv', 'json', 'xlsx']).optional(),
    include_orders: z.boolean().optional(),
    date_range: z.object({
      start: z.string().optional(),
      end: z.string().optional()
    }).optional()
  }).optional()
});

const BulkExportSchema = z.object({
  filters: z.object({
    role: z.enum(['user', 'admin', 'moderator']).optional(),
    is_active: z.boolean().optional(),
    created_after: z.string().optional(),
    created_before: z.string().optional(),
    has_orders: z.boolean().optional(),
    min_orders: z.number().min(0).optional(),
    min_spent: z.number().min(0).optional()
  }).optional(),
  format: z.enum(['csv', 'json', 'xlsx']).default('csv'),
  include_orders: z.boolean().default(false),
  include_addresses: z.boolean().default(false)
});

// ===================================
// TIPOS DE DATOS
// ===================================

interface BulkOperationResult {
  success: number;
  failed: number;
  errors: Array<{
    user_id: string;
    error: string;
  }>;
  processed_users?: any[];
}

interface ExportData {
  users: any[];
  total_count: number;
  export_date: string;
  filters_applied: any;
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

async function processUsersInBatches<T>(
  userIds: string[],
  processor: (batch: string[]) => Promise<T[]>
): Promise<T[]> {
  const results: T[] = [];
  
  for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
    const batch = userIds.slice(i, i + BATCH_SIZE);
    const batchResults = await processor(batch);
    results.push(...batchResults);
    
    // Pequeña pausa entre lotes para evitar sobrecarga
    if (i + BATCH_SIZE < userIds.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return results;
}

async function bulkActivateUsers(userIds: string[], adminUserId: string): Promise<BulkOperationResult> {
  const result: BulkOperationResult = {
    success: 0,
    failed: 0,
    errors: []
  };

  await processUsersInBatches(userIds, async (batch) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .update({ 
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .in('id', batch)
        .neq('id', adminUserId) // Prevenir auto-modificación
        .select('id');

      if (error) {
        batch.forEach(id => {
          result.errors.push({ user_id: id, error: error.message });
          result.failed++;
        });
      } else {
        result.success += data?.length || 0;
        const failedIds = batch.filter(id => !data?.some(u => u.id === id));
        failedIds.forEach(id => {
          result.errors.push({ user_id: id, error: 'Usuario no encontrado o no se pudo activar' });
          result.failed++;
        });
      }
    } catch (error) {
      batch.forEach(id => {
        result.errors.push({ user_id: id, error: 'Error interno' });
        result.failed++;
      });
    }
    return [];
  });

  return result;
}

async function bulkDeactivateUsers(userIds: string[], adminUserId: string): Promise<BulkOperationResult> {
  const result: BulkOperationResult = {
    success: 0,
    failed: 0,
    errors: []
  };

  await processUsersInBatches(userIds, async (batch) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .in('id', batch)
        .neq('id', adminUserId) // Prevenir auto-desactivación
        .select('id');

      if (error) {
        batch.forEach(id => {
          result.errors.push({ user_id: id, error: error.message });
          result.failed++;
        });
      } else {
        result.success += data?.length || 0;
        const failedIds = batch.filter(id => !data?.some(u => u.id === id));
        failedIds.forEach(id => {
          result.errors.push({ user_id: id, error: 'Usuario no encontrado o no se pudo desactivar' });
          result.failed++;
        });
      }
    } catch (error) {
      batch.forEach(id => {
        result.errors.push({ user_id: id, error: 'Error interno' });
        result.failed++;
      });
    }
    return [];
  });

  return result;
}

async function bulkUpdateRole(userIds: string[], newRole: string, adminUserId: string): Promise<BulkOperationResult> {
  const result: BulkOperationResult = {
    success: 0,
    failed: 0,
    errors: []
  };

  await processUsersInBatches(userIds, async (batch) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .update({ 
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .in('id', batch)
        .neq('id', adminUserId) // Prevenir auto-modificación de rol
        .select('id, email');

      if (error) {
        batch.forEach(id => {
          result.errors.push({ user_id: id, error: error.message });
          result.failed++;
        });
      } else {
        result.success += data?.length || 0;
        
        // Actualizar también en Auth metadata
        for (const user of data || []) {
          try {
            await supabaseAdmin.auth.admin.updateUserById(user.id, {
              user_metadata: { role: newRole }
            });
          } catch (authError) {
            logger.log(LogLevel.WARN, LogCategory.AUTH, 'Error actualizando rol en Auth', { 
              userId: user.id, 
              authError 
            });
          }
        }
        
        const failedIds = batch.filter(id => !data?.some(u => u.id === id));
        failedIds.forEach(id => {
          result.errors.push({ user_id: id, error: 'Usuario no encontrado o no se pudo actualizar' });
          result.failed++;
        });
      }
    } catch (error) {
      batch.forEach(id => {
        result.errors.push({ user_id: id, error: 'Error interno' });
        result.failed++;
      });
    }
    return [];
  });

  return result;
}

async function bulkDeleteUsers(userIds: string[], adminUserId: string): Promise<BulkOperationResult> {
  const result: BulkOperationResult = {
    success: 0,
    failed: 0,
    errors: []
  };

  // Verificar que ningún usuario tenga órdenes
  const { data: usersWithOrders } = await supabaseAdmin
    .from('orders')
    .select('user_id')
    .in('user_id', userIds);

  const userIdsWithOrders = new Set(usersWithOrders?.map(o => o.user_id) || []);
  
  // Filtrar usuarios que se pueden eliminar
  const deletableUserIds = userIds.filter(id => 
    id !== adminUserId && !userIdsWithOrders.has(id)
  );
  
  // Marcar como error los que no se pueden eliminar
  userIds.forEach(id => {
    if (id === adminUserId) {
      result.errors.push({ user_id: id, error: 'No puedes eliminar tu propia cuenta' });
      result.failed++;
    } else if (userIdsWithOrders.has(id)) {
      result.errors.push({ user_id: id, error: 'Usuario tiene órdenes asociadas' });
      result.failed++;
    }
  });

  if (deletableUserIds.length === 0) {
    return result;
  }

  await processUsersInBatches(deletableUserIds, async (batch) => {
    try {
      // Eliminar de Auth primero
      for (const userId of batch) {
        try {
          await supabaseAdmin.auth.admin.deleteUser(userId);
        } catch (authError) {
          result.errors.push({ user_id: userId, error: 'Error eliminando de autenticación' });
          result.failed++;
          continue;
        }
      }

      // Eliminar perfiles
      const { data, error } = await supabaseAdmin
        .from('users')
        .delete()
        .in('id', batch)
        .select('id');

      if (error) {
        batch.forEach(id => {
          result.errors.push({ user_id: id, error: error.message });
          result.failed++;
        });
      } else {
        result.success += data?.length || 0;
      }
    } catch (error) {
      batch.forEach(id => {
        result.errors.push({ user_id: id, error: 'Error interno' });
        result.failed++;
      });
    }
    return [];
  });

  return result;
}

async function exportUsers(filters: any, format: string, includeOrders: boolean, includeAddresses: boolean): Promise<ExportData> {
  let query = supabaseAdmin
    .from('users')
    .select(`
      id,
      email,
      name,
      role,
      is_active,
      phone,
      created_at,
      updated_at,
      last_login,
      ${includeAddresses ? 'address,' : ''}
      avatar_url
    `);

  // Aplicar filtros
  if (filters?.role) {
    query = query.eq('role', filters.role);
  }
  if (filters?.is_active !== undefined) {
    query = query.eq('is_active', filters.is_active);
  }
  if (filters?.created_after) {
    query = query.gte('created_at', filters.created_after);
  }
  if (filters?.created_before) {
    query = query.lte('created_at', filters.created_before);
  }

  const { data: users, error } = await query.order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Error exportando usuarios: ${error.message}`);
  }

  let processedUsers = users || [];

  // Incluir estadísticas de órdenes si se solicita
  if (includeOrders) {
    const userIds = processedUsers.map(u => u.id);
    const { data: orderStats } = await supabaseAdmin
      .from('orders')
      .select('user_id, total, status')
      .in('user_id', userIds);

    const ordersByUser = (orderStats || []).reduce((acc, order) => {
      if (!acc[order.user_id]) {
        acc[order.user_id] = { count: 0, total_spent: 0, completed_orders: 0 };
      }
      acc[order.user_id].count++;
      if (order.status === 'completed') {
        acc[order.user_id].completed_orders++;
        acc[order.user_id].total_spent += order.total || 0;
      }
      return acc;
    }, {} as Record<string, any>);

    processedUsers = processedUsers.map(user => ({
      ...user,
      orders_count: ordersByUser[user.id]?.count || 0,
      completed_orders: ordersByUser[user.id]?.completed_orders || 0,
      total_spent: ordersByUser[user.id]?.total_spent || 0
    }));
  }

  // Aplicar filtros adicionales basados en órdenes
  if (filters?.has_orders !== undefined) {
    processedUsers = processedUsers.filter(user => 
      filters.has_orders ? (user.orders_count || 0) > 0 : (user.orders_count || 0) === 0
    );
  }
  if (filters?.min_orders) {
    processedUsers = processedUsers.filter(user => (user.orders_count || 0) >= filters.min_orders);
  }
  if (filters?.min_spent) {
    processedUsers = processedUsers.filter(user => (user.total_spent || 0) >= filters.min_spent);
  }

  return {
    users: processedUsers,
    total_count: processedUsers.length,
    export_date: new Date().toISOString(),
    filters_applied: filters
  };
}

// ===================================
// POST - Operaciones masivas
// ===================================
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Rate limiting
    const rateLimitResult = await checkRateLimit(
      request,
      {
        windowMs: RATE_LIMIT_CONFIGS.admin.windowMs,
        maxRequests: Math.floor(RATE_LIMIT_CONFIGS.admin.maxRequests / 2), // Más restrictivo para operaciones masivas
        message: 'Demasiadas operaciones masivas'
      },
      'admin-users-bulk'
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
    const validationResult = BulkUserOperationSchema.safeParse(body);

    if (!validationResult.success) {
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Datos de operación masiva inválidos',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const { operation, user_ids, data } = validationResult.data;
    let result: BulkOperationResult;

    // Ejecutar operación según el tipo
    switch (operation) {
      case 'activate':
        result = await bulkActivateUsers(user_ids, authResult.userId!);
        break;
      
      case 'deactivate':
        result = await bulkDeactivateUsers(user_ids, authResult.userId!);
        break;
      
      case 'update_role':
        if (!data?.role) {
          const errorResponse: ApiResponse<null> = {
            data: null,
            success: false,
            error: 'Rol requerido para actualización masiva',
          };
          return NextResponse.json(errorResponse, { status: 400 });
        }
        result = await bulkUpdateRole(user_ids, data.role, authResult.userId!);
        break;
      
      case 'delete':
        result = await bulkDeleteUsers(user_ids, authResult.userId!);
        break;
      
      case 'export':
        const exportData = await exportUsers(
          {}, // Filtros vacíos, se usan los user_ids
          data?.export_format || 'csv',
          data?.include_orders || false,
          false
        );
        
        // Filtrar solo los usuarios solicitados
        exportData.users = exportData.users.filter(user => user_ids.includes(user.id));
        exportData.total_count = exportData.users.length;
        
        result = {
          success: exportData.users.length,
          failed: 0,
          errors: [],
          processed_users: exportData.users
        };
        break;
      
      default:
        const errorResponse: ApiResponse<null> = {
          data: null,
          success: false,
          error: 'Operación no soportada',
        };
        return NextResponse.json(errorResponse, { status: 400 });
    }

    // Registrar métricas
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/users/bulk',
      method: 'POST',
      statusCode: 200,
      responseTime: Date.now() - startTime,
      userId: authResult.userId
    });

    // Log de auditoría
    logger.log(LogLevel.INFO, LogCategory.ADMIN, 'Operación masiva de usuarios ejecutada', {
      adminUserId: authResult.userId,
      operation,
      userCount: user_ids.length,
      successCount: result.success,
      failedCount: result.failed
    });

    const response: ApiResponse<BulkOperationResult> = {
      data: result,
      success: true,
      message: `Operación ${operation} completada. ${result.success} exitosos, ${result.failed} fallidos.`
    };

    const nextResponse = NextResponse.json(response);
    addRateLimitHeaders(nextResponse, rateLimitResult);
    return nextResponse;

  } catch (error) {
    logger.log(LogLevel.ERROR, LogCategory.API, 'Error en POST /api/admin/users/bulk', { error });

    // Registrar métricas de error
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/users/bulk',
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

// ===================================
// GET - Exportar usuarios con filtros
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
      'admin-users-export'
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
    const exportParams = {
      filters: {
        role: searchParams.get('role') || undefined,
        is_active: searchParams.get('is_active') ? searchParams.get('is_active') === 'true' : undefined,
        created_after: searchParams.get('created_after') || undefined,
        created_before: searchParams.get('created_before') || undefined,
        has_orders: searchParams.get('has_orders') ? searchParams.get('has_orders') === 'true' : undefined,
        min_orders: searchParams.get('min_orders') ? parseInt(searchParams.get('min_orders')!) : undefined,
        min_spent: searchParams.get('min_spent') ? parseFloat(searchParams.get('min_spent')!) : undefined
      },
      format: (searchParams.get('format') as 'csv' | 'json' | 'xlsx') || 'csv',
      include_orders: searchParams.get('include_orders') === 'true',
      include_addresses: searchParams.get('include_addresses') === 'true'
    };

    // Validar parámetros
    const validationResult = BulkExportSchema.safeParse(exportParams);
    if (!validationResult.success) {
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Parámetros de exportación inválidos',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const { filters, format, include_orders, include_addresses } = validationResult.data;

    // Exportar usuarios
    const exportData = await exportUsers(filters, format, include_orders, include_addresses);

    // Registrar métricas
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/users/bulk',
      method: 'GET',
      statusCode: 200,
      responseTime: Date.now() - startTime,
      userId: authResult.userId
    });

    // Log de auditoría
    logger.log(LogLevel.INFO, LogCategory.ADMIN, 'Exportación de usuarios realizada', {
      adminUserId: authResult.userId,
      format,
      userCount: exportData.total_count,
      filters
    });

    const response: ApiResponse<ExportData> = {
      data: exportData,
      success: true,
      message: `${exportData.total_count} usuarios exportados exitosamente`
    };

    const nextResponse = NextResponse.json(response);
    addRateLimitHeaders(nextResponse, rateLimitResult);
    return nextResponse;

  } catch (error) {
    logger.log(LogLevel.ERROR, LogCategory.API, 'Error en GET /api/admin/users/bulk', { error });

    // Registrar métricas de error
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/users/bulk',
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










