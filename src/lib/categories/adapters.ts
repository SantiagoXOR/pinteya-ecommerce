/**
 * Category Adapters
 * Pinteya E-commerce - Transform category data between DB and UI formats
 * 
 * This module provides adapters to transform categories between:
 * - Database format (CategoryBase): id as number, image_url field
 * - UI format (Category): id as string, icon field (from image_url)
 */

import type { CategoryBase, Category, CategoryInsert, CategoryUpdate, CategoryId } from './types'

// ===================================
// ID NORMALIZATION
// ===================================

/**
 * Normalizes category ID to string format
 * Handles both number and string IDs
 */
export function normalizeCategoryId(id: number | string | null | undefined): string {
  if (id === null || id === undefined) {
    return ''
  }
  return String(id)
}

/**
 * Converts string ID back to number (for DB operations)
 * Returns null if invalid
 */
export function denormalizeCategoryId(id: string | number | null | undefined): number | null {
  if (id === null || id === undefined) {
    return null
  }
  if (typeof id === 'number') {
    return id
  }
  const parsed = parseInt(id, 10)
  return isNaN(parsed) ? null : parsed
}

// ===================================
// IMAGE FIELD HANDLING
// ===================================

/**
 * Gets the image URL from a category
 * Handles both image_url (DB) and icon (UI) fields
 */
export function getCategoryImage(category: CategoryBase | Category | { image_url?: string | null; icon?: string }): string {
  // Check for image_url (DB format)
  if ('image_url' in category && category.image_url) {
    return category.image_url
  }
  // Check for icon (UI format)
  if ('icon' in category && category.icon) {
    return category.icon
  }
  // Default fallback
  return '/images/categories/default.jpg'
}

/**
 * Sets the image URL on a category
 * Updates both image_url and icon fields if present
 */
export function setCategoryImage(
  category: Partial<CategoryBase> | Partial<Category>,
  imageUrl: string | null
): void {
  if ('image_url' in category) {
    category.image_url = imageUrl
  }
  if ('icon' in category) {
    category.icon = imageUrl || '/images/categories/default.jpg'
  }
}

// ===================================
// DB TO UI TRANSFORMATION
// ===================================

/**
 * Transforms a database category to UI format
 * - Converts id from number to string
 * - Maps image_url to icon
 * - Normalizes field names (snake_case to camelCase)
 */
export function toUICategory(category: CategoryBase): Category {
  return {
    id: normalizeCategoryId(category.id),
    name: category.name,
    slug: category.slug,
    icon: getCategoryImage(category),
    description: category.description || undefined,
    count: category.products_count,
    isAvailable: true, // Default to available
    parentId: category.parent_id ? normalizeCategoryId(category.parent_id) : null,
    createdAt: category.created_at,
    updatedAt: category.updated_at || undefined,
    displayOrder: category.display_order || undefined,
    children: [], // Will be populated if building hierarchy
  }
}

/**
 * Transforms multiple database categories to UI format
 */
export function toUICategories(categories: CategoryBase[]): Category[] {
  return categories.map(toUICategory)
}

// ===================================
// UI TO DB TRANSFORMATION
// ===================================

/**
 * Transforms a UI category to database format
 * - Converts id from string to number
 * - Maps icon to image_url
 * - Normalizes field names (camelCase to snake_case)
 */
export function toDBCategory(category: Partial<Category>): CategoryInsert | CategoryUpdate {
  const dbId = denormalizeCategoryId(category.id)
  const dbParentId = category.parentId ? denormalizeCategoryId(category.parentId) : null

  const base = {
    name: category.name || '',
    slug: category.slug || '',
    description: category.description || null,
    image_url: category.icon || null,
    parent_id: dbParentId,
    display_order: category.displayOrder || null,
  }

  // If ID is provided, include it (for updates)
  if (dbId !== null) {
    return {
      ...base,
      id: dbId,
      updated_at: category.updatedAt || new Date().toISOString(),
    } as CategoryUpdate
  }

  // For inserts, don't include id (will be auto-generated)
  return {
    ...base,
    created_at: category.createdAt || new Date().toISOString(),
    updated_at: category.updatedAt || new Date().toISOString(),
  } as CategoryInsert
}

// ===================================
// SLUG GENERATION
// ===================================

/**
 * Generates a URL-friendly slug from a category name
 */
export function generateCategorySlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/(^-|-$)/g, '') // Remove leading/trailing hyphens
    .substring(0, 100) // Limit length
}

/**
 * Validates a category slug format
 */
export function isValidCategorySlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug) && slug.length > 0 && slug.length <= 100
}

// ===================================
// URL GENERATION
// ===================================

/**
 * Generates a category URL for navigation
 */
export function getCategoryUrl(category: Category | CategoryBase): string {
  const slug = 'slug' in category ? category.slug : ''
  return `/shop?category=${slug}`
}

/**
 * Generates a category breadcrumb path
 */
export function getCategoryBreadcrumb(
  category: Category | CategoryBase,
  allCategories: (Category | CategoryBase)[]
): (Category | CategoryBase)[] {
  const breadcrumb: (Category | CategoryBase)[] = [category]

  // If category has parent, build breadcrumb recursively
  if ('parent_id' in category && category.parent_id) {
    const parent = allCategories.find(
      c => ('id' in c ? c.id : parseInt(c.id, 10)) === category.parent_id
    )
    if (parent) {
      return [...getCategoryBreadcrumb(parent, allCategories), ...breadcrumb]
    }
  } else if ('parentId' in category && category.parentId) {
    const parent = allCategories.find(
      c => ('id' in c ? normalizeCategoryId(c.id) : c.id) === category.parentId
    )
    if (parent) {
      return [...getCategoryBreadcrumb(parent, allCategories), ...breadcrumb]
    }
  }

  return breadcrumb
}

// ===================================
// HIERARCHY BUILDING
// ===================================

/**
 * Builds a category hierarchy tree from a flat list
 */
export function buildCategoryHierarchy(
  categories: CategoryBase[] | Category[]
): Category[] {
  const categoryMap = new Map<string, Category>()
  const rootCategories: Category[] = []

  // First pass: convert all to UI format and create map
  const uiCategories = categories.map(cat => {
    const uiCat = 'id' in cat && typeof cat.id === 'string' ? cat : toUICategory(cat as CategoryBase)
    categoryMap.set(uiCat.id, { ...uiCat, children: [] })
    return uiCat
  })

  // Second pass: build hierarchy
  uiCategories.forEach(category => {
    const mappedCategory = categoryMap.get(category.id)!
    
    if (category.parentId) {
      const parent = categoryMap.get(category.parentId)
      if (parent) {
        parent.children = parent.children || []
        parent.children.push(mappedCategory)
      } else {
        // Parent not found, treat as root
        rootCategories.push(mappedCategory)
      }
    } else {
      // No parent, it's a root category
      rootCategories.push(mappedCategory)
    }
  })

  return rootCategories
}

// ===================================
// SEARCH AND FILTERING
// ===================================

/**
 * Searches categories by name
 */
export function searchCategories(
  categories: Category[] | CategoryBase[],
  searchTerm: string
): (Category | CategoryBase)[] {
  if (!searchTerm.trim()) {
    return categories
  }

  const term = searchTerm.toLowerCase().trim()
  return categories.filter(category => {
    const name = 'name' in category ? category.name : ''
    const slug = 'slug' in category ? category.slug : ''
    const description = 'description' in category ? category.description : ''
    
    return (
      name.toLowerCase().includes(term) ||
      slug.toLowerCase().includes(term) ||
      (description && description.toLowerCase().includes(term))
    )
  })
}

/**
 * Formats category name for display
 */
export function formatCategoryName(category: Category | CategoryBase): string {
  const name = 'name' in category ? category.name : ''
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
}

// ===================================
// VALIDATION
// ===================================

/**
 * Validates a category object
 */
export function validateCategory(category: Partial<Category | CategoryBase>): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!category.name || category.name.trim().length === 0) {
    errors.push('Category name is required')
  }

  if (category.name && category.name.length > 100) {
    errors.push('Category name must be 100 characters or less')
  }

  if ('slug' in category && category.slug) {
    if (!isValidCategorySlug(category.slug)) {
      errors.push('Invalid slug format. Use only lowercase letters, numbers, and hyphens')
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
