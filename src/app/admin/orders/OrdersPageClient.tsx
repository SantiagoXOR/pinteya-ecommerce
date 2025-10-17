'use client'

import React, { useState } from 'react'
import { AdminLayout } from '@/components/admin/layout/AdminLayout'
import { OrderListSimple } from '@/components/admin/orders/OrderListSimple'
import { NewOrderModal } from '@/components/admin/orders/NewOrderModal'
import { ExportOrdersModal } from '@/components/admin/orders/ExportOrdersModal'
import { OrderDetailsModal } from '@/components/admin/orders/OrderDetailsModal'
import { EditOrderModal } from '@/components/admin/orders/EditOrderModal'
import { Button } from '@/components/ui/button'
import { Plus, Download, RefreshCw } from 'lucide-react'
import { useOrderNotifications } from '@/hooks/admin/useOrderNotifications'

export function OrdersPageClient() {
  const notifications = useOrderNotifications()

  // Estados de modales
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)

  const breadcrumbs = [{ label: 'Admin', href: '/admin' }, { label: 'Órdenes' }]

  const handleViewOrder = (orderId: string) => {
    setSelectedOrderId(orderId)
    setIsDetailsModalOpen(true)
  }

  const handleEditOrder = (orderId: string) => {
    setSelectedOrderId(orderId)
    setIsEditModalOpen(true)
  }

  return (
    <AdminLayout title='Gestión de Órdenes' breadcrumbs={breadcrumbs}>
      <div className='space-y-6'>
        {/* Header con acciones */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>Gestión de Órdenes</h1>
            <p className='text-gray-600 mt-1'>
              Administra y procesa todas las órdenes de tu tienda
            </p>
          </div>
          <div className='flex items-center space-x-3'>
            <Button
              variant='outline'
              onClick={() => setIsExportModalOpen(true)}
              className='flex items-center space-x-2'
            >
              <Download className='w-4 h-4' />
              <span>Exportar</span>
            </Button>
            <Button
              onClick={() => setIsNewOrderModalOpen(true)}
              className='flex items-center space-x-2 bg-blue-600 hover:bg-blue-700'
            >
              <Plus className='w-4 h-4' />
              <span>Nueva Orden</span>
            </Button>
          </div>
        </div>

        {/* Notificaciones de órdenes */}
        {notifications && notifications.length > 0 && (
          <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
            <h3 className='text-sm font-medium text-blue-800 mb-2'>
              Nuevas notificaciones ({notifications.length})
            </h3>
            <div className='space-y-1'>
              {notifications.slice(0, 3).map(notification => (
                <div key={notification.id} className='text-sm text-blue-700'>
                  {notification.message}
                </div>
              ))}
              {notifications.length > 3 && (
                <div className='text-sm text-blue-600'>
                  +{notifications.length - 3} notificaciones más
                </div>
              )}
            </div>
          </div>
        )}

        {/* Lista de órdenes */}
        <OrderListSimple
          onViewOrder={handleViewOrder}
          onEditOrder={handleEditOrder}
          showActions={true}
        />

        {/* Modales */}
        <NewOrderModal
          isOpen={isNewOrderModalOpen}
          onClose={() => setIsNewOrderModalOpen(false)}
          onSuccess={() => {
            setIsNewOrderModalOpen(false)
            // Refrescar lista de órdenes
          }}
        />

        <ExportOrdersModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
        />

        {selectedOrderId && (
          <>
            <OrderDetailsModal
              orderId={selectedOrderId}
              isOpen={isDetailsModalOpen}
              onClose={() => {
                setIsDetailsModalOpen(false)
                setSelectedOrderId(null)
              }}
              onEdit={() => {
                setIsDetailsModalOpen(false)
                setIsEditModalOpen(true)
              }}
            />

            <EditOrderModal
              orderId={selectedOrderId}
              isOpen={isEditModalOpen}
              onClose={() => {
                setIsEditModalOpen(false)
                setSelectedOrderId(null)
              }}
              onSuccess={() => {
                setIsEditModalOpen(false)
                setSelectedOrderId(null)
                // Refrescar lista de órdenes
              }}
            />
          </>
        )}
      </div>
    </AdminLayout>
  )
}
