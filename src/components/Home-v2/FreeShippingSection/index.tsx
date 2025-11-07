'use client'

import React, { useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import ProductItem from '@/components/Common/ProductItem'
import { useFilteredProducts } from '@/hooks/useFilteredProducts'
import { adaptApiProductsToComponents } from '@/lib/adapters/product-adapter'

const FreeShippingSection = () => {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Obtener productos con precio > 50000 (califican para envío gratis)
  const { data, isLoading } = useFilteredProducts({
    limit: 100, // Aumentado para obtener todos los productos que califican
    sortBy: 'price',
    sortOrder: 'desc',
  })

  const products = data?.data ? adaptApiProductsToComponents(data.data) : []
  
  // Filtrar productos con precio > 50000 - Envío gratis solo para compras mayores
  const freeShippingProducts = products.filter(p => {
    // Convertir tanto price como discountedPrice a número
    const price = Number(p.price) || 0
    const discountedPrice = Number(p.discountedPrice) || price
    // Usar el precio más bajo (con descuento si existe) para filtrar
    const finalPrice = discountedPrice > 0 ? discountedPrice : price
    console.log(`Producto: ${p.title}, Precio original: ${price}, Precio con descuento: ${discountedPrice}, Precio final: ${finalPrice}`)
    return finalPrice > 50000
  })

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  if (isLoading) {
    return (
      <section className='py-3 bg-white'>
        <div className='max-w-7xl mx-auto px-4'>
          <div className='animate-pulse'>
            <div className='h-8 bg-gray-200 rounded w-64 mb-4'></div>
            <div className='flex gap-4 overflow-hidden'>
              {[...Array(5)].map((_, i) => (
                <div key={i} className='min-w-[250px] h-80 bg-gray-200 rounded-lg'></div>
              ))}
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (freeShippingProducts.length === 0) return null

  return (
    <section id='envio-gratis' className='py-3 bg-white/40 backdrop-blur-sm scroll-mt-20'>
      <div className='max-w-7xl mx-auto px-4'>
        {/* Carousel Horizontal - Sin badge de envío gratis */}
        <div className='relative mb-4'>
          <div
            ref={scrollRef}
            className='flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4'
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {freeShippingProducts.map((product, idx) => (
              <div key={idx} className='min-w-[250px] flex-shrink-0'>
                <ProductItem product={product} />
              </div>
            ))}
          </div>

          {/* Fade edges */}
          <div className='absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-green-50 to-transparent pointer-events-none'></div>
          <div className='absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none'></div>
        </div>

        {/* Header */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            {/* SVG completo con diseño de envío gratis */}
            <div className='w-[100px] h-[40px] md:w-[140px] md:h-[56px] flex items-center justify-center flex-shrink-0'>
              <img 
                src='/images/icons/icon-envio.svg' 
                alt='Envío gratis' 
                className='w-full h-full object-contain'
              />
            </div>
            <div>
              <h2 className='text-2xl md:text-3xl font-bold text-green-700'>
                Envío Gratis
              </h2>
              <p className='text-sm text-gray-600'>
                En compras superiores a $50.000
              </p>
            </div>
          </div>

          {/* Controles de navegación */}
          <div className='hidden md:flex gap-2'>
            <button
              onClick={() => scroll('left')}
              className='w-10 h-10 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center hover:border-green-500 hover:text-green-500 transition-colors'
              aria-label='Anterior'
            >
              <ChevronLeft className='w-5 h-5' />
            </button>
            <button
              onClick={() => scroll('right')}
              className='w-10 h-10 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center hover:border-green-500 hover:text-green-500 transition-colors'
              aria-label='Siguiente'
            >
              <ChevronRight className='w-5 h-5' />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default FreeShippingSection

