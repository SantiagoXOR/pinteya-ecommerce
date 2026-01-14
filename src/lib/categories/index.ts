/**
 * Categories Module
 * Pinteya E-commerce - Centralized category management
 * 
 * This module provides a unified interface for category management across the application.
 * It exports types, services, hooks, and utilities for working with categories.
 */

// ===================================
// TYPES
// ===================================
export type {
  CategoryBase,
  Category,
  CategoryInsert,
  CategoryUpdate,
  CategoryFilters,
  CategoryConfig,
  CategoryComponentConfig,
  CategoryApiResponse,
  CreateCategoryPayload,
  UpdateCategoryPayload,
  CategoryChangeEvent,
  CategoryInteractionEvent,
  CategoryId,
  CategorySelectionState,
  CategoryFilterState,
  CategoryHierarchy,
  CategoryLegacy,
  CategoryDisplay,
} from './types'

// ===================================
// ADAPTERS
// ===================================
export {
  normalizeCategoryId,
  denormalizeCategoryId,
  getCategoryImage,
  setCategoryImage,
  toUICategory,
  toUICategories,
  toDBCategory,
  generateCategorySlug,
  isValidCategorySlug,
  getCategoryUrl,
  getCategoryBreadcrumb,
  buildCategoryHierarchy,
  searchCategories,
  formatCategoryName,
  validateCategory,
} from './adapters'

// ===================================
// REPOSITORY
// ===================================
export { CategoryRepository, createCategoryRepository } from './repository'

// ===================================
// SERVICE
// ===================================
export { CategoryService, createCategoryService } from './service'

// ===================================
// API CLIENT
// ===================================
export {
  fetchCategories,
  fetchCategoryById,
  fetchCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
  searchCategories as searchCategoriesAPI,
} from './api/client'

// ===================================
// API SERVER
// ===================================
export {
  getCategoriesFromDB,
  getCategoryByIdFromDB,
  getCategoryBySlugFromDB,
  createCategoryInDB,
  updateCategoryInDB,
  deleteCategoryFromDB,
  getCategories as getCategoriesServer,
  getCategoryById as getCategoryByIdServer,
  getCategoryBySlug as getCategoryBySlugServer,
  searchCategories as searchCategoriesServer,
} from './api/server'

// ===================================
// HOOKS
// ===================================
export {
  useCategories,
  categoryQueryKeys,
  useCategoryFilter,
} from './hooks'

export type {
  UseCategoriesOptions,
  UseCategoriesReturn,
  UseCategoryFilterOptions,
  UseCategoryFilterReturn,
} from './hooks'

// ===================================
// CONFIGURATION
// ===================================
export {
  CATEGORY_CONFIGS,
  getCategoryConfig,
  CATEGORY_SLUGS,
  getEnvironmentConfig,
  getComponentConfig,
  DEFAULT_COMPONENT_CONFIG,
} from './config'
