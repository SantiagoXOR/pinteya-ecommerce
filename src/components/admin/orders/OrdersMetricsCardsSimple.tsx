'use client';

import React from 'react';

interface OrderStats {
  total_orders?: number;
  pending_orders?: number;
  completed_orders?: number;
  today_orders?: number;
  today_revenue?: number;
}

interface OrdersMetricsCardsSimpleProps {
  stats: OrderStats | null;
  isLoading?: boolean;
  className?: string;
}

export function OrdersMetricsCardsSimple({ 
  stats, 
  isLoading = false, 
  className = "" 
}: OrdersMetricsCardsSimpleProps) {
  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-white border rounded-lg p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // PROTECCIÓN TOTAL: Verificar que stats existe y tiene propiedades válidas
  const safeStats = stats || {};
  const totalOrders = Number(safeStats.total_orders) || 0;
  const pendingOrders = Number(safeStats.pending_orders) || 0;
  const completedOrders = Number(safeStats.completed_orders) || 0;
  const todayRevenue = Number(safeStats.today_revenue) || 0;

  // Calcular métricas adicionales
  const completionRate = totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(1) : '0.0';
  const pendingChange = pendingOrders > 0 ? `+${pendingOrders}` : '0';
  const todayRevenueValue = stats?.today_revenue || 0;

  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
            </div>
            <div className="mt-4">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Órdenes</p>
            <p className="text-2xl font-bold text-gray-900">{totalOrders.toLocaleString()}</p>
          </div>
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <span className="text-blue-600 text-xl">📦</span>
          </div>
        </div>
        <div className="mt-4">
          <span className="text-green-600 text-sm font-medium">Activo</span>
          <span className="text-gray-500 text-sm ml-1">sistema funcionando</span>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Pendientes</p>
            <p className="text-2xl font-bold text-gray-900">{pendingOrders.toLocaleString()}</p>
          </div>
          <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
            <span className="text-yellow-600 text-xl">⏳</span>
          </div>
        </div>
        <div className="mt-4">
          <span className="text-orange-600 text-sm font-medium">{pendingChange}</span>
          <span className="text-gray-500 text-sm ml-1">requieren atención</span>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Completadas</p>
            <p className="text-2xl font-bold text-gray-900">{completedOrders.toLocaleString()}</p>
          </div>
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <span className="text-green-600 text-xl">✅</span>
          </div>
        </div>
        <div className="mt-4">
          <span className="text-green-600 text-sm font-medium">{completionRate}%</span>
          <span className="text-gray-500 text-sm ml-1">tasa éxito</span>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Ingresos Hoy</p>
            <p className="text-2xl font-bold text-gray-900">${todayRevenueValue.toLocaleString()}</p>
          </div>
          <div className="w-12 h-12 bg-blaze-orange-100 rounded-lg flex items-center justify-center">
            <span className="text-blaze-orange-600 text-xl">💰</span>
          </div>
        </div>
        <div className="mt-4">
          <span className="text-green-600 text-sm font-medium">En tiempo real</span>
          <span className="text-gray-500 text-sm ml-1">datos actuales</span>
        </div>
      </div>
    </div>
  );
}









