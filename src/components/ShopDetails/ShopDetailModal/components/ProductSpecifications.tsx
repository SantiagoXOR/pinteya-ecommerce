/**
 * Componente de especificaciones técnicas del producto
 */

import React from 'react'
import { Package, Ruler, Hash } from '@/lib/optimized-imports'

interface ProductWithCategory {
  description?: string
  specifications?: Record<string, any>
  features?: Record<string, any>
  weight?: string | number
  dimensions?: string | Record<string, any>
  sku?: string
}

interface Product {
  description?: string
}

interface ProductSpecificationsProps {
  fullProductData: ProductWithCategory | null
  product: Product | null
}

/**
 * Especificaciones del producto memoizadas
 */
export const ProductSpecifications = React.memo<ProductSpecificationsProps>(({
  fullProductData,
  product,
}) => {
  const hasSpecs = fullProductData?.specifications && Object.keys(fullProductData.specifications).length > 0
  const hasFeatures = fullProductData?.features && Object.keys(fullProductData.features).length > 0
  const hasDescription = fullProductData?.description || product?.description

  if (!hasSpecs && !hasFeatures && !hasDescription && !fullProductData?.weight && !fullProductData?.dimensions && !fullProductData?.sku) {
    return null
  }

  return (
    <div className='space-y-4'>
      {/* Descripción */}
      {hasDescription && (
        <div>
          <p className='text-gray-600 leading-relaxed'>
            {fullProductData?.description || product?.description}
          </p>
        </div>
      )}

      {/* Especificaciones técnicas */}
      {hasSpecs && (
        <div>
          <h3 className='text-lg font-semibold text-gray-900 mb-3'>Especificaciones Técnicas</h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
            {Object.entries(fullProductData.specifications).map(([key, value]) => (
              <div key={key} className='flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg'>
                <span className='text-sm font-medium text-gray-700 capitalize'>
                  {key.replace(/_/g, ' ')}:
                </span>
                <span className='text-sm text-gray-600'>{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Características del producto */}
      {hasFeatures && (
        <div>
          <h3 className='text-lg font-semibold text-gray-900 mb-3'>Características</h3>
          <div className='space-y-2'>
            {Object.entries(fullProductData.features).map(([key, value]) => (
              <div key={key} className='flex items-start gap-2'>
                <div className='w-2 h-2 bg-blaze-orange-500 rounded-full mt-2 flex-shrink-0'></div>
                <div className='flex-1'>
                  <span className='text-sm font-medium text-gray-700 capitalize'>
                    {key.replace(/_/g, ' ')}:
                  </span>
                  <span className='text-sm text-gray-600 ml-2'>{String(value)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Información adicional */}
      <div className='space-y-2'>
        {fullProductData?.weight && (
          <div className='flex items-center gap-2 text-sm text-gray-600'>
            <Package className='w-4 h-4' />
            <span>Peso: {fullProductData.weight}</span>
          </div>
        )}

        {fullProductData?.dimensions && (
          <div className='flex items-center gap-2 text-sm text-gray-600'>
            <Ruler className='w-4 h-4' />
            <span>Dimensiones: {typeof fullProductData.dimensions === 'string' ? fullProductData.dimensions : JSON.stringify(fullProductData.dimensions)}</span>
          </div>
        )}

        {fullProductData?.sku && (
          <div className='flex items-center gap-2 text-sm text-gray-600'>
            <Hash className='w-4 h-4' />
            <span>SKU: {fullProductData.sku}</span>
          </div>
        )}
      </div>
    </div>
  )
})

ProductSpecifications.displayName = 'ProductSpecifications'

