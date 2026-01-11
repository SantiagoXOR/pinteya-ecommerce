import Image from 'next/image'
import Link from 'next/link'
import { HOME_FAST_CONFIG } from '@/lib/home-fast/config'
import type { ProductCardProps } from '../types'

/**
 * ProductCard - Componente UI reutilizable
 * Renderiza card de producto con dimensiones explícitas para prevenir CLS
 */
export function ProductCard({ product, priority = false, actions }: ProductCardProps) {
  const { width, height } = HOME_FAST_CONFIG.images.product
  
  // Obtener imagen del producto (soporta múltiples formatos)
  const imageUrl = product.image_url || 
                   (Array.isArray(product.images) ? product.images[0] : product.images) ||
                   product.imgs?.previews?.[0] ||
                   product.imgs?.thumbnails?.[0] ||
                   product.image || 
                   '/images/placeholder-product.webp'
  
  // Obtener nombre del producto
  const productName = product.name || product.title || 'Producto sin nombre'
  
  // Obtener precio
  const price = product.price || product.discountedPrice || 0
  
  // Obtener slug para el link
  const productSlug = product.slug || `product-${product.id}`

  return (
    <article className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <Link href={`/products/${productSlug}`} className="block">
        <div className="relative w-full aspect-square">
          <Image
            src={imageUrl}
            alt={productName}
            width={width}
            height={height}
            priority={priority}
            className="object-cover w-full h-full"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
            {productName}
          </h3>
          <p className="text-lg font-bold text-blaze-orange-600 mb-3">
            ${price.toLocaleString('es-AR')}
          </p>
        </div>
      </Link>
      {actions && <div className="px-4 pb-4">{actions}</div>}
    </article>
  )
}
