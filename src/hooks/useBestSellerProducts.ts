import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { Product } from '@/types/product'
import { getProducts } from '@/lib/api/products'
import { adaptApiProductsToLegacy } from '@/lib/adapters/productAdapter'
import { productQueryKeys } from './queries/productQueryKeys'

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
  
  const hasMountedRef = useRef(false)
  
  // ✅ FIX: Usar el mismo formato que useProductsByCategory para evitar errores de TypeScript
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['products', 'bestsellers', categorySlug ?? null] as const,
    queryFn: async (): Promise<Product[]> => {
      console.log('🟡 [useBestSellerProducts] INICIANDO QUERY', { categorySlug })
      try {
        // Construir filtros según si hay categoría o no
        const filters: any = {
          limit: categorySlug ? 50 : 100,
          sortBy: categorySlug ? 'created_at' : 'price',
          sortOrder: 'desc',
        }
        
        if (categorySlug) {
          filters.category = categorySlug
        }

        // Fetch productos usando la función de API existente
        console.log('🟡 [useBestSellerProducts] Llamando getProducts con filters:', filters)
        const response = await getProducts(filters)
        console.log('🟡 [useBestSellerProducts] Respuesta recibida:', {
          success: response.success,
          hasData: !!response.data,
          dataLength: Array.isArray(response.data) ? response.data.length : 'NO ARRAY',
          message: response.message
        })
        
        // ✅ FIX CRÍTICO: Si la respuesta no es exitosa, lanzar error para que la query se complete
        if (!response.success) {
          console.error('🟡 [useBestSellerProducts] ❌ Respuesta no exitosa:', response.message || response.error)
          throw new Error(response.message || response.error || 'Error al cargar productos')
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
        // ✅ FIX: Asegurar que siempre se lance un error para que la query se complete
        const errorMessage = err instanceof Error ? err.message : 'Error inesperado al cargar productos'
        console.error('🟡 [useBestSellerProducts] ❌ Error en queryFn:', errorMessage, err)
        throw new Error(errorMessage)
      }
    },
    // ✅ FIX: Asegurar que la query siempre se ejecute
    enabled: true,
    // ✅ FIX CRÍTICO: staleTime en 0 para forzar ejecución en primer mount
    // Esto asegura que la query se ejecute incluso si hay datos en caché
    staleTime: 0, // Forzar ejecución en primer render
    gcTime: 10 * 60 * 1000, // 10 minutos en caché
    retry: 1, // Reducir retries para evitar esperas largas
    retryDelay: 2000, // 2 segundos entre retries
    // No refetch automático en focus para mejor performance
    refetchOnWindowFocus: false,
    refetchOnMount: 'always', // ✅ FIX CRÍTICO: Siempre ejecutar en mount, incluso con datos frescos
    refetchOnReconnect: true, // Refetch si se reconecta
  })

  // ✅ FIX CRÍTICO: Forzar ejecución en el primer mount del cliente
  useEffect(() => {
    if (!hasMountedRef.current && typeof window !== 'undefined') {
      hasMountedRef.current = true
      console.log('🟡 [useBestSellerProducts] Primer mount detectado, forzando refetch si es necesario', {
        hasData: !!data,
        hasError: !!error
      })
      // Forzar refetch en el primer mount del cliente
      if (!data && !error) {
        console.log('🟡 [useBestSellerProducts] Ejecutando refetch() manual')
        refetch()
      }
    }
  }, [data, error, refetch])

  // ✅ LOG: Estado de la query
  useEffect(() => {
    console.log('🟡 [useBestSellerProducts] Estado de la query cambió:', {
      isLoading,
      isFetching,
      hasData: !!data,
      dataLength: Array.isArray(data) ? data.length : 0,
      hasError: !!error,
      errorMessage: error ? (error instanceof Error ? error.message : String(error)) : null
    })
  }, [isLoading, isFetching, data, error])

  // ✅ FIX CRÍTICO: Determinar loading de forma más confiable
  // isLoading puede quedarse en true si la query nunca se completa
  // Si hay datos, no mostrar loading aunque isLoading sea true
  // Si hay error, no mostrar loading
  // Usar isLoading directamente pero verificar que no haya datos
  const isActuallyLoading = isLoading && !data && !error

  console.log('🟡 [useBestSellerProducts] Retornando valores:', {
    productsCount: Array.isArray(data) ? data.length : 0,
    isActuallyLoading,
    hasError: !!error
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






