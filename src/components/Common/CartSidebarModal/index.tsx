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
import { useAccessibilitySettings } from '@/hooks/useAccessibilitySettings'
import { ArrowRight } from '@/lib/optimized-imports'
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet'
import { formatCurrency } from '@/lib/utils/consolidated-utils'

const CartSidebarModal = () => {
  const { isCartModalOpen, closeCartModal } = useCartModalContext()
  const cartItems = useAppSelector(state => state.cartReducer.items)
  const [mounted, setMounted] = useState(false)
  const [dragStartY, setDragStartY] = useState<number | null>(null)
  const [dragCurrentY, setDragCurrentY] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const { isLargeText } = useAccessibilitySettings()

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
          className='rounded-t-3xl p-0 overflow-hidden flex flex-col [&>button]:hidden'
          style={{
            transform: isDragging && translateY > 0 ? `translateY(${translateY}px)` : undefined,
            transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            willChange: isDragging ? 'transform' : 'auto',
            maxHeight: isLargeText 
              ? 'calc(100dvh - env(safe-area-inset-bottom, 0px))' 
              : 'calc(100dvh - env(safe-area-inset-bottom, 0px))',
            height: isLargeText 
              ? 'calc(100dvh - env(safe-area-inset-bottom, 0px))' 
              : 'calc(100dvh - env(safe-area-inset-bottom, 0px))',
            bottom: 0
          }}
        >
          {/* Título oculto para accesibilidad */}
          <SheetTitle className='sr-only'>Carrito de Compras</SheetTitle>

          {/* Header fijo con drag handle y botón */}
          <div className='flex flex-col flex-shrink-0 bg-white rounded-t-3xl'>
            {/* Drag Handle - Indicador visual estilo Instagram */}
            <div 
              className='flex justify-center pt-1.5 pb-0.5 cursor-grab active:cursor-grabbing touch-none select-none'
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <div className='w-12 h-1 bg-gray-300 rounded-full pointer-events-none' />
            </div>

            {/* Información de pago - Mercado Pago */}
            {mounted && hasItems && (
              <div className={`px-4 sm:px-7.5 lg:px-11 bg-white`} style={{ paddingTop: '0px', paddingBottom: '0px', marginBottom: '0px' }}>
                <div className={`w-full flex items-center justify-center gap-1.5 ${isLargeText ? 'px-1' : 'px-2'} ${isLargeText ? 'text-[9px]' : 'text-[10px]'} text-gray-600`} style={{ paddingTop: '0px', paddingBottom: '4px', marginTop: '0px', marginBottom: '0px' }}>
                  <Image
                    src='/images/logo/MercadoPagoLogos/SVGs/MP_RGB_HANDSHAKE_color_horizontal.svg'
                    alt='MercadoPago'
                    width={isLargeText ? 80 : 95}
                    height={isLargeText ? 24 : 30}
                    className='w-auto h-auto'
                    style={{ maxWidth: isLargeText ? '80px' : '95px', margin: '0', display: 'block' }}
                  />
                  <span className={`font-medium ${isLargeText ? 'text-[9px]' : 'text-[10px]'}`} style={{ margin: '0' }}>Pago seguro</span>
                </div>
              </div>
            )}
          </div>

          {/* Content Area - Scrollable */}
          <div className={`flex-1 overflow-y-auto no-scrollbar px-4 sm:px-7.5 lg:px-11 ${hasItems ? 'pt-1' : isLargeText ? 'pt-1' : 'pt-2'} bg-gray-50 min-h-0`} style={{ overflowY: 'auto', minHeight: '0' }}>
            <div className={`flex flex-col ${isLargeText ? 'gap-1' : 'gap-1.5'} px-1`}>
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
          <div 
            className={`border-t border-gray-200 bg-white px-4 sm:px-7.5 lg:px-11 mt-auto flex-shrink-0 relative z-0`} 
            style={{ 
              paddingTop: '8px', 
              paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))', 
              marginBottom: '0px' 
            }}
          >
            {/* Barra de Progreso Envío Gratis */}
            {mounted && effectiveCartItems.length > 0 && (
              <div className={isLargeText ? 'mb-1' : 'mb-1.5'}>
                <ShippingProgressBar 
                  currentAmount={effectiveTotalPrice} 
                  variant='compact' 
                  showIcon={true}
                />
              </div>
            )}

            {/* Subtotal */}
            <div className={`flex items-center justify-between gap-3 ${isLargeText ? 'mb-0.5' : 'mb-1'}`}>
              <p className={isLargeText ? 'text-[11px] text-gray-600 font-light' : 'text-xs text-gray-600 font-light'}>Subtotal</p>
              <p className={isLargeText ? 'text-[11px] font-semibold' : 'text-xs font-semibold'} style={{ color: '#c2410b' }}>
                {mounted ? formatCurrency(effectiveTotalPrice) : formatCurrency(0)}
              </p>
            </div>

            {/* Envío */}
            {hasItems && (
              <div className={`flex items-center justify-between gap-3 ${isLargeText ? 'mb-0.5' : 'mb-1'}`}>
                <p className={isLargeText ? 'text-[11px] text-gray-600' : 'text-xs text-gray-600'}>Envío</p>
                <p className={isLargeText ? 'text-[11px] font-semibold' : 'text-xs font-semibold'}>
                  {estimatedShippingCost === 0 ? (
                    <span className='text-green-600'>Gratis</span>
                  ) : (
                    <span className='text-yellow-600'>{formatCurrency(estimatedShippingCost)}</span>
                  )}
                </p>
              </div>
            )}

            {/* Total */}
            {hasItems && (
              <div className={`flex items-center justify-between gap-3 ${isLargeText ? 'mb-1' : 'mb-1.5'}`}>
                <p className={isLargeText ? 'font-semibold text-xs text-gray-900' : 'font-semibold text-sm text-gray-900'}>Total</p>
                <p className={isLargeText ? 'font-semibold text-xs' : 'font-semibold text-sm'} style={{ color: '#c2410b' }}>
                  {mounted ? formatCurrency(effectiveTotalPrice + estimatedShippingCost) : formatCurrency(0)}
                </p>
              </div>
            )}

            {/* Botón "Comprar ahora" - Estilo verde del checkout - Sticky */}
            {mounted && hasItems && (
              <div style={{ marginTop: '6px', marginBottom: '0px', paddingBottom: '0px' }}>
                <button
                  onClick={startTransition}
                  disabled={isButtonDisabled || cartLoading}
                  data-testid='checkout-btn-bottom'
                  className={`w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold ${isLargeText ? 'py-1.5 px-3 text-xs' : 'py-1.5 px-4 text-sm'} rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-1.5 ${
                    isButtonDisabled || cartLoading
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  }`}
                >
                  {cartLoading
                    ? 'Cargando carrito...'
                    : isButtonDisabled
                      ? 'Procesando...'
                      : (
                        <>
                          Comprar ahora
                          <ArrowRight className={isLargeText ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
                        </>
                      )}
                </button>
              </div>
            )}
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
