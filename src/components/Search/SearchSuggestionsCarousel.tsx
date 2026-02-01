'use client'

import React, { useRef, useEffect, useState } from 'react'
import { getProducts } from '@/lib/api/products'
import { CommercialProductCard } from '@/components/ui/product-card-commercial'
import { useDesignSystemConfig, shouldShowFreeShipping as dsShouldShowFreeShipping } from '@/lib/design-system-config'
import { getMainImage } from '@/lib/adapters/product-adapter'
import { ChevronLeft, ChevronRight } from '@/lib/optimized-imports'
import { mapSearchToCategory, expandQueryIntentsByWords } from '@/lib/search/intents'
import { useCartUnified } from '@/hooks/useCartUnified'
import { toast } from '@/components/ui/use-toast'
import type { ProductWithCategory } from '@/types/api'

export interface SearchSuggestionsCarouselProps {
  searchQuery: string
  /** Términos sugeridos por Gemini (cuando /api/search/enrich está disponible) */
  suggestedTerms?: string[]
  /** Slug de categoría sugerida por Gemini */
  suggestedCategory?: string | null
  maxProducts?: number
  className?: string
}

export function SearchSuggestionsCarousel({
  searchQuery,
  suggestedTerms,
  suggestedCategory,
  maxProducts = 12,
  className = '',
}: SearchSuggestionsCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const { addProduct } = useCartUnified()
  const config = useDesignSystemConfig()
  const [products, setProducts] = useState<ProductWithCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [enriched, setEnriched] = useState<{
    refinedQuery?: string
    categorySlug?: string | null
    alternativeTerms?: string[]
  } | null>(null)

  useEffect(() => {
    let cancelled = false
    async function fetchEnrich() {
      try {
        const res = await fetch(`/api/search/enrich?q=${encodeURIComponent(searchQuery)}`)
        const json = await res.json()
        if (json.success && !cancelled) {
          setEnriched({
            refinedQuery: json.refinedQuery,
            categorySlug: json.categorySlug,
            alternativeTerms: json.alternativeTerms,
          })
        }
      } catch {
        if (!cancelled) setEnriched(null)
      }
    }
    if (searchQuery.trim()) fetchEnrich()
    return () => { cancelled = true }
  }, [searchQuery])

  useEffect(() => {
    let cancelled = false

    async function fetchSuggestions() {
      setLoading(true)
      try {
        const categorySlug = suggestedCategory ?? enriched?.categorySlug ?? mapSearchToCategory(searchQuery)
        let terms: string[] = []
        if (suggestedTerms?.length) {
          terms = suggestedTerms.slice(0, 2)
        } else if (enriched?.refinedQuery || enriched?.alternativeTerms?.length) {
          terms = [
            ...(enriched.refinedQuery ? [enriched.refinedQuery] : []),
            ...(enriched.alternativeTerms || []).slice(0, 2),
          ]
        } else {
          terms = expandQueryIntentsByWords(searchQuery).filter(t => t.length >= 3).slice(0, 3)
        }

        let allProducts: ProductWithCategory[] = []

        if (categorySlug) {
          const res = await getProducts({ category: categorySlug, limit: maxProducts, page: 1 })
          if (res.success && res.data?.length && !cancelled) {
            allProducts = [...res.data]
          }
        }

        for (const term of terms) {
          if (allProducts.length >= maxProducts || cancelled) break
          const res = await getProducts({ search: term, limit: Math.ceil(maxProducts / 2), page: 1 })
          if (res.success && res.data?.length && !cancelled) {
            const ids = new Set(allProducts.map(p => p.id))
            const newOnes = res.data.filter((p: ProductWithCategory) => !ids.has(p.id))
            allProducts = [...allProducts, ...newOnes].slice(0, maxProducts)
          }
        }

        if (!cancelled) setProducts(allProducts)
      } catch {
        if (!cancelled) setProducts([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    if (searchQuery.trim()) fetchSuggestions()
    return () => { cancelled = true }
  }, [searchQuery, suggestedCategory, suggestedTerms, enriched, maxProducts])

  const scroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      const amount = 300
      scrollRef.current.scrollBy({
        left: dir === 'left' ? -amount : amount,
        behavior: 'smooth',
      })
    }
  }

  if (loading || products.length === 0) return null

  return (
    <section className={`py-4 scroll-mt-20 ${className}`}>
      {/* Header - mismo estilo que envio gratis, sin contenedor de color */}
      <div className='max-w-7xl mx-auto px-4 sm:px-4 lg:px-8'>
        <div className='flex items-center justify-between mb-3'>
          <h2 className='text-xl md:text-2xl font-medium text-white'>Lo que vas a necesitar</h2>
        </div>
      </div>
      {/* Carrusel full width como envio gratis - scroll hasta los bordes en mobile */}
      <div className='relative -mx-4 sm:mx-0 sm:px-4 lg:px-8'>
        <div className='absolute inset-0 pointer-events-none z-20'>
          <button
            type='button'
            onClick={() => scroll('left')}
            className='hidden md:flex absolute left-0 z-20 w-6 h-10 md:w-8 md:h-12 bg-white hover:bg-gray-50 shadow-lg transition-all duration-200 items-center justify-center rounded-r-full border border-l-0 border-gray-200 pointer-events-auto top-1/2 -translate-y-1/2'
            aria-label='Anterior'
          >
            <ChevronLeft className='w-3 h-3 md:w-4 md:h-4 text-gray-600' />
          </button>
          <button
            type='button'
            onClick={() => scroll('right')}
            className='hidden md:flex absolute right-0 z-20 w-6 h-10 md:w-8 md:h-12 bg-white hover:bg-gray-50 shadow-lg transition-all duration-200 items-center justify-center rounded-l-full border border-r-0 border-gray-200 pointer-events-auto top-1/2 -translate-y-1/2'
            aria-label='Siguiente'
          >
            <ChevronRight className='w-3 h-3 md:w-4 md:h-4 text-gray-600' />
          </button>
        </div>
        <div
          ref={scrollRef}
          className='flex gap-2 pl-4 sm:pl-0 sm:gap-4 md:gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4 pr-4 sm:pr-0'
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {products.map(product => {
            const hasDiscount =
              typeof (product as any).discounted_price === 'number' &&
              (product as any).discounted_price > 0 &&
              (product as any).discounted_price < product.price
            const currentPrice = hasDiscount
              ? ((product as any).discounted_price as number)
              : product.price
            const originalPrice = hasDiscount ? product.price : undefined
            const discount = hasDiscount
              ? `${Math.round((1 - ((product as any).discounted_price as number) / product.price) * 100)}%`
              : undefined
            const image = getMainImage(product)
            const productCategory =
              (product as any).category_name ||
              product.category?.name ||
              (product as any).categories?.[0]?.category?.name

            return (
              <div
                key={product.id}
                className='flex-shrink-0 w-[calc(50vw-1.5rem)] sm:w-[calc(50%-0.5rem)] md:w-[calc(50%-0.75rem)] lg:w-[calc(25%-0.75rem)]'
              >
                <CommercialProductCard
                  productId={String(product.id)}
                  title={product.name}
                  slug={product.slug}
                  brand={product.brand}
                  category={productCategory}
                  image={image}
                  price={currentPrice}
                  originalPrice={originalPrice}
                  discount={discount}
                  stock={product.stock ?? 0}
                  shippingText={(product.stock ?? 0) > 0 ? 'En stock' : 'Sin stock'}
                  freeShipping={dsShouldShowFreeShipping(currentPrice, config)}
                  installments={
                    currentPrice > 0
                      ? { quantity: 3, amount: Math.round(currentPrice / 3), interestFree: true }
                      : undefined
                  }
                  onAddToCart={() => {
                    try {
                      addProduct(
                        {
                          id: product.id,
                          title: product.name,
                          price: product.price,
                          discounted_price: (product as any).discounted_price ?? currentPrice ?? product.price,
                          images: Array.isArray((product as any).images)
                            ? (product as any).images
                            : [image].filter(Boolean),
                        },
                        {
                          quantity: 1,
                          attributes: {
                            color: (product as any).color,
                            medida: (product as any).medida,
                            finish: (product as any).finish,
                          },
                          image,
                        }
                      )
                      toast({
                        title: 'Producto agregado',
                        description: `${product.name} se agregó al carrito`,
                      })
                    } catch {
                      toast({
                        title: 'Error',
                        description: 'No se pudo agregar el producto al carrito',
                        variant: 'destructive',
                      })
                    }
                  }}
                  variants={(product as any).variants || []}
                  description={(product as any).description || ''}
                  badgeConfig={{
                    showCapacity: true,
                    showColor: true,
                    showFinish: true,
                    showMaterial: false,
                    showGrit: false,
                    showDimensions: false,
                    showWeight: false,
                    showBrand: false,
                    maxBadges: 4,
                  }}
                  className='bg-white shadow-sm hover:shadow-md transition-shadow h-full'
                />
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
