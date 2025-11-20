import { useState, useEffect, useCallback, useRef } from 'react'
import React from 'react'
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
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fetchingRef = useRef(false)
  const categorySlugRef = useRef<string | null>(null)
  const hasInitializedRef = useRef(false)

  const fetchProducts = useCallback(async () => {
    // Evitar múltiples fetches simultáneos
    if (fetchingRef.current) return

    fetchingRef.current = true
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
          fetchingRef.current = false
          categorySlugRef.current = categorySlug
          return
        }
      }

      // Construir query params
      const params = new URLSearchParams()
      params.append('limit', '100') // Traer más productos para luego filtrar
      
      if (categorySlug) {
        // Filtrar por categoría específica
        params.append('category', categorySlug)
        params.append('sortBy', 'created_at')
        params.append('sortOrder', 'desc')
      } else {
        // Sin categoría = traer todos para luego filtrar los específicos
        params.append('sortBy', 'price')
        params.append('sortOrder', 'desc')
      }

      // Fetch productos
      const response = await fetch(`/api/products?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Error al cargar productos')
      }

      const data = await response.json()
      
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

      // Si es "Envío Gratis" (sin categoría), filtrar y ordenar productos específicos
      let finalProducts: Product[] = []
      
      if (!categorySlug) {
        // Filtrar solo los productos específicos de la lista
        const specificProducts = fetchedProducts.filter(p => 
          FREE_SHIPPING_PRODUCTS_SLUGS.includes(p.slug || '')
        )
        
        // Ordenar según el orden de prioridad
        finalProducts = orderProductsByPriority(specificProducts, FREE_SHIPPING_PRODUCTS_SLUGS)
      } else {
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
      categorySlugRef.current = categorySlug
    } catch (err) {
      console.error('[useProductsByCategory] Error:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setProducts([])
    } finally {
      setIsLoading(false)
      fetchingRef.current = false
    }
  }, [categorySlug, limit, enableCache])

  // Effect para fetch automático cuando cambia categorySlug o en el primer render
  useEffect(() => {
    // Hacer fetch si es el primer render o si la categoría cambió
    if (!hasInitializedRef.current || categorySlugRef.current !== categorySlug) {
      hasInitializedRef.current = true
      fetchProducts()
    }
  }, [categorySlug, fetchProducts])

  return {
    products,
    isLoading,
    error,
    refetch: fetchProducts,
  }
}

