/**
 * Utilidades de autenticación usando Supabase Auth directamente
 * Reemplazo para enterprise-auth-utils.ts que evita conflictos con Clerk
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyToken } from '@clerk/backend';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Cliente admin para operaciones del servidor
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Tipos para autenticación
export interface AuthResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    role: string;
    permissions: Record<string, any>;
  };
  supabase?: any;
  error?: string;
  status?: number;
}

// Rate limiting simple en memoria (para producción usar Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

/**
 * Verificar rate limiting
 */
function checkRateLimit(identifier: string, maxRequests = 100, windowMs = 60000): boolean {
  const now = Date.now();
  const key = identifier;
  
  const current = rateLimitMap.get(key);
  
  if (!current || now > current.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (current.count >= maxRequests) {
    return false;
  }
  
  current.count++;
  return true;
}

/**
 * Obtener usuario autenticado desde JWT token (Clerk o Supabase)
 */
async function getAuthenticatedUser(request: NextRequest): Promise<AuthResult> {
  try {
    // Obtener token del header Authorization
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        success: false,
        error: 'Token de autorización requerido',
        status: 401
      };
    }

    const token = authHeader.substring(7); // Remover "Bearer "

    // Intentar verificar con Clerk primero
    try {
      const clerkPayload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY!
      });

      if (clerkPayload && clerkPayload.sub) {
        // Token de Clerk válido, buscar usuario en Supabase
        const supabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!);

        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select(`
            id,
            email,
            supabase_user_id,
            user_roles (
              role_name
            )
          `)
          .eq('clerk_user_id', clerkPayload.sub)
          .single();

        if (profileError || !profile) {
          console.error('❌ Error obteniendo perfil de usuario:', {
            clerkUserId: clerkPayload.sub,
            profileError: profileError?.message,
            profile
          });
          return {
            success: false,
            error: 'Usuario no encontrado en el sistema',
            status: 401
          };
        }

        console.log('✅ Usuario encontrado:', {
          email: profile.email,
          role: profile.user_roles?.role_name,
          clerkId: clerkPayload.sub
        });

        // Crear objeto user compatible
        const user = {
          id: profile.supabase_user_id,
          email: profile.email,
          clerk_id: clerkPayload.sub
        };

        const isAdmin = profile.user_roles?.role_name === 'admin';

        console.log('🔐 Verificación de admin:', {
          isAdmin,
          roleName: profile.user_roles?.role_name
        });

        return {
          success: true,
          user,
          supabase,
          isAdmin
        };
      }
    } catch (clerkError) {
      console.log('Token no es de Clerk, intentando con Supabase...');
    }

    // Si no es token de Clerk, intentar con Supabase
    const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

    // Verificar el token JWT de Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return {
        success: false,
        error: 'Token inválido o expirado',
        status: 401
      };
    }

    // Obtener perfil y rol del usuario usando service role key
    const supabaseAdmin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select(`
        id,
        email,
        role_id,
        is_active,
        user_roles (
          role_name,
          permissions
        )
      `)
      .eq('supabase_user_id', user.id)
      .eq('is_active', true)
      .single();

    if (profileError || !profile) {
      return {
        success: false,
        error: 'Perfil de usuario no encontrado',
        status: 403
      };
    }

    return {
      success: true,
      user: {
        id: user.id,
        email: profile.email,
        role: profile.user_roles?.role_name || 'customer',
        permissions: profile.user_roles?.permissions || {}
      },
      supabase: supabaseAdmin
    };

  } catch (error) {
    console.error('Error en autenticación:', error);
    return {
      success: false,
      error: 'Error interno de autenticación',
      status: 500
    };
  }
}

/**
 * Verificar si el usuario tiene rol de administrador
 */
export async function requireAdminAuth(request: NextRequest): Promise<AuthResult> {
  try {
    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    if (!checkRateLimit(`admin_${clientIP}`, 50, 60000)) {
      return {
        success: false,
        error: 'Demasiadas solicitudes',
        status: 429
      };
    }

    // Autenticar usuario
    const authResult = await getAuthenticatedUser(request);
    
    if (!authResult.success) {
      return authResult;
    }

    // Verificar rol de administrador
    console.log('🔍 Verificando permisos de admin:', {
      user: authResult.user,
      isAdmin: authResult.isAdmin,
      userRole: authResult.user?.role
    });

    // Verificar usando isAdmin (para tokens Clerk) o role (para tokens Supabase)
    const hasAdminAccess = authResult.isAdmin || authResult.user?.role === 'admin';

    if (!hasAdminAccess) {
      console.warn('❌ Acceso denegado:', {
        isAdmin: authResult.isAdmin,
        userRole: authResult.user?.role,
        email: authResult.user?.email
      });

      return {
        success: false,
        error: 'Acceso denegado: se requiere rol de administrador',
        status: 403
      };
    }

    console.log('✅ Acceso de admin autorizado para:', authResult.user?.email);

    return authResult;

  } catch (error) {
    console.error('Error en requireAdminAuth:', error);
    return {
      success: false,
      error: 'Error interno del servidor',
      status: 500
    };
  }
}

/**
 * Verificar permisos específicos
 */
export async function checkPermission(
  request: NextRequest, 
  resource: string, 
  action: string
): Promise<AuthResult> {
  try {
    const authResult = await requireAdminAuth(request);
    
    if (!authResult.success) {
      return authResult;
    }

    const permissions = authResult.user?.permissions;
    
    if (!permissions || !permissions[resource] || !permissions[resource][action]) {
      return {
        success: false,
        error: `Permiso denegado: ${resource}.${action}`,
        status: 403
      };
    }

    return authResult;

  } catch (error) {
    console.error('Error en checkPermission:', error);
    return {
      success: false,
      error: 'Error interno del servidor',
      status: 500
    };
  }
}

/**
 * Logging de acciones administrativas
 */
export async function logAdminAction(
  userId: string,
  action: string,
  resource: string,
  resourceId?: string,
  oldData?: any,
  newData?: any
): Promise<void> {
  try {
    await supabaseAdmin
      .from('admin_audit_log')
      .insert({
        user_id: userId,
        action,
        resource,
        resource_id: resourceId,
        old_data: oldData,
        new_data: newData,
        timestamp: new Date().toISOString(),
        ip_address: 'server',
        user_agent: 'admin-api'
      });
  } catch (error) {
    console.error('Error logging admin action:', error);
  }
}

/**
 * Validar y sanitizar input
 */
export function validateInput(data: any, allowedFields: string[]): any {
  if (!data || typeof data !== 'object') {
    throw new Error('Datos inválidos');
  }

  const sanitized: any = {};
  
  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      sanitized[field] = data[field];
    }
  }

  return sanitized;
}

/**
 * Middleware wrapper para APIs admin
 */
export function withAdminAuth(handler: (request: NextRequest, authResult: AuthResult) => Promise<Response>) {
  return async (request: NextRequest) => {
    const authResult = await requireAdminAuth(request);
    
    if (!authResult.success) {
      return new Response(
        JSON.stringify({
          error: authResult.error,
          timestamp: new Date().toISOString()
        }),
        {
          status: authResult.status || 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return handler(request, authResult);
  };
}

/**
 * Obtener métricas de seguridad
 */
export async function getSecurityMetrics(): Promise<any> {
  try {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    
    // Contar solicitudes por IP en la última hora
    const rateLimitStats = Array.from(rateLimitMap.entries())
      .filter(([_, data]) => data.resetTime > oneHourAgo)
      .reduce((acc, [ip, data]) => {
        acc.totalRequests += data.count;
        acc.uniqueIPs++;
        return acc;
      }, { totalRequests: 0, uniqueIPs: 0 });

    return {
      rateLimiting: rateLimitStats,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error obteniendo métricas de seguridad:', error);
    return null;
  }
}
