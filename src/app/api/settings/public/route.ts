// Configuración para Node.js Runtime
export const runtime = 'nodejs'

// ===================================
// PINTEYA E-COMMERCE - PUBLIC SETTINGS API
// ===================================
// Endpoint público para obtener configuraciones que pueden mostrarse públicamente
// (email de contacto, teléfono de soporte, etc.)

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/integrations/supabase'
import { ApiResponse } from '@/types/api'

interface PublicSettings {
  contact_email: string
  support_phone: string
  site_name: string
  site_url: string
}

// Valores por defecto
const DEFAULT_PUBLIC_SETTINGS: PublicSettings = {
  contact_email: 'contacto@pinteya.com',
  support_phone: '+54 11 1234-5678',
  site_name: 'Pinteya E-Commerce',
  site_url: process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000',
}

async function getPublicSettings(): Promise<PublicSettings> {
  try {
    if (!supabaseAdmin) {
      return DEFAULT_PUBLIC_SETTINGS
    }

    // Obtener solo las configuraciones públicas necesarias
    const { data: settings, error } = await supabaseAdmin
      .from('system_settings')
      .select('key, value')
      .in('key', [
        'general.contact_email',
        'general.support_phone',
        'general.site_name',
        'general.site_url',
      ])

    if (error || !settings || settings.length === 0) {
      return DEFAULT_PUBLIC_SETTINGS
    }

    // Construir objeto de configuraciones
    const result: PublicSettings = { ...DEFAULT_PUBLIC_SETTINGS }

    settings.forEach((setting: any) => {
      try {
        const parsedValue = typeof setting.value === 'string' 
          ? JSON.parse(setting.value) 
          : setting.value
        
        if (setting.key === 'general.contact_email') {
          result.contact_email = parsedValue
        } else if (setting.key === 'general.support_phone') {
          result.support_phone = parsedValue
        } else if (setting.key === 'general.site_name') {
          result.site_name = parsedValue
        } else if (setting.key === 'general.site_url') {
          result.site_url = parsedValue
        }
      } catch {
        // Si no se puede parsear, usar el valor tal cual
        if (setting.key === 'general.contact_email') {
          result.contact_email = setting.value
        } else if (setting.key === 'general.support_phone') {
          result.support_phone = setting.value
        } else if (setting.key === 'general.site_name') {
          result.site_name = setting.value
        } else if (setting.key === 'general.site_url') {
          result.site_url = setting.value
        }
      }
    })

    return result
  } catch (error) {
    console.error('[getPublicSettings] Error:', error)
    return DEFAULT_PUBLIC_SETTINGS
  }
}

// ===================================
// GET - Obtener configuraciones públicas
// ===================================
export async function GET(request: NextRequest) {
  try {
    const settings = await getPublicSettings()

    const response: ApiResponse<PublicSettings> = {
      data: settings,
      success: true,
      message: 'Configuraciones públicas obtenidas exitosamente',
    }

    return NextResponse.json(response)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    const errorResponse: ApiResponse<null> = {
      data: null,
      success: false,
      error: errorMessage,
    }

    return NextResponse.json(errorResponse, { status: 500 })
  }
}

