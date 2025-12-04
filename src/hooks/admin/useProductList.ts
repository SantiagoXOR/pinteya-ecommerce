import { useState, useEffect } from 'react'

interface Product {
  id: number
  name: string
  description: string
  price: number
  stock: number
  category_id: number
  images: {
    main: string
    gallery: string[]
    previews: string[]
    thumbnails: string[]
  }
  created_at: string
  updated_at: string
  category_name: string
  product_categories?: Array<{ 
    category: { id: number; name: string; slug: string } 
  }> // ✅ NUEVO: Categorías múltiples desde la API
  categories?: Array<{ id: number; name: string; slug: string }> // ✅ Formato procesado para UI
}

interface ProductListResponse {
  data: Product[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * Hook estándar para gestión de productos en el panel administrativo
 *
 * Funcionalidades:
 * - Consulta real a la API /api/admin/products
 * - Carga de 25 productos reales de Supabase por página
 * - Información de paginación completa
 * - Datos completos (nombres, precios, stock, categorías, imágenes)
 *
 * @returns {Object} Estado del hook con productos, loading y error
 */
export function useProductList() {
  console.log('🔧 useProductList: Hook iniciado')
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        console.log('🔧 useProductList: Iniciando fetch...')
        setIsLoading(true)
        setError(null)

        const response = await fetch('/api/admin/products?limit=25', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        console.log('🔧 useProductList: Response status:', response.status)

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }

        const data: ProductListResponse = await response.json()
        console.log('🔧 useProductList: Respuesta completa:', data)
        console.log('🔧 useProductList: data.data:', data.data)

        if (Array.isArray(data.data)) {
          // ✅ Procesar categorías múltiples
          const processedProducts = data.data.map(product => ({
            ...product,
            categories: product.product_categories?.map(pc => pc.category) || []
          }))
          
          setProducts(processedProducts)
          console.log('🔧 useProductList: ✅ Productos cargados:', processedProducts.length)
        } else {
          throw new Error('Estructura de respuesta inválida - data no es un array')
        }
      } catch (err) {
        console.error('🔧 useProductList: ❌ Error:', err)
        setError(err instanceof Error ? err.message : 'Error desconocido')
        setProducts([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [])

  return {
    products,
    isLoading,
    error,
  }
}

export type { Product, ProductListResponse }
