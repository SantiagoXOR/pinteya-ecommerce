'use client'
// Force recompilation - Using direct fetch API instead of getProductBySlug

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useCartUnified } from '@/hooks/useCartUnified'
import { getMainImage } from '@/lib/adapters/product-adapter'
import { SimplePageLoading } from '@/components/ui/simple-page-loading'
import { trackAddToCart as trackMetaAddToCart } from '@/lib/meta-pixel'
import { trackAddToCart as trackGAAddToCart } from '@/lib/google-analytics'
import { ProductGridInfinite } from '@/components/Checkout/ProductGridInfinite'
import { FloatingCheckoutButton } from '@/components/Checkout/FloatingCheckoutButton'
import { BuyPageHeader } from '@/components/Checkout/BuyPageHeader'

interface ProductData {
  id: number
  categoryId?: number
  categorySlug?: string | null
}

export default function BuyProductPage() {
  console.log('[BuyProductPage] Componente montado')
  const router = useRouter()
  const params = useParams() as { slug?: string }
  const productSlug = params?.slug ?? ''
  const { addProduct } = useCartUnified()
  const [status, setStatus] = useState<'loading' | 'adding' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [productData, setProductData] = useState<ProductData | null>(null)

  useEffect(() => {
    if (!productSlug || productSlug.trim() === '') {
      setError('Slug de producto no válido')
      setStatus('error')
      return
    }

    const processPurchase = async () => {
      try {
        setStatus('loading')
        
        // 1. Obtener producto por slug directamente desde la API para evitar problemas de bundling
        const response = await fetch(`/api/products/slug/${encodeURIComponent(productSlug)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        // Parsear respuesta incluso si hay error para obtener el mensaje de la API
        const result = await response.json()
        
        if (!response.ok) {
          // Usar el mensaje de error de la API si está disponible
          const errorMessage = result?.error || `Error al obtener producto: ${response.statusText}`
          throw new Error(errorMessage)
        }
        
        if (!result || !result.success || !result.data) {
          throw new Error(result?.error || 'Error parsing API response')
        }

        const apiResponse = result.data
        
        // apiResponse ya es el producto directamente (result.data)
        const apiData = apiResponse

        if (!apiData || (!apiData.id && !apiData.name && !apiData.title)) {
          throw new Error('Producto no encontrado o datos inválidos')
        }

        // 2. Preparar datos del producto para el carrito
        const productId = apiData.id
        const productName = apiData.name || 'Producto'
        
        // Precio original/de lista: priorizar price_list de variante, luego price del producto
        const productPrice = 
          apiData.default_variant?.price_list || 
          apiData.price || 
          0
        
        // Precio de venta/descuento: priorizar price_sale de variante, luego discounted_price del producto
        // Si no hay precio de descuento, usar el precio original
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

        // 5. Guardar datos del producto para mostrar recomendaciones
        setProductData({
          id: productId,
          categoryId: apiData.category_id || apiData.category?.id,
          categorySlug: apiData.category?.slug || apiData.category,
        })

        // 6. Pequeño delay para asegurar que el carrito se actualice
        await new Promise(resolve => setTimeout(resolve, 300))

        // 7. Mostrar página intermedia con productos
        console.log('[BuyProductPage] Estado listo, mostrando página intermedia', {
          productId,
          categoryId: apiData.category_id || apiData.category?.id,
          categorySlug: apiData.category?.slug || apiData.category,
        })
        setStatus('ready')
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

  // Mostrar página intermedia con productos
  if (status === 'ready' && productData) {
    console.log('[BuyProductPage] Renderizando página intermedia', { status, productData })
    return (
      <main className='min-h-screen bg-white pb-24'>
        {/* Cabecera estilo MercadoLibre */}
        <BuyPageHeader />
        
        {/* Grid de productos */}
        <div className='max-w-7xl mx-auto px-4 py-6'>
          <ProductGridInfinite
            currentProductId={productData.id}
            currentProductCategoryId={productData.categoryId}
            categorySlug={productData.categorySlug}
          />
        </div>
        
        {/* Botón flotante de checkout */}
        <FloatingCheckoutButton />
      </main>
    )
  }

  console.log('[BuyProductPage] Estado actual:', { status, productData, error })

  return (
    <SimplePageLoading 
      message={
        status === 'loading' 
          ? 'Cargando producto...' 
          : status === 'adding' 
          ? 'Agregando al carrito...' 
          : 'Preparando productos...'
      } 
    />
  )
}

