// Configuración para Node.js Runtime
export const runtime = 'nodejs';

// ===================================
// PINTEYA E-COMMERCE - API DE PREFERENCIAS DE USUARIO
// ===================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { supabaseAdmin } from '@/lib/integrations/supabase';
import { logPreferenceActivity, getRequestInfo } from '@/lib/activity/activityLogger';

// Tipos para las preferencias
interface UserPreferences {
  notifications: {
    emailNotifications: boolean;
    orderUpdates: boolean;
    promotions: boolean;
    securityAlerts: boolean;
    marketingEmails: boolean;
    pushNotifications: boolean;
    smsNotifications: boolean;
  };
  display: {
    language: string;
    timezone: string;
    currency: string;
    theme: string;
  };
  privacy: {
    profileVisibility: 'public' | 'private';
    activityTracking: boolean;
    marketingConsent: boolean;
    dataCollection: boolean;
    thirdPartySharing: boolean;
    analyticsOptOut: boolean;
  };
}

// Preferencias por defecto
const defaultPreferences: UserPreferences = {
  notifications: {
    emailNotifications: true,
    orderUpdates: true,
    promotions: false,
    securityAlerts: true,
    marketingEmails: false,
    pushNotifications: true,
    smsNotifications: false,
  },
  display: {
    language: 'es',
    timezone: 'America/Argentina/Buenos_Aires',
    currency: 'ARS',
    theme: 'system',
  },
  privacy: {
    profileVisibility: 'private',
    activityTracking: true,
    marketingConsent: false,
    dataCollection: true,
    thirdPartySharing: false,
    analyticsOptOut: false,
  },
};

// GET - Obtener preferencias del usuario
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

    // Obtener preferencias de la base de datos
    const { data: userPrefs, error } = await supabaseAdmin
      .from('user_preferences')
      .select('preferences')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error al obtener preferencias:', error);
      return NextResponse.json(
        { error: 'Error al obtener preferencias' },
        { status: 500 }
      );
    }

    // Si no hay preferencias guardadas, devolver las por defecto
    const preferences = userPrefs?.preferences || defaultPreferences;

    return NextResponse.json({
      success: true,
      preferences,
    });
  } catch (error) {
    console.error('Error en GET /api/user/preferences:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar preferencias completas
export async function PUT(request: NextRequest) {
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
    const { preferences } = body;

    if (!preferences) {
      return NextResponse.json(
        { error: 'Preferencias requeridas' },
        { status: 400 }
      );
    }

    // Validar estructura de preferencias
    const validatedPreferences = validatePreferences(preferences);
    if (!validatedPreferences) {
      return NextResponse.json(
        { error: 'Formato de preferencias inválido' },
        { status: 400 }
      );
    }

    // Upsert preferencias en la base de datos
    const { data: updatedPrefs, error } = await supabaseAdmin
      .from('user_preferences')
      .upsert({
        user_id: userId,
        preferences: validatedPreferences,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error al actualizar preferencias:', error);
      return NextResponse.json(
        { error: 'Error al actualizar preferencias' },
        { status: 500 }
      );
    }

    // Registrar actividad
    const requestInfo = getRequestInfo(request);
    await logPreferenceActivity(
      userId,
      'update_preferences',
      {
        sections_updated: Object.keys(preferences),
        total_preferences: Object.keys(validatedPreferences).length,
      },
      requestInfo
    );

    return NextResponse.json({
      success: true,
      preferences: updatedPrefs.preferences,
      message: 'Preferencias actualizadas correctamente',
    });
  } catch (error) {
    console.error('Error en PUT /api/user/preferences:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Resetear a preferencias por defecto
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Resetear a preferencias por defecto
    const { data: resetPrefs, error } = await supabaseAdmin
      .from('user_preferences')
      .upsert({
        user_id: userId,
        preferences: defaultPreferences,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error al resetear preferencias:', error);
      return NextResponse.json(
        { error: 'Error al resetear preferencias' },
        { status: 500 }
      );
    }

    // Registrar actividad
    const requestInfo = getRequestInfo(request);
    await logPreferenceActivity(
      userId,
      'reset_preferences',
      {
        reset_to_defaults: true,
        previous_preferences_count: Object.keys(defaultPreferences).length,
      },
      requestInfo
    );

    return NextResponse.json({
      success: true,
      preferences: resetPrefs.preferences,
      message: 'Preferencias reseteadas a valores por defecto',
    });
  } catch (error) {
    console.error('Error en DELETE /api/user/preferences:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Función para validar preferencias
function validatePreferences(preferences: any): UserPreferences | null {
  try {
    // Validar estructura básica
    if (!preferences || typeof preferences !== 'object') {
      return null;
    }

    // Combinar con valores por defecto para asegurar completitud
    const validated: UserPreferences = {
      notifications: {
        ...defaultPreferences.notifications,
        ...preferences.notifications,
      },
      display: {
        ...defaultPreferences.display,
        ...preferences.display,
      },
      privacy: {
        ...defaultPreferences.privacy,
        ...preferences.privacy,
      },
    };

    // Validaciones específicas
    if (preferences.display?.language) {
      const supportedLanguages = ['es', 'en', 'pt'];
      if (!supportedLanguages.includes(preferences.display.language)) {
        validated.display.language = 'es';
      }
    }

    if (preferences.display?.currency) {
      const supportedCurrencies = ['ARS', 'USD', 'EUR', 'BRL', 'CLP', 'COP', 'MXN', 'PEN'];
      if (!supportedCurrencies.includes(preferences.display.currency)) {
        validated.display.currency = 'ARS';
      }
    }

    if (preferences.display?.theme) {
      const supportedThemes = ['light', 'dark', 'system'];
      if (!supportedThemes.includes(preferences.display.theme)) {
        validated.display.theme = 'system';
      }
    }

    if (preferences.privacy?.profileVisibility) {
      const supportedVisibility = ['public', 'private'];
      if (!supportedVisibility.includes(preferences.privacy.profileVisibility)) {
        validated.privacy.profileVisibility = 'private';
      }
    }

    return validated;
  } catch (error) {
    console.error('Error al validar preferencias:', error);
    return null;
  }
}










