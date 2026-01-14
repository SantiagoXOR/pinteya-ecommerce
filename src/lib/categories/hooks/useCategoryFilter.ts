/**
 * Category Filter Hook
 * Pinteya E-commerce - Hook for managing category filter state
 * 
 * This hook manages category selection state, URL synchronization, and analytics.
 * It integrates with useCategories for seamless category management.
 */

'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import type { CategoryId, CategoryChangeEvent } from '../types'
import { useCategories } from './useCategories'

export interface UseCategoryFilterOptions {
  /** Initial selected categories */
  initialCategories?: CategoryId[]
  /** Maximum number of categories that can be selected */
  maxSelections?: number
  /** Whether to sync with URL parameters */
  syncWithUrl?: boolean
  /** URL parameter name for categories */
  urlParamName?: string
  /** Callback for category change events */
  onCategoryChange?: (event: CategoryChangeEvent) => void
  /** Whether to enable analytics tracking */
  enableAnalytics?: boolean
  /** Debounce delay for URL updates in ms */
  urlUpdateDelay?: number
}

export interface UseCategoryFilterReturn {
  /** Currently selected category IDs */
  selectedCategories: CategoryId[]
  /** Toggle a category selection */
  toggleCategory: (categoryId: CategoryId) => void
  /** Clear all selections */
  clearAll: () => void
  /** Select all categories from the provided list */
  selectAll: (categoryIds: CategoryId[]) => void
  /** Check if a category is selected */
  isSelected: (categoryId: CategoryId) => boolean
  /** Get count of selected categories */
  selectedCount: number
  /** Set selected categories directly */
  setSelectedCategories: (categories: CategoryId[]) => void
}

/**
 * Hook for managing category filter state
 */
export function useCategoryFilter(
  options: UseCategoryFilterOptions = {}
): UseCategoryFilterReturn {
  const {
    initialCategories = [],
    maxSelections = 10,
    syncWithUrl = true,
    urlParamName = 'categories',
    onCategoryChange,
    enableAnalytics = true,
    urlUpdateDelay = 300,
  } = options

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // Get categories from useCategories hook
  const { categories } = useCategories()

  // Initialize state from URL if sync is enabled
  const getInitialState = useCallback((): CategoryId[] => {
    if (syncWithUrl) {
      const urlCategories = searchParams.get(urlParamName)
      if (urlCategories) {
        return urlCategories.split(',').filter(Boolean)
      }
    }
    return initialCategories
  }, [syncWithUrl, searchParams, urlParamName, initialCategories])

  const [selectedCategories, setSelectedCategoriesState] = useState<CategoryId[]>(
    getInitialState
  )

  // Sync with URL on mount and when searchParams change
  useEffect(() => {
    if (syncWithUrl) {
      const urlCategories = searchParams.get(urlParamName)
      if (urlCategories) {
        const urlCategoryIds = urlCategories.split(',').filter(Boolean)
        setSelectedCategoriesState(urlCategoryIds)
      }
    }
  }, [searchParams, syncWithUrl, urlParamName])

  /**
   * Create category change event
   */
  const createChangeEvent = useCallback(
    (
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
    }),
    []
  )

  /**
   * Track analytics event
   */
  const trackAnalytics = useCallback(
    (event: CategoryChangeEvent) => {
      if (!enableAnalytics) {
        return
      }

      // Track with Google Analytics if available
      if (typeof window !== 'undefined' && (window as any).gtag) {
        ;(window as any).gtag('event', 'category_filter_change', {
          event_category: 'filters',
          event_label: event.categoryId || 'bulk_action',
          value: event.selectedCategories.length,
          custom_parameters: {
            action_type: event.type,
            selected_count: event.selectedCategories.length,
          },
        })
      }
    },
    [enableAnalytics]
  )

  /**
   * Update URL with selected categories
   */
  const updateURL = useCallback(
    (categoryIds: CategoryId[]) => {
      if (!syncWithUrl) {
        return
      }

      const params = new URLSearchParams(searchParams.toString())

      if (categoryIds.length > 0) {
        params.set(urlParamName, categoryIds.join(','))
      } else {
        params.delete(urlParamName)
      }

      // Use replace to avoid adding to history
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [syncWithUrl, searchParams, urlParamName, router, pathname]
  )

  /**
   * Debounced URL update
   */
  const debouncedUpdateURL = useMemo(() => {
    let timeoutId: NodeJS.Timeout | null = null

    return (categoryIds: CategoryId[]) => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      timeoutId = setTimeout(() => {
        updateURL(categoryIds)
      }, urlUpdateDelay)
    }
  }, [updateURL, urlUpdateDelay])

  /**
   * Set selected categories with event tracking
   */
  const setSelectedCategories = useCallback(
    (newCategories: CategoryId[], previousCategories?: CategoryId[]) => {
      const prev = previousCategories || selectedCategories
      setSelectedCategoriesState(newCategories)

      // Create change event
      const event = createChangeEvent('select', undefined, newCategories, prev)

      // Track analytics
      trackAnalytics(event)

      // Call callback
      onCategoryChange?.(event)

      // Update URL
      debouncedUpdateURL(newCategories)
    },
    [selectedCategories, createChangeEvent, trackAnalytics, onCategoryChange, debouncedUpdateURL]
  )

  /**
   * Toggle a category selection
   */
  const toggleCategory = useCallback(
    (categoryId: CategoryId) => {
      setSelectedCategoriesState(prev => {
        const isCurrentlySelected = prev.includes(categoryId)
        let newCategories: CategoryId[]

        if (isCurrentlySelected) {
          // Remove category
          newCategories = prev.filter(id => id !== categoryId)
        } else {
          // Add category (respect max selections)
          if (prev.length >= maxSelections) {
            console.warn(`Maximum ${maxSelections} categories can be selected`)
            return prev
          }
          newCategories = [...prev, categoryId]
        }

        // Create and track event
        const event = createChangeEvent(
          isCurrentlySelected ? 'deselect' : 'select',
          categoryId,
          newCategories,
          prev
        )

        trackAnalytics(event)
        onCategoryChange?.(event)

        // Update URL
        debouncedUpdateURL(newCategories)

        return newCategories
      })
    },
    [maxSelections, createChangeEvent, trackAnalytics, onCategoryChange, debouncedUpdateURL]
  )

  /**
   * Clear all selections
   */
  const clearAll = useCallback(() => {
    const prev = selectedCategories
    setSelectedCategoriesState([])

    const event = createChangeEvent('clear', undefined, [], prev)
    trackAnalytics(event)
    onCategoryChange?.(event)
    debouncedUpdateURL([])
  }, [selectedCategories, createChangeEvent, trackAnalytics, onCategoryChange, debouncedUpdateURL])

  /**
   * Select all categories from provided list
   */
  const selectAll = useCallback(
    (categoryIds: CategoryId[]) => {
      const limitedIds = categoryIds.slice(0, maxSelections)
      const prev = selectedCategories
      setSelectedCategoriesState(limitedIds)

      const event = createChangeEvent('selectAll', undefined, limitedIds, prev)
      trackAnalytics(event)
      onCategoryChange?.(event)
      debouncedUpdateURL(limitedIds)
    },
    [maxSelections, selectedCategories, createChangeEvent, trackAnalytics, onCategoryChange, debouncedUpdateURL]
  )

  /**
   * Check if a category is selected
   */
  const isSelected = useCallback(
    (categoryId: CategoryId): boolean => {
      return selectedCategories.includes(categoryId)
    },
    [selectedCategories]
  )

  return {
    selectedCategories,
    toggleCategory,
    clearAll,
    selectAll,
    isSelected,
    selectedCount: selectedCategories.length,
    setSelectedCategories: (categories: CategoryId[]) => {
      setSelectedCategories(categories, selectedCategories)
    },
  }
}
