'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { AdminDataTable } from '../ui/AdminDataTable'
import { ProductFilters } from './ProductFilters'
import { ProductActions, ProductRowActions } from './ProductActions'
import { useProductList } from '@/hooks/admin/useProductList'
import { ExpandableVariantsRow } from './ExpandableVariantsRow'
import { Skeleton, TableSkeleton } from '../ui/Skeleton'
import { EmptyState } from '../ui/EmptyState'
import { Badge } from '../ui/Badge'
import { cn } from '@/lib/core/utils'
import { Package, AlertCircle, CheckCircle, Clock, ChevronDown, ChevronRight, TrendingDown, TrendingUp, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

const resolveImageSource = (payload: any): string | null => {
  const normalize = (value?: string | null) => {
    if (!value || typeof value !== 'string') {
      return null
    }
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  }

  if (!payload) {
    return null
  }

  if (typeof payload === 'string') {
    const trimmed = payload.trim()
    if (!trimmed) return null

    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        return resolveImageSource(JSON.parse(trimmed))
      } catch {
        return normalize(trimmed)
      }
    }

    return normalize(trimmed)
  }

  if (Array.isArray(payload)) {
    return normalize(payload[0])
  }

  if (typeof payload === 'object') {
    return (
      normalize(payload.preview) ||
      normalize(payload.previews?.[0]) ||
      normalize(payload.thumbnails?.[0]) ||
      normalize(payload.gallery?.[0]) ||
      normalize(payload.main) ||
      normalize(payload.url)
    )
  }

  return null
}

interface Product {
  id: string
  name: string
  description: string
  price: number
  stock: number
  category_id: number // ✅ CORREGIDO: number (no string) - alineado con BD y schemas Zod
  category_name?: string
  categories?: Array<{ id: number; name: string; slug: string }> // ✅ NUEVO: Múltiples categorías
  image_url?: string
  images?: {
    main: string
    gallery: string[]
    previews: string[]
    thumbnails: string[]
  }
  status: 'active' | 'inactive' | 'draft'
  created_at: string
  updated_at: string
}

interface Category {
  id: number
  name: string
}

interface ProductListProps {
  products: Product[]
  isLoading: boolean
  error: any
  filters?: any
  categories?: Category[] // ✅ AGREGADO: Array de categorías para filtros
  updateFilters?: (filters: any) => void
  resetFilters?: () => void
  pagination?: {
    currentPage: number
    totalPages: number
    totalItems: number
    goToPage: (page: number) => void
    nextPage: () => void
    prevPage: () => void
    hasNext?: boolean
    hasPrev?: boolean
  }
  onProductAction?: (action: string, productId: string) => void
  className?: string
}

// Status Badge Component - Mejorado con animaciones
function StatusBadge({ status }: { status: Product['status'] }) {
  const statusConfig = {
    active: {
      label: 'Activo',
      icon: CheckCircle,
      variant: 'success' as const,
      pulse: true,
    },
    inactive: {
      label: 'Inactivo',
      icon: AlertCircle,
      variant: 'destructive' as const,
      pulse: false,
    },
    draft: {
      label: 'Borrador',
      icon: Clock,
      variant: 'warning' as const,
      pulse: false,
    },
  }

  const config = statusConfig[status] || {
    label: 'Estado',
    icon: Package,
    variant: 'soft' as const,
    pulse: false,
  }

  return (
    <Badge 
      variant={config.variant} 
      icon={config.icon}
      pulse={config.pulse}
      className="animate-fade-in"
    >
      {config.label}
    </Badge>
  )
}

// Stock Badge Component - Mejorado con indicadores visuales
function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) {
    return (
      <Badge variant="destructive" icon={AlertCircle} pulse>
        Sin stock
      </Badge>
    )
  }

  if (stock <= 10) {
    return (
      <Badge variant="warning" icon={TrendingDown}>
        {stock} unidades
      </Badge>
    )
  }

  if (stock >= 50) {
    return (
      <Badge variant="success" icon={TrendingUp}>
        {stock} unidades
      </Badge>
    )
  }

  return (
    <Badge variant="soft">
      {stock} unidades
    </Badge>
  )
}

export function ProductList({ 
  products = [],
  isLoading = false,
  error = null,
  filters = {},
  categories = [], // ✅ AGREGADO: Recibir categorías desde el padre
  updateFilters = () => {},
  resetFilters = () => {},
  pagination = {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    goToPage: () => {},
    nextPage: () => {},
    prevPage: () => {},
  },
  onProductAction,
  className 
}: ProductListProps) {
  const router = useRouter()
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([])
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  // ✅ Estado de sorting
  const [sortColumn, setSortColumn] = useState<string>(filters.sort_by || 'created_at')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(filters.sort_order || 'desc')

  // Usar datos de props (no hook interno)
  const total = pagination.totalItems
  const currentPage = pagination.currentPage
  const currentPageSize = filters.limit || 25
  const params = { filters }
  const goToPage = pagination.goToPage
  const changePageSize = (size: number) => updateFilters({ limit: size, page: 1 })
  const clearFilters = resetFilters
  const deleteProduct = () => {}
  const bulkDelete = () => {}
  const isDeleting = false
  const isBulkDeleting = false

  // ✅ Handler para sorting por columnas
  const handleSort = (columnKey: string) => {
    const newDirection = sortColumn === columnKey && sortDirection === 'desc' ? 'asc' : 'desc'
    setSortColumn(columnKey)
    setSortDirection(newDirection)
    updateFilters({ sort_by: columnKey, sort_order: newDirection })
  }

  // ✅ Renderizar ícono de sort
  const renderSortIcon = (columnKey: string) => {
    if (sortColumn !== columnKey) {
      return <ArrowUpDown className='w-3.5 h-3.5 opacity-0 group-hover:opacity-50 transition-opacity' />
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className='w-3.5 h-3.5 text-primary' />
      : <ArrowDown className='w-3.5 h-3.5 text-primary' />
  }

  // Table columns configuration
  const columns = [
    {
      key: 'images',
      title: 'Imagen',
      width: '100px',
      render: (images: any, product: Product) => {
        const imageUrl = resolveImageSource(product.image_url || images)
        
        return (
          <div className='w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center shadow-sm'>
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={product.name}
                width={64}
                height={64}
                className='object-cover w-full h-full'
                unoptimized
              />
            ) : (
              <Package className='w-8 h-8 text-gray-400' />
            )}
          </div>
        )
      },
    },
    {
      key: 'name',
      title: 'Producto',
      sortable: true,
      render: (name: string, product: Product) => (
        <div className='max-w-sm'>
          <div className='font-semibold text-gray-900 text-base mb-1'>{name}</div>
          <div
            className='text-sm text-gray-600 overflow-hidden leading-relaxed'
            style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
          >
            {product.description || 'Sin descripción disponible'}
          </div>
        </div>
      ),
    },
    {
      key: 'id',
      title: 'ID',
      sortable: true,
      width: '70px',
      render: (id: number) => (
        <span className='text-sm text-gray-600 font-mono'>#{id}</span>
      ),
    },
    {
      key: 'slug',
      title: 'Slug',
      render: (slug: string) => (
        <span className='text-xs text-gray-500 font-mono max-w-[150px] truncate block' title={slug}>
          {slug || '-'}
        </span>
      ),
    },
    {
      key: 'variant_count',
      title: 'Variantes',
      sortable: true,
      render: (count: number, product: Product) => {
        const isExpanded = expandedRows.has(product.id)
        return (
          <button
            type='button'
            onClick={(e) => {
              e.stopPropagation()
              toggleExpand(product.id)
            }}
            className='flex items-center space-x-2 hover:bg-blue-50 px-2 py-1 rounded transition-colors'
          >
            {count > 0 ? (
              <>
                <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
                  {count} var.
                </span>
                {isExpanded ? (
                  <ChevronDown className='w-4 h-4 text-blue-600' />
                ) : (
                  <ChevronRight className='w-4 h-4 text-gray-400' />
                )}
              </>
            ) : (
              <span className='text-sm text-gray-400'>-</span>
            )}
          </button>
        )
      },
    },
    {
      key: 'categories',
      title: 'Categorías',
      sortable: false,
      render: (_: any, product: Product) => {
        const categories = product.categories || []
        
        if (categories.length === 0) {
          return <span className='text-sm text-gray-500'>Sin categorías</span>
        }
        
        return (
          <div className='flex flex-wrap gap-1'>
            {categories.map(cat => (
              <Badge 
                key={cat.id} 
                variant='soft'
                className='text-xs'
              >
                {cat.name}
              </Badge>
            ))}
          </div>
        )
      },
    },
    {
      key: 'brand',
      title: 'Marca',
      sortable: true,
      render: (brand: string) => (
        <span className='text-sm text-gray-700'>{brand || '-'}</span>
      ),
    },
    {
      key: 'medida',
      title: 'Medida',
      sortable: true,
      render: (medida: string) => (
        <span className='text-sm text-gray-700 font-medium'>{medida || '-'}</span>
      ),
    },
    {
      key: 'price',
      title: 'Precio',
      align: 'right' as const,
      sortable: true,
      render: (price: number) => (
        <div className='text-right'>
          <span className='font-bold text-lg text-green-600'>${price.toLocaleString('es-AR')}</span>
        </div>
      ),
    },
    {
      key: 'discounted_price',
      title: 'Precio Desc.',
      align: 'right' as const,
      sortable: true,
      render: (discountedPrice: number, product: Product) => (
        discountedPrice ? (
          <div className='text-right'>
            <span className='font-bold text-lg text-green-600'>
              ${Number(discountedPrice).toLocaleString('es-AR')}
            </span>
            <div className='text-xs text-green-600'>
              {Math.round(((product.price - Number(discountedPrice)) / product.price) * 100)}% OFF
            </div>
          </div>
        ) : (
          <span className='text-gray-400 text-sm'>-</span>
        )
      ),
    },
    {
      key: 'stock',
      title: 'Stock',
      align: 'center' as const,
      sortable: true,
      render: (stock: number) => <StockBadge stock={stock} />,
    },
    {
      key: 'color',
      title: 'Color',
      render: (color: string) => (
        <span className='text-sm text-gray-700'>{color || '-'}</span>
      ),
    },
    {
      key: 'aikon_id',
      title: 'Código Aikon',
      render: (aikonId: string) => (
        <span className='text-xs text-gray-500 font-mono'>{aikonId || '-'}</span>
      ),
    },
    {
      key: 'status',
      title: 'Estado',
      align: 'center' as const,
      sortable: true,
      render: (status: Product['status']) => <StatusBadge status={status} />,
    },
    {
      key: 'created_at',
      title: 'Creado',
      sortable: true,
      render: (createdAt: string) => (
        <span className='text-sm text-gray-500'>
          {new Date(createdAt).toLocaleDateString('es-AR')}
        </span>
      ),
    },
    {
      key: 'updated_at',
      title: 'Actualizado',
      sortable: true,
      render: (updatedAt: string) => (
        <span className='text-sm text-gray-500'>
          {new Date(updatedAt).toLocaleDateString('es-AR')}
        </span>
      ),
    },
    {
      key: 'actions',
      title: 'Acciones',
      width: '60px',
      render: (_: any, product: Product) => (
        <ProductRowActions
          product={product}
          onView={id => router.push(`/admin/products/${id}`)}
          onEdit={id => router.push(`/admin/products/${id}/edit`)}
          onDelete={handleDeleteProduct}
          onDuplicate={handleDuplicateProduct}
          isLoading={isDeleting}
        />
      ),
    },
  ]

  // Event handlers
  const handleDeleteProduct = async (productId: string) => {
    // TODO: Implement actual delete functionality
    console.log('Delete product:', productId)
  }

  const handleBulkDelete = async (productIds: string[]) => {
    // TODO: Implement bulk delete
    console.log('Bulk delete products:', productIds)
    setSelectedProducts([])
  }

  const handleDuplicateProduct = (productId: string) => {
    // TODO: Implement product duplication
    console.log('Duplicate product:', productId)
  }

  const handleCreateProduct = () => {
    router.push('/admin/products/new')
  }

  const handleExportProducts = async (format: 'csv' | 'xlsx' | 'json') => {
    try {
      console.log(`📊 Exportando productos en formato ${format}...`)
      
      // Construir URL con filtros actuales
      const params = new URLSearchParams({
        format: format,
        ...(filters.category && { category_id: filters.category }),
        ...(filters.brand && { brand: filters.brand }),
        ...(filters.status && filters.status !== 'all' && { status: filters.status }),
        ...(filters.stock_status && filters.stock_status !== 'all' && { stock_status: filters.stock_status }),
      })

      // Hacer request a la API
      const response = await fetch(`/api/admin/products/export?${params.toString()}`)
      
      console.log(`📡 Response status: ${response.status} ${response.statusText}`)
      console.log(`📡 Content-Type: ${response.headers.get('Content-Type')}`)
      
      if (!response.ok) {
        throw new Error(`Error al exportar: ${response.statusText}`)
      }

      // Obtener el blob
      const blob = await response.blob()
      console.log(`📦 Blob size: ${blob.size} bytes, type: ${blob.type}`)
      
      if (blob.size === 0) {
        throw new Error('El archivo descargado está vacío')
      }
      
      // Obtener el filename del header Content-Disposition o generar uno
      const contentDisposition = response.headers.get('Content-Disposition')
      const filenameMatch = contentDisposition?.match(/filename="([^"]+)"/) || contentDisposition?.match(/filename=([^;\s]+)/)
      const filename = filenameMatch ? filenameMatch[1] : `productos-pinteya-${new Date().toISOString().split('T')[0]}.${format}`

      console.log(`📄 Filename: ${filename}`)

      // Crear link de descarga y triggerearlo
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      console.log(`✅ Exportación completada: ${filename}`)
    } catch (error) {
      console.error('❌ Error al exportar productos:', error)
      throw error
    }
  }

  const handleImportProducts = () => {
    // TODO: Implement import functionality
    console.log('Import products')
  }

  const handleRowClick = (
    event: React.MouseEvent<HTMLTableRowElement>,
    product: Product
  ) => {
    if (event.defaultPrevented) return

    const target = event.target as HTMLElement
    if (
      target.closest(
        'button, a, input, select, textarea, label, [role="button"], [data-interactive="true"]'
      )
    ) {
      return
    }

    router.push(`/admin/products/${product.id}`)
  }

  const toggleExpand = (productId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(productId)) {
        newSet.delete(productId)
      } else {
        newSet.add(productId)
      }
      return newSet
    })
  }

  // Pagination configuration
  const paginationConfig = {
    page: currentPage,
    pageSize: currentPageSize,
    total,
    onPageChange: goToPage,
    onPageSizeChange: changePageSize,
  }

  // Error state mejorado
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn('space-y-6', className)}
      >
        <ProductFilters
          filters={params.filters || {}}
          onFiltersChange={updateFilters}
          onClearFilters={clearFilters}
          categories={[]}
        />
        <EmptyState
          variant="error"
          title="Error al cargar productos"
          description={error.message || 'Ocurrió un error inesperado. Por favor, intenta de nuevo.'}
          action={{
            label: 'Reintentar',
            onClick: () => window.location.reload()
          }}
        />
      </motion.div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Filters */}
      <ProductFilters
        filters={params.filters || {}}
        onFiltersChange={updateFilters}
        onClearFilters={clearFilters}
        categories={categories} // ✅ Pasar categorías reales desde el padre
      />

      {/* Actions */}
      <ProductActions
        selectedProducts={selectedProducts}
        onCreateProduct={handleCreateProduct}
        onBulkDelete={handleBulkDelete}
        onExportProducts={handleExportProducts}
        onImportProducts={handleImportProducts}
        isLoading={isDeleting || isBulkDeleting}
      />

      {/* Modern Table with Improved UX */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className='bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden'
      >
        <div className='overflow-x-auto'>
          <table className='min-w-full divide-y divide-gray-100' data-testid="products-table">
            {/* Sticky Header con blur backdrop y sorting */}
            <thead className='bg-gradient-to-r from-gray-50/95 to-gray-100/95 sticky top-0 z-10 backdrop-blur-sm border-b border-gray-200'>
              <tr>
                {columns.slice(0, -1).map((column, index) => (
                  <th
                    key={`header-${column.key.toString()}-${index}`}
                    className={cn(
                      'px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider',
                      column.sortable && 'cursor-pointer select-none group hover:bg-gray-100/50 transition-colors'
                    )}
                    style={{ width: column.width }}
                    onClick={() => column.sortable && handleSort(column.key.toString())}
                  >
                    <div className='flex items-center gap-2'>
                      <span>{column.title}</span>
                      {column.sortable && renderSortIcon(column.key.toString())}
                    </div>
                  </th>
                ))}
                <th className='px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider'>
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className='bg-white divide-y divide-gray-50'>
              {isLoading ? (
                /* Skeleton Loading State */
                <>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className='animate-pulse'>
                      {columns.map((column, colIndex) => (
                        <td 
                          key={`skeleton-${i}-${colIndex}`}
                          className='px-6 py-4'
                        >
                          <Skeleton className='h-4 w-full' />
                        </td>
                      ))}
                    </tr>
                  ))}
                </>
              ) : products.length === 0 ? (
                /* Empty State Mejorado */
                <tr>
                  <td colSpan={columns.length} className='px-6 py-12'>
                    <EmptyState
                      title="No hay productos"
                      description={
                        Object.keys(filters).length > 0
                          ? 'No se encontraron productos con los filtros aplicados. Intenta ajustar los criterios de búsqueda.'
                          : 'Comienza creando tu primer producto para verlo aquí.'
                      }
                      action={
                        Object.keys(filters).length > 0
                          ? { label: 'Limpiar filtros', onClick: clearFilters }
                          : { label: 'Crear producto', onClick: handleCreateProduct }
                      }
                    />
                  </td>
                </tr>
              ) : (
                /* Productos con animaciones */
                <>
                  {products.map((product, index) => (
                    <React.Fragment key={product.id}>
                      {/* Fila principal del producto con hover mejorado */}
                      <tr
                        onClick={(event) => handleRowClick(event, product)}
                        className={cn(
                          'group cursor-pointer transition-all duration-200',
                          // ✅ Zebra striping para mejor separación visual
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50/40',
                          // ✅ Hover state mejorado
                          'hover:bg-gradient-to-r hover:from-primary/5 hover:to-transparent',
                          // ✅ Border más visible
                          'border-b border-gray-200',
                          'hover:border-primary/20',
                          // ✅ Padding vertical aumentado
                          '[&>td]:py-5'
                        )}
                        data-testid="product-row"
                      >
                        {columns.slice(0, -1).map((column, colIndex) => (
                          <td
                            key={`${product.id}-${column.key.toString()}-${colIndex}`}
                            className={cn(
                              'px-6 py-4 whitespace-nowrap transition-colors',
                              column.align === 'center' && 'text-center',
                              column.align === 'right' && 'text-right'
                            )}
                          >
                            {column.render
                              ? column.render(product[column.key as keyof Product], product)
                              : String(product[column.key as keyof Product] || '-')}
                          </td>
                        ))}
                        <td className='px-6 py-4 whitespace-nowrap text-right'>
                          {columns[columns.length - 1]?.render?.(null, product) || null}
                        </td>
                      </tr>

                      {/* Fila expandible de variantes */}
                      {expandedRows.has(product.id) && (
                        <tr key={`expanded-${product.id}`}>
                          <td colSpan={columns.length} className='px-0 py-0 bg-gray-50/50'>
                            <ExpandableVariantsRow
                              productId={product.id}
                              onEditVariant={(variant) => {
                                router.push(`/admin/products/${product.id}/edit?variantId=${variant.id}`)
                              }}
                            />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Mejorado */}
        {pagination && !isLoading && products.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className='bg-gradient-to-r from-gray-50 to-gray-100/50 px-6 py-4 flex items-center justify-between border-t border-gray-200'
          >
            <div className='flex items-center space-x-3'>
              <Badge variant="soft" size="sm">
                {products.length} de {total}
              </Badge>
              <span className='text-sm text-muted-foreground'>
                productos en total
              </span>
            </div>
            <div className='flex items-center gap-2'>
              <button
                onClick={() => pagination.prevPage()}
                disabled={pagination.currentPage === 1}
                className='px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-white hover:shadow-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:shadow-none transition-all duration-200'
                data-testid="pagination-prev"
              >
                Anterior
              </button>
              <div className='flex items-center gap-1.5 px-3 py-2 bg-white rounded-lg border border-gray-200 shadow-sm'>
                <span className='text-sm font-semibold text-gray-900'>
                  {pagination.currentPage}
                </span>
                <span className='text-sm text-gray-400'>/</span>
                <span className='text-sm text-gray-600'>
                  {pagination.totalPages}
                </span>
              </div>
              <button
                onClick={() => pagination.nextPage()}
                disabled={pagination.currentPage === pagination.totalPages}
                className='px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-white hover:shadow-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:shadow-none transition-all duration-200'
                data-testid="pagination-next"
              >
                Siguiente
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
