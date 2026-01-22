// =====================================================
// AUTH GUARDS - EXPORTS
// =====================================================

export {
  checkSuperAdmin,
  requireSuperAdmin,
  withSuperAdmin,
  type SuperAdminGuardResult,
} from './super-admin-guard'

export {
  checkTenantAdmin,
  requireTenantAdmin,
  checkTenantPermission,
  withTenantAdmin,
  withTenantPermission,
  type TenantAdminGuardResult,
  type TenantUserRole,
  type TenantPermissions,
} from './tenant-admin-guard'
