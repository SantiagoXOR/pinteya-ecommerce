/**
 * Unified Category Types
 * Pinteya E-commerce - Centralized category type definitions
 * 
 * This module provides unified types for categories across the entire application,
 * eliminating inconsistencies between database schema, API responses, and UI components.
 */

// ===================================
// DATABASE TYPES (Base Types)
// ===================================

/**
 * Category as stored in the database
 * This matches the actual Supabase schema
 */
export interface CategoryBase {
  /** Database ID (number) */
  id: number
  /** Category name */
  name: string
  /** URL-friendly slug */
  slug: string
  /** Optional description */
  description?: string | null
  /** Image URL (stored in DB as image_url) */
  image_url?: string | null
  /** Parent category ID (for hierarchical categories, currently not used) */
  parent_id?: number | null
  /** Creation timestamp */
  created_at?: string
  /** Last update timestamp */
  updated_at?: string | null
  /** Display order for sorting */
  display_order?: number | null
  /** Product count (calculated field, not in DB) */
  products_count?: number
}

/**
 * Category data for insertion into database
 */
export interface CategoryInsert {
  id?: number
  name: string
  slug: string
  description?: string | null
  image_url?: string | null
  parent_id?: number | null
  created_at?: string
  updated_at?: string | null
  display_order?: number | null
}

/**
 * Category data for updating in database
 */
export interface CategoryUpdate {
  id?: number
  name?: string
  slug?: string
  description?: string | null
  image_url?: string | null
  parent_id?: number | null
  updated_at?: string | null
  display_order?: number | null
}

// ===================================
// UI TYPES (Transformed Types)
// ===================================

/**
 * Category as used in UI components
 * ID is normalized to string for consistency
 * image_url is aliased as icon for UI compatibility
 */
export interface Category {
  /** Normalized ID as string */
  id: string
  /** Category name */
  name: string
  /** URL-friendly slug */
  slug: string
  /** Icon/image URL (from image_url) */
  icon: string
  /** Optional description */
  description?: string
  /** Number of products in this category */
  count?: number
  /** Whether the category is available */
  isAvailable?: boolean
  /** Parent category ID (as string) */
  parentId?: string | null
  /** Creation timestamp */
  createdAt?: string
  /** Last update timestamp */
  updatedAt?: string | null
  /** Display order */
  displayOrder?: number | null
  /** Child categories (for hierarchical display) */
  children?: Category[]
}

/**
 * Extended category with additional metadata
 */
export interface CategoryWithMetadata extends Category {
  /** Last updated timestamp as Date */
  updatedAtDate?: Date
  /** Category priority for sorting */
  priority?: number
  /** Breadcrumb path */
  breadcrumb?: Category[]
}

// ===================================
// FILTER TYPES
// ===================================

/**
 * Filters for querying categories
 */
export interface CategoryFilters {
  /** Search term for category name */
  search?: string
  /** Filter by parent ID */
  parent_id?: number | null
  /** Filter by availability */
  is_active?: boolean
  /** Limit number of results */
  limit?: number
  /** Offset for pagination */
  offset?: number
  /** Sort field */
  sortBy?: 'name' | 'display_order' | 'created_at' | 'products_count'
  /** Sort order */
  sortOrder?: 'asc' | 'desc'
}

// ===================================
// CONFIGURATION TYPES
// ===================================

/**
 * UI configuration for category display
 */
export interface CategoryConfig {
  /** Display title */
  title: string
  /** Subtitle or description */
  subtitle: string
  /** Icon URL */
  iconUrl: string
  /** Color theme */
  color: string
  /** Background gradient */
  bgGradient: string
  /** Badge color */
  badgeColor: string
  /** Text color */
  textColor?: string
  /** Category slug */
  slug: string | null
}

/**
 * Category component configuration
 */
export interface CategoryComponentConfig {
  /** Default variant */
  defaultVariant?: 'default' | 'compact' | 'minimal'
  /** Default size */
  defaultSize?: 'sm' | 'md' | 'lg'
  /** Maximum categories to show */
  maxCategories?: number
  /** Whether to enable analytics */
  enableAnalytics?: boolean
  /** Whether to enable keyboard navigation */
  enableKeyboardNavigation?: boolean
  /** Animation duration in ms */
  animationDuration?: number
  /** Debounce delay for URL updates */
  urlUpdateDelay?: number
  /** Whether to show product counts */
  showCounts?: boolean
}

// ===================================
// API TYPES
// ===================================

/**
 * API response wrapper for categories
 */
export interface CategoryApiResponse<T = Category | Category[]> {
  data: T
  success: boolean
  message?: string
  error?: string
  meta?: {
    total?: number
    page?: number
    limit?: number
    pages?: number
  }
}

/**
 * Category creation payload
 */
export interface CreateCategoryPayload {
  name: string
  slug?: string
  description?: string
  image_url?: string
  parent_id?: number | null
  display_order?: number
}

/**
 * Category update payload
 */
export interface UpdateCategoryPayload {
  name?: string
  slug?: string
  description?: string
  image_url?: string
  parent_id?: number | null
  display_order?: number
}

// ===================================
// EVENT TYPES
// ===================================

/**
 * Category change event
 */
export interface CategoryChangeEvent {
  /** Type of change */
  type: 'select' | 'deselect' | 'clear' | 'selectAll'
  /** Category ID that changed */
  categoryId?: string
  /** All selected categories after change */
  selectedCategories: string[]
  /** Previous selected categories */
  previousCategories: string[]
  /** Timestamp of the event */
  timestamp: Date
}

/**
 * Category interaction event for analytics
 */
export interface CategoryInteractionEvent {
  /** Type of interaction */
  action: 'click' | 'keydown' | 'focus' | 'blur'
  /** Category that was interacted with */
  categoryId: string
  /** Method of interaction */
  method: 'mouse' | 'keyboard' | 'touch'
  /** Additional metadata */
  metadata?: Record<string, any>
}

// ===================================
// UTILITY TYPES
// ===================================

/**
 * Category ID type (normalized to string)
 */
export type CategoryId = string

/**
 * Category selection state
 */
export type CategorySelectionState = Record<CategoryId, boolean>

/**
 * Category filter state for URL
 */
export interface CategoryFilterState {
  categories: CategoryId[]
  timestamp: number
}

/**
 * Category hierarchy for tree structures
 */
export interface CategoryHierarchy extends Category {
  children: CategoryHierarchy[]
  level: number
  path: string[]
}

// ===================================
// LEGACY COMPATIBILITY TYPES
// ===================================

/**
 * Legacy category type (for backward compatibility during migration)
 * @deprecated Use Category instead
 */
export interface CategoryLegacy {
  title: string
  id: number
  img: string
}

/**
 * Category display type (for specific components)
 */
export interface CategoryDisplay {
  id: number
  title: string
  img: string
  slug: string
}
