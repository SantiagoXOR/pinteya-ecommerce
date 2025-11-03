import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
    const body: ParticipateRequest = await request.json()
    const { phoneNumber, metadata } = body

    // ===================================
    // 1. VALIDACIÓN DEL NÚMERO
    // ===================================
    const cleanPhone = phoneNumber.replace(/\D/g, '')

    if (cleanPhone.length < 8 || cleanPhone.length > 10) {
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

    // ===================================
    // 2. CAPTURAR METADATA DEL SERVIDOR
    // ===================================
    const forwardedFor = request.headers.get('x-forwarded-for')
    const ipAddress =
      forwardedFor?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown'

    const userAgent = request.headers.get('user-agent') || 'unknown'

    // ===================================
    // 3. CONECTAR A SUPABASE
    // ===================================
    const supabase = await createClient()

    // ===================================
    // 4. VERIFICAR SI YA PARTICIPÓ
    // ===================================
    const { data: existing, error: checkError } = await supabase
      .from('flash_days_participants')
      .select('id, participated_at, phone_number')
      .eq('phone_normalized', normalizedPhone)
      .single()

    if (existing) {
      // Ya participó antes
      return NextResponse.json({
        success: true,
        alreadyParticipated: true,
        message: '¡Ya estás participando! Te contactaremos por WhatsApp cuando tengamos los ganadores.',
        participantId: existing.id,
        participatedAt: existing.participated_at,
      })
    }

    // ===================================
    // 5. GUARDAR NUEVO PARTICIPANTE
    // ===================================
    const { data: participant, error: insertError } = await supabase
      .from('flash_days_participants')
      .insert({
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
        status: 'pending',
        already_participated: false,
        whatsapp_opened: false,
      })
      .select()
      .single()

    if (insertError) {
      console.error('[FLASH_DAYS] Error saving participant:', insertError)

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
    console.error('[FLASH_DAYS] Error in participate endpoint:', error)
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

