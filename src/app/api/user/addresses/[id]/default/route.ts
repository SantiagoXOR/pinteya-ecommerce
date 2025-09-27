// ===================================
// PINTEYA E-COMMERCE - ENDPOINT PARA MARCAR DIRECCIÓN COMO PREDETERMINADA
// ===================================

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/integrations/supabase'
import { auth } from '@/auth'

type RouteContext = {
  params: {
    id: string
  }
}

// ===================================
// FUNCIONES HELPER PARA DIRECCIONES PREDETERMINADAS
// ===================================

/**
 * Asegura que el usuario tenga exactamente una dirección predeterminada
 */
async function ensureOneDefaultAddress(userId: string) {
  try {
    console.log('🔍 Verificando direcciones predeterminadas para usuario:', userId)

    // Obtener todas las direcciones predeterminadas del usuario
    const { data: defaultAddresses } = await supabaseAdmin
      .from('user_addresses')
      .select('id, created_at')
      .eq('user_id', userId)
      .eq('is_default', true)
      .order('created_at', { ascending: false })

    if (!defaultAddresses) {
      console.log('❌ Error al obtener direcciones predeterminadas')
      return
    }

    const defaultCount = defaultAddresses.length
    console.log(`🔍 Encontradas ${defaultCount} direcciones predeterminadas`)

    if (defaultCount === 0) {
      // No hay direcciones predeterminadas, marcar la más reciente
      const { data: allAddresses } = await supabaseAdmin
        .from('user_addresses')
        .select('id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)

      if (allAddresses && allAddresses.length > 0) {
        console.log('🔄 Marcando dirección más reciente como predeterminada:', allAddresses[0].id)
        await supabaseAdmin
          .from('user_addresses')
          .update({ is_default: true })
          .eq('id', allAddresses[0].id)
      }
    } else if (defaultCount > 1) {
      // Hay múltiples direcciones predeterminadas, mantener solo la más reciente
      const keepDefaultId = defaultAddresses[0].id
      const idsToUpdate = defaultAddresses.slice(1).map(addr => addr.id)

      console.log(`🔄 Desmarcando ${idsToUpdate.length} direcciones predeterminadas duplicadas`)
      console.log('🔄 Manteniendo como predeterminada:', keepDefaultId)

      await supabaseAdmin.from('user_addresses').update({ is_default: false }).in('id', idsToUpdate)
    } else {
      console.log('✅ Usuario tiene exactamente una dirección predeterminada')
    }
  } catch (error) {
    console.error('❌ Error en ensureOneDefaultAddress:', error)
  }
}

// ===================================
// POST - Marcar dirección como predeterminada
// ===================================
export async function POST(
  request: NextRequest,
  context: { params: Promise<RouteContext['params']> }
) {
  try {
    console.log('🔄 POST /api/user/addresses/[id]/default - Iniciando')

    // Verificar que el cliente administrativo esté disponible
    if (!supabaseAdmin) {
      console.error('❌ Cliente administrativo de Supabase no disponible')
      return NextResponse.json({ error: 'Error de configuración del servidor' }, { status: 500 })
    }

    // Autenticación
    const session = await auth()
    if (!session?.user?.id) {
      console.log('❌ Usuario no autenticado')
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Obtener parámetros
    const params = await context.params
    const addressId = params.id

    if (!addressId) {
      return NextResponse.json({ error: 'ID de dirección requerido' }, { status: 400 })
    }

    console.log('🔍 POST - Buscando usuario con id:', session.user.id)

    // Obtener usuario
    const { data: user } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('id', session.user.id)
      .single()

    if (!user) {
      console.log('❌ Usuario no encontrado')
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    console.log('🔍 POST - Usuario encontrado:', { id: user.id })

    // Verificar que la dirección existe y pertenece al usuario
    const { data: address, error: addressError } = await supabaseAdmin
      .from('user_addresses')
      .select('id, name, is_default')
      .eq('id', addressId)
      .eq('user_id', user.id)
      .single()

    if (addressError || !address) {
      console.log('❌ Dirección no encontrada o no pertenece al usuario:', addressError)
      return NextResponse.json({ error: 'Dirección no encontrada' }, { status: 404 })
    }

    console.log('🔍 POST - Dirección encontrada:', {
      id: address.id,
      name: address.name,
      is_default: address.is_default,
    })

    // Si ya es predeterminada, no hacer nada
    if (address.is_default) {
      console.log('✅ La dirección ya es predeterminada')
      return NextResponse.json({
        success: true,
        message: 'La dirección ya es predeterminada',
        data: address,
      })
    }

    // Paso 1: Desmarcar todas las direcciones predeterminadas del usuario
    console.log('🔄 POST - Desmarcando todas las direcciones predeterminadas del usuario')
    const { error: unsetError } = await supabaseAdmin
      .from('user_addresses')
      .update({ is_default: false })
      .eq('user_id', user.id)
      .eq('is_default', true)

    if (unsetError) {
      console.error('❌ Error al desmarcar direcciones predeterminadas:', unsetError)
      return NextResponse.json(
        { error: 'Error al actualizar direcciones predeterminadas' },
        { status: 500 }
      )
    }

    // Paso 2: Marcar la dirección seleccionada como predeterminada
    console.log('🔄 POST - Marcando dirección como predeterminada:', addressId)
    const { data: updatedAddress, error: updateError } = await supabaseAdmin
      .from('user_addresses')
      .update({
        is_default: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', addressId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError || !updatedAddress) {
      console.error('❌ Error al marcar dirección como predeterminada:', updateError)
      return NextResponse.json(
        { error: 'Error al actualizar dirección predeterminada' },
        { status: 500 }
      )
    }

    console.log('✅ POST - Dirección marcada como predeterminada exitosamente:', updatedAddress.id)

    // Paso 3: Asegurar que solo haya una dirección predeterminada
    await ensureOneDefaultAddress(user.id)

    return NextResponse.json({
      success: true,
      message: 'Dirección predeterminada actualizada correctamente',
      data: updatedAddress,
    })
  } catch (error) {
    console.error('❌ Error en POST /api/user/addresses/[id]/default:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
