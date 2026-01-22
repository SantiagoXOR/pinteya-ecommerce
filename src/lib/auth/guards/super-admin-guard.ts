// =====================================================
// SUPER ADMIN GUARD
// Descripción: Protección de rutas para super admins
// =====================================================

import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { authOptions } from '@/auth'

export interface SuperAdminGuardResult {
  isSuperAdmin: boolean
  userId: string | null
  userEmail: string | null
  permissions: {
    canCreateTenants: boolean
    canDeleteTenants: boolean
    canManageSuperAdmins: boolean
    canAccessBilling: boolean
    canViewAllAnalytics: boolean
  }
}

/**
 * Verifica si el usuario actual es Super Admin
 * Para usar en Server Components y Route Handlers
 */
export async function checkSuperAdmin(): Promise<SuperAdminGuardResult> {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return {
      isSuperAdmin: false,
      userId: null,
      userEmail: null,
      permissions: {
        canCreateTenants: false,
        canDeleteTenants: false,
        canManageSuperAdmins: false,
        canAccessBilling: false,
        canViewAllAnalytics: false,
      },
    }
  }
  
  const supabase = createAdminClient()
  
  // Verificar si es super admin
  const { data: superAdmin, error } = await supabase
    .from('super_admins')
    .select('*')
    .eq('user_id', session.user.id)
    .single()
  
  if (error || !superAdmin) {
    return {
      isSuperAdmin: false,
      userId: session.user.id,
      userEmail: session.user.email || null,
      permissions: {
        canCreateTenants: false,
        canDeleteTenants: false,
        canManageSuperAdmins: false,
        canAccessBilling: false,
        canViewAllAnalytics: false,
      },
    }
  }
  
  return {
    isSuperAdmin: true,
    userId: session.user.id,
    userEmail: session.user.email || null,
    permissions: {
      canCreateTenants: superAdmin.can_create_tenants ?? true,
      canDeleteTenants: superAdmin.can_delete_tenants ?? true,
      canManageSuperAdmins: superAdmin.can_manage_super_admins ?? false,
      canAccessBilling: superAdmin.can_access_billing ?? true,
      canViewAllAnalytics: superAdmin.can_view_all_analytics ?? true,
    },
  }
}

/**
 * Guard que redirige si no es Super Admin
 * Para usar al inicio de un Server Component
 */
export async function requireSuperAdmin(): Promise<SuperAdminGuardResult> {
  const result = await checkSuperAdmin()
  
  if (!result.isSuperAdmin) {
    redirect('/access-denied?reason=super_admin_required')
  }
  
  return result
}

/**
 * Higher-Order Function para Route Handlers
 */
export function withSuperAdmin<T extends (...args: any[]) => Promise<Response>>(
  handler: (result: SuperAdminGuardResult, ...args: Parameters<T>) => Promise<Response>
): T {
  return (async (...args: Parameters<T>) => {
    const result = await checkSuperAdmin()
    
    if (!result.isSuperAdmin) {
      return new Response(
        JSON.stringify({ error: 'Forbidden', message: 'Super admin access required' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    return handler(result, ...args)
  }) as T
}
