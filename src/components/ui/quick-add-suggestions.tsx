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

        // Obtener productos con descuento (populares) limitados a 3
        const response = await getProducts(
          {
            limit: 3,
            sortBy: 'created_at',
            sortOrder: 'desc',
          },
          abortController.signal
        )

        // Verificar si el componente aún está montado
        if (abortController.signal.aborted) {
          return
        }

        if (response.success && response.data) {
          setProducts(response.data)
        } else {
          setError('No se pudieron cargar los productos')
        }
      } catch (err) {
        // Solo mostrar error si no fue cancelado y no es AbortError
        if (!abortController.signal.aborted && err instanceof Error && err.name !== 'AbortError') {
          console.error('Error fetching popular products:', err)
          setError('Error al cargar productos populares')
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
      
      // Servicio unificado: normaliza y agrega
      addProduct(
        {
          id: product.id,
          name: product.name,
          price: product.price,
          discounted_price: product.discounted_price || product.price,
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
          <h4 className='font-bold text-gray-900 text-sm'>Productos Populares</h4>
          <p className='text-xs text-gray-600'>Agrega rápidamente a tu carrito</p>
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
            const currentPrice = product.discounted_price || product.price
            const originalPrice = product.discounted_price ? product.price : null
            const hasDiscount = originalPrice && currentPrice < originalPrice

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

                  <div className='flex items-center gap-2'>
                    <span className='font-bold text-sm' style={{ color: '#c2410b' }}>
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
