// Configuración para Node.js Runtime
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';

export async function GET() {
  // Este endpoint está protegido por el middleware como admin
  // Si llegamos aquí, significa que el middleware permitió el acceso
  
  return NextResponse.json({
    success: true,
    message: 'Admin middleware test passed!',
    timestamp: new Date().toISOString(),
    endpoint: '/api/test-admin-middleware'
  });
}










