/**
 * API para sincronizar usuarios entre Clerk y Supabase
 * Versión mejorada con servicio de sincronización robusto
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { ApiResponse } from '@/types/api';
import {
  syncUserToSupabase,
  syncUserFromClerk,
  bulkSyncUsersFromClerk,
  type ClerkUserData,
  type SyncOptions
} from '@/lib/auth/user-sync-service';
import { getAuthenticatedUser } from '@/lib/auth/admin-auth';

// Verificar configuración de Clerk
const isClerkConfigured = () => {
  return !!(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.CLERK_SECRET_KEY
  );
};

/**
 * GET /api/auth/sync-user
 * Obtiene información de sincronización de un usuario
 * Parámetros: email, clerkUserId, action (get|sync|bulk)
 */
export async function GET(request: NextRequest) {
  console.log('[SYNC-USER API] 🚫 TEMPORALMENTE DESHABILITADO PARA EVITAR RECURSIÓN');

  // RESPUESTA TEMPORAL PARA EVITAR ERRORES 500
  const disabledResponse: ApiResponse<null> = {
    data: null,
    success: false,
    error: 'API temporalmente deshabilitada para evitar recursión',
  };
  return NextResponse.json(disabledResponse, { status: 503 });
}

/**
 * POST /api/auth/sync-user
 * TEMPORALMENTE DESHABILITADO
 */
export async function POST(request: NextRequest) {
  console.log('[SYNC-USER API POST] 🚫 TEMPORALMENTE DESHABILITADO PARA EVITAR RECURSIÓN');

  // RESPUESTA TEMPORAL PARA EVITAR ERRORES 500
  const disabledResponse: ApiResponse<null> = {
    data: null,
    success: false,
    error: 'API POST temporalmente deshabilitada para evitar recursión',
  };
  return NextResponse.json(disabledResponse, { status: 503 });
}
