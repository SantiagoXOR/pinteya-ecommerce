'use client'

import React, { useRef, useEffect, useState } from 'react'
import { getProducts } from '@/lib/api/products'
import { CommercialProductCard } from '@/components/ui/product-card-commercial'
import { useDesignSystemConfig, shouldShowFreeShipping as dsShouldShowFreeShipping } from '@/lib/design-system-config'
import { getMainImage } from '@/lib/adapters/product-adapter'
import { ChevronLeft, ChevronRight } from '@/lib/optimized-imports'
import { mapSearchToCategory, expandQueryIntentsByWords } from '@/lib/search/intents'
import { useTenantSafe } from '@/contexts/TenantContext'
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
  const tenant = useTenantSafe()
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

  const accentColor = tenant?.accentColor || '#ffd549'

  return (
    <section
      className={`py-6 scroll-mt-20 ${className}`}
      style={{ background: 'linear-gradient(to bottom right, rgba(139, 92, 246, 0.08), rgba(59, 130, 246, 0.05))' }}
    >
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-xl font-bold text-white'>Lo que vas a necesitar</h2>
          <div className='flex gap-1'>
            <button
              type='button'
              onClick={() => scroll('left')}
              className='p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors'
              aria-label='Anterior'
            >
              <ChevronLeft className='w-5 h-5 text-white' />
            </button>
            <button
              type='button'
              onClick={() => scroll('right')}
              className='p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors'
              aria-label='Siguiente'
            >
              <ChevronRight className='w-5 h-5 text-white' />
            </button>
          </div>
        </div>
        <div
          ref={scrollRef}
          className='flex gap-4 overflow-x-auto scroll-smooth no-scrollbar pb-2'
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
                className='flex-shrink-0 w-[200px] sm:w-[220px]'
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
