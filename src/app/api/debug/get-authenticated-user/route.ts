import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, getAuthenticatedAdmin } from '@/lib/auth/admin-auth';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug getAuthenticatedUser: Testing MIGRATED authentication methods');

    // Test 1: Función migrada getAuthenticatedUser
    const userResult = await getAuthenticatedUser(request);

    // Test 2: Función nueva getAuthenticatedAdmin
    const adminResult = await getAuthenticatedAdmin(request);

    // Test 3: auth() directo
    let directAuth;
    try {
      directAuth = await auth();
    } catch (authError) {
      directAuth = { error: authError.message };
    }

    console.log('🔍 Resultados de migración:', {
      userResult,
      adminResult,
      directAuth
    });

    return NextResponse.json({
      success: !!userResult.userId,
      migration: {
        status: 'COMPLETED',
        version: '2.0',
        methods: {
          getAuthenticatedUser: {
            userId: userResult.userId,
            sessionId: userResult.sessionId,
            isAdmin: userResult.isAdmin,
            error: userResult.error,
            usesHeaders: false,
            usesOfficialClerkMethods: true
          },
          getAuthenticatedAdmin: {
            userId: adminResult.userId,
            sessionId: adminResult.sessionId,
            isAdmin: adminResult.isAdmin,
            error: adminResult.error,
            status: adminResult.status
          },
          directAuth: {
            userId: directAuth.userId,
            sessionId: directAuth.sessionId,
            error: directAuth.error
          }
        }
      },
      debug: {
        migrationNotes: [
          '✅ MIGRADO: Ya no usa headers x-clerk-user-id',
          '✅ MIGRADO: Usa getAuth(req) y auth() oficiales',
          '✅ NUEVO: Función getAuthenticatedAdmin() combinada',
          '✅ NUEVO: Detección automática de admin desde token',
          '⚠️ DEPRECADO: Fallbacks a headers eliminados'
        ],
        hasRequest: !!request,
        deprecatedHeader: request.headers.get('x-clerk-user-id') || 'Not used anymore'
      }
    });

  } catch (error) {
    console.error('🔍 Debug getAuthenticatedUser: Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      debug: {
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}
