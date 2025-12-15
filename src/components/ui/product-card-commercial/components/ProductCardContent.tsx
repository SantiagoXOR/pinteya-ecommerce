'use client'

import React from 'react'
import type { ProductCardContentProps } from '../types'

/**
 * Componente de contenido del ProductCard
 * Muestra marca, título, precios y badge de descuento
 */
export const ProductCardContent = React.memo(function ProductCardContent({
  brand,
  title,
  displayPrice,
  displayOriginalPrice,
  discount
}: ProductCardContentProps) {
  return (
    <div className='relative z-20 text-left p-1.5 md:p-2 bg-white -mt-2 md:-mt-3 flex-shrink-0 rounded-b-xl md:rounded-b-2xl'>
      {/* Marca del producto */}
      {brand && (
        <div className='text-xs md:text-sm uppercase text-gray-400 font-normal tracking-wide mb-0.5'>
          {brand}
        </div>
      )}

      {/* Título del producto */}
      <h3 className='font-medium text-gray-600 text-sm md:text-lg line-clamp-2 leading-[1.1] mb-1'>
        {title}
      </h3>

      {/* Precios */}
      <div className='flex flex-col items-start space-y-1'>
        <div className='flex items-center gap-1 md:gap-2'>
          {/* Precio actual */}
          <div
            className='text-base sm:text-lg md:text-2xl font-bold drop-shadow-sm'
            style={{ color: '#EA5A17' }}
          >
            {`$${(displayPrice ?? 0).toLocaleString('es-AR', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}`}
          </div>

          {/* Badge de descuento */}
          {discount && (
            <div
              className='inline-flex flex-col items-center justify-center px-1.5 py-0.5 rounded shadow-sm'
              style={{ backgroundColor: '#EA5A17' }}
            >
              <span className='font-extrabold text-[10px] sm:text-[11px] text-white leading-none'>
                {discount}
              </span>
              <span className='uppercase text-[7px] sm:text-[8px] font-semibold text-white leading-none -mt-[1px]'>
                OFF
              </span>
            </div>
          )}

          {/* Precio anterior tachado */}
          {displayOriginalPrice && displayOriginalPrice > (displayPrice || 0) && (
            <div className='text-gray-500 line-through text-xs md:text-sm drop-shadow-sm'>
              {`$${displayOriginalPrice.toLocaleString('es-AR', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}`}
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

ProductCardContent.displayName = 'ProductCardContent'

