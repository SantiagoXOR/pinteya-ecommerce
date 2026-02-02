// =====================================================
// TENANT MODULE - EXPORTS
// =====================================================

// Types
export type {
  TenantConfig,
  TenantPublicConfig,
  TenantDBRow,
  TenantContext,
} from './types'

// Server-side service
export {
  getTenantConfig,
  getTenantPublicConfig,
  getTenantBySlug,
  getTenantById,
  getAllTenants,
  getTenantBaseUrl,
  isAdminRequest,
} from './tenant-service'

export { formatBusinessHours } from './format-business-hours'
export type { BusinessHoursInput } from './format-business-hours'
