import { useQuery } from '@tanstack/react-query'
import { Product } from '@/types/product'
import { getProducts } from '@/lib/api/products'
import { adaptApiProductsToLegacy } from '@/lib/adapters/productAdapter'
import { productQueryKeys, normalizeProductFilters } from './queries/productQueryKeys'

// ===================================
// HOOK: useBestSellerProducts
// ===================================
// Hook específico para BestSeller que maneja:
// - Sin categoría: 10 productos específicos hardcodeados
// - Con categoría: Todos los productos de la categoría (limit 50)
// Ahora usa TanStack Query para mejor performance y caché automático

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

// Lista de 10 productos bestseller específicos (orden prioritario)
const BESTSELLER_PRODUCTS_SLUGS = [
  'latex-impulso-generico',                    // 1. Latex Impulso 20L
  'plavipint-fibrado-plavicon',                // 2. Plavicon Fibrado 20L
  'membrana-performa-20l-plavicon',            // 3. Membrana Performa Plavicon 20L
  'plavipint-techos-poliuretanico',            // 4. Recuplast Techos 20L
  'recuplast-interior',                         // 5. Recuplast Interior 20L
  'techos-poliuretanico',                       // 6. Plavicon Interior 20L
  'latex-muros',                                // 7. Plavicon Muros 20L
  'hidroesmalte-4l',                            // 8. Hidroesmalte 4L (slug a verificar)
  'piscinas-solvente-plavipint-plavicon',      // 9. Pintura Piscinas Plavicon
  'cielorrasos',                                // 10. Cielorraso Plavicon 20L
] as const

// Helper para ordenar productos según el orden específico
const orderProductsByPriority = (products: Product[], priorityOrder: readonly string[]): Product[] => {
  const orderedProducts: Product[] = []
  const usedIds = new Set<string | number>()
  
  // Agregar productos en el orden especificado
  priorityOrder.forEach(slug => {
    const product = products.find(p => p.slug === slug)
    if (product && !usedIds.has(product.id)) {
      orderedProducts.push(product)
      usedIds.add(product.id)
    }
  })
  
  return orderedProducts
}

export const useBestSellerProducts = ({
  categorySlug,
  enableCache = true,
}: UseBestSellerProductsOptions): UseBestSellerProductsReturn => {
  
  // ✅ FIX: Usar el mismo formato que useProductsByCategory para evitar errores de TypeScript
  // ⚡ OPTIMIZACIÓN: Normalizar filtros para compartir cache con useFilteredProducts
  const filters = {
    limit: categorySlug ? 20 : 30,
    sortBy: categorySlug ? 'created_at' : 'price',
    sortOrder: 'desc' as const,
    ...(categorySlug ? { category: categorySlug } : {}),
  }
  const normalizedFilters = normalizeProductFilters(filters)
  
  // ⚡ OPTIMIZACIÓN: Si no hay categoría, usar la misma queryKey que useFilteredProducts
  // para compartir cache entre componentes
  const queryKey = categorySlug 
    ? ['products', 'bestsellers', normalizedFilters] as const
    : ['filtered-products', normalizedFilters] as const
  
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey,
    queryFn: async (): Promise<Product[]> => {
      try {
        // ⚡ OPTIMIZACIÓN: Usar los mismos filtros normalizados que se usaron en queryKey
        // Esto asegura consistencia y permite compartir cache con useFilteredProducts
        const filters: any = normalizedFilters

        // Fetch productos usando la función de API existente
        const response = await getProducts(filters)
        
        // ✅ FIX: Verificar que response existe antes de acceder a sus propiedades
        if (!response) {
          throw new Error('Respuesta vacía del servidor')
        }
        
        // ✅ FIX CRÍTICO: Si la respuesta no es exitosa, lanzar error para que la query se complete
        if (!response || !response.success) {
          const errorMessage = response?.message || response?.error || 'Error al cargar productos'
          throw new Error(errorMessage)
        }

        // ✅ FIX: Verificar que hay datos antes de procesar
        if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
          // Si no hay datos pero la respuesta fue exitosa, devolver array vacío (no es error)
          return []
        }

        // Adaptar productos del formato API al formato legacy
        const fetchedProducts = adaptApiProductsToLegacy(response.data)
        
        let finalProducts: Product[]
        
        if (!categorySlug) {
          // Sin categoría: filtrar solo los 10 productos específicos
          const specificProducts = fetchedProducts.filter(p => 
            BESTSELLER_PRODUCTS_SLUGS.includes((p.slug || '') as any)
          )
          
          // Ordenar según el orden de prioridad y limitar a 10
          finalProducts = orderProductsByPriority(specificProducts, BESTSELLER_PRODUCTS_SLUGS).slice(0, 10)
        } else {
          // Con categoría: usar todos los productos de la categoría
          finalProducts = fetchedProducts
        }

        return finalProducts
      } catch (err) {
        // ✅ FIX: Asegurar que siempre se lance un error válido para que la query se complete
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
    // ✅ FIX: Asegurar que la query siempre se ejecute
    enabled: true,
    // ⚡ OPTIMIZACIÓN: placeholderData para mantener datos anteriores mientras carga (reemplaza skeletons)
    // Esto mejora la UX mostrando datos en cache inmediatamente mientras se actualizan en segundo plano
    placeholderData: (previousData) => previousData,
    // ⚡ OPTIMIZACIÓN: staleTime de 10 minutos para reducir refetches innecesarios
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos en caché
    // ✅ FIX: Aumentar retries para dar más oportunidades (igual que otras secciones)
    retry: 2, // Cambiar de 1 a 2 (igual que useFilteredProducts)
    // ✅ FIX: Usar exponential backoff como otras secciones
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    // No refetch automático en focus para mejor performance
    refetchOnWindowFocus: false,
    // ⚡ FIX: Cambiar de 'always' a false para evitar recargas innecesarias
    // TanStack Query usará los datos en cache si están frescos (dentro de staleTime)
    // placeholderData mantendrá los datos anteriores durante actualizaciones en segundo plano
    // Solo se refetcheará si los datos están stale (más antiguos que staleTime)
    refetchOnMount: false,
    refetchOnReconnect: true, // Refetch si se reconecta
  })

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






