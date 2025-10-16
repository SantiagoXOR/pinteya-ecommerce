'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import ShopDetailModal from '@/components/ShopDetails/ShopDetailModal'
import { useCartUnified } from '@/hooks/useCartUnified'
import { getProductById } from '@/lib/api/products'
import { getMainImage } from '@/lib/adapters/product-adapter'

// Mapea el producto de API al formato mínimo que consume el modal
function mapToModalProduct(apiProduct: any) {
  if (!apiProduct) return null

  // ID
  const idCandidate = (apiProduct as any)?.id
  const id = typeof idCandidate === 'number' ? idCandidate : Number(idCandidate)

  // Precio original (considerar variante por defecto si existe)
  const originalCandidate =
    (apiProduct as any)?.price ??
    (apiProduct as any)?.default_variant?.price_list
  const originalNum =
    typeof originalCandidate === 'number'
      ? originalCandidate
      : Number(String(originalCandidate))

  // Precio con descuento explícito si está disponible
  const discountedCandidate =
    (apiProduct as any)?.discounted_price ??
    (apiProduct as any)?.default_variant?.price_sale
  const discountedNum =
    typeof discountedCandidate === 'number'
      ? discountedCandidate
      : discountedCandidate !== undefined
      ? Number(String(discountedCandidate))
      : undefined

  // Stock (tomar de variante por defecto si aplica)
  const stockCandidate = (apiProduct as any)?.default_variant?.stock ?? (apiProduct as any)?.stock ?? 0
  const stockNum = typeof stockCandidate === 'number' ? stockCandidate : Number(String(stockCandidate))

  // Imagen principal centralizada via adapter
  const mainImage = getMainImage(apiProduct) || '/images/placeholder-product.jpg'

  return {
    id,
    name: (apiProduct as any)?.name || 'Producto',
    price: Number.isFinite(originalNum) ? originalNum : 0,
    originalPrice: discountedNum ? originalNum : undefined,
    discounted_price: discountedNum,
    image: mainImage,
    brand: (apiProduct as any)?.brand || 'Producto',
    stock: Number.isFinite(stockNum) ? stockNum : 0,
    description: (apiProduct as any)?.description || '',
  }
}

export default function ProductDetailModalPage() {
  const router = useRouter()
  const [product, setProduct] = useState<any | null>(null)
  const [open, setOpen] = useState(true)
  const { addProduct } = useCartUnified()
  const routeParams = useParams() as { id?: string }
  const productId = routeParams?.id ?? ''

  useEffect(() => {
    const idNum = Number(productId)
    if (!idNum || Number.isNaN(idNum)) return

    ;(async () => {
      try {
        const apiProduct = await getProductById(idNum)
        console.debug('[products/[id]] Producto API (raw):', apiProduct)
        const apiData =
          apiProduct && typeof apiProduct === 'object' && 'data' in (apiProduct as any)
            ? (apiProduct as any).data
            : apiProduct
        console.debug('[products/[id]] Producto API (desempaquetado):', apiData)
        const mapped = mapToModalProduct(apiData)
        if (!mapped) {
          console.warn('[products/[id]] Producto vacío o sin datos. Verifica respuesta del API.')
        }
        console.debug('[products/[id]] Producto mapeado para modal:', mapped)
        setProduct(mapped)
      } catch (error) {
        console.error('Error cargando producto', error)
      }
    })()
  }, [productId])

  const handleOpenChange = useCallback((newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      // Al cerrar el modal, regresar a la ruta anterior sin redirigir a /products
      router.back()
    }
  }, [router])

  const handleAddToCart = useCallback((productData: any, variants: any) => {
    // Usar el hook unificado para normalizar y agregar al carrito
    const images: string[] = Array.isArray(productData?.images)
      ? productData.images
      : productData?.image
      ? [productData.image]
      : []

    const cover = images[0] || '/images/products/placeholder.svg'
    const quantityFromModal = Number(variants?.quantity) || 1

    const attributes = {
      color: variants?.selectedColor ?? variants?.color ?? variants?.colorName,
      medida:
        variants?.selectedCapacity ?? variants?.capacity ?? variants?.size ?? variants?.SelectedSize,
      finish: variants?.finish, // Agregar finish para impregnantes Danzke
    }

    addProduct(productData, {
      quantity: quantityFromModal,
      attributes,
      image: cover,
    })
  }, [addProduct])

  // Render del modal cuando el producto esté cargado
  return (
    <div>
      {product && (
        <ShopDetailModal
          product={product}
          open={open}
          onOpenChange={handleOpenChange}
          onAddToCart={handleAddToCart}
        />
      )}
    </div>
  )
}