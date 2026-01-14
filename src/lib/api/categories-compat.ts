/**
 * Compatibility Layer for Category API
 * Pinteya E-commerce - Backward compatibility exports
 * 
 * @deprecated Use @/lib/categories/api/client instead
 * This file provides backward compatibility during migration
 */

// Re-export from new unified API client
export {
  fetchCategories as getCategories,
  fetchCategoryById,
  fetchCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
  searchCategories,
} from '@/lib/categories/api/client'

// Legacy function aliases
import { fetchCategories, fetchCategoryBySlug } from '@/lib/categories/api/client'
import type { Category } from '@/lib/categories/types'
import type { ApiResponse } from '@/types/api'

/**
 * @deprecated Use fetchCategories from @/lib/categories/api/client
 */
export async function getMainCategories(): Promise<Category[]> {
  return fetchCategories()
}

/**
 * @deprecated Use fetchCategoryBySlug from @/lib/categories/api/client
 */
export async function getCategoryBySlug(
  slug: string,
  categories?: Category[]
): Promise<Category | null> {
  if (categories) {
    return categories.find(cat => cat.slug === slug) || null
  }
  return fetchCategoryBySlug(slug)
}

/**
 * @deprecated Use fetchCategories with search filter from @/lib/categories/api/client
 */
export async function searchCategories(searchTerm: string): Promise<Category[]> {
  return fetchCategories({ search: searchTerm })
}
