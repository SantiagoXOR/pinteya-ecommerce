'use client'

import React from 'react'
import ShippingProgressBar from '@/components/ui/shipping-progress-bar'
import Image from 'next/image'
import { formatCurrency } from '@/lib/utils/consolidated-utils'

interface CartSummaryFooterProps {
  subtotal: number
  shipping: number
  total: number
  freeShippingThreshold?: number
  className?: string
}

/**
 * Footer sticky reutilizable del carrito - Mismo diseño que CartSidebarModal
 */
export const CartSummaryFooter: React.FC<CartSummaryFooterProps> = ({
  subtotal,
  shipping,
  total,
  freeShippingThreshold = 50000,
  className = '',
}) => {
  const qualifiesForFreeShipping = subtotal >= freeShippingThreshold
  const estimatedShippingCost = qualifiesForFreeShipping ? 0 : shipping

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all duration-200 ${className}`}>
      {/* Barra de Progreso Envío Gratis */}
      {subtotal > 0 && (
        <div className='mb-3'>
          <ShippingProgressBar 
            currentAmount={subtotal} 
            targetAmount={freeShippingThreshold}
            variant='compact' 
            showIcon={true}
          />
        </div>
      )}

      {/* Subtotal */}
      <div className='flex items-center justify-between gap-3 mb-3'>
        <p className='font-medium text-lg text-gray-900'>Subtotal:</p>
        <p className='font-medium text-lg text-tenant-price'>
          {formatCurrency(subtotal)}
        </p>
      </div>

      {/* Envío - color tenant para mejor contraste */}
      {subtotal > 0 && (
        <div className='flex items-center justify-between gap-3 mb-2'>
          <p className='text-gray-700'>Envío</p>
          <p className='font-semibold'>
            {estimatedShippingCost === 0 ? (
              <span className='text-tenant-success'>Gratis</span>
            ) : (
              <span className='text-tenant-price'>{formatCurrency(estimatedShippingCost)}</span>
            )}
          </p>
        </div>
      )}

      {/* Total */}
      {subtotal > 0 && (
        <div className='flex items-center justify-between gap-3 mb-0'>
          <p className='font-bold text-lg text-gray-900'>Total:</p>
          <p className='font-bold text-lg text-tenant-price'>
            {formatCurrency(total)}
          </p>
        </div>
      )}
    </div>
  )
}

