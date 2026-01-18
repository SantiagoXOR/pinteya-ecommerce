'use client'

import React from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import {
  Eye,
  Edit,
  Printer,
  RefreshCw,
  XCircle,
  DollarSign,
  MoreHorizontal,
  History,
  CheckCircle,
  Truck,
} from '@/lib/optimized-imports'

interface Order {
  id: string
  order_number: string
  status: string
  payment_status: string
}

interface OrderRowActionsProps {
  order: Order
  onAction: (action: string) => void
}

export function OrderRowActions({ order, onAction }: OrderRowActionsProps) {
  return (
    <div className='flex items-center gap-2'>
      {/* Botón Ver - visible en desktop */}
      <Button
        variant='ghost'
        size='sm'
        onClick={() => onAction('view')}
        className='hidden sm:inline-flex'
        title='Ver detalles'
      >
        <Eye className='w-4 h-4' />
      </Button>

      {/* Botón Editar - visible en desktop */}
      <Button
        variant='ghost'
        size='sm'
        onClick={() => onAction('edit')}
        className='hidden sm:inline-flex'
        title='Editar orden'
      >
        <Edit className='w-4 h-4' />
      </Button>

      {/* Menú de acciones adicionales */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' size='sm'>
            <MoreHorizontal className='w-4 h-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-48'>
          {/* Acciones visibles en móvil */}
          <DropdownMenuItem
            onClick={() => onAction('view')}
            className='sm:hidden'
          >
            <Eye className='w-4 h-4 mr-2' />
            Ver Detalles
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onAction('edit')}
            className='sm:hidden'
          >
            <Edit className='w-4 h-4 mr-2' />
            Editar Orden
          </DropdownMenuItem>
          <DropdownMenuSeparator className='sm:hidden' />

          {/* Acciones adicionales */}
          <DropdownMenuItem onClick={() => onAction('history')}>
            <History className='w-4 h-4 mr-2' />
            Ver Historial
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAction('print')}>
            <Printer className='w-4 h-4 mr-2' />
            Imprimir
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Acciones de cambio de estado */}
          {order.status !== 'processing' && order.status !== 'cancelled' && order.status !== 'delivered' && (
            <DropdownMenuItem onClick={() => onAction('process')}>
              <RefreshCw className='w-4 h-4 mr-2 text-blue-600' />
              Marcar como En Proceso
            </DropdownMenuItem>
          )}

          {order.status !== 'delivered' && order.status !== 'cancelled' && (
            <DropdownMenuItem onClick={() => onAction('deliver')}>
              <Truck className='w-4 h-4 mr-2 text-green-600' />
              Marcar como Entregada
            </DropdownMenuItem>
          )}

          {/* Marcar como pagada - solo si no está pagada */}
          {order.payment_status !== 'paid' && order.status !== 'cancelled' && (
            <DropdownMenuItem 
              onClick={() => onAction('mark_paid')}
              className='text-green-600 focus:text-green-600'
            >
              <CheckCircle className='w-4 h-4 mr-2' />
              Marcar como Pagada
            </DropdownMenuItem>
          )}

          {/* Acciones críticas */}
          <DropdownMenuSeparator />

          {order.payment_status === 'paid' && order.status !== 'refunded' && (
            <DropdownMenuItem
              onClick={() => onAction('refund')}
              className='text-orange-600 focus:text-orange-600'
            >
              <DollarSign className='w-4 h-4 mr-2' />
              Reembolsar
            </DropdownMenuItem>
          )}

          {order.status !== 'cancelled' && order.status !== 'delivered' && (
            <DropdownMenuItem
              onClick={() => onAction('cancel')}
              className='text-red-600 focus:text-red-600'
            >
              <XCircle className='w-4 h-4 mr-2' />
              Cancelar Orden
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

interface OrderActionsProps {
  selectedOrders: string[]
  onBulkAction: (action: string, orderIds: string[]) => void
}

export function OrderActions({ selectedOrders, onBulkAction }: OrderActionsProps) {
  if (selectedOrders.length === 0) {
    return null
  }

  return (
    <div className='flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
      <span className='text-sm font-medium text-blue-900'>
        {selectedOrders.length} orden(es) seleccionada(s)
      </span>
      <div className='flex items-center gap-2 ml-auto'>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='outline' size='sm'>
              Acciones Masivas
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuItem
              onClick={() => onBulkAction('update_status', selectedOrders)}
            >
              <RefreshCw className='w-4 h-4 mr-2' />
              Actualizar Estado
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onBulkAction('export', selectedOrders)}
            >
              <Download className='w-4 h-4 mr-2' />
              Exportar Seleccionadas
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onBulkAction('mark_processing', selectedOrders)}
            >
              <RefreshCw className='w-4 h-4 mr-2' />
              Marcar como En Proceso
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onBulkAction('cancel', selectedOrders)}
              className='text-red-600 focus:text-red-600'
            >
              <XCircle className='w-4 h-4 mr-2' />
              Cancelar Seleccionadas
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}



