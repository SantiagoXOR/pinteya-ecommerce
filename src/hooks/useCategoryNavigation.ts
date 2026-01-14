/**
 * useCategoryNavigation Hook
 * Manages URL navigation for category filters
 * Pinteya E-commerce - Enterprise-ready implementation
 */

import React, { useCallback, useState, useMemo } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import type { CategoryId } from '@/lib/categories/types'
import { getCategoryUrl } from '@/lib/categories/adapters'

// Type for navigation return
export interface UseCategoryNavigationReturn {
  navigateToFiltered: (categories: CategoryId[]) => void
  navigateToHome: () => void
  getCurrentUrl: () => string
  isNavigating: boolean
}

/**
 * Configuration options for the category navigation hook
 */
interface UseCategoryNavigationOptions {
  /** URL parameter name for categories */
  paramName?: string
  /** Base path for navigation */
  basePath?: string
  /** Debounce delay for URL updates in milliseconds */
  debounceDelay?: number
  /** Whether to preserve other URL parameters */
  preserveParams?: boolean
  /** Callback when navigation starts */
  onNavigationStart?: () => void
  /** Callback when navigation completes */
  onNavigationComplete?: () => void
  /** Whether to enable analytics tracking */
  enableAnalytics?: boolean
}

/**
 * Custom hook for managing category filter navigation
 *
 * Features:
 * - URL parameter management
 * - Debounced navigation
 * - State preservation
 * - Analytics tracking
 * - Performance optimization
 *
 * @param options Configuration options
 * @returns Navigation state and actions
 */
export const useCategoryNavigation = (
  options: UseCategoryNavigationOptions = {}
): UseCategoryNavigationReturn => {
  const {
    paramName = 'categories',
    basePath = '/',
    debounceDelay = 300,
    preserveParams = true,
    onNavigationStart,
    onNavigationComplete,
    enableAnalytics = true,
  } = options

  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const [isNavigating, setIsNavigating] = useState(false)
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)

  /**
   * Track navigation analytics if enabled
   */
  const trackNavigation = useCallback(
    (categories: CategoryId[], action: 'filter' | 'clear') => {
      if (!enableAnalytics) {
        return
      }

      // Track with analytics service
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'category_navigation', {
          event_category: 'navigation',
          event_label: action,
          value: categories.length,
          custom_parameters: {
            categories: categories.join(','),
            path: pathname,
          },
        })
      }

      // Console log for development
      if (process.env.NODE_ENV === 'development') {
      }
    },
    [enableAnalytics, pathname]
  )

  /**
   * Build URL with category parameters
   */
  const buildUrl = useCallback(
    (categories: CategoryId[]): string => {
      const params = new URLSearchParams()

      // Preserve existing parameters if enabled
      if (preserveParams) {
        searchParams.forEach((value, key) => {
          if (key !== paramName) {
            params.set(key, value)
          }
        })
      }

      // Add categories parameter if there are categories
      if (categories.length > 0) {
        params.set(paramName, categories.join(','))
      }

      // Build final URL
      const queryString = params.toString()
      return queryString ? `${basePath}?${queryString}` : basePath
    },
    [basePath, paramName, preserveParams, searchParams]
  )

  /**
   * Perform navigation with debouncing
   */
  const performNavigation = useCallback(
    (url: string) => {
      // Clear existing timer
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }

      // Set navigation state
      setIsNavigating(true)
      onNavigationStart?.()

      // Debounced navigation
      const timer = setTimeout(() => {
        try {
          router.push(url)

          // Reset navigation state after a short delay
          setTimeout(() => {
            setIsNavigating(false)
            onNavigationComplete?.()
          }, 100)
        } catch (error) {
          console.error('Navigation error:', error)
          setIsNavigating(false)
          onNavigationComplete?.()
        }
      }, debounceDelay)

      setDebounceTimer(timer)
    },
    [debounceTimer, debounceDelay, router, onNavigationStart, onNavigationComplete]
  )

  /**
   * Navigate to filtered view with selected categories
   */
  const navigateToFiltered = useCallback(
    (categories: CategoryId[]) => {
      // Validate categories
      const validCategories = categories.filter(
        cat => typeof cat === 'string' && cat.trim().length > 0
      )

      // Build URL and navigate
      const url = buildUrl(validCategories)
      performNavigation(url)

      // Track analytics
      trackNavigation(validCategories, 'filter')
    },
    [buildUrl, performNavigation, trackNavigation]
  )

  /**
   * Navigate to home (clear all filters)
   */
  const navigateToHome = useCallback(() => {
    const url = buildUrl([])
    performNavigation(url)

    // Track analytics
    trackNavigation([], 'clear')
  }, [buildUrl, performNavigation, trackNavigation])

  /**
   * Get current URL with categories
   */
  const getCurrentUrl = useCallback((): string => {
    const currentCategories = searchParams.get(paramName)
    const categories = currentCategories ? currentCategories.split(',') : []
    return buildUrl(categories)
  }, [searchParams, paramName, buildUrl])

  /**
   * Get current categories from URL
   */
  const getCurrentCategories = useCallback((): CategoryId[] => {
    const categoriesParam = searchParams.get(paramName)
    return categoriesParam ? categoriesParam.split(',').filter(Boolean) : []
  }, [searchParams, paramName])

  /**
   * Check if specific categories are currently active
   */
  const areCategoriesToActive = useCallback(
    (categories: CategoryId[]): boolean => {
      const currentCategories = getCurrentCategories()
      return (
        categories.every(cat => currentCategories.includes(cat)) &&
        currentCategories.every(cat => categories.includes(cat))
      )
    },
    [getCurrentCategories]
  )

  /**
   * Cleanup effect for debounce timer
   */
  const cleanup = useCallback(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      setDebounceTimer(null)
    }
  }, [debounceTimer])

  // Cleanup on unmount
  React.useEffect(() => {
    return cleanup
  }, [cleanup])

  /**
   * Memoized return object for performance
   */
  const returnValue = useMemo(
    (): UseCategoryNavigationReturn => ({
      navigateToFiltered,
      navigateToHome,
      getCurrentUrl,
      isNavigating,
    }),
    [navigateToFiltered, navigateToHome, getCurrentUrl, isNavigating]
  )

  return returnValue
}

/**
 * Utility function to extract categories from URL
 */
export const extractCategoriesFromUrl = (url: string, paramName = 'categories'): CategoryId[] => {
  try {
    const urlObj = new URL(url, window.location.origin)
    const categoriesParam = urlObj.searchParams.get(paramName)
    return categoriesParam ? categoriesParam.split(',').filter(Boolean) : []
  } catch {
    return []
  }
}

/**
 * Utility function to check if URL has category filters
 */
export const hasCategories = (url: string, paramName = 'categories'): boolean => {
  return extractCategoriesFromUrl(url, paramName).length > 0
}

/**
 * Default export for convenience
 */
export default useCategoryNavigation
