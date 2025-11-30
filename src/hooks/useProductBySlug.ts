import { useQuery } from '@tanstack/react-query'
import { ProductWithCategory } from '@/types/api'
import { getProductBySlug } from '@/lib/api/products'
import { productQueryKeys } from './queries/productQueryKeys'

// ===================================
// HOOK: useProductBySlug
// ===================================
// Hook para obtener un producto por slug usando TanStack Query
// Aprovecha caché automático y deduplicación de requests

interface UseProductBySlugOptions {
  slug: string
  enabled?: boolean
  staleTime?: number
}

interface UseProductBySlugReturn {
  product: ProductWithCategory | undefined
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

export const useProductBySlug = ({
  slug,
  enabled = true,
  staleTime = 5 * 60 * 1000, // 5 minutos por defecto
}: UseProductBySlugOptions): UseProductBySlugReturn => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: productQueryKeys.detailBySlug(slug),
    queryFn: async (): Promise<ProductWithCategory> => {
      const response = await getProductBySlug(slug)
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Error al obtener producto')
      }

      return response.data
    },
    staleTime,
    gcTime: 10 * 60 * 1000, // 10 minutos en caché
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
    enabled: enabled && !!slug,
  })

  return {
    product: data,
    isLoading,
    error: error ? (error instanceof Error ? error : new Error(String(error))) : null,
    refetch: () => {
      refetch()
    },
  }
}




