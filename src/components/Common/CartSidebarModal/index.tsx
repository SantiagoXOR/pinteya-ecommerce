'use client'
import React, { useEffect, useState } from 'react'

import { useCartModalContext } from '@/app/context/CartSidebarModalContext'
import { selectTotalPrice } from '@/redux/features/cart-slice'
import { useAppSelector } from '@/redux/store'
import { useSelector } from 'react-redux'
import SingleItem from './SingleItem'
import Link from 'next/link'
import EmptyCart from './EmptyCart'
import ShippingProgressBar from '@/components/ui/shipping-progress-bar'
import Image from 'next/image'
import CheckoutTransitionAnimation from '@/components/ui/checkout-transition-animation'
import useCheckoutTransition from '@/hooks/useCheckoutTransition'
import { useCartWithBackend } from '@/hooks/useCartWithBackend'
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet'

const CartSidebarModal = () => {
  const { isCartModalOpen, closeCartModal } = useCartModalContext()
  const cartItems = useAppSelector(state => state.cartReducer.items)
  const [mounted, setMounted] = useState(false)
  const [dragStartY, setDragStartY] = useState<number | null>(null)
  const [dragCurrentY, setDragCurrentY] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Hook para carrito con backend
  const {
    items: backendCartItems,
    totalItems: backendTotalItems,
    totalAmount: backendTotalAmount,
    loading: cartLoading,
  } = useCartWithBackend()

  const totalPrice = useSelector(selectTotalPrice)

  // Usar carrito del backend si está disponible, sino usar Redux
  const effectiveCartItems = backendCartItems.length > 0 ? backendCartItems : cartItems
  const effectiveTotalPrice = backendCartItems.length > 0 ? backendTotalAmount : totalPrice
  const hasItems = mounted && effectiveCartItems.length > 0

  // Estimación de envío: gratis desde $50.000; caso contrario $10.000 (express)
  const estimatedShippingCost = effectiveTotalPrice >= 50000 ? 0 : 10000

  // Hook para manejar la animación de transición al checkout
  const { isTransitioning, startTransition, skipAnimation, isButtonDisabled } =
    useCheckoutTransition({
      onTransitionStart: () => {
        // Cerrar el modal con animación de deslizamiento
        closeCartModal()
      },
      onTransitionComplete: () => {
        // La navegación se maneja automáticamente en el componente de animación
      },
    })

  // Efecto para evitar error de hidratación
  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevenir scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isCartModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    
    return () => {
      document.body.style.overflow = ''
    }
  }, [isCartModalOpen])

  // Handlers para el drag to dismiss
  const handleDragStart = (clientY: number) => {
    setDragStartY(clientY)
    setIsDragging(true)
  }

  const handleDragMove = (clientY: number) => {
    if (dragStartY === null) return
    setDragCurrentY(clientY)
  }

  const handleDragEnd = () => {
    if (dragStartY !== null && dragCurrentY !== null) {
      const dragDistance = dragCurrentY - dragStartY
      // Si arrastró hacia abajo más de 100px, cerrar el modal
      if (dragDistance > 100) {
        // Primero resetear el estado del drag para que vuelva a su posición
        setDragStartY(null)
        setDragCurrentY(null)
        setIsDragging(false)
        // Luego cerrar el modal después de un pequeño delay
        setTimeout(() => {
          closeCartModal()
        }, 50)
        return
      }
    }
    setDragStartY(null)
    setDragCurrentY(null)
    setIsDragging(false)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches[0]) {
      handleDragStart(e.touches[0].clientY)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches[0]) {
      e.preventDefault() // Prevenir scroll mientras arrastra
      handleDragMove(e.touches[0].clientY)
    }
  }

  const handleTouchEnd = () => {
    handleDragEnd()
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    handleDragStart(e.clientY)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      handleDragMove(e.clientY)
    }
  }

  const handleMouseUp = () => {
    if (isDragging) {
      handleDragEnd()
    }
  }

  // Calcular el translateY para el efecto visual
  const translateY = dragStartY !== null && dragCurrentY !== null
    ? Math.max(0, dragCurrentY - dragStartY)
    : 0

  return (
    <>
      <Sheet open={isCartModalOpen} onOpenChange={closeCartModal}>
        <SheetContent
          side='bottom'
          className='h-[88vh] max-h-[88vh] rounded-t-3xl p-0 overflow-hidden flex flex-col [&>button]:hidden'
          style={{
            transform: isDragging && translateY > 0 ? `translateY(${translateY}px)` : undefined,
            transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            willChange: isDragging ? 'transform' : 'auto'
          }}
        >
          {/* Título oculto para accesibilidad */}
          <SheetTitle className='sr-only'>Carrito de Compras</SheetTitle>

          {/* Drag Handle - Indicador visual estilo Instagram */}
          <div 
            className='flex justify-center pt-3 pb-2 bg-white rounded-t-3xl flex-shrink-0 cursor-grab active:cursor-grabbing touch-none select-none'
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <div className='w-12 h-1.5 bg-gray-300 rounded-full pointer-events-none' />
          </div>

          {/* Content Area - Scrollable */}
          <div className='flex-1 overflow-y-auto no-scrollbar px-4 sm:px-7.5 lg:px-11 pt-4 bg-gray-50 min-h-0'>
            <div className='flex flex-col gap-4 px-1'>
              {/* cart items */}
              {mounted && effectiveCartItems.length > 0 ? (
                effectiveCartItems.map((item: any, key: number) => (
                  <SingleItem key={key} item={item} />
                ))
              ) : (
                <EmptyCart />
              )}
            </div>
          </div>

          {/* Footer - Sticky at bottom */}
          <div className='border-t border-gray-200 bg-white px-4 sm:px-7.5 lg:px-11 pt-3 pb-3 mt-auto flex-shrink-0'>
            {/* Barra de Progreso Envío Gratis */}
            {mounted && effectiveCartItems.length > 0 && (
              <div className='mb-3'>
                <ShippingProgressBar 
                  currentAmount={effectiveTotalPrice} 
                  variant='compact' 
                  showIcon={true}
                />
              </div>
            )}

            {/* Subtotal */}
            <div className='flex items-center justify-between gap-3 mb-3'>
              <p className='font-bold text-lg text-gray-900'>Subtotal:</p>
              <p className='font-bold text-lg' style={{ color: '#c2410b' }}>
                ${mounted ? effectiveTotalPrice.toLocaleString() : '0'}
              </p>
            </div>

            {/* Envío */}
            {hasItems && (
              <div className='flex items-center justify-between gap-3 mb-2'>
                <p className='text-gray-700'>Envío</p>
                <p className='font-semibold'>
                  {estimatedShippingCost === 0 ? (
                    <span className='text-green-600'>Gratis</span>
                  ) : (
                    `$${estimatedShippingCost.toLocaleString()}`
                  )}
                </p>
              </div>
            )}

            {/* Total */}
            {hasItems && (
              <div className='flex items-center justify-between gap-3 mb-3'>
                <p className='font-bold text-lg text-gray-900'>Total:</p>
                <p className='font-bold text-lg' style={{ color: '#c2410b' }}>
                  ${mounted ? (effectiveTotalPrice + estimatedShippingCost).toLocaleString() : '0'}
                </p>
              </div>
            )}

            {/* Información de pago */}
            <div className='space-y-2'>
              {/* Línea informativa de MercadoPago */}
              <div className='w-full flex items-center justify-center gap-2 py-1 px-2 text-sm text-gray-600'>
                <Image
                  src='/images/logo/MercadoPagoLogos/SVGs/MP_RGB_HANDSHAKE_color_horizontal.svg'
                  alt='MercadoPago'
                  width={150}
                  height={48}
                  className='w-auto h-auto max-w-[150px]'
                />
                <span className='font-medium'>Pago seguro</span>
              </div>

              {/* Botón principal de checkout */}
              <button
                onClick={startTransition}
                disabled={isButtonDisabled || !hasItems || cartLoading}
                data-testid='checkout-btn'
                className={`w-full flex justify-center font-bold text-black bg-yellow-400 hover:bg-yellow-500 py-3 px-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl ${
                  isButtonDisabled || !hasItems || cartLoading
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:scale-105 active:scale-95'
                }`}
              >
                {cartLoading
                  ? 'Cargando carrito...'
                  : isButtonDisabled
                    ? 'Procesando...'
                    : 'Finalizar Compra'}
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Componente de animación de transición */}
      <CheckoutTransitionAnimation
        isActive={isTransitioning}
        skipAnimation={skipAnimation}
        onComplete={() => {
          // Callback adicional si es necesario
        }}
      />
    </>
  )
}

export default CartSidebarModal
