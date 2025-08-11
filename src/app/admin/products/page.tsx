'use client';

import { AdminCard } from '@/components/admin/ui/AdminCard';
import { ProductList } from '@/components/admin/products/ProductList';
import { Package, TrendingUp, AlertTriangle, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ProductStatsData {
  total_products: number;
  active_products: number;
  low_stock_products: number;
  no_stock_products: number;
}

// Quick stats component
function ProductStats() {
  const [statsData, setStatsData] = useState<ProductStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);

        // Obtener datos reales directamente desde la API de productos
        const response = await fetch('/api/products');

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const products = await response.json();

        // Calcular estadísticas reales
        const totalProducts = products.length;
        const activeProducts = products.filter((p: any) => p.stock > 0).length;
        const lowStockProducts = products.filter((p: any) => p.stock > 0 && p.stock <= 10).length;
        const noStockProducts = products.filter((p: any) => p.stock === 0 || p.stock === null).length;

        setStatsData({
          total_products: totalProducts,
          active_products: activeProducts,
          low_stock_products: lowStockProducts,
          no_stock_products: noStockProducts
        });

      } catch (err) {
        console.error('Error fetching product stats:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Valores por defecto mientras carga
  const defaultStats = {
    total_products: 0,
    active_products: 0,
    low_stock_products: 0,
    no_stock_products: 0
  };

  const currentStats = statsData || defaultStats;

  const stats = [
    {
      title: 'Total Productos',
      value: loading ? '...' : currentStats.total_products.toString(),
      change: '+12%',
      changeType: 'positive' as const,
      icon: Package,
    },
    {
      title: 'Productos Activos',
      value: loading ? '...' : currentStats.active_products.toString(),
      change: '+8%',
      changeType: 'positive' as const,
      icon: TrendingUp,
    },
    {
      title: 'Stock Bajo',
      value: loading ? '...' : currentStats.low_stock_products.toString(),
      change: '-2',
      changeType: 'negative' as const,
      icon: AlertTriangle,
    },
    {
      title: 'Sin Stock',
      value: loading ? '...' : currentStats.no_stock_products.toString(),
      change: '+1',
      changeType: 'negative' as const,
      icon: AlertTriangle,
    },
  ];

  if (error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <AdminCard className="p-6 col-span-full">
          <div className="text-center text-red-600">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
            <p className="font-medium">Error cargando estadísticas</p>
            <p className="text-sm text-gray-500 mt-1">{error}</p>
          </div>
        </AdminCard>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {stats.map((stat) => (
        <AdminCard key={stat.title} className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {stat.title}
              </p>
              <p className={`text-2xl font-bold mt-1 ${
                loading ? 'text-gray-400' : 'text-gray-900'
              }`}>
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
              {stat?.icon && (
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

  // Botón para crear nuevo producto - Plus icon importado correctamente
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
