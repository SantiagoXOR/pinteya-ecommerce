/**
 * Category API Server Functions
 * Pinteya E-commerce - Server-side functions for categories
 * 
 * This module provides server-side functions for category operations.
 * These functions use the CategoryService directly and are meant to be used
 * in API routes and server components.
 */

import { createCategoryService } from '../service'
import type {
  CategoryBase,
  Category,
  CategoryFilters,
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from '../types'

/**
 * Gets categories from database (server-side)
 * Uses admin client for full access
 */
export async function getCategoriesFromDB(
  filters?: CategoryFilters,
  useAdmin = true
): Promise<CategoryBase[]> {
  const service = createCategoryService(useAdmin)
  const repository = (service as any).repository as any

  return repository.getAll(filters)
}

/**
 * Gets a category by ID from database (server-side)
 */
export async function getCategoryByIdFromDB(
  id: number,
  useAdmin = true
): Promise<CategoryBase | null> {
  const service = createCategoryService(useAdmin)
  const repository = (service as any).repository as any

  return repository.getById(id)
}

/**
 * Gets a category by slug from database (server-side)
 */
export async function getCategoryBySlugFromDB(
  slug: string,
  useAdmin = true
): Promise<CategoryBase | null> {
  const service = createCategoryService(useAdmin)
  const repository = (service as any).repository as any

  return repository.getBySlug(slug)
}

/**
 * Creates a category in database (server-side, admin only)
 */
export async function createCategoryInDB(
  payload: CreateCategoryPayload,
  useAdmin = true
): Promise<Category> {
  const service = createCategoryService(useAdmin)
  return service.createCategory(payload)
}

/**
 * Updates a category in database (server-side, admin only)
 */
export async function updateCategoryInDB(
  id: number,
  payload: UpdateCategoryPayload,
  useAdmin = true
): Promise<Category> {
  const service = createCategoryService(useAdmin)
  return service.updateCategory(id, payload)
}

/**
 * Deletes a category from database (server-side, admin only)
 */
export async function deleteCategoryFromDB(
  id: number,
  useAdmin = true
): Promise<void> {
  const service = createCategoryService(useAdmin)
  return service.deleteCategory(id)
}

/**
 * Gets categories in UI format (server-side)
 */
export async function getCategories(
  filters?: CategoryFilters,
  useAdmin = false
): Promise<Category[]> {
  const service = createCategoryService(useAdmin)
  return service.getCategories(filters)
}

/**
 * Gets a category by ID in UI format (server-side)
 */
export async function getCategoryById(
  id: string | number,
  useAdmin = false
): Promise<Category | null> {
  const service = createCategoryService(useAdmin)
  return service.getCategoryById(id)
}

/**
 * Gets a category by slug in UI format (server-side)
 */
export async function getCategoryBySlug(
  slug: string,
  useAdmin = false
): Promise<Category | null> {
  const service = createCategoryService(useAdmin)
  return service.getCategoryBySlug(slug)
}

/**
 * Searches categories (server-side)
 */
export async function searchCategories(
  searchTerm: string,
  useAdmin = false
): Promise<Category[]> {
  const service = createCategoryService(useAdmin)
  return service.searchCategories(searchTerm)
}
