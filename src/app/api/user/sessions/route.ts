// ===================================
// PINTEYA E-COMMERCE - API DE GESTIÓN DE SESIONES
// ===================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/integrations/supabase';

// Tipos para sesiones
export interface UserSession {
  id: string;
  user_id: string;
  device_type: string;
  device_name: string;
  browser: string;
  os: string;
  ip_address: string;
  location?: string;
  is_current: boolean;
  last_activity: string;
  created_at: string;
  user_agent: string;
}

interface SessionCreateData {
  device_type: string;
  device_name: string;
  browser: string;
  os: string;
  ip_address: string;
  location?: string;
  user_agent: string;
}

// Función para detectar información del dispositivo
function parseUserAgent(userAgent: string) {
  const ua = userAgent.toLowerCase();
  
  // Detectar browser
  let browser = 'Unknown';
  if (ua.includes('chrome')) browser = 'Chrome';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('safari')) browser = 'Safari';
  else if (ua.includes('edge')) browser = 'Edge';
  
  // Detectar OS
  let os = 'Unknown';
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('ios')) os = 'iOS';
  
  // Detectar tipo de dispositivo
  let deviceType = 'desktop';
  if (ua.includes('mobile')) deviceType = 'mobile';
  else if (ua.includes('tablet')) deviceType = 'tablet';
  
  return { browser, os, deviceType };
}

// Función para obtener IP del cliente
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

// GET - Obtener sesiones activas del usuario
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

    // Obtener sesiones activas del usuario
    const { data: sessions, error } = await supabaseAdmin
      .from('user_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('last_activity', { ascending: false });

    if (error) {
      console.error('Error al obtener sesiones:', error);
      return NextResponse.json(
        { error: 'Error al obtener sesiones' },
        { status: 500 }
      );
    }

    // Marcar la sesión actual
    const currentIP = getClientIP(request);
    const currentUserAgent = request.headers.get('user-agent') || '';
    
    const sessionsWithCurrent = sessions?.map(session => ({
      ...session,
      is_current: session.ip_address === currentIP && 
                  session.user_agent === currentUserAgent
    })) || [];

    return NextResponse.json({
      success: true,
      sessions: sessionsWithCurrent,
      total: sessions?.length || 0,
    });
  } catch (error) {
    console.error('Error en GET /api/user/sessions:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Registrar nueva sesión
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

    // Obtener información del dispositivo
    const userAgent = request.headers.get('user-agent') || '';
    const clientIP = getClientIP(request);
    const { browser, os, deviceType } = parseUserAgent(userAgent);

    // Verificar si ya existe una sesión para este dispositivo
    const { data: existingSession } = await supabaseAdmin
      .from('user_sessions')
      .select('id')
      .eq('user_id', user.id)
      .eq('ip_address', clientIP)
      .eq('user_agent', userAgent)
      .single();

    if (existingSession) {
      // Actualizar última actividad
      const { data: updatedSession, error } = await supabaseAdmin
        .from('user_sessions')
        .update({
          last_activity: new Date().toISOString(),
        })
        .eq('id', existingSession.id)
        .select()
        .single();

      if (error) {
        console.error('Error al actualizar sesión:', error);
        return NextResponse.json(
          { error: 'Error al actualizar sesión' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        session: updatedSession,
        message: 'Sesión actualizada',
      });
    }

    // Crear nueva sesión
    const sessionData: Omit<UserSession, 'id' | 'created_at' | 'is_current'> = {
      user_id: user.id,
      device_type: deviceType,
      device_name: `${os} ${browser}`,
      browser,
      os,
      ip_address: clientIP,
      user_agent: userAgent,
      last_activity: new Date().toISOString(),
    };

    const { data: newSession, error } = await supabaseAdmin
      .from('user_sessions')
      .insert(sessionData)
      .select()
      .single();

    if (error) {
      console.error('Error al crear sesión:', error);
      return NextResponse.json(
        { error: 'Error al crear sesión' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      session: newSession,
      message: 'Sesión creada exitosamente',
    });
  } catch (error) {
    console.error('Error en POST /api/user/sessions:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Cerrar todas las sesiones excepto la actual
export async function DELETE(request: NextRequest) {
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

    // Obtener información de la sesión actual
    const currentIP = getClientIP(request);
    const currentUserAgent = request.headers.get('user-agent') || '';

    // Eliminar todas las sesiones excepto la actual
    const { error } = await supabaseAdmin
      .from('user_sessions')
      .delete()
      .eq('user_id', user.id)
      .neq('ip_address', currentIP)
      .neq('user_agent', currentUserAgent);

    if (error) {
      console.error('Error al cerrar sesiones:', error);
      return NextResponse.json(
        { error: 'Error al cerrar sesiones' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Todas las sesiones remotas han sido cerradas',
    });
  } catch (error) {
    console.error('Error en DELETE /api/user/sessions:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}









