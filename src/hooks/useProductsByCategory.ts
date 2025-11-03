import { useState, useEffect, useCallback } from 'react'
import { Product } from '@/types/product'

// ===================================
// HOOK: useProductsByCategory
// ===================================
// Hook personalizado para obtener productos según la categoría seleccionada
// Maneja loading states, errores y caché básico

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

// Caché simple en memoria para evitar fetches repetidos
const productsCache = new Map<string, { products: Product[]; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

export const useProductsByCategory = ({
  categorySlug,
  limit = 12,
  enableCache = true,
}: UseProductsByCategoryOptions): UseProductsByCategoryReturn => {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Construir clave de caché
      const cacheKey = categorySlug || 'free-shipping'
      
      // Verificar caché si está habilitado
      if (enableCache) {
        const cached = productsCache.get(cacheKey)
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          setProducts(cached.products)
          setIsLoading(false)
          return
        }
      }

      // Construir query params
      const params = new URLSearchParams()
      params.append('limit', limit.toString())
      params.append('sortBy', 'created_at')
      params.append('sortOrder', 'desc')
      
      if (categorySlug) {
        // Filtrar por categoría específica
        params.append('category', categorySlug)
      } else {
        // Sin categoría = productos con envío gratis (precio > 50000)
        params.append('priceMin', '50001')
      }

      // Fetch productos
      const response = await fetch(`/api/products?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Error al cargar productos')
      }

      const data = await response.json()
      
      console.log('[useProductsByCategory] Respuesta de API:', {
        categorySlug,
        dataType: typeof data,
        isArray: Array.isArray(data),
        hasProducts: !!data?.products,
        hasData: !!data?.data,
        keys: data ? Object.keys(data) : [],
      })
      
      // La API puede devolver diferentes estructuras:
      // { products: [], total: X } o { data: [], total: X } o directamente []
      let fetchedProducts: Product[] = []
      
      if (Array.isArray(data)) {
        fetchedProducts = data
      } else if (data.products && Array.isArray(data.products)) {
        fetchedProducts = data.products
      } else if (data.data && Array.isArray(data.data)) {
        fetchedProducts = data.data
      } else {
        console.warn('[useProductsByCategory] Formato de respuesta inesperado:', data)
        fetchedProducts = []
      }
      
      console.log('[useProductsByCategory] Productos procesados:', fetchedProducts.length)

      // Guardar en caché
      if (enableCache) {
        productsCache.set(cacheKey, {
          products: fetchedProducts,
          timestamp: Date.now(),
        })
      }

      setProducts(fetchedProducts)
    } catch (err) {
      console.error('[useProductsByCategory] Error:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setProducts([])
    } finally {
      setIsLoading(false)
    }
  }, [categorySlug, limit, enableCache])

  // Effect para fetch automático al cambiar categoría
  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  return {
    products,
    isLoading,
    error,
    refetch: fetchProducts,
  }
}

