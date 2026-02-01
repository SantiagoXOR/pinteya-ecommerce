'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Star, Loader2 } from '@/lib/optimized-imports'
import { cn } from '@/lib/utils'
import { getProducts } from '@/lib/api/products'
import { ProductWithCategory } from '@/types/api'
import { getValidImageUrl, getMainImage } from '@/lib/adapters/product-adapter'
import { resolveProductImage } from '@/components/ui/product-card-commercial/utils/image-resolver'
import type { ProductVariant } from '@/components/ui/product-card-commercial/types'
import Image from 'next/image'
import { useCartUnified } from '@/hooks/useCartUnified'
import { getVariantEffectivePrice } from '@/lib/products/utils/variant-utils'

/**
 * Calcula el precio efectivo de un producto considerando variantes
 * Prioriza el precio de la variante por defecto sobre el precio del producto base
 */
function getEffectiveProductPrice(product: ProductWithCategory): number {
  // Prioridad 1: Precio de variante por defecto
  if (product.default_variant) {
    return getVariantEffectivePrice(product.default_variant)
  }
  // Prioridad 2: Precio del producto base
  return product.discounted_price || product.price || 0
}

/**
 * Calcula el precio original de un producto para mostrar descuentos
 * Retorna null si no hay precio original (sin descuento)
 */
function getOriginalProductPrice(product: ProductWithCategory): number | null {
  // Si tiene variante con descuento, usar price_list como original
  if (product.default_variant?.price_list && product.default_variant?.price_sale) {
    return Number(product.default_variant.price_list)
  }
  // Si no tiene variantes pero tiene descuento, usar price como original
  if (!product.default_variant && product.discounted_price && product.price && product.discounted_price < product.price) {
    return product.price
  }
  return null
}

interface QuickAddSuggestionsProps {
  onAddToCart?: (productId: string) => void
  onClose?: () => void
  className?: string
}

const QuickAddSuggestions: React.FC<QuickAddSuggestionsProps> = ({
  onAddToCart,
  onClose,
  className,
}) => {
  const [products, setProducts] = useState<ProductWithCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { addProduct } = useCartUnified()

  useEffect(() => {
    const abortController = new AbortController()

    const fetchPopularProducts = async () => {
      try {
        setLoading(true)
        setError(null)

        // Obtener más productos para filtrar por envío gratis
        const response = await getProducts(
          {
            limit: 30, // Obtener más para filtrar después
            sortBy: 'price',
            sortOrder: 'desc',
          },
          abortController.signal
        )

        // Verificar si el componente aún está montado
        if (abortController.signal.aborted) {
          return
        }

        if (response.success && response.data) {
          // Filtrar productos con envío gratis (precio >= $50,000)
          const FREE_SHIPPING_THRESHOLD = 50000
          const freeShippingProducts = response.data.filter(product => {
            // Si tiene variantes, verificar si alguna califica
            if (product.variants && product.variants.length > 0) {
              return product.variants.some((v: any) => {
                const variantPrice = Number(v.price_sale) || Number(v.price_list) || 0
                return variantPrice >= FREE_SHIPPING_THRESHOLD
              })
            }
            // Si no tiene variantes, verificar precio del producto
            const effectivePrice = getEffectiveProductPrice(product)
            return effectivePrice >= FREE_SHIPPING_THRESHOLD
          })
          // Fallback: si no hay productos con envío gratis, mostrar sugerencias (primeros N de la respuesta)
          const toShow = freeShippingProducts.length > 0
            ? freeShippingProducts.slice(0, 6)
            : response.data.slice(0, 6)
          setProducts(toShow)
        } else {
          setError('No se pudieron cargar los productos')
        }
      } catch (err) {
        // Solo mostrar error si no fue cancelado y no es AbortError
        if (!abortController.signal.aborted && err instanceof Error && err.name !== 'AbortError') {
          console.error('Error fetching free shipping products:', err)
          setError('Error al cargar productos con envío gratis')
        }
        // No loggear AbortError ya que es comportamiento esperado durante cleanup
      } finally {
        // Solo actualizar loading si no fue cancelado
        if (!abortController.signal.aborted) {
          setLoading(false)
        }
      }
    }

    fetchPopularProducts()

    // Cleanup: cancelar la request si el componente se desmonta
    return () => {
      abortController.abort()
    }
  }, [])

  const handleAddToCart = (productId: string) => {
    // Buscar el producto en la lista
    const product = products.find(p => p.id.toString() === productId)

    if (product) {
      // Obtener la imagen principal del producto
      const mainImage = getMainImage(product)
      
      // Calcular precios efectivos considerando variantes
      const effectivePrice = getEffectiveProductPrice(product)
      const originalPrice = getOriginalProductPrice(product)
      // Si hay precio original mayor al efectivo, significa que hay descuento
      const discountedPrice = originalPrice && originalPrice > effectivePrice ? effectivePrice : effectivePrice
      
      // Servicio unificado: normaliza y agrega
      addProduct(
        {
          id: product.id,
          name: product.name,
          price: originalPrice || effectivePrice, // Usar precio original si existe, sino el efectivo
          discounted_price: discountedPrice, // Precio con descuento si aplica
          images: product.images || [],
          brand: product.brand,
        },
        { 
          quantity: 1,
          image: mainImage // Pasar imagen principal directamente
        }
      )
    }

    // Llamar callback personalizado si existe
    if (onAddToCart) {
      onAddToCart(productId)
    }
  }

  return (
    <div className={cn('bg-white rounded-xl border border-gray-200 p-4', className)}>
      {/* Header */}
      <div className='flex items-center justify-between mb-4'>
        <div>
          <h4 className='font-bold text-gray-900 text-sm'>Productos con Envío Gratis</h4>
          <p className='text-xs text-gray-600'>Agrega productos de $50.000+ para envío gratis</p>
        </div>
      </div>

      {/* Lista de productos */}
      <div className='space-y-3'>
        {loading ? (
          <div className='flex items-center justify-center py-8'>
            <Loader2 className='w-6 h-6 animate-spin text-gray-400' />
            <span className='ml-2 text-sm text-gray-500'>Cargando productos...</span>
          </div>
        ) : error ? (
          <div className='text-center py-4'>
            <p className='text-sm text-red-500'>
              {error instanceof Error ? error.message : error?.toString() || 'Error desconocido'}
            </p>
          </div>
        ) : products.length === 0 ? (
          <div className='text-center py-4'>
            <p className='text-sm text-gray-500'>No hay productos disponibles</p>
          </div>
        ) : (
          products.map(product => {
            const currentPrice = getEffectiveProductPrice(product)
            const originalPrice = getOriginalProductPrice(product)
            const hasDiscount = originalPrice !== null && currentPrice < originalPrice

            return (
              <div
                key={product.id}
                className='flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200'
              >
                {/* Imagen del producto */}
                <div className='w-16 h-16 bg-gray-200 rounded-xl overflow-hidden flex-shrink-0 shadow-sm border border-gray-300'>
                  <Image
                    src={getValidImageUrl(resolveProductImage({
                      image_url: (product as any)?.image_url || null,
                      default_variant: (product as any)?.default_variant || null,
                      variants: ((product as any)?.variants || []) as ProductVariant[],
                      images: (product as any)?.images || null,
                      imgs: (product as any)?.imgs || null
                    }))}
                    alt={product.name}
                    width={64}
                    height={64}
                    className='w-full h-full object-cover'
                  />
                </div>

                {/* Info del producto */}
                <div className='flex-1 min-w-0'>
                  <h5 className='font-semibold text-xs text-gray-900 line-clamp-1'>
                    {product.name}
                  </h5>
                  <p className='text-2xs text-gray-500 mb-1'>{product.brand || 'Sin marca'}</p>

                  {/* Información de variante */}
                  {product.default_variant && (
                    <div className='flex flex-wrap items-center gap-1.5 mb-1'>
                      {product.default_variant.color_name && (
                        <span className='text-2xs text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded'>
                          Color: {product.default_variant.color_name}
                        </span>
                      )}
                      {product.default_variant.measure && (
                        <span className='text-2xs text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded'>
                          {product.default_variant.measure}
                        </span>
                      )}
                      {product.default_variant.finish && (
                        <span className='text-2xs text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded'>
                          {product.default_variant.finish}
                        </span>
                      )}
                    </div>
                  )}

                  <div className='flex items-center gap-2'>
                    <span className='font-bold text-sm text-tenant-price'>
                      ${currentPrice.toLocaleString()}
                    </span>
                    {hasDiscount && (
                      <span className='text-2xs text-gray-400 line-through'>
                        ${originalPrice!.toLocaleString()}
                      </span>
                    )}
                  </div>

                  {/* Categoría */}
                  <div className='flex items-center gap-1 mt-1'>
                    <span className='text-2xs text-gray-600'>
                      {product.category?.name || 'General'}
                    </span>
                  </div>
                </div>

                {/* Botón agregar */}
                <Button
                  size='sm'
                  onClick={() => handleAddToCart(product.id.toString())}
                  className='h-10 w-10 p-0 bg-yellow-400 hover:bg-yellow-500 text-black rounded-xl shadow-md hover:shadow-lg transition-all duration-200'
                >
                  <Plus className='w-5 h-5' />
                </Button>
              </div>
            )
          })
        )}
      </div>

      {/* Footer con enlace a ver más */}
      <div className='mt-4 pt-3 border-t border-gray-200'>
        <Button
          variant='ghost'
          size='sm'
          onClick={onClose}
          className='w-full text-xs text-gray-600 hover:text-gray-900'
        >
          Ver todos los productos →
        </Button>
      </div>
    </div>
  )
}

export default QuickAddSuggestions
