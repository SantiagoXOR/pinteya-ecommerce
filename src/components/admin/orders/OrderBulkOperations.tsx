'use client'

import React, { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  RefreshCw,
  Download,
  XCircle,
  CheckCircle,
  Truck,
  Package,
  ChevronDown,
} from '@/lib/optimized-imports'

interface OrderBulkOperationsProps {
  selectedOrders: string[]
  onBulkAction: (action: string, orderIds: string[]) => void
}

export function OrderBulkOperations({
  selectedOrders,
  onBulkAction,
}: OrderBulkOperationsProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingAction, setPendingAction] = useState<{
    action: string
    label: string
  } | null>(null)

  if (selectedOrders.length === 0) {
    return null
  }

  const handleActionClick = (action: string, label: string, needsConfirm: boolean) => {
    if (needsConfirm) {
      setPendingAction({ action, label })
      setShowConfirmDialog(true)
    } else {
      onBulkAction(action, selectedOrders)
    }
  }

  const handleConfirm = () => {
    if (pendingAction) {
      onBulkAction(pendingAction.action, selectedOrders)
    }
    setShowConfirmDialog(false)
    setPendingAction(null)
  }

  return (
    <>
      <div className='flex items-center gap-3'>
        <div className='flex items-center space-x-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg'>
          <Package className='w-4 h-4 text-blue-600' />
          <span className='text-sm font-medium text-blue-900'>
            {selectedOrders.length} seleccionada(s)
          </span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='outline' size='sm' className='gap-2'>
              Acciones Masivas
              <ChevronDown className='w-4 h-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-56'>
            {/* Cambios de estado */}
            <DropdownMenuItem
              onClick={() =>
                handleActionClick('confirm', 'Confirmar órdenes', false)
              }
            >
              <CheckCircle className='w-4 h-4 mr-2 text-blue-600' />
              Confirmar Órdenes
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                handleActionClick('process', 'Marcar como en proceso', false)
              }
            >
              <RefreshCw className='w-4 h-4 mr-2 text-orange-600' />
              Marcar como En Proceso
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                handleActionClick('ship', 'Marcar como enviadas', false)
              }
            >
              <Truck className='w-4 h-4 mr-2 text-purple-600' />
              Marcar como Enviadas
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                handleActionClick('deliver', 'Marcar como entregadas', false)
              }
            >
              <CheckCircle className='w-4 h-4 mr-2 text-green-600' />
              Marcar como Entregadas
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Exportar */}
            <DropdownMenuItem
              onClick={() => handleActionClick('export', 'Exportar', false)}
            >
              <Download className='w-4 h-4 mr-2' />
              Exportar Seleccionadas
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Acciones críticas */}
            <DropdownMenuItem
              onClick={() =>
                handleActionClick('cancel', 'Cancelar órdenes', true)
              }
              className='text-red-600 focus:text-red-600'
            >
              <XCircle className='w-4 h-4 mr-2' />
              Cancelar Órdenes
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Diálogo de confirmación */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar acción?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de <strong>{pendingAction?.label}</strong> en{' '}
              <strong>{selectedOrders.length}</strong> orden(es).
              <br />
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}



