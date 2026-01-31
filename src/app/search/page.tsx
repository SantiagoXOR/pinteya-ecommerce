'use client'

// Forzar renderizado dinámico para evitar problemas con prerendering
export const dynamic = 'force-dynamic'
import React, { useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { CommercialProductCard } from '@/components/ui/product-card-commercial'
import { useDesignSystemConfig, shouldShowFreeShipping as dsShouldShowFreeShipping } from '@/lib/design-system-config'
import { Search, AlertCircle, Package } from '@/lib/optimized-imports'
import { ProductGridSkeleton } from '@/components/ui/skeletons'
import { Button } from '@/components/ui/button'
import { useCartUnified } from '@/hooks/useCartUnified'
import { toast } from '@/components/ui/use-toast'
import { getMainImage } from '@/lib/adapters/product-adapter'
import { useTenantSafe } from '@/contexts/TenantContext'
import { getTenantWhatsAppNumber } from '@/lib/tenant/tenant-whatsapp'
import { SearchWithFilters } from '@/components/Search/SearchWithFilters'
import { SearchSuggestionsCarousel } from '@/components/Search/SearchSuggestionsCarousel'
import type { ExtendedProduct } from '@/lib/adapters/productAdapter'

export default function SearchPage() {
  const tenant = useTenantSafe()
  const searchParams = useSearchParams()
  const { addProduct } = useCartUnified()
  const query = searchParams.get('search') || ''
  const category = searchParams.get('category')
  const config = useDesignSystemConfig()

  const [sortBy, setSortBy] = useState<'relevance' | 'price-asc' | 'price-desc' | 'name'>(
    'relevance'
  )

  const whatsappNumber = getTenantWhatsAppNumber(tenant)
  const whatsappMessage = `Hola, busqué "${query}" y no encontré lo que necesito. ¿Me pueden ayudar?`
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`

  const sortProductsFn = (items: ExtendedProduct[], sort: string) => {
    const sorted = [...items]
    switch (sort) {
      case 'price-asc':
        return sorted.sort((a, b) => (a.price || 0) - (b.price || 0))
      case 'price-desc':
        return sorted.sort((a, b) => (b.price || 0) - (a.price || 0))
      case 'name':
        return sorted.sort((a, b) => (a.name || a.title || '').localeCompare(b.name || b.title || ''))
      default:
        return sorted
    }
  }

  // Sin query de búsqueda
  if (!query.trim()) {
    return (
      <div className='min-h-screen pt-6 pb-8 scroll-mt-20'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center py-12'>
            <Search className='w-16 h-16 text-gray-400 mx-auto mb-4' />
            <h1 className='text-2xl font-bold text-gray-900 mb-2'>Busca productos de pinturería</h1>
            <p className='text-gray-600'>
              Usa el buscador para encontrar pinturas, herramientas y accesorios
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <SearchWithFilters searchQuery={query}>
      {({ products, loading, error, totalResults, filtersBar }) => {
        const sortedProducts = sortProductsFn(products, sortBy)
        return (
    <div className='min-h-screen pt-6 pb-8 overflow-x-hidden scroll-mt-20'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Filtros */}
        {filtersBar}

        {/* Header de resultados */}
        <div className='mb-8'>
          <div className='flex items-center gap-3 mb-4'>
            <Search className='w-6 h-6 text-blaze-orange-400' />
            <h1 className='text-2xl font-bold text-white'>Resultados de búsqueda</h1>
          </div>

          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
            <div>
              <p className='text-lg text-white/90'>
                {loading ? (
                  <span className='flex items-center gap-2'>
                    <div className='animate-spin w-4 h-4 border-2 border-blaze-orange-400 border-t-transparent rounded-full' />
                    Buscando productos...
                  </span>
                ) : (
                  <>
                    Búsqueda: <span className='font-semibold text-white'>"{query}"</span>
                  </>
                )}
              </p>
              {category && (
                <p className='text-sm text-white/80'>
                  Categoría: <span className='font-medium'>{category}</span>
                </p>
              )}
            </div>

            <div className='flex items-center gap-4'>
              <div className='text-sm text-white/80'>
                {loading ? (
                  <span>Cargando...</span>
                ) : totalResults > 0 ? (
                  <span>
                    {totalResults} producto{totalResults !== 1 ? 's' : ''} encontrado
                    {totalResults !== 1 ? 's' : ''}
                  </span>
                ) : (
                  <span>Sin resultados</span>
                )}
              </div>

              {!loading && totalResults > 0 && (
                <div className='flex items-center gap-3'>
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as any)}
                    className='px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blaze-orange-500 focus:border-blaze-orange-500'
                  >
                    <option value='relevance'>Más relevante</option>
                    <option value='price-asc'>Precio: menor a mayor</option>
                    <option value='price-desc'>Precio: mayor a menor</option>
                    <option value='name'>Nombre A-Z</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <ProductGridSkeleton
            count={12}
            variant='card'
            className='grid-cols-2 md:grid-cols-2 lg:grid-cols-3'
          />
        ) : error ? (
          // Estado de error
          <div className='text-center py-12'>
            <AlertCircle className='w-16 h-16 text-red-400 mx-auto mb-4' />
            <h2 className='text-xl font-semibold text-white mb-2'>Error en la búsqueda</h2>
            <p className='text-white/80 mb-6'>
              {error instanceof Error ? error.message : error?.toString() || 'Error desconocido'}
            </p>
            <Button
              onClick={() => window.location.reload()}
              className='bg-blaze-orange-600 hover:bg-blaze-orange-700 text-white'
            >
              Intentar nuevamente
            </Button>
          </div>
        ) : sortedProducts.length === 0 ? (
          // Sin resultados
          <div className='text-center py-12'>
            <Package className='w-16 h-16 text-white/70 mx-auto mb-4' />
            <h2 className='text-xl font-semibold text-white mb-2'>
              No se encontraron productos
            </h2>
            <p className='text-white/80 mb-6'>
              No hay productos que coincidan con tu búsqueda "{query}"
            </p>
            <div className='space-y-2 text-sm text-white/70'>
              <p className='text-white/90 font-medium'>Sugerencias:</p>
              <ul className='list-disc list-inside space-y-1'>
                <li>Verifica la ortografía</li>
                <li>Usa términos más generales</li>
                <li>Prueba con sinónimos</li>
                <li>Busca por marca o categoría</li>
              </ul>
            </div>
            <div className='mt-6 flex flex-col sm:flex-row gap-4 justify-center'>
              <a
                href={whatsappUrl}
                target='_blank'
                rel='noopener noreferrer'
                className='bg-blaze-orange-600 hover:bg-blaze-orange-700 text-white px-6 py-2 rounded-lg transition-colors inline-block text-center'
              >
                Contactar asesor
              </a>
              <a
                href='/products'
                className='border border-blaze-orange-600 text-blaze-orange-600 hover:bg-blaze-orange-50 px-6 py-2 rounded-lg transition-colors inline-block text-center'
              >
                Ver todos los productos
              </a>
            </div>
            <SearchSuggestionsCarousel searchQuery={query} maxProducts={12} className='mt-8' />
          </div>
        ) : (
          <div className='grid grid-cols-1 xsm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 w-full'>
            {sortedProducts.map(product => {
              const hasDiscount =
                typeof product.discounted_price === 'number' &&
                product.discounted_price > 0 &&
                product.discounted_price < product.price
              const currentPrice = hasDiscount ? (product.discounted_price as number) : product.price
              const originalPrice = hasDiscount ? product.price : undefined
              const discount = hasDiscount
                ? `${Math.round((1 - (product.discounted_price as number) / product.price) * 100)}%`
                : undefined
              const image = getMainImage(product)
              
              // Obtener categoría del producto: priorizar category_name aplanado, luego category.name, luego categories[0].category.name
              const productCategory = (product as any).category_name || product.category?.name || (product as any).categories?.[0]?.category?.name

              return (
                <CommercialProductCard
                  key={product.id}
                  productId={String(product.id)}
                  title={product.name || product.title}
                  slug={product.slug || (product.name || product.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}
                  brand={product.brand}
                  category={productCategory}
                  image={image}
                  price={currentPrice}
                  originalPrice={originalPrice}
                  discount={discount}
                  stock={product.stock ?? 0}
                  // ✅ NO pasar color/medida legacy - usar solo variantes para badges
                  // color={(product as any).color}
                  // medida={(product as any).medida}
                  shippingText={product.stock > 0 ? 'En stock' : 'Sin stock'}
                  {...(() => {
                    const autoFree = dsShouldShowFreeShipping(currentPrice, config)
                    return { freeShipping: autoFree }
                  })()}
                  installments={
                    currentPrice > 0
                      ? {
                          quantity: 3,
                          amount: Math.round(currentPrice / 3),
                          interestFree: true,
                        }
                      : undefined
                  }
                  onAddToCart={() => {
                    try {
                      // Usar el hook unificado para normalizar y agregar al carrito
                      addProduct(
                        {
                          id: product.id,
                          title: product.name || product.title,
                          price: product.price,
                          discounted_price:
                            (product as any).discounted_price ?? currentPrice ?? product.price,
                          images: Array.isArray((product as any).images)
                            ? (product as any).images
                            : [image].filter(Boolean),
                        },
                        {
                          quantity: 1,
                          attributes: {
                            color: (product as any).color,
                            medida: (product as any).medida,
                            finish: (product as any).finish,
                          },
                          image,
                        }
                      )
                      toast({
                        title: 'Producto agregado',
                        description: `${product.name || product.title} se agregó al carrito`,
                      })
                    } catch (error) {
                      toast({
                        title: 'Error',
                        description: 'No se pudo agregar el producto al carrito',
                        variant: 'destructive',
                      })
                    }
                  }}
                  // Variantes y badges inteligentes
                  variants={(product as any).variants || []}
                  description={(product as any).description || ''}
                  badgeConfig={{
                    showCapacity: true,
                    showColor: true,
                    showFinish: true,
                    // Para el grid de búsqueda priorizamos medida, acabado y colores
                    showMaterial: false,
                    showGrit: false,
                    showDimensions: false,
                    showWeight: false,
                    showBrand: false,
                    // Aumentamos el límite para permitir medida + acabado + varios colores
                    maxBadges: 6,
                  }}
                  className='bg-white shadow-sm hover:shadow-md transition-shadow'
                />
              )
            })}
          </div>
        )}

        {sortedProducts.length > 0 && (
          <SearchSuggestionsCarousel searchQuery={query} maxProducts={12} className='mt-8' />
        )}

        {!loading && !error && sortedProducts.length > 0 && totalResults > 50 && (
          <div className='flex justify-center mt-12'>
            <div className='flex items-center gap-2'>
              <Button variant='outline' disabled>
                Anterior
              </Button>
              <Button variant='outline' className='bg-blaze-orange-500 text-white'>
                1
              </Button>
              <Button variant='outline'>2</Button>
              <Button variant='outline'>3</Button>
              <Button variant='outline'>Siguiente</Button>
            </div>
          </div>
        )}

        {sortedProducts.length > 0 && (
          <div className='mt-12 text-center'>
            <div className='bg-white rounded-lg p-6 shadow-sm'>
              <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                ¿No encontraste lo que buscabas?
              </h3>
              <p className='text-gray-600 mb-4'>
                Contáctanos y te ayudamos a encontrar el producto perfecto
              </p>
              <div className='flex flex-col sm:flex-row gap-4 justify-center'>
                <a
                  href={whatsappUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='bg-blaze-orange-600 hover:bg-blaze-orange-700 text-white px-6 py-2 rounded-lg transition-colors'
                >
                  Contactar asesor
                </a>
                <a
                  href='/products'
                  className='border border-blaze-orange-600 text-blaze-orange-600 hover:bg-blaze-orange-50 px-6 py-2 rounded-lg transition-colors inline-block text-center'
                >
                  Ver todos los productos
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
        )
      }}
    </SearchWithFilters>
  )
}
