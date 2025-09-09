import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@/auth';
import { checkRateLimit, addRateLimitHeaders } from '@/lib/rate-limiter';
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
    maxRequests: 20, // Más restrictivo para operaciones masivas
    message: 'Demasiadas operaciones masivas de promociones'
  }
};

// ===================================
// ESQUEMAS DE VALIDACIÓN
// ===================================
const BulkPromotionActionSchema = z.object({
  action: z.enum(['activate', 'deactivate', 'pause', 'resume', 'delete', 'duplicate', 'extend', 'update_priority']),
  promotion_ids: z.array(z.string().uuid()).min(1, 'Debe seleccionar al menos una promoción').max(50, 'Máximo 50 promociones por operación'),
  
  // Para extend
  extend_days: z.number().int().min(1).max(365).optional(),
  
  // Para update_priority
  priority: z.number().int().min(1).max(100).optional(),
  
  // Para operaciones condicionales
  force: z.boolean().default(false)
});

const BulkPromotionUpdateSchema = z.object({
  promotion_ids: z.array(z.string().uuid()).min(1).max(50),
  updates: z.object({
    // Configuración general
    is_active: z.boolean().optional(),
    is_paused: z.boolean().optional(),
    priority: z.number().int().min(1).max(100).optional(),
    
    // Fechas
    starts_at: z.string().optional(),
    ends_at: z.string().optional(),
    
    // Límites
    usage_limit: z.number().int().min(1).optional(),
    usage_limit_per_user: z.number().int().min(1).optional(),
    
    // Display
    show_on_product_page: z.boolean().optional(),
    show_on_category_page: z.boolean().optional(),
    show_on_homepage: z.boolean().optional(),
    
    // Targeting
    customer_groups: z.array(z.string()).optional(),
    first_time_customers_only: z.boolean().optional()
  })
});

const BulkPromotionExportSchema = z.object({
  promotion_ids: z.array(z.string().uuid()).optional(),
  filters: z.object({
    status: z.enum(['active', 'inactive', 'scheduled', 'expired', 'paused']).optional(),
    type: z.enum(['percentage_discount', 'fixed_discount', 'buy_x_get_y', 'free_shipping', 'bundle_deal']).optional(),
    date_from: z.string().optional(),
    date_to: z.string().optional(),
    created_by: z.string().uuid().optional()
  }).optional(),
  format: z.enum(['csv', 'xlsx', 'json']).default('csv'),
  include_stats: z.boolean().default(false)
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

interface BulkOperationResult {
  total_requested: number;
  successful: number;
  failed: number;
  results: Array<{
    promotion_id: string;
    success: boolean;
    error?: string;
    data?: any;
  }>;
  summary?: {
    activated?: number;
    deactivated?: number;
    paused?: number;
    resumed?: number;
    deleted?: number;
    duplicated?: number;
    extended?: number;
    updated?: number;
  };
}

interface PromotionExportData {
  id: string;
  name: string;
  description?: string;
  type: string;
  priority: number;
  discount_percentage?: number;
  discount_amount?: number;
  minimum_order_amount?: number;
  usage_limit?: number;
  usage_count: number;
  starts_at: string;
  ends_at?: string;
  is_active: boolean;
  is_paused?: boolean;
  status: string;
  created_at: string;
  created_by: string;
  creator_name?: string;
  
  // Estadísticas si se incluyen
  total_usage?: number;
  unique_users?: number;
  total_discount_given?: number;
  conversion_rate?: number;
}

// ===================================
// FUNCIONES AUXILIARES
// ===================================
async function validateAdminAuth() {
  const session = await auth();
  
  if (!session?.user) {
    return { error: 'No autorizado', status: 401 };
  }

  // Verificar rol de administrador o manager
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (!['admin', 'manager'].includes(profile?.role)) {
    return { error: 'Acceso denegado', status: 403 };
  }

  return { userId: session.user.id, role: profile.role };
}

async function getPromotionsForBulkOperation(promotionIds: string[]) {
  const { data: promotions, error } = await supabase
    .from('promotions')
    .select(`
      id,
      name,
      type,
      is_active,
      is_paused,
      starts_at,
      ends_at,
      usage_count,
      usage_limit,
      priority
    `)
    .in('id', promotionIds);

  if (error) {
    throw new Error(`Error al obtener promociones: ${error.message}`);
  }

  return promotions || [];
}

async function executeBulkAction(
  action: string,
  promotionIds: string[],
  userId: string,
  options: any = {}
): Promise<BulkOperationResult> {
  const results: BulkOperationResult['results'] = [];
  const summary: BulkOperationResult['summary'] = {};

  // Obtener promociones existentes
  const existingPromotions = await getPromotionsForBulkOperation(promotionIds);
  const existingIds = new Set(existingPromotions.map(p => p.id));

  for (const promotionId of promotionIds) {
    try {
      if (!existingIds.has(promotionId)) {
        results.push({
          promotion_id: promotionId,
          success: false,
          error: 'Promoción no encontrada'
        });
        continue;
      }

      const promotion = existingPromotions.find(p => p.id === promotionId)!;
      let updateData: any = {};
      let actionResult: any = null;

      switch (action) {
        case 'activate':
          if (promotion.is_active && !promotion.is_paused) {
            results.push({
              promotion_id: promotionId,
              success: false,
              error: 'La promoción ya está activa'
            });
            continue;
          }
          updateData = { is_active: true, is_paused: false };
          summary.activated = (summary.activated || 0) + 1;
          break;

        case 'deactivate':
          if (!promotion.is_active) {
            results.push({
              promotion_id: promotionId,
              success: false,
              error: 'La promoción ya está inactiva'
            });
            continue;
          }
          updateData = { is_active: false };
          summary.deactivated = (summary.deactivated || 0) + 1;
          break;

        case 'pause':
          if (!promotion.is_active || promotion.is_paused) {
            results.push({
              promotion_id: promotionId,
              success: false,
              error: 'La promoción no se puede pausar'
            });
            continue;
          }
          updateData = { is_paused: true };
          summary.paused = (summary.paused || 0) + 1;
          break;

        case 'resume':
          if (!promotion.is_paused) {
            results.push({
              promotion_id: promotionId,
              success: false,
              error: 'La promoción no está pausada'
            });
            continue;
          }
          updateData = { is_paused: false };
          summary.resumed = (summary.resumed || 0) + 1;
          break;

        case 'delete':
          // Verificar si tiene uso activo
          const { data: activeUsage } = await supabase
            .from('promotion_usage')
            .select('id')
            .eq('promotion_id', promotionId)
            .limit(1);

          if (activeUsage && activeUsage.length > 0 && !options.force) {
            // Desactivar en lugar de eliminar
            updateData = { is_active: false };
            actionResult = { deleted: false, deactivated: true };
          } else {
            // Eliminar relaciones primero
            await Promise.all([
              supabase.from('promotion_categories').delete().eq('promotion_id', promotionId),
              supabase.from('promotion_products').delete().eq('promotion_id', promotionId),
              supabase.from('promotion_brands').delete().eq('promotion_id', promotionId),
              supabase.from('promotion_bundle_products').delete().eq('promotion_id', promotionId)
            ]);

            // Eliminar promoción
            const { error: deleteError } = await supabase
              .from('promotions')
              .delete()
              .eq('id', promotionId);

            if (deleteError) {
              throw new Error(`Error al eliminar: ${deleteError.message}`);
            }

            actionResult = { deleted: true, deactivated: false };
            summary.deleted = (summary.deleted || 0) + 1;
          }
          break;

        case 'duplicate':
          // Obtener promoción completa
          const { data: fullPromotion, error: fetchError } = await supabase
            .from('promotions')
            .select('*')
            .eq('id', promotionId)
            .single();

          if (fetchError) {
            throw new Error(`Error al obtener promoción: ${fetchError.message}`);
          }

          // Crear duplicado
          const duplicateData = {
            ...fullPromotion,
            name: `${fullPromotion.name} (Copia)`,
            coupon_code: fullPromotion.coupon_code ? `${fullPromotion.coupon_code}_COPY_${Date.now()}` : undefined,
            is_active: false,
            usage_count: 0,
            created_by: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          delete duplicateData.id;

          const { data: newPromotion, error: createError } = await supabase
            .from('promotions')
            .insert(duplicateData)
            .select()
            .single();

          if (createError) {
            throw new Error(`Error al duplicar: ${createError.message}`);
          }

          actionResult = newPromotion;
          summary.duplicated = (summary.duplicated || 0) + 1;
          break;

        case 'extend':
          if (!options.extend_days) {
            throw new Error('Días de extensión requeridos');
          }

          if (!promotion.ends_at) {
            throw new Error('La promoción no tiene fecha de finalización');
          }

          const newEndDate = new Date(promotion.ends_at);
          newEndDate.setDate(newEndDate.getDate() + options.extend_days);

          updateData = { ends_at: newEndDate.toISOString() };
          summary.extended = (summary.extended || 0) + 1;
          break;

        case 'update_priority':
          if (!options.priority) {
            throw new Error('Prioridad requerida');
          }
          updateData = { priority: options.priority };
          summary.updated = (summary.updated || 0) + 1;
          break;

        default:
          throw new Error('Acción no válida');
      }

      // Ejecutar actualización si hay datos para actualizar
      if (Object.keys(updateData).length > 0) {
        updateData.updated_at = new Date().toISOString();

        const { data: updatedPromotion, error: updateError } = await supabase
          .from('promotions')
          .update(updateData)
          .eq('id', promotionId)
          .select()
          .single();

        if (updateError) {
          throw new Error(`Error al actualizar: ${updateError.message}`);
        }

        actionResult = updatedPromotion;
      }

      results.push({
        promotion_id: promotionId,
        success: true,
        data: actionResult
      });

      // Registrar auditoría
      await logAuditAction(action, promotionId, userId, { bulk_operation: true, ...options });

    } catch (error) {
      results.push({
        promotion_id: promotionId,
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  return {
    total_requested: promotionIds.length,
    successful,
    failed,
    results,
    summary
  };
}

async function executeBulkUpdate(
  promotionIds: string[],
  updates: any,
  userId: string
): Promise<BulkOperationResult> {
  const results: BulkOperationResult['results'] = [];

  // Validar fechas si se proporcionan
  if (updates.starts_at && updates.ends_at) {
    const startsAt = new Date(updates.starts_at);
    const endsAt = new Date(updates.ends_at);
    
    if (startsAt >= endsAt) {
      throw new Error('La fecha de inicio debe ser anterior a la fecha de finalización');
    }
  }

  // Obtener promociones existentes
  const existingPromotions = await getPromotionsForBulkOperation(promotionIds);
  const existingIds = new Set(existingPromotions.map(p => p.id));

  for (const promotionId of promotionIds) {
    try {
      if (!existingIds.has(promotionId)) {
        results.push({
          promotion_id: promotionId,
          success: false,
          error: 'Promoción no encontrada'
        });
        continue;
      }

      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { data: updatedPromotion, error: updateError } = await supabase
        .from('promotions')
        .update(updateData)
        .eq('id', promotionId)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Error al actualizar: ${updateError.message}`);
      }

      results.push({
        promotion_id: promotionId,
        success: true,
        data: updatedPromotion
      });

      // Registrar auditoría
      await logAuditAction('bulk_update', promotionId, userId, { updates });

    } catch (error) {
      results.push({
        promotion_id: promotionId,
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  return {
    total_requested: promotionIds.length,
    successful,
    failed,
    results,
    summary: {
      updated: successful
    }
  };
}

async function exportPromotions(
  promotionIds?: string[],
  filters?: any,
  format: 'csv' | 'xlsx' | 'json' = 'csv',
  includeStats = false
): Promise<{ data: PromotionExportData[]; filename: string }> {
  let query = supabase
    .from('promotions')
    .select(`
      id,
      name,
      description,
      type,
      priority,
      discount_percentage,
      discount_amount,
      minimum_order_amount,
      usage_limit,
      usage_count,
      starts_at,
      ends_at,
      is_active,
      is_paused,
      created_at,
      created_by,
      creator:profiles!promotions_created_by_fkey(
        full_name
      )
    `);

  // Aplicar filtros
  if (promotionIds && promotionIds.length > 0) {
    query = query.in('id', promotionIds);
  }

  if (filters) {
    if (filters.type) {
      query = query.eq('type', filters.type);
    }
    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from);
    }
    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to);
    }
    if (filters.created_by) {
      query = query.eq('created_by', filters.created_by);
    }
  }

  const { data: promotions, error } = await query.order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Error al exportar promociones: ${error.message}`);
  }

  // Procesar datos para exportación
  const exportData: PromotionExportData[] = [];

  for (const promotion of promotions || []) {
    // Calcular estado
    const now = new Date();
    const startsAt = new Date(promotion.starts_at);
    const endsAt = promotion.ends_at ? new Date(promotion.ends_at) : null;
    
    let status: string;
    if (promotion.is_paused) {
      status = 'paused';
    } else if (!promotion.is_active) {
      status = 'inactive';
    } else if (now < startsAt) {
      status = 'scheduled';
    } else if (endsAt && now > endsAt) {
      status = 'expired';
    } else {
      status = 'active';
    }

    const exportItem: PromotionExportData = {
      id: promotion.id,
      name: promotion.name,
      description: promotion.description,
      type: promotion.type,
      priority: promotion.priority,
      discount_percentage: promotion.discount_percentage,
      discount_amount: promotion.discount_amount,
      minimum_order_amount: promotion.minimum_order_amount,
      usage_limit: promotion.usage_limit,
      usage_count: promotion.usage_count,
      starts_at: promotion.starts_at,
      ends_at: promotion.ends_at,
      is_active: promotion.is_active,
      is_paused: promotion.is_paused,
      status,
      created_at: promotion.created_at,
      created_by: promotion.created_by,
      creator_name: promotion.creator?.full_name
    };

    // Incluir estadísticas si se solicita
    if (includeStats) {
      try {
        const stats = await getPromotionUsageStats(promotion.id);
        exportItem.total_usage = stats.total_usage;
        exportItem.unique_users = stats.unique_users;
        exportItem.total_discount_given = stats.total_discount_given;
        exportItem.conversion_rate = stats.conversion_rate;
      } catch (error) {
        // Continuar sin estadísticas si hay error
      }
    }

    exportData.push(exportItem);
  }

  // Generar nombre de archivo
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `promotions_export_${timestamp}.${format}`;

  return { data: exportData, filename };
}

async function getPromotionUsageStats(promotionId: string) {
  const { data: usage, error } = await supabase
    .from('promotion_usage')
    .select('*')
    .eq('promotion_id', promotionId);

  if (error) {
    throw new Error(`Error al obtener estadísticas: ${error.message}`);
  }

  const totalUsage = usage?.length || 0;
  const uniqueUsers = new Set(usage?.map(u => u.user_id) || []).size;
  const totalDiscountGiven = (usage || []).reduce((sum, u) => sum + (u.discount_amount || 0), 0);
  
  // Calcular tasa de conversión simplificada
  const orderIds = [...new Set(usage?.map(u => u.order_id) || [])];
  const conversionRate = uniqueUsers > 0 ? (orderIds.length / uniqueUsers) * 100 : 0;

  return {
    total_usage: totalUsage,
    unique_users: uniqueUsers,
    total_discount_given: totalDiscountGiven,
    conversion_rate: conversionRate
  };
}

async function logAuditAction(action: string, promotionId: string, userId: string, details?: any) {
  try {
    await supabase.from('audit_logs').insert({
      table_name: 'promotions',
      record_id: promotionId,
      action,
      user_id: userId,
      changes: details,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    logger.log(LogLevel.WARN, LogCategory.AUDIT, 'Error al registrar auditoría', { error });
  }
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
        maxRequests: RATE_LIMIT_CONFIGS.admin.maxRequests,
        message: RATE_LIMIT_CONFIGS.admin.message
      },
      'admin-promotions-bulk'
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
    const { operation } = body;

    let result: any;

    switch (operation) {
      case 'action': {
        const actionData = BulkPromotionActionSchema.parse(body);
        result = await executeBulkAction(
          actionData.action,
          actionData.promotion_ids,
          authResult.userId!,
          {
            extend_days: actionData.extend_days,
            priority: actionData.priority,
            force: actionData.force
          }
        );
        break;
      }

      case 'update': {
        const updateData = BulkPromotionUpdateSchema.parse(body);
        result = await executeBulkUpdate(
          updateData.promotion_ids,
          updateData.updates,
          authResult.userId!
        );
        break;
      }

      case 'export': {
        const exportData = BulkPromotionExportSchema.parse(body);
        const exportResult = await exportPromotions(
          exportData.promotion_ids,
          exportData.filters,
          exportData.format,
          exportData.include_stats
        );
        
        result = {
          filename: exportResult.filename,
          total_records: exportResult.data.length,
          data: exportResult.data
        };
        break;
      }

      default:
        throw new Error('Operación no válida');
    }

    // Registrar métricas
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/promotions/bulk',
      method: 'POST',
      statusCode: 200,
      responseTime: Date.now() - startTime,
      userId: authResult.userId
    });

    const response: ApiResponse<typeof result> = {
      data: result,
      success: true,
      message: `Operación '${operation}' ejecutada exitosamente`
    };

    const nextResponse = NextResponse.json(response);
    addRateLimitHeaders(nextResponse, rateLimitResult);
    return nextResponse;

  } catch (error) {
    logger.log(LogLevel.ERROR, LogCategory.API, 'Error en POST /api/admin/promotions/bulk', { error });

    // Registrar métricas de error
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/promotions/bulk',
      method: 'POST',
      statusCode: 500,
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    const errorResponse: ApiResponse<null> = {
      data: null,
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// ===================================
// GET - Obtener información para operaciones masivas
// ===================================
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Rate limiting
    const rateLimitResult = await checkRateLimit(
      request,
      {
        windowMs: RATE_LIMIT_CONFIGS.admin.windowMs,
        maxRequests: RATE_LIMIT_CONFIGS.admin.maxRequests * 2,
        message: 'Demasiadas consultas de información masiva'
      },
      'admin-promotions-bulk-info'
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

    const { searchParams } = new URL(request.url);
    const promotionIds = searchParams.get('promotion_ids')?.split(',') || [];

    if (promotionIds.length === 0) {
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'IDs de promociones requeridos',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Obtener información de las promociones
    const promotions = await getPromotionsForBulkOperation(promotionIds);
    
    // Calcular estadísticas para operaciones masivas
    const stats = {
      total_selected: promotionIds.length,
      found: promotions.length,
      not_found: promotionIds.length - promotions.length,
      by_status: {
        active: 0,
        inactive: 0,
        paused: 0,
        scheduled: 0,
        expired: 0
      },
      by_type: {} as Record<string, number>,
      has_usage: 0,
      can_delete: 0
    };

    const now = new Date();
    
    for (const promotion of promotions) {
      // Calcular estado
      const startsAt = new Date(promotion.starts_at);
      const endsAt = promotion.ends_at ? new Date(promotion.ends_at) : null;
      
      let status: string;
      if (promotion.is_paused) {
        status = 'paused';
      } else if (!promotion.is_active) {
        status = 'inactive';
      } else if (now < startsAt) {
        status = 'scheduled';
      } else if (endsAt && now > endsAt) {
        status = 'expired';
      } else {
        status = 'active';
      }

      stats.by_status[status as keyof typeof stats.by_status]++;
      stats.by_type[promotion.type] = (stats.by_type[promotion.type] || 0) + 1;
      
      if (promotion.usage_count > 0) {
        stats.has_usage++;
      } else {
        stats.can_delete++;
      }
    }

    // Registrar métricas
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/promotions/bulk',
      method: 'GET',
      statusCode: 200,
      responseTime: Date.now() - startTime,
      userId: authResult.userId
    });

    const response: ApiResponse<{ promotions: typeof promotions; stats: typeof stats }> = {
      data: {
        promotions,
        stats
      },
      success: true,
      message: 'Información de operaciones masivas obtenida exitosamente'
    };

    const nextResponse = NextResponse.json(response);
    addRateLimitHeaders(nextResponse, rateLimitResult);
    return nextResponse;

  } catch (error) {
    logger.log(LogLevel.ERROR, LogCategory.API, 'Error en GET /api/admin/promotions/bulk', { error });

    // Registrar métricas de error
    metricsCollector.recordApiCall({
      endpoint: '/api/admin/promotions/bulk',
      method: 'GET',
      statusCode: 500,
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    const errorResponse: ApiResponse<null> = {
      data: null,
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}