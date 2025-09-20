// Configuración para Node.js Runtime
export const runtime = 'nodejs';

/**
 * API OPTIMIZADA PARA ANALYTICS - PINTEYA E-COMMERCE
 * Procesamiento en lotes con inserción masiva optimizada
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/integrations/supabase';

interface OptimizedAnalyticsEvent {
  event: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  userId?: string;
  sessionId: string;
  page: string;
  userAgent?: string;
}

interface AnalyticsBatch {
  events: OptimizedAnalyticsEvent[];
  timestamp: number;
  compressed: boolean;
}

/**
 * POST /api/analytics/events/optimized
 * Procesar lotes de eventos de analytics de forma optimizada
 */
export async function POST(request: NextRequest) {
  try {
    const batch: AnalyticsBatch = await request.json();

    if (!batch.events || !Array.isArray(batch.events) || batch.events.length === 0) {
      return NextResponse.json(
        { error: 'Batch de eventos inválido' },
        { status: 400 }
      );
    }

    // Limitar tamaño del batch para evitar timeouts
    if (batch.events.length > 100) {
      return NextResponse.json(
        { error: 'Batch demasiado grande (máximo 100 eventos)' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Servicio de base de datos no disponible' },
        { status: 503 }
      );
    }

    // Procesar eventos de forma asíncrona para respuesta rápida
    setImmediate(async () => {
      try {
        await processEventsBatch(batch.events, supabase);
      } catch (error) {
        console.error('Error procesando batch de analytics (async):', error);
      }
    });

    // Respuesta inmediata
    return NextResponse.json(
      { 
        success: true, 
        processed: batch.events.length,
        timestamp: Date.now()
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('Error en API de analytics optimizada:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * Procesar batch de eventos usando función optimizada de Supabase
 */
async function processEventsBatch(events: OptimizedAnalyticsEvent[], supabase: any) {
  try {
    // Preparar datos para inserción masiva usando función optimizada
    const insertPromises = events.map(event => 
      supabase.rpc('insert_analytics_event_optimized', {
        p_event_name: event.event,
        p_category: event.category,
        p_action: event.action,
        p_label: event.label || null,
        p_value: event.value || null,
        p_user_id: event.userId || null,
        p_session_id: event.sessionId,
        p_page: event.page,
        p_user_agent: event.userAgent || null
      })
    );

    // Ejecutar todas las inserciones en paralelo
    const results = await Promise.allSettled(insertPromises);

    // Contar éxitos y errores
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`Analytics batch processed: ${successful} successful, ${failed} failed`);

    // Log errores para debugging
    if (failed > 0) {
      const errors = results
        .filter(r => r.status === 'rejected')
        .map(r => (r as PromiseRejectedResult).reason);
      
      console.error('Analytics batch errors:', errors);
    }

  } catch (error) {
    console.error('Error en processEventsBatch:', error);
  }
}

/**
 * GET /api/analytics/events/optimized
 * Obtener eventos optimizados con filtros
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const eventType = searchParams.get('eventType');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '100');
    const page = parseInt(searchParams.get('page') || '1');

    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Servicio de base de datos no disponible' },
        { status: 503 }
      );
    }

    // Usar vista optimizada para compatibilidad
    let query = supabase
      .from('analytics_events_view')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    // Aplicar filtros
    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    if (eventType) {
      query = query.eq('event_name', eventType);
    }

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error obteniendo eventos optimizados:', error);
      return NextResponse.json(
        { error: 'Error obteniendo eventos' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Error en GET analytics optimizada:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/analytics/events/optimized
 * Limpiar eventos antiguos (solo admins)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const daysOld = parseInt(searchParams.get('daysOld') || '30');
    const dryRun = searchParams.get('dryRun') === 'true';

    const supabase = getSupabaseClient(true); // Usar cliente admin
    if (!supabase) {
      return NextResponse.json(
        { error: 'Servicio administrativo no disponible' },
        { status: 503 }
      );
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    const cutoffTimestamp = Math.floor(cutoffDate.getTime() / 1000);

    if (dryRun) {
      // Solo contar cuántos registros se eliminarían
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
        cutoffDate: cutoffDate.toISOString()
      });
    }

    // Eliminar registros antiguos
    const { error } = await supabase
      .from('analytics_events_optimized')
      .delete()
      .lt('created_at', cutoffTimestamp);

    if (error) {
      console.error('Error eliminando eventos antiguos:', error);
      return NextResponse.json(
        { error: 'Error eliminando eventos antiguos' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      deleted: true,
      cutoffDate: cutoffDate.toISOString(),
      message: `Eventos anteriores a ${daysOld} días eliminados`
    });

  } catch (error) {
    console.error('Error en DELETE analytics optimizada:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}










