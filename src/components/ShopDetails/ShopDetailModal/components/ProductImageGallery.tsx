/**
 * Componente de galería de imágenes del producto
 */

import React from 'react'
import Image from 'next/image'

interface ProductImageGalleryProps {
  mainImageUrl: string
  productName: string
  galleryImages?: string[]
}

/**
 * Galería de imágenes memoizada
 */
export const ProductImageGallery = React.memo<ProductImageGalleryProps>(({
  mainImageUrl,
  productName,
  galleryImages,
}) => {
  return (
    <div className='space-y-4'>
      <div className='aspect-square bg-gray-100 rounded-lg overflow-hidden'>
        <Image
          src={mainImageUrl}
          alt={productName || 'Producto'}
          width={600}
          height={600}
          className='w-full h-full object-cover'
          onError={e => {
            const target = e.currentTarget as HTMLImageElement
            if (target && target.src !== '/images/products/placeholder.svg') {
              target.src = '/images/products/placeholder.svg'
            }
          }}
          priority
        />
      </div>

      {/* Galería de imágenes adicionales */}
      {galleryImages && galleryImages.length > 1 && (
        <div className='grid grid-cols-4 gap-2'>
          {galleryImages.slice(1, 5).map((image, index) => (
            <div key={index} className='aspect-square bg-gray-100 rounded-md overflow-hidden'>
              <Image
                src={image}
                alt={`${productName} - imagen ${index + 2}`}
                width={150}
                height={150}
                className='w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity'
                loading='lazy'
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
})

ProductImageGallery.displayName = 'ProductImageGallery'

