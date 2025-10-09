'use client'
import React from 'react'
import { Product } from '@/types/product'
import { updateQuickView } from '@/redux/features/quickView-slice'
import { addItemToCart } from '@/redux/features/cart-slice'
import { addItemToWishlist } from '@/redux/features/wishlist-slice'
import { useDispatch } from 'react-redux'
import { AppDispatch } from '@/redux/store'
import Link from 'next/link'
import Image from 'next/image'
import { CommercialProductCard } from '@/components/ui/product-card-commercial'
import { ExtendedProduct, calculateProductFeatures } from '@/lib/adapters/productAdapter'
import { useCartWithBackend } from '@/hooks/useCartWithBackend'
import { useCartActions } from '@/hooks/useCartActions'
import { useAnalytics } from '@/hooks/useAnalytics'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Eye } from 'lucide-react'

const SingleGridItem = ({ item }: { item: ExtendedProduct }) => {
  const dispatch = useDispatch<AppDispatch>()

  // Hook para carrito con backend
  const { addItem, loading } = useCartWithBackend()

  // update the QuickView state
  const handleQuickViewUpdate = () => {
    dispatch(updateQuickView({ ...item }))
  }

  // add to cart - Conectado con backend
  const handleAddToCart = async () => {
    // Intentar agregar al backend primero
    const success = await addItem(item.id, 1)

    if (success) {
      // Si el backend funciona, también actualizar Redux para compatibilidad
      dispatch(
        addItemToCart({
          ...item,
          quantity: 1,
        })
      )
    } else {
      // Si falla el backend, solo usar Redux (fallback)
      dispatch(
        addItemToCart({
          ...item,
          quantity: 1,
        })
      )
    }
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
      image={
        item.images?.previews?.[0] || item.imgs?.previews?.[0] || '/images/products/placeholder.svg'
      }
      title={cleanTitle}
      brand={item.brand}
      description={item.description}
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
      // Envío gratis automático para productos >= $15000
      freeShipping={features.freeShipping || features.currentPrice >= 15000}
      shippingText={
        features.freeShipping ? 'Envío gratis' : features.fastShipping ? 'Envío rápido' : undefined
      }
      // Configuración de badges inteligentes
      badgeConfig={{
        showCapacity: true,
        showColor: true,
        showFinish: true,
        showMaterial: true,
        showGrit: true
      }}
    />
  )
}

export default SingleGridItem
