/**
 * RUTA TEMPORAL PARA CAPTURAR LLAMADAS A sync-user-email
 * Esta ruta no debería existir, pero está siendo llamada por algún componente
 * La creamos temporalmente para debuggear y evitar errores 500
 */

import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse } from '@/types/api';

/**
 * GET /api/auth/sync-user-email
 * RUTA TEMPORAL PARA DEBUG - NO DEBERÍA SER LLAMADA
 */
export async function GET(request: NextRequest) {
  console.log('🚨 [SYNC-USER-EMAIL] RUTA TEMPORAL LLAMADA - INVESTIGANDO ORIGEN');
  console.log('🚨 [SYNC-USER-EMAIL] URL:', request.url);
  console.log('🚨 [SYNC-USER-EMAIL] Method:', request.method);
  console.log('🚨 [SYNC-USER-EMAIL] Headers:', Object.fromEntries(request.headers.entries()));
  console.log('🚨 [SYNC-USER-EMAIL] User-Agent:', request.headers.get('user-agent'));
  console.log('🚨 [SYNC-USER-EMAIL] Referer:', request.headers.get('referer'));
  console.log('🚨 [SYNC-USER-EMAIL] Origin:', request.headers.get('origin'));
  
  // Capturar query parameters
  const url = new URL(request.url);
  console.log('🚨 [SYNC-USER-EMAIL] Query params:', Object.fromEntries(url.searchParams.entries()));
  
  // Respuesta temporal para evitar errores 500
  const debugResponse: ApiResponse<any> = {
    data: {
      message: 'Esta ruta no debería ser llamada',
      debug: {
        url: request.url,
        method: request.method,
        timestamp: new Date().toISOString(),
        headers: Object.fromEntries(request.headers.entries()),
        queryParams: Object.fromEntries(url.searchParams.entries())
      }
    },
    success: false,
    error: 'sync-user-email es una ruta temporal para debug - no debería ser llamada',
    message: 'Investigando origen de estas llamadas automáticas'
  };
  
  return NextResponse.json(debugResponse, { 
    status: 503,
    headers: {
      'Content-Type': 'application/json',
      'X-Debug': 'sync-user-email-debug-route',
      'X-Timestamp': new Date().toISOString()
    }
  });
}

/**
 * POST /api/auth/sync-user-email
 * RUTA TEMPORAL PARA DEBUG
 */
export async function POST(request: NextRequest) {
  console.log('🚨 [SYNC-USER-EMAIL POST] RUTA TEMPORAL LLAMADA - INVESTIGANDO ORIGEN');
  console.log('🚨 [SYNC-USER-EMAIL POST] URL:', request.url);
  
  try {
    const body = await request.json();
    console.log('🚨 [SYNC-USER-EMAIL POST] Body:', JSON.stringify(body, null, 2));
  } catch (e) {
    console.log('🚨 [SYNC-USER-EMAIL POST] No se pudo parsear el body');
  }
  
  const debugResponse: ApiResponse<null> = {
    data: null,
    success: false,
    error: 'sync-user-email POST es una ruta temporal para debug',
    message: 'Esta ruta no debería ser llamada'
  };
  
  return NextResponse.json(debugResponse, { status: 503 });
}

/**
 * PUT /api/auth/sync-user-email
 * RUTA TEMPORAL PARA DEBUG
 */
export async function PUT(request: NextRequest) {
  console.log('🚨 [SYNC-USER-EMAIL PUT] RUTA TEMPORAL LLAMADA');
  
  const debugResponse: ApiResponse<null> = {
    data: null,
    success: false,
    error: 'sync-user-email PUT es una ruta temporal para debug'
  };
  
  return NextResponse.json(debugResponse, { status: 503 });
}

/**
 * PATCH /api/auth/sync-user-email
 * RUTA TEMPORAL PARA DEBUG
 */
export async function PATCH(request: NextRequest) {
  console.log('🚨 [SYNC-USER-EMAIL PATCH] RUTA TEMPORAL LLAMADA');
  
  const debugResponse: ApiResponse<null> = {
    data: null,
    success: false,
    error: 'sync-user-email PATCH es una ruta temporal para debug'
  };
  
  return NextResponse.json(debugResponse, { status: 503 });
}

/**
 * DELETE /api/auth/sync-user-email
 * RUTA TEMPORAL PARA DEBUG
 */
export async function DELETE(request: NextRequest) {
  console.log('🚨 [SYNC-USER-EMAIL DELETE] RUTA TEMPORAL LLAMADA');
  
  const debugResponse: ApiResponse<null> = {
    data: null,
    success: false,
    error: 'sync-user-email DELETE es una ruta temporal para debug'
  };
  
  return NextResponse.json(debugResponse, { status: 503 });
}
