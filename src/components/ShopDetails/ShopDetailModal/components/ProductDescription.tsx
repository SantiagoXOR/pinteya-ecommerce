/**
 * Componente de descripción del producto con expandir/colapsar
 * Usado en la columna izquierda del ShopDetailModal para vista "un solo golpe"
 */

import React, { useState } from 'react'
import { ChevronDown, ChevronUp } from '@/lib/optimized-imports'

interface ProductWithDescription {
  description?: string
}

interface Product {
  description?: string
}

interface ProductDescriptionProps {
  fullProductData: ProductWithDescription | null
  product: Product | null
}

const MAX_DESCRIPTION_LENGTH = 150

/**
 * Descripción expandible del producto
 */
export const ProductDescription = React.memo<ProductDescriptionProps>(({
  fullProductData,
  product,
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const description = fullProductData?.description || product?.description || ''
  const hasDescription = !!description
  const isLong = description.length > MAX_DESCRIPTION_LENGTH
  
  const displayText = !isLong || isExpanded
    ? description
    : description.slice(0, MAX_DESCRIPTION_LENGTH).trim() + '...'

  if (!hasDescription) return null

  return (
    <div>
      <p className='text-gray-600 leading-relaxed text-sm'>
        {displayText}
      </p>
      {isLong && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            setIsExpanded(!isExpanded)
          }}
          className='mt-2 text-sm font-medium text-blaze-orange-600 hover:text-blaze-orange-700 flex items-center gap-1 transition-colors'
        >
          {isExpanded ? (
            <>
              Ver menos
              <ChevronUp className='w-4 h-4' />
            </>
          ) : (
            <>
              Ver más
              <ChevronDown className='w-4 h-4' />
            </>
          )}
        </button>
      )}
    </div>
  )
})

ProductDescription.displayName = 'ProductDescription'
