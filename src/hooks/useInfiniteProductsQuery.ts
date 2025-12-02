import { useInfiniteQuery } from '@tanstack/react-query'
import { Product } from '@/types/product'
import { useBestSellerProducts } from './useBestSellerProducts'
import { getRelatedProducts as getRelatedProductsByName } from '@/lib/api/related-products'
import { getRelatedProducts as getRelatedProductsByCategory } from '@/lib/api/products'
import { ProductWithCategory } from '@/types/api'

// Marcas premium que deben aparecer primero
const PREMIUM_BRANDS = ['Plavicon', 'Sinteplast']

// Cargar todos los productos de una vez (sin paginación)
const PRODUCTS_PER_PAGE = 9999 // Número grande para cargar todos

interface UseInfiniteProductsQueryOptions {
  currentProductId?: number | string
  currentProductCategoryId?: number
  categorySlug?: string | null
}

interface ProductsPage {
  products: Product[]
  nextPage: number | undefined
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

// Función para obtener productos relacionados por nombre
const fetchRelatedByName = async (productId: number): Promise<Product[]> => {
  try {
    const productGroup = await getRelatedProductsByName(productId)
    if (!productGroup || !productGroup.products) {
      return []
    }
    
    const relatedIds = productGroup.products
      .filter(p => p.id !== productId)
      .map(p => p.id)
    
    if (relatedIds.length === 0) {
      return []
    }

    const productsPromises = relatedIds.slice(0, 100).map(async (id) => { // Límite máximo permitido por la API
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
}

// Función para obtener productos relacionados por categoría
const fetchRelatedByCategory = async (
  productId: number | string,
  categoryId: number,
  limit: number = 20
): Promise<Product[]> => {
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
}

// Función para obtener productos premium
const fetchPremiumProducts = async (limit: number = 30): Promise<Product[]> => {
  try {
    const params = new URLSearchParams()
    params.append('brands', PREMIUM_BRANDS.join(','))
    params.append('limit', limit.toString())
    params.append('sortBy', 'price')
    params.append('sortOrder', 'desc')

    const response = await fetch(`/api/products?${params.toString()}`)
    if (!response.ok) {
      return []
    }

    const data = await response.json()
    let fetchedProducts: any[] = []

    if (Array.isArray(data)) {
      fetchedProducts = data
    } else if (data.products && Array.isArray(data.products)) {
      fetchedProducts = data.products
    } else if (data.data && Array.isArray(data.data)) {
      fetchedProducts = data.data
    }

    return fetchedProducts.map(adaptProduct)
  } catch (err) {
    console.warn('Error obteniendo productos premium:', err)
    return []
  }
}

// Función para ordenar productos (premium primero, luego por precio)
const sortProducts = (products: Product[]): Product[] => {
  return products.sort((a, b) => {
    const brandA = (a.brand || '').trim()
    const brandB = (b.brand || '').trim()
    const isPremiumA = PREMIUM_BRANDS.some(premium => 
      brandA.toLowerCase().includes(premium.toLowerCase())
    )
    const isPremiumB = PREMIUM_BRANDS.some(premium => 
      brandB.toLowerCase().includes(premium.toLowerCase())
    )

    // Si uno es premium y el otro no, el premium va primero
    if (isPremiumA && !isPremiumB) return -1
    if (!isPremiumA && isPremiumB) return 1

    // Si ambos son premium o ambos no lo son, ordenar por precio
    const priceA = a.discountedPrice || a.price || 0
    const priceB = b.discountedPrice || b.price || 0
    return priceB - priceA // Descendente (más caro primero)
  })
}

// Cache global para productos combinados (se calcula una vez por query key)
const productsCache = new Map<string, Product[]>()

// Función para obtener una página de productos
const fetchProductsPage = async (
  pageParam: number,
  options: UseInfiniteProductsQueryOptions,
  cacheKey: string
): Promise<ProductsPage> => {
  const { currentProductId, currentProductCategoryId } = options
  
  const productId = currentProductId 
    ? (typeof currentProductId === 'string' ? parseInt(currentProductId) : currentProductId)
    : undefined

  // Si no hay producto actual, retornar vacío (se manejará en el hook con best sellers)
  if (!productId) {
    return { products: [], nextPage: undefined }
  }

  // Verificar cache primero
  let allCombinedProducts = productsCache.get(cacheKey)
  
  if (!allCombinedProducts) {
    // Cache miss: calcular todos los productos combinados
    allCombinedProducts = []
    const usedIds = new Set<number | string>()

    // Cargar todas las fuentes de datos en paralelo con límites máximos permitidos por la API
    // Nota: getRelatedProducts suma +1 al límite, así que usamos 99 para que el máximo sea 100
    const [premiumProducts, relatedByName, relatedByCategory] = await Promise.all([
      fetchPremiumProducts(100), // Límite máximo permitido por la API
      fetchRelatedByName(productId), // Ya tiene límite de 20 en la función
      currentProductCategoryId 
        ? fetchRelatedByCategory(productId, currentProductCategoryId, 99) // 99 porque getRelatedProducts suma +1 (máx 100)
        : Promise.resolve([])
    ])

    // 0. Productos premium (máxima prioridad)
    premiumProducts.forEach(product => {
      if (!usedIds.has(product.id) && String(product.id) !== String(productId)) {
        allCombinedProducts!.push(product)
        usedIds.add(product.id)
      }
    })

    // 1. Productos relacionados por nombre (prioridad alta)
    relatedByName.forEach(product => {
      if (!usedIds.has(product.id)) {
        allCombinedProducts!.push(product)
        usedIds.add(product.id)
      }
    })

    // 2. Productos relacionados por categoría (prioridad media)
    relatedByCategory.forEach(product => {
      if (!usedIds.has(product.id)) {
        allCombinedProducts!.push(product)
        usedIds.add(product.id)
      }
    })

    // Filtrar el producto actual
    const filtered = allCombinedProducts.filter(p => String(p.id) !== String(productId))

    // Ordenar productos
    allCombinedProducts = sortProducts(filtered)

    // Guardar en cache
    productsCache.set(cacheKey, allCombinedProducts)
  }

  // Retornar todos los productos sin paginación
  return {
    products: allCombinedProducts,
    nextPage: undefined // No hay más páginas, cargamos todo de una vez
  }
}

export const useInfiniteProductsQuery = ({
  currentProductId,
  currentProductCategoryId,
  categorySlug = null,
}: UseInfiniteProductsQueryOptions) => {
  // Hook para best sellers (necesario para el caso sin producto actual)
  const { products: bestSellerProducts, isLoading: isLoadingBestSellers } = useBestSellerProducts({
    categorySlug,
  })

  const productId = currentProductId 
    ? (typeof currentProductId === 'string' ? parseInt(currentProductId) : currentProductId)
    : undefined

  // Query key que incluye todos los parámetros relevantes para el cache
  const queryKey = [
    'infinite-products',
    currentProductId,
    currentProductCategoryId,
    categorySlug,
  ]

  // Crear cache key único para esta query
  const cacheKey = queryKey.join('-')

  const {
    data,
    isLoading,
    isFetching,
    error,
  } = useInfiniteQuery<ProductsPage>({
    queryKey,
    queryFn: async ({ pageParam = 1 }) => {
      // Si no hay producto actual, usar best sellers
      if (!productId) {
        const adapted = bestSellerProducts.map(adaptProduct)
        const sorted = sortProducts(adapted)
        // Cargar todos los productos de una vez
        return {
          products: sorted,
          nextPage: undefined // No hay más páginas
        }
      }

      // Cargar todos los productos de una vez usando fetchProductsPage que ya maneja el cache
      const result = await fetchProductsPage(1, {
        currentProductId,
        currentProductCategoryId,
        categorySlug,
      }, cacheKey)
      
      // Obtener todos los productos del cache (ya fueron calculados en fetchProductsPage)
      const allProducts = productsCache.get(cacheKey) || result.products
      
      return {
        products: allProducts,
        nextPage: undefined // No hay más páginas
      }
    },
    getNextPageParam: () => undefined, // Siempre undefined para cargar todo de una vez
    initialPageParam: 1,
    enabled: !isLoadingBestSellers,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 10, // 10 minutos (cache time)
    refetchOnWindowFocus: false,
  })

  // Obtener todos los productos de la primera página (única página)
  const products = data?.pages[0]?.products || []

  return {
    products,
    isLoading: isLoading || isLoadingBestSellers,
    isLoadingMore: false, // Ya no hay paginación
    isFetching,
    error: error ? (error instanceof Error ? error.message : 'Error al cargar productos') : null,
    hasMore: false, // Ya no hay más páginas
    fetchNextPage: () => {}, // No-op function
  }
}

