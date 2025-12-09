// Configuración para Node.js Runtime
export const runtime = 'nodejs'

// ===================================
// PINTEYA E-COMMERCE - API DE DIRECCIONES DE USUARIO
// ===================================

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/integrations/supabase'
import { auth } from '@/lib/auth/config'
import { ApiResponse } from '@/types/api'

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
// GET - Obtener direcciones del usuario
// ===================================
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/user/addresses - Iniciando petición')

    // Verificar que el cliente administrativo esté disponible
    if (!supabaseAdmin) {
      console.error('Cliente administrativo de Supabase no disponible en GET /api/user/addresses')
      return NextResponse.json(
        { error: 'Servicio de base de datos no disponible' },
        { status: 503 }
      )
    }

    // Autenticación con Clerk
    const session = await auth()
    console.log('🔍 Session:', session ? 'Autenticado' : 'No autenticado')

    if (!session?.user) {
      console.log('❌ Usuario no autenticado')
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Usuario no autenticado',
      }
      return NextResponse.json(errorResponse, { status: 401 })
    }

    // Obtener usuario primero
    console.log('🔍 Buscando usuario con id:', session.user.id)
    let { data: user, error: userError } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('id', session.user.id)
      .single()

    console.log('🔍 Usuario encontrado:', user)
    console.log('🔍 Error de usuario:', userError)

    // Si el usuario no existe, crearlo automáticamente
    if (!user && userError?.code === 'PGRST116') {
      console.log('🔄 Usuario no existe, creándolo automáticamente...')

      const { data: newUser, error: createError } = await supabaseAdmin
        .from('user_profiles')
        .insert({
          id: session.user.id,
          email: session.user.email,
          first_name: session.user.name?.split(' ')[0] || null,
          last_name: session.user.name?.split(' ').slice(1).join(' ') || null,
          role_id: null,
          is_active: true,
          metadata: {
            created_via: 'nextauth_auto',
            source: 'address_api',
            created_at: new Date().toISOString(),
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (createError) {
        console.error('❌ Error creando usuario:', createError)
        return NextResponse.json({ error: 'Error creando usuario' }, { status: 500 })
      }

      user = newUser
      console.log('✅ Usuario creado exitosamente:', user)
    } else if (!user) {
      console.log('❌ Usuario no encontrado y error inesperado:', userError)
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Obtener direcciones del usuario
    console.log('🔍 Buscando direcciones para user_id:', user.id)
    const { data: addresses, error } = await supabaseAdmin
      .from('user_addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })

    console.log('🔍 Direcciones encontradas:', addresses)
    console.log('🔍 Error de direcciones:', error)

    if (error) {
      console.error('❌ Error al obtener direcciones:', error)
      return NextResponse.json({ error: 'Error al obtener direcciones' }, { status: 500 })
    }

    console.log('✅ Devolviendo direcciones exitosamente')
    return NextResponse.json({
      success: true,
      data: addresses || [],
    })
  } catch (error) {
    console.error('Error en GET /api/user/addresses:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// ===================================
// POST - Crear nueva dirección
// ===================================
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 POST /api/user/addresses - Iniciando petición')

    // Verificar que el cliente administrativo esté disponible
    if (!supabaseAdmin) {
      console.error('Cliente administrativo de Supabase no disponible en POST /api/user/addresses')
      return NextResponse.json(
        { error: 'Servicio de base de datos no disponible' },
        { status: 503 }
      )
    }

    // Autenticación con Clerk
    const session = await auth()
    console.log('🔍 Session:', session ? 'Autenticado' : 'No autenticado')

    if (!session?.user) {
      console.log('❌ Usuario no autenticado')
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Usuario no autenticado',
      }
      return NextResponse.json(errorResponse, { status: 401 })
    }
    const body = await request.json()
    console.log('Received address data:', body) // Debug

    // Validar datos requeridos
    const {
      name,
      street,
      apartment,
      city,
      postal_code,
      state,
      country,
      phone,
      type,
      is_default: initialIsDefault,
      validation_status,
    } = body

    if (!name || !street || !city || !postal_code) {
      return NextResponse.json(
        { error: 'Nombre, dirección, ciudad y código postal son requeridos' },
        { status: 400 }
      )
    }

    // Obtener usuario
    console.log('🔍 POST - Buscando usuario con id:', session.user.id)
    let { data: user, error: userError } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('id', session.user.id)
      .single()

    // Si el usuario no existe, crearlo automáticamente
    if (!user && userError?.code === 'PGRST116') {
      console.log('🔄 POST - Usuario no existe, creándolo automáticamente...')

      const { data: newUser, error: createError } = await supabaseAdmin
        .from('user_profiles')
        .insert({
          id: session.user.id,
          email: session.user.email,
          first_name: session.user.name?.split(' ')[0] || null,
          last_name: session.user.name?.split(' ').slice(1).join(' ') || null,
          role_id: null,
          is_active: true,
          metadata: {
            created_via: 'nextauth_auto',
            source: 'address_api_post',
            created_at: new Date().toISOString(),
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (createError) {
        console.error('❌ POST - Error creando usuario:', createError)
        return NextResponse.json({ error: 'Error creando usuario' }, { status: 500 })
      }

      user = newUser
      console.log('✅ POST - Usuario creado exitosamente:', user)
    } else if (!user) {
      console.log('❌ POST - Usuario no encontrado y error inesperado:', userError)
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Manejar lógica de dirección predeterminada
    let is_default = initialIsDefault
    if (is_default) {
      console.log('🔄 POST - Desmarcando otras direcciones como predeterminadas')
      // Desmarcar todas las otras direcciones como predeterminadas
      await supabaseAdmin
        .from('user_addresses')
        .update({ is_default: false })
        .eq('user_id', user.id)
    } else {
      // Si no es predeterminada, verificar si es la primera dirección del usuario
      const { data: existingAddresses } = await supabaseAdmin
        .from('user_addresses')
        .select('id')
        .eq('user_id', user.id)

      // Si es la primera dirección, marcarla como predeterminada automáticamente
      if (!existingAddresses || existingAddresses.length === 0) {
        console.log('🔄 POST - Primera dirección del usuario, marcando como predeterminada')
        is_default = true
      }
    }

    // Crear nueva dirección
    const addressData = {
      user_id: user.id,
      name,
      street,
      apartment: apartment || null,
      city,
      state: state || '',
      postal_code,
      country: country || 'Argentina',
      phone: phone || null,
      type: type || 'shipping',
      is_default: is_default || false,
      validation_status: validation_status || 'pending',
    }

    console.log('Inserting address data:', addressData) // Debug

    const { data: newAddress, error } = await supabaseAdmin
      .from('user_addresses')
      .insert([addressData])
      .select()
      .single()

    if (error) {
      console.error('Error al crear dirección:', error)
      return NextResponse.json({ error: 'Error al crear dirección' }, { status: 500 })
    }

    // Asegurar que solo haya una dirección predeterminada
    await ensureOneDefaultAddress(user.id)

    return NextResponse.json({
      success: true,
      data: newAddress,
      message: 'Dirección creada correctamente',
    })
  } catch (error) {
    console.error('Error en POST /api/user/addresses:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// PUT - Actualizar dirección existente
export async function PUT(request: NextRequest) {
  try {
    console.log('🔄 PUT /api/user/addresses - Iniciando actualización')

    // Autenticación con Clerk
    const session = await auth()
    console.log('🔍 Session:', session ? 'Autenticado' : 'No autenticado')

    if (!session?.user) {
      console.log('❌ Usuario no autenticado')
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Usuario no autenticado',
      }
      return NextResponse.json(errorResponse, { status: 401 })
    }

    const body = await request.json()
    console.log('Received update data:', body) // Debug

    // Validar datos requeridos
    const {
      id,
      name,
      street,
      apartment,
      city,
      postal_code,
      state,
      country,
      phone,
      type,
      is_default,
      validation_status,
      latitude,
      longitude,
    } = body

    if (!id) {
      return NextResponse.json({ error: 'ID de dirección es requerido' }, { status: 400 })
    }

    if (!name || !street || !city || !postal_code) {
      return NextResponse.json(
        { error: 'Nombre, dirección, ciudad y código postal son requeridos' },
        { status: 400 }
      )
    }

    // Buscar o crear usuario
    let user
    try {
      const { data: existingUser, error: userError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('id', session.user.id)
        .single()

      if (userError && userError.code === 'PGRST116') {
        console.log('🔄 Usuario no existe, creándolo automáticamente...')
        const { data: newUser, error: createError } = await supabaseAdmin
          .from('users')
          .insert([{ id: session.user.id }])
          .select()
          .single()

        if (createError) {
          console.error('Error al crear usuario:', createError)
          return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 })
        }

        user = newUser
        console.log('✅ Usuario creado exitosamente:', { id: user.id })
      } else if (userError) {
        console.error('Error al buscar usuario:', userError)
        return NextResponse.json({ error: 'Error al buscar usuario' }, { status: 500 })
      } else {
        user = existingUser
        console.log('🔍 Usuario encontrado:', { id: user.id })
      }
    } catch (error) {
      console.error('Error en manejo de usuario:', error)
      return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }

    // Verificar que la dirección pertenece al usuario
    const { data: existingAddress, error: addressError } = await supabaseAdmin
      .from('user_addresses')
      .select('id, user_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (addressError || !existingAddress) {
      console.error('Dirección no encontrada o no pertenece al usuario:', addressError)
      return NextResponse.json({ error: 'Dirección no encontrada' }, { status: 404 })
    }

    // Manejar lógica de dirección predeterminada en actualización
    if (is_default) {
      console.log('🔄 PUT - Desmarcando otras direcciones como predeterminadas')
      // Desmarcar todas las otras direcciones como predeterminadas
      await supabaseAdmin
        .from('user_addresses')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .neq('id', id)
    }

    // Actualizar dirección
    const updateData = {
      name,
      street,
      apartment: apartment || null,
      city,
      state: state || '',
      postal_code,
      country: country || 'Argentina',
      phone: phone || null,
      type: type || 'shipping',
      is_default: is_default || false,
      validation_status: validation_status || 'pending',
      latitude: latitude || null,
      longitude: longitude || null,
      updated_at: new Date().toISOString(),
    }

    console.log('Updating address data:', updateData) // Debug

    const { data: updatedAddress, error: updateError } = await supabaseAdmin
      .from('user_addresses')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error al actualizar dirección:', updateError)
      return NextResponse.json({ error: 'Error al actualizar dirección' }, { status: 500 })
    }

    console.log('✅ Dirección actualizada exitosamente:', { id: updatedAddress.id })

    // Asegurar que solo haya una dirección predeterminada
    await ensureOneDefaultAddress(user.id)

    return NextResponse.json({
      success: true,
      data: updatedAddress,
      message: 'Dirección actualizada correctamente',
    })
  } catch (error) {
    console.error('Error en PUT /api/user/addresses:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
