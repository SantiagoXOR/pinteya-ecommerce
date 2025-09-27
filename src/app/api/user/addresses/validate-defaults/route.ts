// Configuración para Node.js Runtime
export const runtime = 'nodejs'

// ===================================
// PINTEYA E-COMMERCE - VALIDACIÓN DE DIRECCIONES PREDETERMINADAS
// ===================================

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/integrations/supabase'
import { auth } from '@/lib/auth/config'

/**
 * POST - Validar y corregir direcciones predeterminadas duplicadas
 * Este endpoint puede ser llamado para limpiar cualquier inconsistencia
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔧 POST /api/user/addresses/validate-defaults - Iniciando validación')

    // Autenticación
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Obtener usuario
    const { data: user } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('id', session.user.id)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    console.log('🔍 Validando direcciones predeterminadas para usuario:', user.id)

    // Obtener todas las direcciones del usuario
    const { data: allAddresses } = await supabaseAdmin
      .from('user_addresses')
      .select('id, name, is_default, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!allAddresses || allAddresses.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay direcciones para validar',
        data: {
          totalAddresses: 0,
          defaultAddresses: 0,
          correctionsMade: 0,
        },
      })
    }

    // Filtrar direcciones predeterminadas
    const defaultAddresses = allAddresses.filter(addr => addr.is_default)
    const defaultCount = defaultAddresses.length

    console.log(`🔍 Total direcciones: ${allAddresses.length}`)
    console.log(`🔍 Direcciones predeterminadas: ${defaultCount}`)

    let correctionsMade = 0
    let actions: string[] = []

    if (defaultCount === 0) {
      // No hay direcciones predeterminadas, marcar la más reciente
      const mostRecentAddress = allAddresses[0]

      console.log(
        '🔄 No hay direcciones predeterminadas, marcando la más reciente:',
        mostRecentAddress.id
      )

      await supabaseAdmin
        .from('user_addresses')
        .update({ is_default: true })
        .eq('id', mostRecentAddress.id)

      correctionsMade = 1
      actions.push(`Marcada dirección "${mostRecentAddress.name}" como predeterminada`)
    } else if (defaultCount > 1) {
      // Hay múltiples direcciones predeterminadas, mantener solo la más reciente
      const keepDefault = defaultAddresses[0] // Ya están ordenadas por created_at desc
      const toUpdate = defaultAddresses.slice(1)

      console.log(`🔄 Múltiples direcciones predeterminadas encontradas (${defaultCount})`)
      console.log('🔄 Manteniendo como predeterminada:', keepDefault.id, keepDefault.name)
      console.log(
        '🔄 Desmarcando:',
        toUpdate.map(addr => `${addr.id} (${addr.name})`)
      )

      // Desmarcar las direcciones duplicadas
      const idsToUpdate = toUpdate.map(addr => addr.id)
      await supabaseAdmin.from('user_addresses').update({ is_default: false }).in('id', idsToUpdate)

      correctionsMade = toUpdate.length
      actions.push(`Mantenida "${keepDefault.name}" como predeterminada`)
      toUpdate.forEach(addr => {
        actions.push(`Desmarcada "${addr.name}" como predeterminada`)
      })
    } else {
      console.log('✅ Configuración correcta: exactamente una dirección predeterminada')
      actions.push('Configuración correcta: exactamente una dirección predeterminada')
    }

    // Verificación final
    const { data: finalCheck } = await supabaseAdmin
      .from('user_addresses')
      .select('id, name, is_default')
      .eq('user_id', user.id)
      .eq('is_default', true)

    const finalDefaultCount = finalCheck?.length || 0

    console.log(
      `✅ Validación completada. Direcciones predeterminadas finales: ${finalDefaultCount}`
    )

    return NextResponse.json({
      success: true,
      message: 'Validación de direcciones predeterminadas completada',
      data: {
        totalAddresses: allAddresses.length,
        defaultAddressesBefore: defaultCount,
        defaultAddressesAfter: finalDefaultCount,
        correctionsMade,
        actions,
        currentDefaultAddress: finalCheck?.[0] || null,
      },
    })
  } catch (error) {
    console.error('❌ Error en POST /api/user/addresses/validate-defaults:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

/**
 * GET - Obtener estado actual de direcciones predeterminadas
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/user/addresses/validate-defaults - Consultando estado')

    // Autenticación
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Obtener usuario
    const { data: user } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('id', session.user.id)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Obtener todas las direcciones del usuario
    const { data: allAddresses } = await supabaseAdmin
      .from('user_addresses')
      .select('id, name, is_default, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    const defaultAddresses = allAddresses?.filter(addr => addr.is_default) || []
    const defaultCount = defaultAddresses.length

    let status: 'correct' | 'no_default' | 'multiple_defaults' = 'correct'
    let needsCorrection = false

    if (defaultCount === 0) {
      status = 'no_default'
      needsCorrection = true
    } else if (defaultCount > 1) {
      status = 'multiple_defaults'
      needsCorrection = true
    }

    return NextResponse.json({
      success: true,
      data: {
        totalAddresses: allAddresses?.length || 0,
        defaultAddresses: defaultCount,
        status,
        needsCorrection,
        defaultAddressList: defaultAddresses.map(addr => ({
          id: addr.id,
          name: addr.name,
          created_at: addr.created_at,
        })),
      },
    })
  } catch (error) {
    console.error('❌ Error en GET /api/user/addresses/validate-defaults:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
