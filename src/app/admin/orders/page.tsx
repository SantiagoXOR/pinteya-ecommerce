'use client';

import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { AdminCard } from '@/components/admin/ui/AdminCard';
import { ShoppingCart, Package, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export default function OrdersPage() {
  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'Órdenes' },
  ];

  // Datos de ejemplo para mostrar
  const orderStats = [
    {
      title: 'Total Órdenes',
      value: '23',
      change: '+5%',
      changeType: 'positive' as const,
      icon: ShoppingCart,
    },
    {
      title: 'Pendientes',
      value: '8',
      change: '+2',
      changeType: 'neutral' as const,
      icon: Clock,
    },
    {
      title: 'Completadas',
      value: '12',
      change: '+3',
      changeType: 'positive' as const,
      icon: CheckCircle,
    },
    {
      title: 'Canceladas',
      value: '3',
      change: '0',
      changeType: 'neutral' as const,
      icon: XCircle,
    },
  ];

  const mockOrders = [
    {
      id: '#001',
      customer: 'Juan Pérez',
      email: 'juan@example.com',
      status: 'pending',
      total: '$15,000',
      items: 3,
      date: '2025-01-03',
    },
    {
      id: '#002',
      customer: 'María García',
      email: 'maria@example.com',
      status: 'processing',
      total: '$8,500',
      items: 2,
      date: '2025-01-02',
    },
    {
      id: '#003',
      customer: 'Carlos López',
      email: 'carlos@example.com',
      status: 'completed',
      total: '$12,000',
      items: 1,
      date: '2025-01-01',
    },
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-800' },
      processing: { label: 'Procesando', className: 'bg-blue-100 text-blue-800' },
      completed: { label: 'Completada', className: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Cancelada', className: 'bg-red-100 text-red-800' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>
        {config.label}
      </span>
    );
  };

  return (
    <AdminLayout
      title="Gestión de Órdenes"
      breadcrumbs={breadcrumbs}
    >
      <div className="space-y-6">
        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {orderStats.map((stat) => (
            <AdminCard key={stat.title} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stat.value}
                  </p>
                  <p className={`text-sm mt-1 ${
                    stat.changeType === 'positive' 
                      ? 'text-green-600' 
                      : stat.changeType === 'negative'
                      ? 'text-red-600'
                      : 'text-gray-600'
                  }`}>
                    {stat.change} desde el mes pasado
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  stat.changeType === 'positive'
                    ? 'bg-green-100'
                    : stat.changeType === 'negative'
                    ? 'bg-red-100'
                    : 'bg-gray-100'
                }`}>
                  {stat && stat.icon && (
                    <stat.icon className={`w-6 h-6 ${
                      stat.changeType === 'positive'
                        ? 'text-green-600'
                        : stat.changeType === 'negative'
                        ? 'text-red-600'
                        : 'text-gray-600'
                    }`} />
                  )}
                </div>
              </div>
            </AdminCard>
          ))}
        </div>

        {/* Aviso de funcionalidad en desarrollo */}
        <AdminCard className="p-6">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Módulo en Desarrollo
              </h3>
              <p className="text-gray-600 mt-1">
                La gestión completa de órdenes estará disponible en una próxima versión. 
                Actualmente puedes ver las estadísticas básicas y datos de ejemplo.
              </p>
            </div>
          </div>
        </AdminCard>

        {/* Lista de órdenes de ejemplo */}
        <AdminCard
          title="Órdenes Recientes"
          description="Vista previa de las últimas órdenes (datos de ejemplo)"
          padding="none"
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Orden
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mockOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Package className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">
                          {order.id}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {order.customer}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.total}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminCard>
      </div>
    </AdminLayout>
  );
}
