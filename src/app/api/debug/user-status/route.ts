import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🔍 [DEBUG] Iniciando verificación de estado del usuario...')
    
    // Obtener información de autenticación
    const { userId, sessionClaims, orgRole } = await auth()
    console.log('🔍 [DEBUG] Auth data:', { userId, orgRole })
    console.log('🔍 [DEBUG] Session claims:', sessionClaims)
    
    // Obtener información completa del usuario
    const user = await currentUser()
    console.log('🔍 [DEBUG] Current user:', {
      id: user?.id,
      email: user?.emailAddresses?.[0]?.emailAddress,
      firstName: user?.firstName,
      lastName: user?.lastName,
      publicMetadata: user?.publicMetadata,
      privateMetadata: user?.privateMetadata,
      organizationMemberships: user?.organizationMemberships
    })
    
    // Verificar roles específicos
    const hasAdminRole = sessionClaims?.metadata?.role === 'admin' || 
                        sessionClaims?.role === 'admin' ||
                        user?.publicMetadata?.role === 'admin' ||
                        user?.privateMetadata?.role === 'admin'
    
    console.log('🔍 [DEBUG] Verificación de rol admin:', hasAdminRole)
    
    const debugInfo = {
      timestamp: new Date().toISOString(),
      authentication: {
        isAuthenticated: !!userId,
        userId,
        orgRole,
        sessionClaims
      },
      user: user ? {
        id: user.id,
        email: user.emailAddresses?.[0]?.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName,
        publicMetadata: user.publicMetadata,
        privateMetadata: user.privateMetadata,
        organizationMemberships: user.organizationMemberships?.map(org => ({
          id: org.id,
          role: org.role,
          organization: {
            id: org.organization.id,
            name: org.organization.name
          }
        }))
      } : null,
      roleCheck: {
        hasAdminRole,
        roleFromSessionClaims: sessionClaims?.metadata?.role || sessionClaims?.role,
        roleFromPublicMetadata: user?.publicMetadata?.role,
        roleFromPrivateMetadata: user?.privateMetadata?.role
      },
      environment: {
        clerkPublishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.substring(0, 20) + '...',
        clerkSecretKey: process.env.CLERK_SECRET_KEY ? 'SET' : 'NOT_SET',
        nodeEnv: process.env.NODE_ENV
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
