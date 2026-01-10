// ===================================
// FACTORY PARA QUERIES DE PRODUCTOS
// ===================================

import { UseQueryOptions } from '@tanstack/react-query'
import { Product } from '@/types/product'
import { IProductStrategy } from '../strategies'
import { getProducts } from '@/lib/api/products'
import { adaptApiProductsToLegacy } from '@/lib/adapters/productAdapter'
import { DEFAULT_PRODUCT_QUERY_CONFIG } from '../constants'

interface QueryFactoryOptions {
  strategy: IProductStrategy
  queryKey: readonly unknown[]
  enabled?: boolean
  staleTime?: number
  gcTime?: number
}

/**
 * Factory para crear opciones de query de productos con estrategias
 * Retorna las opciones de configuración para useQuery
 * 
 * @param options - Opciones para crear la query
 * @returns Opciones de configuración para useQuery de React Query
 */
export function createProductQueryOptions(
  options: QueryFactoryOptions
): UseQueryOptions<Product[], Error, Product[], readonly unknown[]> {
  const {
    strategy,
    queryKey,
    enabled = true,
    staleTime = DEFAULT_PRODUCT_QUERY_CONFIG.staleTime,
    gcTime = DEFAULT_PRODUCT_QUERY_CONFIG.gcTime,
  } = options

  return {
    queryKey,
    queryFn: async (): Promise<Product[]> => {
      try {
        // Obtener filtros de la estrategia
        const filters = strategy.getApiFilters()
        
        // Fetch productos usando la función de API existente
        const response = await getProducts(filters)
        
        if (!response) {
          throw new Error('Respuesta vacía del servidor')
        }
        
        if (!response.success || !response.data) {
          const errorMessage = response?.message || response?.error || 'Error al cargar productos'
          throw new Error(errorMessage)
        }

        // Verificar que hay datos antes de procesar
        if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
          // Si no hay datos pero la respuesta fue exitosa, devolver array vacío (no es error)
          return []
        }

        // Adaptar productos del formato API al formato legacy
        const fetchedProducts = adaptApiProductsToLegacy(response.data)
        
        // Ejecutar estrategia: filtrar, ordenar y limitar
        return strategy.execute(fetchedProducts)
      } catch (err) {
        // Asegurar que siempre se lance un error válido para que la query se complete
        let errorMessage = 'Error inesperado al cargar productos'
        
        if (err instanceof Error) {
          errorMessage = err.message || errorMessage
        } else if (typeof err === 'string') {
          errorMessage = err
        } else if (err && typeof err === 'object' && 'message' in err) {
          errorMessage = String((err as any).message) || errorMessage
        }
        
        // Asegurar que el mensaje no sea undefined o vacío
        if (!errorMessage || errorMessage.trim() === '') {
          errorMessage = 'Error inesperado al cargar productos'
        }
        
        throw new Error(errorMessage)
      }
    },
    enabled,
    placeholderData: (previousData) => previousData,
    staleTime,
    gcTime,
    retry: DEFAULT_PRODUCT_QUERY_CONFIG.retry,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: DEFAULT_PRODUCT_QUERY_CONFIG.refetchOnWindowFocus,
    refetchOnMount: DEFAULT_PRODUCT_QUERY_CONFIG.refetchOnMount,
    refetchOnReconnect: DEFAULT_PRODUCT_QUERY_CONFIG.refetchOnReconnect,
  }
}
