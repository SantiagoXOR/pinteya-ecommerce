import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClerkClient } from '@clerk/nextjs/server';

/**
 * API de diagnóstico para verificar el estado del usuario admin
 * GET /api/admin/debug-user-role
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug User Role: Starting...');

    // Verificar autenticación
    const { userId, sessionClaims } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { 
          error: 'No authenticated user',
          authenticated: false
        },
        { status: 401 }
      );
    }

    // Crear cliente de Clerk para obtener información detallada
    const clerkClient = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY!
    });

    // Obtener información completa del usuario
    const clerkUser = await clerkClient.users.getUser(userId);

    // Información de la sesión actual
    const sessionInfo = {
      userId,
      sessionClaims: {
        publicMetadata: sessionClaims?.publicMetadata,
        privateMetadata: sessionClaims?.privateMetadata,
        metadata: sessionClaims?.metadata,
        full: sessionClaims
      }
    };

    // Información del usuario desde Clerk
    const userInfo = {
      id: clerkUser.id,
      email: clerkUser.emailAddresses[0]?.emailAddress,
      publicMetadata: clerkUser.publicMetadata,
      privateMetadata: clerkUser.privateMetadata,
      createdAt: clerkUser.createdAt,
      lastSignInAt: clerkUser.lastSignInAt,
      updatedAt: clerkUser.updatedAt
    };

    // Verificaciones de rol
    const roleChecks = {
      sessionPublicRole: sessionClaims?.publicMetadata?.role,
      sessionPrivateRole: sessionClaims?.privateMetadata?.role,
      sessionMetadataRole: sessionClaims?.metadata?.role,
      userPublicRole: clerkUser.publicMetadata?.role,
      userPrivateRole: clerkUser.privateMetadata?.role,
      isAdminBySession: (
        sessionClaims?.publicMetadata?.role === 'admin' ||
        sessionClaims?.privateMetadata?.role === 'admin' ||
        sessionClaims?.metadata?.role === 'admin'
      ),
      isAdminByUser: (
        clerkUser.publicMetadata?.role === 'admin' ||
        clerkUser.privateMetadata?.role === 'admin'
      )
    };

    // Diagnóstico de problemas potenciales
    const diagnostics = {
      hasAnyRole: Object.values(roleChecks).some(role => role === 'admin'),
      sessionVsUserMismatch: roleChecks.isAdminByUser !== roleChecks.isAdminBySession,
      recommendedAction: null as string | null
    };

    if (!diagnostics.hasAnyRole) {
      diagnostics.recommendedAction = 'Usuario no tiene rol admin configurado. Ejecutar /api/admin/fix-santiago-role';
    } else if (diagnostics.sessionVsUserMismatch) {
      diagnostics.recommendedAction = 'Discrepancia entre sesión y usuario. Refrescar sesión o re-login';
    } else if (roleChecks.isAdminBySession) {
      diagnostics.recommendedAction = 'Usuario admin configurado correctamente';
    }

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      authenticated: true,
      sessionInfo,
      userInfo,
      roleChecks,
      diagnostics,
      debugInfo: {
        environment: process.env.NODE_ENV,
        clerkPublishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.substring(0, 20) + '...',
        hasClerkSecret: !!process.env.CLERK_SECRET_KEY
      }
    };

    console.log('✅ Debug User Role: Success', JSON.stringify(response, null, 2));

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('❌ Debug User Role Error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
