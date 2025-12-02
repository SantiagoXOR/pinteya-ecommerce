// ===================================
// HOOK: usePrefetchOnHover - Prefetch inteligente al hacer hover
// ===================================

'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useRef } from 'react'
import { productQueryKeys } from './queries/productQueryKeys'
import { getProducts } from '@/lib/api/products'
import { adaptApiProductsToLegacy } from '@/lib/adapters/productAdapter'

interface UsePrefetchOnHoverOptions {
  /**
   * Delay en ms antes de hacer prefetch después del hover
   * Útil para evitar prefetch si el usuario solo pasa el mouse rápidamente
   * @default 300
   */
  delay?: number
  /**
   * Si es true, cancela el prefetch si el usuario sale antes del delay
   * @default true
   */
  cancelOnLeave?: boolean
}

/**
 * Hook para prefetch de productos cuando el usuario hace hover sobre categorías
 * 
 * @example
 * const { handleMouseEnter, handleMouseLeave } = usePrefetchOnHover()
 * 
 * <div onMouseEnter={() => handleMouseEnter('categoria-slug')} onMouseLeave={handleMouseLeave}>
 *   Categoría
 * </div>
 */
export function usePrefetchOnHover(options: UsePrefetchOnHoverOptions = {}) {
  const { delay = 300, cancelOnLeave = true } = options
  const queryClient = useQueryClient()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleMouseEnter = useCallback(
    (categorySlug: string | null, limit: number = 12) => {
      // Limpiar timeout anterior si existe
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // Crear nuevo timeout para prefetch
      timeoutRef.current = setTimeout(() => {
        const queryKey = productQueryKeys.category(categorySlug, limit)

        // Verificar si ya hay datos en cache
        const cachedData = queryClient.getQueryData(queryKey)
        if (cachedData) {
          return // Ya hay datos, no necesitamos prefetch
        }

        // Prefetch de productos de la categoría
        queryClient.prefetchQuery({
          queryKey,
          queryFn: async () => {
            const filters: any = {
              limit: 100,
              sortBy: categorySlug ? 'created_at' : 'price',
              sortOrder: 'desc',
            }

            if (categorySlug) {
              filters.category = categorySlug
            }

            const response = await getProducts(filters)

            if (!response.success || !response.data) {
              throw new Error(response.message || 'Error al cargar productos')
            }

            return adaptApiProductsToLegacy(response.data)
          },
          staleTime: 5 * 60 * 1000, // 5 minutos
        })

        timeoutRef.current = null
      }, delay)
    },
    [queryClient, delay]
  )

  const handleMouseLeave = useCallback(() => {
    if (cancelOnLeave && timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [cancelOnLeave])

  // Cleanup al desmontar
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  return {
    handleMouseEnter,
    handleMouseLeave,
    cleanup,
  }
}

/**
 * Hook para prefetch de productos bestseller al hacer hover
 */
export function usePrefetchBestSellerOnHover(options: UsePrefetchOnHoverOptions = {}) {
  const { delay = 300, cancelOnLeave = true } = options
  const queryClient = useQueryClient()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleMouseEnter = useCallback(
    (categorySlug: string | null) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        const queryKey = productQueryKeys.bestseller(categorySlug)

        const cachedData = queryClient.getQueryData(queryKey)
        if (cachedData) {
          return
        }

        queryClient.prefetchQuery({
          queryKey,
          queryFn: async () => {
            const filters: any = {
              limit: categorySlug ? 50 : 100,
              sortBy: categorySlug ? 'created_at' : 'price',
              sortOrder: 'desc',
            }

            if (categorySlug) {
              filters.category = categorySlug
            }

            const response = await getProducts(filters)

            if (!response.success || !response.data) {
              throw new Error(response.message || 'Error al cargar productos')
            }

            return adaptApiProductsToLegacy(response.data)
          },
          staleTime: 5 * 60 * 1000,
        })

        timeoutRef.current = null
      }, delay)
    },
    [queryClient, delay]
  )

  const handleMouseLeave = useCallback(() => {
    if (cancelOnLeave && timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [cancelOnLeave])

  return {
    handleMouseEnter,
    handleMouseLeave,
  }
}











