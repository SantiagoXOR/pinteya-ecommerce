'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { cn } from '@/lib/core/utils'
import { VariantActions } from './VariantActions'
import { Badge } from '../ui/Badge'
import { Skeleton } from '../ui/Skeleton'
import { Package, Image as ImageIcon, Star, AlertCircle, TrendingDown, TrendingUp, CheckCircle } from '@/lib/optimized-imports'

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

// Stock Badge Component - Mejorado
function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) {
    return <Badge variant="destructive" icon={AlertCircle} pulse size="sm">Sin stock</Badge>
  }

  if (stock <= 10) {
    return <Badge variant="warning" icon={TrendingDown} size="sm">{stock} un.</Badge>
  }

  if (stock >= 50) {
    return <Badge variant="success" icon={TrendingUp} size="sm">{stock} un.</Badge>
  }

  return <Badge variant="soft" size="sm">{stock} un.</Badge>
}

// Status Badge Component - Mejorado
function StatusBadge({ isActive }: { isActive: boolean }) {
  return isActive 
    ? <Badge variant="success" icon={CheckCircle} size="sm">Activo</Badge>
    : <Badge variant="soft" size="sm">Inactivo</Badge>
}

// Default Badge Component - Mejorado
function DefaultBadge({ isDefault }: { isDefault: boolean }) {
  if (!isDefault) return null
  return <Badge variant="warning" icon={Star} size="sm">Predeterminada</Badge>
}

// Loading Skeleton - Mejorado
function VariantsSkeleton() {
  return (
    <div className='space-y-4 p-4'>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className='flex items-center gap-4'>
          <Skeleton variant="rectangle" className='h-10 w-10' />
          <Skeleton className='h-4 flex-1' />
          <Skeleton className='h-4 w-20' />
          <Skeleton className='h-4 w-24' />
        </div>
      ))}
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
      <div className='px-6 py-4 bg-gray-50'>
          <VariantsSkeleton />
      </div>
    )
  }

  if (variants.length === 0) {
    return (
      <div className='px-6 py-4 bg-gray-50'>
          <div className='flex items-center justify-center text-gray-500 py-4'>
            <Package className='w-5 h-5 mr-2' />
            <span className='text-sm'>No hay variantes para este producto</span>
          </div>
      </div>
    )
  }

  return (
    <div data-testid={`expandable-variants-row-${productId}`} className='px-0 py-0 bg-gradient-to-b from-gray-50/80 to-white'>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className='px-6 py-4'
        >
          <div className='mb-4'>
            <div className='flex items-center justify-between'>
              <h4 className='text-sm font-semibold text-gray-900 flex items-center gap-2'>
                <Package className='h-4 w-4 text-primary' />
                Variantes del Producto
                <Badge variant="soft" size="sm">{variants.length}</Badge>
              </h4>
            </div>
          </div>

          {/* Tabla de variantes mejorada */}
          <div className='overflow-x-auto rounded-lg border border-gray-200'>
            <table className='min-w-full divide-y divide-gray-200 bg-white' data-testid="variant-table">
              <thead className='bg-gradient-to-r from-gray-50 to-gray-100/50'>
                <tr>
                  <th className='px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider'>
                    Imagen
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider'>
                    Color
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider'>
                    Medida
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider'>
                    Acabado
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider'>
                    Precio Lista
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider'>
                    Precio Venta
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider'>
                    Stock
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider'>
                    Estado
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider'>
                    SKU
                  </th>
                  <th className='px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider'>
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-100'>
                {variants.map((variant, index) => (
                  <motion.tr
                    key={variant.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.2 }}
                    className={cn(
                      'group hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-transparent transition-all duration-200',
                      !variant.is_active && 'opacity-50'
                    )}
                    data-testid="variant-row"
                  >
                    {/* Imagen con hover effect */}
                    <td className='px-4 py-3'>
                      <div className='relative w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center ring-2 ring-gray-200 group-hover:ring-primary/30 transition-all'>
                        {variant.image_url ? (
                          <Image
                            src={variant.image_url}
                            alt={variant.color_name || 'Variante'}
                            width={48}
                            height={48}
                            className='w-full h-full object-cover group-hover:scale-110 transition-transform duration-200'
                            unoptimized
                          />
                        ) : (
                          <ImageIcon className='w-6 h-6 text-gray-400' />
                        )}
                      </div>
                    </td>

                    {/* Color con badge */}
                    <td className='px-4 py-3'>
                      <div className='flex items-center gap-2'>
                        {variant.color_hex && (
                          <div
                            className='w-5 h-5 rounded-full border-2 border-white shadow-sm ring-1 ring-gray-200'
                            style={{ backgroundColor: variant.color_hex }}
                            title={variant.color_hex}
                          />
                        )}
                        <span className='text-sm font-medium text-gray-900'>
                          {variant.color_name || '-'}
                        </span>
                      </div>
                    </td>

                    {/* Medida */}
                    <td className='px-4 py-3'>
                      <Badge variant="outline" size="sm">
                        {variant.measure || '-'}
                      </Badge>
                    </td>

                    {/* Acabado */}
                    <td className='px-4 py-3 text-sm text-gray-700'>
                      {variant.finish || '-'}
                    </td>

                    {/* Precio Lista */}
                    <td className='px-4 py-3 text-sm font-medium text-gray-900'>
                      ${variant.price_list?.toLocaleString('es-AR') || '0'}
                    </td>

                    {/* Precio Venta */}
                    <td className='px-4 py-3 text-sm'>
                      {variant.price_sale ? (
                        <div className='flex flex-col'>
                          <span className='text-green-600 font-semibold'>
                            ${variant.price_sale.toLocaleString('es-AR')}
                          </span>
                          {variant.price_list && variant.price_sale < variant.price_list && (
                            <span className='text-xs text-green-600'>
                              -{Math.round(((variant.price_list - variant.price_sale) / variant.price_list) * 100)}%
                            </span>
                          )}
                        </div>
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
                      <div className='flex flex-wrap items-center gap-2'>
                        <StatusBadge isActive={variant.is_active} />
                        <DefaultBadge isDefault={variant.is_default} />
                      </div>
                    </td>

                    {/* SKU */}
                    <td className='px-4 py-3'>
                      <code className='text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded font-mono'>
                        {variant.aikon_id}
                      </code>
                    </td>

                    {/* Acciones */}
                    <td className='px-4 py-3 text-right'>
                      <VariantActions
                        variant={variant}
                        productId={productId}
                        onEdit={onEditVariant || (() => {})}
                      />
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
    </div>
  )
}

