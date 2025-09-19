// ===================================
// PINTEYA E-COMMERCE - API DE DISPOSITIVOS DE CONFIANZA
// ===================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/integrations/supabase';
import { logSecurityActivity, getRequestInfo } from '@/lib/activity/activityLogger';

// GET - Obtener dispositivos de confianza del usuario
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Obtener dispositivos de confianza
    const { data: trustedDevices, error } = await supabaseAdmin
      .from('user_sessions')
      .select(`
        id,
        device_type,
        device_name,
        browser,
        os,
        ip_address,
        location,
        is_trusted,
        last_activity,
        created_at
      `)
      .eq('user_id', userId)
      .eq('is_trusted', true)
      .order('last_activity', { ascending: false });

    if (error) {
      console.error('Error al obtener dispositivos de confianza:', error);
      return NextResponse.json(
        { error: 'Error al obtener dispositivos de confianza' },
        { status: 500 }
      );
    }

    // Calcular nivel de confianza para cada dispositivo
    const devicesWithTrustLevel = trustedDevices?.map(device => ({
      ...device,
      trust_level: calculateTrustLevel(device),
    })) || [];

    return NextResponse.json({
      success: true,
      devices: devicesWithTrustLevel,
      total: devicesWithTrustLevel.length,
    });
  } catch (error) {
    console.error('Error en GET /api/user/trusted-devices:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Marcar dispositivo actual como confiable
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();
    const { session_id, device_name } = body;

    if (!session_id) {
      return NextResponse.json(
        { error: 'ID de sesión requerido' },
        { status: 400 }
      );
    }

    // Marcar sesión como confiable
    const { data: updatedSession, error } = await supabaseAdmin
      .from('user_sessions')
      .update({
        is_trusted: true,
        device_name: device_name || 'Dispositivo de confianza',
      })
      .eq('id', session_id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error al marcar dispositivo como confiable:', error);
      return NextResponse.json(
        { error: 'Error al marcar dispositivo como confiable' },
        { status: 500 }
      );
    }

    // Registrar actividad de seguridad
    const requestInfo = getRequestInfo(request);
    await logSecurityActivity(
      userId,
      'trust_device',
      {
        session_id,
        device_name: updatedSession.device_name,
        device_type: updatedSession.device_type,
        ip_address: updatedSession.ip_address,
      },
      requestInfo
    );

    return NextResponse.json({
      success: true,
      device: {
        ...updatedSession,
        trust_level: calculateTrustLevel(updatedSession),
      },
      message: 'Dispositivo marcado como confiable',
    });
  } catch (error) {
    console.error('Error en POST /api/user/trusted-devices:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Función para calcular nivel de confianza
function calculateTrustLevel(device: any): number {
  let trustLevel = 50; // Base

  // Factores que aumentan la confianza
  const now = new Date();
  const lastActivity = new Date(device.last_activity);
  const createdAt = new Date(device.created_at);
  
  // Antigüedad del dispositivo (máximo +30 puntos)
  const ageInDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
  if (ageInDays > 30) trustLevel += 30;
  else if (ageInDays > 7) trustLevel += 20;
  else if (ageInDays > 1) trustLevel += 10;

  // Actividad reciente (máximo +20 puntos)
  const inactiveHours = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60));
  if (inactiveHours < 1) trustLevel += 20;
  else if (inactiveHours < 24) trustLevel += 15;
  else if (inactiveHours < 168) trustLevel += 10; // 1 semana
  else if (inactiveHours < 720) trustLevel += 5; // 1 mes

  // Tipo de dispositivo
  if (device.device_type === 'desktop') trustLevel += 5;
  else if (device.device_type === 'mobile') trustLevel += 3;

  // Ubicación conocida (si está disponible)
  if (device.location) trustLevel += 5;

  // Asegurar que esté en el rango 0-100
  return Math.min(100, Math.max(0, trustLevel));
}









