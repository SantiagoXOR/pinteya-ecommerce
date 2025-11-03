import { NextRequest, NextResponse } from 'next/server'
import { createClient as createBrowserClient } from '@supabase/supabase-js'

interface ParticipateRequest {
  phoneNumber: string
  metadata?: {
    deviceType?: string
    screenResolution?: string
    browserLanguage?: string
    timezone?: string
    referrer?: string
    utmSource?: string | null
    utmMedium?: string | null
    utmCampaign?: string | null
  }
}

interface ParticipateResponse {
  success: boolean
  alreadyParticipated?: boolean
  message: string
  participantId?: string
  participatedAt?: string
}

export async function POST(request: NextRequest): Promise<NextResponse<ParticipateResponse>> {
  try {
    console.log('[FLASH_DAYS] POST /participate - Inicio')
    
    const body: ParticipateRequest = await request.json()
    const { phoneNumber, metadata } = body

    console.log('[FLASH_DAYS] Phone recibido:', phoneNumber)

    // ===================================
    // 1. VALIDACIÓN DEL NÚMERO
    // ===================================
    const cleanPhone = phoneNumber.replace(/\D/g, '')

    if (cleanPhone.length < 8 || cleanPhone.length > 10) {
      console.log('[FLASH_DAYS] Validación fallida - largo:', cleanPhone.length)
      return NextResponse.json(
        {
          success: false,
          message: 'Número inválido. Debe tener entre 8 y 10 dígitos.',
        },
        { status: 400 }
      )
    }

    // Normalizar a formato argentino internacional (549 + área + número)
    const normalizedPhone = `549${cleanPhone}`
    console.log('[FLASH_DAYS] Phone normalizado:', normalizedPhone)

    // ===================================
    // 2. CAPTURAR METADATA DEL SERVIDOR
    // ===================================
    const forwardedFor = request.headers.get('x-forwarded-for')
    const ipAddress =
      forwardedFor?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown'

    const userAgent = request.headers.get('user-agent') || 'unknown'

    console.log('[FLASH_DAYS] Metadata:', { ip: ipAddress, deviceType: metadata?.deviceType })

    // ===================================
    // 3. CONECTAR A SUPABASE (Cliente público - no requiere auth)
    // ===================================
    console.log('[FLASH_DAYS] Conectando a Supabase...')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[FLASH_DAYS] ERROR: Variables de entorno faltantes')
      return NextResponse.json(
        {
          success: false,
          message: 'Error de configuración. Contactá al administrador.',
        },
        { status: 500 }
      )
    }
    
    // Crear cliente público (permite operaciones anónimas según RLS policies)
    const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)
    
    console.log('[FLASH_DAYS] Cliente Supabase creado OK')

    // ===================================
    // 4. VERIFICAR SI YA PARTICIPÓ
    // ===================================
    console.log('[FLASH_DAYS] Verificando duplicados...')
    const { data: existing, error: checkError } = await supabase
      .from('flash_days_participants')
      .select('id, participated_at, phone_number')
      .eq('phone_normalized', normalizedPhone)
      .maybeSingle() // Usar maybeSingle en lugar de single para evitar error si no existe

    if (checkError) {
      console.error('[FLASH_DAYS] Error verificando duplicados:', checkError)
    }

    if (existing) {
      // Ya participó antes
      console.log('[FLASH_DAYS] Participante duplicado encontrado:', existing.id)
      return NextResponse.json({
        success: true,
        alreadyParticipated: true,
        message: '¡Ya estás participando! Te contactaremos por WhatsApp cuando tengamos los ganadores.',
        participantId: existing.id,
        participatedAt: existing.participated_at,
      })
    }

    console.log('[FLASH_DAYS] No hay duplicados, procediendo a guardar...')

    // ===================================
    // 5. GUARDAR NUEVO PARTICIPANTE
    // ===================================
    console.log('[FLASH_DAYS] Preparando INSERT...')
    
    const insertData = {
      phone_number: phoneNumber,
      phone_normalized: normalizedPhone,
      ip_address: ipAddress,
      user_agent: userAgent,
      referrer: metadata?.referrer || null,
      device_type: metadata?.deviceType || 'unknown',
      browser_language: metadata?.browserLanguage || null,
      screen_resolution: metadata?.screenResolution || null,
      timezone: metadata?.timezone || null,
      utm_source: metadata?.utmSource || null,
      utm_medium: metadata?.utmMedium || null,
      utm_campaign: metadata?.utmCampaign || null,
      status: 'pending' as const,
      already_participated: false,
      whatsapp_opened: false,
    }
    
    console.log('[FLASH_DAYS] Datos a insertar:', JSON.stringify(insertData, null, 2))
    
    const { data: participant, error: insertError } = await supabase
      .from('flash_days_participants')
      .insert(insertData)
      .select()
      .single()

    if (insertError) {
      console.error('[FLASH_DAYS] Error saving participant:', JSON.stringify(insertError, null, 2))
      console.error('[FLASH_DAYS] Error code:', insertError.code)
      console.error('[FLASH_DAYS] Error message:', insertError.message)
      console.error('[FLASH_DAYS] Error details:', insertError.details)
      console.error('[FLASH_DAYS] Error hint:', insertError.hint)

      // Si es error de duplicado
      if (insertError.code === '23505') {
        return NextResponse.json({
          success: true,
          alreadyParticipated: true,
          message: '¡Ya estás participando! Te contactaremos por WhatsApp.',
        })
      }

      return NextResponse.json(
        {
          success: false,
          message: 'Error al registrar participación. Intentá de nuevo.',
        },
        { status: 500 }
      )
    }

    // ===================================
    // 6. ÉXITO
    // ===================================
    console.log('[FLASH_DAYS] Participante registrado:', {
      id: participant.id,
      phone: phoneNumber,
      deviceType: metadata?.deviceType,
      ip: ipAddress,
    })

    return NextResponse.json({
      success: true,
      alreadyParticipated: false,
      message: '¡Participación registrada! Abrimos WhatsApp para confirmar tu interés.',
      participantId: participant.id,
      participatedAt: participant.participated_at,
    })
  } catch (error) {
    console.error('[FLASH_DAYS] CATCH - Error in participate endpoint:', error)
    console.error('[FLASH_DAYS] CATCH - Error stack:', error instanceof Error ? error.stack : 'No stack')
    console.error('[FLASH_DAYS] CATCH - Error message:', error instanceof Error ? error.message : String(error))
    
    return NextResponse.json(
      {
        success: false,
        message: 'Error interno del servidor.',
      },
      { status: 500 }
    )
  }
}

// ===================================
// ENDPOINT PARA MARCAR WHATSAPP ABIERTO
// ===================================
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const { participantId } = await request.json()

    const supabase = await createClient()

    const { error } = await supabase
      .from('flash_days_participants')
      .update({
        whatsapp_opened: true,
        whatsapp_opened_at: new Date().toISOString(),
      })
      .eq('id', participantId)

    if (error) {
      console.error('[FLASH_DAYS] Error updating whatsapp_opened:', error)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[FLASH_DAYS] Error in PATCH:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}

