/**
 * Componente de sección para agregar al carrito
 */

import React from 'react'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Heart } from '@/lib/optimized-imports'
import { FreeShippingText } from '@/components/ui/free-shipping-text'
import { formatPrice } from '../utils/price-utils'
import { formatCapacity } from '@/utils/product-utils'
import { PAINT_COLORS } from '@/components/ui/advanced-color-picker'
import { ProductVariant } from '@/lib/api/product-variants'

interface AddToCartSectionProps {
  currentPrice: number
  quantity: number
  effectiveStock: number
  isLoading: boolean
  loadingProductData: boolean
  onAddToCart: () => void
  onAddToWishlist?: () => void
  productType: {
    hasColorSelector: boolean
    hasWidthSelector: boolean
    hasGrainSelector: boolean
    hasSizeSelector: boolean
  }
  selectedColor?: string
  selectedCapacity?: string
  capacityUnit?: 'litros' | 'kg' | 'metros' | 'unidades'
  selectedVariant?: ProductVariant | null
  selectedGrain?: string
  selectedSize?: string
  selectedWidth?: string
}

/**
 * Sección de agregar al carrito memoizada
 */
export const AddToCartSection = React.memo<AddToCartSectionProps>(({
  currentPrice,
  quantity,
  effectiveStock,
  isLoading,
  loadingProductData,
  onAddToCart,
  onAddToWishlist,
  productType,
  selectedColor,
  selectedCapacity,
  capacityUnit,
  selectedVariant,
  selectedGrain,
  selectedSize,
  selectedWidth,
}) => {
  return (
    <div className='space-y-3'>
      {/* Precio total */}
      <div className='bg-gray-50 p-4 rounded-lg'>
        <div className='flex justify-between items-center'>
          <span className='text-lg font-medium text-gray-900'>Total:</span>
          <span className='text-2xl font-bold text-blaze-orange-600'>
            {formatPrice(currentPrice * quantity)}
          </span>
        </div>
        {quantity > 1 && (
          <p className='text-sm text-gray-600 mt-1'>
            ${currentPrice.toLocaleString()} × {quantity}
          </p>
        )}

        {/* Mostrar selecciones actuales */}
        <div className='mt-3 space-y-1'>
          {/* ✅ CORREGIDO: Solo mostrar color si realmente hay un color seleccionado Y el producto tiene variantes con colores */}
          {productType.hasColorSelector && selectedColor && selectedVariant?.color_name && (
            <p className='text-xs text-gray-500'>
              Color:{' '}
              <span className='font-medium capitalize'>
                {PAINT_COLORS.find(color => color.id === selectedColor)?.displayName ||
                  PAINT_COLORS.find(color => color.id === selectedColor)?.name ||
                  selectedVariant.color_name ||
                  selectedColor}
              </span>
            </p>
          )}
          {selectedCapacity && !productType.hasWidthSelector && !productType.hasGrainSelector && capacityUnit && (
            <p className='text-xs text-gray-500'>
              <span className='font-medium'>
                {capacityUnit === 'litros'
                  ? 'Capacidad'
                  : capacityUnit === 'kg'
                    ? 'Peso'
                    : capacityUnit === 'metros'
                      ? 'Longitud'
                      : 'Cantidad'}
                :
              </span>{' '}
              {formatCapacity(selectedCapacity, capacityUnit)}
            </p>
          )}
          {/* Mostrar finish desde variante seleccionada */}
          {selectedVariant?.finish && (
            <p className='text-xs text-gray-500'>
              <span className='font-medium'>Acabado:</span>{' '}
              <span className='font-medium capitalize'>{selectedVariant.finish}</span>
            </p>
          )}
          {productType.hasGrainSelector && selectedGrain && (
            <p className='text-xs text-gray-500'>
              Grano: <span className='font-medium'>{selectedGrain}</span>
            </p>
          )}
          {productType.hasSizeSelector && selectedSize && (
            <p className='text-xs text-gray-500'>
              Tamaño: <span className='font-medium'>{selectedSize}</span>
            </p>
          )}
          {productType.hasWidthSelector && selectedWidth && (
            <p className='text-xs text-gray-500'>
              Ancho: <span className='font-medium'>{selectedWidth.split(' x ')[0] || selectedWidth}</span>
            </p>
          )}
        </div>
      </div>

      {/* Botones de acción */}
      <div className='space-y-3'>
        <Button
          onClick={onAddToCart}
          disabled={
            effectiveStock === 0 || 
            isLoading || 
            loadingProductData ||
            quantity > effectiveStock
          }
          className='w-full bg-yellow-400 hover:bg-yellow-500 text-black text-lg py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed'
          size='lg'
        >
          <ShoppingCart className='mr-2 h-5 w-5' />
          {effectiveStock === 0
            ? 'Sin Stock'
            : isLoading || loadingProductData
              ? 'Cargando...'
              : quantity > effectiveStock
                ? 'Stock Insuficiente'
                : 'Agregar al Carrito'}
        </Button>

        {onAddToWishlist && (
          <Button
            onClick={onAddToWishlist}
            variant='outline'
            className='w-full border-blaze-orange-300 text-blaze-orange-600 hover:bg-blaze-orange-50 py-3 rounded-xl font-semibold'
            size='lg'
            disabled={loadingProductData}
          >
            <Heart className='mr-2 h-5 w-5' />
            Agregar a Favoritos
          </Button>
        )}

        {/* Información de disponibilidad */}
        <div className='text-center text-sm text-gray-600'>
          {effectiveStock > 0 && (
            <p>
              {effectiveStock <= 5 ? (
                <span className='text-amber-600 font-medium'>
                  ¡Últimas {effectiveStock} disponibles!
                </span>
              ) : (
                <span className='text-green-600'>
                  ✓ Disponible ({effectiveStock} en stock)
                </span>
              )}
            </p>
          )}
        </div>
      </div>

      {/* Información adicional */}
      <div className='text-sm text-gray-600 space-y-1'>
        <FreeShippingText />
        <p>• Garantía de calidad en todos nuestros productos</p>
        <p>• Asesoramiento técnico especializado</p>
      </div>
    </div>
  )
})

AddToCartSection.displayName = 'AddToCartSection'

