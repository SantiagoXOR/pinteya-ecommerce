import { NextRequest, NextResponse } from 'next/server';
import { getUserProfile, getAuthenticatedUser } from '@/lib/auth/admin-auth';

export async function GET(request: NextRequest) {
  try {
    // MIGRADO: Usar getAuthenticatedUser en lugar de headers
    const authResult = await getAuthenticatedUser(request);

    if (!authResult.userId) {
      return NextResponse.json({
        success: false,
        error: authResult.error || 'Usuario no autenticado',
        migration: {
          status: 'MIGRATED',
          oldMethod: 'headers x-clerk-user-id',
          newMethod: 'getAuthenticatedUser()',
          note: 'Ya no usa headers directamente'
        }
      }, { status: 401 });
    }

    const clerkUserId = authResult.userId;

    console.log('🔍 Debug getUserProfile: Testing with user:', clerkUserId);

    const profile = await getUserProfile(clerkUserId);

    if (!profile) {
      return NextResponse.json({
        success: false,
        error: 'Profile not found',
        debug: {
          clerkUserId,
          profileExists: false
        }
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      profile: profile,
      debug: {
        clerkUserId,
        profileExists: true,
        hasRole: !!profile.user_roles
      }
    });

  } catch (error) {
    console.error('🔍 Debug getUserProfile: Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      debug: {
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}
