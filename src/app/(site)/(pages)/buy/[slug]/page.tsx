'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getProductBySlug } from '@/lib/api/products'
import { useCartUnified } from '@/hooks/useCartUnified'
import { getMainImage } from '@/lib/adapters/product-adapter'
import { SimplePageLoading } from '@/components/ui/simple-page-loading'
import { trackAddToCart as trackMetaAddToCart } from '@/lib/meta-pixel'
import { trackAddToCart as trackGAAddToCart } from '@/lib/google-analytics'

export default function BuyProductPage() {
  const router = useRouter()
  const params = useParams() as { slug?: string }
  const productSlug = params?.slug ?? ''
  const { addProduct } = useCartUnified()
  const [status, setStatus] = useState<'loading' | 'adding' | 'redirecting' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!productSlug || productSlug.trim() === '') {
      setError('Slug de producto no válido')
      setStatus('error')
      return
    }

    const processPurchase = async () => {
      try {
        setStatus('loading')
        
        // 1. Obtener producto por slug
        const apiProduct = await getProductBySlug(productSlug)
        const apiData =
          apiProduct && typeof apiProduct === 'object' && 'data' in (apiProduct as any)
            ? (apiProduct as any).data
            : apiProduct

        if (!apiData) {
          throw new Error('Producto no encontrado')
        }

        // 2. Preparar datos del producto para el carrito
        const productId = apiData.id
        const productName = apiData.name || 'Producto'
        
        // Precio: priorizar variante por defecto, luego discounted_price, luego price
        const productPrice = 
          apiData.default_variant?.price_sale || 
          apiData.discounted_price || 
          apiData.default_variant?.price_list || 
          apiData.price || 
          0
        
        const discountedPrice = 
          apiData.default_variant?.price_sale || 
          apiData.discounted_price || 
          productPrice
        
        const mainImage = getMainImage(apiData) || '/images/products/placeholder.svg'
        
        // Obtener imagen como array para el formato del carrito
        const images = Array.isArray(apiData.images) 
          ? apiData.images 
          : apiData.images?.previews 
          ? apiData.images.previews 
          : [mainImage]

        setStatus('adding')

        // 3. Agregar producto al carrito
        addProduct(
          {
            id: productId,
            title: productName,
            name: productName,
            price: productPrice,
            discounted_price: discountedPrice,
            images: images,
            brand: apiData.brand,
          },
          {
            quantity: 1,
            attributes: {
              color: apiData.default_variant?.color_name || apiData.color,
              medida: apiData.default_variant?.measure || apiData.medida,
              finish: apiData.default_variant?.finish,
            },
            image: mainImage,
          }
        )

        // 4. Trackear evento de AddToCart
        try {
          const category = apiData?.category?.name || apiData?.category || 'Producto'
          const productUrl = typeof window !== 'undefined' 
            ? `${window.location.origin}/buy/${productSlug}` 
            : undefined

          // Google Analytics
          trackGAAddToCart(
            String(productId),
            productName,
            category,
            productPrice,
            1,
            'ARS'
          )

          // Meta Pixel
          trackMetaAddToCart(
            productName,
            String(productId),
            category,
            productPrice,
            'ARS',
            productUrl
          )
        } catch (analyticsError) {
          console.warn('[Analytics] Error tracking add to cart:', analyticsError)
        }

        // 5. Pequeño delay para asegurar que el carrito se actualice
        await new Promise(resolve => setTimeout(resolve, 300))

        setStatus('redirecting')

        // 6. Redirigir al checkout
        router.push('/checkout')
      } catch (err) {
        console.error('Error procesando compra:', err)
        setError(err instanceof Error ? err.message : 'Error al procesar la compra')
        setStatus('error')
        
        // Redirigir a la página del producto después de 3 segundos
        setTimeout(() => {
          router.push(`/products/${productSlug}`)
        }, 3000)
      }
    }

    processPurchase()
  }, [productSlug, addProduct, router])

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
          <p className="text-gray-600 mb-6">{error || 'Error al procesar la compra'}</p>
          <button
            onClick={() => router.push(`/products/${productSlug}`)}
            className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors"
          >
            Ver Producto
          </button>
        </div>
      </div>
    )
  }

  return (
    <SimplePageLoading 
      message={
        status === 'loading' 
          ? 'Cargando producto...' 
          : status === 'adding' 
          ? 'Agregando al carrito...' 
          : 'Redirigiendo al checkout...'
      } 
    />
  )
}

