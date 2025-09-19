// ===================================
// PINTEYA E-COMMERCE - CUSTOM METRICS API
// ===================================

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedAdmin } from '@/lib/auth/admin-auth';
import { 
  enterpriseMetrics,
  MetricType,
  BusinessMetricCategory,
  recordPerformanceMetric,
  recordBusinessMetric,
  recordSecurityMetric,
  recordUserExperienceMetric
} from '@/lib/monitoring/enterprise-metrics';
import { getSupabaseClient } from '@/lib/integrations/supabase';
import { logger, LogLevel, LogCategory } from '@/lib/enterprise/logger';

interface CustomMetricDefinition {
  id: string;
  name: string;
  description: string;
  type: MetricType;
  category: BusinessMetricCategory;
  unit: string;
  tags: Record<string, string>;
  aggregationMethod: 'sum' | 'avg' | 'min' | 'max' | 'count';
  retentionDays: number;
  enabled: boolean;
  createdBy: string;
  createdAt: string;
}

interface MetricValue {
  metricId: string;
  value: number;
  timestamp?: string;
  tags?: Record<string, string>;
  metadata?: Record<string, any>;
}

/**
 * GET /api/admin/monitoring/metrics/custom
 * Obtiene métricas personalizadas y sus definiciones
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación de admin
    const authResult = await getAuthenticatedAdmin(request);
    
    if (!authResult.isAdmin || !authResult.userId) {
      return NextResponse.json({
        success: false,
        error: 'Acceso no autorizado'
      }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action') || 'list';
    const metricId = searchParams.get('metricId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const aggregation = searchParams.get('aggregation') || '1h';

    const supabase = getSupabaseClient(true);
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    switch (action) {
      case 'list':
        // Listar definiciones de métricas personalizadas
        const { data: definitions } = await supabase
          .from('custom_metric_definitions')
          .select('*')
          .order('created_at', { ascending: false });

        return NextResponse.json({
          success: true,
          data: {
            definitions: definitions || [],
            count: definitions?.length || 0
          }
        });

      case 'values':
        if (!metricId) {
          return NextResponse.json({
            success: false,
            error: 'metricId requerido para obtener valores'
          }, { status: 400 });
        }

        // Obtener valores de métrica específica
        let query = supabase
          .from('enterprise_metrics')
          .select('*')
          .eq('name', metricId)
          .order('timestamp', { ascending: false })
          .limit(1000);

        if (startDate) {
          query = query.gte('timestamp', startDate);
        }
        if (endDate) {
          query = query.lte('timestamp', endDate);
        }

        const { data: values } = await query;

        // Agregar datos si se solicita
        let aggregatedData = values;
        if (aggregation !== 'raw' && values) {
          aggregatedData = await aggregateMetricValues(values, aggregation);
        }

        return NextResponse.json({
          success: true,
          data: {
            metricId,
            values: aggregatedData || [],
            aggregation,
            count: aggregatedData?.length || 0
          }
        });

      case 'stats':
        // Estadísticas generales de métricas personalizadas
        const { count: totalDefinitions } = await supabase
          .from('custom_metric_definitions')
          .select('*', { count: 'exact', head: true });

        const { count: totalValues } = await supabase
          .from('enterprise_metrics')
          .select('*', { count: 'exact', head: true })
          .like('name', 'custom.%');

        const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { count: recentValues } = await supabase
          .from('enterprise_metrics')
          .select('*', { count: 'exact', head: true })
          .like('name', 'custom.%')
          .gte('timestamp', last24h);

        return NextResponse.json({
          success: true,
          data: {
            totalDefinitions: totalDefinitions || 0,
            totalValues: totalValues || 0,
            recentValues: recentValues || 0,
            period: '24h'
          }
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Acción no válida'
        }, { status: 400 });
    }

  } catch (error) {
    logger.error(LogLevel.ERROR, 'Failed to get custom metrics', {
      error: error instanceof Error ? error.message : 'Unknown error'
    }, LogCategory.SYSTEM);

    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}

/**
 * POST /api/admin/monitoring/metrics/custom
 * Crea nueva métrica personalizada o registra valores
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación de admin
    const authResult = await getAuthenticatedAdmin(request);
    
    if (!authResult.isAdmin || !authResult.userId) {
      return NextResponse.json({
        success: false,
        error: 'Acceso no autorizado'
      }, { status: 401 });
    }

    const body = await request.json();
    const { action, data } = body;

    if (!action || !data) {
      return NextResponse.json({
        success: false,
        error: 'Faltan parámetros: action y data'
      }, { status: 400 });
    }

    const supabase = getSupabaseClient(true);
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    switch (action) {
      case 'create_definition':
        // Crear nueva definición de métrica
        const definition: Partial<CustomMetricDefinition> = {
          id: `custom.${data.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
          name: data.name,
          description: data.description || '',
          type: data.type || MetricType.GAUGE,
          category: data.category || BusinessMetricCategory.BUSINESS,
          unit: data.unit || '',
          tags: data.tags || {},
          aggregationMethod: data.aggregationMethod || 'avg',
          retentionDays: data.retentionDays || 30,
          enabled: data.enabled !== false,
          createdBy: authResult.userId,
          createdAt: new Date().toISOString()
        };

        // Validar campos requeridos
        if (!definition.name) {
          return NextResponse.json({
            success: false,
            error: 'Nombre de métrica requerido'
          }, { status: 400 });
        }

        // Verificar que no exista
        const { data: existing } = await supabase
          .from('custom_metric_definitions')
          .select('id')
          .eq('id', definition.id)
          .single();

        if (existing) {
          return NextResponse.json({
            success: false,
            error: 'Ya existe una métrica con ese nombre'
          }, { status: 409 });
        }

        // Crear definición
        const { error: createError } = await supabase
          .from('custom_metric_definitions')
          .insert(definition);

        if (createError) {
          throw createError;
        }

        logger.info(LogLevel.INFO, 'Custom metric definition created', {
          metricId: definition.id,
          name: definition.name,
          createdBy: authResult.userId
        }, LogCategory.SYSTEM);

        return NextResponse.json({
          success: true,
          data: {
            metricId: definition.id,
            name: definition.name,
            created: true
          }
        });

      case 'record_value':
        // Registrar valor de métrica
        const metricValue: MetricValue = data;

        if (!metricValue.metricId || metricValue.value === undefined) {
          return NextResponse.json({
            success: false,
            error: 'metricId y value son requeridos'
          }, { status: 400 });
        }

        // Verificar que la métrica existe
        const { data: metricDef } = await supabase
          .from('custom_metric_definitions')
          .select('*')
          .eq('id', metricValue.metricId)
          .single();

        if (!metricDef) {
          return NextResponse.json({
            success: false,
            error: 'Métrica no encontrada'
          }, { status: 404 });
        }

        if (!metricDef.enabled) {
          return NextResponse.json({
            success: false,
            error: 'Métrica deshabilitada'
          }, { status: 400 });
        }

        // Registrar valor usando el sistema de métricas enterprise
        await enterpriseMetrics.recordMetric(
          metricValue.metricId,
          metricValue.value,
          metricDef.type,
          metricDef.category,
          metricValue.tags || metricDef.tags,
          metricValue.metadata
        );

        logger.info(LogLevel.INFO, 'Custom metric value recorded', {
          metricId: metricValue.metricId,
          value: metricValue.value,
          recordedBy: authResult.userId
        }, LogCategory.SYSTEM);

        return NextResponse.json({
          success: true,
          data: {
            metricId: metricValue.metricId,
            value: metricValue.value,
            recorded: true,
            timestamp: new Date().toISOString()
          }
        });

      case 'record_batch':
        // Registrar múltiples valores
        const batchValues: MetricValue[] = data.values || [];

        if (!Array.isArray(batchValues) || batchValues.length === 0) {
          return NextResponse.json({
            success: false,
            error: 'Array de valores requerido'
          }, { status: 400 });
        }

        const results = [];
        for (const value of batchValues) {
          try {
            // Verificar métrica
            const { data: def } = await supabase
              .from('custom_metric_definitions')
              .select('*')
              .eq('id', value.metricId)
              .single();

            if (def && def.enabled) {
              await enterpriseMetrics.recordMetric(
                value.metricId,
                value.value,
                def.type,
                def.category,
                value.tags || def.tags,
                value.metadata
              );
              results.push({ metricId: value.metricId, success: true });
            } else {
              results.push({ metricId: value.metricId, success: false, error: 'Metric not found or disabled' });
            }
          } catch (error) {
            results.push({ 
              metricId: value.metricId, 
              success: false, 
              error: error instanceof Error ? error.message : 'Unknown error' 
            });
          }
        }

        const successCount = results.filter(r => r.success).length;

        logger.info(LogLevel.INFO, 'Custom metrics batch recorded', {
          totalValues: batchValues.length,
          successCount,
          failureCount: batchValues.length - successCount,
          recordedBy: authResult.userId
        }, LogCategory.SYSTEM);

        return NextResponse.json({
          success: true,
          data: {
            totalValues: batchValues.length,
            successCount,
            failureCount: batchValues.length - successCount,
            results
          }
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Acción no válida'
        }, { status: 400 });
    }

  } catch (error) {
    logger.error(LogLevel.ERROR, 'Failed to process custom metrics request', {
      error: error instanceof Error ? error.message : 'Unknown error'
    }, LogCategory.SYSTEM);

    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}

/**
 * PUT /api/admin/monitoring/metrics/custom
 * Actualiza definición de métrica personalizada
 */
export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticación de admin
    const authResult = await getAuthenticatedAdmin(request);
    
    if (!authResult.isAdmin || !authResult.userId) {
      return NextResponse.json({
        success: false,
        error: 'Acceso no autorizado'
      }, { status: 401 });
    }

    const body = await request.json();
    const { metricId, updates } = body;

    if (!metricId || !updates) {
      return NextResponse.json({
        success: false,
        error: 'metricId y updates requeridos'
      }, { status: 400 });
    }

    const supabase = getSupabaseClient(true);
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    // Verificar que la métrica existe
    const { data: existing } = await supabase
      .from('custom_metric_definitions')
      .select('*')
      .eq('id', metricId)
      .single();

    if (!existing) {
      return NextResponse.json({
        success: false,
        error: 'Métrica no encontrada'
      }, { status: 404 });
    }

    // Campos permitidos para actualización
    const allowedFields = [
      'description', 'unit', 'tags', 'aggregationMethod', 
      'retentionDays', 'enabled'
    ];

    const updateData: Record<string, any> = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No hay campos válidos para actualizar'
      }, { status: 400 });
    }

    // Actualizar
    const { error: updateError } = await supabase
      .from('custom_metric_definitions')
      .update(updateData)
      .eq('id', metricId);

    if (updateError) {
      throw updateError;
    }

    logger.info(LogLevel.INFO, 'Custom metric definition updated', {
      metricId,
      updatedFields: Object.keys(updateData),
      updatedBy: authResult.userId
    }, LogCategory.SYSTEM);

    return NextResponse.json({
      success: true,
      data: {
        metricId,
        updated: updateData,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error(LogLevel.ERROR, 'Failed to update custom metric', {
      error: error instanceof Error ? error.message : 'Unknown error'
    }, LogCategory.SYSTEM);

    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/monitoring/metrics/custom
 * Elimina definición de métrica personalizada
 */
export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticación de admin
    const authResult = await getAuthenticatedAdmin(request);
    
    if (!authResult.isAdmin || !authResult.userId) {
      return NextResponse.json({
        success: false,
        error: 'Acceso no autorizado'
      }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const metricId = searchParams.get('metricId');

    if (!metricId) {
      return NextResponse.json({
        success: false,
        error: 'metricId requerido'
      }, { status: 400 });
    }

    const supabase = getSupabaseClient(true);
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    // Verificar que la métrica existe
    const { data: existing } = await supabase
      .from('custom_metric_definitions')
      .select('*')
      .eq('id', metricId)
      .single();

    if (!existing) {
      return NextResponse.json({
        success: false,
        error: 'Métrica no encontrada'
      }, { status: 404 });
    }

    // Eliminar definición
    const { error: deleteError } = await supabase
      .from('custom_metric_definitions')
      .delete()
      .eq('id', metricId);

    if (deleteError) {
      throw deleteError;
    }

    logger.info(LogLevel.INFO, 'Custom metric definition deleted', {
      metricId,
      name: existing.name,
      deletedBy: authResult.userId
    }, LogCategory.SYSTEM);

    return NextResponse.json({
      success: true,
      data: {
        metricId,
        deleted: true,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error(LogLevel.ERROR, 'Failed to delete custom metric', {
      error: error instanceof Error ? error.message : 'Unknown error'
    }, LogCategory.SYSTEM);

    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}

/**
 * Agrega valores de métrica según el período especificado
 */
async function aggregateMetricValues(values: any[], period: string) {
  const aggregated: Record<string, { sum: number; count: number; min: number; max: number }> = {};
  
  values.forEach(value => {
    let key: string;
    const date = new Date(value.timestamp);
    
    switch (period) {
      case '1m':
        key = date.toISOString().substring(0, 16) + ':00.000Z';
        break;
      case '5m':
        const minutes = Math.floor(date.getMinutes() / 5) * 5;
        key = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), minutes).toISOString();
        break;
      case '1h':
        key = date.toISOString().substring(0, 13) + ':00:00.000Z';
        break;
      case '1d':
        key = date.toISOString().substring(0, 10) + 'T00:00:00.000Z';
        break;
      default:
        key = value.timestamp;
    }
    
    if (!aggregated[key]) {
      aggregated[key] = { sum: 0, count: 0, min: value.value, max: value.value };
    }
    
    aggregated[key].sum += value.value;
    aggregated[key].count += 1;
    aggregated[key].min = Math.min(aggregated[key].min, value.value);
    aggregated[key].max = Math.max(aggregated[key].max, value.value);
  });
  
  return Object.entries(aggregated).map(([timestamp, data]) => ({
    timestamp,
    value: data.sum / data.count, // Promedio
    sum: data.sum,
    count: data.count,
    min: data.min,
    max: data.max
  }));
}









