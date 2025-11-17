import { useState, useEffect, useCallback } from 'react'
import { Product } from '@/types/product'

// ===================================
// HOOK: useBestSellerProducts
// ===================================
// Hook específico para BestSeller que maneja:
// - Sin categoría: 10 productos específicos hardcodeados
// - Con categoría: Todos los productos de la categoría (limit 50)

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

// Caché simple en memoria
const productsCache = new Map<string, { products: Product[]; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

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
]

// Helper para ordenar productos según el orden específico
const orderProductsByPriority = (products: Product[], priorityOrder: string[]): Product[] => {
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
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Construir clave de caché
      const cacheKey = categorySlug ? `bestseller-${categorySlug}` : 'bestseller-default'
      
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
      
      if (categorySlug) {
        // Con categoría: traer todos los productos de la categoría con limit 50
        params.append('category', categorySlug)
        params.append('limit', '50')
        params.append('sortBy', 'created_at')
        params.append('sortOrder', 'desc')
      } else {
        // Sin categoría: traer todos los productos para filtrar los 10 específicos
        params.append('limit', '100') // Traer más para asegurar que encontremos los 10
        params.append('sortBy', 'price')
        params.append('sortOrder', 'desc')
      }

      // Fetch productos
      const response = await fetch(`/api/products?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Error al cargar productos')
      }

      const data = await response.json()
      
      // La API puede devolver diferentes estructuras
      let fetchedProducts: Product[] = []
      
      if (Array.isArray(data)) {
        fetchedProducts = data
      } else if (data.products && Array.isArray(data.products)) {
        fetchedProducts = data.products
      } else if (data.data && Array.isArray(data.data)) {
        fetchedProducts = data.data
      } else {
        console.warn('[useBestSellerProducts] Formato de respuesta inesperado:', data)
        fetchedProducts = []
      }

      let finalProducts: Product[] = []
      
      if (!categorySlug) {
        // Sin categoría: filtrar solo los 10 productos específicos
        const specificProducts = fetchedProducts.filter(p => 
          BESTSELLER_PRODUCTS_SLUGS.includes(p.slug || '')
        )
        
        // Ordenar según el orden de prioridad y limitar a 10
        finalProducts = orderProductsByPriority(specificProducts, BESTSELLER_PRODUCTS_SLUGS).slice(0, 10)
      } else {
        // Con categoría: usar todos los productos de la categoría (ya limitados a 50)
        finalProducts = fetchedProducts
      }

      // Guardar en caché
      if (enableCache) {
        productsCache.set(cacheKey, {
          products: finalProducts,
          timestamp: Date.now(),
        })
      }

      setProducts(finalProducts)
    } catch (err) {
      console.error('[useBestSellerProducts] Error:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setProducts([])
    } finally {
      setIsLoading(false)
    }
  }, [categorySlug, enableCache])

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



