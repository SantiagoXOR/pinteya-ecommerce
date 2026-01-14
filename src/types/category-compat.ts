/**
 * Compatibility Layer for Category Types
 * Pinteya E-commerce - Backward compatibility exports
 * 
 * @deprecated Use @/lib/categories/types instead
 * This file provides backward compatibility during migration
 */

// Re-export from new unified types
export type {
  CategoryBase,
  Category,
  CategoryInsert,
  CategoryUpdate,
} from '@/lib/categories/types'

// Legacy type aliases for backward compatibility
import type { CategoryBase } from '@/lib/categories/types'

/**
 * @deprecated Use CategoryBase from @/lib/categories/types
 */
export type CategoryLegacy = {
  title: string
  id: number
  img: string
}

/**
 * @deprecated Use CategoryDisplay from @/lib/categories/types
 */
export type CategoryDisplay = {
  id: number
  title: string
  img: string
  slug: string
}
