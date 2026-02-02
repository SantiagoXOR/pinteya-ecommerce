'use client'

import React from 'react'
import { cleanTitleForIncoloroProduct, isTransparentColor } from '../utils/color-utils'
import type { ProductCardContentProps } from '../types'
import { formatCurrency } from '@/lib/utils/consolidated-utils'
import { useTenantSafe } from '@/contexts/TenantContext'

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
  // ⚡ MULTITENANT: Color del tenant para precio
  const tenant = useTenantSafe()
  const primaryColor = tenant?.primaryColor || '#f27a1d' // Naranja por defecto
  
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

  // Badge de descuento: usar prop discount o calcular desde precios de variante (displayOriginalPrice > displayPrice)
  const effectiveDiscount = React.useMemo(() => {
    if (discount) return discount
    if (
      displayOriginalPrice != null &&
      displayPrice != null &&
      displayOriginalPrice > displayPrice &&
      displayOriginalPrice > 0
    ) {
      const pct = Math.round(((displayOriginalPrice - displayPrice) / displayOriginalPrice) * 100)
      return pct > 0 ? `${pct}%` : undefined
    }
    return undefined
  }, [discount, displayOriginalPrice, displayPrice])

  return (
    <div className='relative z-20 text-left pt-0 pb-0 flex-shrink-0'>
      {/* Marca del producto */}
      {brand && (
        <div className='text-[7px] md:text-[8px] uppercase text-gray-600 font-bold tracking-[0.1em] md:tracking-[0.12em] mb-0'>
          {brand.split('').join(' ')}
        </div>
      )}

      {/* Título del producto */}
      <h3 className='font-semibold text-gray-800 text-xs sm:text-sm md:text-base line-clamp-2 leading-[1.1] mb-2 -mt-1.5'>
        {cleanedTitle}
      </h3>

      {/* Precios */}
      {(displayPrice !== undefined || displayOriginalPrice !== undefined) && (
        <div className='flex flex-col items-start mb-0 pb-0'>
          {/* Precio anterior tachado + Badge en la misma línea */}
          {displayOriginalPrice && displayOriginalPrice > (displayPrice ?? 0) && (
            <div className='flex items-center gap-1.5 mb-0 leading-none -mt-0.5'>
              <span className='text-gray-400 line-through text-[9px] md:text-[10px]'>
                {formatCurrency(displayOriginalPrice, 'ARS', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
              {/* Badge de descuento - al lado del precio tachado - ⚡ MULTITENANT: usar primaryColor */}
              {effectiveDiscount && (
                <span
                  className='inline-flex items-center justify-center px-1 py-0.5 rounded-full text-[6px] sm:text-[7px] md:text-[8px] font-bold leading-none tracking-wide whitespace-nowrap'
                  style={{ backgroundColor: primaryColor, color: '#ffffff' }}
                >
                  {effectiveDiscount} OFF
                </span>
              )}
            </div>
          )}
          
          {displayPrice !== undefined && (
            <div className='flex items-center gap-1 md:gap-1.5 -mt-0.5'>
              {/* Precio actual - ⚡ MULTITENANT: usar primaryColor */}
              <div
                className='text-sm sm:text-base md:text-xl font-semibold tracking-wide drop-shadow-sm'
                style={{ color: primaryColor }}
              >
                {formatCurrency(displayPrice ?? 0, 'ARS', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}, (prevProps, nextProps) => {
  // Comparación personalizada incluyendo variants
  const prevVariantsLength = prevProps.variants?.length || 0
  const nextVariantsLength = nextProps.variants?.length || 0
  
  return (
    prevProps.brand === nextProps.brand &&
    prevProps.title === nextProps.title &&
    prevProps.displayPrice === nextProps.displayPrice &&
    prevProps.displayOriginalPrice === nextProps.displayOriginalPrice &&
    prevProps.discount === nextProps.discount &&
    prevProps.selectedColorName === nextProps.selectedColorName &&
    prevVariantsLength === nextVariantsLength
  )
})

ProductCardContent.displayName = 'ProductCardContent'

