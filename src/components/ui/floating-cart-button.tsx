'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { OptimizedCartIcon } from '@/components/ui/optimized-cart-icon'
import { cn } from '@/lib/utils'
import { useCartModalContext } from '@/app/context/CartSidebarModalContext'
import { useAppSelector } from '@/redux/store'
import { useSelector } from 'react-redux'
import { selectTotalPrice } from '@/redux/features/cart-slice'
import { useCartAnimation } from '@/hooks/useCartAnimation'

interface FloatingCartButtonProps {
  className?: string
}

const FloatingCartButton: React.FC<FloatingCartButtonProps> = ({ className }) => {
  const [cartShake, setCartShake] = useState(false)
  const { openCartModal } = useCartModalContext()
  const cartItems = useAppSelector(state => state.cartReducer.items)
  const totalPrice = useSelector(selectTotalPrice)
  const { isAnimating } = useCartAnimation()

  const cartItemCount = cartItems.length
  const hasCartItems = cartItemCount > 0

  const handleCartClick = () => {
    openCartModal()
  }

  // En mobile siempre mostrar el botón (incluso sin items para consistencia UX)

  return (
    <div className='fixed bottom-8 left-1/2 transform -translate-x-1/2 z-maximum sm:bottom-8 sm:right-8 sm:left-auto sm:transform-none'>
      {/* Liquid Glass Background Effect */}
      <div className='absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400/80 via-yellow-300/60 to-yellow-500/80 backdrop-blur-xl border border-white/20 shadow-2xl'></div>
      <div className='absolute inset-0 rounded-full bg-gradient-to-br from-white/30 via-transparent to-transparent'></div>
      <div className='absolute inset-0 rounded-full bg-gradient-to-tl from-yellow-600/20 via-transparent to-white/10'></div>

      {/* Main Button */}
      <button
        onClick={handleCartClick}
        data-testid='floating-cart-icon'
        className={cn(
          // Posicionamiento relativo dentro del contenedor
          'relative',
          // Estilos del botón con efecto glass - altura reducida
          'bg-yellow-400/90 hover:bg-yellow-500/90 text-black font-bold px-4 py-1.5',
          'rounded-full shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out',
          'hover:scale-110 active:scale-95 border border-white/30',
          'flex items-center gap-1 group floating-button focus-ring',
          // Animaciones condicionales (igual al header)
          cartShake ? 'animate-bounce cart-badge-animate' : '',
          isAnimating ? 'scale-110 cart-badge-animate' : 'scale-100',
          'hover:rotate-3 hover:shadow-2xl',
          // Efecto glass mejorado
          'backdrop-blur-md bg-gradient-to-r from-yellow-400/80 to-yellow-500/80',
          className
        )}
      >
        {/* Icono del carrito que puede sobresalir */}
        <div className='relative -mt-2 -mb-1'>
          <OptimizedCartIcon
            width={44}
            height={44}
            className='w-11 h-11 transition-transform duration-200 group-hover:scale-110 drop-shadow-lg'
            alt='Carrito de compras'
          />
          {cartItemCount > 0 && (
            <span
              className='absolute -top-1 -right-1 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center z-badge shadow-lg transition-all duration-200 group-hover:scale-125 animate-pulse'
              style={{ backgroundColor: '#007639', color: '#fbbf24' }}
            >
              {cartItemCount > 99 ? '99+' : cartItemCount}
            </span>
          )}
        </div>
        <span className='text-xs font-semibold text-blaze-orange-600' style={{ color: '#ea5a17' }}>
          Carrito
        </span>
      </button>
    </div>
  )
}

export default FloatingCartButton
