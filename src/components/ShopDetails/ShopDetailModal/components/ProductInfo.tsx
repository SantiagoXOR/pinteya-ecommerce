/**
 * Componente de información del producto (marca, nombre, precio, stock)
 */

import React from 'react'
import { Package } from '@/lib/optimized-imports'
import { useTenantSafe } from '@/contexts/TenantContext'
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
  const tenant = useTenantSafe()
  const accentColor = tenant?.accentColor || '#ffd549'
  const primaryColor = tenant?.primaryColor || '#f27a1d'

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
            <span
              className='inline-flex items-center px-2 py-0.5 rounded-md text-sm font-semibold uppercase'
              style={{ backgroundColor: accentColor, color: primaryColor }}
            >
              {Math.round(((originalPrice - currentPrice) / originalPrice) * 100)}% OFF
            </span>
          </>
        ) : (
          <span className='text-3xl font-bold text-blaze-orange-600'>
            {formatPrice(currentPrice)}
          </span>
        )}
      </div>

      {/* Categoría y stock en una sola línea */}
      <div className='flex items-center gap-2 text-sm text-gray-600'>
        {fullProductData?.category && (
          <span>
            Categoría: <span className='font-medium'>{fullProductData.category.name}</span>
          </span>
        )}
        {fullProductData?.category && (
          <span className='text-gray-400'>·</span>
        )}
        <span className='flex items-center gap-1.5'>
          <Package className='w-4 h-4 text-gray-500 flex-shrink-0' />
          Stock: <span className='font-medium'>{effectiveStock}</span>
        </span>
      </div>
    </div>
  )
})

ProductInfo.displayName = 'ProductInfo'

