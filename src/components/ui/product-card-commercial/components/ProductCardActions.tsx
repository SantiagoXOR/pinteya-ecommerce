'use client'

import React from 'react'
import { cn } from '@/lib/core/utils'
import { ShoppingCart, AlertCircle } from '@/lib/optimized-imports'
import type { ProductCardActionsProps } from '../types'

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
  const handleClick = React.useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onAddToCart(e)
  }, [onAddToCart])

  return (
    <button
      type='button'
      onClick={handleClick}
      disabled={isAddingToCart || stock === 0}
      data-testid='add-to-cart'
      data-testid-btn='add-to-cart-btn'
      aria-label='Agregar al carrito'
      className={cn(
        'absolute left-2 md:left-3 top-2 md:top-2.5 z-20 w-10 h-10 md:w-11 md:h-11 rounded-full shadow-md flex items-center justify-center transition-all hover:scale-110 active:scale-95 transform-gpu will-change-transform',
        stock === 0
          ? 'bg-gray-200 cursor-not-allowed'
          : 'bg-yellow-400 hover:bg-yellow-500'
      )}
      style={{
        backgroundColor: stock !== 0 ? '#facc15' : undefined,
      }}
    >
      {isAddingToCart ? (
        <div className='w-4 h-4 md:w-5 md:h-5 border-2 border-[#EA5A17] border-t-transparent rounded-full animate-spin' />
      ) : stock === 0 ? (
        <AlertCircle className='w-4 h-4 md:w-5 md:h-5 text-gray-500' />
      ) : cartAddCount > 0 ? (
        <span className='font-bold text-sm md:text-base text-[#EA5A17]'>
          +{cartAddCount}
        </span>
      ) : (
        <ShoppingCart className='w-4 h-4 md:w-5 md:h-5 text-[#EA5A17]' />
      )}
    </button>
  )
})

ProductCardActions.displayName = 'ProductCardActions'

