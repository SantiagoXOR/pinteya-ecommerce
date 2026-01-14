/**
 * Category Service
 * Pinteya E-commerce - Business logic layer for categories
 * 
 * This module provides the service layer for category operations.
 * It uses the repository for data access and adapters for data transformation.
 */

import { CategoryRepository } from './repository'
import {
  toUICategory,
  toUICategories,
  toDBCategory,
  generateCategorySlug,
  isValidCategorySlug,
  getCategoryImage,
  getCategoryUrl,
  getCategoryBreadcrumb,
  buildCategoryHierarchy,
  searchCategories,
  formatCategoryName,
  validateCategory,
} from './adapters'
import type {
  Category,
  CategoryBase,
  CategoryFilters,
  CreateCategoryPayload,
  UpdateCategoryPayload,
  CategoryHierarchy,
} from './types'

/**
 * Category Service
 * Handles all business logic for categories
 */
export class CategoryService {
  private repository: CategoryRepository

  constructor(useAdmin = false) {
    this.repository = new CategoryRepository(useAdmin)
  }

  /**
   * Gets all categories in UI format
   */
  async getCategories(filters?: CategoryFilters): Promise<Category[]> {
    const categories = await this.repository.getAll(filters)
    return toUICategories(categories)
  }

  /**
   * Gets a category by ID in UI format
   */
  async getCategoryById(id: string | number): Promise<Category | null> {
    const categoryId = typeof id === 'string' ? parseInt(id, 10) : id
    if (isNaN(categoryId)) {
      return null
    }

    const category = await this.repository.getById(categoryId)
    if (!category) {
      return null
    }

    return toUICategory(category)
  }

  /**
   * Gets a category by slug in UI format
   */
  async getCategoryBySlug(slug: string): Promise<Category | null> {
    const category = await this.repository.getBySlug(slug)
    if (!category) {
      return null
    }

    return toUICategory(category)
  }

  /**
   * Creates a new category
   */
  async createCategory(payload: CreateCategoryPayload): Promise<Category> {
    // Validate payload
    const validation = validateCategory(payload)
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
    }

    // Generate slug if not provided
    const slug = payload.slug || generateCategorySlug(payload.name)

    // Validate slug
    if (!isValidCategorySlug(slug)) {
      throw new Error('Invalid slug format')
    }

    // Check if slug is already taken
    const slugTaken = await this.repository.isSlugTaken(slug)
    if (slugTaken) {
      throw new Error(`A category with slug "${slug}" already exists`)
    }

    // No crear categorías hijas - forzar parent_id a null
    // Validate parent if provided (aunque no se usará)
    if (payload.parent_id !== null && payload.parent_id !== undefined) {
      // Avisar que no se crearán categorías hijas
      console.warn('parent_id proporcionado pero se ignorará - no se crean categorías hijas')
    }

    // Create category in database - siempre con parent_id = null
    const dbCategory = await this.repository.create({
      name: payload.name,
      slug,
      description: payload.description || null,
      image_url: payload.image_url || null,
      parent_id: null, // Siempre null - no crear categorías hijas
      display_order: payload.display_order || null,
    })

    return toUICategory(dbCategory)
  }

  /**
   * Updates a category
   */
  async updateCategory(
    id: string | number,
    payload: UpdateCategoryPayload
  ): Promise<Category> {
    const categoryId = typeof id === 'string' ? parseInt(id, 10) : id
    if (isNaN(categoryId)) {
      throw new Error('Invalid category ID')
    }

    // Check if category exists
    const existing = await this.repository.getById(categoryId)
    if (!existing) {
      throw new Error(`Category with ID ${id} not found`)
    }

    // Validate slug if provided
    if (payload.slug) {
      if (!isValidCategorySlug(payload.slug)) {
        throw new Error('Invalid slug format')
      }

      // Check if slug is taken by another category
      const slugTaken = await this.repository.isSlugTaken(payload.slug, categoryId)
      if (slugTaken) {
        throw new Error(`A category with slug "${payload.slug}" already exists`)
      }
    }

    // Validate parent if provided
    if (payload.parent_id !== null && payload.parent_id !== undefined) {
      if (payload.parent_id === categoryId) {
        throw new Error('A category cannot be its own parent')
      }

      const parent = await this.repository.getById(payload.parent_id)
      if (!parent) {
        throw new Error(`Parent category with ID ${payload.parent_id} not found`)
      }
    }

    // Update category
    const dbCategory = await this.repository.update(categoryId, {
      name: payload.name,
      slug: payload.slug,
      description: payload.description,
      image_url: payload.image_url,
      parent_id: payload.parent_id,
      display_order: payload.display_order,
    })

    return toUICategory(dbCategory)
  }

  /**
   * Deletes a category
   */
  async deleteCategory(id: string | number): Promise<void> {
    const categoryId = typeof id === 'string' ? parseInt(id, 10) : id
    if (isNaN(categoryId)) {
      throw new Error('Invalid category ID')
    }

    // Check if category exists
    const existing = await this.repository.getById(categoryId)
    if (!existing) {
      throw new Error(`Category with ID ${id} not found`)
    }

    // TODO: Check if category has products before deleting
    // This should be handled by the repository or a separate validation

    await this.repository.delete(categoryId)
  }

  /**
   * Searches categories by name or slug
   */
  async searchCategories(searchTerm: string): Promise<Category[]> {
    if (!searchTerm.trim()) {
      return this.getCategories()
    }

    const categories = await this.repository.getAll({
      search: searchTerm,
    })

    return toUICategories(categories)
  }

  /**
   * Gets category image URL
   */
  getCategoryImage(category: Category | CategoryBase): string {
    return getCategoryImage(category)
  }

  /**
   * Gets category URL for navigation
   */
  getCategoryUrl(category: Category | CategoryBase): string {
    return getCategoryUrl(category)
  }

  /**
   * Gets category breadcrumb
   */
  async getCategoryBreadcrumb(
    categoryId: string | number
  ): Promise<Category[]> {
    const category = await this.getCategoryById(categoryId)
    if (!category) {
      return []
    }

    const allCategories = await this.getCategories()
    const breadcrumb = getCategoryBreadcrumb(category, allCategories)

    return breadcrumb.map(cat => {
      if ('id' in cat && typeof cat.id === 'number') {
        return toUICategory(cat as CategoryBase)
      }
      return cat as Category
    })
  }

  /**
   * Builds category hierarchy tree
   */
  async getCategoryHierarchy(): Promise<CategoryHierarchy[]> {
    const categories = await this.repository.getAll()
    const hierarchy = buildCategoryHierarchy(categories)

    // Add level and path to each category
    const addHierarchyMetadata = (
      cats: Category[],
      level = 0,
      path: string[] = []
    ): CategoryHierarchy[] => {
      return cats.map(cat => ({
        ...cat,
        level,
        path: [...path, cat.id],
        children: cat.children
          ? addHierarchyMetadata(cat.children, level + 1, [...path, cat.id])
          : [],
      }))
    }

    return addHierarchyMetadata(hierarchy)
  }

  /**
   * Formats category name for display
   */
  formatCategoryName(category: Category | CategoryBase): string {
    return formatCategoryName(category)
  }

  /**
   * Gets categories with product counts
   */
  async getCategoriesWithCounts(filters?: CategoryFilters): Promise<Category[]> {
    const categories = await this.repository.getAllWithProductCounts(filters)
    return toUICategories(categories)
  }

  /**
   * Gets the count of categories
   */
  async getCategoryCount(filters?: CategoryFilters): Promise<number> {
    return this.repository.count(filters)
  }
}

/**
 * Creates a new CategoryService instance
 */
export function createCategoryService(useAdmin = false): CategoryService {
  return new CategoryService(useAdmin)
}
