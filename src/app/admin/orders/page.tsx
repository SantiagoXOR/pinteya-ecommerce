'use client';

import React, { useState } from 'react';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { OrderListSimple } from '@/components/admin/orders/OrderListSimple';
import { NewOrderModal } from '@/components/admin/orders/NewOrderModal';
import { ExportOrdersModal } from '@/components/admin/orders/ExportOrdersModal';
import { OrderDetailsModal } from '@/components/admin/orders/OrderDetailsModal';
import { EditOrderModal } from '@/components/admin/orders/EditOrderModal';
import { Button } from '@/components/ui/button';
import { Plus, Download, RefreshCw } from 'lucide-react';
import { useOrderNotifications } from '@/hooks/admin/useOrderNotifications';

export default function OrdersPage() {
  const notifications = useOrderNotifications();

  // Estados de modales
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  // Estado para refrescar la lista
  const [refreshKey, setRefreshKey] = useState(0);

  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'Órdenes' }
  ];

  // Funciones de manejo de modales
  const handleNewOrder = () => {
    setIsNewOrderModalOpen(true);
  };

  const handleExport = () => {
    setIsExportModalOpen(true);
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    notifications.showProcessingInfo('Actualizando lista de órdenes');
  };

  const handleOrderCreated = (order: any) => {
    setRefreshKey(prev => prev + 1);
    // El modal ya muestra la notificación de éxito
  };

  const handleViewOrder = (orderId: number) => {
    setSelectedOrderId(orderId);
    setIsDetailsModalOpen(true);
  };

  const handleEditOrder = (orderId: number) => {
    setSelectedOrderId(orderId);
    setIsEditModalOpen(true);
  };

  const handleOrderUpdated = (order: any) => {
    setRefreshKey(prev => prev + 1);
    // El modal ya muestra la notificación de éxito
  };

  const actions = (
    <div className="flex items-center gap-3">
      <Button
        onClick={handleRefresh}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <RefreshCw className="h-4 w-4" />
        Actualizar
      </Button>
      <Button
        onClick={handleExport}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <Download className="h-4 w-4" />
        Exportar
      </Button>
      <Button
        onClick={handleNewOrder}
        size="sm"
        className="flex items-center gap-2 bg-blaze-orange-600 hover:bg-blaze-orange-700"
      >
        <Plus className="h-4 w-4" />
        Nueva Orden
      </Button>
    </div>
  );

  return (
    <>
      <AdminLayout
        title="Gestión de Órdenes"
        breadcrumbs={breadcrumbs}
        actions={actions}
      >
        <div className="space-y-6">
          {/* Orders List - Componente simplificado completamente funcional */}
          <OrderListSimple
            key={refreshKey}
            onViewOrder={handleViewOrder}
            onEditOrder={handleEditOrder}
          />
        </div>
      </AdminLayout>

      {/* Modales */}
      <NewOrderModal
        isOpen={isNewOrderModalOpen}
        onClose={() => setIsNewOrderModalOpen(false)}
        onOrderCreated={handleOrderCreated}
      />

      <ExportOrdersModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        totalOrders={72} // Este valor debería venir del estado real
      />

      <OrderDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        orderId={selectedOrderId}
      />

      <EditOrderModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        orderId={selectedOrderId}
        onOrderUpdated={handleOrderUpdated}
      />
    </>
  );
}