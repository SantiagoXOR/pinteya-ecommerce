/**
 * Hook para manejar la carga de productos relacionados
 */

import { useState, useEffect, useCallback } from 'react'
import { getRelatedProducts, ProductGroup } from '@/lib/api/related-products'
import { logError } from '@/lib/error-handling/centralized-error-handler'

interface Product {
  id: number
  name: string
  price: number
  originalPrice?: number
  image: string
  brand: string
  stock: number
  description?: string
  colors?: any[]
  capacities?: string[]
  slug?: string
}

interface UseRelatedProductsOptions {
  product: Product | null
  open: boolean
  setRelatedProducts: (products: ProductGroup | null) => void
}

/**
 * Hook para cargar productos relacionados
 */
export const useRelatedProducts = ({
  product,
  open,
  setRelatedProducts,
}: UseRelatedProductsOptions) => {
  const [loadingRelatedProducts, setLoadingRelatedProducts] = useState(false)

  // Función para cargar productos relacionados
  const loadRelatedProducts = useCallback(async () => {
    if (!product) return
    
    setLoadingRelatedProducts(true)
    try {
      // Validar que product.id sea un número válido
      if (isNaN(product.id)) {
        console.warn('⚠️ Product ID no es un número válido:', product.id)
        setRelatedProducts(null)
        return
      }
      
      const related = await getRelatedProducts(product.id)
      setRelatedProducts(related)
      // No autoseleccionar un producto relacionado al abrir el modal
      // para no alterar precio/stock iniciales del card
      // La selección se hará sólo cuando el usuario cambie capacidad/ancho
    } catch (error) {
      logError('❌ Error cargando productos relacionados:', error)
      setRelatedProducts(null)
    } finally {
      setLoadingRelatedProducts(false)
    }
  }, [product, setRelatedProducts])

  // Cargar productos relacionados cuando se abre el modal
  useEffect(() => {
    if (open && product) {
      loadRelatedProducts()
    }
  }, [open, product, loadRelatedProducts])

  return {
    loadingRelatedProducts,
    loadRelatedProducts,
  }
}

