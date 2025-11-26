'use client'
// Force recompilation - Using direct fetch API instead of getProductBySlug

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
import { Loader2 } from 'lucide-react'

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
  const [status, setStatus] = useState<'loading' | 'adding' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [productData, setProductData] = useState<ProductData | null>(null)
  
  // Ref para rastrear si ya se procesó este slug específico en esta ejecución
  const processedSlugRef = useRef<string | null>(null)

  // Guardar el slug en sessionStorage para poder volver desde checkout
  useEffect(() => {
    if (productSlug && typeof window !== 'undefined') {
      sessionStorage.setItem('last_buy_page_slug', productSlug)
    }
  }, [productSlug])

  useEffect(() => {
    // Si ya se procesó este slug en esta ejecución, no hacer nada
    if (processedSlugRef.current === productSlug) {
      return
    }

    if (!productSlug || productSlug.trim() === '') {
      setError('Slug de producto no válido')
      setStatus('error')
      return
    }

    // Verificar en sessionStorage si ya se procesó este slug en esta sesión
    const storageKey = `processed_slug_${productSlug}`
    const alreadyProcessed = typeof window !== 'undefined' && sessionStorage.getItem(storageKey) === 'true'
    
    if (alreadyProcessed) {
      console.log('[BuyProductPage] Slug ya procesado en esta sesión, saltando agregado al carrito')
      // Si ya se procesó, solo mostrar la página intermedia si tenemos los datos
      // ⚡ PERFORMANCE: Prefetch de datos del producto con mejor caching
      const fetchProductData = async () => {
        try {
          const response = await fetch(`/api/products/slug/${encodeURIComponent(productSlug)}`, {
            // Agregar headers de cache para mejor performance
            headers: {
              'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
            },
          })
          const result = await response.json()
          if (result?.success && result?.data) {
            const apiData = result.data
            setProductData({
              id: apiData.id,
              categoryId: apiData.category_id || apiData.category?.id,
              categorySlug: apiData.category?.slug || apiData.category,
            })
            setStatus('ready')
          }
        } catch (err) {
          console.error('Error obteniendo datos del producto:', err)
        }
      }
      fetchProductData()
      return
    }

    // Pequeño delay para asegurar que el carrito se haya hidratado desde localStorage
    // Esto evita que se agregue el producto múltiples veces cuando se recarga la página
    const processPurchase = async () => {
      try {
        setStatus('loading')
        
        // 1. Obtener producto por slug directamente desde la API para evitar problemas de bundling
        // ⚡ PERFORMANCE: Agregar headers de cache para mejor performance
        const response = await fetch(`/api/products/slug/${encodeURIComponent(productSlug)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
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

        // 3. Esperar un momento para que el carrito se haya hidratado desde localStorage
        await new Promise(resolve => setTimeout(resolve, 200))
        
        // Verificar nuevamente si el producto ya está en el carrito después de la hidratación
        const isAlreadyInCart = cartItems.some(item => String(item.id) === String(productId))
        
        if (!isAlreadyInCart) {
          // Solo agregar si no está ya en el carrito
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
          console.log('[BuyProductPage] Producto agregado al carrito')
        } else {
          console.log('[BuyProductPage] Producto ya está en el carrito, saltando agregado')
        }

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
          // ✅ CORREGIDO: Si hay una variante por defecto, usar su ID para que coincida con el feed XML
          const contentIdForMeta = apiData.default_variant?.id
            ? String(apiData.default_variant.id)
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
        
        // Resetear ref y sessionStorage solo en caso de error para permitir reintento
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
    }

    // Marcar como procesado ANTES de iniciar el proceso
    processedSlugRef.current = productSlug
    if (typeof window !== 'undefined') {
      const storageKey = `processed_slug_${productSlug}`
      sessionStorage.setItem(storageKey, 'true')
    }

    processPurchase()
  }, [productSlug, router, cartItems, addProduct]) // Incluir todas las dependencias necesarias

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
    <main className='min-h-screen pb-24 relative' style={{ background: 'linear-gradient(180deg, #ffd549 0%, #fff4c6 50%, #ffffff 100%)', backgroundAttachment: 'fixed' }}>
      {/* Botón de carrito flotante justo debajo del header */}
      <FloatingCheckoutButton />
      
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
          // ✅ AGREGAR: Skeleton inline en lugar de pantalla de carga completa
          // Esto permite que el usuario vea el layout inmediatamente mientras se cargan los datos
          <div className='flex flex-col items-center justify-center py-20'>
            <div className='flex flex-col items-center gap-4'>
              <div className='relative'>
                <div className='h-16 w-16 rounded-full bg-orange-100 flex items-center justify-center'>
                  <Loader2 className='h-8 w-8 text-orange-600 animate-spin' />
                </div>
              </div>
              <div className='text-center space-y-1'>
                <p className='text-lg font-medium text-gray-900'>
                  {status === 'loading' 
                    ? 'Cargando producto...' 
                    : status === 'adding' 
                    ? 'Agregando al carrito...' 
                    : 'Preparando productos...'}
                </p>
                <p className='text-sm text-gray-500'>
                  Por favor espera un momento
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

