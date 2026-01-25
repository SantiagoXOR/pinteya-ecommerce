'use client'

import React from 'react'
import { cn } from '@/lib/core/utils'
import { ShoppingCart } from '@/lib/optimized-imports'
import type { ProductCardActionsProps } from '../types'
import { useTenantSafe } from '@/contexts/TenantContext'

/**
 * Componente de acciones del ProductCard
 * Botón circular de agregar al carrito
 */
export const ProductCardActions = React.memo(function ProductCardActions({
  onAddToCart,
  isAddingToCart,
  stock,
  cartAddCount
}: ProductCardActionsProps) {
  // ⚡ MULTITENANT: Colores del tenant para el botón de carrito
  const tenant = useTenantSafe()
  const accentColor = tenant?.accentColor || '#ffd549' // Amarillo por defecto
  const primaryColor = tenant?.primaryColor || '#f27a1d' // Naranja por defecto
  
  const handleClick = React.useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onAddToCart(e)
  }, [onAddToCart])

  // ✅ NUEVO: No mostrar el botón si no hay stock
  if (stock === 0) {
    return null
  }

  return (
    <div className='absolute right-2 sm:right-3 md:right-4 top-[46%] sm:top-[48%] md:top-[50%] z-20 w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10'>
      {/* Blur amarillo detrás del botón - ⚡ MULTITENANT: usar accentColor */}
      <div 
        className='absolute inset-0 rounded-full pointer-events-none'
        style={{
          backgroundColor: accentColor,
          opacity: 0.9,
        }}
      />
      
      <button
        type='button'
        onClick={handleClick}
        disabled={isAddingToCart}
        data-testid='add-to-cart'
        data-testid-btn='add-to-cart-btn'
        aria-label='Agregar al carrito'
        className={cn(
          'relative w-full h-full rounded-full shadow-md flex items-center justify-center transition-all hover:scale-110 active:scale-95 transform-gpu will-change-transform',
          'bg-transparent hover:bg-transparent'
        )}
      >
        {isAddingToCart ? (
          <div 
            className='w-4 h-4 md:w-5 md:h-5 border-2 border-t-transparent rounded-full animate-spin'
            style={{ borderColor: primaryColor }}
          />
        ) : cartAddCount > 0 ? (
          <span 
            className='font-bold text-xs sm:text-sm md:text-base'
            style={{ color: primaryColor }}
          >
            +{cartAddCount}
          </span>
        ) : (
          <ShoppingCart 
            className='w-4 h-4 md:w-5 md:h-5'
            style={{ color: primaryColor }}
          />
        )}
      </button>
    </div>
  )
}, (prevProps, nextProps) => {
  return (
    prevProps.isAddingToCart === nextProps.isAddingToCart &&
    prevProps.stock === nextProps.stock &&
    prevProps.cartAddCount === nextProps.cartAddCount &&
    prevProps.onAddToCart === nextProps.onAddToCart
  )
})

ProductCardActions.displayName = 'ProductCardActions'

