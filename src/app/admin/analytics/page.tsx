/**
 * Página de Analytics Dashboard para administradores
 * Vista completa de métricas, conversiones y análisis de comportamiento
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import AnalyticsDashboard from '@/components/Analytics/AnalyticsDashboard';
import ConversionFunnel from '@/components/Analytics/ConversionFunnel';
import HeatmapViewer from '@/components/Analytics/HeatmapViewer';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useUserRole } from '@/hooks/useUserRole';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Eye, 
  Download,
  RefreshCw,
  Settings
} from 'lucide-react';

const AnalyticsPage: React.FC = () => {
  const { user, isLoaded } = useUser();
  const { userProfile, isAdmin, hasPermission, isLoading: roleLoading } = useUserRole();
  const { getEvents, getInteractions, getConversionMetrics } = useAnalytics();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'funnel' | 'heatmap'>('dashboard');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [conversionData, setConversionData] = useState({
    productViews: 0,
    cartAdditions: 0,
    checkoutStarts: 0,
    checkoutCompletions: 0,
  });

  // Verificar permisos de administrador usando el sistema de roles de Supabase
  useEffect(() => {
    if (isLoaded && !roleLoading) {
      if (!user) {
        redirect('/signin');
        return;
      }

      if (!isAdmin && !hasPermission(['dashboard', 'access'])) {
        redirect('/');
        return;
      }
    }
  }, [user, isLoaded, isAdmin, hasPermission, roleLoading]);

  useEffect(() => {
    loadConversionData();
  }, []);

  const loadConversionData = () => {
    const metrics = getConversionMetrics();
    setConversionData({
      productViews: metrics.productViews,
      cartAdditions: metrics.cartAdditions,
      checkoutStarts: metrics.checkoutStarts,
      checkoutCompletions: metrics.checkoutCompletions,
    });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Simular refresh de datos
      await new Promise(resolve => setTimeout(resolve, 1000));
      loadConversionData();
    } finally {
      setIsRefreshing(false);
    }
  };

  const exportData = () => {
    const events = getEvents();
    const interactions = getInteractions();
    const metrics = getConversionMetrics();

    const exportData = {
      events,
      interactions,
      metrics,
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pinteya-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Mostrar pantalla de carga mientras se verifican permisos
  if (!isLoaded || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-400 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {!isLoaded ? 'Cargando...' : 'Verificando permisos...'}
          </p>
        </div>
      </div>
    );
  }

  // Verificar si el usuario tiene permisos
  if (!isAdmin && !hasPermission(['dashboard', 'access'])) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg">
            <h3 className="font-bold text-lg mb-2">Acceso Denegado</h3>
            <p>No tienes permisos para acceder al dashboard de analytics.</p>
            <p className="text-sm mt-2">Contacta al administrador si necesitas acceso.</p>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: BarChart3,
      description: 'Vista general de métricas',
    },
    {
      id: 'funnel',
      name: 'Embudo de Conversión',
      icon: TrendingUp,
      description: 'Análisis de conversión',
    },
    {
      id: 'heatmap',
      name: 'Mapa de Calor',
      icon: Eye,
      description: 'Interacciones de usuarios',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-600">Panel de control de métricas de Pinteya E-commerce</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Actualizar
              </button>

              <button
                onClick={exportData}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Download className="w-4 h-4" />
                Exportar
              </button>

              <button className="flex items-center gap-2 px-4 py-2 bg-yellow-400 text-gray-900 rounded-lg hover:bg-yellow-500 transition-colors">
                <Settings className="w-4 h-4" />
                Configurar
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-8 border-b border-gray-200">
            {tabs.map((tab) => {
              const Icon = tab && tab.icon ? tab.icon : null;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-yellow-400 text-yellow-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {Icon && <Icon className="w-5 h-5" />}
                  <span className="hidden sm:inline">{tab.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'dashboard' && <AnalyticsDashboard />}
          
          {activeTab === 'funnel' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Análisis de Embudo de Conversión
                </h2>
                <p className="text-gray-600 mb-6">
                  Visualiza el flujo de usuarios desde la vista de producto hasta la compra completada.
                  Identifica puntos de abandono y oportunidades de optimización.
                </p>
              </div>
              
              <ConversionFunnel data={conversionData} />
              
              {/* Métricas adicionales del embudo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Puntos de Mejora</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <span className="text-red-800">Mayor abandono en checkout</span>
                      <span className="text-red-600 font-medium">-23%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <span className="text-yellow-800">Baja conversión producto → carrito</span>
                      <span className="text-yellow-600 font-medium">-15%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Fortalezas</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <span className="text-green-800">Alta retención en carrito</span>
                      <span className="text-green-600 font-medium">+18%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <span className="text-blue-800">Buena tasa de vista de productos</span>
                      <span className="text-blue-600 font-medium">+12%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'heatmap' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Mapa de Calor de Interacciones
                </h2>
                <p className="text-gray-600 mb-6">
                  Visualiza dónde los usuarios hacen click, hover y scroll en tus páginas.
                  Identifica patrones de comportamiento y optimiza la experiencia de usuario.
                </p>
              </div>
              
              <HeatmapViewer 
                interactions={getInteractions()} 
                page={typeof window !== 'undefined' ? window.location.pathname : '/'}
              />
              
              {/* Análisis de páginas */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Análisis por Página</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">1,234</p>
                    <p className="text-sm text-blue-800">Interacciones en Home</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">856</p>
                    <p className="text-sm text-green-800">Interacciones en Shop</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">432</p>
                    <p className="text-sm text-purple-800">Interacciones en Producto</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
