/**
 * useCategories Hook (DEPRECATED)
 * Pinteya E-commerce - Hook for fetching categories
 * 
 * @deprecated Use @/lib/categories/hooks/useCategories instead
 * This file provides backward compatibility during migration
 * 
 * This hook will be removed in a future version.
 * Please migrate to: import { useCategories } from '@/lib/categories/hooks'
 */

// Re-export from new unified hook
export { useCategories, categoryQueryKeys } from '@/lib/categories/hooks/useCategories'
export type { UseCategoriesOptions, UseCategoriesReturn } from '@/lib/categories/hooks/useCategories'

// Legacy helper function for backward compatibility
import { useCategories as useCategoriesNew } from '@/lib/categories/hooks/useCategories'

/**
 * @deprecated Use useCategories from @/lib/categories/hooks
 * Legacy hook for getting categories for filters
 */
export function useCategoriesForFilters() {
  return useCategoriesNew()
}
