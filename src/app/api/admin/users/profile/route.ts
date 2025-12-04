// Configuración para Node.js Runtime
export const runtime = 'nodejs'

/**
 * API para obtener perfil de usuario
 * GET /api/admin/users/profile?email=user@example.com
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email es requerido' }, { status: 400 })
    }

    // Buscar usuario en user_profiles (no en users)
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select(
        `
        id,
        supabase_user_id,
        email,
        first_name,
        last_name,
        role_id,
        is_active,
        user_roles:role_id (
          role_name,
          description,
          permissions
        )
      `
      )
      .eq('email', email)
      .eq('is_active', true)
      .single()

    if (profileError) {
      if (profileError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Usuario no encontrado' },
          { status: 404 }
        )
      }

      console.error('Error al buscar usuario:', profileError)
      return NextResponse.json(
        { success: false, error: 'Error al buscar usuario' },
        { status: 500 }
      )
    }

    // Transformar a formato esperado
    const user = {
      id: userProfile.id,
      clerk_user_id: userProfile.supabase_user_id,
      email: userProfile.email,
      first_name: userProfile.first_name,
      last_name: userProfile.last_name,
      role_id: userProfile.role_id,
      is_active: userProfile.is_active,
      user_roles: userProfile.user_roles,
    }

    return NextResponse.json({
      success: true,
      user: user,
    })
  } catch (error) {
    console.error('Error al obtener perfil de usuario:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
