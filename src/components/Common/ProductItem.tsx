'use client'
import React from 'react'
import { Product } from '@/types/product'
import { useCartActions } from '@/hooks/useCartActions'
import { useAnalytics } from '@/hooks/useAnalytics'
import { CommercialProductCard } from '@/components/ui/product-card-commercial'

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

  // Calcular descuento si existe
  const hasDiscount = productData.discountedPrice && productData.discountedPrice < productData.price
  const discount = hasDiscount
    ? Math.round(((productData.price - productData.discountedPrice) / productData.price) * 100)
    : undefined

  // Precio final a mostrar
  const finalPrice = hasDiscount ? productData.discountedPrice : productData.price

  // Determinar badge basado en precio y características
  const badge = finalPrice >= 15000 ? 'Envío gratis' : discount ? 'Oferta especial' : 'Nuevo'

  return (
    <CommercialProductCard
      image={productData.imgs?.previews?.[0] || '/images/products/placeholder.svg'}
      title={productData.title}
      brand={productData.brand}
      price={finalPrice}
      originalPrice={hasDiscount ? productData.price : undefined}
      discount={discount ? `${discount}%` : undefined}
      isNew={badge === 'Nuevo'}
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
      // Envío gratis automático para productos >= $15000
      freeShipping={finalPrice >= 15000}
      shippingText={badge === 'Envío gratis' ? 'Envío gratis' : undefined}
    />
  )
}

export default ProductItem
