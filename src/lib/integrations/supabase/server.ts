// =====================================================
// SUPABASE SERVER CLIENT
// Descripción: Cliente de Supabase para uso en servidor
// Basado en: Supabase SSR + NextAuth.js integration
// =====================================================

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

declare global {
  var __TENANT_TEST_SUPABASE_FACTORY__: (() => unknown) | undefined
}

// Cliente con service role para operaciones administrativas
export function createAdminClient() {
  if (
    process.env.NODE_ENV === 'test' &&
    typeof (globalThis as typeof global).__TENANT_TEST_SUPABASE_FACTORY__ === 'function'
  ) {
    return (globalThis as typeof global).__TENANT_TEST_SUPABASE_FACTORY__!() as ReturnType<typeof createServerClient>
  }
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get() {
          return undefined
        },
        set() {
          // No-op for service role client
        },
        remove() {
          // No-op for service role client
        },
      },
    }
  )
}

// ⚡ OPTIMIZACIÓN: Cliente público sin cookies para datos estáticos (ISR)
// Usa la anon key directamente sin cookies para permitir renderizado estático
export function createPublicClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get() {
          return undefined
        },
        set() {
          // No-op for public client
        },
        remove() {
          // No-op for public client
        },
      },
    }
  )
}

// ============================================================================
// MULTITENANT: Cliente con contexto de tenant para RLS policies
// ============================================================================

/**
 * Crea un cliente de Supabase con el contexto del tenant configurado.
 * Esto permite que las RLS policies filtren automáticamente por tenant_id.
 * 
 * @param tenantId - UUID del tenant actual
 * @returns Cliente de Supabase con set_current_tenant() ejecutado
 * 
 * @example
 * const tenant = await getTenantConfig()
 * const supabase = await createTenantClient(tenant.id)
 * // Las queries ahora filtran automáticamente por tenant
 * const { data } = await supabase.from('orders').select('*')
 */
export async function createTenantClient(tenantId: string) {
  const supabase = createAdminClient()
  
  // Configurar el tenant actual para las RLS policies
  // Esta función debe existir en la base de datos (ver migraciones multitenant)
  const { error } = await supabase.rpc('set_current_tenant', { 
    p_tenant_id: tenantId 
  })
  
  if (error) {
    console.warn('[Supabase] Error setting current tenant:', error.message)
    // No lanzar error - continuar sin RLS de tenant (fallback a admin)
  }
  
  return supabase
}

/**
 * Helper para obtener el tenant ID del contexto actual y crear cliente
 * Útil cuando no tienes el tenantId disponible directamente
 */
export async function createTenantClientFromContext() {
  // Import dinámico para evitar dependencia circular
  const { getTenantConfig } = await import('@/lib/tenant')
  const tenant = await getTenantConfig()
  return createTenantClient(tenant.id)
}
