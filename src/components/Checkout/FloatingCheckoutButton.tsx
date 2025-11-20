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
    <div className='fixed bottom-6 right-6 z-50'>
      <Button
        onClick={handleCheckout}
        className={cn(
          'bg-green-600 hover:bg-green-700 text-white font-semibold',
          'shadow-lg hover:shadow-xl transition-all duration-300',
          'px-6 py-4 rounded-full',
          'flex items-center gap-3',
          'min-w-[200px] md:min-w-[250px]',
          'text-sm md:text-base'
        )}
        size='lg'
      >
        <div className='flex items-center gap-2'>
          <ShoppingCart className='w-5 h-5' />
          <span className='font-bold'>
            {itemCount} {itemCount === 1 ? 'producto' : 'productos'}
          </span>
        </div>
        <div className='flex items-center gap-2 border-l border-white/30 pl-3'>
          <span className='font-bold'>{formattedPrice}</span>
          <ArrowRight className='w-4 h-4' />
        </div>
      </Button>
    </div>
  )
}


