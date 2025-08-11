import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { userId, sessionClaims } = await auth();
    
    console.log('🔍 CLERK DEBUG INFO:', {
      userId,
      sessionClaims: JSON.stringify(sessionClaims, null, 2),
      publicMetadata: sessionClaims?.publicMetadata,
      metadata: sessionClaims?.metadata,
      role_from_publicMetadata: sessionClaims?.publicMetadata?.role,
      role_from_metadata: sessionClaims?.metadata?.role
    });

    return NextResponse.json({
      success: true,
      debug: {
        userId,
        sessionClaims,
        publicMetadata: sessionClaims?.publicMetadata,
        metadata: sessionClaims?.metadata,
        possibleRoleLocations: {
          'sessionClaims.publicMetadata.role': sessionClaims?.publicMetadata?.role,
          'sessionClaims.metadata.role': sessionClaims?.metadata?.role,
          'sessionClaims.role': sessionClaims?.role
        },
        fullSessionClaimsStructure: sessionClaims
      }
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
