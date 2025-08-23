import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { userId, sessionClaims } = auth();

    // Log detallado para debugging
    console.log('🔍 CLERK DEBUG INFO:', {
      userId,
      sessionClaims: sessionClaims ? JSON.stringify(sessionClaims, null, 2) : 'null',
      publicMetadata: sessionClaims?.publicMetadata,
      metadata: sessionClaims?.metadata,
      role_from_publicMetadata: sessionClaims?.publicMetadata?.role,
      role_from_metadata: sessionClaims?.metadata?.role
    });

    // Verificar todas las posibles ubicaciones del rol
    const possibleRoles = {
      'sessionClaims.publicMetadata.role': sessionClaims?.publicMetadata?.role,
      'sessionClaims.metadata.role': sessionClaims?.metadata?.role,
      'sessionClaims.role': sessionClaims?.role,
      'sessionClaims.public_metadata.role': sessionClaims?.public_metadata?.role,
      'sessionClaims.user_metadata.role': sessionClaims?.user_metadata?.role
    };

    return NextResponse.json({
      success: true,
      debug: {
        userId,
        hasSessionClaims: !!sessionClaims,
        sessionClaimsKeys: sessionClaims ? Object.keys(sessionClaims) : [],
        publicMetadata: sessionClaims?.publicMetadata,
        metadata: sessionClaims?.metadata,
        possibleRoleLocations: possibleRoles,
        detectedRole: Object.values(possibleRoles).find(role => role === 'admin') || 'none',
        fullSessionClaimsStructure: sessionClaims
      }
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      errorType: error.constructor.name
    }, { status: 500 });
  }
}
