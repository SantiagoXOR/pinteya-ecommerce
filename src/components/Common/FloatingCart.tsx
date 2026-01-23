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
        onClick={openCartModal}
        data-testid='floating-cart-icon'
        className={cn(
          // Posicionamiento relativo dentro del contenedor
          'relative',
          // Estilos del botón con efecto glass
          'text-black font-bold px-3 py-2',
          'rounded-full shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out',
          'hover:scale-110 active:scale-95 border border-white/30',
          'flex items-center gap-2 group floating-button focus-ring',
          // Animaciones condicionales
          cartShake ? 'animate-bounce cart-badge-animate' : '',
          isAnimating ? 'scale-110 cart-badge-animate' : 'scale-100',
          'hover:rotate-3 hover:shadow-2xl',
          // Efecto glass mejorado
          'backdrop-blur-md'
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
        <span className='text-sm font-semibold' style={{ color: 'var(--tenant-icon-color, #c2410b)' }}>
          Carrito
        </span>
      </button>
    </div>
  )
}

export default FloatingCart

