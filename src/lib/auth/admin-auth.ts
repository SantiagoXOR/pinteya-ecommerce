/**
 * Sistema de Autenticación y Autorización para Panel Administrativo
 * Migrado a NextAuth.js - Versión limpia y simplificada
 */

import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/integrations/supabase';
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
    // BYPASS TEMPORAL PARA DESARROLLO
    if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
      console.log('[AUTH] BYPASS AUTH ENABLED - requireAdminAuth (admin-auth)');
      return {
        success: true,
        user: {
          id: 'dev-admin',
          email: 'santiago@xor.com.ar',
          role: 'admin'
        }
      };
    }

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

// ===================================
// FUNCIONES ADICIONALES REQUERIDAS POR EL BUILD
// ===================================

/**
 * Verifica permisos CRUD para operaciones administrativas
 */
export async function checkCRUDPermissions(
  operation: 'create' | 'read' | 'update' | 'delete',
  resource: string,
  userId?: string
): Promise<{
  allowed: boolean;
  error?: string;
}> {
  try {
    // BYPASS TEMPORAL PARA DESARROLLO
    if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
      console.log(`[AUTH] BYPASS AUTH ENABLED - checkCRUDPermissions ${operation} en ${resource}`);
      return {
        allowed: true
      };
    }

    const session = await auth();

    if (!session?.user) {
      return {
        allowed: false,
        error: 'Usuario no autenticado'
      };
    }

    // Verificar si es admin
    const isAdmin = session.user.email === 'santiago@xor.com.ar';

    if (!isAdmin) {
      return {
        allowed: false,
        error: 'Permisos insuficientes para la operación solicitada'
      };
    }

    // Admin tiene todos los permisos CRUD
    console.log(`[AUTH] Permiso CRUD concedido - ${operation} en ${resource} para ${session.user.email}`);

    return {
      allowed: true
    };
  } catch (error) {
    console.error('[AUTH] Error verificando permisos CRUD:', error);
    return {
      allowed: false,
      error: 'Error verificando permisos'
    };
  }
}

/**
 * Registra acciones administrativas para auditoría
 */
export async function logAdminAction(
  action: string,
  resource: string,
  details?: Record<string, any>,
  userId?: string
): Promise<void> {
  try {
    const session = await auth();

    if (!session?.user) {
      console.warn('[AUDIT] Intento de log sin autenticación');
      return;
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      userId: session.user.id,
      userEmail: session.user.email,
      action,
      resource,
      details: details || {},
      ip: 'unknown', // En un entorno real, obtener de headers
      userAgent: 'unknown' // En un entorno real, obtener de headers
    };

    console.log('[AUDIT] Acción administrativa registrada:', logEntry);

    // En un entorno de producción, esto se guardaría en una tabla de auditoría
    if (supabaseAdmin) {
      try {
        await supabaseAdmin
          .from('admin_audit_log')
          .insert(logEntry);
      } catch (dbError) {
        // Si falla la BD, al menos logueamos en consola
        console.error('[AUDIT] Error guardando en BD, usando fallback:', dbError);
      }
    }
  } catch (error) {
    console.error('[AUDIT] Error registrando acción admin:', error);
  }
}

/**
 * Verifica acceso administrativo general
 */
export async function checkAdminAccess(
  requiredRole: string = 'admin'
): Promise<{
  hasAccess: boolean;
  user?: AdminUser;
  error?: string;
}> {
  try {
    const session = await auth();

    if (!session?.user) {
      return {
        hasAccess: false,
        error: 'Usuario no autenticado'
      };
    }

    // Verificar si es admin
    const isAdmin = session.user.email === 'santiago@xor.com.ar';

    if (!isAdmin) {
      return {
        hasAccess: false,
        error: 'Acceso denegado - Se requieren permisos de administrador'
      };
    }

    return {
      hasAccess: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name || '',
        role: 'admin'
      }
    };
  } catch (error) {
    console.error('[AUTH] Error verificando acceso admin:', error);
    return {
      hasAccess: false,
      error: 'Error verificando acceso'
    };
  }
}

/**
 * Obtiene el perfil completo del usuario autenticado
 */
export async function getUserProfile(userId?: string): Promise<{
  success: boolean;
  profile?: {
    id: string;
    email: string;
    name?: string;
    role: string;
    isAdmin: boolean;
    lastLogin?: string;
    permissions: string[];
  };
  error?: string;
}> {
  try {
    const session = await auth();

    if (!session?.user) {
      return {
        success: false,
        error: 'Usuario no autenticado'
      };
    }

    // Si se especifica un userId diferente, verificar permisos admin
    if (userId && userId !== session.user.id) {
      const isAdmin = session.user.email === 'santiago@xor.com.ar';
      if (!isAdmin) {
        return {
          success: false,
          error: 'Permisos insuficientes para ver perfil de otro usuario'
        };
      }
    }

    const isAdmin = session.user.email === 'santiago@xor.com.ar';

    return {
      success: true,
      profile: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name || '',
        role: isAdmin ? 'admin' : 'user',
        isAdmin,
        lastLogin: new Date().toISOString(), // En producción, obtener de BD
        permissions: isAdmin ? ['read', 'write', 'delete', 'admin'] : ['read']
      }
    };
  } catch (error) {
    console.error('[AUTH] Error obteniendo perfil de usuario:', error);
    return {
      success: false,
      error: 'Error obteniendo perfil'
    };
  }
}

/**
 * Extrae información de autenticación de headers HTTP
 */
export async function getAuthFromHeaders(
  headers: Headers | Record<string, string>
): Promise<{
  success: boolean;
  userId?: string;
  sessionId?: string;
  isAdmin?: boolean;
  error?: string;
}> {
  try {
    // En NextAuth.js, la autenticación se maneja automáticamente
    // Esta función es principalmente para compatibilidad con APIs legacy
    const session = await auth();

    if (!session?.user) {
      return {
        success: false,
        error: 'No se encontró sesión válida en headers'
      };
    }

    const isAdmin = session.user.email === 'santiago@xor.com.ar';

    console.log(`[AUTH] Autenticación extraída de headers para ${session.user.email}`);

    return {
      success: true,
      userId: session.user.id,
      sessionId: session.user.id,
      isAdmin
    };
  } catch (error) {
    console.error('[AUTH] Error extrayendo auth de headers:', error);
    return {
      success: false,
      error: 'Error procesando headers de autenticación'
    };
  }
}









