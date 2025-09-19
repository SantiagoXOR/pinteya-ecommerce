/**
 * useCategoryFilter Hook
 * Manages category filter state and logic
 * Pinteya E-commerce - Enterprise-ready implementation
 */

import { useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import type { 
  CategoryId, 
  UseCategoryFilterReturn,
  CategoryChangeEvent 
} from '@/types/categories';

/**
 * Configuration options for the category filter hook
 */
interface UseCategoryFilterOptions {
  /** Initial selected categories */
  initialCategories?: CategoryId[];
  /** Maximum number of categories that can be selected */
  maxSelections?: number;
  /** Whether to sync with URL parameters */
  syncWithUrl?: boolean;
  /** URL parameter name for categories */
  urlParamName?: string;
  /** Callback for category change events */
  onCategoryChange?: (event: CategoryChangeEvent) => void;
  /** Whether to enable analytics tracking */
  enableAnalytics?: boolean;
}

/**
 * Custom hook for managing category filter state
 * 
 * Features:
 * - State management for selected categories
 * - URL synchronization
 * - Analytics tracking
 * - Accessibility support
 * - Performance optimization
 * 
 * @param options Configuration options
 * @returns Category filter state and actions
 */
export const useCategoryFilter = (
  options: UseCategoryFilterOptions = {}
): UseCategoryFilterReturn => {
  const {
    initialCategories = [],
    maxSelections = 10,
    syncWithUrl = true,
    urlParamName = 'categories',
    onCategoryChange,
    enableAnalytics = true,
  } = options;

  const searchParams = useSearchParams();

  // Initialize state from URL if sync is enabled, otherwise use initial categories
  const getInitialState = useCallback((): CategoryId[] => {
    if (syncWithUrl) {
      const urlCategories = searchParams.get(urlParamName);
      if (urlCategories) {
        return urlCategories.split(',').filter(Boolean);
      }
    }
    return initialCategories;
  }, [syncWithUrl, searchParams, urlParamName, initialCategories]);

  const [selectedCategories, setSelectedCategories] = useState<CategoryId[]>(getInitialState);

  /**
   * Create category change event for analytics and callbacks
   */
  const createChangeEvent = useCallback((
    type: CategoryChangeEvent['type'],
    categoryId: CategoryId | undefined,
    newCategories: CategoryId[],
    previousCategories: CategoryId[]
  ): CategoryChangeEvent => ({
    type,
    categoryId,
    selectedCategories: newCategories,
    previousCategories,
    timestamp: new Date(),
  }), []);

  /**
   * Track analytics event if enabled
   */
  const trackAnalytics = useCallback((event: CategoryChangeEvent) => {
    if (!enableAnalytics) {return;}

    // Track with analytics service (placeholder for actual implementation)
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'category_filter_change', {
        event_category: 'filters',
        event_label: event.categoryId || 'bulk_action',
        value: event.selectedCategories.length,
        custom_parameters: {
          action_type: event.type,
          selected_count: event.selectedCategories.length,
        },
      });
    }

    // Console log for development
    if (process.env.NODE_ENV === 'development') {
    }
  }, [enableAnalytics]);

  /**
   * Toggle a category selection
   */
  const toggleCategory = useCallback((categoryId: CategoryId) => {
    setSelectedCategories(prev => {
      const isCurrentlySelected = prev.includes(categoryId);
      let newCategories: CategoryId[];

      if (isCurrentlySelected) {
        // Remove category
        newCategories = prev.filter(id => id !== categoryId);
      } else {
        // Add category (respect max selections)
        if (prev.length >= maxSelections) {
          console.warn(`Maximum ${maxSelections} categories can be selected`);
          return prev;
        }
        newCategories = [...prev, categoryId];
      }

      // Create and track event
      const event = createChangeEvent(
        isCurrentlySelected ? 'deselect' : 'select',
        categoryId,
        newCategories,
        prev
      );

      trackAnalytics(event);
      onCategoryChange?.(event);

      return newCategories;
    });
  }, [maxSelections, createChangeEvent, trackAnalytics, onCategoryChange]);

  /**
   * Clear all selected categories
   */
  const clearAll = useCallback(() => {
    setSelectedCategories(prev => {
      if (prev.length === 0) {return prev;}

      const event = createChangeEvent('clear', undefined, [], prev);
      trackAnalytics(event);
      onCategoryChange?.(event);

      return [];
    });
  }, [createChangeEvent, trackAnalytics, onCategoryChange]);

  /**
   * Select all provided categories
   */
  const selectAll = useCallback((categoryIds: CategoryId[]) => {
    setSelectedCategories(prev => {
      // Respect max selections
      const limitedCategories = categoryIds.slice(0, maxSelections);

      if (categoryIds.length > maxSelections) {
        console.warn(`Only first ${maxSelections} categories will be selected`);
      }

      const event = createChangeEvent('selectAll', undefined, limitedCategories, prev);
      trackAnalytics(event);
      onCategoryChange?.(event);

      return limitedCategories;
    });
  }, [maxSelections, createChangeEvent, trackAnalytics, onCategoryChange]);

  /**
   * Check if a category is selected
   */
  const isSelected = useCallback((categoryId: CategoryId): boolean => {
    return selectedCategories.includes(categoryId);
  }, [selectedCategories]);

  /**
   * Get count of selected categories
   */
  const selectedCount = useMemo(() => selectedCategories.length, [selectedCategories]);

  /**
   * Memoized return object for performance
   */
  const returnValue = useMemo((): UseCategoryFilterReturn => ({
    selectedCategories,
    toggleCategory,
    clearAll,
    selectAll,
    isSelected,
    selectedCount,
  }), [
    selectedCategories,
    toggleCategory,
    clearAll,
    selectAll,
    isSelected,
    selectedCount,
  ]);

  return returnValue;
};

/**
 * Type guard to check if a value is a valid CategoryId
 */
export const isCategoryId = (value: unknown): value is CategoryId => {
  return typeof value === 'string' && value.length > 0;
};

/**
 * Utility to validate category IDs array
 */
export const validateCategoryIds = (categoryIds: unknown[]): CategoryId[] => {
  return categoryIds.filter(isCategoryId);
};

/**
 * Default export for convenience
 */
export default useCategoryFilter;









