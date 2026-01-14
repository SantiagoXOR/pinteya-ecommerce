/**
 * useCategoryData Hook (DEPRECATED)
 * Manages category data fetching, caching, and state
 * Pinteya E-commerce - Enterprise-ready implementation
 * 
 * @deprecated Use @/lib/categories/hooks/useCategories instead
 * This file provides backward compatibility during migration
 * 
 * This hook will be removed in a future version.
 * Please migrate to: import { useCategories } from '@/lib/categories/hooks'
 */

// Re-export from new unified hook
export { useCategories as useCategoryData } from '@/lib/categories/hooks/useCategories'
export type { UseCategoriesReturn as UseCategoryDataReturn } from '@/lib/categories/hooks/useCategories'

// Legacy type exports
export type { Category } from '@/lib/categories/types'

// Legacy options interface for backward compatibility
export interface UseCategoryDataOptions {
  autoFetch?: boolean
  cacheDuration?: number
  enableBackgroundRefresh?: boolean
  refreshInterval?: number
  maxCategories?: number
  enableAnalytics?: boolean
  fallbackCategories?: any[]
  apiEndpoint?: string
}
