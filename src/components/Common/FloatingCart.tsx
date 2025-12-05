'use client'

import React, { useState, useEffect } from 'react'
import { OptimizedCartIcon } from '@/components/ui/optimized-cart-icon'
import { cn } from '@/lib/utils'
import { useCartModalContext } from '@/app/context/CartSidebarModalContext'
import { useAppSelector } from '@/redux/store'
import { useCartAnimation } from '@/hooks/useCartAnimation'

const FloatingCart = () => {
  const [cartShake, setCartShake] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const { openCartModal } = useCartModalContext()
  const cartItems = useAppSelector(state => state.cartReducer?.items || [])
  const { isAnimating } = useCartAnimation()

  const cartItemCount = cartItems.length

  // Efecto para evitar error de hidratación
  useEffect(() => {
    setMounted(true)
  }, [])

  // Delay de 3 segundos antes de mostrar
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 3000)
    return () => clearTimeout(timer)
  }, [])

  // Animación cuando se agrega item
  useEffect(() => {
    if (isAnimating) {
      setCartShake(true)
      const timer = setTimeout(() => setCartShake(false), 600)
      return () => clearTimeout(timer)
    }
  }, [isAnimating])

  // No renderizar hasta que esté montado (evitar hidratación)
  if (!mounted) return null

  return (
    <div
      className={cn(
        'fixed bottom-8 left-8 z-50 transition-all duration-500',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      )}
    >
      {/* Liquid Glass Background Effect */}
      <div className='absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400/80 via-yellow-300/60 to-yellow-500/80 backdrop-blur-xl border border-white/20 shadow-2xl'></div>
      <div className='absolute inset-0 rounded-full bg-gradient-to-br from-white/30 via-transparent to-transparent'></div>
      <div className='absolute inset-0 rounded-full bg-gradient-to-tl from-yellow-600/20 via-transparent to-white/10'></div>

      {/* Main Button */}
      <button
        onClick={openCartModal}
        data-testid='floating-cart-icon'
        className={cn(
          // Posicionamiento relativo dentro del contenedor
          'relative',
          // Estilos del botón con efecto glass
          'bg-yellow-400/90 hover:bg-yellow-500/90 text-black font-bold px-3 py-2',
          'rounded-full shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out',
          'hover:scale-110 active:scale-95 border border-white/30',
          'flex items-center gap-2 group floating-button focus-ring',
          // Animaciones condicionales
          cartShake ? 'animate-bounce cart-badge-animate' : '',
          isAnimating ? 'scale-110 cart-badge-animate' : 'scale-100',
          'hover:rotate-3 hover:shadow-2xl',
          // Efecto glass mejorado
          'backdrop-blur-md bg-gradient-to-r from-yellow-400/80 to-yellow-500/80'
        )}
      >
        {/* Icono del carrito */}
        <div className='relative'>
          <OptimizedCartIcon
            width={32}
            height={32}
            className='w-8 h-8 transition-transform duration-200 group-hover:scale-110 drop-shadow-lg'
            alt='Carrito de compras'
          />
          {/* Badge siempre visible, incluso con 0 items */}
          {mounted && (
            <span
              className={cn(
                'absolute -top-1 -right-1 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center z-badge shadow-lg transition-all duration-200 group-hover:scale-125',
                cartItemCount > 0 ? 'animate-pulse' : ''
              )}
              style={{ backgroundColor: '#007639', color: '#fbbf24' }}
            >
              {cartItemCount > 99 ? '99+' : cartItemCount}
            </span>
          )}
        </div>
        <span className='text-sm font-semibold text-blaze-orange-600' style={{ color: '#c2410b' }}>
          Carrito
        </span>
      </button>
    </div>
  )
}

export default FloatingCart

