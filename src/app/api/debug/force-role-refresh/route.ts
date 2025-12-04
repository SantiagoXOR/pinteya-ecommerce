/**
 * API de Debug: Forzar Refresh del Rol en el JWT
 * Esta ruta fuerza la recarga del rol desde la base de datos
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getUserRole } from '@/lib/auth/role-service'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({
        error: 'No authenticated',
        message: 'Debes estar logueado para usar esta función'
      }, { status: 401 })
    }

    // Obtener el rol actual desde la base de datos
    const currentRole = await getUserRole(session.user.id)

    return NextResponse.json({
      success: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      },
      session_role: session.user.role || 'no definido',
      database_role: currentRole,
      match: session.user.role === currentRole,
      message: session.user.role === currentRole 
        ? '✅ El rol en sesión coincide con la base de datos'
        : `⚠️ Rol desincronizado. Sesión: ${session.user.role}, DB: ${currentRole}. Cierra sesión y vuelve a iniciar.`
    })
  } catch (error) {
    console.error('[Force Role Refresh] Error:', error)
    return NextResponse.json({
      error: 'Internal error',
      message: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}


