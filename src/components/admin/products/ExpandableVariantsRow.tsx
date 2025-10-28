'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Image from 'next/image'
import { cn } from '@/lib/core/utils'
import { VariantActions } from './VariantActions'
import { Package, Image as ImageIcon } from 'lucide-react'

interface ProductVariant {
  id: number
  product_id: number
  aikon_id: string
  variant_slug: string
  color_name?: string
  color_hex?: string
  measure?: string
  finish?: string
  price_list: number
  price_sale?: number
  stock: number
  is_active: boolean
  is_default: boolean
  image_url?: string
  metadata?: Record<string, any>
}

interface ExpandableVariantsRowProps {
  productId: string
  onEditVariant?: (variant: ProductVariant) => void
}

// Stock Badge Component
function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) {
    return (
      <span className='inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full'>
        Sin stock
      </span>
    )
  }

  if (stock <= 10) {
    return (
      <span className='inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full'>
        Stock bajo ({stock})
      </span>
    )
  }

  return <span className='text-sm text-gray-900'>{stock}</span>
}

// Status Badge Component
function StatusBadge({ isActive }: { isActive: boolean }) {
  if (isActive) {
    return (
      <span className='inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full'>
        Activo
      </span>
    )
  }

  return (
    <span className='inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full'>
      Inactivo
    </span>
  )
}

// Default Badge Component
function DefaultBadge({ isDefault }: { isDefault: boolean }) {
  if (!isDefault) return null

  return (
    <span className='inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full'>
      ★ Default
    </span>
  )
}

// Loading Skeleton
function VariantsSkeleton() {
  return (
    <div className='animate-pulse space-y-3'>
      <div className='h-4 bg-gray-200 rounded w-1/4'></div>
      <div className='h-4 bg-gray-200 rounded w-1/2'></div>
      <div className='h-4 bg-gray-200 rounded w-1/3'></div>
    </div>
  )
}

export function ExpandableVariantsRow({
  productId,
  onEditVariant,
}: ExpandableVariantsRowProps) {
  // Fetch variantes desde BD
  const { data: variantsData, isLoading } = useQuery({
    queryKey: ['product-variants', productId],
    queryFn: async () => {
      const res = await fetch(`/api/products/${productId}/variants`)
      const json = await res.json()
      return json.data || []
    },
    enabled: !!productId,
  })

  const variants: ProductVariant[] = variantsData || []

  if (isLoading) {
    return (
      <tr>
        <td colSpan={100} className='px-6 py-4 bg-gray-50'>
          <VariantsSkeleton />
        </td>
      </tr>
    )
  }

  if (variants.length === 0) {
    return (
      <tr>
        <td colSpan={100} className='px-6 py-4 bg-gray-50'>
          <div className='flex items-center justify-center text-gray-500 py-4'>
            <Package className='w-5 h-5 mr-2' />
            <span className='text-sm'>No hay variantes para este producto</span>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <tr data-testid={`expandable-variants-row-${productId}`}>
      <td colSpan={100} className='px-0 py-0 bg-gray-50'>
        <div className='px-6 py-4'>
          <div className='mb-3'>
            <h4 className='text-sm font-semibold text-gray-900'>
              Variantes del Producto ({variants.length})
            </h4>
          </div>

          {/* Tabla de variantes con scroll horizontal en móvil */}
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200 bg-white rounded-lg shadow-sm' data-testid="variant-table">
              <thead className='bg-gray-100'>
                <tr>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider'>
                    Imagen
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider'>
                    Color
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider'>
                    Medida
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider'>
                    Acabado
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider'>
                    Precio Lista
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider'>
                    Precio Venta
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider'>
                    Stock
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider'>
                    Estado
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider'>
                    SKU
                  </th>
                  <th className='px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider'>
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {variants.map((variant) => (
                  <tr
                    key={variant.id}
                    className={cn(
                      'hover:bg-gray-50 transition-colors',
                      !variant.is_active && 'opacity-50'
                    )}
                    data-testid="variant-row"
                  >
                    {/* Imagen */}
                    <td className='px-4 py-3'>
                      <div className='w-10 h-10 bg-gray-100 rounded overflow-hidden flex items-center justify-center'>
                        {variant.image_url ? (
                          <Image
                            src={variant.image_url}
                            alt={variant.color_name || 'Variante'}
                            width={40}
                            height={40}
                            className='w-full h-full object-cover'
                            unoptimized
                          />
                        ) : (
                          <ImageIcon className='w-5 h-5 text-gray-400' />
                        )}
                      </div>
                    </td>

                    {/* Color */}
                    <td className='px-4 py-3'>
                      <div className='flex items-center space-x-2'>
                        {variant.color_hex && (
                          <div
                            className='w-4 h-4 rounded-full border border-gray-300'
                            style={{ backgroundColor: variant.color_hex }}
                            title={variant.color_hex}
                          />
                        )}
                        <span className='text-sm text-gray-900'>
                          {variant.color_name || '-'}
                        </span>
                      </div>
                    </td>

                    {/* Medida */}
                    <td className='px-4 py-3 text-sm text-gray-900'>
                      {variant.measure || '-'}
                    </td>

                    {/* Acabado */}
                    <td className='px-4 py-3 text-sm text-gray-900'>
                      {variant.finish || '-'}
                    </td>

                    {/* Precio Lista */}
                    <td className='px-4 py-3 text-sm text-gray-900'>
                      ${variant.price_list?.toLocaleString('es-AR') || '0'}
                    </td>

                    {/* Precio Venta */}
                    <td className='px-4 py-3 text-sm'>
                      {variant.price_sale ? (
                        <span className='text-green-600 font-medium'>
                          ${variant.price_sale.toLocaleString('es-AR')}
                        </span>
                      ) : (
                        <span className='text-gray-400'>-</span>
                      )}
                    </td>

                    {/* Stock */}
                    <td className='px-4 py-3'>
                      <StockBadge stock={variant.stock} />
                    </td>

                    {/* Estado */}
                    <td className='px-4 py-3'>
                      <div className='flex items-center space-x-2'>
                        <StatusBadge isActive={variant.is_active} />
                        <DefaultBadge isDefault={variant.is_default} />
                      </div>
                    </td>

                    {/* SKU */}
                    <td className='px-4 py-3 text-sm text-gray-500 font-mono'>
                      {variant.aikon_id}
                    </td>

                    {/* Acciones */}
                    <td className='px-4 py-3 text-right'>
                      <VariantActions
                        variant={variant}
                        productId={productId}
                        onEdit={onEditVariant || (() => {})}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </td>
    </tr>
  )
}

