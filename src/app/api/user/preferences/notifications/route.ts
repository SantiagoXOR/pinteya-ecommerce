// Configuración para Node.js Runtime
export const runtime = 'nodejs';

// ===================================
// PINTEYA E-COMMERCE - API DE PREFERENCIAS DE NOTIFICACIONES
// ===================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { supabaseAdmin } from '@/lib/integrations/supabase';
import { logPreferenceActivity, getRequestInfo } from '@/lib/activity/activityLogger';

// PATCH - Actualizar preferencias de notificaciones
export async function PATCH(request: NextRequest) {
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
    const { notifications } = body;

    if (!notifications) {
      return NextResponse.json(
        { error: 'Configuración de notificaciones requerida' },
        { status: 400 }
      );
    }

    // Obtener preferencias actuales
    const { data: currentPrefs, error: fetchError } = await supabaseAdmin
      .from('user_preferences')
      .select('preferences')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error al obtener preferencias actuales:', fetchError);
      return NextResponse.json(
        { error: 'Error al obtener preferencias actuales' },
        { status: 500 }
      );
    }

    // Combinar con preferencias existentes
    const existingPrefs = currentPrefs?.preferences || {};
    const updatedPreferences = {
      ...existingPrefs,
      notifications: {
        ...existingPrefs.notifications,
        ...notifications,
      },
    };

    // Actualizar en la base de datos
    const { data: updatedPrefs, error } = await supabaseAdmin
      .from('user_preferences')
      .upsert({
        user_id: userId,
        preferences: updatedPreferences,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error al actualizar preferencias de notificaciones:', error);
      return NextResponse.json(
        { error: 'Error al actualizar preferencias de notificaciones' },
        { status: 500 }
      );
    }

    // Registrar actividad
    const requestInfo = getRequestInfo(request);
    await logPreferenceActivity(
      userId,
      'update_notifications',
      {
        updated_settings: Object.keys(notifications),
        email_notifications: notifications.emailNotifications,
        push_notifications: notifications.pushNotifications,
        security_alerts: notifications.securityAlerts,
      },
      requestInfo
    );

    return NextResponse.json({
      success: true,
      notifications: updatedPrefs.preferences.notifications,
      message: 'Preferencias de notificaciones actualizadas correctamente',
    });
  } catch (error) {
    console.error('Error en PATCH /api/user/preferences/notifications:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}










