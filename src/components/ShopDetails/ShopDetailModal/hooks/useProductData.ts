/**
 * Hook para manejar la carga de datos completos del producto
 * Extrae lógica de carga de datos y detección de productType
 */

import { useState, useEffect, useMemo } from 'react'
import { getProductById } from '@/lib/api/products'
import { ProductWithCategory } from '@/types/api'
import { detectProductType } from '@/utils/product-utils'
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

/**
 * Hook para cargar datos completos del producto y detectar productType
 */
export const useProductData = (
  product: Product | null,
  open: boolean
) => {
  const [fullProductData, setFullProductData] = useState<ProductWithCategory | null>(null)
  const [loadingProductData, setLoadingProductData] = useState(false)

  // Cargar datos completos del producto cuando se abre el modal
  useEffect(() => {
    console.log('🔄 ShopDetailModal useEffect[1]: open =', open, 'product?.id =', product?.id)
    if (open && product?.id) {
      const rawId = product.id as unknown as string | number
      const productId = typeof rawId === 'number' ? rawId : parseInt(String(rawId), 10)
      if (!Number.isFinite(productId) || productId <= 0) {
        console.warn('⚠️ ID de producto inválido al cargar datos completos:', rawId)
        return
      }
      console.log('🔄 ShopDetailModal useEffect[1]: Cargando datos del producto', productId)
      setLoadingProductData(true)
      getProductById(productId)
        .then(productData => {
          const realProduct =
            productData && typeof productData === 'object' && 'data' in (productData as any)
              ? (productData as any).data
              : productData
          setFullProductData(realProduct || null)
          console.debug('🧩 ShopDetailModal: Datos completos del producto cargados:', realProduct)
        })
        .catch(error => {
          logError('Error cargando datos completos del producto:', error)
          setFullProductData(null)
        })
        .finally(() => {
          setLoadingProductData(false)
        })
    }
  }, [open, product?.id])

  // Detectar tipo de producto usando datos completos si están disponibles
  const productType = useMemo(() => {
    return detectProductType(
      fullProductData?.name || product?.name || '', 
      fullProductData?.category?.name || ''
    )
  }, [fullProductData?.name, fullProductData?.category?.name, product?.name])

  return {
    fullProductData,
    loadingProductData,
    productType,
  }
}

