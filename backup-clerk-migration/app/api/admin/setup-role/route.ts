import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'

/**
 * API para configurar el rol admin en un usuario
 * Solo funciona para el usuario específico configurado
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Solo permitir para tu userId específico
    const ADMIN_USER_ID = 'user_3Oi3_gYZBVoqBD'
    if (userId !== ADMIN_USER_ID) {
      return NextResponse.json({ 
        error: 'No autorizado',
        message: 'Solo el usuario específico puede configurar roles'
      }, { status: 403 })
    }

    // Configurar rol admin en publicMetadata
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: {
        role: 'admin'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Rol admin configurado exitosamente',
      userId,
      role: 'admin'
    })

  } catch (error) {
    console.error('Error configurando rol admin:', error)
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

/**
 * API para verificar el rol actual del usuario
 */
export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Obtener información del usuario desde Clerk
    const user = await clerkClient.users.getUser(userId)
    
    return NextResponse.json({
      userId,
      publicMetadata: user.publicMetadata,
      privateMetadata: user.privateMetadata,
      currentRole: user.publicMetadata?.role || 'no-role',
      isAdmin: user.publicMetadata?.role === 'admin'
    })

  } catch (error) {
    console.error('Error verificando rol:', error)
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
