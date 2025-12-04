'use client'

import React, { useEffect, useState } from 'react'
import { useBestSellerProducts } from '@/hooks/useBestSellerProducts'
import { CommercialProductCard } from '@/components/ui/product-card-commercial'
import { useCartUnified } from '@/hooks/useCartUnified'
import { Product } from '@/types/product'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface ProductRecommendationsProps {
  currentProductId?: string
  categorySlug?: string | null
  limit?: number
  onProductClick?: (productId: string) => void
}

export const ProductRecommendations: React.FC<ProductRecommendationsProps> = ({
  currentProductId,
  categorySlug = null,
  limit = 4,
  onProductClick,
}) => {
  const { products, isLoading } = useBestSellerProducts({ categorySlug })
  const { addProduct } = useCartUnified()
  const [addedProducts, setAddedProducts] = useState<Set<string>>(new Set())

  // Filtrar el producto actual de las recomendaciones
  const filteredProducts = (Array.isArray(products) ? products : [])
    .filter((p) => String(p.id) !== currentProductId)
    .slice(0, limit)

  const handleAddToCart = async (product: Product) => {
    try {
      addProduct(
        {
          id: product.id,
          title: product.title || product.name || '',
          price: product.price,
          discounted_price: product.discountedPrice || product.price,
          images: Array.isArray(product.images) ? product.images : product.imgs?.previews,
        },
        { quantity: 1 }
      )

      setAddedProducts((prev) => new Set(prev).add(String(product.id)))

      if (onProductClick) {
        onProductClick(String(product.id))
      }

      // Reset después de 2 segundos
      setTimeout(() => {
        setAddedProducts((prev) => {
          const next = new Set(prev)
          next.delete(String(product.id))
          return next
        })
      }, 2000)
    } catch (error) {
      console.error('Error agregando producto recomendado:', error)
    }
  }

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <Loader2 className='w-8 h-8 animate-spin text-gray-400' />
      </div>
    )
  }

  if (filteredProducts.length === 0) {
    return null
  }

  return (
    <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
      {filteredProducts.map((product) => {
        const productImage =
          product.imgs?.previews?.[0] ||
          (Array.isArray(product.images) ? product.images[0] : null) ||
          '/images/products/placeholder.svg'

        const isAdded = addedProducts.has(String(product.id))

        return (
          <div
            key={product.id}
            className={cn(
              'transition-all duration-300',
              isAdded && 'scale-95 opacity-75'
            )}
          >
            <CommercialProductCard
              slug={product.slug || ''}
              image={productImage}
              title={product.title || product.name || ''}
              brand={product.brand}
              price={product.discountedPrice || product.price}
              originalPrice={product.price > (product.discountedPrice || product.price) ? product.price : undefined}
              productId={product.id}
              stock={product.stock || 0}
              onAddToCart={() => handleAddToCart(product)}
              cta={isAdded ? 'Agregado ✓' : 'Agregar'}
              showCartAnimation={true}
              freeShipping={product.freeShipping}
            />
          </div>
        )
      })}
    </div>
  )
}

