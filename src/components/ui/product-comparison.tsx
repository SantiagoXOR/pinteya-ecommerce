'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { PriceDisplay } from '@/components/ui/price-display'
import { StockIndicator } from '@/components/ui/stock-indicator'
import { ShippingInfo } from '@/components/ui/shipping-info'
import { ProductCard } from '@/components/ui'
import { X, Plus, Check, Star, Heart, ShoppingCart, Scale, Eye, Share2 } from '@/lib/optimized-imports'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { getValidImageUrl } from '@/lib/adapters/product-adapter'

export interface ComparisonProduct {
  id: string | number
  title: string
  price: number
  originalPrice?: number
  discountedPrice?: number
  image?: string
  imgs?: {
    thumbnails?: string[]
    previews?: string[]
  }
  category?: string
  brand?: string
  rating?: number
  reviewCount?: number
  stock?: number
  stockUnit?: string
  features?: string[]
  specifications?: Record<string, string>
  description?: string
  weight?: number
  dimensions?: {
    width?: number
    height?: number
    depth?: number
  }
}

export interface ProductComparisonProps {
  /** Productos a comparar */
  products: ComparisonProduct[]
  /** Máximo número de productos a comparar */
  maxProducts?: number
  /** Mostrar como cards o tabla */
  layout?: 'cards' | 'table'
  /** Características a comparar */
  compareFeatures?: string[]
  /** Callback para agregar producto */
  onAddProduct?: () => void
  /** Callback para remover producto */
  onRemoveProduct?: (productId: string | number) => void
  /** Callback para agregar al carrito */
  onAddToCart?: (product: ComparisonProduct) => void
  /** Callback para agregar a wishlist */
  onAddToWishlist?: (product: ComparisonProduct) => void
  /** Callback para ver detalles */
  onViewDetails?: (product: ComparisonProduct) => void
  /** Mostrar especificaciones técnicas */
  showSpecifications?: boolean
  /** Mostrar información de envío */
  showShippingInfo?: boolean
  /** Clase CSS adicional */
  className?: string
}

const defaultCompareFeatures = [
  'Precio',
  'Stock',
  'Marca',
  'Calificación',
  'Envío',
  'Especificaciones',
]

/**
 * ProductComparison avanzado con integración del Design System
 *
 * Características:
 * - Comparación lado a lado de productos
 * - Integra PriceDisplay, StockIndicator, ShippingInfo
 * - Layout flexible (cards o tabla)
 * - Especificaciones técnicas detalladas
 * - Acciones rápidas (carrito, wishlist, detalles)
 * - Responsive design
 */
export const ProductComparison = React.forwardRef<HTMLDivElement, ProductComparisonProps>(
  (
    {
      products = [],
      maxProducts = 4,
      layout = 'cards',
      compareFeatures = defaultCompareFeatures,
      onAddProduct,
      onRemoveProduct,
      onAddToCart,
      onAddToWishlist,
      onViewDetails,
      showSpecifications = true,
      showShippingInfo = true,
      className,
      ...props
    },
    ref
  ) => {
    const canAddMore = products.length < maxProducts
    const isTableLayout = layout === 'table'

    // Obtener todas las especificaciones únicas
    const allSpecifications = React.useMemo(() => {
      const specs = new Set<string>()
      products.forEach(product => {
        if (product.specifications) {
          Object.keys(product.specifications).forEach(key => specs.add(key))
        }
      })
      return Array.from(specs)
    }, [products])

    const renderProductCard = (product: ComparisonProduct, index: number) => (
      <Card key={product.id} className='relative'>
        {/* Botón remover */}
        <Button
          variant='ghost'
          size='sm'
          className='absolute top-2 right-2 z-10 h-8 w-8 p-0'
          onClick={() => onRemoveProduct?.(product.id)}
        >
          <X className='w-4 h-4' />
        </Button>

        <CardContent className='p-4'>
          {/* Imagen del producto */}
          <div className='aspect-square mb-4 bg-gray-100 rounded-lg overflow-hidden'>
            {product.image || product.imgs?.previews?.[0] ? (
              <Image
                src={getValidImageUrl(product.image || product.imgs?.previews?.[0])}
                alt={product.title}
                width={200}
                height={200}
                className='w-full h-full object-cover'
              />
            ) : (
              <div className='w-full h-full flex items-center justify-center text-gray-400'>
                <Eye className='w-8 h-8' />
              </div>
            )}
          </div>

          {/* Información básica */}
          <div className='space-y-3'>
            <div>
              <h3 className='font-semibold text-lg line-clamp-2'>{product.title}</h3>
              {product.brand && (
                <Badge variant='outline' size='sm' className='mt-1'>
                  {product.brand}
                </Badge>
              )}
            </div>

            {/* Precio */}
            <PriceDisplay
              amount={(product.discountedPrice || product.price) * 100}
              originalAmount={product.originalPrice ? product.originalPrice * 100 : undefined}
              variant='default'
              size='lg'
            />

            {/* Rating */}
            {product.rating && (
              <div className='flex items-center gap-2'>
                <div className='flex items-center'>
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        'w-4 h-4',
                        i < Math.floor(product.rating!)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      )}
                    />
                  ))}
                </div>
                <span className='text-sm text-gray-600'>
                  {product.rating} {product.reviewCount && `(${product.reviewCount})`}
                </span>
              </div>
            )}

            {/* Stock */}
            {product.stock !== undefined && (
              <StockIndicator
                quantity={product.stock}
                unit={product.stockUnit || 'unidades'}
                lowStockThreshold={5}
                variant='compact'
              />
            )}

            {/* Características principales */}
            {product.features && product.features.length > 0 && (
              <div>
                <h4 className='font-medium text-sm mb-2'>Características:</h4>
                <ul className='space-y-1'>
                  {product.features.slice(0, 3).map((feature, i) => (
                    <li key={i} className='flex items-center gap-2 text-sm text-gray-600'>
                      <Check className='w-3 h-3 text-green-500 flex-shrink-0' />
                      {feature}
                    </li>
                  ))}
                  {product.features.length > 3 && (
                    <li className='text-xs text-gray-500'>+{product.features.length - 3} más...</li>
                  )}
                </ul>
              </div>
            )}

            {/* Información de envío */}
            {showShippingInfo && (
              <div className='pt-2 border-t'>
                <ShippingInfo
                  variant='inline'
                  options={[
                    {
                      id: 'standard',
                      name: 'Envío estándar',
                      price: (product.discountedPrice || product.price) >= 50000 ? 0 : 2500,
                      estimatedDays: { min: 3, max: 5 },
                      isFree: (product.discountedPrice || product.price) >= 50000,
                    },
                  ]}
                  selectedOption='standard'
                  showCalculator={false}
                  showGuarantees={false}
                />
              </div>
            )}

            {/* Acciones */}
            <div className='flex gap-2 pt-4'>
              <Button onClick={() => onAddToCart?.(product)} className='flex-1' size='sm'>
                <ShoppingCart className='w-4 h-4 mr-1' />
                Agregar
              </Button>
              <Button variant='outline' size='sm' onClick={() => onAddToWishlist?.(product)}>
                <Heart className='w-4 h-4' />
              </Button>
              <Button variant='outline' size='sm' onClick={() => onViewDetails?.(product)}>
                <Eye className='w-4 h-4' />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )

    const renderAddProductCard = () => (
      <Card className='border-dashed border-2 border-gray-300'>
        <CardContent className='p-8 text-center'>
          <div className='space-y-4'>
            <div className='w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center'>
              <Plus className='w-8 h-8 text-gray-400' />
            </div>
            <div>
              <h3 className='font-medium text-gray-900'>Agregar Producto</h3>
              <p className='text-sm text-gray-500 mt-1'>Compara hasta {maxProducts} productos</p>
            </div>
            <Button variant='outline' onClick={onAddProduct} className='w-full'>
              <Plus className='w-4 h-4 mr-2' />
              Agregar para Comparar
            </Button>
          </div>
        </CardContent>
      </Card>
    )

    if (products.length === 0) {
      return (
        <Card ref={ref} className={cn('text-center p-12', className)} {...props}>
          <div className='space-y-4'>
            <div className='w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center'>
              <Scale className='w-10 h-10 text-gray-400' />
            </div>
            <div>
              <h2 className='text-xl font-semibold text-gray-900'>Comparar Productos</h2>
              <p className='text-gray-600 mt-2'>Agrega productos para compararlos lado a lado</p>
            </div>
            <Button onClick={onAddProduct}>
              <Plus className='w-4 h-4 mr-2' />
              Agregar Primer Producto
            </Button>
          </div>
        </Card>
      )
    }

    return (
      <div ref={ref} className={cn('space-y-6', className)} {...props}>
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <Scale className='w-5 h-5 text-primary' />
                Comparación de Productos
                <Badge variant='outline'>
                  {products.length} de {maxProducts}
                </Badge>
              </div>
              <Button variant='outline' size='sm'>
                <Share2 className='w-4 h-4 mr-2' />
                Compartir
              </Button>
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Productos en layout de cards */}
        {!isTableLayout && (
          <div
            className={cn(
              'grid gap-4',
              products.length === 1 && 'grid-cols-1 max-w-sm mx-auto',
              products.length === 2 && 'grid-cols-2 md:grid-cols-2',
              products.length === 3 && 'grid-cols-2 md:grid-cols-2 lg:grid-cols-3',
              products.length >= 4 && 'grid-cols-2 md:grid-cols-2 lg:grid-cols-4'
            )}
          >
            {products.map(renderProductCard)}
            {canAddMore && renderAddProductCard()}
          </div>
        )}

        {/* Especificaciones técnicas */}
        {showSpecifications && allSpecifications.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Especificaciones Técnicas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='overflow-x-auto'>
                <table className='w-full'>
                  <thead>
                    <tr className='border-b'>
                      <th className='text-left py-2 px-4 font-medium'>Especificación</th>
                      {products.map(product => (
                        <th
                          key={product.id}
                          className='text-left py-2 px-4 font-medium min-w-[200px]'
                        >
                          {product.title}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allSpecifications.map(spec => (
                      <tr key={spec} className='border-b'>
                        <td className='py-2 px-4 font-medium text-gray-600'>{spec}</td>
                        {products.map(product => (
                          <td key={product.id} className='py-2 px-4'>
                            {product.specifications?.[spec] || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }
)

ProductComparison.displayName = 'ProductComparison'
