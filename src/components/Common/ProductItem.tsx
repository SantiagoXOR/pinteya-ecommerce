'use client'
import React from 'react'
import { Product } from '@/types/product'
import { useCartUnified } from '@/hooks/useCartUnified'
import { useAnalytics } from '@/hooks/useAnalytics'
import { CommercialProductCard } from '@/components/ui/product-card-commercial'
import { useDesignSystemConfig, shouldShowFreeShipping as dsShouldShowFreeShipping } from '@/lib/design-system-config'

interface ProductItemProps {
  product?: Product
  item?: Product // Prop legacy para compatibilidad
}

const ProductItem: React.FC<ProductItemProps> = React.memo(({ product, item }) => {
  const { addProduct } = useCartUnified()
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
    // Unificar agregado al carrito
    addProduct(
      {
        id: productData.id,
        title: (productData as any).name || productData.title,
        price: productData.price,
        discounted_price: (productData as any).discounted_price ?? productData.discountedPrice ?? productData.price,
        images: Array.isArray(productData.images) ? productData.images : productData.imgs?.previews,
      },
      { quantity: 1, attributes: { color: (productData as any).color, medida: (productData as any).medida } }
    )

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

  // ✅ PRIORIDAD DE IMAGEN: Variante por defecto > Producto padre
  const productImage = (() => {
    // 1. Imagen de variante por defecto (productos con sistema de variantes)
    const defaultVariant = (productData as any).default_variant || (productData as any).variants?.[0]
    if (defaultVariant?.image_url) {
      return defaultVariant.image_url
    }
    
    // 2. Imagen del producto padre (formato array)
    if (Array.isArray((productData as any).images) && (productData as any).images[0]) {
      return (productData as any).images[0]
    }
    
    // 3. Imagen del producto padre (formato objeto)
    const candidates = [
      (productData as any).images?.main,
      (productData as any).images?.previews?.[0],
      (productData as any).images?.thumbnails?.[0],
      (productData as any).images?.gallery?.[0],
      (productData as any).imgs?.previews?.[0],
    ]
    for (const c of candidates) {
      if (typeof c === 'string' && c.trim() !== '') return c.trim()
    }
    
    // 4. Placeholder
    return '/images/products/placeholder.svg'
  })()

  return (
    <CommercialProductCard
      slug={productData.slug}
      image={productImage}
      title={productData.name || productData.title} // Usar name para consistencia con search
      brand={productData.brand}
      price={finalPrice}
      originalPrice={hasDiscount ? productData.price : undefined}
      discount={discount ? `${discount}%` : undefined}
      isNew={isNew}
      stock={(productData as any).stock ?? productData.stock ?? 50} // Usar stock real del producto
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
        showFinish: true, // Mostrar acabado (Satinado/Brillante)
        // Ocultar para priorizar acabado y círculos de color
        showMaterial: false,
        showGrit: false,
        showDimensions: false,
        showWeight: false,
        showBrand: false,
        maxBadges: 4
      }}
      // Pasar datos estructurados si están disponibles
      features={productData.features}
      specifications={productData.specifications}
      dimensions={productData.dimensions}
      weight={productData.weight}
      // ✅ CORREGIDO: Pasar medida para que se muestre en ProductCard cuando no hay variantes
      medida={(productData as any)?.medida}
      // ✅ NO pasar color legacy - usar solo variantes para badges
      // color={productData.color}
    />
  )
}, (prevProps, nextProps) => {
  // Comparación personalizada para evitar re-renders innecesarios
  const prevProduct = prevProps.product || prevProps.item
  const nextProduct = nextProps.product || nextProps.item
  
  if (!prevProduct || !nextProduct) return false
  
  // Comparar propiedades clave
  return (
    prevProduct.id === nextProduct.id &&
    prevProduct.price === nextProduct.price &&
    prevProduct.discountedPrice === nextProduct.discountedPrice &&
    prevProduct.stock === nextProduct.stock
  )
})

ProductItem.displayName = 'ProductItem'

export default ProductItem
