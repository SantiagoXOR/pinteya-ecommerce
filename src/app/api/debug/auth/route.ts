import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, getAuthFromHeaders } from '@/lib/auth/admin-auth';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug Auth: Starting authentication check...');

    // MIGRADO: Usar métodos oficiales de Clerk
    const authResult = await getAuthenticatedUser(request);

    // También probar auth() directamente
    let directAuthResult;
    try {
      directAuthResult = await auth();
    } catch (directAuthError) {
      directAuthResult = { error: directAuthError.message };
    }

    // DEPRECADO: Headers para comparación (solo debug)
    const deprecatedHeaders = await getAuthFromHeaders(request);

    // Obtener cookies para debug
    const cookies = request.cookies;
    const sessionCookie = cookies.get('__session');
    const clerkSessionCookie = cookies.get('__clerk_session');

    console.log('🔍 Debug Auth: Resultados de migración:', {
      newMethod: authResult,
      directAuth: directAuthResult,
      deprecatedHeaders: deprecatedHeaders
    });

    return NextResponse.json({
      success: true,
      migration: {
        status: 'MIGRATED_TO_OFFICIAL_METHODS',
        newAuthMethod: {
          userId: authResult.userId,
          sessionId: authResult.sessionId,
          isAdmin: authResult.isAdmin,
          error: authResult.error
        },
        directAuthMethod: {
          userId: directAuthResult.userId,
          sessionId: directAuthResult.sessionId,
          error: directAuthResult.error
        },
        deprecatedHeaderMethod: {
          userId: deprecatedHeaders.userId,
          deprecated: deprecatedHeaders.deprecated,
          error: deprecatedHeaders.error
        }
      },
      debug: {
        cookies: {
          sessionCookie: sessionCookie ? 'Present' : 'Missing',
          clerkSessionCookie: clerkSessionCookie ? 'Present' : 'Missing',
          totalCookies: Array.from(cookies.entries()).length
        },
        migrationNotes: [
          'Esta API ha sido migrada a usar getAuthenticatedUser()',
          'Ya no depende de headers x-clerk-user-id',
          'Usa métodos oficiales de Clerk: getAuth() y auth()',
          'Headers mostrados solo para comparación en debug'
        ]
      }
    });

  } catch (error) {
    console.error('🔍 Debug Auth: Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Authentication error',
      debug: {
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clerkUserId, email } = body;

    console.log('🔍 Debug Auth POST: Received data:', { clerkUserId, email });

    return NextResponse.json({
      success: true,
      debug: {
        receivedClerkUserId: clerkUserId,
        receivedEmail: email,
        message: 'Data received successfully'
      }
    });

  } catch (error) {
    console.error('🔍 Debug Auth POST: Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Error processing request',
      debug: {
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}
