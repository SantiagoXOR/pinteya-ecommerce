import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🔍 [DEBUG] Iniciando verificación de estado del usuario...')

    // Verificar variables de entorno primero
    const clerkSecretKey = process.env.CLERK_SECRET_KEY
    const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

    if (!clerkSecretKey) {
      throw new Error('CLERK_SECRET_KEY no está configurado')
    }

    if (!clerkPublishableKey) {
      throw new Error('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY no está configurado')
    }

    console.log('🔍 [DEBUG] Variables de entorno verificadas')

    // Obtener información de autenticación
    let authData
    try {
      authData = await auth()
      console.log('🔍 [DEBUG] Auth data obtenido:', {
        userId: authData.userId,
        orgRole: authData.orgRole,
        hasSessionClaims: !!authData.sessionClaims
      })
    } catch (authError) {
      console.error('❌ [ERROR] Error en auth():', authError)
      throw new Error(`Error en auth(): ${authError instanceof Error ? authError.message : 'Error desconocido'}`)
    }

    const { userId, sessionClaims, orgRole } = authData

    // Obtener información completa del usuario
    let user = null
    try {
      user = await currentUser()
      console.log('🔍 [DEBUG] Current user obtenido:', {
        id: user?.id,
        email: user?.emailAddresses?.[0]?.emailAddress,
        firstName: user?.firstName,
        lastName: user?.lastName,
        hasPublicMetadata: !!user?.publicMetadata,
        hasPrivateMetadata: !!user?.privateMetadata,
        organizationMembershipsCount: user?.organizationMemberships?.length || 0
      })
    } catch (userError) {
      console.error('❌ [ERROR] Error en currentUser():', userError)
      // No lanzamos error aquí, continuamos sin user data
    }
    
    // Verificar roles específicos de forma segura
    let hasAdminRole = false
    let roleFromSessionClaims = null
    let roleFromPublicMetadata = null
    let roleFromPrivateMetadata = null

    try {
      roleFromSessionClaims = sessionClaims?.metadata?.role || sessionClaims?.role || null
      roleFromPublicMetadata = user?.publicMetadata?.role || null
      roleFromPrivateMetadata = user?.privateMetadata?.role || null

      hasAdminRole = roleFromSessionClaims === 'admin' ||
                    roleFromPublicMetadata === 'admin' ||
                    roleFromPrivateMetadata === 'admin'

      console.log('🔍 [DEBUG] Verificación de roles:', {
        hasAdminRole,
        roleFromSessionClaims,
        roleFromPublicMetadata,
        roleFromPrivateMetadata
      })
    } catch (roleError) {
      console.error('❌ [ERROR] Error verificando roles:', roleError)
    }
    
    // Construir respuesta de forma segura
    const debugInfo = {
      timestamp: new Date().toISOString(),
      authentication: {
        isAuthenticated: !!userId,
        userId: userId || null,
        orgRole: orgRole || null,
        sessionClaims: sessionClaims || null
      },
      user: user ? {
        id: user.id || null,
        email: user.emailAddresses?.[0]?.emailAddress || null,
        firstName: user.firstName || null,
        lastName: user.lastName || null,
        publicMetadata: user.publicMetadata || null,
        privateMetadata: user.privateMetadata || null,
        organizationMemberships: user.organizationMemberships?.map(org => ({
          id: org.id || null,
          role: org.role || null,
          organization: {
            id: org.organization?.id || null,
            name: org.organization?.name || null
          }
        })) || []
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
