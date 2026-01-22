/**
 * Adaptador para createAdminClient. Usado por tenant-service.
 * En tests (NODE_ENV=test) usa global.__TENANT_TEST_SUPABASE_FACTORY__ si existe.
 */

import { createAdminClient as createAdminClientReal } from '@/lib/supabase/server'

declare global {
  var __TENANT_TEST_SUPABASE_FACTORY__: (() => unknown) | undefined
}

export function createAdminClient(): ReturnType<typeof createAdminClientReal> {
  if (
    typeof globalThis !== 'undefined' &&
    process.env.NODE_ENV === 'test' &&
    typeof (globalThis as unknown as { __TENANT_TEST_SUPABASE_FACTORY__?: () => unknown })
      .__TENANT_TEST_SUPABASE_FACTORY__ === 'function'
  ) {
    return (globalThis as unknown as { __TENANT_TEST_SUPABASE_FACTORY__: () => unknown })
      .__TENANT_TEST_SUPABASE_FACTORY__() as ReturnType<typeof createAdminClientReal>
  }
  return createAdminClientReal()
}
