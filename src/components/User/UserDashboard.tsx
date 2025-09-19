'use client';

import React from 'react';
import { useUserDashboard } from '@/hooks/useUserDashboard';
import { 
  ShoppingBag, 
  DollarSign, 
  Monitor, 
  Clock,
  TrendingUp,
  Package,
  User,
  Settings
} from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils/consolidated-utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  href?: string;
}

function StatCard({ title, value, icon: Icon, color, href }: StatCardProps) {
  const content = (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow ${href ? 'cursor-pointer' : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

export function UserDashboard() {
  const { dashboard, loading, error } = useUserDashboard();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-red-800 mb-2">Error al cargar el dashboard</h3>
        <p className="text-red-600">
          {error instanceof Error ? error.message : error?.toString() || 'Error desconocido'}
        </p>
      </div>
    );
  }

  const stats = dashboard?.statistics;
  const user = dashboard?.user;
  const recentOrders = dashboard?.recent_orders || [];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          ¡Bienvenido, {user?.name || 'Usuario'}!
        </h1>
        <p className="text-gray-600">
          Aquí puedes gestionar tu perfil, ver tus órdenes y configurar tu cuenta.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total de Órdenes"
          value={stats?.total_orders || 0}
          icon={ShoppingBag}
          color="bg-blue-500"
          href="/orders"
        />
        <StatCard
          title="Total Gastado"
          value={formatCurrency(stats?.total_spent || 0)}
          icon={DollarSign}
          color="bg-green-500"
        />
        <StatCard
          title="Órdenes Pendientes"
          value={stats?.pending_orders || 0}
          icon={Clock}
          color="bg-yellow-500"
          href="/orders"
        />
        <StatCard
          title="Sesiones Activas"
          value="1" // Por ahora hardcodeado
          icon={Monitor}
          color="bg-purple-500"
          href="/dashboard/sessions"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link 
            href="/dashboard/profile"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <User className="h-8 w-8 text-blue-500 mr-3" />
            <div>
              <h3 className="font-medium text-gray-900">Editar Perfil</h3>
              <p className="text-sm text-gray-600">Actualiza tu información personal</p>
            </div>
          </Link>
          
          <Link 
            href="/dashboard/security"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Settings className="h-8 w-8 text-green-500 mr-3" />
            <div>
              <h3 className="font-medium text-gray-900">Configurar Seguridad</h3>
              <p className="text-sm text-gray-600">Gestiona tu seguridad</p>
            </div>
          </Link>
          
          <Link 
            href="/orders"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Package className="h-8 w-8 text-purple-500 mr-3" />
            <div>
              <h3 className="font-medium text-gray-900">Ver Órdenes</h3>
              <p className="text-sm text-gray-600">Revisa tus compras</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Orders */}
      {recentOrders.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Órdenes Recientes</h2>
            <Link 
              href="/orders"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Ver todas
            </Link>
          </div>
          <div className="space-y-3">
            {recentOrders.slice(0, 3).map((order: any) => (
              <div key={order.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Orden #{order.id}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{formatCurrency(order.total)}</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                    order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}









