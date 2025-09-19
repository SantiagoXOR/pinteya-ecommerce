/**
 * API Route para recibir eventos de analytics
 * Optimizado para procesamiento asíncrono y cache
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Cache simple en memoria para eventos recientes (evita duplicados)
const eventCache = new Map<string, number>();
const CACHE_TTL = 5000; // 5 segundos

export async function POST(request: NextRequest) {
  try {
    const event = await request.json();

    // Validación rápida y simple
    if (!event.event || !event.category || !event.action) {
      return NextResponse.json(
        { error: 'Evento inválido: faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Cache key para evitar eventos duplicados
    const cacheKey = `${event.event}-${event.category}-${event.action}-${event.sessionId}`;
    const now = Date.now();

    // Verificar cache para evitar duplicados recientes
    if (eventCache.has(cacheKey)) {
      const lastTime = eventCache.get(cacheKey)!;
      if (now - lastTime < CACHE_TTL) {
        return NextResponse.json({ success: true, cached: true });
      }
    }

    // Actualizar cache
    eventCache.set(cacheKey, now);

    // Limpiar cache viejo periódicamente
    if (eventCache.size > 1000) {
      const cutoff = now - CACHE_TTL;
      for (const [key, time] of eventCache.entries()) {
        if (time < cutoff) {
          eventCache.delete(key);
        }
      }
    }

    // Procesar evento de forma asíncrona usando función optimizada
    setImmediate(async () => {
      try {
        await supabase.rpc('insert_analytics_event_optimized', {
          p_event_name: event.event,
          p_category: event.category,
          p_action: event.action,
          p_label: event.label,
          p_value: event.value,
          p_user_id: event.userId,
          p_session_id: event.sessionId,
          p_page: event.page,
          p_user_agent: event.userAgent
        });
      } catch (error) {
        console.error('Error procesando evento analytics optimizado (async):', error);
      }
    });

    // Respuesta inmediata
    return NextResponse.json(
      { success: true },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Error procesando evento:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '100');

    let query = supabase
      .from('analytics_events_view')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error obteniendo eventos:', error);
      return NextResponse.json(
        { error: 'Error obteniendo eventos' },
        { status: 500 }
      );
    }

    return NextResponse.json({ events: data });
  } catch (error) {
    console.error('Error procesando solicitud:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}









