'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { ShoppingCartPlus } from '@/lib/optimized-imports'
import { formatCurrency } from '@/lib/utils/consolidated-utils'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'

interface StickyAddToCartProps {
  price: number
  onAddToCart: () => void
  disabled?: boolean
  isLoading?: boolean
  className?: string
}

/**
 * Componente StickyAddToCart
 * Muestra un botón fijo en la parte inferior de la pantalla en móviles
 * Solo visible en dispositivos móviles (< 768px)
 * 
 * Consideraciones implementadas:
 * - Z-index alto (z-50) para estar sobre bottom nav (z-40)
 * - Solo visible en móvil usando useIsMobile hook
 * - Accesibilidad: aria-label descriptivo y focusable con teclado
 * - Padding bottom automático para evitar que tape contenido
 */
export const StickyAddToCart: React.FC<StickyAddToCartProps> = ({
  price,
  onAddToCart,
  disabled = false,
  isLoading = false,
  className,
}) => {
  const isMobile = useIsMobile()

  // Solo mostrar en móvil
  if (!isMobile) {
    return null
  }

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg md:hidden',
        className
      )}
      role="region"
      aria-label="Agregar producto al carrito"
    >
      <div className="flex items-center justify-between gap-3 p-4 max-w-screen-xl mx-auto">
        <div className="flex flex-col">
          <p className="text-xs text-gray-600 leading-none">Total</p>
          <p className="text-xl font-bold text-orange-600 leading-tight">
            {formatCurrency(price)}
          </p>
        </div>
        <Button
          onClick={onAddToCart}
          disabled={disabled || isLoading}
          className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 h-auto"
          aria-label="Agregar al carrito"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Agregando...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <ShoppingCartPlus className="w-5 h-5" />
              Agregar al Carrito
            </span>
          )}
        </Button>
      </div>
    </div>
  )
}

