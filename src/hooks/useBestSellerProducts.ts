import { useQuery } from '@tanstack/react-query'
import { Product } from '@/types/product'
import { productQueryKeys } from './queries/productQueryKeys'
import { PRODUCT_LIMITS } from '@/lib/products/constants'
import { BestsellerStrategy } from '@/lib/products/strategies'
import { createProductQueryOptions } from '@/lib/products/factories/query-factory'

// ===================================
// HOOK: useBestSellerProducts (REFACTORIZADO)
// ===================================
// Hook específico para BestSeller que maneja:
// - Sin categoría: 10 productos específicos hardcodeados
// - Con categoría: Todos los productos de la categoría (limit 20)
// Usa estrategias y factory para mejor mantenibilidad y escalabilidad

interface UseBestSellerProductsOptions {
  categorySlug: string | null
  enableCache?: boolean
}

interface UseBestSellerProductsReturn {
  products: Product[]
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export const useBestSellerProducts = ({
  categorySlug,
  enableCache = true,
}: UseBestSellerProductsOptions): UseBestSellerProductsReturn => {
  
  // Crear estrategia de bestseller con límites apropiados
  const strategy = new BestsellerStrategy(
    categorySlug,
    categorySlug ? PRODUCT_LIMITS.CATEGORY : PRODUCT_LIMITS.BESTSELLER
  )
  
  // ✅ FIX CRÍTICO: Usar query key única para bestsellers para evitar conflictos de caché
  // NO compartir cache con useFilteredProducts porque tienen lógica diferente:
  // - useBestSellerProducts: filtra 10 productos específicos (BESTSELLER_PRODUCTS_SLUGS)
  // - useFilteredProducts: devuelve todos los productos con los filtros aplicados
  // Esto causa que cuando DynamicProductCarousel o FreeShippingSection cargan,
  // sobrescriben el caché del bestseller con productos incorrectos
  const queryKey = productQueryKeys.bestseller(categorySlug)
  
  // Crear opciones de query usando el factory con la estrategia
  const queryOptions = createProductQueryOptions({
    strategy,
    queryKey,
    enabled: enableCache,
  })
  
  // Usar useQuery con las opciones generadas por el factory
  const { data, isLoading, isFetching, error, refetch } = useQuery(queryOptions)

  // ⚡ OPTIMIZACIÓN: Detección mejorada de loading
  // Con placeholderData, TanStack Query mantiene los datos anteriores mientras carga
  // Solo consideramos que está cargando si no hay datos Y está haciendo la primera carga
  // isFetching indica si está actualizando datos en segundo plano (con datos en cache)
  const isActuallyLoading = isLoading && !data && !error

  return {
    products: Array.isArray(data) ? data : [],
    // ⚡ OPTIMIZACIÓN: Solo retornar loading true si realmente no hay datos
    // Si hay datos en cache (placeholderData), no mostrar loading para mejor UX
    isLoading: isActuallyLoading,
    // Convertir Error a string para mantener compatibilidad con componentes
    error: error ? (error instanceof Error ? error.message : String(error)) : null,
    refetch: () => {
      refetch()
    },
  }
}






