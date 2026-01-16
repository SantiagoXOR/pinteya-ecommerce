'use client'
import React from 'react'
import { Product } from '@/types/product'
import { useCartUnified } from '@/hooks/useCartUnified'
import { useAnalytics } from '@/hooks/useAnalytics'
import { CommercialProductCard } from '@/components/ui/product-card-commercial'
import { useDesignSystemConfig, shouldShowFreeShipping as dsShouldShowFreeShipping } from '@/lib/design-system-config'
import { resolveProductImage } from '@/components/ui/product-card-commercial/utils/image-resolver'
import type { ProductVariant } from '@/components/ui/product-card-commercial/types'

interface ProductItemProps {
  product?: Product
  item?: Product // Prop legacy para compatibilidad
}

const ProductItem: React.FC<ProductItemProps> = React.memo(({ product, item }) => {
  const { addProduct } = useCartUnified()
  const { trackEvent } = useAnalytics()

  // Usar product o item, con validación
  const productData = product || item

  // ✅ FIX: Validación mejorada - verificar que el producto tenga datos mínimos
  if (!productData) {
    console.warn('ProductItem: No product data provided', { product, item })
    return null
  }

  // Validar que el producto tenga al menos id y slug
  if (!productData.id) {
    console.warn('ProductItem: Product missing id', { productId: productData.id, slug: productData.slug })
    return null
  }

  if (!productData.slug) {
    console.warn('ProductItem: Product missing slug', { productId: productData.id })
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
  // ✅ FIX: Siempre mostrar envío gratis si el precio final es >= $50.000
  const autoFree = finalPrice >= config.ecommerce.shippingInfo.freeShippingThreshold
  const freeShipping = Boolean((productData as any)?.freeShipping) || autoFree

  // Resolver imagen usando image-resolver.ts unificado
  const productImage = React.useMemo(() => {
    // Preparar estructura compatible con ProductImageSource
    const imageSource = {
      image_url: (productData as any)?.image_url || null,
      default_variant: (productData as any)?.default_variant || null,
      variants: (productData.variants || []) as ProductVariant[],
      images: productData.images || null,
      imgs: productData.imgs || null
    }
    
    return resolveProductImage(imageSource, {
      logContext: `ProductItem-${productData.id}`
    })
  }, [productData])

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
      // ✅ CORREGIDO: Pasar color para que se muestre cuando no hay variantes
      color={(productData as any)?.color}
    />
  )
}, (prevProps, nextProps) => {
  // Comparación personalizada para evitar re-renders innecesarios
  const prevProduct = prevProps.product || prevProps.item
  const nextProduct = nextProps.product || nextProps.item
  
  if (!prevProduct || !nextProduct) return false
  
  // ✅ CORREGIDO: Comparar también variants para que se re-renderice cuando se cargan
  const prevVariantsLength = prevProduct.variants?.length || 0
  const nextVariantsLength = nextProduct.variants?.length || 0
  
  // Comparar propiedades clave
  return (
    prevProduct.id === nextProduct.id &&
    prevProduct.price === nextProduct.price &&
    prevProduct.discountedPrice === nextProduct.discountedPrice &&
    prevProduct.stock === nextProduct.stock &&
    prevVariantsLength === nextVariantsLength // ✅ Incluir comparación de variants
  )
})

ProductItem.displayName = 'ProductItem'

export default ProductItem
