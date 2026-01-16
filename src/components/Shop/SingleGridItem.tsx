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
import { ShoppingCart, Eye } from '@/lib/optimized-imports'

const SingleGridItem = React.memo(({ item }: { item: ExtendedProduct }) => {
  const dispatch = useDispatch<AppDispatch>()

  // Hook unificado de carrito
  const { addProduct } = useCartUnified()

  // Calcular características del producto usando el adaptador - Memoizado
  const features = React.useMemo(() => calculateProductFeatures(item), [
    item.id,
    item.price,
    item.discounted_price,
    item.stock,
    item.is_new,
    item.free_shipping,
    item.fast_shipping,
  ])

  // FIX DIRECTO: Limpiar "Poxipol" del título si está presente - Memoizado
  const cleanTitle = React.useMemo(() => {
    let title = item.name || item.title
    if (title && title.includes('Poximix') && title.includes('Poxipol')) {
      title = title.replace(/\s*Poxipol\s*$/, '').trim()
    }
    return title
  }, [item.name, item.title])

  // Imagen principal - Memoizada
  const mainImage = React.useMemo(() => getMainImage(item), [item.image, item.images])

  // update the QuickView state - Memoizado
  const handleQuickViewUpdate = React.useCallback(() => {
    dispatch(updateQuickView({ ...item }))
  }, [dispatch, item])

  // Agregar al carrito usando el hook unificado - Memoizado
  const handleAddToCart = React.useCallback(() => {
    addProduct(
      {
        id: item.id,
        title: item.name || item.title,
        price: item.price,
        discounted_price: features.currentPrice,
        images: [mainImage].filter(Boolean),
      },
      { quantity: 1, attributes: { color: item?.color, medida: item?.medida, finish: item?.finish } }
    )
  }, [addProduct, item.id, item.name, item.title, item.price, item.color, item.medida, item.finish, features.currentPrice, mainImage])

  const handleItemToWishList = React.useCallback(() => {
    dispatch(
      addItemToWishlist({
        ...item,
        status: 'available',
        quantity: 1,
      })
    )
  }, [dispatch, item])

  // Config del design system (fuera de useMemo)
  const config = useDesignSystemConfig()

  // Configuración de envío gratis - Memoizada
  // ✅ FIX: Siempre mostrar envío gratis si el precio final es >= $50.000
  const shippingConfig = React.useMemo(() => {
    const autoFree = features.currentPrice >= config.ecommerce.shippingInfo.freeShippingThreshold
    const free = Boolean(features.freeShipping) || autoFree
    return {
      freeShipping: free,
      shippingText: free
        ? 'Envío gratis'
        : features.fastShipping
        ? 'Envío rápido'
        : undefined,
    }
  }, [features.currentPrice, features.freeShipping, features.fastShipping, config])

  // Configuración de cuotas - Memoizada
  const installments = React.useMemo(() => {
    return features.currentPrice >= 5000
      ? {
          quantity: 3,
          amount: Math.round(features.currentPrice / 3),
          interestFree: true,
        }
      : undefined
  }, [features.currentPrice])

  // Configuración de badges - Memoizada (objeto estático)
  const badgeConfig = React.useMemo(() => ({
    showCapacity: true,
    showColor: true,
    showFinish: true,
    showMaterial: false,
    showGrit: false,
    showDimensions: false,
    showWeight: false,
    showBrand: false,
    maxBadges: 6
  }), [])

  return (
    <CommercialProductCard
      className='bg-white' // Forzar fondo blanco
      image={mainImage}
      slug={item.slug}
      title={cleanTitle}
      brand={item.brand}
      description={item.description}
      variants={item?.variants || []}
      specifications={item?.specifications}
      dimensions={item?.dimensions}
      // ✅ CORREGIDO: Pasar medida para que se muestre en ProductCard cuando no hay variantes
      medida={(item as any)?.medida}
      // ✅ CORREGIDO: Pasar color para que se muestre cuando no hay variantes
      color={(item as any)?.color}
      price={features.currentPrice}
      originalPrice={features.discount ? item.price : undefined}
      discount={features.discount ? `${features.discount}%` : undefined}
      isNew={features.isNew}
      stock={features.stock}
      productId={item.id}
      cta='Agregar al carrito'
      onAddToCart={handleAddToCart}
      showCartAnimation={true}
      installments={installments}
      {...shippingConfig}
      badgeConfig={badgeConfig}
    />
  )
}, (prevProps, nextProps) => {
  // Comparación personalizada para evitar re-renders innecesarios
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.price === nextProps.item.price &&
    prevProps.item.discounted_price === nextProps.item.discounted_price &&
    prevProps.item.stock === nextProps.item.stock &&
    prevProps.item.name === nextProps.item.name &&
    prevProps.item.slug === nextProps.item.slug
  )
})

SingleGridItem.displayName = 'SingleGridItem'

export default SingleGridItem
