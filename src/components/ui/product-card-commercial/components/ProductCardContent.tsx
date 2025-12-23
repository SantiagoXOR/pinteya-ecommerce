'use client'

import React from 'react'
import { cleanTitleForIncoloroProduct, isTransparentColor } from '../utils/color-utils'
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
  discount,
  variants,
  selectedColorName
}: ProductCardContentProps) {
  // Detectar si el producto es incoloro
  const isIncoloro = React.useMemo(() => {
    // Verificar si el color seleccionado es incoloro
    if (selectedColorName && isTransparentColor(selectedColorName)) {
      return true
    }
    
    // Verificar si alguna variante tiene color_name incoloro
    if (variants && variants.length > 0) {
      return variants.some(v => v.color_name && isTransparentColor(v.color_name))
    }
    
    return false
  }, [variants, selectedColorName])
  
  // Limpiar el título si es incoloro
  const cleanedTitle = React.useMemo(() => {
    if (!title) return title
    if (isIncoloro) {
      return cleanTitleForIncoloroProduct(title)
    }
    return title
  }, [title, isIncoloro])
  
  return (
    <div className='relative z-20 text-left pt-1.5 sm:pt-2 md:pt-2.5 pb-0 flex-shrink-0'>
      {/* Marca del producto */}
      {brand && (
        <div className='text-[8px] md:text-[9px] uppercase text-gray-600 font-bold tracking-[0.1em] md:tracking-[0.12em] mb-0'>
          {brand.split('').join(' ')}
        </div>
      )}

      {/* Título del producto */}
      <h3 className='font-semibold text-gray-800 text-sm md:text-lg line-clamp-2 leading-[1.1] mb-1 -mt-0.5'>
        {cleanedTitle}
      </h3>

      {/* Precios */}
      <div className='flex flex-col items-start mb-0 pb-0'>
        {/* Precio anterior tachado - arriba */}
        {displayOriginalPrice && displayOriginalPrice > (displayPrice || 0) && (
          <div className='text-gray-400 line-through text-[10px] md:text-xs mb-0 leading-none -mt-0.5'>
            {`$${displayOriginalPrice.toLocaleString('es-AR', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}`}
          </div>
        )}
        
        <div className='flex items-center gap-1 md:gap-1.5 -mt-0.5'>
          {/* Precio actual */}
          <div
            className='text-base sm:text-lg md:text-2xl font-light drop-shadow-sm'
            style={{ color: '#EA5A17' }}
          >
            {`$${(displayPrice ?? 0).toLocaleString('es-AR', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}`}
          </div>

          {/* Badge de descuento - horizontal y pequeño */}
          {discount && (
            <div
              className='inline-flex items-center justify-center px-1 py-0.5 rounded-full text-[8px] md:text-[9px] font-medium leading-tight'
              style={{ backgroundColor: '#EA5A17', color: '#ffffff' }}
            >
              {discount} OFF
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

ProductCardContent.displayName = 'ProductCardContent'

