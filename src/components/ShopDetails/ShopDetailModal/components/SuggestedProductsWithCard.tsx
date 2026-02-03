'use client'

/**
 * Muestra productos sugeridos usando ProductItem (CommercialProductCard).
 * ProductItem se importa dinámicamente para evitar dependencia circular:
 * product-card-commercial -> ShopDetailModal -> ProductItem -> product-card-commercial
 */

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import type { RelatedProduct } from '@/lib/api/related-products'
import type { Product } from '@/types/product'
import { ChevronLeft, ChevronRight } from '@/lib/optimized-imports'

interface SuggestedProductsWithCardProps {
  products: RelatedProduct[]
  currentProductId: number
  limit?: number
}

function relatedToProduct(p: RelatedProduct): Product {
  const priceNum = typeof p.price === 'string' ? Number(p.price) : Number(p.price ?? 0)
  const discountNum = p.discounted_price != null
    ? (typeof p.discounted_price === 'string' ? Number(p.discounted_price) : Number(p.discounted_price))
    : priceNum
  const def = p.default_variant
  const effectivePrice = priceNum > 0 ? priceNum : (def?.price_sale ?? def?.price_list ?? 0)
  const effectiveDiscount = discountNum > 0 && discountNum < effectivePrice ? discountNum : (def?.price_sale != null && def?.price_list != null && def.price_sale < def.price_list ? def.price_sale : effectivePrice)
  const slug = p.slug || `${p.id}-${(p.name || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`.slice(0, 80) || String(p.id)
  return {
    id: p.id,
    slug,
    name: p.name,
    title: p.name || '',
    price: effectivePrice,
    discountedPrice: effectiveDiscount,
    reviews: 0,
    imgs: p.image ? { thumbnails: [p.image], previews: [p.image] } : undefined,
    images: p.image ? [p.image] : undefined,
    image: p.image,
    brand: (p.brand ?? '').trim() || '',
    stock: p.stock ?? def?.stock ?? 0,
    medida: p.measure || def?.measure,
    variants: p.variants,
    default_variant: p.default_variant ?? null,
  } as Product
}

export function SuggestedProductsWithCard({
  products,
  currentProductId,
  limit = 8,
}: SuggestedProductsWithCardProps) {
  const [ProductItemComponent, setProductItemComponent] = useState<React.ComponentType<{ product: Product }> | null>(null)

  useEffect(() => {
    let mounted = true
    import('@/components/Common/ProductItem')
      .then((mod) => {
        if (mounted) setProductItemComponent(() => mod.default)
      })
      .catch(() => {
        if (mounted) setProductItemComponent(null)
      })
    return () => { mounted = false }
  }, [])

  const toShow = products
    .filter((p) => p.id !== currentProductId)
    .slice(0, limit)
    .map(relatedToProduct)

  const scrollRef = useRef<HTMLDivElement>(null)
  const scroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      const amount = 280
      scrollRef.current.scrollBy({
        left: dir === 'left' ? -amount : amount,
        behavior: 'smooth',
      })
    }
  }

  if (toShow.length === 0) return null

  // Mismo patrón que AI chat y SearchSuggestionsCarousel: anchos por card + scroll horizontal para que las tarjetas se vean completas
  const cardWrapperClass =
    'flex-shrink-0 w-[calc(50vw-1.5rem)] min-w-[168px] sm:w-[calc(50%-0.5rem)] md:w-[calc(50%-0.75rem)] max-w-[240px]'
  const scrollContainerClass =
    'w-full flex gap-2 sm:gap-4 md:gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4 pl-4 pr-4 sm:pl-0 sm:pr-0'
  const scrollStyle: React.CSSProperties = {
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
    WebkitOverflowScrolling: 'touch',
    willChange: 'scroll-position',
    transform: 'translateZ(0)',
  }

  return (
    <section className="py-6 border-t border-gray-200 mt-6 px-4 sm:px-6">
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-gray-900 mb-1">Productos Sugeridos</h3>
        <p className="text-sm text-gray-600">Productos que podrían interesarte</p>
      </div>
      {/* Contenedor tipo carrusel: scroll horizontal, tarjetas con ancho fijo; botones prev/next en desktop como SearchSuggestionsCarousel */}
      <div className="relative -mx-4 sm:mx-0">
        <div className="absolute inset-0 pointer-events-none z-20">
          <button
            type="button"
            onClick={() => scroll('left')}
            className="hidden md:flex absolute left-0 z-20 w-6 h-10 md:w-8 md:h-12 bg-white hover:bg-gray-50 shadow-lg transition-colors border border-l-0 border-gray-200 pointer-events-auto top-1/2 -translate-y-1/2 items-center justify-center rounded-r-full"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-3 h-3 md:w-4 md:h-4 text-gray-600" />
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            className="hidden md:flex absolute right-0 z-20 w-6 h-10 md:w-8 md:h-12 bg-white hover:bg-gray-50 shadow-lg transition-colors border border-r-0 border-gray-200 pointer-events-auto top-1/2 -translate-y-1/2 items-center justify-center rounded-l-full"
            aria-label="Siguiente"
          >
            <ChevronRight className="w-3 h-3 md:w-4 md:h-4 text-gray-600" />
          </button>
        </div>
        <div ref={scrollRef} className={scrollContainerClass} style={scrollStyle}>
          {ProductItemComponent
            ? toShow.map((product) => (
                <div key={product.id} className={cardWrapperClass}>
                  <ProductItemComponent product={product} />
                </div>
              ))
            : toShow.map((p) => (
                <div key={p.id} className={`${cardWrapperClass} rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm`}>
                  <div className="aspect-square bg-gray-100 relative overflow-hidden">
                    {p.image ? (
                      <Image
                        src={p.image}
                        alt={p.name}
                        fill
                        className="object-contain"
                        sizes="(max-width: 640px) 160px, 200px"
                        loading="lazy"
                        fetchPriority="low"
                        quality={75}
                        unoptimized={typeof p.image === 'string' && p.image.startsWith('http') && !p.image.includes('supabase.co')}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200" />
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium text-gray-900 line-clamp-2">{p.name}</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">
                      ${(typeof p.price === 'string' ? Number(p.price) : Number(p.price || 0)).toLocaleString('es-AR')}
                    </p>
                  </div>
                </div>
              ))}
        </div>
      </div>
    </section>
  )
}
