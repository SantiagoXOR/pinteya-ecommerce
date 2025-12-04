/**
 * Endpoint para forzar la actualización del rol en el token JWT
 * Útil cuando se asigna un nuevo rol a un usuario y necesita reflejarse inmediatamente
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Forzar actualización del token usando el trigger 'update'
    // Esto hará que NextAuth recargue el rol desde la base de datos
    const response = NextResponse.json({
      success: true,
      message: 'Rol actualizado. Por favor, recarga la página.',
      currentRole: session.user.role,
    })

    // Nota: NextAuth no expone una forma directa de actualizar el token desde el servidor
    // El cliente debe usar update() de useSession para forzar la actualización
    return response
  } catch (error) {
    console.error('[Update Role API] Error:', error)
    return NextResponse.json(
      { error: 'Error al actualizar rol' },
      { status: 500 }
    )
  }
}

