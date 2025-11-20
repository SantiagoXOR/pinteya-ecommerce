import { useState, useEffect, useCallback, useRef } from 'react'
import { Product } from '@/types/product'
import { useBestSellerProducts } from './useBestSellerProducts'
import { getRelatedProducts as getRelatedProductsByName } from '@/lib/api/related-products'
import { getRelatedProducts as getRelatedProductsByCategory } from '@/lib/api/products'
import { ProductWithCategory } from '@/types/api'

interface UseInfiniteProductsOptions {
  currentProductId?: number | string
  currentProductCategoryId?: number
  categorySlug?: string | null
  initialLimit?: number
  loadMoreLimit?: number
}

interface UseInfiniteProductsReturn {
  products: Product[]
  isLoading: boolean
  isLoadingMore: boolean
  error: string | null
  hasMore: boolean
  loadMore: () => void
}

// Función auxiliar para convertir ProductWithCategory a Product
const adaptProduct = (apiProduct: ProductWithCategory | Product | any): Product => {
  // Si ya es un Product, retornarlo directamente
  if (apiProduct.title && apiProduct.imgs) {
    return apiProduct as Product
  }

  // Adaptar desde ProductWithCategory o formato API
  return {
    id: apiProduct.id,
    title: apiProduct.name || apiProduct.title || '',
    name: apiProduct.name || apiProduct.title,
    price: apiProduct.price || 0,
    discountedPrice: apiProduct.discounted_price || apiProduct.discountedPrice || apiProduct.price || 0,
    brand: apiProduct.brand,
    slug: apiProduct.slug || `product-${apiProduct.id}`,
    images: Array.isArray(apiProduct.images) 
      ? apiProduct.images 
      : apiProduct.images?.previews || [],
    imgs: apiProduct.imgs || {
      previews: Array.isArray(apiProduct.images) 
        ? apiProduct.images 
        : apiProduct.images?.previews || [],
      thumbnails: apiProduct.images?.thumbnails || []
    },
    stock: apiProduct.stock || 0,
    category: apiProduct.category?.name || apiProduct.category,
    categoryId: apiProduct.category_id || apiProduct.category?.id,
    variants: apiProduct.variants || [],
    description: apiProduct.description || '',
    reviews: 0,
  }
}

// Función auxiliar para convertir RelatedProduct a Product
const adaptRelatedProduct = (relatedProduct: any): Product => {
  return {
    id: relatedProduct.id,
    title: relatedProduct.name || '',
    name: relatedProduct.name,
    price: parseFloat(relatedProduct.price) || 0,
    discountedPrice: relatedProduct.discounted_price 
      ? parseFloat(relatedProduct.discounted_price) 
      : parseFloat(relatedProduct.price) || 0,
    slug: `product-${relatedProduct.id}`,
    images: [],
    imgs: {
      previews: [],
      thumbnails: []
    },
    stock: relatedProduct.stock || 0,
    reviews: 0,
  }
}

export const useInfiniteProducts = ({
  currentProductId,
  currentProductCategoryId,
  categorySlug = null,
  initialLimit = 20,
  loadMoreLimit = 20,
}: UseInfiniteProductsOptions): UseInfiniteProductsReturn => {
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [currentDisplayLimit, setCurrentDisplayLimit] = useState(initialLimit)
  const usedIdsRef = useRef<Set<number | string>>(new Set())

  // Hook para best sellers
  const { products: bestSellerProducts, isLoading: isLoadingBestSellers } = useBestSellerProducts({
    categorySlug,
  })

  // Función para obtener productos relacionados por nombre (quienes compraron esto también compraron)
  const fetchRelatedByName = useCallback(async (productId: number): Promise<Product[]> => {
    try {
      const productGroup = await getRelatedProductsByName(productId)
      if (!productGroup || !productGroup.products) {
        return []
      }
      
      // Obtener detalles completos de los productos relacionados desde la API
      const relatedIds = productGroup.products
        .filter(p => p.id !== productId)
        .map(p => p.id)
      
      if (relatedIds.length === 0) {
        return []
      }

      // Obtener productos completos desde la API
      const productsPromises = relatedIds.slice(0, 20).map(async (id) => {
        try {
          const response = await fetch(`/api/products/${id}`)
          if (!response.ok) return null
          const result = await response.json()
          if (result.success && result.data) {
            return adaptProduct(result.data)
          }
          return null
        } catch {
          return null
        }
      })

      const fullProducts = (await Promise.all(productsPromises)).filter((p): p is Product => p !== null)
      
      return fullProducts
    } catch (err) {
      console.warn('Error obteniendo productos relacionados por nombre:', err)
      return []
    }
  }, [])

  // Función para obtener productos relacionados por categoría
  const fetchRelatedByCategory = useCallback(async (
    productId: number | string,
    categoryId?: number,
    limit: number = 20
  ): Promise<Product[]> => {
    if (!categoryId) {
      return []
    }

    try {
      const relatedProducts = await getRelatedProductsByCategory(
        typeof productId === 'string' ? parseInt(productId) : productId,
        categoryId,
        limit
      )
      
      return relatedProducts.map(adaptProduct)
    } catch (err) {
      console.warn('Error obteniendo productos relacionados por categoría:', err)
      return []
    }
  }, [])

  // Función principal para combinar todas las fuentes de productos
  const combineProducts = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    usedIdsRef.current.clear()

    try {
      const productId = currentProductId 
        ? (typeof currentProductId === 'string' ? parseInt(currentProductId) : currentProductId)
        : undefined

      if (!productId) {
        // Si no hay producto actual, solo usar best sellers
        const adapted = bestSellerProducts.map(adaptProduct)
        setAllProducts(adapted)
        setDisplayedProducts(adapted.slice(0, currentDisplayLimit))
        setHasMore(adapted.length > currentDisplayLimit)
        setIsLoading(false)
        return
      }

      const combined: Product[] = []
      const usedIds = new Set<number | string>()

      // 1. Productos relacionados por nombre (prioridad alta)
      const relatedByName = await fetchRelatedByName(productId)
      relatedByName.forEach(product => {
        if (!usedIds.has(product.id)) {
          combined.push(product)
          usedIds.add(product.id)
        }
      })

      // 2. Productos relacionados por categoría (prioridad media)
      if (currentProductCategoryId) {
        const relatedByCategory = await fetchRelatedByCategory(
          productId,
          currentProductCategoryId,
          20
        )
        relatedByCategory.forEach(product => {
          if (!usedIds.has(product.id)) {
            combined.push(product)
            usedIds.add(product.id)
          }
        })
      }

      // 3. Best sellers (prioridad baja, para llenar)
      bestSellerProducts.forEach(product => {
        const adapted = adaptProduct(product)
        if (!usedIds.has(adapted.id)) {
          combined.push(adapted)
          usedIds.add(adapted.id)
        }
      })

      // Filtrar el producto actual
      const filtered = combined.filter(p => String(p.id) !== String(productId))

      usedIdsRef.current = usedIds
      setAllProducts(filtered)
      setDisplayedProducts(filtered.slice(0, currentDisplayLimit))
      setHasMore(filtered.length > currentDisplayLimit)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar productos')
      console.error('Error combinando productos:', err)
    } finally {
      setIsLoading(false)
    }
  }, [
    currentProductId,
    currentProductCategoryId,
    bestSellerProducts,
    fetchRelatedByName,
    fetchRelatedByCategory,
    currentDisplayLimit,
  ])

  // Efecto para cargar productos iniciales
  useEffect(() => {
    if (!isLoadingBestSellers) {
      combineProducts()
    }
  }, [combineProducts, isLoadingBestSellers])

  // Función para cargar más productos
  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return

    setIsLoadingMore(true)
    
    setTimeout(() => {
      const newLimit = currentDisplayLimit + loadMoreLimit
      setCurrentDisplayLimit(newLimit)
      setDisplayedProducts(allProducts.slice(0, newLimit))
      setHasMore(newLimit < allProducts.length)
      setIsLoadingMore(false)
    }, 300) // Pequeño delay para UX suave
  }, [isLoadingMore, hasMore, currentDisplayLimit, loadMoreLimit, allProducts])

  return {
    products: displayedProducts,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    loadMore,
  }
}

