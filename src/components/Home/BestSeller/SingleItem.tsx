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
import { addItemToCart } from '@/redux/features/cart-slice'
import { CommercialProductCard } from '@/components/ui/product-card-commercial'

interface SingleItemProps {
  product: Product
}

const SingleItem: React.FC<SingleItemProps> = ({ product }) => {
  const { addProduct } = useCartUnified()
  const { trackEvent } = useAnalytics()
  const dispatch = useDispatch<AppDispatch>()

  // Validar que product existe
  if (!product) {
    return null
  }

  // Usar product directamente
  const item = product

  // update the QuickView state
  const handleQuickViewUpdate = () => {
    dispatch(updateQuickView({ ...item }))
  }

  // add to cart
  const handleAddToCart = () => {
    // Servicio unificado: normaliza y agrega con atributos coherentes
    addProduct(
      {
        id: item.id,
        title: item.name || item.title,
        price: item.price,
        discounted_price: item.discountedPrice ?? item.price,
        images: item.imgs?.previews ?? [],
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

  // Calcular descuento si existe
  const discount =
    item.discountedPrice && item.discountedPrice < item.price
      ? Math.round(((item.price - item.discountedPrice) / item.price) * 100)
      : undefined

  // Badge para best sellers - usar precio base para envío gratis
  const badge = discount ? 'Best Seller' : item.price >= 50000 ? 'Envío gratis' : 'Destacado'

  return (
    <CommercialProductCard
      image={item.imgs?.previews?.[0] || '/images/products/placeholder.svg'}
      slug={(item as any)?.slug}
      title={item.name || item.title} // Usar name para consistencia con search
      brand={item.brand} // Pasar brand para extracción correcta
      price={item.discountedPrice}
      originalPrice={item.discountedPrice < item.price ? item.price : undefined}
      discount={discount ? `${discount}%` : undefined}
      isNew={Boolean(product?.isNew)}
      stock={50} // Stock por defecto para productos legacy
      productId={item.id}
      cta='Agregar al carrito'
      onAddToCart={handleAddToCart}
      showCartAnimation={true}
      // Pasar datos de BD para badges correctos (igual que en search)
      color={(item as any)?.color}
      medida={(item as any)?.medida}
      // Información de cuotas automática
      installments={
        item.discountedPrice >= 5000
          ? {
              quantity: 3,
              amount: Math.round(item.discountedPrice / 3),
              interestFree: true,
            }
          : undefined
      }
      // Envío gratis automático para productos >= $50000
      freeShipping={item.discountedPrice >= 50000}
      shippingText={
        badge === 'Envío gratis'
          ? 'Envío gratis'
          : badge === 'Best Seller'
            ? 'Best Seller'
            : undefined
      }
      badgeConfig={{
        showCapacity: true,
        showColor: true,
        showFinish: true,
        showMaterial: false,
        showGrit: false,
        showDimensions: false,
        showWeight: false,
        showBrand: false,
        maxBadges: 6
      }}
    />
  )
}

export default SingleItem
