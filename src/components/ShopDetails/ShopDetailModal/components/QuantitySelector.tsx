/**
 * Componente selector de cantidad para ShopDetailModal
 */

import React from 'react'
import { cn } from '@/lib/core/utils'
import { ShoppingCart, Minus, Plus, AlertCircle } from '@/lib/optimized-imports'

interface QuantitySelectorProps {
  quantity: number
  onQuantityChange: (quantity: number) => void
  onIncrement: () => void
  onDecrement: () => void
  maxQuantity?: number
  stock: number
}

/**
 * Selector de cantidad memoizado
 */
export const QuantitySelector = React.memo<QuantitySelectorProps>(({
  quantity,
  onQuantityChange,
  onIncrement,
  onDecrement,
  maxQuantity = 99,
  stock,
}) => {
  const isMinQuantity = quantity <= 1
  const isMaxQuantity = quantity >= Math.min(maxQuantity, stock)

  return (
    <div className='space-y-4'>
      <h4 className='text-base font-semibold text-gray-900 flex items-center gap-2'>
        <ShoppingCart className='w-5 h-5 text-blaze-orange-600' />
        Cantidad
      </h4>
      <div className='flex flex-col gap-2'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center border-2 border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm'>
            <button
              onClick={onDecrement}
              disabled={isMinQuantity}
              className={cn(
                'p-3 transition-all duration-200',
                isMinQuantity
                  ? 'opacity-50 cursor-not-allowed bg-gray-50'
                  : 'hover:bg-blaze-orange-50 hover:text-blaze-orange-600'
              )}
              aria-label='Disminuir cantidad'
            >
              <Minus className='w-4 h-4' />
            </button>

            <div className='w-16 px-3 py-3 text-center border-0 font-semibold text-gray-900 bg-white flex items-center justify-center'>
              {quantity}
            </div>

            <button
              onClick={onIncrement}
              disabled={isMaxQuantity}
              className={cn(
                'p-3 transition-all duration-200',
                isMaxQuantity
                  ? 'opacity-50 cursor-not-allowed bg-gray-50'
                  : 'hover:bg-blaze-orange-50 hover:text-blaze-orange-600'
              )}
              aria-label='Aumentar cantidad'
            >
              <Plus className='w-4 h-4' />
            </button>
          </div>
        </div>

        {/* Indicador de stock disponible */}
        <div className='flex items-center gap-1.5 text-sm'>
          {stock === 0 ? (
            <>
              <AlertCircle className='w-4 h-4 text-red-600' />
              <span className='text-red-600 font-medium'>Sin stock disponible</span>
            </>
          ) : quantity >= stock ? (
            <>
              <AlertCircle className='w-4 h-4 text-amber-600' />
              <span className='text-amber-600 font-medium'>Stock máximo alcanzado ({stock} disponibles)</span>
            </>
          ) : stock <= 5 ? (
            <>
              <AlertCircle className='w-4 h-4 text-orange-600' />
              <span className='text-orange-600 font-medium'>¡Últimas {stock} unidades!</span>
            </>
          ) : (
            <span className='text-gray-600'>{stock} unidades disponibles</span>
          )}
        </div>
      </div>
    </div>
  )
})

QuantitySelector.displayName = 'QuantitySelector'

