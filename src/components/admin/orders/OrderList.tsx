'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from '@/lib/optimized-imports'
import { cn } from '@/lib/core/utils'
import { 
  Package, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Truck,
  XCircle,
  RefreshCw,
  DollarSign,
  CreditCard,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Wallet,
  Banknote,
  ShoppingBag,
} from '@/lib/optimized-imports'
import { OrderFilters } from './OrderFilters'
import { OrderRowActions } from './OrderActions'
import { WhatsAppQuickActions } from './WhatsAppQuickActions'
import { useResizableColumns } from '@/hooks/admin/useResizableColumns'
import Image from 'next/image'

// ===================================
// TYPES
// ===================================

interface OrderItem {
  id: string
  product_id: number
  product_name?: string
  quantity: number
  price: number
  unit_price?: number
  total_price?: number
  product_snapshot?: {
    name?: string
    price?: number
    image?: string
    color?: string
    finish?: string
    medida?: string
    brand?: string
  }
  products?: {
    id: number
    name: string
    images: string[]
  }
}

interface Order {
  id: string
  order_number: string
  status: OrderStatus
  payment_status: PaymentStatus
  payment_method?: string | null
  total: number
  currency: string
  created_at: string
  updated_at: string
  shipping_address?: any
  notes?: string
  payer_info?: {
    name?: string
    surname?: string
    email?: string
    phone?: string
    payment_method?: string
  }
  user_profiles?: {
    id: string
    first_name?: string
    last_name?: string
    email?: string
    phone?: string
  }
  order_items: OrderItem[]
}

type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'

type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'cash_on_delivery'

type SortDirection = 'asc' | 'desc' | null

interface OrderListProps {
  orders: Order[]
  isLoading: boolean
  error: any
  selectedOrders?: string[]
  setSelectedOrders?: React.Dispatch<React.SetStateAction<string[]>>
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
    isTransitioning?: boolean
  }
  onOrderAction?: (action: string, orderId: string) => void
  className?: string
}

// ===================================
// DEFAULT COLUMN WIDTHS
// ===================================

const DEFAULT_COLUMN_WIDTHS = {
  select: 50,
  actions: 120,
  order_number: 130,
  products: 140,
  cliente: 220,
  fecha: 150,
  estado: 120,
  pago: 160,
  total: 120,
}

// ===================================
// BADGE COMPONENTS
// ===================================

function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const statusConfig = {
    pending: {
      label: 'Pendiente',
      icon: Clock,
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    },
    confirmed: {
      label: 'Confirmada',
      icon: CheckCircle,
      className: 'bg-blue-100 text-blue-800 border-blue-200',
    },
    processing: {
      label: 'En Proceso',
      icon: RefreshCw,
      className: 'bg-orange-100 text-orange-800 border-orange-200',
    },
    shipped: {
      label: 'Enviada',
      icon: Truck,
      className: 'bg-purple-100 text-purple-800 border-purple-200',
    },
    delivered: {
      label: 'Entregada',
      icon: CheckCircle,
      className: 'bg-green-100 text-green-800 border-green-200',
    },
    cancelled: {
      label: 'Cancelada',
      icon: XCircle,
      className: 'bg-red-100 text-red-800 border-red-200',
    },
    refunded: {
      label: 'Reembolsada',
      icon: DollarSign,
      className: 'bg-gray-100 text-gray-800 border-gray-200',
    },
  }

  const config = statusConfig[status]
  const Icon = config?.icon || Package

  return (
    <span
      className={cn(
        'inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-full border',
        config?.className || 'bg-gray-100 text-gray-800 border-gray-200'
      )}
    >
      <Icon className='w-3 h-3' />
      <span>{config?.label || 'Estado'}</span>
    </span>
  )
}

function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const statusConfig = {
    pending: {
      label: 'Pendiente',
      icon: Clock,
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    },
    paid: {
      label: 'Pagado',
      icon: CreditCard,
      className: 'bg-green-100 text-green-800 border-green-200',
    },
    failed: {
      label: 'Fallido',
      icon: AlertCircle,
      className: 'bg-red-100 text-red-800 border-red-200',
    },
    refunded: {
      label: 'Reembolsado',
      icon: DollarSign,
      className: 'bg-gray-100 text-gray-800 border-gray-200',
    },
    cash_on_delivery: {
      label: 'Contra Entrega',
      icon: Banknote,
      className: 'bg-amber-100 text-amber-800 border-amber-200',
    },
  }

  const config = statusConfig[status]
  const Icon = config?.icon || CreditCard

  return (
    <span
      className={cn(
        'inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-full border',
        config?.className || 'bg-gray-100 text-gray-800 border-gray-200'
      )}
    >
      <Icon className='w-3 h-3' />
      <span>{config?.label || 'Pago'}</span>
    </span>
  )
}

function UnifiedPaymentBadge({ 
  method, 
  paymentStatus 
}: { 
  method?: string | null
  paymentStatus?: PaymentStatus 
}) {
  // Determinar el método de pago
  let paymentMethod: 'mercadopago' | 'cash' = 'mercadopago'
  
  if (method === 'cash' || paymentStatus === 'cash_on_delivery') {
    paymentMethod = 'cash'
  }

  // Determinar el estado del pago
  let statusLabel = 'Pendiente'
  let statusClass = 'bg-yellow-100 text-yellow-800 border-yellow-200'
  
  if (paymentStatus === 'paid') {
    statusLabel = 'Pagado'
    statusClass = 'bg-green-100 text-green-800 border-green-200'
  } else if (paymentStatus === 'failed') {
    statusLabel = 'Fallido'
    statusClass = 'bg-red-100 text-red-800 border-red-200'
  } else if (paymentStatus === 'refunded') {
    statusLabel = 'Reembolsado'
    statusClass = 'bg-gray-100 text-gray-800 border-gray-200'
  } else if (paymentStatus === 'cash_on_delivery') {
    statusLabel = 'Al Recibir'
    statusClass = 'bg-amber-100 text-amber-800 border-amber-200'
  }

  const methodConfig = {
    mercadopago: {
      label: 'MP',
      icon: Wallet,
    },
    cash: {
      label: 'Efectivo',
      icon: Banknote,
    },
  }

  const config = methodConfig[paymentMethod]
  const Icon = config.icon

  return (
    <div className='flex flex-col items-center gap-1'>
      <span
        className={cn(
          'inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-full border',
          statusClass
        )}
      >
        <Icon className='w-3 h-3' />
        <span>{config.label}</span>
      </span>
      <span className='text-[10px] text-gray-500'>{statusLabel}</span>
    </div>
  )
}

// ===================================
// PRODUCT ATTRIBUTE PILL
// ===================================

function ProductAttributePill({ label, value }: { label: string; value: string }) {
  return (
    <span className='inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200'>
      <span className='text-gray-500 mr-1'>{label}:</span>
      <span className='font-semibold'>{value}</span>
    </span>
  )
}

// ===================================
// EXPANDABLE ORDER ITEMS ROW (Table Style like ExpandableVariantsRow)
// ===================================

function ExpandableOrderItemsRow({ 
  orderItems, 
  isExpanded, 
  colSpan 
}: { 
  orderItems: OrderItem[]
  isExpanded: boolean
  colSpan: number 
}) {
  if (!isExpanded || !orderItems || orderItems.length === 0) return null

  return (
    <TableRow className='bg-gradient-to-b from-blue-50/80 to-white'>
      <TableCell colSpan={colSpan} className='p-0'>
        <div className='px-6 py-4'>
          <div className='mb-4'>
            <div className='flex items-center justify-between'>
              <h4 className='text-sm font-semibold text-gray-900 flex items-center gap-2'>
                <ShoppingBag className='h-4 w-4 text-blue-600' />
                Productos del Pedido
                <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
                  {orderItems.length}
                </span>
              </h4>
            </div>
          </div>

          {/* Tabla de productos estilo ExpandableVariantsRow */}
          <div className='overflow-x-auto rounded-lg border border-gray-200'>
            <table className='min-w-full divide-y divide-gray-200 bg-white'>
              <thead className='bg-gradient-to-r from-gray-50 to-gray-100/50'>
                <tr>
                  <th className='px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider'>
                    Imagen
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider'>
                    Producto
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider'>
                    Atributos
                  </th>
                  <th className='px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider'>
                    Cantidad
                  </th>
                  <th className='px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider'>
                    Precio Unit.
                  </th>
                  <th className='px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider'>
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-100'>
                {orderItems.map((item, index) => {
                  const productName = item.product_snapshot?.name || item.products?.name || item.product_name || 'Producto'
                  const productId = item.products?.id || item.product_id
                  const productImage = getProductImage(item)
                  const unitPrice = item.product_snapshot?.price || item.price || item.unit_price || 0
                  const totalPrice = unitPrice * item.quantity
                  const hasAttributes = item.product_snapshot?.color || item.product_snapshot?.medida || item.product_snapshot?.finish

                  return (
                    <tr
                      key={item.id || index}
                      className='group hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-transparent transition-all duration-200'
                    >
                      {/* Imagen con hover effect */}
                      <td className='px-4 py-3'>
                        <div className='relative w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center ring-2 ring-gray-200 group-hover:ring-blue-300 transition-all'>
                          {productImage ? (
                            <Image
                              src={productImage}
                              alt={productName}
                              width={48}
                              height={48}
                              className='w-full h-full object-cover group-hover:scale-110 transition-transform duration-200'
                              unoptimized
                            />
                          ) : (
                            <Package className='w-6 h-6 text-gray-400' />
                          )}
                        </div>
                      </td>

                      {/* Producto (Nombre + ID) */}
                      <td className='px-4 py-3'>
                        <div className='min-w-0'>
                          <p className='text-sm font-medium text-gray-900 truncate'>
                            {productName}
                          </p>
                          {productId && (
                            <code className='text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded font-mono'>
                              #{productId}
                            </code>
                          )}
                        </div>
                      </td>

                      {/* Atributos (Color, Medida, Terminación) */}
                      <td className='px-4 py-3'>
                        {hasAttributes ? (
                          <div className='flex flex-wrap items-center gap-1.5'>
                            {item.product_snapshot?.color && (
                              <ProductAttributePill label="Color" value={item.product_snapshot.color} />
                            )}
                            {item.product_snapshot?.medida && (
                              <ProductAttributePill label="Medida" value={item.product_snapshot.medida} />
                            )}
                            {item.product_snapshot?.finish && (
                              <ProductAttributePill label="Terminación" value={item.product_snapshot.finish} />
                            )}
                          </div>
                        ) : (
                          <span className='text-sm text-gray-400'>-</span>
                        )}
                      </td>

                      {/* Cantidad */}
                      <td className='px-4 py-3 text-center'>
                        <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800'>
                          {item.quantity}x
                        </span>
                      </td>

                      {/* Precio Unitario */}
                      <td className='px-4 py-3 text-right'>
                        <span className='text-sm text-gray-700'>
                          {formatCurrency(unitPrice)}
                        </span>
                      </td>

                      {/* Total */}
                      <td className='px-4 py-3 text-right'>
                        <span className='text-sm font-semibold text-green-600'>
                          {formatCurrency(totalPrice)}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </TableCell>
    </TableRow>
  )
}

// ===================================
// UTILITY FUNCTIONS
// ===================================

function formatCurrency(amount: number, currency: string = 'ARS'): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getClientName(order: Order): string {
  const payerName = order.payer_info?.name
  const payerSurname = order.payer_info?.surname
  const profileFirstName = order.user_profiles?.first_name
  const profileLastName = order.user_profiles?.last_name

  if (payerName && payerSurname) {
    return `${payerName} ${payerSurname}`
  }
  if (payerName) {
    return payerName
  }
  if (profileFirstName && profileLastName) {
    return `${profileFirstName} ${profileLastName}`
  }
  if (profileFirstName) {
    return profileFirstName
  }
  return 'Cliente'
}

function getClientPhone(order: Order): string | null {
  return order.payer_info?.phone || order.user_profiles?.phone || null
}

// ===================================
// RESOLVE IMAGE SOURCE (from ProductList)
// ===================================

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
      normalize(payload.url) ||
      normalize(payload.image)
    )
  }

  return null
}

function getProductImage(item: OrderItem): string | null {
  // 1. Intentar desde product_snapshot.image
  const snapshotImage = resolveImageSource(item.product_snapshot?.image)
  if (snapshotImage) return snapshotImage

  // 2. Intentar desde products.images
  const productsImage = resolveImageSource(item.products?.images)
  if (productsImage) return productsImage

  return null
}

// ===================================
// MAIN COMPONENT
// ===================================

export function OrderList({
  orders = [],
  isLoading,
  error,
  selectedOrders: externalSelectedOrders,
  setSelectedOrders: externalSetSelectedOrders,
  filters,
  updateFilters,
  resetFilters,
  pagination,
  onOrderAction,
  className,
}: OrderListProps) {
  const [internalSelectedOrders, setInternalSelectedOrders] = useState<string[]>([])
  const [quickSearchTerm, setQuickSearchTerm] = useState(filters?.search || '')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [sortColumn, setSortColumn] = useState<string | null>(filters?.sort_by || 'created_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>(filters?.sort_order || 'desc')

  // Resizable columns hook
  const {
    columnWidths,
    isResizing,
    justFinishedResizing,
    handleMouseDown,
    tableRef,
  } = useResizableColumns({
    defaultWidths: DEFAULT_COLUMN_WIDTHS,
    minWidth: 50,
    maxWidth: 400,
  })

  // Estado externo o interno para selección
  const selectedOrders = externalSelectedOrders ?? internalSelectedOrders
  const setSelectedOrders = externalSetSelectedOrders ?? setInternalSelectedOrders

  const safeOrders = Array.isArray(orders) ? orders : []

  useEffect(() => {
    setQuickSearchTerm(filters?.search || '')
  }, [filters?.search])

  // ===================================
  // HANDLERS
  // ===================================

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    )
  }

  const handleSelectAll = () => {
    if (selectedOrders.length === safeOrders.length) {
      setSelectedOrders([])
    } else {
      setSelectedOrders(safeOrders.map(order => order.id))
    }
  }

  const handleQuickSearch = () => {
    if (!updateFilters) return
    const nextValue = quickSearchTerm.trim()
    updateFilters({
      search: nextValue || undefined,
      page: 1,
    })
  }

  const handleClearSearch = () => {
    if (!updateFilters) return
    setQuickSearchTerm('')
    updateFilters({ search: undefined, page: 1 })
  }

  const handleSort = (columnKey: string) => {
    if (!updateFilters) return
    
    // Evitar ordenar si acabamos de terminar de redimensionar
    if (justFinishedResizing === columnKey) return

    let newDirection: SortDirection = 'asc'
    
    if (sortColumn === columnKey) {
      if (sortDirection === 'asc') {
        newDirection = 'desc'
      } else if (sortDirection === 'desc') {
        newDirection = null
      } else {
        newDirection = 'asc'
      }
    }

    setSortColumn(newDirection ? columnKey : null)
    setSortDirection(newDirection)

    updateFilters({
      sort_by: newDirection ? columnKey : 'created_at',
      sort_order: newDirection || 'desc',
      page: 1,
    })
  }

  const toggleExpand = (orderId: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(orderId)) {
        next.delete(orderId)
      } else {
        next.add(orderId)
      }
      return next
    })
  }

  const renderSortIcon = (columnKey: string) => {
    if (sortColumn !== columnKey || !sortDirection) {
      return <ArrowUpDown className='w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity' />
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className='w-3.5 h-3.5 text-blue-600' />
    }
    return <ArrowDown className='w-3.5 h-3.5 text-blue-600' />
  }

  const getColumnWidth = (key: string) => {
    return columnWidths[key] || DEFAULT_COLUMN_WIDTHS[key as keyof typeof DEFAULT_COLUMN_WIDTHS] || 100
  }

  // ===================================
  // COLUMN DEFINITIONS
  // ===================================

  const columns = [
    { key: 'select', title: '', sortable: false },
    { key: 'actions', title: '', sortable: false },
    { key: 'order_number', title: 'Número', sortable: true, sortKey: 'id' },
    { key: 'products', title: 'Productos', sortable: false },
    { key: 'cliente', title: 'Cliente', sortable: false },
    { key: 'fecha', title: 'Fecha', sortable: true, sortKey: 'created_at' },
    { key: 'estado', title: 'Estado', sortable: true, sortKey: 'status' },
    { key: 'pago', title: 'Pago', sortable: false },
    { key: 'total', title: 'Total', sortable: true, sortKey: 'total' },
  ]

  const totalColumns = columns.length

  // ===================================
  // RENDER
  // ===================================

  if (error) {
    return (
      <div className='text-center py-8 text-red-600'>
        <p>Error al cargar las órdenes: {error.message || 'Error desconocido'}</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className='text-center py-8'>
        <RefreshCw className='w-8 h-8 animate-spin mx-auto text-gray-400' />
        <p className='mt-2 text-gray-600'>Cargando órdenes...</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Búsqueda rápida */}
      {updateFilters && (
        <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex w-full gap-2'>
            <div className='relative flex-1'>
              <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
              <Input
                value={quickSearchTerm}
                onChange={e => setQuickSearchTerm(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    handleQuickSearch()
                  }
                }}
                placeholder='Buscar por número de orden, cliente o teléfono...'
                className='pl-9'
                aria-label='Buscar órdenes'
              />
            </div>
            <Button
              variant='secondary'
              onClick={handleQuickSearch}
              disabled={!quickSearchTerm.trim() && !filters?.search}
            >
              Buscar
            </Button>
            {(filters?.search || quickSearchTerm) && (
              <Button variant='ghost' onClick={handleClearSearch}>
                Limpiar
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Filtros */}
      {filters && updateFilters && resetFilters && (
        <OrderFilters
          filters={filters}
          updateFilters={updateFilters}
          resetFilters={resetFilters}
        />
      )}

      {/* Listado */}
      {safeOrders.length === 0 ? (
        <div className='border rounded-lg p-8 text-center text-gray-500 bg-white'>
          <Package className='w-16 h-16 mx-auto text-gray-300 mb-4' />
          <p className='text-lg font-medium text-gray-900 mb-2'>No se encontraron órdenes</p>
          <p className='text-sm text-gray-500'>Ajusta los filtros o crea una nueva orden.</p>
        </div>
      ) : (
        <>
          {/* Vista móvil */}
          <div className='space-y-4 lg:hidden'>
            {safeOrders.map(order => (
              <div
                key={`${order.id}-mobile`}
                className='bg-white border border-gray-100 rounded-2xl shadow-sm p-4 space-y-4'
              >
                <div className='flex items-start justify-between gap-3'>
                  <div className='min-w-0 space-y-1'>
                    <p className='text-xs uppercase text-gray-400 tracking-wide'>Orden</p>
                    <p className='text-base font-semibold text-gray-900 truncate'>
                      {order.order_number || `#${order.id}`}
                    </p>
                    <p className='text-sm text-gray-700 truncate'>
                      {getClientName(order)}
                    </p>
                    {getClientPhone(order) && (
                      <div className='flex items-center gap-1'>
                        <span className='text-xs text-gray-500 truncate'>
                          Tel: {getClientPhone(order)}
                        </span>
                        <WhatsAppQuickActions
                          phone={getClientPhone(order)!}
                          orderNumber={order.order_number || `#${order.id}`}
                          clientName={getClientName(order)}
                          total={order.total}
                        />
                      </div>
                    )}
                  </div>
                  <Checkbox
                    checked={selectedOrders.includes(order.id)}
                    onCheckedChange={() => handleSelectOrder(order.id)}
                  />
                </div>

                <div className='flex flex-wrap items-center gap-2'>
                  <OrderStatusBadge status={order.status} />
                  <UnifiedPaymentBadge 
                    method={order.payment_method || order.payer_info?.payment_method} 
                    paymentStatus={order.payment_status} 
                  />
                </div>

                {/* Productos expandibles en móvil */}
                <button
                  onClick={() => toggleExpand(order.id)}
                  className='flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800'
                >
                  <ShoppingBag className='w-4 h-4' />
                  <span>{order.order_items?.length || 0} productos</span>
                  {expandedRows.has(order.id) ? (
                    <ChevronUp className='w-4 h-4' />
                  ) : (
                    <ChevronDown className='w-4 h-4' />
                  )}
                </button>
                
                {expandedRows.has(order.id) && order.order_items && (
                  <div className='space-y-2 mt-2'>
                    {order.order_items.map((item, idx) => (
                      <div key={item.id || idx} className='flex items-center gap-2 text-sm bg-gray-50 rounded p-2'>
                        <span className='font-medium'>{item.quantity}x</span>
                        <span className='truncate flex-1'>
                          {item.product_snapshot?.name || item.products?.name || 'Producto'}
                        </span>
                        <span className='font-semibold'>
                          {formatCurrency((item.price || item.unit_price || 0) * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className='space-y-1 text-sm text-gray-600'>
                  <p className='flex justify-between'>
                    <span className='text-gray-500'>Fecha:</span>
                    <span className='font-medium text-gray-900'>
                      {formatDate(order.created_at)}
                    </span>
                  </p>
                  <p className='flex justify-between'>
                    <span className='text-gray-500'>Total:</span>
                    <span className='font-semibold text-gray-900'>
                      {formatCurrency(order.total, order.currency)}
                    </span>
                  </p>
                </div>

                <div className='flex items-center justify-between pt-3 border-t'>
                  <div className='text-xs text-gray-500'>
                    Actualizada {formatDate(order.updated_at)}
                  </div>
                  <OrderRowActions
                    order={order}
                    onAction={(action: string) => {
                      if (onOrderAction) {
                        onOrderAction(action, order.id)
                      }
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Vista desktop con columnas redimensionables */}
          <div className='hidden lg:block border rounded-lg overflow-hidden bg-white'>
            <div className='overflow-x-auto'>
              <Table ref={tableRef} className='w-full' style={{ tableLayout: 'fixed' }}>
                <TableHeader>
                  <TableRow className='bg-gray-50'>
                    {columns.map((column, index) => {
                      const width = getColumnWidth(column.key)
                      const isResizingColumn = isResizing === column.key
                      const sortKey = column.sortKey || column.key

                      return (
                        <TableHead
                          key={`header-${column.key}-${index}`}
                          className={cn(
                            'relative border-r border-gray-200 last:border-r-0',
                            column.sortable && 'cursor-pointer select-none group hover:bg-gray-100/50 transition-colors',
                            isResizingColumn && 'bg-blue-50'
                          )}
                          style={{ 
                            width: `${width}px`, 
                            minWidth: `${width}px`, 
                            maxWidth: `${width}px` 
                          }}
                          onClick={(e) => {
                            if (column.sortable && !isResizing) {
                              handleSort(sortKey)
                            }
                          }}
                        >
                          <div className='flex items-center gap-1.5 justify-center px-2'>
                            {column.key === 'select' ? (
                              <Checkbox
                                checked={selectedOrders.length === safeOrders.length && safeOrders.length > 0}
                                onCheckedChange={() => handleSelectAll()}
                              />
                            ) : (
                              <>
                                <span className='truncate'>{column.title}</span>
                                {column.sortable && renderSortIcon(sortKey)}
                              </>
                            )}
                          </div>
                          
                          {/* Resize handle */}
                          {column.key !== 'select' && (
                            <div
                              className={cn(
                                'absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-400 transition-colors z-10',
                                isResizingColumn && 'bg-blue-500 w-1.5'
                              )}
                              onMouseDown={(e) => {
                                handleMouseDown(e, column.key)
                              }}
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                              }}
                              title='Arrastra para redimensionar'
                            />
                          )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {safeOrders.map(order => {
                    const isExpanded = expandedRows.has(order.id)
                    const itemCount = order.order_items?.length || 0

                    return (
                      <React.Fragment key={order.id}>
                        <TableRow className={cn('hover:bg-gray-50', isExpanded && 'bg-blue-50/30')}>
                          {/* Checkbox */}
                          <TableCell style={{ width: getColumnWidth('select') }}>
                            <div className='flex justify-center'>
                              <Checkbox
                                checked={selectedOrders.includes(order.id)}
                                onCheckedChange={() => handleSelectOrder(order.id)}
                              />
                            </div>
                          </TableCell>

                          {/* Actions */}
                          <TableCell style={{ width: getColumnWidth('actions') }}>
                            <div className='flex justify-center'>
                              <OrderRowActions
                                order={order}
                                onAction={(action: string) => {
                                  if (onOrderAction) {
                                    onOrderAction(action, order.id)
                                  }
                                }}
                              />
                            </div>
                          </TableCell>

                          {/* Order Number */}
                          <TableCell style={{ width: getColumnWidth('order_number') }}>
                            <span className='font-medium text-gray-900 truncate block'>
                              {order.order_number || `#${order.id}`}
                            </span>
                          </TableCell>

                          {/* Products dropdown */}
                          <TableCell style={{ width: getColumnWidth('products') }}>
                            <button
                              type='button'
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleExpand(order.id)
                              }}
                              className='flex items-center space-x-2 hover:bg-blue-50 px-2 py-1 rounded transition-colors w-full justify-center'
                            >
                              {itemCount > 0 ? (
                                <>
                                  <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
                                    {itemCount} prod.
                                  </span>
                                  {isExpanded ? (
                                    <ChevronUp className='w-4 h-4 text-blue-600' />
                                  ) : (
                                    <ChevronDown className='w-4 h-4 text-gray-400' />
                                  )}
                                </>
                              ) : (
                                <span className='text-sm text-gray-400'>-</span>
                              )}
                            </button>
                          </TableCell>

                          {/* Cliente - Nombre, Apellido y Teléfono con WhatsApp */}
                          <TableCell style={{ width: getColumnWidth('cliente') }}>
                            <div className='min-w-0'>
                              <div className='font-medium text-gray-900 truncate'>
                                {getClientName(order)}
                              </div>
                              {getClientPhone(order) && (
                                <div className='flex items-center gap-1'>
                                  <span className='text-xs text-gray-500 truncate'>
                                    Tel: {getClientPhone(order)}
                                  </span>
                                  <WhatsAppQuickActions
                                    phone={getClientPhone(order)!}
                                    orderNumber={order.order_number || `#${order.id}`}
                                    clientName={getClientName(order)}
                                    total={order.total}
                                  />
                                </div>
                              )}
                            </div>
                          </TableCell>

                          {/* Fecha */}
                          <TableCell style={{ width: getColumnWidth('fecha') }}>
                            <span className='text-sm text-gray-600 truncate block'>
                              {formatDate(order.created_at)}
                            </span>
                          </TableCell>

                          {/* Estado */}
                          <TableCell style={{ width: getColumnWidth('estado') }}>
                            <div className='flex justify-center'>
                              <OrderStatusBadge status={order.status} />
                            </div>
                          </TableCell>

                          {/* Pago (Método + Estado unificado) */}
                          <TableCell style={{ width: getColumnWidth('pago') }}>
                            <div className='flex justify-center'>
                              <UnifiedPaymentBadge 
                                method={order.payment_method || order.payer_info?.payment_method} 
                                paymentStatus={order.payment_status} 
                              />
                            </div>
                          </TableCell>

                          {/* Total */}
                          <TableCell style={{ width: getColumnWidth('total') }}>
                            <span className='font-semibold text-gray-900 block text-right pr-2'>
                              {formatCurrency(order.total, order.currency)}
                            </span>
                          </TableCell>
                        </TableRow>

                        {/* Fila expandible de productos */}
                        <ExpandableOrderItemsRow
                          orderItems={order.order_items}
                          isExpanded={isExpanded}
                          colSpan={totalColumns}
                        />
                      </React.Fragment>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}

      {/* Paginación */}
      {pagination && pagination.totalPages > 1 && (
        <div className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between px-4 lg:px-6 py-4 border rounded-lg bg-white'>
          <div className='text-sm text-gray-700'>
            Mostrando página {pagination.currentPage} de {pagination.totalPages} ({pagination.totalItems} órdenes en total)
          </div>
          <div className='flex items-center gap-2'>
            {pagination.isTransitioning && (
              <span className='text-xs text-gray-500'>Actualizando resultados...</span>
            )}
            <Button
              variant='outline'
              size='sm'
              onClick={() => pagination.prevPage()}
              disabled={!pagination.hasPrev || pagination.isTransitioning}
            >
              <ChevronLeft className='w-4 h-4' />
              Anterior
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => pagination.nextPage()}
              disabled={!pagination.hasNext || pagination.isTransitioning}
            >
              Siguiente
              <ChevronRight className='w-4 h-4 ml-2' />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
