import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/integrations/supabase';
import { getAuthenticatedUser } from '@/lib/auth/admin-auth';

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

    console.log('🔍 Test Simple User: Searching for user:', clerkUserId);

    if (!supabaseAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Supabase admin client not available'
      }, { status: 500 });
    }

    // Consulta muy simple sin joins
    const { data: user, error } = await supabaseAdmin
      .from('user_profiles')
      .select('id, clerk_user_id, email, role_id, is_active')
      .eq('clerk_user_id', clerkUserId)
      .single();

    if (error) {
      console.error('🔍 Test Simple User: Error:', error);
      return NextResponse.json({
        success: false,
        error: 'Database error',
        debug: {
          clerkUserId,
          errorMessage: error.message,
          errorCode: error.code
        }
      }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
        debug: {
          clerkUserId
        }
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: user,
      debug: {
        clerkUserId,
        found: true
      }
    });

  } catch (error) {
    console.error('🔍 Test Simple User: Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      debug: {
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}









