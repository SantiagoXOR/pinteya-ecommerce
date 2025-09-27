/**
 * Types and interfaces for Categories Filter System
 * Pinteya E-commerce - Enterprise-ready TypeScript definitions
 */

// ===================================
// CORE CATEGORY TYPES
// ===================================

/**
 * Base category interface
 */
export interface Category {
  /** Unique identifier for the category */
  id: string
  /** Display name of the category */
  name: string
  /** Icon path or URL for the category */
  icon: string
  /** URL-friendly slug for the category */
  slug?: string
  /** Number of products in this category */
  count?: number
  /** Category description for accessibility */
  description?: string
  /** Whether the category is currently available */
  isAvailable?: boolean
}

/**
 * Extended category with metadata
 */
export interface CategoryWithMetadata extends Category {
  /** Last updated timestamp */
  updatedAt?: Date
  /** Category priority for sorting */
  priority?: number
  /** Parent category ID for nested categories */
  parentId?: string
  /** Child categories */
  children?: Category[]
}

// ===================================
// COMPONENT PROPS INTERFACES
// ===================================

/**
 * Props for the main Categories component
 */
export interface CategoriesProps {
  /** Array of categories to display */
  categories?: Category[]
  /** Currently selected category IDs */
  selectedCategories?: string[]
  /** Callback when category selection changes */
  onCategoryChange?: (event: CategoryChangeEvent) => void
  /** Visual variant of the component */
  variant?: 'default' | 'compact' | 'minimal'
  /** Size of the category pills */
  size?: 'sm' | 'md' | 'lg'
  /** Maximum number of categories to display */
  maxCategories?: number
  /** Whether to show category counts */
  showCounts?: boolean
  /** Whether the component is disabled */
  disabled?: boolean
  /** Loading state */
  loading?: boolean
  /** Error state */
  error?: string | null
  /** Custom CSS classes */
  className?: string
  /** Test ID for testing */
  testId?: string
}

/**
 * Props for individual CategoryPill component
 */
export interface CategoryPillProps {
  /** Category data */
  category: Category
  /** Whether this category is selected */
  isSelected: boolean
  /** Click handler */
  onClick: (categoryId: string) => void
  /** Key handler for accessibility */
  onKeyDown?: (event: React.KeyboardEvent, categoryId: string) => void
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Whether the pill is disabled */
  disabled?: boolean
  /** Custom CSS classes */
  className?: string
  /** Test ID for testing */
  testId?: string
}

// ===================================
// HOOK INTERFACES
// ===================================

/**
 * Return type for useCategoryFilter hook
 */
export interface UseCategoryFilterReturn {
  /** Currently selected categories */
  selectedCategories: string[]
  /** Toggle a category selection */
  toggleCategory: (categoryId: string) => void
  /** Clear all selections */
  clearAll: () => void
  /** Select all categories */
  selectAll: (categoryIds: string[]) => void
  /** Check if a category is selected */
  isSelected: (categoryId: string) => boolean
  /** Get count of selected categories */
  selectedCount: number
}

/**
 * Return type for useCategoryNavigation hook
 */
export interface UseCategoryNavigationReturn {
  /** Navigate to filtered view */
  navigateToFiltered: (categories: string[]) => void
  /** Navigate to home (clear filters) */
  navigateToHome: () => void
  /** Get current URL with categories */
  getCurrentUrl: () => string
  /** Check if navigation is in progress */
  isNavigating: boolean
}

/**
 * Return type for useCategoryData hook
 */
export interface UseCategoryDataReturn {
  /** Categories data */
  categories: Category[]
  /** Loading state */
  loading: boolean
  /** Error state */
  error: string | null
  /** Refresh categories */
  refresh: () => Promise<void>
  /** Get category by ID */
  getCategoryById: (id: string) => Category | undefined
}

// ===================================
// EVENT INTERFACES
// ===================================

/**
 * Category change event data
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
// CONFIGURATION INTERFACES
// ===================================

/**
 * Configuration for Categories component
 */
export interface CategoriesConfig {
  /** Default variant */
  defaultVariant: CategoriesProps['variant']
  /** Default size */
  defaultSize: CategoriesProps['size']
  /** Maximum categories to show */
  maxCategories: number
  /** Whether to enable analytics */
  enableAnalytics: boolean
  /** Whether to enable keyboard navigation */
  enableKeyboardNavigation: boolean
  /** Animation duration in ms */
  animationDuration: number
  /** Debounce delay for URL updates */
  urlUpdateDelay: number
}

// ===================================
// UTILITY TYPES
// ===================================

/**
 * Category ID type for type safety
 */
export type CategoryId = string

/**
 * Category selection state
 */
export type CategorySelectionState = Record<CategoryId, boolean>

/**
 * Category filter state for URL
 */
export type CategoryFilterState = {
  categories: CategoryId[]
  timestamp: number
}

// ===================================
// CONSTANTS
// ===================================

/**
 * Default categories configuration
 */
export const DEFAULT_CATEGORIES_CONFIG: CategoriesConfig = {
  defaultVariant: 'default',
  defaultSize: 'md',
  maxCategories: 20,
  enableAnalytics: true,
  enableKeyboardNavigation: true,
  animationDuration: 200,
  urlUpdateDelay: 300,
}

/**
 * Keyboard navigation keys
 */
export const KEYBOARD_KEYS = {
  ENTER: 'Enter',
  SPACE: ' ',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  TAB: 'Tab',
  ESCAPE: 'Escape',
} as const

/**
 * ARIA labels and descriptions
 */
export const ARIA_LABELS = {
  CATEGORY_FILTER: 'Filtrar por categoría',
  CATEGORY_SELECTED: 'Categoría seleccionada',
  CATEGORY_NOT_SELECTED: 'Categoría no seleccionada',
  CLEAR_FILTERS: 'Limpiar todos los filtros',
  FILTER_GROUP: 'Grupo de filtros de categorías',
} as const
