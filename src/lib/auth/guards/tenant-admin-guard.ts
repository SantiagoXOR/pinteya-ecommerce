// =====================================================
// TENANT ADMIN GUARD
// Descripción: Protección de rutas para admins de tenant
// =====================================================

import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { authOptions } from '@/auth'
import { getTenantConfig } from '@/lib/tenant'
import { checkSuperAdmin } from './super-admin-guard'
import { isUserAdmin } from '@/lib/auth/role-service'

export type TenantUserRole = 'super_admin' | 'tenant_owner' | 'tenant_admin' | 'tenant_staff' | 'customer'

export interface TenantPermissions {
  orders: { view: boolean; create: boolean; edit: boolean; delete: boolean; export: boolean }
  products: { view: boolean; create: boolean; edit: boolean; delete: boolean; import: boolean }
  customers: { view: boolean; edit: boolean; export: boolean }
  analytics: { view: boolean; export: boolean }
  settings: { view: boolean; edit: boolean }
  integrations: { view: boolean; edit: boolean }
  marketing: { view: boolean; edit: boolean }
}

export interface TenantAdminGuardResult {
  isAuthorized: boolean
  userId: string | null
  userEmail: string | null
  tenantId: string
  tenantSlug: string
  role: TenantUserRole
  permissions: TenantPermissions
  isSuperAdmin: boolean
}

const DEFAULT_PERMISSIONS: TenantPermissions = {
  orders: { view: false, create: false, edit: false, delete: false, export: false },
  products: { view: false, create: false, edit: false, delete: false, import: false },
  customers: { view: false, edit: false, export: false },
  analytics: { view: false, export: false },
  settings: { view: false, edit: false },
  integrations: { view: false, edit: false },
  marketing: { view: false, edit: false },
}

const FULL_PERMISSIONS: TenantPermissions = {
  orders: { view: true, create: true, edit: true, delete: true, export: true },
  products: { view: true, create: true, edit: true, delete: true, import: true },
  customers: { view: true, edit: true, export: true },
  analytics: { view: true, export: true },
  settings: { view: true, edit: true },
  integrations: { view: true, edit: true },
  marketing: { view: true, edit: true },
}

/**
 * Verifica si el usuario tiene acceso de administración al tenant actual
 */
export async function checkTenantAdmin(): Promise<TenantAdminGuardResult> {
  const session = await getServerSession(authOptions)
  const tenant = await getTenantConfig()
  
  // Base result para usuarios no autenticados
  const baseResult = {
    isAuthorized: false,
    userId: null,
    userEmail: null,
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
    role: 'customer' as TenantUserRole,
    permissions: DEFAULT_PERMISSIONS,
    isSuperAdmin: false,
  }
  
  if (!session?.user?.id) {
    return baseResult
  }
  
  // Verificar si es super admin (tiene acceso a todo)
  const superAdminResult = await checkSuperAdmin()
  if (superAdminResult.isSuperAdmin) {
    return {
      isAuthorized: true,
      userId: session.user.id,
      userEmail: session.user.email || null,
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      role: 'super_admin',
      permissions: FULL_PERMISSIONS,
      isSuperAdmin: true,
    }
  }
  
  const supabase = createAdminClient()
  
  // Buscar rol del usuario en este tenant
  const { data: userRole, error } = await supabase
    .from('tenant_user_roles')
    .select('role, permissions, is_active')
    .eq('user_id', session.user.id)
    .eq('tenant_id', tenant.id)
    .eq('is_active', true)
    .single()
  
  if (error || !userRole) {
    // Fallback: usuarios con role admin en user_profiles (legacy) tienen acceso al tenant actual.
    // Las tablas super_admins y tenant_user_roles pueden estar vacías tras el deploy multitenant.
    try {
      const legacyAdmin = await isUserAdmin(session.user.id)
      if (legacyAdmin) {
        return {
          isAuthorized: true,
          userId: session.user.id,
          userEmail: session.user.email || null,
          tenantId: tenant.id,
          tenantSlug: tenant.slug,
          role: 'tenant_admin' as TenantUserRole,
          permissions: FULL_PERMISSIONS,
          isSuperAdmin: false,
        }
      }
    } catch {
      // isUserAdmin falló; seguir con no autorizado
    }
    return {
      ...baseResult,
      userId: session.user.id,
      userEmail: session.user.email || null,
    }
  }
  
  const role = userRole.role as TenantUserRole
  
  // Verificar si tiene rol de admin
  const isAdmin = ['tenant_owner', 'tenant_admin', 'tenant_staff'].includes(role)
  
  // Parsear permisos (pueden ser JSON o usar defaults por rol)
  let permissions: TenantPermissions = DEFAULT_PERMISSIONS
  
  if (role === 'tenant_owner' || role === 'tenant_admin') {
    permissions = FULL_PERMISSIONS
  } else if (userRole.permissions) {
    permissions = userRole.permissions as TenantPermissions
  }
  
  return {
    isAuthorized: isAdmin,
    userId: session.user.id,
    userEmail: session.user.email || null,
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
    role,
    permissions,
    isSuperAdmin: false,
  }
}

/**
 * Guard que redirige si no tiene acceso de admin al tenant
 */
export async function requireTenantAdmin(): Promise<TenantAdminGuardResult> {
  const result = await checkTenantAdmin()
  
  if (!result.isAuthorized) {
    redirect('/access-denied?reason=tenant_admin_required')
  }
  
  return result
}

/**
 * Verifica un permiso específico del usuario
 */
export async function checkTenantPermission(
  resource: keyof TenantPermissions,
  action: string
): Promise<boolean> {
  const result = await checkTenantAdmin()
  
  if (!result.isAuthorized) {
    return false
  }
  
  const resourcePermissions = result.permissions[resource]
  if (!resourcePermissions) {
    return false
  }
  
  return (resourcePermissions as Record<string, boolean>)[action] ?? false
}

/**
 * Higher-Order Function para Route Handlers
 */
export function withTenantAdmin<T extends (...args: any[]) => Promise<Response>>(
  handler: (result: TenantAdminGuardResult, ...args: Parameters<T>) => Promise<Response>
): T {
  return (async (...args: Parameters<T>) => {
    const result = await checkTenantAdmin()
    
    if (!result.isAuthorized) {
      return new Response(
        JSON.stringify({ error: 'Forbidden', message: 'Tenant admin access required' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    return handler(result, ...args)
  }) as T
}

/**
 * Higher-Order Function para verificar permisos específicos
 */
export function withTenantPermission<T extends (...args: any[]) => Promise<Response>>(
  resource: keyof TenantPermissions,
  action: string,
  handler: (result: TenantAdminGuardResult, ...args: Parameters<T>) => Promise<Response>
): T {
  return (async (...args: Parameters<T>) => {
    const result = await checkTenantAdmin()
    
    if (!result.isAuthorized) {
      return new Response(
        JSON.stringify({ error: 'Forbidden', message: 'Access denied' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    const resourcePermissions = result.permissions[resource]
    const hasPermission = resourcePermissions && 
      (resourcePermissions as Record<string, boolean>)[action]
    
    if (!hasPermission) {
      return new Response(
        JSON.stringify({ 
          error: 'Forbidden', 
          message: `Permission denied: ${resource}.${action}` 
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    return handler(result, ...args)
  }) as T
}
