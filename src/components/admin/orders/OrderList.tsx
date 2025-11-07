'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { ChevronLeft, ChevronRight } from 'lucide-react'
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
  CreditCard
} from 'lucide-react'
import { OrderFilters } from './OrderFilters'
import { OrderRowActions } from './OrderActions'

interface Order {
  id: string
  order_number: string
  status: OrderStatus
  payment_status: PaymentStatus
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
  }
  user_profiles?: {
    id: string
    name: string
    email: string
  }
  order_items: OrderItem[]
}

interface OrderItem {
  id: string
  product_id: number
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
  products?: {
    id: number
    name: string
    images: string[]
  }
}

type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'

type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

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
  }
  onOrderAction?: (action: string, orderId: string) => void
  className?: string
}

// Status Badge Component para órdenes
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

// Payment Status Badge Component
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
  }

  const config = statusConfig[status]
  const Icon = config && config.icon ? config.icon : CreditCard

  return (
    <span
      className={cn(
        'inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-full border',
        config && config.className ? config.className : 'bg-gray-100 text-gray-800 border-gray-200'
      )}
    >
      <Icon className='w-3 h-3' />
      <span>{config && config.label ? config.label : 'Pago'}</span>
    </span>
  )
}

// Función para formatear moneda
function formatCurrency(amount: number, currency: string = 'ARS'): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

// Función para formatear fecha
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

export function OrderList({
  orders = [], // Valor por defecto para evitar undefined
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
  const router = useRouter()
  const [internalSelectedOrders, setInternalSelectedOrders] = useState<string[]>([])

  // Usar estado externo si se proporciona, sino usar estado interno
  const selectedOrders = externalSelectedOrders ?? internalSelectedOrders
  const setSelectedOrders = externalSetSelectedOrders ?? setInternalSelectedOrders

  // Asegurar que orders siempre sea un array
  const safeOrders = Array.isArray(orders) ? orders : []

  // Debug
  console.log('📋 OrderList Debug:', {
    ordersReceived: orders,
    safeOrdersLength: safeOrders.length,
    isLoading,
    error,
    filters,
  })

  // Handle row selection
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
      {/* Filtros */}
      {filters && updateFilters && resetFilters && (
        <OrderFilters
          filters={filters}
          updateFilters={updateFilters}
          resetFilters={resetFilters}
        />
      )}

      {/* Tabla de órdenes */}
      <div className='border rounded-lg overflow-hidden'>
        <div className='overflow-x-auto'>
          <Table>
            <TableHeader>
              <TableRow className='bg-gray-50'>
                <TableHead className='w-12'>
                  <Checkbox
                    checked={selectedOrders.length === safeOrders.length && safeOrders.length > 0}
                    onCheckedChange={() => handleSelectAll()}
                  />
                </TableHead>
                <TableHead>Número de Orden</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Pago</TableHead>
                <TableHead className='text-right'>Total</TableHead>
                <TableHead className='text-right'>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {safeOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className='text-center py-8'>
                    <Package className='w-16 h-16 mx-auto text-gray-300 mb-4' />
                    <p className='text-lg font-medium text-gray-900 mb-2'>No se encontraron órdenes</p>
                    <p className='text-sm text-gray-500'>No hay órdenes que coincidan con los filtros aplicados</p>
                  </TableCell>
                </TableRow>
              ) : (
                safeOrders.map((order) => (
                  <TableRow key={order.id} className='hover:bg-gray-50'>
                    <TableCell>
                      <Checkbox
                        checked={selectedOrders.includes(order.id)}
                        onCheckedChange={() => handleSelectOrder(order.id)}
                      />
                    </TableCell>
                    <TableCell className='font-medium text-gray-900'>
                      {order.order_number || `#${order.id}`}
                    </TableCell>
                    <TableCell>
                      <div className='min-w-[150px]'>
                        <div className='font-medium text-gray-900'>
                          {order.payer_info?.name ||
                            order.user_profiles?.name ||
                            'Cliente no especificado'}
                        </div>
                        {(order.payer_info?.email || order.user_profiles?.email) && (
                          <div className='text-sm text-gray-500'>
                            {order.payer_info?.email || order.user_profiles?.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className='text-sm text-gray-600'>
                      {formatDate(order.created_at)}
                    </TableCell>
                    <TableCell>
                      <OrderStatusBadge status={order.status} />
                    </TableCell>
                    <TableCell>
                      <PaymentStatusBadge status={order.payment_status} />
                    </TableCell>
                    <TableCell className='text-right font-semibold text-gray-900'>
                      {formatCurrency(order.total, order.currency)}
                    </TableCell>
                    <TableCell className='text-right'>
                      <OrderRowActions
                        order={order}
                        onAction={(action: string) => {
                          if (onOrderAction) {
                            onOrderAction(action, order.id)
                          }
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Paginación */}
        {pagination && pagination.totalPages > 1 && (
          <div className='flex items-center justify-between px-6 py-4 border-t bg-gray-50'>
            <div className='text-sm text-gray-700'>
              Mostrando página {pagination.currentPage} de {pagination.totalPages}
              {' '}({pagination.totalItems} órdenes en total)
            </div>
            <div className='flex items-center space-x-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => pagination.prevPage()}
                disabled={!pagination.hasPrev}
              >
                <ChevronLeft className='w-4 h-4' />
                Anterior
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => pagination.nextPage()}
                disabled={!pagination.hasNext}
              >
                Siguiente
                <ChevronRight className='w-4 h-4' />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

