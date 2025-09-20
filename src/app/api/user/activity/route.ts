// Configuración para Node.js Runtime
export const runtime = 'nodejs';

// ===================================
// PINTEYA E-COMMERCE - API DE GESTIÓN DE ACTIVIDAD DE USUARIO
// ===================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { supabaseAdmin } from '@/lib/integrations/supabase';

// Tipos para actividad
export interface UserActivity {
  id: string;
  user_id: string;
  action: string;
  category: 'auth' | 'profile' | 'order' | 'security' | 'session' | 'preference';
  description?: string;
  metadata?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

interface ActivityFilters {
  category?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

// GET - Obtener historial de actividad del usuario
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      );
    }

    // Obtener usuario por email
    const userEmail = session.user.email;
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', userEmail)
      .single();

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Obtener parámetros de filtro
    const { searchParams } = new URL(request.url);
    const filters: ActivityFilters = {
      category: searchParams.get('category') || undefined,
      action: searchParams.get('action') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
    };

    // Construir query
    let query = supabaseAdmin
      .from('user_activity')
      .select('*')
      .eq('user_id', user.id);

    // Aplicar filtros
    if (filters.category) {
      query = query.eq('category', filters.category);
    }

    if (filters.action) {
      query = query.eq('action', filters.action);
    }

    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    // Aplicar paginación y ordenamiento
    query = query
      .order('created_at', { ascending: false })
      .range(filters.offset!, filters.offset! + filters.limit! - 1);

    const { data: activities, error } = await query;

    if (error) {
      console.error('Error al obtener actividad:', error);
      return NextResponse.json(
        { error: 'Error al obtener historial de actividad' },
        { status: 500 }
      );
    }

    // Obtener conteo total para paginación
    let countQuery = supabaseAdmin
      .from('user_activity')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (filters.category) {
      countQuery = countQuery.eq('category', filters.category);
    }

    if (filters.action) {
      countQuery = countQuery.eq('action', filters.action);
    }

    if (filters.startDate) {
      countQuery = countQuery.gte('created_at', filters.startDate);
    }

    if (filters.endDate) {
      countQuery = countQuery.lte('created_at', filters.endDate);
    }

    const { count } = await countQuery;

    // Obtener estadísticas de actividad
    const stats = await getActivityStats(user.id, filters);

    return NextResponse.json({
      success: true,
      activities: activities || [],
      pagination: {
        total: count || 0,
        limit: filters.limit,
        offset: filters.offset,
        hasMore: (filters.offset! + filters.limit!) < (count || 0),
      },
      stats,
    });
  } catch (error) {
    console.error('Error en GET /api/user/activity:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Registrar nueva actividad
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      );
    }

    // Obtener usuario por email
    const userEmail = session.user.email;
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', userEmail)
      .single();

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { action, category, description, metadata } = body;

    // Validar datos requeridos
    if (!action || !category) {
      return NextResponse.json(
        { error: 'Acción y categoría son requeridas' },
        { status: 400 }
      );
    }

    // Obtener información del request
    const clientIP = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || '';

    // Crear registro de actividad
    const activityData: Omit<UserActivity, 'id' | 'created_at'> = {
      user_id: user.id,
      action,
      category,
      description,
      metadata,
      ip_address: clientIP,
      user_agent: userAgent,
    };

    const { data: newActivity, error } = await supabaseAdmin
      .from('user_activity')
      .insert(activityData)
      .select()
      .single();

    if (error) {
      console.error('Error al crear actividad:', error);
      return NextResponse.json(
        { error: 'Error al registrar actividad' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      activity: newActivity,
      message: 'Actividad registrada exitosamente',
    });
  } catch (error) {
    console.error('Error en POST /api/user/activity:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Función auxiliar para obtener estadísticas de actividad
async function getActivityStats(userId: string, filters: ActivityFilters) {
  try {
    // Estadísticas por categoría
    const { data: categoryStats } = await supabaseAdmin
      .from('user_activity')
      .select('category')
      .eq('user_id', userId)
      .gte('created_at', filters.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    const categoryCounts = categoryStats?.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // Actividad por día (últimos 7 días)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: dailyActivity } = await supabaseAdmin
      .from('user_activity')
      .select('created_at')
      .eq('user_id', userId)
      .gte('created_at', sevenDaysAgo);

    const dailyCounts = dailyActivity?.reduce((acc, item) => {
      const date = new Date(item.created_at).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    return {
      byCategory: categoryCounts,
      byDay: dailyCounts,
      totalActivities: categoryStats?.length || 0,
    };
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    return {
      byCategory: {},
      byDay: {},
      totalActivities: 0,
    };
  }
}

// Función auxiliar para obtener IP del cliente
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return request.ip || 'unknown';
}










