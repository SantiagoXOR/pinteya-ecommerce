'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, ShoppingCart, ArrowRight, Shield, Truck, Clock } from '@/lib/optimized-imports'
import { useAppSelector } from '@/redux/store'
import { selectCartItems } from '@/redux/features/cart-slice'
import { ProductRecommendations } from './ProductRecommendations'
import { TrustSignals } from './UXOptimizers'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { trackCustomEvent } from '@/lib/meta-pixel'
import { trackEvent } from '@/lib/google-analytics'

interface ProductAddedScreenProps {
  product?: {
    id: number | string
    title: string
    name?: string
    price: number
    discountedPrice?: number
    image?: string
    images?: string[]
    brand?: string
  }
  onContinue?: () => void
  onAddMore?: () => void
}

export const ProductAddedScreen: React.FC<ProductAddedScreenProps> = ({
  product,
  onContinue,
  onAddMore,
}) => {
  const router = useRouter()
  const [showAnimation, setShowAnimation] = useState(true)
  const [isReduxReady, setIsReduxReady] = useState(false)
  
  // Obtener cartItems de Redux con selector seguro
  // Asegurar que siempre devuelva un array, incluso si Redux no está inicializado
  const cartItems = useAppSelector((state) => {
    try {
      const items = selectCartItems(state)
      if (items === undefined || items === null) {
        return []
      }
      return Array.isArray(items) ? items : []
    } catch {
      return []
    }
  })

  // Esperar a que Redux se inicialice
  useEffect(() => {
    // Siempre marcar como listo después de un pequeño delay
    const timer = setTimeout(() => {
      setIsReduxReady(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  // Obtener el último producto agregado si no se pasa como prop
  // Usar useMemo para evitar evaluar antes de que cartItems esté listo
  const displayedProduct = useMemo(() => {
    if (product) return product
    // Validación defensiva adicional
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return null
    }
    return cartItems[cartItems.length - 1]
  }, [product, cartItems])

  // Obtener imagen del producto de forma segura
  const productImage = useMemo(() => {
    if (!displayedProduct) return '/images/products/placeholder.svg'
    return displayedProduct.image ||
      displayedProduct?.imgs?.previews?.[0] ||
      (Array.isArray(displayedProduct?.images) ? displayedProduct.images[0] : null) ||
      '/images/products/placeholder.svg'
  }, [displayedProduct])

  const productName = useMemo(() => {
    if (!displayedProduct) return 'Producto'
    return displayedProduct.title || displayedProduct.name || 'Producto'
  }, [displayedProduct])

  const productPrice = useMemo(() => {
    if (!displayedProduct) return 0
    return displayedProduct.discountedPrice || displayedProduct.price || 0
  }, [displayedProduct])

  useEffect(() => {
    if (!displayedProduct) return

    // Trackear evento de visualización de pantalla
    try {
      trackCustomEvent('ViewProductAddedScreen', {
        product_id: String(displayedProduct?.id || ''),
        product_name: productName,
        product_price: productPrice,
      })

      trackEvent('view_product_added_screen', 'checkout', productName, productPrice, {
        product_id: String(displayedProduct?.id || ''),
      })
    } catch (error) {
      console.warn('Error tracking product added screen:', error)
    }

    // Animación de entrada
    const timer = setTimeout(() => {
      setShowAnimation(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [displayedProduct?.id, productName, productPrice])

  const handleContinue = () => {
    trackCustomEvent('ContinueToCheckout', {
      source: 'product_added_screen',
      traffic_source: 'meta',
    })

    trackEvent('continue_to_checkout', 'checkout', 'product_added_screen', undefined, {
      source: 'meta',
    })

    if (onContinue) {
      onContinue()
    } else {
      router.push('/checkout/meta')
    }
  }

  const handleAddMore = () => {
    trackCustomEvent('AddMoreProducts', {
      source: 'product_added_screen',
    })

    if (onAddMore) {
      onAddMore()
    } else {
      router.push('/')
    }
  }

  // Mostrar loading mientras Redux se inicializa
  if (!isReduxReady) {
    return (
      <div className='min-h-screen flex items-center justify-center p-4'>
        <Card className='max-w-md w-full'>
          <CardContent className='p-6 text-center'>
            <div className='w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4' />
            <p className='text-gray-600'>Cargando...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!displayedProduct) {
    return (
      <div className='min-h-screen flex items-center justify-center p-4'>
        <Card className='max-w-md w-full'>
          <CardContent className='p-6 text-center'>
            <ShoppingCart className='w-16 h-16 text-gray-400 mx-auto mb-4' />
            <h2 className='text-2xl font-bold text-gray-900 mb-2'>
              Tu carrito está vacío
            </h2>
            <p className='text-gray-600 mb-6'>
              No hay productos en tu carrito para mostrar.
            </p>
            <Button onClick={() => router.push('/')} size='lg' className='w-full'>
              Explorar productos
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className='min-h-screen'>
      <div className='max-w-4xl mx-auto px-4 py-8'>
        {/* Animación de confirmación */}
        <div
          className={cn(
            'flex flex-col items-center justify-center mb-8 transition-all duration-500',
            showAnimation ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          )}
        >
          <div className='relative mb-6'>
            <div className='w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-bounce'>
              <CheckCircle className='w-12 h-12 text-white' />
            </div>
            <div className='absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20' />
          </div>
          <h1 className='text-3xl md:text-4xl font-bold text-gray-900 mb-2 text-center'>
            ¡Producto agregado!
          </h1>
          <p className='text-lg text-gray-600 text-center'>
            Tu producto está en el carrito y listo para comprar
          </p>
        </div>

        {/* Card principal con producto */}
        <Card className='mb-6 shadow-xl border-0'>
          <CardContent className='p-6'>
            <div className='flex flex-col md:flex-row gap-6'>
              {/* Imagen del producto */}
              <div className='relative w-full md:w-48 h-48 md:h-48 bg-white rounded-lg overflow-hidden flex-shrink-0'>
                <Image
                  src={productImage}
                  alt={productName}
                  fill
                  className='object-contain p-4'
                  sizes='(max-width: 768px) 100vw, 192px'
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = '/images/products/placeholder.svg'
                  }}
                />
              </div>

              {/* Información del producto */}
              <div className='flex-1 flex flex-col justify-between'>
                <div>
                  {displayedProduct.brand && (
                    <Badge variant='secondary' className='mb-2'>
                      {displayedProduct.brand}
                    </Badge>
                  )}
                  <h2 className='text-2xl font-bold text-gray-900 mb-2'>{productName}</h2>
                  <div className='flex items-center gap-3 mb-4'>
                    <span className='text-3xl font-bold text-green-600'>
                      ${productPrice.toLocaleString('es-AR')}
                    </span>
                    {displayedProduct.price && typeof displayedProduct.price === 'number' && displayedProduct.price > productPrice && (
                      <span className='text-xl text-gray-400 line-through'>
                        ${displayedProduct.price.toLocaleString('es-AR')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Indicadores de confianza */}
                <div className='flex flex-wrap gap-2 mt-4'>
                  <TrustSignals compact />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumen del carrito */}
        {Array.isArray(cartItems) && cartItems.length > 1 && (
          <Card className='mb-6'>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <ShoppingCart className='w-5 h-5 text-gray-600' />
                  <span className='text-sm text-gray-600'>
                    {cartItems.length} {cartItems.length === 1 ? 'producto' : 'productos'} en tu carrito
                  </span>
                </div>
                <Button variant='outline' size='sm' onClick={() => router.push('/cart')}>
                  Ver carrito
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botones de acción */}
        <div className='flex flex-col sm:flex-row gap-4 mb-8'>
          <Button
            onClick={handleContinue}
            size='lg'
            className='flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold text-lg py-6 shadow-lg'
          >
            Continuar al checkout
            <ArrowRight className='ml-2 w-5 h-5' />
          </Button>
          <Button
            onClick={handleAddMore}
            variant='outline'
            size='lg'
            className='flex-1 border-2 border-gray-300 hover:border-gray-400 py-6'
          >
            Agregar más productos
            <ShoppingCart className='ml-2 w-5 h-5' />
          </Button>
        </div>

        {/* Recomendaciones de productos */}
        <div className='mb-8'>
          <h3 className='text-xl font-bold text-gray-900 mb-4'>
            Quienes compraron esto también compraron
          </h3>
          <ProductRecommendations
            currentProductId={displayedProduct.id ? String(displayedProduct.id) : undefined}
            limit={4}
            onProductClick={(productId) => {
              trackCustomEvent('ClickRecommendedProduct', {
                product_id: productId,
                source: 'product_added_screen',
              })
            }}
          />
        </div>

        {/* Información adicional de confianza */}
        <Card className='bg-gradient-to-r from-blue-50 to-green-50 border-0'>
          <CardContent className='p-6'>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-center'>
              <div className='flex flex-col items-center'>
                <Truck className='w-8 h-8 text-green-600 mb-2' />
                <h4 className='font-semibold text-gray-900 mb-1'>Envío gratis</h4>
                <p className='text-sm text-gray-600'>En compras superiores a $50.000</p>
              </div>
              <div className='flex flex-col items-center'>
                <Shield className='w-8 h-8 text-blue-600 mb-2' />
                <h4 className='font-semibold text-gray-900 mb-1'>Compra segura</h4>
                <p className='text-sm text-gray-600'>Protegida por MercadoPago</p>
              </div>
              <div className='flex flex-col items-center'>
                <Clock className='w-8 h-8 text-orange-600 mb-2' />
                <h4 className='font-semibold text-gray-900 mb-1'>Entrega rápida</h4>
                <p className='text-sm text-gray-600'>En 24-48 horas hábiles</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

