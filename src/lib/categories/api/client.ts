/**
 * Category API Client
 * Pinteya E-commerce - Frontend API client for categories
 * 
 * This module provides functions to interact with category APIs from the frontend.
 * It handles HTTP requests and error handling.
 */

import type {
  Category,
  CategoryFilters,
  CategoryApiResponse,
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from '../types'

/**
 * Fetches all categories from the API
 */
export async function fetchCategories(
  filters?: CategoryFilters
): Promise<Category[]> {
  try {
    const searchParams = new URLSearchParams()

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString())
        }
      })
    }

    const response = await fetch(`/api/categories?${searchParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }))
      throw new Error(error.error || `Failed to fetch categories: ${response.statusText}`)
    }

    const result: CategoryApiResponse<Category[]> = await response.json()

    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch categories')
    }

    return result.data || []
  } catch (error) {
    console.error('Error fetching categories:', error)
    throw error
  }
}

/**
 * Fetches a category by ID
 */
export async function fetchCategoryById(id: string | number): Promise<Category | null> {
  try {
    const response = await fetch(`/api/categories/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })

    if (response.status === 404) {
      return null
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }))
      throw new Error(error.error || `Failed to fetch category: ${response.statusText}`)
    }

    const result: CategoryApiResponse<Category> = await response.json()

    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch category')
    }

    return result.data || null
  } catch (error) {
    console.error(`Error fetching category ${id}:`, error)
    throw error
  }
}

/**
 * Fetches a category by slug
 */
export async function fetchCategoryBySlug(slug: string): Promise<Category | null> {
  try {
    const categories = await fetchCategories({ search: slug })
    return categories.find(cat => cat.slug === slug) || null
  } catch (error) {
    console.error(`Error fetching category by slug ${slug}:`, error)
    throw error
  }
}

/**
 * Creates a new category (admin only)
 */
export async function createCategory(
  payload: CreateCategoryPayload
): Promise<Category> {
  try {
    const response = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }))
      throw new Error(error.error || `Failed to create category: ${response.statusText}`)
    }

    const result: CategoryApiResponse<Category> = await response.json()

    if (!result.success) {
      throw new Error(result.error || 'Failed to create category')
    }

    return result.data
  } catch (error) {
    console.error('Error creating category:', error)
    throw error
  }
}

/**
 * Updates a category (admin only)
 */
export async function updateCategory(
  id: string | number,
  payload: UpdateCategoryPayload
): Promise<Category> {
  try {
    const response = await fetch(`/api/admin/categories/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }))
      throw new Error(error.error || `Failed to update category: ${response.statusText}`)
    }

    const result: CategoryApiResponse<Category> = await response.json()

    if (!result.success) {
      throw new Error(result.error || 'Failed to update category')
    }

    return result.data
  } catch (error) {
    console.error(`Error updating category ${id}:`, error)
    throw error
  }
}

/**
 * Deletes a category (admin only)
 */
export async function deleteCategory(id: string | number): Promise<void> {
  try {
    const response = await fetch(`/api/admin/categories/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }))
      throw new Error(error.error || `Failed to delete category: ${response.statusText}`)
    }

    const result: CategoryApiResponse<null> = await response.json()

    if (!result.success) {
      throw new Error(result.error || 'Failed to delete category')
    }
  } catch (error) {
    console.error(`Error deleting category ${id}:`, error)
    throw error
  }
}

/**
 * Searches categories
 */
export async function searchCategories(searchTerm: string): Promise<Category[]> {
  return fetchCategories({ search: searchTerm })
}
