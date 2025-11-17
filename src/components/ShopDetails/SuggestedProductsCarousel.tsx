'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import ProductItem from '@/components/Common/ProductItem'
import { getRelatedProducts, ProductGroup } from '@/lib/api/related-products'
import { ProductWithCategory } from '@/types/api'

interface SuggestedProductsCarouselProps {
  productId: number
  categoryId?: number
  limit?: number
}

const SuggestedProductsCarousel: React.FC<SuggestedProductsCarouselProps> = ({
  productId,
  categoryId,
  limit = 8,
}) => {
  const router = useRouter()
  const [relatedProducts, setRelatedProducts] = useState<ProductWithCategory[]>([])
  const [loading, setLoading] = useState(true)
  const sliderRef = useRef<any>(null)

  useEffect(() => {
    const loadRelatedProducts = async () => {
      setLoading(true)
      try {
        // Intentar obtener productos relacionados usando la función existente
        const productGroup = await getRelatedProducts(productId)
        
        if (productGroup && productGroup.products) {
          // Convertir ProductGroup a array de ProductWithCategory
          const products = productGroup.products
            .filter(p => p.id !== productId) // Excluir el producto actual
            .slice(0, limit)
            .map((p: any) => ({
              id: p.id,
              name: p.name,
              slug: p.slug || `product-${p.id}`,
              price: p.price || 0,
              discounted_price: p.discounted_price,
              brand: p.brand || '',
              stock: p.stock || 0,
              images: p.images || [],
              description: p.description || '',
              category: p.category || null,
            })) as ProductWithCategory[]
          
          setRelatedProducts(products)
        } else {
          // Fallback: obtener productos de la misma categoría si categoryId está disponible
          if (categoryId) {
            try {
              const response = await fetch(`/api/products?category_id=${categoryId}&limit=${limit + 1}`)
              const result = await response.json()
              if (result.success && result.data) {
                const products = result.data.data
                  .filter((p: ProductWithCategory) => p.id !== productId)
                  .slice(0, limit)
                setRelatedProducts(products)
              }
            } catch (error) {
              console.warn('Error obteniendo productos por categoría:', error)
            }
          }
        }
      } catch (error) {
        console.error('Error cargando productos sugeridos:', error)
      } finally {
        setLoading(false)
      }
    }

    if (productId) {
      loadRelatedProducts()
    }
  }, [productId, categoryId, limit])

  const handlePrev = useCallback(() => {
    if (sliderRef.current?.swiper) {
      sliderRef.current.swiper.slidePrev()
    }
  }, [])

  const handleNext = useCallback(() => {
    if (sliderRef.current?.swiper) {
      sliderRef.current.swiper.slideNext()
    }
  }, [])

  if (loading) {
    return (
      <div className="py-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        </div>
      </div>
    )
  }

  if (relatedProducts.length === 0) {
    return null
  }

  return (
    <section className="py-6 border-t border-gray-200 mt-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Productos Sugeridos
        </h3>
        <p className="text-sm text-gray-600">
          Productos que podrían interesarte
        </p>
      </div>

      <div className="relative">
        <Swiper
          ref={sliderRef}
          modules={[Navigation]}
          spaceBetween={16}
          slidesPerView={2}
          breakpoints={{
            640: {
              slidesPerView: 2,
              spaceBetween: 16,
            },
            768: {
              slidesPerView: 3,
              spaceBetween: 20,
            },
            1024: {
              slidesPerView: 4,
              spaceBetween: 24,
            },
          }}
          navigation={{
            prevEl: '.swiper-button-prev-suggested',
            nextEl: '.swiper-button-next-suggested',
          }}
          className="suggested-products-carousel"
        >
          {relatedProducts.map((product) => (
            <SwiperSlide key={product.id}>
              <ProductItem product={product as any} />
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Botones de navegación */}
        <button
          className="swiper-button-prev-suggested absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition-colors"
          onClick={handlePrev}
          aria-label="Producto anterior"
        >
          <svg
            className="w-6 h-6 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <button
          className="swiper-button-next-suggested absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition-colors"
          onClick={handleNext}
          aria-label="Siguiente producto"
        >
          <svg
            className="w-6 h-6 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </section>
  )
}

export default SuggestedProductsCarousel



