/**
 * Componente de productos relacionados
 * 
 * NOTA: Usa import dinámico para evitar dependencia circular con product-card-commercial
 * El ciclo era: product-card-commercial -> ShopDetailModal -> SuggestedProductsCarousel -> ProductItem -> product-card-commercial
 */

import React, { useState, useEffect } from 'react'
import type { ProductGroup } from '@/lib/api/related-products'

interface RelatedProductsProps {
  productId: number
  categoryId?: number
  categorySlug?: string
  limit?: number
  /** Productos relacionados ya cargados por el modal (getRelatedProducts en cliente); se usan cuando la API /related no devuelve datos (p. ej. en local) */
  productGroupFromParent?: ProductGroup | null
}

// Componente lazy para evitar dependencia circular
const LazySuggestedProducts: React.FC<RelatedProductsProps> = ({
  productId,
  categoryId,
  categorySlug,
  limit = 8,
  productGroupFromParent,
}) => {
  const [Component, setComponent] = useState<React.ComponentType<any> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let mounted = true

    // Import dinámico para evitar el ciclo de dependencias
    import('../../SuggestedProductsCarousel')
      .then((mod) => {
        if (mounted) {
          setComponent(() => mod.default)
          setLoading(false)
        }
      })
      .catch((err) => {
        console.error('❌ [RelatedProducts] Error cargando SuggestedProductsCarousel:', err)
        if (mounted) {
          setError(err)
          setLoading(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [])

  if (loading) {
    return (
      <div className="py-6 border-t border-gray-200 mt-6">
        <div className="mb-4">
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-64 bg-gray-100 rounded animate-pulse mt-2" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-[180px] h-[280px] bg-gray-100 rounded-lg animate-pulse flex-shrink-0" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !Component) {
    // Silenciosamente no mostrar nada si hay error
    return null
  }

  // Debug: confirmar que pasamos productGroupFromParent al carrusel
  if (typeof window !== 'undefined' && productGroupFromParent?.products?.length) {
    console.log('[RelatedProducts] pasando al carrusel productGroupFromParent con', productGroupFromParent.products.length, 'productos')
  }

  return (
    <Component
      productId={productId}
      categoryId={categoryId}
      categorySlug={categorySlug}
      limit={limit}
      productGroupFromParent={productGroupFromParent}
    />
  )
}

/**
 * Productos relacionados memoizados
 */
export const RelatedProducts = React.memo<RelatedProductsProps>(({
  productId,
  categoryId,
  categorySlug,
  limit = 8,
  productGroupFromParent,
}) => {
  if (!productId) return null

  return (
    <LazySuggestedProducts
      productId={productId}
      categoryId={categoryId}
      categorySlug={categorySlug}
      limit={limit}
      productGroupFromParent={productGroupFromParent}
    />
  )
})

RelatedProducts.displayName = 'RelatedProducts'
