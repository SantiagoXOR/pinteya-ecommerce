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
import { getProductById } from '@/lib/api/products'

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
      let loadedProducts: ProductWithCategory[] = []
      const minProducts = 4 // Mínimo de productos a mostrar
      
      try {
        // Estrategia 1: Intentar obtener productos relacionados por nombre base
        try {
          const productGroup = await getRelatedProducts(productId)
          
          if (productGroup && productGroup.products && productGroup.products.length > 1) {
            // Obtener datos completos de cada producto relacionado
            const productsWithFullData = await Promise.all(
              productGroup.products
                .filter(p => p.id !== productId) // Excluir el producto actual
                .slice(0, limit)
                .map(async (p: any) => {
                  try {
                    // Obtener datos completos del producto desde la API
                    const fullProductResponse = await getProductById(p.id)
                    // Manejar ambos formatos de respuesta (con data o directamente)
                    const realProduct =
                      fullProductResponse && typeof fullProductResponse === 'object' && 'data' in (fullProductResponse as any)
                        ? (fullProductResponse as any).data
                        : fullProductResponse
                    
                    if (realProduct) {
                      return realProduct as ProductWithCategory
                    }
                    return null
                  } catch (error) {
                    console.warn(`Error obteniendo producto ${p.id}:`, error)
                    return null
                  }
                })
            )
            
            // Filtrar productos nulos
            const validProducts = productsWithFullData
              .filter((p): p is ProductWithCategory => p !== null)
            
            if (validProducts.length > 0) {
              loadedProducts = validProducts
              console.log('✅ Productos relacionados por nombre encontrados:', validProducts.length)
            }
          }
        } catch (error) {
          console.warn('Error obteniendo productos relacionados por nombre:', error)
        }
        
        // Estrategia 2: Si no hay suficientes productos, agregar de la misma categoría
        // Ejecutar siempre si hay categoryId, o si no hay suficientes productos
        if (loadedProducts.length < minProducts) {
          if (categoryId) {
            try {
              const needed = Math.max(minProducts, limit) - loadedProducts.length
              const response = await fetch(`/api/products?category_id=${categoryId}&limit=${needed + 1}`)
              const result = await response.json()
              if (result.success && result.data && result.data.data) {
                const categoryProducts = result.data.data
                  .filter((p: ProductWithCategory) => 
                    p.id !== productId && 
                    !loadedProducts.some(loaded => loaded.id === p.id)
                  )
                  .slice(0, needed)
                
                if (categoryProducts.length > 0) {
                  loadedProducts = [...loadedProducts, ...categoryProducts]
                  console.log('✅ Productos de categoría agregados:', categoryProducts.length)
                }
              }
            } catch (error) {
              console.warn('Error obteniendo productos por categoría:', error)
            }
          }
        }
        
        // Estrategia 3: Si aún no hay suficientes, agregar productos populares
        // Ejecutar siempre como último recurso
        if (loadedProducts.length < minProducts) {
          try {
            const needed = Math.max(minProducts, limit) - loadedProducts.length
            const response = await fetch(`/api/products?limit=${needed + 1}`)
            const result = await response.json()
            if (result.success && result.data && result.data.data) {
              const popularProducts = result.data.data
                .filter((p: ProductWithCategory) => 
                  p.id !== productId && 
                  !loadedProducts.some(loaded => loaded.id === p.id)
                )
                .slice(0, needed)
              
              if (popularProducts.length > 0) {
                loadedProducts = [...loadedProducts, ...popularProducts]
                console.log('✅ Productos populares agregados:', popularProducts.length)
              }
            }
          } catch (error) {
            console.warn('Error obteniendo productos populares:', error)
          }
        }
        
        console.log('📦 Productos sugeridos cargados:', {
          productId,
          categoryId,
          total: loadedProducts.length,
          products: loadedProducts.map(p => ({ id: p.id, name: p.name }))
        })
        
        setRelatedProducts(loadedProducts)
      } catch (error) {
        console.error('Error cargando productos sugeridos:', error)
        setRelatedProducts([])
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
    <section className="py-6 border-t border-gray-200 mt-6 px-4 sm:px-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Productos Sugeridos
        </h3>
        <p className="text-sm text-gray-600">
          Productos que podrían interesarte
        </p>
      </div>

      <div className="relative overflow-visible">
        <Swiper
          ref={sliderRef}
          modules={[Navigation]}
          spaceBetween={16}
          slidesPerView={2}
          breakpoints={{
            640: {
              slidesPerView: 2.5,
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
          className="suggested-products-carousel !overflow-visible"
        >
          {relatedProducts.map((product) => (
            <SwiperSlide key={product.id} className="!w-auto">
              <div className="w-[180px] sm:w-[200px] md:w-[220px]">
                <ProductItem product={product as any} />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Botones de navegación - Solo mostrar si hay más de un producto */}
        {relatedProducts.length > 1 && (
          <>
            <button
              className="swiper-button-prev-suggested absolute -left-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors border-2 border-gray-200 items-center justify-center hidden md:flex"
              onClick={handlePrev}
              aria-label="Producto anterior"
            >
              <svg
                className="w-5 h-5 text-gray-700"
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
              className="swiper-button-next-suggested absolute -right-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors border-2 border-gray-200 items-center justify-center hidden md:flex"
              onClick={handleNext}
              aria-label="Siguiente producto"
            >
              <svg
                className="w-5 h-5 text-gray-700"
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
          </>
        )}
      </div>
    </section>
  )
}

export default SuggestedProductsCarousel



