/**
 * API TEMPORAL para manejar llamadas a sync-user-data
 * Esta ruta está siendo llamada por algún componente y causando errores 500
 * La deshabilitamos temporalmente para evitar recursión
 */

import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse } from '@/types/api';

/**
 * GET /api/auth/sync-user-data
 * TEMPORALMENTE DESHABILITADO
 */
export async function GET(request: NextRequest) {
  console.log('[SYNC-USER-DATA API] 🚫 RUTA TEMPORALMENTE DESHABILITADA');
  console.log('[SYNC-USER-DATA API] 📋 URL:', request.url);
  console.log('[SYNC-USER-DATA API] 📋 Headers:', Object.fromEntries(request.headers.entries()));
  
  // RESPUESTA TEMPORAL PARA EVITAR ERRORES 500
  const disabledResponse: ApiResponse<null> = {
    data: null,
    success: false,
    error: 'API sync-user-data temporalmente deshabilitada para evitar recursión',
    message: 'Esta ruta está siendo investigada para resolver bucles recursivos'
  };
  
  return NextResponse.json(disabledResponse, { 
    status: 503,
    headers: {
      'Content-Type': 'application/json',
      'X-Debug': 'sync-user-data-disabled'
    }
  });
}

/**
 * POST /api/auth/sync-user-data
 * TEMPORALMENTE DESHABILITADO
 */
export async function POST(request: NextRequest) {
  console.log('[SYNC-USER-DATA API POST] 🚫 RUTA TEMPORALMENTE DESHABILITADA');
  console.log('[SYNC-USER-DATA API POST] 📋 URL:', request.url);
  
  try {
    const body = await request.json();
    console.log('[SYNC-USER-DATA API POST] 📋 Body:', JSON.stringify(body, null, 2));
  } catch (e) {
    console.log('[SYNC-USER-DATA API POST] ⚠️ No se pudo parsear el body');
  }
  
  // RESPUESTA TEMPORAL PARA EVITAR ERRORES 500
  const disabledResponse: ApiResponse<null> = {
    data: null,
    success: false,
    error: 'API POST sync-user-data temporalmente deshabilitada para evitar recursión',
    message: 'Esta ruta está siendo investigada para resolver bucles recursivos'
  };
  
  return NextResponse.json(disabledResponse, { 
    status: 503,
    headers: {
      'Content-Type': 'application/json',
      'X-Debug': 'sync-user-data-post-disabled'
    }
  });
}

/**
 * PUT /api/auth/sync-user-data
 * TEMPORALMENTE DESHABILITADO
 */
export async function PUT(request: NextRequest) {
  console.log('[SYNC-USER-DATA API PUT] 🚫 RUTA TEMPORALMENTE DESHABILITADA');
  
  const disabledResponse: ApiResponse<null> = {
    data: null,
    success: false,
    error: 'API PUT sync-user-data temporalmente deshabilitada para evitar recursión'
  };
  
  return NextResponse.json(disabledResponse, { status: 503 });
}

/**
 * PATCH /api/auth/sync-user-data
 * TEMPORALMENTE DESHABILITADO
 */
export async function PATCH(request: NextRequest) {
  console.log('[SYNC-USER-DATA API PATCH] 🚫 RUTA TEMPORALMENTE DESHABILITADA');
  
  const disabledResponse: ApiResponse<null> = {
    data: null,
    success: false,
    error: 'API PATCH sync-user-data temporalmente deshabilitada para evitar recursión'
  };
  
  return NextResponse.json(disabledResponse, { status: 503 });
}

/**
 * DELETE /api/auth/sync-user-data
 * TEMPORALMENTE DESHABILITADO
 */
export async function DELETE(request: NextRequest) {
  console.log('[SYNC-USER-DATA API DELETE] 🚫 RUTA TEMPORALMENTE DESHABILITADA');
  
  const disabledResponse: ApiResponse<null> = {
    data: null,
    success: false,
    error: 'API DELETE sync-user-data temporalmente deshabilitada para evitar recursión'
  };
  
  return NextResponse.json(disabledResponse, { status: 503 });
}
