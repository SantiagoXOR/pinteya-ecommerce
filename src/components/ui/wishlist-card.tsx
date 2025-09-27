'use client'

import * as React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PriceDisplay } from '@/components/ui/price-display'
import { StockIndicator } from '@/components/ui/stock-indicator'
import { ShippingInfo } from '@/components/ui/shipping-info'
import {
  Heart,
  ShoppingCart,
  X,
  Eye,
  Share2,
  Star,
  Clock,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { getValidImageUrl } from '@/lib/adapters/product-adapter'

export interface WishlistItem {
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
  addedAt?: Date
  priceHistory?: {
    date: Date
    price: number
  }[]
  isOnSale?: boolean
  saleEndDate?: Date
  availability?: 'in-stock' | 'low-stock' | 'out-of-stock' | 'pre-order'
}

export interface WishlistCardProps {
  /** Item de la wishlist */
  item: WishlistItem
  /** Variante del card */
  variant?: 'default' | 'compact' | 'detailed'
  /** Mostrar información de precio histórico */
  showPriceHistory?: boolean
  /** Mostrar información de envío */
  showShippingInfo?: boolean
  /** Mostrar fecha de agregado */
  showAddedDate?: boolean
  /** Callback para remover de wishlist */
  onRemove?: (itemId: string | number) => void
  /** Callback para agregar al carrito */
  onAddToCart?: (item: WishlistItem) => void
  /** Callback para ver detalles */
  onViewDetails?: (item: WishlistItem) => void
  /** Callback para compartir */
  onShare?: (item: WishlistItem) => void
  /** Callback para mover a comparación */
  onCompare?: (item: WishlistItem) => void
  /** Clase CSS adicional */
  className?: string
}

/**
 * WishlistCard optimizado con integración del Design System
 *
 * Características:
 * - Integra PriceDisplay, StockIndicator, ShippingInfo
 * - Seguimiento de precios e historial
 * - Notificaciones de ofertas y stock
 * - Múltiples variantes (default, compact, detailed)
 * - Acciones rápidas (carrito, detalles, compartir)
 * - Responsive design
 */
export const WishlistCard = React.forwardRef<HTMLDivElement, WishlistCardProps>(
  (
    {
      item,
      variant = 'default',
      showPriceHistory = false,
      showShippingInfo = false,
      showAddedDate = false,
      onRemove,
      onAddToCart,
      onViewDetails,
      onShare,
      onCompare,
      className,
      ...props
    },
    ref
  ) => {
    const isCompact = variant === 'compact'
    const isDetailed = variant === 'detailed'

    // Calcular cambio de precio
    const priceChange = React.useMemo(() => {
      if (!item.priceHistory || item.priceHistory.length < 2) {
        return null
      }

      const currentPrice = item.discountedPrice || item.price
      const previousPrice = item.priceHistory[item.priceHistory.length - 2].price
      const change = currentPrice - previousPrice
      const percentage = (change / previousPrice) * 100

      return {
        amount: change,
        percentage,
        isIncrease: change > 0,
        isDecrease: change < 0,
      }
    }, [item.priceHistory, item.price, item.discountedPrice])

    // Verificar si está en oferta
    const isOnSale =
      item.isOnSale ||
      (item.originalPrice && item.discountedPrice && item.discountedPrice < item.originalPrice)

    // Calcular días desde que se agregó
    const daysSinceAdded = React.useMemo(() => {
      if (!item.addedAt) {
        return null
      }
      const now = new Date()
      const diffTime = Math.abs(now.getTime() - item.addedAt.getTime())
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    }, [item.addedAt])

    const handleAddToCart = () => {
      onAddToCart?.(item)
    }

    const handleRemove = () => {
      onRemove?.(item.id)
    }

    const handleViewDetails = () => {
      onViewDetails?.(item)
    }

    const handleShare = () => {
      onShare?.(item)
    }

    const handleCompare = () => {
      onCompare?.(item)
    }

    if (isCompact) {
      return (
        <Card ref={ref} className={cn('relative', className)} {...props}>
          <CardContent className='p-3'>
            <div className='flex gap-3'>
              {/* Imagen */}
              <div className='w-16 h-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0'>
                {item.image || item.imgs?.thumbnails?.[0] ? (
                  <Image
                    src={getValidImageUrl(item.image || item.imgs?.thumbnails?.[0])}
                    alt={item.title}
                    width={64}
                    height={64}
                    className='w-full h-full object-cover'
                  />
                ) : (
                  <div className='w-full h-full flex items-center justify-center text-gray-400'>
                    <Eye className='w-6 h-6' />
                  </div>
                )}
              </div>

              {/* Contenido */}
              <div className='flex-1 min-w-0'>
                <h3 className='font-medium text-sm line-clamp-2'>{item.title}</h3>
                <div className='mt-1'>
                  <PriceDisplay
                    amount={(item.discountedPrice || item.price) * 100}
                    originalAmount={item.originalPrice ? item.originalPrice * 100 : undefined}
                    variant='compact'
                    size='sm'
                  />
                </div>
              </div>

              {/* Acciones */}
              <div className='flex flex-col gap-1'>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={handleRemove}
                  className='h-8 w-8 p-0 text-gray-400 hover:text-red-500'
                >
                  <X className='w-4 h-4' />
                </Button>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={handleAddToCart}
                  className='h-8 w-8 p-0'
                  disabled={item.availability === 'out-of-stock'}
                >
                  <ShoppingCart className='w-4 h-4' />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card ref={ref} className={cn('relative group', className)} {...props}>
        {/* Botón remover */}
        <Button
          variant='ghost'
          size='sm'
          className='absolute top-2 right-2 z-10 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity'
          onClick={handleRemove}
        >
          <X className='w-4 h-4' />
        </Button>

        {/* Badges */}
        <div className='absolute top-2 left-2 z-10 flex flex-col gap-1'>
          {isOnSale && (
            <Badge variant='destructive' size='sm'>
              Oferta
            </Badge>
          )}
          {item.availability === 'low-stock' && (
            <Badge variant='warning' size='sm'>
              Poco stock
            </Badge>
          )}
          {item.availability === 'out-of-stock' && (
            <Badge variant='secondary' size='sm'>
              Sin stock
            </Badge>
          )}
          {priceChange?.isDecrease && (
            <Badge variant='success' size='sm' className='flex items-center gap-1'>
              <TrendingDown className='w-3 h-3' />-{Math.abs(priceChange.percentage).toFixed(0)}%
            </Badge>
          )}
        </div>

        <CardContent className='p-4'>
          {/* Imagen del producto */}
          <div
            className='aspect-square mb-4 bg-gray-100 rounded-lg overflow-hidden cursor-pointer'
            onClick={handleViewDetails}
          >
            {item.image || item.imgs?.previews?.[0] ? (
              <Image
                src={getValidImageUrl(item.image || item.imgs?.previews?.[0])}
                alt={item.title}
                width={200}
                height={200}
                className='w-full h-full object-cover hover:scale-105 transition-transform'
              />
            ) : (
              <div className='w-full h-full flex items-center justify-center text-gray-400'>
                <Eye className='w-8 h-8' />
              </div>
            )}
          </div>

          {/* Información del producto */}
          <div className='space-y-3'>
            <div>
              <h3
                className='font-semibold line-clamp-2 cursor-pointer hover:text-primary'
                onClick={handleViewDetails}
              >
                {item.title}
              </h3>
              {item.brand && (
                <Badge variant='outline' size='sm' className='mt-1'>
                  {item.brand}
                </Badge>
              )}
            </div>

            {/* Precio */}
            <PriceDisplay
              amount={(item.discountedPrice || item.price) * 100}
              originalAmount={item.originalPrice ? item.originalPrice * 100 : undefined}
              variant='default'
              size={isDetailed ? 'lg' : 'md'}
            />

            {/* Cambio de precio */}
            {showPriceHistory && priceChange && (
              <div
                className={cn(
                  'flex items-center gap-1 text-sm',
                  priceChange.isDecrease ? 'text-green-600' : 'text-red-600'
                )}
              >
                {priceChange.isDecrease ? (
                  <TrendingDown className='w-4 h-4' />
                ) : (
                  <TrendingUp className='w-4 h-4' />
                )}
                <span>
                  {priceChange.isDecrease ? '-' : '+'}${Math.abs(priceChange.amount).toFixed(2)}(
                  {priceChange.isDecrease ? '-' : '+'}
                  {Math.abs(priceChange.percentage).toFixed(1)}%)
                </span>
              </div>
            )}

            {/* Rating */}
            {item.rating && (
              <div className='flex items-center gap-2'>
                <div className='flex items-center'>
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        'w-4 h-4',
                        i < Math.floor(item.rating!)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      )}
                    />
                  ))}
                </div>
                <span className='text-sm text-gray-600'>
                  {item.rating} {item.reviewCount && `(${item.reviewCount})`}
                </span>
              </div>
            )}

            {/* Stock */}
            {item.stock !== undefined && (
              <StockIndicator
                quantity={item.stock}
                unit={item.stockUnit || 'unidades'}
                lowStockThreshold={5}
                variant='compact'
              />
            )}

            {/* Información adicional */}
            {isDetailed && (
              <div className='space-y-2 text-sm text-gray-600'>
                {showAddedDate && daysSinceAdded && (
                  <div className='flex items-center gap-2'>
                    <Clock className='w-4 h-4' />
                    <span>Agregado hace {daysSinceAdded} días</span>
                  </div>
                )}

                {showShippingInfo && (
                  <ShippingInfo
                    variant='inline'
                    options={[
                      {
                        id: 'standard',
                        name: 'Envío estándar',
                        price: (item.discountedPrice || item.price) >= 50000 ? 0 : 2500,
                        estimatedDays: { min: 3, max: 5 },
                        isFree: (item.discountedPrice || item.price) >= 50000,
                      },
                    ]}
                    selectedOption='standard'
                    showCalculator={false}
                    showGuarantees={false}
                  />
                )}
              </div>
            )}

            {/* Acciones */}
            <div className='flex gap-2 pt-2'>
              <Button
                onClick={handleAddToCart}
                className='flex-1'
                size='sm'
                disabled={item.availability === 'out-of-stock'}
              >
                <ShoppingCart className='w-4 h-4 mr-1' />
                {item.availability === 'out-of-stock' ? 'Sin stock' : 'Agregar'}
              </Button>

              <Button variant='outline' size='sm' onClick={handleViewDetails}>
                <Eye className='w-4 h-4' />
              </Button>

              {isDetailed && (
                <>
                  <Button variant='outline' size='sm' onClick={handleShare}>
                    <Share2 className='w-4 h-4' />
                  </Button>

                  <Button variant='outline' size='sm' onClick={handleCompare}>
                    Comparar
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }
)

WishlistCard.displayName = 'WishlistCard'
