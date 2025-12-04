import { useQuery } from '@tanstack/react-query'
import { Product } from '@/types/product'
import { getProducts } from '@/lib/api/products'
import { adaptApiProductsToLegacy } from '@/lib/adapters/productAdapter'
import { productQueryKeys } from './queries/productQueryKeys'

// ===================================
// HOOK: useProductsByCategory
// ===================================
// Hook personalizado para obtener productos según la categoría seleccionada
// Maneja loading states, errores y caché básico
// Ahora usa TanStack Query para mejor performance y caché automático

interface UseProductsByCategoryOptions {
  categorySlug: string | null
  limit?: number
  enableCache?: boolean
}

interface UseProductsByCategoryReturn {
  products: Product[]
  isLoading: boolean
  error: string | null
  refetch: () => void
}

// Slugs específicos de productos para "Envío Gratis" (orden prioritario)
const FREE_SHIPPING_PRODUCTS_SLUGS = [
  'latex-impulso-generico',           // 1. Látex Impulso
  'plavipint-fibrado-plavicon',       // 2. Plavicon Fibrado  
  'membrana-performa-20l-plavicon',   // 3. Membrana Performa
  'plavipint-techos-poliuretanico',   // 4. Recuplast Techos (Plavipint Techos)
  'recuplast-interior',                // 5. Recuplast Interior
  'techos-poliuretanico',              // 6. Plavicon Interior (Techos Poliuretánico)
  'latex-muros',                       // 7. Plavicon Muros (Látex Muros)
  'piscinas-solvente-plavipint-plavicon', // 8. Pintura Piscina
  'cielorrasos',                       // 9. Cielorraso
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
  
  // Agregar productos restantes que no estaban en el orden
  products.forEach(p => {
    if (!usedIds.has(p.id)) {
      orderedProducts.push(p)
      usedIds.add(p.id)
    }
  })
  
  return orderedProducts
}

export const useProductsByCategory = ({
  categorySlug,
  limit = 12,
  enableCache = true,
}: UseProductsByCategoryOptions): UseProductsByCategoryReturn => {
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['products', 'categories', categorySlug ?? 'free-shipping', limit ?? 12] as const,
    queryFn: async (): Promise<Product[]> => {
      // Construir filtros
      const filters: any = {
        limit: 100, // Traer más productos para luego filtrar
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
        // Si es "Envío Gratis" (sin categoría), filtrar y ordenar productos específicos
        const specificProducts = fetchedProducts.filter(p => 
          FREE_SHIPPING_PRODUCTS_SLUGS.includes((p.slug || '') as any)
        )
        
        // Ordenar según el orden de prioridad
        finalProducts = orderProductsByPriority(specificProducts, FREE_SHIPPING_PRODUCTS_SLUGS)
      } else {
        finalProducts = fetchedProducts
      }

      // Limitar resultados según el parámetro limit
      return finalProducts.slice(0, limit)
    },
    // Configuración optimizada
    staleTime: enableCache ? 5 * 60 * 1000 : 0, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
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

