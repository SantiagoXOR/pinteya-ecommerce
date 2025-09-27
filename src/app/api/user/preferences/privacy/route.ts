// Configuración para Node.js Runtime
export const runtime = 'nodejs'

// ===================================
// PINTEYA E-COMMERCE - API DE PREFERENCIAS DE PRIVACIDAD
// ===================================

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { supabaseAdmin } from '@/lib/integrations/supabase'
import { logPreferenceActivity, getRequestInfo } from '@/lib/activity/activityLogger'

// PATCH - Actualizar preferencias de privacidad
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userId = session.user.id
    const body = await request.json()
    const { privacy } = body

    if (!privacy) {
      return NextResponse.json({ error: 'Configuración de privacidad requerida' }, { status: 400 })
    }

    // Validar configuraciones de privacidad
    const validatedPrivacy = validatePrivacySettings(privacy)
    if (!validatedPrivacy) {
      return NextResponse.json({ error: 'Configuración de privacidad inválida' }, { status: 400 })
    }

    // Obtener preferencias actuales
    const { data: currentPrefs, error: fetchError } = await supabaseAdmin
      .from('user_preferences')
      .select('preferences')
      .eq('user_id', userId)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error al obtener preferencias actuales:', fetchError)
      return NextResponse.json({ error: 'Error al obtener preferencias actuales' }, { status: 500 })
    }

    // Combinar con preferencias existentes
    const existingPrefs = currentPrefs?.preferences || {}
    const updatedPreferences = {
      ...existingPrefs,
      privacy: {
        ...existingPrefs.privacy,
        ...validatedPrivacy,
      },
    }

    // Actualizar en la base de datos
    const { data: updatedPrefs, error } = await supabaseAdmin
      .from('user_preferences')
      .upsert({
        user_id: userId,
        preferences: updatedPreferences,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error al actualizar preferencias de privacidad:', error)
      return NextResponse.json(
        { error: 'Error al actualizar preferencias de privacidad' },
        { status: 500 }
      )
    }

    // Registrar actividad de seguridad para cambios importantes
    const requestInfo = getRequestInfo(request)
    await logPreferenceActivity(
      userId,
      'update_privacy',
      {
        updated_settings: Object.keys(validatedPrivacy),
        profile_visibility: validatedPrivacy.profileVisibility,
        activity_tracking: validatedPrivacy.activityTracking,
        marketing_consent: validatedPrivacy.marketingConsent,
        data_collection: validatedPrivacy.dataCollection,
        third_party_sharing: validatedPrivacy.thirdPartySharing,
        analytics_opt_out: validatedPrivacy.analyticsOptOut,
      },
      requestInfo
    )

    return NextResponse.json({
      success: true,
      privacy: updatedPrefs.preferences.privacy,
      message: 'Preferencias de privacidad actualizadas correctamente',
    })
  } catch (error) {
    console.error('Error en PATCH /api/user/preferences/privacy:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// Función para validar configuraciones de privacidad
function validatePrivacySettings(privacy: any): any | null {
  try {
    const validated: any = {}

    // Validar visibilidad del perfil
    if (privacy.profileVisibility !== undefined) {
      const supportedVisibility = ['public', 'private']
      if (supportedVisibility.includes(privacy.profileVisibility)) {
        validated.profileVisibility = privacy.profileVisibility
      }
    }

    // Validar configuraciones booleanas
    const booleanSettings = [
      'activityTracking',
      'marketingConsent',
      'dataCollection',
      'thirdPartySharing',
      'analyticsOptOut',
    ]

    booleanSettings.forEach(setting => {
      if (typeof privacy[setting] === 'boolean') {
        validated[setting] = privacy[setting]
      }
    })

    return Object.keys(validated).length > 0 ? validated : null
  } catch (error) {
    console.error('Error al validar configuraciones de privacidad:', error)
    return null
  }
}
