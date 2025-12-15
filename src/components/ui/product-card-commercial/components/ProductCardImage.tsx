'use client'

import React from 'react'
import Image from 'next/image'
import { AlertCircle } from '@/lib/optimized-imports'
import type { ProductCardImageProps } from '../types'

/**
 * Componente de imagen del ProductCard
 * Maneja fallbacks y errores de carga
 */
export const ProductCardImage = React.memo(function ProductCardImage({
  image,
  title,
  productId,
  onImageError,
  imageError = false,
  currentImageSrc
}: ProductCardImageProps) {
  const displaySrc = currentImageSrc || image || '/images/products/placeholder.svg'

  const handleLoad = React.useCallback(() => {
    console.log(`✅ [ProductCardImage] Imagen cargada - Producto ID: ${productId}`)
  }, [productId])

  return (
    <div className='relative w-full flex justify-center items-center overflow-hidden rounded-t-xl mb-1 md:mb-2 flex-1'>
      {displaySrc && !imageError ? (
        <Image
          src={displaySrc}
          alt={title || 'Producto'}
          fill
          className='object-contain scale-125 z-0'
          sizes="(max-width: 640px) 153px, (max-width: 1024px) 200px, 250px"
          priority={false}
          loading="lazy"
          onError={onImageError}
          onLoad={handleLoad}
        />
      ) : (
        <div className='flex items-center justify-center w-full h-full z-0 bg-gray-50'>
          <div className='text-center p-4'>
            <AlertCircle className='w-8 h-8 text-gray-400 mx-auto mb-2' />
            <p className='text-xs text-gray-500'>Imagen no disponible</p>
          </div>
        </div>
      )}

      {/* Degradado suave hacia blanco en la parte inferior */}
      <div className='absolute bottom-0 left-0 right-0 h-12 md:h-20 bg-gradient-to-t from-white via-white/80 to-transparent z-10 pointer-events-none' />
    </div>
  )
})

ProductCardImage.displayName = 'ProductCardImage'

