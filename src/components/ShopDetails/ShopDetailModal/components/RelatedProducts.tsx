/**
 * Componente de productos relacionados
 */

import React from 'react'
import SuggestedProductsCarousel from '../../SuggestedProductsCarousel'

interface RelatedProductsProps {
  productId: number
  categoryId?: number
  limit?: number
}

/**
 * Productos relacionados memoizados
 */
export const RelatedProducts = React.memo<RelatedProductsProps>(({
  productId,
  categoryId,
  limit = 8,
}) => {
  if (!productId) return null

  return (
    <SuggestedProductsCarousel
      productId={productId}
      categoryId={categoryId}
      limit={limit}
    />
  )
})

RelatedProducts.displayName = 'RelatedProducts'

