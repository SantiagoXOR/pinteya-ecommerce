'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Minus, Plus, Trash2, AlertCircle } from '@/lib/optimized-imports'
import { getValidImageUrl } from '@/lib/adapters/product-adapter'
import { normalizeVariantLabel } from '@/lib/utils/variant-normalizer'
import { useCartWithBackend } from '@/hooks/useCartWithBackend'
import { toast } from 'react-hot-toast'
import { formatCurrency } from '@/lib/utils/consolidated-utils'

const SingleItem = ({ item }: { item: any }) => {
  const [quantity, setQuantity] = useState(item.quantity)
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
      // El error ya se muestra en el hook
      setQuantity(item.quantity) // Revertir a la cantidad anterior
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
      setQuantity(item.quantity) // Revertir a la cantidad anterior
    }
    setIsUpdating(false)
  }

  // Calcular descuento si existe
  const discount =
    item.discountedPrice && item.price && item.discountedPrice < item.price
      ? Math.round(((item.price - item.discountedPrice) / item.price) * 100)
      : undefined

  return (
    <div className='flex items-center border-t border-gray-200 py-6 px-8 hover:bg-gray-50 transition-colors duration-200'>
      {/* Product Info */}
      <div className='min-w-[400px]'>
        <div className='flex items-center gap-6'>
          <div className='relative flex items-center justify-center rounded-lg bg-gray-100 w-20 h-20 overflow-hidden'>
            <Image
              width={80}
              height={80}
              src={getValidImageUrl(item.imgs?.thumbnails?.[0])}
              alt={item.title}
              className='object-cover w-full h-full'
            />
            {discount && (
              <Badge
                variant='destructive'
                size='sm'
                className='absolute -top-1 -right-1 text-2xs px-1 py-0.5'
              >
                -{discount}%
              </Badge>
            )}
          </div>

          <div className='flex-1'>
            <h3 className='font-semibold text-gray-900 hover:text-primary transition-colors duration-200 mb-1'>
              <a href='#' className='line-clamp-2'>
                {item.title}
              </a>
            </h3>
            {/* Badges de atributos (medida, color, acabado) */}
            {(item.attributes?.medida || item.attributes?.color || item.attributes?.finish) && (
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
            {item.price && item.discountedPrice && item.discountedPrice < item.price && (
              <p className='text-sm text-gray-500 line-through'>${item.price}</p>
            )}
          </div>
        </div>
      </div>

      {/* Price */}
      <div className='min-w-[180px]'>
        <p className='font-bold text-lg' style={{ color: '#c2410b' }}>
          {formatCurrency(item.discountedPrice)}
        </p>
        {item.price && item.discountedPrice && item.discountedPrice < item.price && (
          <p className='text-sm text-gray-500 line-through'>{formatCurrency(item.price)}</p>
        )}
      </div>

      {/* Quantity Selector - Pinteya Design */}
      <div className='min-w-[275px]'>
        <div className='flex flex-col gap-2'>
          <div className='flex items-center rounded-xl border-2 border-yellow-400 bg-white shadow-lg w-max overflow-hidden'>
            <Button
              variant='ghost'
              size='icon'
              onClick={handleDecreaseQuantity}
              disabled={quantity <= 1 || isUpdating}
              aria-label='Disminuir cantidad'
              data-testid='quantity-decrease'
              className='h-12 w-12 rounded-none bg-yellow-400 hover:bg-yellow-500 text-black font-bold disabled:opacity-50 disabled:bg-gray-200 transition-all duration-200'
            >
              <Minus className='w-5 h-5' />
            </Button>

            <div
              className='flex items-center justify-center w-16 h-12 bg-white font-bold text-lg text-gray-900 border-x-2 border-yellow-400'
              data-testid='quantity-input'
            >
              {quantity}
            </div>

            <Button
              variant='ghost'
              size='icon'
              onClick={handleIncreaseQuantity}
              disabled={isUpdating || (item.stock !== undefined && quantity >= item.stock)}
              aria-label='Aumentar cantidad'
              data-testid='quantity-increase'
              className='h-12 w-12 rounded-none bg-yellow-400 hover:bg-yellow-500 text-black font-bold disabled:opacity-50 disabled:bg-gray-200 transition-all duration-200'
            >
              <Plus className='w-5 h-5' />
            </Button>
          </div>
          
          {/* Mostrar stock disponible */}
          {item.stock !== undefined && (
            <div className='flex items-center gap-1.5 text-xs'>
              {quantity >= item.stock ? (
                <>
                  <AlertCircle className='w-3.5 h-3.5 text-amber-600' />
                  <span className='text-amber-600 font-medium'>Stock máximo alcanzado</span>
                </>
              ) : item.stock <= 5 ? (
                <>
                  <AlertCircle className='w-3.5 h-3.5 text-orange-600' />
                  <span className='text-orange-600 font-medium'>Solo quedan {item.stock} disponibles</span>
                </>
              ) : (
                <span className='text-gray-500'>Stock: {item.stock} disponibles</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Subtotal */}
      <div className='min-w-[200px]'>
        <p className='font-bold text-xl' style={{ color: '#c2410b' }}>
          {formatCurrency(item.discountedPrice * quantity)}
        </p>
        {item.price && item.discountedPrice && item.discountedPrice < item.price && (
          <p className='text-sm font-semibold text-green-600'>
            Ahorro: {formatCurrency((item.price - item.discountedPrice) * quantity)}
          </p>
        )}
      </div>

      {/* Remove Button */}
      <div className='min-w-[50px] flex justify-end'>
        <Button
          variant='outline'
          size='icon'
          onClick={handleRemoveFromCart}
          disabled={isUpdating}
          aria-label='Eliminar producto del carrito'
          className='h-10 w-10 border-2 border-red-400 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 rounded-xl'
        >
          <Trash2 className='w-4 h-4' />
        </Button>
      </div>
    </div>
  )
}

export default SingleItem
