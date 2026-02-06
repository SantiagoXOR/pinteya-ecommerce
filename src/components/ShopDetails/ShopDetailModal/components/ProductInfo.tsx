/**
 * Componente de información del producto (marca, nombre, precio, stock)
 */

import React from 'react'
import { Package } from '@/lib/optimized-imports'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '../utils/price-utils'

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

interface ProductWithCategory {
  name?: string
  brand?: string
  category?: {
    name: string
  }
}

interface ProductInfoProps {
  product: Product | null
  fullProductData: ProductWithCategory | null
  currentPrice: number
  originalPrice: number | undefined
  effectiveStock: number
  hasVariantDiscount: boolean
}

/**
 * Información del producto memoizada
 */
export const ProductInfo = React.memo<ProductInfoProps>(({
  product,
  fullProductData,
  currentPrice,
  originalPrice,
  effectiveStock,
  hasVariantDiscount,
}) => {
  return (
    <div className='space-y-2'>
      {/* Nombre y marca se muestran en el header del modal */}
      <div className='flex items-center gap-3'>
        {hasVariantDiscount && originalPrice ? (
          <>
            <span className='text-3xl font-bold text-blaze-orange-600'>
              {formatPrice(currentPrice)}
            </span>
            <span className='text-xl text-gray-500 line-through'>
              {formatPrice(originalPrice)}
            </span>
            <Badge variant='destructive' className='text-sm'>
              {Math.round(((originalPrice - currentPrice) / originalPrice) * 100)}% OFF
            </Badge>
          </>
        ) : (
          <span className='text-3xl font-bold text-blaze-orange-600'>
            {formatPrice(currentPrice)}
          </span>
        )}
      </div>

      {/* Mostrar categoría si está disponible */}
      {fullProductData?.category && (
        <p className='text-sm text-gray-600'>
          Categoría: <span className='font-medium'>{fullProductData.category.name}</span>
        </p>
      )}

      {/* Mostrar stock */}
      <div className='flex items-center gap-2'>
        <Package className='w-4 h-4 text-gray-500' />
        <span className='text-sm text-gray-600'>
          Stock: <span className='font-medium'>{effectiveStock}</span>
        </span>
      </div>
    </div>
  )
})

ProductInfo.displayName = 'ProductInfo'

