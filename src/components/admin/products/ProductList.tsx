'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { AdminDataTable } from '../ui/AdminDataTable'
import { ProductFilters } from './ProductFilters'
import { ProductActions, ProductRowActions } from './ProductActions'
import { useProductList } from '@/hooks/admin/useProductList'
import { ExpandableVariantsRow } from './ExpandableVariantsRow'
import { cn } from '@/lib/core/utils'
import { Package, AlertCircle, CheckCircle, Clock, ChevronDown, ChevronRight } from 'lucide-react'

interface Product {
  id: string
  name: string
  description: string
  price: number
  stock: number
  category_id: string
  category_name?: string
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

interface ProductListProps {
  products: Product[]
  isLoading: boolean
  error: any
  filters?: any
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

// Status Badge Component
function StatusBadge({ status }: { status: Product['status'] }) {
  const statusConfig = {
    active: {
      label: 'Activo',
      icon: CheckCircle,
      className: 'bg-green-100 text-green-800 border-green-200',
    },
    inactive: {
      label: 'Inactivo',
      icon: AlertCircle,
      className: 'bg-red-100 text-red-800 border-red-200',
    },
    draft: {
      label: 'Borrador',
      icon: Clock,
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    },
  }

  const config = statusConfig[status]
  const Icon = config && config.icon ? config.icon : Package

  return (
    <span
      className={cn(
        'inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-full border',
        config && config.className ? config.className : 'bg-gray-100 text-gray-800 border-gray-200'
      )}
    >
      <Icon className='w-3 h-3' />
      <span>{config && config.label ? config.label : 'Estado'}</span>
    </span>
  )
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
        Stock bajo
      </span>
    )
  }

  return <span className='text-sm text-gray-900'>{stock}</span>
}

export function ProductList({ 
  products = [],
  isLoading = false,
  error = null,
  filters = {},
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

  // Table columns configuration
  const columns = [
    {
      key: 'images',
      title: 'Imagen',
      width: '100px',
      render: (images: any, product: Product) => {
        // Manejar diferentes formatos de imágenes
        let imageUrl = null
        
        if (product.image_url) {
          // Formato transformado por el hook
          imageUrl = product.image_url
        } else if (Array.isArray(images) && images.length > 0) {
          // Array de URLs
          imageUrl = images[0]
        } else if (typeof images === 'object' && images?.main) {
          // Formato objeto
          imageUrl = images.main
        }
        
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
      key: 'category_name',
      title: 'Categoría',
      sortable: true,
      render: (categoryName: string) => (
        <span className='text-sm text-gray-900'>{categoryName || 'Sin categoría'}</span>
      ),
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
    const result = await deleteProduct(productId)
    if (!result.success) {
      // Handle error (show toast, etc.)
      console.error('Error deleting product:', result.error)
    }
  }

  const handleBulkDelete = async (productIds: string[]) => {
    const result = await bulkDelete(productIds)
    if (result.success) {
      setSelectedProducts([])
    } else {
      // Handle error
      console.error('Error bulk deleting products:', result.error)
    }
  }

  const handleDuplicateProduct = (productId: string) => {
    // TODO: Implement product duplication
    console.log('Duplicate product:', productId)
  }

  const handleCreateProduct = () => {
    router.push('/admin/products/new')
  }

  const handleExportProducts = () => {
    // TODO: Implement export functionality
    console.log('Export products')
  }

  const handleImportProducts = () => {
    // TODO: Implement import functionality
    console.log('Import products')
  }

  const handleRowClick = (product: Product) => {
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

  if (error) {
    return (
      <div className='bg-red-50 border border-red-200 rounded-lg p-6'>
        <div className='flex items-center space-x-3'>
          <AlertCircle className='w-6 h-6 text-red-600' />
          <div>
            <h3 className='text-lg font-medium text-red-800'>Error al cargar productos</h3>
            <p className='text-red-700 mt-1'>{error.message}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Filters */}
      <ProductFilters
        filters={params.filters || {}}
        onFiltersChange={updateFilters}
        onClearFilters={clearFilters}
        categories={[]} // TODO: Load categories from API
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

      {/* Custom Table with Expandable Rows */}
      <div className='bg-white rounded-lg shadow-sm overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='min-w-full divide-y divide-gray-200' data-testid="products-table">
            <thead className='bg-gray-50'>
              <tr>
                {columns.slice(0, -1).map((column, index) => (
                  <th
                    key={`header-${column.key.toString()}-${index}`}
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                    style={{ width: column.width }}
                  >
                    {column.title}
                  </th>
                ))}
                <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className='bg-white divide-y divide-gray-200'>
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length} className='px-6 py-12 text-center'>
                    <div className='flex items-center justify-center space-x-2'>
                      <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blaze-orange-600' />
                      <span className='text-gray-500'>Cargando productos...</span>
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className='px-6 py-12 text-center'>
                    <Package className='w-12 h-12 text-gray-400 mx-auto mb-3' />
                    <p className='text-gray-500'>No se encontraron productos</p>
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <React.Fragment key={product.id}>
                    {/* Fila principal del producto */}
                    <tr
                      onClick={() => handleRowClick(product)}
                      className='hover:bg-gray-50 cursor-pointer transition-colors'
                      data-testid="product-row"
                    >
                      {columns.slice(0, -1).map((column, colIndex) => (
                        <td
                          key={`${product.id}-${column.key.toString()}-${colIndex}`}
                          className={cn(
                            'px-6 py-4 whitespace-nowrap',
                            column.align === 'center' && 'text-center',
                            column.align === 'right' && 'text-right'
                          )}
                        >
                          {column.render
                            ? column.render(product[column.key as keyof Product], product)
                            : product[column.key as keyof Product]}
                        </td>
                      ))}
                      <td className='px-6 py-4 whitespace-nowrap text-right'>
                        {columns[columns.length - 1].render
                          ? columns[columns.length - 1].render(null, product)
                          : null}
                      </td>
                    </tr>

                    {/* Fila expandible de variantes */}
                    {expandedRows.has(product.id) && (
                      <ExpandableVariantsRow
                        productId={product.id}
                        onEditVariant={(variant) => {
                          // Navegar a edición del producto con variante seleccionada
                          router.push(`/admin/products/${product.id}/edit?variantId=${variant.id}`)
                        }}
                      />
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && !isLoading && products.length > 0 && (
          <div className='bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200'>
            <div className='flex items-center space-x-2'>
              <span className='text-sm text-gray-700'>
                Mostrando {products.length} de {total} productos
              </span>
            </div>
            <div className='flex items-center space-x-2'>
              <button
                onClick={() => pagination.prevPage()}
                disabled={pagination.currentPage === 1}
                className='px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed'
                data-testid="pagination-prev"
              >
                Anterior
              </button>
              <span className='text-sm text-gray-700'>
                Página {pagination.currentPage} de {pagination.totalPages}
              </span>
              <button
                onClick={() => pagination.nextPage()}
                disabled={pagination.currentPage === pagination.totalPages}
                className='px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed'
                data-testid="pagination-next"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
