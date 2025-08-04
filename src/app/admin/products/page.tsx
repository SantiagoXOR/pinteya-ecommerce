'use client';

import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { AdminCard } from '@/components/admin/ui/AdminCard';
import { ProductList } from '@/components/admin/products/ProductList';
import { Package, Plus, TrendingUp, AlertTriangle } from 'lucide-react';

// Quick stats component
function ProductStats() {
  // TODO: Fetch real stats from API
  const stats = [
    {
      title: 'Total Productos',
      value: '156',
      change: '+12%',
      changeType: 'positive' as const,
      icon: Package,
    },
    {
      title: 'Productos Activos',
      value: '142',
      change: '+8%',
      changeType: 'positive' as const,
      icon: TrendingUp,
    },
    {
      title: 'Stock Bajo',
      value: '8',
      change: '-2',
      changeType: 'negative' as const,
      icon: AlertTriangle,
    },
    {
      title: 'Sin Stock',
      value: '3',
      change: '+1',
      changeType: 'negative' as const,
      icon: AlertTriangle,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {stats.map((stat) => (
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
                  : 'text-red-600'
              }`}>
                {stat.change} desde el mes pasado
              </p>
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              stat.changeType === 'positive'
                ? 'bg-green-100'
                : 'bg-red-100'
            }`}>
              {stat && stat.icon && (
                <stat.icon className={`w-6 h-6 ${
                  stat.changeType === 'positive'
                    ? 'text-green-600'
                    : 'text-red-600'
                }`} />
              )}
            </div>
          </div>
        </AdminCard>
      ))}
    </div>
  );
}

export default function ProductsPage() {
  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'Productos' },
  ];

  const actions = (
    <button
      onClick={() => window.location.href = '/admin/products/new'}
      className="flex items-center space-x-2 px-4 py-2 bg-blaze-orange-600 hover:bg-blaze-orange-700 text-white rounded-lg transition-colors"
    >
      <Plus className="w-4 h-4" />
      <span>Nuevo Producto</span>
    </button>
  );

  return (
    <AdminLayout
      title="Gestión de Productos"
      breadcrumbs={breadcrumbs}
      actions={actions}
    >
      <div className="space-y-6">
        {/* Quick Stats */}
        <ProductStats />

        {/* Main Content */}
        <AdminCard
          title="Lista de Productos"
          description="Gestiona todos los productos de tu tienda"
          padding="none"
        >
          <div className="p-6">
            <ProductList />
          </div>
        </AdminCard>
      </div>
    </AdminLayout>
  );
}
