'use client'
// ⚡ PERFORMANCE: Configuración de página dinámica
export const dynamic = 'force-dynamic'
export const dynamicParams = true

import React, { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useCartUnified } from '@/hooks/useCartUnified'
import { getMainImage } from '@/lib/adapters/product-adapter'
import { trackAddToCart as trackMetaAddToCart } from '@/lib/meta-pixel'
import { trackAddToCart as trackGAAddToCart } from '@/lib/google-analytics'
import { ProductGridInfinite } from '@/components/Checkout/ProductGridInfinite'
import { FloatingCheckoutButton } from '@/components/Checkout/FloatingCheckoutButton'
import { BuyPageHeader } from '@/components/Checkout/BuyPageHeader'
import { useAppSelector } from '@/redux/store'
import { selectCartItems } from '@/redux/features/cart-slice'
import { useProductBySlug } from '@/hooks/useProductBySlug'
import { ProductGridSkeleton } from '@/components/ui/skeletons'
// ⚡ PERFORMANCE: Importar directamente para evitar problemas de serialización con dynamic imports
// WhatsApp components deshabilitados en /buy
// import FloatingWhatsAppBuy from '@/components/Common/FloatingWhatsAppBuy'
// import BuyPageWhatsAppPopup from '@/components/Common/BuyPageWhatsAppPopup'

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
  const cartItems = useAppSelector(selectCartItems) // Obtener items del carrito
  
  // ⚡ PERFORMANCE: Usar TanStack Query para obtener producto (caché automático)
  const { product, isLoading: isLoadingProduct, error: productError } = useProductBySlug({
    slug: productSlug,
    enabled: !!productSlug && productSlug.trim() !== '',
  })
  
  const [status, setStatus] = useState<'loading' | 'adding' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [productData, setProductData] = useState<ProductData | null>(null)
  const [alreadyProcessed, setAlreadyProcessed] = useState(false)
  
  // Ref para rastrear si ya se procesó este slug específico en esta ejecución
  const processedSlugRef = useRef<string | null>(null)
  // Ref para evitar agregar el producto múltiples veces
  const hasAddedToCartRef = useRef(false)

  // ⚡ PERFORMANCE: Verificar sessionStorage en useEffect (solo en cliente) para evitar problemas de hidratación
  useEffect(() => {
    if (typeof window !== 'undefined' && productSlug) {
      const storageKey = `processed_slug_${productSlug}`
      const processed = sessionStorage.getItem(storageKey) === 'true'
      setAlreadyProcessed(processed)
    }
  }, [productSlug])

  // Guardar el slug en sessionStorage para poder volver desde checkout
  // ⚡ PERFORMANCE: Usar requestIdleCallback para operaciones no críticas
  useEffect(() => {
    if (productSlug && typeof window !== 'undefined') {
      const saveToStorage = () => {
        sessionStorage.setItem('last_buy_page_slug', productSlug)
      }
      
      if ('requestIdleCallback' in window) {
        requestIdleCallback(saveToStorage, { timeout: 2000 })
      } else {
        setTimeout(saveToStorage, 0)
      }
    }
  }, [productSlug])

  // ⚡ PERFORMANCE: Combinar validación y manejo de errores en un solo useEffect
  useEffect(() => {
    // Verificar si el slug es válido
    if (!productSlug || productSlug.trim() === '') {
      setError('Slug de producto no válido')
      setStatus('error')
      return
    }

    // Manejar errores del producto
    if (productError) {
      setError(productError.message)
      setStatus('error')
      
      // Resetear ref para permitir reintento
      processedSlugRef.current = null
      if (typeof window !== 'undefined') {
        const storageKey = `processed_slug_${productSlug}`
        sessionStorage.removeItem(storageKey)
      }
      
      // Redirigir a la página del producto después de 3 segundos
      setTimeout(() => {
        router.push(`/products/${productSlug}`)
      }, 3000)
    }
  }, [productError, productSlug, router])

  // Procesar producto cuando se carga desde TanStack Query
  useEffect(() => {
    // Si está cargando o no hay producto, esperar
    if (isLoadingProduct || !product) {
      setStatus('loading')
      return
    }

    // Si ya se procesó este slug en esta sesión, solo mostrar datos
    if (alreadyProcessed) {
      console.log('[BuyProductPage] Slug ya procesado en esta sesión, saltando agregado al carrito')
      // Solo mostrar la página intermedia con los datos del producto
      // Evitar startTransition aquí para prevenir problemas de serialización
      const categoryId = product.category_id || product.category?.id || undefined
      const categorySlug = product.category?.slug || product.category || undefined
      
      setProductData({
        id: product.id,
        ...(categoryId && { categoryId }),
        ...(categorySlug && { categorySlug }),
      })
      setStatus('ready')
      return
    }

    // Si ya se procesó este slug en esta ejecución, no hacer nada
    if (processedSlugRef.current === productSlug) {
      return
    }

    // Marcar como procesado ANTES de iniciar el proceso
    processedSlugRef.current = productSlug
    if (typeof window !== 'undefined') {
      const storageKey = `processed_slug_${productSlug}`
      // ⚡ PERFORMANCE: Usar requestIdleCallback para escritura de sessionStorage
      const saveToStorage = () => {
        sessionStorage.setItem(storageKey, 'true')
      }
      
      if ('requestIdleCallback' in window) {
        requestIdleCallback(saveToStorage, { timeout: 2000 })
      } else {
        setTimeout(saveToStorage, 0)
      }
    }

    // ⚡ PERFORMANCE: Procesar agregado al carrito - NO usar startTransition con async
    // startTransition no puede envolver funciones async, solo actualizaciones de estado síncronas
    const processPurchase = async () => {
      try {
        // Validar datos del producto
        if (!product || (!product.id && !product.name && !product.title)) {
          throw new Error('Producto no encontrado o datos inválidos')
        }

        // Preparar datos del producto para el carrito
        const productId = product.id
        const productName = product.name || 'Producto'
        
        // Precio original/de lista: priorizar price_list de variante, luego price del producto
        const productPrice = 
          product.default_variant?.price_list || 
          product.price || 
          0
        
        // Precio de venta/descuento: priorizar price_sale de variante, luego discounted_price del producto
        const discountedPrice = 
          product.default_variant?.price_sale || 
          product.discounted_price || 
          productPrice
        
        const mainImage = getMainImage(product) || '/images/products/placeholder.svg'
        
        // Obtener imagen como array para el formato del carrito
        const images = Array.isArray(product.images) 
          ? product.images 
          : product.images?.previews 
          ? product.images.previews 
          : [mainImage]

        // Actualizar estado sin startTransition para evitar problemas de serialización
        setStatus('adding')

        // Esperar un momento para que el carrito se haya hidratado desde localStorage
        await new Promise(resolve => setTimeout(resolve, 200))
        
        // Verificar nuevamente si el producto ya está en el carrito después de la hidratación
        const isAlreadyInCart = cartItems.some(item => String(item.id) === String(productId))
        
        if (!isAlreadyInCart && !hasAddedToCartRef.current) {
          // Solo agregar si no está ya en el carrito
          hasAddedToCartRef.current = true
          addProduct(
            {
              id: productId,
              title: productName,
              name: productName,
              price: productPrice,
              discounted_price: discountedPrice,
              images: images,
              brand: product.brand,
            },
            {
              quantity: 1,
              attributes: {
                color: product.default_variant?.color_name || product.color,
                medida: product.default_variant?.measure || product.medida,
                finish: product.default_variant?.finish,
              },
              image: mainImage,
            }
          )
          console.log('[BuyProductPage] Producto agregado al carrito')

          // Trackear evento de AddToCart
          try {
            const category = product?.category?.name || product?.category || 'Producto'
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
            const contentIdForMeta = product.default_variant?.id
              ? String(product.default_variant.id)
              : String(productId)
            
            trackMetaAddToCart(
              productName,
              contentIdForMeta,
              category,
              productPrice,
              'ARS',
              productUrl
            )
          } catch (analyticsError) {
            console.warn('[Analytics] Error tracking add to cart:', analyticsError)
          }
        } else {
          console.log('[BuyProductPage] Producto ya está en el carrito, saltando agregado')
        }

        // Pequeño delay para asegurar que el carrito se actualice
        await new Promise(resolve => setTimeout(resolve, 300))

        // Guardar datos del producto para mostrar recomendaciones
        // Evitar startTransition para prevenir problemas de serialización
        const categoryId = product.category_id || product.category?.id || undefined
        const categorySlug = product.category?.slug || product.category || undefined
        
        setProductData({
          id: productId,
          ...(categoryId && { categoryId }),
          ...(categorySlug && { categorySlug }),
        })
        
        // Mostrar página intermedia con productos
        console.log('[BuyProductPage] Estado listo, mostrando página intermedia', {
          productId,
          categoryId,
          categorySlug,
        })
        setStatus('ready')
      } catch (err) {
        console.error('Error procesando compra:', err)
        setError(err instanceof Error ? err.message : 'Error al procesar la compra')
        setStatus('error')
        
        // Resetear ref y sessionStorage solo en caso de error para permitir reintento
        processedSlugRef.current = null
        hasAddedToCartRef.current = false
        if (typeof window !== 'undefined') {
          const storageKey = `processed_slug_${productSlug}`
          sessionStorage.removeItem(storageKey)
        }
        
        // Redirigir a la página del producto después de 3 segundos
        setTimeout(() => {
          router.push(`/products/${productSlug}`)
        }, 3000)
      }
    }

    processPurchase()
  }, [product, isLoadingProduct, productSlug, router, cartItems, addProduct, alreadyProcessed])

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

  // ✅ MODIFICAR: Renderizar siempre el layout de la página, incluso durante loading
  // Esto mejora el First Paint porque el usuario ve inmediatamente la estructura (header, fondo, etc.)
  // en lugar de una pantalla de carga completa
  console.log('[BuyProductPage] Estado actual:', { status, productData, error })

  return (
    <main className='min-h-screen pb-24 relative'>
      {/* Botón de carrito flotante justo debajo del header */}
      <FloatingCheckoutButton />
      
      {/* Botón flotante de WhatsApp - OCULTO en /buy */}
      {/* <FloatingWhatsAppBuy /> */}
      
      {/* Popup de WhatsApp - OCULTO en /buy */}
      {/* <BuyPageWhatsAppPopup /> */}
      
      {/* Badge flotante con título */}
      <BuyPageHeader />
      
      {/* Spacer para compensar los elementos flotantes */}
      <div className='h-[146px] md:h-[171px]'></div>
      
      {/* Grid de productos o skeleton inline */}
      <div className='max-w-7xl mx-auto px-4 pb-6 relative z-0'>
        {status === 'ready' && productData ? (
          <ProductGridInfinite
            currentProductId={productData.id}
            {...(productData.categoryId && { currentProductCategoryId: productData.categoryId })}
            {...(productData.categorySlug && { categorySlug: productData.categorySlug })}
          />
        ) : (
          // ✅ SKELETON UNIFICADO: Usar ProductGridSkeleton para consistencia con Home-v2
          <div className='w-full'>
            <ProductGridSkeleton count={8} />
            {/* Mensaje de estado adicional */}
            <div className='flex flex-col items-center justify-center py-8'>
              <div className='text-center space-y-1'>
                <p className='text-sm font-medium text-gray-900'>
                  {status === 'loading' 
                    ? 'Cargando producto...' 
                    : status === 'adding' 
                    ? 'Agregando al carrito...' 
                    : 'Preparando productos...'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

