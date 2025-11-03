'use client'
import React from 'react'
import { Product } from '@/types/product'
import { updateQuickView } from '@/redux/features/quickView-slice'
// import { addItemToCart } from '@/redux/features/cart-slice'
import { addItemToWishlist } from '@/redux/features/wishlist-slice'
import { useDispatch } from 'react-redux'
import { AppDispatch } from '@/redux/store'
import Link from 'next/link'
import Image from 'next/image'
import { CommercialProductCard } from '@/components/ui/product-card-commercial'
import { useDesignSystemConfig, shouldShowFreeShipping as dsShouldShowFreeShipping } from '@/lib/design-system-config'
import { ExtendedProduct, calculateProductFeatures } from '@/lib/adapters/productAdapter'
import { getMainImage } from '@/lib/adapters/product-adapter'
import { useCartUnified } from '@/hooks/useCartUnified'
import { useAnalytics } from '@/hooks/useAnalytics'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Eye } from 'lucide-react'

const SingleGridItem = ({ item }: { item: ExtendedProduct }) => {
  const dispatch = useDispatch<AppDispatch>()

  // Hook unificado de carrito
  const { addProduct } = useCartUnified()

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
        discounted_price: (features?.currentPrice ?? item.price),
        images: [getMainImage(item)].filter(Boolean),
      },
      { quantity: 1, attributes: { color: item?.color, medida: item?.medida, finish: item?.finish } }
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

  // FIX DIRECTO: Limpiar "Poxipol" del título si está presente
  let cleanTitle = item.name || item.title
  if (cleanTitle && cleanTitle.includes('Poximix') && cleanTitle.includes('Poxipol')) {
    cleanTitle = cleanTitle.replace(/\s*Poxipol\s*$/, '').trim()
  }

  return (
    <CommercialProductCard
      className='bg-white' // Forzar fondo blanco
      image={getMainImage(item)}
      slug={item.slug}
      title={cleanTitle}
      brand={item.brand}
      description={item.description}
      variants={item?.variants || []}
      specifications={item?.specifications}
      dimensions={item?.dimensions}
      // ✅ NO pasar color/medida legacy - usar solo variantes para badges
      // color={item?.color}
      // medida={item?.medida}
      price={features.currentPrice}
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
      // Configuración de badges inteligentes
      badgeConfig={{
        showCapacity: true,
        showColor: true,
        showFinish: true,
        // Alinear comportamiento con /search: priorizar medida, acabado y colores
        showMaterial: false,
        showGrit: false,
        showDimensions: false,
        showWeight: false,
        showBrand: false,
        // Permitir medida + acabado + varios colores
        maxBadges: 6
      }}
    />
  )
}

export default SingleGridItem
