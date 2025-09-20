// Configuración para Node.js Runtime
export const runtime = 'nodejs';

// ===================================
// PINTEYA E-COMMERCE - API DE PREFERENCIAS DE DISPLAY
// ===================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { supabaseAdmin } from '@/lib/integrations/supabase';
import { logPreferenceActivity, getRequestInfo } from '@/lib/activity/activityLogger';

// PATCH - Actualizar preferencias de display
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
    const { display } = body;

    if (!display) {
      return NextResponse.json(
        { error: 'Configuración de display requerida' },
        { status: 400 }
      );
    }

    // Validar configuraciones de display
    const validatedDisplay = validateDisplaySettings(display);
    if (!validatedDisplay) {
      return NextResponse.json(
        { error: 'Configuración de display inválida' },
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
      display: {
        ...existingPrefs.display,
        ...validatedDisplay,
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
      console.error('Error al actualizar preferencias de display:', error);
      return NextResponse.json(
        { error: 'Error al actualizar preferencias de display' },
        { status: 500 }
      );
    }

    // Registrar actividad
    const requestInfo = getRequestInfo(request);
    await logPreferenceActivity(
      userId,
      'update_display',
      {
        updated_settings: Object.keys(validatedDisplay),
        language: validatedDisplay.language,
        timezone: validatedDisplay.timezone,
        currency: validatedDisplay.currency,
        theme: validatedDisplay.theme,
      },
      requestInfo
    );

    return NextResponse.json({
      success: true,
      display: updatedPrefs.preferences.display,
      message: 'Preferencias de display actualizadas correctamente',
    });
  } catch (error) {
    console.error('Error en PATCH /api/user/preferences/display:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Función para validar configuraciones de display
function validateDisplaySettings(display: any): any | null {
  try {
    const validated: any = {};

    // Validar idioma
    if (display.language) {
      const supportedLanguages = ['es', 'en', 'pt'];
      if (supportedLanguages.includes(display.language)) {
        validated.language = display.language;
      }
    }

    // Validar zona horaria
    if (display.timezone) {
      try {
        // Verificar que la zona horaria sea válida
        Intl.DateTimeFormat(undefined, { timeZone: display.timezone });
        validated.timezone = display.timezone;
      } catch {
        // Zona horaria inválida, no incluir en la validación
      }
    }

    // Validar moneda
    if (display.currency) {
      const supportedCurrencies = ['ARS', 'USD', 'EUR', 'BRL', 'CLP', 'COP', 'MXN', 'PEN'];
      if (supportedCurrencies.includes(display.currency)) {
        validated.currency = display.currency;
      }
    }

    // Validar tema
    if (display.theme) {
      const supportedThemes = ['light', 'dark', 'system'];
      if (supportedThemes.includes(display.theme)) {
        validated.theme = display.theme;
      }
    }

    return Object.keys(validated).length > 0 ? validated : null;
  } catch (error) {
    console.error('Error al validar configuraciones de display:', error);
    return null;
  }
}










