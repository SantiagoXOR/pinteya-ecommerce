/**
 * API PARA LIMPIEZA AUTOMÁTICA DE ANALYTICS - PINTEYA E-COMMERCE
 * Gestiona la limpieza automática de eventos antiguos y estadísticas
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { auth } from '@clerk/nextjs';

/**
 * POST /api/admin/analytics/cleanup
 * Ejecutar limpieza de eventos antiguos (solo admins)
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación de admin
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const daysToKeep = parseInt(searchParams.get('days') || '30');
    const dryRun = searchParams.get('dryRun') === 'true';

    // Validar parámetros
    if (daysToKeep < 1 || daysToKeep > 365) {
      return NextResponse.json(
        { error: 'Días a mantener debe estar entre 1 y 365' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient(true); // Usar cliente admin
    if (!supabase) {
      return NextResponse.json(
        { error: 'Servicio administrativo no disponible' },
        { status: 503 }
      );
    }

    if (dryRun) {
      // Simular limpieza - solo contar registros
      const cutoffTimestamp = Math.floor(Date.now() / 1000) - (daysToKeep * 24 * 60 * 60);
      
      const { count, error } = await supabase
        .from('analytics_events_optimized')
        .select('*', { count: 'exact', head: true })
        .lt('created_at', cutoffTimestamp);

      if (error) {
        console.error('Error en dry run de limpieza:', error);
        return NextResponse.json(
          { error: 'Error en simulación de limpieza' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        dryRun: true,
        wouldDelete: count || 0,
        daysToKeep,
        cutoffDate: new Date(cutoffTimestamp * 1000).toISOString()
      });
    }

    // Ejecutar limpieza real
    const { data, error } = await supabase.rpc('cleanup_old_analytics_events', {
      days_to_keep: daysToKeep
    });

    if (error) {
      console.error('Error ejecutando limpieza:', error);
      return NextResponse.json(
        { error: 'Error ejecutando limpieza automática' },
        { status: 500 }
      );
    }

    const result = data?.[0];

    return NextResponse.json({
      success: true,
      deleted: result?.deleted_count || 0,
      sizeFreed: result?.size_freed || '0 bytes',
      cleanupDate: result?.cleanup_date,
      daysToKeep
    });

  } catch (error) {
    console.error('Error en API de limpieza:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/analytics/cleanup
 * Obtener estadísticas de analytics y limpieza
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación de admin
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const supabase = getSupabaseClient(true);
    if (!supabase) {
      return NextResponse.json(
        { error: 'Servicio administrativo no disponible' },
        { status: 503 }
      );
    }

    // Obtener estadísticas generales
    const { data: stats, error: statsError } = await supabase.rpc('get_analytics_stats');

    if (statsError) {
      console.error('Error obteniendo estadísticas:', statsError);
      return NextResponse.json(
        { error: 'Error obteniendo estadísticas' },
        { status: 500 }
      );
    }

    // Obtener distribución por días
    const { data: distribution, error: distError } = await supabase
      .from('analytics_events_optimized')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1000);

    if (distError) {
      console.error('Error obteniendo distribución:', distError);
    }

    // Calcular distribución por días
    const dayDistribution: Record<string, number> = {};
    if (distribution) {
      distribution.forEach(event => {
        const date = new Date(event.created_at * 1000).toISOString().split('T')[0];
        dayDistribution[date] = (dayDistribution[date] || 0) + 1;
      });
    }

    const statsResult = stats?.[0];

    return NextResponse.json({
      success: true,
      stats: {
        totalEvents: statsResult?.total_events || 0,
        tableSize: statsResult?.table_size || '0 bytes',
        avgEventsPerDay: statsResult?.avg_events_per_day || 0,
        oldestEvent: statsResult?.oldest_event,
        newestEvent: statsResult?.newest_event,
        compressionRatio: statsResult?.compression_ratio || 0,
      },
      distribution: dayDistribution,
      recommendations: generateCleanupRecommendations(statsResult)
    });

  } catch (error) {
    console.error('Error en GET analytics cleanup:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * Generar recomendaciones de limpieza
 */
function generateCleanupRecommendations(stats: any) {
  const recommendations = [];
  
  if (!stats) return recommendations;

  const totalEvents = stats.total_events || 0;
  const avgEventsPerDay = stats.avg_events_per_day || 0;

  // Recomendación basada en volumen
  if (totalEvents > 10000) {
    recommendations.push({
      type: 'warning',
      message: 'Alto volumen de eventos detectado',
      action: 'Considerar limpieza de eventos mayores a 30 días',
      priority: 'high'
    });
  }

  // Recomendación basada en crecimiento
  if (avgEventsPerDay > 100) {
    recommendations.push({
      type: 'info',
      message: 'Crecimiento rápido de eventos',
      action: 'Configurar limpieza automática semanal',
      priority: 'medium'
    });
  }

  // Recomendación de compresión
  if (stats.compression_ratio < 200) {
    recommendations.push({
      type: 'success',
      message: 'Excelente ratio de compresión',
      action: 'Sistema optimizado funcionando correctamente',
      priority: 'low'
    });
  }

  return recommendations;
}
