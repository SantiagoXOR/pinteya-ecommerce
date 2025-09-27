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

    // Buscar usuario con roles
    const { data: user, error } = await supabase
      .from('users')
      .select(
        `
        *,
        user_roles (
          role_name,
          description,
          permissions
        )
      `
      )
      .eq('email', email)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Usuario no encontrado' },
          { status: 404 }
        )
      }

      console.error('Error al buscar usuario:', error)
      return NextResponse.json(
        { success: false, error: 'Error al buscar usuario' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      user,
    })
  } catch (error) {
    console.error('Error al obtener perfil de usuario:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
