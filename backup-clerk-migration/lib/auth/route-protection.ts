/**
 * Sistema de Protección de Rutas con Verificación de Permisos Granulares
 * Middleware para proteger rutas del panel administrativo
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

// =====================================================
// CONFIGURACIÓN DE RUTAS PROTEGIDAS
// =====================================================

export interface RoutePermission {
  path: string;
  requiredPermissions: string[][];
  allowedRoles?: string[];
  requiresAuth?: boolean;
}

// Configuración de permisos por ruta
export const PROTECTED_ROUTES: RoutePermission[] = [
  // Panel administrativo general
  {
    path: '/admin',
    requiredPermissions: [['admin_panel', 'access']],
    allowedRoles: ['admin', 'moderator'],
    requiresAuth: true
  },
  
  // Gestión de productos
  {
    path: '/admin/products',
    requiredPermissions: [['products', 'read']],
    allowedRoles: ['admin', 'moderator'],
    requiresAuth: true
  },
  {
    path: '/admin/products/new',
    requiredPermissions: [['products', 'create']],
    allowedRoles: ['admin', 'moderator'],
    requiresAuth: true
  },
  {
    path: '/admin/products/[id]/edit',
    requiredPermissions: [['products', 'update']],
    allowedRoles: ['admin', 'moderator'],
    requiresAuth: true
  },
  
  // Gestión de órdenes
  {
    path: '/admin/orders',
    requiredPermissions: [['orders', 'read']],
    allowedRoles: ['admin', 'moderator'],
    requiresAuth: true
  },
  {
    path: '/admin/orders/[id]',
    requiredPermissions: [['orders', 'read']],
    allowedRoles: ['admin', 'moderator'],
    requiresAuth: true
  },
  
  // Gestión de usuarios
  {
    path: '/admin/users',
    requiredPermissions: [['users', 'read']],
    allowedRoles: ['admin'],
    requiresAuth: true
  },
  {
    path: '/admin/users/[id]',
    requiredPermissions: [['users', 'read']],
    allowedRoles: ['admin'],
    requiresAuth: true
  },
  
  // Analytics
  {
    path: '/admin/analytics',
    requiredPermissions: [['analytics', 'read']],
    allowedRoles: ['admin', 'moderator'],
    requiresAuth: true
  },
  
  // Configuración del sistema
  {
    path: '/admin/settings',
    requiredPermissions: [['settings', 'read']],
    allowedRoles: ['admin'],
    requiresAuth: true
  }
];

// =====================================================
// FUNCIONES DE VERIFICACIÓN
// =====================================================

/**
 * Verifica si una ruta coincide con un patrón
 */
function matchRoute(pathname: string, pattern: string): boolean {
  // Convertir patrón de Next.js a regex
  const regexPattern = pattern
    .replace(/\[([^\]]+)\]/g, '([^/]+)') // [id] -> ([^/]+)
    .replace(/\//g, '\\/'); // Escapar barras
  
  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(pathname);
}

/**
 * Encuentra la configuración de ruta para un pathname
 */
function findRouteConfig(pathname: string): RoutePermission | null {
  return PROTECTED_ROUTES.find(route => matchRoute(pathname, route.path)) || null;
}

/**
 * Obtiene el perfil de usuario desde Supabase
 */
async function getUserProfileByClerkId(clerkUserId: string) {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not available');
    }

    const { data: profile, error } = await supabaseAdmin
      .from('user_profiles')
      .select(`
        *,
        user_roles (
          id,
          role_name,
          display_name,
          permissions,
          is_active
        )
      `)
      .eq('clerk_user_id', clerkUserId)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return profile;
  } catch (error) {
    console.error('Error in getUserProfileByClerkId:', error);
    return null;
  }
}

/**
 * Verifica si un usuario tiene un permiso específico
 */
function hasPermission(userProfile: any, permissionPath: string[]): boolean {
  try {
    if (!userProfile.user_roles || !userProfile.user_roles.permissions) {
      return false;
    }

    let current: any = userProfile.user_roles.permissions;
    
    for (const path of permissionPath) {
      if (current[path] === undefined) {
        return false;
      }
      current = current[path];
    }

    // Manejar diferentes tipos de valores de permisos
    if (typeof current === 'boolean') {
      return current;
    }
    
    if (typeof current === 'string') {
      return current !== 'false';
    }

    return false;
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

/**
 * Verifica si un usuario tiene alguno de los permisos requeridos
 */
function hasAnyPermission(userProfile: any, permissions: string[][]): boolean {
  return permissions.some(permission => hasPermission(userProfile, permission));
}

// =====================================================
// MIDDLEWARE PRINCIPAL
// =====================================================

/**
 * Middleware de protección de rutas administrativas
 */
export async function protectAdminRoute(request: NextRequest): Promise<NextResponse | null> {
  const pathname = request.nextUrl.pathname;
  
  // Verificar si la ruta necesita protección
  const routeConfig = findRouteConfig(pathname);
  
  if (!routeConfig) {
    // Ruta no protegida, permitir acceso
    return null;
  }

  try {
    // 1. Verificar autenticación con Clerk
    const { userId } = auth();
    
    if (routeConfig.requiresAuth && !userId) {
      // Redirigir a login
      const loginUrl = new URL('/sign-in', request.url);
      loginUrl.searchParams.set('redirect_url', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (!userId) {
      return null; // No autenticado pero ruta no requiere auth
    }

    // 2. Obtener perfil de usuario
    const userProfile = await getUserProfileByClerkId(userId);
    
    if (!userProfile) {
      // Usuario no encontrado en base de datos
      const errorUrl = new URL('/auth/profile-setup', request.url);
      return NextResponse.redirect(errorUrl);
    }

    // 3. Verificar rol permitido
    if (routeConfig.allowedRoles && routeConfig.allowedRoles.length > 0) {
      const userRole = userProfile.user_roles?.role_name;
      
      if (!userRole || !routeConfig.allowedRoles.includes(userRole)) {
        // Rol no permitido
        const forbiddenUrl = new URL('/403', request.url);
        return NextResponse.redirect(forbiddenUrl);
      }
    }

    // 4. Verificar permisos específicos
    if (routeConfig.requiredPermissions && routeConfig.requiredPermissions.length > 0) {
      const hasRequiredPermissions = hasAnyPermission(userProfile, routeConfig.requiredPermissions);
      
      if (!hasRequiredPermissions) {
        // Permisos insuficientes
        const forbiddenUrl = new URL('/403', request.url);
        return NextResponse.redirect(forbiddenUrl);
      }
    }

    // 5. Agregar headers con información del usuario (opcional)
    const response = NextResponse.next();
    response.headers.set('x-user-id', userProfile.id);
    response.headers.set('x-user-role', userProfile.user_roles?.role_name || 'customer');
    
    return response;

  } catch (error) {
    console.error('Error in protectAdminRoute:', error);
    
    // En caso de error, redirigir a página de error
    const errorUrl = new URL('/500', request.url);
    return NextResponse.redirect(errorUrl);
  }
}

// =====================================================
// UTILIDADES PARA COMPONENTES
// =====================================================

/**
 * Hook para verificar permisos en componentes
 */
export function useRoutePermissions(pathname: string) {
  const routeConfig = findRouteConfig(pathname);
  
  return {
    isProtected: !!routeConfig,
    requiredPermissions: routeConfig?.requiredPermissions || [],
    allowedRoles: routeConfig?.allowedRoles || [],
    requiresAuth: routeConfig?.requiresAuth || false
  };
}

/**
 * Verifica si un usuario puede acceder a una ruta específica
 */
export function canAccessRoute(
  pathname: string,
  userProfile: any
): { canAccess: boolean; reason?: string } {
  const routeConfig = findRouteConfig(pathname);
  
  if (!routeConfig) {
    return { canAccess: true };
  }

  // Verificar rol
  if (routeConfig.allowedRoles && routeConfig.allowedRoles.length > 0) {
    const userRole = userProfile?.user_roles?.role_name;
    
    if (!userRole || !routeConfig.allowedRoles.includes(userRole)) {
      return { 
        canAccess: false, 
        reason: `Rol requerido: ${routeConfig.allowedRoles.join(' o ')}` 
      };
    }
  }

  // Verificar permisos
  if (routeConfig.requiredPermissions && routeConfig.requiredPermissions.length > 0) {
    const hasRequiredPermissions = hasAnyPermission(userProfile, routeConfig.requiredPermissions);
    
    if (!hasRequiredPermissions) {
      return { 
        canAccess: false, 
        reason: 'Permisos insuficientes' 
      };
    }
  }

  return { canAccess: true };
}

// =====================================================
// CONFIGURACIÓN PARA MIDDLEWARE.TS
// =====================================================

/**
 * Lista de rutas que deben ser procesadas por el middleware
 */
export const MIDDLEWARE_PATHS = [
  '/admin/:path*',
  '/dashboard/:path*'
];

/**
 * Lista de rutas públicas que no requieren verificación
 */
export const PUBLIC_ROUTES = [
  '/',
  '/shop',
  '/search',
  '/product/:path*',
  '/category/:path*',
  '/about',
  '/contact',
  '/sign-in',
  '/sign-up',
  '/auth/:path*',
  '/api/auth/:path*',
  '/api/public/:path*'
];
