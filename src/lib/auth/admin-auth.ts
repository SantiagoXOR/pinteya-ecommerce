/**
 * Sistema de Autenticación y Autorización para Panel Administrativo
 * Migrado a NextAuth.js - Versión limpia y simplificada
 */

import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { NextRequest } from 'next/server';
import type { NextApiRequest, NextApiResponse } from 'next';

// Tipos para autenticación
export interface AuthResult {
  userId: string | null;
  sessionId?: string;
  error?: string;
  isAdmin?: boolean;
}

export interface AdminUser {
  id: string;
  email: string;
  name?: string;
  role: string;
}

/**
 * Obtiene el usuario autenticado usando NextAuth.js
 * MIGRADO: Usa NextAuth.js en lugar de Clerk
 */
export async function getAuthenticatedUser(
  request?: NextRequest | NextApiRequest
): Promise<AuthResult> {
  try {
    // Usar NextAuth.js para obtener la sesión
    const session = await auth();
    
    if (!session?.user) {
      return {
        userId: null,
        error: 'Usuario no autenticado'
      };
    }

    console.log(`[AUTH] Usuario autenticado via NextAuth: ${session.user.id}`);

    // Verificar si es admin usando el email
    const isAdmin = session.user.email === 'santiago@xor.com.ar';
    
    console.log(`[AUTH] Verificación admin - email: ${session.user.email}, isAdmin: ${isAdmin}`);

    return {
      userId: session.user.id,
      sessionId: session.user.id, // NextAuth.js no tiene sessionId separado
      isAdmin
    };
  } catch (error) {
    console.error('[AUTH] Error en getAuthenticatedUser:', error);
    return {
      userId: null,
      error: `Error de autenticación: ${error.message}`
    };
  }
}

/**
 * Obtiene el usuario admin autenticado con información completa
 */
export async function getAuthenticatedAdmin(): Promise<{
  success: boolean;
  user?: AdminUser;
  error?: string;
}> {
  try {
    const authResult = await getAuthenticatedUser();
    
    if (!authResult.userId || authResult.error) {
      return {
        success: false,
        error: authResult.error || 'Usuario no autenticado'
      };
    }

    if (!authResult.isAdmin) {
      return {
        success: false,
        error: 'Acceso denegado - Se requieren permisos de administrador'
      };
    }

    const session = await auth();
    
    return {
      success: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: 'admin'
      }
    };
  } catch (error) {
    console.error('[AUTH] Error en getAuthenticatedAdmin:', error);
    return {
      success: false,
      error: 'Error de autenticación'
    };
  }
}

/**
 * Función específica para Pages Router API Routes
 * Usa NextAuth.js en lugar de Clerk
 */
export async function getAuthFromApiRoute(req: NextApiRequest, res: NextApiResponse) {
  const session = await auth();

  if (!session?.user) {
    throw new Error('Usuario no autenticado');
  }

  console.log(`[AUTH] API Route autenticada: ${session.user.id}`);
  return { userId: session.user.id, sessionId: session.user.id };
}

/**
 * Función específica para App Router Route Handlers
 * Usa NextAuth.js en lugar de Clerk
 */
export async function getAuthFromRouteHandler() {
  const session = await auth();

  if (!session?.user) {
    throw new Error('Usuario no autenticado');
  }

  console.log(`[AUTH] Route Handler autenticado: ${session.user.id}`);
  return { userId: session.user.id, sessionId: session.user.id };
}

/**
 * Verifica si un usuario es administrador
 */
export async function isUserAdmin(userId?: string): Promise<boolean> {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return false;
    }

    // Verificar si es admin usando el email
    return session.user.email === 'santiago@xor.com.ar';
  } catch (error) {
    console.error('[AUTH] Error verificando admin:', error);
    return false;
  }
}

/**
 * Middleware de autenticación para APIs admin
 */
export async function requireAdminAuth(): Promise<{
  success: boolean;
  user?: AdminUser;
  error?: string;
  status?: number;
}> {
  try {
    const adminResult = await getAuthenticatedAdmin();
    
    if (!adminResult.success) {
      return {
        success: false,
        error: adminResult.error,
        status: adminResult.error?.includes('no autenticado') ? 401 : 403
      };
    }

    return {
      success: true,
      user: adminResult.user
    };
  } catch (error) {
    console.error('[AUTH] Error en requireAdminAuth:', error);
    return {
      success: false,
      error: 'Error de autenticación',
      status: 500
    };
  }
}
