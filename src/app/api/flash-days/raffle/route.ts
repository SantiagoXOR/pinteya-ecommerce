import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RaffleResponse {
  success: boolean
  winners?: Array<{
    id: string
    phone_number: string
    participated_at: string
  }>
  message: string
}

// POST - Realizar sorteo (solo admin)
export async function POST(request: NextRequest): Promise<NextResponse<RaffleResponse>> {
  try {
    const supabase = await createClient()

    // Verificar si el usuario es admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'No autorizado' },
        { status: 401 }
      )
    }

    // Verificar rol de admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role_id, user_roles(role_name)')
      .eq('id', user.id)
      .single()

    const roleData = profile?.user_roles as any
    const isAdmin =
      roleData?.role_name === 'admin' ||
      roleData?.role_name === 'moderator'

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Acceso denegado' },
        { status: 403 }
      )
    }

    // ===================================
    // 1. VERIFICAR SI YA HAY GANADORES
    // ===================================
    const { data: existingWinners, error: checkError } = await supabase
      .from('flash_days_participants')
      .select('id, phone_number')
      .eq('status', 'winner')

    if (existingWinners && existingWinners.length > 0) {
      return NextResponse.json({
        success: false,
        message: `Ya hay ${existingWinners.length} ganador(es) seleccionado(s). Eliminá los ganadores actuales para sortear de nuevo.`,
      })
    }

    // ===================================
    // 2. OBTENER PARTICIPANTES ELEGIBLES
    // ===================================
    const { data: eligibleParticipants, error: fetchError } = await supabase
      .from('flash_days_participants')
      .select('id, phone_number, participated_at, device_type')
      .eq('status', 'pending')
      .order('participated_at', { ascending: true })

    if (fetchError || !eligibleParticipants) {
      console.error('[FLASH_DAYS] Error fetching participants:', fetchError)
      return NextResponse.json(
        {
          success: false,
          message: 'Error al obtener participantes',
        },
        { status: 500 }
      )
    }

    if (eligibleParticipants.length < 3) {
      return NextResponse.json({
        success: false,
        message: `Solo hay ${eligibleParticipants.length} participante(s). Se necesitan al menos 3 para el sorteo.`,
      })
    }

    // ===================================
    // 3. SORTEO ALEATORIO - SELECCIONAR 3 GANADORES
    // ===================================
    const shuffled = [...eligibleParticipants].sort(() => Math.random() - 0.5)
    const selectedWinners = shuffled.slice(0, 3)

    // ===================================
    // 4. MARCAR GANADORES EN LA BASE DE DATOS
    // ===================================
    const winnerIds = selectedWinners.map(w => w.id)
    const now = new Date().toISOString()

    const { data: winners, error: updateError } = await supabase
      .from('flash_days_participants')
      .update({
        status: 'winner',
        winner_selected_at: now,
        updated_at: now,
      })
      .in('id', winnerIds)
      .select('id, phone_number, participated_at, device_type')

    if (updateError) {
      console.error('[FLASH_DAYS] Error updating winners:', updateError)
      return NextResponse.json(
        {
          success: false,
          message: 'Error al marcar ganadores',
        },
        { status: 500 }
      )
    }

    // ===================================
    // 5. LOG Y RETORNO
    // ===================================
    console.log('[FLASH_DAYS] Sorteo realizado exitosamente:', {
      totalParticipants: eligibleParticipants.length,
      winnersSelected: winners?.length,
      winners: winners?.map(w => ({ id: w.id, phone: w.phone_number })),
    })

    return NextResponse.json({
      success: true,
      winners: winners || [],
      message: `¡Sorteo realizado! Se seleccionaron 3 ganadores de ${eligibleParticipants.length} participantes.`,
    })
  } catch (error) {
    console.error('[FLASH_DAYS] Error in raffle endpoint:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Error interno del servidor',
      },
      { status: 500 }
    )
  }
}

// DELETE - Resetear ganadores (solo admin)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verificar admin (mismo código que arriba)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role_id, user_roles(role_name)')
      .eq('id', user.id)
      .single()

    const roleDataDelete = profile?.user_roles as any
    const isAdmin =
      roleDataDelete?.role_name === 'admin' ||
      roleDataDelete?.role_name === 'moderator'

    if (!isAdmin) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    // Resetear ganadores a pending
    const { error } = await supabase
      .from('flash_days_participants')
      .update({
        status: 'pending',
        winner_selected_at: null,
      })
      .eq('status', 'winner')

    if (error) {
      return NextResponse.json({ error: 'Error al resetear ganadores' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Ganadores reseteados. Podés sortear de nuevo.',
    })
  } catch (error) {
    console.error('[FLASH_DAYS] Error in DELETE:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

