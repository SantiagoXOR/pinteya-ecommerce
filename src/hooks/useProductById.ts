import { useQuery } from '@tanstack/react-query'
import { ProductWithCategory } from '@/types/api'
import { getProductById } from '@/lib/api/products'
import { productQueryKeys } from './queries/productQueryKeys'

// ===================================
// HOOK: useProductById
// ===================================
// Hook para obtener un producto por ID usando TanStack Query
// Aprovecha caché automático y deduplicación de requests

interface UseProductByIdOptions {
  id: number | string | null | undefined
  enabled?: boolean
  staleTime?: number
}

interface UseProductByIdReturn {
  product: ProductWithCategory | undefined
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

export const useProductById = ({
  id,
  enabled = true,
  staleTime = 5 * 60 * 1000, // 5 minutos por defecto
}: UseProductByIdOptions): UseProductByIdReturn => {
  // Convertir id a number si es string
  const productId = typeof id === 'string' ? parseInt(id, 10) : id

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: productQueryKeys.detail(productId!),
    queryFn: async (): Promise<ProductWithCategory> => {
      if (!productId) {
        throw new Error('ID de producto no válido')
      }

      const response = await getProductById(productId)
      
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
    enabled: enabled && !!productId && !isNaN(productId),
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

































