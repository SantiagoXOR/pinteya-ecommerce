'use client'

import React, { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
// ⚡ PERFORMANCE: Lazy load de Framer Motion para reducir bundle inicial
import { motion, AnimatePresence } from '@/lib/framer-motion-lazy'
import { AdminDataTable } from '../ui/AdminDataTable'
import { ProductFilters } from './ProductFilters'
import { ProductActions, ProductRowActions } from './ProductActions'
import { useProductList } from '@/hooks/admin/useProductList'
import { useQueryClient } from '@tanstack/react-query'
import { ExpandableVariantsRow } from './ExpandableVariantsRow'
import { Skeleton, TableSkeleton } from '../ui/Skeleton'
import { EmptyState } from '../ui/EmptyState'
import { Badge } from '../ui/Badge'
import { cn, normalizeProductTitle } from '@/lib/core/utils'
import { useResizableColumns } from '@/hooks/admin/useResizableColumns'
import { Package, AlertCircle, CheckCircle, Clock, ChevronDown, ChevronRight, TrendingDown, TrendingUp, ArrowUpDown, ArrowUp, ArrowDown, Check } from '@/lib/optimized-imports'

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
  // ✅ AGREGADO: Campos de aikon_id
  aikon_id?: number | null
  aikon_id_formatted?: string | null
  variant_aikon_ids?: number[]
  variant_aikon_ids_formatted?: string[]
  has_variants?: boolean
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
  // ✅ NUEVO: Funciones para acciones masivas
  onBulkStatusChange?: (productIds: string[], status: 'active' | 'inactive') => Promise<void>
  onBulkCategoryChange?: (productIds: string[], categoryId: number) => Promise<void>
  onBulkPriceUpdate?: (productIds: string[], priceChange: { type: 'percentage' | 'fixed'; value: number }) => Promise<void>
  onBulkArchive?: (productIds: string[]) => Promise<void>
  onBulkDelete?: (productIds: string[]) => Promise<void>
  refreshProducts?: () => Promise<void>  // ✅ Función para refrescar productos
  refreshStats?: () => Promise<void>      // ✅ Función para refrescar estadísticas
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
  // ✅ NUEVO: Funciones para acciones masivas
  onBulkStatusChange,
  onBulkCategoryChange,
  onBulkPriceUpdate,
  onBulkArchive,
  onBulkDelete,
  refreshProducts,  // ✅ Función para refrescar productos
  refreshStats,     // ✅ Función para refrescar estadísticas
  className 
}: ProductListProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([])
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const tableScrollRef = useRef<HTMLDivElement>(null)
  const topScrollBarRef = useRef<HTMLDivElement>(null)
  const [showBulkActionsDropdown, setShowBulkActionsDropdown] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)

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

  // Configuración de anchos por defecto para columnas
  const defaultColumnWidths: { [key: string]: number } = {
    select: 50, // ✅ NUEVO: Columna de selección
    actions: 80, // ✅ Movido al principio (después de selección)
    images: 80,
    name: 250,
    id: 70,
    slug: 150,
    variant_count: 120,
    categories: 150,
    brand: 120,
    medida: 100,
    price: 100,
    discounted_price: 120,
    stock: 100,
    color: 100,
    aikon_id: 120,
    status: 100,
    created_at: 110,
    updated_at: 110,
  }

  // Hook para columnas redimensionables
  const { columnWidths, isResizing, justFinishedResizing, handleMouseDown } = useResizableColumns({
    defaultWidths: defaultColumnWidths,
    minWidth: 80, // Aumentado para evitar superposición
    maxWidth: 500,
  })

  // Sincronizar scroll horizontal entre la barra superior y la tabla
  useEffect(() => {
    const tableContainer = tableScrollRef.current
    const scrollBar = topScrollBarRef.current
    
    if (!tableContainer || !scrollBar) return

    const scrollContent = scrollBar.querySelector('.scroll-content') as HTMLElement
    if (scrollContent) {
      scrollContent.style.width = `${tableContainer.scrollWidth}px`
    }

    const handleTableScroll = () => {
      if (scrollBar) {
        scrollBar.scrollLeft = tableContainer.scrollLeft
      }
    }

    const handleBarScroll = () => {
      if (tableContainer) {
        tableContainer.scrollLeft = scrollBar.scrollLeft
      }
    }

    tableContainer.addEventListener('scroll', handleTableScroll)
    scrollBar.addEventListener('scroll', handleBarScroll)

    // Actualizar ancho cuando cambie el contenido
    const resizeObserver = new ResizeObserver(() => {
      if (scrollContent) {
        scrollContent.style.width = `${tableContainer.scrollWidth}px`
      }
    })
    resizeObserver.observe(tableContainer)

    return () => {
      tableContainer.removeEventListener('scroll', handleTableScroll)
      scrollBar.removeEventListener('scroll', handleBarScroll)
      resizeObserver.disconnect()
    }
  }, [products, columnWidths])

  // ✅ Handlers para selección
  const handleSelectProduct = (product: Product) => {
    setSelectedProducts(prev => {
      const isSelected = prev.some(p => p.id === product.id)
      if (isSelected) {
        return prev.filter(p => p.id !== product.id)
      } else {
        return [...prev, product]
      }
    })
  }

  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([])
    } else {
      setSelectedProducts([...products])
    }
  }

  const isProductSelected = (productId: string) => {
    return selectedProducts.some(p => p.id === productId)
  }

  const isAllSelected = products.length > 0 && selectedProducts.length === products.length
  const isSomeSelected = selectedProducts.length > 0 && selectedProducts.length < products.length

  // Table columns configuration
  const columns = [
    {
      key: 'select',
      title: '',
      defaultWidth: 50,
      align: 'center' as const,
      render: (_: any, product: Product) => (
        <div className='flex items-center justify-center'>
          <input
            type='checkbox'
            checked={isProductSelected(product.id)}
            onChange={() => handleSelectProduct(product)}
            onClick={(e) => e.stopPropagation()}
            className='w-4 h-4 text-blaze-orange-600 border-gray-300 rounded focus:ring-blaze-orange-500 cursor-pointer'
            aria-label={`Seleccionar ${normalizeProductTitle(product.name)}`}
          />
        </div>
      ),
    },
    {
      key: 'actions',
      title: 'Acciones',
      defaultWidth: 80,
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
    {
      key: 'images',
      title: 'Imagen',
      defaultWidth: 80,
      render: (images: any, product: Product) => {
        const imageUrl = resolveImageSource(product.image_url || images)
        
        return (
          <div className='w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center shadow-sm'>
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={normalizeProductTitle(product.name)}
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
      defaultWidth: 280, // Aumentado para evitar superposición
      render: (name: string, product: Product) => {
        // ✅ NUEVO: Normalizar título del producto
        const normalizedName = normalizeProductTitle(name)
        // ✅ NUEVO: Normalizar descripción también
        const normalizedDescription = product.description 
          ? normalizeProductTitle(product.description)
          : 'Sin descripción'
        
        return (
          <div className='w-full min-w-0'>
            <div className='font-semibold text-gray-900 text-sm mb-0.5 truncate' title={normalizedName}>
              {normalizedName}
            </div>
            <div
              className='text-xs text-gray-600 truncate'
              title={normalizedDescription}
            >
              {normalizedDescription}
            </div>
          </div>
        )
      },
    },
    {
      key: 'id',
      title: 'ID',
      sortable: true,
      defaultWidth: 70,
      render: (id: number) => (
        <span className='text-sm text-gray-600 font-mono'>#{id}</span>
      ),
    },
    {
      key: 'slug',
      title: 'Slug',
      defaultWidth: 180, // Aumentado
      render: (slug: string) => (
        <span className='text-xs text-gray-500 font-mono truncate block w-full' title={slug}>
          {slug || '-'}
        </span>
      ),
    },
    {
      key: 'variant_count',
      title: 'Variantes',
      sortable: true,
      defaultWidth: 120,
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
      defaultWidth: 150,
      render: (_: any, product: Product) => {
        const categories = product.categories || []
        
        // Fallback: intentar obtener categorías de product_categories si categories está vacío
        if (categories.length === 0 && (product as any).product_categories) {
          const fallbackCategories = (product as any).product_categories
            ?.map((pc: any) => pc.category)
            .filter((cat: any) => cat != null) || []
          
          if (fallbackCategories.length > 0) {
            return (
              <div className='flex flex-wrap gap-1'>
                {fallbackCategories.map((cat: any) => (
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
          }
        }

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
      defaultWidth: 120,
      render: (brand: string) => (
        <span className='text-xs text-gray-700'>{brand || '-'}</span>
      ),
    },
    {
      key: 'medida',
      title: 'Medida',
      sortable: true,
      defaultWidth: 100,
      render: (medida: string, product: Product) => {
        // ✅ NUEVO: Obtener todas las medidas del array 'medidas' o usar la medida individual
        const medidas = (product as any).medidas || (medida ? [medida] : [])
        
        if (medidas.length === 0) {
          return <span className='text-sm text-gray-500'>Sin medidas</span>
        }

        return (
          <div className='flex flex-wrap gap-1'>
            {medidas.map((m: string, index: number) => (
              <Badge
                key={`${product.id}-${m}-${index}`}
                variant='soft'
                className='text-xs'
              >
                {m}
              </Badge>
            ))}
          </div>
        )
      },
    },
    {
      key: 'price',
      title: 'Precio',
      align: 'right' as const,
      sortable: true,
      defaultWidth: 100,
      render: (price: number) => (
        <div className='text-right'>
          <span className='font-semibold text-sm text-green-600'>${price.toLocaleString('es-AR')}</span>
        </div>
      ),
    },
    {
      key: 'discounted_price',
      title: 'Precio Desc.',
      align: 'right' as const,
      sortable: true,
      defaultWidth: 120,
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
      defaultWidth: 100,
      render: (stock: number) => <StockBadge stock={stock} />,
    },
    {
      key: 'color',
      title: 'Color',
      defaultWidth: 100,
      render: (color: string, product: Product) => {
        // ✅ NUEVO: Obtener todos los colores del array 'colores' o usar el color individual
        const colores = (product as any).colores || (color ? [color] : [])
        
        if (colores.length === 0) {
          return <span className='text-sm text-gray-500'>Sin colores</span>
        }

        return (
          <div className='flex flex-wrap gap-1'>
            {colores.map((c: string, index: number) => (
              <Badge
                key={`${product.id}-${c}-${index}`}
                variant='soft'
                className='text-xs'
              >
                {c}
              </Badge>
            ))}
          </div>
        )
      },
    },
    {
      key: 'aikon_id',
      title: 'Código Aikon',
      defaultWidth: 150,
      render: (aikonId: string | number | null, product: any) => {
        // ✅ REFACTORIZADO: Mostrar todos los códigos aikon de variantes si existen
        const variantAikonIdsFormatted = product?.variant_aikon_ids_formatted || []
        const hasVariants = product?.has_variants || false
        
        // Si tiene variantes, mostrar todos los códigos
        if (hasVariants && variantAikonIdsFormatted.length > 0) {
          return (
            <div className='flex flex-wrap gap-1'>
              {variantAikonIdsFormatted.map((code: string, index: number) => (
                <span
                  key={`${product.id}-aikon-${index}`}
                  className='inline-flex items-center px-2 py-0.5 text-xs font-mono bg-gray-100 text-gray-700 rounded border border-gray-300'
                >
                  {code}
                </span>
              ))}
            </div>
          )
        }
        
        // Si no tiene variantes, mostrar el código del producto
        const displayCode = aikonId 
          ? (typeof aikonId === 'number' 
              ? aikonId.toString().padStart(6, '0') 
              : aikonId)
          : product?.aikon_id_formatted || '-'
        
        return (
          <span className='text-xs text-gray-500 font-mono'>{displayCode}</span>
        )
      },
    },
    {
      key: 'status',
      title: 'Estado',
      align: 'center' as const,
      sortable: true,
      defaultWidth: 100,
      render: (status: Product['status']) => <StatusBadge status={status} />,
    },
    {
      key: 'created_at',
      title: 'Creado',
      sortable: true,
      defaultWidth: 110,
      render: (createdAt: string) => (
        <span className='text-xs text-gray-500'>
          {new Date(createdAt).toLocaleDateString('es-AR')}
        </span>
      ),
    },
    {
      key: 'updated_at',
      title: 'Actualizado',
      sortable: true,
      defaultWidth: 110,
      render: (updatedAt: string) => (
        <span className='text-xs text-gray-500'>
          {new Date(updatedAt).toLocaleDateString('es-AR')}
        </span>
      ),
    },
  ]

  // Event handlers
  const handleDeleteProduct = async (productId: string) => {
    // ⚡ FASE 11-16: Código de debugging deshabilitado en producción
// Los requests a 127.0.0.1:7242 estaban causando timeouts y bloqueando la carga
    
    // Usar onBulkDelete con un solo ID para eliminar el producto individual
    if (onBulkDelete) {
      try {
        // ⚡ FASE 11-16: Código de debugging deshabilitado en producción
// Los requests a 127.0.0.1:7242 estaban causando timeouts y bloqueando la carga
        
        const result = await onBulkDelete([productId])
        
        // ⚡ FASE 11-16: Código de debugging deshabilitado en producción
// Los requests a 127.0.0.1:7242 estaban causando timeouts y bloqueando la carga
        
        // ⚡ FASE 11-16: Código de debugging deshabilitado en producción
// Los requests a 127.0.0.1:7242 estaban causando timeouts y bloqueando la carga
        
        // ✅ SOLUCIÓN DEFINITIVA: Limpiar completamente el cache y forzar recarga
        // En lugar de intentar actualizar el cache manualmente, simplemente lo limpiamos
        // y forzamos un refetch completo desde el servidor
        
        // Paso 1: Remover todas las queries del cache relacionadas con productos
        queryClient.removeQueries({ queryKey: ['admin-products'], exact: false })
        queryClient.removeQueries({ queryKey: ['admin-products-stats'], exact: false })
        
        // ⚡ FASE 11-16: Código de debugging deshabilitado en producción
// Los requests a 127.0.0.1:7242 estaban causando timeouts y bloqueando la carga
        
        // Paso 2: Invalidar queries para forzar refetch
        queryClient.invalidateQueries({ queryKey: ['admin-products'], exact: false })
        queryClient.invalidateQueries({ queryKey: ['admin-products-stats'], exact: false })
        
        // ✅ Esperar un momento para que la transacción de la DB se confirme
        await new Promise(resolve => setTimeout(resolve, 300))
        
        // ✅ Usar refreshProducts directamente si está disponible
        if (refreshProducts) {
          try {
            await refreshProducts()
          } catch (refreshError) {
            console.warn('Error en refreshProducts:', refreshError)
          }
        } else {
          // Fallback: Invalidar queries si refreshProducts no está disponible
          queryClient.invalidateQueries({ queryKey: ['admin-products'], exact: false })
          queryClient.invalidateQueries({ queryKey: ['admin-products-stats'], exact: false })
        }
        
        // ✅ Refrescar estadísticas para actualizar contadores
        if (refreshStats) {
          try {
            await refreshStats()
          } catch (refreshError) {
            console.warn('Error en refreshStats:', refreshError)
          }
        }
        
        // Paso 3: Forzar refetch adicional de todas las queries activas relacionadas
        try {
          await queryClient.refetchQueries({ 
            queryKey: ['admin-products'],
            exact: false,
            type: 'active'
          })
          await queryClient.refetchQueries({ 
            queryKey: ['admin-products-stats'],
            exact: false,
            type: 'active'
          })
        } catch (refetchError) {
          console.warn('Error en refetchQueries:', refetchError)
        }
      } catch (error) {
        // ⚡ FASE 11-16: Código de debugging deshabilitado en producción
// Los requests a 127.0.0.1:7242 estaban causando timeouts y bloqueando la carga
        console.error('Error en eliminación de producto:', error)
        throw error // Re-lanzar para que el componente padre maneje el error
      }
    } else {
      // ⚡ FASE 11-16: Código de debugging deshabilitado en producción
// Los requests a 127.0.0.1:7242 estaban causando timeouts y bloqueando la carga
      console.warn('onBulkDelete no está definido, no se puede eliminar el producto')
    }
  }

  const handleBulkDelete = async (productIds: string[]) => {
    // ⚡ FASE 11-16: Código de debugging deshabilitado en producción
// Los requests a 127.0.0.1:7242 estaban causando timeouts y bloqueando la carga
    
    if (onBulkDelete) {
      try {
        // ⚡ FASE 11-16: Código de debugging deshabilitado en producción
// Los requests a 127.0.0.1:7242 estaban causando timeouts y bloqueando la carga
        
        const result = await onBulkDelete(productIds)
        
        // ⚡ FASE 11-16: Código de debugging deshabilitado en producción
// Los requests a 127.0.0.1:7242 estaban causando timeouts y bloqueando la carga
        
        setSelectedProducts([]) // Limpiar selección después de la acción
        
        // ⚡ FASE 11-16: Código de debugging deshabilitado en producción
// Los requests a 127.0.0.1:7242 estaban causando timeouts y bloqueando la carga
        
        // ✅ SOLUCIÓN DEFINITIVA: Limpiar completamente el cache y forzar recarga
        // En lugar de intentar actualizar el cache manualmente, simplemente lo limpiamos
        // y forzamos un refetch completo desde el servidor
        
        // Paso 1: Remover todas las queries del cache relacionadas con productos
        queryClient.removeQueries({ queryKey: ['admin-products'], exact: false })
        queryClient.removeQueries({ queryKey: ['admin-products-stats'], exact: false })
        
        // ⚡ FASE 11-16: Código de debugging deshabilitado en producción
// Los requests a 127.0.0.1:7242 estaban causando timeouts y bloqueando la carga
        
        // Paso 2: Invalidar queries para forzar refetch
        queryClient.invalidateQueries({ queryKey: ['admin-products'], exact: false })
        queryClient.invalidateQueries({ queryKey: ['admin-products-stats'], exact: false })
        
        // ✅ Esperar un momento para que la transacción de la DB se confirme
        await new Promise(resolve => setTimeout(resolve, 300))
        
        // ✅ Usar refreshProducts directamente si está disponible
        if (refreshProducts) {
          try {
            await refreshProducts()
          } catch (refreshError) {
            console.warn('Error en refreshProducts:', refreshError)
          }
        } else {
          // Fallback: Invalidar queries si refreshProducts no está disponible
          queryClient.invalidateQueries({ queryKey: ['admin-products'], exact: false })
          queryClient.invalidateQueries({ queryKey: ['admin-products-stats'], exact: false })
        }
        
        // ✅ Refrescar estadísticas para actualizar contadores
        if (refreshStats) {
          try {
            await refreshStats()
          } catch (refreshError) {
            console.warn('Error en refreshStats:', refreshError)
          }
        }
        
        // Paso 3: Forzar refetch adicional de todas las queries activas relacionadas
        try {
          await queryClient.refetchQueries({ 
            queryKey: ['admin-products'],
            exact: false,
            type: 'active'
          })
          await queryClient.refetchQueries({ 
            queryKey: ['admin-products-stats'],
            exact: false,
            type: 'active'
          })
        } catch (refetchError) {
          console.warn('Error en refetchQueries:', refetchError)
        }
      } catch (error) {
        // ⚡ FASE 11-16: Código de debugging deshabilitado en producción
// Los requests a 127.0.0.1:7242 estaban causando timeouts y bloqueando la carga
        console.error('Error en eliminación masiva:', error)
        throw error // Re-lanzar para que el componente padre maneje el error
      }
    } else {
      // ⚡ FASE 11-16: Código de debugging deshabilitado en producción
// Los requests a 127.0.0.1:7242 estaban causando timeouts y bloqueando la carga
      console.warn('onBulkDelete no está definido')
    }
  }

  // ✅ Handlers para acciones masivas
  const handleBulkStatusChange = async (productIds: string[], status: 'active' | 'inactive' | 'draft') => {
    if (onBulkStatusChange) {
      try {
        // Convertir 'draft' a 'inactive' si es necesario (el hook solo soporta 'active' | 'inactive')
        const statusToUse = status === 'draft' ? 'inactive' : status
        await onBulkStatusChange(productIds, statusToUse)
        setSelectedProducts([]) // Limpiar selección después de la acción
      } catch (error) {
        console.error('Error en cambio masivo de estado:', error)
      }
    }
  }

  const handleBulkCategoryChange = async (productIds: string[], categoryId: number) => {
    if (onBulkCategoryChange) {
      try {
        await onBulkCategoryChange(productIds, categoryId)
        setSelectedProducts([])
      } catch (error) {
        console.error('Error en cambio masivo de categoría:', error)
      }
    }
  }

  const handleBulkPriceUpdate = async (productIds: string[], priceChange: { type: 'percentage' | 'fixed'; value: number }) => {
    if (onBulkPriceUpdate) {
      try {
        await onBulkPriceUpdate(productIds, priceChange)
        setSelectedProducts([])
      } catch (error) {
        console.error('Error en actualización masiva de precio:', error)
      }
    }
  }

  const handleBulkArchive = async (productIds: string[]) => {
    if (onBulkArchive) {
      try {
        await onBulkArchive(productIds)
        setSelectedProducts([])
      } catch (error) {
        console.error('Error en archivado masivo:', error)
      }
    }
  }

  const handleDuplicateProduct = async (productId: string) => {
    try {
      // 1. Obtener el producto original con todas sus variantes
      // ✅ CORREGIDO: Incluir credentials para enviar cookies de autenticación
      const productResponse = await fetch(`/api/admin/products/${productId}`, {
        credentials: 'include',
      })
      if (!productResponse.ok) {
        throw new Error('Error al obtener el producto original')
      }
      const productData = await productResponse.json()
      
      // 2. Obtener variantes del producto
      // ✅ CORREGIDO: Incluir credentials para enviar cookies de autenticación
      const variantsResponse = await fetch(`/api/products/${productId}/variants`, {
        credentials: 'include',
      })
      const variantsData = variantsResponse.ok ? await variantsResponse.json() : { data: [] }
      const variants = variantsData.data || []
      
      // 3. Preparar datos del nuevo producto (sin id, con nombre modificado)
      const originalProduct = productData.data || productData
      
      // ✅ Extraer todas las categorías desde product_categories
      let categoryIds: number[] = []
      if (originalProduct.product_categories && Array.isArray(originalProduct.product_categories)) {
        categoryIds = originalProduct.product_categories
          .map((pc: any) => pc.category_id || pc.category?.id)
          .filter((id: any) => id != null && !isNaN(id))
      }
      
      // Si no hay categorías en product_categories, usar category_id del producto como fallback
      if (categoryIds.length === 0 && originalProduct.category_id) {
        categoryIds.push(parseInt(String(originalProduct.category_id)))
      }
      
      const newProductData = {
        name: `${originalProduct.name} (Copia)`,
        description: originalProduct.description || '',
        price: parseFloat(String(originalProduct.price || 0)), // Asegurar que sea número
        ...(originalProduct.discounted_price ? { compare_price: parseFloat(String(originalProduct.discounted_price)) } : {}), // La API espera compare_price
        stock: parseInt(String(originalProduct.stock || 0)), // ✅ Usar stock del producto principal
        ...(originalProduct.category_id ? { category_id: parseInt(String(originalProduct.category_id)) } : {}), // Mantener category_id principal para retrocompatibilidad
        ...(categoryIds.length > 0 ? { category_ids: categoryIds } : {}), // ✅ NUEVO: Incluir todas las categorías
        ...(originalProduct.brand ? { brand: String(originalProduct.brand) } : {}),
        ...(originalProduct.color ? { color: String(originalProduct.color) } : {}),
        ...(originalProduct.medida ? { medida: String(originalProduct.medida) } : {}),
        // NO incluir terminaciones - esa columna no existe en la tabla products
        status: 'active', // ✅ CORREGIDO: Crear productos duplicados como activos para que aparezcan en la lista
        // No enviar slug, la API lo genera automáticamente
        // No enviar images aquí, se manejan por separado si es necesario
      }
      
      // 4. Crear el nuevo producto
      // ✅ CORREGIDO: Incluir credentials para enviar cookies de autenticación
      const createResponse = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
        credentials: 'include',
        cache: 'no-store', // ✅ Forzar sin cache
        body: JSON.stringify(newProductData),
      })
      
      // ✅ IMPORTANTE: Leer el body una sola vez
      const newProduct = await createResponse.json().catch(() => ({ error: 'Error desconocido' }))
      
      if (!createResponse.ok) {
        throw new Error(newProduct.error || newProduct.message || 'Error al crear el producto duplicado')
      }
      const newProductId = newProduct.data?.id || newProduct.id
      
      // 5. Duplicar todas las variantes creándolas directamente en el nuevo producto
      if (variants.length > 0) {
        
        for (const variant of variants) {
          try {
            // Generar nuevo aikon_id único usando timestamp
            const timestamp = Date.now()
            const newAikonId = `${variant.aikon_id || 'VAR'}-COPIA-${timestamp}-${Math.random().toString(36).substring(2, 9)}`
            
            const variantData = {
              product_id: parseInt(String(newProductId)),
              aikon_id: newAikonId,
              color_name: variant.color_name || null,
              color_hex: variant.color_hex || null,
              measure: variant.measure || null,
              finish: variant.finish || 'Mate',
              price_list: parseFloat(String(variant.price_list || variant.price_sale || 0)), // Asegurar que sea número
              price_sale: variant.price_sale ? parseFloat(String(variant.price_sale)) : null,
              stock: parseInt(String(variant.stock || 0)), // Asegurar que sea número entero
              image_url: variant.image_url || null,
              is_active: variant.is_active !== false,
              is_default: variant.is_default || false,
            }
            
            // Crear nueva variante en el nuevo producto
            // ✅ CORREGIDO: Incluir credentials para enviar cookies de autenticación
            const variantResponse = await fetch('/api/admin/products/variants', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify(variantData),
            })
            
            if (!variantResponse.ok) {
              const errorData = await variantResponse.json().catch(() => ({ error: 'Error desconocido' }))
              console.error('Error al crear variante duplicada:', errorData.error || errorData.message || 'Error al crear variante')
            }
          } catch (error) {
            console.error('Error al duplicar variante:', error)
          }
        }
      }
      
      // 6. Limpiar cache y forzar refetch completo para actualizar la lista
      // ✅ ESTRATEGIA AGRESIVA: Remover completamente del cache antes de invalidar
      // Paso 1: Remover todas las queries del cache relacionadas con productos
      queryClient.removeQueries({ queryKey: ['admin-products'], exact: false })
      queryClient.removeQueries({ queryKey: ['admin-products-stats'], exact: false })
      
      // ✅ Esperar un momento para que la transacción de la DB se confirme
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Paso 2: Invalidar queries para forzar refetch automático de queries activas
      queryClient.invalidateQueries({ queryKey: ['admin-products'], exact: false })
      queryClient.invalidateQueries({ queryKey: ['admin-products-stats'], exact: false })
      
      // Paso 3: Forzar refetch de queries activas con headers de no-cache
      if (refreshProducts) {
        try {
          await refreshProducts()
        } catch (refreshError) {
          console.warn('Error en refreshProducts:', refreshError)
        }
      }
      
      // ✅ Refrescar estadísticas para actualizar contadores
      if (refreshStats) {
        try {
          await refreshStats()
        } catch (refreshError) {
          console.warn('Error en refreshStats:', refreshError)
        }
      }
      
      // Paso 4: Forzar refetch adicional de todas las queries activas relacionadas
      try {
        await queryClient.refetchQueries({ 
          queryKey: ['admin-products'],
          exact: false,
          type: 'active'
        })
        await queryClient.refetchQueries({ 
          queryKey: ['admin-products-stats'],
          exact: false,
          type: 'active'
        })
      } catch (refetchError) {
        console.warn('Error en refetchQueries:', refetchError)
      }
      
      return newProductId
    } catch (error) {
      console.error('Error al duplicar producto:', error)
      throw error
    }
  }

  const handleCreateProduct = () => {
    router.push('/admin/products/new')
  }

  const handleExportProducts = async (format: 'csv' | 'xlsx' | 'json') => {
    try {
      console.log(`📊 Exportando productos en formato ${format}...`)
      
      // ✅ Si hay productos seleccionados, exportar solo esos
      const productIdsToExport = selectedProducts.length > 0 
        ? selectedProducts.map(p => p.id)
        : undefined
      
      // Construir URL con filtros actuales
      const params = new URLSearchParams({
        format: format,
        ...(filters.category && { category_id: filters.category }),
        ...(filters.brand && { brand: filters.brand }),
        ...(filters.status && filters.status !== 'all' && { status: filters.status }),
        ...(filters.stock_status && filters.stock_status !== 'all' && { stock_status: filters.stock_status }),
        // ✅ Agregar IDs de productos seleccionados si hay alguno
        ...(productIdsToExport && productIdsToExport.length > 0 && { 
          product_ids: productIdsToExport.join(',')
        }),
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
    // ⚡ FASE 11-16: Código de debugging deshabilitado en producción
// Los requests a 127.0.0.1:7242 estaban causando timeouts y bloqueando la carga
    if (event.defaultPrevented) {
      // ⚡ FASE 11-16: Código de debugging deshabilitado en producción
// Los requests a 127.0.0.1:7242 estaban causando timeouts y bloqueando la carga
      return
    }

    const target = event.target as HTMLElement
    const isInteractive = target.closest(
      'button, a, input, select, textarea, label, [role="button"], [data-interactive="true"], .product-actions-menu'
    )
    // ⚡ FASE 11-16: Código de debugging deshabilitado en producción
// Los requests a 127.0.0.1:7242 estaban causando timeouts y bloqueando la carga
    if (isInteractive) {
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
    <div className={cn('', className)}>
      {/* Filters */}
      <ProductFilters
        filters={params.filters || {}}
        onFiltersChange={updateFilters}
        onClearFilters={clearFilters}
        categories={categories} // ✅ Pasar categorías reales desde el padre
        onImportProducts={handleImportProducts}
        onExportProducts={handleExportProducts}
        onShowExportModal={() => {
          setShowExportModal(true)
        }}
        onBulkActions={() => {
          setShowBulkActionsDropdown(true)
        }}
        selectedProductsCount={selectedProducts.length}
        isLoading={isDeleting || isBulkDeleting}
      />

      {/* Actions - Solo para modales y lógica */}
      <ProductActions
        selectedProducts={selectedProducts}
        categories={categories} // ✅ Pasar categorías reales
        onBulkDelete={handleBulkDelete}
        onBulkStatusChange={handleBulkStatusChange}
        onBulkCategoryChange={handleBulkCategoryChange}
        onBulkPriceUpdate={handleBulkPriceUpdate}
        onBulkArchive={handleBulkArchive}
        onExportProducts={handleExportProducts}
        onImportProducts={handleImportProducts}
        isLoading={isDeleting || isBulkDeleting}
        externalShowBulkActions={showBulkActionsDropdown}
        onExternalBulkActionsChange={setShowBulkActionsDropdown}
        externalShowExportModal={showExportModal}
        onExternalExportModalChange={setShowExportModal}
      />

      {/* Modern Table with Improved UX */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className='mt-4 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative'
      >
        {/* Barra de scroll horizontal flotante siempre visible en la parte superior */}
        <div 
          ref={topScrollBarRef}
          className='sticky top-0 z-30 h-3 bg-gray-50 border-b border-gray-200 overflow-x-auto overflow-y-hidden products-table-scroll'
          style={{ 
            scrollbarWidth: 'thin',
            scrollbarColor: '#cbd5e1 #f1f5f9'
          }}
        >
          <div className='scroll-content' style={{ height: '1px' }}></div>
        </div>
        
        <div 
          ref={tableScrollRef}
          className='products-table-scroll' 
          style={{ 
            maxHeight: 'calc(100vh - 300px)',
            overflowX: 'auto',
            overflowY: 'auto'
          }}
        >
          <table className='min-w-full divide-y divide-gray-100' data-testid="products-table">
            {/* Sticky Header con blur backdrop y sorting */}
            <thead className='bg-gradient-to-r from-gray-50/95 to-gray-100/95 sticky top-0 z-10 backdrop-blur-sm border-b border-gray-200'>
              <tr>
                {columns.map((column, index) => {
                  const columnKey = column.key.toString()
                  const width = columnWidths[columnKey] || column.defaultWidth || 150
                  const isResizingColumn = isResizing === columnKey
                  const isSelectColumn = columnKey === 'select'

                  return (
                    <th
                      key={`header-${columnKey}-${index}`}
                      className={cn(
                        'px-2 py-2 text-xs font-semibold text-gray-700 uppercase tracking-wider relative',
                        column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left',
                        column.sortable && !isSelectColumn && 'cursor-pointer select-none group hover:bg-gray-100/50 transition-colors',
                        isResizingColumn && 'bg-blue-50'
                      )}
                      style={{ width: `${width}px`, minWidth: `${width}px`, maxWidth: `${width}px` }}
                      onClick={(e) => {
                        // Prevenir sort si estamos redimensionando o acabamos de redimensionar esta columna
                        if (isSelectColumn) {
                          // Para la columna de selección, manejar "seleccionar todos"
                          e.stopPropagation()
                          handleSelectAll()
                          return
                        }
                        if (column.sortable && !isResizing && justFinishedResizing !== columnKey) {
                          handleSort(columnKey)
                        } else if (justFinishedResizing === columnKey) {
                          e.stopPropagation()
                        }
                      }}
                    >
                      <div className='flex items-center gap-1.5 justify-center'>
                        {isSelectColumn ? (
                          <input
                            type='checkbox'
                            checked={isAllSelected}
                            ref={(input) => {
                              if (input) input.indeterminate = isSomeSelected
                            }}
                            onChange={handleSelectAll}
                            onClick={(e) => e.stopPropagation()}
                            className='w-4 h-4 text-blaze-orange-600 border-gray-300 rounded focus:ring-blaze-orange-500 cursor-pointer'
                            aria-label='Seleccionar todos los productos'
                          />
                        ) : (
                          <>
                            <span>{column.title}</span>
                            {column.sortable && renderSortIcon(columnKey)}
                          </>
                        )}
                      </div>
                      {/* Resize handle */}
                      <div
                        className={cn(
                          'absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-400 transition-colors group z-10',
                          isResizingColumn && 'bg-blue-500 w-1.5'
                        )}
                        onMouseDown={(e) => {
                          handleMouseDown(e, columnKey)
                        }}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                        }}
                        onMouseUp={(e) => {
                          // Prevenir que el click se propague después del mouseUp
                          e.preventDefault()
                          e.stopPropagation()
                        }}
                        title='Arrastra para redimensionar'
                      >
                        <div className='absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-0.5 opacity-0 group-hover:opacity-100 transition-opacity'>
                          <div className='w-0.5 h-4 bg-gray-400 rounded-full'></div>
                        </div>
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody className='bg-white divide-y divide-gray-50'>
              {isLoading ? (
                /* Skeleton Loading State */
                <>
                  {Array.from({ length: 5 }).map((_, i) => {
                    const columnKey = columns[i % columns.length]?.key.toString() || 'default'
                    const width = columnWidths[columnKey] || columns[i % columns.length]?.defaultWidth || 150
                    
                    return (
                      <tr key={i} className='animate-pulse'>
                        {columns.map((column, colIndex) => {
                          const colKey = column.key.toString()
                          const colWidth = columnWidths[colKey] || column.defaultWidth || 150
                          
                          return (
                            <td 
                              key={`skeleton-${i}-${colIndex}`}
                              className='px-2 py-2'
                              style={{ width: `${colWidth}px`, minWidth: `${colWidth}px`, maxWidth: `${colWidth}px` }}
                            >
                              <Skeleton className='h-4 w-full' />
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
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
                        {columns.map((column, colIndex) => {
                          const columnKey = column.key.toString()
                          const width = columnWidths[columnKey] || column.defaultWidth || 150
                          const shouldWrap = column.key === 'name' || column.key === 'description' || column.key === 'slug'
                          
                          return (
                            <td
                              key={`${product.id}-${column.key.toString()}-${colIndex}`}
                              className={cn(
                                'px-2 py-2 transition-colors overflow-hidden',
                                !shouldWrap && 'whitespace-nowrap',
                                column.align === 'center' && 'text-center',
                                column.align === 'right' && 'text-right',
                                column.key === 'actions' && 'relative z-50'
                              )}
                              style={{ 
                                width: `${width}px`, 
                                minWidth: `${width}px`, 
                                maxWidth: `${width}px`,
                                overflow: 'visible',
                                textOverflow: 'ellipsis',
                                position: column.key === 'actions' ? 'relative' : 'static'
                              }}
                              onClick={(e) => {
                                if (column.key === 'actions') {
                                  e.stopPropagation()
                                }
                              }}
                            >
                              <div className={cn(
                                'w-full min-w-0',
                                column.key === 'actions' ? 'overflow-visible' : 'overflow-hidden'
                              )}>
                                {column.render
                                  ? column.render(product[column.key as keyof Product], product)
                                  : String(product[column.key as keyof Product] || '-')}
                              </div>
                            </td>
                          )
                        })}
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
