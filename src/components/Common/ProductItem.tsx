'use client'
import React from 'react'
import { Product } from '@/types/product'
import { useCartActions } from '@/hooks/useCartActions'
import { useAnalytics } from '@/hooks/useAnalytics'
import { CommercialProductCard } from '@/components/ui/product-card-commercial'
import { useDesignSystemConfig, shouldShowFreeShipping as dsShouldShowFreeShipping } from '@/lib/design-system-config'

interface ProductItemProps {
  product?: Product
  item?: Product // Prop legacy para compatibilidad
}

const ProductItem: React.FC<ProductItemProps> = ({ product, item }) => {
  const { addToCart } = useCartActions()
  const { trackEvent } = useAnalytics()

  // Usar product o item, con validación
  const productData = product || item

  // Early return si no hay datos del producto
  if (!productData) {
    console.warn('ProductItem: No product data provided')
    return null
  }

  // add to cart
  const handleAddToCart = () => {
    addToCart({
      ...productData,
      quantity: 1,
    })

    // Track analytics event
    trackEvent('add_to_cart', {
      product_id: productData.id,
      product_name: productData.title,
      price: productData.price,
    })
  }

  // Calcular descuento si existe (misma fórmula que en Products)
  const hasDiscount =
    productData.discountedPrice !== undefined && productData.discountedPrice < productData.price
  const discount = hasDiscount
    ? Math.round(((productData.price - productData.discountedPrice) / productData.price) * 100)
    : undefined

  // Precio final a mostrar
  const finalPrice = hasDiscount ? productData.discountedPrice : productData.price

  // Unificar lógica de "Nuevo" y envío gratis con Products
  const isNew = Boolean(productData.isNew)
  const config = useDesignSystemConfig()
  const autoFree = dsShouldShowFreeShipping(finalPrice, config)
  const freeShipping = Boolean((productData as any)?.freeShipping) || autoFree

  return (
    <CommercialProductCard
      image={
        (Array.isArray(productData.images) && productData.images[0]) ||
        productData.imgs?.previews?.[0] ||
        '/images/products/placeholder.svg'
      }
      title={productData.title}
      brand={productData.brand}
      price={finalPrice}
      originalPrice={hasDiscount ? productData.price : undefined}
      discount={discount ? `${discount}%` : undefined}
      isNew={isNew}
      stock={50} // Stock por defecto para productos legacy
      productId={productData.id}
      cta='Agregar al carrito'
      onAddToCart={handleAddToCart}
      showCartAnimation={true}
      // Información de cuotas automática
      installments={
        finalPrice >= 5000
          ? {
              quantity: 3,
              amount: Math.round(finalPrice / 3),
              interestFree: true,
            }
          : undefined
      }
      // Envío gratis según Design System
      freeShipping={freeShipping}
      shippingText={freeShipping ? 'Envío gratis' : undefined}
      // Nuevas props para sistema de badges inteligentes
      variants={productData.variants || []}
      description={productData.description || ''}
      badgeConfig={{
        showCapacity: true,
        showColor: true,
        showFinish: true, // Alinear con Products
        showMaterial: true,
        showGrit: true,
        showDimensions: true,
        showWeight: false,
        showBrand: false,
        maxBadges: 3
      }}
      // Pasar datos estructurados si están disponibles
      features={productData.features}
      specifications={productData.specifications}
      dimensions={productData.dimensions}
      weight={productData.weight}
      // Pasar datos directos de la BD
      color={productData.color}
      medida={productData.medida}
    />
  )
}

export default ProductItem
