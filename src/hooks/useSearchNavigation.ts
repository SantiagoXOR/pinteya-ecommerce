// ===================================
// HOOK: useSearchNavigation - Navegación optimizada para búsquedas
// ===================================

import { useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export interface SearchNavigationOptions {
  /** Preservar parámetros existentes */
  preserveParams?: boolean
  /** Scroll al top después de navegar */
  scrollToTop?: boolean
  /** Usar replace en lugar de push */
  replace?: boolean
  /** Callback antes de navegar */
  onBeforeNavigate?: (url: string) => void
  /** Callback después de navegar */
  onAfterNavigate?: (url: string) => void
}

export function useSearchNavigation(options: SearchNavigationOptions = {}) {
  const {
    preserveParams = false,
    scrollToTop = true,
    replace = false,
    onBeforeNavigate,
    onAfterNavigate,
  } = options

  const router = useRouter()
  const searchParams = useSearchParams()

  // ===================================
  // NAVEGACIÓN A RESULTADOS DE BÚSQUEDA
  // ===================================

  const navigateToSearch = useCallback(
    (query: string, category?: string, additionalParams?: Record<string, string>) => {
      if (!query.trim()) {
        return
      }

      // Construir URL de búsqueda
      const params = new URLSearchParams()

      // Parámetro principal de búsqueda
      params.set('search', query.trim())

      // Categoría si se especifica
      if (category && category !== 'all') {
        params.set('category', category)
      }

      // Preservar parámetros existentes si está habilitado
      if (preserveParams) {
        searchParams.forEach((value, key) => {
          if (key !== 'search' && key !== 'category') {
            params.set(key, value)
          }
        })
      }

      // Parámetros adicionales
      if (additionalParams) {
        Object.entries(additionalParams).forEach(([key, value]) => {
          params.set(key, value)
        })
      }

      const searchUrl = `/search?${params.toString()}`

      // Callback antes de navegar
      onBeforeNavigate?.(searchUrl)

      // Navegar
      if (replace) {
        router.replace(searchUrl)
      } else {
        router.push(searchUrl)
      }

      // Scroll al top si está habilitado
      if (scrollToTop) {
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }, 100)
      }

      // Callback después de navegar
      onAfterNavigate?.(searchUrl)
    },
    [router, searchParams, preserveParams, replace, scrollToTop, onBeforeNavigate, onAfterNavigate]
  )

  // ===================================
  // NAVEGACIÓN A PRODUCTO
  // ===================================

  const navigateToProduct = useCallback(
    (productId: string, productSlug?: string) => {
      const productUrl = productSlug ? `/products/${productSlug}` : `/products/${productId}`

      onBeforeNavigate?.(productUrl)
      router.push(productUrl)
      onAfterNavigate?.(productUrl)
    },
    [router, onBeforeNavigate, onAfterNavigate]
  )

  // ===================================
  // NAVEGACIÓN A CATEGORÍA
  // ===================================

  const navigateToCategory = useCallback(
    (categoryId: string, categorySlug?: string) => {
      const categoryUrl = categorySlug ? `/shop/${categorySlug}` : `/shop?category=${categoryId}`

      onBeforeNavigate?.(categoryUrl)
      router.push(categoryUrl)
      onAfterNavigate?.(categoryUrl)
    },
    [router, onBeforeNavigate, onAfterNavigate]
  )

  // ===================================
  // PREFETCH OPTIMIZADO
  // ===================================

  const prefetchSearch = useCallback(
    (query: string, category?: string) => {
      if (!query.trim()) {
        return
      }

      const params = new URLSearchParams()
      params.set('search', query.trim())
      if (category && category !== 'all') {
        params.set('category', category)
      }

      const searchUrl = `/search?${params.toString()}`
      router.prefetch(searchUrl)
    },
    [router]
  )

  const prefetchProduct = useCallback(
    (productId: string, productSlug?: string) => {
      const productUrl = productSlug ? `/products/${productSlug}` : `/products/${productId}`

      router.prefetch(productUrl)
    },
    [router]
  )

  // ===================================
  // UTILIDADES
  // ===================================

  const getCurrentSearchQuery = useCallback(() => {
    return searchParams.get('search') || ''
  }, [searchParams])

  const getCurrentCategory = useCallback(() => {
    return searchParams.get('category') || ''
  }, [searchParams])

  const buildSearchUrl = useCallback(
    (query: string, category?: string, additionalParams?: Record<string, string>) => {
      const params = new URLSearchParams()
      params.set('search', query.trim())

      if (category && category !== 'all') {
        params.set('category', category)
      }

      if (additionalParams) {
        Object.entries(additionalParams).forEach(([key, value]) => {
          params.set(key, value)
        })
      }

      return `/search?${params.toString()}`
    },
    []
  )

  // ===================================
  // RETURN
  // ===================================

  return {
    // Funciones de navegación
    navigateToSearch,
    navigateToProduct,
    navigateToCategory,

    // Funciones de prefetch
    prefetchSearch,
    prefetchProduct,

    // Utilidades
    getCurrentSearchQuery,
    getCurrentCategory,
    buildSearchUrl,

    // Router directo para casos especiales
    router,
  }
}

export default useSearchNavigation
