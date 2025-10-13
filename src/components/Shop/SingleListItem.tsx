'use client'
import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Product } from '@/types/product'
import { useCartUnified } from '@/hooks/useCartUnified'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useDispatch } from 'react-redux'
import { AppDispatch } from '@/redux/store'
import { updateQuickView } from '@/redux/features/quickView-slice'
import { addItemToWishlist } from '@/redux/features/wishlist-slice'
// import { useCartWithBackend } from '@/hooks/useCartWithBackend'
import { CommercialProductCard } from '@/components/ui/product-card-commercial'
import { ExtendedProduct, calculateProductFeatures } from '@/lib/adapters/productAdapter'
import { getMainImage } from '@/lib/adapters/product-adapter'
import { useDesignSystemConfig, shouldShowFreeShipping as dsShouldShowFreeShipping } from '@/lib/design-system-config'

interface SingleListItemProps {
  product: ExtendedProduct
}

const SingleListItem: React.FC<SingleListItemProps> = ({ product }) => {
  const { addProduct } = useCartUnified()
  const { trackEvent } = useAnalytics()
  const dispatch = useDispatch<AppDispatch>()
  // const { addItem } = useCartWithBackend()

  // Usar product directamente
  const item = product

  // update the QuickView state
  const handleQuickViewUpdate = () => {
    dispatch(updateQuickView({ ...item }))
  }

  // Agregar al carrito usando el hook unificado
  const handleAddToCart = () => {
    addProduct(
      {
        id: item.id,
        title: item.name || item.title,
        price: item.price,
        discounted_price:
          features.discount
            ? Math.round(item.price * (1 - features.discount / 100))
            : features.currentPrice,
        images: [getMainImage(item)].filter(Boolean),
      },
      { quantity: 1, attributes: { color: item?.color, medida: item?.medida } }
    )
  }

  const handleItemToWishList = () => {
    dispatch(
      addItemToWishlist({
        ...item,
        status: 'available',
        quantity: 1,
      })
    )
  }

  // Calcular características del producto usando el adaptador
  const features = calculateProductFeatures(item)

  return (
    <CommercialProductCard
      className='bg-white' // Forzar fondo blanco
      image={getMainImage(item)}
      title={item.name || item.title}
      brand={item.brand}
      description={item.description}
      variants={item?.variants || []}
      specifications={item?.specifications}
      dimensions={item?.dimensions}
      color={item?.color}
      medida={item?.medida}
      price={
        features.discount
          ? Math.round(item.price * (1 - features.discount / 100))
          : features.currentPrice
      }
      originalPrice={features.discount ? item.price : undefined}
      discount={features.discount ? `${features.discount}%` : undefined}
      isNew={features.isNew}
      stock={features.stock}
      productId={item.id}
      cta='Agregar al carrito'
      onAddToCart={handleAddToCart}
      showCartAnimation={true}
      // Información de cuotas automática
      installments={
        features.currentPrice >= 5000
          ? {
              quantity: 3,
              amount: Math.round(features.currentPrice / 3),
              interestFree: true,
            }
          : undefined
      }
      // Envío gratis según Design System (umbral global)
      {...(() => {
        const config = useDesignSystemConfig()
        const autoFree = dsShouldShowFreeShipping(features.currentPrice, config)
        const free = Boolean(features.freeShipping) || autoFree
        return {
          freeShipping: free,
          shippingText: free
            ? 'Envío gratis'
            : features.fastShipping
            ? 'Envío rápido'
            : undefined,
        }
      })()}
      badgeConfig={{
        showCapacity: true,
        showColor: true,
        showFinish: true,
        showMaterial: true,
        showGrit: true,
        showDimensions: true,
        // Alinear con Home/ProductItem
        showWeight: false,
        showBrand: false,
        maxBadges: 3,
      }}
    />
  )
}

export default SingleListItem
