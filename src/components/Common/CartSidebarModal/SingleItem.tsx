'use client'

import React, { useState, useEffect } from 'react'
import { getPreviewImage } from '@/lib/adapters/product-adapter'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Minus, Plus, Trash2, AlertCircle } from '@/lib/optimized-imports'
import { normalizeVariantLabel } from '@/lib/utils/variant-normalizer'
import { useCartWithBackend } from '@/hooks/useCartWithBackend'
import { toast } from 'react-hot-toast'

const SingleItem = ({ item }: { item: any }) => {
  const [quantity, setQuantity] = useState(item.quantity)
  const [imgSrc, setImgSrc] = useState<string>(() => getPreviewImage(item))
  const [isUpdating, setIsUpdating] = useState(false)
  const { updateQuantity, removeItem } = useCartWithBackend()

  // Sincronizar cantidad local con la del item
  useEffect(() => {
    setQuantity(item.quantity)
  }, [item.quantity])

  const handleRemoveFromCart = async () => {
    setIsUpdating(true)
    const success = await removeItem(item.id)
    if (!success) {
      toast.error('Error al eliminar el producto del carrito')
    }
    setIsUpdating(false)
  }

  const handleIncreaseQuantity = async () => {
    // Verificar si hay stock disponible (si existe en el item)
    if (item.stock !== undefined && quantity >= item.stock) {
      toast.error(`Stock máximo alcanzado. Solo hay ${item.stock} disponibles`)
      return
    }

    const newQuantity = quantity + 1
    setIsUpdating(true)
    const success = await updateQuantity(item.id, newQuantity)
    if (success) {
      setQuantity(newQuantity)
    } else {
      setQuantity(item.quantity)
    }
    setIsUpdating(false)
  }

  const handleDecreaseQuantity = async () => {
    if (quantity <= 1) {
      return
    }

    const newQuantity = quantity - 1
    setIsUpdating(true)
    const success = await updateQuantity(item.id, newQuantity)
    if (success) {
      setQuantity(newQuantity)
    } else {
      setQuantity(item.quantity)
    }
    setIsUpdating(false)
  }

  return (
    <div
      className='bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all duration-200'
      data-testid='cart-item'
    >
      {/* Product Info */}
      <div className='flex items-start gap-4 mb-4'>
        <div className='relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0'>
          {/* Usar <img> con fallback para evitar dominios no permitidos y 404 */}
          <img
            src={imgSrc}
            alt={item.title}
            width={64}
            height={64}
            loading='lazy'
            className='w-full h-full object-cover'
            onError={() => setImgSrc('/images/products/placeholder.svg')}
          />
        </div>

        <div className='flex-1 min-w-0'>
          <h3 className='font-semibold text-gray-900 text-sm line-clamp-2 mb-1'>{item.title}</h3>
          {/* Badges de atributos (color, medida y acabado) */}
          {(item.attributes?.color || item.attributes?.medida || item.attributes?.finish) && (
            <div className='flex flex-wrap items-center gap-2 mb-1'>
              {item.attributes?.medida && (
                <Badge variant='secondary' className='text-xs px-2 py-0.5'>
                  {normalizeVariantLabel(item.attributes.medida, 'medida')}
                </Badge>
              )}
              {item.attributes?.color && (
                <Badge variant='outline' className='text-xs px-2 py-0.5'>
                  {normalizeVariantLabel(item.attributes.color, 'color')}
                </Badge>
              )}
              {item.attributes?.finish && (
                <Badge variant='secondary' className='text-xs px-2 py-0.5'>
                  {normalizeVariantLabel(item.attributes.finish, 'finish')}
                </Badge>
              )}
            </div>
          )}
          <p className='font-bold text-lg' style={{ color: '#ea5a17' }}>
            ${item.discountedPrice ? item.discountedPrice.toLocaleString() : '0'}
          </p>
          {item.price && item.discountedPrice && item.discountedPrice < item.price && (
            <p className='text-xs text-gray-500 line-through'>${item.price.toLocaleString()}</p>
          )}
        </div>

        {/* Remove Button */}
        <Button
          variant='ghost'
          size='sm'
          onClick={handleRemoveFromCart}
          disabled={isUpdating}
          aria-label='Eliminar producto del carrito'
          data-testid='remove-from-cart'
          className='text-red-500 hover:text-red-700 hover:bg-red-50 disabled:opacity-50 p-1 h-8 w-8'
        >
          <Trash2 className='w-4 h-4' />
        </Button>
      </div>

      {/* Quantity Controls */}
      <div className='flex flex-col gap-2'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center rounded-lg border-2 border-yellow-400 bg-white shadow-sm overflow-hidden'>
            <Button
              variant='ghost'
              size='sm'
              onClick={handleDecreaseQuantity}
              disabled={quantity <= 1 || isUpdating}
              aria-label='Disminuir cantidad'
              className='h-8 w-8 rounded-none bg-yellow-400 hover:bg-yellow-500 text-black font-bold disabled:opacity-50 disabled:bg-gray-200'
            >
              <Minus className='w-3 h-3' />
            </Button>

            <div className='flex items-center justify-center w-12 h-8 bg-white font-bold text-sm text-gray-900 border-x-2 border-yellow-400'>
              {quantity}
            </div>

            <Button
              variant='ghost'
              size='sm'
              onClick={handleIncreaseQuantity}
              disabled={isUpdating || (item.stock !== undefined && quantity >= item.stock)}
              aria-label='Aumentar cantidad'
              className='h-8 w-8 rounded-none bg-yellow-400 hover:bg-yellow-500 text-black font-bold disabled:opacity-50 disabled:bg-gray-200'
            >
              <Plus className='w-3 h-3' />
            </Button>
          </div>

          {/* Subtotal */}
          <div className='text-right'>
            <p className='font-bold text-sm' style={{ color: '#ea5a17' }}>
              ${item.discountedPrice ? (item.discountedPrice * quantity).toLocaleString() : '0'}
            </p>
            {item.price && item.discountedPrice && item.discountedPrice < item.price && (
              <p className='text-xs text-green-600 font-semibold'>
                Ahorro: ${((item.price - item.discountedPrice) * quantity).toLocaleString()}
              </p>
            )}
          </div>
        </div>

        {/* Mostrar stock disponible */}
        {item.stock !== undefined && (
          <div className='flex items-center gap-1.5 text-xs'>
            {quantity >= item.stock ? (
              <>
                <AlertCircle className='w-3 h-3 text-amber-600' />
                <span className='text-amber-600 font-medium'>Stock máximo alcanzado</span>
              </>
            ) : item.stock <= 5 ? (
              <>
                <AlertCircle className='w-3 h-3 text-orange-600' />
                <span className='text-orange-600 font-medium'>Solo quedan {item.stock}</span>
              </>
            ) : (
              <span className='text-gray-500'>Stock: {item.stock} disponibles</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default SingleItem
