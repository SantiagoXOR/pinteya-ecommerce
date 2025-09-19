/**
 * Dashboard de Analytics para Pinteya E-commerce
 * Visualización de métricas, conversiones y comportamiento de usuarios
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  ShoppingCart, 
  Eye, 
  Users, 
  DollarSign, 
  BarChart3,
  Clock,
  Search,
  Target,
  Activity
} from 'lucide-react';
import { useAnalytics, useRealTimeMetrics } from '@/hooks/useAnalytics';

interface MetricsData {
  ecommerce: {
    cartAdditions: number;
    cartRemovals: number;
    checkoutStarts: number;
    checkoutCompletions: number;
    productViews: number;
    categoryViews: number;
    searchQueries: number;
    conversionRate: number;
    cartAbandonmentRate: number;
    productToCartRate: number;
    averageOrderValue: number;
    totalRevenue: number;
  };
  engagement: {
    uniqueSessions: number;
    uniqueUsers: number;
    averageEventsPerSession: number;
    averageSessionDuration: number;
    topPages: Array<{ page: string; views: number }>;
    topProducts: Array<{ productId: string; productName: string; views: number }>;
  };
  trends: {
    dailyEvents: Array<{ date: string; count: number }>;
    hourlyEvents: Array<{ hour: number; count: number }>;
  };
  orders: {
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
  };
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: string;
  format?: 'number' | 'currency' | 'percentage';
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  change, 
  icon, 
  color,
  format = 'number' 
}) => {
  const formatValue = (val: string | number) => {
    if (typeof val === 'string') {return val;}
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('es-AR', {
          style: 'currency',
          currency: 'ARS',
        }).format(val);
      case 'percentage':
        return `${val.toFixed(1)}%`;
      default:
        return val.toLocaleString();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {formatValue(value)}
          </p>
          {change !== undefined && (
            <div className={`flex items-center mt-2 text-sm ${
              change >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              <TrendingUp className={`w-4 h-4 mr-1 ${change < 0 ? 'rotate-180' : ''}`} />
              {Math.abs(change).toFixed(1)}%
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
};

const AnalyticsDashboard: React.FC = () => {
  const [metricsData, setMetricsData] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const realTimeMetrics = useRealTimeMetrics();

  useEffect(() => {
    fetchMetrics();
  }, [timeRange]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const endDate = new Date().toISOString();
      const startDate = new Date(
        Date.now() - (timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 1) * 24 * 60 * 60 * 1000
      ).toISOString();

      const response = await fetch(`/api/analytics/metrics?startDate=${startDate}&endDate=${endDate}`);
      const data = await response.json();
      setMetricsData(data);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!metricsData) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Error cargando métricas</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Métricas y análisis de Pinteya E-commerce</p>
        </div>
        
        <div className="flex gap-2">
          {['1d', '7d', '30d'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-yellow-400 text-gray-900'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {range === '1d' ? 'Hoy' : range === '7d' ? '7 días' : '30 días'}
            </button>
          ))}
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Vistas de productos"
          value={metricsData.ecommerce.productViews}
          icon={<Eye className="w-6 h-6 text-white" />}
          color="bg-blue-500"
        />
        
        <MetricCard
          title="Agregados al carrito"
          value={metricsData.ecommerce.cartAdditions}
          icon={<ShoppingCart className="w-6 h-6 text-white" />}
          color="bg-green-500"
        />
        
        <MetricCard
          title="Tasa de conversión"
          value={metricsData.ecommerce.conversionRate}
          icon={<Target className="w-6 h-6 text-white" />}
          color="bg-purple-500"
          format="percentage"
        />
        
        <MetricCard
          title="Valor promedio de orden"
          value={metricsData.ecommerce.averageOrderValue}
          icon={<DollarSign className="w-6 h-6 text-white" />}
          color="bg-yellow-500"
          format="currency"
        />
      </div>

      {/* Métricas de engagement */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Sesiones únicas"
          value={metricsData.engagement.uniqueSessions}
          icon={<Users className="w-6 h-6 text-white" />}
          color="bg-indigo-500"
        />
        
        <MetricCard
          title="Usuarios únicos"
          value={metricsData.engagement.uniqueUsers}
          icon={<Activity className="w-6 h-6 text-white" />}
          color="bg-pink-500"
        />
        
        <MetricCard
          title="Duración promedio"
          value={`${Math.round(metricsData.engagement.averageSessionDuration / 60)}m`}
          icon={<Clock className="w-6 h-6 text-white" />}
          color="bg-orange-500"
        />
        
        <MetricCard
          title="Búsquedas"
          value={metricsData.ecommerce.searchQueries}
          icon={<Search className="w-6 h-6 text-white" />}
          color="bg-teal-500"
        />
      </div>

      {/* Métricas en tiempo real */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Métricas en Tiempo Real</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{realTimeMetrics.productViews}</p>
            <p className="text-sm text-gray-600">Vistas de productos</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{realTimeMetrics.cartAdditions}</p>
            <p className="text-sm text-gray-600">Agregados al carrito</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{realTimeMetrics.checkoutStarts}</p>
            <p className="text-sm text-gray-600">Checkouts iniciados</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">{realTimeMetrics.checkoutCompletions}</p>
            <p className="text-sm text-gray-600">Compras completadas</p>
          </div>
        </div>
      </motion.div>

      {/* Top productos y páginas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Productos más vistos</h3>
          <div className="space-y-3">
            {metricsData.engagement.topProducts.slice(0, 5).map((product, index) => (
              <div key={product.productId} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-yellow-100 text-yellow-800 rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <span className="text-sm text-gray-900 truncate">{product.productName}</span>
                </div>
                <span className="text-sm font-medium text-gray-600">{product.views} vistas</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Páginas más visitadas</h3>
          <div className="space-y-3">
            {metricsData.engagement.topPages.slice(0, 5).map((page, index) => (
              <div key={page.page} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <span className="text-sm text-gray-900 truncate">{page.page}</span>
                </div>
                <span className="text-sm font-medium text-gray-600">{page.views} vistas</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;









