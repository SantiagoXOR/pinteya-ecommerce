import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🔍 [DEBUG] Iniciando verificación simplificada...')

    // Verificar variables de entorno
    const clerkSecretKey = process.env.CLERK_SECRET_KEY
    const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

    console.log('🔍 [DEBUG] Variables de entorno:', {
      hasSecretKey: !!clerkSecretKey,
      hasPublishableKey: !!clerkPublishableKey,
      secretKeyLength: clerkSecretKey?.length || 0,
      publishableKeyLength: clerkPublishableKey?.length || 0
    })

    // Obtener información básica de autenticación
    let authData = null
    let authError = null

    try {
      authData = await auth()
      console.log('🔍 [DEBUG] Auth exitoso')
    } catch (error) {
      authError = error instanceof Error ? error.message : 'Error desconocido en auth()'
      console.error('❌ [ERROR] Error en auth():', authError)
    }

    // Obtener información del usuario
    let user = null
    let userError = null

    try {
      user = await currentUser()
      console.log('🔍 [DEBUG] CurrentUser exitoso')
    } catch (error) {
      userError = error instanceof Error ? error.message : 'Error desconocido en currentUser()'
      console.error('❌ [ERROR] Error en currentUser():', userError)
    }
    
    // Verificar roles de forma segura
    let hasAdminRole = false
    let roleFromSessionClaims = null
    let roleFromPublicMetadata = null
    let roleFromPrivateMetadata = null
    let roleError = null

    try {
      if (authData?.sessionClaims) {
        roleFromSessionClaims = authData.sessionClaims.metadata?.role || authData.sessionClaims.role || null
      }

      if (user?.publicMetadata) {
        roleFromPublicMetadata = user.publicMetadata.role || null
      }

      if (user?.privateMetadata) {
        roleFromPrivateMetadata = user.privateMetadata.role || null
      }

      hasAdminRole = roleFromSessionClaims === 'admin' ||
                    roleFromPublicMetadata === 'admin' ||
                    roleFromPrivateMetadata === 'admin'

      console.log('🔍 [DEBUG] Verificación de roles exitosa:', {
        hasAdminRole,
        roleFromSessionClaims,
        roleFromPublicMetadata,
        roleFromPrivateMetadata
      })
    } catch (error) {
      roleError = error instanceof Error ? error.message : 'Error desconocido en verificación de roles'
      console.error('❌ [ERROR] Error verificando roles:', roleError)
    }
    
    // Construir respuesta de forma segura
    const debugInfo = {
      timestamp: new Date().toISOString(),
      errors: {
        authError,
        userError,
        roleError
      },
      authentication: {
        isAuthenticated: !!authData?.userId,
        userId: authData?.userId || null,
        orgRole: authData?.orgRole || null,
        sessionClaims: authData?.sessionClaims || null
      },
      user: user ? {
        id: user.id || null,
        email: session.user.email || null,
        firstName: user.firstName || null,
        lastName: user.lastName || null,
        publicMetadata: user.publicMetadata || null,
        privateMetadata: user.privateMetadata || null,
        organizationMemberships: user.organizationMemberships?.length || 0
      } : null,
      roleCheck: {
        hasAdminRole,
        roleFromSessionClaims,
        roleFromPublicMetadata,
        roleFromPrivateMetadata
      },
      environment: {
        clerkPublishableKey: clerkPublishableKey?.substring(0, 20) + '...',
        clerkSecretKey: clerkSecretKey ? 'SET' : 'NOT_SET',
        nodeEnv: process.env.NODE_ENV || 'unknown'
      }
    }
    
    console.log('🔍 [DEBUG] Debug info completo:', JSON.stringify(debugInfo, null, 2))
    
    return NextResponse.json(debugInfo, { status: 200 })
    
  } catch (error) {
    console.error('❌ [ERROR] Error en debug de usuario:', error)
    
    return NextResponse.json({
      error: 'Error al obtener información del usuario',
      details: error instanceof Error ? error.message : 'Error desconocido',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}









