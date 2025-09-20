// Configuración para Node.js Runtime
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, checkAdminAccess } from '@/lib/auth/admin-auth';

export async function GET(request: NextRequest) {
  try {
    const clerkUserId = request.headers.get('x-clerk-user-id');

    if (!clerkUserId) {
      return NextResponse.json({
        success: false,
        error: 'No Clerk User ID provided'
      }, { status: 400 });
    }

    console.log('🔍 Debug checkAdminPermissions: Testing with user:', clerkUserId);

    // Paso 1: Verificar getAuthenticatedUser
    console.log('🔍 Step 1: Testing getAuthenticatedUser');
    const authResult = await getAuthenticatedUser(request);
    console.log('🔍 Step 1 result:', authResult);

    // Paso 2: Verificar checkAdminAccess
    console.log('🔍 Step 2: Testing checkAdminAccess with userId:', authResult.userId);
    const adminAccessResult = await checkAdminAccess(authResult.userId!);
    console.log('🔍 Step 2 result:', adminAccessResult);

    return NextResponse.json({
      success: true,
      debug: {
        clerkUserId,
        step1_getAuthenticatedUser: authResult,
        step2_checkAdminAccess: adminAccessResult,
        step1_success: !!authResult.userId,
        step2_success: adminAccessResult.success
      }
    });

  } catch (error) {
    console.error('🔍 Debug checkAdminPermissions: Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      debug: {
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}










