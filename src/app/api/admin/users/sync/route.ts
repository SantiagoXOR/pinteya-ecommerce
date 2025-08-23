/**
 * API para sincronizar usuarios de NextAuth.js con Supabase
 * POST /api/admin/users/sync
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { id, email, name, image } = await request.json()

    if (!id || !email) {
      return NextResponse.json(
        { success: false, error: 'ID y email son requeridos' },
        { status: 400 }
      )
    }

    // Buscar usuario existente en la tabla pública
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error al buscar usuario:', fetchError)
      return NextResponse.json(
        { success: false, error: 'Error al buscar usuario' },
        { status: 500 }
      )
    }

    let userData

    if (existingUser) {
      // Actualizar usuario existente
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          name,
          email,
          image,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*')
        .single()

      if (updateError) {
        console.error('Error al actualizar usuario:', updateError)
        return NextResponse.json(
          { success: false, error: 'Error al actualizar usuario' },
          { status: 500 }
        )
      }

      userData = updatedUser
    } else {
      // Crear nuevo usuario
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          id,
          name,
          email,
          image,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('*')
        .single()

      if (insertError) {
        console.error('Error al crear usuario:', insertError)
        return NextResponse.json(
          { success: false, error: 'Error al crear usuario' },
          { status: 500 }
        )
      }

      userData = newUser
    }

    return NextResponse.json({
      success: true,
      user: userData,
    })

  } catch (error) {
    console.error('Error en sincronización de usuario:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
