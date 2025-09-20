// Configuración para Node.js Runtime
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';

/**
 * API simple para verificar el estado de autenticación sin dependencias complejas
 * GET /api/debug/simple-auth-check
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Simple Auth Check: Starting...');

    // Verificar autenticación básica
    const { userId, sessionClaims } = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { 
          success: false,
          authenticated: false,
          error: 'No authenticated user'
        },
        { status: 401 }
      );
    }

    // Verificar allowlist temporal
    const adminUserIds = process.env.ADMIN_USER_IDS?.split(',').map(id => id.trim()) || [];
    const isAllowlistedUser = adminUserIds.includes(userId);

    // Información básica de la sesión
    const sessionInfo = {
      userId,
      isAllowlistedUser,
      adminUserIdsCount: adminUserIds.length,
      sessionClaims: {
        publicMetadata: sessionClaims?.publicMetadata,
        privateMetadata: sessionClaims?.privateMetadata
      }
    };

    // Verificaciones de rol
    const roleChecks = {
      sessionPublicRole: sessionClaims?.publicMetadata?.role,
      sessionPrivateRole: sessionClaims?.privateMetadata?.role,
      isAdminBySession: (
        sessionClaims?.publicMetadata?.role === 'admin' ||
        sessionClaims?.privateMetadata?.role === 'admin'
      ),
      isAllowlistedUser,
      finalAdminAccess: (
        sessionClaims?.publicMetadata?.role === 'admin' ||
        sessionClaims?.privateMetadata?.role === 'admin' ||
        isAllowlistedUser
      )
    };

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      authenticated: true,
      sessionInfo,
      roleChecks,
      debugInfo: {
        environment: process.env.NODE_ENV,
        hasAdminUserIds: !!process.env.ADMIN_USER_IDS,
        adminUserIdsLength: adminUserIds.length
      }
    };

    console.log('✅ Simple Auth Check: Success', JSON.stringify(response, null, 2));

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('❌ Simple Auth Check Error:', error);
    
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










