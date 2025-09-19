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
        },
        debug: {
          authResult,
          deprecatedHeaders: Object.fromEntries(request.headers.entries())
        }
      }, { status: 401 });
    }

    const clerkUserId = authResult.userId;

    console.log('🔍 Debug User Profile: Searching for user:', clerkUserId);

    // Verificar si supabaseAdmin está disponible
    if (!supabaseAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Supabase admin client not available'
      }, { status: 500 });
    }

    // Buscar usuario sin joins para evitar problemas
    const { data: profiles, error: searchError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('clerk_user_id', clerkUserId);

    console.log('🔍 Debug User Profile: Search results:', {
      profiles: profiles?.length || 0,
      error: searchError
    });

    if (searchError) {
      return NextResponse.json({
        success: false,
        error: 'Database query error',
        debug: {
          clerkUserId,
          searchError: searchError.message,
          code: searchError.code
        }
      }, { status: 500 });
    }

    // Buscar solo usuarios activos sin joins
    const { data: activeProfiles, error: activeError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('clerk_user_id', clerkUserId)
      .eq('is_active', true);

    console.log('🔍 Debug User Profile: Active profiles:', {
      activeProfiles: activeProfiles?.length || 0,
      error: activeError
    });

    return NextResponse.json({
      success: true,
      debug: {
        clerkUserId,
        allProfiles: profiles || [],
        activeProfiles: activeProfiles || [],
        totalProfiles: profiles?.length || 0,
        totalActiveProfiles: activeProfiles?.length || 0
      }
    });

  } catch (error) {
    console.error('🔍 Debug User Profile: Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      debug: {
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}









