'use client'

import React, { useEffect, useRef } from 'react'
import ProductItem from '@/components/Common/ProductItem'
import { useInfiniteProducts } from '@/hooks/useInfiniteProducts'
import { Loader2 } from 'lucide-react'

interface ProductGridInfiniteProps {
  currentProductId?: number | string
  currentProductCategoryId?: number
  categorySlug?: string | null
}

export const ProductGridInfinite: React.FC<ProductGridInfiniteProps> = ({
  currentProductId,
  currentProductCategoryId,
  categorySlug = null,
}) => {
  const {
    products,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
  } = useInfiniteProducts({
    currentProductId,
    currentProductCategoryId,
    categorySlug,
    initialLimit: 20,
    loadMoreLimit: 20,
  })

  const observerTarget = useRef<HTMLDivElement>(null)

  // Intersection Observer para scroll infinito
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMore()
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px',
      }
    )

    const currentTarget = observerTarget.current
    if (currentTarget) {
      observer.observe(currentTarget)
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget)
      }
    }
  }, [hasMore, isLoadingMore, loadMore])

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <Loader2 className='w-8 h-8 animate-spin text-gray-400' />
      </div>
    )
  }

  if (products.length === 0) {
    return null
  }

  return (
    <div className='w-full'>
      {/* Grid de productos - Mobile-first: 2 columnas, Desktop: 4 columnas */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
        {products.map((product) => (
          <ProductItem key={`${product.id}-${product.slug}`} product={product} />
        ))}
      </div>

      {/* Loading indicator para carga de más productos */}
      {isLoadingMore && (
        <div className='flex items-center justify-center py-8'>
          <Loader2 className='w-6 h-6 animate-spin text-gray-400' />
        </div>
      )}

      {/* Target para Intersection Observer */}
      {hasMore && !isLoadingMore && (
        <div ref={observerTarget} className='h-20' />
      )}
    </div>
  )
}


