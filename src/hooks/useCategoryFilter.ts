/**
 * useCategoryFilter Hook (DEPRECATED)
 * Manages category filter state and logic
 * Pinteya E-commerce - Enterprise-ready implementation
 * 
 * @deprecated Use @/lib/categories/hooks/useCategoryFilter instead
 * This file provides backward compatibility during migration
 * 
 * This hook will be removed in a future version.
 * Please migrate to: import { useCategoryFilter } from '@/lib/categories/hooks'
 */

// Re-export from new unified hook
export { useCategoryFilter } from '@/lib/categories/hooks/useCategoryFilter'
export type { UseCategoryFilterOptions, UseCategoryFilterReturn } from '@/lib/categories/hooks/useCategoryFilter'

// Legacy type exports for backward compatibility
export type { CategoryId, CategoryChangeEvent } from '@/lib/categories/types'

/**
 * Type guard to check if a value is a valid CategoryId
 */
export const isCategoryId = (value: unknown): value is string => {
  return typeof value === 'string' && value.length > 0
}

/**
 * Utility to validate category IDs array
 */
export const validateCategoryIds = (categoryIds: unknown[]): string[] => {
  return categoryIds.filter(isCategoryId)
}

/**
 * Default export for convenience
 */
export { useCategoryFilter as default } from '@/lib/categories/hooks/useCategoryFilter'
