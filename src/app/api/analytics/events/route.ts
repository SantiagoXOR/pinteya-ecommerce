/**
 * API Route para recibir eventos de analytics
 * Almacena eventos en Supabase y procesa métricas
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const event = await request.json();
    
    // Validar estructura del evento
    if (!event.event || !event.category || !event.action) {
      return NextResponse.json(
        { error: 'Evento inválido: faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Insertar evento en Supabase
    const { data, error } = await supabase
      .from('analytics_events')
      .insert({
        event_name: event.event,
        category: event.category,
        action: event.action,
        label: event.label,
        value: event.value,
        user_id: event.userId,
        session_id: event.sessionId,
        page: event.page,
        user_agent: event.userAgent,
        metadata: event.metadata,
        created_at: new Date(event.timestamp).toISOString(),
      });

    if (error) {
      console.error('Error insertando evento:', error);
      return NextResponse.json(
        { error: 'Error almacenando evento' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
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
      .from('analytics_events')
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
