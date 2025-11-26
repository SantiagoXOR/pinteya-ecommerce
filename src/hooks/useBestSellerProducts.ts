import { useQuery } from '@tanstack/react-query'
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
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: productQueryKeys.bestseller(categorySlug),
    queryFn: async (): Promise<Product[]> => {
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
      const response = await getProducts(filters)
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al cargar productos')
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
    },
    // Configuración optimizada para Home-v2
    staleTime: enableCache ? 5 * 60 * 1000 : 0, // 5 minutos de caché
    gcTime: 10 * 60 * 1000, // 10 minutos en caché
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    // No refetch automático en focus para mejor performance
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Usar caché si está disponible
    refetchOnReconnect: true, // Refetch si se reconecta
  })

  return {
    products: data || [],
    isLoading,
    // Convertir Error a string para mantener compatibilidad con componentes
    error: error ? (error instanceof Error ? error.message : String(error)) : null,
    refetch: () => {
      refetch()
    },
  }
}






