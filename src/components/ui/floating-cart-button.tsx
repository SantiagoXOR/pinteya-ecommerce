'use client'

import React, { useState, useEffect } from 'react'
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
  const [mounted, setMounted] = useState(false)
  const { openCartModal } = useCartModalContext()
  const cartItems = useAppSelector(state => state.cartReducer.items)
  const totalPrice = useSelector(selectTotalPrice)
  const { isAnimating } = useCartAnimation()

  const cartItemCount = cartItems.length
  const hasCartItems = cartItemCount > 0

  // Efecto para evitar error de hidratación
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleCartClick = () => {
    openCartModal()
  }

  // En mobile siempre mostrar el botón (incluso sin items para consistencia UX)

  return (
    <div className='hidden fixed bottom-8 right-8 z-maximum'>
      {/* Liquid Glass Background Effect */}
      <div 
        className='absolute inset-0 rounded-full backdrop-blur-xl border border-white/20 shadow-2xl'
        style={{
          background: `linear-gradient(to right, var(--tenant-accent)cc, var(--tenant-accent)99, var(--tenant-accent)cc)`
        }}
      ></div>
      <div className='absolute inset-0 rounded-full bg-gradient-to-br from-white/30 via-transparent to-transparent'></div>
      <div 
        className='absolute inset-0 rounded-full bg-gradient-to-tl via-transparent to-white/10'
        style={{ background: `linear-gradient(to top left, var(--tenant-accent)33, transparent, rgba(255,255,255,0.1))` }}
      ></div>

      {/* Main Button */}
      <button
        onClick={handleCartClick}
        data-testid='floating-cart-icon'
        className={cn(
          // Posicionamiento relativo dentro del contenedor
          'relative',
          // Estilos del botón con efecto glass - altura más compacta
          'text-black font-bold px-3 py-2',
          'rounded-full shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out',
          'hover:scale-110 active:scale-95 border border-white/30',
          'flex items-center gap-2 group floating-button focus-ring',
          // Animaciones condicionales (igual al header)
          cartShake ? 'animate-bounce cart-badge-animate' : '',
          isAnimating ? 'scale-110 cart-badge-animate' : 'scale-100',
          'hover:rotate-3 hover:shadow-2xl',
          // Efecto glass mejorado
          'backdrop-blur-md',
          className
        )}
        style={{
          backgroundColor: 'var(--tenant-accent)e6',
          background: 'linear-gradient(to right, var(--tenant-accent)cc, var(--tenant-accent)cc)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--tenant-accent-button-hover)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--tenant-accent)e6'
        }}
      >
        {/* Icono del carrito - tamaño más pequeño y proporcional */}
        <div className='relative'>
          <OptimizedCartIcon
            width={32}
            height={32}
            className='w-8 h-8 transition-transform duration-200 group-hover:scale-110 drop-shadow-lg'
            alt='Carrito de compras'
          />
          {mounted && cartItemCount > 0 && (
            <span
              className='absolute -top-1 -right-1 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center z-badge shadow-lg transition-all duration-200 group-hover:scale-125 animate-pulse'
              style={{ backgroundColor: '#007639', color: '#fbbf24' }}
            >
              {cartItemCount > 99 ? '99+' : cartItemCount}
            </span>
          )}
        </div>
        <span className='text-sm font-semibold' style={{ color: 'var(--tenant-icon-color)' }}>
          Carrito
        </span>
      </button>
    </div>
  )
}

export default FloatingCartButton
