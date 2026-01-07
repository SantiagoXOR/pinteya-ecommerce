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
  
  // ✅ LOG: Verificar que el hook se está ejecutando
  console.log('🟡 [useBestSellerProducts] HOOK EJECUTÁNDOSE', {
    categorySlug,
    timestamp: new Date().toISOString(),
    isClient: typeof window !== 'undefined'
  })
  
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
      console.log('🟡 [useBestSellerProducts] INICIANDO QUERY', { categorySlug })
      try {
        // ⚡ OPTIMIZACIÓN: Usar los mismos filtros normalizados que se usaron en queryKey
        // Esto asegura consistencia y permite compartir cache con useFilteredProducts
        const filters: any = normalizedFilters

        // Fetch productos usando la función de API existente
        console.log('🟡 [useBestSellerProducts] Llamando getProducts con filters:', filters)
        const response = await getProducts(filters)
        
        // ✅ FIX: Verificar que response existe antes de acceder a sus propiedades
        if (!response) {
          throw new Error('Respuesta vacía del servidor')
        }
        
        console.log('🟡 [useBestSellerProducts] Respuesta recibida:', {
          success: response?.success,
          hasData: !!response?.data,
          dataLength: Array.isArray(response?.data) ? response.data.length : 'NO ARRAY',
          message: response?.message
        })
        
        // ✅ FIX CRÍTICO: Si la respuesta no es exitosa, lanzar error para que la query se complete
        if (!response || !response.success) {
          const errorMessage = response?.message || response?.error || 'Error al cargar productos'
          console.error('🟡 [useBestSellerProducts] ❌ Respuesta no exitosa:', errorMessage)
          throw new Error(errorMessage)
        }

        // ✅ FIX: Verificar que hay datos antes de procesar
        if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
          console.warn('🟡 [useBestSellerProducts] ⚠️ No hay datos en la respuesta, devolviendo array vacío')
          // Si no hay datos pero la respuesta fue exitosa, devolver array vacío (no es error)
          return []
        }

        // Adaptar productos del formato API al formato legacy
        const fetchedProducts = adaptApiProductsToLegacy(response.data)
        console.log('🟡 [useBestSellerProducts] Productos adaptados:', fetchedProducts.length)
        
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

        console.log('🟡 [useBestSellerProducts] ✅ Query completada exitosamente:', {
          finalProductsCount: finalProducts.length,
          categorySlug
        })
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
        
        console.error('🟡 [useBestSellerProducts] ❌ Error en queryFn:', errorMessage, err)
        throw new Error(errorMessage)
      }
    },
    // ✅ FIX: Asegurar que la query siempre se ejecute
    enabled: true,
    // ⚡ OPTIMIZACIÓN: staleTime de 10 minutos para reducir refetches innecesarios
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos en caché
    // ✅ FIX: Aumentar retries para dar más oportunidades (igual que otras secciones)
    retry: 2, // Cambiar de 1 a 2 (igual que useFilteredProducts)
    // ✅ FIX: Usar exponential backoff como otras secciones
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    // No refetch automático en focus para mejor performance
    refetchOnWindowFocus: false,
    // ⚡ FIX HIDRATACIÓN: refetchOnMount: true para asegurar que se ejecute durante la hidratación
    // Esto asegura que los datos se carguen correctamente incluso si no están en cache
    refetchOnMount: true, // Cambiar a true para asegurar carga durante hidratación
    refetchOnReconnect: true, // Refetch si se reconecta
  })

  // ⚡ OPTIMIZACIÓN: Eliminado useEffect que fuerza refetch - React Query maneja esto automáticamente
  // ⚡ OPTIMIZACIÓN: Eliminado useEffect de logging - no es necesario para producción

  // ✅ FIX: Mejorar detección de loading - mostrar productos en cache incluso si está "loading"
  // Si hay datos disponibles, no mostrar loading (incluso si React Query dice que está loading)
  // Considerar que está cargando solo si isLoading es true Y no hay datos Y no hay error
  const isActuallyLoading = isLoading && !data && !error

  console.log('🟡 [useBestSellerProducts] Retornando valores:', {
    productsCount: Array.isArray(data) ? data.length : 0,
    isActuallyLoading,
    isLoading,
    isFetching,
    hasError: !!error,
    hasData: !!data
  })

  return {
    products: Array.isArray(data) ? data : [],
    isLoading: isActuallyLoading,
    // Convertir Error a string para mantener compatibilidad con componentes
    error: error ? (error instanceof Error ? error.message : String(error)) : null,
    refetch: () => {
      console.log('🟡 [useBestSellerProducts] refetch() llamado manualmente')
      refetch()
    },
  }
}






