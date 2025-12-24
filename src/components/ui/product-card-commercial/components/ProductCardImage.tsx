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
    <div className='relative w-full h-full flex justify-center items-center'>
      <div className='relative w-full h-full flex items-center justify-center p-0.5 sm:p-1.5 md:p-5 card-image-depth'>
        {displaySrc && !imageError ? (
          <Image
            src={displaySrc}
            alt={title || 'Producto'}
            fill
            className='object-contain z-0 transition-transform duration-300 ease-out'
            // ⚡ OPTIMIZACIÓN: sizes más preciso para dimensiones reales de productos (263x263, 286x286)
            // Esto reduce el tamaño de descarga al servir imágenes del tamaño correcto
            sizes="(max-width: 640px) 263px, (max-width: 1024px) 286px, 320px"
            priority={false}
            loading="lazy"
            quality={70} // ⚡ OPTIMIZACIÓN: 70 es suficiente para thumbnails (vs 75 default)
            onError={onImageError}
            onLoad={handleLoad}
            style={{ objectFit: 'contain', maxHeight: '100%', maxWidth: '100%' }}
          />
        ) : (
          <div className='flex items-center justify-center w-full h-full z-0 bg-gray-50'>
            <div className='text-center p-4'>
              <AlertCircle className='w-8 h-8 text-gray-400 mx-auto mb-2' />
              <p className='text-xs text-gray-500'>Imagen no disponible</p>
            </div>
          </div>
        )}
      </div>

    </div>
  )
})

ProductCardImage.displayName = 'ProductCardImage'

