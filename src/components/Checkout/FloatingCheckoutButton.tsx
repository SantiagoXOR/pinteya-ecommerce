'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppSelector } from '@/redux/store'
import { selectCartItems, selectTotalPrice } from '@/redux/features/cart-slice'
import { Button } from '@/components/ui/button'
import { ShoppingCart, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export const FloatingCheckoutButton: React.FC = () => {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const cartItems = useAppSelector(selectCartItems)
  const totalPrice = useAppSelector(selectTotalPrice)

  useEffect(() => {
    setMounted(true)
  }, [])

  const itemCount = Array.isArray(cartItems) ? cartItems.length : 0
  const hasItems = itemCount > 0

  const handleCheckout = () => {
    router.push('/checkout/meta')
  }

  if (!mounted || !hasItems) {
    return null
  }

  const formattedPrice = totalPrice.toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  })

  return (
    <div className='fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[9999]'>
      <Button
        onClick={handleCheckout}
        className={cn(
          'bg-green-600 hover:bg-green-700 text-white font-semibold',
          'shadow-lg hover:shadow-xl transition-all duration-300',
          'px-4 py-3 md:px-6 md:py-4 rounded-full',
          'flex items-center gap-2 md:gap-3',
          'min-w-[180px] md:min-w-[250px]',
          'text-xs md:text-sm',
          'touch-manipulation'
        )}
        size='lg'
      >
        <div className='flex items-center gap-1.5 md:gap-2'>
          <ShoppingCart className='w-4 h-4 md:w-5 md:h-5' />
          <span className='font-bold text-xs md:text-sm'>
            {itemCount} {itemCount === 1 ? 'producto' : 'productos'}
          </span>
        </div>
        <div className='flex items-center gap-1.5 md:gap-2 border-l border-white/30 pl-2 md:pl-3'>
          <span className='font-bold text-xs md:text-sm'>{formattedPrice}</span>
          <ArrowRight className='w-3 h-3 md:w-4 md:h-4' />
        </div>
      </Button>
    </div>
  )
}


