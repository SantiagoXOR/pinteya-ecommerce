/**
 * Compatibility Layer for useCategories Hook
 * Pinteya E-commerce - Backward compatibility exports
 * 
 * @deprecated Use @/lib/categories/hooks/useCategories instead
 * This file provides backward compatibility during migration
 */

// Re-export from new unified hook
export { useCategories, categoryQueryKeys } from '@/lib/categories/hooks/useCategories'
export type { UseCategoriesOptions, UseCategoriesReturn } from '@/lib/categories/hooks/useCategories'
